// Photo previews support hover, touch toggling and keyboard activation.
(() => {
 const canHover=matchMedia('(hover:hover) and (pointer:fine)');
 const motion=matchMedia('(prefers-reduced-motion:reduce)');
 const closeAll=[];
 document.querySelectorAll('.hover-text').forEach((trigger,index)=>{
  const preview=document.getElementById('hover-image-'+(index+1));
  const image=preview?.querySelector('img');
  if(!image)return;
  let active=false, pinned=false, point=null;
  trigger.setAttribute('role','button');trigger.tabIndex=0;
  trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',preview.id);
  const hide=()=>{active=false;pinned=false;preview.style.display='none';preview.setAttribute('aria-hidden','true');trigger.setAttribute('aria-expanded','false');};
  closeAll.push(hide);
  const position=()=>{
   const compact=!canHover.matches||pinned;
   const size=compact?Math.min(220,innerWidth-32,innerHeight*.34):Math.min(330,innerWidth-16);
   preview.style.setProperty('width',size+'px','important');preview.style.setProperty('height',size+'px','important');
   const rect=trigger.getBoundingClientRect();
   const x=compact?(innerWidth-size)/2:Math.max(8,Math.min(point.clientX-size/2,innerWidth-size-8));
   const preferred=compact?rect.bottom+12:point.clientY+15;
   const y=preferred+size<innerHeight-12?preferred:Math.max(86,(compact?rect.top-12:point.clientY-15)-size);
   preview.style.transform=`translate(${x}px,${y}px)`;
  };
  const show=()=>{
   if(!active||!image.complete||!image.naturalWidth)return;
   const wasHidden=preview.style.display!=='block';
   position();preview.style.display='block';preview.setAttribute('aria-hidden','false');trigger.setAttribute('aria-expanded','true');
   if(wasHidden&&!motion.matches&&image.animate) image.animate([{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'scale(1)'}],{duration:220,easing:'ease-out'});
  };
  const toggle=()=>{
   const close=active&&pinned;closeAll.forEach(fn=>fn());if(close)return;
   active=true;pinned=true;image.loading='eager';show();
  };
  trigger.addEventListener('pointerenter',event=>{
   if(!canHover.matches||event.pointerType!=='mouse')return;
   closeAll.forEach(fn=>fn());active=true;point=event;image.loading='eager';show();
  });
  trigger.addEventListener('pointermove',event=>{point=event;if(active&&!pinned)position();});
  trigger.addEventListener('pointerleave',()=>{if(!pinned)hide();});
  trigger.addEventListener('click',toggle);
  trigger.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}if(event.key==='Escape')hide();});
  image.addEventListener('load',show);image.addEventListener('error',hide);
  window.addEventListener('scroll',hide,{passive:true});window.addEventListener('resize',hide,{passive:true});
  document.addEventListener('click',event=>{if(!trigger.contains(event.target))hide();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
 });
 const badges=[...document.querySelectorAll('.role-badge')];
 badges.forEach(badge=>{
  badge.setAttribute('role','button');badge.tabIndex=0;badge.setAttribute('aria-pressed','false');
  const toggle=()=>{const enable=!badge.classList.contains('is-active');badges.forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-pressed','false');});if(enable){badge.classList.add('is-active');badge.setAttribute('aria-pressed','true');}};
  badge.addEventListener('click',toggle);
  badge.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}});
 });
})();

const rotatingText = document.querySelector(".rotating-text");
rotatingText &&
  (rotatingText.addEventListener("mouseover", () => {
    rotatingText.style.animationPlayState = "paused";
  }),
  rotatingText.addEventListener("mouseout", () => {
    rotatingText.style.animationPlayState = "running";
  }));
let currentIndex = 0;
const carousel = document.getElementById("carousel"),
  slides = document.querySelectorAll(".slide"),
  totalSlides = slides.length;
if (carousel) {
  function moveSlide(e) {
    ((currentIndex += e),
      currentIndex >= totalSlides && (currentIndex = totalSlides - 1),
      currentIndex < 0 && (currentIndex = 0),
      updateCarousel());
  }
  function updateCarousel() {
    carousel.style.transform = `translateX(-${currentIndex * (100 / totalSlides)}%)`;
  }
  const e = document.querySelector(".prev"),
    t = document.querySelector(".next");
  (e && e.addEventListener("click", () => moveSlide(-1)),
    t && t.addEventListener("click", () => moveSlide(1)));
}
(document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".progress").forEach((e) => {
    const t = e.getAttribute("data-percentage");
    setTimeout(() => {
      e.style.width = t + "%";
    }, 500);
  });
}),
  (function () {
    "use strict";
    const e = document.querySelectorAll(".needs-validation"),
      t = document.getElementById("result");
    Array.prototype.slice.call(e).forEach(function (e) {
      e.addEventListener(
        "submit",
        function (n) {
          if (e.checkValidity()) {
            const o = new FormData(e);
            (n.preventDefault(), n.stopPropagation());
            const l = {};
            o.forEach((e, t) => {
              l[t] = e;
            });
            const s = JSON.stringify(l);
            ((t.innerHTML = "Please wait..."),
              fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: s,
              })
                .then(async (e) => {
                  let n = await e.json();
                  200 == e.status
                    ? ((t.innerHTML = n.message),
                      t.classList.remove("text-gray-500"),
                      t.classList.add("text-green-500"))
                    : ((t.innerHTML = n.message),
                      t.classList.remove("text-gray-500"),
                      t.classList.add("text-red-500"));
                })
                .catch((e) => {
                  t.innerHTML = "Something went wrong!";
                })
                .then(function () {
                  (e.reset(),
                    e.classList.remove("was-validated"),
                    setTimeout(() => {
                      t.style.display = "none";
                    }, 5e3));
                }));
          } else
            (n.preventDefault(),
              n.stopPropagation(),
              e.querySelectorAll(":invalid")[0].focus());
          e.classList.add("was-validated");
        },
        !1,
      );
    });
  })());
const navToggle = document.querySelector(".nav-toggle"),
  navMenu = document.querySelector("header nav ul");
navToggle &&
  navToggle.addEventListener("click", (e) => {
    (e.preventDefault(),
      navToggle.classList.toggle("active"),
      navMenu.classList.toggle("active"),
      navToggle.setAttribute("aria-expanded", String(navMenu.classList.contains("active"))));
  });
const mobileMenuBtn = document.getElementById("mobile-menu-btn"),
  mobileMenu = document.getElementById("mobile-menu"),
  closeMenuBtn = document.getElementById("close-menu-btn");
if (
  (mobileMenuBtn &&
    mobileMenu &&
    mobileMenuBtn.addEventListener("click", (e) => {
      (e.preventDefault(),
        mobileMenu.classList.toggle("translate-x-full"),
        document.body.classList.toggle("overflow-hidden"));
    }),
  closeMenuBtn &&
    mobileMenu &&
    closeMenuBtn.addEventListener("click", () => {
      (mobileMenu.classList.add("translate-x-full"),
        document.body.classList.remove("overflow-hidden"));
    }),
  mobileMenu)
) {
  mobileMenu.querySelectorAll("a").forEach((e) => {
    e.addEventListener("click", () => {
      (mobileMenu.classList.add("translate-x-full"),
        document.body.classList.remove("overflow-hidden"));
    });
  });
}
