"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Mic,
  ShieldCheck,
  Zap,
  MessageSquare,
  Bot,
  User,
  ArrowRight,
} from "lucide-react";

interface WorkspaceChatPanelProps {
  activeApp: "gmail" | "calendar" | "tasks";
  userFullName: string;
  aiMode: "safe" | "turbo";
  onSelectAiMode: (mode: "safe" | "turbo") => void;
  onSendMessage: (msg: string) => Promise<void>;
  messages: Array<{ sender: "user" | "ai"; text: string }>;
  isLoading?: boolean;
}

export const WorkspaceChatPanel: React.FC<WorkspaceChatPanelProps> = ({
  activeApp,
  userFullName,
  aiMode,
  onSelectAiMode,
  onSendMessage,
  messages,
  isLoading = false,
}) => {
  const [input, setInput] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    await onSendMessage(msg);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;
    await onSendMessage(suggestion);
  };

  // Contextual prompt chips based on active application
  const suggestionsByApp = {
    gmail: [
      "Summarize unread priority emails",
      "Draft reply to Renee at Cline about Kimi K3.1",
      "Find emails regarding architecture roadmap",
    ],
    calendar: [
      "Check schedule conflicts for today",
      "Reschedule Client Technical Debrief to 3:30 PM",
      "Protect 2 hours deep focus block tomorrow",
    ],
    tasks: [
      "List all priority tasks due today",
      "Add task: Review distributed token rotation",
      "Clear completed items from Google Tasks",
    ],
  };

  const currentSuggestions = suggestionsByApp[activeApp] || suggestionsByApp.gmail;

  const appNameFormatted =
    activeApp === "gmail"
      ? "Gmail"
      : activeApp === "calendar"
      ? "Google Calendar"
      : "Google Tasks";

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1d1f24] border-l border-[#e0e3e7] dark:border-[#34373d] text-[#1f1f1f] dark:text-[#e2e2e6] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 px-4 border-b border-[#e0e3e7] dark:border-[#34373d] bg-[#f8fafd] dark:bg-[#1f2229] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0b57d0] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#1f1f1f] dark:text-white truncate">
              PACT AI Co-Pilot
            </div>
            <div className="text-3xs text-[#747775] dark:text-[#8e9099] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e8e3e] animate-pulse" />
              <span>Context: {appNameFormatted}</span>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-0.5 rounded-xl bg-white dark:bg-[#16181d] border border-[#e0e3e7] dark:border-[#34373d] shrink-0">
          <button
            onClick={() => onSelectAiMode("safe")}
            className={`px-2 py-0.5 rounded-lg text-3xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              aiMode === "safe"
                ? "bg-[#e8f0fe] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#a8c7fa] shadow-2xs"
                : "text-[#747775] dark:text-[#8e9099]"
            }`}
            title="Safe Mode: Requires human clearance before execution"
          >
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>Safe</span>
          </button>
          <button
            onClick={() => onSelectAiMode("turbo")}
            className={`px-2 py-0.5 rounded-lg text-3xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              aiMode === "turbo"
                ? "bg-[#fff3e0] dark:bg-[#4a2800] text-[#e65100] dark:text-[#ffb77d] shadow-2xs"
                : "text-[#747775] dark:text-[#8e9099]"
            }`}
            title="Turbo Mode: Autonomous execution"
          >
            <Zap className="w-2.5 h-2.5" />
            <span>Turbo</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5">
        {/* Welcome greeting */}
        <div className="p-3.5 rounded-2xl bg-[#f8fafd] dark:bg-[#232730] border border-[#e0e3e7] dark:border-[#34373d] text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <Bot className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
            <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
              AI Chief of Staff
            </span>
          </div>
          <p className="text-xs text-[#444746] dark:text-[#c4c6cf] leading-relaxed">
            I am coordinating your {appNameFormatted} in real time. Instruct me to draft emails,
            resolve schedule overlaps, or automate your tasks.
          </p>
        </div>

        {/* Message history */}
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${
              m.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-3xs font-bold ${
                m.sender === "user"
                  ? "bg-[#0b57d0] text-white"
                  : "bg-[#e8f0fe] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#a8c7fa]"
              }`}
            >
              {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`p-3 rounded-2xl text-xs max-w-[85%] text-left leading-relaxed ${
                m.sender === "user"
                  ? "bg-[#0b57d0] text-white rounded-tr-none shadow-2xs"
                  : "bg-[#f0f4f9] dark:bg-[#282a2f] text-[#1f1f1f] dark:text-[#e2e2e6] rounded-tl-none border border-[#e0e3e7]/80 dark:border-[#34373d]"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#747775] dark:text-[#8e9099] animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
            <span>PACT Co-Pilot is thinking...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts & Bottom Input */}
      <div className="p-3 border-t border-[#e0e3e7] dark:border-[#34373d] bg-[#f8fafd] dark:bg-[#1f2229] shrink-0 space-y-2">
        {/* Suggestion Chips */}
        <div className="flex flex-col gap-1.5">
          <span className="text-3xs font-bold text-[#747775] dark:text-[#8e9099] uppercase tracking-wider text-left">
            Recommended Prompts
          </span>
          <div className="flex flex-col gap-1">
            {currentSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(s)}
                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#16181d] border border-[#e0e3e7] dark:border-[#34373d] hover:border-[#0b57d0] dark:hover:border-[#a8c7fa] text-xs text-[#444746] dark:text-[#c4c6cf] hover:text-[#0b57d0] dark:hover:text-[#a8c7fa] flex items-center justify-between group transition-all cursor-pointer"
              >
                <span className="truncate">{s}</span>
                <ArrowRight className="w-3 h-3 text-[#747775] group-hover:text-[#0b57d0] dark:group-hover:text-[#a8c7fa] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask PACT about ${appNameFormatted}...`}
            className="flex-1 px-3 py-2 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white placeholder-[#747775] focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
