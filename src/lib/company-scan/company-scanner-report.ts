// ---------------------------------------------------------------------------
// Package 10E — Weighted company scan-area intelligence report.
//
// Albis is a scanner first. This layout makes every requested scan area visible,
// keeps generic industry explanation out of customer copy, writes fact-rich
// findings from evidence, gives three cross-area deeper reads, and keeps the
// full source trail in the dashboard. No external calls and no side effects.
// ---------------------------------------------------------------------------

import type {
  CompanyBriefingEvidencePacket,
  EvidenceConfidenceLabel,
  EvidenceEmailItem,
  EvidenceSupportRef,
  GeneratedBriefingItem,
  GeneratedBriefingSection,
  GeneratedClaimMap,
  GeneratedScannerReportArea,
  GeneratedText,
  CompanyBriefingGenerationOutput,
  Signal,
} from "./types";
import type { IntelligenceDepthBundle, SelectedSignalForDepth } from "./intelligence-depth";

const INTERNAL_PHRASES: Array<[RegExp, string]> = [
  [/\bThe datapoint was useful because\b/gi, "The useful point is"],
  [/\bRoute access and route confidence can move at different speeds\b/gi, "A route can reopen before the market trusts it again"],
  [/\bThe comparison is whether\b/gi, "The useful test is whether"],
  [/\bThe relevance is\b/gi, "This matters because"],
  [/\bThe useful distinction is\b/gi, "The practical difference is"],
  [/\bshowed up in coverage\b/gi, "appeared in the scan"],
  [/\bcompany-specific scan\b/gi, "scan"],
  [/\bregistered against\b/gi, "matched"],
];

const FACT_KEYWORDS = /\b(\d+(?:[,.]\d+)?\s?(?:%|percent|bn|m|million|billion|tonnes?|vessels?|ships?|sailors?|days?|weeks?|months?|hours?|barrels?|teu|containers?|kilometres?|miles?)|tender|export|imports?|restriction|sanction|tariff|quota|price|rate|insurance|port calls?|traffic|transits?|capacity|shipment|corridor|blockade|delay|shortage|halt|reopen|closed?|plunged|fell|rose|surged|opened|announced|reported|officials?)/i;

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
    .replace(/\bleverage\b/gi, "influence")
    .replace(/\bguarantees\b/gi, "assurances")
    .replace(/&amp;/gi, "and")
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

function confidenceForSignal(signal: Signal, sourceCount = 1): EvidenceConfidenceLabel {
  const source = sourceName(signal.source_domain);
  return {
    kind: sourceCount > 1 ? "multi_source_signal" : "reported_claim",
    label: sourceCount > 1 ? "Multi-source finding" : "Reported finding",
    customer_phrase: sourceCount > 1 ? `Supported by ${sourceCount} sources` : `Reported by ${source}`,
    confidence: sourceCount > 1 ? "high" : "medium",
    reason: "Finding is based on evidence selected from the company scan.",
    source_count: sourceCount,
    source_quality: "B",
  };
}

function labelForSection(packet: CompanyBriefingEvidencePacket, sectionId: string | undefined): string {
  if (!sectionId) return "Other relevant signals";
  const match = packet.company.selected_scan_areas.find((area) => area.area_id === sectionId);
  const raw = match?.label || sectionId.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  return cleanText(raw).replace(/Named Entities/i, "Named entities");
}

function supportRefsForSelected(selected: SelectedSignalForDepth): EvidenceSupportRef[] {
  return [
    { type: "claim_id", id: `claim_art_${selected.signal.id}_headline` },
    { type: "claim_id", id: `claim_art_${selected.signal.id}_summary` },
    { type: "source_id", id: `domain:${sourceName(selected.signal.source_domain)}` },
  ];
}

