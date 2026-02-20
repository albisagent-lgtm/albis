import type { Metadata } from "next";
import {
  getAvailableDates,
  getScanByDate,
  CATEGORY_META,
  REGION_LABELS,
  hasFramingWatch,
  type ScanItem,
} from "@/lib/scan-parser";
import { HistoryClient } from "./history-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scan History",
  description: "Browse past scans and track how patterns evolve over time.",
};

export interface ScanSummary {
  date: string;
  displayDate: string;
  mood: string | null;
  topTheme: string | null;
  patternTitle: string | null;
  patternBody: string | null;
  itemCount: number;
  highCount: number;
  framingCount: number;
  categories: string[];
  weatherSummary: string | null;
  flowsSummary: string | null;
  notableItems: string[];
  items: ScanItem[];
}

export default async function HistoryPage() {
  const dates = await getAvailableDates();
  const summaries: ScanSummary[] = [];

  for (const date of dates) {
    const scan = await getScanByDate(date);
    if (!scan) continue;

    summaries.push({
      date: scan.date,
      displayDate: scan.displayDate,
      mood: scan.mood,
      topTheme: scan.topTheme,
      patternTitle: scan.patternOfDay?.title || null,
      patternBody: scan.patternOfDay?.body || null,
      itemCount: scan.items.length,
      highCount: scan.items.filter((i) => i.significance === "high").length,
      framingCount: scan.items.filter((i) => hasFramingWatch(i)).length,
      categories: [...new Set(scan.items.map((i) => i.category))],
      weatherSummary: scan.weatherSummary,
      flowsSummary: scan.flowsSummary,
      notableItems: scan.notableItems,
      items: scan.items,
    });
  }

  return (
    <HistoryClient
      summaries={summaries}
      categoryMeta={CATEGORY_META}
      regionLabels={REGION_LABELS}
    />
  );
}
