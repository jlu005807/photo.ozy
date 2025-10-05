// 画廊切换功能
document.addEventListener('DOMContentLoaded', function() {
  // 获取所有切换按钮输入和标签
  const galleryRadios = document.querySelectorAll('.tabber input[type="radio"]');
  const galleryLabels = document.querySelectorAll('.tabber label');
  // 获取所有画廊容器
  const galleryContainers = document.querySelectorAll('.gallery-container');

  // Ensure tabber is visibly offset on narrower screens to avoid overlap with top title.
  function adjustTabberPosition() {
    const tabber = document.querySelector('.tabber');
    if (!tabber) return;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (vw <= 960) {
      // compute a responsive top value within reasonable min/max (match CSS clamp)
      const min = 64; // px
      const max = 140; // px
      const preferred = Math.round(vh * 0.08);
      const topPx = Math.min(Math.max(preferred, min), max);
      // apply as inline style with important priority to ensure it overrides CSS
      tabber.style.setProperty('top', topPx + 'px', 'important');
    } else if (vw <= 1480) {
      // for medium screens use a slightly smaller offset
      const min = 64;
      const max = 120;
      const preferred = Math.round(vh * 0.08);
      const topPx = Math.min(Math.max(preferred, min), max);
      tabber.style.setProperty('top', topPx + 'px', 'important');
    } else {
      // restore default by removing inline top property
      tabber.style.removeProperty('top');
    }
  }

  // initial adjust and on resize/orientation change
  adjustTabberPosition();
  window.addEventListener('resize', adjustTabberPosition);
  window.addEventListener('orientationchange', adjustTabberPosition);

  const DEAL_CONFIG = {
    grid: {
      stackMode: 'page-left-center',
      scaleStart: 0.65,
      duration: 820,
      opacityDuration: 420,
      stagger: 88
    },
    parallax: {
      stackMode: 'page-left-center',
      scaleStart: 0.55,
      duration: 860,
      opacityDuration: 460,
      stagger: 96
    }
  };

  const COLLECT_CONFIG = {
    grid: {
      stackMode: 'page-left-center',
      scaleEnd: 0.6,
      duration: 820,
      opacityDuration: 420,
      stagger: 92,
      hold: 160
    },
    parallax: {
      stackMode: 'page-left-center',
      scaleEnd: 0.55,
      duration: 880,
      opacityDuration: 460,
      stagger: 100,
      hold: 180
    }
  };

  const MOBILE_DEAL_OVERRIDES = {
    grid: {
      duration: 520,
      opacityDuration: 320,
      stagger: 56,
      scaleStart: 0.72
    },
    parallax: {
      duration: 560,
      opacityDuration: 340,
      stagger: 60,
      scaleStart: 0.68
    }
  };

  const MOBILE_COLLECT_OVERRIDES = {
    grid: {
      duration: 520,
      opacityDuration: 280,
      stagger: 56,
      hold: 120,
      fadeDelay: 60
    },
    parallax: {
      duration: 560,
      opacityDuration: 320,
      stagger: 60,
      hold: 140,
      fadeDelay: 70
    }
  };

  const mediaQueries = window.matchMedia
    ? {
        coarse: window.matchMedia('(pointer: coarse)'),
        noHover: window.matchMedia('(hover: none)'),
        small: window.matchMedia('(max-width: 768px)'),
        reduced: window.matchMedia('(prefers-reduced-motion: reduce)')
      }
    : {};

  function shouldSimplifyMotion() {
    if (!window.matchMedia) {
      return false;
    }
    if (mediaQueries.reduced && mediaQueries.reduced.matches) {
      return true;
    }
    const smallTouch = (mediaQueries.small && mediaQueries.small.matches) && (mediaQueries.noHover && mediaQueries.noHover.matches);
    if (smallTouch) {
      return true;
    }
    if (mediaQueries.coarse && mediaQueries.coarse.matches) {
      return true;
    }
    return false;
  }

  function getDealConfig(type, extraOverrides = {}) {
    const baseConfig = DEAL_CONFIG[type] || DEAL_CONFIG.grid || {};
    const config = Object.assign({}, baseConfig);
    if (shouldSimplifyMotion()) {
      Object.assign(config, MOBILE_DEAL_OVERRIDES[type] || {});
    }
    return Object.assign(config, extraOverrides);
  }

  function getCollectConfig(type, extraOverrides = {}) {
    const baseConfig = COLLECT_CONFIG[type] || COLLECT_CONFIG.grid || {};
    const config = Object.assign({}, baseConfig);
    if (shouldSimplifyMotion()) {
      Object.assign(config, MOBILE_COLLECT_OVERRIDES[type] || {});
    }
    return Object.assign(config, extraOverrides);
  }

  let isSwitching = false;
  let pendingGallery = null;
  // animationLocks 用于在任意动画进行时禁用切换控件
  let animationLocks = 0;
  function updateGalleryControls() {
    const disabled = animationLocks > 0;
    galleryRadios.forEach(r => { r.disabled = disabled; });
    // 可选：给 tabber 添加样式类用于视觉提示
    const tabber = document.querySelector('.tabber');
    if (tabber) {
      tabber.classList.toggle('controls-disabled', disabled);
    }
  }
  function lockControls() {
    animationLocks += 1;
    updateGalleryControls();
  }
  function unlockControls() {
    animationLocks -= 1;
    if (animationLocks < 0) animationLocks = 0;
    updateGalleryControls();
  }
  const stackPreviewRoot = createStackPreviewRoot();
  let stackPreviewHideTimer = null;

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function createStackPreviewRoot() {
    let existing = document.querySelector('.gallery-real-stack');
    if (!existing) {
      existing = document.createElement('div');
      existing.className = 'gallery-real-stack';
      document.body.appendChild(existing);
    }
    return existing;
  }

  // 堆叠预览已取消：保留占位函数以避免其他调用报错
  function populateStackPreview(type) {
    if (!stackPreviewRoot) return;
    // 隐藏预览根节点
    stackPreviewRoot.classList.remove('visible');
    stackPreviewRoot.innerHTML = '';
  }

  // 取消堆叠选择逻辑：返回空数组以避免 clone/预览生成
  function getCanonicalStackImages() {
    return [];
  }

  function showStackPreview(type) {
    if (stackPreviewHideTimer) {
      clearTimeout(stackPreviewHideTimer);
      stackPreviewHideTimer = null;
    }
    populateStackPreview(type);
  }

  function hideStackPreview(delay = 0) {
    if (stackPreviewHideTimer) {
      clearTimeout(stackPreviewHideTimer);
    }

    stackPreviewHideTimer = setTimeout(() => {
      if (stackPreviewRoot) {
        stackPreviewRoot.classList.remove('visible');
        stackPreviewRoot.innerHTML = '';
      }
      stackPreviewHideTimer = null;
    }, delay);
  }

  // 卡片分发动画工具
  function getStackPoint(rect, mode = 'center') {
    switch (mode) {
      case 'viewport-center': {
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        return {
          x: viewportWidth / 2,
          y: viewportHeight * 0.48
        };
      }
      case 'page-left-center': {
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const x = Math.max(viewportWidth * 0.12, 80); // 统一到视口左侧 12%，保留最小偏移
        const y = viewportHeight * 0.5;
        return { x, y };
      }
      case 'top-center':
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height * 0.1
        };
      case 'center-left':
        return {
          x: rect.left + rect.width * 0.25,
          y: rect.top + rect.height / 2
        };
      case 'center':
      default:
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
    }
  }

  // Helper: strip translation components from a transform string (matrix/matrix3d)
  // 放在文件顶层以便复用，保证在收拢时不受已有 translate 的影响
  function stripTranslate(transformStr) {
    if (!transformStr || transformStr === 'none') return '';
    // matrix(a, b, c, d, tx, ty)
    const m = transformStr.match(/^matrix\(([^)]+)\)$/);
    if (m) {
      const parts = m[1].split(',').map(s => s.trim());
      if (parts.length === 6) {
        return `matrix(${parts[0]}, ${parts[1]}, ${parts[2]}, ${parts[3]}, 0, 0)`;
      }
    }
    // matrix3d(...) - zero out last three translation components (indices 12,13,14)
    const m3 = transformStr.match(/^matrix3d\(([^)]+)\)$/);
    if (m3) {
      const parts = m3[1].split(',').map(s => s.trim());
      if (parts.length === 16) {
        parts[12] = '0';
        parts[13] = '0';
        parts[14] = '0';
        return `matrix3d(${parts.join(', ')})`;
      }
    }
    // 如果无法解析，返回原始字符串以尽量保留变换（保守策略）
    return transformStr;
  }

  function playDealAnimation(container, elements, options = {}) {
    if (!container || !elements || elements.length === 0) return;

    // 禁用切换控件，防止在动画期间切换视图
    lockControls();

    const { stackMode = 'center', scaleStart = 0.5, duration = 700, opacityDuration = 450, stagger = 80 } = options;

    if (container.dataset.dealing === 'true') {
      return; // 避免重复触发导致状态错乱
    }

    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    // 默认 origin 来自配置的 stackMode
    let origin = getStackPoint(containerRect, stackMode);
    // 如果调用时强制使用视口左中（用于从网格切换到视差时保证起点一致），覆盖 origin
    if (options && options.forceLeftOrigin) {
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const leftX = Math.max(viewportWidth * 0.12, 80);
      const leftY = viewportHeight * 0.5;
      origin = { x: leftX, y: leftY };
    }
    const cardRects = elements.map(el => el.getBoundingClientRect());

    container.dataset.dealing = 'true';

    const cleanupTimers = [];

    // Helper: strip translation components from a transform string (matrix/matrix3d)
    function stripTranslate(transformStr) {
      if (!transformStr || transformStr === 'none') return '';
      // matrix(a, b, c, d, tx, ty)
      const m = transformStr.match(/^matrix\(([^)]+)\)$/);
      if (m) {
        const parts = m[1].split(',').map(s => s.trim());
        if (parts.length === 6) {
          return `matrix(${parts[0]}, ${parts[1]}, ${parts[2]}, ${parts[3]}, 0, 0)`;
        }
      }
      // matrix3d(...) - zero out last three translation components (indices 12,13,14)
      const m3 = transformStr.match(/^matrix3d\(([^)]+)\)$/);
      if (m3) {
        const parts = m3[1].split(',').map(s => s.trim());
        if (parts.length === 16) {
          parts[12] = '0';
          parts[13] = '0';
          parts[14] = '0';
          return `matrix3d(${parts.join(', ')})`;
        }
      }
      // If unknown format, return original (best-effort)
      return transformStr;
    }

    elements.forEach((el, index) => {
      const rect = cardRects[index];
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = origin.x - centerX;
      const dy = origin.y - centerY;
      // 保存原始完整 transform（用于动画结束时恢复）
      const origComputed = window.getComputedStyle(el).transform;
      const origTransform = (origComputed && origComputed !== 'none') ? origComputed : '';
      // 仅保留非平移部分作为起始基准（例如旋转/缩放），避免已有 translate 导致起点偏移
      const baseNoTranslate = stripTranslate(origTransform);
      el.dataset._origTransform = origTransform;
      el.style.transition = 'none';
      el.style.transform = `${baseNoTranslate} translate(${dx}px, ${dy}px) scale(${scaleStart})`;
      el.style.opacity = '0';
      el.style.willChange = 'transform, opacity';
    });

    const totalDuration = duration + stagger * elements.length + 120;
    let remaining = elements.length;

    const finishFlag = () => {
      cleanupTimers.forEach(timer => clearTimeout(timer));
      container.dataset.dealing = 'false';
      // 恢复控件
      unlockControls();
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elements.forEach((el, index) => {
          const delay = index * stagger;
          el.style.transition = `transform ${duration}ms cubic-bezier(.22,.8,.33,1), opacity ${opacityDuration}ms ease-out`;
          el.style.transitionDelay = `${delay}ms`;

          const timer = setTimeout(() => {
            // 动画目标：恢复元素的完整原始 transform（包含平移/旋转）
            const orig = el.dataset._origTransform || '';
            if (orig) {
              el.style.transform = orig;
            } else {
              el.style.transform = 'translate(0px, 0px) scale(1)';
            }
            el.style.opacity = '1';
          }, 0);
          cleanupTimers.push(timer);

          const handleTransitionEnd = (event) => {
            if (event.propertyName !== 'transform') return;
            el.style.transition = '';
            el.style.transform = '';
            el.style.opacity = '';
            el.style.transitionDelay = '';
            el.style.willChange = '';
            el.removeEventListener('transitionend', handleTransitionEnd);
            remaining -= 1;
            if (remaining === 0) {
              finishFlag();
            }
          };

          el.addEventListener('transitionend', handleTransitionEnd);
        });
      });
    });

    // 兜底清理，防止 transitionend 未触发
    const guardTimer = setTimeout(() => {
      if (container.dataset.dealing === 'true') {
        elements.forEach(el => {
          el.style.transition = '';
          el.style.transform = '';
          el.style.opacity = '';
          el.style.transitionDelay = '';
          el.style.willChange = '';
        });
        finishFlag();
      }
    }, totalDuration + 200);
    cleanupTimers.push(guardTimer);
  }

  function playCollectAnimation(container, elements, options = {}) {
    return new Promise(resolve => {
      if (!container || !elements || elements.length === 0) {
        resolve();
        return;
      }

      // 禁用切换控件，防止在收拢动画期间切换视图
      lockControls();

      // 拆分为移动与淡出两阶段：moveDuration 控制移动，fadeDuration 控制淡出
      const { stackMode = 'center', scaleEnd = 0.55, duration = 700, opacityDuration = 450, stagger = 90, moveDuration = duration, fadeDuration = opacityDuration, fadeDelay = 80 } = options;

      if (container.dataset.collecting === 'true') {
        resolve();
        return;
      }

      if (container.dataset.dealing === 'true') {
        container.dataset.dealing = 'false';
      }

      const containerRect = container.getBoundingClientRect();
      if (containerRect.width === 0 || containerRect.height === 0) {
        resolve();
        return;
      }

      let origin = getStackPoint(containerRect, stackMode);
      // 如果传入 forceLeftOrigin，则强制使用视口左中作为 origin（和发牌逻辑一致）
      if (options && options.forceLeftOrigin) {
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const leftX = Math.max(viewportWidth * 0.12, 80);
        const leftY = viewportHeight * 0.5;
        origin = { x: leftX, y: leftY };
      }
      const cardRects = elements.map(el => el.getBoundingClientRect());

      container.dataset.collecting = 'true';

      const cleanupTimers = [];
      let remaining = elements.length;

      const finish = () => {
        cleanupTimers.forEach(timer => clearTimeout(timer));
        elements.forEach(el => {
          el.style.transition = '';
          el.style.transitionDelay = '';
          el.style.willChange = '';
        });
        container.dataset.collecting = 'false';
        // 恢复控件
        unlockControls();
        resolve();
      };

      if (remaining === 0) {
        finish();
        return;
      }

      elements.forEach(el => {
        el.style.transition = '';
        el.style.transitionDelay = '';
        // 确保在开始时为完全可见
        el.style.opacity = el.style.opacity || '1';
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          elements.forEach((el, index) => {
            const rect = cardRects[index];
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = origin.x - centerX;
            const dy = origin.y - centerY;
            const delay = index * stagger;

            el.style.transition = '';
            el.style.transitionDelay = '';

            const moveTimer = setTimeout(() => {
              el.style.willChange = 'transform, opacity';
              // 先只做移动（带缩放），不改变 opacity
              el.style.transition = `transform ${moveDuration}ms cubic-bezier(.33, 0, .2, 1)`;
              el.style.transitionDelay = '0ms';
              const computed = window.getComputedStyle(el).transform;
              // 使用 stripTranslate 去掉已有的 translate 部分，但保留旋转/缩放
              const baseNoTranslate = (computed && computed !== 'none') ? stripTranslate(computed) + ' ' : '';
              el.dataset._collectBaseTransform = baseNoTranslate;
              el.dataset._collectTarget = `translate(${dx}px, ${dy}px) scale(${scaleEnd})`;
              // 启动移动（基于剥离 translate 后的基线）
              el.style.transform = `${baseNoTranslate}translate(${dx}px, ${dy}px) scale(${scaleEnd})`;
              // 当移动完成后再触发淡出
              const onMoveEnd = (ev) => {
                if (ev.propertyName !== 'transform') return;
                el.removeEventListener('transitionend', onMoveEnd);

                // short timeout to ensure layout settled, 然后开始淡出
                const fadeStarter = setTimeout(() => {
                  // 设置淡出过渡，只影响 opacity（也可以再微微缩放以增强效果）
                  el.style.transition = `opacity ${fadeDuration}ms ease-out`;
                  // 开始淡出
                  el.style.opacity = '0';

                  const onFadeEnd = (fe) => {
                    if (fe.propertyName !== 'opacity') return;
                    el.removeEventListener('transitionend', onFadeEnd);
                    // 完成一个元素的退场
                    remaining -= 1;
                    if (remaining === 0) {
                      finish();
                    }
                  };

                  el.addEventListener('transitionend', onFadeEnd);
                }, fadeDelay);

                cleanupTimers.push(fadeStarter);
              };

              el.addEventListener('transitionend', onMoveEnd);
            }, delay + 16);

            cleanupTimers.push(moveTimer);
          });
        });
      });

      // 兜底清理，防止 transitionend 未触发
      const guardTimer = setTimeout(() => {
        if (container.dataset.collecting === 'true') {
          finish();
        }
      }, moveDuration + fadeDuration + stagger * elements.length + 400);

      cleanupTimers.push(guardTimer);
    });
  }

  function getGalleryElements(type) {
    if (type === 'grid') {
      const gridContainer = document.querySelector('#grid-gallery .grid-container');
      return gridContainer ? Array.from(gridContainer.querySelectorAll('.image-wrapper')) : [];
    }

    if (type === 'parallax') {
      const parallaxShell = document.querySelector('#parallax-gallery .hp-gallery-horizontal-scroll-wrapper');
      // 选择外层 wrapper（hp-gallery-img-wrapper），这样变换会更平滑
      return parallaxShell ? Array.from(parallaxShell.querySelectorAll('.hp-gallery-img-wrapper')) : [];
    }

    return [];
  }

  function getGalleryContainer(type) {
    if (type === 'grid') {
      return document.querySelector('#grid-gallery .grid-container');
    }

    if (type === 'parallax') {
      return document.querySelector('#parallax-gallery .hp-gallery');
    }

    return null;
  }

  function triggerDealAnimation(type, options = {}) {
    const container = getGalleryContainer(type);
    if (!container) return;

    const cards = getGalleryElements(type);
    if (!cards || cards.length === 0) return;

  const config = getDealConfig(type);
  // Merge provided options (e.g. forceLeftOrigin) into the config passed to playDealAnimation
  const merged = Object.assign({}, config, options);
    // Use existing playDealAnimation which expects elements to already have their
    // initial transform positioned at the origin (no-transition). If prepareDealStart
    // was called right after activating the target container, elements will already
    // be sitting at the left-middle origin and this call will animate them into place.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        playDealAnimation(container, cards, merged);
      });
    });
  }

  // Synchronously position wrappers at the left-middle origin (no transition)
  // so they appear to load from the stack location. Call this immediately after
  // adding the target container's 'active' class, before next paint.
  function prepareDealStart(type) {
    // prepareDealStart 已禁用（堆叠行为取消）
    return;
  }
  
  // 控制滚动行为的函数
  function toggleScrollBehavior(galleryType) {
    if (galleryType === 'parallax') {
      // 当切换到视差画廊时，禁止页面滚动
      document.body.classList.add('parallax-active');
    } else {
      // 当切换回网格画廊时，恢复页面滚动
      document.body.classList.remove('parallax-active');
    }
  }
  
  async function handleGalleryChange(targetGallery) {
    if (!targetGallery) return;

    const targetContainer = document.getElementById(`${targetGallery}-gallery`);
    if (!targetContainer) return;

    if (isSwitching) {
      pendingGallery = targetGallery;
      return;
    }

    isSwitching = true;
    pendingGallery = null;

    try {
      toggleScrollBehavior(targetGallery);

      const activeContainer = document.querySelector('.gallery-container.active');
      const activeType = activeContainer ? activeContainer.id.replace('-gallery', '') : null;

      if (activeContainer && activeContainer === targetContainer) {
        return;
      }

      if (activeContainer && activeType) {
        showStackPreview(activeType);
        const activeElements = getGalleryElements(activeType);
  const collectOptions = getCollectConfig(activeType);
        // 如果当前活跃视图是视差，要强制把卡片收拢到页面左侧中间
        if (activeType === 'parallax') {
          collectOptions.forceLeftOrigin = true;
        }
        // 使用按类型获取的 container（例如视差使用 .hp-gallery）以获取正确的 bounding rect
        const realContainer = getGalleryContainer(activeType) || activeContainer;
        await playCollectAnimation(realContainer, activeElements, collectOptions);
        if (collectOptions.hold) {
          await wait(collectOptions.hold);
        }
        activeContainer.classList.add('fade-out');
        await wait(420);
        activeContainer.classList.remove('active', 'fade-out');
      } else {
        galleryContainers.forEach(container => container.classList.remove('active', 'fade-out', 'fade-in'));
        hideStackPreview(0);
      }

      targetContainer.classList.add('active', 'fade-in');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // If switching from grid -> parallax, force the deal origin to left-middle
          // so the parallax view's distribution starts from the same place as grid.
          if (activeType === 'grid' && targetGallery === 'parallax') {
            triggerDealAnimation(targetGallery, { forceLeftOrigin: true });
          } else {
            triggerDealAnimation(targetGallery);
          }
        });
      });

  const dealConfig = getDealConfig(targetGallery);
      const cardCount = Math.min(6, getGalleryElements(targetGallery).length || 1);
      const previewDelay = Math.max(520, (dealConfig.duration || 800) + (dealConfig.stagger || 90) * cardCount * 0.55);
      hideStackPreview(previewDelay);

      await wait(500);
      targetContainer.classList.remove('fade-in');
    } finally {
      isSwitching = false;
      if (pendingGallery && pendingGallery !== targetGallery) {
        const nextGallery = pendingGallery;
        pendingGallery = null;
        handleGalleryChange(nextGallery);
      } else {
        pendingGallery = null;
      }
    }
  }

  // 为每个单选按钮添加变更事件
  galleryRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (!this.checked) return;
      const targetGallery = this.getAttribute('data-gallery');
      handleGalleryChange(targetGallery);
    });
  });
  
  // 为标签添加点击效果（已在CSS中处理动画）
  galleryLabels.forEach(label => {
    label.addEventListener('click', function() {
      // 点击效果由CSS处理
    });
  });

  // 页面加载后触发默认画廊的卡片分发效果
  requestAnimationFrame(() => {
    const initialGallery = document.querySelector('.tabber input[type="radio"]:checked');
    if (initialGallery) {
      setTimeout(() => {
          const type = initialGallery.dataset.gallery;
      // 显示堆叠预览并触发发牌动画（堆叠预览视觉已隐藏）
      showStackPreview(type);
      // 如果初始为 parallax，让其从页面左侧中间发牌以与网格保持一致
      if (type === 'parallax') {
        triggerDealAnimation(type, { forceLeftOrigin: true });
      } else {
        triggerDealAnimation(type);
      }

  const dealConfig = getDealConfig(type);
          const cardCount = Math.min(6, getGalleryElements(type).length || 1);
          const previewDelay = Math.max(520, (dealConfig.duration || 800) + (dealConfig.stagger || 90) * cardCount * 0.55);
          hideStackPreview(previewDelay);
        }, 380);
    }
  });
});