import { generateEditorialJson } from "./editorial-model-client";
import { buildPublicArticleResearchPacket, type PublicArticleResearchPacket } from "./public-article-research";

export type PublicBriefingEditorialResult = {
  briefing: any;
  enabled: boolean;
  edited: boolean;
  blocked: boolean;
  blocked_reason?: string;
  research: Array<{ headline: string; source_count: number; fetched_source_count: number; distinct_url_count: number; distinct_domain_count: number; source_depth_valid: boolean; query: string; warnings: string[] }>;
  model_used?: string;
};

function clean(value: string | null | undefined): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function wordCount(value: string): number {
  return clean(value).split(/\s+/).filter(Boolean).length;
}

async function collectBriefingResearch(briefing: any): Promise<Map<string, PublicArticleResearchPacket>> {
  const limit = Number(process.env.ALBIS_PUBLIC_BRIEFING_RESEARCH_STORY_LIMIT || 5);
  const topStories = Array.isArray(briefing?.top_stories) ? briefing.top_stories.slice(0, limit) : [];
  const map = new Map<string, PublicArticleResearchPacket>();
  for (const story of topStories) {
    const headline = clean(story?.headline);
    if (!headline) continue;
    const packet = await buildPublicArticleResearchPacket({
      title: headline,
      category: story?.category,
      tags: [story?.category, story?.laneLabel].filter(Boolean),
      regions: [story?.region].filter(Boolean),
      connection: story?.summary || story?.why,
    });
    map.set(headline, packet);
  }
  return map;
}

function responseSchema() {
  return {
    name: "albis_public_daily_briefing_editorial_v1",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "lead_thesis", "top_stories"],
      properties: {
        title: { type: "string" },
        lead_thesis: { type: "string" },
        top_stories: {
          type: "array",
          minItems: 3,
          maxItems: 8,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["headline", "summary", "why"],
            properties: {
              headline: { type: "string" },
              summary: { type: "string" },
              why: { type: "string" },
            },
          },
        },
      },
    },
  };
}

async function callWriter(input: { briefing: any; researchMap: Map<string, PublicArticleResearchPacket> }) {
  const stories = (input.briefing.top_stories || []).map((story: any) => {
    const research = input.researchMap.get(clean(story.headline));
    return {
      slot: story.slot,
      headline: story.headline,
      category: story.category,
      region: story.region,
      current_summary: story.summary,
      current_why: story.why,
      score: story.score || null,
      tier: story.tier || null,
      research: (research?.sources || []).map((source) => ({
        title: source.title,
        domain: source.domain,
        url: source.url,
        fetched: source.fetched,
        excerpt: source.text.slice(0, 1200),
      })),
    };
  });

  const result = await generateEditorialJson<any>({
    modelEnv: "ALBIS_PUBLIC_BRIEFING_EDITORIAL_MODEL",
    defaultModel: process.env.ALBIS_EDITORIAL_MODEL_PROVIDER?.startsWith("cloudflare") ? "@cf/meta/llama-3.1-70b-instruct" : (process.env.ALBIS_PUBLIC_ARTICLE_EDITORIAL_MODEL || "gpt-4o"),
    temperature: 0.35,
    responseSchema: responseSchema(),
    messages: [
      {
        role: "system",
        content:
          "You are the Albis daily briefing editor. Rewrite the public daily briefing so it reads like a researched, concise mix of news briefing, explainer, and Albis intelligence note — not a scan summary. Use only the supplied source evidence. Keep summaries readable, factual, and specific. Keep each summary around 35-70 words and each why around 20-45 words. Include named places, institutions, numbers, mechanisms, and source-frame differences when available. Preserve the original story order. Avoid jargon such as signal, scan item, writeability, doctrine, operating picture, and AI/analyst filler. Return JSON only.",
      },
      {
        role: "user",
        content: JSON.stringify({ title: input.briefing.title, content_md: input.briefing.content_md, stories }, null, 2),
      },
    ],
  });
  return { ...result.json, _model_used: `${result.provider}:${result.model}` };
}

