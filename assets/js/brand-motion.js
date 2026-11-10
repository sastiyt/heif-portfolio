(() => {
 'use strict';
 const clearLoader=()=>document.documentElement.classList.remove('brand-loading');
 // Runs after the HTML is parsed; optional images and video never hold the loader.
 requestAnimationFrame(()=>requestAnimationFrame(clearLoader));
 window.addEventListener('pageshow',clearLoader);
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
