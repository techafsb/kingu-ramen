/**
 * Kingu Ramen — Real Photorealistic 3D GLB Ramen Bowl
 * Loads kingu_spicy_beef_ramen.glb with Three.js + GLTFLoader.
 * 
 * Features:
 * - Authentic Japanese Donburi bowl proportions (wider, shallower bowl matching Image 1)
 * - True 3D Displaced food relief with braised beef, onsen egg, scallions, narutomaki & broth
 * - Perfectly balanced studio lighting (no overexposure or bleached whites)
 * - Full 360° yaw rotation & deep pitch tilt
 * - Smooth camera angle presets (Hero 45°, Top-Down 90°, Macro Close-Up)
 * - Mouse wheel zoom & touch pinch zoom
 * - Atmospheric rising steam particle system & soft contact shadows
 */

class Ramen3DStage {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas || typeof THREE === 'undefined') return;

        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.touchStartDist = 0;

        // Natural hero 3D angle (slight tilt forward to see toppings & bowl)
        this.userRotation = { x: 0.38, y: 0.5 };
        this.userRotationTarget = { x: 0.38, y: 0.5 };
        this.clock = null;
        this.isVisible = true;
        this.pivot = null;
        this.model = null;
        this.modelBaseY = 0;
        this.mixer = null;

        // Camera presets & lerping (Calibrated to elegant distance matching Image 2)
        this.cameraTargetPos = new THREE.Vector3(0, 2.10, 3.25);
        this.cameraLookTarget = new THREE.Vector3(0, 0.02, 0);
        this.cameraCurrentLook = new THREE.Vector3(0, 0.02, 0);
        this.autoSpin = true;
        this.steamEnabled = true;
        this.steamParticles = null;
        this.currentPreset = 'hero';

        this.init();
    }

    init() {
        const width = this.canvas.clientWidth || 560;
        const height = this.canvas.clientHeight || 560;

        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
        this.camera.position.copy(this.cameraTargetPos);
        this.camera.lookAt(this.cameraLookTarget);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Balanced ACES Filmic Tone Mapping to prevent any clipping or overexposure
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.92;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.setupLighting();
        this.setupGround();
        this.setupSteam();
        this.loadModel();

        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);
        window.addEventListener('resize', this.resize);
        this.setupEvents();
        this.setupObserver();
        requestAnimationFrame(this.animate);
    }

    setupLighting() {
        // Balanced Studio Food Photography Lighting Setup

        // 1. Warm Soft Ambient Fill (preserves shadow depth and rich color saturation)
        this.scene.add(new THREE.AmbientLight(0xfff5ea, 0.48));

        // 2. Main Key Light: Warm directional light casting soft shadows
        const key = new THREE.DirectionalLight(0xfffaef, 1.25);
        key.position.set(2.6, 5.8, 3.2);
        key.castShadow = true;
        key.shadow.mapSize.width = 2048;
        key.shadow.mapSize.height = 2048;
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far = 15;
        key.shadow.camera.left = -2.5;
        key.shadow.camera.right = 2.5;
        key.shadow.camera.top = 2.5;
        key.shadow.camera.bottom = -2.5;
        key.shadow.bias = -0.0003;
        this.scene.add(key);

        // 3. Fill Light: Soft subtle fill from the left
        const fill = new THREE.DirectionalLight(0xfff0e2, 0.45);
        fill.position.set(-2.2, 2.5, 3.0);
        this.scene.add(fill);

        // 4. Rim Backlight: Appetizing izakaya amber rim
        const rim = new THREE.DirectionalLight(0xff6633, 0.75);
        rim.position.set(-2.8, 2.8, -2.6);
        this.scene.add(rim);

        // 5. Subtle golden broth warmth inside the bowl
        const brothLight = new THREE.PointLight(0xff8822, 0.40, 2.8);
        brothLight.position.set(0, 0.40, 0);
        this.scene.add(brothLight);
    }

    setupGround() {
        const ground = new THREE.Mesh(
            new THREE.CircleGeometry(2.8, 64),
            new THREE.ShadowMaterial({ opacity: 0.38 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.62;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    /**
     * Procedural Rising Steam Particles System
     */
    setupSteam() {
        const particleCount = 75;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);
        const opacities = new Float32Array(particleCount);
        this.steamData = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.42;
            const x = Math.cos(angle) * radius;
            const y = 0.15 + Math.random() * 1.3;
            const z = Math.sin(angle) * radius;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            scales[i] = 14.0 + Math.random() * 20.0;
            opacities[i] = Math.random();

            this.steamData.push({
                baseX: x,
                baseZ: z,
                speedY: 0.007 + Math.random() * 0.009,
                driftSpeed: 0.8 + Math.random() * 1.2,
                driftAmp: 0.05 + Math.random() * 0.06,
                life: Math.random()
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        // Soft circular radial gradient texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        grad.addColorStop(0.4, 'rgba(255, 240, 220, 0.22)');
        grad.addColorStop(0.8, 'rgba(255, 220, 180, 0.05)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        const steamTexture = new THREE.CanvasTexture(canvas);

        const material = new THREE.PointsMaterial({
            size: 0.38,
            map: steamTexture,
            transparent: true,
            opacity: 0.32,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.steamParticles = new THREE.Points(geometry, material);
        this.steamParticles.position.set(0, 0.18, 0);
        this.scene.add(this.steamParticles);
    }

    updateSteam(time) {
        if (!this.steamParticles || !this.steamEnabled) {
            if (this.steamParticles) this.steamParticles.visible = false;
            return;
        }
        this.steamParticles.visible = true;

        const positions = this.steamParticles.geometry.attributes.position.array;
        const count = this.steamData.length;

        for (let i = 0; i < count; i++) {
            const data = this.steamData[i];
            data.life += data.speedY;

            if (data.life > 1.0) {
                data.life = 0;
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.38;
                data.baseX = Math.cos(angle) * radius;
                data.baseZ = Math.sin(angle) * radius;
            }

            const currentY = 0.15 + data.life * 1.5;
            const currentX = data.baseX + Math.sin(time * data.driftSpeed + i) * data.driftAmp * (data.life + 0.3);
            const currentZ = data.baseZ + Math.cos(time * data.driftSpeed + i * 0.7) * data.driftAmp * (data.life + 0.3);

            positions[i * 3] = currentX;
            positions[i * 3 + 1] = currentY;
            positions[i * 3 + 2] = currentZ;
        }

        this.steamParticles.geometry.attributes.position.needsUpdate = true;
    }

    loadModel() {
        if (typeof THREE.GLTFLoader === 'undefined') {
            console.warn('GLTFLoader not available');
            return;
        }
        const loader = new THREE.GLTFLoader();
        loader.load(
            'assets/models/kingu_spicy_beef_ramen.glb',
            (gltf) => {
                const ramen = gltf.scene;

                // Model is natively Y-up (Three.js coordinates)
                ramen.rotation.x = 0;

                ramen.traverse((obj) => {
                    if (!obj.isMesh) return;

                    obj.castShadow = true;
                    obj.receiveShadow = true;

                    // Tune materials for authentic Japanese pottery & food realism (No blown-out highlights)
                    if (obj.name === 'Ceramic_Bowl_Node' || obj.name.includes('Bowl')) {
                        // Soft natural ivory ceramic porcelain with silky clearcoat glaze
                        obj.material = new THREE.MeshPhysicalMaterial({
                            color: new THREE.Color(0xf2ece4),
                            roughness: 0.24,
                            metalness: 0.01,
                            clearcoat: 0.38,
                            clearcoatRoughness: 0.16,
                            reflectivity: 0.55,
                            side: THREE.DoubleSide
                        });
                    } else if (obj.name === 'Ramen_Food_Node' || obj.name.includes('Food')) {
                        // Photorealistic food texture with rich colors and moist broth sheen
                        if (obj.material && obj.material.map) {
                            obj.material.map.encoding = THREE.sRGBEncoding;
                            if (this.renderer.capabilities.getMaxAnisotropy) {
                                obj.material.map.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                            }
                            obj.material.map.needsUpdate = true;
                        }
                        obj.material.color = new THREE.Color(0xffffff);
                        obj.material.roughness = 0.36;
                        obj.material.metalness = 0.01;
                        if ('clearcoat' in obj.material) {
                            obj.material.clearcoat = 0.28;
                            obj.material.clearcoatRoughness = 0.22;
                        }
                        obj.material.side = THREE.DoubleSide;
                    } else if (obj.name === 'Scallions_3D_Node' || obj.name.includes('Scallion')) {
                        // Natural fresh scallions
                        obj.material = new THREE.MeshStandardMaterial({
                            color: new THREE.Color(0x2d8216),
                            roughness: 0.40,
                            metalness: 0.0,
                            side: THREE.DoubleSide
                        });
                    }

                    if (obj.material) {
                        obj.material.needsUpdate = true;
                    }
                });

                // Auto-fit & center in hero stage
                ramen.updateMatrixWorld(true);
                const box = new THREE.Box3().setFromObject(ramen);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const targetScale = 2.12 / maxDim;
                ramen.scale.setScalar(targetScale);

                ramen.updateMatrixWorld(true);
                const box2 = new THREE.Box3().setFromObject(ramen);
                const center = box2.getCenter(new THREE.Vector3());
                ramen.position.set(-center.x, -center.y, -center.z);

                this.pivot = new THREE.Group();
                this.pivot.add(ramen);
                this.model = ramen;
                this.modelBaseY = 0.0;
                this.scene.add(this.pivot);

                if (gltf.animations && gltf.animations.length) {
                    this.mixer = new THREE.AnimationMixer(ramen);
                    gltf.animations.forEach((clip) => {
                        this.mixer.clipAction(clip).play();
                    });
                }
            },
            undefined,
            (err) => {
                console.error('Failed to load GLB model:', err);
            }
        );
    }

    setupEvents() {
        this.canvas.style.cursor = 'grab';

        // Mouse / Pointer drag rotation & tilt
        this.canvas.addEventListener('pointerdown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
            this.canvas.setPointerCapture(e.pointerId);
            this.canvas.style.cursor = 'grabbing';
            if (window.kinguSound) window.kinguSound.playBubble();
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            // Horizontal rotation (Yaw) - full 360°
            this.userRotationTarget.y += deltaX * 0.009;

            // Vertical rotation (Pitch / Tilt)
            // Wide range: from -0.6 (tilt back to inspect ceramic bowl side & foot ring)
            // to +1.38 (tilt forward to look right into the toppings and broth from above)
            this.userRotationTarget.x = Math.max(
                -0.6,
                Math.min(1.38, this.userRotationTarget.x + deltaY * 0.009)
            );

            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        const endDrag = (e) => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
            try {
                if (e && e.pointerId && this.canvas.hasPointerCapture(e.pointerId)) {
                    this.canvas.releasePointerCapture(e.pointerId);
                }
            } catch (_) {}
        };
        this.canvas.addEventListener('pointerup', endDrag);
        this.canvas.addEventListener('pointercancel', endDrag);
        this.canvas.addEventListener('pointerleave', endDrag);

        // Mouse Wheel Zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY * 0.0022;
            const len = this.cameraTargetPos.length();
            const newLen = THREE.MathUtils.clamp(len + zoomDelta, 1.85, 4.8);
            this.cameraTargetPos.setLength(newLen);
        }, { passive: false });

        // Touch pinch-to-zoom
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                this.touchStartDist = Math.hypot(dx, dy);
            }
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && this.touchStartDist > 0) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.hypot(dx, dy);
                const factor = (this.touchStartDist - dist) * 0.005;
                const len = this.cameraTargetPos.length();
                const newLen = THREE.MathUtils.clamp(len + factor, 1.85, 4.8);
                this.cameraTargetPos.setLength(newLen);
                this.touchStartDist = dist;
            }
        }, { passive: true });

        // Double-click to toggle top-down inspection
        this.canvas.addEventListener('dblclick', () => {
            if (this.currentPreset === 'topdown') {
                this.setCameraPreset('hero');
            } else {
                this.setCameraPreset('topdown');
            }
        });
    }

    /**
     * Camera View Angle Presets & Controls
     */
    setCameraPreset(preset) {
        this.currentPreset = preset;
        if (preset === 'hero') {
            // Natural 45° Hero Angle (Balanced comfortable framing matching Image 2)
            this.cameraTargetPos.set(0, 2.10, 3.25);
            this.cameraLookTarget.set(0, 0.02, 0);
            this.userRotationTarget.x = 0.38;
        } else if (preset === 'topdown') {
            // Straight Top-Down Inspection
            this.cameraTargetPos.set(0, 3.85, 0.05);
            this.cameraLookTarget.set(0, 0, 0);
            this.userRotationTarget.x = 0.01;
        } else if (preset === 'closeup') {
            // Macro Close-Up
            this.cameraTargetPos.set(0.40, 1.40, 1.85);
            this.cameraLookTarget.set(0, 0.15, 0);
            this.userRotationTarget.x = 0.45;
        }
        if (window.kinguSound) window.kinguSound.playClick();
    }

    toggleAutoSpin() {
        this.autoSpin = !this.autoSpin;
        if (window.kinguSound) window.kinguSound.playClick();
        return this.autoSpin;
    }

    toggleSteam() {
        this.steamEnabled = !this.steamEnabled;
        if (window.kinguSound) window.kinguSound.playClick();
        return this.steamEnabled;
    }

    resetView() {
        this.setCameraPreset('hero');
        this.userRotationTarget.y = 0.5;
        this.userRotation.y = 0.5;
    }

    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                this.isVisible = entry.isIntersecting;
                if (this.isVisible) this.resize();
            });
        }, { threshold: 0.08 });
        observer.observe(this.canvas);
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    animate() {
        requestAnimationFrame(this.animate);
        if (!this.isVisible) return;

        const delta = this.clock ? this.clock.getDelta() : 0.016;
        const time = this.clock ? this.clock.getElapsedTime() : 0;

        // Smooth camera lerp
        this.camera.position.lerp(this.cameraTargetPos, 0.08);
        this.cameraCurrentLook.lerp(this.cameraLookTarget, 0.08);
        this.camera.lookAt(this.cameraCurrentLook);

        // Smooth rotation interpolation
        this.userRotation.x += (this.userRotationTarget.x - this.userRotation.x) * 0.09;
        this.userRotation.y += (this.userRotationTarget.y - this.userRotation.y) * 0.09;

        // Idle auto-spin
        if (!this.isDragging && this.autoSpin) {
            this.userRotationTarget.y += 0.0022;
        }

        if (this.pivot) {
            this.pivot.rotation.x = this.userRotation.x;
            this.pivot.rotation.y = this.userRotation.y;
            this.pivot.position.y = this.modelBaseY + Math.sin(time * 1.2) * 0.012;
        }

        this.updateSteam(time);

        if (this.mixer) this.mixer.update(delta);

        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ramen-canvas')) {
        window.ramenStage = new Ramen3DStage('ramen-canvas');
    }
});
