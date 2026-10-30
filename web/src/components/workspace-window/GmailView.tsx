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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    emails.length > 0 ? emails[0].id : null
  );
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSent, setComposeSent] = useState(false);

  // Filter emails by search query
  const filteredEmails = emails.filter((em) => {
    const q = searchQuery.toLowerCase();
    return (
      em.sender.toLowerCase().includes(q) ||
      em.subject.toLowerCase().includes(q) ||
      em.snippet.toLowerCase().includes(q)
    );
  });

  const selectedEmail = emails.find((em) => em.id === selectedEmailId) || emails[0];

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
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1c22] text-[#1f1f1f] dark:text-[#e2e2e6] overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-12 border-b border-[#e0e3e7] dark:border-[#34373d] px-4 flex items-center justify-between gap-3 bg-[#f8fafd] dark:bg-[#1f2229] shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#747775] dark:text-[#8e9099]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in mail..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white placeholder-[#747775] dark:placeholder-[#8e9099] focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
            />
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
              title="Refresh Inbox"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
            title="Open in mail.google.com"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Mailbox Content Area: Left Email List + Right Email Details */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Side: Message List */}
        <div className="w-[42%] lg:w-[38%] border-r border-[#e0e3e7] dark:border-[#34373d] flex flex-col bg-white dark:bg-[#1a1c22] min-h-0">
          {/* Subheader info */}
          <div className="px-3 py-2 border-b border-[#e0e3e7]/70 dark:border-[#34373d]/70 flex items-center justify-between text-2xs text-[#747775] dark:text-[#8e9099] bg-[#f8fafd] dark:bg-[#1f2229]">
            <div className="flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5" />
              <span className="font-semibold text-[#1f1f1f] dark:text-white">Primary Inbox</span>
            </div>
            <span>{unreadCount} unread</span>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#e0e3e7]/50 dark:divide-[#34373d]/50">
            {filteredEmails.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#747775] dark:text-[#8e9099]">
                No messages found matching "{searchQuery}"
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = email.id === selectedEmailId;
                const isUnread = email.status === "unread";
                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmailId(email.id)}
                    className={`p-3 transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-[#e8f0fe] dark:bg-[#00325b]/40 border-l-3 border-[#0b57d0] dark:border-[#a8c7fa]"
                        : "hover:bg-[#f8fafd] dark:hover:bg-[#232730]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-xs truncate ${
                          isUnread
                            ? "font-bold text-[#1f1f1f] dark:text-white"
                            : "font-medium text-[#444746] dark:text-[#c4c6cf]"
                        }`}
                      >
                        {email.sender}
                      </span>
                      <span className="text-3xs text-[#747775] dark:text-[#8e9099] shrink-0">
                        {email.receivedAt}
                      </span>
                    </div>

                    <div
                      className={`text-xs truncate ${
                        isUnread
                          ? "font-semibold text-[#1f1f1f] dark:text-white"
                          : "text-[#444746] dark:text-[#c4c6cf]"
                      }`}
                    >
                      {email.subject}
                    </div>

                    <p className="text-2xs text-[#747775] dark:text-[#8e9099] line-clamp-2 mt-0.5 leading-snug">
                      {email.snippet}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      {email.priority === "urgent" && (
                        <span className="text-3xs px-1.5 py-0.2 rounded bg-[#ffdad6] dark:bg-[#93000a] text-[#ba1a1a] dark:text-[#ffb4ab] font-bold">
                          Urgent
                        </span>
                      )}
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa]" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Detail */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#16181d] min-h-0 overflow-y-auto">
          {selectedEmail ? (
            <div className="p-4 lg:p-6 flex-1 flex flex-col">
              {/* Message Header */}
              <div className="pb-4 border-b border-[#e0e3e7] dark:border-[#34373d]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-base font-bold text-[#1f1f1f] dark:text-white leading-snug">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onAskAiAboutEmail && (
                      <button
                        onClick={() => onAskAiAboutEmail(selectedEmail)}
                        className="px-2.5 py-1 rounded-xl bg-[#e8f0fe] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#d3e3fd] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        title="Draft reply or summarize with AI"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Co-Pilot</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#747775] dark:text-[#8e9099]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0b57d0] text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {selectedEmail.sender.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1f1f1f] dark:text-white">
                        {selectedEmail.sender}
                      </div>
                      <div className="text-2xs text-[#747775] dark:text-[#8e9099]">
                        &lt;{selectedEmail.senderEmail}&gt;
                      </div>
                    </div>
                  </div>
                  <div className="text-2xs">{selectedEmail.receivedAt}</div>
                </div>
              </div>

              {/* Message Body */}
              <div className="py-6 flex-1 text-xs text-[#1f1f1f] dark:text-[#e2e2e6] leading-relaxed whitespace-pre-wrap font-sans">
                {selectedEmail.snippet}
                {"\n\n"}
                <div className="p-4 rounded-xl bg-[#f8fafd] dark:bg-[#1f2229] border border-[#e0e3e7] dark:border-[#34373d] text-2xs text-[#747775] dark:text-[#8e9099]">
                  Streamed in real-time from your authenticated Google Workspace inbox (
                  {userEmail}).
                </div>
              </div>

              {/* Quick Reply Bar */}
              <div className="pt-4 border-t border-[#e0e3e7] dark:border-[#34373d] flex items-center gap-2">
                <button
                  onClick={() => {
                    setComposeTo(selectedEmail.senderEmail);
                    setComposeSubject(`Re: ${selectedEmail.subject}`);
                    setIsComposing(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1f2229] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
                <button
                  onClick={() => {
                    setComposeSubject(`Fwd: ${selectedEmail.subject}`);
                    setComposeBody(`\n\n---------- Forwarded message ---------\nFrom: ${selectedEmail.sender}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.snippet}`);
                    setIsComposing(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1f2229] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-xs font-semibold text-[#1f1f1f] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Forward className="w-3.5 h-3.5" />
                  <span>Forward</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#747775] dark:text-[#8e9099]">
              Select an email from the list to view its contents.
            </div>
          )}
        </div>
      </div>

      {/* In-App Compose Overlay */}
      {isComposing && (
        <div className="absolute inset-x-4 bottom-4 lg:right-6 lg:left-auto lg:w-[480px] rounded-2xl bg-white dark:bg-[#1f2229] border border-[#e0e3e7] dark:border-[#34373d] shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="h-10 bg-[#f0f4f9] dark:bg-[#282a2f] px-4 flex items-center justify-between border-b border-[#e0e3e7] dark:border-[#34373d]">
            <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">New Message</span>
            <button
              onClick={() => setIsComposing(false)}
              className="text-xs text-[#747775] hover:text-[#ba1a1a] dark:text-[#8e9099] dark:hover:text-[#ff897d] cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSendDraft} className="p-3.5 space-y-2.5">
            <div>
              <input
                type="email"
                required
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="To (recipient email)"
                className="w-full px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white placeholder-[#747775] focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
              />
            </div>

            <div>
              <input
                type="text"
                required
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs font-semibold text-[#1f1f1f] dark:text-white placeholder-[#747775] focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
              />
            </div>

            <div>
              <textarea
                rows={5}
                required
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Type your message here..."
                className="w-full p-3 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white placeholder-[#747775] focus:outline-none focus:ring-1 focus:ring-[#0b57d0] resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-3xs text-[#747775] dark:text-[#8e9099]">
                From: {userEmail}
              </span>

              <button
                type="submit"
                disabled={composeSent}
                className="px-4 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{composeSent ? "Sending Draft..." : "Send Email"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
