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
10 tracked topics checked. 7 active topics. 3 quiet topics. Coverage note in clear customer language.

Each topic has:
- broad tracked topic label, e.g. Press Freedom
- specific scan-based headline, e.g. RSF says global press freedom has fallen to its lowest level in 25 years
- 2–4 substantial researched paragraphs
- hard facts, numbers, named countries/actors, mechanisms, source contrast, and business/media relevance
- clean source trail, e.g. RSF 2026 Index · Committee to Protect Journalists · UNESCO · Freedom House

Perception Gap must be concrete:
View: [short editorial read, optional score/10]
Where the split appears: [which sources/regions frame it differently]
Why it matters: [why a company/customer should care]

Observations are practical editorial notes, not generic watch-next instructions.

Forbidden customer language: signal, clearest signal, this is the signal, Albis reading, useful point, operating signal, market signal, matched, selected scan areas, evidence threshold, source items, more in evidence trail, coverage needs careful reading, source trail needs careful reading.
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

function buildPromptPacket(input: {
  packet: CompanyBriefingEvidencePacket;
  output: CompanyBriefingGenerationOutput;
  layer: CompanyResearchedUnderstandingLayer;
}) {
  const sectionById = new Map(
    input.output.main_briefing.sections.map((section) => [section.section_id, section.heading]),
  );
  const sourceById = new Map(input.layer.sources.map((source) => [source.id, source]));

  const topics = input.layer.findings
    .filter((finding) => ["email_main", "email_secondary"].includes(finding.placement))
    .slice(0, 7)
    .map((finding) => {
      const cluster = input.layer.clusters.find((candidate) => candidate.id === finding.cluster_id);
      const note = input.layer.notes.find((candidate) => candidate.cluster_id === finding.cluster_id);
      const sourceIds = [...new Set([...(finding.email_source_ids || []), ...(finding.evidence_source_ids || [])])]
        .filter((id) => sourceById.has(id))
        .slice(0, 6);
      const sources = sourceIds.map((id) => {
        const source = sourceById.get(id) as ResearchSource;
        return {
          id: source.id,
          name: source.source_domain,
          url: source.url,
          title: clean(source.extracted_title || source.title),
          excerpt: clean(source.extracted_excerpt).slice(0, 900),
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
              summary: note.summary,
              what_happened: note.what_happened,
              key_facts: note.key_facts,
              key_numbers: note.key_numbers,
              key_actors: note.key_actors,
              named_places: note.named_places,
              source_observations: note.source_observations,
              differences_in_reporting: note.differences_in_reporting,
              company_relevance: note.company_relevance,
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
          minItems: 4,
          maxItems: 5,
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
                minItems: 2,
                maxItems: 4,
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

async function callOpenAIWriter(promptPacket: unknown): Promise<WriterResponse> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ALBIS_OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY or ALBIS_OPENAI_API_KEY is not configured");
  const model = process.env.ALBIS_COMPANY_SCAN_EDITORIAL_MODEL || "gpt-4o";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      response_format: {
        type: "json_schema",
        json_schema: responseSchema(),
      },
      messages: [
        {
          role: "system",
          content:
            "You are the Albis editorial writer for Company Daily Scan V1. Write exactly like the approved Lindell Media gold-standard email: reported, evidence-led, precise, human, and useful. Do not sound like an analyst pipeline. Use only the evidence provided. If evidence is thin, choose fewer stronger topics rather than padding. Never invent facts, numbers, sources, or URLs.",
        },
        {
          role: "user",
          content: `${GOLD_STANDARD_REFERENCE}\n\nWrite the customer-ready daily scan from this evidence packet. Return JSON only.\n\n${JSON.stringify(promptPacket, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI editorial writer failed: ${response.status} ${body.slice(0, 500)}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI editorial writer returned no content");
  return JSON.parse(content) as WriterResponse;
}

function applyWriterResponse(
  output: CompanyBriefingGenerationOutput,
  writer: WriterResponse,
): CompanyBriefingGenerationOutput {
  const next = cloneOutput(output);
  const layer = next.understanding?.researched_understanding_v1;
  if (!layer) return next;

  const topicsByCluster = new Map(writer.topics.map((topic) => [topic.cluster_id, topic]));
  const allowedClusterIds = new Set(writer.topics.map((topic) => topic.cluster_id));

  layer.findings = layer.findings.map((finding): AlbisFinding => {
    const topic = topicsByCluster.get(finding.cluster_id);
    if (!topic) {
      return { ...finding, placement: finding.placement === "dashboard" ? "dashboard" : "hold" };
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
    next.scanner_report.overview.text = clean(writer.overview);
  }
  if (writer.source_note) {
    next.source_notes.text.text = clean(writer.source_note);
  }
  next.understanding = {
    ...(next.understanding || {}),
    gold_standard_editorial_writer_v1: {
      enabled: true,
      model: process.env.ALBIS_COMPANY_SCAN_EDITORIAL_MODEL || "openai:gpt-4o",
      applied_at: new Date().toISOString(),
      reference: "approved_lindell_media_daily_scan_v1",
    },
  };
  next.trace = {
    ...next.trace,
    model_or_agent_label: process.env.ALBIS_COMPANY_SCAN_EDITORIAL_MODEL || "openai:gpt-4o",
  };
  return next;
}

function validateWriterResponse(writer: WriterResponse): string[] {
  const blockers: string[] = [];
  if (!Array.isArray(writer.topics) || writer.topics.length < 4) {
    blockers.push("Editorial writer returned fewer than four topics.");
  }
  for (const topic of writer.topics || []) {
    if (!topic.cluster_id || !topic.headline || !topic.topic_label) blockers.push(`Topic missing required label/headline: ${topic.cluster_id || "unknown"}`);
    if ((topic.paragraphs || []).length < 2) blockers.push(`${topic.cluster_id}: fewer than two paragraphs.`);
    if (words((topic.paragraphs || []).join(" ")) < 120) blockers.push(`${topic.cluster_id}: topic is under 120 words.`);
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
    model_used: process.env.ALBIS_COMPANY_SCAN_EDITORIAL_MODEL || "openai:gpt-4o",
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
          "Company Daily Scan V1 requires the gold-standard editorial writer. Set ALBIS_ENABLE_COMPANY_EDITORIAL_WRITER=true and OPENAI_API_KEY/ALBIS_OPENAI_API_KEY before sending.",
      },
    };
  }

  try {
    const promptPacket = buildPromptPacket({ packet: input.packet, output: input.output, layer });
    const writer = await callOpenAIWriter(promptPacket);
    const validation = validateWriterResponse(writer);
    const editedOutput = applyWriterResponse(input.output, writer);
    return {
      output: editedOutput,
      edited: true,
      edit_report: {
        ...baseReport,
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
