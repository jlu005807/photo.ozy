// 音乐播放器逻辑
document.addEventListener('DOMContentLoaded', function() {
  // 获取音乐播放器元素
  const musicPlayer = document.querySelector('.music-player');
  
  // 创建音频元素
  const audioElement = document.createElement('audio');
  audioElement.id = 'background-music';
  audioElement.loop = true; // 设置循环播放
  
  // 添加到页面但保持隐藏
  audioElement.style.display = 'none';
  document.body.appendChild(audioElement);
  
  // 设置音乐文件路径
  const musicFile = 'music/Aurenth - green to blue (Sped Up)(1).mp3';
  
  // 设置音乐
  audioElement.src = musicFile;
  audioElement.load();
  
  // 设置默认音量（较低的初始音量，避免声音过大）
  audioElement.volume = 0.4; // 设置为40%的音量
  
  // 记录音乐状态
  let isPlaying = false;
  let fadeInterval = null; // 用于控制淡入淡出效果的计时器
  const fadeTime = 800; // 淡入淡出的时间（毫秒）
  const fadeSteps = 20; // 淡入淡出的步骤数
  const maxVolume = 0.4; // 最大音量
  
  // 音量淡入效果
  function fadeIn() {
    // 确保没有正在进行的淡入淡出
    if (fadeInterval) clearInterval(fadeInterval);
    
    // 初始化音量为0
    audioElement.volume = 0;
    
    // 开始播放
    audioElement.play()
      .then(() => {
        // 播放成功，设置淡入
        const volumeStep = maxVolume / fadeSteps;
        let currentStep = 0;
        
        fadeInterval = setInterval(() => {
          currentStep++;
          const newVolume = Math.min(volumeStep * currentStep, maxVolume);
          audioElement.volume = newVolume;
          
          // 淡入完成后清除计时器
          if (currentStep >= fadeSteps) {
            clearInterval(fadeInterval);
            fadeInterval = null;
          }
        }, fadeTime / fadeSteps);
        
        isPlaying = true;
        musicPlayer.classList.add('playing');
        
        // 如果提示正在显示，更新其内容
        updateHoverHint();
      })
      .catch(error => {
        console.log('播放失败，可能由于浏览器策略限制：', error);
        showPlayHint();
      });
  }
  
  // 音量淡出效果
  function fadeOut() {
    // 确保没有正在进行的淡入淡出
    if (fadeInterval) clearInterval(fadeInterval);
    
    // 记录当前音量
    const startVolume = audioElement.volume;
    const volumeStep = startVolume / fadeSteps;
    let currentStep = 0;
    
    fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(startVolume - (volumeStep * currentStep), 0);
      audioElement.volume = newVolume;
      
      // 淡出完成后暂停播放并清除计时器
      if (currentStep >= fadeSteps) {
        audioElement.pause();
        clearInterval(fadeInterval);
        fadeInterval = null;
      }
    }, fadeTime / fadeSteps);
    
    isPlaying = false;
    musicPlayer.classList.remove('playing');
    
    // 如果提示正在显示，更新其内容
    updateHoverHint();
  }
  
  // 更新悬停提示内容和位置
  function updateHoverHint() {
    if (hoverHint) {
      // 更新文本内容
      hoverHint.textContent = isPlaying ? '点击暂停音乐' : '点击播放音乐';
      
      // 更新位置
      const rect = musicPlayer.getBoundingClientRect();
      hoverHint.style.top = `${rect.bottom + 5}px`;
      hoverHint.style.left = `${rect.left + rect.width/2}px`;
    }
  }
  
  // 添加窗口大小变化监听，以更新提示位置
  window.addEventListener('resize', updateHoverHint);
  
  // 播放/暂停切换
  function togglePlay() {
    if (audioElement.paused) {
      fadeIn();
    } else {
      fadeOut();
    }
  }
  
  // 点击播放器图标时切换播放状态
  musicPlayer.addEventListener('click', function() {
    togglePlay();
  });
  
  // 悬停提示元素
  let hoverHint = null;
  let hintTimeout = null;
  
  // 创建并显示提示的函数
  function showHoverHint() {
    // 如果已经有提示显示，则不再创建新提示
    if (hoverHint) return;
    
    // 创建悬停提示
    hoverHint = document.createElement('div');
    hoverHint.className = 'hover-hint';
    
    // 根据播放状态显示不同的提示文本
    const hintText = isPlaying ? '点击暂停音乐' : '点击播放音乐';
    hoverHint.textContent = hintText;
    
    // 获取位置信息
    const rect = musicPlayer.getBoundingClientRect();
    
    // 设置提示样式
    hoverHint.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 5}px;
      left: ${rect.left + rect.width/2}px;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      z-index: 1102;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    `;
    document.body.appendChild(hoverHint);
    
    // 使提示淡入显示
    setTimeout(() => {
      if (hoverHint) hoverHint.style.opacity = '1';
    }, 100);
  }
  
  // 隐藏提示的函数
  function hideHoverHint() {
    if (hoverHint) {
      hoverHint.style.opacity = '0';
      setTimeout(() => {
        if (hoverHint && document.body.contains(hoverHint)) {
          document.body.removeChild(hoverHint);
          hoverHint = null;
        }
      }, 300);
    }
    
    // 清除任何活动的超时
    if (hintTimeout) {
      clearTimeout(hintTimeout);
      hintTimeout = null;
    }
  }
  
  // 鼠标悬停显示提示
  musicPlayer.addEventListener('mouseenter', showHoverHint);
  
  // 触摸开始时短暂显示提示
  musicPlayer.addEventListener('touchstart', function(e) {
    e.preventDefault(); // 阻止触摸事件的默认行为
    
    // 显示提示
    showHoverHint();
    
    // 设置一个定时器，在1.5秒后自动隐藏提示
    hintTimeout = setTimeout(hideHoverHint, 1500);
  });
  
  // 当鼠标离开音乐图标时隐藏提示
  musicPlayer.addEventListener('mouseleave', hideHoverHint);
  
  // 显示播放提示
  function showPlayHint() {
    const hint = document.createElement('div');
    hint.className = 'play-hint';
    hint.textContent = '点击图标播放音乐';
    hint.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      z-index: 1101;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(hint);
    
    setTimeout(() => hint.style.opacity = '1', 100);
    setTimeout(() => {
      hint.style.opacity = '0';
      setTimeout(() => document.body.removeChild(hint), 500);
    }, 3000);
  }
  
  // 尝试自动播放（大多数现代浏览器不允许未经用户交互的自动播放）
  function tryAutoPlay() {
    fadeIn(); // 使用淡入效果播放
    // 播放失败会在fadeIn内部的catch中处理
  }
  
  // 监听用户交互事件以启用音频（现代浏览器政策要求）
  function setupUserInteractionListeners() {
    const userInteractionHandler = function() {
      if (audioElement.paused && !isPlaying) {
        tryAutoPlay();
      }
      
      // 一旦用户交互了，我们就不再需要这些监听器
      document.removeEventListener('click', userInteractionHandler);
      document.removeEventListener('touchstart', userInteractionHandler);
      document.removeEventListener('keydown', userInteractionHandler);
    };
    
    document.addEventListener('click', userInteractionHandler, { once: true });
    document.addEventListener('touchstart', userInteractionHandler, { once: true });
    document.addEventListener('keydown', userInteractionHandler, { once: true });
  }
  
  // 初始尝试自动播放
  tryAutoPlay();
  
  // 设置交互监听器作为备选方案
  setupUserInteractionListeners();
});
