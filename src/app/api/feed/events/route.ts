import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type FeedEventType = "impression" | "open" | "comment" | "save" | "unsave" | "share" | "follow" | "unfollow" | "hide" | "report";

const EVENT_TYPES = new Set<FeedEventType>(["impression", "open", "comment", "save", "unsave", "share", "follow", "unfollow", "hide", "report"]);
const MAX_EVENTS_PER_WINDOW = 80;
const RATE_WINDOW_MINUTES = 10;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function cleanSlug(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.length > 220) return null;
  return raw.replace(/\s+/g, " ");
}

function cleanEventType(value: unknown): FeedEventType | null {
  const raw = typeof value === "string" ? value.trim() : "";
  return EVENT_TYPES.has(raw as FeedEventType) ? raw as FeedEventType : null;
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

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const json = JSON.stringify(value);
  if (json.length > 1500) return {};
  return JSON.parse(json) as Record<string, unknown>;
}

function scoreFromCounts(counts: {
  unique_opens: number;
  comments_count: number;
  saves_count: number;
  shares_count: number;
  follows_count: number;
  hides_count: number;
  reports_count: number;
}) {
  const log = (value: number) => Math.log1p(Math.max(0, value));
  return Number((
    1.0 * log(counts.unique_opens) +
    2.0 * log(counts.comments_count) +
    3.0 * log(counts.saves_count) +
    3.0 * log(counts.shares_count) +
    2.0 * log(counts.follows_count) -
    4.0 * log(counts.hides_count) -
    6.0 * log(counts.reports_count)
  ).toFixed(6));
}

async function refreshScore(cardSlug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feed_events")
    .select("event_type, anon_id, user_id, created_at")
    .eq("card_slug", cardSlug)
    .limit(5000);

  if (error) throw error;

  const rows = (data || []) as Array<{ event_type: FeedEventType; anon_id: string | null; user_id: string | null; created_at: string }>;
  const openActors = new Set<string>();
  const counts = {
    unique_opens: 0,
    comments_count: 0,
    saves_count: 0,
    shares_count: 0,
    follows_count: 0,
    hides_count: 0,
    reports_count: 0,
  };
  let lastActivityAt: string | null = null;

  for (const row of rows) {
    if (!lastActivityAt || new Date(row.created_at).getTime() > new Date(lastActivityAt).getTime()) lastActivityAt = row.created_at;
    const actor = row.user_id || row.anon_id || `${row.event_type}:${row.created_at}`;
    if (row.event_type === "open") openActors.add(actor);
    if (row.event_type === "comment") counts.comments_count += 1;
    if (row.event_type === "save") counts.saves_count += 1;
    if (row.event_type === "unsave") counts.saves_count = Math.max(0, counts.saves_count - 1);
    if (row.event_type === "share") counts.shares_count += 1;
    if (row.event_type === "follow") counts.follows_count += 1;
    if (row.event_type === "unfollow") counts.follows_count = Math.max(0, counts.follows_count - 1);
    if (row.event_type === "hide") counts.hides_count += 1;
    if (row.event_type === "report") counts.reports_count += 1;
  }

  counts.unique_opens = openActors.size;
  const score = scoreFromCounts(counts);

  const { error: upsertError } = await supabase
    .from("feed_scores")
    .upsert({
      card_slug: cardSlug,
      ...counts,
      score,
      last_activity_at: lastActivityAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: "card_slug" });

  if (upsertError) throw upsertError;
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid event payload.");
  }

  const cardSlug = cleanSlug(payload.card_slug);
  const eventType = cleanEventType(payload.event_type);
  if (!cardSlug) return jsonError("Missing card slug.");
  if (!eventType) return jsonError("Invalid event type.");

  const ipHash = await hashValue(getClientIp(request));
  const userAgentHash = await hashValue(request.headers.get("user-agent") || "unknown");
  const anonId = typeof payload.anon_id === "string" ? payload.anon_id.trim().slice(0, 120) : null;
  const metadata = safeMetadata(payload.metadata);

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  const supabase = createAdminClient();
  const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error: countError } = await supabase
    .from("feed_events")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (countError) {
    if (countError.code === "42P01" || /feed_events/i.test(countError.message)) {
      return NextResponse.json({ ok: false, unavailable: true });
    }
    console.error("[feed-events] rate-limit check failed", countError.message);
  } else if ((count || 0) >= MAX_EVENTS_PER_WINDOW) {
    return jsonError("Too many feed events.", 429);
  }

  const { error } = await supabase
    .from("feed_events")
    .insert({
      card_slug: cardSlug,
      event_type: eventType,
      user_id: user?.id || null,
      anon_id: anonId,
      ip_hash: ipHash,
      user_agent_hash: userAgentHash,
      metadata,
    });

  if (error) {
    if (error.code === "42P01" || /feed_events/i.test(error.message)) {
      return NextResponse.json({ ok: false, unavailable: true });
    }
    console.error("[feed-events] insert failed", error.message);
    return jsonError("Could not track feed event.", 500);
  }

  try {
    await refreshScore(cardSlug);
  } catch (err) {
    console.error("[feed-events] score refresh failed", err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ ok: true });
}
