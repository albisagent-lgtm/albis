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
          minItems: 6,
          maxItems: 11,
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
          "You are the Albis public article writer. Write a reported article from the researched sources provided: usually 6-10 concise paragraphs and 500-850 words, longer only when the evidence genuinely supports it. The article should read like careful public-interest reporting, not an essay explaining its own lesson. Concrete facts must carry the meaning. Open with a specific fact, person, place, number, institutional action, or visible consequence. Then move in sequence: what happened, what the sources verify, the mechanism underneath, who or what is affected, what remains uncertain, and the cleanest larger implication. Do not announce 'why it matters'; show why through the facts. Do not use scaffolding phrases such as 'this matters because', 'that is why', 'the useful question', 'the deeper signal', 'the headline is about', 'the underlying story is', 'this belongs in', or 'for Albis'. Avoid moralising, sermonising, generic significance language, and analyst filler. Never mention the scan, scanner, selected item, article slot, published set, writeability, draft, or why Albis chose the story. Use only provided evidence; do not invent facts, quotes, numbers, URLs, named actors, or local colour. The Life Systems foundation should shape judgment quietly: energy, food, water, health, infrastructure, logistics, shelter, work, and public capacity matter because people rely on them. Return JSON only.",
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
  if (!Array.isArray(json.paragraphs) || json.paragraphs.length < 6) warnings.push("writer_returned_too_few_paragraphs");
  if (wordCount(body) < 500) warnings.push(`writer_body_too_short:${wordCount(body)}`);
  if (wordCount(body) > 950) warnings.push(`writer_body_too_wordy:${wordCount(body)}`);
  if (!research.source_depth_valid) warnings.push(`research_sources_too_thin:${research.distinct_url_count}_urls:${research.distinct_domain_count}_domains:${research.independent_source_count}_independent:${research.fetched_source_count}_fetched`);
  const bad = /\b(this is more than|this matters because|why it matters|that is why|for albis|the deeper signal|the point is|the useful question|the useful reading|the headline is about|the underlying story is|this belongs in|the article should|belongs in the published set|gives the scan|item editorial weight|stronger live signal in the scan|live signal in the scan|the scan flags|patterns in the scan|framing pattern in the scan|writeability|the scan does not support)\b/i;
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
