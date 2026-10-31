"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";

export const Header: React.FC = () => {
  const router = useRouter();

  const handleNav = (href: string) => {
    gsap.to("main", {
      opacity: 0,
      y: -14,
      duration: 0.3,
      ease: "power2.inOut",
      onComplete: () => router.push(href),
    });
  };

  return (
    <header className="h-16 border-b border-[#e0e3e7]/80 dark:border-[#34373d]/80 bg-white/70 dark:bg-[#111318]/70 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-3 group cursor-pointer">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0b57d0] to-[#38bdf8] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs transition-transform group-hover:scale-105">
          P
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-[#1f1f1f] dark:text-white">
            P.A.C.T.
          </span>
          <span className="text-xs font-medium text-[#747775] dark:text-[#8e9099] hidden sm:inline">
            - Proactive Agent for Coordinated Tasks
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleNav("/login")}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#444746] dark:text-[#c4c6cf] hover:text-[#0b57d0] dark:hover:text-white hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] transition-all cursor-pointer"
        >
          Login
        </button>

        <button
          onClick={() => handleNav("/sign-up")}
          className="px-4 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] active:scale-95 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
