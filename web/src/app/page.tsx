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
  Lock,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  // Monitor scroll progress for subtle 3D scene lane adaptation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      if (scrollY < vh * 0.8) {
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
        y: -14,
        duration: 0.3,
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
        {/* Full-Bleed Autonomous 3D WebGL Canvas Layer */}
        <Scene3D mode="landing" activeSection={activeSection} />

        {/* Ambient Depth Layer */}
        <div className="fixed inset-0 pointer-events-none z-1 bg-gradient-to-b from-transparent via-[#f8fafd]/25 dark:via-[#0c0e14]/30 to-[#f8fafd]/90 dark:to-[#0c0e14]/90" />

        {/* Main Clean Content Hierarchy */}
        <div ref={mainRef} className="relative z-10 flex flex-col min-h-screen">
          {/* Top Application Bar */}
          <Header />

          {/* SECTION 1: HERO CANVAS */}
          <section className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto w-full pt-6 pb-16">
            {/* Top Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-md border border-[#e0e3e7] dark:border-[#34373d] shadow-2xs mb-6">
              <span className="w-2 h-2 rounded-full bg-[#1e8e3e]" />
              <span className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6]">
                Google Workspace Live Orchestration
              </span>
            </div>

            {/* Display Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#1f1f1f] dark:text-white leading-[1.1] mb-6">
              Autonomous Cross-App
              <br />
              <span className="text-[#0b57d0] dark:text-[#a8c7fa]">
                Executive Workflows
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#444746] dark:text-[#c4c6cf] max-w-2xl font-normal leading-relaxed mb-10">
              Deterministic coordination across Gmail, Google Calendar, and Tasks with verified tool execution, schedule defense, and guarded human clearance.
            </p>

            {/* Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-16">
              <button
                onClick={() => navigateWithTransition("/sign-up")}
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] active:scale-98 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigateWithTransition("/login")}
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-md hover:bg-white dark:hover:bg-[#282a2f] active:scale-98 border border-[#e0e3e7] dark:border-[#34373d] text-[#1f1f1f] dark:text-[#e2e2e6] font-semibold text-sm shadow-2xs transition-all flex items-center justify-center cursor-pointer"
              >
                <span>Executive Login</span>
              </button>
            </div>

            {/* 3 M3 Status KPI Preview Cards (Section 4.3 from DESIGN.md) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full max-w-4xl text-left">
              {/* Card 1: Schedule Integrity */}
              <div className="rounded-2xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-4.5 flex items-center gap-3.5 shadow-xs hover:border-[#0b57d0]/40 transition-all">
                <div className="w-10 h-10 rounded-full bg-[#c4eed0] dark:bg-[#0f5223] text-[#146c2e] dark:text-[#81c995] flex items-center justify-center shrink-0">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1f1f1f] dark:text-white truncate">
                    Schedule Integrity
                  </div>
                  <div className="text-xs text-[#747775] dark:text-[#8e9099] truncate">
                    0 conflicts detected
                  </div>
                </div>
              </div>

              {/* Card 2: Priority Deadlines */}
              <div className="rounded-2xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-4.5 flex items-center gap-3.5 shadow-xs hover:border-[#0b57d0]/40 transition-all">
                <div className="w-10 h-10 rounded-full bg-[#d3e3fd] dark:bg-[#0842a0] text-[#0b57d0] dark:text-[#a8c7fa] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1f1f1f] dark:text-white truncate">
                    Priority Deadlines
                  </div>
                  <div className="text-xs text-[#747775] dark:text-[#8e9099] truncate">
                    2 deliverables due today
                  </div>
                </div>
              </div>

              {/* Card 3: Action Clearance Queue */}
              <div className="rounded-2xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-4.5 flex items-center gap-3.5 shadow-xs hover:border-[#0b57d0]/40 transition-all">
                <div className="w-10 h-10 rounded-full bg-[#e8def8] dark:bg-[#381e72] text-[#65558f] dark:text-[#d0bcff] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1f1f1f] dark:text-white truncate">
                    Action Clearance
                  </div>
                  <div className="text-xs text-[#747775] dark:text-[#8e9099] truncate">
                    1 consequential action paused
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="mt-12 flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
              <span className="text-3xs font-semibold uppercase tracking-wider text-[#747775] dark:text-[#8e9099]">
                Scroll to view system
              </span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce text-[#0b57d0] dark:text-[#a8c7fa]" />
            </div>
          </section>

          {/* SECTION 2: THE THREE WORKSPACE PILLARS */}
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
              <div className="rounded-2xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <img src="/icons/gmail.png" alt="Gmail" className="w-7 h-7 object-contain" />
                    <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-[#e6f4ea] dark:bg-[#0f5223] text-[#137333] dark:text-[#81c995]">
                      Official Stream
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white mb-1.5">
                    Gmail Intelligence
                  </h3>
                  <p className="text-xs text-[#747775] dark:text-[#8e9099] leading-relaxed">
                    Prioritizes critical correspondence, flags urgent security alerts, and drafts context-rich replies.
                  </p>
                </div>
                <div className="pt-3.5 mt-4 border-t border-[#e0e3e7]/80 dark:border-[#34373d] text-3xs font-semibold text-[#0b57d0] dark:text-[#a8c7fa]">
                  Real-time unread synchronization
                </div>
              </div>

              {/* Pillar 2: Calendar */}
              <div className="rounded-2xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <img src="/icons/calendar.png" alt="Calendar" className="w-7 h-7 object-contain" />
                    <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-[#e8f0fe] dark:bg-[#0842a0] text-[#1967d2] dark:text-[#a8c7fa]">
                      Deterministic
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white mb-1.5">
                    Calendar Defense
                  </h3>
                  <p className="text-xs text-[#747775] dark:text-[#8e9099] leading-relaxed">
                    Protects protected focus blocks, detects meeting overlaps, and calculates weekly meeting loads.
                  </p>
                </div>
                <div className="pt-3.5 mt-4 border-t border-[#e0e3e7]/80 dark:border-[#34373d] text-3xs font-semibold text-[#0b57d0] dark:text-[#a8c7fa]">
                  Google Meet integration
                </div>
              </div>

              {/* Pillar 3: Tasks */}
              <div className="rounded-2xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <img src="/icons/tasks.svg" alt="Tasks" className="w-7 h-7 object-contain" />
                    <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-[#fef7e0] dark:bg-[#332a00] text-[#7c4a00] dark:text-[#fdd663]">
                      Action Queue
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white mb-1.5">
                    Tasks Pipeline
                  </h3>
                  <p className="text-xs text-[#747775] dark:text-[#8e9099] leading-relaxed">
                    Turns debriefs and emails into actionable items with due dates, priorities, and status tracking.
                  </p>
                </div>
                <div className="pt-3.5 mt-4 border-t border-[#e0e3e7]/80 dark:border-[#34373d] text-3xs font-semibold text-[#0b57d0] dark:text-[#a8c7fa]">
                  HMAC SHA-256 idempotency locks
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: GUARDED EXECUTION SPECIFICATION */}
          <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto w-full">
            <div className="rounded-3xl bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-7 md:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-md">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#146c2e]/10 dark:bg-[#81c995]/10 text-2xs font-bold text-[#146c2e] dark:text-[#81c995] mb-3">
                  <Lock className="w-3 h-3" />
                  <span>Guarded Execution Protocol</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1f1f1f] dark:text-white mb-3">
                  Zero Black-Box Actions
                </h2>
                <p className="text-xs sm:text-sm text-[#444746] dark:text-[#c4c6cf] leading-relaxed">
                  Every consequential state change (sending emails, rescheduling meetings, or creating priority tasks) requires explicit human clearance before dispatch.
                </p>
              </div>

              <div className="w-full md:w-80 space-y-2.5">
                <div className="p-3.5 rounded-xl bg-[#f0f4f9] dark:bg-[#282a2f] border border-[#e0e3e7] dark:border-[#34373d] text-xs">
                  <div className="text-3xs font-bold text-[#747775] dark:text-[#8e9099] uppercase mb-0.5">
                    Clearance Rule
                  </div>
                  <div className="font-semibold text-[#1f1f1f] dark:text-white">
                    Avoid meetings before 10:00 AM
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#e8f0fe] dark:bg-[#0842a0]/30 border border-[#0b57d0]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#0b57d0] dark:text-[#a8c7fa] font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Safe Mode Active</span>
                  </div>
                  <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-[#0b57d0] text-white">
                    Guarded
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: CALL TO ACTION BANNER */}
          <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto w-full text-center">
            <div className="rounded-3xl bg-white/85 dark:bg-[#1d1f24]/85 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] p-8 md:p-12 shadow-md">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#1f1f1f] dark:text-white mb-3">
                Experience Autonomous Executive Computing
              </h2>
              <p className="text-xs sm:text-sm text-[#444746] dark:text-[#c4c6cf] max-w-md mx-auto leading-relaxed mb-7">
                Connect your Google Workspace and orchestrate priority communication, focus defense, and task delivery.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigateWithTransition("/sign-up")}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] active:scale-98 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Sign Up with Google</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => navigateWithTransition("/login")}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-white dark:bg-[#282a2f] hover:bg-[#f0f4f9] dark:hover:bg-[#34373d] active:scale-98 border border-[#e0e3e7] dark:border-[#34373d] text-[#1f1f1f] dark:text-[#e2e2e6] font-semibold text-xs shadow-2xs transition-all flex items-center justify-center cursor-pointer"
                >
                  <span>Return to Session</span>
                </button>
              </div>
            </div>
          </section>

          {/* Clean M3 Footer */}
          <footer className="mt-auto border-t border-[#e0e3e7] dark:border-[#34373d] bg-white/70 dark:bg-[#111318]/70 backdrop-blur-md px-6 lg:px-12 py-3.5 flex flex-col sm:flex-row items-center justify-between text-2xs text-[#747775] dark:text-[#8e9099] gap-2">
            <div>PACT • Executive Operating System</div>
            <div>All consequential actions cryptographically verified</div>
          </footer>
        </div>
      </div>
    </SmoothScroll>
  );
}
