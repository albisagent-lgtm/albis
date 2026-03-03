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
    const { scan_date, scan_period, stories, region_pairs } = body;

    if (!scan_date || !scan_period || !Array.isArray(stories)) {
      return NextResponse.json(
        { error: "scan_date, scan_period, and stories[] required" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    let scoreCount = 0;
    let pairCount = 0;

    for (const story of stories) {
      const storyData = {
        story_slug: story.story_slug,
        story_headline: story.story_headline,
        category: story.category,
        regions_covered: story.regions_covered,
        region_count: story.regions_covered?.length ?? 0,
        d1_factual: story.d1_factual ?? story.dimensions?.d1_factual ?? null,
        d2_causal: story.d2_causal ?? story.dimensions?.d2_causal ?? null,
        d3_framing:
          story.d3_framing ??
          story.dimensions?.d3_framing ??
          story.dimensions?.d3_narrative_market ??
          null,
        d4_emotional:
          story.d4_emotional ?? story.dimensions?.d4_emotional ?? null,
        d5_actor_context:
          story.d5_actor_context ??
          story.dimensions?.d5_actor_context ??
          story.dimensions?.d5_actor_portrayal ??
          null,
        significance: story.significance,
        scoring_rationale: story.scoring_rationale,
        scan_date,
        scan_period,
        is_latest: true,
      };

      const { data: inserted, error: scoreError } = await supabase
        .from("pgi_story_scores")
        .upsert(storyData, {
          onConflict: "story_slug,scan_date,scan_period",
          ignoreDuplicates: false,
        })
        .select("id")
        .single();

      if (scoreError) {
        console.error(
          `PGI upsert error for ${story.story_slug}:`,
          scoreError.message
        );
        continue;
      }

      scoreCount++;
      const storyScoreId = inserted.id;

      // Handle region_pairs on the story object
      const pairs =
        story.region_pairs && typeof story.region_pairs === "object"
          ? Object.entries(story.region_pairs)
          : [];

      for (const [pairKey, pairScore] of pairs) {
        const parsed = parseRegionPair(
          pairKey,
          story.regions_covered || []
        );
        if (!parsed) continue;

        const { error: pairError } = await supabase
          .from("pgi_region_pairs")
          .upsert(
            {
              story_score_id: storyScoreId,
              region_a: parsed.region_a,
              region_b: parsed.region_b,
              pair_pgi: pairScore as number,
              scan_date,
            },
            { onConflict: "story_score_id,region_a,region_b", ignoreDuplicates: false }
          );

        if (!pairError) pairCount++;
      }
    }

    // Handle top-level region_pairs array if provided
    if (Array.isArray(region_pairs)) {
      for (const pair of region_pairs) {
        const { error } = await supabase
          .from("pgi_region_pairs")
          .upsert(pair, {
            onConflict: "story_score_id,region_a,region_b",
            ignoreDuplicates: false,
          });
        if (!error) pairCount++;
      }
    }

    return NextResponse.json({ ok: true, count: scoreCount, pairs: pairCount });
  } catch (err: any) {
    console.error("PGI ingest error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Parse region pair key into sorted region_a / region_b */
function parseRegionPair(
  pairKey: string,
  regionsInStory: string[]
): { region_a: string; region_b: string } | null {
  const multiWordRegions = [
    "middle_east",
    "south_asia",
    "east_se_asia",
    "latin_americas",
  ];

  if (regionsInStory.length > 0) {
    const normalized = regionsInStory.map((r) => r.replace(/-/g, "_"));
    for (const region of normalized) {
      if (pairKey.startsWith(region + "_")) {
        const other = pairKey.substring(region.length + 1);
        const sorted = [region, other].sort();
        return { region_a: sorted[0], region_b: sorted[1] };
      }
      if (pairKey.endsWith("_" + region)) {
        const other = pairKey.substring(0, pairKey.length - region.length - 1);
        const sorted = [region, other].sort();
        return { region_a: sorted[0], region_b: sorted[1] };
      }
    }
  }

  for (const mw of multiWordRegions) {
    if (pairKey.includes(mw)) {
      const other = pairKey.replace(mw + "_", "").replace("_" + mw, "");
      const sorted = [mw, other].sort();
      return { region_a: sorted[0], region_b: sorted[1] };
    }
  }

  const parts = pairKey.split("_");
  if (parts.length === 2) {
    const sorted = parts.sort();
    return { region_a: sorted[0], region_b: sorted[1] };
  }

  return null;
}
