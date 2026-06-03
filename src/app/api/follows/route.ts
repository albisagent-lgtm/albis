import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type FollowTargetType = "person" | "topic" | "source";

const TARGET_TYPES = new Set<FollowTargetType>(["person", "topic", "source"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function slugifyTarget(value: string) {
  return value
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "follow";
}

function cleanTargetType(value: unknown): FollowTargetType | null {
  const raw = typeof value === "string" ? value.trim() : "";
  return TARGET_TYPES.has(raw as FollowTargetType) ? raw as FollowTargetType : null;
}

function cleanLabel(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  return raw.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").slice(0, 160);
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const json = JSON.stringify(value);
  if (json.length > 1200) return {};
  return JSON.parse(json) as Record<string, unknown>;
}

async function requireUser() {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ follows: [], authenticated: false });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_follows")
    .select("id, target_type, target_id, target_label, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    if (error.code === "42P01" || /user_follows/i.test(error.message)) {
      return NextResponse.json({ follows: [], authenticated: true, unavailable: true });
    }
    console.error("[follows] fetch failed", error.message);
    return jsonError("Could not load follows.", 500);
  }

  return NextResponse.json({ follows: data || [], authenticated: true, unavailable: false });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in to follow on Albis.", 401);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid follow payload.");
  }

  const targetType = cleanTargetType(payload.target_type);
  const targetLabel = cleanLabel(payload.target_label ?? payload.label);
  const targetId = cleanLabel(payload.target_id) || (targetLabel ? slugifyTarget(targetLabel) : null);

  if (!targetType) return jsonError("Invalid follow target type.");
  if (!targetLabel || !targetId) return jsonError("Missing follow target.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_follows")
    .upsert({
      user_id: user.id,
      target_type: targetType,
      target_id: slugifyTarget(targetId),
      target_label: targetLabel,
      metadata: safeMetadata(payload.metadata),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,target_type,target_id" })
    .select("id, target_type, target_id, target_label, metadata, created_at")
    .single();

  if (error) {
    if (error.code === "42P01" || /user_follows/i.test(error.message)) {
      return NextResponse.json({ ok: false, unavailable: true }, { status: 503 });
    }
    console.error("[follows] upsert failed", error.message);
    return jsonError("Could not follow this yet.", 500);
  }

  return NextResponse.json({ ok: true, follow: data, unavailable: false });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) return jsonError("Please sign in to update follows.", 401);

  const { searchParams } = new URL(request.url);
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // DELETE may arrive with query parameters only.
  }

  const targetType = cleanTargetType(body.target_type ?? searchParams.get("target_type"));
  const targetId = cleanLabel(body.target_id ?? searchParams.get("target_id"));

  if (!targetType || !targetId) return jsonError("Missing follow target.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", slugifyTarget(targetId));

  if (error) {
    if (error.code === "42P01" || /user_follows/i.test(error.message)) {
      return NextResponse.json({ ok: false, unavailable: true }, { status: 503 });
    }
    console.error("[follows] delete failed", error.message);
    return jsonError("Could not unfollow this yet.", 500);
  }

  return NextResponse.json({ ok: true, unavailable: false });
}
