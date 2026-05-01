// ---------------------------------------------------------------------------
// Company-specific retrieval — Package 10 draft.
//
// The old scan path is deliberately shared: one union watch graph retrieves a
// global signal pool, then each company filters it. That is efficient, but it
// is not enough for a paid company briefing because two similar companies can
// end up choosing from the same input pool.
//
// This module builds a standalone retrieval plan from one company profile and
// retrieves recent articles for that company only. No DB writes. It is used by
// dry-run previews first; production can later persist the returned signals and
// company_signal_matches behind the existing write gates.
// ---------------------------------------------------------------------------

import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyProfile } from "../company-profile";
import { loadCanonicalAliasIndex } from "./canonical-alias-index";
import { parseSignalFromArticle } from "./signal-parser";
import type { RawArticle, Signal } from "./types";
import { cachedRetrieval, envNumber } from "./retrieval-cache";

const BRAVE_NEWS_ENDPOINT = "https://api.search.brave.com/res/v1/news/search";
const DEFAULT_RESULTS_PER_QUERY = 12;
const DEFAULT_MAX_QUERIES = 18;
const PER_CALL_SLEEP_MS = 80;

export type CompanyRetrievalIntent =
  | "logistics_routes"
  | "geopolitical_media"
  | "ai_memory_integrity"
  | "general_media"
  | "default";

export interface CompanyRetrievalQuery {
  query_id: string;
  label: string;
  query: string;
  reason: string;
  scan_area_id?: string;
  required_context: string[];
  priority: "high" | "medium" | "low";
  local_language_expansion?: LocalLanguageExpansionTrace[];
}

export interface LocalLanguageExpansionTrace {
  language: string;
  terms: string[];
  matched_context: string[];
}

