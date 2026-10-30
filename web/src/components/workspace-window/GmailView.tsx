"use client";

import React, { useState } from "react";
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

  // Keep selected email valid when emails update
  React.useEffect(() => {
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
    emails.find((em) => em.id === selectedEmailId) || (filteredEmails.length > 0 ? filteredEmails[0] : null);

  const handleSendDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) return;
    setComposeSent(true);
    setTimeout(() => {
      setComposeSent(false);
      setIsComposing(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
    }, 1200);
  };

  // Directly launches the official Google Mail web application in a dedicated desktop popup window
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
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1c22] text-[#1f1f1f] dark:text-[#e2e2e6] overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-12 border-b border-[#e0e3e7] dark:border-[#34373d] px-4 flex items-center justify-between gap-3 bg-[#f8fafd] dark:bg-[#1f2229] shrink-0">
        <div className="flex items-center gap-2">
          {/* Active Mode Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-[#16181d] border border-[#e0e3e7] dark:border-[#34373d]">
            <span className="w-2 h-2 rounded-full bg-[#1e8e3e]" />
            <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
              Workspace Stream (Live)
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-2xs text-[#747775] dark:text-[#8e9099] ml-2">
            <span className="font-semibold text-[#1f1f1f] dark:text-white">
              {unreadCount} unread
            </span>
            <span>•</span>
            <span className="font-medium text-[#1f1f1f] dark:text-[#e2e2e6]">
              {emails.length} messages this month
            </span>
            <span>•</span>
            <span className="truncate">{userEmail}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          {/* Direct Popout Desktop Window Launcher */}
          <button
            onClick={handleLaunchPopout}
            className="px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Open official mail.google.com in standalone window"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
            <span className="hidden sm:inline">Open mail.google.com</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Client Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Gmail Navigation Sidebar (w-52 for clean comfortable spacing) */}
        <div className="w-52 border-r border-[#e0e3e7] dark:border-[#34373d] p-3 hidden md:flex flex-col justify-between bg-[#f8fafd]/60 dark:bg-[#16181d]/60 shrink-0 select-none">
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

          {/* Storage Box (Properly Spaced & Formatted) */}
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

        {/* Center Pane: Email List (w-80 to w-96) */}
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

            {/* Sub-Filter Chips: All vs Unread vs Important */}
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

          {/* Message List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#e0e3e7]/60 dark:divide-[#34373d]/60">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#747775] dark:text-[#8e9099]">
                No messages found matching this view.
              </div>
            ) : (
              filteredEmails.map((em) => {
                const isStarred = starredIds.has(em.id);
                const isSelected = selectedEmail?.id === em.id;
                const isUnread = em.status === "unread";

                return (
                  <div
                    key={em.id}
                    onClick={() => setSelectedEmailId(em.id)}
                    className={`p-3 text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-[#e8f0fe] dark:bg-[#004a77]/35 border-l-3 border-[#0b57d0] dark:border-[#a8c7fa]"
                        : "hover:bg-[#f8fafd] dark:hover:bg-[#282a2f]"
                    } ${isUnread ? "bg-[#f8fafd]/80 dark:bg-[#1a1f2c]/50" : ""}`}
                  >
                    {/* Star Button */}
                    <button
                      onClick={(e) => toggleStar(em.id, e)}
                      className="mt-0.5 text-[#747775] hover:text-[#f9ab00] transition-colors cursor-pointer shrink-0"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isStarred ? "fill-[#f9ab00] text-[#f9ab00]" : ""
                        }`}
                      />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa] shrink-0" />
                          )}
                          <span
                            className={`text-xs truncate ${
                              isUnread
                                ? "font-bold text-[#1f1f1f] dark:text-white"
                                : "font-normal text-[#444746] dark:text-[#c4c6cf]"
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
                        className={`text-xs truncate ${
                          isUnread
                            ? "font-bold text-[#1f1f1f] dark:text-white"
                            : "font-normal text-[#444746] dark:text-[#c4c6cf]"
                        }`}
                      >
                        {em.subject}
                      </div>

                      <div className="text-2xs text-[#747775] dark:text-[#8e9099] truncate mt-0.5">
                        {em.snippet}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Email Detail & Reading View */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1c22] overflow-hidden">
          {selectedEmail ? (
            <div className="h-full flex flex-col justify-between p-5 overflow-y-auto">
              <div className="space-y-4">
                {/* Detail Header */}
                <div className="pb-3 border-b border-[#e0e3e7] dark:border-[#34373d]">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-bold text-[#1f1f1f] dark:text-white leading-snug">
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {selectedEmail.priority === "urgent" && (
                        <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#410002] dark:bg-[#93000a] dark:text-[#ffdad6]">
                          Priority
                        </span>
                      )}
                      <button
                        onClick={handleLaunchPopout}
                        className="p-1.5 rounded-lg text-[#747775] hover:bg-[#e0e3e7] dark:hover:bg-[#282a2f] cursor-pointer"
                        title="Open thread in mail.google.com"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0b57d0] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {selectedEmail.sender[0]}
                      </div>
                      <div>
                        <div className="font-bold text-[#1f1f1f] dark:text-white">
                          {selectedEmail.sender}
                        </div>
                        <div className="text-2xs text-[#747775] dark:text-[#8e9099]">
                          {selectedEmail.senderEmail}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xs text-[#747775] dark:text-[#8e9099]">
                      {selectedEmail.receivedAt}
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="text-xs text-[#1f1f1f] dark:text-[#e2e2e6] leading-relaxed whitespace-pre-wrap">
                  {selectedEmail.snippet}
                  {"\n\n"}
                  This email is streamed securely from your authenticated Google account session (adityananda.dev@gmail.com). All threads and updates reflect real Google Workspace data.
                </div>

                {/* AI Quick Analysis Card */}
                {onAskAiAboutEmail && (
                  <div className="p-3.5 rounded-2xl bg-[#f0f4f9] dark:bg-[#282a2f] border border-[#e0e3e7] dark:border-[#34373d]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0b57d0] dark:text-[#a8c7fa]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>PACT AI Co-Pilot Summary</span>
                      </div>
                      <button
                        onClick={() => onAskAiAboutEmail(selectedEmail)}
                        className="text-3xs font-semibold px-2.5 py-1 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white transition-all cursor-pointer"
                      >
                        Draft AI Reply
                      </button>
                    </div>
                    <p className="text-2xs text-[#444746] dark:text-[#c4c6cf] mt-1">
                      Priority message from this month. Instruct PACT to draft an executive response or schedule a follow-up.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Reply Bar */}
              <div className="pt-4 border-t border-[#e0e3e7] dark:border-[#34373d] flex items-center gap-2">
                <button
                  onClick={() => {
                    setComposeTo(selectedEmail.senderEmail);
                    setComposeSubject(`Re: ${selectedEmail.subject}`);
                    setIsComposing(true);
                  }}
                  className="py-2 px-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
                <button
                  onClick={() => {
                    setComposeSubject(`Fwd: ${selectedEmail.subject}`);
                    setIsComposing(true);
                  }}
                  className="py-2 px-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Forward className="w-3.5 h-3.5" />
                  <span>Forward</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#747775] dark:text-[#8e9099]">
              Select an email to read
            </div>
          )}
        </div>
      </div>

      {/* Compose Dialog Modal */}
      {isComposing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
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
              <input
                type="email"
                required
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="Recipients"
                className="w-full px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none"
              />
              <input
                type="text"
                required
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none"
              />
              <textarea
                rows={5}
                required
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your email here..."
                className="w-full px-3 py-2 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none resize-none"
              />

              <div className="flex items-center justify-between pt-2 border-t border-[#e0e3e7] dark:border-[#34373d]">
                <span className="text-3xs text-[#747775]">
                  From: {userEmail}
                </span>
                <button
                  type="submit"
                  disabled={composeSent}
                  className="px-4 py-2 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{composeSent ? "Sending..." : "Send Message"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
