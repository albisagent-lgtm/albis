import { NextRequest, NextResponse } from "next/server";
import { getAvailableDates, getScanByDate } from "@/lib/scan-parser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const dates = await getAvailableDates();
  const allResults: {
    headline: string;
    date: string;
    displayDate: string;
    category: string;
    regions: string[];
    significance: string;
    connection: string;
    relevance: number;
  }[] = [];

  for (const date of dates) {
    const scan = await getScanByDate(date);
    if (!scan) continue;

    for (const item of scan.items) {
      const headlineLower = (item.headline || "").toLowerCase();
      const connectionLower = (item.connection || "").toLowerCase();

      let relevance = 0;
      if (headlineLower.includes(q)) relevance += 10;
      if (connectionLower.includes(q)) relevance += 5;

      // Also search regions
      const regionMatch = item.regions?.some((r: string) => r.toLowerCase().includes(q));
      if (regionMatch) relevance += 3;

      // Also search category
      if ((item.category || "").toLowerCase().includes(q)) relevance += 2;

      if (relevance === 0) continue;

      allResults.push({
        headline: item.headline,
        date: scan.date,
        displayDate: scan.displayDate,
        category: item.category,
        regions: item.regions || [],
        significance: item.significance,
        connection: item.connection || "",
        relevance,
      });
    }
  }

  // Sort by relevance desc, then date desc
  allResults.sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    return b.date.localeCompare(a.date);
  });

  return NextResponse.json({ results: allResults.slice(0, 50) });
}
