"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import gsap from "gsap";

export interface Scene3DProps {
  mode?: "landing" | "login" | "signup";
  activeSection?: number;
  className?: string;
  interactive?: boolean;
}

export const Scene3D: React.FC<Scene3DProps> = ({
  mode = "landing",
  activeSection = 0,
  className = "",
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // References to 3D objects and subsystems
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const cardsMixerRef = useRef<THREE.AnimationMixer | null>(null);

  // 3D Model Group Refs
  const jellyfishGroupRef = useRef<THREE.Group | null>(null);
  const rocketGroupRef = useRef<THREE.Group | null>(null);
  const cardsGroupRef = useRef<THREE.Group | null>(null);
  const lightningGroupRef = useRef<THREE.Group | null>(null);
  const heartGroupRef = useRef<THREE.Group | null>(null);
  const eyeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsGroupRef = useRef<THREE.Group | null>(null);
  const plugGroupRef = useRef<THREE.Group | null>(null);
  const sphereGroupRef = useRef<THREE.Group | null>(null);

  // Mouse coordinates with damped interpolation
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Clean subtle depth fog matching M3 canvas palette
    scene.fog = new THREE.FogExp2(0x0a101d, 0.028);

    // 2. Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.2);
    cameraRef.current = camera;

    // 3. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. M3 Lighting System (DESIGN.md Tokens)
    // Primary Brand Blue Key Light (#0b57d0 / #4285f4)
    const primaryKeyLight = new THREE.DirectionalLight(0x4285f4, 3.2);
    primaryKeyLight.position.set(6, 7, 7);
    scene.add(primaryKeyLight);

    // Ethereal Sky Blue Ambient Fill (#38bdf8 / #7dd3fc)
    const skyBlueAmbient = new THREE.AmbientLight(0x0e2a47, 2.0);
    scene.add(skyBlueAmbient);

    // Sky Blue Rim Light for Jellyfish Translucency
    const skyBlueRimLight = new THREE.DirectionalLight(0x38bdf8, 3.0);
    skyBlueRimLight.position.set(-6, -2, -3);
    scene.add(skyBlueRimLight);

    // M3 Warning / Clearance Warm Gold Accent (#f9ab00 / #b06000)
    const warmGoldAccent = new THREE.PointLight(0xf9ab00, 2.2, 16);
    warmGoldAccent.position.set(3, -2, 4);
    scene.add(warmGoldAccent);

    // M3 Success Green Subtle Fill (#146c2e / #34a853)
    const greenAccent = new THREE.PointLight(0x34a853, 1.8, 14);
    greenAccent.position.set(-3, 3, 2);
    scene.add(greenAccent);

    // 5. Draco and GLTF Loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // 6. Load Jellyfish.glb (The Star Hero - Sky Blue Bioluminescent)
    const jellyfishGroup = new THREE.Group();
    scene.add(jellyfishGroup);
    jellyfishGroupRef.current = jellyfishGroup;
    jellyfishGroup.scale.setScalar(0.7);

    gltfLoader.load(
      "/models/Jellyfish.glb",
      (gltf) => {
        const model = gltf.scene;

        // Apply vibrant Sky Blue Translucent PBR Material as requested
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            mesh.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(0x38bdf8), // Sky Blue (Tailwind sky-400)
              emissive: new THREE.Color(0x0284c7), // Deep sky blue glow
              emissiveIntensity: 0.55,
              roughness: 0.12,
              metalness: 0.05,
              transmission: 0.72,
              thickness: 1.4,
              ior: 1.33,
              transparent: true,
              opacity: 0.88,
              clearcoat: 0.8,
              clearcoatRoughness: 0.1,
            });
          }
        });

        jellyfishGroup.add(model);

        // Play the embedded natural swimming movement animation
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations[0];
          const action = mixer.clipAction(clip);
          action.setEffectiveTimeScale(0.8); // Silky hypnotic natural cadence
          action.play();
          mixerRef.current = mixer;
        }

        setIsLoaded(true);
      },
      undefined,
      (err) => console.warn("Jellyfish load note:", err)
    );

    // 7. Load Rocket.glb (Executive Propulsion / Velocity)
    const rocketGroup = new THREE.Group();
    scene.add(rocketGroup);
    rocketGroupRef.current = rocketGroup;

    gltfLoader.load(
      "/models/Rocket.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0x0b57d0), // M3 Primary Blue
              roughness: 0.2,
              metalness: 0.85,
            });
          }
        });
        model.scale.setScalar(0.012);
        rocketGroup.add(model);
        rocketGroup.position.set(-3.2, -1.2, 0.4);
        rocketGroup.rotation.set(-0.25, 0.7, 0.3);
      },
      undefined,
      (err) => console.warn("Rocket load note:", err)
    );

    // 8. Load Cards2Anim.glb (Workspace 3D Animated Ecosystem Cards)
    const cardsGroup = new THREE.Group();
    scene.add(cardsGroup);
    cardsGroupRef.current = cardsGroup;

    gltfLoader.load(
      "/models/Cards2Anim.glb",
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(0.0075);
        cardsGroup.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.setEffectiveTimeScale(0.65);
            action.play();
          });
          cardsMixerRef.current = mixer;
        }

        cardsGroup.position.set(-2.6, 1.4, -0.2);
        cardsGroup.rotation.set(0.15, 0.35, -0.05);
      },
      undefined,
      (err) => console.warn("Cards2Anim load note:", err)
    );

    // 9. Load Lightning.glb (Speed & Action Execution Icon - M3 Gold)
    const lightningGroup = new THREE.Group();
    scene.add(lightningGroup);
    lightningGroupRef.current = lightningGroup;

    gltfLoader.load(
      "/models/lightning.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0xf9ab00), // M3 Warning Gold
              emissive: new THREE.Color(0xb06000),
              emissiveIntensity: 0.65,
              roughness: 0.15,
              metalness: 0.8,
            });
          }
        });
        model.scale.setScalar(0.011);
        lightningGroup.add(model);
        lightningGroup.position.set(3.0, -1.8, 0.5);
      },
      undefined,
      (err) => console.warn("Lightning load note:", err)
    );

    // 10. Load Heart.glb (Health & Schedule Integrity - M3 Success Green)
    const heartGroup = new THREE.Group();
    scene.add(heartGroup);
    heartGroupRef.current = heartGroup;

    gltfLoader.load(
      "/models/heart.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0x34a853), // M3 Success Green
              emissive: new THREE.Color(0x146c2e),
              emissiveIntensity: 0.5,
              roughness: 0.2,
              metalness: 0.6,
            });
          }
        });
        model.scale.setScalar(0.009);
        heartGroup.add(model);
        heartGroup.position.set(2.8, 1.6, -0.4);
      },
      undefined,
      (err) => console.warn("Heart load note:", err)
    );

    // 11. Load Eye.glb (Proactive Guarded Vision - M3 Dark Cobalt)
    const eyeGroup = new THREE.Group();
    scene.add(eyeGroup);
    eyeGroupRef.current = eyeGroup;

    gltfLoader.load(
      "/models/Eye.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0x041e49), // M3 On-Primary Container Navy
              emissive: new THREE.Color(0x00b4d8),
              emissiveIntensity: 0.4,
              roughness: 0.15,
              metalness: 0.7,
            });
          }
        });
        model.scale.setScalar(0.01);
        eyeGroup.add(model);
        eyeGroup.position.set(-3.2, 0.2, 0.2);
      },
      undefined,
      (err) => console.warn("Eye load note:", err)
    );

    // 12. Load Clouds.glb (Ambient Depth Atmosphere)
    const cloudsGroup = new THREE.Group();
    scene.add(cloudsGroup);
    cloudsGroupRef.current = cloudsGroup;

    gltfLoader.load(
      "/models/Clouds.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0xc2e7ff), // M3 Active Pill Light Blue
              transparent: true,
              opacity: 0.4,
              roughness: 0.8,
            });
          }
        });
        model.scale.setScalar(0.015);
        cloudsGroup.add(model);
        cloudsGroup.position.set(0, -2.4, -2.5);
      },
      undefined,
      (err) => console.warn("Clouds load note:", err)
    );

    // 13. Load Plug.glb (Integration Protocol)
    const plugGroup = new THREE.Group();
    scene.add(plugGroup);
    plugGroupRef.current = plugGroup;

    gltfLoader.load(
      "/models/Plug.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0x8ab4f8),
              roughness: 0.3,
              metalness: 0.8,
            });
          }
        });
        model.scale.setScalar(0.009);
        plugGroup.add(model);
        plugGroup.position.set(3.4, 0.4, -0.6);
      },
      undefined,
      (err) => console.warn("Plug load note:", err)
    );

    // 14. Mouse Tracking for Subtle Parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 15. Window Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 16. Autonomous Ocean Simulation Render Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      // Update Skeletal Animations
      if (mixerRef.current) mixerRef.current.update(delta);
      if (cardsMixerRef.current) cardsMixerRef.current.update(delta);

      // Smooth Mouse Damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      // AUTONOMOUS JELLYFISH MOVEMENT (Moving on its own, like swimming in water)
      if (jellyfishGroupRef.current) {
        const jf = jellyfishGroupRef.current;

        // Base lane coordinates depending on route mode
        let laneOffsetX = 1.6;
        let laneOffsetY = 0.1;
        let laneOffsetZ = 0.3;

        if (mode === "login") {
          laneOffsetX = -2.2;
          laneOffsetY = 0.2;
        } else if (mode === "signup") {
          laneOffsetX = 2.4;
          laneOffsetY = -0.1;
        } else if (activeSection >= 3) {
          // In the last section, drift off to the upper-right background so it never blocks text
          laneOffsetX = 2.6;
          laneOffsetY = 1.2;
          laneOffsetZ = -1.2;
        }

        // Multi-frequency fluid sinusoidal ocean drift
        const waveX = Math.sin(t * 0.42) * 1.35 + Math.sin(t * 0.9) * 0.4;
        const waveY = Math.cos(t * 0.55) * 0.85 + Math.sin(t * 1.1) * 0.35;
        const waveZ = Math.sin(t * 0.3) * 0.6;

        // Apply autonomous swimming position
        jf.position.x = laneOffsetX + waveX;
        jf.position.y = laneOffsetY + waveY;
        jf.position.z = laneOffsetZ + waveZ;

        // Natural banking, tilting, and steering in direction of movement
        const targetPitch = Math.cos(t * 0.55) * 0.22 + mouseRef.current.y * 0.15;
        const targetRoll = Math.sin(t * 0.42) * 0.25 - mouseRef.current.x * 0.15;
        const targetYaw = (mode === "login" ? 0.5 : mode === "signup" ? -0.5 : -0.2) + Math.sin(t * 0.3) * 0.3;

        jf.rotation.x += (targetPitch - jf.rotation.x) * 0.04;
        jf.rotation.z += (targetRoll - jf.rotation.z) * 0.04;
        jf.rotation.y += (targetYaw - jf.rotation.y) * 0.04;

        // Subtle thrust propulsion pulse
        const pulse = 1 + Math.sin(t * 1.6) * 0.035;
        jf.scale.set(0.7 * pulse, 0.7 * pulse, 0.7 * pulse);
      }

      // ROCKET HOVER & ORBIT
      if (rocketGroupRef.current) {
        const rocket = rocketGroupRef.current;
        rocket.position.y = -1.2 + Math.sin(t * 1.4) * 0.25;
        rocket.rotation.y += 0.008;
        rocket.rotation.z = Math.sin(t * 1.2) * 0.12;
      }

      // 3D CARDS HOVER
      if (cardsGroupRef.current) {
        const cards = cardsGroupRef.current;
        cards.position.y = 1.4 + Math.sin(t * 1.1) * 0.18;
        cards.rotation.y = 0.35 + Math.sin(t * 0.6) * 0.08 + mouseRef.current.x * 0.12;
      }

      // LIGHTNING PULSE & ROTATION
      if (lightningGroupRef.current) {
        const lt = lightningGroupRef.current;
        lt.rotation.y += 0.018;
        lt.position.y = -1.8 + Math.sin(t * 2.2) * 0.2;
      }

      // HEART RHYTHMIC CARDIAC BEAT
      if (heartGroupRef.current) {
        const ht = heartGroupRef.current;
        ht.position.y = 1.6 + Math.cos(t * 1.3) * 0.15;
        // Double heartbeat impulse
        const beatTime = t * 2.5;
        const beatCycle = beatTime % (Math.PI * 2);
        const isPulse = beatCycle < 0.6 || (beatCycle > 1.0 && beatCycle < 1.4);
        const beatScale = isPulse ? 1.12 : 1.0;
        ht.scale.setScalar(0.009 * beatScale);
        ht.rotation.y += 0.006;
      }

      // EYE PROACTIVE TRACKING
      if (eyeGroupRef.current) {
        const eye = eyeGroupRef.current;
        eye.position.y = 0.2 + Math.sin(t * 0.8) * 0.15;
        // Smoothly orient towards mouse cursor
        eye.rotation.y += (mouseRef.current.x * 0.6 - eye.rotation.y) * 0.05;
        eye.rotation.x += (-mouseRef.current.y * 0.4 - eye.rotation.x) * 0.05;
      }

      // CLOUDS SLOW DRIFT
      if (cloudsGroupRef.current) {
        const clouds = cloudsGroupRef.current;
        clouds.position.x = Math.sin(t * 0.15) * 0.8;
      }

      // PLUG CONNECTION TUMBLE
      if (plugGroupRef.current) {
        const plug = plugGroupRef.current;
        plug.rotation.x += 0.006;
        plug.rotation.y += 0.01;
        plug.position.y = 0.4 + Math.cos(t * 1.5) * 0.16;
      }

      // CAMERA DAMPED PARALLAX
      if (cameraRef.current) {
        cameraRef.current.position.x += (mouseRef.current.x * 0.3 - cameraRef.current.position.x) * 0.03;
        cameraRef.current.position.y += (mouseRef.current.y * 0.2 - cameraRef.current.position.y) * 0.03;
        cameraRef.current.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 17. Cleanup
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
  }, [mode, activeSection]);

  // Smooth mode transition orchestration
  useEffect(() => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;

    if (mode === "login") {
      gsap.to(camera.position, { x: 0, y: 0, z: 7.8, duration: 1.0, ease: "power2.out" });
    } else if (mode === "signup") {
      gsap.to(camera.position, { x: 0, y: 0, z: 7.8, duration: 1.0, ease: "power2.out" });
    } else {
      gsap.to(camera.position, { x: 0, y: 0, z: 8.2, duration: 1.0, ease: "power2.out" });
    }
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
