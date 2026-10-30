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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Users,
  X,
  Sparkles,
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
  events: initialEvents,
  meetingsTodayCount,
  thisWeekHours,
  conflictsCount,
  userEmail,
  onRefresh,
  isRefreshing = false,
  onResolveConflict,
}) => {
  const [events, setEvents] = useState<WorkspaceCalendarEvent[]>(initialEvents);
  const [activeTab, setActiveTab] = useState<"interactive" | "embed">("interactive");
  const [calendarView, setCalendarView] = useState<"day" | "week" | "agenda">("day");
  const [selectedEvent, setSelectedEvent] = useState<WorkspaceCalendarEvent | null>(
    initialEvents.length > 0 ? initialEvents[0] : null
  );
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("3:00 PM");
  const [newEventEndTime, setNewEventEndTime] = useState("4:00 PM");
  const [newEventLocation, setNewEventLocation] = useState("Google Meet");

  // Keep state updated when initialEvents prop changes
  React.useEffect(() => {
    setEvents(initialEvents);
    if (!selectedEvent && initialEvents.length > 0) {
      setSelectedEvent(initialEvents[0]);
    }
  }, [initialEvents]);

  // Hourly schedule range for Day/Week time-grid (8:00 AM to 8:00 PM)
  const hours = [
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
  ];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEvt: WorkspaceCalendarEvent = {
      id: `evt_user_${Date.now()}`,
      title: newEventTitle.trim(),
      description: "Scheduled via PACT Executive Calendar",
      startTime: `Today, ${newEventStartTime}`,
      endTime: `Today, ${newEventEndTime}`,
      location: newEventLocation,
      status: "confirmed",
      conflictDetected: false,
      isToday: true,
      hours: 1,
    };

    setEvents((prev) => [newEvt, ...prev]);
    setSelectedEvent(newEvt);
    setIsCreatingEvent(false);
    setNewEventTitle("");
  };

  const handleLaunchPopout = () => {
    if (typeof window !== "undefined") {
      window.open(
        "https://calendar.google.com/calendar/u/0/r",
        "GoogleCalendarApp",
        "width=1200,height=850,menubar=no,toolbar=no,location=no,status=no"
      );
    }
  };

  const calendarEmbedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
    userEmail
  )}&ctz=Asia%2FKolkata`;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1c22] text-[#1f1f1f] dark:text-[#e2e2e6] overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-12 border-b border-[#e0e3e7] dark:border-[#34373d] px-4 flex items-center justify-between gap-3 bg-[#f8fafd] dark:bg-[#1f2229] shrink-0">
        <div className="flex items-center gap-2">
          {/* Main Mode Toggle: Interactive Real Calendar vs Web Embed */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-[#16181d] border border-[#e0e3e7] dark:border-[#34373d]">
            <button
              onClick={() => setActiveTab("interactive")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "interactive"
                  ? "bg-[#0b57d0] text-white shadow-2xs"
                  : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
            >
              Interactive Calendar
            </button>
            <button
              onClick={() => setActiveTab("embed")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "embed"
                  ? "bg-[#0b57d0] text-white shadow-2xs"
                  : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
            >
              Google Calendar Web
            </button>
          </div>

          {activeTab === "interactive" && (
            <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-[#e0e3e7]/50 dark:bg-[#282a2f] text-2xs font-semibold ml-2">
              <button
                onClick={() => setCalendarView("day")}
                className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                  calendarView === "day"
                    ? "bg-white dark:bg-[#1d1f24] text-[#0b57d0] dark:text-[#a8c7fa] shadow-2xs"
                    : "text-[#747775] dark:text-[#8e9099]"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setCalendarView("agenda")}
                className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                  calendarView === "agenda"
                    ? "bg-white dark:bg-[#1d1f24] text-[#0b57d0] dark:text-[#a8c7fa] shadow-2xs"
                    : "text-[#747775] dark:text-[#8e9099]"
                }`}
              >
                Schedule
              </button>
            </div>
          )}

          <div className="hidden md:flex items-center gap-2 text-2xs text-[#747775] dark:text-[#8e9099] ml-2">
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
          <button
            onClick={() => setIsCreatingEvent(true)}
            className="px-3 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
              title="Refresh Google Calendar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          <button
            onClick={handleLaunchPopout}
            className="p-2 rounded-xl text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
            title="Open in Popout Desktop Window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === "embed" ? (
        /* View 1: Direct Google Calendar Web Embed */
        <div className="flex-1 relative bg-white dark:bg-[#1a1c22]">
          <iframe
            src={calendarEmbedUrl}
            title="Google Calendar"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      ) : (
        /* View 2: Interactive Real Calendar Application */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Mini Sidebar: Mini Month Calendar & Categories */}
          <div className="w-56 border-r border-[#e0e3e7] dark:border-[#34373d] p-3 hidden md:flex flex-col justify-between bg-[#f8fafd]/50 dark:bg-[#16181d]/50 shrink-0 select-none">
            <div>
              {/* Mini Month Header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
                  October 2026
                </span>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded hover:bg-[#e0e3e7] dark:hover:bg-[#282a2f] text-[#747775]">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button className="p-1 rounded hover:bg-[#e0e3e7] dark:hover:bg-[#282a2f] text-[#747775]">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Mini Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-3xs font-medium text-[#747775] dark:text-[#8e9099] mb-1">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-3xs font-semibold">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <button
                    key={d}
                    className={`py-1 rounded-full transition-colors cursor-pointer ${
                      d === 31
                        ? "bg-[#0b57d0] text-white font-bold"
                        : "text-[#1f1f1f] dark:text-[#e2e2e6] hover:bg-[#e0e3e7] dark:hover:bg-[#282a2f]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* My Calendars Filter */}
              <div className="mt-6 pt-4 border-t border-[#e0e3e7] dark:border-[#34373d]">
                <div className="text-3xs font-bold uppercase tracking-wider text-[#747775] dark:text-[#8e9099] mb-2 px-1">
                  My Calendars
                </div>
                <div className="space-y-1.5 text-xs font-medium text-[#444746] dark:text-[#c4c6cf]">
                  <label className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f]">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded accent-[#0b57d0]"
                    />
                    <span className="truncate">{userEmail}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f]">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded accent-[#1e8e3e]"
                    />
                    <span>Focus Blocks</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f]">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded accent-[#f9ab00]"
                    />
                    <span>Reminders &amp; Tasks</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#1d1f24] border border-[#e0e3e7] dark:border-[#34373d] text-3xs">
              <div className="flex items-center gap-1.5 font-bold text-[#1f1f1f] dark:text-white mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1e8e3e]" />
                <span>Protected Focus Rule</span>
              </div>
              <p className="text-[#747775] dark:text-[#8e9099]">
                Deep work blocks protected between 1:00 PM - 3:00 PM.
              </p>
            </div>
          </div>

          {/* Main Grid: Hourly Schedule View or Agenda View */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {calendarView === "day" ? (
              /* Hourly Day Grid */
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e0e3e7] dark:border-[#34373d]">
                  <div>
                    <h2 className="text-base font-bold text-[#1f1f1f] dark:text-white">
                      Today&apos;s Schedule
                    </h2>
                    <p className="text-xs text-[#747775] dark:text-[#8e9099]">
                      Saturday, October 31, 2026 (IST Timezone)
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f0f4f9] dark:bg-[#282a2f] text-[#0b57d0] dark:text-[#a8c7fa] border border-[#e0e3e7] dark:border-[#34373d]">
                    {events.length} Events Scheduled
                  </span>
                </div>

                {/* Hourly Time Rows with Events */}
                <div className="space-y-2 pt-2">
                  {hours.map((hour) => {
                    const matchedEvents = events.filter((ev) =>
                      ev.startTime.toLowerCase().includes(hour.split(":")[0].toLowerCase())
                    );

                    return (
                      <div
                        key={hour}
                        className="flex items-start gap-4 min-h-[56px] group/slot border-b border-[#e0e3e7]/40 dark:border-[#34373d]/40 pb-2"
                      >
                        <div className="w-16 text-right text-xs font-mono font-medium text-[#747775] dark:text-[#8e9099] shrink-0 pt-0.5">
                          {hour}
                        </div>

                        <div className="flex-1 min-w-0">
                          {matchedEvents.length > 0 ? (
                            matchedEvents.map((evt) => (
                              <div
                                key={evt.id}
                                onClick={() => setSelectedEvent(evt)}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs mb-2 ${
                                  evt.conflictDetected
                                    ? "bg-[#fff8f7] dark:bg-[#3b1212]/30 border-[#ba1a1a]/40 text-[#ba1a1a] dark:text-[#ff897d]"
                                    : "bg-[#e8f0fe] dark:bg-[#004a77]/30 border-[#0b57d0]/30 text-[#0b57d0] dark:text-[#d3e3fd]"
                                } hover:scale-[1.01]`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-bold text-xs truncate">
                                    {evt.title}
                                  </div>
                                  {evt.conflictDetected && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-[#ba1a1a] text-white text-3xs font-bold flex items-center gap-1">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      Conflict
                                    </span>
                                  )}
                                </div>
                                <div className="text-2xs opacity-80 mt-1 flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {evt.startTime} - {evt.endTime}
                                  </span>
                                  {evt.location && (
                                    <span className="flex items-center gap-1 truncate">
                                      <MapPin className="w-3 h-3" />
                                      {evt.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div
                              onClick={() => {
                                setNewEventStartTime(hour);
                                setIsCreatingEvent(true);
                              }}
                              className="h-8 rounded-lg border border-dashed border-transparent hover:border-[#0b57d0]/30 dark:hover:border-[#a8c7fa]/30 hover:bg-[#f0f4f9]/50 dark:hover:bg-[#282a2f]/50 flex items-center px-3 text-3xs text-[#747775] dark:text-[#8e9099] opacity-0 group-hover/slot:opacity-100 transition-all cursor-pointer"
                            >
                              + Click to schedule event at {hour}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Schedule / Agenda View */
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h2 className="text-sm font-bold text-[#1f1f1f] dark:text-white pb-2 border-b border-[#e0e3e7] dark:border-[#34373d]">
                  Upcoming Agenda
                </h2>
                <div className="space-y-2">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedEvent?.id === evt.id
                          ? "border-[#0b57d0] dark:border-[#a8c7fa] bg-[#e8f0fe]/50 dark:bg-[#004a77]/30"
                          : "border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f8fafd] dark:hover:bg-[#282a2f]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
                          {evt.title}
                        </span>
                        {evt.conflictDetected && (
                          <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#410002] dark:bg-[#93000a] dark:text-[#ffdad6]">
                            Overlap Alert
                          </span>
                        )}
                      </div>
                      <div className="text-2xs text-[#747775] dark:text-[#8e9099] mt-1 flex items-center gap-3">
                        <span>
                          {evt.startTime} - {evt.endTime}
                        </span>
                        <span>•</span>
                        <span>{evt.hours} hour(s)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right Pane: Selected Event Details & Google Meet Action */}
            {selectedEvent && (
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#e0e3e7] dark:border-[#34373d] p-4 bg-[#f8fafd] dark:bg-[#1d1f24] flex flex-col justify-between shrink-0">
                <div className="space-y-4">
                  <div>
                    <span className="text-3xs font-bold uppercase tracking-wider text-[#747775] dark:text-[#8e9099]">
                      Event Details
                    </span>
                    <h3 className="text-base font-extrabold text-[#1f1f1f] dark:text-white mt-1 leading-snug">
                      {selectedEvent.title}
                    </h3>
                  </div>

                  {selectedEvent.conflictDetected && (
                    <div className="p-3 rounded-xl bg-[#fff8f7] dark:bg-[#3b1212]/40 border border-[#ba1a1a]/30 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[#ba1a1a] dark:text-[#ff897d] mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Schedule Conflict Detected</span>
                      </div>
                      <p className="text-2xs text-[#444746] dark:text-[#c4c6cf]">
                        Overlaps with executive deep focus block rule.
                      </p>
                      {onResolveConflict && (
                        <button
                          onClick={() => onResolveConflict(selectedEvent)}
                          className="mt-2 w-full py-1.5 px-2 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white text-2xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Resolve with Chief of Staff</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-2.5 text-xs text-[#444746] dark:text-[#c4c6cf]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa] shrink-0" />
                      <span>
                        {selectedEvent.startTime} – {selectedEvent.endTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa] shrink-0" />
                      <span className="truncate">
                        {selectedEvent.location || "Google Meet Video Conference"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa] shrink-0" />
                      <span>Organized by {userEmail}</span>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="p-3 rounded-xl bg-white dark:bg-[#16181d] border border-[#e0e3e7] dark:border-[#34373d] text-xs text-[#444746] dark:text-[#c4c6cf]">
                    <div className="font-semibold text-2xs text-[#747775] dark:text-[#8e9099] mb-1">
                      Notes / Agenda
                    </div>
                    {selectedEvent.description || "Review executive roadmap deliverables and team checkpoints."}
                  </div>
                </div>

                {/* Prominent Google Meet Join Button */}
                <div className="pt-4 border-t border-[#e0e3e7] dark:border-[#34373d] space-y-2">
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join with Google Meet</span>
                  </a>

                  <button
                    onClick={handleLaunchPopout}
                    className="w-full py-2 px-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in calendar.google.com</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Event */}
      {isCreatingEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1d1f24] rounded-2xl border border-[#e0e3e7] dark:border-[#34373d] p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e7] dark:border-[#34373d] mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
                <h4 className="text-sm font-bold text-[#1f1f1f] dark:text-white">
                  Schedule New Event
                </h4>
              </div>
              <button
                onClick={() => setIsCreatingEvent(false)}
                className="p-1 rounded-lg text-[#747775] hover:bg-[#e0e3e7] dark:hover:bg-[#282a2f] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-2xs font-bold text-[#747775] dark:text-[#8e9099] block mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g., Executive Strategy Review"
                  className="w-full px-3 py-2 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-2xs font-bold text-[#747775] dark:text-[#8e9099] block mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                    placeholder="3:00 PM"
                    className="w-full px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-2xs font-bold text-[#747775] dark:text-[#8e9099] block mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={newEventEndTime}
                    onChange={(e) => setNewEventEndTime(e.target.value)}
                    placeholder="4:00 PM"
                    className="w-full px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-2xs font-bold text-[#747775] dark:text-[#8e9099] block mb-1">
                  Location / Conference
                </label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="Google Meet"
                  className="w-full px-3 py-2 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e0e3e7] dark:border-[#34373d]">
                <button
                  type="button"
                  onClick={() => setIsCreatingEvent(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] text-xs font-semibold text-[#747775] dark:text-[#8e9099] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
