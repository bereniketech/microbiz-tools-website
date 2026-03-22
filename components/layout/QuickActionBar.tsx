"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function QuickActionBar() {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  function onLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAddLeadOpen(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <Button size="sm" onClick={() => setIsAddLeadOpen(true)}>
          Add Lead
        </Button>
        <Link href="/invoices/new" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
          Create Invoice
        </Link>
        <Link href="/proposals/new" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
          Send Proposal
        </Link>
      </div>

      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border bg-background p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Add Lead</h2>
            <p className="mt-1 text-sm text-muted-foreground">Capture a lead quickly and return to work.</p>
            <form className="mt-4 space-y-3" onSubmit={onLeadSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="lead-name">Lead Name</Label>
                <Input id="lead-name" name="name" placeholder="Client or company name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-email">Email</Label>
                <Input id="lead-email" name="email" placeholder="contact@example.com" type="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-service">Service Needed</Label>
                <Input id="lead-service" name="service" placeholder="Website redesign, SEO, etc." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddLeadOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Lead</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
