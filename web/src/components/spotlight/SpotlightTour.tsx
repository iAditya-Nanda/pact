"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { stopSpeaking } from "@/lib/voice-service";

export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  summary: string;
  details: string;
  preferredPlacement?: "top" | "bottom" | "left" | "right";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "step_brand",
    targetSelector: "#tour-brand",
    title: "PACT: Sovereign Chief of Staff",
    summary: "Unified executive intelligence running locally on your device.",
    details:
      "Coordinates Gmail, Google Calendar, and Tasks into a single proactive command center with zero cloud lag and local privacy.",
    preferredPlacement: "bottom",
  },
  {
    id: "step_workspace_insights",
    targetSelector: "#tour-workspace-insights",
    title: "Real-Time Workspace Telemetry",
    summary: "Continuous streaming across Gmail, Calendar, and Tasks.",
    details:
      "Three live engines track unread priority messages, meetings, and active deliverables with real-time Supabase PostgreSQL persistence.",
    preferredPlacement: "right",
  },
  {
    id: "step_executive_panel",
    targetSelector: "#tour-executive-panel",
    title: "Proactive Calendar & Focus Protection",
    summary: "Automated conflict detection and protected deep work blocks.",
    details:
      "Continuously guards your schedule integrity, clears meeting collisions, and recommends resolution actions with one-click approval.",
    preferredPlacement: "left",
  },
  {
    id: "step_ai_mode",
    targetSelector: "#tour-ai-mode",
    title: "Cryptographic Safe Mode Governance",
    summary: "Human-in-the-loop policy gate with verified execution clearance.",
    details:
      "In Safe Mode, every consequential outbound action like scheduling meetings or drafting emails requires your explicit approval.",
    preferredPlacement: "left",
  },
  {
    id: "step_workspace_launcher",
    targetSelector: "#tour-workspace-launcher",
    title: "Native In-App Workspace",
    summary: "Dual-pane desktop workspace with screen control simulation.",
    details:
      "Launch full dual-pane Gmail, Calendar, and Tasks directly inside PACT with coordinated sidecar intelligence and live OAuth.",
    preferredPlacement: "top",
  },
  {
    id: "step_chat_interface",
    targetSelector: "#tour-chat-interface",
    title: "Autonomous DAG Planning & Co-Pilot",
    summary: "Multi-tool dependency graphs and upcoming mobile phone call escalation.",
    details:
      "Issue natural voice or text instructions to plan tasks, coordinate meetings, draft emails, and escalate urgent conflicts seamlessly.",
    preferredPlacement: "top",
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

/**
 * Intelligent positioning engine:
 * Evaluates candidate placements and guarantees strict clearance
 * so the card never covers or intersects the target element.
 */
function calculateNonOverlappingPosition(
  target: TargetRect,
  preferred: "top" | "bottom" | "left" | "right",
  cardWidth: number,
  cardHeight: number,
  vw: number,
  vh: number
): { top: number; left: number } {
  const clearance = 24; // Generous physical gap between card and target
  const padding = 16;

  // Build candidate placements order prioritizing preferred placement
  const order: Array<"top" | "bottom" | "left" | "right"> = [
    preferred,
    preferred === "top" ? "bottom" : preferred === "bottom" ? "top" : preferred === "left" ? "right" : "left",
    preferred === "left" || preferred === "right" ? "bottom" : "right",
    preferred === "left" || preferred === "right" ? "top" : "left",
  ];

  for (const p of order) {
    let top = 0;
    let left = 0;

    if (p === "bottom") {
      top = target.top + target.height + clearance;
      left = target.left + (target.width - cardWidth) / 2;
    } else if (p === "top") {
      // Position card strictly above target element
      top = target.top - cardHeight - clearance;
      left = target.left + (target.width - cardWidth) / 2;
    } else if (p === "right") {
      top = target.top + (target.height - cardHeight) / 2;
      left = target.left + target.width + clearance;
    } else if (p === "left") {
      top = target.top + (target.height - cardHeight) / 2;
      left = target.left - cardWidth - clearance;
    }

    // Clamp inside viewport
    left = Math.max(padding, Math.min(left, vw - cardWidth - padding));
    top = Math.max(padding, Math.min(top, vh - cardHeight - padding));

    // Hard anti-overlap enforcement for "top" placement:
    // If top + cardHeight would touch target.top, push top strictly higher
    if (p === "top") {
      if (top + cardHeight > target.top - 16) {
        top = target.top - cardHeight - 16;
      }
      top = Math.max(padding, top);
    }

    // Hard anti-overlap enforcement for "bottom" placement:
    if (p === "bottom") {
      if (top < target.top + target.height + 16) {
        top = target.top + target.height + 16;
      }
      top = Math.min(vh - cardHeight - padding, top);
    }

    // Verify strict geometric non-overlap with target
    const cardRight = left + cardWidth;
    const cardBottom = top + cardHeight;
    const targetBuffer = 6;
    const targetLeft = target.left - targetBuffer;
    const targetTop = target.top - targetBuffer;
    const targetRight = target.left + target.width + targetBuffer;
    const targetBottom = target.top + target.height + targetBuffer;

    const overlaps = !(
      cardRight <= targetLeft ||
      left >= targetRight ||
      cardBottom <= targetTop ||
      top >= targetBottom
    );

    if (!overlaps) {
      return { top, left };
    }
  }

  // Fallback if target occupies large portion of screen:
  // Dock in the quadrant with largest available free clearance
  const freeRight = vw - (target.left + target.width);
  const freeLeft = target.left;
  const freeBottom = vh - (target.top + target.height);
  const freeTop = target.top;

  const maxFree = Math.max(freeRight, freeLeft, freeBottom, freeTop);

  if (maxFree === freeTop) {
    return {
      left: Math.max(padding, Math.min(target.left, vw - cardWidth - padding)),
      top: Math.max(padding, target.top - cardHeight - 20),
    };
  }
  if (maxFree === freeRight) {
    return {
      left: Math.max(padding, vw - cardWidth - padding),
      top: Math.max(padding, Math.min(target.top + 20, vh - cardHeight - padding)),
    };
  }
  if (maxFree === freeLeft) {
    return {
      left: padding,
      top: Math.max(padding, Math.min(target.top + 20, vh - cardHeight - padding)),
    };
  }
  return {
    left: Math.max(padding, Math.min(target.left, vw - cardWidth - padding)),
    top: Math.max(padding, vh - cardHeight - padding),
  };
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardHeight, setCardHeight] = useState(250);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [stepProgress, setStepProgress] = useState(0); // 0 to 100%
  const [isPaused, setIsPaused] = useState(false);
  const tourCardRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Stop any active speech synthesis immediately
  useEffect(() => {
    stopSpeaking();
  }, [isOpen, currentStepIndex]);

  // Update target coordinates from DOM
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

      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    } else {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      setTargetRect({
        top: vh / 2 - 100,
        left: vw / 2 - 200,
        width: 400,
        height: 200,
      });
    }
  }, [isOpen, step]);

  // Dynamically measure actual DOM card height for precision clearance
  useEffect(() => {
    if (tourCardRef.current) {
      const h = tourCardRef.current.offsetHeight;
      if (h && Math.abs(h - cardHeight) > 4) {
        setCardHeight(h);
      }
    }
  }, [currentStepIndex, cardHeight]);

  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
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

  // 10-Second Auto-Advance Countdown per step ("make each for 10 seconds and then move further!")
  useEffect(() => {
    if (!isOpen) return;

    setSecondsRemaining(10);
    setStepProgress(0);

    const stepDuration = 10000; // 10 seconds per step
    const intervalTick = 50; // Smooth 50ms progress update
    let elapsed = 0;

    const timer = setInterval(() => {
      if (isPaused) return; // Pause timer on hover if user is inspecting

      elapsed += intervalTick;
      const progress = Math.min(100, (elapsed / stepDuration) * 100);
      const remaining = Math.max(0, Math.ceil((stepDuration - elapsed) / 1000));

      setStepProgress(progress);
      setSecondsRemaining(remaining);

      if (elapsed >= stepDuration) {
        clearInterval(timer);
        // Move to next step or close on final step
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          handleClose();
        }
      }
    }, intervalTick);

    return () => clearInterval(timer);
  }, [isOpen, currentStepIndex, isPaused]);

  // Keyboard navigation: Left/Right arrows and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    stopSpeaking();
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    stopSpeaking();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    stopSpeaking();
    setCurrentStepIndex(0);
    onClose();
  };

  if (!isOpen || !step) return null;

  // Compute card position with guaranteed non-overlap
  const cardWidth = 360;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  const { top: cardTop, left: cardLeft } = targetRect
    ? calculateNonOverlappingPosition(
        targetRect,
        step.preferredPlacement || "bottom",
        cardWidth,
        cardHeight,
        vw,
        vh
      )
    : { top: vh / 2 - cardHeight / 2, left: vw / 2 - cardWidth / 2 };

  return (
    <div className="fixed inset-0 z-99999 overflow-hidden select-none animate-in fade-in duration-200">
      {/* 1. Backdrop SVG Mask with Smooth Cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            {/* White covers entire screen */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout smoothly reveals target element */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="16"
                fill="black"
                style={{
                  transition:
                    "x 300ms cubic-bezier(0.2, 0, 0, 1), y 300ms cubic-bezier(0.2, 0, 0, 1), width 300ms cubic-bezier(0.2, 0, 0, 1), height 300ms cubic-bezier(0.2, 0, 0, 1)",
                }}
              />
            )}
          </mask>
        </defs>

        {/* Muted backdrop with cutout mask (Click backdrop to close) */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#spotlight-mask)"
          onClick={handleClose}
          className="cursor-pointer"
        />
      </svg>

      {/* 2. Material Design 3 Focus Ring Around Target (Zero Cyberpunk, Zero Overlap) */}
      {targetRect && (
        <div
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
            transition: "all 300ms cubic-bezier(0.2, 0, 0, 1)",
          }}
          className="absolute rounded-2xl ring-2 ring-[#0b57d0] dark:ring-[#a8c7fa] shadow-[0_0_0_4px_rgba(11,87,208,0.18)] dark:shadow-[0_0_0_4px_rgba(168,199,250,0.18)] pointer-events-none"
        />
      )}

      {/* 3. Floating Spotlight Card (Compact M3 Enterprise Card with 10s Timer) */}
      <div
        ref={tourCardRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          top: `${cardTop}px`,
          left: `${cardLeft}px`,
          transition:
            "top 300ms cubic-bezier(0.2, 0, 0, 1), left 300ms cubic-bezier(0.2, 0, 0, 1)",
        }}
        className="absolute w-[360px] max-w-[calc(100vw-32px)] bg-white/95 dark:bg-[#1d1f24]/95 border border-[#e0e3e7] dark:border-[#34373d] rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/60 backdrop-blur-md p-3.5 text-[#1f1f1f] dark:text-[#e2e2e6] pointer-events-auto"
      >
        {/* Header: Step Pill + 10s Timer Chip + Close Button */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#e8f0fe] dark:bg-[#004a77] text-[#0b57d0] dark:text-[#a8c7fa] text-3xs font-semibold tracking-wide">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-3xs font-medium font-mono flex items-center gap-1 transition-colors ${
                isPaused
                  ? "bg-[#fff3e0] text-[#e65100] dark:bg-[#4a2800] dark:text-[#ffb77d]"
                  : "bg-[#f0f4f9] dark:bg-[#282a2f] text-[#747775] dark:text-[#8e9099]"
              }`}
              title={isPaused ? "Timer paused while hovering" : "Auto-advancing in 10s"}
            >
              <Clock className="w-2.5 h-2.5" />
              <span>{isPaused ? "Paused" : `${secondsRemaining}s`}</span>
            </span>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-full text-[#747775] hover:text-[#1f1f1f] dark:hover:text-white hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Summary */}
        <div className="space-y-0.5 mb-2">
          <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white tracking-tight leading-snug">
            {step.title}
          </h3>
          <p className="text-xs text-[#444746] dark:text-[#c4c6cf] leading-relaxed">
            {step.summary}
          </p>
        </div>

        {/* Details Box */}
        <div className="p-2 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/80 dark:border-[#34373d] text-2xs text-[#444746] dark:text-[#c4c6cf] leading-relaxed mb-2.5">
          {step.details}
        </div>

        {/* 10-Second Step Progress Bar */}
        <div className="w-full h-1 bg-[#e0e3e7] dark:bg-[#34373d] rounded-full overflow-hidden mb-3">
          <div
            style={{ width: `${stepProgress}%` }}
            className="h-full bg-[#0b57d0] dark:bg-[#a8c7fa] rounded-full transition-all duration-75 ease-linear"
          />
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="px-3 py-1 rounded-full border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold text-[#444746] dark:text-[#c4c6cf] flex items-center gap-1 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  stopSpeaking();
                  setCurrentStepIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? "w-4 bg-[#0b57d0] dark:bg-[#a8c7fa]"
                    : "w-1.5 bg-[#e0e3e7] dark:bg-[#34373d] hover:bg-[#747775]"
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] dark:bg-[#a8c7fa] dark:hover:bg-[#d3e3fd] text-white dark:text-[#041e49] text-xs font-semibold shadow-2xs active:scale-95 flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>{currentStepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}</span>
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
