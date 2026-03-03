import { NextResponse } from "next/server";
import { getTodayScan } from "@/lib/scan-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scan = await getTodayScan();
    
    if (!scan) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    // Return minimal data needed for country mentions
    return NextResponse.json({
      date: scan.date,
      items: scan.items.map(item => ({
        headline: item.headline,
        connection: item.connection || "",
      })),
    });
  } catch (error) {
    console.error("Error fetching today's scan:", error);
    return NextResponse.json({ error: "Failed to fetch scan data" }, { status: 500 });
  }
}
