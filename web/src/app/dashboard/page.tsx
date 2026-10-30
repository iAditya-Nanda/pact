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
  Settings,
  Sun,
  Moon,
  Plus,
  Mic,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Local session cache for instantaneous client retrieval post-hydration
  const [localCache, setLocalCache] = useState<any>(null);

  // Theme state (Dark/Light mode support)
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pact_auth_user");
      if (stored) {
        try {
          setLocalCache(JSON.parse(stored));
        } catch { }
      }
      const savedTheme = localStorage.getItem("pact_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldBeDark = savedTheme ? savedTheme === "dark" : prefersDark;
      setIsDark(shouldBeDark);
      document.documentElement.classList.toggle("dark", shouldBeDark);
      document.body.classList.toggle("dark", shouldBeDark);
    }
  }, []);

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (typeof window !== "undefined") {
      localStorage.setItem("pact_theme", nextDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", nextDark);
      document.body.classList.toggle("dark", nextDark);
    }
  };

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

  // Modals for Settings, Connect & Logout
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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
    <div
      className={`h-screen max-h-screen flex flex-col justify-between overflow-hidden ${
        isDark ? "dark bg-[#111318] text-[#e2e2e6]" : "bg-[#f8fafd] text-[#1f1f1f]"
      } select-none transition-colors`}
    >
      {/* 1. Header (Clean & Minimal with P.A.C.T. and Big Sign Out Icon) */}
      <header className="h-16 border-b border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] px-4 lg:px-6 flex items-center justify-between shrink-0 transition-colors">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
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
        </div>

        {/* Right End: Non-chip like, clean prominent icon with confirmation modal */}
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="p-2 rounded-xl text-[#444746] dark:text-[#c4c6cf] hover:text-[#ba1a1a] dark:hover:text-[#ff897d] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] active:bg-[#e4ebf5] dark:active:bg-[#34373d] transition-all cursor-pointer"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col justify-between px-4 lg:px-6 py-3.5 lg:py-4 gap-3 lg:gap-3.5 overflow-y-auto lg:overflow-hidden">
        {/* Upper Main Row: 60% Width for 3 Cards + 40% Width for Executive Panel */}
        <div className="flex flex-col lg:flex-row gap-3.5 lg:gap-4 items-stretch flex-1 min-h-0">
          {/* 3 Cards Container (Constrained to 60% Width as Requested) */}
          <div className="w-full lg:w-[60%] grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-3.5 min-h-0">
            {/* Column 1: Gmail Insights & Info */}
            <div className="border border-[#e0e3e7] dark:border-[#34373d] rounded-2xl bg-white dark:bg-[#1d1f24] p-4 flex flex-col justify-between shadow-xs hover:border-[#0b57d0]/40 dark:hover:border-[#a8c7fa]/40 transition-all">
              <div>
                {/* Header: Service Icon upside with title */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e3e7]/80 dark:border-[#34373d]">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src="/icons/gmail.png"
                      alt="Gmail"
                      className="w-4.5 h-4.5 object-contain shrink-0"
                    />
                    <span className="text-xs font-bold text-[#1f1f1f] dark:text-white tracking-tight truncate">
                      Gmail Insights &amp; Info
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-2xs font-medium text-[#747775] dark:text-[#8e9099] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
                    <span>Inbox</span>
                  </div>
                </div>

                {/* Big Number in a Card Background with Center-aligned Below Font */}
                <div className="my-3 bg-[#f8fafd] dark:bg-[#282a2f] p-3.5 rounded-2xl border border-[#e0e3e7]/80 dark:border-[#34373d] text-center shadow-2xs">
                  <div className="text-3xl lg:text-4xl font-extrabold text-[#1f1f1f] dark:text-white tracking-tight">
                    14
                  </div>
                  <div className="text-xs font-medium text-[#747775] dark:text-[#8e9099] text-center mt-1">
                    Unread priority emails
                  </div>
                </div>

                {/* 3 Metric Cards Vertically Stacked */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">This month</span>
                    <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">342</span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">Important</span>
                    <span className="text-xs font-bold text-[#ba1a1a] dark:text-[#ff897d]">4</span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex flex-col justify-center">
                    <div className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6] truncate">
                      Latest: Sarah Lin (VP Eng)
                    </div>
                    <div className="text-2xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                      Q4 Architecture Review Agenda
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Button (Icon moved upstairs, clean action) */}
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] active:bg-[#e4ebf5] dark:active:bg-[#34373d] py-2 px-3 font-semibold text-xs text-[#1f1f1f] dark:text-[#e2e2e6] flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
              >
                <span>Open Gmail</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#747775] dark:text-[#8e9099] group-hover:text-[#0b57d0] dark:group-hover:text-[#a8c7fa] transition-colors" />
              </a>
            </div>

            {/* Column 2: Calendar Insights & Info */}
            <div className="border border-[#e0e3e7] dark:border-[#34373d] rounded-2xl bg-white dark:bg-[#1d1f24] p-4 flex flex-col justify-between shadow-xs hover:border-[#0b57d0]/40 dark:hover:border-[#a8c7fa]/40 transition-all">
              <div>
                {/* Header: Service Icon upside with title */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e3e7]/80 dark:border-[#34373d]">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src="/icons/calendar.png"
                      alt="Calendar"
                      className="w-4.5 h-4.5 object-contain shrink-0"
                    />
                    <span className="text-xs font-bold text-[#1f1f1f] dark:text-white tracking-tight truncate">
                      Calendar Insights &amp; Info
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-2xs font-medium text-[#747775] dark:text-[#8e9099] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                    <span>Schedule</span>
                  </div>
                </div>

                {/* Big Number in a Card Background with Center-aligned Below Font */}
                <div className="my-3 bg-[#f8fafd] dark:bg-[#282a2f] p-3.5 rounded-2xl border border-[#e0e3e7]/80 dark:border-[#34373d] text-center shadow-2xs">
                  <div className="text-3xl lg:text-4xl font-extrabold text-[#1f1f1f] dark:text-white tracking-tight">
                    3
                  </div>
                  <div className="text-xs font-medium text-[#747775] dark:text-[#8e9099] text-center mt-1">
                    Meetings scheduled today
                  </div>
                </div>

                {/* 3 Metric Cards Vertically Stacked */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">This week</span>
                    <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">18.5h</span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">Conflicts</span>
                    <span className="text-xs font-bold text-[#1e8e3e] dark:text-[#81c995]">0 Protected</span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex flex-col justify-center">
                    <div className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6] truncate">
                      Next: Executive Sync
                    </div>
                    <div className="text-2xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                      11:30 AM • Google Meet
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Button (Icon moved upstairs, clean action) */}
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] active:bg-[#e4ebf5] dark:active:bg-[#34373d] py-2 px-3 font-semibold text-xs text-[#1f1f1f] dark:text-[#e2e2e6] flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
              >
                <span>Open Calendar</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#747775] dark:text-[#8e9099] group-hover:text-[#0b57d0] dark:group-hover:text-[#a8c7fa] transition-colors" />
              </a>
            </div>

            {/* Column 3: Tasks Insights & Info */}
            <div className="border border-[#e0e3e7] dark:border-[#34373d] rounded-2xl bg-white dark:bg-[#1d1f24] p-4 flex flex-col justify-between shadow-xs hover:border-[#0b57d0]/40 dark:hover:border-[#a8c7fa]/40 transition-all">
              <div>
                {/* Header: Service Icon upside with title */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e3e7]/80 dark:border-[#34373d]">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src="/icons/tasks.svg"
                      alt="Tasks"
                      className="w-4.5 h-4.5 object-contain shrink-0"
                    />
                    <span className="text-xs font-bold text-[#1f1f1f] dark:text-white tracking-tight truncate">
                      Tasks Insights &amp; Info
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-2xs font-medium text-[#747775] dark:text-[#8e9099] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
                    <span>Tasks</span>
                  </div>
                </div>

                {/* Big Number in a Card Background with Center-aligned Below Font */}
                <div className="my-3 bg-[#f8fafd] dark:bg-[#282a2f] p-3.5 rounded-2xl border border-[#e0e3e7]/80 dark:border-[#34373d] text-center shadow-2xs">
                  <div className="text-3xl lg:text-4xl font-extrabold text-[#1f1f1f] dark:text-white tracking-tight">
                    8
                  </div>
                  <div className="text-xs font-medium text-[#747775] dark:text-[#8e9099] text-center mt-1">
                    Active tasks pending
                  </div>
                </div>

                {/* 3 Metric Cards Vertically Stacked */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">Due today</span>
                    <span className="text-xs font-bold text-[#e65100] dark:text-[#ffb77d]">2 Urgent</span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">Overdue</span>
                    <span className="text-xs font-bold text-[#1e8e3e] dark:text-[#81c995]">0 On track</span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex flex-col justify-center">
                    <div className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6] truncate">
                      Top Action: Security
                    </div>
                    <div className="text-2xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                      Token rotation protocol
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Button (Icon moved upstairs, clean action) */}
              <a
                href="https://tasks.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] active:bg-[#e4ebf5] dark:active:bg-[#34373d] py-2 px-3 font-semibold text-xs text-[#1f1f1f] dark:text-[#e2e2e6] flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
              >
                <span>Open Tasks</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#747775] dark:text-[#8e9099] group-hover:text-[#0b57d0] dark:group-hover:text-[#a8c7fa] transition-colors" />
              </a>
            </div>
          </div>

          {/* Right Executive Panel & Quick Actions (40% Width) */}
          <div className="w-full lg:w-[40%] flex flex-col justify-between gap-3 lg:gap-3.5 min-h-0">
            {/* User Profile Card + Dynamic Greeting + IST Timer (Clean white, 120px avatar) */}
            <div className="bg-none p-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-5">
                {/* 120px Google Avatar Circle */}
                <div className="relative shrink-0">
                  {mounted && displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-[120px] h-[120px] min-w-[120px] min-h-[120px] rounded-full object-cover border-2 border-[#e0e3e7] dark:border-[#34373d] shadow-xs"
                    />
                  ) : (
                    <div className="w-[120px] h-[120px] min-w-[120px] min-h-[120px] rounded-full bg-[#0b57d0] dark:bg-[#004a77] text-white dark:text-[#d3e3fd] flex items-center justify-center text-3xl font-extrabold border-2 border-[#e0e3e7] dark:border-[#34373d] shadow-xs">
                      {initials || "AN"}
                    </div>
                  )}
                  <div
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#34A853] border-2 border-white dark:border-[#1d1f24] flex items-center justify-center text-white shadow-xs"
                    title="Google Verified Account"
                  >
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                </div>

                {/* User Info & Greetings */}
                <div className="min-w-0 flex-1 flex flex-col justify-center text-left">
                  {/* Dynamic Greeting & User Name in Same Line, Left-Aligned with Space After Comma */}
                  <div className="flex items-baseline gap-1.5 text-left truncate">
                    <span className="text-base lg:text-lg font-bold text-[#747775] dark:text-[#c4c6cf] shrink-0">
                      {greeting},
                    </span>
                    <span className="text-xl lg:text-2xl font-black text-[#1f1f1f] dark:text-white tracking-tight truncate">
                      {displayName}
                    </span>
                  </div>

                  {/* Small Role & Age */}
                  <div className="flex items-center justify-start gap-2 mt-1.5 text-left">
                    <span className="px-2 py-0.5 rounded-full bg-[#f0f4f9] dark:bg-[#004a77] border border-[#e0e3e7] dark:border-[#a8c7fa]/40 text-xs font-bold text-[#0b57d0] dark:text-[#a8c7fa]">
                      {displayRole}
                    </span>
                    <span className="text-xs font-medium text-[#444746] dark:text-[#c4c6cf]">
                      Age {displayAge}
                    </span>
                  </div>

                  {/* Small Email */}
                  <div className="text-xs text-[#747775] dark:text-[#8e9099] truncate mt-1 text-left">
                    {displayEmail}
                  </div>

                  {/* Live IST Timer with Seconds */}
                  <div className="mt-2.5 flex items-center justify-start text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#f0f4f9] dark:bg-[#282a2f] border border-[#e0e3e7] dark:border-[#34373d] font-mono text-2xs font-bold text-[#1f1f1f] dark:text-[#e2e2e6]">
                      <Clock className="w-3 h-3 text-[#0b57d0] dark:text-[#a8c7fa]" />
                      <span>{mounted && istTime ? istTime : "IST Active"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & AI Recommendations Card (Compact & Balanced) */}
            <div className="border border-[#e0e3e7] dark:border-[#34373d] rounded-2xl bg-white dark:bg-[#1d1f24] p-3.5 shadow-xs flex-1 flex flex-col justify-between">
              {/* Top: AI Recommendation Header & Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1f1f1f] dark:text-white">
                    <Sparkles className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
                    <span>AI Recommended Action</span>
                  </div>
                  <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#e8f0fe] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#a8c7fa]">
                    Ready
                  </span>
                </div>

                <div className="text-xs text-[#444746] dark:text-[#c4c6cf] leading-relaxed bg-[#f8fafd] dark:bg-[#282a2f] p-2 rounded-xl border border-[#e0e3e7]/80 dark:border-[#34373d]">
                  Reschedule Client Debrief to 3:30 PM to honor your protected focus block rule.
                </div>
              </div>

              {/* Middle: Call on Mobile (Voice Escalation) Toggle */}
              <div className="pt-2 border-t border-[#e0e3e7]/80 dark:border-[#34373d]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1f1f1f] dark:text-white">
                      <PhoneCall className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
                      <span>Call on Mobile</span>
                      <span className="text-3xs font-normal text-[#747775] dark:text-[#8e9099]">
                        ({mobileNotify ? "Active" : "In-App Only"})
                      </span>
                    </div>
                    <p className="text-3xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                      Voice call escalation for urgent schedule conflicts &amp; clearances.
                    </p>
                  </div>

                  {/* Interactive Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={mobileNotify}
                    onClick={() => setMobileNotify(!mobileNotify)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      mobileNotify ? "bg-[#1e8e3e]" : "bg-[#c4c7c5] dark:bg-[#444746]"
                    }`}
                    title="Toggle Call on Mobile"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        mobileNotify ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Bottom: Execution Autonomy Mode */}
              <div className="pt-2 border-t border-[#e0e3e7]/80 dark:border-[#34373d]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1f1f1f] dark:text-white">
                    <Zap className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
                    <span>Autonomy Mode</span>
                  </div>
                  <span className="text-3xs text-[#747775] dark:text-[#8e9099]">
                    {aiMode === "safe" ? "Guarded execution" : "Autonomous execution"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAiMode("safe")}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      aiMode === "safe"
                        ? "bg-[#e8f0fe] dark:bg-[#004a77]/50 border-[#0b57d0] dark:border-[#a8c7fa] text-[#0b57d0] dark:text-[#a8c7fa] shadow-2xs"
                        : "bg-[#f8fafd] dark:bg-[#282a2f] border-[#e0e3e7] dark:border-[#34373d] text-[#444746] dark:text-[#c4c6cf] hover:bg-[#f0f4f9] dark:hover:bg-[#34373d]"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Safe Mode</span>
                    </div>
                    <span className="text-3xs font-normal opacity-80">Clearance required</span>
                  </button>

                  <button
                    onClick={() => setAiMode("turbo")}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      aiMode === "turbo"
                        ? "bg-[#fff3e0] dark:bg-[#4a2800]/50 border-[#e65100] dark:border-[#ffb77d] text-[#e65100] dark:text-[#ffb77d] shadow-2xs"
                        : "bg-[#f8fafd] dark:bg-[#282a2f] border-[#e0e3e7] dark:border-[#34373d] text-[#444746] dark:text-[#c4c6cf] hover:bg-[#f0f4f9] dark:hover:bg-[#34373d]"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>Turbo Mode</span>
                    </div>
                    <span className="text-3xs font-normal opacity-80">Full autonomy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Row */}
        <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-4 shrink-0">
          {/* Bottom Left: Connected Workspace Apps (No card box, clean transparent display) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-2xs font-bold text-[#747775] dark:text-[#8e9099] uppercase tracking-wider hidden sm:inline">
              Apps
            </span>
            <div className="flex items-center gap-2">
              {/* Gmail Icon */}
              <div className="relative group cursor-pointer" title="Gmail: Connected & Synchronized">
                <div className="w-9 h-9 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="/icons/gmail.png"
                    alt="Gmail"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34A853] border-2 border-white dark:border-[#1d1f24]" />
              </div>

              {/* Calendar Icon */}
              <div className="relative group cursor-pointer" title="Google Calendar: Connected & Synchronized">
                <div className="w-9 h-9 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="/icons/calendar.png"
                    alt="Calendar"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34A853] border-2 border-white dark:border-[#1d1f24]" />
              </div>

              {/* Tasks Icon */}
              <div className="relative group cursor-pointer" title="Google Tasks: Connected & Synchronized">
                <div className="w-9 h-9 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="/icons/tasks.svg"
                    alt="Tasks"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34A853] border-2 border-white dark:border-[#1d1f24]" />
              </div>

              {/* Plus Button to Connect More Apps */}
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="w-9 h-9 rounded-xl border border-dashed border-[#747775]/50 dark:border-[#8e9099]/50 hover:border-[#0b57d0] dark:hover:border-[#a8c7fa] hover:bg-[#d3e3fd]/20 dark:hover:bg-[#004a77]/20 text-[#747775] dark:text-[#8e9099] dark:hover:text-[#a8c7fa] flex items-center justify-center transition-all cursor-pointer"
                title="Connect More Applications"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Middle: Chat Input for the AI (Spacious central bar) */}
          <div className="w-full flex-1 min-w-0 border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] rounded-2xl p-2.5 lg:p-3 shadow-xs flex flex-col justify-between">
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#d3e3fd] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#a8c7fa] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask PACT AI to draft an email, reschedule a meeting, or query your tasks..."
                className="flex-1 bg-transparent px-2 py-1.5 text-xs text-[#1f1f1f] dark:text-[#e2e2e6] placeholder:text-[#747775] dark:placeholder:text-[#8e9099] focus:outline-none"
              />

              <button
                type="button"
                className="p-1.5 rounded-full text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
                title="Voice Input"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-8 h-8 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa] text-white dark:text-[#00325b] flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-40 cursor-pointer shadow-xs"
                title="Send Command"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Command Suggestions */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
              <span className="text-3xs text-[#747775] dark:text-[#8e9099] shrink-0 font-medium">
                Suggestions:
              </span>
              <button
                onClick={() =>
                  setChatInput("Reschedule Client Technical Debrief to 3:30 PM")
                }
                className="px-2 py-0.5 rounded-full bg-[#f0f4f9] dark:bg-[#282a2f] hover:bg-[#e4ebf5] dark:hover:bg-[#34373d] text-3xs text-[#444746] dark:text-[#c4c6cf] shrink-0 transition-colors cursor-pointer"
              >
                Reschedule conflict
              </button>
              <button
                onClick={() =>
                  setChatInput("Summarize unread emails from Sarah Lin")
                }
                className="px-2 py-0.5 rounded-full bg-[#f0f4f9] dark:bg-[#282a2f] hover:bg-[#e4ebf5] dark:hover:bg-[#34373d] text-3xs text-[#444746] dark:text-[#c4c6cf] shrink-0 transition-colors cursor-pointer"
              >
                Summarize unread
              </button>
              <button
                onClick={() =>
                  setChatInput("List all priority tasks due today")
                }
                className="px-2 py-0.5 rounded-full bg-[#f0f4f9] dark:bg-[#282a2f] hover:bg-[#e4ebf5] dark:hover:bg-[#34373d] text-3xs text-[#444746] dark:text-[#c4c6cf] shrink-0 transition-colors cursor-pointer"
              >
                Tasks due today
              </button>
            </div>
          </div>

          {/* Bottom Right: Usable Buttons (No card box, Settings and Theme only) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="py-2.5 px-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] active:bg-[#e4ebf5] dark:active:bg-[#34373d] text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="System & Security Settings"
            >
              <Settings className="w-4 h-4 text-[#444746] dark:text-[#c4c6cf]" />
              <span>Settings</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={handleToggleTheme}
              className="py-2.5 px-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] active:bg-[#e4ebf5] dark:active:bg-[#34373d] text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-[#a8c7fa]" />
              ) : (
                <Sun className="w-4 h-4 text-[#f9ab00]" />
              )}
              <span>{isDark ? "Dark" : "Theme"}</span>
            </button>
          </div>
        </div>
      </main>



      {/* Modal: Connect More Apps */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Connect Enterprise Applications"
      >
        <div className="space-y-3 text-left">
          <p className="text-xs text-[#444746] dark:text-[#c4c6cf] leading-relaxed">
            Expand PACT cross-app orchestration with additional authorized integrations:
          </p>
          <div className="space-y-2">
            <div className="p-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] flex items-center justify-between bg-[#f8fafd] dark:bg-[#282a2f]">
              <div>
                <div className="text-xs font-bold text-[#1f1f1f] dark:text-white">Slack Workspaces</div>
                <div className="text-2xs text-[#747775] dark:text-[#8e9099]">Channel alerts &amp; urgent mentions</div>
              </div>
              <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#a8c7fa]">
                Coming Soon
              </span>
            </div>
            <div className="p-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] flex items-center justify-between bg-[#f8fafd] dark:bg-[#282a2f]">
              <div>
                <div className="text-xs font-bold text-[#1f1f1f] dark:text-white">WhatsApp Business / SMS</div>
                <div className="text-2xs text-[#747775] dark:text-[#8e9099]">Executive VIP emergency escalation</div>
              </div>
              <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#a8c7fa]">
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
        <div className="space-y-3.5 text-left text-xs text-[#444746] dark:text-[#c4c6cf]">
          <div className="p-3 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7] dark:border-[#34373d]">
            <div className="font-bold text-[#1f1f1f] dark:text-white mb-1">Authenticated Account</div>
            <div className="font-mono text-2xs text-[#747775] dark:text-[#8e9099]">{displayEmail}</div>
            <div className="font-mono text-2xs text-[#747775] dark:text-[#8e9099] mt-0.5">UID: {activeUser?.id}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7] dark:border-[#34373d]">
            <div className="font-bold text-[#1f1f1f] dark:text-white mb-1">Cryptographic Idempotency</div>
            <div className="text-2xs text-[#747775] dark:text-[#8e9099]">All consequential actions verified with zero duplicate execution.</div>
          </div>
        </div>
      </Modal>

      {/* Modal: Custom Sign Out Confirmation */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Sign Out of P.A.C.T."
        maxWidth="sm"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#444746] dark:text-[#c4c6cf] leading-relaxed">
            Are you sure you want to end your active session?
          </p>

          <div className="p-3 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7] dark:border-[#34373d] text-2xs text-[#747775] dark:text-[#8e9099]">
            Account: <span className="font-semibold text-[#1f1f1f] dark:text-white">{displayEmail}</span>
            <div className="mt-1 text-3xs text-[#747775] dark:text-[#8e9099]">
              Your session will be cleared from this browser. You can sign back in anytime with your Google account.
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-4 py-2 rounded-full border border-[#e0e3e7] dark:border-[#34373d] text-xs font-semibold text-[#444746] dark:text-[#c4c6cf] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] active:bg-[#e4ebf5] dark:active:bg-[#34373d] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogoutModalOpen(false);
                logout();
              }}
              className="px-5 py-2 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] active:bg-[#680003] text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
            >
              Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
