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
  // Auth check
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { scan_date, scan_time, top_theme, mood, pattern_of_day, framing_watch, items, raw_markdown } = body;
    const normalisedScanTime = typeof scan_time === "string" ? scan_time.trim().toLowerCase() : scan_time;

    if (!scan_date || !normalisedScanTime) {
      return NextResponse.json({ error: "scan_date and scan_time required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { error } = await supabase
      .from("scans")
      .upsert(
        {
          scan_date,
          scan_time: normalisedScanTime,
          top_theme: top_theme || null,
          mood: mood || null,
          pattern_of_day: pattern_of_day || null,
          framing_watch: framing_watch || null,
          items: items || [],
          raw_markdown: raw_markdown || null,
        },
        { onConflict: "scan_date,scan_time" }
      );

    // Mirror structured items into scan_items so downstream systems can rely on either path.
    const { data: scanRow } = await supabase
      .from("scans")
      .select("id")
      .eq("scan_date", scan_date)
      .eq("scan_time", normalisedScanTime)
      .single();

    if (scanRow?.id) {
      await supabase.from("scan_items").delete().eq("scan_id", scanRow.id);
      if (Array.isArray(items) && items.length > 0) {
        const itemRows = items
          .filter((item: any) => item?.headline && item?.category)
          .map((item: any) => ({
            scan_id: scanRow.id,
            headline: item.headline,
            category: typeof item.category === "string" ? item.category.replace(/-/g, "_") : item.category,
            regions: Array.isArray(item.regions) ? item.regions : [],
            tags: Array.isArray(item.tags) ? item.tags : [],
            patterns: Array.isArray(item.patterns) ? item.patterns : [],
            significance: item.significance || null,
            connection: item.connection || null,
          }));
        if (itemRows.length > 0) {
          const { error: itemError } = await supabase.from("scan_items").insert(itemRows);
          if (itemError) {
            console.error("scan_items insert error:", itemError);
          }
        }
      }
    }

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, scan_date, scan_time: normalisedScanTime });
  } catch (err: any) {
    console.error("Ingest error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
