import { cache } from "react";
import { createAnonClient } from "./supabase/anon";
import { createAdminClient } from "./supabase/admin";
import { humaniseSeconds } from "./time-clock";
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

export const getSignalsByAuthorHandle = cache(async (handle: string, limit = 24): Promise<Signal[]> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  const cleanHandle = String(handle || "").trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 80);
  if (!cleanHandle) return [];
  const names = [`@${cleanHandle}`, cleanHandle];
  try {
    const supabase = createAnonClient();
    if (cleanHandle === "albis") {
      const { data, error } = await supabase
        .from("albis_live_signals")
        .select(SIGNAL_COLUMNS)
        .eq("status", "published")
        .or("metadata->>author_name.eq.Albis,metadata->>author_name.eq.@albis,category.not.ilike.people-%")
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) {
        if (error.code === "42P01" || /signals/i.test(error.message)) return [];
        console.error("[signals] getSignalsByAuthorHandle(albis) failed", error.message);
        return [];
      }
      return (data || []).map((row) => normaliseSignal(row as Record<string, unknown>));
    }
    const results: Signal[] = [];
    for (const name of names) {
      const { data, error } = await supabase
        .from("albis_live_signals")
        .select(SIGNAL_COLUMNS)
        .eq("status", "published")
        .eq("metadata->>author_name", name)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) {
        if (error.code === "42P01" || /signals/i.test(error.message)) return [];
        console.error(`[signals] getSignalsByAuthorHandle(${cleanHandle}) failed`, error.message);
        continue;
      }
      results.push(...(data || []).map((row) => normaliseSignal(row as Record<string, unknown>)));
    }
    const seen = new Set<string>();
    return results
      .filter((signal) => {
        if (seen.has(signal.id)) return false;
        seen.add(signal.id);
        return true;
      })
      .sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error(`[signals] getSignalsByAuthorHandle(${cleanHandle}) threw`, error);
    return [];
  }
});

export type PublicProfileStats = {
  cards_count: number;
  context_count: number;
  comments_count: number;
  sources_count: number;
  opened_count: number;
  time_contributed_seconds: number;
  time_helped_seconds: number;
  time_seconds: number;
  time_contributed_label: string;
  time_helped_label: string;
  time_label: string;
  has_tracked_time: boolean;
  latest_context: Array<{ id: string; title: string; href: string; type: string; created_at: string }>;
};

export type TimeLeaderboardEntry = {
  handle: string;
  display_name: string;
  avatar_url: string | null;
  time_seconds: number;
  time_label: string;
  cards_count: number;
  context_count: number;
  sources_count: number;
  opened_count: number;
};

function signalAuthorUserIds(cards: Signal[]) {
  return [...new Set(cards
    .map((card) => typeof card.metadata?.author_id === "string" ? card.metadata.author_id : null)
    .filter((id): id is string => Boolean(id)))];
}

function signalAuthorNames(handle: string, cards: Signal[]) {
  const clean = handle.replace(/^@+/, "").toLowerCase();
  return [...new Set([
    clean,
    `@${clean}`,
    clean === "albis" ? "Albis" : null,
    ...cards.map((card) => typeof card.metadata?.author_name === "string" ? card.metadata.author_name : null),
    ...cards.map((card) => typeof card.metadata?.author_display_name === "string" ? card.metadata.author_display_name : null),
  ].filter((name): name is string => Boolean(name)))];
}

