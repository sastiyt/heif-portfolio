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
 const tilt={x:0,y:0};
 let planets=[],stars=[],rasterRatio=1,flight=0;
 const textures={};
 const entryMarks={};
 const loadEntryMarks=()=>{
  if(!introOpen())return;
  for(const name of ['ps','ae']){
   const img=new Image();img.decoding='async';
   img.onload=()=>{entryMarks[name]=img;draw();};
   img.src='assets/img/space/entry-clean-'+name+'.webp';
  }
 };
 const introOpen=()=>document.documentElement.classList.contains('cosmic-intro-open');
 const obstacles=[...document.querySelectorAll('#hero-3d-model,#ae-3d-model')];
 const loadMap=name=>new Promise((resolve,reject)=>{
  const img=new Image();img.onload=()=>{
   const tile=document.createElement('canvas');tile.width=img.naturalWidth;tile.height=img.naturalHeight;
   const c=tile.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);
   resolve({data:c.getImageData(0,0,tile.width,tile.height).data,w:tile.width,h:tile.height});
  };img.onerror=reject;img.src='assets/img/space/'+name+'.webp';
 });
 const project=(map,cloud,kind)=>{
  const size=kind==='earth'?384:192,half=size/2;
  const surface=document.createElement('canvas');surface.width=surface.height=size;
  const c=surface.getContext('2d'),out=c.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const nx=(x+.5-half)/half,ny=(y+.5-half)/half,rr=nx*nx+ny*ny;
   if(rr>=1)continue;
   const nz=Math.sqrt(1-rr),u=((Math.atan2(nx,nz)/Math.PI/2+.52)%1+1)%1,v=.5+Math.asin(ny)/Math.PI;
   const at=(Math.min(map.h-1,Math.floor(v*map.h))*map.w+Math.floor(u*map.w))*4;
   const dest=(y*size+x)*4,light=.12+.88*Math.max(0,-nx*.45-ny*.35+nz*.82);
   let clouds=0;
   if(cloud){const ci=(Math.min(cloud.h-1,Math.floor(v*cloud.h))*cloud.w+Math.floor(u*cloud.w))*4;clouds=Math.pow(cloud.data[ci]/255,1.3)*.85;}
   for(let channel=0;channel<3;channel++){
    const value=map.data[at+channel]*(1-clouds)+242*clouds;
    const rim=kind==='earth'?Math.pow(1-nz,4)*[14,42,75][channel]:0;
    out.data[dest+channel]=Math.min(255,value*light+rim);
   }
   out.data[dest+3]=Math.min(255,(1-Math.sqrt(rr))*half*255);
  }
  c.putImageData(out,0,0);return surface;
 };
 const loadTextures=async()=>{
  const tasks=[['earth','earth_daymap'],['saturn','saturn'],['mars','mars'],['neptune','neptune']];
  await Promise.all(tasks.map(async([kind,name])=>{
   try{
    const [map,cloud]=await Promise.all([loadMap(name),kind==='earth'?loadMap('earth_clouds'):null]);
    textures[kind]=project(map,cloud,kind);
    const p=planets.find(p=>p.kind===kind);if(p)paintSprite(p);draw();
   }catch{/* The shaded sphere remains usable when a texture cannot load. */}
  }));
 };
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
 const planet=(paint,x,y,r,rings,kind)=>{
  paint.save();paint.translate(x,y);paint.rotate(-.3);
  // The ring sits behind a shaded sphere, then its front arc crosses the foreground.
  const ring=()=>{paint.strokeStyle='rgba(153,171,149,.24)';paint.lineWidth=r*.13;paint.beginPath();paint.ellipse(0,0,r*1.8,r*.45,0,0,Math.PI*2);paint.stroke();};
  if(rings)ring();
  glow(paint,0,0,r*1.18,rings?'104,139,122':'100,153,170',.18);
  paint.save();paint.beginPath();paint.arc(0,0,r,0,Math.PI*2);paint.clip();
  const sphere=paint.createRadialGradient(-r*.42,-r*.45,r*.04,r*.35,r*.22,r*1.35);
  const colours=kind==='earth'?['#5699bb','#164c79']:kind==='mars'?['#b27855','#623c2a']:kind==='neptune'?['#577ca1','#263b66']:['#827b63','#3a4637'];
  sphere.addColorStop(0,colours[0]);sphere.addColorStop(.38,colours[1]);sphere.addColorStop(.78,'#050c0c');sphere.addColorStop(1,'#020505');
  paint.fillStyle=sphere;paint.fillRect(-r,-r,2*r,2*r);
  if(textures[kind])paint.drawImage(textures[kind],-r,-r,r*2,r*2);
  paint.restore();
  paint.strokeStyle='rgba(142,189,176,.3)';paint.lineWidth=.65;
  paint.beginPath();paint.arc(0,0,r,Math.PI*.85,Math.PI*1.6);paint.stroke();
  if(rings){paint.strokeStyle='rgba(153,171,149,.3)';paint.lineWidth=r*.10;paint.beginPath();paint.ellipse(0,0,r*1.8,r*.45,0,0,Math.PI);paint.stroke();}
  paint.restore();
 };
 const paintSprite=p=>{
  const ratio=3;p.sprite.width=p.sprite.height=Math.ceil(p.side*ratio);
  const surface=p.sprite.getContext('2d');surface.scale(ratio,ratio);
  planet(surface,p.side/2,p.side/2,p.r,p.rings,p.kind);
 };
 const build=()=>{
  seed=7419;
  // Low-resolution nebula is painted once per resize, never regenerated per frame.
  const ratio=1;
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
  planets=[
   {kind:'earth',r:Math.min(width*.087,height*.09,66),rings:false,z:1.2,phase:-.85,speed:.045,orbit:1},
   {kind:'saturn',r:Math.min(width*.05,height*.05,36),rings:true,z:.8,phase:2.8,speed:.032,orbit:1.05},
   {kind:'mars',r:Math.min(width*.029,height*.03,19),rings:false,z:.6,phase:1.1,speed:.059,orbit:.92},
   {kind:'neptune',r:Math.min(width*.036,height*.035,24),rings:false,z:.7,phase:4,speed:.026,orbit:.83}
  ].map(p=>{p.sprite=document.createElement('canvas');p.side=Math.ceil(p.r*4.6);paintSprite(p);return p;});
  // Overscan the orbital field so rotation cannot leave empty corners.
  const radius=Math.hypot(width,height)*.63;
  stars=Array.from({length:mobile.matches?300:640},()=>{
   const angle=random()*Math.PI*2, distance=Math.sqrt(random())*radius;
   return {x:Math.cos(angle)*distance,y:Math.sin(angle)*distance,
    z:.25+random()*.75,r:.25+Math.pow(random(),3)*(mobile.matches?1.65:2.15),layer:Math.floor(random()*3),phase:random()*Math.PI*2};
  });
 };
 // Asymmetric entry anchors keep every object away from the central button.
 // Each object has a different continuous loop and spin within its own safe area.
 const entryAnchors={
  wide:{earth:[.84,.38],saturn:[.13,.61],mars:[.44,.84],neptune:[.37,.20],ps:[.19,.29],ae:[.73,.74]},
  tall:{earth:[.78,.27],saturn:[.20,.64],mars:[.65,.85],neptune:[.29,.15],ps:[.17,.37],ae:[.77,.65]}
 };
 // Randomize once per visit, never per frame: motion stays smooth and resize-stable.
 const entryMotion=Object.fromEntries(Object.keys(entryAnchors.wide).map(name=>[name,{
  phase:Math.random()*Math.PI*2,
  speed:.23+Math.random()*.16,
  spread:.8+Math.random()*.2,
  spin:(name==='ps'||name==='ae'?.045:.07)+Math.random()*.035,
  direction:Math.random()<.5?-1:1
 }]));
 const entryPosition=(name,px,py,still)=>{
  const [ax,ay]=entryAnchors[height>width?'tall':'wide'][name],motion=entryMotion[name];
  const t=still?0:time*motion.speed,phase=motion.phase;
  const rx=Math.min(width*.042,52)*motion.spread,ry=Math.min(height*.04,34)*motion.spread;
  return {
   x:width*ax+(still?0:(Math.cos(t+phase)*.76+Math.sin(t*1.43+phase)*.24)*rx)+px*8,
   y:height*ay+(still?0:(Math.sin(t*.87+phase)*.78+Math.cos(t*1.31+phase)*.22)*ry)+py*9,
   rotation:still?0:time*motion.spin*motion.direction
  };
 };
 const draw=()=>{
  ctx.clearRect(0,0,width,height);
  const still=reduced.matches;
  const inIntro=introOpen();
  const inputGain=inIntro?1.4:1;
  const depth=still?0:1-Math.exp(-Math.max(0,scroll)/height*.65);
  const px=still?0:Math.max(-1.65,Math.min(1.65,pointer.x*inputGain+tilt.x*1.55));
  const py=still?0:Math.max(-1.65,Math.min(1.65,pointer.y*inputGain+tilt.y*1.55));
  const travel=still?0:scroll/height;
  const warp=still?0:flight;
  const warpScale=1+warp*warp*7;
  ctx.save();ctx.translate(width/2,height/2);ctx.rotate(still?0:tilt.x*.035);ctx.scale(warpScale,warpScale);ctx.translate(-width/2,-height/2);
  // The cloud layer follows the same input at a slower depth than the stars.
  const dx=Math.sin(time*.09)*6+px*12,dy=Math.cos(time*.07)*5-py*9-Math.sin(travel*.6)*22;
  ctx.drawImage(sky,-30+dx,-30+dy,width+60,height+60);
  const spin=still?0:time*(mobile.matches?.055:.03)+travel*(mobile.matches?.22:.16);
  const mouseX=(pointer.x+1)*width/2,mouseY=(pointer.y+1)*height/2;
  for(let layer=0;layer<3;layer++){
   const angle=spin*(.5+layer*.35),cos=Math.cos(angle),sin=Math.sin(angle);
   for(const star of stars){
    if(star.layer!==layer)continue;
    const zoom=1+depth*.16*star.z;
    let x=width/2+(star.x*cos-star.y*sin)*zoom+px*(12+star.z*30);
    let y=height/2+(star.x*sin+star.y*cos)*zoom+py*(10+star.z*23)-Math.sin(travel*.6)*star.z*42;
    if(pointer.active&&!still&&(inIntro||!mobile.matches)){
     const vx=x-mouseX,vy=y-mouseY,distance=Math.hypot(vx,vy);
     if(distance>0&&distance<135){
      const force=(1-distance/135)**2*22*star.z;
      x+=vx/distance*force;y+=vy/distance*force;
     }
    }
    if(x<-3||x>width+3||y<-3||y>height+3)continue;
    ctx.fillStyle=`rgba(221,240,231,${.18+star.z*.36+Math.sin(time*.8+star.phase)*.08})`;
    ctx.beginPath();ctx.arc(x,y,star.r,0,Math.PI*2);ctx.fill();
    if(warp>.02){ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=star.r*.75;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(x-width/2)*warp*.16,y+(y-height/2)*warp*.16);ctx.stroke();}
   }
  }

  const avoid=inIntro?[]:obstacles.filter(el=>el.clientWidth&&el.querySelector('canvas')).map(el=>{
   const b=el.getBoundingClientRect();return {x:b.left+b.width*.5,y:b.top+b.height*.5,r:Math.min(b.width,b.height)*.27};
  });
  for(const [index,p] of planets.entries()){
   const size=p.side*(1+depth*.30);
   // Keep the established main-site motion; the entry uses scattered float positions.
   const orbitAngle=-.6+index*Math.PI/2+(still?0:time*(mobile.matches?.058:.038)+travel*.13);
   const position=inIntro?entryPosition(p.kind,px,py,still):{
    x:width*.5+Math.cos(orbitAngle)*width*.34+px*18,
    y:height*.52+Math.sin(orbitAngle)*height*.32+py*14
   };
   const {x,y}=position;
   ctx.save();ctx.translate(x,y);ctx.rotate(inIntro?position.rotation:(p.kind==='earth'?-.12:Math.sin(orbitAngle)*.13));
   let visibility=1;
   for(const block of avoid){
    const gap=Math.hypot(x-block.x,y-block.y)-block.r-p.r*(1+depth*.3)*(p.rings?1.8:1);
    visibility=Math.min(visibility,Math.max(0,Math.min(1,gap/65)));
   }
   ctx.globalAlpha=(p.kind==='earth'?.96:.76)*visibility;
   ctx.drawImage(p.sprite,-size/2,-size/2,size,size);ctx.restore();
   if(p.kind==='earth'){
    const moonAngle=still?1:time*.24;
    const moonOrbit=p.r*(1+depth*.24)*1.6;
    ctx.fillStyle=`rgba(161,175,183,${.65*visibility})`;ctx.beginPath();
    ctx.arc(x+Math.cos(moonAngle)*moonOrbit,y+Math.sin(moonAngle)*moonOrbit,p.r*.10,0,Math.PI*2);ctx.fill();
   }
  }
  // Cached tool renders share the same canvas without loading 3D models on phones.
  if(inIntro){
   for(const name of ['ps','ae']){
    const img=entryMarks[name];if(!img)continue;
    const {x,y,rotation}=entryPosition(name,px,py,still);
    const size=Math.min(mobile.matches?60:94,width*.16,height*.15);
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
    ctx.globalAlpha=.96;ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();
   }
  }
  ctx.restore();
 };
 let flightStart=0;
 const tick=stamp=>{
  frame=0;
  if(document.hidden||reduced.matches||dragging){last=0;return;}
  frame=requestAnimationFrame(tick);
  const sensor=window.heifTilt;
  const responding=sensor?.active&&(Math.abs(sensor.x-tilt.x)+Math.abs(sensor.y-tilt.y)>.012);
  if(last&&stamp-last<(responding?16:33))return;
  const dt=last?Math.min(stamp-last,80):33;last=stamp;time+=dt/1000;
  if(flightStart)flight=Math.min(1,(stamp-flightStart)/1450);
  const ease=1-Math.exp(-dt/140);
  const tiltEase=1-Math.exp(-dt/85);
  tilt.x+=((sensor?.active?sensor.x:0)-tilt.x)*tiltEase;
  tilt.y+=((sensor?.active?sensor.y:0)-tilt.y)*tiltEase;
  scroll+=(target-scroll)*ease;
  pointer.x+=(pointer.tx-pointer.x)*ease;pointer.y+=(pointer.ty-pointer.y)*ease;
  draw();
 };
 const start=()=>{if(!frame&&!document.hidden&&!reduced.matches&&!dragging)frame=requestAnimationFrame(tick);};
 const pixelRatio=()=>Math.max(1,Math.min((devicePixelRatio||1)*(window.visualViewport?.scale||1),mobile.matches?2:2.5,Math.sqrt((mobile.matches?2200000:3500000)/(width*height))));
 const resize=()=>{
  // Mobile browser chrome expands/collapses while scrolling. Keep one stable
  // backing surface instead of clearing/resizing the canvas on every toolbar tick.
  const nextWidth=document.documentElement.clientWidth;
  const nextHeight=mobile.matches&&!introOpen()?(width===nextWidth&&height>=innerHeight?height:innerHeight+120):innerHeight;
  const sceneChanged=width!==nextWidth||height!==nextHeight;
  width=nextWidth;height=nextHeight;
  const ratio=pixelRatio();
  if(!sceneChanged&&Math.abs(ratio-rasterRatio)<.08)return;
  rasterRatio=ratio;
  canvas.style.width=width+'px';
  canvas.style.height=height+'px';
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);if(sceneChanged)build();draw();start();
 };
 canvas.setAttribute('aria-hidden','true');document.documentElement.classList.add('cosmic-galaxy');
 let resizeTimer;
 const orientationResize=()=>{tilt.x=tilt.y=0;clearTimeout(resizeTimer);requestAnimationFrame(resize);};
 addEventListener('orientationchange',orientationResize,{passive:true});
 screen.orientation?.addEventListener('change',orientationResize);
 addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,180);},{passive:true});
 window.visualViewport?.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,180);},{passive:true});
 addEventListener('scroll',()=>{target=scrollY;start();},{passive:true});
 addEventListener('heif:warp',()=>{if(!reduced.matches){flightStart=performance.now();start();}});
 addEventListener('heif:entered',()=>{flightStart=flight=0;pointer.x=pointer.y=pointer.tx=pointer.ty=0;pointer.active=false;resize();draw();});
 // Read input only; a single capped animation loop handles all rendering.
 addEventListener('pointermove',e=>{
  if(reduced.matches||(!introOpen()&&(e.pointerType!=='mouse'||mobile.matches)))return;
  pointer.tx=Math.max(-1,Math.min(1,e.clientX/width*2-1));
  pointer.ty=Math.max(-1,Math.min(1,e.clientY/height*2-1));pointer.active=true;start();
 },{passive:true});
 const centrePointer=()=>{pointer.tx=pointer.ty=0;pointer.active=false;};
 document.documentElement.addEventListener('pointerleave',centrePointer,{passive:true});
 addEventListener('pointerup',e=>{if(e.pointerType!=='mouse'&&introOpen())centrePointer();},{passive:true});
 addEventListener('pointercancel',centrePointer,{passive:true});
 addEventListener('blur',centrePointer);

 document.addEventListener('visibilitychange',()=>{
  last=0;tilt.x=tilt.y=0;
  if(document.hidden){cancelAnimationFrame(frame);frame=0;}
  else{dragging=false;start();}
 });
 addEventListener('pageshow',()=>{dragging=false;last=0;target=scrollY;resize();start();});
 reduced.addEventListener('change',()=>{last=0;draw();start();});
 document.addEventListener('pointerdown',e=>{if(e.target.closest('.compare'))dragging=true;},{passive:true});
 const resume=()=>{dragging=false;start();};
 document.addEventListener('pointerup',resume,{passive:true});document.addEventListener('pointercancel',resume,{passive:true});
 document.addEventListener('lostpointercapture',resume,{passive:true});
 resize();
 loadTextures();
 loadEntryMarks();
})();
