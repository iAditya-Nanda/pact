"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Button } from "@/components/ui/Button";
import {
  ArrowRight,
  ShieldCheck,
  CalendarCheck2,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="h-screen max-h-screen flex flex-col justify-between overflow-hidden bg-[#f8fafd] select-none">
      {/* Top Application Bar */}
      <Header />

      {/* Main Hero & Content Canvas */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-6 py-4 md:py-8 max-w-5xl mx-auto w-full">
        {/* Display Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#1f1f1f] leading-tight mb-5">
          Autonomous Cross-App Orchestration
          <br className="hidden sm:inline" /> for Executive Workflows
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-[#444746] max-w-2xl font-normal leading-relaxed mb-8">
          Coordinate communications, schedules, and priority tasks with verified
          agentic execution, proactive conflict detection, and guarded human
          clearance before consequential actions.
        </p>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <Link href="/sign-up">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Login
            </Button>
          </Link>
        </div>

        {/* 3 M3 Status KPI Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full max-w-4xl text-left">
          <div className="rounded-2xl bg-white border border-[#e0e3e7] p-4.5 flex items-center gap-3.5 shadow-xs hover:border-[#0b57d0]/40 transition-all">
            <div className="w-10 h-10 rounded-full bg-[#c4eed0] text-[#146c2e] flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1f1f1f] truncate">
                Schedule Integrity
              </div>
              <div className="text-xs text-[#747775] truncate">
                Deterministic conflict detection
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#e0e3e7] p-4.5 flex items-center gap-3.5 shadow-xs hover:border-[#0b57d0]/40 transition-all">
            <div className="w-10 h-10 rounded-full bg-[#e8def8] text-[#65558f] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1f1f1f] truncate">
                Guarded Autonomy
              </div>
              <div className="text-xs text-[#747775] truncate">
                Consequential actions require approval
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#e0e3e7] p-4.5 flex items-center gap-3.5 shadow-xs hover:border-[#0b57d0]/40 transition-all">
            <div className="w-10 h-10 rounded-full bg-[#d3e3fd] text-[#0b57d0] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1f1f1f] truncate">
                Verified Reliability
              </div>
              <div className="text-xs text-[#747775] truncate">
                Cryptographic idempotency protection
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-[#e0e3e7] bg-[#f8fafd] px-6 lg:px-10 flex items-center justify-between text-xs text-[#747775] shrink-0">
        <div>PACT • Executive Operating System</div>
        <div className="hidden sm:block">
          All consequential tool calls cryptographically verified
        </div>
      </footer>
    </div>
  );
}
