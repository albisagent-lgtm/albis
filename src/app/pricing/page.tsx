import PricingClient from "./pricing-client";

export const metadata = {
  title: "Company Daily Scan — Albis",
  description:
    "Demo-led daily intelligence for teams tracking markets, policy, operations, reputation, supply chains, customers, and opportunities.",
  robots: { index: false, follow: false },
};

export default function PricingPage() {
  return <PricingClient />;
}
