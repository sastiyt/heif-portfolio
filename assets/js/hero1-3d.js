/**
 * hero1-3d.js
 * Applies a smooth, 3D mouse parallax interactive tilt to the entire `.hero1` text section.
 */
(() => {
    const parallaxWrapper = document.querySelector('.hero1-parallax-wrapper');
    const heroSection = document.querySelector('.hero1');
    if (!parallaxWrapper || !heroSection || matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;

    // Apply baseline perspective to wrapper so children can tilt 3D
    heroSection.style.perspective = "1000px";
    parallaxWrapper.style.transformStyle = "preserve-3d";

    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
        // Normalize mouse coordinates from -1 to 1 based on window width/height
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;

        // Multiply by degrees of max tilt (e.g., 5 degrees max)
        targetRotY = mouseX * 8; // Left/Right mouse moves the block along Y axis
        targetRotX = -(mouseY * 8); // Up/Down mouse moves the block along X axis (inverted)
    });

    // Device orientation support for mobile (subtle effect)
    window.addEventListener("deviceorientation", (e) => {
        if (!e.gamma || !e.beta) return;
        targetRotY = (e.gamma / 45) * 8; // -45 to 45 degree tilt
        targetRotX = ((e.beta - 45) / 45) * 8;
    });

    // Smooth animation loop using requestAnimationFrame
    function animateParallax() {
        if (document.hidden || heroSection.getBoundingClientRect().bottom < 0 || heroSection.getBoundingClientRect().top > innerHeight) { requestAnimationFrame(animateParallax); return; }
        // Interpolate current rotation towards target
        currentRotX += (targetRotX - currentRotX) * 0.1;
        currentRotY += (targetRotY - currentRotY) * 0.1;

        // Apply 3D transform directly to the unstyled wrapper
        parallaxWrapper.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;

        requestAnimationFrame(animateParallax);
    }

    animateParallax();
})();