function signalMetaString(signal: Signal, key: string) {
  const value = signal.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function profileFromSignalCards(handle: string, cards: Signal[]) {
  if (handle === "albis") {
    return { displayName: "Albis", avatarUrl: null };
  }
  const first = cards.find((card) => signalMetaString(card, "author_name") || signalMetaString(card, "author_display_name") || signalMetaString(card, "author_avatar_url"));
  return {
    displayName: first ? signalMetaString(first, "author_display_name") || signalMetaString(first, "author_name") || `@${handle}` : `@${handle}`,
    avatarUrl: first ? signalMetaString(first, "author_avatar_url") : null,
  };
}

function metadataSeconds(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  const metadata = value as Record<string, unknown>;
  const eventSubtype = typeof metadata.event_subtype === "string" ? metadata.event_subtype : "";
  if (eventSubtype && eventSubtype !== "active_dwell") return 0;
  const seconds = Math.floor(Number(metadata.seconds || metadata.active_seconds || 0));
  if (!Number.isFinite(seconds)) return 0;
  return Math.min(Math.max(seconds, 0), 300);
}

export const getPublicProfileStats = cache(async (handle: string, cards: Signal[]): Promise<PublicProfileStats> => {
  const cleanHandle = String(handle || "").trim().replace(/^@+/, "").toLowerCase();
  const userIds = signalAuthorUserIds(cards);
  const authorNames = signalAuthorNames(cleanHandle, cards);
  const cardSlugs = [...new Set(cards.map((card) => card.slug).filter(Boolean))];
  const commentSlugToSignalSlug = new Map(cards.map((card) => [card.article_slug || `signal-${card.id}`, card.slug]));
  const sourcesCount = cards.filter((card) => Boolean(card.article_url || card.metadata?.source_url)).length;
  const contextCountFromCards = cards.reduce((total, card) => total + Number(card.comment_count || 0), 0);

  const stats: PublicProfileStats = {
    cards_count: cards.length,
    context_count: contextCountFromCards,
    comments_count: 0,
    sources_count: sourcesCount,
    opened_count: 0,
    time_contributed_seconds: 0,
    time_helped_seconds: 0,
    time_seconds: 0,
    time_contributed_label: "0s",
    time_helped_label: "0s",
    time_label: "0s",
    has_tracked_time: false,
    latest_context: [],
  };

  try {
    const supabase = createAdminClient();

    if (userIds.length) {
      const { data, error } = await supabase
        .from("time_clock_totals")
        .select("seconds_spent, seconds_gained, events_count")
        .in("user_id", userIds);
      if (!error) {
        for (const row of data || []) {
          stats.time_contributed_seconds += Number(row.seconds_spent || 0);
          stats.time_helped_seconds += Number(row.seconds_gained || 0);
          stats.has_tracked_time = stats.has_tracked_time || Number(row.events_count || 0) > 0;
        }
      }
    }

    if (cardSlugs.length) {
      const { data, error } = await supabase
        .from("feed_events")
        .select("event_type, user_id, anon_id, metadata")
        .in("card_slug", cardSlugs)
        .limit(5000);
      if (!error) {
        const openActors = new Set<string>();
        for (const row of data || []) {
          const actor = row.user_id || row.anon_id || Math.random().toString(36);
          if (row.event_type === "open") openActors.add(String(actor));
          stats.time_helped_seconds += metadataSeconds(row.metadata);
        }
        stats.opened_count = openActors.size;
      }
    }

    const commentRows: Array<{ id: string; article_slug: string; author_name: string | null; body: string; created_at: string }> = [];
    if (userIds.length) {
      const { data, error } = await supabase
        .from("article_comments")
        .select("id, article_slug, author_name, body, created_at")
        .eq("status", "visible")
        .in("author_id", userIds)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error) commentRows.push(...(data || []));
    }
    if (authorNames.length) {
      const { data, error } = await supabase
        .from("article_comments")
        .select("id, article_slug, author_name, body, created_at")
        .eq("status", "visible")
        .in("author_name", authorNames)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error) commentRows.push(...(data || []));
    }

    const seenComments = new Set<string>();
    const uniqueComments = commentRows.filter((row) => {
      if (seenComments.has(row.id)) return false;
      seenComments.add(row.id);
      return true;
    });

    stats.comments_count = uniqueComments.length;
    stats.context_count += uniqueComments.length;
    stats.latest_context = uniqueComments.slice(0, 5).map((row) => ({
      id: row.id,
      title: row.body.replace(/^\[[^\]]+\]\s*/gm, "").replace(/\s+/g, " ").trim().slice(0, 110) || "Added context",
      href: `/signals/${encodeURIComponent(commentSlugToSignalSlug.get(row.article_slug) || row.article_slug)}#comments`,
      type: "Context",
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error(`[signals] getPublicProfileStats(${cleanHandle}) failed`, error);
  }

  if (!stats.has_tracked_time && stats.time_contributed_seconds === 0) {
    // Backfill-light estimate so older public profiles do not look empty before
    // the live timers collect enough authenticated activity.
    stats.time_contributed_seconds = Math.max(0, cards.length * 90 + stats.comments_count * 60);
  }

  // Public Time is deliberately usefulness-led: it measures meaningful active
  // time other people spend with this profile's cards/articles/context, not the
  // amount of time the profile owner spends scrolling Albis.
  stats.time_seconds = stats.time_helped_seconds;
  stats.time_contributed_label = humaniseSeconds(stats.time_contributed_seconds);
  stats.time_helped_label = humaniseSeconds(stats.time_helped_seconds);
  stats.time_label = humaniseSeconds(stats.time_seconds);
  return stats;
});

export const getTimeLeaderboard = cache(async (limit = 30): Promise<TimeLeaderboardEntry[]> => {
  const signals = await getSignals({ limit: 500 });
  const byHandle = new Map<string, Signal[]>();

  for (const signal of signals) {
    const rawName = typeof signal.metadata?.author_name === "string" ? signal.metadata.author_name : "albis";
    const handle = authorProfileHandle(rawName) || "albis";
    const list = byHandle.get(handle) || [];
    list.push(signal);
    byHandle.set(handle, list);
  }

  const entries: TimeLeaderboardEntry[] = [];
  for (const [handle, cards] of byHandle.entries()) {
    const profile = profileFromSignalCards(handle, cards);
    const stats = await getPublicProfileStats(handle, cards);
    entries.push({
      handle,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      time_seconds: stats.time_seconds,
      time_label: stats.time_label,
      cards_count: stats.cards_count,
      context_count: stats.context_count,
      sources_count: stats.sources_count,
      opened_count: stats.opened_count,
    });
  }

  return entries
    .sort((a, b) => b.time_seconds - a.time_seconds || b.cards_count - a.cards_count || a.handle.localeCompare(b.handle))
    .slice(0, limit);
});

export function authorProfileHandle(authorName: unknown) {
  const clean = String(authorName || "").trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 80);
  return clean || null;
}

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
