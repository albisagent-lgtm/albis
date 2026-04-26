import Stripe from "stripe";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
  });
}

// ---------------------------------------------------------------------------
// Price ID → Tier mapping
// PLACEHOLDER PRICE IDs — replace with real ones from Stripe Dashboard.
// Create products in Stripe for: Pro, Team, Company Intelligence
// Each with monthly and annual price variants.
// After creating them, replace the price_xxx IDs below.
// ---------------------------------------------------------------------------
export const PRICE_TO_TIER: Record<string, { tier: string; period: "monthly" | "annual" }> = {
  // Pro tier — $49/mo, $39/mo billed annually
  // TODO: Replace with real Stripe price IDs
  price_pro_monthly_placeholder: { tier: "pro", period: "monthly" },
  price_pro_annual_placeholder: { tier: "pro", period: "annual" },

  // Team tier — $99/mo, $79/mo billed annually
  // TODO: Replace with real Stripe price IDs
  price_team_monthly_placeholder: { tier: "team", period: "monthly" },
  price_team_annual_placeholder: { tier: "team", period: "annual" },

  // Company Intelligence tier — $199/mo, $159/mo billed annually
  // TODO: Replace with real Stripe price IDs
  price_ci_monthly_placeholder: { tier: "company_intelligence", period: "monthly" },
  price_ci_annual_placeholder: { tier: "company_intelligence", period: "annual" },

  // Legacy price IDs (keep for existing subscribers)
  price_1T3plsBBaDpCgoIEzQaADPMx: { tier: "pro", period: "monthly" },
  price_1T3ppVBBaDpCgoIEN4TExI9d: { tier: "pro", period: "annual" },
  price_1T3pnpBBaDpCgoIEpUy5Eb7p: { tier: "pro", period: "monthly" },
  price_1T3ppqBBaDpCgoIEOdikNJNx: { tier: "pro", period: "annual" },
};

// ---------------------------------------------------------------------------
// Tier → Price ID mapping (for checkout — maps tier slug to Stripe price ID)
// PLACEHOLDER — replace with real Stripe price IDs matching the above.
// ---------------------------------------------------------------------------
export const TIER_TO_PRICE: Record<string, { monthly: string; annual: string }> = {
  // TODO: Replace with real Stripe price IDs
  pro: {
    monthly: "price_pro_monthly_placeholder",
    annual: "price_pro_annual_placeholder",
  },
  team: {
    monthly: "price_team_monthly_placeholder",
    annual: "price_team_annual_placeholder",
  },
  company_intelligence: {
    monthly: "price_ci_monthly_placeholder",
    annual: "price_ci_annual_placeholder",
  },
};
