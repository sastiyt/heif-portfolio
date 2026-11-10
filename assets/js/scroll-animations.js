(() => {
 'use strict';
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 const setup = () => {
  document.querySelectorAll('main .image-item, main .thumbnail, main .about-portrait').forEach(el => {
   if (!el.querySelector('img') || el.querySelector('video, iframe')) return;
   el.classList.add('artwork-motion');
   if (el.querySelector('.compare')) el.classList.add('artwork-compare');
  });
  const elements = [...document.querySelectorAll('.reveal, .skill-item, .contact-item, .video-item, .image-item, .thumbnail, .about-portrait, main .page-title, .image-showcase > h2')];
  // Visible is the permanent state. An observer or animation failure cannot hide work.
  elements.forEach(el => { el.classList.add('reveal','visible'); el.classList.remove('reveal-pending'); });
  const images = [...document.querySelectorAll('main .image-item img, main .thumbnail img, main .about-portrait img')];
  if (!('IntersectionObserver' in window)) { images.forEach(img => { img.loading='eager'; }); return; }
  const loading = new IntersectionObserver(entries => entries.forEach(entry => {
   if (entry.isIntersecting) { entry.target.loading='eager'; loading.unobserve(entry.target); }
  }), {rootMargin:'600px 0px'});
  images.forEach(img => loading.observe(img));
  if (motion.matches || !Element.prototype.animate) return;
  const active = new Set();
  const reveal = async (el, delay) => {
   const pictures = [...el.querySelectorAll('img')];
   pictures.forEach(img => { img.loading='eager'; });
   // Animate only after the artwork is decoded; slow images remain visible by default.
   await Promise.all(pictures.map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
   const rect = el.getBoundingClientRect();
   if (motion.matches || document.hidden || rect.bottom <= 0 || rect.top >= innerHeight) return;
   const animation = el.animate([
    {opacity:.45, transform:'translateY(18px)'},
    {opacity:1, transform:'translateY(0)'}
   ], {duration:550, delay, easing:'cubic-bezier(.22,1,.36,1)', fill:'none'});
   active.add(animation);
   animation.finished.catch(() => {}).finally(() => active.delete(animation));
  };
  const observer = new IntersectionObserver(entries => {
   entries.filter(entry => entry.isIntersecting)
    .sort((a,b) => a.boundingClientRect.top-b.boundingClientRect.top || a.boundingClientRect.left-b.boundingClientRect.left)
    .forEach((entry,index) => {
     observer.unobserve(entry.target);
     reveal(entry.target, Math.min(index,2)*50).catch(() => {});
    });
  }, {threshold:0, rootMargin:'0px 0px -24px 0px'});
  elements.forEach(el => {
   if (el.getBoundingClientRect().top >= innerHeight-24) observer.observe(el);
  });
  const cancel = () => { active.forEach(animation => animation.cancel()); active.clear(); };
  motion.addEventListener('change', () => { if (motion.matches) { observer.disconnect(); cancel(); } });
  window.addEventListener('beforeprint', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
 };
 document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded',setup,{once:true}) : setup();
})();
