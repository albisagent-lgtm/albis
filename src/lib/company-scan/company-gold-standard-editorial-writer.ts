// ---------------------------------------------------------------------------
// Company Daily Scan V1 — gold-standard editorial writer pass.
//
// This is the missing layer between evidence gathering and customer delivery:
// the same process used for the approved Lindell Media test email. The
// deterministic Package 8 generator prepares evidence; this pass asks a writer
// model to make the editorial decisions and write the customer copy.
//
// If the writer is not configured, V1 output is intentionally blocked by the
// returned editor audit. We should not fall back to assembled summaries for the
// launch product.
// ---------------------------------------------------------------------------

import { editorialModelConfiguredHint, generateEditorialJson } from "../editorial-model-client";
import type {
  AlbisFinding,
  CompanyBriefingEditorPass,
  CompanyBriefingEvidencePacket,
  CompanyBriefingGenerationOutput,
  CompanyResearchedUnderstandingLayer,
  ResearchNote,
  ResearchSource,
} from "./types";

export type GoldStandardEditorialWriterResult = {
  output: CompanyBriefingGenerationOutput;
  edited: boolean;
  edit_report: CompanyBriefingEditorPass;
};

type WriterTopic = {
  cluster_id: string;
  topic_label: string;
  headline: string;
  paragraphs: string[];
  source_ids: string[];
  perception_gap?: {
    view: string;
    where_the_split_appears: string;
    why_it_matters: string;
    score?: number;
  };
};

type WriterResponse = {
  overview?: string;
  topics: WriterTopic[];
  observations: string[];
  source_note?: string;
};

const GOLD_STANDARD_REFERENCE = `
The approved V1 model is the Lindell Media Daily Scan written in a reported editorial voice.
It uses this shape:

Lindell Media Daily Scan
Prepared by Albis
[date]
Lindell Media

Your Daily Scan
10+ tracked topics checked. At least 10 active stories. Quiet topics noted in the dashboard. Coverage note in clear customer language.

Each topic has:
- broad tracked topic label, e.g. Press Freedom
- specific scan-based headline, e.g. RSF says global press freedom has fallen to its lowest level in 25 years
- 100–150 words total where the evidence supports it, usually 1–2 tight researched paragraphs
- minimum 10 stories every day; if the scan cannot support 10, retrieval/scanning must improve rather than sending fewer
- every story must be written from a cluster of evidence, not a single-source summary
- hard facts, numbers, named countries/actors, mechanisms, source contrast, and business/media relevance
- no repeated paragraphs, no source-trail metadata, and no filler just to hit length
- clean source trail, e.g. RSF 2026 Index · Committee to Protect Journalists · UNESCO · Freedom House

Perception Gap must be concrete:
View: [short editorial read, optional score/10]
Where the split appears: [which sources/regions frame it differently]
Why it matters: [why a company/customer should care]

Observations are practical editorial notes, not generic watch-next instructions.

Forbidden customer language: signal, clearest signal, this is the signal, Albis reading, useful point, operating signal, market signal, matched, selected scan areas, evidence threshold, source items, more in evidence trail, coverage needs careful reading, source trail needs careful reading, source trail includes concrete markers, add different layers to the same tracked topic.
`;

function cloneOutput(output: CompanyBriefingGenerationOutput): CompanyBriefingGenerationOutput {
  return JSON.parse(JSON.stringify(output)) as CompanyBriefingGenerationOutput;
}

function words(value: string): number {
  return String(value || "").split(/\s+/).filter(Boolean).length;
}

function clean(value: string | undefined | null): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function cleanSentenceSafe(value: string | undefined | null, maxSentenceWords = 42): string {
  const text = clean(value);
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [text];
  return sentences
    .flatMap((sentence) => {
      if (words(sentence) <= maxSentenceWords) return [sentence];
      const parts = sentence.split(/,\s+|;\s+|:\s+/).map((part) => part.trim()).filter(Boolean);
      if (parts.length <= 1) return [sentence];
      const chunks: string[] = [];
      let current = "";
      for (const part of parts) {
        const next = current ? `${current}, ${part}` : part;
        if (words(next) > maxSentenceWords && current) {
          chunks.push(current.replace(/[,.!?;:]*$/, "."));
          current = part;
        } else {
          current = next;
        }
      }
      if (current) chunks.push(current.replace(/[,.!?;:]*$/, "."));
      return chunks;
    })
    .join(" ");
}

