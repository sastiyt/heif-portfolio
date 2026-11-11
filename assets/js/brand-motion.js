(() => {
 'use strict';
 const clearLoader=()=>document.documentElement.classList.remove('brand-loading');
 // Stabilize the first text paint without waiting for gallery images or videos.
 const fonts=['400 16px "Josefin Sans"','400 32px "Phonk Contrast"'];
 if(document.getElementById('hero-heading')) fonts.push('300 48px "Halyard Display"','600 48px "Halyard Display"');
 const ready=document.fonts?Promise.all(fonts.map(font=>document.fonts.load(font))).catch(()=>{}):Promise.resolve();
 Promise.race([ready,new Promise(resolve=>setTimeout(resolve,1100))]).then(()=>requestAnimationFrame(clearLoader));
 window.addEventListener('pageshow',event=>{if(event.persisted)clearLoader();});
 document.addEventListener('click',event=>{
  if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link=event.target.closest('a[href]');
  if(!link || link.target || link.hasAttribute('download')) return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin || url.pathname===location.pathname || !url.pathname.endsWith('.html')) return;
  document.documentElement.classList.add('brand-loading');
  setTimeout(clearLoader,1800);
 });
 if(matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  const className=entry.target.classList.contains('hub-profile')?'hub-profile-in-view':'hub-links-in-view';
  entry.target.classList.toggle(className,entry.isIntersecting);
 }),{threshold:.05});
 document.querySelectorAll('.hub-profile,.hub-links').forEach(el=>observer.observe(el));
})();

/* Interaction-only motion: no animation loop, media downloads or dependencies. */
(() => {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const fine = matchMedia('(hover: hover) and (pointer: fine)');
 const resets = [];
 const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
 document.querySelectorAll('.poster-gallery, [data-artwork-spotlight]').forEach(gallery => {
  const cards = [...gallery.querySelectorAll('.image-item')];
  let selected = null, frame = 0, rect = null, point = null, touch = null, source = '';
  cards.forEach(card => {
   // The stable outer card retains masonry sizing and the existing scroll reveal.
   const surface = document.createElement('div');
   surface.className = 'poster-spotlight-surface';
   while (card.firstChild) surface.appendChild(card.firstChild);
   card.appendChild(surface);
   card.classList.add('poster-spotlight-card');
   card.tabIndex = 0;
   card.setAttribute('role', 'button');
   card.setAttribute('aria-label', `Spotlight: ${card.querySelector('img')?.alt || 'artwork'}`);
   card.setAttribute('aria-pressed', 'false');
  });
  const reset = () => {
   if (!selected && !frame) return;
   cancelAnimationFrame(frame); frame = 0; rect = null; point = null;
   if (selected) {
    selected.classList.remove('is-spotlit');
    selected.setAttribute('aria-pressed', 'false');
    selected.style.removeProperty('--poster-rx');
    selected.style.removeProperty('--poster-ry');
   }
   selected = null; source = '';
   gallery.classList.remove('has-spotlight');
  };
  const select = (card, input = 'mouse') => {
   if (reduced.matches || selected === card) return;
   reset(); selected = card; source = input;
   rect = card.getBoundingClientRect();
   card.classList.add('is-spotlit');
   card.setAttribute('aria-pressed', 'true');
   gallery.classList.add('has-spotlight');
  };
  const cardFrom = target => target.closest('.poster-spotlight-card');
  gallery.addEventListener('pointerover', event => {
   if (event.pointerType !== 'mouse' || !fine.matches) return;
   const card = cardFrom(event.target); if (card) select(card);
  });
  gallery.addEventListener('pointermove', event => {
   if (event.pointerType !== 'mouse' || !fine.matches || !selected || !rect) return;
   point = {x:event.clientX, y:event.clientY};
   if (frame) return;
   frame = requestAnimationFrame(() => {
    frame = 0;
    if (!selected || !point || !rect) return;
    selected.style.setProperty('--poster-rx', `${clamp((.5-(point.y-rect.top)/rect.height)*8,4).toFixed(2)}deg`);
    selected.style.setProperty('--poster-ry', `${clamp(((point.x-rect.left)/rect.width-.5)*8,4).toFixed(2)}deg`);
   });
  });
  gallery.addEventListener('pointerout', event => {
   if (event.pointerType === 'mouse' && source === 'mouse' && selected && !selected.contains(event.relatedTarget)) reset();
  });
  gallery.addEventListener('pointerdown', event => {
   if (event.pointerType === 'mouse') return;
   touch = {card:cardFrom(event.target), x:event.clientX, y:event.clientY};
  }, {passive:true});
  gallery.addEventListener('pointerup', event => {
   if (!touch) return;
   const start = touch; touch = null;
   if (start.card && start.card === cardFrom(event.target) && Math.hypot(event.clientX-start.x,event.clientY-start.y)<10) {
    selected === start.card ? reset() : select(start.card, 'touch');
   }
  }, {passive:true});
  gallery.addEventListener('pointercancel', () => { touch = null; reset(); }, {passive:true});
  gallery.addEventListener('keydown', event => {
   if (event.key === 'Escape') { reset(); return; }
   const card = cardFrom(event.target);
   if (card && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault(); selected === card ? reset() : select(card, 'keyboard');
   }
  });
  gallery.addEventListener('focusout', event => {
   if (!gallery.contains(event.relatedTarget)) reset();
  });
  document.addEventListener('pointerdown', event => {
   if (selected && !gallery.contains(event.target)) reset();
  }, {passive:true});
  resets.push(reset);
 });
 document.querySelectorAll('.footer-project-link, .about-cta .button').forEach(button => {
  button.classList.add('magnetic-button');
  let rect = null, frame = 0, point = null;
  const reset = () => {
   if (!rect && !frame && !point) return;
   cancelAnimationFrame(frame); frame = 0; rect = null; point = null;
   button.style.removeProperty('--magnet-x');
   button.style.removeProperty('--magnet-y');
  };
  button.addEventListener('pointerenter', event => {
   if (event.pointerType === 'mouse' && fine.matches && !reduced.matches) rect = button.getBoundingClientRect();
  });
  button.addEventListener('pointermove', event => {
   if (!rect || reduced.matches || !fine.matches || event.pointerType !== 'mouse') return;
   point = {x:event.clientX,y:event.clientY};
   if (frame) return;
   frame = requestAnimationFrame(() => {
    frame = 0; if (!rect || !point) return;
    button.style.setProperty('--magnet-x', `${clamp((point.x-rect.left-rect.width/2)*.12,7).toFixed(2)}px`);
    button.style.setProperty('--magnet-y', `${clamp((point.y-rect.top-rect.height/2)*.18,5).toFixed(2)}px`);
   });
  });
  button.addEventListener('pointerleave', reset);
  button.addEventListener('pointercancel', reset);
  button.addEventListener('blur', reset);
  resets.push(reset);
 });
 const resetAll = () => resets.forEach(reset => reset());
 // Clear retained touch spotlight while scrolling without blocking native gestures.
 window.addEventListener('scroll', resetAll, {passive:true});
 window.addEventListener('resize', resetAll, {passive:true});
 window.addEventListener('pagehide', resetAll);
 document.addEventListener('visibilitychange', () => { if (document.hidden) resetAll(); });
 reduced.addEventListener('change', resetAll);
 fine.addEventListener('change', resetAll);
})();
