import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TIER_TO_PRICE } from "@/lib/stripe";

// ---------------------------------------------------------------------------
// POST /api/stripe/checkout — Package 7 hardening.
//
// Changes vs the pre-Pkg-7 version:
//   - userId is taken from the authenticated session, never from the request
//     body (was a privilege-escalation hole).
//   - If the user already has a stripe_customer_id we reuse it via the
//     `customer` param so Stripe doesn't keep creating duplicate Customers.
//   - For users with no subscription state yet, we send
//     subscription_data[trial_period_days]=3.
//   - Users already in the no-card onboarding trial can add payment here;
//     checkout starts the paid subscription instead of extending another trial.
// ---------------------------------------------------------------------------

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.albis.news";
const TRIAL_DAYS = 3;

export async function POST(req: NextRequest) {
  try {
    const { priceId, tier, billing = "monthly" } = await req.json();
    const billingPeriod: "monthly" | "annual" | null =
      billing === "monthly" || billing === "annual" ? billing : null;
    const mappedPriceId =
      typeof tier === "string" && billingPeriod
        ? TIER_TO_PRICE[tier]?.[billingPeriod]
        : null;
    const finalPriceId = mappedPriceId || priceId;
    if (!finalPriceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    if (String(finalPriceId).includes("placeholder")) {
      return NextResponse.json(
        {
          error:
            "Stripe price IDs are not configured yet. Create live/test prices in Stripe and update src/lib/stripe.ts before checkout can be used.",
        },
        { status: 503 },
      );
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 },
      );
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
    const eligibleForStripeTrial =
      !profile || profile.subscription_status === null;

    const params = new URLSearchParams({
      mode: "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price]": finalPriceId,
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

    if (eligibleForStripeTrial) {
      params.set("subscription_data[trial_period_days]", String(TRIAL_DAYS));
    }

    const response = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Stripe API error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Stripe error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
