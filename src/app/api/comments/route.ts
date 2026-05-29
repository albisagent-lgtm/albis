import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPostBySlug } from "@/lib/blog";

export const dynamic = "force-dynamic";

type CommentRow = {
  id: string;
  article_slug: string;
  parent_id: string | null;
  author_id: string | null;
  author_name: string | null;
  is_anonymous: boolean;
  body: string;
  status: "visible" | "pending" | "hidden";
  created_at: string;
  updated_at: string;
};

const MAX_BODY_LENGTH = 1800;
const MIN_BODY_LENGTH = 3;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX = 5;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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

function cleanName(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  return raw.replace(/\s+/g, " ").slice(0, 60);
}

function cleanBody(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n");
}

function initialStatus(body: string) {
  const urls = body.match(/https?:\/\//gi)?.length || 0;
  if (urls >= 3) return "pending";
  if (/\b(casino|viagra|crypto bonus|forex signals|telegram pump)\b/i.test(body)) return "pending";
  return "visible";
}

function publicComment(row: CommentRow) {
  return {
    id: row.id,
    parent_id: row.parent_id,
    author_name: row.author_name || "Guest",
    is_anonymous: row.is_anonymous,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") || "").trim();

  if (!slug) return jsonError("Missing article slug.");

  const post = await getPostBySlug(slug);
  if (!post) return jsonError("Article not found.", 404);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("article_comments")
    .select("id, article_slug, parent_id, author_id, author_name, is_anonymous, body, status, created_at, updated_at")
    .eq("article_slug", slug)
    .eq("status", "visible")
    .order("created_at", { ascending: true })
    .limit(300);

  if (error) {
    if (error.code === "42P01" || /article_comments/i.test(error.message)) {
      return NextResponse.json({ comments: [], unavailable: true });
    }
    console.error("[comments] fetch failed", error.message);
    return jsonError("Could not load comments.", 500);
  }

  return NextResponse.json({ comments: (data || []).map((row) => publicComment(row as CommentRow)), unavailable: false });
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid comment payload.");
  }

  // Honeypot field. Real users never fill this.
  if (payload.website) {
    return NextResponse.json({ ok: true, comment: null });
  }

  const articleSlug = typeof payload.article_slug === "string" ? payload.article_slug.trim() : "";
  const parentId = typeof payload.parent_id === "string" && payload.parent_id.trim() ? payload.parent_id.trim() : null;
  const body = cleanBody(payload.body);
  const guestName = cleanName(payload.author_name);

  if (!articleSlug) return jsonError("Missing article slug.");
  if (body.length < MIN_BODY_LENGTH) return jsonError("Please write a little more before posting.");
  if (body.length > MAX_BODY_LENGTH) return jsonError(`Comments must be ${MAX_BODY_LENGTH} characters or fewer.`);

  const post = await getPostBySlug(articleSlug);
  if (!post) return jsonError("Article not found.", 404);

  const supabase = createAdminClient();
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("article_comments")
      .select("id, article_slug, parent_id, status")
      .eq("id", parentId)
      .single();

    if (parentError || !parent || parent.article_slug !== articleSlug || parent.status !== "visible") {
      return jsonError("Could not find the comment you are replying to.", 404);
    }

    if (parent.parent_id) {
      return jsonError("Replies can only be one level deep for now.");
    }
  }

  const ipHash = await hashValue(getClientIp(request));
  const userAgentHash = await hashValue(request.headers.get("user-agent") || "unknown");
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error: countError } = await supabase
    .from("article_comments")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (countError) {
    if (countError.code === "42P01" || /article_comments/i.test(countError.message)) {
      return jsonError("Conversation is almost ready. Please try again soon.", 503);
    }
    console.error("[comments] rate-limit check failed", countError.message);
  } else if ((count || 0) >= RATE_LIMIT_MAX) {
    return jsonError("Please wait a few minutes before posting another comment.", 429);
  }

  const authorName = user
    ? cleanName(user.user_metadata?.name) || cleanName(user.email?.split("@")[0]) || guestName || "Reader"
    : guestName || "Guest";

  const insert = {
    article_slug: articleSlug,
    parent_id: parentId,
    author_id: user?.id || null,
    author_name: authorName,
    is_anonymous: !user,
    body,
    status: initialStatus(body),
    ip_hash: ipHash,
    user_agent_hash: userAgentHash,
  };

  const { data, error } = await supabase
    .from("article_comments")
    .insert(insert)
    .select("id, article_slug, parent_id, author_id, author_name, is_anonymous, body, status, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "42P01" || /article_comments/i.test(error.message)) {
      return jsonError("Conversation is almost ready. Please try again soon.", 503);
    }
    console.error("[comments] insert failed", error.message);
    return jsonError("Could not post comment.", 500);
  }

  const row = data as CommentRow;
  return NextResponse.json({
    ok: true,
    status: row.status,
    comment: row.status === "visible" ? publicComment(row) : null,
    message: row.status === "pending" ? "Thanks — your comment is waiting for review." : "Thanks — your comment is live.",
  });
}
