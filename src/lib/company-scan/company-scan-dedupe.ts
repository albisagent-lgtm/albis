// ---------------------------------------------------------------------------
// Company Daily Scan deduplication / no-repeat layer.
//
// This is intentionally read-only: it uses previously saved company_briefings
// rows as the sent-history source. No migration or new production writes are
// required for V1. A later migration can promote this into an explicit
// per-company sent-history table, but the selection rule should live in the
// scan layer either way.
// ---------------------------------------------------------------------------

import type { SupabaseClient } from "@supabase/supabase-js";

export interface SentScanHistoryItem {
  briefing_date: string;
  section_heading?: string;
  source_url?: string | null;
  normalized_url?: string | null;
  cluster_id?: string | null;
  title?: string;
  body?: string;
  story_key: string;
  story_tokens: string[];
}

export interface DedupeDecision {
  allowed: boolean;
  reason: "new_item" | "exact_url_repeat" | "cluster_repeat" | "story_repeat";
  matched_item?: SentScanHistoryItem;
  similarity?: number;
}

export interface DedupeSummary {
  history_items_loaded: number;
  exact_url_repeats_blocked: number;
  cluster_repeats_blocked: number;
  story_repeats_blocked: number;
}

interface StoredScannerItem {
  title?: string | { text?: string | null } | null;
  body?: string | { text?: string | null } | null;
  source_url?: string | null;
  cluster_id?: string | null;
}

interface StoredScannerSection {
  heading?: string;
  items?: StoredScannerItem[];
}

interface StoredLegacyItem {
  headline?: string | null;
  summary?: string | null;
}

interface StoredBriefingContent {
  main_briefing?: {
    sections?: StoredScannerSection[];
  };
  what_changed?: StoredLegacyItem[];
}

interface CompanyBriefingHistoryRow {
  briefing_date: string;
  briefing_content: StoredBriefingContent | null;
}

const HISTORY_WINDOW_DAYS = 14;

const STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "amid",
  "also",
  "and",
  "are",
  "around",
  "because",
  "before",
  "between",
  "briefing",
  "company",
  "daily",
  "from",
  "have",
  "into",
  "more",
  "news",
  "over",
  "report",
  "reported",
  "reports",
  "said",
  "says",
  "scan",
  "that",
  "the",
  "their",
  "this",
  "through",
  "under",
  "with",
  "will",
]);

function daysBefore(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function normalizeSourceUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_.*|fbclid|gclid|mc_cid|mc_eid|ref|cmpid|output)$/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/g, "");
    return parsed.toString().replace(/\?$/g, "");
  } catch {
    return String(url).trim().toLowerCase() || null;
  }
}

function tokenizeStory(text: string): string[] {
  return [
    ...new Set(
      String(text || "")
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, " ")
        .replace(/[^a-z0-9\s-]/g, " ")
        .replace(/[-_]+/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 4 && !STOPWORDS.has(token)),
    ),
  ].slice(0, 28);
}

export function storyKeyForText(
  title?: string | null,
  body?: string | null,
): string {
  return tokenizeStory(`${title || ""} ${body || ""}`)
    .slice(0, 12)
    .join(" ");
}

function storyTokensForText(
  title?: string | null,
  body?: string | null,
): string[] {
  return tokenizeStory(`${title || ""} ${body || ""}`);
}

function tokenSimilarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const bSet = new Set(b);
  const intersection = a.filter((token) => bSet.has(token)).length;
  return intersection / Math.min(a.length, b.length);
}

function numericTokens(text: string): string[] {
  return [...new Set(String(text || "").match(/\b\d+(?:\.\d+)?%?\b/g) || [])];
}

function hasMeaningfullyDifferentNumbers(
  current: string,
  previous: string,
): boolean {
  const cur = numericTokens(current);
  const prev = new Set(numericTokens(previous));
  return cur.some((token) => !prev.has(token));
}

function textFromField(
  field: string | { text?: string | null } | null | undefined,
): string {
  if (typeof field === "string") return field;
  return field?.text || "";
}

