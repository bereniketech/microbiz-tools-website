"use client";

import { FormEvent, useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuickAddLeadModalProps {
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  onLeadCreated?: () => void;
}

interface FieldErrors {
  name?: string;
  contact?: string;
  estimated_value?: string;
}

export function QuickAddLeadModal({
  triggerLabel = "Add Lead",
  triggerVariant = "default",
  triggerSize = "sm",
  onLeadCreated,
}: QuickAddLeadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [service, setService] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function resetForm() {
    setName("");
    setContact("");
    setService("");
    setEstimatedValue("");
    setErrors({});
    setSubmitError(null);
  }

  function closeModal() {
    setIsOpen(false);
    resetForm();
  }

  function validateClientSide(): boolean {
    const nextErrors: FieldErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (!contact.trim()) {
      nextErrors.contact = "Contact is required";
    }

    if (estimatedValue && Number.isNaN(Number(estimatedValue))) {
      nextErrors.estimated_value = "Estimated value must be a number";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!validateClientSide()) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          service: service.trim() || undefined,
          estimated_value: estimatedValue.trim() || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const details = payload?.error?.details as Array<{ field: string; message: string }> | undefined;

        if (Array.isArray(details)) {
          const nextErrors: FieldErrors = {};

          for (const detail of details) {
            if (detail.field === "name") nextErrors.name = detail.message;
            if (detail.field === "contact") nextErrors.contact = detail.message;
            if (detail.field === "estimated_value") nextErrors.estimated_value = detail.message;
          }

          if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
          }
        }

        setSubmitError(payload?.error?.message ?? "Lead could not be created.");
        return;
      }

      closeModal();
      onLeadCreated?.();
    } catch {
      setSubmitError("Lead could not be created.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button size={triggerSize} variant={triggerVariant} onClick={() => setIsOpen(true)}>
        {triggerLabel}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border bg-background p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Quick Add Lead</h2>
            <p className="mt-1 text-sm text-muted-foreground">Name and contact are required to save a lead.</p>

            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="quick-add-name">Name</Label>
                <Input id="quick-add-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Client or company name" />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-add-contact">Contact</Label>
                <Input id="quick-add-contact" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Email or phone number" />
                {errors.contact && <p className="text-xs text-destructive">{errors.contact}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-add-service">Service</Label>
                <Input id="quick-add-service" value={service} onChange={(event) => setService(event.target.value)} placeholder="Optional" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-add-estimated-value">Estimated Value</Label>
                <Input
                  id="quick-add-estimated-value"
                  value={estimatedValue}
                  onChange={(event) => setEstimatedValue(event.target.value)}
                  inputMode="decimal"
                  placeholder="Optional"
                />
                {errors.estimated_value && <p className="text-xs text-destructive">{errors.estimated_value}</p>}
              </div>

              {submitError && <p className="text-sm text-destructive">{submitError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Lead"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
