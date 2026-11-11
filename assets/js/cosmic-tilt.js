(() => {
 'use strict';
 // Sensor events only update targets; the galaxy's single animation loop renders them.
 const coarse=matchMedia('(pointer:coarse)'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const Sensor=window.DeviceOrientationEvent;
 if(!coarse.matches||!Sensor||!window.isSecureContext)return;
 const state=window.heifTilt={x:0,y:0,active:false};
 let origin=null,listening=false,enabled=false,pending=false,received=false,timeout=0;
 const button=document.createElement('button');button.type='button';button.className='cosmic-tilt-toggle';
 button.textContent='Enable tilt';button.setAttribute('aria-pressed','false');
 const mount=()=>{
  const intro=document.querySelector('.cosmic-entry');
  const parent=document.documentElement.classList.contains('cosmic-intro-open')&&intro?intro:document.querySelector('footer');
  if(parent)parent.appendChild(button);
 };
 const save=value=>{try{sessionStorage.setItem('heif-tilt',value);}catch{}};
 const preference=()=>{try{return sessionStorage.getItem('heif-tilt');}catch{return null;}};
 const reset=()=>{origin=null;state.x=state.y=0;state.active=false;};
 const angle=()=>Number(screen.orientation?.angle??window.orientation??0);
 const delta=(value,base,period)=>((value-base+period*1.5)%period)-period*.5;
 const clamp=value=>Math.max(-1,Math.min(1,value));
 const deadzone=value=>Math.abs(value)<.025?0:Math.sign(value)*(Math.abs(value)-.025)/.975;
 const read=e=>{
  if(!enabled||document.hidden||reduced.matches||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;
  received=true;clearTimeout(timeout);
  const rotation=angle();
  if(!origin||origin.rotation!==rotation){origin={beta:e.beta,gamma:e.gamma,rotation};state.x=state.y=0;}
  const dx=delta(e.gamma,origin.gamma,180),dy=delta(e.beta,origin.beta,360),r=rotation*Math.PI/180;
  state.x=deadzone(clamp((dx*Math.cos(r)+dy*Math.sin(r))/22));
  state.y=deadzone(clamp((dy*Math.cos(r)-dx*Math.sin(r))/24));
  if(!state.active){
   button.textContent='Tilt on';button.setAttribute('aria-pressed','true');
   button.title='Turn off phone tilt movement';
  }
  state.active=true;
 };
 const stop=()=>{
  enabled=false;clearTimeout(timeout);reset();
  if(listening){removeEventListener('deviceorientation',read);listening=false;}
  button.textContent='Enable tilt';button.setAttribute('aria-pressed','false');
 };
 const start=()=>{
  enabled=true;received=false;reset();
  if(!listening){addEventListener('deviceorientation',read,{passive:true});listening=true;}
  button.textContent='Tilt phone';button.setAttribute('aria-pressed','false');
  clearTimeout(timeout);timeout=setTimeout(()=>{
   if(!received){stop();button.textContent='Try tilt';button.title='Motion data unavailable. Automatic movement is still on.';}
  },5000);
 };
 button.addEventListener('click',async()=>{
  if(pending)return;
  if(enabled){stop();save('off');return;}
  pending=true;button.disabled=true;
  try{
   if(typeof Sensor.requestPermission==='function'){
    // Call directly in the tap handler: iOS requires a user gesture.
    const permission=await Sensor.requestPermission();
    if(permission!=='granted'){button.textContent='Tilt blocked';button.title='Allow motion access in your browser to enable tilt.';return;}
   }
   save('on');start();
  }catch{button.textContent='Try tilt';button.title='Motion access unavailable. Automatic movement is still on.';}
  finally{pending=false;button.disabled=false;}
 });
 const sync=()=>{
  button.hidden=reduced.matches;
  if(reduced.matches){stop();return;}
  if(preference()!=='off'&&(typeof Sensor.requestPermission!=='function'||preference()==='on'))start();
 };
 addEventListener('orientationchange',reset,{passive:true});
 screen.orientation?.addEventListener('change',reset);
 document.addEventListener('visibilitychange',()=>{reset();if(!document.hidden&&enabled)start();});
 addEventListener('pagehide',reset);addEventListener('pageshow',reset);
 addEventListener('heif:entered',()=>{reset();mount();});
 reduced.addEventListener('change',sync);
 mount();sync();
})();
