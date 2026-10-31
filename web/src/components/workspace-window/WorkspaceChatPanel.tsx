"use client";

import React, { useState } from "react";
import {
  Send,
  Mic,
  MicOff,
  ShieldCheck,
  Zap,
  MessageSquare,
  Bot,
  User,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export interface ChatMessageItem {
  sender: "user" | "ai";
  text: string;
  hitlApproval?: {
    approval_id?: string;
    tool_name?: string;
    summary?: string;
    payload_hash?: string;
    payload?: any;
  } | null;
}

interface WorkspaceChatPanelProps {
  activeApp: "gmail" | "calendar" | "tasks";
  userFullName: string;
  aiMode: "safe" | "turbo";
  onSelectAiMode: (mode: "safe" | "turbo") => void;
  onSendMessage: (msg: string) => Promise<void>;
  messages: ChatMessageItem[];
  isLoading?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  onToggleListening?: () => void;
  isAudioMuted?: boolean;
  onToggleMute?: () => void;
  onApproveAction?: (approval: any) => Promise<void>;
}

export const WorkspaceChatPanel: React.FC<WorkspaceChatPanelProps> = ({
  activeApp,
  userFullName,
  aiMode,
  onSelectAiMode,
  onSendMessage,
  messages,
  isLoading = false,
  isSpeaking = false,
  isListening = false,
  onToggleListening,
  isAudioMuted = false,
  onToggleMute,
  onApproveAction,
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
      "Draft reply to Renee about Kimi K3.1",
      "Send email to samridhisharma041@gmail.com",
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
    <div className="h-full flex flex-col rounded-2xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] shadow-2xl overflow-hidden text-[#1f1f1f] dark:text-[#e2e2e6] transition-all">
      {/* Top Header - Matching macOS Window Title Bar Height & Style */}
      <div className="h-11 px-4 bg-[#f0f4f9] dark:bg-[#16181d] border-b border-[#e0e3e7] dark:border-[#34373d] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#0b57d0] text-white flex items-center justify-center shadow-xs shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1.5 truncate">
            <span className="text-xs font-bold text-[#1f1f1f] dark:text-white truncate">
              AI Co-Pilot
            </span>
            <span className="text-3xs text-[#747775] dark:text-[#8e9099] truncate hidden sm:inline">
              • {appNameFormatted}
            </span>
          </div>
          {isSpeaking && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#e8f0fe] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#a8c7fa] text-3xs font-semibold flex items-center gap-1 animate-pulse shrink-0">
              <Volume2 className="w-2.5 h-2.5" />
              <span>Voice</span>
            </span>
          )}
        </div>

        {/* Right Controls: Safe/Turbo Mode Switcher + Voice Mute */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-white/70 dark:bg-[#1f2229] border border-[#e0e3e7]/80 dark:border-[#34373d]">
            <button
              onClick={() => onSelectAiMode("safe")}
              className={`px-2 py-0.5 rounded-md text-3xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                aiMode === "safe"
                  ? "bg-[#0b57d0] text-white shadow-2xs font-bold"
                  : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
              title="Safe Mode: Explicit clearance required"
            >
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>Safe</span>
            </button>
            <button
              onClick={() => onSelectAiMode("turbo")}
              className={`px-2 py-0.5 rounded-md text-3xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                aiMode === "turbo"
                  ? "bg-[#e65100] text-white shadow-2xs font-bold"
                  : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
              title="Turbo Mode: Autonomous execution"
            >
              <Zap className="w-2.5 h-2.5" />
              <span>Turbo</span>
            </button>
          </div>

          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-1 rounded-lg text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white transition-colors cursor-pointer ${
                isAudioMuted ? "text-[#ea4335]" : ""
              }`}
              title={isAudioMuted ? "Unmute voice response" : "Mute voice response"}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3">
        {/* Minimal Welcome Tip when no messages */}
        {messages.length === 0 && (
          <div className="p-3 rounded-xl bg-[#f8fafd] dark:bg-[#232730] border border-[#e0e3e7]/80 dark:border-[#34373d] text-left">
            <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-[#1f1f1f] dark:text-white">
              <Bot className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
              <span>{appNameFormatted} Assistant</span>
            </div>
            <p className="text-2xs text-[#747775] dark:text-[#8e9099] leading-relaxed">
              Ask questions, draft responses, or trigger autonomous tasks using text or voice.
            </p>
          </div>
        )}

        {/* Message History */}
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col gap-1 ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`flex items-start gap-2 max-w-[88%] ${
                m.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-3xs font-bold mt-0.5 ${
                  m.sender === "user"
                    ? "bg-[#0b57d0] text-white"
                    : "bg-[#e8f0fe] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#a8c7fa]"
                }`}
              >
                {m.sender === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>

              <div
                className={`p-2.5 rounded-2xl text-xs text-left leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#0b57d0] text-white rounded-tr-none shadow-2xs"
                    : "bg-[#f0f4f9] dark:bg-[#282a2f] text-[#1f1f1f] dark:text-[#e2e2e6] rounded-tl-none border border-[#e0e3e7]/80 dark:border-[#34373d]"
                }`}
              >
                {m.text}
              </div>
            </div>

            {/* Human-in-the-Loop Clearance Card if attached */}
            {m.hitlApproval && (
              <div className="ml-7 mr-2 p-3 rounded-xl bg-[#fff8e1] dark:bg-[#2b2413] border border-[#fbc02d]/80 text-left text-xs space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-[#b78103] dark:text-[#fbc02d]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Clearance Required</span>
                </div>
                <p className="text-2xs text-[#5d4037] dark:text-[#ffe082]">
                  {m.hitlApproval.summary || `Action: ${m.hitlApproval.tool_name}`}
                </p>
                {onApproveAction && (
                  <div className="pt-1">
                    <button
                      onClick={() => onApproveAction(m.hitlApproval)}
                      className="px-3 py-1 rounded-lg bg-[#0b57d0] hover:bg-[#0842a0] text-white text-2xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Authorize Action</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#747775] dark:text-[#8e9099] animate-pulse">
            <div className="w-2 h-2 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa] animate-ping" />
            <span>Co-Pilot is working...</span>
          </div>
        )}
      </div>

      {/* Bottom Area: Suggestions + Compact Input Bar */}
      <div className="p-3 border-t border-[#e0e3e7] dark:border-[#34373d] bg-[#f8fafd] dark:bg-[#1f2229] shrink-0 space-y-2">
        {/* Horizontal Scrollable Prompt Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <span className="text-3xs font-medium text-[#747775] dark:text-[#8e9099] shrink-0">
            Suggested:
          </span>
          {currentSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#282a2f] border border-[#e0e3e7] dark:border-[#34373d] hover:border-[#0b57d0] dark:hover:border-[#a8c7fa] hover:text-[#0b57d0] dark:hover:text-[#a8c7fa] text-3xs font-medium text-[#444746] dark:text-[#c4c6cf] shrink-0 transition-colors cursor-pointer shadow-2xs"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar with Voice Mic + Send */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? "Listening... Speak your command now."
                  : `Ask PACT about ${appNameFormatted}...`
              }
              className={`w-full px-3 py-1.5 rounded-xl border text-xs text-[#1f1f1f] dark:text-white placeholder-[#747775] focus:outline-none focus:ring-1 focus:ring-[#0b57d0] ${
                isListening
                  ? "border-[#ea4335] bg-[#fce8e6] dark:bg-[#3b1816]"
                  : "border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d]"
              }`}
            />
            {isListening && (
              <span className="absolute right-2.5 top-2.5 w-1.5 h-1.5 rounded-full bg-[#ea4335] animate-ping" />
            )}
          </div>

          {onToggleListening && (
            <button
              type="button"
              onClick={onToggleListening}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                isListening
                  ? "bg-[#ea4335] text-white border-[#ea4335]"
                  : "bg-white dark:bg-[#16181d] text-[#747775] dark:text-[#8e9099] border-[#e0e3e7] dark:border-[#34373d] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
              title={isListening ? "Listening... Click to stop." : "Voice Input"}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-1.5 rounded-lg bg-[#0b57d0] hover:bg-[#0842a0] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
