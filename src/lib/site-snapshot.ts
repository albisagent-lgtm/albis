// src/lib/site-snapshot.ts
//
// Reader for the site_snapshot singleton row — the pre-computed view of
// "what the public site needs right now" that OpenClaw populates at the end
// of each scan run. See supabase/migrations/20260416_site_snapshot.sql for
// the table shape and docs/Cloudflare_Execution_Plan.md § D for the contract.
//
// Consumers (this PR): src/app/page.tsx, src/app/api/scans/today/route.ts.
// More consumers swap over in subsequent PRs (see § H of the execution plan).
//
// This reader uses the anon/cookie-aware server client — the RLS policy in
// the migration allows anon SELECT, so public pages don't need the service
// role. The writer (scripts/write-site-snapshot.ts) uses the admin client.
//
// Empty-state handling: if the row is missing entirely OR has no scan data
// populated yet (scan_date is null), we return a sentinel object with
// isEmpty = true. Consumers render a calm "Today's briefing is being
// prepared." state instead of erroring. We never fall back to getTodayScan()
// — that defeats the whole point of the snapshot.
//
// Note on unstable_cache: the Next.js 16 caching API is in flux (see the
// `'use cache'` directive and related churn). The consuming pages already
// have `revalidate = N` set, which handles ISR-level caching. We deliberately
// do NOT wrap with unstable_cache in this PR — adding a third caching layer
// risks surprises. Revisit if profiling shows the Supabase round-trip is hot.

import { createClient } from "@/lib/supabase/server";
import type { ScanItem, PatternOfDay } from "@/lib/scan-types";

export interface BriefingTopStory {
  region: string;
  headline: string;
}

export interface SiteSnapshot {
  // Per-section presence flags. Each source populates independently, so
  // consumers gate each UI slot on its own flag rather than a global sentinel.
  hasScan: boolean;
  hasBriefing: boolean;
  hasTopPgi: boolean;
  hasTopGai: boolean;
  hasBreaking: boolean;
  // Convenience: true only if none of the per-section flags are true.
  // Kept for legacy consumers; new code should gate on the specific flag.
  isEmpty: boolean;
  updatedAt: string | null;

  // Scan-derived
  scanDate: string | null;
  scanPeriod: string | null;
  scanDisplayDate: string | null;
  topTheme: string | null;
  mood: string | null;
  framingNote: string | null;
  patternOfDay: PatternOfDay | null;
  items: ScanItem[];
  blindspotStorySlugs: string[];

  // Briefing header
  briefingDate: string | null;
  briefingTitle: string | null;
  briefingSummary: string | null;
  briefingTopStories: BriefingTopStory[];
  briefingStoryCount: number | null;
  briefingPgiScore: number | null;

  // Top stories
  topPgiStory: string | null;
  topPgiScore: number | null;
  topPgiStorySlug: string | null;
  topGaiStory: string | null;
  topGaiScore: number | null;

  // Mood + counts
  globalMood: string | null;
  storiesFound: number | null;

  // Breaking news
  breakingActive: boolean;
  breakingHeadline: string | null;
  breakingUrl: string | null;
  breakingExpiresAt: string | null;
}

const EMPTY_SNAPSHOT: SiteSnapshot = {
  hasScan: false,
  hasBriefing: false,
  hasTopPgi: false,
  hasTopGai: false,
  hasBreaking: false,
  isEmpty: true,
  updatedAt: null,
  scanDate: null,
  scanPeriod: null,
  scanDisplayDate: null,
  topTheme: null,
  mood: null,
  framingNote: null,
  patternOfDay: null,
  items: [],
  blindspotStorySlugs: [],
  briefingDate: null,
  briefingTitle: null,
  briefingSummary: null,
  briefingTopStories: [],
  briefingStoryCount: null,
  briefingPgiScore: null,
  topPgiStory: null,
  topPgiScore: null,
  topPgiStorySlug: null,
  topGaiStory: null,
  topGaiScore: null,
  globalMood: null,
  storiesFound: null,
  breakingActive: false,
  breakingHeadline: null,
  breakingUrl: null,
  breakingExpiresAt: null,
};

