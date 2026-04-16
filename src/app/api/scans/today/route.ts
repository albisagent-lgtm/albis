// src/app/api/scans/today/route.ts
//
// GET /api/scans/today
//
// Returns today's scan items in a minimal shape for external/country-mention
// consumers: { date, items: [{ headline, connection }] }.
//
// Reads from the site_snapshot singleton (populated by
// scripts/write-site-snapshot.ts at the end of each scan run) instead of
// hitting getTodayScan() which composes data from Supabase + filesystem.
// Response shape is preserved so existing callers are unaffected.
//
// Empty-state: if the snapshot hasn't been populated yet, returns
// { date: null, items: [] } with HTTP 200 — consumers should handle an
// empty response, not treat it as an error.
//
// See docs/Cloudflare_Execution_Plan.md § D for the snapshot contract.

import { NextResponse } from "next/server";
import { getSiteSnapshot } from "@/lib/site-snapshot";

export async function GET() {
  const snapshot = await getSiteSnapshot();

  if (snapshot.isEmpty) {
    return NextResponse.json(
      { date: null, items: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  }

  return NextResponse.json(
    {
      date: snapshot.scanDate,
      items: snapshot.items.map((item) => ({
        headline: item.headline,
        connection: item.connection || "",
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
