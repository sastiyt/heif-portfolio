(() => {
 'use strict';
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 const setup = () => {
  document.querySelectorAll('main .image-item, main .thumbnail, main .about-portrait').forEach(el => {
   if (!el.querySelector('img') || el.querySelector('video, iframe')) return;
   el.classList.add('artwork-motion');
   if (el.querySelector('.compare')) el.classList.add('artwork-compare');
  });
  const elements = [...document.querySelectorAll('.reveal, .skill-item, .contact-item, .video-item, .image-item, .thumbnail, .about-portrait, .portfolio-intro > *, main .page-title:not(.portfolio-intro), .image-showcase > h2')];
  // Visible is the permanent state. An observer or animation failure cannot hide work.
  elements.forEach(el => { el.classList.add('reveal','visible'); el.classList.remove('reveal-pending'); });
  const images = [...document.querySelectorAll('main .image-item img, main .thumbnail img, main .about-portrait img')];
  if (!('IntersectionObserver' in window)) { images.forEach(img => { img.loading='eager'; }); return; }
  const loading = new IntersectionObserver(entries => entries.forEach(entry => {
   if (entry.isIntersecting) { entry.target.loading='eager'; loading.unobserve(entry.target); }
  }), {rootMargin:'280px 0px'});
  images.forEach(img => loading.observe(img));
  if (motion.matches || !Element.prototype.animate) return;
  const active = new Map();
  const pending = new Set();
  let frame = 0;
  const finish = el => {
   pending.delete(el);
   observer.unobserve(el);
   el.classList.remove('scroll-reveal-ready');
   active.get(el)?.cancel();
   active.delete(el);
  };
  const reveal = (el, delay = 0) => {
   if (!pending.has(el) || document.hidden) return;
   const rect = el.getBoundingClientRect();
   if (motion.matches || rect.bottom <= 0) { finish(el); return; }
   pending.delete(el);
   observer.unobserve(el);
   try {
    // Start immediately: awaiting image decode here caused visible cards to flash off.
    const animation = el.animate([
     {opacity:0, transform:'translateY(24px)'},
     {opacity:1, transform:'translateY(0)'}
    ], {duration:760, delay, easing:'cubic-bezier(.22,.61,.36,1)', fill:'both'});
    active.set(el, animation);
    el.classList.remove('scroll-reveal-ready');
    animation.finished.catch(() => {}).finally(() => {
     if (active.get(el) === animation) { animation.cancel(); active.delete(el); }
    });
   } catch (_) { finish(el); }
  };
  const observer = new IntersectionObserver(entries => entries
   .filter(entry => entry.isIntersecting)
   .sort((a,b) => a.boundingClientRect.top-b.boundingClientRect.top || a.boundingClientRect.left-b.boundingClientRect.left)
   .forEach((entry,index) => reveal(entry.target, Math.min(index,2)*75)),
   {threshold:0, rootMargin:'0px 0px -48px 0px'});
  const checkVisible = () => {
   frame = 0;
   if (document.hidden) return;
   [...pending].forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom <= 0) finish(el);
    else if (rect.top < innerHeight - 48) reveal(el);
   });
  };
  // A cheap fallback handles fast scrolling, resizing and restored/background tabs.
  const schedule = () => {
   if (pending.size && !frame) frame = requestAnimationFrame(checkVisible);
  };
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('pageshow', schedule);
  const finishAll = () => {
   [...pending, ...active.keys()].forEach(finish);
  };
  motion.addEventListener('change', () => { if (motion.matches) finishAll(); });
  window.addEventListener('beforeprint', finishAll);
  document.addEventListener('visibilitychange', () => {
   if (document.hidden) [...active.keys()].forEach(finish);
   else schedule();
  });
  document.addEventListener('focusin', event => {
   pending.forEach(el => { if (el.contains(event.target)) finish(el); });
  });
  // Already-visible content stays visible. Each off-screen card fades up only once.
  try {
   elements.forEach(el => {
    if (el.matches('.hero h1') || el.getBoundingClientRect().top < innerHeight) return;
    pending.add(el);
    observer.observe(el);
    el.classList.add('scroll-reveal-ready');
   });
   schedule();
  } catch (_) { finishAll(); }
 };
 document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded',setup,{once:true}) : setup();
})();
