import type { Metadata } from "next";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, honest pricing. Start free with 2 topics and 1 region. Upgrade to Premium for Framing Watch, Deep Dive, and full access.",
  openGraph: {
    title: "Pricing | Albis",
    description:
      "Start free. Upgrade to Premium for Framing Watch, Deep Dive analysis, and full access to all topics and regions.",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
