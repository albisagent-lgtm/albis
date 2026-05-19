// ---------------------------------------------------------------------------
// Company Package 8 real-data pipeline adapter.
//
// Converts real company_profile + typed signals into the Package 8 evidence
// packet, v2 briefing content, HTML preview, and QA report. This module has
// no side effects: it does not send email and does not write DB rows. Callers
// decide whether to persist preview rows behind explicit env gates.
// ---------------------------------------------------------------------------

import { adaptSignalToScoringInput } from "../scoring-adapters";
import { scoreStoriesForCompany } from "../relevance-engine";
import {
  loadCanonicalIndexForProfile,
  emptyCanonicalIndex,
} from "../canonical-index";
import { RISK_PRIORITIES } from "../company-profile";
import {
  COMPANY_REGIONS,
  SUPPLY_CHAIN_CATALOG,
  THEME_CATALOG,
  WATCHLIST_CATALOG,
} from "../onboarding-taxonomy";
import { buildEvidencePacket } from "./briefing-evidence-packet";
import { generateCompanyBriefing } from "./company-briefing-generator";
import { runQAGates } from "./company-briefing-qa";
import { editCompanyBriefingForReadability } from "./company-briefing-editor";
import {
  generateCompanyBriefingHtmlV2,
  generateBriefingSubjectV2,
} from "../email-templates/company-briefing-v2";
import { runCompanyDeepDiveRetrieval } from "./company-deep-dive-retrieval";
import {
  emptyDedupeSummary,
  evaluateDedupe,
  loadCompanySentScanHistory,
  recordDedupeBlock,
  type DedupeSummary,
  type SentScanHistoryItem,
} from "./company-scan-dedupe";
import { evaluateSourceHygiene } from "./company-source-hygiene";
import { applyScannerReportLayout } from "./company-scanner-report";
import {
  applyIntelligenceDepthToBriefing,
  applyIntelligenceDepthToPacket,
  buildCompanyBriefingEvidenceDocument,
  buildIntelligenceDepthBundles,
  type SelectedSignalForDepth,
} from "./intelligence-depth";
import { buildResearchedUnderstandingLayer } from "./researched-understanding";
import { applyGoldStandardEditorialWriter } from "./company-gold-standard-editorial-writer";
import {
  runCompanyDailyLearningPass2,
  type Pass2Result,
} from "./company-daily-learning";

export interface CompanyPackage8PipelineOptions {
  scanDate: string;
  lookbackHours?: number;
  dryRun?: boolean;
  dashboardLink?: string;
  maxItems?: number;
  enableHistoryDedupe?: boolean;
  dedupeHistoryDays?: number;
  enableDeepDiveRetrieval?: boolean;
  log?: (message: string) => void;
}

export interface CompanyPackage8PipelineResult {
  run_id: string;
  scan_date: string;
  lookback_hours: number;
  company_profile: any;
  signals_loaded: number;
  selected_count: number;
  selected_signals: any[];
  package8_generation_wired_for_dry_run: boolean;
  package8_llm_enrichment_wired: boolean;
  package8_note: string;
  briefing_content: any;
  draft_briefing_content?: any;
  generation_metadata: any;
  intelligence_depth_bundles?: any[];
  evidence_document?: any;
  deep_dive_retrieval?: any;
  dedupe_summary?: DedupeSummary;
  editor_pass?: any;
  pass2_learning?: Pass2Result;
  qa_report: any;
  dry_run_metadata: any;
  email: { subject: string; html: string };
  evidence_packet: any;
}

