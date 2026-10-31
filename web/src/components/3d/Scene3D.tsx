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
  const tentacleBonesRef = useRef<Array<{ bone: THREE.Bone; depth: number; index: number }>>([]);

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

        // Collect tentacle bones for dynamic procedural wave undulation
        const collectedBones: Array<{ bone: THREE.Bone; depth: number; index: number }> = [];
        let boneCounter = 0;
        model.traverse((child) => {
          if ((child as THREE.Bone).isBone) {
            const bone = child as THREE.Bone;
            if (bone.name.startsWith("Top.")) {
              const numMatch = bone.name.match(/\d+$/);
              const depth = numMatch ? parseInt(numMatch[0], 10) : 1;
              collectedBones.push({ bone, depth, index: boneCounter++ });
            }
          }
        });
        tentacleBonesRef.current = collectedBones;

        // Embedded swimming skeletal armature animation
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations[0];
          const action = mixer.clipAction(clip);
          action.setEffectiveTimeScale(1.0); // Full natural tempo
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

    // 9. Realistic Asymmetrical Vortex Ring Jet Propulsion & Steering Simulation
    const clock = new THREE.Clock();
    let animationFrameId: number;

    // Movement & physics states
    const velocity = new THREE.Vector3(0, 0, 0);
    const forwardVec = new THREE.Vector3(0, 1, 0); // Model bell apex points along local +Y
    const currentHeading = new THREE.Vector3(0.15, 0.95, 0.05).normalize();
    const targetHeading = new THREE.Vector3(0.15, 0.95, 0.05).normalize();
    const baseScale = 0.66;
    let wanderAngle = Math.PI * 0.4; // Starts swimming slightly diagonally upward

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05); // Safe clamp
      const t = clock.getElapsedTime();

      // Smooth cursor damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.035;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.035;

      if (jellyfishGroupRef.current) {
        const jf = jellyfishGroupRef.current;

        // -----------------------------------------------------------
        // 1. MODULO CYCLE TIMER (2.0-second repeating biological cycle)
        // -----------------------------------------------------------
        const cycle = t % 2.0;
        const isPhase1 = cycle < 0.4; // Phase 1: Power Stroke (0.0s to 0.4s)

        // -----------------------------------------------------------
        // 2. BELL DEFORMATION (Asymmetrical Vortex Ring Contraction)
        // -----------------------------------------------------------
        if (isPhase1) {
          // Phase 1 (0.0s - 0.4s): Rapid bell contraction (Power stroke)
          const p = cycle / 0.4; // 0 to 1
          const contraction = Math.sin(p * Math.PI);

          // Bell radius narrows (X and Z contract down to ~0.7x)
          // Bell height elongates (Y expands slightly)
          const scaleXZ = baseScale * (1.0 - 0.30 * contraction);
          const scaleY = baseScale * (1.0 + 0.18 * contraction);
          jf.scale.set(scaleXZ, scaleY, scaleXZ);

          // Phase 1 Velocity: Apply sharp burst of forward velocity along bell axis
          const forward = forwardVec.clone().applyQuaternion(jf.quaternion);
          const thrustMagnitude = Math.sin(p * Math.PI) * 0.022; // Controlled, slow & realistic
          velocity.addScaledVector(forward, thrustMagnitude * (delta * 60));
        } else {
          // Phase 2 (0.4s - 2.0s): Recovery & Coasting
          // Slowly lerp scale back to relaxed 1.0 (elastic rebound of jelly)
          jf.scale.x += (baseScale - jf.scale.x) * (0.045 * (delta * 60));
          jf.scale.y += (baseScale - jf.scale.y) * (0.045 * (delta * 60));
          jf.scale.z += (baseScale - jf.scale.z) * (0.045 * (delta * 60));

          // Apply water friction multiplier (0.95) to velocity so jellyfish coasts
          const friction = Math.pow(0.95, delta * 60);
          velocity.multiplyScalar(friction);
        }

        // Synchronize skeletal animation clip:
        // Duration of clip is 4.29s; running at ~2.15x maps 4.29s to our 2.0s propulsion cycle!
        if (mixerRef.current) {
          const animSpeed = isPhase1 ? 2.6 : 1.9;
          mixerRef.current.update(delta * animSpeed);
        }

        // Secondary Dynamic Water Wave Undulation on Tentacles:
        // Simulates water resistance, inertia, and fluid aquatic ripples down the tentacle chains
        if (tentacleBonesRef.current.length > 0) {
          const waveTime = t * 3.2;
          const bones = tentacleBonesRef.current;
          for (let i = 0; i < bones.length; i++) {
            const { bone, depth, index } = bones[i];
            const phase = waveTime - depth * 0.42 + (index * 0.08);
            const amplitude = 0.025 + depth * 0.007; // Outer tips wave more than base

            // Lateral fluid flex & water drag
            bone.rotation.z += Math.sin(phase) * amplitude;
            bone.rotation.x += Math.cos(phase * 0.8) * (amplitude * 0.7);
          }
        }

        // -----------------------------------------------------------
        // 3. ORGANIC TURNING & HEADING BEHAVIOR (Slow, realistic angles)
        // -----------------------------------------------------------
        // Anchor center based on mode:
        // Landing: centered in website viewport (0.0, 0.0)
        // Login / Signup: gently swimming on right-hand side (1.05, 0.0)
        const targetCenterX = modeRef.current === "landing" ? 0.0 : 1.05;
        const targetCenterY = 0.0;

        const distX = jf.position.x - targetCenterX;
        const distY = jf.position.y - targetCenterY;

        // Soft boundary steering: gracefully steer toward center when drifting away
        if (Math.abs(distX) > 0.65 || Math.abs(distY) > 0.55) {
          const steerX = -distX * 1.4;
          const steerY = -distY * 1.4 + 0.25; // Slight upward preference like real jellyfish
          targetHeading.set(steerX, steerY, Math.sin(t * 0.3) * 0.15).normalize();
        } else {
          // Inside comfort zone: slow, majestic circular wandering & slight undulation
          wanderAngle += (Math.sin(t * 0.22) * 0.2 + Math.cos(t * 0.16) * 0.15) * delta;
          const wanderX = Math.cos(wanderAngle) * 0.6 + mouseRef.current.x * 0.12;
          const wanderY = Math.abs(Math.sin(wanderAngle)) * 0.55 + 0.35 + mouseRef.current.y * 0.08;
          const wanderZ = Math.sin(t * 0.2) * 0.12;
          targetHeading.set(wanderX, wanderY, wanderZ).normalize();
        }

        // Smoothly interpolate current heading toward target heading (slow, majestic turn rate)
        currentHeading.lerp(targetHeading, 0.025 * (delta * 60));
        currentHeading.normalize();

        // -----------------------------------------------------------
        // 4. BANKING & TILT: Orient the jellyfish's bell in the heading direction!
        // -----------------------------------------------------------
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(forwardVec, currentHeading);

        // Add subtle natural water roll into turns
        const rollAxis = currentHeading.clone().normalize();
        const rollAngle = Math.sin(t * 0.45) * 0.1;
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(rollAxis, rollAngle);
        targetQuat.multiply(rollQuat);

        // Slerp orientation smoothly (majestic 3D banking)
        jf.quaternion.slerp(targetQuat, 0.028 * (delta * 60));

        // -----------------------------------------------------------
        // 5. TRANSLATION & ABSOLUTE BOUNDARY CONFINEMENT
        // -----------------------------------------------------------
        jf.position.add(velocity);

        // Subtle water buoyancy wave
        jf.position.y += Math.sin(t * 0.7) * 0.0006;

        // STRICT 100% BOUNDS CHECK: Fish MUST NEVER exit the website dimensions!
        const boundMinX = modeRef.current === "landing" ? -1.3 : 0.25;
        const boundMaxX = modeRef.current === "landing" ? 1.3 : 1.85;
        const boundMinY = -1.05;
        const boundMaxY = 1.05;

        if (jf.position.x < boundMinX) {
          jf.position.x = boundMinX;
          velocity.x = Math.abs(velocity.x) * 0.15;
        } else if (jf.position.x > boundMaxX) {
          jf.position.x = boundMaxX;
          velocity.x = -Math.abs(velocity.x) * 0.15;
        }

        if (jf.position.y < boundMinY) {
          jf.position.y = boundMinY;
          velocity.y = Math.abs(velocity.y) * 0.15;
        } else if (jf.position.y > boundMaxY) {
          jf.position.y = boundMaxY;
          velocity.y = -Math.abs(velocity.y) * 0.15;
        }

        jf.position.z = THREE.MathUtils.clamp(jf.position.z, -0.4, 0.4);
      }

      // Camera subtle parallax
      if (cameraRef.current) {
        cameraRef.current.position.x += (mouseRef.current.x * 0.2 - cameraRef.current.position.x) * 0.025;
        cameraRef.current.position.y += (mouseRef.current.y * 0.14 - cameraRef.current.position.y) * 0.025;
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
