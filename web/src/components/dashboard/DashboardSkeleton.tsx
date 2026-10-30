"use client";

import React from "react";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafd] dark:bg-[#111318] text-[#1f1f1f] dark:text-[#e2e2e6] font-sans transition-colors duration-300">
      {/* 1. Header Skeleton */}
      <header className="h-14 lg:h-16 border-b border-[#e0e3e7] dark:border-[#34373d] px-4 lg:px-6 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#1d1f24]/80 backdrop-blur-md">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0b57d0]/20 dark:bg-[#a8c7fa]/20 animate-pulse flex items-center justify-center">
            <div className="w-4 h-4 rounded bg-[#0b57d0]/40 dark:bg-[#a8c7fa]/40" />
          </div>
          <div className="h-4 w-44 rounded-md bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
        </div>

        {/* Center / Status info */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d]">
          <span className="w-2 h-2 rounded-full bg-[#0b57d0] dark:bg-[#a8c7fa] animate-ping" />
          <span className="text-xs font-medium text-[#747775] dark:text-[#8e9099]">
            Checking Google Workspace connection...
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
        </div>
      </header>

      {/* 2. Main Content Skeleton */}
      <main className="flex-1 flex flex-col justify-between px-4 lg:px-6 py-3.5 lg:py-4 gap-3 lg:gap-3.5 overflow-hidden">
        {/* Upper Row: 60% Left Cards + 40% Right Executive Panel */}
        <div className="flex flex-col lg:flex-row gap-3.5 lg:gap-4 items-stretch flex-1 min-h-0">
          {/* 3 Metric Cards (60% Width) */}
          <div className="w-full lg:w-[60%] grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-3.5 min-h-0">
            {/* Card 1: Gmail */}
            <div className="border border-[#e0e3e7] dark:border-[#34373d] rounded-2xl bg-white dark:bg-[#1d1f24] p-4 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e3e7]/80 dark:border-[#34373d]">
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 rounded-md bg-[#ea4335]/20 animate-pulse" />
                    <div className="h-3.5 w-24 rounded bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                  </div>
                  <div className="h-3 w-14 rounded-full bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                </div>

                <div className="my-3 bg-[#f8fafd] dark:bg-[#282a2f] p-3.5 rounded-2xl border border-[#e0e3e7]/80 dark:border-[#34373d] flex flex-col items-center justify-center">
                  <div className="h-9 w-16 rounded-lg bg-[#e0e3e7] dark:bg-[#34373d] animate-pulse mb-1.5" />
                  <div className="h-3 w-32 rounded bg-[#e0e3e7] dark:bg-[#34373d] animate-pulse" />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="h-8 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/70 dark:border-[#34373d] animate-pulse" />
                  <div className="h-8 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/70 dark:border-[#34373d] animate-pulse" />
                  <div className="h-10 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/70 dark:border-[#34373d] animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-full mt-3 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
            </div>

            {/* Card 2: Calendar */}
            <div className="border border-[#e0e3e7] dark:border-[#34373d] rounded-2xl bg-white dark:bg-[#1d1f24] p-4 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e3e7]/80 dark:border-[#34373d]">
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 rounded-md bg-[#4285f4]/20 animate-pulse" />
                    <div className="h-3.5 w-24 rounded bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                  </div>
                  <div className="h-3 w-14 rounded-full bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                </div>

                <div className="my-3 bg-[#f8fafd] dark:bg-[#282a2f] p-3.5 rounded-2xl border border-[#e0e3e7]/80 dark:border-[#34373d] flex flex-col items-center justify-center">
                  <div className="h-9 w-16 rounded-lg bg-[#e0e3e7] dark:bg-[#34373d] animate-pulse mb-1.5" />
                  <div className="h-3 w-32 rounded bg-[#e0e3e7] dark:bg-[#34373d] animate-pulse" />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="h-8 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/70 dark:border-[#34373d] animate-pulse" />
                  <div className="h-8 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/70 dark:border-[#34373d] animate-pulse" />
                  <div className="h-10 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/70 dark:border-[#34373d] animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-full mt-3 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
            </div>

            {/* Card 3: Tasks */}
            <div className="border border-[#e0e3e7] dark:border-[#34373d] rounded-2xl bg-white dark:bg-[#1d1f24] p-4 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e3e7]/80 dark:border-[#34373d]">
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 rounded-md bg-[#34a853]/20 animate-pulse" />
                    <div className="h-3.5 w-24 rounded bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                  </div>
                  <div className="h-3 w-14 rounded-full bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                </div>

                <div className="my-3 bg-[#f8fafd] dark:bg-[#282a2f] p-3.5 rounded-2xl border border-[#e0e3e7]/80 dark:border-[#34373d] flex flex-col items-center justify-center">
                  <div className="h-9 w-16 rounded-lg bg-[#e0e3e7] dark:bg-[#34373d] animate-pulse mb-1.5" />
                  <div className="h-3 w-32 rounded bg-[#e0e3e7] dark:bg-[#34373d] animate-pulse" />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="h-8 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/70 dark:border-[#34373d] animate-pulse" />
                  <div className="h-8 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/70 dark:border-[#34373d] animate-pulse" />
                  <div className="h-10 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/70 dark:border-[#34373d] animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-full mt-3 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
            </div>
          </div>

          {/* Right Executive Panel (40% Width) */}
          <div className="w-full lg:w-[40%] flex flex-col justify-between gap-3 lg:gap-3.5 min-h-0">
            {/* User Profile Card */}
            <div className="p-4 rounded-2xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] shadow-xs">
              <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-5">
                {/* 120px Avatar Circle */}
                <div className="w-[120px] h-[120px] rounded-full bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse shrink-0 border-2 border-[#e0e3e7] dark:border-[#34373d]" />
                <div className="flex-1 w-full flex flex-col gap-2">
                  <div className="h-6 w-3/4 rounded-md bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-24 rounded-full bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                    <div className="h-4 w-12 rounded bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                  </div>
                  <div className="h-3.5 w-40 rounded bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                  <div className="h-6 w-28 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse mt-1" />
                </div>
              </div>
            </div>

            {/* AI Recommendations Card */}
            <div className="border border-[#e0e3e7] dark:border-[#34373d] rounded-2xl bg-white dark:bg-[#1d1f24] p-3.5 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 w-36 rounded bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                  <div className="h-4 w-16 rounded-full bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                </div>
                <div className="h-14 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7]/80 dark:border-[#34373d] animate-pulse" />
              </div>

              <div className="pt-2 border-t border-[#e0e3e7]/80 dark:border-[#34373d] flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                <div className="h-5 w-9 rounded-full bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
              </div>

              <div className="pt-2 border-t border-[#e0e3e7]/80 dark:border-[#34373d]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="h-3.5 w-24 rounded bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                  <div className="h-3 w-28 rounded bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7] dark:border-[#34373d] animate-pulse" />
                  <div className="h-10 rounded-xl bg-[#f8fafd] dark:bg-[#282a2f] border border-[#e0e3e7] dark:border-[#34373d] animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Row Skeleton */}
        <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-4 shrink-0">
          {/* Bottom Left Apps Dock */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
            <div className="w-9 h-9 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
            <div className="w-9 h-9 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
            <div className="w-9 h-9 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
          </div>

          {/* Bottom Middle Chat Input */}
          <div className="w-full flex-1 border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] rounded-2xl p-2.5 lg:p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse shrink-0" />
              <div className="flex-1 h-7 rounded-lg bg-[#f8fafd] dark:bg-[#282a2f] animate-pulse" />
              <div className="w-8 h-8 rounded-full bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-3 w-16 rounded bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
              <div className="h-5 w-28 rounded-full bg-[#f0f4f9] dark:bg-[#282a2f] animate-pulse" />
              <div className="h-5 w-24 rounded-full bg-[#f0f4f9] dark:bg-[#282a2f] animate-pulse" />
              <div className="h-5 w-24 rounded-full bg-[#f0f4f9] dark:bg-[#282a2f] animate-pulse" />
            </div>
          </div>

          {/* Bottom Right Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-10 w-24 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
            <div className="h-10 w-20 rounded-xl bg-[#e0e3e7] dark:bg-[#282a2f] animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
};
