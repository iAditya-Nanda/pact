"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Check } from "lucide-react";

export default function LoginPage() {
  const { loginWithGoogle, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    setIsSubmitting(true);
    await loginWithGoogle(
      "adityananda.dev@gmail.com",
      "Aditya Nanda",
      "Lead Architect",
      24,
      "Avoid meetings before 10:00 AM"
    );
  };

  return (
    <div className="h-screen max-h-screen flex flex-col justify-between overflow-hidden bg-[#f8fafd] select-none">
      {/* Top Bar */}
      <header className="h-16 border-b border-[#e0e3e7] bg-[#f8fafd] px-6 lg:px-10 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs transition-transform group-hover:scale-105">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1f1f1f]">
            PACT
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#444746] hover:text-[#1f1f1f] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Login Card Canvas */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#e0e3e7] p-8 shadow-xs text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-xl bg-[#d3e3fd] text-[#0b57d0] flex items-center justify-center mx-auto mb-5 font-bold text-lg">
            P
          </div>

          <h1 className="text-2xl font-semibold text-[#1f1f1f] tracking-tight mb-2">
            Sign in to PACT
          </h1>

          <p className="text-sm text-[#444746] leading-relaxed mb-6">
            Access your autonomous executive workspace.
          </p>

          {/* Account Profile Card */}
          <div className="mb-6 p-3.5 rounded-xl bg-[#f0f4f9] border border-[#e0e3e7]/80 text-left flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#1f1f1f]">
                Aditya Nanda
              </div>
              <div className="text-xs text-[#747775]">adityananda.dev@gmail.com</div>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#c4eed0] text-[#146c2e] flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Google Sign In CTA */}
          <button
            onClick={handleSignIn}
            disabled={isLoading || isSubmitting}
            className="w-full rounded-full border border-[#e0e3e7] bg-white hover:bg-[#f0f4f9] active:bg-[#e4ebf5] px-6 py-3 font-medium text-sm text-[#1f1f1f] flex items-center justify-center gap-3 transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#0b57d0]" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {isSubmitting ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          <div className="pt-4 border-t border-[#e0e3e7]/60 text-xs text-[#444746]">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-[#0b57d0] font-semibold hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-[#e0e3e7] bg-[#f8fafd] px-6 lg:px-10 flex items-center justify-between text-xs text-[#747775] shrink-0">
        <div>PACT • Authentication Gateway</div>
        <div>Protected with End-to-End Cryptographic Clearance</div>
      </footer>
    </div>
  );
}
