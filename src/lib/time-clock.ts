import { createAdminClient } from "./supabase/admin";

export type TimeDirection = "spent" | "gained";
export type TimeEventType = "view" | "dwell" | "create_card" | "comment" | "reply" | "reaction" | "other";

export function humaniseSeconds(total: number) {
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

export function clampTimeSeconds(value: unknown, max = 86400) {
  const seconds = Math.floor(Number(value || 0));
  if (!Number.isFinite(seconds)) return 0;
  return Math.min(Math.max(seconds, 0), max);
}

export async function addTimeClockEvent({
  userId,
  direction,
  eventType,
  targetType,
  targetId,
  seconds,
  metadata = {},
}: {
  userId: string | null | undefined;
  direction: TimeDirection;
  eventType: TimeEventType;
  targetType?: string | null;
  targetId?: string | null;
  seconds: number;
  metadata?: Record<string, unknown>;
}) {
  if (!userId) return { ok: false, skipped: true };
  const safeSeconds = clampTimeSeconds(seconds);
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { error: insertError } = await supabase
    .from("time_clock_events")
    .insert({
      user_id: userId,
      direction,
      event_type: eventType,
      target_type: targetType || null,
      target_id: targetId || null,
      seconds: safeSeconds,
      metadata,
      created_at: now,
    });

  if (insertError) {
    if (insertError.code === "42P01" || /time_clock/i.test(insertError.message)) return { ok: false, unavailable: true };
    throw insertError;
  }

  const { data: existing, error: existingError } = await supabase
    .from("time_clock_totals")
    .select("seconds_spent, seconds_gained, events_count")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") throw existingError;

  const currentSpent = Number(existing?.seconds_spent || 0);
  const currentGained = Number(existing?.seconds_gained || 0);
  const currentEvents = Number(existing?.events_count || 0);
  const nextTotals = {
    user_id: userId,
    seconds_spent: currentSpent + (direction === "spent" ? safeSeconds : 0),
    seconds_gained: currentGained + (direction === "gained" ? safeSeconds : 0),
    events_count: currentEvents + 1,
    updated_at: now,
  };

  const { error: totalsError } = await supabase
    .from("time_clock_totals")
    .upsert(nextTotals, { onConflict: "user_id" });

  if (totalsError) throw totalsError;

  return {
    ok: true,
    totals: {
      ...nextTotals,
      spent_label: humaniseSeconds(nextTotals.seconds_spent),
      gained_label: humaniseSeconds(nextTotals.seconds_gained),
    },
  };
}
