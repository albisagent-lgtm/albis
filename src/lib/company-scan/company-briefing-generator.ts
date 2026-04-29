// ---------------------------------------------------------------------------
// Package 8D — Company Briefing Generator.
//
// Layer 5 of the Package 8 funnel: turns a CompanyBriefingEvidencePacket into
// a structured CompanyBriefingGenerationOutput.
//
// v1 architecture:
//   - generation_route = 'internal_openclaw_cron'
//   - public_pipeline_compatible = true
//   - separate_openai_api_required = false
//
// This module provides:
//   1. A clean adapter interface compatible with the existing internal
//      OpenClaw/cron flow.
//   2. A deterministic packet-to-briefing dry-run generator for tests and
//      development, clearly marked as v1 local/dry-run fallback.
//
// When actual OpenClaw generation becomes available for company briefings,
// the adapter boundary stays the same — only the internal implementation
// changes from deterministic to LLM-generated.
//
// The generator:
//   - Writes only from email_items and allowed section_no_findings.
//   - Preserves attribution, qualifiers, uncertainty, and conflicts.
//   - Returns structured output with claim maps.
//   - Never promotes dashboard/excluded items.
//   - Never invents facts, causal links, or advice.
// ---------------------------------------------------------------------------

import type {
  CompanyBriefingEvidencePacket,
  CompanyBriefingGenerationOutput,
  CompanyBriefingGenerationMetadata,
  EvidenceEmailItem,
  EvidenceSupportRef,
  GeneratedText,
  GeneratedBriefingSection,
  GeneratedBriefingItem,
  GeneratedClaimMap,
  GeneratedTodayBrief,
  GeneratedMainBriefing,
  GeneratedPerceptionGap,
  GeneratedPerceptionGapNote,
  GeneratedUsefulObservations,
  GeneratedSourceNotes,
  GenerationTrace,
  SectionNoFinding,
} from "./types";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const GENERATOR_VERSION = "8d_deterministic_dryrun_v1";
export const PROMPT_TEMPLATE_VERSION = "company_briefing_v1";

export interface GenerateBriefingOptions {
  /** If true, use the deterministic local generator (always available). */
  dryRun?: boolean;
  /** Dashboard link URL for source notes footer. */
  dashboardLink?: string;
}

export interface GenerateBriefingResult {
  output: CompanyBriefingGenerationOutput;
  metadata: CompanyBriefingGenerationMetadata;
}

/**
 * Generate a company briefing from an evidence packet.
 *
 * v1 uses the deterministic local generator (packet-to-briefing).
 * The adapter boundary is designed so that when actual internal OpenClaw/cron
 * generation is available, only the implementation changes — the interface
 * and output schema stay the same.
 */
export function generateCompanyBriefing(
  packet: CompanyBriefingEvidencePacket,
  options: GenerateBriefingOptions = {},
): GenerateBriefingResult {
  const { dryRun = true, dashboardLink } = options;

  if (!dryRun) {
    throw new Error(
      "Live company briefing generation is not wired yet. Run with dryRun:true until the internal OpenClaw generation adapter is connected.",
    );
  }

  const output = deterministicGenerate(packet, dashboardLink);

  const metadata: CompanyBriefingGenerationMetadata = {
    packet_version: "company_briefing_evidence_v1",
    generator_version: GENERATOR_VERSION,
    prompt_template_version: PROMPT_TEMPLATE_VERSION,
    cluster_ids: packet.email_items.map((i) => i.cluster_id),
    source_ids: packet.source_registry_refs,
    generated_sections: output.main_briefing.sections.map((s) => s.section_id),
    generation_route: "internal_openclaw_cron",
    dry_run: dryRun,
    generated_at: output.generated_at,
  };

  return { output, metadata };
}

// ---------------------------------------------------------------------------
// Deterministic (dry-run) generator
//
// This produces a structured briefing directly from the evidence packet
// without calling any external LLM. It is useful for:
//   - Testing the full pipeline end-to-end
//   - Validating output schema
//   - Generating debug artifacts
//   - Running QA gates against a known output
//
// The output follows all the same constraints as an LLM-generated briefing:
//   - Only uses email_items data
//   - Preserves uncertainty and attribution
//   - Never invents facts
//   - Returns claim maps
// ---------------------------------------------------------------------------

