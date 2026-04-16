import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSiteSnapshot } from "@/lib/site-snapshot";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, serviceKey);
}

const GET_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

// GET is served from site_snapshot (PR 3). The synthesized row is narrower
// than the underlying breaking_news row — only the fields the public site
// needs (headline, url, expires_at). The known consumer,
// src/app/components/breaking-news-banner.tsx, reads .headline and .url only.
export async function GET() {
  try {
    const snapshot = await getSiteSnapshot();

    if (!snapshot.hasBreaking) {
      return NextResponse.json({ breaking: null }, { headers: GET_CACHE_HEADERS });
    }

    return NextResponse.json(
      {
        breaking: {
          headline: snapshot.breakingHeadline,
          url: snapshot.breakingUrl,
          expires_at: snapshot.breakingExpiresAt,
          active: true,
        },
      },
      { headers: GET_CACHE_HEADERS }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
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
