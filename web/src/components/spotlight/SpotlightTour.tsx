"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { speakText, stopSpeaking, isVoiceMuted, setVoiceMuted } from "@/lib/voice-service";

export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  summary: string;
  script: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "step_brand",
    targetSelector: "#tour-brand",
    title: "PACT: Sovereign Chief of Staff",
    summary: "Unified executive intelligence running locally on your device.",
    script:
      "Welcome to PACT, your Sovereign AI Chief of Staff. PACT unifies Gmail, Google Calendar, and Tasks into a single coordinated command center, powered by in-process llama.cpp pure C++ inference on Apple Silicon.",
    placement: "bottom",
  },
  {
    id: "step_workspace_insights",
    targetSelector: "#tour-workspace-insights",
    title: "Real-Time Google Workspace Telemetry",
    summary: "Continuous streaming across Gmail, Calendar, and Tasks.",
    script:
      "These three telemetry engines stream your live Google messages, calendar meetings, and priority deliverables with sub-millisecond SQLite persistence and zero cloud lag.",
    placement: "bottom",
  },
  {
    id: "step_executive_panel",
    targetSelector: "#tour-executive-panel",
    title: "Proactive Calendar & Focus Protection",
    summary: "Automated conflict detection and protected deep work blocks.",
    script:
      "PACT is never passive. It actively safeguards your deep focus blocks, detects schedule collisions before they happen, and recommends conflict resolutions with one-click approval.",
    placement: "left",
  },
  {
    id: "step_ai_mode",
    targetSelector: "#tour-ai-mode",
    title: "Cryptographic Safe Mode Governance",
    summary: "Human-in-the-Loop policy gate with HMAC SHA-256 payload verification.",
    script:
      "Security is non-negotiable. In Safe Mode, every consequential action like sending emails or rescheduling meetings requires your explicit cryptographic clearance before dispatch.",
    placement: "left",
  },
  {
    id: "step_workspace_launcher",
    targetSelector: "#tour-workspace-launcher",
    title: "Native In-App macOS Workspace",
    summary: "Dual-pane client with authentic web replicas and screen control.",
    script:
      "Launch full dual-pane Gmail, Calendar, and Tasks inside the app, complete with authentic Google Web replicas and autonomous AI screen control simulations.",
    placement: "top",
  },
  {
    id: "step_chat_interface",
    targetSelector: "#tour-chat-interface",
    title: "Autonomous DAG Planning & Voice Co-Pilot",
    summary: "Multi-tool dependency graphs and upcoming mobile phone call escalation.",
    script:
      "Command PACT via natural voice or text. The local LLM constructs dependency graphs, verifies idempotency, and will soon call your mobile phone when urgent priority matters arrive. Thank you for exploring PACT.",
    placement: "top",
  },
];

