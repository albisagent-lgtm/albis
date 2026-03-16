import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  "https://wguydvzpxwsgrhvojpnk.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// GET /api/pgi/dataset — public PGI dataset for researchers
// Query params: ?days=30&format=json (default) or ?format=csv
export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get("days") || "30"), 90);
  const format = url.searchParams.get("format") || "json";

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("pgi_story_scores")
    .select("story_id, story_title, story_pgi, d1_factual, d2_causal, d3_framing, d4_emotional, d5_actor, d6_cui_bono, scored_at")
    .gte("scored_at", since)
    .order("scored_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === "csv") {
    const headers = "story_id,story_title,story_pgi,d1_factual,d2_causal,d3_framing,d4_emotional,d5_actor,d6_cui_bono,scored_at";
    const rows = (data || []).map(r =>
      `"${r.story_id}","${(r.story_title || "").replace(/"/g, '""')}",${r.story_pgi},${r.d1_factual},${r.d2_causal},${r.d3_framing},${r.d4_emotional},${r.d5_actor},${r.d6_cui_bono},"${r.scored_at}"`
    );
    const csv = [headers, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="albis-pgi-dataset-${days}d.csv"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return NextResponse.json({
    dataset: data || [],
    count: data?.length || 0,
    days,
    methodology: "https://www.albis.news/perception-gap/about",
    license: "CC BY 4.0 — cite as: Albis Perception Gap Index, albis.news",
    api_docs: "GET /api/pgi/dataset?days=30&format=json|csv",
  }, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
