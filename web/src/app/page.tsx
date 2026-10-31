"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/landing/Header";
import { Scene3D } from "@/components/3d/Scene3D";
import { SmoothScroll } from "@/components/3d/SmoothScroll";
import gsap from "gsap";
import {
  ArrowRight,
  ShieldCheck,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const mainRef = useRef<HTMLDivElement>(null);

  // Entrance slide animation on mount
  useEffect(() => {
    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  // Smooth slide-to-left transition when moving to Login or Sign-up
  const navigateWithTransition = (href: string) => {
    if (mainRef.current) {
      gsap.to(mainRef.current, {
        x: "-100%",
        opacity: 0,
        duration: 0.5,
        ease: "power3.inOut",
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
        {/* Full-Bleed 3D WebGL Jellyfish Layer */}
        <Scene3D mode="landing" />

        {/* Subtle Ambient Vignette Layer - Ultra-Clear for Jellyfish Visibility */}
        <div className="fixed inset-0 pointer-events-none z-[3] bg-gradient-to-b from-transparent via-transparent to-[#f8fafd]/25 dark:to-[#0c0e14]/30" />

        {/* Main Content Container with Slide Transitions */}
        <div ref={mainRef} className="relative z-10 flex flex-col min-h-screen">
          {/* Top Application Bar */}
          <Header onNavigate={navigateWithTransition} />

          {/* SECTION 1: HERO CANVAS — Text Left, Jellyfish Right */}
          <section className="min-h-[calc(100vh-4rem)] flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-20 max-w-7xl mx-auto w-full pt-8 pb-16">
            {/* Two-column layout: text left ~55%, jellyfish fills the right via 3D canvas */}
            <div className="w-full max-w-xl">
              {/* Big Main Display Heading: P.A.C.T. */}
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none mb-3 text-left">
                <span className="bg-gradient-to-r from-[#0b57d0] via-[#1a73e8] to-[#38bdf8] bg-clip-text text-transparent dark:from-white dark:via-[#7dd3fc] dark:to-[#38bdf8]">
                  P.A.C.T.
                </span>
              </h1>

              {/* Full Form */}
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#1f1f1f] dark:text-white tracking-tight mb-4 text-left">
                Proactive Agent for{" "}
                <span className="text-[#0b57d0] dark:text-[#38bdf8]">
                  Coordinated Tasks
                </span>
              </h2>

              {/* Subtitle / Core Executive Value */}
              <p className="text-base sm:text-lg text-[#444746] dark:text-[#c4c6cf] max-w-lg font-normal leading-relaxed mb-10 text-left">
                Autonomous cross-app executive operating system orchestrating Gmail, Google Calendar, and Tasks with verified tool execution, schedule defense, and guarded human clearance.
              </p>

              {/* Action Controls */}
              <div className="flex flex-col sm:flex-row items-start gap-3.5 w-full sm:w-auto mb-16">
                <button
                  onClick={() => navigateWithTransition("/sign-up")}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] active:scale-98 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigateWithTransition("/login")}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.15] dark:hover:bg-white/[0.08] active:scale-98 border border-white/30 dark:border-white/10 text-[#1f1f1f] dark:text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  <span>Executive Login</span>
                </button>
              </div>
            </div>

            {/* 3 Ultra-Transparent Glassmorphic KPI Cards — full width row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl text-left">
              {/* Card 1: Schedule Integrity */}
              <div className="rounded-2xl bg-white/[0.08] dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 p-5 flex items-center gap-4 shadow-md hover:border-white/50 dark:hover:border-white/20 transition-all">
                <div className="w-11 h-11 rounded-full bg-[#c4eed0]/40 dark:bg-[#0f5223]/40 backdrop-blur-md text-[#146c2e] dark:text-[#81c995] flex items-center justify-center shrink-0">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1f1f1f] dark:text-white truncate">
                    Schedule Integrity
                  </div>
                  <div className="text-xs text-[#747775] dark:text-[#c4c6cf] truncate">
                    0 conflicts detected
                  </div>
                </div>
              </div>

              {/* Card 2: Priority Deadlines */}
              <div className="rounded-2xl bg-white/[0.08] dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 p-5 flex items-center gap-4 shadow-md hover:border-white/50 dark:hover:border-white/20 transition-all">
                <div className="w-11 h-11 rounded-full bg-[#d3e3fd]/40 dark:bg-[#0842a0]/40 backdrop-blur-md text-[#0b57d0] dark:text-[#a8c7fa] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1f1f1f] dark:text-white truncate">
                    Priority Deadlines
                  </div>
                  <div className="text-xs text-[#747775] dark:text-[#c4c6cf] truncate">
                    2 deliverables due today
                  </div>
                </div>
              </div>

              {/* Card 3: Action Clearance Queue */}
              <div className="rounded-2xl bg-white/[0.08] dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 p-5 flex items-center gap-4 shadow-md hover:border-white/50 dark:hover:border-white/20 transition-all">
                <div className="w-11 h-11 rounded-full bg-[#e8def8]/40 dark:bg-[#381e72]/40 backdrop-blur-md text-[#65558f] dark:text-[#d0bcff] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1f1f1f] dark:text-white truncate">
                    Action Clearance
                  </div>
                  <div className="text-xs text-[#747775] dark:text-[#c4c6cf] truncate">
                    1 consequential action paused
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="mt-14 flex flex-col items-start gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
              <span className="text-3xs font-semibold uppercase tracking-wider text-[#747775] dark:text-[#8e9099]">
                Scroll to view system
              </span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce text-[#0b57d0] dark:text-[#a8c7fa]" />
            </div>
          </section>

          {/* SECTION 2: THE THREE WORKSPACE PILLARS - ULTRA-TRANSPARENT GLASS */}
          <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto w-full">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#1f1f1f] dark:text-white mb-3">
                Unified Google Workspace Fabric
              </h2>
              <p className="text-xs sm:text-sm text-[#444746] dark:text-[#c4c6cf] leading-relaxed">
                Continuous ingestion and harmonization across your core executive tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Pillar 1: Gmail */}
              <div className="rounded-3xl bg-white/[0.08] dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 p-6 shadow-lg flex flex-col justify-between hover:border-white/50 transition-all">
                <div>
                  <div className="mb-4">
                    <img src="/icons/gmail.png" alt="Gmail" className="w-8 h-8 object-contain" />
                  </div>
                  <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white mb-1.5">
                    Gmail Intelligence
                  </h3>
                  <p className="text-xs text-[#747775] dark:text-[#c4c6cf] leading-relaxed">
                    Prioritizes critical correspondence, flags urgent security alerts, and drafts context-rich replies.
                  </p>
                </div>
                <div className="pt-3.5 mt-4 border-t border-white/20 dark:border-white/10 text-3xs font-semibold text-[#0b57d0] dark:text-[#38bdf8]">
                  Real-time unread synchronization
                </div>
              </div>

              {/* Pillar 2: Calendar */}
              <div className="rounded-3xl bg-white/[0.08] dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 p-6 shadow-lg flex flex-col justify-between hover:border-white/50 transition-all">
                <div>
                  <div className="mb-4">
                    <img src="/icons/calendar.png" alt="Calendar" className="w-8 h-8 object-contain" />
                  </div>
                  <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white mb-1.5">
                    Calendar Defense
                  </h3>
                  <p className="text-xs text-[#747775] dark:text-[#c4c6cf] leading-relaxed">
                    Protects focus blocks, detects meeting overlaps, and calculates weekly meeting loads.
                  </p>
                </div>
                <div className="pt-3.5 mt-4 border-t border-white/20 dark:border-white/10 text-3xs font-semibold text-[#0b57d0] dark:text-[#38bdf8]">
                  Google Meet integration
                </div>
              </div>

              {/* Pillar 3: Tasks */}
              <div className="rounded-3xl bg-white/[0.08] dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 p-6 shadow-lg flex flex-col justify-between hover:border-white/50 transition-all">
                <div>
                  <div className="mb-4">
                    <img src="/icons/tasks.svg" alt="Tasks" className="w-8 h-8 object-contain" />
                  </div>
                  <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white mb-1.5">
                    Tasks Pipeline
                  </h3>
                  <p className="text-xs text-[#747775] dark:text-[#c4c6cf] leading-relaxed">
                    Turns debriefs and emails into actionable items with due dates, priorities, and status tracking.
                  </p>
                </div>
                <div className="pt-3.5 mt-4 border-t border-white/20 dark:border-white/10 text-3xs font-semibold text-[#0b57d0] dark:text-[#38bdf8]">
                  HMAC SHA-256 idempotency locks
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: GUARDED EXECUTION SPECIFICATION - ULTRA-TRANSPARENT GLASS */}
          <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto w-full">
            <div className="rounded-3xl bg-white/[0.08] dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 p-8 md:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-md">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1f1f1f] dark:text-white mb-3">
                  Zero Black-Box Actions
                </h2>
                <p className="text-xs sm:text-sm text-[#444746] dark:text-[#c4c6cf] leading-relaxed">
                  Every consequential state change (sending emails, rescheduling meetings, or creating priority tasks) requires explicit human clearance before dispatch.
                </p>
              </div>

              <div className="w-full md:w-80 space-y-3">
                <div className="p-4 rounded-2xl bg-white/[0.1] dark:bg-white/[0.04] backdrop-blur-md border border-white/25 dark:border-white/10 text-xs">
                  <div className="text-3xs font-bold text-[#747775] dark:text-[#8e9099] uppercase mb-0.5">
                    Clearance Rule
                  </div>
                  <div className="font-semibold text-[#1f1f1f] dark:text-white">
                    Avoid meetings before 10:00 AM
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b57d0]/10 dark:bg-[#38bdf8]/10 backdrop-blur-md border border-[#0b57d0]/25 dark:border-[#38bdf8]/25 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#0b57d0] dark:text-[#38bdf8] font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Safe Mode Active</span>
                  </div>
                  <span className="text-2xs font-bold text-[#0b57d0] dark:text-[#38bdf8]">
                    Guarded
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: CALL TO ACTION BANNER - ULTRA-TRANSPARENT GLASS */}
          <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto w-full text-center">
            <div className="rounded-3xl bg-white/[0.08] dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 p-8 md:p-12 shadow-xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#1f1f1f] dark:text-white mb-3">
                Experience Autonomous Executive Computing with P.A.C.T.
              </h2>
              <p className="text-xs sm:text-sm text-[#444746] dark:text-[#c4c6cf] max-w-md mx-auto leading-relaxed mb-7">
                Connect your Google Workspace and orchestrate priority communication, focus defense, and task delivery.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigateWithTransition("/sign-up")}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] active:scale-98 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Sign Up with Google</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => navigateWithTransition("/login")}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.15] dark:hover:bg-white/[0.08] active:scale-98 border border-white/30 dark:border-white/10 text-[#1f1f1f] dark:text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  <span>Return to Session</span>
                </button>
              </div>
            </div>
          </section>

          {/* Clean M3 Footer */}
          <footer className="mt-auto border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-[#0c0e14]/40 backdrop-blur-md px-6 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between text-2xs text-[#747775] dark:text-[#8e9099] gap-2">
            <div>PACT • Executive Operating System</div>
            <div>All consequential actions cryptographically verified</div>
          </footer>
        </div>
      </div>
    </SmoothScroll>
  );
}
