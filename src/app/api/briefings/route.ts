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

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = getAnonClient();

    const { data: briefings, error, count } = await supabase
      .from("briefings")
      .select("id, date, title, summary, mood, pgi_score, story_count, created_at", { count: "exact" })
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Briefings fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ briefings: briefings || [], total: count || 0 });
  } catch (err: any) {
    console.error("Briefings GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { date, title, summary, content_md, mood, pgi_score, story_count, top_stories } = body;

    if (!date || !title || !content_md) {
      return NextResponse.json(
        { error: "date, title, and content_md are required" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("briefings")
      .upsert(
        {
          date,
          title,
          summary: summary || null,
          content_md,
          mood: mood || null,
          pgi_score: pgi_score || null,
          story_count: story_count || null,
          top_stories: top_stories || [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date" }
      )
      .select()
      .single();

    if (error) {
      console.error("Briefing upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, briefing: data });
  } catch (err: any) {
    console.error("Briefings POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
