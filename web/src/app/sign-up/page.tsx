"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Scene3D } from "@/components/3d/Scene3D";
import { ArrowLeft, Loader2, Rocket, Sparkles, ShieldCheck } from "lucide-react";
import gsap from "gsap";

export default function SignUpPage() {
  const { user, saveOnboardingProfile, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    role: "",
    workingHours: "Avoid meetings before 10:00 AM",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
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

  // GSAP Entrance animation
  useEffect(() => {
    if (!isVerifyingSession && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "power3.out" }
      );
    }
  }, [isVerifyingSession]);

  const navigateWithTransition = (href: string) => {
    if (pageRef.current) {
      gsap.to(pageRef.current, {
        opacity: 0,
        y: -12,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => router.push(href),
      });
    } else {
      router.push(href);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await saveOnboardingProfile({
        fullName: formData.fullName || "Aditya Nanda",
        age: formData.age ? parseInt(formData.age, 10) : 24,
        role: formData.role || "Lead Architect",
        schedulePreference: formData.workingHours,
      });
    } catch (err: any) {
      console.error("Firebase Sign-Up Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMessage(
          "Sign-in window closed before completing authentication. Please try again."
        );
      } else if (err.code === "auth/unauthorized-domain") {
        setErrorMessage(
          "Domain not authorized in Firebase Console (Authentication > Settings > Authorized Domains)."
        );
      } else {
        setErrorMessage(err.message || "Failed to complete onboarding.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dedicated 1-second session verification screen
  if (isVerifyingSession) {
    return (
      <div className="h-screen max-h-screen flex flex-col justify-between overflow-hidden bg-[#f8fafd] dark:bg-[#0c0e14] select-none text-[#1f1f1f] dark:text-[#e2e2e6] relative">
        <Scene3D mode="signup" />
        <div className="relative z-10 flex flex-col h-full justify-between">
          <header className="h-16 border-b border-[#e0e3e7]/80 dark:border-[#34373d]/80 bg-white/60 dark:bg-[#111318]/60 backdrop-blur-md px-6 lg:px-10 flex items-center justify-between shrink-0">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
                P
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1f1f1f] dark:text-white">
                PACT
              </span>
            </Link>
          </header>

          <main className="flex-1 flex items-center justify-center px-6 py-8">
            <div className="flex flex-col items-center gap-3.5 p-8 rounded-2xl bg-white/70 dark:bg-[#1d1f24]/70 backdrop-blur-xl border border-[#e0e3e7] dark:border-[#34373d] shadow-lg animate-in fade-in duration-200">
              <Loader2 className="w-8 h-8 animate-spin text-[#0b57d0] dark:text-[#a8c7fa]" />
              <span className="text-sm font-medium text-[#444746] dark:text-[#c4c6cf]">
                Verifying active session...
              </span>
            </div>
          </main>

          <footer className="h-12 border-t border-[#e0e3e7]/80 dark:border-[#34373d]/80 bg-white/60 dark:bg-[#111318]/60 backdrop-blur-md px-6 lg:px-10 flex items-center justify-between text-xs text-[#747775] dark:text-[#8e9099] shrink-0">
            <div>PACT • Onboarding Profile Calibration</div>
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
      {/* 3D WebGL Canvas Layer (mode="signup") */}
      <Scene3D mode="signup" />

      {/* Ambient Gradient Layer */}
      <div className="fixed inset-0 pointer-events-none z-1 bg-gradient-to-l from-transparent via-[#f8fafd]/30 dark:via-[#0c0e14]/40 to-[#f8fafd]/80 dark:to-[#0c0e14]/90" />

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#e0e3e7]/80 dark:border-[#34373d]/80 bg-white/60 dark:bg-[#111318]/60 backdrop-blur-md px-6 lg:px-10 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs transition-transform group-hover:scale-105">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1f1f1f] dark:text-white">
              PACT
            </span>
          </Link>

          <button
            onClick={() => navigateWithTransition("/")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#444746] dark:text-[#c4c6cf] hover:text-[#0b57d0] dark:hover:text-[#a8c7fa] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </header>

        {/* Sign Up Canvas: Glassmorphic Form on Left, 3D Jellyfish & Rocket on Right */}
        <main className="flex-1 flex items-center justify-center lg:justify-start px-6 lg:px-20 py-8">
          <div
            ref={cardRef}
            className="max-w-md w-full bg-white/85 dark:bg-[#1d1f24]/85 backdrop-blur-2xl rounded-3xl border border-[#e0e3e7] dark:border-[#34373d] p-7 sm:p-8 shadow-2xl text-center relative"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b57d0]/10 dark:bg-[#a8c7fa]/10 text-xs font-bold text-[#0b57d0] dark:text-[#a8c7fa] mb-3">
              <Rocket className="w-3.5 h-3.5" />
              <span>Executive Onboarding</span>
            </div>

            <h1 className="text-2xl font-bold text-[#1f1f1f] dark:text-white tracking-tight mb-1.5">
              Create your PACT Profile
            </h1>

            <p className="text-xs text-[#444746] dark:text-[#c4c6cf] leading-relaxed mb-6">
              Calibrate your agent profile. Data will synchronize directly with your authorized Google account.
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 text-xs text-[#ba1a1a] dark:text-[#ffb4ab] text-left">
                {errorMessage}
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSignUp} className="space-y-3.5 text-left mb-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-2xs font-bold text-[#444746] dark:text-[#c4c6cf] uppercase tracking-wider mb-1"
                >
                  Preferred Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Aditya Nanda"
                  className="w-full rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white/70 dark:bg-[#282a2f]/70 px-3.5 py-2 text-xs text-[#1f1f1f] dark:text-white placeholder:text-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="age"
                    className="block text-2xs font-bold text-[#444746] dark:text-[#c4c6cf] uppercase tracking-wider mb-1"
                  >
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="16"
                    max="120"
                    required
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g. 24"
                    className="w-full rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white/70 dark:bg-[#282a2f]/70 px-3.5 py-2 text-xs text-[#1f1f1f] dark:text-white placeholder:text-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-2xs font-bold text-[#444746] dark:text-[#c4c6cf] uppercase tracking-wider mb-1"
                  >
                    Role / Title
                  </label>
                  <input
                    id="role"
                    name="role"
                    type="text"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g. Lead Architect"
                    className="w-full rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white/70 dark:bg-[#282a2f]/70 px-3.5 py-2 text-xs text-[#1f1f1f] dark:text-white placeholder:text-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="workingHours"
                  className="block text-2xs font-bold text-[#444746] dark:text-[#c4c6cf] uppercase tracking-wider mb-1"
                >
                  Schedule Defense Rule
                </label>
                <select
                  id="workingHours"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white/70 dark:bg-[#282a2f]/70 px-3.5 py-2 text-xs text-[#1f1f1f] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b57d0] transition-all cursor-pointer"
                >
                  <option value="Avoid meetings before 10:00 AM">
                    Avoid meetings before 10:00 AM (Recommended)
                  </option>
                  <option value="Standard Business Hours (9:00 AM – 6:00 PM)">
                    Standard Business Hours (9:00 AM – 6:00 PM)
                  </option>
                  <option value="Late Focus Schedule (11:00 AM – 8:00 PM)">
                    Late Focus Schedule (11:00 AM – 8:00 PM)
                  </option>
                </select>
              </div>

              {/* Complete Setup & Google Sign In Button */}
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full rounded-2xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#282a2f] hover:bg-[#f0f4f9] dark:hover:bg-[#34373d] active:scale-98 px-6 py-3 font-semibold text-xs text-[#1f1f1f] dark:text-white flex items-center justify-center gap-3 transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0b57d0] dark:text-[#a8c7fa]" />
                ) : (
                  <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                <span>Complete Setup &amp; Connect Google</span>
              </button>
            </form>

            <div className="pt-3.5 border-t border-[#e0e3e7]/80 dark:border-[#34373d] text-xs text-[#444746] dark:text-[#c4c6cf]">
              Already have an account?{" "}
              <button
                onClick={() => navigateWithTransition("/login")}
                className="text-[#0b57d0] dark:text-[#a8c7fa] font-bold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-12 border-t border-[#e0e3e7]/80 dark:border-[#34373d]/80 bg-white/60 dark:bg-[#111318]/60 backdrop-blur-md px-6 lg:px-10 flex items-center justify-between text-xs text-[#747775] dark:text-[#8e9099] shrink-0">
          <div>PACT • Onboarding Profile Calibration</div>
          <div className="hidden sm:block">Preferences stored with Cloud Firebase protection</div>
        </footer>
      </div>
    </div>
  );
}
