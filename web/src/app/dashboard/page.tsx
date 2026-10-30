"use client";

import React, { useState } from "react";
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
  ChevronRight,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const displayName = user?.fullName || "Aditya Nanda";
  const displayRole = user?.role || "Lead Architect";
  const displayEmail = user?.email || "aditya@example.com";
  const displayPreference =
    user?.schedulePreference || "Avoid meetings before 10:00 AM";

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "inbox", label: "Communications", icon: Mail },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "agent", label: "Agent Copilot", icon: Bot },
    { id: "preferences", label: "Preferences", icon: Sliders },
    { id: "audit", label: "Audit Log", icon: History },
  ];

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
              <span className="hidden sm:inline">Notifications</span>
            </button>

            <button className="rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>New Action</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Greeting Banner (Google Play Console Style) */}
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
                <span>Local C++ Agent Active</span>
              </div>
            </div>
          </div>

          {/* 3 KPI Status Cards (Google Play Console Top Tier) */}
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
                  <div className="text-xs text-[#747775]">0 conflicts detected</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#146c2e] bg-[#c4eed0]/60 px-2.5 py-0.5 rounded-full">
                Protected
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
                  <div className="text-xs text-[#747775]">1 approval paused</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#b06000] bg-[#ffe2a9] px-2.5 py-0.5 rounded-full">
                Pending
              </span>
            </div>

            <div className="rounded-2xl bg-white border border-[#e0e3e7] p-5 flex items-center justify-between shadow-xs hover:border-[#0b57d0]/40 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#d3e3fd] text-[#0b57d0] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1f1f1f]">
                    Approaching Deadlines
                  </div>
                  <div className="text-xs text-[#747775]">2 tasks due today</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#0b57d0] bg-[#d3e3fd] px-2.5 py-0.5 rounded-full">
                Tracked
              </span>
            </div>
          </div>

          {/* 2-Column Content Grid (Sample 3 Detail Cards) */}
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
                    <div className="text-2xl font-medium text-[#1f1f1f]">3</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#747775] border-b border-dotted border-[#747775] inline-block mb-1">
                      Drafts Ready
                    </div>
                    <div className="text-2xl font-medium text-[#1f1f1f]">1</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#747775] border-b border-dotted border-[#747775] inline-block mb-1">
                      Priority Senders
                    </div>
                    <div className="text-2xl font-medium text-[#146c2e]">100%</div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[#f8fafd] border border-[#e0e3e7]/60 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#1f1f1f] truncate">
                        Sarah Chen (TechCorp)
                      </div>
                      <div className="text-xs text-[#444746] truncate">
                        Reschedule project sync tomorrow 9:00 AM
                      </div>
                    </div>
                    <span className="text-2xs font-semibold text-[#b06000] bg-[#ffe2a9] px-2 py-0.5 rounded-full shrink-0">
                      Action Queued
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e0e3e7]/60 flex items-center justify-between text-xs text-[#444746]">
                <span>Sync source: Google Workspace API</span>
                <span className="text-[#0b57d0] font-medium cursor-pointer hover:underline">
                  Open Inbox
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
                      Today&apos;s Events
                    </div>
                    <div className="text-2xl font-medium text-[#1f1f1f]">2</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#747775] border-b border-dotted border-[#747775] inline-block mb-1">
                      Focus Time
                    </div>
                    <div className="text-2xl font-medium text-[#1f1f1f]">4.5h</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#747775] border-b border-dotted border-[#747775] inline-block mb-1">
                      Conflict Free
                    </div>
                    <div className="text-2xl font-medium text-[#146c2e]">100%</div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[#f8fafd] border border-[#e0e3e7]/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#1f1f1f]">
                        Architecture & Core Engine Sync
                      </div>
                      <div className="text-xs text-[#747775]">
                        11:00 AM – 12:00 PM • Google Meet
                      </div>
                    </div>
                    <span className="text-2xs font-semibold text-[#146c2e] bg-[#c4eed0] px-2 py-0.5 rounded-full">
                      Confirmed
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e0e3e7]/60 flex items-center justify-between text-xs text-[#444746]">
                <span>Working boundary: 10:00 AM – 7:00 PM</span>
                <span className="text-[#0b57d0] font-medium cursor-pointer hover:underline">
                  View Full Calendar
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Human-in-the-Loop Clearance Banner */}
          <div className="rounded-2xl border-2 border-[#0b57d0]/30 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#d3e3fd] text-[#0b57d0] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffe2a9] text-[#b06000] text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Pending Human Clearance
                </div>
                <h4 className="text-base font-semibold text-[#1f1f1f]">
                  Proposed Reschedule: Sarah Chen Sync to Tomorrow 10:30 AM
                </h4>
                <p className="text-xs text-[#444746] mt-0.5">
                  Sarah requested 9:00 AM, which conflicts with your &ldquo;No meetings
                  before 10:00 AM&rdquo; rule. Agent has drafted an email offering
                  10:30 AM and placed a tentative hold.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button className="rounded-full border border-[#e0e3e7] text-[#444746] hover:bg-[#f0f4f9] px-4 py-2 text-xs font-medium transition-colors cursor-pointer">
                Modify Slot
              </button>
              <button
                onClick={() => alert("Action Verified & Approved! Email dispatched.")}
                className="rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white px-5 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Approve Action
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
