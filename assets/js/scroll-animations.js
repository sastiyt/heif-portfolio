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
  const played = new WeakSet();
  const pending = new Map();
  const inView = el => {
   const rect = el.getBoundingClientRect();
   return rect.bottom > 80 && rect.top < innerHeight - Math.min(90, innerHeight * .12);
  };
  const reveal = async (el, delay) => {
   if (played.has(el) || pending.has(el) || document.hidden || motion.matches || !inView(el)) return;
   const token = {};
   pending.set(el, token);
   const pictures = [...el.querySelectorAll('img')];
   pictures.forEach(img => { img.loading='eager'; });
   // Preload near the viewport; never hold the reveal indefinitely for slow media.
   await Promise.race([
    Promise.all(pictures.map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve())),
    new Promise(resolve => setTimeout(resolve, 350))
   ]);
   if (pending.get(el) !== token) return;
   pending.delete(el);
   if (motion.matches || document.hidden || !inView(el)) return;
   played.add(el);
   const animation = el.animate([
    {opacity:0, transform:'translateY(44px)'},
    {opacity:1, transform:'translateY(0)'}
   ], {duration:900, delay, easing:'cubic-bezier(.16,1,.3,1)', fill:'backwards'});
   active.set(el, animation);
   animation.finished.catch(() => {}).finally(() => {
    if (active.get(el) === animation) active.delete(el);
   });
  };
  const orderedReveal = entries => entries
   .filter(entry => entry.isIntersecting)
   .sort((a,b) => a.boundingClientRect.top-b.boundingClientRect.top || a.boundingClientRect.left-b.boundingClientRect.left)
   .forEach((entry,index) => reveal(entry.target, Math.min(index,3)*110).catch(() => {}));
  // Enter well inside the screen, so the fade has not finished below the viewport.
  const observer = new IntersectionObserver(orderedReveal, {threshold:0, rootMargin:'-80px 0px -' + Math.min(90, innerHeight * .12) + 'px 0px'});
  // Re-arm only after the entire card leaves the screen, avoiding edge flicker.
  const exits = new IntersectionObserver(entries => entries.forEach(entry => {
   if (!entry.isIntersecting) {
    played.delete(entry.target);
    pending.delete(entry.target);
    active.get(entry.target)?.cancel();
   }
  }), {threshold:0});
  const targets = elements.filter(el => !el.matches('.hero h1'));
  targets.forEach(el => { observer.observe(el); exits.observe(el); });
  const cancel = () => { pending.clear(); active.forEach(animation => animation.cancel()); active.clear(); };
  motion.addEventListener('change', () => {
   if (motion.matches) cancel();
   else targets.forEach(el => { if (inView(el)) reveal(el,0).catch(() => {}); });
  });
  window.addEventListener('beforeprint', cancel);
  document.addEventListener('visibilitychange', () => {
   if (document.hidden) cancel();
   else targets.forEach(el => { if (inView(el)) reveal(el,0).catch(() => {}); });
  });
 };
 document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded',setup,{once:true}) : setup();
})();
