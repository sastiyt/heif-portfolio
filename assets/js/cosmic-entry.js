(() => {
 'use strict';
 const root=document.documentElement,entry=document.getElementById('cosmic-entry');
 if(!entry||!root.classList.contains('cosmic-intro-open'))return;
 clearTimeout(window.heifIntroFailSafe);
 const enter=entry.querySelector('[data-enter]');
 const content=[...document.querySelectorAll('body > header,body > main,body > footer')];
 const oldFocus=document.activeElement;
 let finished=false,flying=false,timer;
 entry.hidden=false;content.forEach(el=>el.inert=true);entry.focus({preventScroll:true});
 const finish=()=>{
  if(finished)return;finished=true;clearTimeout(timer);
  try{sessionStorage.setItem('heif-entered','1');}catch{}
  root.classList.remove('cosmic-intro-open');content.forEach(el=>el.inert=false);
  entry.classList.add('is-exiting');window.dispatchEvent(new Event('heif:entered'));
  setTimeout(()=>{entry.hidden=true;entry.removeEventListener('keydown',keys);const heading=document.getElementById('hero-heading');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}else oldFocus?.focus?.();},650);
 };
 const begin=()=>{
  if(flying)return;flying=true;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  enter.disabled=true;entry.classList.add('is-flying');window.dispatchEvent(new Event('heif:warp'));
  timer=setTimeout(finish,1450);
 };
 const keys=e=>{
  if(e.key==='Escape'){e.preventDefault();finish();return;}
  if(e.key==='Tab'){
   const focusable=[...entry.querySelectorAll('button:not(:disabled),a[href]')];
   const first=focusable[0],last=focusable.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 };
 enter.addEventListener('click',begin);entry.addEventListener('keydown',keys);
 window.addEventListener('pageshow',e=>{if(e.persisted)finish();});
})();
