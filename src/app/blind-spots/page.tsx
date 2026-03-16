import type { Metadata } from "next";
import { BlindSpotsClient } from "./blind-spots-client";

export const metadata: Metadata = {
  title: "Blind Spot Map — Albis",
  description:
    "What stories is your media not covering? Interactive world map revealing regional news blind spots — powered by GAI data.",
  openGraph: {
    title: "Blind Spot Map — Albis",
    description:
      "What stories is your media not covering? See what each region's press is missing this week.",
  },
};

export default function BlindSpotsPage() {
  return <BlindSpotsClient />;
}
