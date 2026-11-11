(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const gallery=document.querySelector('.poster-gallery');
 let dialog=null,returnFocus=null;
 function modal(title){
  const d=document.createElement('dialog');d.className='art-dialog';
  const head=document.createElement('div');head.className='art-dialog-head';
  const h=document.createElement('h2');h.id='art-dialog-title';h.textContent=title;
  const close=document.createElement('button');close.type='button';close.className='art-close';close.textContent='×';close.setAttribute('aria-label','Close preview');
  head.append(h,close);d.append(head);d.setAttribute('aria-labelledby',h.id);document.body.append(d);
  close.addEventListener('click',()=>d.close());
  d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
  d.addEventListener('close',()=>{document.documentElement.classList.remove('art-modal-open');returnFocus?.focus({preventScroll:true});});
  return d;
 }
 function open(d){returnFocus=document.activeElement;d.showModal();document.documentElement.classList.add('art-modal-open');}
 function button(text,fn){const b=document.createElement('button');b.type='button';b.className='explorer-button';b.textContent=text;b.addEventListener('click',fn);return b;}
 if(gallery){
  const items=[...gallery.querySelectorAll('.image-item img')].map(img=>({src:img.getAttribute('src'),title:img.closest('.image-item').querySelector('.poster-project-name')?.textContent||'From the HEIF archive',alt:img.alt}));
  let current=-1,busy=false,lensOn=false,lensMode=false,stage,img,lens,status,title,lensButton,next,rect,frame=0,point={x:.5,y:.5};
  const tools=document.createElement('div');tools.className='explorer-tools';
  const hint=document.createElement('p');hint.className='explorer-hint';hint.textContent='A little discovery. A closer look.';
  const surprise=button('Surprise me ↗',()=>showRandom());
  const mode=button('HEIF Lens',()=>{lensMode=!lensMode;mode.setAttribute('aria-pressed',String(lensMode));hint.textContent=lensMode?'Choose a poster to explore its details.':'A little discovery. A closer look.';});mode.setAttribute('aria-pressed','false');
  tools.append(surprise,mode,hint);gallery.before(tools);
  function paintLens(){
   frame=0;if(!lensOn||!img.complete||!img.naturalWidth)return;
   rect=stage.getBoundingClientRect();const size=lens.offsetWidth;
   const x=Math.max(size/2,Math.min(rect.width-size/2,point.x*rect.width));
   const y=Math.max(size/2,Math.min(rect.height-size/2,point.y*rect.height));
   const zoom=2.25;
   lens.style.left=`${Math.max(0,x-size/2)}px`;lens.style.top=`${Math.max(0,y-size/2)}px`;
   lens.style.backgroundSize=`${rect.width*zoom}px ${rect.height*zoom}px`;
   lens.style.backgroundPosition=`${size/2-x*zoom}px ${size/2-y*zoom}px`;
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paintLens);}
  function setLens(on){lensOn=on;stage.classList.toggle('lens-enabled',on);lensButton.setAttribute('aria-pressed',String(on));lensButton.textContent=on?'Lens on · 2.25×':'HEIF Lens · 2.25×';status.textContent=on?'Drag on the artwork. Arrow keys move the lens.':'Full artwork · use HEIF Lens for a closer look.';schedule();}
  function build(){
   if(dialog)return;dialog=modal('Artwork');title=dialog.querySelector('h2');
   stage=document.createElement('div');stage.className='art-stage';stage.tabIndex=0;stage.setAttribute('aria-label','Artwork detail viewer. Enable the lens, then drag or use arrow keys.');
   img=document.createElement('img');img.decoding='async';lens=document.createElement('div');lens.className='art-lens';lens.setAttribute('aria-hidden','true');stage.append(img,lens);
   const actions=document.createElement('div');actions.className='explorer-tools';
   lensButton=button('HEIF Lens · 2.25×',()=>setLens(!lensOn));lensButton.setAttribute('aria-pressed','false');
   next=button('Surprise me again ↗',()=>showRandom());actions.append(lensButton,next);
   status=document.createElement('p');status.className='art-status';status.setAttribute('role','status');dialog.append(stage,actions,status);
   let dragging=false;
   const move=e=>{if(!lensOn)return;rect=stage.getBoundingClientRect();point={x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))};schedule();};
   stage.addEventListener('pointerdown',e=>{if(!lensOn)return;dragging=true;stage.setPointerCapture(e.pointerId);move(e);});
   stage.addEventListener('pointermove',e=>{if(dragging||e.pointerType==='mouse')move(e);});
   ['pointerup','pointercancel','lostpointercapture'].forEach(event=>stage.addEventListener(event,()=>dragging=false));
   stage.addEventListener('keydown',e=>{if(!lensOn||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();point.x=Math.max(0,Math.min(1,point.x+(e.key==='ArrowLeft'?-.06:e.key==='ArrowRight'?.06:0)));point.y=Math.max(0,Math.min(1,point.y+(e.key==='ArrowUp'?-.06:e.key==='ArrowDown'?.06:0)));schedule();});
   window.addEventListener('resize',()=>{if(dialog.open)schedule();},{passive:true});
   dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);frame=0;dragging=false;});
  }
  async function show(index,withLens=false){
   if(busy)return;build();if(!dialog.open)open(dialog);busy=true;next.disabled=true;status.textContent='Loading artwork…';
   const item=items[index];const preload=new Image();preload.src=item.src;
   try{
    await preload.decode();
    img.src=item.src;img.alt=item.alt;title.textContent=item.title;current=index;point={x:.5,y:.5};
    lens.style.backgroundImage=`url("${item.src}")`;await img.decode();setLens(withLens||lensOn);
    if(dialog.open&&!reduced.matches)stage.animate([{opacity:0,transform:'translateX(18px)'},{opacity:1,transform:'translateX(0)'}],{duration:330,easing:'cubic-bezier(.22,.61,.36,1)'});
   }catch{status.textContent='This artwork could not load. Try another.';}
   finally{busy=false;next.disabled=false;}
  }
  function showRandom(){if(items.length<1)return;let n=Math.floor(Math.random()*(items.length-(current>=0?1:0)));if(current>=0&&n>=current)n++;show(n);}
  gallery.addEventListener('click',e=>{if(!lensMode)return;const card=e.target.closest('.image-item');if(!card)return;e.preventDefault();e.stopImmediatePropagation();const source=card.querySelector('img').getAttribute('src');show(items.findIndex(item=>item.src===source),true);},true);
  gallery.addEventListener('keydown',e=>{if(!lensMode||!['Enter',' '].includes(e.key))return;const card=e.target.closest('.image-item');if(!card)return;e.preventDefault();e.stopImmediatePropagation();show(items.findIndex(item=>item.src===card.querySelector('img').getAttribute('src')),true);},true);
 }
 const world=document.querySelector('[data-play-world]');
 if(world){let d,v;world.addEventListener('click',()=>{
  if(!d){d=modal('Play my world · 10 seconds');v=document.createElement('video');v.className='world-video';v.controls=true;v.playsInline=true;v.muted=true;v.preload='none';v.poster='assets/optimized/heif-world-cover.webp';v.src='assets/VIDEO EDITING/heif-world.mp4';v.setAttribute('aria-label','Ten-second montage of HEIF music visuals, VFX and motion design');
   const caption=document.createElement('p');caption.className='world-caption';caption.textContent='Feel or Reel · All Day Long · Banger · Devara · Sonic Labs';d.append(v,caption);d.addEventListener('close',()=>v.pause());document.addEventListener('visibilitychange',()=>{if(document.hidden)v.pause();});}
  open(d);v.currentTime=0;v.play().catch(()=>{});
 });}
 const compare=document.getElementById('compare-18');
 if(compare){
  const controls=document.createElement('div');controls.className='palette-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Bridal portrait color switch');
  const label=document.createElement('p');label.textContent='BRIDAL PORTRAIT · CHOOSE THE LOOK';controls.append(label);
  const input=compare.querySelector('input');const options=[['Original',100,''],['Warm edit',0,'warm'],['Compare',30,null]];
  options.forEach(([name,value,swatch])=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed',String(name==='Compare'));if(swatch!==null){const dot=document.createElement('span');dot.className=`palette-dot ${swatch}`;dot.setAttribute('aria-hidden','true');b.prepend(dot);}b.addEventListener('click',()=>{controls.querySelectorAll('button').forEach(btn=>btn.setAttribute('aria-pressed',String(btn===b)));compare.classList.toggle('palette-full',name!=='Compare');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));});controls.append(b);});
  compare.after(controls);
 }
})();
