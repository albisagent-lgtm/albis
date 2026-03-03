import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  try {
    const supabase = getClient();

    // Try to get latest daily GAI first
    const { data: daily } = await supabase
      .from("gai_daily")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get today's story scores (latest scan)
    const today = new Date().toISOString().split("T")[0];
    const { data: stories } = await supabase
      .from("gai_story_scores")
      .select("*")
      .eq("scan_date", today)
      .eq("is_latest", true)
      .order("story_gai", { ascending: false });

    // Calculate live GAI from today's stories if no daily record yet
    let dailyGai = daily?.daily_gai ?? null;
    let tributaries = daily?.tributaries ?? null;
    let blindRegionRanking = daily?.blind_region_ranking ?? null;

    if (!dailyGai && stories && stories.length > 0) {
      const sum = stories.reduce(
        (acc: number, s: Record<string, unknown>) =>
          acc + (Number(s.story_gai) || 0),
        0
      );
      dailyGai = Number((sum / stories.length).toFixed(2));
    }

    // Most invisible = highest GAI (most attention inequality)
    const mostInvisible =
      stories && stories.length > 0 ? stories[0] : null;
    // Most visible = lowest GAI (most evenly covered)
    const mostVisible =
      stories && stories.length > 0 ? stories[stories.length - 1] : null;

    return NextResponse.json({
      date: daily?.date ?? today,
      daily_gai: dailyGai,
      tier: daily?.tier ?? null,
      story_count: stories?.length ?? daily?.story_count ?? 0,
      tributaries,
      blind_region_ranking: blindRegionRanking,
      most_invisible_story: mostInvisible
        ? {
            slug: mostInvisible.story_slug,
            headline: mostInvisible.story_headline,
            gai: mostInvisible.story_gai,
            regions_absent: mostInvisible.regions_absent,
          }
        : daily?.most_invisible_story
          ? { slug: daily.most_invisible_story, gai: daily.most_invisible_gai }
          : null,
      most_visible_story: mostVisible
        ? {
            slug: mostVisible.story_slug,
            headline: mostVisible.story_headline,
            gai: mostVisible.story_gai,
          }
        : daily?.most_visible_story
          ? { slug: daily.most_visible_story, gai: daily.most_visible_gai }
          : null,
      stories: stories ?? [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GAI current error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
