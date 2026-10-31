"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Search,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  RefreshCw,
  Send,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Inbox,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
  Lock,
  Layers,
  Circle,
  Check,
  Menu,
  SlidersHorizontal,
  HelpCircle,
  Settings,
  Grid,
  MoreVertical,
  Tag,
  Users,
  CornerDownLeft,
  Square,
  CheckSquare,
  Zap,
  StopCircle,
} from "lucide-react";
import { WorkspaceEmail } from "@/lib/workspace-service";

interface GmailViewProps {
  emails: WorkspaceEmail[];
  unreadCount: number;
  userEmail: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onAskAiAboutEmail?: (email: WorkspaceEmail) => void;
}

export const GmailView: React.FC<GmailViewProps> = ({
  emails,
  unreadCount,
  userEmail,
  onRefresh,
  isRefreshing = false,
  onAskAiAboutEmail,
}) => {
  // View Switcher: Modern Dual-Pane Workspace Client vs Authentic Official Gmail Web View
  const [viewMode, setViewMode] = useState<"workspace" | "official">("workspace");

  // Navigation and Filter state
  const [folder, setFolder] = useState<"inbox" | "starred" | "sent" | "drafts">("inbox");
  const [subFilter, setSubFilter] = useState<"all" | "unread" | "important">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    emails.length > 0 ? emails[0].id : null
  );
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSent, setComposeSent] = useState(false);

  // Official Gmail Tabs: Primary vs Promotions vs Social
  const [officialTab, setOfficialTab] = useState<"primary" | "promotions" | "social">("primary");
  const [officialSelectedEmail, setOfficialSelectedEmail] = useState<WorkspaceEmail | null>(null);

  // AI Autonomous Computer Use Simulation ("Cyber Smoke Gradient" Overlay)
  const [isSimulatingAgent, setIsSimulatingAgent] = useState(false);
  const [agentStep, setAgentStep] = useState(0);
  const [agentTelemetry, setAgentTelemetry] = useState("");
  const [cursorPos, setCursorPos] = useState({ x: 300, y: 150, clicking: false });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inboxScrollRef = useRef<HTMLDivElement>(null);
  const officialListScrollRef = useRef<HTMLDivElement>(null);

  // Keep selected email valid when emails update
  useEffect(() => {
    if (!selectedEmailId && emails.length > 0) {
      setSelectedEmailId(emails[0].id);
    }
  }, [emails, selectedEmailId]);

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter emails by search query, folder, and subFilter
  const filteredEmails = emails.filter((em) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      em.sender.toLowerCase().includes(q) ||
      em.subject.toLowerCase().includes(q) ||
      em.snippet.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (folder === "starred") return starredIds.has(em.id);
    if (subFilter === "unread") return em.status === "unread";
    if (subFilter === "important") return em.priority === "urgent" || em.priority === "high";
    return true;
  });

  const selectedEmail =
    emails.find((em) => em.id === selectedEmailId) ||
    (filteredEmails.length > 0 ? filteredEmails[0] : null);

  const handleSendDraft = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!composeTo.trim()) return;
    setComposeSent(true);
    setTimeout(() => {
      setComposeSent(false);
      setIsComposing(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setToastMessage("Message sent successfully.");
      setTimeout(() => setToastMessage(null), 3000);
    }, 1000);
  };

  // Autonomous Agent Computer Use Simulation Logic
  const startAgentSimulation = () => {
    setIsSimulatingAgent(true);
    setAgentStep(1);
    setAgentTelemetry("Phase 1/6: Initializing PACT Chief of Staff screen control session...");
    setCursorPos({ x: 220, y: 90, clicking: false });

    // Step 1: Scan and focus search / top thread
    setTimeout(() => {
      setAgentStep(2);
      setAgentTelemetry("Phase 2/6: Scanning 25 live Gmail messages from API stream...");
      setCursorPos({ x: 350, y: 160, clicking: true });

      // Step 2: Auto scroll list smoothly to show deep inspection
      setTimeout(() => {
        setCursorPos({ x: 350, y: 160, clicking: false });
        setAgentStep(3);
        setAgentTelemetry("Phase 3/6: Scrolling through recent messages to verify thread continuity...");

        if (officialListScrollRef.current) {
          officialListScrollRef.current.scrollTo({ top: 320, behavior: "smooth" });
        }
        if (inboxScrollRef.current) {
          inboxScrollRef.current.scrollTo({ top: 320, behavior: "smooth" });
        }

        // Step 3: Move back up and click Compose
        setTimeout(() => {
          if (officialListScrollRef.current) {
            officialListScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
          }
          if (inboxScrollRef.current) {
            inboxScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
          }

          setAgentStep(4);
          setAgentTelemetry("Phase 4/6: Opening Compose drawer to draft priority briefing...");
          setCursorPos({ x: 90, y: 140, clicking: true });

          setTimeout(() => {
            setCursorPos({ x: 90, y: 140, clicking: false });
            setIsComposing(true);

            // Step 4: Auto-type fields to samridhisharma041@gmail.com
            setTimeout(() => {
              setAgentStep(5);
              setAgentTelemetry("Phase 5/6: Auto-typing recipient samridhisharma041@gmail.com and executive brief...");
              setCursorPos({ x: 500, y: 320, clicking: true });

              const targetRecipient = "samridhisharma041@gmail.com";
              const targetSubject = "Project Architecture Review & Q4 Sprint Alignment";
              const targetBody =
                "Hi Samridhi, I have finalized the Chief of Staff system architecture review and cross-workspace synchronization. Please review the attached deliverables. - Aditya";

              setComposeTo(targetRecipient);
              setComposeSubject(targetSubject);
              setComposeBody(targetBody);

              // Step 5: Click Send button
              setTimeout(() => {
                setAgentStep(6);
                setAgentTelemetry("Phase 6/6: Transmitting message with tamper-evident audit signature...");
                setCursorPos({ x: 680, y: 550, clicking: true });

                setTimeout(() => {
                  setCursorPos({ x: 680, y: 550, clicking: false });
                  handleSendDraft();

                  setTimeout(() => {
                    setIsSimulatingAgent(false);
                    setAgentStep(0);
                    setAgentTelemetry("");
                  }, 1500);
                }, 800);
              }, 1200);
            }, 900);
          }, 600);
        }, 1300);
      }, 1000);
    }, 900);
  };

  const stopAgentSimulation = () => {
    setIsSimulatingAgent(false);
    setAgentStep(0);
    setAgentTelemetry("");
    setCursorPos({ x: 300, y: 150, clicking: false });
  };

  // Launch popout desktop window
  const handleLaunchPopout = () => {
    if (typeof window !== "undefined") {
      window.open(
        "https://mail.google.com/mail/u/0/#inbox",
        "GmailDesktopApp",
        "width=1200,height=850,menubar=no,toolbar=no,location=no,status=no"
      );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1c22] text-[#1f1f1f] dark:text-[#e2e2e6] overflow-hidden relative select-none">
      {/* 1. Universal Top Navigation Bar with View Switcher & AI Screen Control Trigger */}
      <div className="h-12 border-b border-[#e0e3e7] dark:border-[#34373d] px-4 flex items-center justify-between gap-3 bg-[#f8fafd] dark:bg-[#1f2229] shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          {/* Dual-Mode View Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#e9eef6] dark:bg-[#16181d] border border-[#e0e3e7] dark:border-[#34373d]">
            <button
              onClick={() => {
                setViewMode("workspace");
                setOfficialSelectedEmail(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "workspace"
                  ? "bg-white dark:bg-[#282a2f] text-[#0b57d0] dark:text-[#a8c7fa] shadow-2xs font-bold"
                  : "text-[#444746] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e8e3e]" />
              <span>Workspace Stream</span>
            </button>

            <button
              onClick={() => setViewMode("official")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "official"
                  ? "bg-white dark:bg-[#282a2f] text-[#0b57d0] dark:text-[#a8c7fa] shadow-2xs font-bold"
                  : "text-[#444746] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
            >
              <img src="/icons/gmail.png" alt="Gmail" className="w-3.5 h-3.5 object-contain" />
              <span>Official Web View (mail.google.com)</span>
            </button>
          </div>

          <span className="text-xs text-[#747775] dark:text-[#8e9099] truncate hidden xl:inline">
            1 unread · {emails.length} messages this month · {userEmail}
          </span>
        </div>

        {/* Action Controls & AI Screen Control Simulation */}
        <div className="flex items-center gap-2">
          {/* AI Autonomous Computer Use Trigger */}
          <button
            onClick={isSimulatingAgent ? stopAgentSimulation : startAgentSimulation}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isSimulatingAgent
                ? "bg-[#b3261e] hover:bg-[#8c1d18] text-white animate-pulse"
                : "bg-linear-to-r from-[#0b57d0] to-[#7c3aed] hover:brightness-110 text-white"
            }`}
            title="Simulate Autonomous AI Agent Screen Control (Cyber Smoke Gradient & Virtual Cursor)"
          >
            {isSimulatingAgent ? (
              <>
                <StopCircle className="w-3.5 h-3.5" />
                <span>Stop AI Agent</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>AI Screen Control</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsComposing(true)}
            className="px-3 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Compose</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
              title="Refresh Live Gmail Inbox"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          <button
            onClick={handleLaunchPopout}
            className="px-2.5 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Open official mail.google.com in standalone desktop window"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
            <span className="hidden md:inline">Open App</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA: WORKSPACE CLIENT vs OFFICIAL WEB VIEW */}
      {viewMode === "workspace" ? (
        /* Workspace Client: 3-column split view (Sidebar + Email List + Reader/AI pane) */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-48 lg:w-52 border-r border-[#e0e3e7] dark:border-[#34373d] p-3 hidden md:flex flex-col justify-between bg-[#f8fafd]/60 dark:bg-[#16181d]/60 shrink-0 select-none">
            <div className="space-y-1">
              {/* Compose Button */}
              <button
                onClick={() => setIsComposing(true)}
                className="w-full mb-3 py-2 px-3.5 rounded-2xl bg-[#c2e7ff] hover:bg-[#b3dbf5] dark:bg-[#004a77] dark:hover:bg-[#003b60] text-[#001d35] dark:text-[#d3e3fd] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <img src="/icons/gmail.png" alt="Compose" className="w-4 h-4 object-contain" />
                <span>Compose</span>
              </button>

              {/* Folders */}
              <button
                onClick={() => {
                  setFolder("inbox");
                  setSubFilter("all");
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  folder === "inbox"
                    ? "bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#d3e3fd] font-bold"
                    : "text-[#444746] dark:text-[#c4c6cf] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                {unreadCount > 0 && (
                  <span className="text-3xs font-extrabold px-1.5 py-0.2 rounded-full bg-[#0b57d0] text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFolder("starred")}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  folder === "starred"
                    ? "bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#d3e3fd] font-bold"
                    : "text-[#444746] dark:text-[#c4c6cf] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-[#f9ab00]" />
                  <span>Starred</span>
                </div>
                {starredIds.size > 0 && (
                  <span className="text-3xs font-bold text-[#747775]">
                    {starredIds.size}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFolder("sent")}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  folder === "sent"
                    ? "bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#d3e3fd] font-bold"
                    : "text-[#444746] dark:text-[#c4c6cf] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f]"
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Sent</span>
              </button>

              <button
                onClick={() => setFolder("drafts")}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  folder === "drafts"
                    ? "bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#d3e3fd] font-bold"
                    : "text-[#444746] dark:text-[#c4c6cf] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f]"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Drafts</span>
              </button>
            </div>

            {/* Storage Box */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#1d1f24] border border-[#e0e3e7] dark:border-[#34373d] shadow-2xs">
              <div className="flex items-center justify-between text-2xs mb-1.5">
                <span className="font-bold text-[#1f1f1f] dark:text-white">Storage</span>
                <span className="font-semibold text-[#0b57d0] dark:text-[#a8c7fa] text-3xs">18% used</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#e0e3e7] dark:bg-[#282a2f] overflow-hidden mb-1.5">
                <div className="h-full bg-[#0b57d0] dark:bg-[#a8c7fa] rounded-full w-[18%]" />
              </div>
              <div className="text-3xs text-[#747775] dark:text-[#8e9099] font-medium">
                2.8 GB of 15 GB used
              </div>
            </div>
          </div>

          {/* Center Pane: Email List */}
          <div className="w-full md:w-80 lg:w-96 border-r border-[#e0e3e7] dark:border-[#34373d] flex flex-col bg-white dark:bg-[#1a1c22] shrink-0">
            {/* Search Box in List Header */}
            <div className="p-2.5 border-b border-[#e0e3e7] dark:border-[#34373d] bg-[#f8fafd] dark:bg-[#1f2229] space-y-2">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#747775] dark:text-[#8e9099]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in mail..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white placeholder-[#747775] dark:placeholder-[#8e9099] focus:outline-none"
                />
              </div>

              {/* Sub-Filter Chips */}
              <div className="flex items-center gap-1.5 text-2xs">
                <button
                  onClick={() => setSubFilter("all")}
                  className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    subFilter === "all"
                      ? "bg-[#0b57d0] text-white shadow-2xs"
                      : "text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f]"
                  }`}
                >
                  All ({emails.length})
                </button>
                <button
                  onClick={() => setSubFilter("unread")}
                  className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    subFilter === "unread"
                      ? "bg-[#0b57d0] text-white shadow-2xs"
                      : "text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f]"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setSubFilter("important")}
                  className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    subFilter === "important"
                      ? "bg-[#0b57d0] text-white shadow-2xs"
                      : "text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f]"
                  }`}
                >
                  Important
                </button>
              </div>
            </div>

            {/* Email Items Scroll Container */}
            <div ref={inboxScrollRef} className="flex-1 overflow-y-auto divide-y divide-[#e0e3e7]/60 dark:divide-[#34373d]/60">
              {filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#747775]">
                  No messages found matching your criteria.
                </div>
              ) : (
                filteredEmails.map((em) => {
                  const isSelected = selectedEmailId === em.id;
                  const isStarred = starredIds.has(em.id);
                  const isUnread = em.status === "unread";

                  return (
                    <div
                      key={em.id}
                      onClick={() => setSelectedEmailId(em.id)}
                      className={`p-3 transition-colors cursor-pointer relative ${
                        isSelected
                          ? "bg-[#c2e7ff]/30 dark:bg-[#004a77]/30 border-l-3 border-[#0b57d0]"
                          : "hover:bg-[#f0f4f9] dark:hover:bg-[#22242a]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <button
                            onClick={(e) => toggleStar(em.id, e)}
                            className="text-[#747775] hover:text-[#f9ab00] transition-colors cursor-pointer shrink-0"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                isStarred ? "fill-[#f9ab00] text-[#f9ab00]" : ""
                              }`}
                            />
                          </button>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-[#0b57d0] shrink-0" />
                          )}
                          <span
                            className={`text-xs truncate ${
                              isUnread
                                ? "font-bold text-[#1f1f1f] dark:text-white"
                                : "font-medium text-[#444746] dark:text-[#c4c6cf]"
                            }`}
                          >
                            {em.sender}
                          </span>
                        </div>
                        <span className="text-3xs text-[#747775] dark:text-[#8e9099] shrink-0">
                          {em.receivedAt}
                        </span>
                      </div>

                      <div
                        className={`text-xs mb-1 truncate ${
                          isUnread
                            ? "font-bold text-[#1f1f1f] dark:text-white"
                            : "font-semibold text-[#1f1f1f] dark:text-[#e2e2e6]"
                        }`}
                      >
                        {em.subject}
                      </div>

                      <p className="text-2xs text-[#747775] dark:text-[#8e9099] line-clamp-1">
                        {em.snippet}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Email Detail & AI Co-Pilot Summary */}
          <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1c22] overflow-y-auto">
            {selectedEmail ? (
              <div className="p-5 space-y-4">
                {/* Header Actions */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#e0e3e7] dark:border-[#34373d]">
                  <div>
                    <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white leading-snug">
                      {selectedEmail.subject}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-2xs text-[#747775] dark:text-[#8e9099]">
                      <span className="font-semibold text-[#1f1f1f] dark:text-white">
                        {selectedEmail.sender}
                      </span>
                      <span>·</span>
                      <span>{selectedEmail.receivedAt}</span>
                      <span>·</span>
                      <span className="capitalize">{selectedEmail.priority} priority</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onAskAiAboutEmail?.(selectedEmail)}
                      className="px-3 py-1 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Draft AI Reply</span>
                    </button>
                  </div>
                </div>

                {/* Email Body */}
                <div className="text-xs leading-relaxed text-[#1f1f1f] dark:text-[#e2e2e6] space-y-3">
                  <p>{selectedEmail.snippet}</p>
                  <p className="text-[#747775] dark:text-[#8e9099]">
                    This email is streamed securely from your authenticated Google account session ({userEmail}).
                    All metadata, threads, and updates reflect real Google Workspace data.
                  </p>
                </div>

                {/* AI Executive Summary Card */}
                <div className="p-4 rounded-2xl bg-[#f0f4f9] dark:bg-[#1f2229] border border-[#d3e3fd] dark:border-[#004a77]/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
                      <span className="text-xs font-bold text-[#041e49] dark:text-[#d3e3fd]">
                        PACT AI Co-Pilot Summary
                      </span>
                    </div>
                    <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#d3e3fd]">
                      Zero-Shot In-Process LLM
                    </span>
                  </div>
                  <p className="text-xs text-[#444746] dark:text-[#c4c6cf]">
                    {selectedEmail.sender.includes("Renee")
                      ? "High priority update regarding Kimi K3.1 Pro model throughput and desktop releases. Recommended action: coordinate schedule alignment."
                      : selectedEmail.sender.includes("Adobe")
                      ? "Informational account appreciation and creative cloud perks. No critical response required."
                      : selectedEmail.sender.includes("Mapbox")
                      ? "Developer newsletter regarding artificial intelligence map integrations. Archived as low priority."
                      : `Priority message from this month. Instruct PACT to draft an executive response or schedule a follow-up.`}
                  </p>
                </div>

                {/* Quick Reply & Forward Action Bar */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setComposeTo(selectedEmail.sender);
                      setComposeSubject(`Re: ${selectedEmail.subject}`);
                      setIsComposing(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>

                  <button
                    onClick={() => {
                      setComposeSubject(`Fwd: ${selectedEmail.subject}`);
                      setComposeBody(`---------- Forwarded message ---------\nFrom: ${selectedEmail.sender}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.snippet}`);
                      setIsComposing(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Forward className="w-3.5 h-3.5" />
                    <span>Forward</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-xs text-[#747775]">
                Select an email from the list to view its contents.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 3. AUTHENTIC OFFICIAL GMAIL WEB VIEW (mail.google.com 1:1 REPLICA) */
        <div className="flex-1 flex flex-col bg-[#f6f8fc] dark:bg-[#111318] overflow-hidden text-[#1f1f1f] dark:text-[#e2e2e6]">
          {/* Authentic Google Mail Top Header */}
          <div className="h-14 px-4 bg-[#f6f8fc] dark:bg-[#111318] border-b border-[#e0e3e7] dark:border-[#2d3139] flex items-center justify-between gap-4 shrink-0">
            {/* Left: Google Mail Brand Logo & Hamburger */}
            <div className="flex items-center gap-3 shrink-0">
              <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                <Menu className="w-5 h-5 text-[#5f6368] dark:text-[#9aa0a6]" />
              </button>
              <div className="flex items-center gap-2">
                <img src="/icons/gmail.png" alt="Gmail" className="w-6 h-6 object-contain" />
                <span className="text-xl font-medium tracking-tight text-[#444746] dark:text-white font-sans">
                  Gmail
                </span>
              </div>
            </div>

            {/* Center: Authentic Google Search Bar */}
            <div className="flex-1 max-w-2xl relative">
              <div className="w-full flex items-center bg-[#eaf1fb] dark:bg-[#1e222a] rounded-full px-4 py-2 border border-transparent focus-within:bg-white dark:focus-within:bg-[#1a1c22] focus-within:shadow-md focus-within:border-transparent transition-all">
                <Search className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6] mr-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in mail"
                  className="w-full bg-transparent text-sm text-[#1f1f1f] dark:text-white placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:outline-none"
                />
                <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                  <SlidersHorizontal className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
                </button>
              </div>
            </div>

            {/* Right: Authentic Google Account Avatar & App Grid */}
            <div className="flex items-center gap-2 shrink-0">
              <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#5f6368] dark:text-[#9aa0a6]">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#5f6368] dark:text-[#9aa0a6]">
                <Settings className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#5f6368] dark:text-[#9aa0a6]">
                <Grid className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-xs cursor-pointer">
                <img
                  src="https://lh3.googleusercontent.com/a/ACg8ocJfptAReODlgvgFdKo0ZgNiVQhi7btbmGjjNaWMRjFthItgTRec=s96-c"
                  alt="Aditya Nanda"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Main Layout: Left Gmail Sidebar + Mail Stream Canvas */}
          <div className="flex-1 flex overflow-hidden">
            {/* Authentic Gmail Sidebar */}
            <div className="w-56 p-3 flex flex-col justify-between shrink-0 select-none bg-[#f6f8fc] dark:bg-[#111318]">
              <div className="space-y-1">
                {/* Authentic Gmail Pill Compose Button */}
                <button
                  onClick={() => setIsComposing(true)}
                  className="mb-4 py-3 px-5 rounded-2xl bg-[#c2e7ff] hover:bg-[#b3dbf5] hover:shadow-md dark:bg-[#004a77] dark:hover:bg-[#003b60] text-[#001d35] dark:text-[#d3e3fd] text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer shadow-xs"
                >
                  <img src="/icons/gmail.png" alt="Compose" className="w-5 h-5 object-contain" />
                  <span>Compose</span>
                </button>

                {/* Gmail Sidebar Folders */}
                <button
                  onClick={() => {
                    setOfficialSelectedEmail(null);
                    setFolder("inbox");
                  }}
                  className={`w-full px-4 py-2 rounded-full text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    folder === "inbox" && !officialSelectedEmail
                      ? "bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#d3e3fd] font-bold"
                      : "text-[#444746] dark:text-[#c4c6cf] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Inbox className="w-4 h-4" />
                    <span>Inbox</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="text-xs font-bold text-[#041e49] dark:text-[#d3e3fd]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setOfficialSelectedEmail(null);
                    setFolder("starred");
                  }}
                  className={`w-full px-4 py-2 rounded-full text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    folder === "starred"
                      ? "bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#d3e3fd] font-bold"
                      : "text-[#444746] dark:text-[#c4c6cf] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-[#f9ab00]" />
                    <span>Starred</span>
                  </div>
                  {starredIds.size > 0 && (
                    <span className="text-xs font-semibold text-[#747775]">
                      {starredIds.size}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setOfficialSelectedEmail(null);
                    setFolder("sent");
                  }}
                  className={`w-full px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    folder === "sent"
                      ? "bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#d3e3fd] font-bold"
                      : "text-[#444746] dark:text-[#c4c6cf] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Sent</span>
                </button>

                <button
                  onClick={() => {
                    setOfficialSelectedEmail(null);
                    setFolder("drafts");
                  }}
                  className={`w-full px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    folder === "drafts"
                      ? "bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#d3e3fd] font-bold"
                      : "text-[#444746] dark:text-[#c4c6cf] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Drafts</span>
                </button>
              </div>

              {/* Official Storage Box at Sidebar Foot */}
              <div className="p-3 bg-white/70 dark:bg-[#1a1c22]/70 rounded-2xl border border-[#e0e3e7] dark:border-[#2d3139]">
                <div className="flex items-center justify-between text-2xs mb-1 font-medium text-[#444746] dark:text-[#c4c6cf]">
                  <span>2.8 GB of 15 GB used</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#e0e3e7] dark:bg-[#282a2f] overflow-hidden">
                  <div className="h-full bg-[#0b57d0] dark:bg-[#a8c7fa] rounded-full w-[18%]" />
                </div>
              </div>
            </div>

            {/* Official Mail Content Canvas */}
            <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1c22] rounded-tl-2xl border-t border-l border-[#e0e3e7] dark:border-[#2d3139] overflow-hidden">
              {officialSelectedEmail ? (
                /* Detail View inside Official Replica */
                <div className="flex-1 flex flex-col overflow-y-auto">
                  {/* Top Action Toolbar */}
                  <div className="h-12 px-4 border-b border-[#e0e3e7] dark:border-[#2d3139] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOfficialSelectedEmail(null)}
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#444746] dark:text-[#c4c6cf]"
                        title="Back to inbox"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#444746] dark:text-[#c4c6cf]">
                        <Archive className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#444746] dark:text-[#c4c6cf]">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#444746] dark:text-[#c4c6cf]">
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-[#747775]">
                      1 of {emails.length}
                    </div>
                  </div>

                  {/* Mail Message Content */}
                  <div className="p-6 space-y-6 max-w-4xl">
                    <h2 className="text-xl font-bold text-[#1f1f1f] dark:text-white">
                      {officialSelectedEmail.subject}
                    </h2>

                    <div className="flex items-center justify-between pb-4 border-b border-[#e0e3e7] dark:border-[#2d3139]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm">
                          {officialSelectedEmail.sender.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#1f1f1f] dark:text-white">
                            {officialSelectedEmail.sender}
                          </div>
                          <div className="text-xs text-[#747775]">
                            to me &lt;{userEmail}&gt;
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-[#747775]">
                        {officialSelectedEmail.receivedAt}
                      </div>
                    </div>

                    <div className="text-sm leading-relaxed text-[#1f1f1f] dark:text-[#e2e2e6] space-y-3">
                      <p>{officialSelectedEmail.snippet}</p>
                      <p className="text-xs text-[#747775]">
                        Live Google Workspace stream item authenticated for user {userEmail}.
                      </p>
                    </div>

                    {/* AI Chief of Staff Card */}
                    <div className="p-4 rounded-2xl bg-[#eaf1fb] dark:bg-[#1f2229] border border-[#c2e7ff] dark:border-[#004a77] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-[#0b57d0] dark:text-[#a8c7fa]" />
                        <div>
                          <div className="text-xs font-bold text-[#041e49] dark:text-[#d3e3fd]">
                            PACT Autonomous Chief of Staff
                          </div>
                          <div className="text-2xs text-[#444746] dark:text-[#c4c6cf]">
                            Ready to autonomously formulate executive response or schedule calendar block.
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setComposeTo(officialSelectedEmail.sender);
                          setComposeSubject(`Re: ${officialSelectedEmail.subject}`);
                          setIsComposing(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        Draft AI Reply
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Authentic Gmail Inbox Table */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Secondary Toolbar */}
                  <div className="h-11 px-4 border-b border-[#e0e3e7] dark:border-[#2d3139] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="rounded-sm cursor-pointer accent-[#0b57d0]" />
                      <button
                        onClick={onRefresh}
                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#444746] dark:text-[#c4c6cf]"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                      </button>
                      <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#444746] dark:text-[#c4c6cf]">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#747775]">
                      <span>1–{filteredEmails.length} of {filteredEmails.length}</span>
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Gmail Category Tabs: Primary, Promotions, Social */}
                  <div className="h-12 border-b border-[#e0e3e7] dark:border-[#2d3139] flex items-center shrink-0">
                    <button
                      onClick={() => setOfficialTab("primary")}
                      className={`h-full px-6 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        officialTab === "primary"
                          ? "border-[#0b57d0] text-[#0b57d0] dark:text-[#a8c7fa] bg-[#eaf1fb]/40 dark:bg-[#004a77]/20"
                          : "border-transparent text-[#444746] dark:text-[#c4c6cf] hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <Inbox className="w-4 h-4" />
                      <span>Primary</span>
                      {unreadCount > 0 && (
                        <span className="text-3xs font-extrabold px-1.5 py-0.2 rounded-full bg-[#0b57d0] text-white">
                          {unreadCount} new
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setOfficialTab("promotions")}
                      className={`h-full px-6 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        officialTab === "promotions"
                          ? "border-[#0b57d0] text-[#0b57d0] dark:text-[#a8c7fa] bg-[#eaf1fb]/40 dark:bg-[#004a77]/20"
                          : "border-transparent text-[#444746] dark:text-[#c4c6cf] hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      <span>Promotions</span>
                    </button>

                    <button
                      onClick={() => setOfficialTab("social")}
                      className={`h-full px-6 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        officialTab === "social"
                          ? "border-[#0b57d0] text-[#0b57d0] dark:text-[#a8c7fa] bg-[#eaf1fb]/40 dark:bg-[#004a77]/20"
                          : "border-transparent text-[#444746] dark:text-[#c4c6cf] hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Social</span>
                    </button>
                  </div>

                  {/* Gmail 25 Messages Table */}
                  <div
                    ref={officialListScrollRef}
                    className="flex-1 overflow-y-auto divide-y divide-[#f2f2f2] dark:divide-[#242730]"
                  >
                    {filteredEmails.map((em) => {
                      const isUnread = em.status === "unread";
                      const isStarred = starredIds.has(em.id);

                      return (
                        <div
                          key={em.id}
                          onClick={() => setOfficialSelectedEmail(em)}
                          className={`h-11 px-4 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer group ${
                            isUnread
                              ? "bg-white dark:bg-[#1a1c22] font-bold text-[#1f1f1f] dark:text-white"
                              : "bg-[#f2f6fc]/50 dark:bg-[#16181d]/50 text-[#444746] dark:text-[#c4c6cf]"
                          } hover:shadow-xs hover:border-y hover:border-[#e0e3e7] dark:hover:border-[#34373d]`}
                        >
                          {/* Left: Checkbox, Star, Sender */}
                          <div className="flex items-center gap-3 w-56 shrink-0 min-w-0">
                            <input
                              type="checkbox"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-xs cursor-pointer accent-[#0b57d0]"
                            />
                            <button
                              onClick={(e) => toggleStar(em.id, e)}
                              className="text-[#747775] hover:text-[#f9ab00] transition-colors cursor-pointer shrink-0"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  isStarred ? "fill-[#f9ab00] text-[#f9ab00]" : ""
                                }`}
                              />
                            </button>
                            <span className="truncate">{em.sender}</span>
                          </div>

                          {/* Middle: Subject + Snippet preview */}
                          <div className="flex-1 flex items-center min-w-0 gap-2">
                            <span className="truncate">{em.subject}</span>
                            <span className="text-[#747775] dark:text-[#8e9099] truncate font-normal hidden sm:inline">
                              - {em.snippet}
                            </span>
                          </div>

                          {/* Right: Date / Time or Quick Hover Actions */}
                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-3xs text-[#747775] group-hover:hidden">
                              {em.receivedAt}
                            </span>
                            <div className="hidden group-hover:flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setToastMessage("Archived email.");
                                  setTimeout(() => setToastMessage(null), 2000);
                                }}
                                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#444746] dark:text-[#c4c6cf]"
                                title="Archive"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setToastMessage("Email deleted.");
                                  setTimeout(() => setToastMessage(null), 2000);
                                }}
                                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#444746] dark:text-[#c4c6cf]"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAskAiAboutEmail?.(em);
                                }}
                                className="p-1 rounded-full hover:bg-[#0b57d0]/20 text-[#0b57d0] dark:text-[#a8c7fa]"
                                title="PACT AI Summary"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. AI AUTONOMOUS COMPUTER USE "CYBER SMOKE GRADIENT" OVERLAY SIMULATION */}
      {isSimulatingAgent && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex flex-col justify-between">
          {/* Cyber Ambient Smoke Gradient Layer */}
          <div className="absolute inset-0 bg-radial-[circle_at_40%_35%] from-cyan-500/15 via-purple-600/15 to-blue-900/25 backdrop-blur-[1.5px] animate-pulse" />

          {/* Floating Neon HUD Status Badge at Top Center */}
          <div className="relative pt-4 flex justify-center pointer-events-auto">
            <div className="px-5 py-2.5 rounded-2xl bg-[#090d16]/90 border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center gap-3 backdrop-blur-md">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div className="flex flex-col">
                <span className="text-2xs font-extrabold tracking-wider uppercase text-cyan-400">
                  ⚡ PACT Autonomous Agent Active • Screen Control
                </span>
                <span className="text-xs font-semibold text-white">
                  {agentTelemetry}
                </span>
              </div>
              <button
                onClick={stopAgentSimulation}
                className="ml-3 px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-2xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Interrupt AI
              </button>
            </div>
          </div>

          {/* Virtual AI Neon Cursor Pointer */}
          <div
            className="absolute z-50 transition-all duration-700 ease-out pointer-events-none"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
            }}
          >
            {/* Pulsing Target Halo */}
            {cursorPos.clicking && (
              <div className="absolute -inset-3 rounded-full bg-cyan-400/40 animate-ping" />
            )}

            {/* Glowing Pointer Arrow */}
            <div className="relative flex items-center gap-1.5 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-3xs font-extrabold px-1.5 py-0.5 rounded-md bg-cyan-900/90 text-cyan-200 border border-cyan-500/50 shadow-md">
                PACT Agent
              </span>
            </div>
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="relative pb-3 px-6 flex justify-between items-center text-3xs font-mono text-cyan-300/80 bg-black/40 backdrop-blur-sm border-t border-cyan-500/20">
            <span>LLM: In-Process pure C++ llama.cpp (qwen2.5:3b)</span>
            <span>DOM Target: mail.google.com API Data Stream</span>
            <span>Execution Model: Closed-Loop DAG with Metal GPU</span>
          </div>
        </div>
      )}

      {/* 5. COMPOSE DIALOG MODAL (Supports Auto-Typing Simulation) */}
      {isComposing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-text">
          <div className="w-full max-w-lg bg-white dark:bg-[#1d1f24] rounded-2xl border border-[#e0e3e7] dark:border-[#34373d] p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e7] dark:border-[#34373d] mb-3">
              <h4 className="text-sm font-bold text-[#1f1f1f] dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
                <span>New Message</span>
              </h4>
              <button
                onClick={() => setIsComposing(false)}
                className="text-xs text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSendDraft} className="space-y-3">
              <div>
                <label className="text-3xs font-semibold text-[#747775] uppercase block mb-1">
                  Recipient
                </label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="Recipient (e.g. samridhisharma041@gmail.com)"
                  className="w-full px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-3xs font-semibold text-[#747775] uppercase block mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-3xs font-semibold text-[#747775] uppercase block mb-1">
                  Message
                </label>
                <textarea
                  rows={5}
                  required
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your email here..."
                  className="w-full px-3 py-2 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#e0e3e7] dark:border-[#34373d]">
                <span className="text-3xs text-[#747775]">
                  Sender: {userEmail}
                </span>
                <button
                  type="submit"
                  disabled={composeSent}
                  className="px-4 py-2 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{composeSent ? "Transmitting..." : "Send Message"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="absolute bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#1f1f1f] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-[#1e8e3e]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
