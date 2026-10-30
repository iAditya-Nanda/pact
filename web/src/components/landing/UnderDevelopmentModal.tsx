"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Clock, Cpu, ExternalLink } from "lucide-react";

export interface UnderDevelopmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnderDevelopmentModal: React.FC<UnderDevelopmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-[#d3e3fd] text-[#0b57d0] flex items-center justify-center mb-4">
          <Cpu className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-semibold text-[#1f1f1f] mb-2">
          Workspace Under Development
        </h3>

        <p className="text-sm text-[#444746] leading-relaxed mb-6">
          The PACT Executive Workspace is currently being integrated with the local
          C++ inference engine, LangGraph state machine, and Google Workspace
          connectors.
        </p>

        <div className="w-full bg-[#f0f4f9] rounded-xl p-4 mb-6 text-left border border-[#e0e3e7]/60">
          <div className="text-xs font-semibold text-[#747775] uppercase tracking-wider mb-3">
            Implementation Status
          </div>
          <div className="space-y-2.5 text-xs text-[#1f1f1f]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#146c2e] shrink-0" />
              <span>M3 Enterprise Design System (Outfit + Tonal Tokens)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#146c2e] shrink-0" />
              <span>Local Supabase Database Stack (PostgreSQL 17)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#b06000] shrink-0" />
              <span className="font-medium text-[#b06000]">
                LangGraph State Machine & Tool Execution (In Progress)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#747775] shrink-0" />
              <span className="text-[#747775]">
                Embedded Google Workspace Cockpit (Queued)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.open(
                "https://github.com/iAditya-Nanda/pact/blob/main/docs/PRODUCT_SPEC_AND_SYSTEM_ARCHITECTURE.md",
                "_blank"
              );
            }}
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            Review Architecture
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Acknowledge
          </Button>
        </div>
      </div>
    </Modal>
  );
};
