"use client";

import React, { useState } from "react";
import {
  Search,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  RefreshCw,
  Send,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Inbox,
  Clock,
  FileText,
  Check,
  Menu,
  SlidersHorizontal,
  HelpCircle,
  Settings,
  Grid,
  MoreVertical,
  Tag,
  Users,
  X,
  Minus,
  Maximize2,
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
  // Navigation, Folder, and Search state
  const [folder, setFolder] = useState<"inbox" | "starred" | "sent" | "drafts">("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  // Official Gmail Tabs: Primary vs Promotions vs Social
  const [officialTab, setOfficialTab] = useState<"primary" | "promotions" | "social">("primary");
  const [officialSelectedEmail, setOfficialSelectedEmail] = useState<WorkspaceEmail | null>(null);

  // Compose State
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSent, setComposeSent] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Filter emails by search query, folder, and tabs
  const filteredEmails = emails.filter((em) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      em.sender.toLowerCase().includes(q) ||
      em.subject.toLowerCase().includes(q) ||
      em.snippet.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (folder === "starred") return starredIds.has(em.id);
    if (folder === "sent") return false;
    if (folder === "drafts") return false;

    if (officialTab === "promotions") {
      return (
        em.snippet.toLowerCase().includes("offer") ||
        em.subject.toLowerCase().includes("update") ||
        em.subject.toLowerCase().includes("discount")
      );
    }
    if (officialTab === "social") {
      return (
        em.snippet.toLowerCase().includes("network") ||
        em.snippet.toLowerCase().includes("team") ||
        em.snippet.toLowerCase().includes("invitation")
      );
    }
    return true;
  });

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
    }, 800);
  };

  return (
    <div className="h-full flex flex-col bg-[#f6f8fc] dark:bg-[#111318] text-[#1f1f1f] dark:text-[#e2e2e6] overflow-hidden relative select-none">
      {/* 1. Authentic Google Mail Top Header */}
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

      {/* 2. Main Layout: Left Gmail Sidebar + Mail Stream Canvas */}
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

        {/* 3. Official Mail Content Canvas */}
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0b57d0] text-white flex items-center justify-center font-bold text-sm">
                      {officialSelectedEmail.sender.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#1f1f1f] dark:text-white">
                        {officialSelectedEmail.sender}
                      </div>
                      <div className="text-2xs text-[#747775]">
                        to {userEmail}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#747775]">
                    <span>{officialSelectedEmail.receivedAt}</span>
                    <button
                      onClick={(e) => toggleStar(officialSelectedEmail.id, e)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          starredIds.has(officialSelectedEmail.id)
                            ? "text-[#f9ab00] fill-[#f9ab00]"
                            : "text-[#747775]"
                        }`}
                      />
                    </button>
                    <button className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full cursor-pointer">
                      <Reply className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#f8fafd] dark:bg-[#111318] border border-[#e0e3e7] dark:border-[#2d3139] text-xs text-[#1f1f1f] dark:text-[#e2e2e6] whitespace-pre-wrap leading-relaxed font-sans">
                  {officialSelectedEmail.snippet}
                  {"\n\n"}
                  This email is synced live from your official Google Workspace account. You can draft an autonomous reply via PACT Copilot or open in mail.google.com anytime.
                </div>

                {/* Reply / Forward Actions & AI Reply */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#e0e3e7] dark:border-[#2d3139]">
                  <button
                    onClick={() => {
                      setComposeTo(officialSelectedEmail.sender);
                      setComposeSubject(`Re: ${officialSelectedEmail.subject}`);
                      setIsComposing(true);
                    }}
                    className="px-4 py-2 rounded-full border border-[#747775]/40 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Reply
                  </button>

                  <button
                    onClick={() => {
                      setComposeSubject(`Fwd: ${officialSelectedEmail.subject}`);
                      setComposeBody(`---------- Forwarded message ---------\n${officialSelectedEmail.snippet}`);
                      setIsComposing(true);
                    }}
                    className="px-4 py-2 rounded-full border border-[#747775]/40 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Forward className="w-3.5 h-3.5" />
                    Forward
                  </button>

                  <button
                    onClick={() => onAskAiAboutEmail?.(officialSelectedEmail)}
                    className="px-4 py-2 rounded-full bg-[#e8f0fe] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#d3e3fd] text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
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
                  <input type="checkbox" className="rounded-xs cursor-pointer accent-[#0b57d0]" />
                  <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#444746] dark:text-[#c4c6cf]"
                    title="Refresh Inbox"
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

              {/* Gmail Messages Table */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#f2f2f2] dark:divide-[#242730]">
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
                            className={`w-4 h-4 ${
                              isStarred ? "text-[#f9ab00] fill-[#f9ab00]" : ""
                            }`}
                          />
                        </button>
                        <span className="truncate">{em.sender}</span>
                      </div>

                      {/* Center: Subject & Snippet */}
                      <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                        <span className="truncate">{em.subject}</span>
                        <span className="text-[#747775] dark:text-[#8e9099] font-normal truncate hidden sm:inline">
                          — {em.snippet}
                        </span>
                      </div>

                      {/* Right: Date and Action Icons */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-3xs text-[#747775] dark:text-[#8e9099] group-hover:hidden">
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
                              setToastMessage("Deleted email.");
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

                {filteredEmails.length === 0 && (
                  <div className="p-12 text-center text-xs text-[#747775]">
                    No messages in this folder.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Floating Google Compose Modal */}
      {isComposing && (
        <div className="absolute bottom-0 right-8 w-130 max-w-[calc(100%-32px)] bg-white dark:bg-[#1f2229] rounded-t-2xl shadow-2xl border border-[#e0e3e7] dark:border-[#34373d] z-50 overflow-hidden">
          {/* Header */}
          <div className="h-10 px-4 bg-[#f2f6fc] dark:bg-[#16181d] border-b border-[#e0e3e7] dark:border-[#34373d] flex items-center justify-between">
            <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
              New Message
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsComposing(false)}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full cursor-pointer text-[#747775]"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsComposing(false)}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full cursor-pointer text-[#747775]"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsComposing(false)}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full cursor-pointer text-[#747775]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSendDraft} className="p-4 space-y-3">
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
      )}

      {/* 5. Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#1f1f1f] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-[#1e8e3e]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
