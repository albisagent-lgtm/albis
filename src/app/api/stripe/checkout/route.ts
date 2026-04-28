import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/stripe/checkout — Package 7 hardening.
//
// Changes vs the pre-Pkg-7 version:
//   - userId is taken from the authenticated session, never from the request
//     body (was a privilege-escalation hole).
//   - If the user already has a stripe_customer_id we reuse it via the
//     `customer` param so Stripe doesn't keep creating duplicate Customers.
//   - For users in pre-paid / trial state (subscription_status null or
//     'trialing'), we send subscription_data[trial_period_days]=7 so they
//     get the same 7-day window as the internal bootstrap.
// ---------------------------------------------------------------------------

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.albis.news";
const TRIAL_DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();
    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, subscription_status")
      .eq("id", user.id)
      .single();

    const reusableCustomer = profile?.stripe_customer_id || null;
    const eligibleForTrial =
      !profile ||
      profile.subscription_status === null ||
      profile.subscription_status === "trialing";

    const params = new URLSearchParams({
      mode: "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${siteUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
      client_reference_id: user.id,
      "metadata[userId]": user.id,
    });

    if (reusableCustomer) {
      params.set("customer", reusableCustomer);
    } else if (user.email) {
      params.set("customer_email", user.email);
    }

    if (eligibleForTrial) {
      params.set("subscription_data[trial_period_days]", String(TRIAL_DAYS));
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Stripe API error:", data);
      return NextResponse.json({ error: data.error?.message || "Stripe error" }, { status: 500 });
    }

    return NextResponse.json({ url: data.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
