"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const actions = [
  { label: "Add Lead", href: "/leads-clients" },
  { label: "Send Proposal", href: "/proposals/new" },
  { label: "Create Invoice", href: "/invoices/new" },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
