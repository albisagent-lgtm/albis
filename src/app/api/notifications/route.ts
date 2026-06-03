import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function requireUser() {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  return user;
}

function cleanIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 100);
}

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ notifications: [], unread_count: 0, authenticated: false });

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "1";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 30), 1), 100);
  const supabase = createAdminClient();

  let query = supabase
    .from("notifications")
    .select("id, type, title, body, entity_type, entity_id, entity_url, metadata, read_at, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.is("read_at", null);

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    query,
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
  ]);

  if (error) {
    if (error.code === "42P01" || /notifications/i.test(error.message)) {
      return NextResponse.json({ notifications: [], unread_count: 0, authenticated: true, unavailable: true });
    }
    console.error("[notifications] fetch failed", error.message);
    return jsonError("Could not load notifications.", 500);
  }

  if (countError && countError.code !== "42P01") {
    console.error("[notifications] unread count failed", countError.message);
  }

  return NextResponse.json({
    notifications: data || [],
    unread_count: count || 0,
    authenticated: true,
    unavailable: false,
  });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in to update notifications.", 401);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid notification payload.");
  }

  const markAllRead = payload.mark_all_read === true;
  const ids = cleanIds(payload.ids);
  if (!markAllRead && ids.length === 0) return jsonError("No notifications selected.");

  const supabase = createAdminClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (!markAllRead) query = query.in("id", ids);

  const { error } = await query;
  if (error) {
    if (error.code === "42P01" || /notifications/i.test(error.message)) {
      return NextResponse.json({ ok: false, unavailable: true }, { status: 503 });
    }
    console.error("[notifications] mark read failed", error.message);
    return jsonError("Could not update notifications.", 500);
  }

  return NextResponse.json({ ok: true, unavailable: false });
}
