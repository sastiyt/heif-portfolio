(() => {
  const video = document.querySelector('.about-profile-video');
  if (!video) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let userPaused = motion.matches;
  function sync() {
    if (visible && !document.hidden && !userPaused) video.play().catch(() => {});
    else video.pause();
  }
  function toggle() { userPaused = !video.paused; sync(); }
  video.addEventListener('click', toggle);
  video.addEventListener('keydown', event => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); toggle(); }
  });
  ['play', 'pause'].forEach(name => video.addEventListener(name, () => {
    video.setAttribute('aria-label', 'Himalay Hirani animated portrait. ' + (video.paused ? 'Play video' : 'Pause video'));
  }));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(video);
  } else { visible = true; sync(); }
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => { userPaused = motion.matches; sync(); });
  video.setAttribute('aria-label', 'Himalay Hirani animated portrait. Play video');
})();
