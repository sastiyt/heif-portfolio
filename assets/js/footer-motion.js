(() => {
 'use strict';
 const invite=document.querySelector('.footer-invite');
 if(!invite || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 const footer=invite.closest('.site-footer');
 if(!('IntersectionObserver' in window)) return;
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   footer.classList.toggle('footer-in-view',entry.isIntersecting);
   if(entry.isIntersecting) footer.classList.add('footer-revealed');
  });
 },{threshold:.12});
 observer.observe(invite);
})();

(() => {
 'use strict';
 const name=document.querySelector('.hub-intro h1');
 if(!name || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   name.classList.toggle('hub-name-in-view',entry.isIntersecting);
   if(entry.isIntersecting) name.classList.add('hub-name-visible');
  });
 },{threshold:.25});
 observer.observe(name);
})();
