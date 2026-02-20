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

    if (!scan_date || !scan_time) {
      return NextResponse.json({ error: "scan_date and scan_time required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { error } = await supabase
      .from("scans")
      .upsert(
        {
          scan_date,
          scan_time,
          top_theme: top_theme || null,
          mood: mood || null,
          pattern_of_day: pattern_of_day || null,
          framing_watch: framing_watch || null,
          items: items || [],
          raw_markdown: raw_markdown || null,
        },
        { onConflict: "scan_date,scan_time" }
      );

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, scan_date, scan_time });
  } catch (err: any) {
    console.error("Ingest error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
