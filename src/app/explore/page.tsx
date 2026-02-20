import type { Metadata } from "next";
import {
  getAvailableDates,
  getScanByDate,
  CATEGORY_META,
  REGION_LABELS,
  type ScanItem,
} from "@/lib/scan-parser";
import { ExploreClient } from "./explore-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Archive",
  description: "Explore the complete Albis intelligence archive. Browse all scan data by topic categories and regions.",
};

export interface ExploreItem extends ScanItem {
  date: string;
  displayDate: string;
}

export default async function ExplorePage() {
  const dates = await getAvailableDates();
  const allItems: ExploreItem[] = [];

  // Fetch all scans and aggregate items
  for (const date of dates) {
    const scan = await getScanByDate(date);
    if (!scan) continue;

    // Add date info to each item
    const itemsWithDate: ExploreItem[] = scan.items.map(item => ({
      ...item,
      date: scan.date,
      displayDate: scan.displayDate,
    }));

    allItems.push(...itemsWithDate);
  }

  // Sort by date (newest first), then by significance
  allItems.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    
    const sigOrder = { high: 0, medium: 1, low: 2 };
    return (sigOrder[a.significance] ?? 1) - (sigOrder[b.significance] ?? 1);
  });

  return (
    <ExploreClient
      items={allItems}
      availableDates={dates}
      categoryMeta={CATEGORY_META}
      regionLabels={REGION_LABELS}
    />
  );
}