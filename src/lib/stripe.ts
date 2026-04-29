import Stripe from "stripe";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
  });
}

// ---------------------------------------------------------------------------
// Price ID → Tier mapping.
//
// Current live Company Daily Scan prices in Stripe:
// - Pro: $49/mo or $468/year
// - Team: $99/mo or $948/year
// - Company Intelligence: $199/mo or $1,908/year
// ---------------------------------------------------------------------------
export const PRICE_TO_TIER: Record<
  string,
  { tier: string; period: "monthly" | "annual" }
> = {
  // Pro tier
  price_1TRg8BLUymhPvjeE6lDEif43: { tier: "pro", period: "monthly" },
  price_1TRg91LUymhPvjeE06NDZx4Z: { tier: "pro", period: "annual" },

  // Team tier
  price_1TRgAYLUymhPvjeEZm0jbUVy: { tier: "team", period: "monthly" },
  price_1TRgBKLUymhPvjeEhLfPFhXx: { tier: "team", period: "annual" },

  // Company Intelligence tier
  price_1TRgDyLUymhPvjeEqiNElMkV: {
    tier: "company_intelligence",
    period: "monthly",
  },
  price_1TRgDyLUymhPvjeEgcU7dC8s: {
    tier: "company_intelligence",
    period: "annual",
  },
};

// ---------------------------------------------------------------------------
// Tier → Price ID mapping for checkout.
// ---------------------------------------------------------------------------
export const TIER_TO_PRICE: Record<
  string,
  { monthly: string; annual: string }
> = {
  pro: {
    monthly: "price_1TRg8BLUymhPvjeE6lDEif43",
    annual: "price_1TRg91LUymhPvjeE06NDZx4Z",
  },
  team: {
    monthly: "price_1TRgAYLUymhPvjeEZm0jbUVy",
    annual: "price_1TRgBKLUymhPvjeEhLfPFhXx",
  },
  company_intelligence: {
    monthly: "price_1TRgDyLUymhPvjeEqiNElMkV",
    annual: "price_1TRgDyLUymhPvjeEgcU7dC8s",
  },
};
