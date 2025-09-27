// 画廊切换功能
document.addEventListener('DOMContentLoaded', function() {
  // 获取所有切换按钮输入和标签
  const galleryRadios = document.querySelectorAll('.tabber input[type="radio"]');
  const galleryLabels = document.querySelectorAll('.tabber label');
  // 获取所有画廊容器
  const galleryContainers = document.querySelectorAll('.gallery-container');
  
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
  
  // 为每个单选按钮添加变更事件
  galleryRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (!this.checked) return;
      
      // 获取目标画廊ID
      const targetGallery = this.getAttribute('data-gallery');
      const targetContainer = document.getElementById(`${targetGallery}-gallery`);
      
      // 控制滚动行为
      toggleScrollBehavior(targetGallery);
      
      // 添加淡出动画类
      galleryContainers.forEach(container => {
        if (container.classList.contains('active')) {
          // 先添加淡出类
          container.classList.add('fade-out');
          
          // 等待淡出动画完成后隐藏并显示新画廊
          setTimeout(() => {
            container.classList.remove('active', 'fade-out');
            
            // 显示目标画廊并添加淡入动画
            targetContainer.classList.add('active', 'fade-in');
            
            // 动画完成后移除动画类
            setTimeout(() => {
              targetContainer.classList.remove('fade-in');
            }, 500);
          }, 300);
        }
      });
      
      // 如果没有活跃的画廊，直接显示目标画廊
      if (!document.querySelector('.gallery-container.active')) {
        targetContainer.classList.add('active', 'fade-in');
        
        setTimeout(() => {
          targetContainer.classList.remove('fade-in');
        }, 500);
      }
    });
  });
  
  // 为标签添加点击效果（已在CSS中处理动画）
  galleryLabels.forEach(label => {
    label.addEventListener('click', function() {
      // 点击效果由CSS处理
    });
  });
});