export interface CompanySpecificRetrievalResult {
  company_profile_id: string;
  company_name: string;
  intent: CompanyRetrievalIntent;
  queries: CompanyRetrievalQuery[];
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

function cleanTerm(value: unknown): string {
  return String(value || "")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function quote(term: string): string {
  const cleaned = cleanTerm(term).replace(/"/g, "");
  return cleaned.includes(" ") ? `"${cleaned}"` : cleaned;
}

function orGroup(terms: string[], limit = 5): string {
  return uniq(terms.map(cleanTerm).filter((t) => t.length > 1))
    .slice(0, limit)
    .map(quote)
    .join(" OR ");
}

type LocalLanguageRule = {
  language: string;
  triggers: string[];
  terms: string[];
};

const LOCAL_LANGUAGE_RULES: LocalLanguageRule[] = [
  { language: "Arabic", triggers: ["hormuz", "strait of hormuz"], terms: ["مضيق هرمز"] },
  { language: "Farsi", triggers: ["hormuz", "strait of hormuz"], terms: ["تنگه هرمز"] },
  { language: "Arabic", triggers: ["persian gulf", "gulf shipping", "gulf maritime"], terms: ["الخليج"] },
  { language: "Farsi", triggers: ["persian gulf", "iran", "iranian", "tehran"], terms: ["خلیج فارس", "ایران"] },
  { language: "Arabic", triggers: ["suez", "suez canal"], terms: ["قناة السويس"] },
  { language: "Arabic", triggers: ["red sea"], terms: ["البحر الأحمر"] },
  { language: "Korean", triggers: ["north korea", "dprk", "north korean"], terms: ["북한", "조선민주주의인민공화국"] },
  { language: "Korean", triggers: ["pyongyang", "kim jong", "korean peninsula"], terms: ["평양", "대북 제재"] },
  { language: "Chinese", triggers: ["china", "beijing", "shenzhen"], terms: ["中国"] },
  { language: "Chinese", triggers: ["taiwan"], terms: ["台湾"] },
  { language: "Chinese", triggers: ["south china sea"], terms: ["南海"] },
  { language: "Chinese", triggers: ["semiconductor", "semiconductors", "chip", "chips"], terms: ["半导体", "芯片"] },
  { language: "Russian", triggers: ["russia", "russian", "moscow"], terms: ["Россия", "Москва"] },
  { language: "Ukrainian", triggers: ["ukraine", "ukrainian", "kyiv"], terms: ["Україна", "Київ"] },
  { language: "Russian", triggers: ["black sea"], terms: ["Россия", "Украина"] },
  { language: "Ukrainian", triggers: ["black sea"], terms: ["Україна", "Росія"] },
  { language: "Hindi", triggers: ["india", "indian", "new delhi"], terms: ["भारत", "नई दिल्ली"] },
  { language: "Urdu", triggers: ["pakistan", "pakistani", "islamabad"], terms: ["پاکستان", "اسلام آباد"] },
  { language: "Hindi", triggers: ["south asia"], terms: ["भारत", "पाकिस्तान"] },
  { language: "Urdu", triggers: ["south asia"], terms: ["پاکستان", "بھارت"] },
];

function termInText(text: string, term: string): boolean {
  const t = cleanTerm(term).toLowerCase();
  if (!t) return false;
  return new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(text);
}

function profileExpansionContext(profile: CompanyProfile): string {
  return [
    profile.company_name,
    profile.sector,
    profile.sub_sector,
    ...(profile.tracked_themes || []),
    ...(profile.risk_priorities || []),
    ...(profile.watchlist_entities || []),
    ...(profile.regions || []),
    ...(profile.countries || []),
    ...(profile.supply_chain_exposure || []),
  ].map(cleanTerm).join(" ").toLowerCase();
}

function localLanguageExpansionFor(profile: CompanyProfile, queryTerms: string[], maxTerms = 5): LocalLanguageExpansionTrace[] {
  const cleanQueryTerms = queryTerms.map(cleanTerm).filter(Boolean);
  const hay = (cleanQueryTerms.length ? cleanQueryTerms.join(" ") : profileExpansionContext(profile)).toLowerCase();
  const traces: LocalLanguageExpansionTrace[] = [];
  let remaining = maxTerms;

  for (const rule of LOCAL_LANGUAGE_RULES) {
    if (remaining <= 0) break;
    const matchedContext = rule.triggers.filter((trigger) => termInText(hay, trigger));
    if (!matchedContext.length) continue;
    const terms = rule.terms.slice(0, remaining);
    traces.push({ language: rule.language, terms, matched_context: matchedContext.slice(0, 3) });
    remaining -= terms.length;
  }

  return traces;
}

function expandWithLocalLanguageTerms(terms: string[], expansion: LocalLanguageExpansionTrace[]): string[] {
  return uniq([...terms, ...expansion.flatMap((trace) => trace.terms)]);
}

function slugify(value: string): string {
  return String(value || "query")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "query";
}

function hashId(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function intentForProfile(profile: CompanyProfile): CompanyRetrievalIntent {
  const sector = `${profile.sector || ""} ${profile.sub_sector || ""}`.toLowerCase();
  const hay = [
    profile.company_name,
    profile.sector,
    profile.sub_sector,
    ...(profile.tracked_themes || []),
    ...(profile.risk_priorities || []),
    ...(profile.watchlist_entities || []),
  ].join(" ").toLowerCase();

  const mediaSector = /(media|comms|communications|publishing|broadcast|news|journalism|content)/.test(sector);
  if (/(genealogy|archive|archives|ancestry|public memory|identity|records|deepfake|ai falsehood|artificial intelligence|misinformation)/.test(hay)) return "ai_memory_integrity";
  if (mediaSector && /(disinformation|censorship|sanction|press freedom|north korea|dprk|russia|iran|narrative|geopolitic)/.test(hay)) return "geopolitical_media";
  if (/(logistics|shipping|maritime|freight|port|suez|hormuz|red sea|route)/.test(sector)) return "logistics_routes";
  if (/(logistics|shipping|maritime|freight|port|suez|hormuz|red sea|route)/.test(hay) && !mediaSector) return "logistics_routes";
  if (mediaSector) return "general_media";
  return "default";
}

function profileTerms(profile: CompanyProfile) {
  return {
    themes: uniq([...(profile.tracked_themes || []), ...(profile.risk_priorities || [])].map(cleanTerm).filter(Boolean)),
    exposures: uniq((profile.supply_chain_exposure || []).map(cleanTerm).filter(Boolean)),
    entities: uniq((profile.watchlist_entities || []).map(cleanTerm).filter(Boolean)),
    regions: uniq([...(profile.regions || []), ...(profile.countries || [])].map(cleanTerm).filter(Boolean)),
  };
}

function addQuery(
  queries: CompanyRetrievalQuery[],
  label: string,
  query: string,
  reason: string,
  options: { scanAreaId?: string; requiredContext?: string[]; priority?: "high" | "medium" | "low"; localLanguageExpansion?: LocalLanguageExpansionTrace[] } = {},
) {
  const normalized = query.replace(/\s+/g, " ").trim();
  if (!normalized || queries.some((q) => q.query === normalized)) return;
  queries.push({
    query_id: slugify(label),
    label,
    query: normalized,
    reason,
    scan_area_id: options.scanAreaId,
    required_context: uniq((options.requiredContext || []).map(cleanTerm).filter(Boolean)),
    priority: options.priority || "medium",
    ...(options.localLanguageExpansion?.length ? { local_language_expansion: options.localLanguageExpansion } : {}),
  });
}

const BROAD_ENTITY_TERMS = new Set([
  "united states",
  "us",
  "u s",
  "european union",
  "eu",
  "china",
  "russia",
  "india",
  "united kingdom",
  "uk",
  "korea",
  "iran",
  "north america",
  "western europe",
  "eastern europe",
  "middle east",
  "south asia",
  "east se asia",
  "central asia",
]);

function isBroadEntity(term: string): boolean {
  return BROAD_ENTITY_TERMS.has(cleanTerm(term).toLowerCase());
}

function intentWords(intent: CompanyRetrievalIntent): string[] {
  const map: Record<CompanyRetrievalIntent, string[]> = {
    logistics_routes: ["shipping", "freight", "port", "route", "insurance", "vessel", "suez", "hormuz"],
    geopolitical_media: ["media", "press", "censorship", "disinformation", "sanctions", "narrative", "state media", "propaganda"],
    ai_memory_integrity: ["AI", "deepfake", "falsehood", "records", "identity", "archives", "misinformation", "public memory"],
    general_media: ["media", "publishing", "platform", "audience", "content", "press"],
    default: ["risk", "policy", "market", "regulation"],
  };
  return map[intent];
}

function themeQueryTerm(theme: string, intent: CompanyRetrievalIntent): { term: string; context: string[]; priority: "high" | "medium" | "low" } {
  const t = cleanTerm(theme).toLowerCase();
  if (intent === "ai_memory_integrity") {
    if (t === "ai") return { term: "artificial intelligence", context: ["falsehood", "deepfake", "records", "identity", "archives"], priority: "high" };
    if (t === "ai video") return { term: "AI video", context: ["deepfake", "falsehood", "identity", "evidence"], priority: "high" };
    if (t === "election") return { term: "election", context: ["AI", "deepfake", "misinformation", "false claims"], priority: "medium" };
    if (t === "cybersecurity") return { term: "cybersecurity", context: ["identity", "records", "AI", "deepfake"], priority: "medium" };
  }
  if (intent === "geopolitical_media") {
    if (/(shipping routes?|port disruption)/.test(t)) {
      return { term: t, context: ["sanctions", "media", "narrative", "state media", "disinformation"], priority: "low" };
    }
    if (t === "geopolitical conflict") return { term: "geopolitical conflict", context: ["media", "narrative", "propaganda", "state media"], priority: "high" };
    if (t === "reputation narrative") return { term: "reputation narrative", context: ["media", "disinformation", "audience", "propaganda"], priority: "high" };
    if (t === "regulatory policy") return { term: "regulatory policy", context: ["media", "press", "censorship", "platform"], priority: "medium" };
  }
  return { term: cleanTerm(theme), context: intentWords(intent), priority: "medium" };
}

function exposureQueryTerm(exposure: string, intent: CompanyRetrievalIntent): { term: string; context: string[]; priority: "high" | "medium" | "low" } {
  const t = cleanTerm(exposure).toLowerCase();
  if (/fertili[sz]er|urea|ammonia|potash|phosphate/.test(t)) {
    return {
      term: cleanTerm(exposure),
      context: ["tender", "export restrictions", "price", "supply", "India", "China", "gas", "shipping"],
      priority: "high",
    };
  }
  if (/semiconductor|chip/.test(t)) {
    return {
      term: cleanTerm(exposure),
      context: ["export controls", "tariff", "capacity", "Taiwan", "China", "supply", "shipping", "AI chips"],
      priority: "high",
    };
  }
  return {
    term: cleanTerm(exposure),
    context: uniq(["supply", "shortage", "price", "export", "import", "shipping", ...intentWords(intent).slice(0, 4)]),
    priority: "high",
  };
}

export function buildCompanyRetrievalPlan(profile: CompanyProfile): {
  intent: CompanyRetrievalIntent;
  queries: CompanyRetrievalQuery[];
} {
  const intent = intentForProfile(profile);
  const { themes, exposures, entities, regions } = profileTerms(profile);
  const queries: CompanyRetrievalQuery[] = [];
  const specificEntities = entities.filter((entity) => !isBroadEntity(entity));
  const broadContextEntities = entities.filter(isBroadEntity);
  const entityGroup = orGroup(specificEntities.length ? specificEntities : broadContextEntities, 5);
  const regionGroup = orGroup(regions.filter((region) => !isBroadEntity(region)), 3);
  const intentGroup = orGroup(intentWords(intent), 6);

  for (const exposure of exposures.slice(0, 6)) {
    const mapped = exposureQueryTerm(exposure, intent);
    const context = uniq([...mapped.context, ...specificEntities.slice(0, 2)]);
    const localLanguageExpansion = localLanguageExpansionFor(profile, [mapped.term, ...regions]);
    const contextGroup = orGroup(expandWithLocalLanguageTerms(context, localLanguageExpansion), 9) || intentGroup;
    const parts = [quote(mapped.term)];
    if (contextGroup) parts.push(`(${contextGroup})`);
    addQuery(queries, mapped.term, parts.join(" "), "company supply-chain exposure", {
      scanAreaId: slugify(exposure),
      requiredContext: context,
      priority: mapped.priority,
      localLanguageExpansion,
    });
  }

  for (const theme of themes.slice(0, 10)) {
    const mapped = themeQueryTerm(theme, intent);
    const context = uniq([...mapped.context, ...specificEntities.slice(0, 3)]);
    const localLanguageExpansion = localLanguageExpansionFor(profile, [mapped.term, ...specificEntities.slice(0, 3), ...regions]);
    const contextGroup = orGroup(expandWithLocalLanguageTerms(context, localLanguageExpansion), 8) || intentGroup;
    const parts = [quote(mapped.term)];
    if (contextGroup) parts.push(`(${contextGroup})`);
    // Regions are useful when specific, but broad region labels like
    // "western-europe" often over-constrain news search and create false
    // negatives. Only add the region group when it survived broad filtering.
    if (regionGroup) parts.push(`(${regionGroup})`);
    addQuery(queries, mapped.term, parts.join(" "), "company-selected scan area", {
      scanAreaId: slugify(theme),
      requiredContext: context,
      priority: mapped.priority,
      localLanguageExpansion,
    });
  }

  // Entity-only queries are still useful for high-value people/places, but
  // pair them with intent words so broad names do not drag in general noise.
  for (const entity of specificEntities.slice(0, 10)) {
    const context = intentWords(intent);
    const localLanguageExpansion = localLanguageExpansionFor(profile, [entity]);
    const entityContextGroup = orGroup(expandWithLocalLanguageTerms(context, localLanguageExpansion), 8) || intentGroup;
    addQuery(queries, entity, `${quote(entity)} (${entityContextGroup})`, "company watchlist entity with company-intent context", {
      scanAreaId: "watchlist-entities",
      requiredContext: context,
      priority: "high",
      localLanguageExpansion,
    });
  }

  if (intent === "geopolitical_media") {
    const context = ["press freedom", "censorship", "disinformation", "state media", "sanctions"];
    const localLanguageExpansion = localLanguageExpansionFor(profile, [...specificEntities, ...broadContextEntities, ...regions]);
    const mediaContextGroup = orGroup(expandWithLocalLanguageTerms(context, localLanguageExpansion), 8);
    addQuery(queries, "geopolitical media environment", `(${mediaContextGroup}) ${entityGroup ? `(${entityGroup})` : ""}`.trim(), "media/information-environment intent", {
      scanAreaId: "intent-geopolitical-media",
      requiredContext: context,
      priority: "high",
      localLanguageExpansion,
    });
  }
  if (intent === "ai_memory_integrity") {
    addQuery(queries, "AI and public memory", `(${orGroup(["AI falsehoods", "deepfake", "public records", "identity theft", "archives", "genealogy"], 6)}) ${regionGroup ? `(${regionGroup})` : ""}`.trim(), "AI/public-memory intent", {
      scanAreaId: "intent-ai-memory-integrity",
      requiredContext: ["AI falsehoods", "deepfake", "public records", "identity", "archives", "genealogy"],
      priority: "high",
    });
  }
  if (intent === "logistics_routes") {
    const routeTerms = ["Hormuz", "Suez", "Red Sea", "freight rates", "vessel traffic", "marine insurance"];
    const localLanguageExpansion = localLanguageExpansionFor(profile, []);
    addQuery(queries, "route confidence", `(${orGroup(expandWithLocalLanguageTerms(routeTerms, localLanguageExpansion), 10)})`, "route-confidence intent", {
      scanAreaId: "intent-logistics-routes",
      requiredContext: ["shipping", "freight", "route", "vessel", "insurance"],
      priority: "high",
      localLanguageExpansion,
    });
  }

  return {
    intent,
    queries: queries
      .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
      .slice(0, envNumber("COMPANY_SPECIFIC_MAX_QUERIES", DEFAULT_MAX_QUERIES)),
  };
}

function textMatchesAny(text: string, terms: string[]): string[] {
  const hay = cleanTerm(text).toLowerCase();
  return terms.filter((term) => {
    const t = cleanTerm(term).toLowerCase();
    if (!t || t.length < 2) return false;
    if (t.length <= 3) return new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(hay);
    return hay.includes(t);
  });
}

async function fetchBraveNews(query: CompanyRetrievalQuery, signalDate: string, log?: (message: string) => void): Promise<RawArticle[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) throw new Error("BRAVE_API_KEY not set in environment");

  const resultsPerQuery = envNumber("COMPANY_SPECIFIC_RESULTS_PER_QUERY", DEFAULT_RESULTS_PER_QUERY);
  const url = new URL(BRAVE_NEWS_ENDPOINT);
  url.searchParams.set("q", query.query);
  url.searchParams.set("count", String(resultsPerQuery));
  url.searchParams.set("freshness", "pd");
  url.searchParams.set("text_decorations", "false");

  return cachedRetrieval({
    namespace: "company-specific",
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
        console.warn(`[company-specific-retrieval] ${response.status} for ${query.label}: ${body.slice(0, 160)}`);
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

export async function retrieveCompanySpecificSignals(
  supabase: SupabaseClient,
  profile: CompanyProfile,
  options: { signalDate: string; log?: (message: string) => void } = { signalDate: new Date().toISOString().slice(0, 10) },
): Promise<CompanySpecificRetrievalResult> {
  const log = options.log || (() => undefined);
  const plan = buildCompanyRetrievalPlan(profile);
  const aliasIndex = await loadCanonicalAliasIndex(supabase);
  const byUrl = new Map<string, RawArticle>();
  const queryMatchesByUrl = new Map<string, CompanyRetrievalQuery[]>();
  const domains = new Set<string>();

  log(`  ↳ company-specific retrieval: ${plan.queries.length} queries (${plan.intent})`);
  for (const query of plan.queries) {
    const articles = await fetchBraveNews(query, options.signalDate, log);
    log(`    • ${query.label}: ${articles.length} result(s)`);
    for (const article of articles) {
      if (!article.url) continue;
      byUrl.set(article.url, article);
      const matches = queryMatchesByUrl.get(article.url) || [];
      matches.push(query);
      queryMatchesByUrl.set(article.url, matches);
      if (article.source_domain) domains.add(article.source_domain);
    }
  }

  const signals: Signal[] = [];
  const seenSignalIds = new Set<string>();
  for (const article of byUrl.values()) {
    const draft = parseSignalFromArticle(article, aliasIndex, { signalDate: options.signalDate });
    if (!draft) continue;
    const queryMatches = queryMatchesByUrl.get(article.url) || [];
    const text = `${article.headline} ${article.body}`;
    const matchedContext = uniq(queryMatches.flatMap((query) => textMatchesAny(text, query.required_context)));
    const matchedQueryTerms = uniq(queryMatches.flatMap((query) => textMatchesAny(text, [query.label])));
    const id = hashId(`${profile.id}:${article.url}:${draft.headline}`);
    if (seenSignalIds.has(id)) continue;
    seenSignalIds.add(id);
    signals.push({
      id,
      company_scan_run_id: `company-specific-${profile.id}`,
      ...draft,
      company_retrieval: {
        mode: "company_specific_retrieval",
        company_profile_id: profile.id,
        company_name: profile.company_name,
        intent: plan.intent,
        query_ids: queryMatches.map((query) => query.query_id),
        query_labels: queryMatches.map((query) => query.label),
        scan_area_ids: uniq(queryMatches.map((query) => query.scan_area_id).filter(Boolean)),
        retrieval_reasons: queryMatches.map((query) => query.reason),
        matched_query_terms: matchedQueryTerms,
        matched_context_terms: matchedContext,
        local_language_expansion: uniq(queryMatches.flatMap((query) => query.local_language_expansion || [])),
      },
      created_at: new Date().toISOString(),
    } as Signal & { company_retrieval: Record<string, unknown> });
  }

  return {
    company_profile_id: profile.id,
    company_name: profile.company_name,
    intent: plan.intent,
    queries: plan.queries,
    articles_retrieved: byUrl.size,
    signals,
    sources_consulted: domains.size,
  };
}
