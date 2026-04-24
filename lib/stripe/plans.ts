export type PlanName = "free" | "pro" | "business";

export interface PlanConfig {
  name: PlanName;
  displayName: string;
  priceId: string | null;
  limits: {
    leads: number;       // -1 = unlimited
    clients: number;
    invoices: number;
    proposals: number;
  };
}

export const PLANS: Record<PlanName, PlanConfig> = {
  free: {
    name: "free",
    displayName: "Free",
    priceId: null,
    limits: {
      leads: 10,
      clients: 5,
      invoices: 10,
      proposals: 5,
    },
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    priceId: process.env.STRIPE_PRO_PLAN_PRICE_ID ?? null,
    limits: {
      leads: 100,
      clients: 50,
      invoices: 100,
      proposals: 50,
    },
  },
  business: {
    name: "business",
    displayName: "Business",
    priceId: process.env.STRIPE_BUSINESS_PLAN_PRICE_ID ?? null,
    limits: {
      leads: -1,
      clients: -1,
      invoices: -1,
      proposals: -1,
    },
  },
};

export type LimitableResource = keyof PlanConfig["limits"];