function buildPromptPacket(input: {
  packet: CompanyBriefingEvidencePacket;
  output: CompanyBriefingGenerationOutput;
  layer: CompanyResearchedUnderstandingLayer;
}) {
  const sectionById = new Map(
    input.output.main_briefing.sections.map((section) => [section.section_id, section.heading]),
  );
  const sourceById = new Map(input.layer.sources.map((source) => [source.id, source]));
  const distinctSourceIds = (ids: string[]) => {
    const seenUrls = new Set<string>();
    const out: string[] = [];
    for (const id of ids) {
      const source = sourceById.get(id);
      if (!source) continue;
      const key = source.url || `${source.source_domain}:${source.title}`;
      if (seenUrls.has(key)) continue;
      seenUrls.add(key);
      out.push(id);
    }
    return out;
  };
  const hasDistinctSourceDepth = (finding: AlbisFinding) => {
    const findingSources = distinctSourceIds([...(finding.email_source_ids || []), ...(finding.evidence_source_ids || [])])
      .map((id) => sourceById.get(id))
      .filter((source): source is ResearchSource => Boolean(source));
    const urls = new Set(findingSources.map((source) => source.url).filter(Boolean));
    const domains = new Set(findingSources.map((source) => source.source_domain.replace(/^www\./i, "").toLowerCase()).filter(Boolean));
    return urls.size >= 2 && domains.size >= 2;
  };
  const topics = input.layer.findings
    .filter((finding) => ["email_main", "email_secondary"].includes(finding.placement))
    .filter(hasDistinctSourceDepth)
    .slice(0, 10)
    .map((finding) => {
      const cluster = input.layer.clusters.find((candidate) => candidate.id === finding.cluster_id);
      const note = input.layer.notes.find((candidate) => candidate.cluster_id === finding.cluster_id);
      const sourceIds = distinctSourceIds([...(finding.email_source_ids || []), ...(finding.evidence_source_ids || [])])
        .filter((id) => sourceById.has(id))
        .slice(0, 6);
      const sources = sourceIds.slice(0, 5).map((id) => {
        const source = sourceById.get(id) as ResearchSource;
        return {
          id: source.id,
          name: source.source_domain,
          url: source.url,
          title: clean(source.extracted_title || source.title).slice(0, 180),
          excerpt: clean(source.extracted_excerpt).slice(0, 180),
          region: source.region,
          published_at: source.published_at,
        };
      });
      return {
        cluster_id: finding.cluster_id,
        current_topic_label: cluster?.scan_area_ids?.map((id) => sectionById.get(id)).filter(Boolean)[0] || finding.title,
        current_headline: finding.title,
        current_note: note
          ? {
              summary: clean(note.summary).slice(0, 260),
              what_happened: clean(note.what_happened).slice(0, 220),
              key_facts: note.key_facts.slice(0, 3).map((fact) => clean(fact).slice(0, 180)),
              key_numbers: note.key_numbers.slice(0, 4),
              key_actors: note.key_actors.slice(0, 5),
              named_places: note.named_places.slice(0, 5),
              source_observations: note.source_observations.slice(0, 3).map((observation) => ({
                source_id: observation.source_id,
                what_it_reports: clean(observation.what_it_reports).slice(0, 160),
                useful_detail: clean(observation.useful_detail).slice(0, 120),
              })),
              differences_in_reporting: note.differences_in_reporting.slice(0, 2).map((difference) => ({
                label: clean(difference.label).slice(0, 80),
                description: clean(difference.description).slice(0, 180),
                source_ids: difference.source_ids.slice(0, 4),
              })),
              company_relevance: clean(note.company_relevance).slice(0, 220),
            }
          : null,
        sources,
      };
    });

  return {
    company: input.packet.company.display_name,
    scan_date: input.layer.scan_date,
    tracked_topics: input.packet.company.selected_scan_areas.map((area) => area.label),
    current_overview: input.output.scanner_report?.overview?.text || input.output.today_brief.top_line.text,
    topics,
  };
}

