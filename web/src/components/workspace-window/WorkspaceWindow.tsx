"use client";

import React from "react";
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import { GmailView } from "./GmailView";
import { CalendarView } from "./CalendarView";
import { TasksView } from "./TasksView";
import { WorkspaceData, WorkspaceEmail, WorkspaceCalendarEvent } from "@/lib/workspace-service";

interface WorkspaceWindowProps {
  activeTab: "gmail" | "calendar" | "tasks";
  onChangeTab: (tab: "gmail" | "calendar" | "tasks") => void;
  onClose: () => void;
  onMinimize: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  workspace: WorkspaceData;
  userEmail: string;
  onRefreshWorkspace: () => void;
  isRefreshing?: boolean;
  onAskAiAboutEmail?: (email: WorkspaceEmail) => void;
  onResolveCalendarConflict?: (event: WorkspaceCalendarEvent) => void;
  onAddTask?: (task: { title: string; description?: string; dueDate?: string }) => void;
}

export const WorkspaceWindow: React.FC<WorkspaceWindowProps> = ({
  activeTab,
  onChangeTab,
  onClose,
  onMinimize,
  isMaximized,
  onToggleMaximize,
  workspace,
  userEmail,
  onRefreshWorkspace,
  isRefreshing = false,
  onAskAiAboutEmail,
  onResolveCalendarConflict,
  onAddTask,
}) => {
  return (
    <div className="h-full flex flex-col rounded-2xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] shadow-2xl overflow-hidden text-[#1f1f1f] dark:text-[#e2e2e6] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
      {/* macOS Window Title Bar */}
      <div className="h-11 px-4 bg-[#f0f4f9] dark:bg-[#16181d] border-b border-[#e0e3e7] dark:border-[#34373d] flex items-center justify-between shrink-0 select-none">
        {/* Left: macOS Traffic Lights */}
        <div className="flex items-center gap-2 group/lights">
          {/* Red: Close */}
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:brightness-90 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
            title="Close Window (Return to Dashboard)"
          >
            <X className="w-2 h-2 text-[#4a0002] opacity-0 group-hover/lights:opacity-100 transition-opacity" />
          </button>

          {/* Yellow: Minimize */}
          <button
            onClick={onMinimize}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:brightness-90 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
            title="Minimize Window"
          >
            <Minus className="w-2 h-2 text-[#5c3a00] opacity-0 group-hover/lights:opacity-100 transition-opacity" />
          </button>

          {/* Green: Maximize / Split */}
          <button
            onClick={onToggleMaximize}
            className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:brightness-90 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
            title={isMaximized ? "Restore Split View" : "Full Screen Window"}
          >
            {isMaximized ? (
              <Minimize2 className="w-2 h-2 text-[#004f11] opacity-0 group-hover/lights:opacity-100 transition-opacity" />
            ) : (
              <Maximize2 className="w-2 h-2 text-[#004f11] opacity-0 group-hover/lights:opacity-100 transition-opacity" />
            )}
          </button>
        </div>

        {/* Center: macOS Workspace App Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-white/70 dark:bg-[#1f2229] border border-[#e0e3e7]/80 dark:border-[#34373d]">
          {/* Gmail Tab */}
          <button
            onClick={() => onChangeTab("gmail")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer ${
              activeTab === "gmail"
                ? "bg-[#0b57d0] text-white shadow-2xs font-bold"
                : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
            }`}
          >
            <img src="/icons/gmail.png" alt="Gmail" className="w-3.5 h-3.5 object-contain" />
            <span>Gmail</span>
            {workspace.metrics.unreadEmails > 0 && (
              <span
                className={`text-3xs font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === "gmail"
                    ? "bg-white text-[#0b57d0]"
                    : "bg-[#EA4335] text-white"
                }`}
              >
                {workspace.metrics.unreadEmails}
              </span>
            )}
          </button>

          {/* Calendar Tab */}
          <button
            onClick={() => onChangeTab("calendar")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer ${
              activeTab === "calendar"
                ? "bg-[#0b57d0] text-white shadow-2xs font-bold"
                : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
            }`}
          >
            <img src="/icons/calendar.png" alt="Calendar" className="w-3.5 h-3.5 object-contain" />
            <span>Calendar</span>
            {workspace.metrics.meetingsToday > 0 && (
              <span
                className={`text-3xs font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === "calendar"
                    ? "bg-white text-[#0b57d0]"
                    : "bg-[#4285F4] text-white"
                }`}
              >
                {workspace.metrics.meetingsToday}
              </span>
            )}
          </button>

          {/* Tasks Tab */}
          <button
            onClick={() => onChangeTab("tasks")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer ${
              activeTab === "tasks"
                ? "bg-[#0b57d0] text-white shadow-2xs font-bold"
                : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
            }`}
          >
            <img src="/icons/tasks.svg" alt="Tasks" className="w-3.5 h-3.5 object-contain" />
            <span>Tasks</span>
            {workspace.metrics.activeTasks > 0 && (
              <span
                className={`text-3xs font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === "tasks"
                    ? "bg-white text-[#0b57d0]"
                    : "bg-[#34A853] text-white"
                }`}
              >
                {workspace.metrics.activeTasks}
              </span>
            )}
          </button>
        </div>

        {/* Right: User / Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-2xs text-[#747775] dark:text-[#8e9099]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1e8e3e]" />
          <span className="truncate max-w-[180px]">{userEmail}</span>
        </div>
      </div>

      {/* Main Window Tab Content with Smooth Tab Switch Transitions */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {activeTab === "gmail" && (
          <div key="gmail" className="h-full w-full animate-tab-switch">
            <GmailView
              emails={workspace.emails || []}
              unreadCount={workspace.metrics.unreadEmails}
              userEmail={userEmail}
              onRefresh={onRefreshWorkspace}
              isRefreshing={isRefreshing}
              onAskAiAboutEmail={onAskAiAboutEmail}
            />
          </div>
        )}

        {activeTab === "calendar" && (
          <div key="calendar" className="h-full w-full animate-tab-switch">
            <CalendarView
              events={workspace.calendarEvents || []}
              meetingsTodayCount={workspace.metrics.meetingsToday}
              thisWeekHours={workspace.metrics.thisWeekHours}
              conflictsCount={workspace.metrics.conflicts}
              userEmail={userEmail}
              onRefresh={onRefreshWorkspace}
              isRefreshing={isRefreshing}
              onResolveConflict={onResolveCalendarConflict}
            />
          </div>
        )}

        {activeTab === "tasks" && (
          <div key="tasks" className="h-full w-full animate-tab-switch">
            <TasksView
              tasks={workspace.tasks || []}
              activeTasksCount={workspace.metrics.activeTasks}
              dueTodayCount={workspace.metrics.dueToday}
              overdueCount={workspace.metrics.overdue}
              userEmail={userEmail}
              onRefresh={onRefreshWorkspace}
              isRefreshing={isRefreshing}
              onAddTask={onAddTask}
            />
          </div>
        )}
      </div>
    </div>
  );
};
