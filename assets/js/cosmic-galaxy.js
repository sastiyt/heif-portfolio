(() => {
 'use strict';
 const canvas=document.getElementById('webgl-canvas');
 if(!canvas)return;
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width:900px), (pointer:coarse)');
 const sky=document.createElement('canvas'), paint=sky.getContext('2d');
 let width=0,height=0,frame=0,last=0,time=0,scroll=scrollY,target=scrollY,dragging=false;
 let seed=7419;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const glow=(x,y,r,colour,alpha)=>{
  const gradient=paint.createRadialGradient(x,y,0,x,y,r);
  gradient.addColorStop(0,`rgba(${colour},${alpha})`);
  gradient.addColorStop(.45,`rgba(${colour},${alpha*.35})`);
  gradient.addColorStop(1,`rgba(${colour},0)`);
  paint.fillStyle=gradient;paint.fillRect(x-r,y-r,r*2,r*2);
 };
 const planet=(x,y,r,rings)=>{
  paint.save();paint.translate(x,y);paint.rotate(-.3);
  // The ring sits behind a shaded sphere, then its front arc crosses the foreground.
  const ring=()=>{paint.strokeStyle='rgba(153,171,149,.24)';paint.lineWidth=r*.13;paint.beginPath();paint.ellipse(0,0,r*1.8,r*.45,0,0,Math.PI*2);paint.stroke();};
  if(rings)ring();
  glow(0,0,r*1.18,rings?'104,139,122':'100,153,170',.18);
  paint.save();paint.beginPath();paint.arc(0,0,r,0,Math.PI*2);paint.clip();
  const sphere=paint.createRadialGradient(-r*.42,-r*.45,r*.04,r*.35,r*.22,r*1.35);
  sphere.addColorStop(0,rings?'#627263':'#395b68');sphere.addColorStop(.38,rings?'#293e33':'#142d39');sphere.addColorStop(.78,'#050c0c');sphere.addColorStop(1,'#020505');
  paint.fillStyle=sphere;paint.fillRect(-r,-r,2*r,2*r);
  for(let i=0;i<180;i++){
   const yy=(random()*2-1)*r;
   paint.fillStyle=`rgba(168,187,167,${random()*.06})`;
   paint.fillRect(-r,yy,2*r,random()*r*.04+.4);
  }
  paint.restore();
  paint.strokeStyle='rgba(142,189,176,.3)';paint.lineWidth=.65;
  paint.beginPath();paint.arc(0,0,r,Math.PI*.85,Math.PI*1.6);paint.stroke();
  if(rings){paint.strokeStyle='rgba(153,171,149,.3)';paint.lineWidth=r*.10;paint.beginPath();paint.ellipse(0,0,r*1.8,r*.45,0,0,Math.PI);paint.stroke();}
  paint.restore();
 };
 const build=()=>{
  seed=7419;
  // Low-resolution nebula is painted once per resize, never regenerated per frame.
  const ratio=Math.min(devicePixelRatio||1,mobile.matches?1:1.25);
  sky.width=Math.round(width*ratio);sky.height=Math.round(height*ratio);
  paint.setTransform(ratio,0,0,ratio,0,0);paint.clearRect(0,0,width,height);
  const spread=Math.max(width,height);
  paint.save();paint.translate(width*.5,height*.53);paint.rotate(-.65);
  paint.scale(1,.44);
  for(let i=0;i<32;i++){
   const x=(i/31-.5)*spread*1.65,y=Math.sin(i*.7)*spread*.028;
   glow(x,y,spread*(.065+random()*.08),i%4===0?'125,113,153':'91,143,132',.08+random()*.075);
  }
  // Dust lanes interrupt the glow, giving the Milky Way an irregular core.
  for(let i=0;i<24;i++)glow((i/23-.5)*spread*1.6,Math.sin(i*.65)*spread*.024,spread*.045,'0,3,5',.45);
  for(let i=0;i<(mobile.matches?1000:1800);i++){
   const x=(random()-.5)*spread*1.7;
   const y=((random()+random()+random())/3-.5)*spread*.24;
   paint.fillStyle=`rgba(186,210,208,${.06+random()*.22})`;
   const size=.25+random()*.6;paint.fillRect(x,y,size,size*2.2);
  }
  paint.restore();
  for(let i=0;i<(mobile.matches?130:240);i++){
   const x=random()*width,y=random()*height,r=.3+random()*.65;
   paint.fillStyle=`rgba(206,224,224,${.12+random()*.32})`;
   paint.beginPath();paint.arc(x,y,r,0,Math.PI*2);paint.fill();
  }
  planet(width*.89,height*.27,Math.min(width*.055,47),true);
  planet(width*.11,height*.8,Math.min(width*.035,27),false);
 };
 const stars=Array.from({length:mobile.matches?32:48},()=>({x:random(),y:random(),z:.25+random()*.75,phase:random()*6.28}));
 const draw=()=>{
  ctx.clearRect(0,0,width,height);
  // Overscan avoids exposed edges as the nebula drifts gently in depth.
  const dx=Math.sin(time*.055)*5,dy=Math.cos(time*.045)*4-Math.sin(scroll*.0004)*7;
  ctx.drawImage(sky,-14+dx,-14+dy,width+28,height+28);
  const speed=mobile.matches?2.1:1;
  for(const star of stars){
   const x=star.x*width+Math.sin(time*.1+star.phase)*4;
   const y=((star.y*height-time*speed*(1+star.z)-scroll*star.z*.045)%height+height)%height;
   ctx.fillStyle=`rgba(221,240,231,${.2+star.z*.22+Math.sin(time*.8+star.phase)*.08})`;
   ctx.beginPath();ctx.arc(x,y,.4+star.z*.7,0,Math.PI*2);ctx.fill();
  }
 };
 const tick=stamp=>{
  frame=0;
  if(document.hidden||reduced.matches||dragging){last=0;return;}
  frame=requestAnimationFrame(tick);
  if(last&&stamp-last<33)return;
  const dt=last?Math.min(stamp-last,80):33;last=stamp;time+=dt/1000;
  scroll+=(target-scroll)*(1-Math.exp(-dt/130));draw();
 };
 const start=()=>{if(!frame&&!document.hidden&&!reduced.matches&&!dragging)frame=requestAnimationFrame(tick);};
 const resize=()=>{
  if(width===innerWidth&&height===innerHeight)return;
  width=innerWidth;height=innerHeight;
  const ratio=Math.min(devicePixelRatio||1,mobile.matches?1:1.25);
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);build();draw();start();
 };
 canvas.setAttribute('aria-hidden','true');document.documentElement.classList.add('cosmic-galaxy');
 let resizeTimer;
 addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,180);},{passive:true});
 addEventListener('scroll',()=>{target=scrollY;start();},{passive:true});
 document.addEventListener('visibilitychange',()=>{last=0;start();});
 reduced.addEventListener('change',()=>{last=0;draw();start();});
 document.addEventListener('pointerdown',e=>{if(e.target.closest('.compare'))dragging=true;},{passive:true});
 const resume=()=>{dragging=false;start();};
 document.addEventListener('pointerup',resume,{passive:true});document.addEventListener('pointercancel',resume,{passive:true});
 resize();
})();