"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export interface HeaderProps {
  onGetStarted: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onGetStarted }) => {
  return (
    <header className="h-16 border-b border-[#e0e3e7] bg-[#f8fafd] px-6 lg:px-10 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
          P
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tight text-[#1f1f1f]">
            PACT
          </span>
          <span className="text-xs font-semibold text-[#0b57d0] tracking-wide uppercase bg-[#d3e3fd] px-2 py-0.5 rounded-full">
            Console
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c4eed0] text-[#146c2e] text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#146c2e] animate-pulse" />
          <span>Local Engine Standby</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.open("https://github.com/iAditya-Nanda/pact", "_blank");
          }}
          icon={
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          }
          className="hidden sm:inline-flex"
        >
          GitHub
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onGetStarted}
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Get Started
        </Button>
      </div>
    </header>
  );
};
