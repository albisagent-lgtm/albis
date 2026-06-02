import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAiReviewCard } from "@/lib/feed-ai-review-card";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;

type SignalRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
};

function authOk(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return Boolean(INGEST_KEY && token === INGEST_KEY);
}

function cleanUrls(value: unknown) {
  return Array.isArray(value)
    ? value.map((url) => String(url || "").trim()).filter(Boolean).slice(0, 8)
    : [];
}

function cleanText(value: unknown, max = 1000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

async function markStatus(id: string, metadata: Record<string, unknown>, status: string, extra: Record<string, unknown> = {}) {
  const supabase = createAdminClient();
  await supabase
    .from("albis_live_signals")
    .update({
      metadata: {
        ...metadata,
        ai_review_status: status,
        ...extra,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

async function processRow(row: SignalRow) {
  const metadata = row.metadata || {};
  const sourceUrls = cleanUrls(metadata.source_urls);
  if (sourceUrls.length === 0) {
    await markStatus(row.id, metadata, "failed", { ai_error: "missing_source_urls" });
    return { id: row.id, slug: row.slug, status: "failed", reason: "missing_source_urls" };
  }

  await markStatus(row.id, metadata, "processing", { ai_review_started_at: new Date().toISOString() });

  try {
    const authorName = cleanText(metadata.author_name, 80) || "Reader";
    const review = await generateAiReviewCard({
      title: cleanText(row.title, 140),
      context: cleanText(row.summary, 1400),
      sourceUrls,
      authorName,
    });

    const nextMetadata = {
      ...metadata,
      ai_review_status: "generated",
      ai_model_used: review.modelUsed,
      ai_error: null,
      ai_review_completed_at: new Date().toISOString(),
      source_read_domains: review.sourceReads.map((source) => source.domain),
    };

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("albis_live_signals")
      .update({
        title: review.card.title,
        summary: review.card.summary,
        bullets: review.card.bullets,
        still_unclear: review.card.still_unclear || null,
        tags: [...new Set([...(row.tags || []), ...(review.card.tags || [])])].slice(0, 10),
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (error) throw error;
    return { id: row.id, slug: row.slug, status: "generated" };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300);
    await markStatus(row.id, metadata, "failed", {
      ai_error: message,
      ai_review_failed_at: new Date().toISOString(),
    });
    return { id: row.id, slug: row.slug, status: "failed", reason: message };
  }
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const limit = Math.max(1, Math.min(Number(body.limit || process.env.ALBIS_FEED_AI_REVIEW_BATCH_LIMIT || 5), 25));
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("albis_live_signals")
    .select("id,slug,title,summary,tags,metadata")
    .eq("metadata->>ai_review_requested", "true")
    .eq("metadata->>ai_review_status", "queued")
    .order("published_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[feed-ai-review] load failed", error.message);
    return NextResponse.json({ error: "Could not load queued AI reviews." }, { status: 500 });
  }

  const rows = (data || []) as SignalRow[];
  const results = [];
  for (const row of rows) {
    // Serial by default to keep provider rate limits and source fetching sane.
    // Increase cron frequency/batch size, or move to Cloudflare Queues, when volume grows.
    results.push(await processRow(row));
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
