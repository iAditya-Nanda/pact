"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loginWithGoogle, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const router = useRouter();

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
      <div className="h-screen max-h-screen flex flex-col justify-between overflow-hidden bg-[#f8fafd] select-none text-[#1f1f1f]">
        <header className="h-16 border-b border-[#e0e3e7] bg-[#f8fafd] px-6 lg:px-10 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1f1f1f]">
              PACT
            </span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="flex flex-col items-center gap-3.5 animate-in fade-in duration-200">
            <Loader2 className="w-8 h-8 animate-spin text-[#0b57d0]" />
            <span className="text-sm font-medium text-[#444746]">
              Verifying active session...
            </span>
          </div>
        </main>

        <footer className="h-12 border-t border-[#e0e3e7] bg-[#f8fafd] px-6 lg:px-10 flex items-center justify-between text-xs text-[#747775] shrink-0">
          <div>PACT • Authentication Gateway</div>
          <div>Secure session verification</div>
        </footer>
      </div>
    );
  }

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

          <p className="text-sm text-[#444746] leading-relaxed mb-8">
            Access your autonomous executive workspace and active cross-app workflows.
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 text-xs text-[#ba1a1a] text-left">
              {errorMessage}
            </div>
          )}

          {/* Google Sign In CTA */}
          <button
            onClick={handleSignIn}
            disabled={isLoading || isSubmitting}
            className="w-full rounded-full border border-[#e0e3e7] bg-white hover:bg-[#f0f4f9] active:bg-[#e4ebf5] px-6 py-3 font-medium text-sm text-[#1f1f1f] flex items-center justify-center gap-3 transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#0b57d0]" />
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

          <div className="text-xs text-[#747775] mb-6">
            OAuth permissions: Gmail, Calendar, and Tasks sync
          </div>

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
