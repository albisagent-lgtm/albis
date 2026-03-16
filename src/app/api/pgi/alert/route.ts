import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  "https://wguydvzpxwsgrhvojpnk.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// GET /api/pgi/alert — returns stories with PGI >= 7.0 from the last 24 hours
export async function GET() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("pgi_story_scores")
    .select("story_id, story_title, story_pgi, d1_factual, d2_causal, d3_framing, d4_emotional, d5_actor, d6_cui_bono, scored_at")
    .gte("story_pgi", 7.0)
    .gte("scored_at", oneDayAgo)
    .order("story_pgi", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    alerts: data || [],
    count: data?.length || 0,
    since: oneDayAgo,
    threshold: 7.0,
  });
}
