// ---------------------------------------------------------------------------
// Coverage builder — Package 3 (transparency / coverage layer)
//
// Companion to the briefing. The briefing answers "what should you read";
// coverage answers "what did the system look at on your behalf, and what
// stayed quiet?" Output is persisted to company_coverage_summaries (one row
// per company per day).
//
// Strictly deterministic. No LLM calls. All Supabase reads are wrapped at
// the pipeline call site so coverage failure is non-fatal to the briefing.
// ---------------------------------------------------------------------------
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyProfile } from "./company-profile";
import type { ScoredStory, ScanItemInput, MatchReason } from "./relevance-engine";
import type { Signal } from "./company-scan/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrackedItemType =
  | "theme"
  | "entity"
  | "region"
  | "sector"
  | "risk"
  | "supply_chain";

export interface TrackedItemEntry {
  type: TrackedItemType;
  value: string;
  matched_signal_count: number;
  last_movement_at: string | null;
}

export interface SilentItemEntry {
  type: TrackedItemType;
  value: string;
}

export interface SourcesInspected {
  total: number;
  by_language: Record<string, number>;
  by_region: Record<string, number>;
}

export interface EarlySignalEntry {
  signal_headline: string;
  sources: string[];
  briefing_item_ref: string;
}

export interface CoverageSummary {
  tracked_items_checked: TrackedItemEntry[];
  sources_inspected: SourcesInspected;
  early_signals: EarlySignalEntry[];
  silent_items: SilentItemEntry[];
  summary_text: string;
}

// ---------------------------------------------------------------------------
// Mainstream English-language source allowlist (V1 heuristic).
// A scored signal whose headline + connection text contain none of these
// names AND whose relevance score clears EARLY_SIGNAL_THRESHOLD is treated
// as "found outside the mainstream English-language pool". Package 5
// revisits this with proper per-source metadata.
// ---------------------------------------------------------------------------
export const MAINSTREAM_EN_SOURCES = [
  "Reuters",
  "Bloomberg",
  "Financial Times",
  "FT",
  "New York Times",
  "NYT",
  "Wall Street Journal",
  "WSJ",
  "BBC",
  "The Guardian",
  "Associated Press",
  "AP",
  "CNN",
  "CNBC",
  "Politico",
  "Washington Post",
];

const EARLY_SIGNAL_THRESHOLD = 0.05;
const EARLY_SIGNAL_CAP = 3;

// match_reasons.type → which profile field the matched values come from.
const TYPE_TO_PROFILE_FIELD: Record<MatchReason["type"], TrackedItemType | null> = {
  geography: "region",
  sector: "sector",
  tracked_theme: "theme",
  watchlist_entity: "entity",
  supply_chain: "supply_chain",
  risk_priority: "risk",
  urgency: null,
  significance: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function trackedItemKey(type: TrackedItemType, value: string): string {
  return `${type}::${value.toLowerCase()}`;
}

function collectTrackedItems(profile: CompanyProfile): TrackedItemEntry[] {
  const seen = new Set<string>();
  const items: TrackedItemEntry[] = [];

  function add(type: TrackedItemType, value: string | null | undefined) {
    if (!value) return;
    const key = trackedItemKey(type, value);
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ type, value, matched_signal_count: 0, last_movement_at: null });
  }

  for (const v of profile.tracked_themes || []) add("theme", v);
  for (const v of profile.watchlist_entities || []) add("entity", v);
  for (const v of profile.regions || []) add("region", v);
  for (const v of profile.risk_priorities || []) add("risk", v);
  for (const v of profile.supply_chain_exposure || []) add("supply_chain", v);
  add("sector", profile.sector);
  add("sector", profile.sub_sector);

  return items;
}

