// Handle hover and touch to add temporary glow class
(function(){
  'use strict';
  const DURATION = 1500; // ms, match CSS
  const wrappers = document.querySelectorAll('.gt-wrapper');
  if (!wrappers || wrappers.length === 0) return;

  wrappers.forEach(wrapper => {
    // Use mouseenter to avoid repeated triggers when moving across child nodes
    wrapper.addEventListener('mouseenter', (e) => {
      const target = e.target.closest('.gt-text');
      if (target) {
        target.classList.add('glow');
      }
    }, true);

    // Remove glow on mouseleave of the target element
    wrapper.addEventListener('mouseleave', (e) => {
      const target = e.target.closest('.gt-text');
      if (target) {
        // allow transition to fade out
        setTimeout(() => target.classList.remove('glow'), 260);
      }
    }, true);

    // also support touchstart for mobile (toggle glow briefly)
    wrapper.addEventListener('touchstart', (e) => {
      const target = e.target.closest('.gt-text');
      if (target) {
        target.classList.add('glow');
        setTimeout(() => target.classList.remove('glow'), DURATION + 100);
      }
    }, {passive: true});
  });
})();
