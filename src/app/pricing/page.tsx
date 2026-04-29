import PricingClient from "./pricing-client";

export const metadata = {
  title: "Pricing — Albis Company Daily Scan",
  description:
    "Daily company monitoring across your selected topics, entities, and regions. Clean findings, open source links, source-trail verification, and Perception Gap context.",
};

export default function PricingPage() {
  return <PricingClient />;
}