function supportRefsForPacketItem(item: EvidenceEmailItem | undefined, fallback: EvidenceSupportRef[]): EvidenceSupportRef[] {
  const refs: EvidenceSupportRef[] = item?.facts.flatMap((fact) => [
    { type: "claim_id" as const, id: fact.claim_id },
    ...fact.supported_by.map((support) => ({ type: "source_id" as const, id: support.source_id })),
  ]) || [];
  return refs.length ? uniq([...refs, ...fallback]) : fallback;
}

function claimMapForItem(itemId: string, text: string, refs: EvidenceSupportRef[]): GeneratedClaimMap[] {
  const claimIds = refs.filter((ref) => ref.type === "claim_id").map((ref) => ref.id);
  const pieces = text.split(/(?<=[.!?])\s+/).map(cleanText).filter(Boolean).slice(0, 6);
  return pieces.map((piece, index) => ({
    generated_text_path: `scanner_report.scan_areas.${itemId}.sentence_${index + 1}`,
    text: piece,
    claim_ids: claimIds,
    support_refs: refs,
  }));
}

function titleForSignal(signal: Signal): string {
  return trimWords(cleanText(signal.headline).replace(/\s+\|\s+[^|]+$/g, "").replace(/\s+-\s+[^-]{2,40}$/g, ""), 17);
}

