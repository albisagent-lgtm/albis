import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const PRICE_TO_TIER: Record<string, { tier: string; period: "monthly" | "annual" }> = {
  price_1T3plsBBaDpCgoIEzQaADPMx: { tier: "standard", period: "monthly" },
  price_1T3ppVBBaDpCgoIEN4TExI9d: { tier: "standard", period: "annual" },
  price_1T3pnpBBaDpCgoIEpUy5Eb7p: { tier: "pro", period: "monthly" },
  price_1T3ppqBBaDpCgoIEOdikNJNx: { tier: "pro", period: "annual" },
};
