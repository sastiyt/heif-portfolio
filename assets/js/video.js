(() => {
 const playIcon='<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
 const pauseIcon='<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
 const setup=()=>document.querySelectorAll('.video-item').forEach(item=>{
  const video=item.querySelector('video'),button=item.querySelector('.play-btn'),surface=item.querySelector('.video-thumbnail');
  if(!video||!button||!surface)return;
  let timer,starting=false;
  video.preload='none';
  const hide=()=>{clearTimeout(timer);item.classList.remove('show-controls');};
  const reveal=()=>{if(video.paused)return;clearTimeout(timer);item.classList.add('show-controls');timer=setTimeout(hide,2000);};
  const reset=()=>{hide();item.classList.remove('is-playing');button.innerHTML=playIcon;button.setAttribute('aria-label','Play video');button.classList.remove('loading');};
  const playing=()=>{item.classList.add('is-playing');button.innerHTML=pauseIcon;button.setAttribute('aria-label','Pause video');button.classList.remove('loading');hide();};
  const start=async()=>{
   if(starting)return;
   starting=true;
   document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();});
   if(!video.getAttribute('src')&&video.dataset.src){video.src=video.dataset.src;video.load();}
   button.classList.add('loading');
   try{await video.play();}catch{reset();button.setAttribute('aria-label','Playback failed. Try again');}
   finally{starting=false;button.classList.remove('loading');}
  };
  button.addEventListener('click',event=>{event.stopPropagation();video.paused?start():video.pause();});
  surface.addEventListener('click',event=>{if(event.target.closest('button'))return;video.paused?start():reveal();});
  video.addEventListener('playing',playing);
  video.addEventListener('pause',reset);video.addEventListener('ended',reset);video.addEventListener('error',reset);
 });
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',setup):setup();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());});
})();
