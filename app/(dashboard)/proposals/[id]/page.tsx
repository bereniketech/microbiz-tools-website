"use client";

import { useState } from "react";
import { ProposalEditor } from "@/components/proposals/ProposalEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  const [sendEmail, setSendEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  async function handleSendProposal() {
    if (!sendEmail) return;
    setSendError(null);
    setIsSending(true);
    const res = await fetch(`/api/proposals/${params.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientEmail: sendEmail }),
    });
    const json = await res.json();
    setIsSending(false);
    if (!res.ok) { setSendError(json.error ?? "Failed to send proposal"); return; }
    setSendSuccess(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          type="email"
          placeholder="recipient@example.com"
          value={sendEmail}
          onChange={e => setSendEmail(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleSendProposal} disabled={isSending || !sendEmail}>
          {isSending ? "Sending…" : "Send Proposal"}
        </Button>
        {sendError && <p className="text-sm text-destructive">{sendError}</p>}
        {sendSuccess && <p className="text-sm text-emerald-700">Proposal sent!</p>}
      </div>
      <ProposalEditor proposalId={params.id} />
    </div>
  );
}
