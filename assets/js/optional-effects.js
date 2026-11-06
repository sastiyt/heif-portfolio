(() => {
 'use strict';
 const connection = navigator.connection;
 const light = matchMedia('(max-width: 900px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '') || (navigator.deviceMemory && navigator.deviceMemory < 4);
 if (light) { document.documentElement.classList.add('light-effects'); return; }
 const load = src => new Promise((resolve,reject) => {
  const script=document.createElement('script'); script.src=src; script.onload=resolve; script.onerror=reject; document.head.appendChild(script);
 });
 const start = async () => {
  try {
   await load('assets/vendor/three.min.js');
   // Decorative stars do not need a scroll-animation framework.
   await load('assets/js/particles-effect.js');
   if (!document.getElementById('hero-3d-model')) return;
   await load('assets/vendor/GLTFLoader.js');
   await load('assets/vendor/gsap.min.js');
   await load('assets/vendor/ScrollTrigger.min.js');
   await load('assets/js/hero-3d.js');
   await load('assets/js/ae-3d.js');
   await load('assets/js/hero1-3d.js');
  } catch { /* Portfolio navigation and content remain usable if effects fail. */ }
 };
 const schedule=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if ('requestIdleCallback' in window) requestIdleCallback(start,{timeout:2500});
  else setTimeout(start,300);
 }));
 document.readyState==='complete'?schedule():window.addEventListener('load',schedule,{once:true});
})();
