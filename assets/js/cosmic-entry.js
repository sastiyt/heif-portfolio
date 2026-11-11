(() => {
 'use strict';
 const root=document.documentElement,entry=document.getElementById('cosmic-entry');
 if(!entry||!root.classList.contains('cosmic-intro-open'))return;
 clearTimeout(window.heifIntroFailSafe);
 const enter=entry.querySelector('[data-enter]');
 const content=[...document.querySelectorAll('body > header,body > main,body > footer')];
 const oldFocus=document.activeElement;
 let finished=false,flying=false,timer,particleFrame=0;
 // Rasterize the actual label so particles disperse from its letter shapes.
 const scatterLabel=()=>{
  const layer=document.createElement('canvas');layer.className='cosmic-entry-particles';layer.setAttribute('aria-hidden','true');
  const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
  layer.width=w*dpr;layer.height=h*dpr;entry.appendChild(layer);
  const c=layer.getContext('2d');c.scale(dpr,dpr);
  const mask=document.createElement('canvas');mask.width=w;mask.height=h;
  const m=mask.getContext('2d',{willReadFrequently:true});
  for(const span of enter.children){const b=span.getBoundingClientRect(),style=getComputedStyle(span);m.font=style.font;m.fillStyle=style.color;m.textBaseline='middle';m.fillText(span.textContent,b.left,b.top+b.height/2);}
  const bounds=enter.getBoundingClientRect(),pixels=m.getImageData(0,0,w,h).data,points=[];
  for(let y=Math.max(0,Math.floor(bounds.top));y<Math.min(h,bounds.bottom);y+=2)for(let x=Math.max(0,Math.floor(bounds.left));x<Math.min(w,bounds.right);x+=2){
   const at=(y*w+x)*4;if(pixels[at+3]<80)continue;
   const angle=Math.random()*Math.PI*2,speed=35+Math.random()*130;
   points.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:.6+Math.random(),color:`rgb(${pixels[at]},${pixels[at+1]},${pixels[at+2]})`});
  }
  const start=performance.now();
  const render=now=>{
   const t=Math.min(1,(now-start)/740),distance=1-Math.pow(1-t,3);c.clearRect(0,0,w,h);c.globalAlpha=Math.pow(1-t,1.4);
   for(const p of points){c.fillStyle=p.color;c.beginPath();c.arc(p.x+p.vx*distance,p.y+p.vy*distance,p.r*(1-t*.5),0,Math.PI*2);c.fill();}
   if(t<1&&!finished)particleFrame=requestAnimationFrame(render);else layer.remove();
  };particleFrame=requestAnimationFrame(render);
 };
 entry.hidden=false;content.forEach(el=>el.inert=true);entry.focus({preventScroll:true});
 const finish=()=>{
  if(finished)return;finished=true;clearTimeout(timer);cancelAnimationFrame(particleFrame);entry.querySelector('.cosmic-entry-particles')?.remove();
  try{sessionStorage.setItem('heif-entered','1');}catch{}
  root.classList.remove('cosmic-intro-open');content.forEach(el=>el.inert=false);
  entry.classList.add('is-exiting');window.dispatchEvent(new Event('heif:entered'));
  setTimeout(()=>{entry.hidden=true;entry.removeEventListener('keydown',keys);const heading=document.getElementById('hero-heading');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}else oldFocus?.focus?.();},650);
 };
 const begin=()=>{
  if(flying)return;flying=true;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  scatterLabel();enter.disabled=true;entry.classList.add('is-dispersing');
  enter.style.opacity='0';
  timer=setTimeout(()=>{entry.classList.add('is-flying');window.dispatchEvent(new Event('heif:warp'));timer=setTimeout(finish,1450);},420);
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
