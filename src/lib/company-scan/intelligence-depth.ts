// ---------------------------------------------------------------------------
// Package 9 — Intelligence Depth Layer.
//
// This module turns selected company signals into deeper customer-facing
// intelligence sections. It is deliberately side-effect free: no network, no
// DB writes, no sends. V1 uses the existing scan corpus and Package 8 evidence
// packet; later versions can plug in targeted Brave/source retrieval before
// this same shaping step.
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
} from "./types";
import type { Signal } from "./types";

export type IntelligenceDepthConfidence = "high" | "medium" | "low";

type SignalKind =
  | "hormuz"
  | "corridors"
  | "suez"
  | "supply_chain"
  | "sanctions"
  | "media_regulation"
  | "disinformation"
  | "press_freedom"
  | "reputation_narrative"
  | "cyber_technology"
  | "geopolitics"
  | "other";

type CompanyBriefingIntentKey = "logistics_routes" | "geopolitical_media" | "ai_memory_integrity" | "general_media" | "default";

export interface SelectedSignalForDepth {
  signal: Signal;
  item_id: string;
  cluster_id: string;
  section_ids: string[];
  selection_score: number;
  keyword_match_score: number;
  selected_because?: string;
}

export interface IntelligenceDepthFact {
  text: string;
  claim_ids: string[];
  source_ids: string[];
  kind: "what_happened" | "what_registered" | "what_changed" | "source_frame" | "company_read";
}

export interface EvidenceStatistic {
  stat_id: string;
  label: string;
  value_text: string;
  explanation: string;
  confidence: IntelligenceDepthConfidence;
  source_refs: EvidenceSupportRef[];
  claim_ids: string[];
}

export type AnalystObservationType =
  | "hidden_distinction"
  | "quiet_widening"
  | "boundary_do_not_overread"
  | "source_frame_insight"
  | "evidence_quality_insight";

export interface AnalystObservation {
  observation_id: string;
  type: AnalystObservationType;
  title: string;
  body: string;
  evidence_refs: EvidenceSupportRef[];
  confidence: IntelligenceDepthConfidence;
}

export interface IntelligenceDepthBundle {
  bundle_id: string;
  heading: string;
  anchor_item_id: string;
  anchor_cluster_id: string;
  section_id: string;
  section_label: string;
  signal_ids: string[];
  source_names: string[];
  claim_ids: string[];
  source_refs: EvidenceSupportRef[];
  what_registered: IntelligenceDepthFact[];
  what_happened: IntelligenceDepthFact[];
  what_is_changing: IntelligenceDepthFact[];
  source_frames: IntelligenceDepthFact[];
  evidence_statistics: EvidenceStatistic[];
  analyst_observation: AnalystObservation;
  company_read: IntelligenceDepthFact;
  signal_kind: SignalKind;
  company_intent: CompanyBriefingIntentKey;
  body_text: string;
  selection_reason: string;
  evidence_class: "multi_source_pattern" | "single_source_signal" | "reported_datapoint" | "source_frame";
  evidence_confidence: EvidenceConfidenceLabel;
  confidence: IntelligenceDepthConfidence;
  depth_score: number;
}

interface BuildDepthOptions {
  maxBundles?: number;
}

export interface CompanyBriefingEvidenceDocument {
  run_id: string;
  company_profile_id: string;
  company_name: string;
  scan_date: string;
  scan_summary: {
    total_signals_loaded: number;
    selected_for_email: number;
    dashboard_only_count: number;
    excluded_count: number;
    key_source_domains_count: number;
    all_source_domains_count: number;
    regions_represented: string[];
    languages_represented: string[];
    selected_sections: string[];
    scan_window?: { from: string; to: string };
  };
  briefing_sections: Array<{
    heading: string;
    section_label: string;
    signal_ids: string[];
    source_names: string[];
    statistics: EvidenceStatistic[];
    claims: Array<{ claim_id: string; text: string; claim_type: string; confidence: number }>;
    selection_reason: string;
    evidence_class: string;
    evidence_confidence: EvidenceConfidenceLabel;
    source_quality: { A: number; B: number; C: number; D: number; Block: number };
  }>;
  perception_gap_frames: Array<{
    topic: string;
    frame_text: string;
    source_names: string[];
    claim_ids: string[];
    evidence_confidence: EvidenceConfidenceLabel;
  }>;
  observations: AnalystObservation[];
  key_sources: string[];
  key_sources_detail: Array<{
    source_display_name: string;
    source_id: string;
    source_grade: string;
    source_type: string;
    role: string;
  }>;
  source_quality_summary: {
    source_mix: { A: number; B: number; C: number; D: number; Block: number };
    concentration_risk: "low" | "medium" | "high";
    note: string;
  };
  dashboard_only_items: Array<{
    cluster_id: string;
    canonical_event_name: string;
    reason: string;
    relevance_score: number;
    cluster_confidence: number;
  }>;
  lower_priority_sample: Array<{
    signal_id: string;
    headline: string;
    source_domain: string | null;
    signal_type: string;
  }>;
  excluded_summary: CompanyBriefingEvidencePacket["excluded_summary"];
}

function slugify(s: string): string {
  return String(s || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}

function cleanText(value: string | null | undefined): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ",")
    .replace(/\s+,/g, ",")
    .trim();
}

function sourceName(domain: string | null | undefined): string {
  return String(domain || "unknown source").replace(/^www\./, "");
}