function replaceLeadThesis(contentMd: string, thesis: string): string {
  const cleanThesis = clean(thesis);
  if (!cleanThesis) return contentMd;
  return String(contentMd || "").replace(/## Lead thesis\n[\s\S]*?\n\n## Must-know signals/, `## Lead thesis\n${cleanThesis}\n\n## Must-know signals`);
}

function validateEditedBriefing(briefing: any): string[] {
  const warnings: string[] = [];
  const stories = Array.isArray(briefing?.top_stories) ? briefing.top_stories : [];
  if (stories.length < 3) warnings.push("briefing_has_too_few_top_stories");
  const short = stories.filter((story: any) => wordCount(story.summary) < 18).length;
  if (short > 2) warnings.push(`briefing_summaries_too_thin:${short}`);
  const banned = /\b(scan item|writeability|doctrine|operating picture|the useful point|for albis)\b/i;
  const customerText = stories
    .map((story: any) => `${story.summary || ""}\n${story.why || ""}`)
    .join("\n\n");
  if (banned.test(`${briefing.title || ""}\n${customerText}`)) warnings.push("briefing_contains_internal_language");
  return warnings;
}

export async function applyPublicBriefingEditorialWriter(briefing: any): Promise<PublicBriefingEditorialResult> {
  const enabled = process.env.ALBIS_ENABLE_PUBLIC_BRIEFING_EDITORIAL_WRITER !== "false";
  if (!enabled) return { briefing, enabled: false, edited: false, blocked: false, research: [] };

  const researchMap = await collectBriefingResearch(briefing);
  const research = [...researchMap.entries()].map(([headline, packet]) => ({
    headline,
    source_count: packet.sources.length,
    fetched_source_count: packet.sources.filter((source) => source.fetched).length,
    distinct_url_count: packet.distinct_url_count,
    distinct_domain_count: packet.distinct_domain_count,
    source_depth_valid: packet.source_depth_valid,
    query: packet.query,
    warnings: packet.warnings,
  }));

  if (process.env.ALBIS_REQUIRE_PUBLIC_BRIEFING_RESEARCH === "true" && research.some((item) => !item.source_depth_valid)) {
    return { briefing, enabled: true, edited: false, blocked: true, blocked_reason: "public_briefing_research_too_thin", research };
  }

  try {
    const edited = await callWriter({ briefing, researchMap });
    const storyEdits = new Map<string, any>((edited.top_stories || []).map((story: any) => [clean(story.headline).toLowerCase(), story]));
    const editedStories = Array.isArray(edited.top_stories) ? edited.top_stories : [];
    const nextStories = (briefing.top_stories || []).map((story: any, index: number) => {
      const replacement = storyEdits.get(clean(story.headline).toLowerCase()) || editedStories[index];
      if (!replacement) return story;
      return { ...story, summary: clean(replacement.summary) || story.summary, why: clean(replacement.why) || story.why };
    });
    const next = {
      ...briefing,
      title: clean(edited.title) || briefing.title,
      content_md: replaceLeadThesis(briefing.content_md, edited.lead_thesis),
      top_stories: nextStories,
    };
    const warnings = validateEditedBriefing(next);
    if (warnings.length) return { briefing: next, enabled: true, edited: false, blocked: true, blocked_reason: warnings.join("; "), research };
    return { briefing: next, enabled: true, edited: true, blocked: false, research, model_used: edited._model_used || process.env.ALBIS_PUBLIC_BRIEFING_EDITORIAL_MODEL || process.env.ALBIS_PUBLIC_ARTICLE_EDITORIAL_MODEL || "auto" };
  } catch (error) {
    return { briefing, enabled: true, edited: false, blocked: true, blocked_reason: error instanceof Error ? error.message : String(error), research };
  }
}
