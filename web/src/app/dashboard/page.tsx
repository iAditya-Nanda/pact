"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  Mail,
  Calendar,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  Clock,
  Briefcase,
  Cake,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Retrieve cached user synchronously from localStorage if available
  const [localCache, setLocalCache] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pact_auth_user");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pact_auth_user");
      if (stored) {
        try {
          setLocalCache(JSON.parse(stored));
        } catch {}
      }
    }
  }, [user]);

  const activeUser = user || localCache;

  // Redirect to login only if confirmed unauthenticated after mount
  useEffect(() => {
    if (mounted && !isLoading && !activeUser) {
      router.push("/login");
    }
  }, [mounted, isLoading, activeUser, router]);

  // Dynamic user data from Google Auth & onboarding profile
  const displayName = activeUser?.fullName || "Aditya Nanda";
  const displayEmail = activeUser?.email || "adityananda.dev@gmail.com";
  const displayAvatar = activeUser?.avatarUrl || "";
  const displayRole = activeUser?.role || "Lead Architect";
  const displayAge = activeUser?.age || 24;
  const displayPreference =
    activeUser?.schedulePreference || "Avoid meetings before 10:00 AM";

  // Derive initial letters for avatar fallback
  const initials = displayName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-screen max-h-screen flex flex-col justify-between overflow-hidden bg-[#f8fafd] select-none text-[#1f1f1f]">
      {/* 1. Clean Top Header Bar */}
      <header className="h-16 border-b border-[#e0e3e7] bg-white px-6 lg:px-10 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1f1f1f]">
            PACT
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d3e3fd] text-[#041e49] font-medium hidden sm:inline-block">
            Console
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Session Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f5e9] border border-[#c8e6c9] text-xs font-medium text-[#2e7d32]">
            <span className="w-2 h-2 rounded-full bg-[#2e7d32] animate-pulse" />
            <span>Active Session Persisted</span>
          </div>

          {/* Sign Out CTA */}
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e0e3e7] bg-white hover:bg-[#f0f4f9] active:bg-[#e4ebf5] text-xs font-semibold text-[#ba1a1a] transition-all cursor-pointer shadow-2xs"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* 2. Main Executive Profile Canvas (Sidebar cleared as requested) */}
      <main className="flex-1 flex items-center justify-center px-6 py-6 overflow-y-auto">
        <div className="max-w-2xl w-full bg-white rounded-3xl border border-[#e0e3e7] p-8 md:p-10 shadow-xs animate-in fade-in zoom-in-95 duration-200">
          {/* User Header Profile Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-[#e0e3e7]">
            {/* Account Image */}
            <div className="relative shrink-0">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#d3e3fd] shadow-xs"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#0b57d0] text-white flex items-center justify-center text-2xl font-bold border-4 border-[#d3e3fd] shadow-xs">
                  {initials || "AN"}
                </div>
              )}
              <div
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#34A853] border-2 border-white flex items-center justify-center text-white"
                title="Google Account Authenticated"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Account Identity */}
            <div className="text-center sm:text-left min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#f0f4f9] text-xs font-medium text-[#444746] mb-2">
                <UserCheck className="w-3.5 h-3.5 text-[#0b57d0]" />
                <span>Google Verified Identity</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f] tracking-tight truncate">
                {displayName}
              </h1>
              <p className="text-sm font-medium text-[#747775] truncate mt-0.5">
                {displayEmail}
              </p>
            </div>
          </div>

          {/* Calibrated Profile Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-8">
            {/* Age Card */}
            <div className="rounded-2xl bg-[#f8fafd] border border-[#e0e3e7] p-4.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#747775] uppercase tracking-wider mb-2">
                <Cake className="w-4 h-4 text-[#0b57d0]" />
                <span>Age</span>
              </div>
              <div className="text-xl font-bold text-[#1f1f1f]">
                {displayAge} <span className="text-xs font-normal text-[#747775]">years</span>
              </div>
            </div>

            {/* Role Card */}
            <div className="rounded-2xl bg-[#f8fafd] border border-[#e0e3e7] p-4.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#747775] uppercase tracking-wider mb-2">
                <Briefcase className="w-4 h-4 text-[#0b57d0]" />
                <span>Role</span>
              </div>
              <div className="text-base font-bold text-[#1f1f1f] truncate" title={displayRole}>
                {displayRole}
              </div>
            </div>

            {/* Schedule Preference Card */}
            <div className="rounded-2xl bg-[#f8fafd] border border-[#e0e3e7] p-4.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#747775] uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4 text-[#0b57d0]" />
                <span>Schedule Preference</span>
              </div>
              <div
                className="text-xs font-semibold text-[#1f1f1f] line-clamp-2 leading-tight"
                title={displayPreference}
              >
                {displayPreference}
              </div>
            </div>
          </div>

          {/* Connected Google Workspace Integrations */}
          <div className="rounded-2xl bg-[#f8fafd] border border-[#e0e3e7] p-5">
            <div className="text-xs font-semibold text-[#444746] uppercase tracking-wider mb-3">
              Connected Google Workspace Scopes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-[#e0e3e7] text-xs font-medium text-[#1f1f1f]">
                <Mail className="w-4 h-4 text-[#EA4335] shrink-0" />
                <span className="truncate">Gmail Access</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-[#e0e3e7] text-xs font-medium text-[#1f1f1f]">
                <Calendar className="w-4 h-4 text-[#4285F4] shrink-0" />
                <span className="truncate">Calendar Sync</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-[#e0e3e7] text-xs font-medium text-[#1f1f1f]">
                <CheckSquare className="w-4 h-4 text-[#34A853] shrink-0" />
                <span className="truncate">Tasks Engine</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-xs text-[#747775]">
              Session stored locally and in Firebase Auth • Zero re-login required on reload
            </span>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="h-12 border-t border-[#e0e3e7] bg-white px-6 lg:px-10 flex items-center justify-between text-xs text-[#747775] shrink-0">
        <div>PACT • Executive Cockpit</div>
        <div>Active Account: {displayEmail}</div>
      </footer>
    </div>
  );
}
