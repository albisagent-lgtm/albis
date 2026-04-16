import { NextResponse } from "next/server";
import { getSiteSnapshot } from "@/lib/site-snapshot";

interface ScanPulseRow {
  id: number;
  updated_at: string;
  scan_period: string | null;
  global_mood: string | null;
  top_pgi_story: string | null;
  top_pgi_score: number | null;
  top_gai_story: string | null;
  top_gai_score: number | null;
  stories_found: number;
}

const DEFAULT_PULSE: ScanPulseRow = {
  id: 1,
  updated_at: new Date().toISOString(),
  scan_period: null,
  global_mood: "Initialising",
  top_pgi_story: null,
  top_pgi_score: null,
  top_gai_story: null,
  top_gai_score: null,
  stories_found: 0,
};

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET() {
  try {
    const snapshot = await getSiteSnapshot();

    if (snapshot.isEmpty) {
      return NextResponse.json({ pulse: DEFAULT_PULSE }, { headers: CACHE_HEADERS });
    }

    const pulse: ScanPulseRow = {
      id: 1,
      updated_at: snapshot.updatedAt ?? new Date().toISOString(),
      scan_period: snapshot.scanPeriod,
      global_mood: snapshot.globalMood,
      top_pgi_story: snapshot.topPgiStory,
      top_pgi_score: snapshot.topPgiScore,
      top_gai_story: snapshot.topGaiStory,
      top_gai_score: snapshot.topGaiScore,
      stories_found: snapshot.storiesFound ?? 0,
    };

    return NextResponse.json({ pulse }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ pulse: DEFAULT_PULSE });
  }
}