function deterministicGenerate(
  packet: CompanyBriefingEvidencePacket,
  dashboardLink?: string,
): CompanyBriefingGenerationOutput {
  const now = new Date().toISOString();
  const items = packet.email_items;

  // --- Today's Brief ---
  const todayBrief = generateTodayBrief(packet);

  // --- Main Briefing ---
  const mainBriefing = generateMainBriefing(packet);

  // --- Perception Gap ---
  const perceptionGap = generatePerceptionGap(items);

  // --- Useful Observations ---
  const usefulObservations = generateUsefulObservations(packet);

  // --- Source Notes ---
  const sourceNotes = generateSourceNotes(packet, dashboardLink);

  // --- Trace ---
  const trace: GenerationTrace = {
    generator_route: "internal_openclaw_cron",
    generator_version: GENERATOR_VERSION,
    prompt_template_version: PROMPT_TEMPLATE_VERSION,
    packet_item_ids_used: items.map((i) => i.item_id),
    packet_item_ids_omitted: [],
    dashboard_items_used_in_email: [],
    excluded_items_used_in_email: [],
  };

  return {
    output_version: "company_briefing_generation_v1",
    run_id: packet.run_id,
    company_id: packet.company.company_id,
    generated_at: now,
    source_packet_version: "company_briefing_evidence_v1",
    today_brief: todayBrief,
    main_briefing: mainBriefing,
    perception_gap: perceptionGap,
    useful_observations: usefulObservations,
    source_notes: sourceNotes,
    trace,
  };
}

// ---------------------------------------------------------------------------
// Today's Brief
// ---------------------------------------------------------------------------

function generateTodayBrief(packet: CompanyBriefingEvidencePacket): GeneratedTodayBrief {
  const items = packet.email_items;
  const company = packet.company.display_name;

  if (items.length === 0) {
    return {
      top_line: {
        text: `The scan ran today across ${company}'s selected areas, but did not find a separate direct item clear enough for the main email.`,
        supported_by: [],
      },
      bullets: [
        {
          text: "The scan ran normally. Dashboard may have lower-priority items worth reviewing.",
          supported_by: [],
        },
      ],
    };
  }

  // Top line: summarize the most relevant item
  const top = items[0];
  const areaLabels = packet.company.selected_scan_areas
    .filter((a) => top.section_ids.includes(a.area_id))
    .map((a) => a.label);
  const areaText = areaLabels.length > 0 ? areaLabels.join(" and ") : "selected scan areas";

  const topLine: GeneratedText = {
    text: `Today’s main item for ${company}: ${top.canonical_event_name}. It sits under ${areaText}.`,
    supported_by: [
      { type: "claim_id", id: top.facts[0]?.claim_id ?? top.item_id },
      ...top.section_ids.map((id) => ({ type: "scan_area" as const, id })),
    ],
  };

  // Bullets: up to 3 items
  const bullets: GeneratedText[] = items.slice(0, 3).map((item) => ({
    text: item.canonical_event_name + "." +
      (item.item_status === "proposed" ? " (Proposal stage.)" : "") +
      (item.item_status === "developing" ? " (Developing.)" : ""),
    supported_by: [{ type: "claim_id", id: item.facts[0]?.claim_id ?? item.item_id }],
  }));

  return { top_line: topLine, bullets };
}

// ---------------------------------------------------------------------------
// Main Briefing — grouped by scan area
// ---------------------------------------------------------------------------

function generateMainBriefing(packet: CompanyBriefingEvidencePacket): GeneratedMainBriefing {
  const items = packet.email_items;
  const areas = packet.company.selected_scan_areas;
  const noFindings = packet.section_no_findings;

  // Group items by section
  const sectionMap = new Map<string, EvidenceEmailItem[]>();
  for (const item of items) {
    for (const sectionId of item.section_ids) {
      const existing = sectionMap.get(sectionId) ?? [];
      existing.push(item);
      sectionMap.set(sectionId, existing);
    }
  }

  // Dedupe: each item appears once, under its first section
  const usedItems = new Set<string>();
  const sections: GeneratedBriefingSection[] = [];

  for (const area of areas) {
    const sectionItems = sectionMap.get(area.area_id) ?? [];
    const uniqueItems = sectionItems.filter((i) => {
      if (usedItems.has(i.item_id)) return false;
      usedItems.add(i.item_id);
      return true;
    });

    if (uniqueItems.length === 0) {
      // Check no-findings
      const nf = noFindings.find((n) => n.section_id === area.area_id);
      if (nf && nf.email_line_allowed && nf.suggested_email_line) {
        sections.push({
          section_id: area.area_id,
          heading: area.label,
          items: [],
          no_material_signal_line: {
            text: nf.suggested_email_line,
            supported_by: [],
          },
        });
      }
      // Otherwise: omit empty section (no forced empty sections)
      continue;
    }

    sections.push({
      section_id: area.area_id,
      heading: area.label,
      items: uniqueItems.map((item) => generateBriefingItem(item, packet)),
    });
  }

  // Handle items not assigned to any area section
  const unassigned = items.filter((i) => !usedItems.has(i.item_id));
  if (unassigned.length > 0) {
    sections.push({
      section_id: "other",
      heading: "Other Relevant Signals",
      items: unassigned.map((item) => generateBriefingItem(item, packet)),
    });
  }

  return { sections };
}

