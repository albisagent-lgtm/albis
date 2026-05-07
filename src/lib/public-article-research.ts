// ---------------------------------------------------------------------------
// Public article research layer.
//
// The old public article path drafted from scan items. This layer gives the
// article builder actual source text to read before writing: Brave discovery +
// lightweight article fetch/extraction, with tight defaults for cost control.
// ---------------------------------------------------------------------------

export type PublicArticleResearchSource = {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  text: string;
  word_count: number;
  fetched: boolean;
};

export type PublicArticleResearchPacket = {
  enabled: boolean;
  query: string;
  sources: PublicArticleResearchSource[];
  distinct_url_count: number;
  distinct_domain_count: number;
  source_depth_valid: boolean;
  priority_section: boolean;
  warnings: string[];
};

const PRIORITY_PUBLIC_CATEGORIES = new Set([
  // World
  "current-events",
  "conflict",
  "diplomacy",
  "governance",
  "sanctions",
  "migration-demographics",
  // Money
  "economic-flows",
  "markets",
  "logistics-shipping",
  // Tech
  "tech-ai",
  "science-space",
  // Climate
  "climate-energy",
  "natural-world",
  // Life Systems
  "life-systems",
  "health",
  "energy",
  "food",
  "food-agriculture",
  "water",
]);

function cleanText(value: string): string {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "unknown";
  }
}

function normaliseCategory(value: string | undefined): string {
  const key = String(value || "current-events").toLowerCase().replace(/_/g, "-").trim();
  if (key === "economic") return "economic-flows";
  if (key === "climate") return "climate-energy";
  if (key === "social") return "life-systems";
  return key || "current-events";
}

function isPriorityPublicCategory(category: string | undefined): boolean {
  if (process.env.ALBIS_PUBLIC_RESEARCH_ALL_SECTIONS === "true") return true;
  return PRIORITY_PUBLIC_CATEGORIES.has(normaliseCategory(category));
}

function sourceDepth(sources: PublicArticleResearchSource[]) {
  const urls = new Set(sources.map((source) => source.url).filter(Boolean));
  const domains = new Set(sources.map((source) => source.domain.replace(/^www\./i, "").toLowerCase()).filter(Boolean));
  return {
    distinct_url_count: urls.size,
    distinct_domain_count: domains.size,
    source_depth_valid: urls.size >= 2 && domains.size >= 2,
  };
}

function sourceAllowed(url: string): boolean {
  const domain = domainFromUrl(url).toLowerCase();
  if (/youtube|tiktok|instagram|facebook|reddit|pinterest|x\.com|twitter\.com/.test(domain)) return false;
  if (/\.pdf($|\?)/i.test(url)) return false;
  return true;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "AlbisBot/1.0 (+https://www.albis.news)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchReadableArticleText(url: string): Promise<string> {
  const response = await fetchWithTimeout(url, 8000);
  if (!response.ok) throw new Error(`fetch_${response.status}`);
  const html = await response.text();
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i)?.[0];
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i)?.[0];
  const body = articleMatch || mainMatch || html;
  return cleanText(body).slice(0, 5000);
}

async function braveSearch(query: string, count: number): Promise<Array<{ title: string; url: string; snippet?: string }>> {
  const key = process.env.BRAVE_API_KEY;
  if (!key) throw new Error("BRAVE_API_KEY_missing");
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.max(1, Math.min(10, count))));
  url.searchParams.set("freshness", "pd");
  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "x-subscription-token": key,
    },
  });
  if (!response.ok) throw new Error(`brave_${response.status}`);
  const json = await response.json();
  return (json.web?.results || [])
    .map((result: any) => ({
      title: String(result.title || "").replace(/<[^>]+>/g, ""),
      url: String(result.url || ""),
      snippet: cleanText(result.description || ""),
    }))
    .filter((result: any) => result.url && sourceAllowed(result.url));
}

export async function buildPublicArticleResearchPacket(input: {
  title: string;
  category?: string;
  connection?: string;
  tags?: string[];
  regions?: string[];
}): Promise<PublicArticleResearchPacket> {
  const prioritySection = isPriorityPublicCategory(input.category);
  const enabled = process.env.ALBIS_ENABLE_PUBLIC_ARTICLE_RESEARCH !== "false" && prioritySection;
  const query = [
    input.title,
    (input.regions || []).slice(0, 2).join(" "),
    (input.tags || []).slice(0, 3).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!enabled) {
    return {
      enabled: false,
      query,
      sources: [],
      ...sourceDepth([]),
      priority_section: prioritySection,
      warnings: [prioritySection ? "public_article_research_disabled" : "public_article_research_not_enabled_for_section"],
    };
  }

  const warnings: string[] = [];
  const maxSearch = Number(process.env.ALBIS_PUBLIC_ARTICLE_RESEARCH_SEARCH_RESULTS || 6);
  const maxFetch = Number(process.env.ALBIS_PUBLIC_ARTICLE_RESEARCH_FETCH_LIMIT || 4);
  let results: Array<{ title: string; url: string; snippet?: string }> = [];
  try {
    results = await braveSearch(query, maxSearch);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : String(error));
    return { enabled: true, query, sources: [], ...sourceDepth([]), priority_section: prioritySection, warnings };
  }

  const sources: PublicArticleResearchSource[] = [];
  const seenDomains = new Set<string>();
  for (const result of results) {
    if (sources.length >= maxFetch) break;
    const domain = domainFromUrl(result.url);
    if (seenDomains.has(domain)) continue;
    seenDomains.add(domain);
    try {
      const text = await fetchReadableArticleText(result.url);
      const fallback = result.snippet || result.title;
      const finalText = text.split(/\s+/).length >= 80 ? text : fallback;
      sources.push({
        title: result.title,
        url: result.url,
        domain,
        snippet: result.snippet,
        text: finalText,
        word_count: finalText.split(/\s+/).filter(Boolean).length,
        fetched: text.split(/\s+/).length >= 80,
      });
    } catch (error) {
      warnings.push(`${domain}:${error instanceof Error ? error.message : String(error)}`);
      if (result.snippet) {
        sources.push({
          title: result.title,
          url: result.url,
          domain,
          snippet: result.snippet,
          text: result.snippet,
          word_count: result.snippet.split(/\s+/).filter(Boolean).length,
          fetched: false,
        });
      }
    }
  }

  const depth = sourceDepth(sources);
  if (!depth.source_depth_valid) warnings.push(`public_research_source_depth_too_thin:${depth.distinct_url_count}_urls:${depth.distinct_domain_count}_domains`);
  if (sources.length < 3) warnings.push(`public_research_below_healthy_target:${sources.length}_sources`);
  return { enabled: true, query, sources, ...depth, priority_section: prioritySection, warnings };
}
