/**
 * HEIF Artist - After Effects 3D Integration
 */
(() => {
    const container = document.getElementById('ae-3d-model');
    if (!container || !window.THREE || !THREE.GLTFLoader || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const scene = new THREE.Scene();
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 12;

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 4.0);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Purple fill light for After Effects logo
    const fillLight = new THREE.DirectionalLight(0x8a2be2, 2.0);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 2.0);
    backLight.position.set(0, 5, -5);
    scene.add(backLight);

    let aeModel;
    const loader = new THREE.GLTFLoader();

    const loadModel = () => loader.load(
        'assets/3d/after effects.glb',
        (gltf) => {
            aeModel = gltf.scene;

            aeModel.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.metalness = 0.8;
                    child.material.roughness = 0.15;
                    child.material.emissive = new THREE.Color(0x1a0a3a);
                    child.material.emissiveIntensity = 0.7;
                    child.material.needsUpdate = true;
                }
            });

            const box = new THREE.Box3().setFromObject(aeModel);
            const center = box.getCenter(new THREE.Vector3());
            aeModel.position.x += (aeModel.position.x - center.x);
            aeModel.position.y += (aeModel.position.y - center.y);
            aeModel.position.z += (aeModel.position.z - center.z);

            aeModel.rotation.x = 0.2;
            aeModel.rotation.y = -0.5;

            window.aeModelWrapper = new THREE.Group();
            window.aeModelWrapper.add(aeModel);
            scene.add(window.aeModelWrapper);

            updateModelScaleAndPosition();
            initAnimations(aeModel, 0.2, -0.1);
        },
        undefined,
        (error) => console.error('Error loading AE model:', error)
    );

    function updateModelScaleAndPosition() {
        if (!aeModel || !window.aeModelWrapper) return;
        const width = window.innerWidth;

        if (width < 768) {
            // Mobile: push to the right side of the canvas, smaller scale
            aeModel.scale.set(7, 7, 7);
            window.aeModelWrapper.userData.baseX = 2.5;
            window.aeModelWrapper.userData.baseY = 1.5;
        } else if (width < 1024) {
            // Tablet: push to the right side of the canvas
            aeModel.scale.set(8.5, 8.5, 8.5);
            window.aeModelWrapper.userData.baseX = 4;
            window.aeModelWrapper.userData.baseY = 1.5;
        } else {
            // Desktop: far right side next to TRANSFORMING text, tucked up high
            aeModel.scale.set(10, 10, 10);
            window.aeModelWrapper.userData.baseX = 6;
            window.aeModelWrapper.userData.baseY = 1.8;
        }
    }

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

    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - window.innerWidth / 2);
        mouseY = (event.clientY - window.innerHeight / 2);
    });

    let gsapsInitialized = false;
    function initAnimations(model, rotY, rotX) {
        if (!window.gsap || !window.ScrollTrigger) return;
        if (!gsapsInitialized) {
            gsap.registerPlugin(ScrollTrigger);
            gsapsInitialized = true;
        }

        if (model) {
            gsap.to(model.rotation, {
                y: rotY,
                x: rotX,
                ease: "none",
                scrollTrigger: {
                    trigger: ".hero1",
                    start: "top bottom", // Starts animating when hero1 enters bottom of viewport
                    end: "bottom top",
                    scrub: 1
                }
            });
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        const bounds = container.getBoundingClientRect();
        if (document.hidden || bounds.bottom < 0 || bounds.top > innerHeight) return;

        const targetRotY = (mouseX * 0.0005);
        const targetRotX = (mouseY * 0.0005);
        const targetPosX = (mouseX * 0.002);
        const targetPosY = -(mouseY * 0.002);

        if (window.aeModelWrapper) {
            const wrapper = window.aeModelWrapper;
            const baseX = wrapper.userData.baseX || 0;
            const baseY = wrapper.userData.baseY || 0;

            wrapper.rotation.y += 0.05 * ((targetRotY * 1.5) - wrapper.rotation.y); // Slightly deeper rotation
            wrapper.rotation.x += 0.05 * (targetRotX - wrapper.rotation.x);
            // Inverted parallax so it feels like it's floating behind the mouse
            wrapper.position.x += 0.05 * ((baseX - targetPosX) - wrapper.position.x);
            wrapper.position.y += 0.05 * ((baseY - targetPosY) - wrapper.position.y);
        }

        renderer.render(scene, camera);
    }
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); loadModel(); }
        }, { rootMargin: '150px' });
        observer.observe(container);
    } else { loadModel(); }
    animate();
})();
