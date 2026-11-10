(() => {
 'use strict';
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 const setup = () => {
  // Animate artwork containers, never logos, video posters or comparison layers.
  document.querySelectorAll('main .image-item, main .thumbnail, main .about-portrait').forEach(el => {
   if (!el.querySelector('img') || el.querySelector('video, iframe')) return;
   el.classList.add('artwork-motion');
   if (el.querySelector('.compare')) el.classList.add('artwork-compare');
  });
  const elements = [...document.querySelectorAll('.reveal, .skill-item, .contact-item, .video-item, .image-item, .thumbnail, .about-portrait, main .page-title, .image-showcase > h2')];
  const show = el => {
   el.classList.add('visible');
   el.classList.remove('reveal-pending');
  };
  if (motion.matches || !('IntersectionObserver' in window)) { elements.forEach(show); return; }
  const observer = new IntersectionObserver(entries => {
   // Stagger only cards arriving together, not their index in a long gallery.
   const entering = entries.filter(entry => entry.isIntersecting)
    .sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
   entering.forEach((entry,index) => {
    entry.target.style.setProperty('--reveal-delay', Math.min(index, 2) * 60 + 'ms');
    show(entry.target);
    observer.unobserve(entry.target);
   });
  }, {threshold: 0, rootMargin: '0px 0px -32px 0px'});
  elements.forEach(el => {
   el.classList.add('reveal');
   if (el.getBoundingClientRect().top < innerHeight - 32) show(el);
   else { el.classList.add('reveal-pending'); observer.observe(el); }
  });
  // Keyboard navigation and motion preferences always take precedence.
  document.addEventListener('focusin', event => {
   let el = event.target.closest('.reveal-pending');
   while (el) { show(el); observer.unobserve(el); el = el.parentElement?.closest('.reveal-pending'); }
  });
  motion.addEventListener('change', () => {
   if (motion.matches) { observer.disconnect(); elements.forEach(show); }
  });
 };
 document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', setup, {once:true}) : setup();
})();