function generateBriefingItem(
  item: EvidenceEmailItem,
  packet: CompanyBriefingEvidencePacket,
): GeneratedBriefingItem {
  const bodyParts: string[] = [];
  const bodyRefs: EvidenceSupportRef[] = [];
  const claimMap: GeneratedClaimMap[] = [];

  // Build body from facts
  for (let i = 0; i < item.facts.length && i < 3; i++) {
    const fact = item.facts[i];
    let text = fact.text;
    if (fact.required_qualifier) {
      // Ensure qualifier language is present
      const lower = text.toLowerCase();
      if (!lower.includes(fact.required_qualifier.toLowerCase())) {
        text = `${capitalize(fact.required_qualifier)}: ${text}`;
      }
    }
    bodyParts.push(text);
    bodyRefs.push({ type: "claim_id", id: fact.claim_id });

    claimMap.push({
      generated_text_path: `body sentence ${i + 1}`,
      text,
      claim_ids: [fact.claim_id],
      support_refs: fact.supported_by.map((s) => ({
        type: "source_id" as const,
        id: s.source_id,
      })),
    });
  }

  const bodyText = bodyParts.join(" ");

  // Why it matters
  const whyItMatters: GeneratedText | undefined = item.why_it_matters?.text
    ? {
        text: item.why_it_matters.text,
        supported_by: item.why_it_matters.supported_by,
      }
    : undefined;

  // Uncertainty
  const mustMentionUncertainty = item.uncertainty.filter((u) => u.must_mention);
  const uncertaintyLine: GeneratedText | undefined =
    mustMentionUncertainty.length > 0
      ? {
          text: mustMentionUncertainty.map((u) => u.text).join(" "),
          supported_by: mustMentionUncertainty.flatMap((u) =>
            u.applies_to_claim_ids.map((id) => ({ type: "claim_id" as const, id })),
          ),
        }
      : undefined;

  // Perception gap note
  const pgNote: GeneratedText | undefined =
    item.perception_gap?.eligible && item.perception_gap.show_recommendation === "show" && item.perception_gap.suggested_note
      ? {
          text: item.perception_gap.suggested_note.text,
          supported_by: item.perception_gap.suggested_note.supported_by,
        }
      : undefined;

  // Source attribution (compact)
  const sourceNames = [
    item.source_summary.anchor.source_display_name,
    ...item.source_summary.supporting.slice(0, 2).map((s) => s.source_display_name),
  ];
  const uniqueSources = [...new Set(sourceNames)];
  const sourceAttribution: GeneratedText = {
    text: `Sources: ${uniqueSources.join("; ")}.`,
    supported_by: [
      { type: "source_id", id: item.source_summary.anchor.source_id },
      ...item.source_summary.supporting.map((s) => ({ type: "source_id" as const, id: s.source_id })),
    ],
  };

  return {
    generated_item_id: `gen_${item.item_id}`,
    packet_item_id: item.item_id,
    cluster_id: item.cluster_id,
    title: {
      text: item.canonical_event_name,
      supported_by: [{ type: "claim_id", id: item.facts[0]?.claim_id ?? item.item_id }],
    },
    body: {
      text: bodyText,
      supported_by: bodyRefs,
    },
    why_it_matters: whyItMatters,
    uncertainty_line: uncertaintyLine,
    perception_gap_note: pgNote,
    source_attribution: sourceAttribution,
    claim_map: claimMap,
  };
}

// ---------------------------------------------------------------------------
// Perception Gap section
// ---------------------------------------------------------------------------

