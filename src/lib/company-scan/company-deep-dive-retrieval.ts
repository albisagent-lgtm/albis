// ---------------------------------------------------------------------------
// Company deep-dive retrieval — Package 10B draft.
//
// Runs after first-pass company-specific retrieval and candidate selection.
// Its job is not discovery; it verifies/enriches the strongest candidate
// signals with targeted follow-up searches before the briefing is written.
//
// No DB writes. No email side effects. Preview/dry-run only until explicitly
// wired into production behind existing gates.
// ---------------------------------------------------------------------------

import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyProfile } from "../company-profile";
import { loadCanonicalAliasIndex } from "./canonical-alias-index";
import { parseSignalFromArticle } from "./signal-parser";
import type { RawArticle, Signal } from "./types";
import { cachedRetrieval, envNumber } from "./retrieval-cache";

const BRAVE_NEWS_ENDPOINT = "https://api.search.brave.com/res/v1/news/search";
const DEFAULT_RESULTS_PER_QUERY = 8;
const PER_CALL_SLEEP_MS = 80;
const DEFAULT_MAX_CANDIDATES = 5;
const DEFAULT_MAX_QUERIES = 12;

export interface CompanyDeepDiveQuery {
  query_id: string;
  parent_signal_id: string;
  parent_headline: string;
  query: string;
  reason: "confirm_core_fact" | "find_better_sources" | "find_source_frames" | "find_stats_or_official_context";
  required_context: string[];
}

export interface CompanyDeepDiveRetrievalResult {
  company_profile_id: string;
  company_name: string;
  queries: CompanyDeepDiveQuery[];
  articles_retrieved: number;
  signals: Signal[];
  sources_consulted: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}

