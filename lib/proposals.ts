export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected";

export interface ProposalPricingValue {
  text: string;
  amount: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseProposalPricing(value: unknown): ProposalPricingValue | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return { text: "", amount: value };
  }

  if (typeof value === "string") {
    return {
      text: value,
      amount: null,
    };
  }

  if (isRecord(value)) {
    const text = typeof value.text === "string" ? value.text : "";
    const amount = typeof value.amount === "number" && Number.isFinite(value.amount) ? value.amount : null;

    return { text, amount };
  }

  return null;
}

export function buildProposalPricing(text: string, amount: number | null): ProposalPricingValue | null {
  const normalizedText = text.trim();
  if (!normalizedText && amount === null) {
    return null;
  }

  return {
    text: normalizedText,
    amount,
  };
}

export function getProposalPricingAmount(value: unknown): number | null {
  return parseProposalPricing(value)?.amount ?? null;
}

export function getProposalPricingText(value: unknown): string {
  return parseProposalPricing(value)?.text ?? "";
}

export function formatProposalStatus(status: string): string {
  if (!status) {
    return "Draft";
  }

  return status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildProposalSharePath(token: string): string {
  return `/proposals/view/${token}`;
}

export function formatCurrency(value: number | null, currency = "USD"): string {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}