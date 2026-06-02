import { generateEditorialJson } from "./editorial-model-client";

export type AiReviewCard = {
  title: string;
  summary: string;
  bullets: string[];
  still_unclear?: string | null;
  tags?: string[];
};

const REVIEW_SCHEMA = {
  name: "albis_ai_review_card",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "summary", "bullets", "still_unclear", "tags"],
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      bullets: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
      still_unclear: { type: ["string", "null"] },
      tags: { type: "array", items: { type: "string" }, maxItems: 6 },
    },
  },
};

function cleanText(value: string) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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

async function readSource(url: string) {
  const domain = domainFromUrl(url);
  if (/youtube|youtu\.be|tiktok|instagram|facebook|reddit|x\.com|twitter\.com/i.test(domain)) {
    return { url, domain, text: "Social/video source. Use only the URL/domain and any user-provided context; do not invent transcript details." };
  }
  try {
    const response = await fetchWithTimeout(url, 6500);
    if (!response.ok) throw new Error(`fetch_${response.status}`);
    const html = await response.text();
    const article = html.match(/<article[\s\S]*?<\/article>/i)?.[0];
    const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0];
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
    return { url, domain, text: cleanText(`${title}\n\n${article || main || html}`).slice(0, 4500) };
  } catch (error) {
    return { url, domain, text: `Could not fetch full text (${error instanceof Error ? error.message : "fetch_failed"}). Use only the URL/domain and user-provided context.` };
  }
}

function clamp(value: unknown, max: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function generateAiReviewCard(input: {
  title?: string;
  context?: string;
  sourceUrls: string[];
  authorName: string;
}): Promise<{ card: AiReviewCard; modelUsed: string; sourceReads: Array<{ url: string; domain: string; text: string }> }> {
  const sourceReads = await Promise.all(input.sourceUrls.slice(0, 6).map(readSource));
  const sourcePacket = sourceReads
    .map((source, index) => `SOURCE ${index + 1}: ${source.domain}\nURL: ${source.url}\nTEXT:\n${source.text}`)
    .join("\n\n---\n\n");

  const result = await generateEditorialJson<AiReviewCard>({
    modelEnv: "ALBIS_FEED_AI_REVIEW_MODEL",
    defaultModel: process.env.ALBIS_PUBLIC_ARTICLE_EDITORIAL_MODEL || "gpt-4.1-mini",
    temperature: 0.25,
    responseSchema: REVIEW_SCHEMA,
    messages: [
      {
        role: "system",
        content: [
          "You write concise Albis review cards from user-submitted links.",
          "Do not pretend to verify facts beyond the supplied source text and user context.",
          "If sources are thin, say what is unclear instead of inventing details.",
          "Write in plain English. No hype. No moralising. No 'according to the link' filler.",
          "The card should help readers understand what the submitted material appears to show and why it may matter.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Submitted by: ${input.authorName}`,
          `User title: ${input.title || "(none)"}`,
          `User context/question: ${input.context || "(none)"}`,
          `Number of links: ${input.sourceUrls.length}`,
          "",
          sourcePacket,
          "",
          "Return JSON with:",
          "- title: max 110 chars, specific and human",
          "- summary: 1-2 sentences, max 420 chars",
          "- bullets: 2-4 short bullets with concrete takeaways",
          "- still_unclear: what readers should be careful about, or null",
          "- tags: lowercase topic tags",
        ].join("\n"),
      },
    ],
  });

  const card = result.json;
  return {
    modelUsed: `${result.provider}:${result.model}`,
    sourceReads,
    card: {
      title: clamp(card.title || input.title || "AI review card", 140),
      summary: clamp(card.summary, 900) || clamp(input.context, 900) || `AI review of ${input.sourceUrls.length} submitted link${input.sourceUrls.length === 1 ? "" : "s"}.`,
      bullets: (Array.isArray(card.bullets) ? card.bullets : [])
        .map((bullet) => clamp(bullet, 240))
        .filter(Boolean)
        .slice(0, 4),
      still_unclear: card.still_unclear ? clamp(card.still_unclear, 400) : null,
      tags: (Array.isArray(card.tags) ? card.tags : [])
        .map((tag) => clamp(tag, 32).toLowerCase().replace(/[^a-z0-9- ]/g, "").trim())
        .filter(Boolean)
        .slice(0, 6),
    },
  };
}