function responseSchema() {
  return {
    name: "company_daily_scan_gold_standard_editorial",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["overview", "topics", "observations", "source_note"],
      properties: {
        overview: { type: "string" },
        source_note: { type: "string" },
        observations: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
        },
        topics: {
          type: "array",
          minItems: 10,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["cluster_id", "topic_label", "headline", "paragraphs", "source_ids", "perception_gap"],
            properties: {
              cluster_id: { type: "string" },
              topic_label: { type: "string" },
              headline: { type: "string" },
              paragraphs: {
                type: "array",
                minItems: 1,
                maxItems: 2,
                items: { type: "string" },
              },
              source_ids: {
                type: "array",
                minItems: 2,
                maxItems: 5,
                items: { type: "string" },
              },
              perception_gap: {
                type: "object",
                additionalProperties: false,
                required: ["view", "where_the_split_appears", "why_it_matters", "score"],
                properties: {
                  view: { type: "string" },
                  where_the_split_appears: { type: "string" },
                  why_it_matters: { type: "string" },
                  score: { type: ["number", "null"] },
                },
              },
            },
          },
        },
      },
    },
  };
}

async function callEditorialWriter(promptPacket: unknown): Promise<{ writer: WriterResponse; modelUsed: string }> {
  const result = await generateEditorialJson<WriterResponse>({
    modelEnv: "ALBIS_COMPANY_SCAN_EDITORIAL_MODEL",
    defaultModel: process.env.ALBIS_EDITORIAL_MODEL_PROVIDER?.startsWith("cloudflare") ? "@cf/meta/llama-3.1-70b-instruct" : "gpt-4o",
    temperature: 0.45,
    responseSchema: responseSchema(),
    messages: [
      {
        role: "system",
        content:
          "You are the Albis editorial writer for Company Daily Scan V1. Write exactly like the approved Lindell Media gold-standard email: reported, evidence-led, precise, human, and useful. Do not sound like an analyst pipeline. Use only the evidence provided. Write at least 10 source-backed stories, each 100–150 words where evidence supports it. If evidence is thin, retrieval must improve rather than padding. Never invent facts, numbers, sources, or URLs. Return JSON only.",
      },
      {
        role: "user",
        content: `${GOLD_STANDARD_REFERENCE}\n\nWrite the customer-ready daily scan from this evidence packet. Return JSON only.\n\n${JSON.stringify(promptPacket, null, 2)}`,
      },
    ],
  });
  return { writer: result.json, modelUsed: `${result.provider}:${result.model}` };
}

