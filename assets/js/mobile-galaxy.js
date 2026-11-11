(() => {
 'use strict';
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const mobileViewport=matchMedia('(max-width: 900px), (pointer: coarse)');
 const canvas=document.getElementById('webgl-canvas');
 if (!canvas || motion.matches) return;
 const ctx=canvas.getContext('2d',{alpha:true});
 if (!ctx) return;
 document.documentElement.classList.add('mobile-galaxy');
 canvas.setAttribute('aria-hidden','true');
 let width=0,height=0,frame=0,last=0,time=0,scroll=window.scrollY,target=scroll,dragging=false;
 const stars=Array.from({length:64},() => ({x:Math.random(),y:Math.random(),depth:.25+Math.random()*.75,r:.4+Math.random()*.75,phase:Math.random()*6.28}));
 const resize=() => {
  width=innerWidth; height=innerHeight;
  const ratio=Math.min(devicePixelRatio || 1,1.5);
  canvas.width=Math.round(width*ratio); canvas.height=Math.round(height*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);
 };
 const tick=stamp => {
  frame=0;
  if (document.hidden || motion.matches || dragging) { last=0; return; }
  frame=requestAnimationFrame(tick);
  if (last && stamp-last<32) return; // 30 fps decoration leaves room for input/reveals.
  const dt=last?Math.min(stamp-last,64):32; last=stamp; time+=dt*.001;
  scroll+=(target-scroll)*(1-Math.exp(-dt/110));
  const speed=mobileViewport.matches?2:1;
  ctx.clearRect(0,0,width,height);
  stars.forEach(star => {
   const y=((star.y*height-time*speed*(1+star.depth*2)-scroll*star.depth*.08*speed)%height+height)%height;
   const x=star.x*width+Math.sin(time*.05*speed+star.phase)*3;
   ctx.globalAlpha=.16+star.depth*.2+(Math.sin(time*.6+star.phase)+1)*.035;
   ctx.fillStyle='#e0f3e5';ctx.beginPath();ctx.arc(x,y,star.r,0,Math.PI*2);ctx.fill();
  });
 };
 const start=() => { if (!frame && !document.hidden && !motion.matches && !dragging) frame=requestAnimationFrame(tick); };
 window.addEventListener('scroll',() => {target=window.scrollY;start();},{passive:true});
 window.addEventListener('resize',resize,{passive:true});
 document.addEventListener('visibilitychange',start);
 motion.addEventListener('change',() => {document.documentElement.classList.toggle('mobile-galaxy',!motion.matches);start();});
 document.addEventListener('pointerdown',event => {if(event.target.closest('.compare')) dragging=true;},{passive:true});
 const resume=() => {dragging=false;start();};
 document.addEventListener('pointerup',resume,{passive:true});
 document.addEventListener('pointercancel',resume,{passive:true});
 resize();start();
})();
