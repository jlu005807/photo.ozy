(function(){
  // Map horizontal touch/drag to vertical scroll on the rotated gallery wrapper
  const wrapper = document.querySelector('.hp-gallery-horizontal-scroll-wrapper');
  if (!wrapper) return;

  // Touch handling
  let startX = 0, startY = 0, startScroll = 0, isTouching = false;
  wrapper.addEventListener('touchstart', function(e){
    if (e.touches.length !== 1) return;
    isTouching = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startScroll = wrapper.scrollTop;
  }, {passive: true});

  wrapper.addEventListener('touchmove', function(e){
    if (!isTouching) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    // Prefer horizontal movement; map it to vertical scroll because the wrapper is rotated
    const movement = Math.abs(dx) > Math.abs(dy) ? -dx : dy;
    wrapper.scrollTop = startScroll + movement;
    // Prevent default so the page doesn't also scroll
    e.preventDefault();
  }, {passive: false});

  wrapper.addEventListener('touchend', function(){ isTouching = false; }, {passive: true});

  // Mouse drag (optional convenience for desktop)
  let isDragging = false, dragStartX = 0, dragStartScroll = 0;
  wrapper.addEventListener('mousedown', function(e){
    isDragging = true;
    dragStartX = e.clientX;
    dragStartScroll = wrapper.scrollTop;
    wrapper.classList.add('hp-gallery-dragging');
    e.preventDefault();
  });

  window.addEventListener('mousemove', function(e){
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    wrapper.scrollTop = dragStartScroll - dx;
    e.preventDefault();
  });

  window.addEventListener('mouseup', function(){
    if (isDragging) {
      isDragging = false;
      wrapper.classList.remove('hp-gallery-dragging');
    }
  });

})();
