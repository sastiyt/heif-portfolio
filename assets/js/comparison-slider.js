(() => {
 'use strict';
 const setup = () => document.querySelectorAll('.compare').forEach(compare => {
  const input = compare.querySelector('.compare__input');
  if (!input) return;
  let frame=0, gesture=null;
  const paint=() => { frame=0; compare.style.setProperty('--mask-width',`${input.value}%`); };
  const schedule=() => { if (!frame) frame=requestAnimationFrame(paint); };
  input.setAttribute('aria-label',input.getAttribute('aria-label') || 'Compare before and after editing');
  input.step='any';
  input.addEventListener('input',schedule);
  const position = x => {
   if (!gesture) return;
   input.value=String(Math.max(0,Math.min(100,(x-gesture.left)/gesture.width*100)));
   schedule();
  };
  input.addEventListener('pointerdown',event => {
   if (!event.isPrimary || event.button!==0) return;
   event.preventDefault(); // Replace native range snapping with continuous coordinates.
   input.focus({preventScroll:true});
   const rect=compare.getBoundingClientRect();
   gesture={id:event.pointerId,left:rect.left,width:rect.width,x:event.clientX,y:event.clientY,moved:false};
   input.setPointerCapture(event.pointerId);
   compare.classList.add('is-dragging');
   if (event.pointerType!=='touch') position(event.clientX);
  });
  input.addEventListener('pointermove',event => {
   if (!gesture || gesture.id!==event.pointerId) return;
   const dx=Math.abs(event.clientX-gesture.x),dy=Math.abs(event.clientY-gesture.y);
   if (!gesture.moved && event.pointerType==='touch' && (dx<4 || dy>dx)) return;
   gesture.moved=true;
   position(event.clientX);
  });
  const release=() => {
   if (frame) { cancelAnimationFrame(frame); paint(); }
   gesture=null;
   compare.classList.remove('is-dragging');
  };
  input.addEventListener('pointerup',event => {
   if (gesture && (gesture.moved || Math.abs(event.clientY-gesture.y)<8)) position(event.clientX);
   release();
  });
  input.addEventListener('pointercancel',release);
  input.addEventListener('lostpointercapture',release);
  input.addEventListener('blur',release);
  paint();
 });
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',setup,{once:true}):setup();
})();
