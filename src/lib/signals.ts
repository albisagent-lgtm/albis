import { cache } from "react";
import { createAnonClient } from "./supabase/anon";
import { createAdminClient } from "./supabase/admin";
import type { GeneratedSignal } from "./public-signal-generator";

export type Signal = {
  id: string;
  slug: string;
  article_slug: string | null;
  article_url: string | null;
  title: string;
  summary: string | null;
  bullets: string[];
  still_unclear: string | null;
  category: string | null;
  region: string | null;
  tags: string[];
  source_note: string | null;
  status: "draft" | "published" | "archived";
  priority: number | null;
  comment_count: number | null;
  last_activity_at: string | null;
  published_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
};

const SIGNAL_COLUMNS =
  "id,slug,article_slug,article_url,title,summary,bullets,still_unclear,category,region,tags,source_note,status,priority,comment_count,last_activity_at,published_at,updated_at,metadata";

function normaliseSignal(row: Record<string, unknown>): Signal {
  return {
    id: String(row.id),
    slug: String(row.slug),
    article_slug: typeof row.article_slug === "string" ? row.article_slug : null,
    article_url: typeof row.article_url === "string" ? row.article_url : null,
    title: String(row.title || ""),
    summary: typeof row.summary === "string" ? row.summary : null,
    bullets: Array.isArray(row.bullets) ? row.bullets.map(String) : [],
    still_unclear: typeof row.still_unclear === "string" ? row.still_unclear : null,
    category: typeof row.category === "string" ? row.category : null,
    region: typeof row.region === "string" ? row.region : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    source_note: typeof row.source_note === "string" ? row.source_note : null,
    status: (row.status as Signal["status"]) || "published",
    priority: typeof row.priority === "number" ? row.priority : null,
    comment_count: typeof row.comment_count === "number" ? row.comment_count : null,
    last_activity_at: typeof row.last_activity_at === "string" ? row.last_activity_at : null,
    published_at: String(row.published_at || ""),
    updated_at: String(row.updated_at || row.published_at || ""),
    metadata: (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>,
  };
}

export const getSignals = cache(async ({ limit = 24, category }: { limit?: number; category?: string } = {}): Promise<Signal[]> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  try {
    const supabase = createAnonClient();
    let query = supabase
      .from("albis_live_signals")
      .select(SIGNAL_COLUMNS)
      .eq("status", "published")
      .order("priority", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(limit);
    if (category) query = query.eq("category", category);
    const { data, error } = await query;
    if (error) {
      if (error.code === "42P01" || /signals/i.test(error.message)) return [];
      console.error("[signals] getSignals failed", error.message);
      return [];
    }
    return (data || []).map((row) => normaliseSignal(row as Record<string, unknown>));
  } catch (error) {
    console.error("[signals] getSignals threw", error);
    return [];
  }
});

export const getLatestSignals = cache(async (limit = 6) => getSignals({ limit }));

export const getSignalBySlug = cache(async (slug: string): Promise<Signal | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("albis_live_signals")
      .select(SIGNAL_COLUMNS)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) {
      if (error.code === "42P01" || /signals/i.test(error.message)) return null;
      console.error(`[signals] getSignalBySlug(${slug}) failed`, error.message);
      return null;
    }
    return data ? normaliseSignal(data as Record<string, unknown>) : null;
  } catch (error) {
    console.error(`[signals] getSignalBySlug(${slug}) threw`, error);
    return null;
  }
});

export const getSignalByArticleSlug = cache(async (articleSlug: string): Promise<Signal | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("albis_live_signals")
      .select(SIGNAL_COLUMNS)
      .eq("article_slug", articleSlug)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data ? normaliseSignal(data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
});

export async function upsertSignal(signal: GeneratedSignal) {
  const supabase = createAdminClient();
  const row = {
    slug: signal.slug,
    article_slug: signal.article_slug,
    article_url: signal.article_url,
    title: signal.title,
    summary: signal.summary,
    bullets: signal.bullets,
    still_unclear: signal.still_unclear,
    category: signal.category,
    region: signal.region,
    tags: signal.tags,
    source_note: signal.source_note,
    status: "published",
    published_at: signal.published_at || new Date().toISOString(),
    last_activity_at: signal.published_at || new Date().toISOString(),
    metadata: signal.metadata,
  };

  const { data, error } = await supabase
    .from("albis_live_signals")
    .upsert(row, { onConflict: "slug" })
    .select(SIGNAL_COLUMNS)
    .single();

  if (error) throw error;
  return normaliseSignal(data as Record<string, unknown>);
}
