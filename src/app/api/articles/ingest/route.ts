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

function toInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const match = value.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return null;
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      slug,
      title,
      description,
      date,
      category,
      tags,
      keywords,
      image,
      excerpt,
      author,
      content,
      reading_time,
      published_at,
      frontmatter,
    } = body;

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: "slug, title, and content are required" },
        { status: 400 }
      );
    }

    const publishedAtIso = (() => {
      const raw = published_at || date;
      if (!raw) return new Date().toISOString();
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    })();

    const row = {
      slug,
      title,
      description: description ?? null,
      date: typeof date === "string" ? date : date ? String(date) : null,
      category: category ?? null,
      tags: toArray(tags),
      keywords: toArray(keywords),
      image: image ?? null,
      excerpt: excerpt ?? null,
      author: author ?? null,
      content,
      reading_time: toInt(reading_time),
      published_at: publishedAtIso,
      frontmatter: frontmatter && typeof frontmatter === "object" ? frontmatter : {},
    };

    const supabase = getAdminClient();
    const { error } = await supabase
      .from("articles")
      .upsert(row, { onConflict: "slug" });

    if (error) {
      console.error("articles upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Articles ingest error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
