import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars not set");
  return createSupabaseClient(url, key);
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  const rawBody = await request.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const customerId = session.customer as string;

      if (userId && customerId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;

        // Determine plan from priceId
        let plan = "free";
        if (priceId === process.env.STRIPE_PRO_PLAN_PRICE_ID) plan = "pro";
        if (priceId === process.env.STRIPE_BUSINESS_PLAN_PRICE_ID) plan = "business";

        // Get workspace for user
        const { data: member } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", userId)
          .limit(1)
          .single();

        if (member?.workspace_id) {
          await supabase.from("subscriptions").upsert({
            workspace_id: member.workspace_id,
            stripe_customer_id: customerId,
            stripe_subscription_id: session.subscription as string,
            plan,
            status: "active",
            current_period_end: new Date(subscription.billing_cycle_anchor * 1000).toISOString(),
          }, { onConflict: "workspace_id" });
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await supabase
        .from("subscriptions")
        .update({ plan: "free", status: "canceled" })
        .eq("stripe_customer_id", customerId);
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0]?.price.id;

      let plan = "free";
      if (priceId === process.env.STRIPE_PRO_PLAN_PRICE_ID) plan = "pro";
      if (priceId === process.env.STRIPE_BUSINESS_PLAN_PRICE_ID) plan = "business";

      await supabase
        .from("subscriptions")
        .update({
          plan,
          status: subscription.status,
          current_period_end: new Date(subscription.billing_cycle_anchor * 1000).toISOString(),
        })
        .eq("stripe_customer_id", customerId);
    }

    console.log(`Webhook processed: ${event.type} ${event.id}`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
