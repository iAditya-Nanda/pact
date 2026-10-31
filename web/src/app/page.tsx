"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/landing/Header";
import { Button } from "@/components/ui/Button";
import { Scene3D } from "@/components/3d/Scene3D";
import { SmoothScroll } from "@/components/3d/SmoothScroll";
import gsap from "gsap";
import {
  ArrowRight,
  ShieldCheck,
  CalendarCheck2,
  CheckCircle2,
  Sparkles,
  Zap,
  Lock,
  Layers,
  ChevronDown,
  Activity,
  Cpu,
  Eye,
  Rocket,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [selectedModelFocus, setSelectedModelFocus] = useState<string>("jellyfish");
  const mainRef = useRef<HTMLDivElement>(null);

  // Monitor scroll progress to update 3D scene choreography
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      if (scrollY < vh * 0.7) {
        setActiveSection(0);
      } else if (scrollY < vh * 1.8) {
        setActiveSection(1);
      } else if (scrollY < vh * 2.8) {
        setActiveSection(2);
      } else {
        setActiveSection(3);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth page transition helper
  const navigateWithTransition = (href: string) => {
    if (mainRef.current) {
      gsap.to(mainRef.current, {
        opacity: 0,
        y: -16,
        duration: 0.35,
        ease: "power2.inOut",
        onComplete: () => {
          router.push(href);
        },
      });
    } else {
      router.push(href);
    }
  };

  return (
    <SmoothScroll>
      <div className="min-h-screen relative bg-[#f8fafd] dark:bg-[#0c0e14] text-[#1f1f1f] dark:text-[#e2e2e6] selection:bg-[#0b57d0]/20 overflow-x-hidden">
        {/* Full-Bleed 3D WebGL Canvas Layer */}
        <Scene3D mode="landing" activeSection={activeSection} />

        {/* Floating Ambient Atmosphere Layer */}
        <div className="fixed inset-0 pointer-events-none z-1 bg-gradient-to-b from-transparent via-[#f8fafd]/40 dark:via-[#0c0e14]/40 to-[#f8fafd] dark:to-[#0c0e14]" />

        {/* Content Container */}
        <div ref={mainRef} className="relative z-10 flex flex-col min-h-screen">
          {/* Top Header */}
          <Header />

          {/* SECTION 1: HERO CANVAS */}
          <section className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto w-full pt-8 pb-16">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-md border border-[#e0e3e7] dark:border-[#34373d] shadow-2xs mb-6 animate-in fade-in slide-in-from-top-3 duration-500">
              <Sparkles className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
              <span className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6]">
                3D Autonomous Executive Computing
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e8e3e]" />
            </div>

            {/* Display Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1f1f1f] dark:text-white leading-[1.08] max-w-4xl mb-6">
              Autonomous Cross-App
              <span className="block bg-gradient-to-r from-[#0b57d0] via-[#4285f4] to-[#00b4d8] bg-clip-text text-transparent">
                Workflow Orchestration
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-[#444746] dark:text-[#c4c6cf] max-w-2xl font-normal leading-relaxed mb-10">
              Coordinate live Google Workspace streams, schedule integrity, and priority task pipelines with verified agentic execution, proactive conflict protection, and guarded human clearance.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-16">
              <button
                onClick={() => navigateWithTransition("/sign-up")}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] active:scale-98 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigateWithTransition("/login")}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-md hover:bg-white dark:hover:bg-[#282a2f] active:scale-98 border border-[#e0e3e7] dark:border-[#34373d] text-[#1f1f1f] dark:text-[#e2e2e6] font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Executive Login</span>
              </button>
            </div>

            {/* 3 Material 3 Status Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl text-left">
              <div className="rounded-2xl bg-white/70 dark:bg-[#1d1f24]/70 backdrop-blur-md border border-[#e0e3e7] dark:border-[#34373d] p-5 shadow-xs hover:border-[#0b57d0]/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#c4eed0] dark:bg-[#0f5223] text-[#146c2e] dark:text-[#81c995] flex items-center justify-center shrink-0 mb-3.5">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div className="text-base font-bold text-[#1f1f1f] dark:text-white mb-1">
                  Schedule Integrity
                </div>
                <div className="text-xs text-[#747775] dark:text-[#8e9099] leading-relaxed">
                  Deterministic conflict detection with proactive focus block preservation.
                </div>
              </div>

              <div className="rounded-2xl bg-white/70 dark:bg-[#1d1f24]/70 backdrop-blur-md border border-[#e0e3e7] dark:border-[#34373d] p-5 shadow-xs hover:border-[#0b57d0]/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#e8def8] dark:bg-[#381e72] text-[#65558f] dark:text-[#d0bcff] flex items-center justify-center shrink-0 mb-3.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-base font-bold text-[#1f1f1f] dark:text-white mb-1">
                  Guarded Autonomy
                </div>
                <div className="text-xs text-[#747775] dark:text-[#8e9099] leading-relaxed">
                  Consequential actions require cryptographic human clearance before execution.
                </div>
              </div>

              <div className="rounded-2xl bg-white/70 dark:bg-[#1d1f24]/70 backdrop-blur-md border border-[#e0e3e7] dark:border-[#34373d] p-5 shadow-xs hover:border-[#0b57d0]/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#d3e3fd] dark:bg-[#0842a0] text-[#0b57d0] dark:text-[#a8c7fa] flex items-center justify-center shrink-0 mb-3.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-base font-bold text-[#1f1f1f] dark:text-white mb-1">
                  Verified Reliability
                </div>
                <div className="text-xs text-[#747775] dark:text-[#8e9099] leading-relaxed">
                  HMAC SHA-256 idempotency locks guarantee zero duplicate dispatches.
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="mt-14 flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
              <span className="text-2xs font-semibold uppercase tracking-wider text-[#747775] dark:text-[#8e9099]">
                Scroll To Explore System
              </span>
              <ChevronDown className="w-4 h-4 animate-bounce text-[#0b57d0] dark:text-[#a8c7fa]" />
            </div>
          </section>

          {/* SECTION 2: ARCHITECTURE & LIVE WORKSPACE STREAM */}
          <section className="py-24 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto w-full">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b57d0]/10 dark:bg-[#a8c7fa]/10 text-xs font-bold text-[#0b57d0] dark:text-[#a8c7fa] mb-4">
                <Layers className="w-3.5 h-3.5" />
                <span>Unified Cross-App Fabric</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1f1f1f] dark:text-white mb-4">
                Three Native Streams. One Autonomous Agent.
              </h2>
              <p className="text-sm sm:text-base text-[#444746] dark:text-[#c4c6cf] leading-relaxed">
                PACT continuously ingests, scores, and harmonizes real-time signals across your core business tools to prevent cognitive fragmentation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1: Gmail */}
              <div className="rounded-3xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <img src="/icons/gmail.png" alt="Gmail" className="w-8 h-8 object-contain" />
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-[#e6f4ea] dark:bg-[#0f5223] text-[#137333] dark:text-[#81c995]">
                      Live Stream
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1f1f1f] dark:text-white mb-2">
                    Priority Gmail Intelligence
                  </h3>
                  <p className="text-xs text-[#747775] dark:text-[#8e9099] leading-relaxed mb-4">
                    Eliminates unread noise by synthesizing incoming communications into executive briefs and context-aware draft responses.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#e0e3e7]/80 dark:border-[#34373d] text-2xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] flex items-center justify-between">
                  <span>Official Gmail Web View</span>
                  <span>Zero Lag</span>
                </div>
              </div>

              {/* Pillar 2: Calendar */}
              <div className="rounded-3xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <img src="/icons/calendar.png" alt="Calendar" className="w-8 h-8 object-contain" />
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-[#e8f0fe] dark:bg-[#0842a0] text-[#1967d2] dark:text-[#a8c7fa]">
                      Deterministic
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1f1f1f] dark:text-white mb-2">
                    Calendar Defense Protocol
                  </h3>
                  <p className="text-xs text-[#747775] dark:text-[#8e9099] leading-relaxed mb-4">
                    Protects deep-work focus blocks against meeting sprawl. Calculates meeting hours, detects overlap, and proposes friction-free shifts.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#e0e3e7]/80 dark:border-[#34373d] text-2xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] flex items-center justify-between">
                  <span>Google Meet Sync</span>
                  <span>100% Conflict Free</span>
                </div>
              </div>

              {/* Pillar 3: Tasks */}
              <div className="rounded-3xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <img src="/icons/tasks.svg" alt="Tasks" className="w-8 h-8 object-contain" />
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-[#fef7e0] dark:bg-[#332a00] text-[#7c4a00] dark:text-[#fdd663]">
                      Action Queue
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1f1f1f] dark:text-white mb-2">
                    Autonomous Tasks Pipeline
                  </h3>
                  <p className="text-xs text-[#747775] dark:text-[#8e9099] leading-relaxed mb-4">
                    Converts emails and debrief resolutions into structured deliverables with automated priority tagging, due date tracking, and escalation.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#e0e3e7]/80 dark:border-[#34373d] text-2xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] flex items-center justify-between">
                  <span>Cryptographic Locks</span>
                  <span>Audited Execution</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: 3D MODEL EXPLORER */}
          <section className="py-24 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto w-full">
            <div className="rounded-3xl bg-white/60 dark:bg-[#16181d]/60 backdrop-blur-2xl border border-[#e0e3e7] dark:border-[#34373d] p-8 md:p-12 shadow-xl relative overflow-hidden">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b57d0]/10 dark:bg-[#a8c7fa]/10 text-xs font-bold text-[#0b57d0] dark:text-[#a8c7fa] mb-4">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Interactive 3D Engine</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1f1f1f] dark:text-white mb-4">
                  Bioluminescent Agent Architecture
                </h2>
                <p className="text-sm text-[#444746] dark:text-[#c4c6cf] leading-relaxed mb-8">
                  Like a deep-sea jellyfish navigating complex oceanic currents, PACT moves gracefully through high-volume data streams with fluid adaptability, skeletal responsiveness, and zero cognitive drag.
                </p>

                {/* Model Characteristics */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#1d1f24]/80 border border-[#e0e3e7] dark:border-[#34373d]">
                    <div className="text-xs font-bold text-[#1f1f1f] dark:text-white mb-0.5">
                      Skeletal Rigging
                    </div>
                    <div className="text-2xs text-[#747775] dark:text-[#8e9099]">
                      437 armature bones undulating in real time
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#1d1f24]/80 border border-[#e0e3e7] dark:border-[#34373d]">
                    <div className="text-xs font-bold text-[#1f1f1f] dark:text-white mb-0.5">
                      ACES Filmic Lighting
                    </div>
                    <div className="text-2xs text-[#747775] dark:text-[#8e9099]">
                      Translucent PBR transmission &amp; glow
                    </div>
                  </div>
                </div>

                {/* Interactive Controls */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setSelectedModelFocus("jellyfish")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedModelFocus === "jellyfish"
                        ? "bg-[#0b57d0] text-white shadow-2xs"
                        : "bg-white/70 dark:bg-[#1d1f24]/70 border border-[#e0e3e7] dark:border-[#34373d] text-[#1f1f1f] dark:text-[#e2e2e6]"
                    }`}
                  >
                    Bioluminescent Jellyfish
                  </button>

                  <button
                    onClick={() => setSelectedModelFocus("rocket")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedModelFocus === "rocket"
                        ? "bg-[#0b57d0] text-white shadow-2xs"
                        : "bg-white/70 dark:bg-[#1d1f24]/70 border border-[#e0e3e7] dark:border-[#34373d] text-[#1f1f1f] dark:text-[#e2e2e6]"
                    }`}
                  >
                    Executive Rocket
                  </button>

                  <button
                    onClick={() => setSelectedModelFocus("cards")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedModelFocus === "cards"
                        ? "bg-[#0b57d0] text-white shadow-2xs"
                        : "bg-white/70 dark:bg-[#1d1f24]/70 border border-[#e0e3e7] dark:border-[#34373d] text-[#1f1f1f] dark:text-[#e2e2e6]"
                    }`}
                  >
                    3D Ecosystem Cards
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: SECURITY & GUARDED EXECUTION */}
          <section className="py-24 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e8e3e]/10 dark:bg-[#81c995]/10 text-xs font-bold text-[#137333] dark:text-[#81c995] mb-4">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Cryptographic Safety Guard</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1f1f1f] dark:text-white mb-4">
                  Guarded Execution.
                  <br />Zero Black-Box Surprises.
                </h2>
                <p className="text-sm sm:text-base text-[#444746] dark:text-[#c4c6cf] leading-relaxed mb-6">
                  Unlike opaque autonomous bots, PACT enforces strict Human-in-the-Loop clearances on all state mutations. No email is dispatched, no meeting is moved, and no calendar event is altered without cryptographic approval.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#e6f4ea] dark:bg-[#0f5223] text-[#137333] dark:text-[#81c995] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6]">
                      HMAC SHA-256 Idempotency verification prevents double-booking
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#e6f4ea] dark:bg-[#0f5223] text-[#137333] dark:text-[#81c995] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6]">
                      Chief of Staff Guarded Autonomy Mode (Safe vs. Turbo)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#e6f4ea] dark:bg-[#0f5223] text-[#137333] dark:text-[#81c995] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6]">
                      Audited multi-turn decision logs persisted in database
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Visual Blueprint Card */}
              <div className="rounded-3xl bg-white/70 dark:bg-[#1d1f24]/70 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-7 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e7] dark:border-[#34373d]">
                  <div className="text-xs font-bold text-[#1f1f1f] dark:text-white uppercase tracking-wider">
                    Safety Clearance Pipeline
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1e8e3e] animate-pulse" />
                    <span className="text-2xs font-semibold text-[#137333] dark:text-[#81c995]">
                      Armored
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f0f4f9] dark:bg-[#282a2f] border border-[#e0e3e7]/80 dark:border-[#34373d]">
                  <div className="text-2xs font-bold text-[#747775] dark:text-[#8e9099] uppercase mb-1">
                    AI Proposed Mutation
                  </div>
                  <div className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6]">
                    Reschedule Client Debrief to 3:30 PM
                  </div>
                  <div className="text-3xs text-[#747775] dark:text-[#8e9099] mt-1 font-mono">
                    idempotency_key: idem_reschedule_cal_0942_safe
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#e8f0fe] dark:bg-[#0842a0]/40 border border-[#0b57d0]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
                    <span className="text-xs font-semibold text-[#0b57d0] dark:text-[#a8c7fa]">
                      Awaiting Human Clearance
                    </span>
                  </div>
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-[#0b57d0] text-white">
                    Guarded
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: CALL TO ACTION FOOTER BANNER */}
          <section className="py-24 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto w-full text-center">
            <div className="rounded-3xl bg-gradient-to-b from-white/90 to-white/70 dark:from-[#1d1f24]/90 dark:to-[#1d1f24]/70 backdrop-blur-2xl border border-[#e0e3e7] dark:border-[#34373d] p-10 md:p-14 shadow-2xl">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1f1f1f] dark:text-white mb-4">
                Step Into Autonomous Executive Computing.
              </h2>
              <p className="text-sm sm:text-base text-[#444746] dark:text-[#c4c6cf] max-w-xl mx-auto leading-relaxed mb-8">
                Connect your Google Workspace in 1 click and experience fluid 3D workflow orchestration with Chief of Staff intelligence.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <button
                  onClick={() => navigateWithTransition("/sign-up")}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] active:scale-98 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign Up with Google</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigateWithTransition("/login")}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-[#282a2f] hover:bg-[#f0f4f9] dark:hover:bg-[#34373d] active:scale-98 border border-[#e0e3e7] dark:border-[#34373d] text-[#1f1f1f] dark:text-[#e2e2e6] font-bold text-sm shadow-xs transition-all flex items-center justify-center cursor-pointer"
                >
                  <span>Return to Session</span>
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-auto border-t border-[#e0e3e7] dark:border-[#34373d] bg-white/60 dark:bg-[#111318]/60 backdrop-blur-md px-6 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#747775] dark:text-[#8e9099] gap-2">
            <div>PACT • Proactive Agent for Coordinated Tasks</div>
            <div className="flex items-center gap-4">
              <span>Three.js WebGL &bull; GSAP &bull; Lenis</span>
              <span>All tool dispatches cryptographically verified</span>
            </div>
          </footer>
        </div>
      </div>
    </SmoothScroll>
  );
}
