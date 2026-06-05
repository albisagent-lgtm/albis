import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPostBySlug } from "@/lib/blog";
import { addTimeClockEvent } from "@/lib/time-clock";

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

type ParentCommentRow = Pick<CommentRow, "id" | "article_slug" | "parent_id" | "author_id" | "status">;

type ReportType = "local_update" | "source" | "correction" | "context" | "question";

const REPORT_TYPES = new Set<ReportType>(["local_update", "source", "correction", "context", "question"]);
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

function cleanShortText(value: unknown, maxLength: number) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  return raw.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanSourceUrl(value: unknown) {
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


function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.replace("/", "").split(/[?&]/)[0] || null;
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v") || parsed.pathname.match(/\/shorts\/([^/?]+)/)?.[1] || null;
  } catch {
    return null;
  }
  return null;
}

function mediaType(url: string | null) {
  if (!url) return null;
  if (getYouTubeId(url)) return "youtube";
  if (/\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i.test(url)) return "image";
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) return "video";
  return "link";
}

function cleanReportType(value: unknown): ReportType | null {
  const raw = typeof value === "string" ? value.trim() : "";
  return REPORT_TYPES.has(raw as ReportType) ? raw as ReportType : null;
}

function composeBody({
  body,
  reportType,
  location,
  sourceUrl,
  mediaUrl,
}: {
  body: string;
  reportType: ReportType | null;
  location: string | null;
  sourceUrl: string | null;
  mediaUrl: string | null;
}) {
  const meta: string[] = [];
  if (reportType) meta.push(`[albis-report-type:${reportType}]`);
  if (location) meta.push(`[albis-location:${location.replace(/\]/g, "")}]`);
  if (sourceUrl) meta.push(`[albis-source:${sourceUrl.replace(/\]/g, "")}]`);
  if (mediaUrl) {
    meta.push(`[albis-media:${mediaUrl.replace(/\]/g, "")}]`);
    meta.push(`[albis-media-type:${mediaType(mediaUrl) || "link"}]`);
  }
  return meta.length ? `${meta.join("\n")}\n\n${body}` : body;
}

function parseBody(value: string) {
  let body = value || "";
  const meta: { context_type?: ReportType; location_text?: string; source_url?: string; media_url?: string; media_type?: string } = {};
  const typeMatch = body.match(/^\[albis-report-type:([^\]]+)\]\n?/m);
  if (typeMatch && REPORT_TYPES.has(typeMatch[1] as ReportType)) meta.context_type = typeMatch[1] as ReportType;
  const locationMatch = body.match(/^\[albis-location:([^\]]+)\]\n?/m);
  if (locationMatch) meta.location_text = locationMatch[1];
  const sourceMatch = body.match(/^\[albis-source:([^\]]+)\]\n?/m);
  if (sourceMatch) meta.source_url = sourceMatch[1];
  body = body
    .replace(/^\[albis-report-type:[^\]]+\]\n?/m, "")
    .replace(/^\[albis-location:[^\]]+\]\n?/m, "")
    .replace(/^\[albis-source:[^\]]+\]\n?/m, "")
    .trim();
  return { body, ...meta };
}

function initialStatus(body: string, sourceUrl?: string | null) {
  const urls = (body.match(/https?:\/\//gi)?.length || 0) + (sourceUrl ? 1 : 0);
  if (urls >= 3) return "pending";
  if (/\b(casino|viagra|crypto bonus|forex signals|telegram pump)\b/i.test(body)) return "pending";
  return "visible";
}

function isNativeCardSlug(slug: string) {
  return /^(weather|people|signal|card)-[a-z0-9][a-z0-9\-_. ]{1,180}$/i.test(slug);
}

async function resolveSignalForComment(supabase: ReturnType<typeof createAdminClient>, articleSlug: string) {
  if (articleSlug.startsWith("signal-")) {
    const id = articleSlug.replace(/^signal-/, "");
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const { data } = await supabase
        .from("albis_live_signals")
        .select("slug, metadata")
        .eq("id", id)
        .maybeSingle();
      if (data) return data as { slug: string | null; metadata: Record<string, unknown> | null };
    }
  }

  const { data } = await supabase
    .from("albis_live_signals")
    .select("slug, metadata")
    .or(`slug.eq.${articleSlug},article_slug.eq.${articleSlug}`)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  return data as { slug: string | null; metadata: Record<string, unknown> | null } | null;
}

async function resolveCommentEntityUrl(supabase: ReturnType<typeof createAdminClient>, articleSlug: string) {
  if (articleSlug.startsWith("signal-")) {
    const id = articleSlug.replace(/^signal-/, "");
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const { data } = await supabase
        .from("albis_live_signals")
        .select("slug")
        .eq("id", id)
        .maybeSingle();
      const publicSlug = typeof data?.slug === "string" ? data.slug : null;
      if (publicSlug) return `/signals/${encodeURIComponent(publicSlug)}#comments`;
    }
  }

  const signal = await resolveSignalForComment(supabase, articleSlug);
  const publicSlug = typeof signal?.slug === "string" ? signal.slug : null;
  return `/signals/${encodeURIComponent(publicSlug || articleSlug)}#comments`;
}

