"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BriefcaseBusiness, CircleDollarSign, ClipboardList, FileText, HandCoins, LayoutDashboard, MessageSquareText, Settings, Users } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

export interface SidebarItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads & Clients", href: "/leads", icon: Users },
  { label: "Follow-Ups", href: "/follow-ups", icon: MessageSquareText },
  { label: "Proposals", href: "/proposals", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: ClipboardList },
  { label: "Tasks", href: "/tasks", icon: BriefcaseBusiness },
  { label: "Income", href: "/income", icon: HandCoins },
  { label: "Snippets", href: "/snippets", icon: CircleDollarSign },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 flex-col border-r bg-card/40 p-4">
      <div className="mb-6 px-2">
        <h1 className="text-lg font-semibold">MicroBiz Toolbox</h1>
        <p className="text-sm text-muted-foreground">Run your freelancing workflow.</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
