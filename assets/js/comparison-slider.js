(() => {
 'use strict';
 const setup = () => document.querySelectorAll('.compare').forEach(compare => {
  const input = compare.querySelector('.compare__input');
  if (!input) return;
  let frame=0;
  const paint=() => { frame=0; compare.style.setProperty('--mask-width',`${input.value}%`); };
  const schedule=() => { if (!frame) frame=requestAnimationFrame(paint); };
  input.setAttribute('aria-label',input.getAttribute('aria-label') || 'Compare before and after editing');
  input.addEventListener('input',schedule);
  input.addEventListener('pointerdown',() => compare.classList.add('is-dragging'),{passive:true});
  const release=() => {
   if (frame) { cancelAnimationFrame(frame); paint(); }
   compare.classList.remove('is-dragging');
  };
  input.addEventListener('pointerup',release);
  input.addEventListener('pointercancel',release);
  input.addEventListener('lostpointercapture',release);
  input.addEventListener('blur',release);
  paint();
 });
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',setup,{once:true}):setup();
})();