function signalAuthorId(signal: { metadata: Record<string, unknown> | null } | null) {
  const authorId = signal?.metadata?.author_id;
  return typeof authorId === "string" && /^[0-9a-f-]{36}$/i.test(authorId) ? authorId : null;
}

function publicComment(row: CommentRow) {
  const parsed = parseBody(row.body);
  return {
    id: row.id,
    parent_id: row.parent_id,
    author_name: row.author_name || "Guest",
    is_anonymous: row.is_anonymous,
    body: parsed.body,
    context_type: parsed.context_type || null,
    location_text: parsed.location_text || null,
    source_url: parsed.source_url || null,
    media_url: parsed.media_url || null,
    media_type: parsed.media_type || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") || "").trim();

  if (!slug) return jsonError("Missing article slug.");

  const post = await getPostBySlug(slug);
  if (!post && !isNativeCardSlug(slug)) return jsonError("Card not found.", 404);

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
  const reportType = parentId ? null : cleanReportType(payload.context_type);
  const location = parentId ? null : cleanShortText(payload.location_text, 80);
  const sourceUrl = parentId ? null : cleanSourceUrl(payload.source_url);
  const mediaUrl = cleanSourceUrl(payload.media_url);
  const storedBody = composeBody({ body, reportType, location, sourceUrl, mediaUrl });

  if (!articleSlug) return jsonError("Missing article slug.");
  if (body.length < MIN_BODY_LENGTH) return jsonError("Please write a little more before posting.");
  if (body.length > MAX_BODY_LENGTH) return jsonError(`Comments must be ${MAX_BODY_LENGTH} characters or fewer.`);
  if (payload.media_url && !mediaUrl) return jsonError("Please attach a valid http or https media/source URL.");

  const post = await getPostBySlug(articleSlug);
  if (!post && !isNativeCardSlug(articleSlug)) return jsonError("Card not found.", 404);

  const supabase = createAdminClient();
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  let parentComment: ParentCommentRow | null = null;
  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("article_comments")
      .select("id, article_slug, parent_id, author_id, status")
      .eq("id", parentId)
      .single();

    if (parentError || !parent || parent.article_slug !== articleSlug || parent.status !== "visible") {
      return jsonError("Could not find the comment you are replying to.", 404);
    }

    parentComment = parent as ParentCommentRow;

    if (parentComment.parent_id) {
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
    ? cleanName(user.user_metadata?.username ? `@${user.user_metadata.username}` : null) || cleanName(user.user_metadata?.name) || cleanName(user.email?.split("@")[0]) || guestName || "Reader"
    : guestName || "Guest";

  const insert = {
    article_slug: articleSlug,
    parent_id: parentId,
    author_id: user?.id || null,
    author_name: authorName,
    is_anonymous: !user,
    body: storedBody,
    status: initialStatus(body, sourceUrl || mediaUrl),
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

  if (row.status === "visible") {
    if (parentComment?.author_id && parentComment.author_id !== user?.id) {
      const entityUrl = await resolveCommentEntityUrl(supabase, articleSlug);
      const { error: notifyError } = await supabase
        .from("notifications")
        .insert({
          recipient_id: parentComment.author_id,
          actor_id: user?.id || null,
          type: "reply",
          title: `${authorName} replied to your context`,
          body: body.slice(0, 180),
          entity_type: "comment",
          entity_id: row.id,
          entity_url: entityUrl,
          metadata: { article_slug: articleSlug, parent_id: parentComment.id },
        });

      if (notifyError && notifyError.code !== "42P01") {
        console.error("[comments] reply notification insert failed", notifyError.message);
      }
    } else if (!parentComment) {
      const signal = await resolveSignalForComment(supabase, articleSlug);
      const authorId = signalAuthorId(signal);
      if (authorId && authorId !== user?.id) {
        const publicSlug = typeof signal?.slug === "string" ? signal.slug : articleSlug;
        const { error: notifyError } = await supabase
          .from("notifications")
          .insert({
            recipient_id: authorId,
            actor_id: user?.id || null,
            type: "comment",
            title: `${authorName} added context to your card`,
            body: body.slice(0, 180),
            entity_type: "comment",
            entity_id: row.id,
            entity_url: `/signals/${encodeURIComponent(publicSlug)}#comments`,
            metadata: { article_slug: articleSlug, context_type: reportType || null },
          });

        if (notifyError && notifyError.code !== "42P01") {
          console.error("[comments] comment notification insert failed", notifyError.message);
        }
      }
    }
  }

  if (user) {
    try {
      await addTimeClockEvent({
        userId: user.id,
        direction: "spent",
        eventType: parentId ? "reply" : "comment",
        targetType: "signal",
        targetId: articleSlug,
        seconds: Math.min(15 * 60, Math.max(20, Math.ceil(body.length / 10))),
        metadata: { comment_id: row.id, context_type: reportType || null },
      });
    } catch (timeError) {
      console.error("[comments] time event insert/upsert failed", timeError instanceof Error ? timeError.message : timeError);
    }
  }

  return NextResponse.json({
    ok: true,
    status: row.status,
    comment: row.status === "visible" ? publicComment(row) : null,
    message: row.status === "pending" ? "Thanks — your comment is waiting for review." : "Thanks — your comment is live.",
  });
}
