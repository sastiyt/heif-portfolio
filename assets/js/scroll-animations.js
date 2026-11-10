(() => {
 'use strict';
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 const setup = () => {
  // Real columns avoid WebKit's fragmented multicolumn/transform paint gaps.
  // Keep the source items so a breakpoint change restores the original order.
  const mobile = matchMedia('(max-width: 600px)');
  const galleries = [...document.querySelectorAll('.masonry-container, .image-showcase .mobile-pair-gallery')]
   .map(container => ({container, items:[...container.children].filter(el => el.classList.contains('image-item'))}));
  const layoutGalleries = () => galleries.forEach(({container,items}) => {
   if (!items.length) return;
   if (!mobile.matches) {
    if (!container.classList.contains('mobile-masonry')) return;
    items.forEach(el => container.appendChild(el));
    container.querySelectorAll('.gallery-column').forEach(el => el.remove());
    container.classList.remove('mobile-masonry');
    return;
   }
   if (container.classList.contains('mobile-masonry')) return;
   const columns = [0,1].map(() => {
    const column = document.createElement('div'); column.className='gallery-column';
    container.appendChild(column); return column;
   });
   container.classList.add('mobile-masonry');
   // Poster aspect ratios vary greatly. Place each card in the shorter column,
   // using its reserved image dimensions and rendered caption height.
   const heights = [0,0];
   const balance = container.classList.contains('poster-gallery');
   items.forEach((el,index) => {
    const column = balance ? (heights[0] <= heights[1] ? 0 : 1) : index % 2;
    columns[column].appendChild(el);
    heights[column] += el.offsetHeight + 10;
   });
  });
  layoutGalleries();
  mobile.addEventListener('change',layoutGalleries);
  document.querySelectorAll('main .image-item, main .thumbnail').forEach(el => {
   if (!el.querySelector('img') || el.querySelector('video, iframe')) return;
   el.classList.add('artwork-motion');
   if (el.querySelector('.compare')) el.classList.add('artwork-compare');
  });
  const elements = [...document.querySelectorAll('.reveal, .skill-item, .contact-item, .video-item, .image-item, .thumbnail, .portfolio-intro > *, main .page-title:not(.portfolio-intro), .image-showcase > h2')];
  // Visible is the permanent state. An observer or animation failure cannot hide work.
  elements.forEach(el => { el.classList.add('reveal','visible'); el.classList.remove('reveal-pending'); });
  const images = [...document.querySelectorAll('main .image-item img, main .thumbnail img, main .about-portrait img')];
  if (!('IntersectionObserver' in window)) { images.forEach(img => { img.loading='eager'; }); return; }
  const loading = new IntersectionObserver(entries => entries.forEach(entry => {
   if (entry.isIntersecting) { entry.target.loading='eager'; loading.unobserve(entry.target); }
  }), {rootMargin:'280px 0px'});
  images.forEach(img => loading.observe(img));
  if (motion.matches || !Element.prototype.animate) return;
  const active = new Map();
  const pending = new Set();
  let frame = 0;
  let nextStart = 0;
  const finish = el => {
   pending.delete(el);
   observer.unobserve(el);
   el.classList.remove('scroll-reveal-ready');
   const running = active.get(el);
   if (running) { clearTimeout(running.timer); running.animation.cancel(); }
   active.delete(el);
  };
  const reveal = (el, delay = 0) => {
   if (!pending.has(el) || document.hidden) return;
   const rect = el.getBoundingClientRect();
   if (motion.matches || rect.bottom <= 0) { finish(el); return; }
   pending.delete(el);
   observer.unobserve(el);
   try {
    // Start immediately: awaiting image decode here caused visible cards to flash off.
    const animation = el.animate([
     {opacity:0, transform:mobile.matches?'translateY(18px)':'translateY(24px)'},
     {opacity:1, transform:'translateY(0)'}
    ], {duration:660, delay, easing:'cubic-bezier(.22,.61,.36,1)', fill:'both'});
    const timer = setTimeout(() => finish(el), delay + 1000);
    active.set(el, {animation,timer});
    el.classList.remove('scroll-reveal-ready');
    animation.finished.catch(() => {}).finally(() => {
     if (active.get(el)?.animation === animation) finish(el);
    });
   } catch (_) { finish(el); }
  };
  // Both observer and scroll fallback feed one queue, so the fallback cannot
  // bypass the stagger and reveal both columns at once.
  const observer = new IntersectionObserver(() => schedule(),
   {threshold:0, rootMargin:'0px 0px -24px 0px'});
  const checkVisible = () => {
   frame = 0;
   if (document.hidden) return;
   images.forEach(img => {
    if (img.loading !== 'lazy') return;
    const rect=img.getBoundingClientRect();
    if (rect.top < innerHeight + 350 && rect.bottom > -100) img.loading='eager';
   });
   const near = [];
   pending.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom <= 0) finish(el);
    else if (rect.top < innerHeight - 24) near.push({el,rect});
   });
   near.sort((a,b) => Math.round(a.rect.top/32)-Math.round(b.rect.top/32) || a.rect.left-b.rect.left);
   const now = performance.now();
   near.forEach(({el}) => {
    const delay = Math.min(Math.max(0,nextStart-now),550);
    reveal(el,delay);
    nextStart = now + delay + (mobile.matches ? 130 : 90);
   });
  };
  // A cheap fallback handles fast scrolling, resizing and restored/background tabs.
  const schedule = () => {
   if (!frame) frame = requestAnimationFrame(checkVisible);
  };
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('pageshow', schedule);
  const finishAll = () => {
   [...pending, ...active.keys()].forEach(finish);
  };
  motion.addEventListener('change', () => { if (motion.matches) finishAll(); });
  window.addEventListener('beforeprint', finishAll);
  document.addEventListener('visibilitychange', () => {
   if (document.hidden) [...active.keys()].forEach(finish);
   else schedule();
  });
  document.addEventListener('focusin', event => {
   pending.forEach(el => { if (el.contains(event.target)) finish(el); });
  });
  mobile.addEventListener('change',() => { finishAll(); schedule(); });
  // Already-visible content stays visible. Each off-screen card fades up only once.
  try {
   elements.forEach(el => {
    if (el.matches('.hero h1') || el.getBoundingClientRect().top < innerHeight) return;
    pending.add(el);
    observer.observe(el);
    el.classList.add('scroll-reveal-ready');
   });
   schedule();
  } catch (_) { finishAll(); }
 };
 document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded',setup,{once:true}) : setup();
})();
