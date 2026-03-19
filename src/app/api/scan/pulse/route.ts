import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("scan_pulse")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return NextResponse.json({ pulse: DEFAULT_PULSE }, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      });
    }

    return NextResponse.json({ pulse: data as ScanPulseRow }, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json({ pulse: DEFAULT_PULSE });
  }
}