function dedupeKeys(selected: SelectedSignalForDepth): string[] {
  const signal = selected.signal;
  const url = String(signal.source_url || "").replace(/[?#].*$/g, "").toLowerCase();
  const title = titleForSignal(signal).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return [selected.cluster_id && `cluster:${selected.cluster_id}`, url && `url:${url}`, title && `title:${title}`].filter(Boolean) as string[];
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

function findingPriority(selected: SelectedSignalForDepth): number {
  const signalText = cleanText(`${selected.signal.headline} ${selected.signal.summary}`);
  const concreteFactBonus = FACT_KEYWORDS.test(signalText) ? 25 : 0;
  const sourceBonus = selected.signal.source_domain ? 5 : 0;
  return selected.selection_score * 10 + selected.keyword_match_score + concreteFactBonus + sourceBonus;
}

function sortFindingsByPriority(selected: SelectedSignalForDepth[]): SelectedSignalForDepth[] {
  return [...selected].sort((a, b) => findingPriority(b) - findingPriority(a));
}

function itemMap(packet: CompanyBriefingEvidencePacket): Map<string, EvidenceEmailItem> {
  return new Map(packet.email_items.map((item) => [item.item_id, item]));
}

function isNearDuplicate(a: string, b: string): boolean {
  const left = cleanText(a).toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const right = cleanText(b).toLowerCase().replace(/[^a-z0-9\s]/g, "");
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  const leftWords = new Set(left.split(/\s+/).filter((word) => word.length > 3));
  const rightWords = right.split(/\s+/).filter((word) => word.length > 3);
  if (leftWords.size === 0 || rightWords.length === 0) return false;
  const overlap = rightWords.filter((word) => leftWords.has(word)).length;
  return overlap / Math.max(rightWords.length, 1) >= 0.72;
}

function simplifyFactText(value: string): string {
  const text = cleanText(value);
  if (/first\s+liquefied\s+natural\s+gas\s+shipment/i.test(text) && /Strait\s+of\s+Hormuz|Persian\s+Gulf/i.test(text)) {
    return "A reported LNG cargo appears to have exited the Persian Gulf through Hormuz";
  }
  if (/vessel\s+crossings\s+rebound/i.test(text) && /oil\s+and\s+gas\s+flows/i.test(text)) {
    return "Vessel crossings rebounded, but oil and gas flows had not yet returned at the same pace";
  }
  return text;
}

function extractUsefulFacts(packetItem: EvidenceEmailItem | undefined, signal: Signal): string[] {
  const headline = titleForSignal(signal);
  const rawHeadline = cleanText(signal.headline || "");
  const factTexts = (packetItem?.facts || [])
    .map((fact) => cleanText(fact.text))
    .filter(Boolean);
  const summarySentences = cleanText(signal.summary || "")
    .split(/(?<=[.!?])\s+/)
    .map(cleanText)
    .filter(Boolean);
  const candidates = [...factTexts, ...summarySentences]
    .map((text) => trimWords(simplifyFactText(text), 30))
    .filter((text) => text && !isNearDuplicate(headline, text) && !isNearDuplicate(rawHeadline, text));
  const deduped: string[] = [];
  for (const text of candidates) {
    if (deduped.some((existing) => isNearDuplicate(existing, text))) continue;
    deduped.push(text);
  }
  const withSpecifics = deduped.filter((text) => FACT_KEYWORDS.test(text));
  return (withSpecifics.length ? withSpecifics : deduped).slice(0, 2);
}

function sourceUrlLine(packetItem: EvidenceEmailItem | undefined, signal: Signal): string {
  const source = packetItem?.source_summary.anchor?.source_display_name || sourceName(signal.source_domain);
  return `Source trail: ${source}.`;
}

function usefulMeaning(sectionLabel: string, facts: string[], signal: Signal): string {
  const combined = `${facts.join(" ")} ${signal.headline} ${signal.summary}`.toLowerCase();
  if (/tender|urea|fertili[sz]er|ammonia|potash|phosphate/.test(combined)) {
    return "It belongs here because buying, export policy, or input costs can change fertiliser availability and pricing.";
  }
  if (/insurance|freight|rate|traffic|vessel|port call|shipping|hormuz|suez|red sea|corridor/.test(combined)) {
    return "It belongs here because practical route use can move differently from political access claims.";
  }
  if (/sanction|tariff|export|restriction|quota|policy|regulator/.test(combined)) {
    return "It belongs here because the policy constraint changes who can trade, ship, or finance the activity.";
  }
  if (/deepfake|ai|misinformation|disinformation|censor|press|media|journalis/.test(combined)) {
    return "It belongs here because it changes trust, publication, identity, or distribution conditions.";
  }
  return `It belongs in ${sectionLabel} because it adds a current fact to the scan, not background industry knowledge.`;
}

function findingBody(packet: CompanyBriefingEvidencePacket, selected: SelectedSignalForDepth, packetItem: EvidenceEmailItem | undefined): string {
  const signal = selected.signal;
  const sectionLabel = labelForSection(packet, selected.section_ids[0]);
  const headline = titleForSignal(signal);
  const rawHeadline = cleanText(signal.headline || "");
  const facts = extractUsefulFacts(packetItem, signal);
  const summary = cleanText(signal.summary || "");
  const fallbackFact = summary && !isNearDuplicate(headline, summary) && !isNearDuplicate(rawHeadline, summary)
    ? sentence(trimWords(summary, 28))
    : `A selected source reported a current ${sectionLabel} development.`;
  const factLine = facts.length ? facts.map(sentence).join(" ") : fallbackFact;
  const meaning = usefulMeaning(sectionLabel, facts, signal);
  const regions = (signal.regions || []).slice(0, 3).join(", ");
  const context = regions ? `Region noted: ${regions}.` : "";
  const opening = factLine ? `The scan picked up ${factLine.charAt(0).toLowerCase()}${factLine.slice(1)}` : `The scan picked up a current ${sectionLabel} development.`;
  return cleanText(`${opening} ${meaning} ${sourceUrlLine(packetItem, signal)} ${context}`);
}

function titleForFinding(packet: CompanyBriefingEvidencePacket, selected: SelectedSignalForDepth): string {
  const label = labelForSection(packet, selected.section_ids[0]);
  const title = titleForSignal(selected.signal);
  return trimWords(`${label}: ${title}`, 20);
}

function buildFindingItem(
  packet: CompanyBriefingEvidencePacket,
  selected: SelectedSignalForDepth,
  packetItems: Map<string, EvidenceEmailItem>,
): GeneratedBriefingItem {
  const packetItem = packetItems.get(selected.item_id);
  const fallbackRefs = supportRefsForSelected(selected);
  const refs = supportRefsForPacketItem(packetItem, fallbackRefs);
  const bodyText = findingBody(packet, selected, packetItem);
  const confidence = confidenceForSignal(selected.signal, refs.filter((ref) => ref.type === "source_id").length || 1);
  const uncertaintyText = packetItem?.uncertainty?.[0]?.text;
  return {
    generated_item_id: `pkg10e_finding_${selected.signal.id}`,
    packet_item_id: selected.item_id,
    cluster_id: selected.cluster_id,
    title: { text: titleForFinding(packet, selected), supported_by: refs, evidence_confidence: confidence },
    body: { text: bodyText, supported_by: refs, evidence_confidence: confidence },
    uncertainty_line: uncertaintyText ? { text: cleanText(uncertaintyText), supported_by: refs, evidence_confidence: confidence } : undefined,
    source_attribution: { text: sourceUrlLine(packetItem, selected.signal), supported_by: refs, evidence_confidence: confidence },
    claim_map: claimMapForItem(selected.item_id, bodyText, refs),
  };
}

type ScanAreaCoverageState = "active" | "no_direct_signal" | "related_signal_elsewhere" | "context_only_signal";

function coverageLineForArea(areaLabel: string, areaId: string, state: ScanAreaCoverageState, relatedLabels: string[] = []): string {
  const lower = `${areaLabel} ${areaId}`.toLowerCase();
  if (state === "related_signal_elsewhere") {
    return `${areaLabel} did not need a separate Main Findings item today; the related evidence is covered under ${relatedLabels.slice(0, 3).join(", ") || "another active scan area"}.`;
  }
  if (state === "context_only_signal") {
    return `${areaLabel} had background evidence today, but no separate direct item was clearer than the Main Findings already shown. The source trail keeps the context available.`;
  }
  if (/fertili[sz]er|urea|ammonia|potash|phosphate/.test(lower)) {
    return "Fertiliser was scanned today. The source trail did not contain a separate direct tender, export-policy, price, gas-input, or trade-flow item clear enough to add to Main Findings.";
  }
  if (/semiconductor|chip/.test(lower)) {
    return "Semiconductors were scanned today. The source trail did not contain a separate direct supply, tariff, export-control, capacity, or shipping item clear enough to add to Main Findings.";
  }
  return `${areaLabel} was scanned today. The source trail did not contain a separate direct item clear enough to add to Main Findings.`;
}

function buildScanAreaSummary(
  areaId: string,
  label: string,
  items: GeneratedBriefingItem[],
  selected: SelectedSignalForDepth[],
  state: ScanAreaCoverageState,
  relatedLabels: string[] = [],
): GeneratedText {
  if (items.length === 0) return { text: coverageLineForArea(label, areaId, state, relatedLabels), supported_by: [] };
  const sources = uniq(selected.map((item) => sourceName(item.signal.source_domain))).slice(0, 4);
  const factSignals = selected
    .map((item) => cleanText(`${item.signal.headline} ${item.signal.summary}`))
    .filter((text) => FACT_KEYWORDS.test(text)).length;
  const text = `${items.length} finding${items.length === 1 ? "" : "s"} appeared in Main Findings. ${factSignals} included concrete data, policy, route, rate, tender, traffic, or operational detail. Source trail includes ${sources.join(", ")}.`;
  return { text, supported_by: items.flatMap((item) => item.body.supported_by).slice(0, 12) };
}

function buildDeeperReadFromBundle(bundle: IntelligenceDepthBundle): GeneratedBriefingItem {
  const refs = bundle.claim_ids.length ? bundle.claim_ids.map((id) => ({ type: "claim_id", id } as EvidenceSupportRef)) : bundle.source_refs;
  const confidence = bundle.evidence_confidence;
  const sourceLine = bundle.source_names.length ? `Source trail includes ${bundle.source_names.slice(0, 4).join(", ")}.` : "Based on selected scan evidence.";
  const body = cleanText(`${sentence(bundle.what_happened[0]?.text || bundle.heading)} ${sentence(bundle.what_is_changing[0]?.text || "")} ${sentence(bundle.analyst_observation.body)} ${sourceLine}`);
  return {
    generated_item_id: `pkg10e_deeper_${bundle.bundle_id}`,
    packet_item_id: bundle.anchor_item_id,
    cluster_id: bundle.anchor_cluster_id,
    title: { text: bundle.heading, supported_by: refs, evidence_confidence: confidence },
    body: { text: body, supported_by: refs, evidence_confidence: confidence },
    source_attribution: { text: sourceLine, supported_by: refs, evidence_confidence: confidence },
    claim_map: claimMapForItem(bundle.anchor_item_id, body, refs),
  };
}

function buildOverview(
  packet: CompanyBriefingEvidencePacket,
  selected: SelectedSignalForDepth[],
  scanAreas: GeneratedScannerReportArea[],
): GeneratedText {
  const active = scanAreas.filter((area) => area.status === "active");
  const nonActive = scanAreas.filter((area) => area.status !== "active");
  const activeLabels = active.map((area) => area.label).slice(0, 8);
  const nonActiveLabels = nonActive.map((area) => area.label).slice(0, 6);
  const coverageLine = nonActive.length ? `Coverage notes for ${nonActiveLabels.join(", ")}${nonActive.length > nonActiveLabels.length ? ` and ${nonActive.length - nonActiveLabels.length} more` : ""} stay on the dashboard.` : "Every requested area produced a Main Findings item.";
  const text = selected.length
    ? `Albis scanned ${packet.company.selected_scan_areas.length} requested areas and ${packet.input_summary.raw_articles_count} items for ${packet.company.display_name}. ${active.length} areas produced concrete Main Findings: ${activeLabels.join(", ")}. ${coverageLine} The report shows selected source references and keeps the full source trail on the dashboard.`
    : `Albis scanned ${packet.company.selected_scan_areas.length} requested areas and ${packet.input_summary.raw_articles_count} items for ${packet.company.display_name}. The scan did not find a separate direct item clear enough for Main Findings today; selected source references and the full source trail remain available on the dashboard.`;
  const refs = selected.flatMap(supportRefsForSelected).slice(0, 12);
  return { text, supported_by: refs };
}

function scanAreaRefs(packet: CompanyBriefingEvidencePacket): EvidenceSupportRef[] {
  return packet.company.selected_scan_areas.map((area) => ({ type: "scan_area" as const, id: area.area_id }));
}

function primaryAreaId(packet: CompanyBriefingEvidencePacket, item: SelectedSignalForDepth): string | undefined {
  const allowed = new Set(packet.company.selected_scan_areas.map((area) => area.area_id));
  return item.section_ids.find((sectionId) => allowed.has(sectionId));
}

function buildScannerAreas(
  packet: CompanyBriefingEvidencePacket,
  sections: GeneratedBriefingSection[],
  selectedByArea: Map<string, SelectedSignalForDepth[]>,
  allSelectedByArea: Map<string, SelectedSignalForDepth[]>,
  weakPacketItemsByArea: Map<string, EvidenceEmailItem[]>,
): GeneratedScannerReportArea[] {
  const sectionMap = new Map(sections.map((section) => [section.section_id, section]));
  return packet.company.selected_scan_areas.map((area) => {
    const section = sectionMap.get(area.area_id);
    const selected = selectedByArea.get(area.area_id) || [];
    const related = (allSelectedByArea.get(area.area_id) || []).filter((item) => primaryAreaId(packet, item) !== area.area_id);
    const items = section?.items || [];
    const relatedAreaIds = uniq(related.map((item) => primaryAreaId(packet, item)).filter(Boolean) as string[]);
    const relatedLabels = relatedAreaIds.map((id) => labelForSection(packet, id));
    const state: ScanAreaCoverageState = items.length
      ? "active"
      : relatedAreaIds.length
        ? "related_signal_elsewhere"
        : (weakPacketItemsByArea.get(area.area_id) || []).length
          ? "context_only_signal"
          : "no_direct_signal";
    const summary = buildScanAreaSummary(area.area_id, labelForSection(packet, area.area_id), items, selected, state, relatedLabels);
    return {
      area_id: area.area_id,
      label: labelForSection(packet, area.area_id),
      status: state,
      finding_count: items.length,
      direct_source_count: uniq(selected.map((item) => sourceName(item.signal.source_domain))).length,
      summary,
      related_area_ids: relatedAreaIds.length ? relatedAreaIds : undefined,
      coverage_note: items.length ? undefined : summary,
    };
  });
}

function buildObservations(bundles: IntelligenceDepthBundle[]): GeneratedText[] {
  return bundles.slice(0, 3).map((bundle) => ({
    text: cleanText(bundle.analyst_observation.body),
    supported_by: bundle.claim_ids.map((id) => ({ type: "claim_id", id })),
    evidence_confidence: bundle.evidence_confidence,
  }));
}

function completeObservations(
  observations: GeneratedText[],
  scanAreas: GeneratedScannerReportArea[],
  refs: EvidenceSupportRef[],
): GeneratedText[] {
  if (observations.length >= 3) return observations.slice(0, 3);
  const active = scanAreas.filter((area) => area.status === "active");
  const coverage = scanAreas.filter((area) => area.status !== "active");
  const activeLabels = active.map((area) => area.label).slice(0, 4);
  const coverageLabels = coverage.map((area) => area.label).slice(0, 4);
  const additions: GeneratedText[] = [];
  if (activeLabels.length) {
    additions.push({
      text: cleanText(`The scan is concentrated in ${activeLabels.join(", ")}. That points to live route and operating-condition evidence rather than a broad all-category shift across every requested area.`),
      supported_by: refs,
    });
  }
  if (coverageLabels.length) {
    additions.push({
      text: cleanText(`${coverageLabels.join(", ")} stayed in dashboard coverage notes. That does not mean they were ignored; it means the scan did not find a separate direct item stronger than the Main Findings already shown.`),
      supported_by: refs,
    });
  }
  return [...observations, ...additions].slice(0, 3);
}

export function applyScannerReportLayout(input: {
  output: CompanyBriefingGenerationOutput;
  packet: CompanyBriefingEvidencePacket;
  selected: SelectedSignalForDepth[];
  bundles: IntelligenceDepthBundle[];
}): CompanyBriefingGenerationOutput {
  const { output, packet, selected, bundles } = input;
  if (packet.company.selected_scan_areas.length === 0) return output;
  const selectedForReport = sortFindingsByPriority(dedupeSelected(selected));
  const packetItems = itemMap(packet);

  const selectedByArea = new Map<string, SelectedSignalForDepth[]>();
  const allSelectedByArea = new Map<string, SelectedSignalForDepth[]>();
  const allowedAreaIds = new Set(packet.company.selected_scan_areas.map((area) => area.area_id));
  for (const item of selectedForReport) {
    for (const sectionId of item.section_ids) {
      const allList = allSelectedByArea.get(sectionId) || [];
      allList.push(item);
      allSelectedByArea.set(sectionId, allList);
    }
    const sectionId = primaryAreaId(packet, item);
    if (!sectionId) continue;
    const list = selectedByArea.get(sectionId) || [];
    list.push(item);
    selectedByArea.set(sectionId, list);
  }

  for (const item of selectedForReport) {
    const primary = primaryAreaId(packet, item);
    const hasConcreteEvidence = FACT_KEYWORDS.test(cleanText(`${item.signal.headline} ${item.signal.summary}`));
    if (!primary || !hasConcreteEvidence) continue;
    const emptySecondary = item.section_ids.find((id) => allowedAreaIds.has(id) && id !== primary && (selectedByArea.get(id) || []).length === 0);
    if (!emptySecondary) continue;
    selectedByArea.set(primary, (selectedByArea.get(primary) || []).filter((existing) => existing.item_id !== item.item_id));
    selectedByArea.set(emptySecondary, [item]);
  }

  const weakPacketItemsByArea = new Map<string, EvidenceEmailItem[]>();
  const selectedItemIds = new Set(selectedForReport.map((item) => item.item_id));
  for (const item of packet.email_items) {
    if (selectedItemIds.has(item.item_id)) continue;
    for (const sectionId of item.section_ids) {
      const list = weakPacketItemsByArea.get(sectionId) || [];
      list.push(item);
      weakPacketItemsByArea.set(sectionId, list);
    }
  }

  const sections: GeneratedBriefingSection[] = packet.company.selected_scan_areas.map((area) => {
    const areaItems = sortFindingsByPriority(dedupeSelected(selectedByArea.get(area.area_id) || []));
    const generatedItems = areaItems.map((item) => buildFindingItem(packet, { ...item, section_ids: [area.area_id] }, packetItems));
    return {
      section_id: area.area_id,
      heading: labelForSection(packet, area.area_id),
      items: generatedItems,
    };
  }).filter((section) => section.items.length > 0);

  const scanAreas = buildScannerAreas(packet, sections, selectedByArea, allSelectedByArea, weakPacketItemsByArea);
  const activeSections = sections.filter((section) => section.items.length > 0);
  const nonActiveAreas = scanAreas.filter((area) => area.status !== "active");
  const overview = buildOverview(packet, selectedForReport, scanAreas);
  const deeperReads = bundles.slice(0, 3).map((bundle) => buildDeeperReadFromBundle(bundle));
  const areaRefs = scanAreaRefs(packet);
  const topRefs = selectedForReport.slice(0, 8).flatMap(supportRefsForSelected).slice(0, 20);
  const dashboardLink = output.source_notes.dashboard_link;
  const observations = completeObservations(buildObservations(bundles), scanAreas, topRefs.length ? topRefs : areaRefs);

  return {
    ...output,
    today_brief: {
      top_line: overview,
      bullets: [
        {
          text: `Active scan areas: ${activeSections.map((section) => section.heading).slice(0, 8).join(", ") || "none"}.`,
          supported_by: activeSections.flatMap((section) => section.items.flatMap((item) => item.body.supported_by)).slice(0, 12),
        },
        {
          text: `Dashboard coverage notes: ${nonActiveAreas.map((area) => area.label).slice(0, 8).join(", ") || "none"}.`,
          supported_by: areaRefs,
        },
        {
          text: `Selected source references are shown here; the full source trail and coverage notes are available on the dashboard.`,
          supported_by: topRefs.length ? topRefs : areaRefs,
        },
      ],
    },
    main_briefing: { sections },
    scanner_report: {
      enabled: true,
      layout_version: "package10e_weighted_findings_v1",
      overview,
      main_findings_count: sections.reduce((sum, section) => sum + section.items.length, 0),
      scan_area_count: packet.company.selected_scan_areas.length,
      active_scan_area_count: activeSections.length,
      quiet_scan_area_count: nonActiveAreas.length,
      scan_areas: scanAreas,
      deeper_reads: deeperReads,
      also_seen: [],
      evidence_dashboard_link: dashboardLink,
    },
    useful_observations: {
      observations,
    },
    source_notes: {
      ...output.source_notes,
      text: {
        text: `Built from ${packet.input_summary.raw_articles_count} scanned items across ${packet.company.selected_scan_areas.length} requested areas. The email shows concrete scan findings with selected source references; the dashboard keeps the full Wikipedia-style source trail, topic evidence, coverage notes, and excluded noise.`,
        supported_by: topRefs.length ? topRefs : areaRefs,
      },
      scanned_count: packet.input_summary.raw_articles_count,
      scan_areas_covered: scanAreas.map((area) => area.label),
      dashboard_link: dashboardLink,
    },
    trace: {
      ...output.trace,
      generator_version: `${output.trace.generator_version}+package10e_weighted_findings_v1`,
    },
  };
}
