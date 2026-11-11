/**
 * HEIF Artist - 3D Hero Interactions
 * Uses Three.js + GSAP ScrollTrigger to render and animate the photoshop.obj file
 */

(() => {
    // 1. Setup Three.js Scene
    const container = document.getElementById('hero-3d-model');
    if (!container || !window.THREE || !THREE.GLTFLoader || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const scene = new THREE.Scene();

    // Transparent background so the stars show through
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 12;

    // 2. Lighting (Cinematic Studio Setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5); // Boosted base brightness
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 4.0); // Stronger key light
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x1ec24d, 2.0); // Boosted HEIF green fill
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 2.0); // Added rim light
    backLight.position.set(0, 5, -5);
    scene.add(backLight);

    // 3. Load the 3D Model
    let heroModel;

    const loader = new THREE.GLTFLoader();
    loader.load(
        'assets/3d/photoshop.glb',
        (gltf) => {
            heroModel = gltf.scene;

            // Apply premium metallic and emissive reflections to the native Blender materials
            heroModel.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Boost metalness and lower roughness for the shiny glass/metal look
                    child.material.metalness = 0.8;
                    child.material.roughness = 0.15;

                    // Add the deep blue emissive glow back
                    child.material.emissive = new THREE.Color(0x0a1a3a);
                    child.material.emissiveIntensity = 0.7;

                    child.material.needsUpdate = true;
                }
            });

            // Center the model geometry
            const box = new THREE.Box3().setFromObject(heroModel);
            const center = box.getCenter(new THREE.Vector3());
            heroModel.position.x += (heroModel.position.x - center.x);
            heroModel.position.y += (heroModel.position.y - center.y);
            heroModel.position.z += (heroModel.position.z - center.z);

            // Initial rotation
            heroModel.rotation.x = 0.2;
            heroModel.rotation.y = -0.5;

            // Create a wrapper group to prevent GSAP and Mouse Parallax from fighting over transforms
            window.heroModelWrapper = new THREE.Group();
            window.heroModelWrapper.add(heroModel);
            scene.add(window.heroModelWrapper);

            // Set initial responsive scale and position
            updateModelScaleAndPosition();

            // Trigger animations once loaded
            initAnimations();
        },
        undefined,
        (error) => console.error('Error loading Ps model:', error)
    );

    // Handle Responsive 3D Geometry
    function updateModelScaleAndPosition() {
        const width = window.innerWidth;

        // Photoshop Model
        if (heroModel && window.heroModelWrapper) {
            // Center the model cleanly at 0,0 locally because CSS already positioned the canvas exactly where the user wants
            window.heroModelWrapper.userData.baseX = 0;
            window.heroModelWrapper.userData.baseY = 0;

            if (width < 768) {
                // Mobile
                heroModel.scale.set(8, 8, 8);
            } else if (width < 1024) {
                // Tablet
                heroModel.scale.set(12, 12, 12);
            } else {
                // Desktop
                heroModel.scale.set(15, 15, 15);
            }
        }
    }

    // 4. Handle Resizing
    function resize() {
        if (!container) return;
        const width = container.clientWidth;
        const height = Math.max(1, container.clientHeight);

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        updateModelScaleAndPosition();
    }

    window.addEventListener('resize', resize);
    resize();

    // 5. Mouse Interactivity Variables
    let mouseX = 0;
    let mouseY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - window.innerWidth / 2);
        mouseY = (event.clientY - window.innerHeight / 2);
    });

    // 6. Animation Loop (Mouse Parallax & Smoothing)
    function animate() {
        requestAnimationFrame(animate);
        const bounds = container.getBoundingClientRect();
        if (document.hidden || bounds.bottom < 0 || bounds.top > innerHeight) return;

        // Target rotations and positions based on mouse
        const targetRotY = (mouseX * 0.0005);
        const targetRotX = (mouseY * 0.0005);
        const targetPosX = (mouseX * 0.002);
        const targetPosY = -(mouseY * 0.002);

        // Apply mouse interaction to Photoshop wrapper
        if (window.heroModelWrapper) {
            const wrapper = window.heroModelWrapper;
            const baseX = wrapper.userData.baseX || 0;
            const baseY = wrapper.userData.baseY || 0;

            wrapper.rotation.y += 0.05 * (targetRotY - wrapper.rotation.y);
            wrapper.rotation.x += 0.05 * (targetRotX - wrapper.rotation.x);
            wrapper.position.x += 0.05 * ((baseX + targetPosX) - wrapper.position.x);
            wrapper.position.y += 0.05 * ((baseY + targetPosY) - wrapper.position.y);
        }

        renderer.render(scene, camera);
    }
    animate();

    // 7. GSAP ScrollTrigger Integration
    function initAnimations() {
        if (!window.gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);

        if (heroModel) {
            // Animate as user scrolls past the hero section
            gsap.to(heroModel.rotation, {
                y: -0.2, // Subtle tilt instead of a full spin (was Math.PI * 2)
                x: 0.1,  // Slight tilt up
                ease: "none",
                scrollTrigger: {
                    trigger: ".hero",
                    start: "top top",
                    end: "bottom top",
                    scrub: 1 // Smooth scrubbing
                }
            });

            gsap.to(heroModel.position, {
                z: -5, // Move slightly back into screen
                y: 2,  // Move up
                ease: "none",
                scrollTrigger: {
                    trigger: ".hero",
                    start: "top top",
                    end: "bottom top",
                    scrub: 1
                }
            });
        }
    }
})();