interface SpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: "gmail" | "calendar" | "tasks" | null) => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isSpeakingNarration, setIsSpeakingNarration] = useState(false);
  const [isMuted, setIsMuted] = useState(isVoiceMuted());
  const [isPaused, setIsPaused] = useState(false);
  const tourCardRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Calculate bounding rectangle of the target DOM element
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !step) return;

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: Math.max(8, rect.top - 6),
        left: Math.max(8, rect.left - 6),
        width: rect.width + 12,
        height: rect.height + 12,
      });

      // Smoothly scroll target into view if out of viewport
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    } else {
      // Fallback: Center screen spotlight
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      setTargetRect({
        top: vh / 2 - 120,
        left: vw / 2 - 240,
        width: 480,
        height: 240,
      });
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setIsSpeakingNarration(false);
      return;
    }

    updateTargetRect();
    const handleResize = () => updateTargetRect();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isOpen, updateTargetRect]);

  // Handle Voice Narration and Step Progression
  useEffect(() => {
    if (!isOpen || !step) return;

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    if (isPaused) {
      stopSpeaking();
      setIsSpeakingNarration(false);
      return;
    }

    if (!isMuted) {
      speakText(
        step.script,
        () => setIsSpeakingNarration(true),
        () => {
          setIsSpeakingNarration(false);
          // Auto advance to next step after speech concludes
          if (currentStepIndex < TOUR_STEPS.length - 1) {
            autoAdvanceTimerRef.current = setTimeout(() => {
              setCurrentStepIndex((prev) => prev + 1);
            }, 800);
          }
        }
      );
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [isOpen, currentStepIndex, isMuted, isPaused, step]);

  const handleNext = () => {
    stopSpeaking();
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    stopSpeaking();
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    stopSpeaking();
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    setCurrentStepIndex(0);
    onClose();
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setVoiceMuted(nextMuted);
    if (nextMuted) {
      stopSpeaking();
      setIsSpeakingNarration(false);
    } else if (step) {
      speakText(
        step.script,
        () => setIsSpeakingNarration(true),
        () => setIsSpeakingNarration(false)
      );
    }
  };

  if (!isOpen || !step) return null;

  // Calculate card positioning relative to targetRect
  let cardTop = 100;
  let cardLeft = 100;
  if (targetRect) {
    const placement = step.placement || "bottom";
    const cardWidth = 420;
    const cardHeight = 260;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;

    if (placement === "bottom") {
      cardTop = targetRect.top + targetRect.height + 16;
      cardLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    } else if (placement === "top") {
      cardTop = targetRect.top - cardHeight - 16;
      cardLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    } else if (placement === "left") {
      cardTop = targetRect.top + targetRect.height / 2 - cardHeight / 2;
      cardLeft = targetRect.left - cardWidth - 16;
    } else if (placement === "right") {
      cardTop = targetRect.top + targetRect.height / 2 - cardHeight / 2;
      cardLeft = targetRect.left + targetRect.width + 16;
    } else {
      cardTop = vh / 2 - cardHeight / 2;
      cardLeft = vw / 2 - cardWidth / 2;
    }

    // Boundary constraints within viewport
    cardLeft = Math.max(16, Math.min(cardLeft, vw - cardWidth - 16));
    cardTop = Math.max(16, Math.min(cardTop, vh - cardHeight - 16));
  }

  const progressPercent = ((currentStepIndex + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-99999 overflow-hidden select-none animate-in fade-in duration-300">
      {/* 1. Backdrop Canvas with Cutout Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            {/* White covers entire screen */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout reveals element underneath */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="16"
                fill="black"
                className="transition-all duration-400 ease-out"
              />
            )}
          </mask>
        </defs>

        {/* Shaded backdrop with mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(5, 7, 12, 0.78)"
          mask="url(#spotlight-mask)"
          onClick={handleClose}
        />
      </svg>

      {/* 2. Animated Glowing Border Box Around Target Element */}
      {targetRect && (
        <div
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          }}
          className="absolute rounded-2xl border-2 border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.45)] pointer-events-none transition-all duration-400 ease-out"
        >
          <div className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full bg-cyan-500 text-[#090d16] font-extrabold text-3xs uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Radio className="w-2.5 h-2.5 animate-pulse text-[#090d16]" />
            <span>Target Focused</span>
          </div>
        </div>
      )}

      {/* 3. Floating Spotlight HUD Pitch Card */}
      <div
        ref={tourCardRef}
        style={{
          top: `${cardTop}px`,
          left: `${cardLeft}px`,
        }}
        className="absolute w-[420px] max-w-[calc(100vw-32px)] bg-[#11141c]/95 dark:bg-[#11141c]/95 border border-cyan-500/40 rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.6)] backdrop-blur-xl p-5 text-white pointer-events-auto transition-all duration-300 ease-out"
      >
        {/* Top Header Row: Step Pill + Audio Indicator + Close */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.8 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-3xs font-extrabold tracking-wider uppercase">
              Pitch Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <span className="text-3xs text-neutral-400 font-mono">~10s pitch</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Narration Indicator */}
            <button
              onClick={handleToggleMute}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isMuted ? "Unmute Voice Narration" : "Mute Voice Narration"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              ) : (
                <Volume2 className={`w-4 h-4 ${isSpeakingNarration ? "text-cyan-400 animate-pulse" : "text-neutral-300"}`} />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Title & Summary */}
        <div className="space-y-1.5 mb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <h3 className="text-sm font-extrabold text-white tracking-tight">
              {step.title}
            </h3>
          </div>
          <p className="text-xs font-medium text-cyan-200/90 leading-relaxed">
            {step.summary}
          </p>
        </div>

        {/* Spoken Script Box with Live Telemetry */}
        <div className="mb-4 p-3 rounded-xl bg-black/40 border border-white/10 text-2xs text-neutral-300 leading-relaxed">
          <div className="flex items-center gap-1.5 text-3xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
            {isSpeakingNarration ? (
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Narrating (en-IN Female Voice)
              </span>
            ) : (
              <span>Spoken Narration</span>
            )}
          </div>
          <p className="text-neutral-200 font-sans italic">
            "{step.script}"
          </p>
        </div>

        {/* Overall Tour Progress Bar (Target: 60 Seconds Total) */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-linear-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-400"
          />
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold text-neutral-300 flex items-center gap-1 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  stopSpeaking();
                  setCurrentStepIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? "w-5 bg-cyan-400"
                    : idx < currentStepIndex
                    ? "bg-cyan-700"
                    : "bg-white/20"
                }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-1.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-95 text-xs font-bold text-[#090d16] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>{currentStepIndex === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}</span>
            {currentStepIndex === TOUR_STEPS.length - 1 ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
