import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, serviceKey);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.SCAN_INGEST_KEY;

  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { headline, url, active, expires_at } = body;

    if (!headline) {
      return NextResponse.json(
        { error: "headline is required" },
        { status: 400 }
      );
    }

    const sb = getSupabase();

    // Deactivate all existing breaking news first
    if (active) {
      await sb
        .from("breaking_news")
        .update({ active: false })
        .eq("active", true);
    }

    // Insert new breaking news
    const { data, error } = await sb
      .from("breaking_news")
      .insert({
        headline,
        url: url || null,
        active: active ?? true,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