// Raw row shape as it comes back from Supabase — matches the column names
// in supabase/migrations/20260416_site_snapshot.sql.
interface SiteSnapshotRow {
  id: number;
  updated_at: string;
  scan_date: string | null;
  scan_period: string | null;
  scan_display_date: string | null;
  top_theme: string | null;
  mood: string | null;
  framing_note: string | null;
  pattern_of_day: PatternOfDay | null;
  items: ScanItem[] | null;
  blindspot_story_slugs: string[] | null;
  briefing_date: string | null;
  briefing_title: string | null;
  briefing_summary: string | null;
  briefing_top_stories: BriefingTopStory[] | null;
  briefing_story_count: number | null;
  briefing_pgi_score: number | null;
  top_pgi_story: string | null;
  top_pgi_score: number | null;
  top_pgi_story_slug: string | null;
  top_gai_story: string | null;
  top_gai_score: number | null;
  global_mood: string | null;
  stories_found: number | null;
  breaking_active: boolean | null;
  breaking_headline: string | null;
  breaking_url: string | null;
  breaking_expires_at: string | null;
}

function toSnapshot(row: SiteSnapshotRow): SiteSnapshot {
  const hasScan = row.scan_date !== null;
  const hasBriefing = row.briefing_date !== null;
  const hasTopPgi = row.top_pgi_story !== null;
  const hasTopGai = row.top_gai_story !== null;
  const hasBreaking = row.breaking_active === true;
  return {
    hasScan,
    hasBriefing,
    hasTopPgi,
    hasTopGai,
    hasBreaking,
    isEmpty: !hasScan && !hasBriefing && !hasTopPgi && !hasTopGai && !hasBreaking,
    updatedAt: row.updated_at,
    scanDate: row.scan_date,
    scanPeriod: row.scan_period,
    scanDisplayDate: row.scan_display_date,
    topTheme: row.top_theme,
    mood: row.mood,
    framingNote: row.framing_note,
    patternOfDay: row.pattern_of_day,
    items: Array.isArray(row.items) ? row.items : [],
    blindspotStorySlugs: Array.isArray(row.blindspot_story_slugs)
      ? row.blindspot_story_slugs
      : [],
    briefingDate: row.briefing_date,
    briefingTitle: row.briefing_title,
    briefingSummary: row.briefing_summary,
    briefingTopStories: Array.isArray(row.briefing_top_stories)
      ? row.briefing_top_stories
      : [],
    briefingStoryCount: row.briefing_story_count,
    briefingPgiScore: row.briefing_pgi_score,
    topPgiStory: row.top_pgi_story,
    topPgiScore: row.top_pgi_score,
    topPgiStorySlug: row.top_pgi_story_slug,
    topGaiStory: row.top_gai_story,
    topGaiScore: row.top_gai_score,
    globalMood: row.global_mood,
    storiesFound: row.stories_found,
    breakingActive: row.breaking_active === true,
    breakingHeadline: row.breaking_headline,
    breakingUrl: row.breaking_url,
    breakingExpiresAt: row.breaking_expires_at,
  };
}

/**
 * Read the singleton site_snapshot row. Never throws. Returns an empty-state
 * sentinel if the row is missing, unpopulated, or the query fails — the
 * consuming page is expected to render a calm empty state in that case.
 */
export async function getSiteSnapshot(): Promise<SiteSnapshot> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_snapshot")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.warn("[site-snapshot] query error:", error.message);
      return EMPTY_SNAPSHOT;
    }
    if (!data) {
      console.warn("[site-snapshot] singleton row missing (id=1)");
      return EMPTY_SNAPSHOT;
    }

    return toSnapshot(data as SiteSnapshotRow);
  } catch (err) {
    console.warn("[site-snapshot] unexpected read failure:", err);
    return EMPTY_SNAPSHOT;
  }
}
