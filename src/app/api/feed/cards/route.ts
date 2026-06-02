import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateAiReviewCard } from "@/lib/feed-ai-review-card";

export const dynamic = "force-dynamic";

const MAX_TITLE_LENGTH = 140;
const MAX_CONTEXT_LENGTH = 1400;
const MAX_LINKS = 8;
const RATE_LIMIT_WINDOW_MINUTES = Number(process.env.ALBIS_FEED_CARD_RATE_WINDOW_MINUTES || 15);
const RATE_LIMIT_MAX = Number(process.env.ALBIS_FEED_CARD_RATE_LIMIT_MAX || 60);

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

function cleanUrls(value: unknown) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|,/) 
      : [];
  return [...new Set(rawValues.map(cleanUrl).filter((url): url is string => Boolean(url)))].slice(0, MAX_LINKS);
}

function cleanBoolean(value: unknown) {
  return value === true || value === "true";
}

function hostSummary(urls: string[]) {
  const hosts = urls.map((url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }).filter(Boolean) as string[];
  const unique = [...new Set(hosts)].slice(0, 3);
  if (unique.length === 0) return "link";
  return unique.join(", ");
}

function cleanCategory(value: unknown) {
  const raw = cleanText(value, 40).toLowerCase();
  const allowed = new Set([
    "update",
    "link",
    "question",
    "event",
    "research",
    "weather",
    "article",
    "life-systems",
    "world",
    "money",
    "tech",
    "climate",
    "health",
    "governance",
    "other",
  ]);
  return allowed.has(raw) ? raw : "update";
}

function cleanCustomSection(value: unknown) {
  const raw = cleanText(value, 60);
  return raw.replace(/[^a-zA-Z0-9 &/.-]/g, "").trim().slice(0, 60);
}

function cleanTags(value: unknown) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/,|\n|#/)
      : [];
  return [...new Set(rawValues
    .map((tag) => cleanText(tag, 36).toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-"))
    .filter(Boolean))]
    .slice(0, 8);
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

  const sourceUrls = [...new Set([cleanUrl(payload.source_url), ...cleanUrls(payload.source_urls)].filter((url): url is string => Boolean(url)))].slice(0, MAX_LINKS);
  const sourceUrl = sourceUrls[0] || null;
  const aiReviewRequested = cleanBoolean(payload.ai_review_requested);
  const rawTitle = cleanText(payload.title, MAX_TITLE_LENGTH);
  const title = rawTitle || (aiReviewRequested && sourceUrls.length ? `AI review requested: ${hostSummary(sourceUrls)}` : "");
  const context = cleanBody(payload.context, MAX_CONTEXT_LENGTH);
  const category = cleanCategory(payload.category);
  const customSection = cleanCustomSection(payload.custom_section);
  const userTags = cleanTags(payload.user_tags);
  const customSectionTag = customSection
    ? customSection.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").slice(0, 36)
    : null;

  if (title.length < 3) return jsonError("Add a short title, or submit at least one link for AI review.");
  if (!context && sourceUrls.length === 0) return jsonError("Add context or at least one link.");

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

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
    user?.user_metadata?.username ? `@${user.user_metadata.username}` : user?.user_metadata?.name || user?.email?.split("@")[0] || "Reader",
    80
  );
  const now = new Date().toISOString();
  let finalTitle = title;
  let summary = aiReviewRequested
    ? context || `Submitted ${sourceUrls.length} link${sourceUrls.length === 1 ? "" : "s"} for Albis AI review.`
    : context || sourceUrl || "";
  let bullets = context
    ? context.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 4)
    : sourceUrls.slice(0, 4);
  let stillUnclear: string | null = null;
  let aiReviewStatus: "not_requested" | "queued" | "generated" | "failed" = aiReviewRequested ? "queued" : "not_requested";
  let aiModelUsed: string | null = null;
  let aiError: string | null = null;
  let sourceReadDomains: string[] = [];
  let aiTags: string[] = [];

  if (aiReviewRequested && sourceUrls.length > 0 && process.env.ALBIS_FEED_AI_REVIEW_MODE === "inline") {
    try {
      const review = await generateAiReviewCard({ title: rawTitle, context, sourceUrls, authorName });
      finalTitle = review.card.title || finalTitle;
      summary = review.card.summary || summary;
      bullets = review.card.bullets.length ? review.card.bullets : bullets;
      stillUnclear = review.card.still_unclear || null;
      aiModelUsed = review.modelUsed;
      aiReviewStatus = "generated";
      sourceReadDomains = review.sourceReads.map((source) => source.domain);
      aiTags = review.card.tags || [];
    } catch (error) {
      aiError = error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300);
      aiReviewStatus = "failed";
      console.error("[feed-cards] AI review generation failed", aiError);
    }
  }

  const slug = slugify(finalTitle);

  const row = {
    slug,
    article_slug: null,
    article_url: sourceUrl,
    title: finalTitle,
    summary,
    bullets,
    still_unclear: stillUnclear,
    category: `people-${category}`,
    region: null,
    tags: [...new Set(["people", category, customSectionTag, ...userTags, ...aiTags].filter(Boolean) as string[])].slice(0, 14),
    source_note: aiReviewRequested ? "AI review requested" : sourceUrls.length > 1 ? `${sourceUrls.length} links attached` : sourceUrl ? "Link attached" : "Reader card",
    status: "published",
    priority: 35,
    comment_count: 0,
    last_activity_at: now,
    published_at: now,
    updated_at: now,
    metadata: {
      card_type: category,
      created_via: "create-page",
      author_id: user?.id || null,
      author_name: authorName,
      author_email_domain: user?.email?.split("@")[1] || null,
      source_url: sourceUrl,
      source_urls: sourceUrls,
      user_tags: userTags,
      system_section: category,
      custom_section: customSection || null,
      discovery_section: customSection || category,
      ai_review_requested: aiReviewRequested,
      ai_review_status: aiReviewStatus,
      ai_model_used: aiModelUsed,
      ai_error: aiError,
      source_read_domains: sourceReadDomains,
      creation_mode: aiReviewRequested ? "ai-review-auto" : "manual-card",
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
    message: aiReviewRequested && aiReviewStatus === "generated" ? "AI review card posted." : aiReviewRequested ? "Card posted. AI review is generating automatically." : "Card posted.",
  });
}
