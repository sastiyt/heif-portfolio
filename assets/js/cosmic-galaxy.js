(() => {
 'use strict';
 const canvas=document.getElementById('webgl-canvas');
 if(!canvas)return;
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width:900px), (pointer:coarse)');
 const sky=document.createElement('canvas'), paint=sky.getContext('2d');
 const pointer={x:0,y:0,tx:0,ty:0,active:false};
 let planets=[],stars=[];
 let width=0,height=0,frame=0,last=0,time=0,scroll=scrollY,target=scrollY,dragging=false;
 let seed=7419;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const glow=(paint,x,y,r,colour,alpha)=>{
  const gradient=paint.createRadialGradient(x,y,0,x,y,r);
  gradient.addColorStop(0,`rgba(${colour},${alpha})`);
  gradient.addColorStop(.45,`rgba(${colour},${alpha*.35})`);
  gradient.addColorStop(1,`rgba(${colour},0)`);
  paint.fillStyle=gradient;paint.fillRect(x-r,y-r,r*2,r*2);
 };
 const planet=(paint,x,y,r,rings)=>{
  paint.save();paint.translate(x,y);paint.rotate(-.3);
  // The ring sits behind a shaded sphere, then its front arc crosses the foreground.
  const ring=()=>{paint.strokeStyle='rgba(153,171,149,.24)';paint.lineWidth=r*.13;paint.beginPath();paint.ellipse(0,0,r*1.8,r*.45,0,0,Math.PI*2);paint.stroke();};
  if(rings)ring();
  glow(paint,0,0,r*1.18,rings?'104,139,122':'100,153,170',.18);
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
   glow(paint,x,y,spread*(.065+random()*.08),i%4===0?'125,113,153':'91,143,132',.08+random()*.075);
  }
  // Dust lanes interrupt the glow, giving the Milky Way an irregular core.
  for(let i=0;i<24;i++)glow(paint,(i/23-.5)*spread*1.6,Math.sin(i*.65)*spread*.024,spread*.045,'0,3,5',.45);
  for(let i=0;i<(mobile.matches?1000:1800);i++){
   const x=(random()-.5)*spread*1.7;
   const y=((random()+random()+random())/3-.5)*spread*.24;
   paint.fillStyle=`rgba(186,210,208,${.06+random()*.22})`;
   const size=.25+random()*.6;paint.fillRect(x,y,size,size*2.2);
  }
  paint.restore();
  // Cache each planet separately so scroll zoom never repaints its surface.
  planets=[{x:.88,y:.27,r:Math.min(width*.06,48),rings:true,z:.8},
           {x:.12,y:.8,r:Math.min(width*.042,29),rings:false,z:1.2}].map(p=>{
   const sprite=document.createElement('canvas'), side=Math.ceil(p.r*4.6);
   sprite.width=Math.ceil(side*ratio);sprite.height=Math.ceil(side*ratio);
   const surface=sprite.getContext('2d');surface.scale(ratio,ratio);
   planet(surface,side/2,side/2,p.r,p.rings);
   return {...p,sprite,side};
  });
  // Overscan the orbital field so rotation cannot leave empty corners.
  const radius=Math.hypot(width,height)*.63;
  stars=Array.from({length:mobile.matches?300:640},()=>{
   const angle=random()*Math.PI*2, distance=Math.sqrt(random())*radius;
   return {x:Math.cos(angle)*distance,y:Math.sin(angle)*distance,
    z:.25+random()*.75,layer:Math.floor(random()*3),phase:random()*Math.PI*2};
  });
 };
 const draw=()=>{
  ctx.clearRect(0,0,width,height);
  const still=reduced.matches;
  const depth=still?0:1-Math.exp(-Math.max(0,scroll)/height*.65);
  const px=still?0:pointer.x,py=still?0:pointer.y;
  const travel=still?0:scroll/height;
  // The cloud layer follows the same input at a slower depth than the stars.
  const dx=Math.sin(time*.09)*6+px*12,dy=Math.cos(time*.07)*5-py*9-Math.sin(travel*.35)*8;
  ctx.drawImage(sky,-30+dx,-30+dy,width+60,height+60);
  const spin=still?0:time*(mobile.matches?.016:.012)+travel*.065;
  const mouseX=(px+1)*width/2,mouseY=(py+1)*height/2;
  for(let layer=0;layer<3;layer++){
   const angle=spin*(.5+layer*.35),cos=Math.cos(angle),sin=Math.sin(angle);
   for(const star of stars){
    if(star.layer!==layer)continue;
    const zoom=1+depth*.07*star.z;
    let x=width/2+(star.x*cos-star.y*sin)*zoom+px*(12+star.z*30);
    let y=height/2+(star.x*sin+star.y*cos)*zoom+py*(10+star.z*23)-Math.sin(travel*.4)*star.z*20;
    if(pointer.active&&!still&&!mobile.matches){
     const vx=x-mouseX,vy=y-mouseY,distance=Math.hypot(vx,vy);
     if(distance>0&&distance<135){
      const force=(1-distance/135)**2*22*star.z;
      x+=vx/distance*force;y+=vy/distance*force;
     }
    }
    if(x<-3||x>width+3||y<-3||y>height+3)continue;
    ctx.fillStyle=`rgba(221,240,231,${.18+star.z*.36+Math.sin(time*.8+star.phase)*.08})`;
    ctx.beginPath();ctx.arc(x,y,.35+star.z*.9,0,Math.PI*2);ctx.fill();
   }
  }
  for(const p of planets){
   const size=p.side*(1+depth*.24);
   const x=p.x*width+px*24*p.z+Math.sin(time*.15+p.z)*7;
   const y=p.y*height+py*18*p.z-Math.sin(travel*.5)*15*p.z;
   ctx.save();ctx.translate(x,y);ctx.rotate(still?0:Math.sin(time*.12+travel*.16)*.1);
   ctx.drawImage(p.sprite,-size/2,-size/2,size,size);ctx.restore();
  }
 };
 const tick=stamp=>{
  frame=0;
  if(document.hidden||reduced.matches||dragging){last=0;return;}
  frame=requestAnimationFrame(tick);
  if(last&&stamp-last<33)return;
  const dt=last?Math.min(stamp-last,80):33;last=stamp;time+=dt/1000;
  const ease=1-Math.exp(-dt/140);
  scroll+=(target-scroll)*ease;
  pointer.x+=(pointer.tx-pointer.x)*ease;pointer.y+=(pointer.ty-pointer.y)*ease;
  draw();
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
 // Read input only; a single capped animation loop handles all rendering.
 addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||mobile.matches||reduced.matches)return;
  pointer.tx=Math.max(-1,Math.min(1,e.clientX/width*2-1));
  pointer.ty=Math.max(-1,Math.min(1,e.clientY/height*2-1));pointer.active=true;start();
 },{passive:true});
 const centrePointer=()=>{pointer.tx=pointer.ty=0;pointer.active=false;};
 document.documentElement.addEventListener('pointerleave',centrePointer,{passive:true});
 addEventListener('blur',centrePointer);

 document.addEventListener('visibilitychange',()=>{last=0;start();});
 reduced.addEventListener('change',()=>{last=0;draw();start();});
 document.addEventListener('pointerdown',e=>{if(e.target.closest('.compare'))dragging=true;},{passive:true});
 const resume=()=>{dragging=false;start();};
 document.addEventListener('pointerup',resume,{passive:true});document.addEventListener('pointercancel',resume,{passive:true});
 resize();
})();