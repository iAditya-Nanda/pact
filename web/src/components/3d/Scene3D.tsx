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
              emissiveIntensity: 0.65,
              roughness: 0.08,
              metalness: 0.02,
              transmission: 0.82, // High glass translucency so it glows beautifully
              thickness: 1.4,
              ior: 1.333, // Water refractive index
              transparent: true,
              opacity: 0.92,
              clearcoat: 0.9,
              clearcoatRoughness: 0.05,
            });
          }
        });

        jellyfishGroup.add(model);

        // Embedded swimming skeletal armature animation
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations[0];
          const action = mixer.clipAction(clip);
          action.setEffectiveTimeScale(0.75); // Silky, calm tentacle wave tempo
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

    // 9. Calm, Smooth Aquatic Hover Simulation (Native Performance Timing)
    let lastTime = performance.now();
    const startTime = performance.now();
    let animationFrameId: number;

    const baseScale = 0.68;
    let currentLaneX = mode === "landing" ? 2.2 : 1.15;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;
      const t = (now - startTime) * 0.001;

      // Smooth cursor damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.035;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.035;

      // Update embedded skeletal swimming animation at a silky, calm tempo (No manual bone compounding)
      if (mixerRef.current) {
        mixerRef.current.update(delta * 0.75);
      }

      if (jellyfishGroupRef.current) {
        const jf = jellyfishGroupRef.current;

        // Smooth transition between screens (Landing = 0.0, Login/Signup = 1.15)
        const targetLaneX = modeRef.current === "landing" ? 2.2 : 1.15;
        currentLaneX += (targetLaneX - currentLaneX) * 0.035;

        // 1. Calm 3.4-second biological breathing cycle
        const cycle = t % 3.4;
        const isContracting = cycle < 1.1;
        const contraction = isContracting ? Math.sin((cycle / 1.1) * Math.PI) : 0;

        // 2. Subtle, natural bell breathing pulse (minimal deformation, zero head-bump)
        const scaleXZ = baseScale * (1.0 - 0.06 * contraction);
        const scaleY = baseScale * (1.0 + 0.02 * contraction);
        jf.scale.set(scaleXZ, scaleY, scaleXZ);

        // 3. Gentle, small-amplitude aquatic hover (Moves only 1-2 cm on screen, NEVER shooting or jumping)
        const hoverX = currentLaneX + Math.sin(t * 0.4) * 0.16 + mouseRef.current.x * 0.08;
        const hoverY = Math.cos(t * 0.5) * 0.10 + contraction * 0.035 + mouseRef.current.y * 0.06;
        const hoverZ = Math.sin(t * 0.3) * 0.08;

        // Smooth fluid interpolation towards hover position
        jf.position.x += (hoverX - jf.position.x) * 0.035;
        jf.position.y += (hoverY - jf.position.y) * 0.035;
        jf.position.z += (hoverZ - jf.position.z) * 0.035;

        // 4. Subtle, majestic 3D banking and water roll (very gentle, max 4-6 degrees)
        const velX = hoverX - jf.position.x;
        const naturalRoll = -velX * 1.5 + Math.sin(t * 0.35) * 0.05;
        const naturalPitch = Math.cos(t * 0.3) * 0.04;
        const naturalYaw = Math.sin(t * 0.25) * 0.08;

        jf.rotation.z += (naturalRoll - jf.rotation.z) * 0.03;
        jf.rotation.x += (naturalPitch - jf.rotation.x) * 0.03;
        jf.rotation.y += (naturalYaw - jf.rotation.y) * 0.03;
      }

      // Camera subtle parallax
      if (cameraRef.current) {
        cameraRef.current.position.x += (mouseRef.current.x * 0.15 - cameraRef.current.position.x) * 0.025;
        cameraRef.current.position.y += (mouseRef.current.y * 0.1 - cameraRef.current.position.y) * 0.025;
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
