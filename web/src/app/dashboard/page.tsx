"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import {
  LogOut,
  ShieldCheck,
  Send,
  Sparkles,
  PhoneCall,
  Zap,
  Sliders,
  Settings,
  Sun,
  Plus,
  Mic,
  Clock,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Local session cache for instantaneous retrieval
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
    setMounted(true);
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

  // Dynamic user data
  const displayName = activeUser?.fullName || "Aditya Nanda";
  const displayEmail = activeUser?.email || "adityananda.dev@gmail.com";
  const displayAvatar = activeUser?.avatarUrl || "";
  const displayRole = activeUser?.role || "Founder";
  const displayAge = activeUser?.age || 21;
  const displayPreference =
    activeUser?.schedulePreference || "Avoid meetings before 10:00 AM";

  // Initials for avatar fallback
  const initials = displayName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Live Timer in IST with Seconds & Dynamic Greeting
  const [istTime, setIstTime] = useState("");
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format exact time in Asia/Kolkata (IST)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const formatted = new Intl.DateTimeFormat("en-IN", options).format(now);
      setIstTime(`${formatted} IST`);

      // Determine greeting by IST hour
      const istHour = parseInt(
        new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          hour12: false,
        }).format(now),
        10
      );

      if (istHour >= 4 && istHour < 12) {
        setGreeting("Good morning");
      } else if (istHour >= 12 && istHour < 17) {
        setGreeting("Good afternoon");
      } else if (istHour >= 17 && istHour < 22) {
        setGreeting("Good evening");
      } else {
        setGreeting("Good night");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Quick Action Toggles & Chat State
  const [mobileNotify, setMobileNotify] = useState(false);
  const [aiMode, setAiMode] = useState<"safe" | "turbo">("safe");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "user" | "ai"; text: string }>
  >([]);

  // Modals for Preferences & Settings
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [editAge, setEditAge] = useState(String(displayAge));
  const [editRole, setEditRole] = useState(displayRole);
  const [editPref, setEditPref] = useState(displayPreference);

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...activeUser,
      age: parseInt(editAge, 10) || displayAge,
      role: editRole || displayRole,
      schedulePreference: editPref || displayPreference,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("pact_auth_user", JSON.stringify(updated));
      setLocalCache(updated);
    }
    try {
      await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {}
    setIsPrefModalOpen(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `PACT Chief of Staff: Processed instruction "${userMsg}". Gmail, Calendar, and Tasks are synchronized with guarded clearance.`,
        },
      ]);
    }, 600);
  };

  return (
    <div className="h-screen max-h-screen flex flex-col justify-between overflow-hidden bg-[#f8fafd] select-none text-[#1f1f1f]">
      {/* 1. Header (Top Flush App Bar - Previous Design as Requested) */}
      <header className="h-16 border-b border-[#e0e3e7] bg-white px-6 lg:px-10 flex items-center justify-between shrink-0 shadow-2xs">
        {/* Left Branding */}
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

        {/* Center Engine Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f0f4f9] text-xs font-medium text-[#444746]">
          <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />
          <span>Local Engine Standby • Guarded Autonomy</span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f5e9] border border-[#c8e6c9] text-xs font-semibold text-[#2e7d32]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2e7d32]" />
            <span className="hidden sm:inline">Active Session Persisted</span>
          </div>

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

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col justify-between px-6 lg:px-10 py-4 lg:py-5 gap-3.5 lg:gap-4 overflow-y-auto lg:overflow-hidden">
        {/* Upper Main Row: 60% Width for 3 Cards + 40% Width for Executive Panel */}
        <div className="flex flex-col lg:flex-row gap-3.5 lg:gap-4 items-stretch flex-1 min-h-0">
          {/* 3 Cards Container (Constrained to 60% Width as Requested) */}
          <div className="w-full lg:w-[60%] grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-3.5 min-h-0">
            {/* Column 1: Gmail Insights & Info */}
            <div className="border border-[#e0e3e7] rounded-2xl bg-white p-4.5 flex flex-col justify-between shadow-xs hover:border-[#0b57d0]/40 transition-all">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e3e7]/80">
                  <span className="text-xs font-bold text-[#1f1f1f] tracking-tight truncate">
                    Gmail Insights &amp; Info
                  </span>
                  <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#fce8e6] text-[#c5221f] shrink-0">
                    Live Inbox
                  </span>
                </div>

                <div className="mt-3.5 space-y-3">
                  <div>
                    <div className="text-2xl font-extrabold text-[#1f1f1f] tracking-tight">
                      14
                    </div>
                    <div className="text-2xs font-medium text-[#747775]">
                      Unread priority emails
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e0e3e7]/60">
                    <div className="bg-[#f8fafd] p-2 rounded-xl border border-[#e0e3e7]/60">
                      <div className="text-xs font-bold text-[#1f1f1f]">342</div>
                      <div className="text-3xs text-[#747775]">This month</div>
                    </div>
                    <div className="bg-[#f8fafd] p-2 rounded-xl border border-[#e0e3e7]/60">
                      <div className="text-xs font-bold text-[#1f1f1f]">4</div>
                      <div className="text-3xs text-[#747775]">Important</div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafd] p-2.5 rounded-xl border border-[#e0e3e7]/60">
                    <div className="text-3xs font-semibold text-[#444746] truncate">
                      Latest: Sarah Lin (VP Eng)
                    </div>
                    <div className="text-3xs text-[#747775] truncate mt-0.5">
                      Q4 Architecture Review Agenda
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Button with Real Gmail Logo */}
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 rounded-xl border border-[#e0e3e7] bg-white hover:bg-[#f0f4f9] active:bg-[#e4ebf5] py-2 px-3 font-semibold text-xs text-[#1f1f1f] flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer group"
              >
                <img
                  src="/icons/gmail.png"
                  alt="Gmail"
                  className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"
                />
                <span>Open Gmail</span>
                <ExternalLink className="w-3 h-3 text-[#747775] ml-auto" />
              </a>
            </div>

            {/* Column 2: Calendar Insights & Info */}
            <div className="border border-[#e0e3e7] rounded-2xl bg-white p-4.5 flex flex-col justify-between shadow-xs hover:border-[#0b57d0]/40 transition-all">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e3e7]/80">
                  <span className="text-xs font-bold text-[#1f1f1f] tracking-tight truncate">
                    Calendar Insights &amp; Info
                  </span>
                  <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] shrink-0">
                    Schedule
                  </span>
                </div>

                <div className="mt-3.5 space-y-3">
                  <div>
                    <div className="text-2xl font-extrabold text-[#1f1f1f] tracking-tight">
                      3
                    </div>
                    <div className="text-2xs font-medium text-[#747775]">
                      Meetings scheduled today
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e0e3e7]/60">
                    <div className="bg-[#f8fafd] p-2 rounded-xl border border-[#e0e3e7]/60">
                      <div className="text-xs font-bold text-[#1f1f1f]">18.5 hrs</div>
                      <div className="text-3xs text-[#747775]">This week</div>
                    </div>
                    <div className="bg-[#f8fafd] p-2 rounded-xl border border-[#e0e3e7]/60">
                      <div className="text-xs font-bold text-[#146c2e]">0 Conflicts</div>
                      <div className="text-3xs text-[#747775]">Protected</div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafd] p-2.5 rounded-xl border border-[#e0e3e7]/60">
                    <div className="text-3xs font-semibold text-[#444746] truncate">
                      Next: Executive Sync
                    </div>
                    <div className="text-3xs text-[#747775] truncate mt-0.5">
                      11:30 AM • Google Meet
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Button with Real Google Calendar Logo */}
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 rounded-xl border border-[#e0e3e7] bg-white hover:bg-[#f0f4f9] active:bg-[#e4ebf5] py-2 px-3 font-semibold text-xs text-[#1f1f1f] flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer group"
              >
                <img
                  src="/icons/calendar.png"
                  alt="Calendar"
                  className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"
                />
                <span>Open Calendar</span>
                <ExternalLink className="w-3 h-3 text-[#747775] ml-auto" />
              </a>
            </div>

            {/* Column 3: Tasks Insights & Info */}
            <div className="border border-[#e0e3e7] rounded-2xl bg-white p-4.5 flex flex-col justify-between shadow-xs hover:border-[#0b57d0]/40 transition-all">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e3e7]/80">
                  <span className="text-xs font-bold text-[#1f1f1f] tracking-tight truncate">
                    Tasks Insights &amp; Info
                  </span>
                  <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] shrink-0">
                    Priority Queue
                  </span>
                </div>

                <div className="mt-3.5 space-y-3">
                  <div>
                    <div className="text-2xl font-extrabold text-[#1f1f1f] tracking-tight">
                      8
                    </div>
                    <div className="text-2xs font-medium text-[#747775]">
                      Active tasks pending
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e0e3e7]/60">
                    <div className="bg-[#f8fafd] p-2 rounded-xl border border-[#e0e3e7]/60">
                      <div className="text-xs font-bold text-[#1f1f1f]">2 Due today</div>
                      <div className="text-3xs text-[#747775]">Urgent</div>
                    </div>
                    <div className="bg-[#f8fafd] p-2 rounded-xl border border-[#e0e3e7]/60">
                      <div className="text-xs font-bold text-[#146c2e]">0 Overdue</div>
                      <div className="text-3xs text-[#747775]">On track</div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafd] p-2.5 rounded-xl border border-[#e0e3e7]/60">
                    <div className="text-3xs font-semibold text-[#444746] truncate">
                      Top Priority Action
                    </div>
                    <div className="text-3xs text-[#747775] truncate mt-0.5">
                      Q4 security token rotation protocol
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Button with Real Google Tasks Logo */}
              <a
                href="https://tasks.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 rounded-xl border border-[#e0e3e7] bg-white hover:bg-[#f0f4f9] active:bg-[#e4ebf5] py-2 px-3 font-semibold text-xs text-[#1f1f1f] flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer group"
              >
                <img
                  src="/icons/tasks.svg"
                  alt="Tasks"
                  className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"
                />
                <span>Open Tasks</span>
                <ExternalLink className="w-3 h-3 text-[#747775] ml-auto" />
              </a>
            </div>
          </div>

          {/* Right Executive Panel & Quick Actions (40% Width) */}
          <div className="w-full lg:w-[40%] flex flex-col justify-between gap-3 lg:gap-3.5 min-h-0">
            {/* User Profile Card + Dynamic Greeting + IST Timer */}
            <div className="border border-[#e0e3e7] rounded-2xl bg-white p-4.5 shadow-xs">
              <div className="flex items-center gap-4">
                {/* Google Avatar Circle */}
                <div className="relative shrink-0">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#d3e3fd] shadow-2xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#0b57d0] text-white flex items-center justify-center text-lg font-bold border-2 border-[#d3e3fd] shadow-2xs">
                      {initials || "AN"}
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full bg-[#34A853] border-2 border-white flex items-center justify-center text-white"
                    title="Google Verified"
                  >
                    <ShieldCheck className="w-2.5 h-2.5" />
                  </div>
                </div>

                {/* User Name, Age, Role */}
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold text-[#1f1f1f] truncate leading-tight">
                    {displayName}
                  </div>
                  <div className="text-xs font-semibold text-[#0b57d0] mt-0.5 truncate">
                    {displayRole} • Age {displayAge}
                  </div>
                  <div className="text-2xs text-[#747775] truncate mt-0.5">
                    {displayEmail}
                  </div>
                </div>
              </div>

              {/* Dynamic Greeting & Live Timer in IST with Seconds */}
              <div className="mt-3.5 pt-3 border-t border-[#e0e3e7]/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#1f1f1f]">
                    {greeting}, {displayName.split(" ")[0]}
                  </div>
                  <div className="text-2xs text-[#747775]">
                    Schedule: {displayPreference}
                  </div>
                </div>

                {/* IST Timer */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f0f4f9] border border-[#e0e3e7] font-mono text-2xs font-semibold text-[#1f1f1f]">
                  <Clock className="w-3 h-3 text-[#0b57d0]" />
                  <span>{istTime || "Loading IST..."}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions AI Box with Bottom 1-Line Controls */}
            <div className="border border-[#e0e3e7] rounded-2xl bg-white p-4.5 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1f1f1f]">
                    <Sparkles className="w-3.5 h-3.5 text-[#0b57d0]" />
                    <span>AI Recommended Action</span>
                  </div>
                  <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#0b57d0]">
                    Ready
                  </span>
                </div>

                <div className="text-xs text-[#444746] leading-relaxed bg-[#f8fafd] p-2.5 rounded-xl border border-[#e0e3e7]/80">
                  Reschedule Client Debrief to 3:30 PM to honor your protected focus block rule.
                </div>
              </div>

              {/* Bottom 1-Line Controls (Mobile Notify + AI Mode) */}
              <div className="mt-3 pt-2.5 border-t border-[#e0e3e7]/80 flex items-center gap-2">
                <button
                  onClick={() => setMobileNotify(!mobileNotify)}
                  className={`flex-1 py-1.5 px-2 rounded-xl border text-2xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mobileNotify
                      ? "bg-[#e8f5e9] border-[#c8e6c9] text-[#2e7d32]"
                      : "bg-[#f8fafd] border-[#e0e3e7] text-[#444746] hover:bg-[#f0f4f9]"
                  }`}
                  title="Toggle Call / Push Notifications over Mobile"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>{mobileNotify ? "Notify: ON" : "Call on Mobile"}</span>
                </button>

                <button
                  onClick={() =>
                    setAiMode(aiMode === "safe" ? "turbo" : "safe")
                  }
                  className={`flex-1 py-1.5 px-2 rounded-xl border text-2xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    aiMode === "turbo"
                      ? "bg-[#fff3e0] border-[#ffe0b2] text-[#e65100]"
                      : "bg-[#e8f0fe] border-[#d3e3fd] text-[#0b57d0]"
                  }`}
                  title="Toggle AI Autonomy Mode"
                >
                  <Zap className="w-3 h-3" />
                  <span>{aiMode === "safe" ? "Mode: Safe Read" : "Mode: Turbo"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Row (3 Columns as per Wireframe) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-3.5 shrink-0">
          {/* Bottom Left (3 cols): Connected Apps with Icons & Plus Button */}
          <div className="lg:col-span-3 border border-[#e0e3e7] bg-white rounded-2xl p-3 lg:p-3.5 shadow-xs flex flex-col justify-between">
            <div className="text-2xs font-bold text-[#747775] uppercase tracking-wider mb-2">
              Connected Workspace Apps
            </div>

            <div className="flex items-center gap-3">
              {/* Gmail Icon */}
              <div className="relative group" title="Gmail: Connected & Synchronized">
                <div className="w-8.5 h-8.5 rounded-xl border border-[#e0e3e7] bg-[#f8fafd] flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="/icons/gmail.png"
                    alt="Gmail"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34A853] border-2 border-white" />
              </div>

              {/* Calendar Icon */}
              <div className="relative group" title="Google Calendar: Connected & Synchronized">
                <div className="w-8.5 h-8.5 rounded-xl border border-[#e0e3e7] bg-[#f8fafd] flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="/icons/calendar.png"
                    alt="Calendar"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34A853] border-2 border-white" />
              </div>

              {/* Tasks Icon */}
              <div className="relative group" title="Google Tasks: Connected & Synchronized">
                <div className="w-8.5 h-8.5 rounded-xl border border-[#e0e3e7] bg-[#f8fafd] flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="/icons/tasks.svg"
                    alt="Tasks"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34A853] border-2 border-white" />
              </div>

              {/* Plus Button to Connect More Apps */}
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="w-8.5 h-8.5 rounded-xl border border-dashed border-[#747775]/50 hover:border-[#0b57d0] hover:bg-[#d3e3fd]/20 text-[#747775] hover:text-[#0b57d0] flex items-center justify-center transition-all cursor-pointer"
                title="Connect More Applications"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Middle (6 cols): Chat Input for the AI */}
          <div className="lg:col-span-6 border border-[#e0e3e7] bg-white rounded-2xl p-2.5 lg:p-3 shadow-xs flex flex-col justify-between">
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#d3e3fd] text-[#0b57d0] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask PACT AI to draft an email, reschedule a meeting, or query your tasks..."
                className="flex-1 bg-transparent px-2 py-1.5 text-xs text-[#1f1f1f] placeholder:text-[#747775] focus:outline-none"
              />

              <button
                type="button"
                className="p-1.5 rounded-full text-[#747775] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] transition-colors cursor-pointer"
                title="Voice Input"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-8 h-8 rounded-full bg-[#0b57d0] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-40 cursor-pointer shadow-xs"
                title="Send Command"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Command Suggestions */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
              <span className="text-3xs text-[#747775] shrink-0 font-medium">
                Suggestions:
              </span>
              <button
                onClick={() =>
                  setChatInput("Reschedule Client Technical Debrief to 3:30 PM")
                }
                className="px-2 py-0.5 rounded-full bg-[#f0f4f9] hover:bg-[#e4ebf5] text-3xs text-[#444746] shrink-0 transition-colors cursor-pointer"
              >
                Reschedule conflict
              </button>
              <button
                onClick={() =>
                  setChatInput("Summarize unread emails from Sarah Lin")
                }
                className="px-2 py-0.5 rounded-full bg-[#f0f4f9] hover:bg-[#e4ebf5] text-3xs text-[#444746] shrink-0 transition-colors cursor-pointer"
              >
                Summarize unread
              </button>
              <button
                onClick={() =>
                  setChatInput("List all priority tasks due today")
                }
                className="px-2 py-0.5 rounded-full bg-[#f0f4f9] hover:bg-[#e4ebf5] text-3xs text-[#444746] shrink-0 transition-colors cursor-pointer"
              >
                Tasks due today
              </button>
            </div>
          </div>

          {/* Bottom Right (3 cols): Usable Buttons (Preferences, Settings, Theme) */}
          <div className="lg:col-span-3 border border-[#e0e3e7] bg-white rounded-2xl p-3 lg:p-3.5 shadow-xs flex items-center justify-between gap-2">
            {/* Update Preference Button */}
            <button
              onClick={() => {
                setEditAge(String(displayAge));
                setEditRole(displayRole);
                setEditPref(displayPreference);
                setIsPrefModalOpen(true);
              }}
              className="flex-1 py-2 px-2 rounded-xl border border-[#e0e3e7] bg-[#f8fafd] hover:bg-[#f0f4f9] active:bg-[#e4ebf5] text-2xs font-semibold text-[#1f1f1f] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
              title="Update Working Preferences & Role"
            >
              <Sliders className="w-3.5 h-3.5 text-[#0b57d0]" />
              <span className="truncate">Preferences</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex-1 py-2 px-2 rounded-xl border border-[#e0e3e7] bg-[#f8fafd] hover:bg-[#f0f4f9] active:bg-[#e4ebf5] text-2xs font-semibold text-[#1f1f1f] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
              title="System & Security Settings"
            >
              <Settings className="w-3.5 h-3.5 text-[#444746]" />
              <span className="truncate">Settings</span>
            </button>

            {/* Theme Button */}
            <button
              className="flex-1 py-2 px-2 rounded-xl border border-[#e0e3e7] bg-[#f8fafd] hover:bg-[#f0f4f9] active:bg-[#e4ebf5] text-2xs font-semibold text-[#1f1f1f] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
              title="Theme Toggle"
            >
              <Sun className="w-3.5 h-3.5 text-[#f9ab00]" />
              <span className="truncate">Theme</span>
            </button>
          </div>
        </div>
      </main>

      {/* Modal: Update Preferences */}
      <Modal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        title="Update Executive Profile Preferences"
      >
        <form onSubmit={handleUpdatePreferences} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-[#444746] uppercase tracking-wider mb-1">
              Role / Title
            </label>
            <input
              type="text"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full rounded-xl border border-[#e0e3e7] bg-[#f8fafd] px-3.5 py-2 text-sm text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#444746] uppercase tracking-wider mb-1">
              Age
            </label>
            <input
              type="number"
              value={editAge}
              onChange={(e) => setEditAge(e.target.value)}
              className="w-full rounded-xl border border-[#e0e3e7] bg-[#f8fafd] px-3.5 py-2 text-sm text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#444746] uppercase tracking-wider mb-1">
              Schedule Preference Rule
            </label>
            <select
              value={editPref}
              onChange={(e) => setEditPref(e.target.value)}
              className="w-full rounded-xl border border-[#e0e3e7] bg-[#f8fafd] px-3.5 py-2 text-sm text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white cursor-pointer"
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

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPrefModalOpen(false)}
              className="px-4 py-2 rounded-full border border-[#e0e3e7] text-xs font-medium text-[#444746] hover:bg-[#f0f4f9] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#0b57d0] text-xs font-medium text-white hover:bg-[#0842a0] transition-colors cursor-pointer shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Connect More Apps */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Connect Enterprise Applications"
      >
        <div className="space-y-3 text-left">
          <p className="text-xs text-[#444746] leading-relaxed">
            Expand PACT cross-app orchestration with additional authorized integrations:
          </p>
          <div className="space-y-2">
            <div className="p-3 rounded-xl border border-[#e0e3e7] flex items-center justify-between bg-[#f8fafd]">
              <div>
                <div className="text-xs font-bold text-[#1f1f1f]">Slack Workspaces</div>
                <div className="text-2xs text-[#747775]">Channel alerts &amp; urgent mentions</div>
              </div>
              <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#d3e3fd] text-[#041e49]">
                Coming Soon
              </span>
            </div>
            <div className="p-3 rounded-xl border border-[#e0e3e7] flex items-center justify-between bg-[#f8fafd]">
              <div>
                <div className="text-xs font-bold text-[#1f1f1f]">WhatsApp Business / SMS</div>
                <div className="text-2xs text-[#747775]">Executive VIP emergency escalation</div>
              </div>
              <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#d3e3fd] text-[#041e49]">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: Settings */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="PACT Executive Settings"
      >
        <div className="space-y-3.5 text-left text-xs text-[#444746]">
          <div className="p-3 rounded-xl bg-[#f8fafd] border border-[#e0e3e7]">
            <div className="font-bold text-[#1f1f1f] mb-1">Authenticated Account</div>
            <div className="font-mono text-2xs text-[#747775]">{displayEmail}</div>
            <div className="font-mono text-2xs text-[#747775] mt-0.5">UID: {activeUser?.id}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#f8fafd] border border-[#e0e3e7]">
            <div className="font-bold text-[#1f1f1f] mb-1">Cryptographic Idempotency</div>
            <div className="text-2xs text-[#747775]">All consequential actions verified with zero duplicate execution.</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
