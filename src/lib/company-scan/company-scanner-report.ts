// ---------------------------------------------------------------------------
// Package 10C — Company scanner report layout.
//
// This replaces the over-compressed "mini briefing" presentation with a fuller
// scanner-style report: simple overview, many main findings grouped by the
// areas the company asked Albis to watch, top daily deeper reads, and a short
// "also seen" trail. No external calls and no side effects.
// ---------------------------------------------------------------------------

import type {
  CompanyBriefingEvidencePacket,
  CompanyBriefingGenerationOutput,
  EvidenceConfidenceLabel,
  EvidenceSupportRef,
  GeneratedBriefingItem,
  GeneratedBriefingSection,
  GeneratedClaimMap,
  GeneratedText,
  Signal,
} from "./types";
import type { IntelligenceDepthBundle, SelectedSignalForDepth } from "./intelligence-depth";

const INTERNAL_PHRASES: Array<[RegExp, string]> = [
  [/\bThe datapoint was useful because\b/gi, "The important point is"],
  [/\bRoute access and route confidence can move at different speeds\b/gi, "A route can be open while shipping conditions remain unsettled"],
  [/\bThe comparison is whether\b/gi, "The useful test is whether"],
  [/\bThe relevance is\b/gi, "This matters because"],
  [/\bThe useful distinction is\b/gi, "The practical difference is"],
  [/\bshowed up in coverage\b/gi, "appeared in the scan"],
  [/\bcompany-specific scan\b/gi, "scan"],
  [/\bregistered against\b/gi, "matched"],
];

function uniq<T>(values: T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}

function cleanText(value: unknown): string {
  let text = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([.!?])\.+/g, "$1")
    .trim();
  for (const [pattern, replacement] of INTERNAL_PHRASES) text = text.replace(pattern, replacement);
  text = text
    .replace(/\b(businesses|companies|operators|executives|stakeholders|leaders)\s+need\s+to\s+keep\s+up\b/gi, "$1 are responding differently")
    .replace(/\b(businesses|companies|operators|executives|stakeholders|leaders)\s+(should|must|need to|have to)\b/gi, "$1 may")
    .replace(/\bwatchlist entities\b/gi, "named entities")
    .replace(/\bwatchlist\b/gi, "tracked list");
  return text.replace(/\s+/g, " ").trim();
}