function slugify(s: string): string {
  return (
    String(s || "item")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normaliseTerm(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textMatchesTerm(text: string, term: string): boolean {
  const t = normaliseTerm(term);
  if (!t || t.length < 2) return false;
  if (t.length <= 3)
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(t)}([^a-z0-9]|$)`, "i").test(
      text,
    );
  return text.includes(t);
}

function sourceDisplay(domain: string | null | undefined): string {
  if (!domain) return "Unknown source";
  return domain.replace(/^www\./, "");
}

function sourceGrade(domain: string | null | undefined): "A" | "B" | "C" {
  const d = String(domain || "").toLowerCase();
  if (
    /(reuters|apnews|associatedpress|bbc|ft\.com|financialtimes|bloomberg|wsj|nytimes|guardian|aljazeera|nikkei|scmp|straitstimes)/.test(
      d,
    )
  )
    return "A";
  if (
    /(lloydslist|maritime|shipping|freight|port|journal|trade|business|economist|forbes|cnbc|dw|france24|arabnews|thenationalnews)/.test(
      d,
    )
  )
    return "B";
  return "B";
}

function sourceType(domain: string | null | undefined): string {
  const d = String(domain || "").toLowerCase();
  if (/(reuters|apnews|associatedpress|bbc|bloomberg)/.test(d)) return "wire";
  if (/(lloydslist|maritime|shipping|freight|port|trade)/.test(d))
    return "trade";
  return "major_outlet";
}

function signalActionClass(signalType: string): string {
  const map: Record<string, string> = {
    regulatory: "regulatory_action",
    policy: "policy_change",
    disruption: "supply_chain_disruption",
    market: "market_move",
    statement: "company_statement",
    announcement: "company_statement",
    other: "other",
  };
  return map[signalType] || "other";
}

function signalStatus(headline: string, signalType: string): string {
  const h = headline.toLowerCase();
  if (/propos|plan|may |could |consider/.test(h)) return "proposed";
  if (/alleg|claim/.test(h)) return "alleged";
  if (/warn|develop|ongoing|clash|strike|attack|disrupt|delay|block/.test(h))
    return "developing";
  if (/announce|confirm|approve|sign|launch/.test(h)) return "confirmed";
  if (signalType === "statement") return "reported";
  return "reported";
}

function cleanOneSentenceFact(signal: any): string {
  const raw = String(signal.summary || signal.headline || "")
    .replace(/\s+/g, " ")
    .trim();
  const withoutEllipses = raw.replace(/\.{2,}/g, ",").replace(/[!?]+/g, ",");
  const firstSentence = withoutEllipses.split(/\.\s+/)[0] || withoutEllipses;
  const cleaned = firstSentence
    .replace(/\s+,/g, ",")
    .replace(/,+/g, ",")
    .replace(/[.;:,\s]+$/g, "")
    .trim();
  const fallback = String(signal.headline || "Signal reported")
    .replace(/[.!?]+/g, "")
    .trim();
  const words = (cleaned || fallback).split(/\s+/).filter(Boolean);
  return words.length > 34
    ? `${words.slice(0, 34).join(" ")}`
    : words.join(" ");
}

function categoryForArea(value: string): string {
  const v = value.toLowerCase();
  if (
    /(media|press|journalis|publish|broadcast|content|platform|audience|disinformation|misinformation|narrative|reputation)/.test(
      v,
    )
  )
    return "media_comms";
  if (/(cyber|technology|ai|software|data|platform)/.test(v))
    return "technology";
  if (/(route|freight|port|container|suez|red|hormuz|block|supply)/.test(v))
    return "supply_chain";
  if (/(geopolitic|conflict|sanction|tariff|trade)/.test(v))
    return "geopolitics";
  if (/(climate|environment|weather)/.test(v)) return "climate";
  return "custom";
}

function sectorKey(profile: any): string {
  const value = String(profile.sector || profile.industry || "").toLowerCase();
  if (
    /media|comms|communications|publishing|broadcast|news|journalism|content/.test(
      value,
    )
  )
    return "media_comms";
  if (
    /logistics|shipping|maritime|freight|port|supply-chain|transport/.test(
      value,
    )
  )
    return "logistics_shipping";
  if (/tech|software|ai|cyber|platform|telecom|semiconductor/.test(value))
    return "technology";
  if (/energy|oil|gas|lng|power|utility/.test(value)) return "energy";
  if (/finance|bank|market|investment|insurance/.test(value))
    return "finance_markets";
  if (/agriculture|food|farm|grocery/.test(value)) return "agriculture_food";
  return "default";
}

function isSectorMismatchedArea(value: string, profile: any): boolean {
  const sector = sectorKey(profile);
  const category = categoryForArea(value);
  if (sector === "media_comms") {
    return (
      category === "supply_chain" &&
      !/(media|press|platform|audience|information|narrative|disinformation|sanction|censor|access)/i.test(
        value,
      )
    );
  }
  return false;
}

const themeByValue = new Map(
  THEME_CATALOG.map((option) => [option.value, option]),
);
const supplyByValue = new Map(
  SUPPLY_CHAIN_CATALOG.map((option) => [option.value, option]),
);
const watchlistByValue = new Map(
  WATCHLIST_CATALOG.map((option) => [option.value, option]),
);
const riskByValue: Map<string, (typeof RISK_PRIORITIES)[number]> = new Map(
  RISK_PRIORITIES.map((option) => [option.id, option]),
);
const regionByValue: Map<string, (typeof COMPANY_REGIONS)[number]> = new Map(
  COMPANY_REGIONS.map((option) => [option.id, option]),
);

function displayLabel(
  value: string,
  kind: "theme" | "risk" | "supply" | "watchlist" | "region" = "theme",
): string {
  const raw = String(value || "").trim();
  if (!raw) return "General";
  const option =
    kind === "theme"
      ? themeByValue.get(raw)
      : kind === "risk"
        ? riskByValue.get(raw)
        : kind === "supply"
          ? supplyByValue.get(raw)
          : kind === "watchlist"
            ? watchlistByValue.get(raw)
            : regionByValue.get(raw);
  return (
    option?.label ||
    raw.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function scanKeywords(
  value: string,
  kind: "theme" | "risk" | "supply" | "watchlist",
): string[] {
  const raw = String(value || "").trim();
  const label = displayLabel(raw, kind);
  const option =
    kind === "theme"
      ? themeByValue.get(raw)
      : kind === "supply"
        ? supplyByValue.get(raw)
        : kind === "watchlist"
          ? watchlistByValue.get(raw)
          : null;
  const tags = option && "scanTags" in option ? option.scanTags || [] : [];
  const riskExpansions: Record<string, string[]> = {
    "supply-chain-disruption": [
      "supply chain",
      "shortage",
      "disruption",
      "logistics",
      "shipping",
    ],
    "commodity-price-volatility": [
      "commodity",
      "price",
      "market",
      "volatility",
      "input cost",
    ],
    "geopolitical-conflict": [
      "geopolitics",
      "conflict",
      "war",
      "sanctions",
      "military",
    ],
    "regulatory-policy": [
      "regulation",
      "policy",
      "law",
      "compliance",
      "government",
    ],
    "trade-tariff-sanctions": [
      "trade",
      "tariff",
      "sanctions",
      "export control",
      "import restriction",
    ],
    "currency-financial": [
      "currency",
      "financial market",
      "rates",
      "capital",
      "banking",
    ],
    "climate-environmental": [
      "climate",
      "weather",
      "environment",
      "flood",
      "drought",
    ],
    "cyber-technology": [
      "cyber",
      "technology",
      "AI",
      "data breach",
      "platform",
    ],
    "reputation-narrative": [
      "reputation",
      "narrative",
      "media",
      "misinformation",
      "public trust",
    ],
    "energy-price": ["energy", "oil", "gas", "power", "fuel"],
    "food-water-security": [
      "food security",
      "water",
      "famine",
      "agriculture",
      "supply",
    ],
    "labour-workforce": [
      "labour",
      "workforce",
      "strike",
      "employment",
      "wages",
    ],
  };
  return uniq(
    [
      raw,
      label,
      ...tags,
      ...(kind === "risk" ? riskExpansions[raw] || [] : []),
    ].map(normaliseTerm),
  );
}

export function profileToPackage8Profile(profile: any) {
  const tracked = Array.isArray(profile.tracked_themes)
    ? profile.tracked_themes
    : [];
  const risks = Array.isArray(profile.risk_priorities)
    ? profile.risk_priorities
    : [];
  const exposures = Array.isArray(profile.supply_chain_exposure)
    ? profile.supply_chain_exposure
    : [];
  const regions = Array.isArray(profile.regions) ? profile.regions : [];
  const countries = Array.isArray(profile.countries) ? profile.countries : [];
  const regionLabels = regions.map((region: string) =>
    displayLabel(region, "region"),
  );
  const selected = [...tracked, ...risks]
    .filter((value: string) => !isSectorMismatchedArea(value, profile))
    .map((value: string) => ({
      area_id: slugify(value),
      label: tracked.includes(value)
        ? displayLabel(value, "theme")
        : displayLabel(value, "risk"),
      category: categoryForArea(value),
      priority: tracked.includes(value) ? "high" : "medium",
      regions,
      countries,
      keywords: uniq(
        [
          ...scanKeywords(value, tracked.includes(value) ? "theme" : "risk"),
          ...regionLabels,
          ...countries,
        ].map(normaliseTerm),
      ),
      description: `Company-selected ${tracked.includes(value) ? "topic" : "risk priority"}: ${tracked.includes(value) ? displayLabel(value, "theme") : displayLabel(value, "risk")}`,
    }));

  for (const value of exposures) {
    if (!value || isSectorMismatchedArea(value, profile)) continue;
    const areaId = slugify(value);
    if (selected.some((area: any) => area.area_id === areaId)) continue;
    selected.push({
      area_id: areaId,
      label: displayLabel(value, "supply"),
      category: "supply_chain",
      priority: "high",
      regions,
      countries,
      keywords: uniq(
        [
          ...scanKeywords(value, "supply"),
          "supply chain",
          "input cost",
          "availability",
          ...regionLabels,
          ...countries,
        ].map(normaliseTerm),
      ),
      description: `Company-selected supply-chain exposure: ${displayLabel(value, "supply")}`,
    });
  }

  if (
    (profile.watchlist_entities || []).length > 0 &&
    !selected.some((area: any) => area.area_id === "watchlist-entities")
  ) {
    selected.push({
      area_id: "watchlist-entities",
      label: "Tracked Entities",
      category: "watchlist",
      priority: "medium",
      regions,
      countries,
      keywords: uniq(
        (profile.watchlist_entities || []).flatMap((entity: string) =>
          scanKeywords(entity, "watchlist"),
        ),
      ),
      description:
        "Company-selected people, places, organisations, or terms to monitor.",
    });
  }

  return {
    company_id: profile.id,
    display_name: profile.company_name,
    industry: profile.sector || "Company",
    sub_industries: [profile.sub_sector].filter(Boolean),
    operating_regions: regions,
    operating_region_labels: regionLabels,
    customer_regions: countries,
    supplier_regions: profile.supply_chain_exposure || [],
    regulatory_regions: countries,
    selected_scan_areas: selected.length
      ? selected
      : [
          {
            area_id: "general",
            label: "General",
            category: "custom",
            priority: "medium",
          },
        ],
    watch_entities: (profile.watchlist_entities || []).map((name: string) => ({
      entity_id: slugify(name),
      name: displayLabel(name, "watchlist"),
      type: "other",
    })),
    risk_priorities: risks,
    materiality_notes: "Real Test Company profile from company_profiles.",
  };
}

function matchSectionIds(scored: any, p8Profile: any, signal?: any): string[] {
  const traceAreaIds = Array.isArray(signal?.company_retrieval?.scan_area_ids)
    ? signal.company_retrieval.scan_area_ids
    : [];
  const validTraceAreas = traceAreaIds.filter(
    (id: string) =>
      id !== "watchlist-entities" &&
      !id.startsWith("intent-") &&
      p8Profile.selected_scan_areas.some((a: any) => a.area_id === id),
  );
  if (validTraceAreas.length) return validTraceAreas.slice(0, 2);

  const hay = normaliseTerm(
    `${scored.headline} ${scored.category} ${scored.connection} ${(scored.tags || []).join(" ")} ${(scored.match_reasons || []).flatMap((r: any) => r.matched || []).join(" ")}`,
  );
  const matches = p8Profile.selected_scan_areas
    .filter(
      (a: any) =>
        textMatchesTerm(hay, a.label) ||
        textMatchesTerm(hay, a.area_id.replace(/-/g, " ")) ||
        (a.keywords || []).some((k: string) => textMatchesTerm(hay, k)),
    )
    .map((a: any) => a.area_id);
  if (matches.length) {
    const uniqueMatches = uniq<string>(matches);
    return uniqueMatches
      .sort(
        (a, b) =>
          (a === "watchlist-entities" ? 1 : 0) -
          (b === "watchlist-entities" ? 1 : 0),
      )
      .slice(0, 3);
  }
  const bestReason = (scored.match_reasons || []).find(
    (r: any) =>
      r.type === "tracked_theme" ||
      r.type === "risk_priority" ||
      r.type === "supply_chain",
  );
  if (bestReason?.matched?.[0]) {
    const id = slugify(bestReason.matched[0]);
    if (p8Profile.selected_scan_areas.some((a: any) => a.area_id === id))
      return [id];
  }
  return [p8Profile.selected_scan_areas[0].area_id];
}

function retrievalProvenance(signal: any) {
  const trace = signal.company_retrieval;
  if (!trace) return undefined;
  return {
    mode: trace.mode,
    company_profile_id: trace.company_profile_id,
    company_name: trace.company_name,
    intent: trace.intent,
    query_ids: Array.isArray(trace.query_ids) ? trace.query_ids : [],
    query_labels: Array.isArray(trace.query_labels) ? trace.query_labels : [],
    scan_area_ids: Array.isArray(trace.scan_area_ids)
      ? trace.scan_area_ids
      : [],
    retrieval_reasons: Array.isArray(trace.retrieval_reasons)
      ? trace.retrieval_reasons
      : [],
    matched_query_terms: Array.isArray(trace.matched_query_terms)
      ? trace.matched_query_terms
      : [],
    matched_context_terms: Array.isArray(trace.matched_context_terms)
      ? trace.matched_context_terms
      : [],
    parent_signal_ids: Array.isArray(trace.parent_signal_ids)
      ? trace.parent_signal_ids
      : undefined,
    parent_headlines: Array.isArray(trace.parent_headlines)
      ? trace.parent_headlines
      : undefined,
  };
}

function sourceAccess(
  domain: string | null | undefined,
): "open" | "paywalled" | "blocked" {
  const d = String(domain || "")
    .toLowerCase()
    .replace(/^www\./, "");
  if (!d) return "blocked";
  if (
    /(bloomberg\.com|ft\.com|financialtimes\.com|wsj\.com|nytimes\.com|economist\.com|heavyliftpfi\.com|lloydslist\.com|tradewindsnews\.com|theinformation\.com|politico\.com\/pro)/.test(
      d,
    )
  )
    return "paywalled";
  if (
    /(pravda|marketbeat|koimoi|tipranks|stocktitan|markets\.businessinsider|travelandtourworld|knowerx|jagranjosh|prnewswire|globenewswire|businesswire|townhall|themountainpress|ibtimes|openthemagazine|pjmedia|businessstory|economictimes\.indiatimes|timesofindia\.indiatimes)/.test(
      d,
    )
  )
    return "blocked";
  return "open";
}

function sourceAllowed(domain: string | null | undefined): boolean {
  // V1 email rule: visible findings must use open, direct source links.
  // Paywalled sources can remain useful for discovery/source-trail evidence,
  // but they should not be promoted as customer email links.
  return sourceAccess(domain) === "open";
}

function profileKeywordScore(signal: any, profile: any): number {
  const text = normaliseTerm(
    `${signal.headline} ${signal.summary} ${(signal.themes || []).join(" ")} ${(signal.entities || []).join(" ")} ${(signal.regions || []).join(" ")}`,
  );
  const sector = sectorKey(profile);
  const retrievalTrace = signal.company_retrieval;
  const expandedRiskTerms = (profile.risk_priorities || []).flatMap(
    (term: string) => {
      const t = normaliseTerm(term);
      if (t === "geopolitical conflict")
        return [
          "war",
          "conflict",
          "ceasefire",
          "military",
          "missile",
          "sanctions",
        ];
      if (t === "reputation narrative")
        return [
          "narrative",
          "reputation",
          "misinformation",
          "disinformation",
          "propaganda",
        ];
      if (t === "cyber technology")
        return [
          "cyber",
          "hack",
          "data breach",
          "platform",
          "ai",
          "artificial intelligence",
        ];
      if (t === "regulatory policy")
        return ["regulation", "policy", "censorship", "ban", "law"];
      if (t === "trade tariff sanctions")
        return ["sanction", "tariff", "trade restriction", "export control"];
      return [];
    },
  );
  const topicTerms = uniq(
    [
      ...(profile.tracked_themes || []),
      ...(profile.risk_priorities || []),
      ...(profile.supply_chain_exposure || []),
      ...expandedRiskTerms,
    ].map(normaliseTerm),
  );
  const entityTerms = uniq(
    [...(profile.watchlist_entities || [])].map(normaliseTerm),
  );
  const broadEntities = new Set([
    "united states",
    "european union",
    "china",
    "russia",
    "india",
    "united kingdom",
    "uk",
    "korea",
    "iran",
  ]);
  let score = 0;
  let topicMatched = false;
  let specificEntityMatched = false;
  let broadEntityMatched = false;
  for (const term of topicTerms) {
    if (!textMatchesTerm(text, term)) continue;
    topicMatched = true;
    score += term.includes(" ") ? 3 : 2;
  }
  for (const term of entityTerms) {
    if (!textMatchesTerm(text, term)) continue;
    if (broadEntities.has(term)) {
      broadEntityMatched = true;
      score += 0.5;
    } else {
      specificEntityMatched = true;
      score += term.includes(" ") ? 1.5 : 1;
    }
  }
  if (sector === "media_comms") {
    const mediaContext =
      /\b(media|press|journalis|publish|broadcast|platform|audience|disinformation|misinformation|propaganda|narrative|censor|ai|artificial intelligence|cyber|deepfake|information warfare|election|sanction|war|conflict|ceasefire|official|state media)\b/i.test(
        text,
      );
    if (!topicMatched && !specificEntityMatched) return 0;
    if (broadEntityMatched && !topicMatched && !mediaContext) return 0;
  }
  if (
    (retrievalTrace?.mode === "company_specific_retrieval" ||
      retrievalTrace?.mode === "company_deep_dive_retrieval") &&
    retrievalTrace.company_profile_id === profile.id
  ) {
    const labels = Array.isArray(retrievalTrace.query_labels)
      ? retrievalTrace.query_labels
      : [];
    const contexts = Array.isArray(retrievalTrace.matched_context_terms)
      ? retrievalTrace.matched_context_terms
      : [];
    score += Math.min(5, Math.max(2, labels.length + contexts.length));
    topicMatched = true;
  }
  return score;
}

function companyRetrievalTraceAllowed(
  signal: any,
  profile: any,
  companySpecificInput: boolean,
): boolean {
  if (!companySpecificInput) return true;
  const trace = signal.company_retrieval;
  if (
    !trace ||
    (trace.mode !== "company_specific_retrieval" &&
      trace.mode !== "company_deep_dive_retrieval")
  )
    return false;
  if (trace.company_profile_id !== profile.id) return false;
  const queryLabels = Array.isArray(trace.query_labels)
    ? trace.query_labels
    : [];
  const scanAreaIds = Array.isArray(trace.scan_area_ids)
    ? trace.scan_area_ids
    : [];
  const matchedContext = Array.isArray(trace.matched_context_terms)
    ? trace.matched_context_terms
    : [];
  const matchedQueryTerms = Array.isArray(trace.matched_query_terms)
    ? trace.matched_query_terms
    : [];
  const watchlistOnly =
    scanAreaIds.length > 0 &&
    scanAreaIds.every((id: string) => id === "watchlist-entities");
  if (watchlistOnly && matchedQueryTerms.length === 0) return false;
  return (
    (queryLabels.length > 0 || scanAreaIds.length > 0) &&
    matchedContext.length > 0
  );
}

function sectorSignalAllowed(signal: any, profile: any): boolean {
  const sector = sectorKey(profile);
  const text =
    `${signal.headline || ""} ${signal.summary || ""} ${(signal.themes || []).join(" ")}`.toLowerCase();
  if (sector === "media_comms") {
    const operationalLogistics =
      /\b(hormuz shipping|shipping traffic|freight rates?|vessel availability|sailors? stuck|tanker|port congestion|container|maritime|lng cargo|shipping route|shipping routes|transport corridor|trade corridor|freight corridor)\b/i.test(
        text,
      );
    const mediaOrNarrativeUse =
      /\b(media|press|journalist|publisher|broadcast|platform|audience|disinformation|misinformation|propaganda|narrative|reputation|censor|information access|sanction|sanctioned|state media|kremlin|pyongyang|tehran)\b/i.test(
        text,
      );
    if (operationalLogistics && !mediaOrNarrativeUse) return false;
  }
  return true;
}

function refreshEditedClaimMaps(output: any): any {
  const refreshed = { ...output };
  refreshed.main_briefing = {
    ...output.main_briefing,
    sections: (output.main_briefing?.sections || []).map((section: any) => ({
      ...section,
      items: (section.items || []).map((item: any) => {
        const bodyText = item.body?.text || "";
        const sentences = bodyText
          .split(/(?<=[.!?])\s+/)
          .map((sentence: string) => sentence.trim())
          .filter(Boolean);
        const bodyRefs = item.body?.supported_by || [];
        const claimIds = bodyRefs
          .filter((ref: any) => ref.type === "claim_id")
          .map((ref: any) => ref.id);
        const supportRefs = item.source_attribution?.supported_by?.length
          ? item.source_attribution.supported_by
          : bodyRefs;
        return {
          ...item,
          claim_map: sentences.map((sentence: string, index: number) => ({
            generated_text_path: `main_briefing.${item.generated_item_id}.body.${index + 1}`,
            text: sentence,
            claim_ids: claimIds,
            support_refs: supportRefs,
          })),
        };
      }),
    })),
  };
  return refreshed;
}

function selectionReasonForSignal(
  signal: any,
  scored: any,
  sectionIds: string[],
  p8Profile: any,
): string {
  const text = `${signal.headline} ${signal.summary}`.toLowerCase();
  const sections = sectionIds
    .map(
      (id: string) =>
        p8Profile.selected_scan_areas.find((a: any) => a.area_id === id)
          ?.label || id,
    )
    .join(", ");
  const sector = String(p8Profile.industry || "").toLowerCase();
  const trace = signal.company_retrieval;
  if (
    trace?.mode === "company_specific_retrieval" ||
    trace?.mode === "company_deep_dive_retrieval"
  ) {
    const labels = Array.isArray(trace.query_labels)
      ? trace.query_labels.slice(0, 3).join(", ")
      : "company retrieval plan";
    return `retrieved by company-specific scan plan (${labels}) and matched to ${sections}`;
  }
  if (/logistics|shipping|maritime|freight|transport/.test(sector)) {
    if (/hormuz|strait of hormuz/.test(text))
      return `chokepoint route-confidence signal matched to ${sections}`;
    if (/suez|red sea|bab el-mandeb/.test(text))
      return `connected chokepoint signal matched to ${sections}`;
    if (
      /corridor|morocco|egypt|alternative route|alternative corridor/.test(text)
    )
      return `alternative-route planning signal matched to ${sections}`;
    if (/\$|cost|loss|freight|rail|port disruption|container/.test(text))
      return `concrete transport-cost or disruption signal matched to ${sections}`;
  }
  return `company-relevant signal matched to ${sections} with relevance score ${Math.round(Number(scored.relevance_score || 0))}`;
}

function enrichSignal(signal: any, scored: any, keywordScore: number) {
  const relevance = Math.max(
    0,
    Math.min(1, (Number(scored.relevance_score || 0) + keywordScore * 8) / 100),
  );
  const directness = Math.min(1, keywordScore / 8);
  const urgency = Math.max(
    Number(signal.urgency || 0),
    Math.min(
      1,
      0.42 +
        relevance * 0.28 +
        directness * 0.22 +
        Number(scored.urgency_score || 0) * 0.08,
    ),
  );
  const significance = Math.max(
    Number(signal.significance || 0),
    Math.min(
      1,
      0.42 +
        relevance * 0.24 +
        directness * 0.26 +
        Number(scored.significance_score || 0) * 0.08,
    ),
  );
  const themes = uniq([
    ...(signal.themes || []),
    ...(scored.tags || []),
    ...(scored.match_reasons || []).flatMap((r: any) => r.matched || []),
  ]).slice(0, 12);
  return {
    urgency: Number(urgency.toFixed(2)),
    significance: Number(significance.toFixed(2)),
    themes,
    keyword_match_score: keywordScore,
    enrichment_method: "package8_dry_run_relevance_enrichment_v1",
    llm_enrichment: false,
    note: "Derived from real signal metadata + deterministic company relevance scores. This is not an LLM call.",
  };
}

function buildNormalizedArticle(
  signal: any,
  runId: string,
  articleId: string,
  enrichment: any,
) {
  const domain = signal.source_domain || "unknown";
  const factText = cleanOneSentenceFact(signal);
  const grade = sourceGrade(domain);
  const stype = sourceType(domain);
  const now = new Date().toISOString();
  const claimId = `claim_${articleId}`;
  return {
    article_id: articleId,
    ingest_run_id: runId,
    urls: {
      raw_url: signal.source_url || "",
      fetched_url: signal.source_url || null,
      canonical_url: signal.source_url || null,
      url_hash: slugify(signal.source_url || signal.headline),
      domain,
    },
    source: {
      source_id: `domain:${domain}`,
      display_name: sourceDisplay(domain),
      domain,
      source_type: stype,
      source_quality_grade: grade,
      home_region: signal.source_region || null,
      source_region: signal.source_region || null,
      audience_region: null,
    },
    article_meta: {
      title_raw: signal.headline,
      title_normalized: signal.headline,
      language: signal.source_language || "en",
      translated_from: null,
      author: { type: "unknown", confidence: 0.3 },
      published_at: signal.signal_date
        ? `${signal.signal_date}T00:00:00Z`
        : signal.created_at,
      updated_at: null,
      retrieved_at: signal.created_at || now,
      dateline: null,
    },
    quality: {
      seo_sludge_score: 5,
      article_quality_score: grade === "A" ? 88 : 78,
      evidence_action:
        grade === "A" || grade === "B" ? "email_anchor" : "email_support",
      email_evidence_eligible: true,
      extraction_confidence: 0.72,
      prompt_injection_flags: [],
      quality_flags: ["real_db_signal", enrichment.enrichment_method],
    },
    syndication: {
      is_syndicated: false,
      original_source_id: null,
      original_article_id: null,
      canonical_wire: null,
      syndication_confidence: 0,
      evidence: [],
    },
    normalized_content: {
      summary_1_sentence: factText,
      factual_claims: [
        {
          claim_id: claimId,
          article_id: articleId,
          text: factText,
          claim_type: "fact",
          entities: signal.entities || [],
          confidence: 0.72,
          requires_attribution: true,
          uncertainty_flags: [],
        },
      ],
      quotes: [],
      entities: [...(signal.entities || []), ...(signal.regions || [])].map(
        (name: string) => ({
          name,
          type: "other",
          role: "mentioned",
          confidence: 0.6,
        }),
      ),
      topics: enrichment.themes,
      region_scope: signal.regions || [],
      raw_text_ref: `signals:${signal.id}`,
    },
    event_extraction: {
      event_tuples: [],
      primary_event_tuple_id: null,
      event_extraction_notes: [
        "Adapted from real typed signal for Package 8 dry-run verification.",
      ],
    },
    dedupe_features: {
      normalized_title_tokens: signal.headline
        .toLowerCase()
        .split(/\W+/)
        .filter(Boolean),
      title_fingerprint: slugify(signal.headline),
      entity_key: (signal.entities || []).join("|") || "unknown",
      time_bucket: signal.signal_date,
      place_key: (signal.regions || []).join("|") || null,
      action_key: signal.signal_type || "other",
    },
    processing: {
      status: "normalized",
      block_reason: null,
      created_at: now,
      updated_at: now,
      schema_version: "normalized_article_v1",
    },
  };
}

function buildCluster(
  signal: any,
  scored: any,
  articleId: string,
  enrichment: any,
  runId: string,
) {
  const clusterId = `real_${signal.id}`;
  const factText = cleanOneSentenceFact(signal);
  const status = signalStatus(signal.headline, signal.signal_type);
  const claimId = `claim_${articleId}`;
  const regions = signal.regions?.length
    ? signal.regions
    : [signal.source_region].filter(Boolean);
  return {
    cluster_id: clusterId,
    schema_version: "event_cluster_v1",
    created_at: signal.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ingest_run_ids: [runId],
    canonical_event_name: signal.headline,
    canonical_event_slug: slugify(signal.headline),
    primary_event_tuple: {
      event_tuple_id: `tuple_${signal.id}`,
      article_id: articleId,
      actor: {
        name: signal.entities?.[0] || sourceDisplay(signal.source_domain),
        type: "org",
      },
      action: {
        raw: signal.signal_type || "reported",
        lemma: signal.signal_type || "report",
        action_class: signalActionClass(signal.signal_type),
      },
      object: { name: signal.headline, type: "other" },
      affected_entities: (signal.entities || [])
        .slice(1, 4)
        .map((name: string) => ({ name, type: "other" })),
      place: regions.map((name: string) => ({ name, type: "region" })),
      event_time: {
        date: signal.signal_date || signal.created_at?.slice(0, 10),
        granularity: "day",
      },
      status,
      confidence: 0.72,
      support_claim_ids: [claimId],
    },
    related_event_tuples: [],
    status,
    freshness: "today",
    articles: {
      article_ids: [articleId],
      anchor_article_id: articleId,
      supporting_article_ids: [],
      duplicate_article_ids: [],
      syndicated_article_ids: [],
      excluded_article_ids: [],
    },
    source_mix: {
      counts_by_grade: {
        A: sourceGrade(signal.source_domain) === "A" ? 1 : 0,
        B: sourceGrade(signal.source_domain) === "B" ? 1 : 0,
        C: 0,
        D: 0,
        Block: 0,
      },
      counts_by_type: { [sourceType(signal.source_domain)]: 1 },
      independent_source_count: 1,
      syndicated_copy_count: 0,
      official_source_present: false,
      anchor_source_grade: sourceGrade(signal.source_domain),
    },
    geography_language: {
      event_places: regions,
      regions_represented: regions,
      source_regions_represented: [signal.source_region].filter(Boolean),
      audience_regions_represented: [],
      languages_represented: [signal.source_language || "en"],
    },
    facts: [
      {
        cluster_fact_id: `${claimId}_headline`,
        text: cleanOneSentenceFact({ ...signal, summary: signal.headline }),
        normalized_claim_type: "core_event",
        supported_by_claim_ids: [`${claimId}_headline`],
        supported_by_article_ids: [articleId],
        source_grades: [sourceGrade(signal.source_domain)],
        requires_attribution: true,
        confidence: 0.74,
        uncertainty_flags: status === "developing" ? ["developing"] : [],
      },
      {
        cluster_fact_id: `${claimId}_summary`,
        text: factText,
        normalized_claim_type: "core_event",
        supported_by_claim_ids: [`${claimId}_summary`],
        supported_by_article_ids: [articleId],
        source_grades: [sourceGrade(signal.source_domain)],
        requires_attribution: true,
        confidence: 0.72,
        uncertainty_flags: status === "developing" ? ["developing"] : [],
      },
    ],
    conflicts: [],
    frames: [],
    confidence: {
      cluster_confidence: 0.72,
      dedupe_confidence: 0.65,
      factual_confidence: 0.72,
      independence_confidence: 0.6,
      extraction_confidence: 0.72,
      confidence_label: "medium",
    },
    decision_trace: {
      merge_method: ["validator"],
      reason_codes: [
        "real_signal_single_article_cluster",
        enrichment.enrichment_method,
      ],
      thresholds_hit: { relevance_score: scored.relevance_score },
      split_warnings: [],
      review_required: false,
    },
    downstream: {
      candidate_for_relevance_scoring: true,
      dashboard_safe: true,
      email_eligible_by_cluster_quality: true,
      blockers: [],
    },
  };
}

function buildDecision(
  signal: any,
  scored: any,
  sectionIds: string[],
  p8Profile: any,
  enrichment: any,
  scanDate: string,
) {
  const relevanceScore = Math.round(
    Math.max(0, Math.min(100, Number(scored.relevance_score || 0))),
  );
  const materiality = Math.max(8, Math.round(relevanceScore * 0.2));
  return {
    cluster_id: `real_${signal.id}`,
    decision: "email",
    company_relevance_score: relevanceScore,
    dimension_scores: {
      selected_area_fit: Math.round((scored.theme_score || 0) * 20) || 8,
      entity_proximity: Math.round((scored.entity_score || 0) * 10),
      business_materiality: materiality,
      geography_fit: Math.round((scored.geography_score || 0) * 10),
      timeliness: 8,
      specificity: 6,
      actionability: Math.max(4, Math.round(relevanceScore * 0.08)),
      evidence_strength: 6,
      novelty: 4,
    },
    matched_scan_areas: sectionIds.map((id: string) => {
      const area = p8Profile.selected_scan_areas.find(
        (a: any) => a.area_id === id,
      );
      return {
        area_id: id,
        match_strength:
          relevanceScore >= 70
            ? "strong"
            : relevanceScore >= 45
              ? "medium"
              : "weak",
        match_type: ["topic_semantic"],
        evidence: enrichment.themes.slice(0, 5),
        explanation: `Matched through real signal tags/match reasons for ${area?.label || id}.`,
      };
    }),
    materiality: {
      score: materiality,
      categories: sectionIds.map(
        (id: string) =>
          p8Profile.selected_scan_areas.find((a: any) => a.area_id === id)
            ?.category || "custom",
      ),
      impact_pathways: [
        {
          category: "company_watch_area",
          pathway: `Potential relevance to monitored company scan areas: ${sectionIds.map((id: string) => p8Profile.selected_scan_areas.find((a: any) => a.area_id === id)?.label || id).join(", ")}.`,
          supported_by: [`claim_art_${signal.id}`],
          confidence: 0.62,
        },
      ],
    },
    geography: {
      affected_regions: signal.regions || [],
      source_regions: [signal.source_region].filter(Boolean),
      company_relevant_regions: p8Profile.operating_regions || [],
      geography_fit_score: Math.round((scored.geography_score || 0) * 10),
      geography_reason: signal.regions?.length
        ? `Signal regions: ${signal.regions.join(", ")}`
        : "No explicit region metadata in signal.",
    },
    time: {
      published_window: "last_24h",
      first_seen_at: signal.created_at || `${scanDate}T00:00:00Z`,
      last_seen_at: signal.created_at || `${scanDate}T23:59:59Z`,
      freshness: "today",
    },
    novelty: {
      seen_before: false,
      novelty_score: 4,
      novelty_reason: "Fresh signal from current 24h scan window.",
    },
    weak_match: {
      flag: relevanceScore < 40,
      reasons: relevanceScore < 40 ? ["low relevance score"] : [],
    },
    decision_reasons: [
      ...(scored.match_reasons || []).map(
        (r: any) => `${r.type}:${(r.matched || []).join("|")}`,
      ),
      ...(signal.company_retrieval?.mode === "company_specific_retrieval" ||
      signal.company_retrieval?.mode === "company_deep_dive_retrieval"
        ? [
            `${signal.company_retrieval.mode}:${(signal.company_retrieval.query_labels || []).join("|")}`,
          ]
        : []),
    ].slice(0, 8),
    confidence_notes: [enrichment.enrichment_method],
  };
}

export async function runCompanyPackage8PipelineForProfile(
  supabase: any,
  profile: any,
  signals: any[],
  options: CompanyPackage8PipelineOptions,
): Promise<CompanyPackage8PipelineResult> {
  const scanDate = options.scanDate;
  const lookbackHours = options.lookbackHours ?? 24;
  const profileRetrievalText = `${profile.company_name || ""} ${profile.sector || ""} ${profile.sub_sector || ""} ${(profile.tracked_themes || []).join(" ")} ${(profile.risk_priorities || []).join(" ")} ${(profile.watchlist_entities || []).join(" ")} ${(profile.supply_chain_exposure || []).join(" ")}`.toLowerCase();
  const needsWiderCompanyScan = /(logistics|shipping|freight|supply|route|hormuz|deepfake|artificial intelligence|public memory|identity|records)/.test(profileRetrievalText);
  const maxItems = options.maxItems ?? Number(process.env.COMPANY_PACKAGE8_MAX_ITEMS || (needsWiderCompanyScan ? 64 : 40));
  const enableHistoryDedupe = options.enableHistoryDedupe ?? true;
  const endTs = new Date(`${scanDate}T23:59:59Z`).toISOString();
  const startTs = new Date(
    new Date(`${scanDate}T00:00:00Z`).getTime() -
      lookbackHours * 60 * 60 * 1000,
  ).toISOString();

  let sentHistory: SentScanHistoryItem[] = [];
  let dedupeSummary = emptyDedupeSummary();
  if (enableHistoryDedupe) {
    try {
      sentHistory = await loadCompanySentScanHistory(
        supabase,
        profile.id,
        scanDate,
        {
          days: options.dedupeHistoryDays,
        },
      );
      dedupeSummary = emptyDedupeSummary(sentHistory.length);
      options.log?.(
        `  ↳ loaded ${sentHistory.length} prior visible scan item(s) for no-repeat checks`,
      );
    } catch (err) {
      options.log?.(
        `  ↳ no-repeat history unavailable: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  let canonicalIndex;
  try {
    canonicalIndex = await loadCanonicalIndexForProfile(supabase, profile.id);
  } catch {
    canonicalIndex = emptyCanonicalIndex();
  }

  const selectCandidates = (inputSignals: any[]) => {
    const adapted = (inputSignals || []).map((s: any) =>
      adaptSignalToScoringInput(s),
    );
    const scored = scoreStoriesForCompany(adapted, profile, canonicalIndex);
    const companySpecificInput = (inputSignals || []).some(
      (signal: any) =>
        signal.company_retrieval?.mode === "company_specific_retrieval" ||
        signal.company_retrieval?.mode === "company_deep_dive_retrieval",
    );

    return (inputSignals || [])
      .map((signal: any, idx: number) => {
        const st = scored[idx];
        const keywordScore = profileKeywordScore(signal, profile);
        const sourceOk = sourceAllowed(signal.source_domain);
        const hygieneDecision = evaluateSourceHygiene({
          domain: signal.source_domain,
          url: signal.source_url,
          title: signal.headline,
          summary: signal.summary,
        });
        const sectorOk = sectorSignalAllowed(signal, profile);
        const traceOk = companyRetrievalTraceAllowed(
          signal,
          profile,
          companySpecificInput,
        );
        const dedupeDecision = evaluateDedupe(
          {
            source_url: signal.source_url,
            headline: signal.headline,
            summary: signal.summary,
            cluster_id: `real_${signal.id}`,
          },
          sentHistory,
        );
        if (!dedupeDecision.allowed) {
          recordDedupeBlock(dedupeSummary, dedupeDecision);
        }
        const retrievalBonus = companySpecificInput && traceOk ? 25 : 0;
        const deepDiveBonus =
          signal.company_retrieval?.mode === "company_deep_dive_retrieval"
            ? 8
            : 0;
        return {
          signal,
          scored: st,
          keywordScore,
          sourceOk,
          hygieneDecision,
          sectorOk,
          traceOk,
          dedupeDecision,
          package8SelectionScore:
            keywordScore * 10 +
            Number(st?.relevance_score || 0) +
            retrievalBonus +
            deepDiveBonus,
        };
      })
      .filter(
        (p: any) =>
          p.scored &&
          p.sourceOk &&
          p.hygieneDecision.emailVisibleAllowed &&
          p.sectorOk &&
          p.traceOk &&
          p.dedupeDecision.allowed &&
          p.keywordScore >= 2,
      )
      .sort(
        (a: any, b: any) => b.package8SelectionScore - a.package8SelectionScore,
      )
      .slice(0, maxItems);
  };

  let workingSignals = signals || [];
  let candidates = selectCandidates(workingSignals);
  let deepDiveRetrieval: any = null;

  if (options.enableDeepDiveRetrieval && candidates.length > 0) {
    const needsWiderDeepDive = needsWiderCompanyScan;
    const deepDive = await runCompanyDeepDiveRetrieval(
      supabase,
      profile,
      candidates.map((candidate: any) => candidate.signal),
      {
        signalDate: scanDate,
        log: options.log,
        maxCandidates: Math.min(needsWiderDeepDive ? 7 : 5, candidates.length),
        maxQueries: needsWiderDeepDive ? 20 : 12,
      },
    );
    deepDiveRetrieval = {
      queries: deepDive.queries,
      articles_retrieved: deepDive.articles_retrieved,
      signals_added: deepDive.signals.length,
      sources_consulted: deepDive.sources_consulted,
    };
    if (deepDive.signals.length > 0) {
      const seen = new Set(
        workingSignals.map(
          (signal: any) =>
            signal.source_url || `${signal.headline}:${signal.source_domain}`,
        ),
      );
      const additions = deepDive.signals.filter((signal: any) => {
        const key =
          signal.source_url || `${signal.headline}:${signal.source_domain}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      workingSignals = [...workingSignals, ...additions];
      candidates = selectCandidates(workingSignals);
    }
  }

  const p8Profile = profileToPackage8Profile(profile);
  const runId = `company_pkg8_${scanDate}_${profile.id}`;
  const clusters = [];
  const normalizedArticles = [];
  const emailItems = [];
  const enrichedSignals = [];
  const selectedForDepth: SelectedSignalForDepth[] = [];

  for (const { signal, scored, keywordScore } of candidates) {
    const articleId = `art_${signal.id}`;
    const enrichment = enrichSignal(signal, scored, keywordScore);
    const sectionIds = matchSectionIds(scored, p8Profile, signal);
    const cluster = buildCluster(signal, scored, articleId, enrichment, runId);
    const article = buildNormalizedArticle(
      signal,
      runId,
      articleId,
      enrichment,
    );
    const decision = buildDecision(
      signal,
      scored,
      sectionIds,
      p8Profile,
      enrichment,
      scanDate,
    );
    clusters.push(cluster);
    normalizedArticles.push(article);
    selectedForDepth.push({
      signal,
      item_id: `item_${signal.id}`,
      cluster_id: cluster.cluster_id,
      section_ids: sectionIds,
      selection_score: keywordScore * 10 + Number(scored.relevance_score || 0),
      keyword_match_score: keywordScore,
      selected_because: selectionReasonForSignal(
        signal,
        scored,
        sectionIds,
        p8Profile,
      ),
    });
    emailItems.push({
      item_id: `item_${signal.id}`,
      cluster_id: cluster.cluster_id,
      section_ids: sectionIds,
      title: signal.headline,
      canonical_event_name: signal.headline,
      short_summary_facts: [cleanOneSentenceFact(signal)],
      why_it_matters: {
        text: `This matters for ${profile.company_name} because it falls under monitored themes: ${sectionIds.map((id: string) => p8Profile.selected_scan_areas.find((a: any) => a.area_id === id)?.label || id).join(", ")}.`,
        supported_by: [
          `claim_${articleId}`,
          ...sectionIds.map((id: string) => `scan_area:${id}`),
        ],
      },
      uncertainty:
        cluster.status === "developing"
          ? ["This is a developing signal and details may change."]
          : [],
      relevance_decision: decision,
      source_summary: {
        anchor: {
          source: sourceDisplay(signal.source_domain),
          grade: sourceGrade(signal.source_domain),
          url: signal.source_url || "",
          article_id: articleId,
        },
        supporting: [],
      },
      retrieval_provenance: retrievalProvenance(signal),
    });
    enrichedSignals.push({
      id: signal.id,
      headline: signal.headline,
      source_domain: signal.source_domain,
      relevance_score: scored.relevance_score,
      package8_selection_score:
        keywordScore * 10 + Number(scored.relevance_score || 0),
      keyword_match_score: keywordScore,
      company_retrieval: signal.company_retrieval || null,
      original_urgency: signal.urgency,
      original_significance: signal.significance,
      enriched_urgency: enrichment.urgency,
      enriched_significance: enrichment.significance,
      enriched_themes: enrichment.themes,
      match_reasons: scored.match_reasons,
      llm_enrichment: false,
    });
  }

  const sectionIdsWithItems = new Set(
    emailItems.flatMap((i: any) => i.section_ids),
  );
  const noFindings = p8Profile.selected_scan_areas
    .filter((area: any) => !sectionIdsWithItems.has(area.area_id))
    .map((area: any) => ({
      section_id: area.area_id,
      label: area.label,
      scan_coverage_count: workingSignals?.length || 0,
      no_material_findings: true,
      top_excluded_reasons: [],
      email_line_allowed: true,
      suggested_email_line: `${area.label} was scanned in this window, but no separate direct item was clear enough for the main email.`,
    }));

  const relevanceResult: any = {
    company_id: profile.id,
    run_id: runId,
    created_at: new Date().toISOString(),
    email_items: emailItems,
    dashboard_items: [],
    excluded_items: [],
    section_no_findings: noFindings,
    perception_gap_decisions: [],
  };

  const packet = buildEvidencePacket({
    profile: p8Profile as any,
    relevanceResult,
    clusters: clusters as any,
    perceptionGapDecisions: [],
    normalizedArticles: normalizedArticles as any,
    run_id: runId,
    scan_window: { from: startTs, to: endTs },
    raw_articles_count: workingSignals?.length || 0,
    normalized_articles_count: normalizedArticles.length,
  });

  // Production generation remains behind the adapter boundary. Until the
  // internal OpenClaw generation writer is plugged in, this path uses the
  // deterministic Package 8 generator and marks itself as dry-run/preview.
  const evidenceDashboardLink =
    options.dashboardLink ||
    (options.dryRun
      ? undefined
      : `https://www.albis.news/dashboard/company/${profile.id}/briefings/${scanDate}/evidence`);
  const generation = generateCompanyBriefing(packet, {
    dryRun: true,
    dashboardLink: evidenceDashboardLink,
  });
  const intelligence_depth_bundles = buildIntelligenceDepthBundles(
    packet,
    selectedForDepth,
    workingSignals || [],
  );
  const depthPacket = applyIntelligenceDepthToPacket(
    packet,
    intelligence_depth_bundles,
  );
  const evidenceDocument = buildCompanyBriefingEvidenceDocument(
    depthPacket,
    intelligence_depth_bundles,
    workingSignals || [],
    selectedForDepth,
    scanDate,
  );
  const depthOutput = applyIntelligenceDepthToBriefing(
    generation.output,
    depthPacket,
    intelligence_depth_bundles,
  );
  const researchedUnderstanding = await buildResearchedUnderstandingLayer({
    packet: depthPacket,
    profile,
    scanDate,
    selected: selectedForDepth,
    signals: workingSignals || [],
    bundles: intelligence_depth_bundles,
    maxClusters: Number(process.env.COMPANY_RESEARCH_MAX_CLUSTERS || (needsWiderCompanyScan ? 32 : 20)),
  });
  const understoodOutput = {
    ...depthOutput,
    understanding: {
      ...(depthOutput.understanding || {}),
      researched_understanding_v1: researchedUnderstanding,
    },
  };
  const draftOutput = applyScannerReportLayout({
    output: understoodOutput,
    packet: depthPacket,
    selected: selectedForDepth,
    bundles: intelligence_depth_bundles,
  });

  // Company Daily Scan V1 must be written by the gold-standard editorial
  // writer pass — the same process used for the approved Lindell Media test.
  // If the writer is not configured or the response is too thin, QA holds.
  const goldWriterResult = await applyGoldStandardEditorialWriter({
    packet: depthPacket,
    output: draftOutput,
  });
  const editorResult = goldWriterResult.edit_report.enabled
    ? goldWriterResult
    : await editCompanyBriefingForReadability({
        packet: depthPacket,
        output: draftOutput,
        mode: "premium_readability",
      });
  const finalOutput = refreshEditedClaimMaps(editorResult.output);
  const qa = runQAGates(depthPacket, finalOutput, {
    dryRun: true,
    editorPass: editorResult.edit_report,
  });
  const subject = generateBriefingSubjectV2(
    profile.company_name,
    scanDate,
    finalOutput.today_brief?.top_line?.text,
  );
  const pass2Learning = (process.env.COMPANY_PASS2_LEARNING_ENABLED === "1" || process.env.COMPANY_INTELLIGENCE_WIKI_ENABLED === "1")
    ? runCompanyDailyLearningPass2({
        profile,
        scanDate,
        evidencePacket: depthPacket,
        briefingContent: finalOutput,
        researchedUnderstanding,
        selectedSignals: enrichedSignals,
        deepDiveRetrieval,
      })
    : undefined;
  const outputWithLearning = pass2Learning?.customer_safe_report_insights.length
    ? {
        ...finalOutput,
        scanner_report: finalOutput.scanner_report
          ? {
              ...finalOutput.scanner_report,
              learning_insights: pass2Learning.customer_safe_report_insights,
            }
          : finalOutput.scanner_report,
        understanding: {
          ...(finalOutput.understanding || {}),
          company_daily_learning_v1: {
            learning_id: pass2Learning.daily_learning.learning_id,
            customer_safe_insights: pass2Learning.customer_safe_report_insights,
          },
        },
      }
    : finalOutput;
  const html = generateCompanyBriefingHtmlV2(
    outputWithLearning,
    profile.company_name,
    scanDate,
  );

  return {
    run_id: runId,
    scan_date: scanDate,
    lookback_hours: lookbackHours,
    company_profile: profile,
    signals_loaded: workingSignals?.length || 0,
    selected_count: candidates.length,
    selected_signals: enrichedSignals,
    package8_generation_wired_for_dry_run: true,
    package8_llm_enrichment_wired: false,
    package8_note:
      "Package 8 evidence packet, deterministic generator, and QA gates against real DB signals. No email send occurs here.",
    briefing_content: outputWithLearning,
    draft_briefing_content: draftOutput,
    generation_metadata: generation.metadata,
    intelligence_depth_bundles,
    evidence_document: evidenceDocument,
    deep_dive_retrieval: deepDiveRetrieval,
    dedupe_summary: dedupeSummary,
    editor_pass: editorResult.edit_report,
    pass2_learning: pass2Learning,
    qa_report: qa.report,
    dry_run_metadata: qa.dryRunMetadata,
    email: { subject, html },
    evidence_packet: depthPacket,
  };
}
