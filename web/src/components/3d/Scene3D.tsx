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
  const [loadError, setLoadError] = useState<string | null>(null);

  // References to 3D objects for GSAP transitions and render loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const cardsMixerRef = useRef<THREE.AnimationMixer | null>(null);

  const jellyfishGroupRef = useRef<THREE.Group | null>(null);
  const rocketGroupRef = useRef<THREE.Group | null>(null);
  const cardsGroupRef = useRef<THREE.Group | null>(null);
  const lightningGroupRef = useRef<THREE.Group | null>(null);
  const heartGroupRef = useRef<THREE.Group | null>(null);
  const eyeGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Mouse coordinates with damping
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Deep modern executive dark/light ambient fog
    scene.fog = new THREE.FogExp2(0x080c16, 0.035);

    // 2. Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    // 3. Renderer Setup
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

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0x0b1c3d, 2.2);
    scene.add(ambientLight);

    const primaryLight = new THREE.DirectionalLight(0x4285f4, 3.5);
    primaryLight.position.set(5, 8, 6);
    scene.add(primaryLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 2.5);
    rimLight.position.set(-6, -3, -4);
    scene.add(rimLight);

    const goldAccentLight = new THREE.PointLight(0xfbbc04, 2.8, 15);
    goldAccentLight.position.set(2, -1, 3);
    scene.add(goldAccentLight);

    const purpleGlowLight = new THREE.PointLight(0x8ab4f8, 2.2, 12);
    purpleGlowLight.position.set(-2, 3, 2);
    scene.add(purpleGlowLight);

    // 5. Bioluminescent Particle Field (Floating Spores / Embers)
    const particleCount = 180;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color(0x4285f4), // Google Blue
      new THREE.Color(0x00e5ff), // Cyan
      new THREE.Color(0xa8c7fa), // Light Blue
      new THREE.Color(0xfbbc04), // Golden Amber
      new THREE.Color(0x34a853), // Green Emerald
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // 6. Draco and GLTF Loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // 7. Load Jellyfish.glb (Primary Star Model)
    const jellyfishGroup = new THREE.Group();
    scene.add(jellyfishGroup);
    jellyfishGroupRef.current = jellyfishGroup;

    // Initial position based on mode
    if (mode === "landing") {
      jellyfishGroup.position.set(1.9, 0.1, 0.2);
      jellyfishGroup.rotation.set(0.15, -0.3, 0.05);
      jellyfishGroup.scale.setScalar(0.72);
    } else if (mode === "login") {
      jellyfishGroup.position.set(-2.2, 0.1, 0.5);
      jellyfishGroup.rotation.set(0.1, 0.4, 0);
      jellyfishGroup.scale.setScalar(0.68);
    } else {
      // signup
      jellyfishGroup.position.set(2.4, -0.1, 0.4);
      jellyfishGroup.rotation.set(0.1, -0.4, 0);
      jellyfishGroup.scale.setScalar(0.68);
    }

    gltfLoader.load(
      "/models/Jellyfish.glb",
      (gltf) => {
        const model = gltf.scene;

        // Enhance Jellyfish materials with ethereal translucency & bioluminescence
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const origMat = mesh.material as THREE.MeshStandardMaterial;
              const enhancedMat = new THREE.MeshPhysicalMaterial({
                color: origMat.color || new THREE.Color(0x38bdf8),
                emissive: new THREE.Color(0x0369a1),
                emissiveIntensity: 0.45,
                roughness: 0.15,
                metalness: 0.1,
                transmission: 0.65,
                thickness: 1.2,
                ior: 1.33,
                transparent: true,
                opacity: 0.88,
              });
              mesh.material = enhancedMat;
            }
          }
        });

        jellyfishGroup.add(model);

        // Play the embedded swimming skeletal animation
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations[0];
          const action = mixer.clipAction(clip);
          action.setEffectiveTimeScale(0.75); // Silky hypnotic cadence
          action.play();
          mixerRef.current = mixer;
        }

        setIsLoaded(true);
      },
      undefined,
      (err) => {
        console.warn("Failed to load Jellyfish model:", err);
        setLoadError("Jellyfish 3D asset initialization deferred.");
      }
    );

    // 8. Load Rocket.glb (Secondary Model for Speed / Launch)
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
            if (mesh.material) {
              (mesh.material as THREE.MeshStandardMaterial).metalness = 0.6;
              (mesh.material as THREE.MeshStandardMaterial).roughness = 0.25;
            }
          }
        });
        model.scale.setScalar(0.012);
        rocketGroup.add(model);

        if (mode === "signup") {
          rocketGroup.position.set(1.9, 1.4, 0.8);
          rocketGroup.rotation.set(-0.35, 0.5, 0.4);
          rocketGroup.visible = true;
        } else if (mode === "landing") {
          rocketGroup.position.set(-2.8, -1.8, -0.5);
          rocketGroup.rotation.set(-0.2, 0.8, 0.3);
          rocketGroup.visible = true;
        } else {
          rocketGroup.position.set(2.8, -1.5, 0);
          rocketGroup.rotation.set(0.2, -0.5, 0.2);
          rocketGroup.visible = true;
        }
      },
      undefined,
      (err) => console.warn("Rocket load note:", err)
    );

    // 9. Load Cards2Anim.glb (Workspace 3D Cards with animation)
    const cardsGroup = new THREE.Group();
    scene.add(cardsGroup);
    cardsGroupRef.current = cardsGroup;

    gltfLoader.load(
      "/models/Cards2Anim.glb",
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(0.008);
        cardsGroup.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.setEffectiveTimeScale(0.6);
            action.play();
          });
          cardsMixerRef.current = mixer;
        }

        cardsGroup.position.set(-2.2, 1.3, -0.4);
        cardsGroup.rotation.set(0.2, 0.4, -0.1);
        cardsGroup.visible = mode === "landing";
      },
      undefined,
      (err) => console.warn("Cards2Anim load note:", err)
    );

    // 10. Load Lightning.glb (Speed & Action Execution Icon)
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
              color: new THREE.Color(0xfbbc04),
              emissive: new THREE.Color(0xf59e0b),
              emissiveIntensity: 0.6,
              roughness: 0.2,
              metalness: 0.8,
            });
          }
        });
        model.scale.setScalar(0.012);
        lightningGroup.add(model);

        if (mode === "login") {
          lightningGroup.position.set(-1.4, -1.4, 1.2);
          lightningGroup.rotation.set(0.2, 0.3, 0.1);
          lightningGroup.visible = true;
        } else {
          lightningGroup.position.set(2.8, -1.8, 0.2);
          lightningGroup.rotation.set(0.1, -0.4, 0.2);
          lightningGroup.visible = mode === "landing";
        }
      },
      undefined,
      (err) => console.warn("Lightning load note:", err)
    );

    // 11. Mouse Movement Handler for Interactive Parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 12. Window Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 13. Main Render Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Update Skeletal Animations
      if (mixerRef.current) mixerRef.current.update(delta);
      if (cardsMixerRef.current) cardsMixerRef.current.update(delta);

      // Smooth Mouse Damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Jellyfish Organic Floating & Undulation
      if (jellyfishGroupRef.current) {
        const jf = jellyfishGroupRef.current;
        jf.position.y += Math.sin(elapsedTime * 1.4) * 0.0018;
        jf.position.x += Math.cos(elapsedTime * 0.9) * 0.0012;

        // Subtle cursor parallax
        jf.rotation.y += (mouseRef.current.x * 0.35 - jf.rotation.y + (mode === "login" ? 0.4 : -0.35)) * 0.03;
        jf.rotation.x += (-mouseRef.current.y * 0.25 - jf.rotation.x + 0.1) * 0.03;
      }

      // Rocket Hovering
      if (rocketGroupRef.current && rocketGroupRef.current.visible) {
        const rocket = rocketGroupRef.current;
        rocket.position.y += Math.sin(elapsedTime * 2.0) * 0.002;
        rocket.rotation.y += 0.008;
      }

      // Cards Rotation
      if (cardsGroupRef.current && cardsGroupRef.current.visible) {
        const cards = cardsGroupRef.current;
        cards.position.y += Math.sin(elapsedTime * 1.2) * 0.0015;
        cards.rotation.y = 0.4 + mouseRef.current.x * 0.15;
      }

      // Lightning Rotation & Energy Pulse
      if (lightningGroupRef.current && lightningGroupRef.current.visible) {
        const lightning = lightningGroupRef.current;
        lightning.rotation.y += 0.015;
        lightning.position.y += Math.sin(elapsedTime * 2.5) * 0.002;
      }

      // Particle Drift
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.02 + mouseRef.current.x * 0.05;
        particlesRef.current.rotation.x = mouseRef.current.y * 0.03;
      }

      // Camera Damping
      if (cameraRef.current) {
        cameraRef.current.position.x += (mouseRef.current.x * 0.35 - cameraRef.current.position.x) * 0.03;
        cameraRef.current.position.y += (mouseRef.current.y * 0.25 - cameraRef.current.position.y) * 0.03;
        cameraRef.current.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 14. Cleanup
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
  }, []);

  // 15. GSAP Transitions across Mode & Scroll Sections
  useEffect(() => {
    if (!jellyfishGroupRef.current || !cameraRef.current) return;

    const jf = jellyfishGroupRef.current;
    const camera = cameraRef.current;
    const rocket = rocketGroupRef.current;
    const cards = cardsGroupRef.current;
    const lightning = lightningGroupRef.current;

    if (mode === "login") {
      // Transition to Login: Jellyfish glides to the left side
      gsap.to(jf.position, {
        x: -2.2,
        y: 0.15,
        z: 0.6,
        duration: 1.1,
        ease: "power3.inOut",
      });
      gsap.to(jf.rotation, {
        x: 0.1,
        y: 0.45,
        z: 0.05,
        duration: 1.1,
        ease: "power3.inOut",
      });
      gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 7.2,
        duration: 1.0,
        ease: "power2.out",
      });

      if (rocket) {
        gsap.to(rocket.position, { x: 3.2, y: -2.0, z: -1, duration: 0.8 });
      }
      if (lightning) {
        lightning.visible = true;
        gsap.to(lightning.position, { x: -1.2, y: -1.3, z: 1.4, duration: 1.0 });
      }
      if (cards) cards.visible = false;
    } else if (mode === "signup") {
      // Transition to Sign Up: Jellyfish on right, Rocket ready to launch
      gsap.to(jf.position, {
        x: 2.3,
        y: -0.2,
        z: 0.5,
        duration: 1.1,
        ease: "power3.inOut",
      });
      gsap.to(jf.rotation, {
        x: 0.08,
        y: -0.42,
        z: -0.05,
        duration: 1.1,
        ease: "power3.inOut",
      });

      if (rocket) {
        rocket.visible = true;
        gsap.to(rocket.position, {
          x: 2.0,
          y: 1.3,
          z: 0.9,
          duration: 1.2,
          ease: "power3.out",
        });
        gsap.to(rocket.rotation, {
          x: -0.3,
          y: 0.6,
          z: 0.35,
          duration: 1.2,
          ease: "power3.out",
        });
      }
      if (lightning) lightning.visible = false;
      if (cards) cards.visible = false;
    } else {
      // Landing Page: Position according to scroll section
      if (activeSection === 0) {
        // Hero Section
        gsap.to(jf.position, {
          x: 1.9,
          y: 0.1,
          z: 0.2,
          duration: 1.0,
          ease: "power2.out",
        });
        gsap.to(jf.scale, { x: 0.72, y: 0.72, z: 0.72, duration: 1.0 });
        if (cards) {
          cards.visible = true;
          gsap.to(cards.position, { x: -2.2, y: 1.3, z: -0.4, duration: 1.0 });
        }
        if (lightning) {
          lightning.visible = true;
          gsap.to(lightning.position, { x: 2.8, y: -1.8, z: 0.2, duration: 1.0 });
        }
        if (rocket) {
          rocket.visible = true;
          gsap.to(rocket.position, { x: -2.8, y: -1.8, z: -0.5, duration: 1.0 });
        }
      } else if (activeSection === 1) {
        // Architecture Section: Jellyfish moves to center-left
        gsap.to(jf.position, {
          x: -1.8,
          y: 0.2,
          z: 0.8,
          duration: 1.1,
          ease: "power2.out",
        });
        gsap.to(jf.rotation, { y: 0.3, duration: 1.0 });
        if (cards) {
          cards.visible = true;
          gsap.to(cards.position, { x: 1.8, y: 0.2, z: 0.5, duration: 1.0 });
        }
      } else if (activeSection === 2) {
        // Safety / Guarded Execution Section
        gsap.to(jf.position, {
          x: 1.7,
          y: -0.4,
          z: 0.4,
          duration: 1.1,
          ease: "power2.out",
        });
        if (lightning) {
          lightning.visible = true;
          gsap.to(lightning.position, { x: -1.8, y: 0.1, z: 0.6, duration: 1.0 });
        }
      } else {
        // CTA Final Section
        gsap.to(jf.position, {
          x: 0,
          y: 0.2,
          z: 1.2,
          duration: 1.2,
          ease: "power3.out",
        });
        gsap.to(jf.scale, { x: 0.82, y: 0.82, z: 0.82, duration: 1.2 });
      }
    }
  }, [mode, activeSection]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Subtle ambient gradient overlay for depth */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#f8fafd]/20 dark:via-[#111318]/40 to-[#f8fafd]/80 dark:to-[#111318]/90 pointer-events-none" />
    </div>
  );
};
