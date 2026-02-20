import type { Metadata } from "next";
import { getTodayScan } from "@/lib/scan-parser";
import { BriefingClient } from "./briefing-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Briefing",
  description: "Your personalised daily news briefing — filtered by topics and regions that matter to you.",
};

export default async function BriefingPage() {
  const scan = await getTodayScan();
  return <BriefingClient scan={scan} />;
}