function clean(value: unknown): string {
  return String(value || "")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function quote(term: string): string {
  const cleaned = clean(term).replace(/"/g, "");
  return cleaned.includes(" ") ? `"${cleaned}"` : cleaned;
}

function slugify(value: string): string {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "query";
}

function hashId(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function signalText(signal: Signal): string {
  return clean(`${signal.headline} ${signal.summary} ${(signal.entities || []).join(" ")} ${(signal.themes || []).join(" ")} ${(signal.regions || []).join(" ")}`);
}

function importantTerms(signal: Signal): string[] {
  const terms = uniq([
    ...(signal.entities || []),
    ...(signal.themes || []),
    ...(signal.regions || []),
  ].map(clean).filter((term) => term.length > 2));

  // Prefer concrete multi-word/entity terms. Single broad terms are useful only
  // as context, not as the whole deep-dive query.
  const concrete = terms.filter((term) => term.includes(" ") || /hormuz|suez|dprk|deepfake|censorship|sanction|freight|shipping|press freedom/i.test(term));
  return (concrete.length ? concrete : terms).slice(0, 4);
}

function sourceIntentWords(profile: CompanyProfile, signal: Signal): string[] {
  const hay = `${profile.sector || ""} ${profile.sub_sector || ""} ${signalText(signal)}`.toLowerCase();
  if (/logistics|shipping|freight|hormuz|suez|port|vessel|container/.test(hay)) {
    return ["shipping", "freight", "vessel", "port", "insurance", "trade"];
  }
  if (/genealogy|archive|records|deepfake|artificial intelligence|ai|identity|public memory/.test(hay)) {
    return ["AI", "deepfake", "identity", "records", "evidence", "misinformation"];
  }
  if (/media|press|journalis|censorship|disinformation|sanction|state media|narrative/.test(hay)) {
    return ["media", "press", "censorship", "disinformation", "sanctions", "state media"];
  }
  return ["official", "policy", "market", "risk"];
}

function queryHasEnoughSpecificity(query: string): boolean {
  const q = query.toLowerCase();
  if (/^"?(ai|media|risk|policy|market|election|china|russia|iran|india|korea)"?\b/.test(q) && q.split(/\s+/).length < 4) return false;
  return q.length >= 12;
}

function textMatchesAny(text: string, terms: string[]): string[] {
  const hay = clean(text).toLowerCase();
  return terms.filter((term) => {
    const t = clean(term).toLowerCase();
    if (!t || t.length < 2) return false;
    if (t.length <= 3) return new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(hay);
    return hay.includes(t);
  });
}

export function buildCompanyDeepDiveQueries(
  profile: CompanyProfile,
  candidateSignals: Signal[],
  options: { maxCandidates?: number; maxQueries?: number } = {},
): CompanyDeepDiveQuery[] {
  const maxCandidates =
    options.maxCandidates ??
    envNumber("COMPANY_DEEP_DIVE_MAX_CANDIDATES", DEFAULT_MAX_CANDIDATES);
  const maxQueries =
    options.maxQueries ??
    envNumber("COMPANY_DEEP_DIVE_MAX_QUERIES", DEFAULT_MAX_QUERIES);
  const queries: CompanyDeepDiveQuery[] = [];

  for (const signal of candidateSignals.slice(0, maxCandidates)) {
    const terms = importantTerms(signal);
    const intent = sourceIntentWords(profile, signal);
    const primary = terms.slice(0, 2).map(quote).join(" ") || quote(signal.headline.split(/\s+/).slice(0, 5).join(" "));
    const intentGroup = intent.slice(0, 4).map(quote).join(" OR ");
    const headlineCore = quote(signal.headline.split(/\s+/).slice(0, 8).join(" "));
    const requiredContext = uniq([...terms, ...intent]);

    const candidates: Array<{ query: string; reason: CompanyDeepDiveQuery["reason"] }> = [
      { query: `${primary} (${intentGroup})`, reason: "confirm_core_fact" },
      { query: `${primary} (Reuters OR AP OR Bloomberg OR BBC OR official OR regulator OR trade)`, reason: "find_better_sources" },
      { query: `${primary} (regional OR local OR analysis OR response OR statement)`, reason: "find_source_frames" },
      { query: `${headlineCore} (data OR figures OR estimate OR official OR report)`, reason: "find_stats_or_official_context" },
    ];

    for (const candidate of candidates) {
      const query = candidate.query.replace(/\s+/g, " ").trim();
      if (!queryHasEnoughSpecificity(query)) continue;
      if (queries.some((existing) => existing.query === query)) continue;
      queries.push({
        query_id: `deep_${slugify(candidate.reason)}_${slugify(signal.id)}`,
        parent_signal_id: signal.id,
        parent_headline: signal.headline,
        query,
        reason: candidate.reason,
        required_context: requiredContext,
      });
      if (queries.length >= maxQueries) return queries;
    }
  }

  return queries;
}

async function fetchBraveNews(query: CompanyDeepDiveQuery, signalDate: string, log?: (message: string) => void): Promise<RawArticle[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) throw new Error("BRAVE_API_KEY not set in environment");

  const resultsPerQuery = envNumber("COMPANY_DEEP_DIVE_RESULTS_PER_QUERY", DEFAULT_RESULTS_PER_QUERY);
  const url = new URL(BRAVE_NEWS_ENDPOINT);
  url.searchParams.set("q", query.query);
  url.searchParams.set("count", String(resultsPerQuery));
  url.searchParams.set("freshness", "pd");
  url.searchParams.set("text_decorations", "false");

  return cachedRetrieval({
    namespace: "company-deep-dive",
    signalDate,
    query: query.query,
    count: resultsPerQuery,
    log,
    fetchLive: async () => {
      await sleep(PER_CALL_SLEEP_MS);
      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.warn(`[company-deep-dive-retrieval] ${response.status} for ${query.reason}: ${body.slice(0, 160)}`);
        return [];
      }

      const data = await response.json() as { results?: Array<{ url?: string; title?: string; description?: string; page_age?: string; meta_url?: { hostname?: string }; language?: string }> };
      return (data.results || [])
        .filter((result) => result.url && result.title)
        .map((result) => ({
          url: result.url || "",
          headline: result.title || "",
          body: result.description || "",
          source_domain: result.meta_url?.hostname || null,
          source_language: result.language || null,
          source_region: null,
          published_at: result.page_age || null,
        }));
    },
  });
}

export async function runCompanyDeepDiveRetrieval(
  supabase: SupabaseClient,
  profile: CompanyProfile,
  candidateSignals: Signal[],
  options: { signalDate: string; maxCandidates?: number; maxQueries?: number; log?: (message: string) => void },
): Promise<CompanyDeepDiveRetrievalResult> {
  const log = options.log || (() => undefined);
  const queries = buildCompanyDeepDiveQueries(profile, candidateSignals, options);
  const aliasIndex = await loadCanonicalAliasIndex(supabase);
  const byUrl = new Map<string, RawArticle>();
  const queriesByUrl = new Map<string, CompanyDeepDiveQuery[]>();
  const domains = new Set<string>();

  log(`  ↳ deep-dive retrieval: ${queries.length} follow-up queries`);
  for (const query of queries) {
    const articles = await fetchBraveNews(query, options.signalDate, log);
    log(`    • ${query.reason}: ${articles.length} result(s)`);
    for (const article of articles) {
      if (!article.url) continue;
      byUrl.set(article.url, article);
      const list = queriesByUrl.get(article.url) || [];
      list.push(query);
      queriesByUrl.set(article.url, list);
      if (article.source_domain) domains.add(article.source_domain);
    }
  }

  const signals: Signal[] = [];
  const seen = new Set<string>();
  for (const article of byUrl.values()) {
    const draft = parseSignalFromArticle(article, aliasIndex, { signalDate: options.signalDate });
    if (!draft) continue;
    const matches = queriesByUrl.get(article.url) || [];
    const text = `${article.headline} ${article.body}`;
    const matchedContext = uniq(matches.flatMap((query) => textMatchesAny(text, query.required_context)));
    if (matchedContext.length === 0) continue;
    const id = hashId(`${profile.id}:deep:${article.url}:${draft.headline}`);
    if (seen.has(id)) continue;
    seen.add(id);

    signals.push({
      id,
      company_scan_run_id: `company-deep-dive-${profile.id}`,
      ...draft,
      company_retrieval: {
        mode: "company_deep_dive_retrieval",
        company_profile_id: profile.id,
        company_name: profile.company_name,
        query_ids: matches.map((query) => query.query_id),
        query_labels: matches.map((query) => query.reason),
        parent_signal_ids: uniq(matches.map((query) => query.parent_signal_id)),
        parent_headlines: uniq(matches.map((query) => query.parent_headline)),
        retrieval_reasons: matches.map((query) => query.reason),
        matched_context_terms: matchedContext,
      },
      created_at: new Date().toISOString(),
    } as Signal & { company_retrieval: Record<string, unknown> });
  }

  return {
    company_profile_id: profile.id,
    company_name: profile.company_name,
    queries,
    articles_retrieved: byUrl.size,
    signals,
    sources_consulted: domains.size,
  };
}
