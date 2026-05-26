// ---------------------------------------------------------------------------
// Public article editorial writer.
//
// Turns scan-selected story plans + researched article text into readable Albis
// public articles. The template/planner can prepare structure, but this pass is
// where source reading becomes editorial understanding.
// ---------------------------------------------------------------------------

import { generateEditorialJson } from "./editorial-model-client";
import type { PublicArticleResearchPacket } from "./public-article-research";

export type PublicArticleEditorialResult = {
  enabled: boolean;
  edited: boolean;
  blocked: boolean;
  blocked_reason?: string;
  model_used?: string;
  title?: string;
  description?: string;
  body?: string;
  source_note?: string;
  warnings: string[];
};

type WriterJson = {
  title?: string;
  description?: string;
  paragraphs: string[];
  source_note?: string;
};

function clean(value: string | undefined | null): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function wordCount(value: string): number {
  return clean(value).split(/\s+/).filter(Boolean).length;
}

function responseSchema() {
  return {
    name: "albis_public_article_editorial_v1",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "description", "paragraphs", "source_note"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        source_note: { type: "string" },
        paragraphs: {
          type: "array",
          minItems: 8,
          maxItems: 14,
          items: { type: "string" },
        },
      },
    },
  };
}

async function callEditorialModel(input: {
  packet: any;
  currentDraft: string;
  research: PublicArticleResearchPacket;
}): Promise<{ json: WriterJson; model: string; provider: string }> {
  const prompt = {
    story: {
      title: input.packet.title,
      category: input.packet.category,
      tags: input.packet.tags,
      regions: input.packet.regions,
      connection: input.packet.connection,
      significance: input.packet.significance,
      perception_gap: input.packet.perceptionGap,
      coverage_breadth: input.packet.coverageBreadth,
      article_form: input.packet.articleForm,
      story_plan: input.packet.storyPlan || null,
      article_signals: input.packet.articleSignals || null,
    },
    current_draft: input.currentDraft,
    research: {
      query: input.research.query,
      sources: input.research.sources.map((source) => ({
        title: source.title,
        domain: source.domain,
        url: source.url,
        fetched: source.fetched,
        excerpt: source.text.slice(0, 1800),
      })),
    },
  };

  const result = await generateEditorialJson<WriterJson>({
    modelEnv: "ALBIS_PUBLIC_ARTICLE_EDITORIAL_MODEL",
    defaultModel: process.env.ALBIS_EDITORIAL_MODEL_PROVIDER?.startsWith("cloudflare") ? "@cf/meta/llama-3.1-70b-instruct" : "gpt-4o",
    temperature: 0.45,
    responseSchema: responseSchema(),
    messages: [
      {
        role: "system",
        content:
          "You are the Albis public premium article writer. Write a full understanding article from the researched sources provided: 8-14 substantial paragraphs, normally 900-1,200 words when the evidence supports it. The output must read like a story for public readers, not an observation about an internal scan. The voice should combine a clean news article, a useful explainer, and an Albis intelligence note: what happened, why it matters, how the system works, how different sources or regions frame it, and what changes for readers. The editorial foundation is twofold: (1) material life systems in the spirit of Vaclav Smil — energy, food, water, health, climate, infrastructure, logistics, materials, livelihoods, and the physical systems people rely on; (2) ancient wisdom traditions — clarity, humility, compassion, truthfulness, attention to suffering, and freedom from confusion or outrage. Do not quote scripture, preach, moralise, or add spiritual language unless the sources themselves justify it; let that foundation shape judgment, plainness, and care. Prioritise what actually sustains life and social stability over jargon, spectacle, and isolated political noise. Do not merely summarise the scan title. Never mention the scan, scanner, selected item, article slot, published set, writeability, draft, or why Albis chose the story. Open with a concrete fact, person, place, number, or institutional action. Explain mechanism, stakes, source-frame differences, second-order consequences, and what remains uncertain. Use only provided evidence; do not invent facts, quotes, numbers, URLs, or named actors. Avoid AI/analyst filler and phrases such as 'this is more than', 'the deeper signal', 'for Albis', 'the point is', 'what to watch', 'picked up by the scan', and 'strong live signal'. Return JSON only.",
      },
      {
        role: "user",
        content: `Write the final article. Return JSON only.\n\n${JSON.stringify(prompt, null, 2)}`,
      },
    ],
  });
  return { json: result.json, model: result.model, provider: result.provider };
}

function validateWriter(json: WriterJson, research: PublicArticleResearchPacket): string[] {
  const warnings: string[] = [];
  const body = (json.paragraphs || []).join("\n\n");
  if (!Array.isArray(json.paragraphs) || json.paragraphs.length < 8) warnings.push("writer_returned_too_few_paragraphs");
  if (wordCount(body) < 750) warnings.push(`writer_body_too_short:${wordCount(body)}`);
  if (!research.source_depth_valid) warnings.push(`research_sources_too_thin:${research.distinct_url_count}_urls:${research.distinct_domain_count}_domains`);
  const bad = /\b(this is more than|for albis|the deeper signal|the point is not just|the article should|belongs in the published set|gives the scan|item editorial weight|stronger live signal in the scan|live signal in the scan|the scan flags|patterns in the scan|framing pattern in the scan|writeability|the scan does not support)\b/i;
  if (bad.test(body)) warnings.push("writer_used_banned_public_language");
  const sourceDomains = research.sources.map((source) => source.domain.toLowerCase().split(".")[0]).filter(Boolean);
  const mentionsAnySource = sourceDomains.some((domain) => body.toLowerCase().includes(domain));
  if (research.sources.length >= 2 && !mentionsAnySource) warnings.push("writer_did_not_surface_source_texture");
  return warnings;
}

export async function runPublicArticleEditorialWriter(input: {
  packet: any;
  currentDraft: string;
  research: PublicArticleResearchPacket;
}): Promise<PublicArticleEditorialResult> {
  const enabled = process.env.ALBIS_ENABLE_PUBLIC_ARTICLE_EDITORIAL_WRITER !== "false" && input.research.enabled;
  if (!enabled) return { enabled: false, edited: false, blocked: false, warnings: ["public_article_editorial_writer_disabled"] };
  try {
    const result = await callEditorialModel(input);
    const json = result.json;
    const warnings = validateWriter(json, input.research);
    return {
      enabled: true,
      edited: warnings.length === 0,
      blocked: warnings.length > 0,
      blocked_reason: warnings.length ? warnings.join("; ") : undefined,
      model_used: `${result.provider}:${result.model}`,
      title: clean(json.title),
      description: clean(json.description),
      body: (json.paragraphs || []).map(clean).filter(Boolean).join("\n\n"),
      source_note: clean(json.source_note),
      warnings,
    };
  } catch (error) {
    return {
      enabled: true,
      edited: false,
      blocked: true,
      blocked_reason: error instanceof Error ? error.message : String(error),
      model_used: process.env.ALBIS_PUBLIC_ARTICLE_EDITORIAL_MODEL || process.env.ALBIS_EDITORIAL_MODEL_PROVIDER || "auto",
      warnings: [],
    };
  }
}
