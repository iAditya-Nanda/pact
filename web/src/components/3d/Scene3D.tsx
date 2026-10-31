"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export interface Scene3DProps {
  mode?: "landing" | "login" | "signup";
  className?: string;
  interactive?: boolean;
}

export const Scene3D: React.FC<Scene3DProps> = ({
  mode = "landing",
  className = "",
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Core Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const jellyfishGroupRef = useRef<THREE.Group | null>(null);

  // Mouse coordinates with damped interpolation
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Mode reference for smooth animation transitions inside render loop
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);
    cameraRef.current = camera;

    // 3. Ultra-Smooth High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Clean Sky Blue & M3 Underwater Lighting System
    // Ambient aquatic deep glow
    const ambientLight = new THREE.AmbientLight(0x0a2240, 2.4);
    scene.add(ambientLight);

    // Primary Directional Sky-Blue Sunlight shining down into water
    const sunLight = new THREE.DirectionalLight(0x38bdf8, 3.8);
    sunLight.position.set(4, 8, 6);
    scene.add(sunLight);

    // Bioluminescent cyan rim light from below/behind
    const rimLight = new THREE.DirectionalLight(0x00e5ff, 2.8);
    rimLight.position.set(-5, -4, -3);
    scene.add(rimLight);

    // Subtle soft fill light
    const fillLight = new THREE.PointLight(0x8ab4f8, 2.0, 16);
    fillLight.position.set(0, -1, 4);
    scene.add(fillLight);

    // 5. Draco & GLTF Loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // 6. Only Jellyfish Model Group
    const jellyfishGroup = new THREE.Group();
    scene.add(jellyfishGroup);
    jellyfishGroupRef.current = jellyfishGroup;
    jellyfishGroup.scale.setScalar(0.75);

    gltfLoader.load(
      "/models/Jellyfish.glb",
      (gltf) => {
        const model = gltf.scene;

        // Custom Realistic Translucent Sky Blue Material
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            mesh.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(0x38bdf8), // Sky Blue (Tailwind sky-400)
              emissive: new THREE.Color(0x0284c7), // Glowing Sky Blue
              emissiveIntensity: 0.58,
              roughness: 0.1,
              metalness: 0.05,
              transmission: 0.78, // High glass translucency so it glows beautifully
              thickness: 1.6,
              ior: 1.333, // Water refractive index
              transparent: true,
              opacity: 0.9,
              clearcoat: 0.85,
              clearcoatRoughness: 0.08,
            });
          }
        });

        jellyfishGroup.add(model);

        // Embedded swimming skeletal armature animation
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations[0];
          const action = mixer.clipAction(clip);
          action.setEffectiveTimeScale(0.72); // Silky, organic swimming tempo
          action.play();
          mixerRef.current = mixer;
        }

        setIsLoaded(true);
      },
      undefined,
      (err) => console.warn("Jellyfish load note:", err)
    );

    // 7. Mouse Listener
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 8. Window Resize Listener
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 9. Autonomous Dynamic Water Simulation Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    // Swimming path memory
    let prevX = 0;
    let prevY = 0;
    let currentLaneX = mode === "landing" ? 0.3 : 2.2;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      // Update skeletal swimming contraction
      if (mixerRef.current) mixerRef.current.update(delta);

      // Smooth cursor damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.035;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.035;

      if (jellyfishGroupRef.current) {
        const jf = jellyfishGroupRef.current;

        // Smoothly interpolate lane when transitioning between screens:
        // Landing: centered aquatic roaming (x ~ 0.2)
        // Login / Signup: swims to the right side (x ~ 2.2)
        const targetLaneX = modeRef.current === "landing" ? 0.3 : 2.2;
        currentLaneX += (targetLaneX - currentLaneX) * 0.03;

        // REALISTIC UNDERWATER SWIMMING PHYSICS:
        // 1. Multi-harmonic circular & figure-8 water current drift (sometimes slow, sometimes fast)
        const currentSpeed = 0.35 + Math.sin(t * 0.25) * 0.15; // Speed dynamically varies!
        const orbitT = t * currentSpeed;

        // Gentle circular loops through 3D water
        const circularX = Math.cos(orbitT * 0.6) * 1.6 + Math.sin(orbitT * 1.2) * 0.5;
        const circularY = Math.sin(orbitT * 0.8) * 1.0 + Math.cos(orbitT * 0.4) * 0.4;
        const circularZ = Math.sin(orbitT * 0.5) * 0.7;

        // 2. Jet propulsion burst: Real jellyfish speed up during contraction, then glide!
        const propulsionCycle = (t * 2.1) % (Math.PI * 2);
        const isContracting = propulsionCycle < Math.PI * 0.8;
        const thrust = isContracting ? Math.sin(propulsionCycle) * 0.18 : Math.sin(propulsionCycle) * 0.05;

        // Target 3D coordinates
        const targetX = currentLaneX + circularX + mouseRef.current.x * 0.4;
        const targetY = circularY + thrust + mouseRef.current.y * 0.3;
        const targetZ = circularZ + 0.2;

        // Smooth fluid motion integration (momentum & inertia)
        jf.position.x += (targetX - jf.position.x) * 0.04;
        jf.position.y += (targetY - jf.position.y) * 0.04;
        jf.position.z += (targetZ - jf.position.z) * 0.04;

        // 3. Orientation / Banking: Head leads the movement!
        const velX = jf.position.x - prevX;
        const velY = jf.position.y - prevY;
        prevX = jf.position.x;
        prevY = jf.position.y;

        // Natural tilt in the direction of swimming
        const naturalPitch = velY * 2.5 + Math.sin(t * 0.8) * 0.15;
        const naturalRoll = -velX * 2.2 + Math.cos(t * 0.7) * 0.12;
        const naturalYaw = (modeRef.current === "landing" ? 0.0 : -0.3) + Math.sin(t * 0.4) * 0.25;

        jf.rotation.x += (naturalPitch - jf.rotation.x) * 0.04;
        jf.rotation.z += (naturalRoll - jf.rotation.z) * 0.04;
        jf.rotation.y += (naturalYaw - jf.rotation.y) * 0.04;

        // 4. Natural Bell Breathing Pulse (scale pulse matches propulsion)
        const bellExpansion = 1 + (isContracting ? -0.03 : 0.04) * Math.sin(propulsionCycle);
        jf.scale.set(0.75 * bellExpansion, 0.75 * (2 - bellExpansion), 0.75 * bellExpansion);
      }

      // Camera subtle parallax
      if (cameraRef.current) {
        cameraRef.current.position.x += (mouseRef.current.x * 0.25 - cameraRef.current.position.x) * 0.03;
        cameraRef.current.position.y += (mouseRef.current.y * 0.18 - cameraRef.current.position.y) * 0.03;
        cameraRef.current.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      dracoLoader.dispose();
    };
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
