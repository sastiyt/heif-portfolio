(() => {
 const playIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
 const setup = () => document.querySelectorAll('.video-item').forEach(item => {
  const video=item.querySelector('video'), button=item.querySelector('.play-btn'), surface=item.querySelector('.video-thumbnail');
  if(!video || !button || !surface) return;
  video.preload='none';
  const reset=()=>{item.classList.remove('is-playing','show-controls');button.innerHTML=playIcon;button.setAttribute('aria-label','Play video');button.classList.remove('loading');};
  const toggle=async()=>{
   if(!video.paused){video.pause();return;}
   document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();});
   if(!video.getAttribute('src') && video.dataset.src){video.src=video.dataset.src;video.load();}
   button.classList.add('loading');
   try {await video.play();item.classList.add('is-playing','show-controls');button.innerHTML='Ⅱ';button.setAttribute('aria-label','Pause video');}
   catch {reset();button.setAttribute('aria-label','Playback failed. Try again');}
   finally {button.classList.remove('loading');}
  };
  button.addEventListener('click',event=>{event.stopPropagation();toggle();});
  surface.addEventListener('click',event=>{if(!event.target.closest('button'))toggle();});
  video.addEventListener('pause',reset);video.addEventListener('ended',reset);video.addEventListener('error',reset);
 });
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',setup):setup();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());});
})();
