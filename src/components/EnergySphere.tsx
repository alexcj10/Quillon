import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function EnergySphere() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        /* ================= MODE DETECTION ================= */
        const isDark = document.documentElement.classList.contains('dark');

        /* ================= COLOR PALETTES ================= */
        // Using the same pink gradient as the original ring
        const pinkGradientPalette = [
            '#FF7AB8', // light pink
            '#FF4DA6', // medium pink
            '#FF1E8E'  // deep pink
        ];

        const palette = pinkGradientPalette.map(c => new THREE.Color(c));

        /* ================= SETUP ================= */
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
        camera.position.z = 2.3;

        // High internal resolution for crisp look
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(66, 66); // 3× internal resolution
        renderer.setPixelRatio(1);

        // Style the canvas to match container
        const canvas = renderer.domElement;
        canvas.style.width = '28px';
        canvas.style.height = '28px';
        canvas.style.display = 'block';

        containerRef.current.appendChild(canvas);

        /* ================= LIGHT ================= */
        scene.add(new THREE.AmbientLight(
            isDark ? 0xffffff : 0x000000,
            isDark ? 0.6 : 0.8
        ));

        const pointLight = new THREE.PointLight(
            isDark ? 0xffffff : 0x000000,
            isDark ? 2.4 : 1.2,
            6
        );
        pointLight.position.set(2, 2, 3);
        scene.add(pointLight);

        /* ================= PARTICLES ================= */
        const particleCount = 1400;
        const radius = 0.75;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = radius + Math.random() * 0.06;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            positions.set([x, y, z], i * 3);

            const c = palette[Math.floor(Math.random() * palette.length)];
            colors.set([c.r, c.g, c.b], i * 3);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: isDark ? 0.03 : 0.032,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const sphere = new THREE.Points(geometry, material);
        scene.add(sphere);

        /* ================= ANIMATION ================= */
        let animationId: number;

        function animate() {
            animationId = requestAnimationFrame(animate);
            // Use performance.now() / 15 to get roughly the same speed as the previous "+= 0.06"
            // (0.06 increments at 60fps is ~3.6 units per second. performance.now() is ms.)
            const t = performance.now() / 250;

            // Clear, visible motion at 22px
            sphere.rotation.y = t * 0.3;
            sphere.rotation.x = t * 0.2;

            const pulse = 1 + Math.sin(t * 1.5) * 0.08;
            sphere.scale.set(pulse, pulse, pulse);

            renderer.render(scene, camera);
        }

        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(animationId);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '28px',
                height: '28px',
                display: 'inline-block',
                verticalAlign: 'middle'
            }}
        />
    );
}
