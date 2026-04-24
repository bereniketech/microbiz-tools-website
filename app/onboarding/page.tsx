"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Step 2 state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);

  // Step 3 state
  const [invoiceTitle, setInvoiceTitle] = useState("First invoice");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  async function saveProfile() {
    setError(null);
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired"); setIsLoading(false); return; }

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName || null,
      business_name: businessName || null,
    });

    setIsLoading(false);
    if (upsertError) { setError(upsertError.message); return; }
    setStep(2);
  }

  async function saveClient() {
    setError(null);
    if (!clientName.trim()) { setStep(3); return; } // allow skip
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired"); setIsLoading(false); return; }

    const { data, error: insertError } = await supabase.from("clients").insert({
      user_id: user.id,
      name: clientName,
      email: clientEmail || null,
    }).select("id").single();

    setIsLoading(false);
    if (insertError) { setError(insertError.message); return; }
    setCreatedClientId(data?.id ?? null);
    setStep(3);
  }

  async function saveInvoice() {
    setError(null);
    if (!invoiceTitle.trim() || !invoiceAmount) { setStep(4); return; } // allow skip
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired"); setIsLoading(false); return; }

    const { error: insertError } = await supabase.from("invoices").insert({
      user_id: user.id,
      client_id: createdClientId,
      invoice_number: `INV-001`,
      total_amount: parseFloat(invoiceAmount),
      status: "pending",
      currency: "USD",
    });

    setIsLoading(false);
    if (insertError) { setError(insertError.message); return; }
    setStep(4);
  }

  async function completeOnboarding() {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        onboarding_completed: true,
      });
    }
    setIsLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  const steps = ["Profile", "First Client", "First Invoice", "Done"];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex gap-1 mb-2">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${i + 1 <= step ? "bg-primary" : "bg-muted"}`} />
              {i < steps.length - 1 && <div className="h-px w-4 bg-muted" />}
            </div>
          ))}
        </div>
        <CardTitle>
          {step === 1 && "Set up your profile"}
          {step === 2 && "Add your first client"}
          {step === 3 && "Create your first invoice"}
          {step === 4 && "You're all set!"}
        </CardTitle>
        <CardDescription>Step {step} of 4</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {step === 1 && (
          <>
            <div className="space-y-1">
              <Label htmlFor="displayName">Your name</Label>
              <Input id="displayName" placeholder="Jane Smith" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="businessName">Business name (optional)</Label>
              <Input id="businessName" placeholder="Jane Smith Consulting" value={businessName} onChange={e => setBusinessName(e.target.value)} />
            </div>
            <Button className="w-full" onClick={saveProfile} disabled={isLoading}>
              {isLoading ? "Saving…" : "Continue"}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-1">
              <Label htmlFor="clientName">Client name</Label>
              <Input id="clientName" placeholder="Acme Corp" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientEmail">Client email (optional)</Label>
              <Input id="clientEmail" type="email" placeholder="contact@acme.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Skip</Button>
              <Button className="flex-1" onClick={saveClient} disabled={isLoading}>
                {isLoading ? "Saving…" : "Add Client"}
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-1">
              <Label htmlFor="invoiceTitle">Invoice description</Label>
              <Input id="invoiceTitle" value={invoiceTitle} onChange={e => setInvoiceTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invoiceAmount">Amount (USD)</Label>
              <Input id="invoiceAmount" type="number" min="0" step="0.01" placeholder="500.00" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(4)}>Skip</Button>
              <Button className="flex-1" onClick={saveInvoice} disabled={isLoading}>
                {isLoading ? "Saving…" : "Create Invoice"}
              </Button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-muted-foreground text-sm">Your workspace is ready. Head to the dashboard to start managing your business.</p>
            <Button className="w-full" onClick={completeOnboarding} disabled={isLoading}>
              {isLoading ? "Loading…" : "Go to Dashboard"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
