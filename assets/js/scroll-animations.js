(() => {
 'use strict';
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const setup=()=>{
  const mobile=matchMedia('(max-width:600px)');
  const galleries=[...document.querySelectorAll('.masonry-container')].map(container=>({container,items:[...container.children].filter(el=>el.classList.contains('image-item')),count:0}));
  const layout=()=>galleries.forEach(gallery=>{
   const {container,items}=gallery, count=innerWidth<=600&&container.classList.contains('graphics-gallery')?1:innerWidth<=900?2:3;
   if(!items.length || gallery.count===count)return;
   gallery.count=count;
   const width=Math.max(100,(container.clientWidth-(count-1)*15-40)/count);
   const sizes=items.map(el=>{
    const img=el.querySelector('img');
    const w=Number(img?.getAttribute('width'))||img?.naturalWidth||1;
    const h=Number(img?.getAttribute('height'))||img?.naturalHeight||w;
    return width*h/w+(el.querySelector('.poster-performance')?(mobile.matches?72:50):0)+15;
   });
   const columns=Array.from({length:count},()=>{const c=document.createElement('div');c.className='gallery-column';return c;});
   const heights=Array(count).fill(0);
   items.forEach((el,i)=>{const n=heights.indexOf(Math.min(...heights));columns[n].append(el);heights[n]+=sizes[i];});
   container.querySelectorAll(':scope > .gallery-column').forEach(el=>el.remove());
   container.classList.remove('mobile-masonry');container.classList.add('stable-masonry');
   container.append(...columns);
  });
  layout();
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(layout,150);},{passive:true});
  document.querySelectorAll('main .image-item,main .thumbnail').forEach(el=>{
   if(!el.querySelector('img')||el.querySelector('video,iframe'))return;
   el.classList.add('artwork-motion');if(el.querySelector('.compare'))el.classList.add('artwork-compare');
  });
  const elements=[...document.querySelectorAll('.reveal,.skill-item,.contact-item,.video-item,.image-item,.thumbnail,.portfolio-intro > *,main .page-title:not(.portfolio-intro),.image-showcase > h2')];
  elements.forEach(el=>{el.classList.add('reveal','visible');el.classList.remove('reveal-pending','scroll-reveal-ready');});
  const images=[...document.querySelectorAll('main img')];
  const failed=new Set(), retried=new WeakSet();
  const retry=img=>{
   if(retried.has(img)||!img.getAttribute('src'))return;
   if(!navigator.onLine){failed.add(img);return;}
   retried.add(img);failed.delete(img);
   const url=new URL(img.getAttribute('src'),location.href);
   if(url.origin!==location.origin)return;
   url.searchParams.set('image-retry','1');img.removeAttribute('srcset');img.loading='eager';img.src=url.href;
  };
  images.forEach(img=>{img.addEventListener('error',()=>retry(img));if(img.complete&&!img.naturalWidth)retry(img);});
  window.addEventListener('online',()=>[...failed].forEach(retry));
  if(!('IntersectionObserver' in window)){images.forEach(img=>img.loading='eager');return;}
  const loading=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
   if(isIntersecting){target.loading='eager';loading.unobserve(target);}
  }),{rootMargin:'500px 0px'});
  images.forEach(img=>loading.observe(img));
  if(motion.matches||!Element.prototype.animate)return;
  const active=new Map();
  let nextStart=0;
  const finish=el=>{const animation=active.get(el);active.delete(el);if(animation)animation.cancel();};
  const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>Math.round(a.boundingClientRect.top/32)-Math.round(b.boundingClientRect.top/32)||a.boundingClientRect.left-b.boundingClientRect.left);
   const now=performance.now();
   visible.forEach(({target:el,boundingClientRect:rect})=>{
    if(document.hidden)return;
    observer.unobserve(el);
    if(motion.matches||rect.bottom<=0){finish(el);return;}
    const delay=Math.min(Math.max(0,nextStart-now),480);nextStart=now+delay+(mobile.matches?(Number(el.closest('[data-reveal-stagger]')?.dataset.revealStagger)||160):100);
    try{
     const animation=active.get(el);
     if(animation){animation.effect.updateTiming({delay});animation.play();}
    }catch(_){finish(el);}
   });
  },{threshold:0,rootMargin:'0px 0px -24px 0px'});
  elements.forEach(el=>{
   // Animate outer cards only, never a parent and child together.
   const card=el.matches('.image-item,.thumbnail,.video-item');
   const rect=el.getBoundingClientRect();
   if(el.matches('.hero h1')||el.parentElement.closest('.image-item,.thumbnail,.video-item,.portfolio-intro.reveal')||rect.bottom<=0||(!card&&rect.top<innerHeight))return;
   try{
    // Prepare the effect before entry so it cannot flash visible, then fade again.
    // The base CSS stays visible if JS is unavailable or an animation is cancelled.
    const animation=el.animate([{opacity:0,transform:'translateY(28px)'},{opacity:1,transform:'translateY(0)'}],{duration:mobile.matches?720:560,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'});
    animation.pause();animation.currentTime=0;active.set(el,animation);
    animation.finished.catch(()=>{}).finally(()=>{if(active.get(el)===animation)finish(el);});
    observer.observe(el);
   }catch(_){finish(el);}
  });
  const finishAll=()=>{[...active.keys()].forEach(finish);};
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden){active.forEach((animation,el)=>{if(animation.playState==='running')finish(el);});}
   else{active.forEach((animation,el)=>{if(animation.playState==='paused'){observer.unobserve(el);observer.observe(el);}});}
  });
  window.addEventListener('pageshow',event=>{if(event.persisted)finishAll();});
  document.addEventListener('focusin',event=>{const card=event.target.closest('.image-item,.thumbnail,.video-item');if(card)finish(card);});
  window.addEventListener('beforeprint',finishAll);
  motion.addEventListener('change',()=>{if(motion.matches){observer.disconnect();finishAll();}});
 };
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',setup,{once:true}):setup();
})();
