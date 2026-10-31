"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";

interface HeaderProps {
  onNavigate?: (href: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const router = useRouter();

  const handleNav = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      gsap.to("main", {
        x: "-100%",
        opacity: 0,
        duration: 0.45,
        ease: "power3.inOut",
        onComplete: () => router.push(href),
      });
    }
  };

  return (
    <header className="h-16 border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-[#0c0e14]/40 backdrop-blur-2xl px-4 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-50 transition-colors">
      <Link href="/" className="flex items-center gap-3 group cursor-pointer">
        <div className="w-8 h-8 rounded-xl bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs transition-transform group-hover:scale-105">
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
          className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#444746] dark:text-[#c4c6cf] hover:text-[#0b57d0] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          Login
        </button>

        <button
          onClick={() => handleNav("/sign-up")}
          className="px-4.5 py-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] active:scale-95 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
