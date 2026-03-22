"use client";

import Link from "next/link";

import { QuickAddLeadModal } from "@/components/leads/QuickAddLeadModal";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuickActionBar() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
      <QuickAddLeadModal />
      <Link href="/invoices/new" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
        Create Invoice
      </Link>
      <Link href="/proposals/new" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
        Send Proposal
      </Link>
    </div>
  );
}