function countTodayMatches(
  items: TrackedItemEntry[],
  scoredStories: ScoredStory[]
): void {
  if (items.length === 0) return;

  const counts = new Map<string, number>();
  for (const story of scoredStories) {
    const seenInThisStory = new Set<string>();
    for (const reason of story.match_reasons || []) {
      const itemType = TYPE_TO_PROFILE_FIELD[reason.type];
      if (!itemType) continue;
      for (const matched of reason.matched || []) {
        const key = trackedItemKey(itemType, matched);
        if (seenInThisStory.has(key)) continue;
        seenInThisStory.add(key);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }

  for (const item of items) {
    const key = trackedItemKey(item.type, item.value);
    item.matched_signal_count = counts.get(key) || 0;
  }
}

async function annotateLastMovement(
  supabase: SupabaseClient,
  companyProfileId: string,
  scanDate: string,
  items: TrackedItemEntry[]
): Promise<void> {
  if (items.length === 0) return;

  // Pull all historical company_story_scores rows for this company, ordered
  // newest first. Walk locally, recording the most recent scan_date each
  // tracked item appeared in. Cheaper than N per-item queries; richer
  // history support arrives in Package 5.
  const { data, error } = await supabase
    .from("company_story_scores")
    .select("scan_date, match_reasons")
    .eq("company_profile_id", companyProfileId)
    .order("scan_date", { ascending: false });

  if (error) throw new Error(`coverage history query failed: ${error.message}`);

  const lastSeen = new Map<string, string>();
  for (const row of data || []) {
    const rowDate = row.scan_date as string;
    // Skip the current scan date — that's "today", not "last movement".
    if (rowDate === scanDate) continue;

    const reasons = (row.match_reasons || []) as MatchReason[];
    for (const reason of reasons) {
      const itemType = TYPE_TO_PROFILE_FIELD[reason.type];
      if (!itemType) continue;
      for (const matched of reason.matched || []) {
        const key = trackedItemKey(itemType, matched);
        if (!lastSeen.has(key)) lastSeen.set(key, rowDate);
      }
    }
  }

  for (const item of items) {
    const key = trackedItemKey(item.type, item.value);
    item.last_movement_at = lastSeen.get(key) || null;
  }
}

function buildSourcesInspected(scanItems: ScanItemInput[]): SourcesInspected {
  // Public scan_items carry no language or source-URL metadata, so the
  // legacy code path ships total only — never invent breakdowns. The
  // signals-aware variant below populates by_language / by_region from
  // real signal source metadata.
  return {
    total: scanItems.length,
    by_language: {},
    by_region: {},
  };
}

function buildSourcesInspectedFromSignals(signals: Signal[]): SourcesInspected {
  const by_language: Record<string, number> = {};
  const by_region: Record<string, number> = {};
  for (const sig of signals) {
    if (sig.source_language) {
      by_language[sig.source_language] = (by_language[sig.source_language] || 0) + 1;
    }
    if (sig.source_region) {
      by_region[sig.source_region] = (by_region[sig.source_region] || 0) + 1;
    }
  }
  return {
    total: signals.length,
    by_language,
    by_region,
  };
}

function isMainstreamEnglish(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  for (const name of MAINSTREAM_EN_SOURCES) {
    if (lower.includes(name.toLowerCase())) return true;
  }
  return false;
}

function buildEarlySignals(scoredStories: ScoredStory[]): EarlySignalEntry[] {
  // V1 heuristic: scan_items don't carry source attribution yet, so we look
  // for mainstream-source mentions inside the headline + connection text. A
  // story above threshold whose text mentions none of the allowlist names
  // counts as "outside mainstream English coverage". Package 5 replaces
  // this with real source metadata.
  const candidates = scoredStories
    .filter((s) => s.relevance_score >= EARLY_SIGNAL_THRESHOLD)
    .filter((s) => !isMainstreamEnglish(`${s.headline} ${s.connection || ""}`));

  return candidates.slice(0, EARLY_SIGNAL_CAP).map((s) => ({
    signal_headline: s.headline,
    sources: [],
    briefing_item_ref: s.headline,
  }));
}

function formatCoverageDate(scanDate: string): string {
  try {
    const d = new Date(`${scanDate}T12:00:00Z`);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  } catch {
    return scanDate;
  }
}

function buildSummaryText(
  scanDate: string,
  items: TrackedItemEntry[],
  silent: SilentItemEntry[],
  sources: SourcesInspected
): string {
  const total = items.length;
  const moving = total - silent.length;
  const dateLabel = formatCoverageDate(scanDate);

  const parts: string[] = [];

  if (total === 0) {
    parts.push(`On ${dateLabel}: no tracked priorities configured yet.`);
  } else {
    parts.push(
      `On ${dateLabel}: ${moving} of ${total} tracked ${
        total === 1 ? "priority" : "priorities"
      } had movement, ${silent.length} had no material change.`
    );
  }

  parts.push(
    `${sources.total} ${sources.total === 1 ? "source" : "sources"} inspected.`
  );

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Build a deterministic coverage summary for one company on one date.
 *
 * Throws if the Supabase history read fails. Pipeline call sites must wrap
 * this in try/catch so a coverage failure cannot kill the briefing run.
 *
 * Dual-mode at v1: when `options.signals` is provided (the new typed
 * pipeline), sources_inspected.by_language and by_region come from real
 * signal source metadata. When only `scanItems` is provided (the legacy
 * public-pool pipeline), we ship total only because public scan_items
 * carry no language / source metadata. This dual mode is temporary —
 * once all briefings come from the signal pipeline (post pkg 6 cutover),
 * the scanItems path can be removed.
 */
export async function buildCoverageSummary(
  supabase: SupabaseClient,
  profile: CompanyProfile,
  scoredStories: ScoredStory[],
  scanItems: ScanItemInput[],
  scanDate: string,
  options: { signals?: Signal[] } = {}
): Promise<CoverageSummary> {
  const items = collectTrackedItems(profile);
  countTodayMatches(items, scoredStories);
  await annotateLastMovement(supabase, profile.id, scanDate, items);

  const silent: SilentItemEntry[] = items
    .filter((i) => i.matched_signal_count === 0)
    .map((i) => ({ type: i.type, value: i.value }));

  const sources_inspected = options.signals
    ? buildSourcesInspectedFromSignals(options.signals)
    : buildSourcesInspected(scanItems);
  const early_signals = buildEarlySignals(scoredStories);
  const summary_text = buildSummaryText(scanDate, items, silent, sources_inspected);

  return {
    tracked_items_checked: items,
    sources_inspected,
    early_signals,
    silent_items: silent,
    summary_text,
  };
}
