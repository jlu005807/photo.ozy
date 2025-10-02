/**
 * 图片画廊放大功能
 * 点击图片可以放大并显示在屏幕中央，再次点击可折叠
 */

document.addEventListener('DOMContentLoaded', function() {
  // 创建放大查看的容器
  const lightbox = document.createElement('div');
  lightbox.classList.add('lightbox');
  
  const lightboxContent = document.createElement('div');
  lightboxContent.classList.add('lightbox-content');
  
  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('button-container');
  
  // 创建语义化按钮（可访问）
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.classList.add('close-button');
  closeButton.setAttribute('aria-label', '关闭');

  const downloadButton = document.createElement('button');
  downloadButton.type = 'button';
  downloadButton.classList.add('download-button');
  downloadButton.setAttribute('aria-label', '下载图片');
  
  const lightboxImg = document.createElement('img');
  lightboxImg.classList.add('lightbox-img');
  
  const lightboxText = document.createElement('p');
  lightboxText.classList.add('lightbox-text');
  
  // 组装lightbox元素
  buttonContainer.appendChild(closeButton);
  buttonContainer.appendChild(downloadButton);
  lightboxContent.appendChild(lightboxImg);
  lightboxContent.appendChild(lightboxText);
  
  // 创建一个内部包装器，CSS 将负责布局和定位（按钮在内容上方，右对齐）
  const inner = document.createElement('div');
  inner.classList.add('lightbox-inner');
  // 将按钮作为 lightbox-content 的直接子元素，以便 CSS 选择器能够精确对齐到内容可视边
  lightboxContent.insertBefore(buttonContainer, lightboxContent.firstChild);
  inner.appendChild(lightboxContent);
  lightbox.appendChild(inner);
  document.body.appendChild(lightbox);
  
  // 显示图片函数
  function displayImage(imgSrc, imgAlt, imgText) {
    // 设置文本内容
    lightboxText.textContent = imgText || '';
    
    // 设置图片及描述
    lightboxImg.src = imgSrc;
    lightboxImg.alt = imgAlt || '';
    
    // 设置 lightbox 背景为当前图片的模糊版本
    lightbox.style.backgroundImage = `url('${imgSrc}')`;
    
    // 显示lightbox
    lightbox.classList.add('active');
    
    // 在图片加载完成后执行放大动画
    lightboxImg.onload = function() {
      // 先重置为原始大小
      lightboxImg.style.transform = 'scale(1)';
      
      // 使用setTimeout确保动画效果可见
      setTimeout(function() {
        // 略微放大图片
        lightboxImg.style.transform = 'scale(1.02)';
      }, 10);
    };
  }
  // 使用事件委托处理图库中的点击（减少监听器）
  const gridContainer = document.querySelector('.grid-container');
  if (gridContainer) {
    gridContainer.addEventListener('click', function (e) {
      const item = e.target.closest('.grid-container div');
      if (!item) return;
      const img = item.querySelector('img');
      const text = item.querySelector('p');
      if (img && img.src) displayImage(img.src, img.alt, text ? text.textContent : '');
      e.stopPropagation();
    });
  }

  // 为视差画廊添加点击委托，使 .hp-gallery-img-wrapper 点击也能打开 lightbox
  const parallaxShell = document.querySelector('.hp-gallery-horizontal-scroll-wrapper');
  if (parallaxShell) {
    parallaxShell.addEventListener('click', function (e) {
      const wrapper = e.target.closest('.hp-gallery-img-wrapper');
      if (!wrapper) return;
      // 图片可能在 .hp-figure > a > img
      const img = wrapper.querySelector('img');
      const caption = wrapper.querySelector('.hp-caption');
      if (img && img.src) displayImage(img.src, img.alt, caption ? caption.textContent : '');
      e.stopPropagation();
    });
  }
  
  // 关闭lightbox函数
  function closeLightbox() {
    lightbox.classList.remove('active');
    // 清除背景图以释放内存
    setTimeout(function() {
      if (!lightbox.classList.contains('active')) {
        lightbox.style.backgroundImage = '';
      }
    }, 500); // 等待淡出动画完成后清除
  }
  
  // 点击lightbox背景关闭它
  lightbox.addEventListener('click', function() {
    closeLightbox();
  });
  
  // 点击按钮处理（保留行为，利用原生可访问性）
  closeButton.addEventListener('click', function(event) {
    closeLightbox();
    event.stopPropagation();
  });

  downloadButton.addEventListener('click', function(event) {
    downloadImage();
    event.stopPropagation();
  });
  
  // 下载图片函数
  function downloadImage() {
    const imageSrc = lightboxImg.src;
    if (imageSrc) {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = imageSrc.split('/').pop() || 'image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  
  // 原生 <button> 已支持键盘触发，无需额外 keydown 处理
  
  // 阻止点击 lightbox 内容（按钮/图片）时冒泡到背景
  lightboxContent.addEventListener('click', function (e) { e.stopPropagation(); });

  // 添加键盘Esc键关闭功能
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
});