function applyWriterResponse(
  output: CompanyBriefingGenerationOutput,
  writer: WriterResponse,
  modelUsed: string,
): CompanyBriefingGenerationOutput {
  const next = cloneOutput(output);
  const layer = next.understanding?.researched_understanding_v1;
  if (!layer) return next;

  const topicsByCluster = new Map(writer.topics.map((topic) => [topic.cluster_id, topic]));
  const sourceById = new Map(layer.sources.map((source) => [source.id, source]));
  const hasDistinctSourceDepth = (finding: AlbisFinding) => {
    const sources = (finding.evidence_source_ids || [])
      .map((id) => sourceById.get(id))
      .filter((source): source is ResearchSource => Boolean(source));
    const urls = new Set(sources.map((source) => source.url).filter(Boolean));
    const domains = new Set(sources.map((source) => source.source_domain.replace(/^www\./i, "").toLowerCase()).filter(Boolean));
    return urls.size >= 2 && domains.size >= 2;
  };
  const validWriterClusterIds = new Set(
    layer.findings
      .filter((finding) => topicsByCluster.has(finding.cluster_id))
      .filter(hasDistinctSourceDepth)
      .map((finding) => finding.cluster_id),
  );
  const fallbackClusterIds = new Set(
    layer.findings
      // If the model returns fewer than 10 valid topics, backfill from any
      // source-depth-valid researched finding, not only the pre-email subset.
      // The 10-story guarantee should fail only when the research layer truly
      // lacks enough corroborated stories.
      .filter((finding) => !validWriterClusterIds.has(finding.cluster_id))
      .filter(hasDistinctSourceDepth)
      .sort((a, b) => {
        const placementScore = (finding: AlbisFinding) =>
          finding.placement === "email_main"
            ? 3
            : finding.placement === "email_secondary"
              ? 2
              : finding.placement === "dashboard"
                ? 1
                : 0;
        return (
          placementScore(b) - placementScore(a) ||
          (b.evidence_source_ids || []).length -
            (a.evidence_source_ids || []).length
        );
      })
      .slice(0, Math.max(0, 10 - validWriterClusterIds.size))
      .map((finding) => finding.cluster_id),
  );
  const allowedClusterIds = new Set([...validWriterClusterIds, ...fallbackClusterIds]);

  layer.findings = layer.findings.map((finding): AlbisFinding => {
    const topic = topicsByCluster.get(finding.cluster_id);
    const useWriterTopic = topic && validWriterClusterIds.has(finding.cluster_id);
    if (!useWriterTopic || !allowedClusterIds.has(finding.cluster_id)) {
      return {
        ...finding,
        placement: fallbackClusterIds.has(finding.cluster_id)
          ? "email_main"
          : finding.placement === "dashboard" ? "dashboard" : "hold",
      };
    }
    const body = topic.paragraphs.map(clean).filter(Boolean).join("\n\n");
    return {
      ...finding,
      title: clean(topic.headline),
      body,
      why_it_matters: topic.perception_gap?.why_it_matters || finding.why_it_matters,
      evidence_source_ids: topic.source_ids,
      email_source_ids: topic.source_ids,
      placement: "email_main",
    };
  });

  layer.clusters = layer.clusters.map((cluster) => {
    const topic = topicsByCluster.get(cluster.id);
    return topic ? { ...cluster, title: topic.headline, status: "ready" } : cluster;
  });

  layer.notes = layer.notes.map((note): ResearchNote => {
    const topic = topicsByCluster.get(note.cluster_id);
    if (!topic) return note;
    const paragraphs = topic.paragraphs.map(clean).filter(Boolean);
    const [first, second, third, fourth] = paragraphs;
    return {
      ...note,
      summary: clean(topic.headline),
      what_happened: first || topic.headline,
      what_changed_today: second || first || topic.headline,
      key_facts: paragraphs,
      source_observations: paragraphs.slice(0, 3).map((paragraph, index) => ({
        source_id: topic.source_ids[index] || topic.source_ids[0] || "writer_source",
        what_it_reports: paragraph,
        what_it_emphasises: paragraph,
        useful_detail: paragraph,
      })),
      differences_in_reporting: topic.perception_gap
        ? [
            {
              label: "Source frame contrast",
              description: topic.perception_gap.where_the_split_appears,
              source_ids: topic.source_ids,
            },
          ]
        : note.differences_in_reporting,
      possible_perception_gap: topic.perception_gap
        ? {
            strength: "strong",
            gap: `View: ${topic.perception_gap.view}${typeof topic.perception_gap.score === "number" ? ` (${topic.perception_gap.score}/10)` : ""}. Where the split appears: ${topic.perception_gap.where_the_split_appears}`,
            why_it_matters: `Why it matters: ${topic.perception_gap.why_it_matters}`,
            evidence_source_ids: topic.source_ids,
          }
        : note.possible_perception_gap,
    };
  });

  next.main_briefing.sections = next.main_briefing.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowedClusterIds.has(item.cluster_id)),
    }))
    .filter((section) => section.items.length > 0 || section.no_material_signal_line);

  next.useful_observations = {
    observations: writer.observations.slice(0, 4).map((observation) => ({
      text: clean(observation),
      supported_by: next.source_notes.text.supported_by || [],
    })),
  };

  if (writer.overview && next.scanner_report?.overview) {
    next.scanner_report.overview.text = cleanSentenceSafe(writer.overview);
  }
  if (writer.source_note) {
    next.source_notes.text.text = cleanSentenceSafe(writer.source_note);
  }
  next.understanding = {
    ...(next.understanding || {}),
    gold_standard_editorial_writer_v1: {
      enabled: true,
      model: modelUsed,
      applied_at: new Date().toISOString(),
      reference: "approved_lindell_media_daily_scan_v1",
    },
  };
  next.trace = {
    ...next.trace,
    model_or_agent_label: modelUsed,
  };
  return next;
}

