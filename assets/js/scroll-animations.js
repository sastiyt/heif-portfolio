(() => {
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 if (!reduced && matchMedia('(pointer: fine)').matches && window.Lenis && window.gsap && window.ScrollTrigger) {
  const lenis = new Lenis({duration: 1, smoothTouch: false});
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
 }
 const setup = () => {
  const elements = document.querySelectorAll('.reveal, .skill-item, .contact-item, .video-item, .image-item, .thumbnail');
  if (reduced || !('IntersectionObserver' in window)) { elements.forEach(el => el.classList.add('visible')); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
   if (entry.isIntersecting) { entry.target.classList.add('visible'); entry.target.classList.remove('reveal-pending'); observer.unobserve(entry.target); }
  }), {threshold: 0, rootMargin: '0px 0px 40px 0px'});
  elements.forEach(el => {el.classList.add('reveal'); if(el.getBoundingClientRect().top < innerHeight) el.classList.add('visible'); else {el.classList.add('reveal-pending'); observer.observe(el);} });
 };
 document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', setup) : setup();
})();
