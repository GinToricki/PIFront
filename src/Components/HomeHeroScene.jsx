import {useEffect, useRef} from "react";
import * as THREE from "three";

function createCardMesh(texture, index) {
    const geometry = new THREE.PlaneGeometry(1.24, 1.74, 1, 1);
    const material = new THREE.MeshStandardMaterial({
        map: texture || null,
        color: texture ? 0xffffff : 0x46307f,
        roughness: 0.56,
        metalness: 0.18,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const columns = [-1.95, -0.7, 0.55, 1.8];
    const row = Math.floor(index / columns.length);
    const col = index % columns.length;

    mesh.position.set(columns[col], 1.4 - row * 1.4, -0.4 - row * 0.25);
    mesh.rotation.z = (-0.1 + col * 0.07) * (row % 2 === 0 ? 1 : -1);
    mesh.rotation.y = -0.22 + col * 0.12;
    mesh.userData.floatOffset = index * 0.8;

    return mesh;
}

function HomeHeroScene({images = []}) {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) {
            return undefined;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
        camera.position.set(0, 0.15, 6.4);

        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.9);
        const key = new THREE.PointLight(0x9b7cff, 5.8, 14, 2);
        key.position.set(-2.8, 2.7, 3.5);
        const fill = new THREE.PointLight(0x4f86ff, 3.1, 12, 2);
        fill.position.set(3.4, -1.3, 3.2);
        scene.add(ambient, key, fill);

        const root = new THREE.Group();
        scene.add(root);

        const loader = new THREE.TextureLoader();
        loader.crossOrigin = "anonymous";

        const loadedTextures = [];
        const cardImages = images.slice(0, 8);
        for (let index = 0; index < Math.max(cardImages.length, 6); index += 1) {
            const source = cardImages[index] || "";
            let texture = null;
            if (source) {
                texture = loader.load(source);
                texture.colorSpace = THREE.SRGBColorSpace;
                loadedTextures.push(texture);
            }
            root.add(createCardMesh(texture, index));
        }

        const halo = new THREE.Mesh(
            new THREE.CircleGeometry(3.5, 40),
            new THREE.MeshBasicMaterial({color: 0x7c3aed, transparent: true, opacity: 0.11})
        );
        halo.position.set(0.45, 0.15, -2.4);
        scene.add(halo);

        let targetPointerX = 0;
        let targetPointerY = 0;
        let pointerX = 0;
        let pointerY = 0;
        let targetScroll = 0;
        let scrollAmount = 0;

        const onPointerMove = (event) => {
            const width = window.innerWidth || 1;
            const height = window.innerHeight || 1;
            targetPointerX = ((event.clientX / width) * 2 - 1) * 0.7;
            targetPointerY = -((event.clientY / height) * 2 - 1) * 0.55;
        };

        const onScroll = () => {
            targetScroll = Math.min(window.scrollY / 600, 1) * 0.45;
        };

        const onResize = () => {
            const width = mount.clientWidth || 1;
            const height = mount.clientHeight || 1;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("scroll", onScroll, {passive: true});
        window.addEventListener("resize", onResize);
        onResize();

        let rafId = 0;
        const clock = new THREE.Clock();
        const animate = () => {
            const elapsed = clock.getElapsedTime();
            pointerX += (targetPointerX - pointerX) * 0.08;
            pointerY += (targetPointerY - pointerY) * 0.08;
            scrollAmount += (targetScroll - scrollAmount) * 0.1;

            root.position.x = pointerX * 0.48;
            root.position.y = pointerY * 0.35 - scrollAmount;
            root.rotation.y = pointerX * 0.12;
            root.rotation.x = pointerY * 0.08;

            for (const mesh of root.children) {
                const offset = mesh.userData.floatOffset || 0;
                mesh.position.y += Math.sin(elapsed + offset) * 0.0011;
                mesh.rotation.z += Math.sin(elapsed * 0.65 + offset) * 0.00038;
            }

            camera.position.x += (pointerX * 0.25 - camera.position.x) * 0.06;
            camera.position.y += (pointerY * 0.22 + 0.15 - camera.position.y) * 0.06;
            camera.lookAt(0, -0.1, 0);

            renderer.render(scene, camera);
            rafId = window.requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.cancelAnimationFrame(rafId);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);

            root.children.forEach((mesh) => {
                mesh.geometry.dispose();
                mesh.material.dispose();
            });
            halo.geometry.dispose();
            halo.material.dispose();
            loadedTextures.forEach((texture) => texture.dispose());
            renderer.dispose();
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, [images]);

    return <div className="home-hero-scene" ref={mountRef} aria-hidden="true" />;
}

export default HomeHeroScene;
