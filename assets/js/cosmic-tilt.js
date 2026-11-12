(() => {
 'use strict';
 // Sensor events only update targets; the galaxy's single animation loop renders them.
 const coarse=matchMedia('(pointer:coarse)'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const Sensor=window.DeviceOrientationEvent;
 if(!coarse.matches||!Sensor||!window.isSecureContext)return;
 const state=window.heifTilt={x:0,y:0,active:false,automatic:false};
 let previous=null,travelX=0,travelY=0;
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
 let prompt=null;
 const dismissPrompt=()=>{if(prompt){prompt.close();prompt.remove();prompt=null;}};
 const reset=()=>{origin=previous=null;travelX=travelY=0;state.x=state.y=0;state.active=false;};
 const angle=()=>Number(screen.orientation?.angle??window.orientation??0);
 const delta=(value,base,period)=>((value-base+period*1.5)%period)-period*.5;
 const clamp=value=>Math.max(-1,Math.min(1,value));
 const deadzone=value=>Math.abs(value)<.025?0:Math.sign(value)*(Math.abs(value)-.025)/.975;
 const read=e=>{
  if(!enabled||document.hidden||reduced.matches||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma)||Math.abs(e.beta)>180||Math.abs(e.gamma)>90)return;
  received=true;clearTimeout(timeout);
  const rotation=angle();
  if(!origin||origin.rotation!==rotation){
   origin={rotation};previous={beta:e.beta,gamma:e.gamma};travelX=travelY=0;state.x=state.y=0;
  }
  // Unwrap successive samples instead of wrapping against the initial grip.
  // Euler angle flips near vertical must not fling the background across the screen.
  const stepX=delta(e.gamma,previous.gamma,180),stepY=delta(e.beta,previous.beta,360);
  previous={beta:e.beta,gamma:e.gamma};
  if(Math.abs(stepX)>60||Math.abs(stepY)>75)return;
  travelX+=stepX;travelY+=stepY;
  const r=rotation*Math.PI/180;
  state.x=deadzone(clamp((travelX*Math.cos(r)+travelY*Math.sin(r))/16));
  state.y=deadzone(clamp((travelY*Math.cos(r)-travelX*Math.sin(r))/18));
  if(!state.active){
   button.textContent='Tilt on';button.setAttribute('aria-pressed','true');
   button.title='Turn off phone tilt movement';
  }
  state.active=true;
 };
 const stop=()=>{
  enabled=false;state.automatic=true;clearTimeout(timeout);reset();
  if(listening){removeEventListener('deviceorientation',read);listening=false;}
  button.textContent='Enable tilt';button.setAttribute('aria-pressed','false');
 };
 const start=()=>{
  enabled=true;state.automatic=false;received=false;reset();
  if(!listening){addEventListener('deviceorientation',read,{passive:true});listening=true;}
  button.textContent='Tilt phone';button.setAttribute('aria-pressed','false');
  clearTimeout(timeout);timeout=setTimeout(()=>{
   if(!received){stop();button.textContent='Try tilt';button.title='Motion data unavailable. You can continue exploring the site.';}
  },5000);
 };
 const activate=async(force=false)=>{
  if(pending)return;
  if(enabled&&!force){stop();save('off');return;}
  pending=true;button.disabled=true;
  try{
   if(typeof Sensor.requestPermission==='function'){
    // Call directly in the tap handler: iOS requires a user gesture.
    const permission=await Sensor.requestPermission();
    if(permission!=='granted'){stop();save('off');button.textContent='Tilt blocked';button.title='Allow motion access in your browser to enable tilt.';return;}
   }
   save('on');start();
  }catch{stop();button.textContent='Try tilt';button.title='Motion access unavailable. You can continue exploring the site.';}
  finally{pending=false;button.disabled=false;dismissPrompt();}
 };
 button.addEventListener('click',()=>activate());
 const offerTilt=()=>{
  if(prompt)return;
  prompt=document.createElement('dialog');prompt.className='cosmic-tilt-prompt';
  prompt.setAttribute('aria-labelledby','tilt-prompt-title');
  prompt.innerHTML='<span class="tilt-prompt-label">A DIFFERENT POINT OF VIEW</span><h2 id="tilt-prompt-title">Move your phone.<br><span>Move your world.</span></h2><p>Enable tilt to move the stars and planets with your phone.</p><div class="tilt-prompt-actions"><button type="button" data-tilt-accept>Enable tilt</button><button type="button" data-tilt-skip>Not now</button></div>';
  prompt.querySelector('[data-tilt-accept]').addEventListener('click',()=>activate(true));
  prompt.querySelector('[data-tilt-skip]').addEventListener('click',()=>{save('off');stop();dismissPrompt();});
  prompt.addEventListener('cancel',e=>{e.preventDefault();save('off');stop();dismissPrompt();});
  document.body.appendChild(prompt);prompt.showModal();
 };
 const sync=()=>{
  button.hidden=reduced.matches;
  if(reduced.matches){stop();dismissPrompt();return;}
  if(preference()===null){offerTilt();return;}
  if(preference()==='on')start();else stop();
 };
 addEventListener('orientationchange',reset,{passive:true});
 screen.orientation?.addEventListener('change',reset);
 document.addEventListener('visibilitychange',()=>{reset();if(!document.hidden&&enabled)start();});
 addEventListener('pagehide',reset);addEventListener('pageshow',reset);
 addEventListener('heif:entered',()=>{reset();mount();});
 reduced.addEventListener('change',sync);
 mount();sync();
})();
