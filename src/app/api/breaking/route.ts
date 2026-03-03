import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, serviceKey);
}

async function ensureTable(sb: ReturnType<typeof createClient>) {
  // Try a select first — if table doesn't exist, create it via raw SQL
  const { error } = await sb.from("breaking_news").select("id").limit(1);
  if (error?.code === "PGRST205") {
    // Table doesn't exist — create it via the SQL endpoint
    // We'll use a workaround: create via RPC or just let the POST fail gracefully
    // Actually, we need to create the table. Use the admin API.
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    });
    // If RPC doesn't work, return false
    return false;
  }
  return true;
}

export async function GET() {
  try {
    const sb = getSupabase();
    const now = new Date().toISOString();

    const { data, error } = await sb
      .from("breaking_news")
      .select("*")
      .eq("active", true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      // Table might not exist yet
      if (error.code === "PGRST205") {
        return NextResponse.json({ breaking: null });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { breaking: data && data.length > 0 ? data[0] : null },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
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
