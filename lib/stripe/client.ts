import Stripe from "stripe";

// Defer instantiation so build-time static analysis doesn't throw.
// The env var is required at runtime — validated when stripe is first called.
function createStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" as const, typescript: true });
}

let _stripe: Stripe | null = null;

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) _stripe = createStripeClient();
    return (_stripe as unknown as Record<string | symbol, unknown>)[prop];
  },
});