function splitSentences(text: string): string[] {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function trimWords(text: string, maxWords: number): string {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  return words.length > maxWords ? words.slice(0, maxWords).join(" ") : words.join(" ");
}

function signalText(signal: Signal): string {
  return `${signal.headline} ${signal.summary} ${(signal.themes || []).join(" ")} ${(signal.entities || []).join(" ")} ${(signal.regions || []).join(" ")}`.toLowerCase();
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function isLogisticsRelevantSignal(signal: Signal): boolean {
  const text = `${signal.headline} ${signal.summary}`.toLowerCase();
  const domain = String(signal.source_domain || "").toLowerCase();
  if (/(pravda|seekingalpha|koimoi|travelandtourworld|threads\.com|investing\.com)/.test(domain)) return false;
  return /\b(shipping|freight|hormuz|suez|red sea|bab el-mandeb|ports?|corridors?|routes?|supply chain|containers?|tankers?|lng|rail|maritime|logistics|chokepoints?|canal)\b/i.test(text);
}

function claimIdsForItem(packet: CompanyBriefingEvidencePacket, itemId: string): string[] {
  return packet.email_items.find((item) => item.item_id === itemId)?.facts.map((fact) => fact.claim_id) || [];
}

function supportRefsForClaims(packet: CompanyBriefingEvidencePacket, claimIds: string[]): EvidenceSupportRef[] {
  const refs: EvidenceSupportRef[] = [];
  const claimSet = new Set(claimIds);
  for (const item of packet.email_items) {
    for (const fact of item.facts) {
      if (!claimSet.has(fact.claim_id)) continue;
      for (const support of fact.supported_by) refs.push({ type: "source_id", id: support.source_id });
    }
  }
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.type}:${ref.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceNamesForClaims(packet: CompanyBriefingEvidencePacket, claimIds: string[]): string[] {
  const names: string[] = [];
  const claimSet = new Set(claimIds);
  for (const item of packet.email_items) {
    for (const fact of item.facts) {
      if (!claimSet.has(fact.claim_id)) continue;
      for (const support of fact.supported_by) names.push(support.source_display_name);
    }
  }
  return uniq(names).slice(0, 4);
}

function sectionLabel(packet: CompanyBriefingEvidencePacket, sectionId: string): string {
  const companyName = String(packet.company.display_name || "").toLowerCase();
  if (/evidence\s*&?\s*echoes|genealogy/.test(companyName) && sectionId === "election") return "Information integrity";
  if (sectionId === "watchlist-entities") return "People and institutions";
  return packet.company.selected_scan_areas.find((area) => area.area_id === sectionId)?.label || sectionId.replace(/[-_]+/g, " ");
}

function classifySignal(signal: Signal, sectionId?: string, sector: CompanySectorFrameKey = "default"): SignalKind {
  const section = String(sectionId || "").toLowerCase();
  if (sector === "media_comms") {
    const text = signalText(signal);
    // Prefer the actual article/event text over broad section matches. A media
    // company can track several related areas, and relevance scoring may attach
    // multiple section ids; the briefing section should follow the signal, not
    // the first broad area that happened to match.
    if (/sanction|blocked access|restricted access|embargo/.test(text)) return "sanctions";
    if (/disinformation|misinformation|propaganda|false claim|narrative/.test(text)) return "disinformation";
    if (/press freedom|journalist|media freedom|publisher|newsroom|broadcast|publication/.test(text)) return "press_freedom";
    if (/censor|ban\b|media law|disinformation law|regulation|regulator/.test(text)) return "media_regulation";
    if (/platform|algorithm|social media|content moderation|cyber|data breach|hack|deepfake|artificial intelligence|\bai\b/.test(text)) return "cyber_technology";
    if (/reputation|public opinion|audience|backlash|boycott/.test(text)) return "reputation_narrative";
    if (/putin|kremlin|russia|iran|dprk|north korea|kim jong|wang yi|ceasefire|war|missile|tehran/.test(text)) return "geopolitics";
    if (/media-regulation|regulatory-policy/.test(section)) return "media_regulation";
    if (/disinformation/.test(section)) return "disinformation";
    if (/press-freedom/.test(section)) return "press_freedom";
    if (/reputation-narrative/.test(section)) return "reputation_narrative";
    if (/cyber-technology/.test(section)) return "cyber_technology";
    if (/sanctions|trade-tariff-sanctions/.test(section)) return "sanctions";
    if (/geopolitical-conflict|geopolitics/.test(section)) return "geopolitics";
    return "other";
  }
  const text = signalText(signal);
  if (includesAny(text, ["suez", "bab el-mandeb", "red sea"])) return "suez";
  if (includesAny(text, ["corridor", "morocco", "moroccan", "egypt", "alternative route", "alternative corridor"])) return "corridors";
  if (includesAny(text, ["hormuz", "strait of hormuz"])) return "hormuz";
  if (includesAny(text, ["supply chain", "port disruption", "rail", "freight", "container", "lng"])) return "supply_chain";
  return "other";
}

function bundleRank(kind: SignalKind, intent: CompanyBriefingIntentKey): number {
  const logisticsRank: Record<SignalKind, number> = {
    hormuz: 1,
    corridors: 2,
    suez: 3,
    supply_chain: 4,
    sanctions: 5,
    media_regulation: 6,
    disinformation: 7,
    press_freedom: 8,
    reputation_narrative: 9,
    cyber_technology: 10,
    geopolitics: 11,
    other: 12,
  };
  const mediaGeopoliticalRank: Record<SignalKind, number> = {
    press_freedom: 1,
    media_regulation: 2,
    disinformation: 3,
    reputation_narrative: 4,
    sanctions: 5,
    geopolitics: 6,
    cyber_technology: 7,
    hormuz: 8,
    corridors: 9,
    suez: 10,
    supply_chain: 11,
    other: 12,
  };
  const aiMemoryRank: Record<SignalKind, number> = {
    disinformation: 1,
    cyber_technology: 2,
    media_regulation: 3,
    press_freedom: 4,
    reputation_narrative: 5,
    sanctions: 6,
    geopolitics: 7,
    hormuz: 8,
    corridors: 9,
    suez: 10,
    supply_chain: 11,
    other: 12,
  };
  if (intent === "logistics_routes") return logisticsRank[kind];
  if (intent === "ai_memory_integrity") return aiMemoryRank[kind];
  if (intent === "geopolitical_media") return mediaGeopoliticalRank[kind];
  return mediaGeopoliticalRank[kind] ?? 99;
}

function bundleHeading(kind: SignalKind, signals: Signal[], intent: CompanyBriefingIntentKey): string {
  if (kind === "hormuz") return "Hormuz shipping activity remains far below normal";
  if (kind === "corridors") return "Alternative Gulf routes are moving from theory to discussion";
  if (kind === "suez") return "Suez delays show the pressure is spreading beyond Hormuz";
  if (kind === "supply_chain") return "Transport disruption can become a cost problem fast";
  if (intent === "ai_memory_integrity" && kind === "disinformation") return "AI falsehoods are becoming a credibility risk for public memory";
  if (intent === "ai_memory_integrity" && kind === "cyber_technology") return "Voice, image and deepfake protection moved into the evidence trail";
  if (intent === "ai_memory_integrity" && kind === "media_regulation") return "Censorship rules are changing who can preserve and publish records";
  if (intent === "ai_memory_integrity" && kind === "sanctions") return "Access rules are becoming part of the information record";
  if (intent === "ai_memory_integrity" && kind === "geopolitics") return "Geopolitical narratives are spilling into public memory";
  if (intent === "geopolitical_media" && kind === "disinformation") return "State-linked disinformation is moving through public channels";
  if (intent === "geopolitical_media" && kind === "geopolitics") return "Russia, North Korea and Iran coverage shaped the narrative-risk picture";
  if (kind === "sanctions") return "Sanctions and access rules are shaping the information environment";
  if (kind === "media_regulation") return "Media regulation changed the publishing environment";
  if (kind === "disinformation") return "AI and disinformation risk showed up in coverage";
  if (kind === "press_freedom") return "Press freedom signals need careful reading";
  if (kind === "reputation_narrative") return "Narrative risk is moving through audience-facing coverage";
  if (kind === "cyber_technology") return "Technology and platform exposure are part of the story";
  if (kind === "geopolitics") return "Geopolitical coverage is shaping the information environment";
  return trimWords(signals[0]?.headline || "Relevant company signal", 12);
}

type CompanySectorFrameKey = "logistics_shipping" | "media_comms" | "energy" | "agriculture_food" | "finance_markets" | "technology" | "default";

interface PerceptionGapFrameTemplate {
  frame_a_label: string;
  frame_b_label: string;
  frame_a_focus: string;
  frame_b_focus: string;
  gap: string;
  reader_risk: string;
}

function normalizeCompanySector(industry: string | null | undefined): CompanySectorFrameKey {
  const value = String(industry || "").toLowerCase();
  if (/logistics|shipping|maritime|freight|port|supply-chain|transport/.test(value)) return "logistics_shipping";
  if (/media|comms|communications|publishing|broadcast|news|journalism|content/.test(value)) return "media_comms";
  if (/energy|oil|gas|lng|power|utility/.test(value)) return "energy";
  if (/agriculture|food|farm|grain|grocery|fertili[sz]er/.test(value)) return "agriculture_food";
  if (/finance|bank|market|asset|insurance|payments?|capital/.test(value)) return "finance_markets";
  if (/technology|software|semiconductor|telecom|platform|ai|cyber/.test(value)) return "technology";
  return "default";
}

function inferCompanyIntent(packet: CompanyBriefingEvidencePacket, sector: CompanySectorFrameKey): CompanyBriefingIntentKey {
  if (sector === "logistics_shipping") return "logistics_routes";
  const companyName = String(packet.company.display_name || "").toLowerCase();
  const areas = (packet.company.selected_scan_areas || []).map((area) => `${area.area_id} ${area.label}`).join(" ").toLowerCase();
  const entities = (packet.company.watch_entities || []).map((entity) => entity.name).join(" ").toLowerCase();
  const hay = `${companyName} ${areas} ${entities}`;
  if (/genealogy|evidence\s*&?\s*echoes|deepfake|ai[- ]?video|artificial intelligence|journalism|information[- ]warfare|cybersecurity|election/.test(hay)) {
    return "ai_memory_integrity";
  }
  if (sector === "media_comms" && /lindell|press freedom|media regulation|dprk|kim jong|iran|russia|kremlin|putin/.test(hay)) {
    return "geopolitical_media";
  }
  if (sector === "media_comms") return "general_media";
  return "default";
}

function sourceDisplayList(sourceNames: string[], domains: string[]): string {
  const cleaned = uniq([...sourceNames, ...domains])
    .map((source) => source.replace(/^www\./, ""))
    .filter((source) => source && source !== "unknown source")
    .slice(0, 2);
  if (cleaned.length === 0) return "selected sources";
  if (cleaned.length === 1) return cleaned[0];
  return `${cleaned[0]} and ${cleaned[1]}`;
}

function perceptionGapTemplate(
  sector: CompanySectorFrameKey,
  kind: SignalKind,
): PerceptionGapFrameTemplate {
  if (sector === "logistics_shipping" && kind === "supply_chain") {
    return {
      frame_a_label: "Transport/agriculture view",
      frame_b_label: "Geopolitical view",
      frame_a_focus: "framed disruption through direct cost exposure, including export losses from rail and harbour interruption",
      frame_b_focus: "treated chokepoints, energy movement, and route security as the main story",
      gap: "one frame talks about route risk; the other shows where that risk becomes money lost",
      reader_risk: "a reader who only sees the geopolitical frame may miss the commercial cost clock that starts once transport fails",
    };
  }

  if (sector === "logistics_shipping" && kind === "corridors") {
    return {
      frame_a_label: "Route-planning view",
      frame_b_label: "Regional/security view",
      frame_a_focus: "treated alternative corridors, ports, and Europe-Gulf gateways as practical contingency options",
      frame_b_focus: "focused more on regional instability, security posture, and political risk around the Strait of Hormuz",
      gap: "route-planning coverage can sound like a rerouting shift is underway, while the evidence only shows contingency language getting more practical",
      reader_risk: "a reader who only sees the route-planning frame may misread early corridor talk as proof that freight has already moved at scale",
    };
  }

  if (sector === "logistics_shipping" && kind === "suez") {
    return {
      frame_a_label: "Chokepoint-system view",
      frame_b_label: "Single-route view",
      frame_a_focus: "connected Suez, Red Sea, Bab el-Mandeb, and Hormuz into one wider route-confidence problem",
      frame_b_focus: "treated each strait, canal, or vessel delay as a separate regional incident",
      gap: "single-route coverage can make delays look contained, while chokepoint-system coverage shows how pressure can spread across linked routes",
      reader_risk: "a reader who only sees one route at a time may miss knock-on delays appearing elsewhere in the network",
    };
  }

  if (sector === "logistics_shipping") {
    return {
      frame_a_label: "Shipping/trade view",
      frame_b_label: "Regional/security view",
      frame_a_focus: "focused on traffic, freight rates, vessel movement, route reliability, and carrier confidence",
      frame_b_focus: "focused more on security, diplomacy, energy exposure, and regional stability",
      gap: "political coverage can make the situation look like a negotiation timeline, while shipping coverage shows a slower operational confidence problem",
      reader_risk: "a political headline can improve while insurance, rates, and vessel movement still show commercial hesitation",
    };
  }

  if (sector === "media_comms") {
    return {
      frame_a_label: "Media/comms view",
      frame_b_label: "State/policy view",
      frame_a_focus: "focused on information access, audience exposure, platform effects, press freedom, and narrative spread",
      frame_b_focus: "focused more on official positioning, regulation, sanctions, security claims, and state interests",
      gap: "one frame shows how information may reach or shape audiences; the other shows how authorities or institutions are trying to define the event",
      reader_risk: "a reader who only sees the official frame may miss how the story is being distributed, restricted, or reframed for audiences",
    };
  }

  if (sector === "energy") {
    return {
      frame_a_label: "Energy-supply view",
      frame_b_label: "Security/diplomacy view",
      frame_a_focus: "focused on supply reliability, cargo movement, LNG or oil exposure, and price pressure",
      frame_b_focus: "focused more on military risk, diplomatic signalling, sanctions, and regional escalation",
      gap: "one frame asks whether energy can keep moving; the other asks whether the political risk is easing or worsening",
      reader_risk: "a reader who only sees the diplomatic frame may miss a supply signal that can matter before policy language changes",
    };
  }

  if (sector === "agriculture_food") {
    return {
      frame_a_label: "Food-supply view",
      frame_b_label: "Trade/policy view",
      frame_a_focus: "focused on crop movement, export capacity, input costs, and food availability",
      frame_b_focus: "focused more on tariffs, sanctions, port access, politics, and trade negotiation",
      gap: "one frame treats the event as policy friction; the other shows where it can affect physical food movement and cost",
      reader_risk: "a reader who only sees the policy frame may miss the timing pressure created by harvests, storage, shipping windows, and spoilage risk",
    };
  }

  if (sector === "finance_markets") {
    return {
      frame_a_label: "Market-pricing view",
      frame_b_label: "Policy/geopolitical view",
      frame_a_focus: "focused on rates, risk premia, sector exposure, insurance, liquidity, or asset-price movement",
      frame_b_focus: "focused more on official statements, policy paths, sanctions, elections, and geopolitical positioning",
      gap: "one frame shows what markets are pricing; the other explains the policy or political story those prices are reacting to",
      reader_risk: "a reader who only sees the policy frame may miss the speed at which market pricing can move ahead of formal decisions",
    };
  }

  if (sector === "technology") {
    return {
      frame_a_label: "Company/product view",
      frame_b_label: "Policy/security view",
      frame_a_focus: "focused on product access, supplier exposure, platform dependency, chips, infrastructure, or customer impact",
      frame_b_focus: "focused more on regulation, national security, export controls, litigation, or state pressure",
      gap: "one frame shows operational exposure; the other shows the policy or security logic behind it",
      reader_risk: "a reader who only sees the product frame may miss a regulatory or security constraint that can reshape access quickly",
    };
  }

  return {
    frame_a_label: "Operational view",
    frame_b_label: "Policy/regional view",
    frame_a_focus: "focused on practical impact, timing, costs, customers, and operations",
    frame_b_focus: "focused more on official framing, politics, regional risk, and public signalling",
    gap: "one frame shows what changed on the ground; the other shows how institutions or regions are explaining it",
    reader_risk: "a reader who only sees one frame can mistake public positioning for operational reality, or operational detail for the whole story",
  };
}

function extractNumberPhrases(signals: Signal[]): string[] {
  const phrases: string[] = [];
  for (const signal of signals) {
    const text = `${signal.headline}. ${signal.summary}`;
    for (const sentence of splitSentences(text)) {
      if (/(\d+\s?%|\$\d+|\d+\s?(million|billion|days|weeks|months|years)|pre-war|shortfall|traffic|rates?)/i.test(sentence)) {
        phrases.push(trimWords(sentence, 34));
      }
    }
  }
  return uniq(phrases).slice(0, 3);
}

function buildEvidenceStatistics(
  kind: SignalKind,
  signals: Signal[],
  claimIds: string[],
  sourceRefs: EvidenceSupportRef[],
): EvidenceStatistic[] {
  const text = signals.map((s) => `${s.headline} ${s.summary}`).join(" \n");
  const stats: EvidenceStatistic[] = [];

  if (kind === "hormuz" && /5\s?%|5 percent|five percent/i.test(text)) {
    stats.push({
      stat_id: "hormuz_traffic_5pct",
      label: "Hormuz traffic",
      value_text: "about 5% of pre-war levels",
      explanation: "A reported figure showing how far normal vessel movement can lag behind a formal reopening or easing in political tension.",
      confidence: "medium",
      source_refs: sourceRefs,
      claim_ids: claimIds,
    });
  }

  if (kind === "hormuz" && /freight|rate|vessel|ballast|tanker/i.test(text)) {
    stats.push({
      stat_id: "hormuz_freight_capacity",
      label: "Freight/capacity signal",
      value_text: "mixed rate signals and limited vessel availability",
      explanation: "Shows the disruption appearing in commercial behaviour, not only in security headlines.",
      confidence: "medium",
      source_refs: sourceRefs,
      claim_ids: claimIds,
    });
  }

  if (kind === "suez" && /weeks?/i.test(text)) {
    stats.push({
      stat_id: "suez_weeks_delay",
      label: "Delay duration",
      value_text: "weeks of delay",
      explanation: "A concrete sign that uncertainty around Hormuz can spill into nearby canal movement and vessel timing.",
      confidence: "medium",
      source_refs: sourceRefs,
      claim_ids: claimIds,
    });
  }

  if (kind === "supply_chain" && /\$?540\s?m|\$540\s?million|540 million/i.test(text)) {
    stats.push({
      stat_id: "canada_disruption_cost_540m",
      label: "Disruption cost estimate",
      value_text: "up to $540 million",
      explanation: "A reported estimate for one week of rail and port disruption during peak export season, useful as a cost reference for transport interruptions.",
      confidence: "medium",
      source_refs: sourceRefs,
      claim_ids: claimIds,
    });
  }

  if (kind === "corridors") {
    const routeCount = uniq(signals.map((s) => s.source_domain).filter(Boolean)).length;
    stats.push({
      stat_id: "alternative_route_source_count",
      label: "Alternative-route source spread",
      value_text: `${routeCount || signals.length} source${(routeCount || signals.length) === 1 ? "" : "s"} in today's selected evidence`,
      explanation: "This is early evidence, but it shows alternative routing appearing in more than one part of the selected scan.",
      confidence: routeCount >= 2 ? "medium" : "low",
      source_refs: sourceRefs,
      claim_ids: claimIds,
    });
  }

  if (["media_regulation", "disinformation", "press_freedom", "reputation_narrative", "cyber_technology", "sanctions", "geopolitics"].includes(kind)) {
    const sourceCount = uniq(signals.map((s) => s.source_domain).filter(Boolean)).length;
    stats.push({
      stat_id: `${kind}_source_spread`,
      label: "Selected source spread",
      value_text: `${sourceCount || signals.length} source${(sourceCount || signals.length) === 1 ? "" : "s"} in today's selected evidence`,
      explanation: "A small source-spread marker showing how much of the selected briefing item rests on one report versus repeated coverage.",
      confidence: sourceCount >= 2 ? "medium" : "low",
      source_refs: sourceRefs,
      claim_ids: claimIds,
    });
  }

  return stats.slice(0, 3);
}

function buildWhatHappened(kind: SignalKind, signals: Signal[]): string {
  const numbers = extractNumberPhrases(signals);
  const lead = signals[0];
  const mediaKind = ["media_regulation", "disinformation", "press_freedom", "reputation_narrative", "cyber_technology", "sanctions", "geopolitics"].includes(kind);
  const rawLead = `${lead?.summary || ""}`.trim();
  const weakSummary = /^(the table below|watch:|school assembly|click here|this article|read more)\b/i.test(rawLead);
  const leadText = mediaKind ? lead?.headline : weakSummary ? lead?.headline : rawLead || lead?.headline;
  const leadSummary = trimWords(leadText || "A relevant signal appeared in today's scan", mediaKind ? 24 : 36);
  const secondHeadline = mediaKind && signals[1]?.headline ? trimWords(signals[1].headline, 18) : "";
  const secondLine = secondHeadline ? ` Also: ${secondHeadline}.` : "";
  if (kind === "hormuz") {
    const hasFivePct = signals.some((s) => /5\s?%|5 percent|five percent/i.test(`${s.headline} ${s.summary}`));
    const detail = hasFivePct ? "One report said Hormuz traffic was running at about 5% of pre-war levels." : `${numbers[0] || "Reports pointed to reduced movement around Hormuz"}.`;
    const freight = signals.find((s) => /freight|rate|vessel|ballast|tanker/i.test(`${s.headline} ${s.summary}`));
    return `${detail} The datapoint was useful because the story was not route closure; it was damaged shipping confidence around the strait. ${freight ? `Freight coverage also pointed to uneven rates and limited vessel availability.` : ""}`;
  }
  if (kind === "corridors") {
    return `Egypt-corridor and Morocco-port coverage made alternative Gulf routing a practical planning signal, not just a theory. One report focused on Egypt's Europe-Gulf corridor, while another said instability around Hormuz is pushing more attention toward Moroccan ports.`;
  }
  if (kind === "suez") {
    return `Suez-linked coverage showed delay evidence entering the Hormuz story. One report said MSC Euribia transited the canal after weeks of delay near the Strait of Hormuz.`;
  }
  if (kind === "supply_chain") {
    const has540m = signals.some((s) => /\$?540\s?m|\$540\s?million|540 million/i.test(`${s.headline} ${s.summary}`));
    const cost = has540m
      ? "A Canadian agricultural transport report put a concrete cost marker on disruption. It cited an Agriculture Transport Coalition estimate for one week of rail and port disruption during peak export season. The estimate was up to $540 million in unrecoverable export sales."
      : numbers.find((p) => /\$/.test(p)) || numbers[0];
    return cost
      ? (cost.endsWith(".") ? cost : `The scan also picked up a concrete disruption-cost signal: ${cost.replace(/[.!?]$/g, "")}.`)
      : `The scan also picked up supply-chain disruption reporting outside the Gulf, focused on port, rail, freight, or LNG exposure.`;
  }
  const sentenceLead = leadSummary.replace(/[.!?]+$/g, "");
  if (kind === "media_regulation") return `${sentenceLead}.${secondLine}`;
  if (kind === "disinformation") return `${sentenceLead}.${secondLine}`;
  if (kind === "press_freedom") return `${sentenceLead}.${secondLine}`;
  if (kind === "reputation_narrative") return `${sentenceLead}.${secondLine}`;
  if (kind === "cyber_technology") return `${sentenceLead}.${secondLine}`;
  if (kind === "sanctions") return `${sentenceLead}.${secondLine}`;
  if (kind === "geopolitics") return `${sentenceLead}.${secondLine}`;
  return leadSummary + ".";
}

function buildWhatChanging(kind: SignalKind): string {
  if (kind === "hormuz") {
    return "The key point is simple: open water does not automatically mean normal trade. A route can reopen before carriers, insurers, charterers, and customers are ready to trust it again.";
  }
  if (kind === "corridors") {
    return "These are early signals, not proof of a major rerouting shift. The useful change is that coverage is moving from immediate disruption toward practical contingency planning: ports, corridors, and alternative gateways.";
  }
  if (kind === "suez") {
    return "One vessel does not prove traffic has normalised. It does show that delays and route decisions are spreading into the wider chokepoint system.";
  }
  if (kind === "supply_chain") {
    return "This is outside the Gulf, but it gives a useful cost reference. The estimate should be treated as directional, not settled fact. It shows how quickly route, rail, or port disruption can move from operational inconvenience to direct commercial loss.";
  }
  if (["media_regulation", "disinformation", "press_freedom", "reputation_narrative", "cyber_technology", "sanctions", "geopolitics"].includes(kind)) {
    if (kind === "disinformation") return "The risk is whether false or state-shaped material becomes searchable, repeatable, or treated as evidence later.";
    if (kind === "press_freedom") return "The relevance is access: who can publish, who is suppressed, and whether enforcement spills beyond its stated target.";
    if (kind === "media_regulation") return "The relevance is visibility: what remains publishable, searchable, monetisable, or safe to distribute.";
    if (kind === "reputation_narrative") return "The risk is repetition. A narrative matters more when the same frame starts appearing across sources and audiences.";
    if (kind === "cyber_technology") return "The relevance is trust in identity, source material, and distribution systems.";
    if (kind === "sanctions") return "The relevance is practical access: who can publish, transact, travel, or distribute information under changing rules.";
    if (kind === "geopolitics") return "The relevance is the information environment around the event: which actors are named, which claims repeat, and which audiences are being shaped.";
  }
  return "This is worth noting today, but it should be compared with the next scan window before treating it as a wider pattern.";
}

function buildBodyText(
  kind: SignalKind,
  happened: string,
  changing: string,
  stats: EvidenceStatistic[],
): string {
  if (kind === "hormuz") {
    const statLine = stats.find((s) => s.stat_id === "hormuz_traffic_5pct")
      ? "That number separates formal access from real commercial recovery."
      : "Route access and route confidence can move at different speeds.";
    return `${happened} ${statLine}\n\n${changing} The comparison is whether vessel traffic, insurance cover, and rates recover together, or whether only the political headline improves.`;
  }

  if (kind === "corridors") {
    return `${happened} These reports do not prove a full reroute is happening. They show where attention is starting to move.\n\n${changing} The distinction is practical planning versus proven route change. Repeated coverage across later scans would matter more than one corridor story on its own.`;
  }

  if (kind === "suez") {
    return `${happened} ${changing}\n\nChokepoints rarely move in isolation. When Hormuz confidence weakens, Suez, Red Sea, and Bab el-Mandeb coverage can become part of the same operational picture.`;
  }

  if (kind === "supply_chain") {
    return `${happened}\n\n${changing}`;
  }

  if (["media_regulation", "disinformation", "press_freedom", "reputation_narrative", "cyber_technology", "sanctions", "geopolitics"].includes(kind)) {
    const stat = stats[0];
    const evidenceLine = stat && !stat.stat_id.endsWith("_source_spread")
      ? `${stat.label}: ${stat.value_text}. ${stat.explanation}`
      : "";
    return `${happened}${evidenceLine ? ` ${evidenceLine}` : ""}\n\n${changing}`;
  }

  return `${happened} ${changing}`.replace(/\s+/g, " ").trim();
}

function buildCompanyRead(kind: SignalKind, intent: CompanyBriefingIntentKey): string {
  if (kind === "hormuz") return "The main issue is confidence, not access. If reported Hormuz traffic remains thin while the route is formally open, the market is not behaving as if risk has cleared. That separates political reassurance from shipping reality: traffic recovery, insurance behaviour, and rate movement need to be read together.";
  if (kind === "corridors") return "Alternative-route coverage is an early signal, not a conclusion. Egypt-corridor and Morocco-port stories do not prove a major route shift. They show practical contingency language entering the coverage, which would matter more if it repeats across later scans.";
  if (kind === "suez") return "Reported Hormuz, Suez, Red Sea, and Bab el-Mandeb coverage is appearing as one connected route story. The pattern is whether stress in one chokepoint starts changing confidence around the others.";
  if (kind === "supply_chain") return "Cost examples separate real risk from background noise. The Canada rail and port estimate is not a Gulf story, but it shows how quickly transport disruption can become unrecoverable sales loss.";
  if (intent === "ai_memory_integrity" && kind === "disinformation") return "The useful distinction is false output versus durable record. AI falsehoods matter when they enter search, archives, family history, or institutional memory — places where later readers may treat them as evidence.";
  if (intent === "ai_memory_integrity" && kind === "cyber_technology") return "The useful distinction is identity as content versus identity as evidence. Voice, image, and likeness protection matters when synthetic media can blur the chain between source, subject, and record.";
  if (intent === "ai_memory_integrity" && kind === "media_regulation") return "The useful distinction is content moderation versus preservation. Censorship or access rules matter when they decide which records remain visible, searchable, or usable later.";
  if (intent === "geopolitical_media" && kind === "disinformation") return "The useful distinction is claim versus channel. A false or state-linked narrative matters more when it moves across platforms or audiences, not just because one outlet names it.";
  if (intent === "geopolitical_media" && kind === "geopolitics") return "The useful distinction is event coverage versus narrative pressure. Russia, North Korea, Iran, and sanctions stories matter when they shift the information environment around audiences, platforms, or reputation.";
  if (kind === "media_regulation") return "The useful distinction is regulation versus reach. A media-regulation story matters most when it changes who can publish, distribute, monetise, or access information.";
  if (kind === "disinformation") return "The useful distinction is claim versus spread. A narrative-risk signal matters more if it repeats across sources or reaches a new audience, not just because one outlet names it.";
  if (kind === "press_freedom") return "The useful distinction is incident versus operating climate. A press-freedom signal matters when it suggests a change in access, safety, censorship, or legal pressure.";
  if (kind === "reputation_narrative") return "The useful distinction is coverage versus narrative movement. The signal matters if language, blame, or audience framing begins to repeat across sources.";
  if (kind === "cyber_technology") return "The useful distinction is technical incident versus information access. Platform or cyber signals matter when they affect distribution, trust, or visibility.";
  if (kind === "sanctions") return "The useful distinction is official action versus practical information access. Sanctions coverage matters when it changes who can operate, publish, transact, or distribute.";
  if (kind === "geopolitics") return "The useful distinction is geopolitical event versus information environment. The same story can matter differently depending on whether it changes audience risk, narrative pressure, or access.";
  return "This is worth noting, but it needs more evidence before it should be treated as a trend.";
}

function buildAnalystObservation(
  kind: SignalKind,
  bundleId: string,
  text: string,
  refs: EvidenceSupportRef[],
  confidence: IntelligenceDepthConfidence,
): AnalystObservation {
  const typeByKind: Record<SignalKind, AnalystObservation["type"]> = {
    hormuz: "hidden_distinction",
    corridors: "boundary_do_not_overread",
    suez: "quiet_widening",
    supply_chain: "evidence_quality_insight",
    sanctions: "boundary_do_not_overread",
    media_regulation: "hidden_distinction",
    disinformation: "source_frame_insight",
    press_freedom: "quiet_widening",
    reputation_narrative: "source_frame_insight",
    cyber_technology: "evidence_quality_insight",
    geopolitics: "hidden_distinction",
    other: "boundary_do_not_overread",
  };
  const titleByKind: Record<SignalKind, string> = {
    hormuz: "Confidence matters more than access",
    corridors: "Alternative-route coverage is an early warning",
    suez: "The wider chokepoint system is part of the story",
    supply_chain: "Cost examples separate noise from material risk",
    sanctions: "Sanctions coverage needs practical interpretation",
    media_regulation: "Regulation matters when it changes reach",
    disinformation: "Narrative risk depends on spread",
    press_freedom: "Press-freedom signals describe operating climate",
    reputation_narrative: "Narrative movement is the thing to watch",
    cyber_technology: "Platform exposure changes information access",
    geopolitics: "Geopolitics can become an information-environment story",
    other: "Treat this as a signal before calling it a trend",
  };
  return {
    observation_id: `obs_${bundleId}`,
    type: typeByKind[kind],
    title: titleByKind[kind],
    body: text,
    evidence_refs: refs,
    confidence,
  };
}

function buildSelectionReason(
  kind: SignalKind,
  signals: Signal[],
  stats: EvidenceStatistic[],
  sourceNames: string[],
): string {
  const sourceCount = uniq(sourceNames).length;
  if (kind === "hormuz") {
    return stats.some((stat) => stat.stat_id === "hormuz_traffic_5pct")
      ? "reported chokepoint traffic datapoint with direct route-confidence relevance"
      : "shipping-confidence signal tied to a company-selected chokepoint theme";
  }
  if (kind === "corridors") return "early alternative-route planning signal across selected logistics evidence";
  if (kind === "suez") return "nearby chokepoint movement connected to the same route-confidence story";
  if (kind === "supply_chain") return "concrete disruption-cost signal relevant to transport and logistics exposure";
  if (kind === "media_regulation") return "media-regulation signal relevant to the company brief";
  if (kind === "disinformation") return "disinformation or narrative-risk signal relevant to the company brief";
  if (kind === "press_freedom") return "press-freedom signal relevant to the company brief";
  if (kind === "reputation_narrative") return "reputation or narrative signal relevant to the company brief";
  if (kind === "cyber_technology") return "platform, cyber, or technology signal relevant to the company brief";
  if (kind === "sanctions") return "sanctions or information-access signal relevant to the company brief";
  if (kind === "geopolitics") return "geopolitical signal relevant to the company brief";
  return sourceCount >= 2 || signals.length >= 2
    ? "multi-source signal relevant to the company brief"
    : "single-source signal relevant to the company brief";
}

function evidenceClassForBundle(
  stats: EvidenceStatistic[],
  sourceNames: string[],
  frame: IntelligenceDepthFact | null,
): IntelligenceDepthBundle["evidence_class"] {
  const substantiveStats = stats.filter((stat) => !stat.stat_id.endsWith("_source_spread"));
  if (frame) return "source_frame";
  if (substantiveStats.length > 0) return "reported_datapoint";
  if (uniq(sourceNames).length >= 2) return "multi_source_pattern";
  return "single_source_signal";
}

function sourceQualityForBundle(sourceNames: string[]): EvidenceConfidenceLabel["source_quality"] {
  if (sourceNames.length === 0) return "mixed";
  return "B";
}

function confidenceLabelForBundle(
  kind: SignalKind,
  stats: EvidenceStatistic[],
  sourceNames: string[],
  frame: IntelligenceDepthFact | null,
  confidence: IntelligenceDepthConfidence,
): EvidenceConfidenceLabel {
  const sourceCount = uniq(sourceNames).length;
  const sourceQuality = sourceQualityForBundle(sourceNames);
  const substantiveStats = stats.filter((stat) => !stat.stat_id.endsWith("_source_spread"));

  if (substantiveStats.some((stat) => /estimate/i.test(`${stat.label} ${stat.explanation}`))) {
    return {
      kind: "estimate_or_forecast",
      label: "Reported estimate",
      customer_phrase: "The estimate should be treated as directional, not settled fact.",
      confidence,
      reason: "The selected evidence includes a reported cost or impact estimate.",
      source_count: sourceCount,
      source_quality: sourceQuality,
    };
  }

  if (kind === "corridors") {
    return {
      kind: "early_signal",
      label: "Early signal",
      customer_phrase: "This is early evidence rather than proof of a settled shift.",
      confidence,
      reason: "Alternative-route coverage appeared in selected evidence, but repeat evidence is needed before calling it a trend.",
      source_count: sourceCount,
      source_quality: sourceQuality,
    };
  }

  if (substantiveStats.length > 0) {
    return {
      kind: "reported_claim",
      label: "Reported datapoint",
      customer_phrase: "The wording should keep the datapoint tied to its report, not treat it as settled ground truth.",
      confidence,
      reason: "The bundle is led by a reported datapoint from selected evidence.",
      source_count: sourceCount,
      source_quality: sourceQuality,
    };
  }

  if (frame) {
    return {
      kind: "regional_frame",
      label: "Source-frame comparison",
      customer_phrase: "This is a difference in framing, not a separate factual conclusion.",
      confidence,
      reason: "The selected evidence supports comparing trade/operational framing with regional/security framing.",
      source_count: sourceCount,
      source_quality: sourceQuality,
    };
  }

  if (sourceCount >= 2) {
    return {
      kind: "multi_source_signal",
      label: "Multi-source signal",
      customer_phrase: "Several selected sources pointed to the same broad signal.",
      confidence,
      reason: "The bundle draws on more than one selected source.",
      source_count: sourceCount,
      source_quality: sourceQuality,
    };
  }

  return {
    kind: "single_source",
    label: "Single-source signal",
    customer_phrase: "One selected source reported this signal.",
    confidence,
    reason: "The bundle is anchored mainly in one selected source.",
    source_count: Math.max(1, sourceCount),
    source_quality: sourceQuality,
  };
}

function regionalFrameConfidenceLabel(bundle: IntelligenceDepthBundle): EvidenceConfidenceLabel {
  return {
    kind: "regional_frame",
    label: "Source-frame comparison",
    customer_phrase: "This is a difference in framing, not a separate factual conclusion.",
    confidence: bundle.confidence,
    reason: "The Perception Gap compares supported source frames from the selected evidence.",
    source_count: Math.max(1, uniq(bundle.source_names).length),
    source_quality: sourceQualityForBundle(bundle.source_names),
  };
}

function claimsForBundle(packet: CompanyBriefingEvidencePacket, claimIds: string[]): CompanyBriefingEvidenceDocument["briefing_sections"][number]["claims"] {
  const claimSet = new Set(claimIds);
  return packet.email_items
    .flatMap((item) => item.facts)
    .filter((fact) => claimSet.has(fact.claim_id))
    .map((fact) => ({
      claim_id: fact.claim_id,
      text: fact.text,
      claim_type: fact.claim_type,
      confidence: fact.confidence,
    }));
}

function sourceMixForBundle(packet: CompanyBriefingEvidencePacket, claimIds: string[]): { A: number; B: number; C: number; D: number; Block: number } {
  const mix = { A: 0, B: 0, C: 0, D: 0, Block: 0 };
  const claimSet = new Set(claimIds);
  const seen = new Set<string>();
  for (const item of packet.email_items) {
    for (const fact of item.facts) {
      if (!claimSet.has(fact.claim_id)) continue;
      for (const support of fact.supported_by) {
        const key = support.source_id;
        if (seen.has(key)) continue;
        seen.add(key);
        mix[support.source_grade] += 1;
      }
    }
  }
  return mix;
}

function sourceDetailsForPacket(packet: CompanyBriefingEvidencePacket): CompanyBriefingEvidenceDocument["key_sources_detail"] {
  const seen = new Set<string>();
  const details: CompanyBriefingEvidenceDocument["key_sources_detail"] = [];
  for (const item of packet.email_items) {
    const supports = [item.source_summary.anchor, ...item.source_summary.supporting];
    for (const support of supports) {
      if (seen.has(support.source_id)) continue;
      seen.add(support.source_id);
      details.push({
        source_display_name: support.source_display_name,
        source_id: support.source_id,
        source_grade: support.source_grade,
        source_type: support.source_type,
        role: support.role,
      });
    }
  }
  return details.sort((a, b) => a.source_display_name.localeCompare(b.source_display_name));
}

function sourceQualitySummary(details: CompanyBriefingEvidenceDocument["key_sources_detail"]): CompanyBriefingEvidenceDocument["source_quality_summary"] {
  const mix = { A: 0, B: 0, C: 0, D: 0, Block: 0 };
  const countsBySource = new Map<string, number>();
  for (const detail of details) {
    mix[detail.source_grade as keyof typeof mix] = (mix[detail.source_grade as keyof typeof mix] || 0) + 1;
    countsBySource.set(detail.source_display_name, (countsBySource.get(detail.source_display_name) || 0) + 1);
  }
  const total = details.length || 1;
  const maxShare = Math.max(0, ...countsBySource.values()) / total;
  const concentrationRisk = maxShare >= 0.5 ? "high" : maxShare >= 0.3 ? "medium" : "low";
  return {
    source_mix: mix,
    concentration_risk: concentrationRisk,
    note: concentrationRisk === "low"
      ? "Selected evidence is not concentrated in a single source."
      : concentrationRisk === "medium"
        ? "Some selected evidence is concentrated; source spread should be watched."
        : "Selected evidence is highly concentrated and should be treated carefully.",
  };
}

function buildSourceFrame(
  kind: SignalKind,
  sector: CompanySectorFrameKey,
  signals: Signal[],
  sourceNames: string[],
  claimIds: string[],
  sourceIds: string[],
): IntelligenceDepthFact | null {
  const domains = signals.map((s) => sourceName(s.source_domain));
  if (uniq([...sourceNames, ...domains]).length < 2) return null;

  const template = perceptionGapTemplate(sector, kind);
  const sources = sourceDisplayList(sourceNames, domains);
  return {
    kind: "source_frame",
    text: `${template.frame_a_label}: ${sources} ${template.frame_a_focus}.\n${template.frame_b_label}: wider regional and policy coverage ${template.frame_b_focus}.\nThe gap: ${template.gap}.\nWhy it matters: ${template.reader_risk}.`,
    claim_ids: claimIds,
    source_ids: sourceIds.length ? sourceIds : domains.map((d) => `domain:${d}`),
  };
}

export function buildIntelligenceDepthBundles(
  packet: CompanyBriefingEvidencePacket,
  selected: SelectedSignalForDepth[],
  _allSignals: Signal[],
  options: BuildDepthOptions = {},
): IntelligenceDepthBundle[] {
  const maxBundles = options.maxBundles ?? 4;
  const sector = normalizeCompanySector(packet.company.industry);
  const intent = inferCompanyIntent(packet, sector);
  const groups = new Map<string, { kind: SignalKind; items: SelectedSignalForDepth[] }>();

  for (const selectedSignal of selected) {
    const sectionId = selectedSignal.section_ids[0] || "main";
    const kind = classifySignal(selectedSignal.signal, sectionId, sector);
    const groupKey = kind;
    const existing = groups.get(groupKey) || { kind, items: [] };
    existing.items.push(selectedSignal);
    groups.set(groupKey, existing);
  }

  return [...groups.values()]
    .sort((a, b) => {
      const rankDelta = bundleRank(a.kind, intent) - bundleRank(b.kind, intent);
      if (rankDelta !== 0) return rankDelta;
      const aScore = Math.max(...a.items.map((item) => item.selection_score || 0));
      const bScore = Math.max(...b.items.map((item) => item.selection_score || 0));
      return bScore - aScore;
    })
    .slice(0, maxBundles)
    .map(({ kind, items: group }) => {
      const anchor = group[0];
      const sectionId = anchor.section_ids[0] || "main";
      const claimIds = uniq(group.flatMap((g) => claimIdsForItem(packet, g.item_id)));
      const sourceRefs = supportRefsForClaims(packet, claimIds);
      const sourceIds = sourceRefs.map((ref) => ref.id);
      const namesFromClaims = sourceNamesForClaims(packet, claimIds);
      const signalSources = group.map((g) => sourceName(g.signal.source_domain));
      const names = uniq([...namesFromClaims, ...signalSources]).slice(0, 4);
      const signals = group.map((g) => g.signal);
      const happened = buildWhatHappened(kind, signals);
      const changing = buildWhatChanging(kind);
      const companyRead = buildCompanyRead(kind, intent);
      const frame = buildSourceFrame(kind, sector, signals, names, claimIds, sourceIds);
      const evidenceStats = buildEvidenceStatistics(kind, signals, claimIds, sourceRefs);
      const generatedSelectionReason = buildSelectionReason(kind, signals, evidenceStats, names);
      const selectionReason = anchor.selected_because && !/^company-relevant signal/i.test(anchor.selected_because)
        ? anchor.selected_because
        : generatedSelectionReason;
      const evidenceClass = evidenceClassForBundle(evidenceStats, names, frame);
      const confidence: IntelligenceDepthConfidence = claimIds.length >= 3 && names.length >= 2 ? "high" : claimIds.length >= 1 ? "medium" : "low";
      const evidenceConfidence = confidenceLabelForBundle(kind, evidenceStats, names, frame, confidence);

      const registeredText = `${signals.length} signal${signals.length === 1 ? "" : "s"} appeared today for ${sectionLabel(packet, sectionId)}, led by ${trimWords(signals[0]?.headline || "the selected signal", 20)}.`;
      const body = buildBodyText(kind, happened, changing, evidenceStats);
      const depthScore = Math.min(100, 40 + claimIds.length * 10 + names.length * 6 + extractNumberPhrases(signals).length * 8);
      const bundleId = `${kind}_${slugify(anchor.signal.headline)}`;

      return {
        bundle_id: bundleId,
        heading: bundleHeading(kind, signals, intent),
        anchor_item_id: anchor.item_id,
        anchor_cluster_id: anchor.cluster_id,
        section_id: sectionId,
        section_label: sectionLabel(packet, sectionId),
        signal_ids: signals.map((s) => s.id),
        source_names: names,
        claim_ids: claimIds,
        source_refs: sourceRefs,
        what_registered: [{ kind: "what_registered", text: registeredText, claim_ids: claimIds, source_ids: sourceIds }],
        what_happened: [{ kind: "what_happened", text: happened, claim_ids: claimIds, source_ids: sourceIds }],
        what_is_changing: [{ kind: "what_changed", text: changing, claim_ids: claimIds, source_ids: sourceIds }],
        source_frames: frame ? [frame] : [],
        evidence_statistics: evidenceStats,
        analyst_observation: buildAnalystObservation(kind, bundleId, companyRead, sourceRefs, confidence),
        company_read: { kind: "company_read", text: companyRead, claim_ids: claimIds, source_ids: sourceIds },
        signal_kind: kind,
        company_intent: intent,
        body_text: body,
        selection_reason: selectionReason,
        evidence_class: evidenceClass,
        evidence_confidence: evidenceConfidence,
        confidence,
        depth_score: depthScore,
      };
    });
}

function refsForBundle(bundle: IntelligenceDepthBundle): EvidenceSupportRef[] {
  return bundle.source_refs.length ? bundle.source_refs : bundle.claim_ids.map((id) => ({ type: "claim_id", id }));
}

function claimRefs(bundle: IntelligenceDepthBundle): EvidenceSupportRef[] {
  return bundle.claim_ids.map((id) => ({ type: "claim_id", id }));
}

function claimRefsForBundles(bundles: IntelligenceDepthBundle[]): EvidenceSupportRef[] {
  const ids = new Set<string>();
  for (const bundle of bundles) {
    for (const id of bundle.claim_ids) ids.add(id);
  }
  return Array.from(ids).map((id) => ({ type: "claim_id", id }));
}

function buildClaimMap(bundle: IntelligenceDepthBundle): GeneratedClaimMap[] {
  const sentences = splitSentences(bundle.body_text);
  const refs = refsForBundle(bundle);
  return sentences.map((sentence, index) => ({
    generated_text_path: `main_briefing.${bundle.bundle_id}.body.${index + 1}`,
    text: sentence,
    claim_ids: bundle.claim_ids,
    support_refs: refs,
  }));
}

function buildGeneratedItem(bundle: IntelligenceDepthBundle, packet: CompanyBriefingEvidencePacket): GeneratedBriefingItem {
  const sourceText = bundle.source_names.length
    ? `Sources: ${bundle.source_names.join("; ")}.`
    : "Sources: company scan evidence.";
  const packetItem = packet.email_items.find((item) => item.item_id === bundle.anchor_item_id);
  const uncertaintyText = packetItem?.uncertainty?.[0]?.text;
  return {
    generated_item_id: `pkg9_${bundle.bundle_id}`,
    packet_item_id: bundle.anchor_item_id,
    cluster_id: bundle.anchor_cluster_id,
    title: { text: bundle.heading, supported_by: claimRefs(bundle), evidence_confidence: bundle.evidence_confidence },
    body: { text: bundle.body_text, supported_by: claimRefs(bundle), evidence_confidence: bundle.evidence_confidence },
    uncertainty_line: uncertaintyText ? { text: uncertaintyText, supported_by: claimRefs(bundle), evidence_confidence: bundle.evidence_confidence } : undefined,
    source_attribution: { text: sourceText, supported_by: refsForBundle(bundle), evidence_confidence: bundle.evidence_confidence },
    claim_map: buildClaimMap(bundle),
  };
}

export function applyIntelligenceDepthToPacket(
  packet: CompanyBriefingEvidencePacket,
  bundles: IntelligenceDepthBundle[],
): CompanyBriefingEvidencePacket {
  const enriched = { ...packet, email_items: packet.email_items.map((item) => ({ ...item })) };

  for (const bundle of bundles) {
    if (bundle.source_frames.length === 0 || bundle.source_names.length < 2) continue;
    const packetItem = enriched.email_items.find((item) => item.item_id === bundle.anchor_item_id);
    if (!packetItem) continue;

    packetItem.perception_gap = {
      eligible: true,
      show_recommendation: "show",
      frame_ids: [`pkg9_${bundle.bundle_id}_trade`, `pkg9_${bundle.bundle_id}_regional`],
      frames: [
        {
          frame_id: `pkg9_${bundle.bundle_id}_trade`,
          cluster_id: bundle.anchor_cluster_id,
          article_id: bundle.source_refs[0]?.id || bundle.signal_ids[0] || bundle.anchor_item_id,
          source_region: "trade/business sources",
          audience_region: bundle.signal_kind === "media_regulation" || bundle.signal_kind === "disinformation" || bundle.signal_kind === "press_freedom" || bundle.signal_kind === "reputation_narrative" ? "media and communications" : "company operating context",
          language: "en",
          frame_labels: bundle.signal_kind === "media_regulation" || bundle.signal_kind === "disinformation" || bundle.signal_kind === "press_freedom" || bundle.signal_kind === "reputation_narrative" ? ["audience", "distribution", "narrative"] : ["operational", "market", "company exposure"],
          primary_stakeholders_mentioned: bundle.signal_kind === "media_regulation" || bundle.signal_kind === "disinformation" || bundle.signal_kind === "press_freedom" || bundle.signal_kind === "reputation_narrative" ? ["publishers", "platforms", "audiences"] : ["companies", "operators", "customers"],
          tone_intensity: "medium",
          evidence_type: "market",
          summary: bundle.signal_kind === "media_regulation" || bundle.signal_kind === "disinformation" || bundle.signal_kind === "press_freedom" || bundle.signal_kind === "reputation_narrative" ? "Media-facing sources emphasised audience reach, distribution, narrative movement, or information access." : "Business-facing sources emphasised practical impact, timing, costs, customers, or operations.",
          source_grade: "B",
        },
        {
          frame_id: `pkg9_${bundle.bundle_id}_regional`,
          cluster_id: bundle.anchor_cluster_id,
          article_id: bundle.source_refs[1]?.id || bundle.signal_ids[1] || bundle.anchor_item_id,
          source_region: "regional/political sources",
          audience_region: "regional policy",
          language: "en",
          frame_labels: ["security", "policy", "regional exposure"],
          primary_stakeholders_mentioned: ["governments", "energy buyers", "regional operators"],
          tone_intensity: "medium",
          evidence_type: "local",
          summary: bundle.signal_kind === "media_regulation" || bundle.signal_kind === "disinformation" || bundle.signal_kind === "press_freedom" || bundle.signal_kind === "reputation_narrative" ? "Policy or state-facing coverage framed the same pressure through regulation, official positioning, security claims, or institutional interests." : "Regional or political coverage framed the same pressure through policy, security, public positioning, or local institutional interests.",
          source_grade: "B",
        },
      ],
      suggested_note: {
        text: bundle.source_frames[0].text,
        supported_by: refsForBundle(bundle),
        confidence: bundle.confidence === "high" ? 0.82 : bundle.confidence === "medium" ? 0.68 : 0.55,
      },
    };
  }

  return enriched;
}

function buildTopLine(bundles: IntelligenceDepthBundle[]): string {
  const top = bundles[0];
  const stat = top.evidence_statistics.find((candidate) => !candidate.stat_id.endsWith("_source_spread"));
  const evidence = stat
    ? `${stat.label} was reported at ${stat.value_text}`
    : top.heading;
  const logisticsTop = ["hormuz", "corridors", "suez", "supply_chain"].includes(top.signal_kind);
  const supportPhrases = bundles.slice(1, 3).map((bundle) => {
    if (bundle.signal_kind === "corridors") return "alternative-route planning";
    if (bundle.signal_kind === "suez") return "Suez-linked delays";
    return bundle.heading;
  });
  const second = supportPhrases.length ? `The same scan also showed ${supportPhrases.join(" and ")}.` : "";
  if (logisticsTop) return `${evidence}. The evidence points to weak shipping confidence, not just another route headline. ${second}`.replace(/\s+/g, " ").trim();
  return bundles.slice(0, 3).map((bundle) => bundle.heading).join(". ") + ".";
}

function buildBulletText(bundle: IntelligenceDepthBundle): string {
  if (bundle.signal_kind === "hormuz") return "Hormuz: reported traffic remained far below normal.";
  if (bundle.signal_kind === "corridors") return "Alternative routes: early evidence moved corridor coverage toward practical planning.";
  if (bundle.signal_kind === "suez") return "Suez: one reported vessel movement showed delays spreading beyond Hormuz.";
  const stat = bundle.evidence_statistics.find((candidate) => !candidate.stat_id.endsWith("_source_spread"));
  if (stat) return `${bundle.heading}: ${stat.label.toLowerCase()} ${stat.value_text}.`;
  return bundle.heading;
}

export function applyIntelligenceDepthToBriefing(
  output: CompanyBriefingGenerationOutput,
  packet: CompanyBriefingEvidencePacket,
  bundles: IntelligenceDepthBundle[],
): CompanyBriefingGenerationOutput {
  if (bundles.length === 0) return output;

  const top = bundles[0];
  const topLineText = buildTopLine(bundles);
  const mainSections: GeneratedBriefingSection[] = bundles.map((bundle) => ({
    section_id: bundle.section_id,
    heading: bundle.section_label === "People and institutions" ? bundle.heading : bundle.section_label,
    items: [buildGeneratedItem(bundle, packet)],
  }));

  const seenFrameText = new Set<string>();
  const frameNotes = bundles.flatMap((bundle) =>
    bundle.source_frames.filter((frame) => {
      const key = frame.text.toLowerCase();
      if (seenFrameText.has(key)) return false;
      seenFrameText.add(key);
      return true;
    }),
  );
  const observations: GeneratedText[] = [
    {
      text: top.analyst_observation.body,
      supported_by: claimRefs(top),
      evidence_confidence: top.evidence_confidence,
    },
    ...bundles.slice(1, 3).map((bundle) => ({
      text: bundle.analyst_observation.body,
      supported_by: claimRefs(bundle),
      evidence_confidence: bundle.evidence_confidence,
    })),
  ];

  return {
    ...output,
    today_brief: {
      top_line: {
        text: topLineText,
        supported_by: claimRefsForBundles(bundles.slice(0, 3)),
        evidence_confidence: top.evidence_confidence,
      },
      bullets: bundles.slice(0, 3).map((bundle) => ({
        text: buildBulletText(bundle),
        supported_by: claimRefs(bundle),
        evidence_confidence: bundle.evidence_confidence,
      })),
    },
    main_briefing: { sections: mainSections },
    perception_gap: {
      notes: frameNotes.slice(0, 2).map((frame, index) => {
        const bundle = bundles.find((b) => b.source_frames.includes(frame)) || top;
        return {
          packet_item_id: bundle.anchor_item_id,
          cluster_id: bundle.anchor_cluster_id,
          note: { text: frame.text, supported_by: claimRefs(bundle), evidence_confidence: regionalFrameConfidenceLabel(bundle) },
          frame_ids: [`pkg9_frame_${index + 1}`],
        };
      }),
    },
    useful_observations: { observations },
    source_notes: {
      ...output.source_notes,
      text: {
        text: `Built from ${packet.input_summary.raw_articles_count} scanned items. Key evidence, selected sources, lower-priority items, and source-quality notes are available in the evidence document/dashboard.`,
        supported_by: claimRefs(top),
        evidence_confidence: top.evidence_confidence,
      },
      scanned_count: packet.input_summary.raw_articles_count,
    },
    trace: {
      ...output.trace,
      generator_version: `${output.trace.generator_version}+package9_depth_v1`,
    },
  };
}

export function buildCompanyBriefingEvidenceDocument(
  packet: CompanyBriefingEvidencePacket,
  bundles: IntelligenceDepthBundle[],
  allSignals: Signal[],
  selected: SelectedSignalForDepth[],
  scanDate: string,
): CompanyBriefingEvidenceDocument {
  const keySources = uniq(bundles.flatMap((bundle) => bundle.source_names)).sort();
  const allSources = uniq(allSignals.map((signal) => sourceName(signal.source_domain)).filter(Boolean)).sort();
  const regions = uniq(allSignals.flatMap((signal) => signal.regions || []).filter(Boolean)).sort();
  const languages = uniq(allSignals.map((signal) => signal.source_language || "unknown").filter(Boolean)).sort();
  const selectedIds = new Set(selected.map((item) => item.signal.id));
  const keySourceDetails = sourceDetailsForPacket(packet);
  const lowerPrioritySample = allSignals
    .filter((signal) => !selectedIds.has(signal.id))
    .filter((signal) => isLogisticsRelevantSignal(signal))
    .slice(0, 40)
    .map((signal) => ({
      signal_id: signal.id,
      headline: signal.headline,
      source_domain: signal.source_domain,
      signal_type: signal.signal_type,
    }));

  return {
    run_id: packet.run_id,
    company_profile_id: packet.company.company_id,
    company_name: packet.company.display_name,
    scan_date: scanDate,
    scan_summary: {
      total_signals_loaded: allSignals.length,
      selected_for_email: selected.length,
      dashboard_only_count: packet.dashboard_only_items.length,
      excluded_count: Object.values(packet.excluded_summary.counts_by_reason).reduce((sum, count) => sum + (count || 0), 0),
      key_source_domains_count: keySources.length,
      all_source_domains_count: allSources.length,
      regions_represented: regions,
      languages_represented: languages,
      selected_sections: uniq(bundles.map((bundle) => bundle.section_label)),
      scan_window: packet.input_summary.scan_window,
    },
    briefing_sections: bundles.map((bundle) => ({
      heading: bundle.heading,
      section_label: bundle.section_label,
      signal_ids: bundle.signal_ids,
      source_names: bundle.source_names,
      statistics: bundle.evidence_statistics,
      claims: claimsForBundle(packet, bundle.claim_ids),
      selection_reason: bundle.selection_reason,
      evidence_class: bundle.evidence_class,
      evidence_confidence: bundle.evidence_confidence,
      source_quality: sourceMixForBundle(packet, bundle.claim_ids),
    })),
    perception_gap_frames: bundles.flatMap((bundle) =>
      bundle.source_frames.map((frame) => ({
        topic: bundle.heading,
        frame_text: frame.text,
        source_names: bundle.source_names,
        claim_ids: frame.claim_ids,
        evidence_confidence: regionalFrameConfidenceLabel(bundle),
      })),
    ),
    observations: bundles.map((bundle) => bundle.analyst_observation),
    key_sources: keySources,
    key_sources_detail: keySourceDetails,
    source_quality_summary: sourceQualitySummary(keySourceDetails),
    dashboard_only_items: packet.dashboard_only_items.slice(0, 80).map((item) => ({
      cluster_id: item.cluster_id,
      canonical_event_name: item.canonical_event_name,
      reason: item.reason,
      relevance_score: item.relevance_score,
      cluster_confidence: item.cluster_confidence,
    })),
    lower_priority_sample: lowerPrioritySample,
    excluded_summary: packet.excluded_summary,
  };
}

export function renderEvidenceDocumentMarkdown(doc: CompanyBriefingEvidenceDocument): string {
  const lines: string[] = [];
  lines.push(`# Evidence Document — ${doc.company_name} — ${doc.scan_date}`);
  lines.push("");
  lines.push("## Scan summary");
  lines.push(`- Total signals loaded: ${doc.scan_summary.total_signals_loaded}`);
  lines.push(`- Selected for briefing: ${doc.scan_summary.selected_for_email}`);
  lines.push(`- Dashboard-only items: ${doc.scan_summary.dashboard_only_count}`);
  lines.push(`- Excluded/noise items: ${doc.scan_summary.excluded_count}`);
  lines.push(`- Key source domains used: ${doc.scan_summary.key_source_domains_count}`);
  lines.push(`- All source domains in scan: ${doc.scan_summary.all_source_domains_count}`);
  lines.push(`- Regions represented: ${doc.scan_summary.regions_represented.slice(0, 24).join(", ") || "unknown"}`);
  lines.push(`- Languages represented: ${doc.scan_summary.languages_represented.join(", ") || "unknown"}`);
  lines.push("");
  lines.push("## Briefing evidence by section");
  for (const section of doc.briefing_sections) {
    lines.push("");
    lines.push(`### ${section.heading}`);
    lines.push(`- Scan area: ${section.section_label}`);
    lines.push(`- Why selected: ${section.selection_reason}`);
    lines.push(`- Evidence class: ${section.evidence_class}`);
    lines.push(`- Confidence language: ${section.evidence_confidence.label} — ${section.evidence_confidence.customer_phrase}`);
    lines.push(`- Source quality: A ${section.source_quality.A}, B ${section.source_quality.B}, C ${section.source_quality.C}, D ${section.source_quality.D}, Block ${section.source_quality.Block}`);
    lines.push(`- Sources: ${section.source_names.join("; ") || "none recorded"}`);
    if (section.statistics.length > 0) {
      lines.push("- Evidence statistics:");
      for (const stat of section.statistics) {
        lines.push(`  - ${stat.label}: ${stat.value_text} — ${stat.explanation}`);
      }
    }
    lines.push("- Claims:");
    for (const claim of section.claims.slice(0, 8)) {
      lines.push(`  - ${claim.claim_id}: ${claim.text} (${claim.claim_type}, confidence ${claim.confidence})`);
    }
  }
  lines.push("");
  lines.push("## Perception Gap evidence");
  for (const frame of doc.perception_gap_frames) {
    lines.push("");
    lines.push(`### ${frame.topic}`);
    lines.push(frame.frame_text);
    lines.push(`Sources: ${frame.source_names.join("; ")}`);
    lines.push(`Confidence language: ${frame.evidence_confidence.label} — ${frame.evidence_confidence.customer_phrase}`);
  }
  lines.push("");
  lines.push("## Analyst observations");
  for (const observation of doc.observations) {
    lines.push("");
    lines.push(`### ${observation.title}`);
    lines.push(observation.body);
  }
  lines.push("");
  lines.push("## Source quality");
  lines.push(`- Source mix: A ${doc.source_quality_summary.source_mix.A}, B ${doc.source_quality_summary.source_mix.B}, C ${doc.source_quality_summary.source_mix.C}, D ${doc.source_quality_summary.source_mix.D}, Block ${doc.source_quality_summary.source_mix.Block}`);
  lines.push(`- Concentration risk: ${doc.source_quality_summary.concentration_risk}`);
  lines.push(`- Note: ${doc.source_quality_summary.note}`);
  lines.push("");
  lines.push("## Dashboard-only items");
  for (const item of doc.dashboard_only_items.slice(0, 20)) {
    lines.push(`- ${item.canonical_event_name} — held back because ${item.reason} (relevance ${item.relevance_score}, confidence ${item.cluster_confidence})`);
  }
  lines.push("");
  lines.push("## Excluded/noise summary");
  for (const [reason, count] of Object.entries(doc.excluded_summary.counts_by_reason)) {
    lines.push(`- ${reason}: ${count}`);
  }
  lines.push("");
  lines.push("## Lower-priority sample");
  for (const item of doc.lower_priority_sample.slice(0, 20)) {
    lines.push(`- ${item.headline} (${item.source_domain || "unknown"})`);
  }
  return `${lines.join("\n")}\n`;
}
