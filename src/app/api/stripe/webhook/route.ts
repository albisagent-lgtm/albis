import { NextRequest, NextResponse } from "next/server";
import { PRICE_TO_TIER } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Stripe webhook handler — Package 7 expansion.
//
// Event coverage:
//   checkout.session.completed       → first-time activation (link customer
//                                      to userId, persist subscription state)
//   customer.subscription.created    → mirror state (defensive: should be
//                                      covered by checkout.session.completed
//                                      already, but Stripe sends both)
//   customer.subscription.updated    → status / tier / period_end / trial
//   customer.subscription.deleted    → mark canceled
//   invoice.payment_succeeded        → refresh period_end (subscription
//                                      renewed cleanly)
//   invoice.payment_failed           → flip status to past_due so the
//                                      30-day grace period kicks in
//
// trial_end_at gets populated whenever Stripe reports trial_end on the
// subscription, so the dashboard's daysRemainingInTrial() helper works
// for users whose trial originates from Stripe (and not just from the
// internal /api/onboarding/complete bootstrap).
// ---------------------------------------------------------------------------

function verifySignature(
  payload: string,
  sig: string,
  secret: string,
): boolean {
  const parts = sig.split(",").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      acc[key.trim()] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

async function stripeGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  return res.json();
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  trial_end?: number | null;
  current_period_end?: number | null;
  items?: { data?: Array<{ price?: { id?: string } }> };
}

function tsToIso(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

function tierForPriceId(priceId: string | undefined) {
  if (!priceId) return null;
  return PRICE_TO_TIER[priceId] || null;
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function applySubscriptionToProfile(
  supabase: AdminClient,
  subscription: StripeSubscription,
  opts: { userId?: string | null } = {},
) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tierInfo = tierForPriceId(priceId);
  const periodEnd = tsToIso(subscription.current_period_end);
  const trialEnd = tsToIso(subscription.trial_end);

  if (!tierInfo) {
    console.error("Stripe subscription used an unmapped price ID", {
      subscription_id: subscription.id,
      customer: subscription.customer,
      price_id: priceId || null,
    });
  }

  const update = {
    subscription_status: subscription.status,
    ...(tierInfo ? { subscription_tier: tierInfo.tier } : {}),
    subscription_period_end: periodEnd,
    trial_end_at: trialEnd,
  };

  // Prefer userId-targeted upsert (sets stripe_customer_id atomically) when
  // we have it; otherwise fall back to a customer-id update.
  if (opts.userId) {
    await supabase.from("profiles").upsert(
      {
        id: opts.userId,
        stripe_customer_id: subscription.customer,
        ...update,
      },
      { onConflict: "id" },
    );
  } else {
    await supabase
      .from("profiles")
      .update(update)
      .eq("stripe_customer_id", subscription.customer);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing signature or secret" },
      { status: 400 },
    );
  }

  if (!verifySignature(body, sig, process.env.STRIPE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id;
      if (!userId || !session.subscription) break;

      const subscription = (await stripeGet(
        `/subscriptions/${session.subscription}`,
      )) as unknown as StripeSubscription;
      await applySubscriptionToProfile(supabase, subscription, { userId });
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as StripeSubscription;
      await applySubscriptionToProfile(supabase, subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as StripeSubscription;
      const periodEnd = tsToIso(subscription.current_period_end);
      await supabase
        .from("profiles")
        .update({
          subscription_status: "canceled",
          subscription_tier: null,
          subscription_period_end: periodEnd,
          trial_end_at: null,
        })
        .eq("stripe_customer_id", subscription.customer);
      break;
    }

    case "invoice.payment_succeeded": {
      // Renewal landed cleanly — refresh state from the linked subscription.
      const invoice = event.data.object as { subscription?: string | null };
      if (!invoice.subscription) break;
      const subscription = (await stripeGet(
        `/subscriptions/${invoice.subscription}`,
      )) as unknown as StripeSubscription;
      await applySubscriptionToProfile(supabase, subscription);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as {
        subscription?: string | null;
        customer?: string;
      };
      if (!invoice.customer) break;
      // Stripe will normally also send a subscription.updated with
      // status='past_due', but writing it explicitly here means the grace
      // period clock starts even if that follow-up event is delayed.
      await supabase
        .from("profiles")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", invoice.customer);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
