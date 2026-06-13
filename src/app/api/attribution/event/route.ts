import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedEvents = new Set([
  "page_view_attributed",
  "feedback_click",
  "register_start",
  "register_success",
  "subscribe_success",
]);

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => ["string", "number", "boolean"].includes(typeof entry))
      .map(([key, entry]) => [key.slice(0, 48), typeof entry === "string" ? entry.slice(0, 160) : entry])
      .slice(0, 12)
  );
}

async function hashText(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ ok: false, message: "Too many attribution events." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const eventName = cleanText(body.event_name, 64);
  if (!eventName || !allowedEvents.has(eventName)) {
    return NextResponse.json({ ok: false, message: "Unsupported attribution event." }, { status: 400 });
  }

  const rawUserAgent = headerList.get("user-agent") || "";
  const userAgentHash = rawUserAgent ? await hashText(rawUserAgent.slice(0, 512)) : null;
  const emailHash = cleanText(body.email_hash, 96);

  const supabase = createAdminClient();
  const { error } = await supabase.from("launch_attribution_events").insert({
    event_name: eventName,
    page_path: cleanText(body.page_path, 240),
    utm_source: cleanText(body.utm_source, 80),
    utm_medium: cleanText(body.utm_medium, 80),
    utm_campaign: cleanText(body.utm_campaign, 120),
    utm_content: cleanText(body.utm_content, 120),
    referrer: cleanText(body.referrer, 320),
    user_agent_hash: userAgentHash,
    email_hash: emailHash,
    metadata: cleanMetadata(body.metadata),
  });

  if (error) {
    console.error("Launch attribution event insert failed:", error.message);
    return NextResponse.json({ ok: true, stored: false });
  }

  return NextResponse.json({ ok: true, stored: true });
}