function validateWriterResponse(writer: WriterResponse): string[] {
  const blockers: string[] = [];
  if (!Array.isArray(writer.topics) || writer.topics.length < 10) {
    blockers.push("Editorial writer returned fewer than ten topics.");
  }
  for (const topic of writer.topics || []) {
    if (!topic.cluster_id || !topic.headline || !topic.topic_label) blockers.push(`Topic missing required label/headline: ${topic.cluster_id || "unknown"}`);
    if ((topic.paragraphs || []).length < 1) blockers.push(`${topic.cluster_id}: missing paragraph copy.`);
    const topicWords = words((topic.paragraphs || []).join(" "));
    if (topicWords < 50) blockers.push(`${topic.cluster_id}: topic is under 50 words; 100–150 is the target where evidence supports it.`);
    if (topicWords > 170) blockers.push(`${topic.cluster_id}: topic is over 170 words; target 100–150 max where possible.`);
    if ((topic.source_ids || []).length < 2) blockers.push(`${topic.cluster_id}: fewer than two source ids.`);
    const bad = /\b(signal|clearest signal|this is the signal|Albis reading|useful point|operating signal|market signal|matched|selected scan areas|evidence threshold|source items|more in evidence trail)\b/i;
    if (bad.test(`${topic.headline} ${(topic.paragraphs || []).join(" ")}`)) blockers.push(`${topic.cluster_id}: contains banned/internal language.`);
  }
  if (!Array.isArray(writer.observations) || writer.observations.length < 2) {
    blockers.push("Editorial writer returned fewer than two observations.");
  }
  return blockers;
}

export async function applyGoldStandardEditorialWriter(input: {
  packet: CompanyBriefingEvidencePacket;
  output: CompanyBriefingGenerationOutput;
}): Promise<GoldStandardEditorialWriterResult> {
  const baseReport = {
    enabled: true,
    mode: "gold_standard_editorial_writer" as const,
    deterministic: false,
    model_used: process.env.ALBIS_COMPANY_SCAN_EDITORIAL_MODEL || process.env.ALBIS_EDITORIAL_MODEL_PROVIDER || "auto",
    changed_paths: [],
    warnings: [],
    blocked: false,
    field_audits: [],
  };

  if (input.output.scanner_report?.layout_version !== "company_daily_scan_v1") {
    return { output: input.output, edited: false, edit_report: { ...baseReport, enabled: false } };
  }

  const layer = input.output.understanding?.researched_understanding_v1;
  if (!layer) {
    return {
      output: input.output,
      edited: false,
      edit_report: {
        ...baseReport,
        blocked: true,
        blocked_reason: "Gold-standard editorial writer requires the researched-understanding layer.",
      },
    };
  }

  if (process.env.ALBIS_ENABLE_COMPANY_EDITORIAL_WRITER !== "true") {
    return {
      output: input.output,
      edited: false,
      edit_report: {
        ...baseReport,
        blocked: true,
        blocked_reason:
          `Company Daily Scan V1 requires the gold-standard editorial writer. Set ALBIS_ENABLE_COMPANY_EDITORIAL_WRITER=true and configure ${editorialModelConfiguredHint()} before sending.`,
      },
    };
  }

  try {
    const promptPacket = buildPromptPacket({ packet: input.packet, output: input.output, layer });
    const result = await callEditorialWriter(promptPacket);
    const writer = result.writer;
    const validation = validateWriterResponse(writer);
    const editedOutput = applyWriterResponse(input.output, writer, result.modelUsed);
    return {
      output: editedOutput,
      edited: true,
      edit_report: {
        ...baseReport,
        model_used: result.modelUsed,
        changed_paths: [
          "understanding.researched_understanding_v1.findings",
          "understanding.researched_understanding_v1.notes",
          "useful_observations.observations",
          "source_notes.text",
        ],
        warnings: validation,
        blocked: validation.length > 0,
        blocked_reason: validation.length ? validation.join(" ") : undefined,
      },
    };
  } catch (error) {
    return {
      output: input.output,
      edited: false,
      edit_report: {
        ...baseReport,
        blocked: true,
        blocked_reason: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
