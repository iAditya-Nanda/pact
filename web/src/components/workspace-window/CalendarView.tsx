"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Plus,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { WorkspaceCalendarEvent } from "@/lib/workspace-service";

interface CalendarViewProps {
  events: WorkspaceCalendarEvent[];
  meetingsTodayCount: number;
  thisWeekHours: string;
  conflictsCount: number;
  userEmail: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onResolveConflict?: (event: WorkspaceCalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  meetingsTodayCount,
  thisWeekHours,
  conflictsCount,
  userEmail,
  onRefresh,
  isRefreshing = false,
  onResolveConflict,
}) => {
  const [viewMode, setViewMode] = useState<"embed" | "agenda">("embed");
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Encode calendar embed URL
  const calendarEmbedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
    userEmail
  )}&ctz=Asia%2FKolkata`;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1c22] text-[#1f1f1f] dark:text-[#e2e2e6] overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-12 border-b border-[#e0e3e7] dark:border-[#34373d] px-4 flex items-center justify-between gap-3 bg-[#f8fafd] dark:bg-[#1f2229] shrink-0">
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-[#16181d] border border-[#e0e3e7] dark:border-[#34373d]">
            <button
              onClick={() => setViewMode("embed")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "embed"
                  ? "bg-[#0b57d0] text-white shadow-2xs"
                  : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
            >
              Google Calendar Web
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "agenda"
                  ? "bg-[#0b57d0] text-white shadow-2xs"
                  : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
            >
              Agenda &amp; Conflicts ({events.length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-2xs text-[#747775] dark:text-[#8e9099] ml-2">
            <span className="font-semibold text-[#1f1f1f] dark:text-white">
              {meetingsTodayCount} today
            </span>
            <span>•</span>
            <span>{thisWeekHours} this week</span>
            {conflictsCount > 0 && (
              <>
                <span>•</span>
                <span className="text-[#ba1a1a] dark:text-[#ff897d] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {conflictsCount} conflict detected
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
              title="Refresh Schedule"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
            title="Open in calendar.google.com"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Calendar Content Area */}
      <div className="flex-1 min-h-0 relative bg-[#f8fafd] dark:bg-[#16181d]">
        {viewMode === "embed" ? (
          <div className="w-full h-full relative">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#16181d] z-10 text-xs text-[#747775] dark:text-[#8e9099] gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#0b57d0]" />
                <span>Loading Google Calendar for {userEmail}...</span>
              </div>
            )}
            <iframe
              src={calendarEmbedUrl}
              onLoad={() => setIframeLoaded(true)}
              className="w-full h-full border-none"
              title="Google Calendar Embed"
            />
          </div>
        ) : (
          <div className="p-4 lg:p-6 overflow-y-auto h-full max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e0e3e7] dark:border-[#34373d]">
              <div>
                <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white">
                  Today's Synchronized Events
                </h3>
                <p className="text-2xs text-[#747775] dark:text-[#8e9099]">
                  Live schedule and automated focus block protection
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#e6f4ea] dark:bg-[#0f5223] text-[#137333] dark:text-[#81c995] text-2xs font-bold border border-[#ceead6] dark:border-[#137333] flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Conflict Guard Active</span>
                </span>
              </div>
            </div>

            {/* Event Cards */}
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#1f2229] border border-[#e0e3e7] dark:border-[#34373d] text-xs text-[#747775] dark:text-[#8e9099]">
                  No meetings scheduled for today. Calendar is clear.
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-2xl border transition-all text-left bg-white dark:bg-[#1f2229] ${
                      event.conflictDetected
                        ? "border-[#ba1a1a]/60 dark:border-[#ff897d]/60 shadow-xs"
                        : "border-[#e0e3e7] dark:border-[#34373d]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#1f1f1f] dark:text-white">
                            {event.title}
                          </h4>
                          {event.conflictDetected && (
                            <span className="text-3xs px-2 py-0.5 rounded-full bg-[#ffdad6] dark:bg-[#93000a] text-[#ba1a1a] dark:text-[#ffb4ab] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Conflict Detected
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-[#747775] dark:text-[#8e9099] mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {event.location.includes("Meet") || event.location.includes("Online") ? (
                          <a
                            href="https://meet.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Meet</span>
                          </a>
                        ) : null}

                        {event.conflictDetected && onResolveConflict && (
                          <button
                            onClick={() => onResolveConflict(event)}
                            className="px-3 py-1.5 rounded-xl bg-[#e8f0fe] dark:bg-[#004a77] hover:bg-[#d3e3fd] text-[#0b57d0] dark:text-[#a8c7fa] text-xs font-semibold transition-all cursor-pointer"
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#747775] dark:text-[#8e9099] mt-3 pt-2.5 border-t border-[#e0e3e7]/60 dark:border-[#34373d]/60">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {event.startTime} - {event.endTime} ({event.hours}h)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
