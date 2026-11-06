const hoverTexts = document.querySelectorAll(".hover-text"),
  hoverImage1 = document.getElementById("hover-image-1"),
  hoverImage2 = document.getElementById("hover-image-2"),
  hoverImage3 = document.getElementById("hover-image-3");
let hoverTimers = {};
hoverTexts.length > 0 &&
  hoverTexts.forEach((e, t) => {
    const n = 0 === t ? hoverImage1 : 1 === t ? hoverImage2 : hoverImage3;
    n &&
      (e.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimers[t]);
        n.style.display = "block";
      }),
      e.addEventListener("mousemove", (e) => {
        const l = n.offsetWidth || n.clientWidth;
        let o = e.pageX - l / 2;
        let i = e.pageY + 15; // Offset to prevent cursor overlap
        (o < 8 && (o = 8),
          o + l > window.innerWidth - 8 && (o = window.innerWidth - l - 8),
          (n.style.transform = `translate(${o}px, ${i}px)`));
      }),
      e.addEventListener("mouseleave", () => {
        hoverTimers[t] = setTimeout(() => {
          n.style.display = "none";
        }, 150);
      }));
  });
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
