"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-[#e0e3e7] bg-[#f8fafd] px-6 lg:px-10 flex items-center justify-between shrink-0">
      <Link href="/" className="flex items-center gap-3 group cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs transition-transform group-hover:scale-105">
          P
        </div>
        <span className="text-xl font-bold tracking-tight text-[#1f1f1f]">
          PACT
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Login
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Get Started
          </Button>
        </Link>
      </div>
    </header>
  );
};
