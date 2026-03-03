import { NextRequest, NextResponse } from "next/server";
import { PRICE_TO_TIER } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

function verifySignature(payload: string, sig: string, secret: string): boolean {
  const parts = sig.split(",").reduce((acc, part) => {
    const [key, value] = part.split("=");
    acc[key.trim()] = value;
    return acc;
  }, {} as Record<string, string>);

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

async function stripeGet(path: string): Promise<any> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
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

      const subscription = await stripeGet(`/subscriptions/${session.subscription}`);
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const tierInfo = PRICE_TO_TIER[priceId] || { tier: "standard", period: "monthly" };
      const periodEnd = subscription.current_period_end;

      await supabase.from("profiles").upsert(
        {
          id: userId,
          stripe_customer_id: session.customer,
          subscription_status: subscription.status,
          subscription_tier: tierInfo.tier,
          subscription_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
        },
        { onConflict: "id" }
      );
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const tierInfo = PRICE_TO_TIER[priceId] || { tier: "standard", period: "monthly" };
      const periodEnd = subscription.current_period_end;

      await supabase
        .from("profiles")
        .update({
          subscription_status: subscription.status,
          subscription_tier: tierInfo.tier,
          subscription_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const periodEnd = subscription.current_period_end;

      await supabase
        .from("profiles")
        .update({
          subscription_status: "canceled",
          subscription_tier: null,
          subscription_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