function extractItemsFromContent(
  content: StoredBriefingContent | null,
  briefingDate: string,
): SentScanHistoryItem[] {
  const items: SentScanHistoryItem[] = [];

  const scannerSections = content?.main_briefing?.sections;
  if (Array.isArray(scannerSections)) {
    for (const section of scannerSections) {
      for (const item of section?.items || []) {
        const title = textFromField(item?.title);
        const body = textFromField(item?.body);
        const sourceUrl = item?.source_url || null;
        const tokens = storyTokensForText(title, body);
        if (!sourceUrl && !title && !body && !item?.cluster_id) continue;
        items.push({
          briefing_date: briefingDate,
          section_heading: section?.heading,
          source_url: sourceUrl,
          normalized_url: normalizeSourceUrl(sourceUrl),
          cluster_id: item?.cluster_id || null,
          title,
          body,
          story_key: tokens.slice(0, 12).join(" "),
          story_tokens: tokens,
        });
      }
    }
  }

  const legacyItems = content?.what_changed;
  if (Array.isArray(legacyItems)) {
    for (const item of legacyItems) {
      const title = item?.headline || "";
      const body = item?.summary || "";
      const tokens = storyTokensForText(title, body);
      if (!title && !body) continue;
      items.push({
        briefing_date: briefingDate,
        title,
        body,
        normalized_url: null,
        story_key: tokens.slice(0, 12).join(" "),
        story_tokens: tokens,
      });
    }
  }

  return items;
}

export async function loadCompanySentScanHistory(
  supabase: SupabaseClient,
  companyProfileId: string,
  scanDate: string,
  options: { days?: number } = {},
): Promise<SentScanHistoryItem[]> {
  const days = options.days ?? HISTORY_WINDOW_DAYS;
  const startDate = daysBefore(scanDate, days);
  const { data, error } = await supabase
    .from("company_briefings")
    .select("briefing_date, briefing_content, status, delivery_status")
    .eq("company_profile_id", companyProfileId)
    .gte("briefing_date", startDate)
    .lt("briefing_date", scanDate)
    .in("status", ["generated", "delivered"])
    .order("briefing_date", { ascending: false });

  if (error) {
    throw new Error(
      `failed to load company sent-scan history: ${error.message}`,
    );
  }

  return ((data || []) as CompanyBriefingHistoryRow[]).flatMap((row) =>
    extractItemsFromContent(row.briefing_content, row.briefing_date),
  );
}

export function evaluateDedupe(
  candidate: {
    source_url?: string | null;
    headline?: string | null;
    summary?: string | null;
    cluster_id?: string | null;
  },
  history: SentScanHistoryItem[],
): DedupeDecision {
  const normalizedUrl = normalizeSourceUrl(candidate.source_url);
  if (normalizedUrl) {
    const match = history.find((item) => item.normalized_url === normalizedUrl);
    if (match)
      return {
        allowed: false,
        reason: "exact_url_repeat",
        matched_item: match,
      };
  }

  if (candidate.cluster_id) {
    const match = history.find(
      (item) => item.cluster_id === candidate.cluster_id,
    );
    if (match)
      return { allowed: false, reason: "cluster_repeat", matched_item: match };
  }

  const candidateTokens = storyTokensForText(
    candidate.headline,
    candidate.summary,
  );
  const candidateText = `${candidate.headline || ""} ${candidate.summary || ""}`;
  for (const item of history) {
    const similarity = tokenSimilarity(candidateTokens, item.story_tokens);
    if (similarity < 0.82) continue;
    const previousText = `${item.title || ""} ${item.body || ""}`;
    if (hasMeaningfullyDifferentNumbers(candidateText, previousText)) continue;
    return {
      allowed: false,
      reason: "story_repeat",
      matched_item: item,
      similarity: Number(similarity.toFixed(2)),
    };
  }

  return { allowed: true, reason: "new_item" };
}

export function emptyDedupeSummary(historyItemsLoaded = 0): DedupeSummary {
  return {
    history_items_loaded: historyItemsLoaded,
    exact_url_repeats_blocked: 0,
    cluster_repeats_blocked: 0,
    story_repeats_blocked: 0,
  };
}

export function recordDedupeBlock(
  summary: DedupeSummary,
  decision: DedupeDecision,
): void {
  if (decision.reason === "exact_url_repeat")
    summary.exact_url_repeats_blocked += 1;
  if (decision.reason === "cluster_repeat")
    summary.cluster_repeats_blocked += 1;
  if (decision.reason === "story_repeat") summary.story_repeats_blocked += 1;
}
