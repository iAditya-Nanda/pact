"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const { saveOnboardingProfile, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    role: "",
    workingHours: "Avoid meetings before 10:00 AM",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    try {
      await saveOnboardingProfile({
        fullName: formData.fullName || "Aditya Nanda",
        age: formData.age ? parseInt(formData.age, 10) : 24,
        role: formData.role || "Lead Architect",
        schedulePreference: formData.workingHours,
      });
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Sign Up Card Canvas */}
      <main className="flex-1 flex items-center justify-center px-6 py-6 overflow-y-auto">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#e0e3e7] p-8 shadow-xs text-center animate-in fade-in zoom-in-95 duration-200">
          <h1 className="text-2xl font-semibold text-[#1f1f1f] tracking-tight mb-2">
            Create your PACT Profile
          </h1>

          <p className="text-sm text-[#444746] leading-relaxed mb-6">
            Calibrate your personal autonomous agent profile. All identity and email
            data will synchronize directly from your Google account.
          </p>

          {/* Profile Form */}
          <form onSubmit={handleSignUp} className="space-y-4 text-left mb-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-[#444746] uppercase tracking-wider mb-1.5"
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
                className="w-full rounded-xl border border-[#e0e3e7] bg-[#f8fafd] px-4 py-2.5 text-sm text-[#1f1f1f] placeholder:text-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="age"
                  className="block text-xs font-semibold text-[#444746] uppercase tracking-wider mb-1.5"
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
                  className="w-full rounded-xl border border-[#e0e3e7] bg-[#f8fafd] px-4 py-2.5 text-sm text-[#1f1f1f] placeholder:text-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-xs font-semibold text-[#444746] uppercase tracking-wider mb-1.5"
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
                  className="w-full rounded-xl border border-[#e0e3e7] bg-[#f8fafd] px-4 py-2.5 text-sm text-[#1f1f1f] placeholder:text-[#747775] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="workingHours"
                className="block text-xs font-semibold text-[#444746] uppercase tracking-wider mb-1.5"
              >
                Schedule Preference Rule
              </label>
              <select
                id="workingHours"
                name="workingHours"
                value={formData.workingHours}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#e0e3e7] bg-[#f8fafd] px-4 py-2.5 text-sm text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white transition-all cursor-pointer"
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

            {/* Google Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full rounded-full border border-[#e0e3e7] bg-white hover:bg-[#f0f4f9] active:bg-[#e4ebf5] px-6 py-3 font-medium text-sm text-[#1f1f1f] flex items-center justify-center gap-3 transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-3"
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
              <span>Complete Setup & Connect Google</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#e0e3e7]/60 text-xs text-[#444746]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#0b57d0] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-[#e0e3e7] bg-[#f8fafd] px-6 lg:px-10 flex items-center justify-between text-xs text-[#747775] shrink-0">
        <div>PACT • Onboarding Profile Calibration</div>
        <div>Preferences stored with local Supabase protection</div>
      </footer>
    </div>
  );
}
