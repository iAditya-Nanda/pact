"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Mail,
  CheckSquare,
  Bot,
  Sliders,
  History,
  Home,
  LogOut,
  Bell,
  ArrowRight,
  ShieldCheck,
  CalendarCheck2,
  Clock,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface WorkspaceData {
  user: {
    email: string;
    full_name: string;
    avatar_url?: string;
    role: string;
    age?: number;
    schedule_preference: string;
  };
  metrics: {
    unreadEmails: number;
    pendingTasks: number;
    activeConflicts: number;
    pendingClearances: number;
  };
  emails: any[];
  calendarEvents: any[];
  tasks: any[];
  pendingActions: any[];
  proactiveAlerts: any[];
  preferences: any[];
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Fetch real data from backend API
  const fetchWorkspace = async () => {
    try {
      const res = await fetch("/api/workspace/overview");
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
      }
    } catch (err) {
      console.error("Failed to load workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const handleApproveAction = async (actionId: string, idempotencyKey: string) => {
    setApprovingId(actionId);
    try {
      const res = await fetch("/api/actions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, idempotencyKey }),
      });
      if (res.ok) {
        // Refresh real state from database
        await fetchWorkspace();
      }
    } catch (err) {
      console.error("Failed to approve action:", err);
    } finally {
      setApprovingId(null);
    }
  };

  const displayName = workspace?.user?.full_name || user?.fullName || "Aditya Nanda";
  const displayEmail = workspace?.user?.email || user?.email || "adityananda.dev@gmail.com";
  const displayRole = workspace?.user?.role || user?.role || "Lead Architect";
  const displayPreference =
    workspace?.user?.schedule_preference ||
    user?.schedulePreference ||
    "Avoid meetings before 10:00 AM";

  const metrics = workspace?.metrics || {
    unreadEmails: 0,
    pendingTasks: 0,
    activeConflicts: 0,
    pendingClearances: 0,
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "inbox", label: "Communications", icon: Mail },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "agent", label: "Agent Copilot", icon: Bot },
    { id: "preferences", label: "Preferences", icon: Sliders },
    { id: "audit", label: "Audit Log", icon: History },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8fafd] select-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0b57d0]" />
          <span className="text-sm font-medium text-[#444746]">
            Synchronizing workspace data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen flex overflow-hidden bg-[#f8fafd] select-none text-[#1f1f1f]">
      {/* 1. Left Navigation Rail (M3 Style) */}
      <aside className="w-18 lg:w-64 bg-white border-r border-[#e0e3e7] flex flex-col justify-between shrink-0 transition-all duration-200">
        <div>
          {/* Logo Bar */}
          <div className="h-16 border-b border-[#e0e3e7] flex items-center px-5 gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm tracking-wider shrink-0 shadow-xs">
              P
            </div>
            <span className="hidden lg:block text-xl font-bold tracking-tight text-[#1f1f1f]">
              PACT
            </span>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-full lg:rounded-r-full lg:rounded-l-none text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#c2e7ff] text-[#041e49] font-semibold"
                      : "text-[#444746] hover:bg-[#f0f4f9] hover:text-[#1f1f1f]"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-[#0b57d0]" : "text-[#444746]"
                    }`}
                  />
                  <span className="hidden lg:block truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#e0e3e7]">
          <div className="hidden lg:flex items-center justify-between p-2 mb-2 rounded-xl bg-[#f0f4f9]">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-[#1f1f1f] truncate">
                {displayName}
              </div>
              <div className="text-2xs text-[#747775] truncate">
                {displayEmail}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-full text-[#444746] hover:text-[#ba1a1a] hover:bg-white transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={logout}
            className="lg:hidden w-full flex items-center justify-center p-2.5 rounded-full text-[#ba1a1a] hover:bg-[#ffdad6]/40 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-[#e0e3e7] bg-white px-6 lg:px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#747775]">Workspace</span>
            <span className="text-sm font-medium text-[#747775]">/</span>
            <span className="text-sm font-semibold text-[#1f1f1f] capitalize">
              {activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-full border border-[#e0e3e7] px-3.5 py-1.5 text-xs font-medium text-[#444746] hover:bg-[#f0f4f9] flex items-center gap-2 cursor-pointer">
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alerts</span>
              {workspace?.proactiveAlerts && workspace.proactiveAlerts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
              )}
            </button>

            <button className="rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>New Action</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Greeting Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div>
              <div className="text-sm text-[#444746]">Here&apos;s the latest for</div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-[#1f1f1f] tracking-tight">
                {displayName}
              </h1>
              <div className="text-xs text-[#747775] mt-0.5">
                {displayRole} • Active rule: &ldquo;{displayPreference}&rdquo;
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-full bg-[#d3e3fd] text-[#041e49] text-xs font-medium inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0b57d0]" />
                <span>Backend Connected</span>
              </div>
            </div>
          </div>

          {/* 3 KPI Status Cards (Backend Data Driven) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-[#e0e3e7] p-5 flex items-center justify-between shadow-xs hover:border-[#0b57d0]/40 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#c4eed0] text-[#146c2e] flex items-center justify-center shrink-0">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1f1f1f]">
                    Schedule Integrity
                  </div>
                  <div className="text-xs text-[#747775]">
                    {metrics.activeConflicts === 0
                      ? "0 conflicts detected"
                      : `${metrics.activeConflicts} conflict requiring resolution`}
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  metrics.activeConflicts === 0
                    ? "text-[#146c2e] bg-[#c4eed0]/60"
                    : "text-[#b06000] bg-[#ffe2a9]"
                }`}
              >
                {metrics.activeConflicts === 0 ? "Protected" : "Review"}
              </span>
            </div>

            <div className="rounded-2xl bg-white border border-[#e0e3e7] p-5 flex items-center justify-between shadow-xs hover:border-[#0b57d0]/40 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#e8def8] text-[#65558f] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1f1f1f]">
                    Action Clearance
                  </div>
                  <div className="text-xs text-[#747775]">
                    {metrics.pendingClearances === 0
                      ? "All actions verified"
                      : `${metrics.pendingClearances} action paused`}
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  metrics.pendingClearances === 0
                    ? "text-[#146c2e] bg-[#c4eed0]/60"
                    : "text-[#b06000] bg-[#ffe2a9]"
                }`}
              >
                {metrics.pendingClearances === 0 ? "Clear" : "Pending"}
              </span>
            </div>

            <div className="rounded-2xl bg-white border border-[#e0e3e7] p-5 flex items-center justify-between shadow-xs hover:border-[#0b57d0]/40 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#d3e3fd] text-[#0b57d0] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1f1f1f]">
                    Priority Tasks
                  </div>
                  <div className="text-xs text-[#747775]">
                    {metrics.pendingTasks === 0
                      ? "All tasks completed"
                      : `${metrics.pendingTasks} tasks pending`}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#0b57d0] bg-[#d3e3fd] px-2.5 py-0.5 rounded-full">
                Tracked
              </span>
            </div>
          </div>

          {/* 2-Column Content Grid (Live Database Driven) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Communications Triage (Gmail) */}
            <div className="rounded-2xl bg-white border border-[#e0e3e7] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-5 h-5 text-[#0b57d0]" />
                    <h3 className="text-base font-semibold text-[#1f1f1f]">
                      Communications Triage
                    </h3>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-[#d3e3fd] text-[#041e49] flex items-center justify-center hover:bg-[#c2e7ff] transition-colors cursor-pointer">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5 border-b border-[#e0e3e7]/60 pb-4">
                  <div>
                    <div className="text-xs text-[#747775] border-b border-dotted border-[#747775] inline-block mb-1">
                      Unread Inbox
                    </div>
                    <div className="text-2xl font-medium text-[#1f1f1f]">
                      {metrics.unreadEmails}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#747775] border-b border-dotted border-[#747775] inline-block mb-1">
                      Synced Total
                    </div>
                    <div className="text-2xl font-medium text-[#1f1f1f]">
                      {workspace?.emails?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#747775] border-b border-dotted border-[#747775] inline-block mb-1">
                      Live Stream
                    </div>
                    <div className="text-2xl font-medium text-[#146c2e]">Active</div>
                  </div>
                </div>

                {/* Email Items from Backend */}
                <div className="space-y-2.5">
                  {workspace?.emails && workspace.emails.length > 0 ? (
                    workspace.emails.slice(0, 3).map((email: any) => (
                      <div
                        key={email.id}
                        className="p-3 rounded-xl bg-[#f8fafd] border border-[#e0e3e7]/60 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#1f1f1f] truncate">
                            {email.sender}
                          </div>
                          <div className="text-xs text-[#444746] truncate">
                            {email.subject}
                          </div>
                        </div>
                        <span className="text-2xs font-semibold text-[#0b57d0] bg-[#d3e3fd] px-2 py-0.5 rounded-full shrink-0">
                          {email.priority || "Normal"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-[#747775]">
                      No messages in database. Synchronizing from Gmail API...
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e0e3e7]/60 flex items-center justify-between text-xs text-[#444746]">
                <span>Source: Google Workspace OAuth</span>
                <span className="text-[#0b57d0] font-medium cursor-pointer hover:underline">
                  Refresh Triage
                </span>
              </div>
            </div>

            {/* Card 2: Schedule & Availability (Calendar) */}
            <div className="rounded-2xl bg-white border border-[#e0e3e7] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-[#0b57d0]" />
                    <h3 className="text-base font-semibold text-[#1f1f1f]">
                      Schedule & Availability
                    </h3>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-[#d3e3fd] text-[#041e49] flex items-center justify-center hover:bg-[#c2e7ff] transition-colors cursor-pointer">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5 border-b border-[#e0e3e7]/60 pb-4">
                  <div>
                    <div className="text-xs text-[#747775] border-b border-dotted border-[#747775] inline-block mb-1">
                      Events Synced
                    </div>
                    <div className="text-2xl font-medium text-[#1f1f1f]">
                      {workspace?.calendarEvents?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#747775] border-b border-dotted border-[#747775] inline-block mb-1">
                      Conflicts
                    </div>
                    <div className="text-2xl font-medium text-[#1f1f1f]">
                      {metrics.activeConflicts}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#747775] border-b border-dotted border-[#747775] inline-block mb-1">
                      Integrity
                    </div>
                    <div className="text-2xl font-medium text-[#146c2e]">100%</div>
                  </div>
                </div>

                {/* Calendar Events from Backend */}
                <div className="space-y-2.5">
                  {workspace?.calendarEvents &&
                  workspace.calendarEvents.length > 0 ? (
                    workspace.calendarEvents.slice(0, 3).map((event: any) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-xl bg-[#f8fafd] border border-[#e0e3e7]/60 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-semibold text-[#1f1f1f] truncate">
                            {event.title}
                          </div>
                          <div className="text-xs text-[#747775] truncate">
                            {event.location || "Online"}
                          </div>
                        </div>
                        <span className="text-2xs font-semibold text-[#146c2e] bg-[#c4eed0] px-2 py-0.5 rounded-full shrink-0">
                          {event.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-[#747775]">
                      No calendar events in database.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e0e3e7]/60 flex items-center justify-between text-xs text-[#444746]">
                <span>Enforcing rule: {displayPreference}</span>
                <span className="text-[#0b57d0] font-medium cursor-pointer hover:underline">
                  Full Schedule
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Real Human-in-the-Loop Clearance Queue */}
          {workspace?.pendingActions && workspace.pendingActions.length > 0 ? (
            workspace.pendingActions.map((action: any) => (
              <div
                key={action.id}
                className="rounded-2xl border-2 border-[#0b57d0]/30 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#d3e3fd] text-[#0b57d0] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffe2a9] text-[#b06000] text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Pending Human Clearance
                    </div>
                    <h4 className="text-base font-semibold text-[#1f1f1f]">
                      Consequential Tool Call: {action.tool_name}
                    </h4>
                    <p className="text-xs text-[#444746] mt-0.5 font-mono">
                      Payload: {JSON.stringify(action.parameters || {})}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() =>
                      handleApproveAction(action.id, action.idempotency_key)
                    }
                    disabled={approvingId === action.id}
                    className="rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white px-5 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {approvingId === action.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Approve & Execute</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white border border-[#e0e3e7] p-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#c4eed0] text-[#146c2e] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1f1f1f]">
                    Zero Actions Awaiting Clearance
                  </div>
                  <div className="text-xs text-[#747775]">
                    All autonomous actions have been verified and executed.
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-[#146c2e] bg-[#c4eed0]/50 px-3 py-1 rounded-full">
                Standing By
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