function trimWords(value: string, maxWords: number): string {
  const words = cleanText(value).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function sentence(value: string): string {
  const text = cleanText(value).replace(/[.!?]+$/g, "");
  return text ? `${text}.` : "";
}

function sourceName(domain: string | null | undefined): string {
  return String(domain || "selected source").replace(/^www\./, "");
}

function confidenceForSignal(signal: Signal): EvidenceConfidenceLabel {
  const source = sourceName(signal.source_domain);
  return {
    kind: "reported_claim",
    label: "Reported finding",
    customer_phrase: `Reported by ${source}`,
    confidence: "medium",
    reason: "Finding is based on a selected source from the company scan.",
    source_count: 1,
    source_quality: "B",
  };
}

function sectionMap(packet: CompanyBriefingEvidencePacket): Map<string, string> {
  return new Map(packet.company.selected_scan_areas.map((area) => [area.area_id, area.label]));
}

function labelForSection(packet: CompanyBriefingEvidencePacket, sectionId: string | undefined): string {
  if (!sectionId) return "Other relevant signals";
  const raw = sectionMap(packet).get(sectionId) || sectionId.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  return cleanText(raw).replace(/Named Entities/i, "Named entities");
}

function supportRefsForSelected(selected: SelectedSignalForDepth): EvidenceSupportRef[] {
  return [
    { type: "claim_id", id: `claim_art_${selected.signal.id}_headline` },
    { type: "claim_id", id: `claim_art_${selected.signal.id}_summary` },
    { type: "source_id", id: `domain:${sourceName(selected.signal.source_domain)}` },
  ];
}

function claimMapForItem(itemId: string, text: string, refs: EvidenceSupportRef[]): GeneratedClaimMap[] {
  const claimIds = refs.filter((ref) => ref.type === "claim_id").map((ref) => ref.id);
  const pieces = text.split(/(?<=[.!?])\s+/).map(cleanText).filter(Boolean).slice(0, 4);
  return pieces.map((piece, index) => ({
    generated_text_path: `scanner_report.main_findings.${itemId}.sentence_${index + 1}`,
    text: piece,
    claim_ids: claimIds,
    support_refs: refs,
  }));
}

function inferFindingWhy(sectionLabel: string, signal: Signal, companyName: string): string {
  const text = `${signal.headline} ${signal.summary} ${(signal.themes || []).join(" ")}`.toLowerCase();
  if (/hormuz|suez|red sea|port|shipping|freight|vessel|container|route|corridor/.test(text)) {
    return `For ${companyName}, this is useful because it can affect route planning, timing, freight costs, insurance, or port decisions.`;
  }
  if (/deepfake|artificial intelligence|\bai\b|citation|identity|records?|archive|misinformation|disinformation/.test(text)) {
    return `For ${companyName}, this is useful because it affects trust in records, identity, evidence, and what people may rely on later.`;
  }
  if (/media|press|journalis|censor|sanction|propaganda|state media|narrative|platform/.test(text)) {
    return `For ${companyName}, this is useful because it can shape what audiences see, trust, repeat, or are allowed to publish.`;
  }
  return `For ${companyName}, this belongs under ${sectionLabel} and is worth keeping in view if the pattern repeats.`;
}

function findingBody(packet: CompanyBriefingEvidencePacket, selected: SelectedSignalForDepth): string {
  const signal = selected.signal;
  const sectionLabel = labelForSection(packet, selected.section_ids[0]);
  const summary = cleanText(signal.summary || "");
  const headline = cleanText(signal.headline || "Relevant finding");
  const whatHappened = summary && summary.toLowerCase() !== headline.toLowerCase()
    ? `${sentence(headline)} ${sentence(trimWords(summary, 38))}`
    : sentence(headline);
  const why = inferFindingWhy(sectionLabel, signal, packet.company.display_name);
  const source = sourceName(signal.source_domain);
  const regions = (signal.regions || []).slice(0, 3).join(", ");
  const context = regions ? `Region noted: ${regions}.` : "";
  return cleanText(`${whatHappened} ${why} Source: ${source}. ${context}`);
}

function titleForSignal(signal: Signal): string {
  return trimWords(cleanText(signal.headline).replace(/\s+\|\s+[^|]+$/g, "").replace(/\s+-\s+[^-]{2,40}$/g, ""), 16);
}

function dedupeKeys(selected: SelectedSignalForDepth): string[] {
  const signal = selected.signal;
  const url = String(signal.source_url || "").replace(/[?#].*$/g, "").toLowerCase();
  const title = titleForSignal(signal).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return [url && `url:${url}`, title && `title:${title}`].filter(Boolean) as string[];
}

function dedupeSelected(selected: SelectedSignalForDepth[]): SelectedSignalForDepth[] {
  const seen = new Set<string>();
  const out: SelectedSignalForDepth[] = [];
  for (const item of selected) {
    const keys = dedupeKeys(item);
    if (keys.some((key) => seen.has(key))) continue;
    keys.forEach((key) => seen.add(key));
    out.push(item);
  }
  return out;
}

function titleForFinding(packet: CompanyBriefingEvidencePacket, selected: SelectedSignalForDepth): string {
  const label = labelForSection(packet, selected.section_ids[0]);
  const title = titleForSignal(selected.signal);
  return trimWords(`${label}: ${title}`, 18);
}

function buildFindingItem(packet: CompanyBriefingEvidencePacket, selected: SelectedSignalForDepth): GeneratedBriefingItem {
  const refs = supportRefsForSelected(selected);
  const bodyText = findingBody(packet, selected);
  const confidence = confidenceForSignal(selected.signal);
  const packetItem = packet.email_items.find((item) => item.item_id === selected.item_id);
  const uncertaintyText = packetItem?.uncertainty?.[0]?.text;
  return {
    generated_item_id: `pkg10c_finding_${selected.signal.id}`,
    packet_item_id: selected.item_id,
    cluster_id: selected.cluster_id,
    title: { text: titleForFinding(packet, selected), supported_by: refs, evidence_confidence: confidence },
    body: { text: bodyText, supported_by: refs, evidence_confidence: confidence },
    uncertainty_line: uncertaintyText ? { text: cleanText(uncertaintyText), supported_by: refs, evidence_confidence: confidence } : undefined,
    source_attribution: { text: `Source: ${sourceName(selected.signal.source_domain)}.`, supported_by: refs, evidence_confidence: confidence },
    claim_map: claimMapForItem(selected.item_id, bodyText, refs),
  };
}

function buildDeeperReadFromBundle(bundle: IntelligenceDepthBundle): GeneratedBriefingItem {
  const refs = bundle.claim_ids.length ? bundle.claim_ids.map((id) => ({ type: "claim_id", id } as EvidenceSupportRef)) : bundle.source_refs;
  const confidence = bundle.evidence_confidence;
  const sourceLine = bundle.source_names.length ? `Sources in this read: ${bundle.source_names.slice(0, 4).join(", ")}.` : "Based on selected scan evidence.";
  const body = cleanText(`${sentence(bundle.what_happened[0]?.text || bundle.heading)} ${sentence(bundle.what_is_changing[0]?.text || "")} ${sourceLine}`);
  return {
    generated_item_id: `pkg10c_deeper_${bundle.bundle_id}`,
    packet_item_id: bundle.anchor_item_id,
    cluster_id: bundle.anchor_cluster_id,
    title: { text: bundle.heading, supported_by: refs, evidence_confidence: confidence },
    body: { text: body, supported_by: refs, evidence_confidence: confidence },
    source_attribution: { text: sourceLine, supported_by: refs, evidence_confidence: confidence },
    claim_map: claimMapForItem(bundle.anchor_item_id, body, refs),
  };
}

function buildOverview(packet: CompanyBriefingEvidencePacket, selected: SelectedSignalForDepth[]): GeneratedText {
  const sectionLabels = uniq(selected.map((item) => labelForSection(packet, item.section_ids[0]))).slice(0, 5);
  const sourceCount = uniq(selected.map((item) => sourceName(item.signal.source_domain))).length;
  const text = selected.length
    ? `Albis scanned ${packet.input_summary.raw_articles_count} items for ${packet.company.display_name} and found ${selected.length} useful finding${selected.length === 1 ? "" : "s"} across ${sectionLabels.length} watched area${sectionLabels.length === 1 ? "" : "s"}. The most active areas were ${sectionLabels.join(", ")}. Selected evidence came from ${sourceCount} source${sourceCount === 1 ? "" : "s"}.`
    : `Albis scanned ${packet.input_summary.raw_articles_count} items for ${packet.company.display_name}. No clean material findings were strong enough for the main report today.`;
  const refs = selected.flatMap(supportRefsForSelected).slice(0, 12);
  return { text, supported_by: refs };
}

function buildAlsoSeen(packet: CompanyBriefingEvidencePacket, selected: SelectedSignalForDepth[]): GeneratedText[] {
  return selected.slice(12, 24).map((item) => {
    const refs = supportRefsForSelected(item);
    return {
      text: `${titleForSignal(item.signal)} — ${labelForSection(packet, item.section_ids[0])}. Source: ${sourceName(item.signal.source_domain)}.`,
      supported_by: refs,
      evidence_confidence: confidenceForSignal(item.signal),
    };
  });
}

export function applyScannerReportLayout(input: {
  output: CompanyBriefingGenerationOutput;
  packet: CompanyBriefingEvidencePacket;
  selected: SelectedSignalForDepth[];
  bundles: IntelligenceDepthBundle[];
}): CompanyBriefingGenerationOutput {
  const { output, packet, selected, bundles } = input;
  if (selected.length === 0) return output;
  const selectedForReport = dedupeSelected(selected);

  const groups = new Map<string, GeneratedBriefingSection>();
  for (const item of selectedForReport) {
    const sectionId = item.section_ids[0] || "other";
    const section = groups.get(sectionId) || {
      section_id: sectionId,
      heading: labelForSection(packet, sectionId),
      items: [],
    };
    section.items.push(buildFindingItem(packet, item));
    groups.set(sectionId, section);
  }

  const sections = [...groups.values()].sort((a, b) => b.items.length - a.items.length || a.heading.localeCompare(b.heading));
  const overview = buildOverview(packet, selectedForReport);
  const deeperReads = bundles.slice(0, 3).map((bundle) => buildDeeperReadFromBundle(bundle));
  const alsoSeen = buildAlsoSeen(packet, selectedForReport);
  const topRefs = selectedForReport.slice(0, 6).flatMap(supportRefsForSelected).slice(0, 16);

  return {
    ...output,
    today_brief: {
      top_line: overview,
      bullets: sections.slice(0, 5).map((section) => ({
        text: `${section.heading}: ${section.items.length} finding${section.items.length === 1 ? "" : "s"}.`,
        supported_by: section.items.flatMap((item) => item.body.supported_by).slice(0, 8),
      })),
    },
    main_briefing: { sections },
    scanner_report: {
      enabled: true,
      layout_version: "package10c_scanner_report_v1",
      overview,
      main_findings_count: selectedForReport.length,
      scan_area_count: sections.length,
      deeper_reads: deeperReads,
      also_seen: alsoSeen,
    },
    useful_observations: {
      observations: bundles.slice(0, 3).map((bundle) => ({
        text: cleanText(bundle.analyst_observation.body),
        supported_by: bundle.claim_ids.map((id) => ({ type: "claim_id", id })),
        evidence_confidence: bundle.evidence_confidence,
      })),
    },
    source_notes: {
      ...output.source_notes,
      text: {
        text: `Built from ${packet.input_summary.raw_articles_count} scanned items. This report shows the main findings in the email and keeps the full evidence trail, source notes, and lower-priority material in the dashboard.`,
        supported_by: topRefs,
      },
      scanned_count: packet.input_summary.raw_articles_count,
      scan_areas_covered: sections.map((section) => section.heading),
    },
    trace: {
      ...output.trace,
      generator_version: `${output.trace.generator_version}+package10c_scanner_report_v1`,
    },
  };
}
