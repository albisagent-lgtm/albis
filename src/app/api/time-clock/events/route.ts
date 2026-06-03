import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Direction = "spent" | "gained";
type TimeEventType = "view" | "dwell" | "create_card" | "comment" | "reply" | "reaction" | "other";

const DIRECTIONS = new Set<Direction>(["spent", "gained"]);
const EVENT_TYPES = new Set<TimeEventType>(["view", "dwell", "create_card", "comment", "reply", "reaction", "other"]);
const MAX_EVENTS_PER_WINDOW = Number(process.env.ALBIS_TIME_CLOCK_RATE_LIMIT_MAX || 120);
const RATE_WINDOW_MINUTES = Number(process.env.ALBIS_TIME_CLOCK_RATE_WINDOW_MINUTES || 10);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function requireUser() {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  return user;
}

function cleanDirection(value: unknown): Direction | null {
  const raw = typeof value === "string" ? value.trim() : "";
  return DIRECTIONS.has(raw as Direction) ? raw as Direction : null;
}

function cleanEventType(value: unknown): TimeEventType | null {
  const raw = typeof value === "string" ? value.trim() : "";
  return EVENT_TYPES.has(raw as TimeEventType) ? raw as TimeEventType : null;
}

function cleanShort(value: unknown, max = 160) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  return raw.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").slice(0, max);
}

function cleanSeconds(value: unknown) {
  const seconds = Math.floor(Number(value || 0));
  if (!Number.isFinite(seconds)) return 0;
  return Math.min(Math.max(seconds, 0), 86400);
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const json = JSON.stringify(value);
  if (json.length > 1200) return {};
  return JSON.parse(json) as Record<string, unknown>;
}

function humaniseSeconds(total: number) {
  const seconds = Math.max(0, Math.floor(total));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  if (days < 365) return `${days}d ${hours % 24}h`;
  const years = Math.floor(days / 365);
  return `${years}y ${days % 365}d`;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ authenticated: false, totals: null });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("time_clock_totals")
    .select("seconds_spent, seconds_gained, events_count, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || /time_clock/i.test(error.message)) {
      return NextResponse.json({ authenticated: true, totals: null, unavailable: true });
    }
    console.error("[time-clock] totals fetch failed", error.message);
    return jsonError("Could not load time clock.", 500);
  }

  const totals = data || { seconds_spent: 0, seconds_gained: 0, events_count: 0, updated_at: null };
  return NextResponse.json({
    authenticated: true,
    unavailable: false,
    totals: {
      ...totals,
      spent_label: humaniseSeconds(Number(totals.seconds_spent || 0)),
      gained_label: humaniseSeconds(Number(totals.seconds_gained || 0)),
    },
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in to track time on Albis.", 401);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid time event payload.");
  }

  const direction = cleanDirection(payload.direction) || "spent";
  const eventType = cleanEventType(payload.event_type) || "other";
  const seconds = cleanSeconds(payload.seconds);
  const targetType = cleanShort(payload.target_type, 60);
  const targetId = cleanShort(payload.target_id, 220);
  const supabase = createAdminClient();
  const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error: countError } = await supabase
    .from("time_clock_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  if (countError) {
    if (countError.code === "42P01" || /time_clock/i.test(countError.message)) {
      return NextResponse.json({ ok: false, unavailable: true }, { status: 503 });
    }
    console.error("[time-clock] rate-limit check failed", countError.message);
  } else if ((count || 0) >= MAX_EVENTS_PER_WINDOW) {
    return jsonError("Too many time events.", 429);
  }

  const { error: insertError } = await supabase
    .from("time_clock_events")
    .insert({
      user_id: user.id,
      direction,
      event_type: eventType,
      target_type: targetType,
      target_id: targetId,
      seconds,
      metadata: safeMetadata(payload.metadata),
    });

  if (insertError) {
    if (insertError.code === "42P01" || /time_clock/i.test(insertError.message)) {
      return NextResponse.json({ ok: false, unavailable: true }, { status: 503 });
    }
    console.error("[time-clock] insert failed", insertError.message);
    return jsonError("Could not track time event.", 500);
  }

  const { data: existing, error: existingError } = await supabase
    .from("time_clock_totals")
    .select("seconds_spent, seconds_gained, events_count")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    console.error("[time-clock] totals fetch failed", existingError.message);
  }

  const currentSpent = Number(existing?.seconds_spent || 0);
  const currentGained = Number(existing?.seconds_gained || 0);
  const currentEvents = Number(existing?.events_count || 0);
  const nextTotals = {
    user_id: user.id,
    seconds_spent: currentSpent + (direction === "spent" ? seconds : 0),
    seconds_gained: currentGained + (direction === "gained" ? seconds : 0),
    events_count: currentEvents + 1,
    updated_at: new Date().toISOString(),
  };

  const { error: totalsError } = await supabase
    .from("time_clock_totals")
    .upsert(nextTotals, { onConflict: "user_id" });

  if (totalsError) {
    console.error("[time-clock] totals upsert failed", totalsError.message);
  }

  return NextResponse.json({
    ok: true,
    totals: {
      ...nextTotals,
      spent_label: humaniseSeconds(nextTotals.seconds_spent),
      gained_label: humaniseSeconds(nextTotals.seconds_gained),
    },
    unavailable: false,
  });
}
