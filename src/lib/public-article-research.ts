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
  warnings: string[];
};

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
  connection?: string;
  tags?: string[];
  regions?: string[];
}): Promise<PublicArticleResearchPacket> {
  const enabled = process.env.ALBIS_ENABLE_PUBLIC_ARTICLE_RESEARCH === "true";
  const query = [
    input.title,
    (input.regions || []).slice(0, 2).join(" "),
    (input.tags || []).slice(0, 3).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!enabled) return { enabled: false, query, sources: [], warnings: ["public_article_research_disabled"] };

  const warnings: string[] = [];
  const maxSearch = Number(process.env.ALBIS_PUBLIC_ARTICLE_RESEARCH_SEARCH_RESULTS || 6);
  const maxFetch = Number(process.env.ALBIS_PUBLIC_ARTICLE_RESEARCH_FETCH_LIMIT || 4);
  let results: Array<{ title: string; url: string; snippet?: string }> = [];
  try {
    results = await braveSearch(query, maxSearch);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : String(error));
    return { enabled: true, query, sources: [], warnings };
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

  return { enabled: true, query, sources, warnings };
}
