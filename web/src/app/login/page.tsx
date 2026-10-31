"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Scene3D } from "@/components/3d/Scene3D";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import gsap from "gsap";

export default function LoginPage() {
  const { user, loginWithGoogle, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);

  // 1-second deliberate verification of active session
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("pact_auth_user")
          : null;

      if (user || stored) {
        router.push("/dashboard");
      } else {
        setIsVerifyingSession(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, router]);

  // Entrance slide from right
  useEffect(() => {
    if (!isVerifyingSession && pageRef.current) {
      gsap.fromTo(
        pageRef.current,
        { x: "100%", opacity: 0 },
        { x: "0%", opacity: 1, duration: 0.55, ease: "power3.out" }
      );
    }
  }, [isVerifyingSession]);

  const navigateBackToHome = () => {
    if (pageRef.current) {
      gsap.to(pageRef.current, {
        x: "100%",
        opacity: 0,
        duration: 0.45,
        ease: "power3.inOut",
        onComplete: () => router.push("/"),
      });
    } else {
      router.push("/");
    }
  };

  const navigateToSignUp = () => {
    if (pageRef.current) {
      gsap.to(pageRef.current, {
        x: "-100%",
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => router.push("/sign-up"),
      });
    } else {
      router.push("/sign-up");
    }
  };

  const handleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Firebase Sign-In Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMessage(
          "Sign-in window closed before completing authentication. Please try again."
        );
      } else if (err.code === "auth/unauthorized-domain") {
        setErrorMessage(
          "Domain not authorized in Firebase Console (Authentication > Settings > Authorized Domains)."
        );
      } else {
        setErrorMessage(err.message || "Failed to complete Google Sign-In.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dedicated 1-second session verification screen
  if (isVerifyingSession) {
    return (
      <div className="h-screen max-h-screen flex flex-col justify-between overflow-hidden bg-[#f8fafd] dark:bg-[#0c0e14] select-none text-[#1f1f1f] dark:text-[#e2e2e6] relative">
        <Scene3D mode="login" />
        <div className="relative z-10 flex flex-col h-full justify-between">
          <header className="h-16 border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-[#0c0e14]/40 backdrop-blur-2xl px-6 lg:px-10 flex items-center justify-between shrink-0">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
                P
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1f1f1f] dark:text-white">
                PACT
              </span>
            </Link>
          </header>

          <main className="flex-1 flex items-center justify-center px-6 py-8">
            <div className="flex flex-col items-center gap-3.5 p-8 rounded-3xl bg-white/25 dark:bg-[#1d1f24]/30 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-xl animate-in fade-in duration-200">
              <Loader2 className="w-8 h-8 animate-spin text-[#0b57d0] dark:text-[#38bdf8]" />
              <span className="text-sm font-medium text-[#444746] dark:text-[#c4c6cf]">
                Verifying active session...
              </span>
            </div>
          </main>

          <footer className="h-12 border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-[#0c0e14]/40 backdrop-blur-md px-6 lg:px-10 flex items-center justify-between text-2xs text-[#747775] dark:text-[#8e9099] shrink-0">
            <div>PACT • Authentication Gateway</div>
            <div>Secure session verification</div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={pageRef}
      className="min-h-screen flex flex-col justify-between overflow-hidden bg-[#f8fafd] dark:bg-[#0c0e14] select-none text-[#1f1f1f] dark:text-[#e2e2e6] relative"
    >
      {/* 3D WebGL Jellyfish Layer (mode="login") */}
      <Scene3D mode="login" />

      {/* Ambient Gradient Vignette */}
      <div className="fixed inset-0 pointer-events-none z-1 bg-gradient-to-r from-transparent via-[#f8fafd]/20 dark:via-[#0c0e14]/30 to-[#f8fafd]/70 dark:to-[#0c0e14]/80" />

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-[#0c0e14]/40 backdrop-blur-2xl px-6 lg:px-10 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs transition-transform group-hover:scale-105">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1f1f1f] dark:text-white">
              PACT
            </span>
          </Link>

          <button
            onClick={navigateBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#444746] dark:text-[#c4c6cf] hover:text-[#0b57d0] dark:hover:text-[#38bdf8] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </header>

        {/* Login Canvas: Jellyfish swimming on right, pure glass card */}
        <main className="flex-1 flex items-center justify-center lg:justify-start px-6 lg:px-24 py-8">
          <div className="max-w-md w-full bg-white/25 dark:bg-[#1d1f24]/30 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-white/10 p-8 sm:p-9 shadow-2xl text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-[#0b57d0] text-white flex items-center justify-center mx-auto mb-5 font-bold text-lg shadow-md shadow-[#0b57d0]/25">
              P
            </div>

            <h1 className="text-2xl font-bold text-[#1f1f1f] dark:text-white tracking-tight mb-2">
              Sign in to PACT
            </h1>

            <p className="text-xs sm:text-sm text-[#444746] dark:text-[#c4c6cf] leading-relaxed mb-8">
              Access your autonomous executive workspace, Gmail streams, and guarded calendar pipelines.
            </p>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-[#ba1a1a]/15 border border-[#ba1a1a]/30 text-xs text-[#ba1a1a] dark:text-[#ffb4ab] text-left">
                {errorMessage}
              </div>
            )}

            {/* Google Sign In CTA */}
            <button
              onClick={handleSignIn}
              disabled={isLoading || isSubmitting}
              className="w-full rounded-full border border-white/40 dark:border-white/15 bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 active:scale-98 px-6 py-3.5 font-semibold text-sm text-[#1f1f1f] dark:text-white flex items-center justify-center gap-3 transition-all duration-150 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mb-5"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#0b57d0] dark:text-[#38bdf8]" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                {isSubmitting ? "Connecting to Google..." : "Continue with Google"}
              </span>
            </button>

            <div className="flex items-center justify-center gap-2 text-3xs text-[#747775] dark:text-[#8e9099] mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-[#146c2e] dark:text-[#81c995]" />
              <span>OAuth scopes: Gmail, Calendar, and Google Tasks</span>
            </div>

            <div className="pt-4 border-t border-white/30 dark:border-white/10 text-xs text-[#444746] dark:text-[#c4c6cf]">
              Don&apos;t have an account?{" "}
              <button
                onClick={navigateToSignUp}
                className="text-[#0b57d0] dark:text-[#38bdf8] font-bold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-12 border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-[#0c0e14]/40 backdrop-blur-md px-6 lg:px-10 flex items-center justify-between text-2xs text-[#747775] dark:text-[#8e9099] shrink-0">
          <div>PACT • Authentication Gateway</div>
          <div>Protected with End-to-End Cryptographic Clearance</div>
        </footer>
      </div>
    </div>
  );
}
