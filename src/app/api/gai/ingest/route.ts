import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { scan_date, scan_period, stories } = body;

    if (!scan_date || !scan_period || !Array.isArray(stories)) {
      return NextResponse.json(
        { error: "scan_date, scan_period, and stories[] required" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    let scoreCount = 0;

    for (const story of stories) {
      const storyData = {
        scan_date,
        scan_period,
        story_slug: story.story_slug,
        story_headline: story.story_headline,
        category: story.category,
        regions_found: story.regions_found ?? [],
        regions_absent: story.regions_absent ?? [],
        coverage_breadth: story.coverage_breadth ?? 0,
        d1_coverage_breadth:
          story.d1_coverage_breadth ?? story.dimensions?.d1_coverage_breadth ?? 0,
        d2_prominence_disparity:
          story.d2_prominence_disparity ?? story.dimensions?.d2_prominence_disparity ?? 0,
        d3_population_exposure:
          story.d3_population_exposure ?? story.dimensions?.d3_population_exposure ?? 0,
        d4_significance_severity:
          story.d4_significance_severity ?? story.dimensions?.d4_significance_severity ?? 0,
        story_gai: story.story_gai ?? 0,
        significance: story.significance ?? 1,
        scoring_rationale: story.scoring_rationale,
        is_latest: true,
      };

      const { error: scoreError } = await supabase
        .from("gai_story_scores")
        .upsert(storyData, {
          onConflict: "scan_date,scan_period,story_slug",
          ignoreDuplicates: false,
        });

      if (scoreError) {
        console.error(
          `GAI upsert error for ${story.story_slug}:`,
          scoreError.message
        );
        continue;
      }

      scoreCount++;
    }

    return NextResponse.json({ ok: true, count: scoreCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GAI ingest error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
