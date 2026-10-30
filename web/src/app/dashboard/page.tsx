"use client";

import React, { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { WorkspaceWindow, WorkspaceChatPanel } from "@/components/workspace-window";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { WorkspaceData } from "@/lib/workspace-service";
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
  const { user, isLoading, logout, connectGoogleWorkspace } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Local session cache for instantaneous client retrieval post-hydration
  const [localCache, setLocalCache] = useState<any>(null);

  // Theme state (Dark/Light mode support)
  const [isDark, setIsDark] = useState(false);

  // Active in-app macOS workspace window ("gmail" | "calendar" | "tasks" | null)
  const [activeAppWindow, setActiveAppWindow] = useState<"gmail" | "calendar" | "tasks" | null>(null);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);

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

  const handleToggleTheme = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const nextDark = !isDark;

    const applyTheme = () => {
      setIsDark(nextDark);
      if (typeof window !== "undefined") {
        localStorage.setItem("pact_theme", nextDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", nextDark);
        document.body.classList.toggle("dark", nextDark);
      }
    };

    const doc = typeof document !== "undefined" ? (document as any) : null;
    const isAppearanceTransition =
      doc &&
      typeof doc.startViewTransition === "function" &&
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isAppearanceTransition || !event) {
      applyTheme();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.style.setProperty("--x", `${x}px`);
    document.documentElement.style.setProperty("--y", `${y}px`);
    document.documentElement.style.setProperty("--r", `${endRadius}px`);
    document.documentElement.classList.add("pact-theme-transitioning");

    try {
      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          applyTheme();
        });
      });

      transition.ready?.catch?.(() => {});
      transition.finished?.finally?.(() => {
        document.documentElement.classList.remove("pact-theme-transitioning");
      });
    } catch {
      document.documentElement.classList.remove("pact-theme-transitioning");
      applyTheme();
    }
  };

  const activeUser = user || localCache;

  // Redirect to login only if confirmed unauthenticated after mount
  useEffect(() => {
    if (mounted && !isLoading && !activeUser) {
      router.push("/login");
    }
  }, [mounted, isLoading, activeUser, router]);

  // Dynamic user data (SSR safe with mounted guard to eliminate hydration mismatch)
  const displayName = mounted && activeUser?.fullName ? activeUser.fullName : "Aditya Nanda";
  const displayEmail = mounted && activeUser?.email ? activeUser.email : "adityananda.dev@gmail.com";
  const displayAvatar = mounted && activeUser?.avatarUrl ? activeUser.avatarUrl : "";
  const displayRole = mounted && activeUser?.role ? activeUser.role : "Lead Architect";
  const displayAge = mounted && activeUser?.age ? activeUser.age : 24;
  const displayPreference =
    mounted && activeUser?.schedulePreference
      ? activeUser.schedulePreference
      : "Avoid meetings before 10:00 AM";

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

  // Live Workspace API State
  const [workspace, setWorkspace] = useState<any>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isCheckingWorkspace, setIsCheckingWorkspace] = useState(true);

  // Fetch full workspace state from backend API (with live Google token)
  const refreshWorkspace = async () => {
    setIsCheckingWorkspace(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("pact_google_access_token")
          : null;

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/workspace/overview", { headers });
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
        if (data.settings) {
          setMobileNotify(Boolean(data.settings.mobileNotify));
          if (data.settings.aiMode) {
            setAiMode(data.settings.aiMode);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch workspace overview from API:", err);
    } finally {
      setIsCheckingWorkspace(false);
    }
  };

  useEffect(() => {
    refreshWorkspace();
  }, []);

  const [manualToken, setManualToken] = useState("");
  const [tokenSyncStatus, setTokenSyncStatus] = useState<string | null>(null);

  // Connect / Re-authenticate Google Workspace services with live scopes
  const handleConnectGoogleServices = async () => {
    setIsConnectingGoogle(true);
    setTokenSyncStatus(null);
    try {
      const token = await connectGoogleWorkspace();
      if (token) {
        await refreshWorkspace();
      }
    } catch (err: any) {
      console.error("Failed to connect live Google Workspace services:", err);
      setTokenSyncStatus(`Connection error: ${err?.message || "Popup closed or cancelled"}`);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // Direct manual OAuth token sync (for development or direct token entry)
  const handleSaveManualToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = manualToken.trim();
    if (!token) return;
    setIsConnectingGoogle(true);
    setTokenSyncStatus("Validating token...");
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("pact_google_access_token", token);
      }
      const res = await fetch("/api/workspace/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleAccessToken: token }),
      });
      if (res.ok) {
        await refreshWorkspace();
        setTokenSyncStatus("Token synchronized successfully! Live workspace refreshed.");
      } else {
        setTokenSyncStatus("Failed to synchronize token with server.");
      }
    } catch (err: any) {
      setTokenSyncStatus(`Sync error: ${err?.message || "Failed"}`);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // Sync Call on Mobile toggle with backend API
  const handleToggleMobileNotify = async () => {
    const nextVal = !mobileNotify;
    setMobileNotify(nextVal);
    try {
      await fetch("/api/workspace/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { mobileNotify: nextVal } }),
      });
    } catch (err) {
      console.warn("Failed to sync mobile notification setting:", err);
    }
  };

  // Sync AI Autonomy Mode with backend API
  const handleSelectAiMode = async (mode: "safe" | "turbo") => {
    setAiMode(mode);
    try {
      await fetch("/api/workspace/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { aiMode: mode } }),
      });
    } catch (err) {
      console.warn("Failed to sync AI autonomy mode:", err);
    }
  };

  // Approve AI Clearance Action via API
  const handleApproveAction = async () => {
    if (isApproving || workspace?.aiRecommendation?.status === "Executed") return;
    setIsApproving(true);
    try {
      const res = await fetch("/api/workspace/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          actionId: workspace?.aiRecommendation?.id,
          idempotencyKey: workspace?.aiRecommendation?.idempotencyKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.workspace) {
          setWorkspace(data.workspace);
        }
      }
    } catch (err) {
      console.warn("Failed to approve action:", err);
    } finally {
      setIsApproving(false);
    }
  };

  // Fallback workspace data when live data is initializing
  const defaultWorkspace: WorkspaceData = {
    user: {
      id: user?.id || "usr_aditya",
      email: user?.email || "adityananda.dev@gmail.com",
      fullName: displayName,
      avatarUrl: displayAvatar || "",
      role: displayRole,
      age: displayAge,
      schedulePreference: "strict_focus_blocks",
    },
    metrics: {
      unreadEmails: 1,
      emailsThisMonth: 96,
      emailsImportant: 1,
      meetingsToday: 1,
      thisWeekHours: "14h",
      conflicts: 0,
      activeTasks: 4,
      dueToday: 1,
      overdue: 0,
    },
    latestEmail: {
      id: "msg_live_1",
      sender: "Renee from Cline",
      subject: "Join our next Hackathon: Built with Kimi K3.1 & Moonshot AI",
      receivedAt: "Today, 2:15 PM",
      priority: "urgent",
    },
    nextMeeting: {
      id: "evt_1",
      title: "Project Sync",
      time: "Today, 4:00 PM - 4:30 PM",
      location: "Google Meet",
      conflictDetected: false,
    },
    topAction: {
      id: "tsk_1",
      title: "Finalize System Architecture",
      description: "Submit RFC by EOD",
      priority: "urgent",
    },
    aiRecommendation: {
      id: "rec_1",
      title: "AI Recommended Action",
      message: "Reschedule Client Debrief to 3:30 PM to honor your protected focus block rule.",
      status: "Ready",
      targetService: "calendar",
      idempotencyKey: "rec_1_key",
    },
    settings: {
      mobileNotify: false,
      aiMode: "safe",
    },
    connectedApps: [
      { id: "gmail", name: "Gmail", connected: true, status: "live", icon: "/icons/gmail.png" },
      { id: "calendar", name: "Calendar", connected: true, status: "live", icon: "/icons/calendar.png" },
      { id: "tasks", name: "Tasks", connected: true, status: "live", icon: "/icons/tasks.svg" },
    ],
    emails: [
      {
        id: "msg_live_1",
        sender: "Renee from Cline",
        senderEmail: "renee@cline.bot",
        subject: "Join our next Hackathon: Built with Kimi K3.1 & Moonshot AI",
        snippet: "Hey Aditya, we are thrilled to invite you to our upcoming hackathon building next-gen autonomous agent architectures...",
        receivedAt: "Today, 2:15 PM",
        priority: "urgent",
        status: "unread",
        thisMonth: true,
      },
      {
        id: "msg_2",
        sender: "Google Cloud Platform",
        senderEmail: "google-cloud-noreply@google.com",
        subject: "Project pact-18: OAuth consent and API quotas updated",
        snippet: "Your Google Cloud Project pact-18 (651148810116) has updated API quota configurations for Gmail and Calendar.",
        receivedAt: "Yesterday, 6:40 PM",
        priority: "normal",
        status: "read",
        thisMonth: true,
      },
    ],
    calendarEvents: [
      {
        id: "cal_1",
        title: "Client Technical Debrief",
        description: "Review PACT autonomous orchestration architecture with client executive team.",
        startTime: "Today, 3:00 PM",
        endTime: "Today, 4:00 PM",
        location: "Google Meet (meet.google.com/xyz-pact-acc)",
        status: "confirmed",
        conflictDetected: true,
        isToday: true,
        hours: 1,
      },
      {
        id: "cal_2",
        title: "Google AI Hackathon Sync",
        description: "Finalize deployment and submission artifacts.",
        startTime: "Today, 5:30 PM",
        endTime: "Today, 6:30 PM",
        location: "Google Meet",
        status: "confirmed",
        conflictDetected: false,
        isToday: true,
        hours: 1,
      },
    ],
    tasks: [
      {
        id: "tsk_1",
        title: "Review Google Cloud API Quotas & Verification",
        description: "Ensure Gmail and Calendar APIs remain within free-tier threshold.",
        dueDate: "Today, 5:00 PM",
        priority: "urgent",
        status: "pending",
        isDueToday: true,
        isOverdue: false,
      },
      {
        id: "tsk_2",
        title: "Connect Firebase Auth live token refresh",
        description: "Test offline access token re-authentication pipeline.",
        dueDate: "Tomorrow, 12:00 PM",
        priority: "high",
        status: "pending",
        isDueToday: false,
        isOverdue: false,
      },
    ],
    pendingActions: [],
    isLiveGoogleData: false,
  };

  // Connected chat execution via /api/chat
  const executeChatCommand = async (msg: string) => {
    if (!msg.trim() || chatLoading) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, mode: aiMode, activeApp: activeAppWindow }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.reply || `Processed "${msg}" with guarded clearance.`,
          },
        ]);
        if (data.workspace) {
          setWorkspace(data.workspace);
        }
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `PACT Chief of Staff: Synchronized instruction "${msg}" with workspace engine.`,
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `PACT Chief of Staff: Executed "${msg}". All services are up to date.`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput;
    setChatInput("");
    await executeChatCommand(userMsg);
  };

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

  if (!mounted || isLoading || (isCheckingWorkspace && !workspace)) {
    return <DashboardSkeleton />;
  }

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

          {/* Live Data Badge / Re-auth Trigger */}
          {workspace?.isLiveGoogleData ? (
            <div className="ml-2 hidden md:inline-flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#e6f4ea] dark:bg-[#0f5223] text-[#137333] dark:text-[#81c995] text-2xs font-bold border border-[#ceead6] dark:border-[#137333] inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e8e3e] animate-pulse" />
                <span>
                  {workspace?.isDevBypass
                    ? "Google OAuth Connected (Dev Mode)"
                    : "Live Google Workspace Connected"}
                </span>
              </span>
              <button
                onClick={refreshWorkspace}
                className="p-1 rounded-lg text-[#747775] hover:text-[#0b57d0] dark:hover:text-[#a8c7fa] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
                title="Refresh Live Google Data"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGoogleServices}
              disabled={isConnectingGoogle}
              className="ml-2 px-3 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-2xs font-bold shadow-2xs transition-all cursor-pointer hidden md:inline-flex items-center gap-1.5"
              title="Authorize real Gmail, Google Calendar, and Google Tasks"
            >
              <Zap className="w-3 h-3" />
              <span>{isConnectingGoogle ? "Connecting Google..." : "Connect Google Workspace"}</span>
            </button>
          )}
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

      {/* Banner: Action Required when Google Workspace is not live */}
      {!workspace?.isLiveGoogleData && mounted && (
        <div className="mx-4 lg:mx-6 mt-3 px-4 py-2.5 rounded-2xl bg-[#fef7e0] dark:bg-[#2b2413] border border-[#f9ab00]/60 dark:border-[#f29900]/60 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#f9ab00] animate-ping shrink-0" />
            <span className="text-xs font-medium text-[#7c4a00] dark:text-[#fdd663] truncate">
              Live Google Workspace is awaiting authorization. Connect your Google account to fetch real Gmail, Calendar, and Tasks.
            </span>
          </div>
          <button
            onClick={handleConnectGoogleServices}
            disabled={isConnectingGoogle}
            className="ml-3 px-3.5 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isConnectingGoogle ? "Connecting Google..." : "Connect Google Workspace"}</span>
          </button>
        </div>
      )}

      {/* Banner: Dev Mode notice with 1-click Cloud Console activation links */}
      {workspace?.isDevBypass && mounted && (
        <div className="mx-4 lg:mx-6 mt-2.5 px-4 py-2 rounded-2xl bg-[#e8f0fe] dark:bg-[#002b4d] border border-[#0b57d0]/30 dark:border-[#a8c7fa]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa] shrink-0" />
            <span className="text-2xs font-medium text-[#041e49] dark:text-[#d3e3fd] truncate">
              Google OAuth Token Verified ({displayEmail}). Enable the APIs in Google Cloud project 651148810116 to switch from Dev Mode to direct live streams:
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href="https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=651148810116"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-3xs font-bold text-[#0b57d0] dark:text-[#a8c7fa] border border-[#0b57d0]/20 transition-all cursor-pointer"
            >
              Enable Gmail API
            </a>
            <a
              href="https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=651148810116"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-3xs font-bold text-[#0b57d0] dark:text-[#a8c7fa] border border-[#0b57d0]/20 transition-all cursor-pointer"
            >
              Enable Calendar API
            </a>
            <a
              href="https://console.developers.google.com/apis/api/tasks.googleapis.com/overview?project=651148810116"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-3xs font-bold text-[#0b57d0] dark:text-[#a8c7fa] border border-[#0b57d0]/20 transition-all cursor-pointer"
            >
              Enable Tasks API
            </a>
          </div>
        </div>
      )}

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col justify-between px-4 lg:px-6 py-3.5 lg:py-4 gap-3 lg:gap-3.5 overflow-y-auto lg:overflow-hidden">
        {activeAppWindow ? (
          /* Split View: In-App macOS Workspace Window (Left) + AI Chat Panel (Right) */
          <div className="flex-1 flex flex-col lg:flex-row gap-3.5 lg:gap-4 h-full min-h-0 overflow-hidden">
            {/* Left: macOS Workspace Window (expands to 100% if isWindowMaximized, else 68%) */}
            <div
              className={`h-full transition-all duration-300 min-h-0 ${
                isWindowMaximized ? "w-full" : "w-full lg:w-[68%]"
              }`}
            >
              <WorkspaceWindow
                activeTab={activeAppWindow}
                onChangeTab={(tab) => setActiveAppWindow(tab)}
                onClose={() => {
                  setActiveAppWindow(null);
                  setIsWindowMaximized(false);
                }}
                onMinimize={() => {
                  setActiveAppWindow(null);
                  setIsWindowMaximized(false);
                }}
                isMaximized={isWindowMaximized}
                onToggleMaximize={() => setIsWindowMaximized(!isWindowMaximized)}
                workspace={workspace || defaultWorkspace}
                userEmail={user?.email || "adityananda.dev@gmail.com"}
                onRefreshWorkspace={refreshWorkspace}
                isRefreshing={false}
                onAskAiAboutEmail={(email) => {
                  executeChatCommand(
                    `Analyze email from ${email.sender} regarding "${email.subject}" and prepare an executive summary.`
                  );
                }}
                onResolveCalendarConflict={(event) => {
                  executeChatCommand(
                    `Propose a conflict-free resolution for meeting "${event.title}" on ${event.startTime}.`
                  );
                }}
                onAddTask={(task) => {
                  executeChatCommand(
                    `Schedule priority task "${task.title}" with Chief of Staff clearance.`
                  );
                }}
              />
            </div>

            {/* Right: AI Co-Pilot Panel (hidden if isWindowMaximized, else 32%) */}
            {!isWindowMaximized && (
              <div className="w-full lg:w-[32%] h-full min-h-0 flex flex-col">
                <WorkspaceChatPanel
                  activeApp={activeAppWindow}
                  userFullName={displayName}
                  aiMode={aiMode}
                  onSelectAiMode={handleSelectAiMode}
                  onSendMessage={executeChatCommand}
                  messages={chatMessages}
                  isLoading={chatLoading}
                />
              </div>
            )}
          </div>
        ) : (
          <>
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
                  <div className="flex items-center gap-1.5 text-2xs font-medium shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        workspace?.isLiveGoogleData ? "bg-[#1e8e3e]" : "bg-[#EA4335]"
                      }`}
                    />
                    <span className="text-[#747775] dark:text-[#8e9099]">
                      {workspace?.isLiveGoogleData ? "Gmail Live" : "Auth Required"}
                    </span>
                  </div>
                </div>

                {/* Big Number in a Card Background with Center-aligned Below Font */}
                <div className="my-3 bg-[#f8fafd] dark:bg-[#282a2f] p-3.5 rounded-2xl border border-[#e0e3e7]/80 dark:border-[#34373d] text-center shadow-2xs">
                  <div className="text-3xl lg:text-4xl font-extrabold text-[#1f1f1f] dark:text-white tracking-tight">
                    {workspace?.isLiveGoogleData ? (workspace?.metrics?.unreadEmails ?? 0) : "—"}
                  </div>
                  <div className="text-xs font-medium text-[#747775] dark:text-[#8e9099] text-center mt-1">
                    {workspace?.isLiveGoogleData ? "Unread priority emails" : "Connect Google to load live inbox"}
                  </div>
                </div>

                {/* 3 Metric Cards Vertically Stacked */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">This month</span>
                    <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
                      {workspace?.isLiveGoogleData ? (workspace?.metrics?.emailsThisMonth ?? 0) : "—"}
                    </span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">Important</span>
                    <span className="text-xs font-bold text-[#ba1a1a] dark:text-[#ff897d]">
                      {workspace?.isLiveGoogleData ? (workspace?.metrics?.emailsImportant ?? 0) : "—"}
                    </span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex flex-col justify-center">
                    {workspace?.isLiveGoogleData ? (
                      <>
                        <div className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6] truncate">
                          {workspace?.latestEmail?.sender ? `Latest: ${workspace.latestEmail.sender}` : "Latest: No new emails"}
                        </div>
                        <div className="text-2xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                          {workspace?.latestEmail?.subject || "Inbox is clean"}
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={handleConnectGoogleServices}
                        disabled={isConnectingGoogle}
                        className="text-left group/btn cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-[#0b57d0] dark:text-[#a8c7fa] group-hover/btn:underline flex items-center justify-between">
                          <span>{isConnectingGoogle ? "Connecting Google..." : "Connect Live Gmail"}</span>
                          <span>→</span>
                        </div>
                        <div className="text-2xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                          Authorize real-time inbox stream
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Button */}
              {workspace?.isLiveGoogleData ? (
                <button
                  onClick={() => setActiveAppWindow("gmail")}
                  className="w-full mt-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] active:bg-[#e4ebf5] dark:active:bg-[#34373d] py-2 px-3 font-semibold text-xs text-[#1f1f1f] dark:text-[#e2e2e6] flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
                >
                  <span>Open Gmail</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#747775] dark:text-[#8e9099] group-hover:text-[#0b57d0] dark:group-hover:text-[#a8c7fa] transition-colors" />
                </button>
              ) : (
                <button
                  onClick={handleConnectGoogleServices}
                  disabled={isConnectingGoogle}
                  className="w-full mt-3 rounded-xl border border-[#0b57d0]/30 bg-[#0b57d0]/10 hover:bg-[#0b57d0]/20 dark:bg-[#a8c7fa]/10 dark:hover:bg-[#a8c7fa]/20 py-2 px-3 font-semibold text-xs text-[#0b57d0] dark:text-[#a8c7fa] flex items-center justify-between shadow-2xs transition-all cursor-pointer"
                >
                  <span>{isConnectingGoogle ? "Connecting..." : "Connect Gmail"}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
                </button>
              )}
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
                  <div className="flex items-center gap-1.5 text-2xs font-medium shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        workspace?.isLiveGoogleData ? "bg-[#1e8e3e]" : "bg-[#4285F4]"
                      }`}
                    />
                    <span className="text-[#747775] dark:text-[#8e9099]">
                      {workspace?.isLiveGoogleData ? "Calendar Live" : "Auth Required"}
                    </span>
                  </div>
                </div>

                {/* Big Number in a Card Background with Center-aligned Below Font */}
                <div className="my-3 bg-[#f8fafd] dark:bg-[#282a2f] p-3.5 rounded-2xl border border-[#e0e3e7]/80 dark:border-[#34373d] text-center shadow-2xs">
                  <div className="text-3xl lg:text-4xl font-extrabold text-[#1f1f1f] dark:text-white tracking-tight">
                    {workspace?.isLiveGoogleData ? (workspace?.metrics?.meetingsToday ?? 0) : "—"}
                  </div>
                  <div className="text-xs font-medium text-[#747775] dark:text-[#8e9099] text-center mt-1">
                    {workspace?.isLiveGoogleData ? "Meetings scheduled today" : "Connect Google to load live calendar"}
                  </div>
                </div>

                {/* 3 Metric Cards Vertically Stacked */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">This week</span>
                    <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
                      {workspace?.isLiveGoogleData ? (workspace?.metrics?.thisWeekHours ?? "0h") : "—"}
                    </span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">Conflicts</span>
                    <span className="text-xs font-bold text-[#1e8e3e] dark:text-[#81c995]">
                      {workspace?.isLiveGoogleData ? `${workspace?.metrics?.conflicts ?? 0} Protected` : "—"}
                    </span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex flex-col justify-center">
                    {workspace?.isLiveGoogleData ? (
                      <>
                        <div className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6] truncate">
                          {workspace?.nextMeeting?.title ? `Next: ${workspace.nextMeeting.title}` : "Next: Calendar clear"}
                        </div>
                        <div className="text-2xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                          {workspace?.nextMeeting?.time || "No upcoming meetings"}
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={handleConnectGoogleServices}
                        disabled={isConnectingGoogle}
                        className="text-left group/btn cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-[#0b57d0] dark:text-[#a8c7fa] group-hover/btn:underline flex items-center justify-between">
                          <span>{isConnectingGoogle ? "Connecting Google..." : "Connect Google Calendar"}</span>
                          <span>→</span>
                        </div>
                        <div className="text-2xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                          Authorize real-time schedule stream
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Button */}
              {workspace?.isLiveGoogleData ? (
                <button
                  onClick={() => setActiveAppWindow("calendar")}
                  className="w-full mt-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] active:bg-[#e4ebf5] dark:active:bg-[#34373d] py-2 px-3 font-semibold text-xs text-[#1f1f1f] dark:text-[#e2e2e6] flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
                >
                  <span>Open Calendar</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#747775] dark:text-[#8e9099] group-hover:text-[#0b57d0] dark:group-hover:text-[#a8c7fa] transition-colors" />
                </button>
              ) : (
                <button
                  onClick={handleConnectGoogleServices}
                  disabled={isConnectingGoogle}
                  className="w-full mt-3 rounded-xl border border-[#0b57d0]/30 bg-[#0b57d0]/10 hover:bg-[#0b57d0]/20 dark:bg-[#a8c7fa]/10 dark:hover:bg-[#a8c7fa]/20 py-2 px-3 font-semibold text-xs text-[#0b57d0] dark:text-[#a8c7fa] flex items-center justify-between shadow-2xs transition-all cursor-pointer"
                >
                  <span>{isConnectingGoogle ? "Connecting..." : "Connect Calendar"}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
                </button>
              )}
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
                  <div className="flex items-center gap-1.5 text-2xs font-medium shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        workspace?.isLiveGoogleData ? "bg-[#1e8e3e]" : "bg-[#34A853]"
                      }`}
                    />
                    <span className="text-[#747775] dark:text-[#8e9099]">
                      {workspace?.isLiveGoogleData ? "Tasks Live" : "Auth Required"}
                    </span>
                  </div>
                </div>

                {/* Big Number in a Card Background with Center-aligned Below Font */}
                <div className="my-3 bg-[#f8fafd] dark:bg-[#282a2f] p-3.5 rounded-2xl border border-[#e0e3e7]/80 dark:border-[#34373d] text-center shadow-2xs">
                  <div className="text-3xl lg:text-4xl font-extrabold text-[#1f1f1f] dark:text-white tracking-tight">
                    {workspace?.isLiveGoogleData ? (workspace?.metrics?.activeTasks ?? 0) : "—"}
                  </div>
                  <div className="text-xs font-medium text-[#747775] dark:text-[#8e9099] text-center mt-1">
                    {workspace?.isLiveGoogleData ? "Active tasks pending" : "Connect Google to load live queue"}
                  </div>
                </div>

                {/* 3 Metric Cards Vertically Stacked */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">Due today</span>
                    <span className="text-xs font-bold text-[#e65100] dark:text-[#ffb77d]">
                      {workspace?.isLiveGoogleData ? `${workspace?.metrics?.dueToday ?? 0} Urgent` : "—"}
                    </span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex items-center justify-between">
                    <span className="text-xs text-[#747775] dark:text-[#8e9099]">Overdue</span>
                    <span className="text-xs font-bold text-[#1e8e3e] dark:text-[#81c995]">
                      {workspace?.isLiveGoogleData ? `${workspace?.metrics?.overdue ?? 0} On track` : "—"}
                    </span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-[#282a2f] px-3 py-2 rounded-xl border border-[#e0e3e7]/70 dark:border-[#34373d] flex flex-col justify-center">
                    {workspace?.isLiveGoogleData ? (
                      <>
                        <div className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e2e2e6] truncate">
                          {workspace?.topAction?.title || "Top Task"}
                        </div>
                        <div className="text-2xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                          {workspace?.topAction?.description || "All tasks completed"}
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={handleConnectGoogleServices}
                        disabled={isConnectingGoogle}
                        className="text-left group/btn cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-[#0b57d0] dark:text-[#a8c7fa] group-hover/btn:underline flex items-center justify-between">
                          <span>{isConnectingGoogle ? "Connecting Google..." : "Connect Google Tasks"}</span>
                          <span>→</span>
                        </div>
                        <div className="text-2xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                          Authorize real-time tasks queue
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Button */}
              {workspace?.isLiveGoogleData ? (
                <button
                  onClick={() => setActiveAppWindow("tasks")}
                  className="w-full mt-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] active:bg-[#e4ebf5] dark:active:bg-[#34373d] py-2 px-3 font-semibold text-xs text-[#1f1f1f] dark:text-[#e2e2e6] flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
                >
                  <span>Open Tasks</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#747775] dark:text-[#8e9099] group-hover:text-[#0b57d0] dark:group-hover:text-[#a8c7fa] transition-colors" />
                </button>
              ) : (
                <button
                  onClick={handleConnectGoogleServices}
                  disabled={isConnectingGoogle}
                  className="w-full mt-3 rounded-xl border border-[#0b57d0]/30 bg-[#0b57d0]/10 hover:bg-[#0b57d0]/20 dark:bg-[#a8c7fa]/10 dark:hover:bg-[#a8c7fa]/20 py-2 px-3 font-semibold text-xs text-[#0b57d0] dark:text-[#a8c7fa] flex items-center justify-between shadow-2xs transition-all cursor-pointer"
                >
                  <span>{isConnectingGoogle ? "Connecting..." : "Connect Tasks"}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
                </button>
              )}
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
                    <span>{workspace?.aiRecommendation?.title || "AI Recommended Action"}</span>
                  </div>
                  <button
                    onClick={handleApproveAction}
                    disabled={isApproving || workspace?.aiRecommendation?.status === "Executed"}
                    className={`text-3xs font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                      workspace?.aiRecommendation?.status === "Executed"
                        ? "bg-[#e6f4ea] dark:bg-[#0f5223] text-[#137333] dark:text-[#81c995]"
                        : "bg-[#e8f0fe] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#a8c7fa] hover:opacity-85 active:scale-95"
                    }`}
                    title="Click to approve and execute recommendation"
                  >
                    {isApproving ? "Executing..." : (workspace?.aiRecommendation?.status || "Ready")}
                  </button>
                </div>

                <div className="text-xs text-[#444746] dark:text-[#c4c6cf] leading-relaxed bg-[#f8fafd] dark:bg-[#282a2f] p-2 rounded-xl border border-[#e0e3e7]/80 dark:border-[#34373d]">
                  {workspace?.aiRecommendation?.message ||
                    "Reschedule Client Debrief to 3:30 PM to honor your protected focus block rule."}
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
                    onClick={handleToggleMobileNotify}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      mobileNotify ? "bg-[#1e8e3e]" : "bg-[#c4c7c5] dark:bg-[#444746]"
                    }`}
                    title="Toggle Call on Mobile (Synchronized with Backend)"
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
                    onClick={() => handleSelectAiMode("safe")}
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
                    onClick={() => handleSelectAiMode("turbo")}
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
              <div
                onClick={() => setActiveAppWindow("gmail")}
                className="relative group cursor-pointer"
                title="Open Gmail In-App Window"
              >
                <div className="w-9 h-9 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="/icons/gmail.png"
                    alt="Gmail"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span
                  className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1d1f24] ${
                    workspace?.isLiveGoogleData ? "bg-[#34A853]" : "bg-[#FBBC04]"
                  }`}
                />
              </div>

              {/* Calendar Icon */}
              <div
                onClick={() => setActiveAppWindow("calendar")}
                className="relative group cursor-pointer"
                title="Open Calendar In-App Window"
              >
                <div className="w-9 h-9 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="/icons/calendar.png"
                    alt="Calendar"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span
                  className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1d1f24] ${
                    workspace?.isLiveGoogleData ? "bg-[#34A853]" : "bg-[#FBBC04]"
                  }`}
                />
              </div>

              {/* Tasks Icon */}
              <div
                onClick={() => setActiveAppWindow("tasks")}
                className="relative group cursor-pointer"
                title="Open Tasks In-App Window"
              >
                <div className="w-9 h-9 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="/icons/tasks.svg"
                    alt="Tasks"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span
                  className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1d1f24] ${
                    workspace?.isLiveGoogleData ? "bg-[#34A853]" : "bg-[#FBBC04]"
                  }`}
                />
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
            {chatMessages.length > 0 && (
              <div className="mb-2 p-2 rounded-xl bg-[#f0f4f9] dark:bg-[#282a2f] border border-[#e0e3e7]/80 dark:border-[#34373d] flex items-start justify-between gap-2 text-xs animate-in fade-in duration-200">
                <div className="flex items-start gap-1.5 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa] shrink-0 mt-0.5" />
                  <span className="text-[#1f1f1f] dark:text-[#e2e2e6] leading-snug">
                    {chatMessages[chatMessages.length - 1].text}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatMessages([])}
                  className="text-3xs text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white shrink-0 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

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
                disabled={!chatInput.trim() || chatLoading}
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
      </>
    )}
  </main>



      {/* Modal: Connect More Apps */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Connect Workspace &amp; Integrations"
      >
        <div className="space-y-4 text-left">
          {/* Google Workspace Core Integration */}
          <div className="p-3.5 rounded-2xl border border-[#0b57d0]/30 dark:border-[#a8c7fa]/30 bg-[#f8fafd] dark:bg-[#1e222b]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e0e3e7] dark:border-[#34373d]">
              <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-1">
                  <img src="/icons/gmail.png" alt="Gmail" className="w-4 h-4 object-contain" />
                  <img src="/icons/calendar.png" alt="Calendar" className="w-4 h-4 object-contain" />
                  <img src="/icons/tasks.svg" alt="Tasks" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
                  Google Workspace (Gmail, Calendar, Tasks)
                </span>
              </div>
              <span
                className={`text-3xs font-semibold px-2 py-0.5 rounded-full ${
                  workspace?.isLiveGoogleData
                    ? "bg-[#e6f4ea] dark:bg-[#0f5223] text-[#137333] dark:text-[#81c995]"
                    : "bg-[#fef7e0] dark:bg-[#332a00] text-[#7c4a00] dark:text-[#fdd663]"
                }`}
              >
                {workspace?.isLiveGoogleData ? "Live Connected" : "Action Required"}
              </span>
            </div>

            <p className="text-2xs text-[#747775] dark:text-[#8e9099] leading-relaxed mb-3">
              Stream live emails, calendar conflicts, and tasks directly into PACT with bidirectional clearance.
            </p>

            <button
              onClick={handleConnectGoogleServices}
              disabled={isConnectingGoogle}
              className="w-full py-2 px-3 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {isConnectingGoogle
                  ? "Authorizing Google Account..."
                  : workspace?.isLiveGoogleData
                  ? "Re-authorize Google Workspace"
                  : "Authorize Google Workspace (1-Click Popup)"}
              </span>
            </button>
          </div>

          {/* Manual OAuth Access Token Form */}
          <form
            onSubmit={handleSaveManualToken}
            className="p-3.5 rounded-2xl border border-[#e0e3e7] dark:border-[#34373d] bg-[#f8fafd] dark:bg-[#282a2f] space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-[#747775] dark:text-[#8e9099] uppercase tracking-wider">
                Direct OAuth Access Token
              </span>
              <span className="text-3xs text-[#747775] dark:text-[#8e9099]">Bearer ya29...</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste Google OAuth access token here..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] text-xs text-[#1f1f1f] dark:text-white placeholder-[#747775] focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
              />
              <button
                type="submit"
                disabled={!manualToken.trim() || isConnectingGoogle}
                className="px-3.5 py-1.5 rounded-xl bg-[#1e8e3e] hover:bg-[#137333] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
              >
                Sync
              </button>
            </div>
            {tokenSyncStatus && (
              <div className="text-2xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] pt-1">
                {tokenSyncStatus}
              </div>
            )}
          </form>

          {/* Additional enterprise integrations */}
          <div className="space-y-2 pt-1">
            <div className="p-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] flex items-center justify-between bg-white dark:bg-[#1d1f24]">
              <div>
                <div className="text-xs font-bold text-[#1f1f1f] dark:text-white">Slack Enterprise</div>
                <div className="text-2xs text-[#747775] dark:text-[#8e9099]">Channel alerts &amp; urgent mentions</div>
              </div>
              <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#a8c7fa]">
                Coming Soon
              </span>
            </div>
            <div className="p-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] flex items-center justify-between bg-white dark:bg-[#1d1f24]">
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
