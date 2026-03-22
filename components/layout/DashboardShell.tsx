"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { QuickActionBar } from "@/components/layout/QuickActionBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-modal="true">
            <button
              className="absolute inset-0 bg-foreground/20"
              onClick={() => setIsMobileSidebarOpen(false)}
              type="button"
            />
            <div className="relative h-full w-72 bg-background shadow-xl">
              <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <TopBar onToggleSidebar={() => setIsMobileSidebarOpen((isOpen) => !isOpen)} />
          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
              <QuickActionBar />
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
