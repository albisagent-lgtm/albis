// ---------------------------------------------------------------------------
// Brave Search retrieval — Package 6.
//
// Replaces retrieval-stub.ts as the real article source for the company
// scan. Calls Brave's News Search endpoint per scan_target, parses
// results into the RawArticle shape the signal parser already consumes.
//
// Why Brave: simple HTTPS API, no SDK, no auth dance, decent
// multi-language coverage, predictable response shape.
//
// Endpoint: GET https://api.search.brave.com/res/v1/news/search
// Auth: X-Subscription-Token header, BRAVE_API_KEY from env.
// Rate limit: caller paces with a 50ms pre-call sleep (= 20 req/s max,
// well under any plan's published cap). One target failing returns an
// empty article list rather than throwing — a single bad target should
// never kill an entire scan.
// ---------------------------------------------------------------------------
import type { ScanTarget, RawArticle } from "./types";

const BRAVE_NEWS_ENDPOINT = "https://api.search.brave.com/res/v1/news/search";

const RESULTS_PER_QUERY = 20;
const FRESHNESS = "pd"; // past day
const PER_CALL_SLEEP_MS = 50;
const MAX_TERMS_PER_QUERY = 5;

export interface RetrievalResult {
  target_id: string;
  target_value: string;
  articles: RawArticle[];
  sources_consulted: number;
}

interface BraveMetaUrl {
  scheme?: string;
  netloc?: string;
  hostname?: string;
  favicon?: string;
  path?: string;
}

interface BraveNewsResult {
  type?: string;
  url?: string;
  title?: string;
  description?: string;
  age?: string;
  page_age?: string;
  meta_url?: BraveMetaUrl;
  language?: string;
  family_friendly?: boolean;
  subtype?: string;
}

interface BraveNewsResponse {
  type?: string;
  results?: BraveNewsResult[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build an OR'd query from the top N expansion_terms. Quoting each
 * term keeps multi-word phrases atomic ("North Korea" vs North + Korea
 * as separate tokens). Brave caps queries around ~400 chars; the cap
 * via MAX_TERMS_PER_QUERY keeps us comfortably under that.
 */
export function buildBraveQuery(expansionTerms: string[]): string {
  const cleaned = expansionTerms
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const top = cleaned.slice(0, MAX_TERMS_PER_QUERY);
  if (top.length === 0) return "";
  if (top.length === 1) return `"${top[0]}"`;
  return top.map((t) => `"${t}"`).join(" OR ");
}

function emptyResult(target: ScanTarget): RetrievalResult {
  return {
    target_id: target.id,
    target_value: target.target_value,
    articles: [],
    sources_consulted: 0,
  };
}

/**
 * Retrieve recent news articles for a single scan_target via Brave News
 * Search. Returns an empty result on any failure — caller treats that
 * as "this target had nothing today" and moves on.
 */
export async function retrieveForTarget(target: ScanTarget): Promise<RetrievalResult> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    throw new Error("BRAVE_API_KEY not set in environment");
  }

  const q = buildBraveQuery(target.expansion_terms);
  if (!q) return emptyResult(target);

  const url = new URL(BRAVE_NEWS_ENDPOINT);
  url.searchParams.set("q", q);
  url.searchParams.set("count", String(RESULTS_PER_QUERY));
  url.searchParams.set("freshness", FRESHNESS);
  url.searchParams.set("text_decorations", "false");

  await sleep(PER_CALL_SLEEP_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    });
  } catch (err) {
    console.warn(
      `[retrieval-brave] network error for target ${target.target_value}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return emptyResult(target);
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.warn(
      `[retrieval-brave] ${response.status} ${response.statusText} for target ${target.target_value}` +
        (bodyText ? ` — ${bodyText.slice(0, 200)}` : "")
    );
    return emptyResult(target);
  }

  let data: BraveNewsResponse;
  try {
    data = (await response.json()) as BraveNewsResponse;
  } catch (err) {
    console.warn(
      `[retrieval-brave] malformed JSON for target ${target.target_value}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return emptyResult(target);
  }

  const results = data?.results;
  if (!Array.isArray(results)) {
    console.warn(
      `[retrieval-brave] response missing results array for target ${target.target_value}`
    );
    return emptyResult(target);
  }

  const articles: RawArticle[] = [];
  const domains = new Set<string>();
  for (const r of results) {
    if (!r.url || !r.title) continue;
    const hostname = r.meta_url?.hostname || null;
    if (hostname) domains.add(hostname);
    articles.push({
      url: r.url,
      headline: r.title,
      body: r.description || "",
      source_domain: hostname,
      source_language: r.language || null,
      source_region: null,
      published_at: r.page_age || null,
    });
  }

  return {
    target_id: target.id,
    target_value: target.target_value,
    articles,
    sources_consulted: domains.size,
  };
}