function generatePerceptionGap(items: EvidenceEmailItem[]): GeneratedPerceptionGap {
  const notes: GeneratedPerceptionGapNote[] = [];

  for (const item of items) {
    if (
      item.perception_gap?.eligible &&
      item.perception_gap.show_recommendation === "show" &&
      item.perception_gap.suggested_note
    ) {
      notes.push({
        packet_item_id: item.item_id,
        cluster_id: item.cluster_id,
        note: {
          text: item.perception_gap.suggested_note.text,
          supported_by: item.perception_gap.suggested_note.supported_by,
        },
        frame_ids: item.perception_gap.frame_ids,
      });
    }
  }

  return { notes };
}

// ---------------------------------------------------------------------------
// Useful Observations
// ---------------------------------------------------------------------------

function generateUsefulObservations(
  packet: CompanyBriefingEvidencePacket,
): GeneratedUsefulObservations {
  const observations: GeneratedText[] = [];
  const items = packet.email_items;

  if (items.length === 0) {
    observations.push({
      text: "The scan ran normally today. The dashboard may contain background context if you want the full trail.",
      supported_by: [],
    });
    return { observations };
  }

  // Observation 1: dominant theme
  const sectionCounts = new Map<string, number>();
  for (const item of items) {
    for (const sid of item.section_ids) {
      sectionCounts.set(sid, (sectionCounts.get(sid) ?? 0) + 1);
    }
  }
  const topSection = [...sectionCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topSection) {
    const areaLabel = packet.company.selected_scan_areas.find((a) => a.area_id === topSection[0])?.label ?? topSection[0];
    observations.push({
      text: `${areaLabel} has the most activity today with ${topSection[1]} item${topSection[1] > 1 ? "s" : ""}.`,
      supported_by: [{ type: "scan_area", id: topSection[0] }],
    });
  }

  // Observation 2: uncertainty/developing items
  const developingItems = items.filter((i) => i.item_status === "developing" || i.item_status === "proposed");
  if (developingItems.length > 0) {
    observations.push({
      text: `${developingItems.length} item${developingItems.length > 1 ? "s are" : " is"} still developing or at proposal stage. Read ${developingItems.length > 1 ? "them" : "it"} as early signal${developingItems.length > 1 ? "s" : ""}, not final fact${developingItems.length > 1 ? "s" : ""}.`,
      supported_by: developingItems.map((i) => ({ type: "claim_id" as const, id: i.facts[0]?.claim_id ?? i.item_id })),
    });
  }

  // Observation 3: perception gap available
  const pgItems = items.filter((i) => i.perception_gap?.eligible && i.perception_gap.show_recommendation === "show");
  if (pgItems.length > 0) {
    observations.push({
      text: `Regional framing differs on ${pgItems.length} item${pgItems.length > 1 ? "s" : ""}. The Perception Gap note shows the source-backed difference.`,
      supported_by: pgItems.flatMap((i) => (i.perception_gap?.frame_ids ?? []).map((id) => ({ type: "frame_id" as const, id }))),
    });
  }

  // Observation 4: dashboard overflow
  if (packet.dashboard_only_items.length > 0) {
    observations.push({
      text: `${packet.dashboard_only_items.length} additional context item${packet.dashboard_only_items.length > 1 ? "s are" : " is"} available on the dashboard source trail.`,
      supported_by: [],
    });
  }

  return { observations: observations.slice(0, 4) };
}

// ---------------------------------------------------------------------------
// Source Notes
// ---------------------------------------------------------------------------

function generateSourceNotes(
  packet: CompanyBriefingEvidencePacket,
  dashboardLink?: string,
): GeneratedSourceNotes {
  const areasWithItems = new Set<string>();
  for (const item of packet.email_items) {
    for (const sid of item.section_ids) {
      areasWithItems.add(sid);
    }
  }
  const areaLabels = packet.company.selected_scan_areas
    .filter((a) => areasWithItems.has(a.area_id))
    .map((a) => a.label);

  const total = packet.input_summary.raw_articles_count || packet.input_summary.normalized_articles_count || 0;

  return {
    text: {
      text: `Built from ${total > 0 ? total : "scanned"} items across ${areaLabels.join(", ") || "selected scan areas"}. Full source list and lower-priority items are on the dashboard.`,
      supported_by: [],
    },
    scanned_count: total,
    scan_areas_covered: areaLabels,
    dashboard_link: dashboardLink,
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
