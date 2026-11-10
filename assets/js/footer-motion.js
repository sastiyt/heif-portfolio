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
