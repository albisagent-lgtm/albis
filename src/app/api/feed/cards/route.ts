import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_TITLE_LENGTH = 140;
const MAX_CONTEXT_LENGTH = 900;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX = 8;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function cleanText(value: unknown, maxLength: number) {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw.replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanBody(value: unknown, maxLength: number) {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").slice(0, maxLength);
}

function cleanUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString().slice(0, 500);
  } catch {
    return null;
  }
}

function cleanCategory(value: unknown) {
  const raw = cleanText(value, 40).toLowerCase();
  const allowed = new Set(["update", "link", "question", "event", "research", "weather", "article"]);
  return allowed.has(raw) ? raw : "update";
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `card-${base || "update"}-${suffix}`;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

async function hashValue(value: string) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid card payload.");
  }

  // Honeypot field. Real users never fill this.
  if (payload.website) return NextResponse.json({ ok: true, card: null });

  const title = cleanText(payload.title, MAX_TITLE_LENGTH);
  const context = cleanBody(payload.context, MAX_CONTEXT_LENGTH);
  const sourceUrl = cleanUrl(payload.source_url);
  const category = cleanCategory(payload.category);

  if (title.length < 3) return jsonError("Add a short title.");
  if (!context && !sourceUrl) return jsonError("Add context or a link.");

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return jsonError("Please sign in to post a card.", 401);

  const supabase = createAdminClient();
  const ipHash = await hashValue(getClientIp(request));
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error: countError } = await supabase
    .from("albis_live_signals")
    .select("id", { count: "exact", head: true })
    .eq("metadata->>ip_hash", ipHash)
    .gte("published_at", since);

  if (countError) {
    if (countError.code === "42P01" || /albis_live_signals/i.test(countError.message)) {
      return jsonError("Cards are almost ready. Please try again soon.", 503);
    }
    console.error("[feed-cards] rate limit check failed", countError.message);
  } else if ((count || 0) >= RATE_LIMIT_MAX) {
    return jsonError("Please wait a few minutes before posting another card.", 429);
  }

  const authorName = cleanText(
    user.user_metadata?.username ? `@${user.user_metadata.username}` : user.user_metadata?.name || user.email?.split("@")[0] || "Reader",
    80
  );
  const slug = slugify(title);
  const now = new Date().toISOString();
  const summary = context || sourceUrl || "";

  const row = {
    slug,
    article_slug: null,
    article_url: sourceUrl,
    title,
    summary,
    bullets: context ? context.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 4) : [],
    still_unclear: null,
    category: `people-${category}`,
    region: null,
    tags: ["people", category],
    source_note: sourceUrl ? "Link attached" : "Reader card",
    status: "published",
    priority: 35,
    comment_count: 0,
    last_activity_at: now,
    published_at: now,
    updated_at: now,
    metadata: {
      card_type: category,
      created_via: "create-page",
      author_id: user.id,
      author_name: authorName,
      author_email_domain: user.email?.split("@")[1] || null,
      source_url: sourceUrl,
      ip_hash: ipHash,
    },
  };

  const { data, error } = await supabase
    .from("albis_live_signals")
    .insert(row)
    .select("id,slug,title,summary,category,published_at,metadata")
    .single();

  if (error) {
    if (error.code === "42P01" || /albis_live_signals/i.test(error.message)) {
      return jsonError("Cards are almost ready. Please try again soon.", 503);
    }
    console.error("[feed-cards] insert failed", error.message);
    return jsonError("Could not post card.", 500);
  }

  return NextResponse.json({
    ok: true,
    card: data,
    url: `/signals/${slug}`,
    message: "Card posted.",
  });
}
