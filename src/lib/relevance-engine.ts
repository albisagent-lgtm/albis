// ---------------------------------------------------------------------------
// Relevance Scoring Engine — Phase 3
// Deterministic scoring of scan items against company profiles.
// No LLM calls. All matching is keyword/overlap based.
// ---------------------------------------------------------------------------

import type { CompanyProfile } from "./company-profile";
import type { CanonicalIndex } from "./canonical-index";
import { emptyCanonicalIndex } from "./canonical-index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MatchReasonType =
  | "geography"
  | "sector"
  | "tracked_theme"
  | "watchlist_entity"
  | "supply_chain"
  | "risk_priority"
  | "urgency"
  | "significance";

export interface MatchReason {
  type: MatchReasonType;
  matched: string[];
  score: number;
  explanation: string;
  /**
   * Canonical topic id when the matched terms in this reason all resolved
   * through the canonical registry (Package 4). Null when the match used
   * raw-string fallback or when matched terms spanned multiple canonicals.
   */
  canonical_topic_id?: string | null;
  /** Display label of the canonical topic (paired with canonical_topic_id). */
  canonical_label?: string | null;
}

export interface ScoredStory {
  headline: string;
  category: string;
  regions: string[];
  tags: string[];
  patterns: string[];
  significance: string;
  connection: string;

  // Sub-scores (0-1)
  geography_score: number;
  sector_score: number;
  theme_score: number;
  entity_score: number;
  supply_chain_score: number;
  risk_score: number;
  urgency_score: number;
  significance_score: number;

  // Final weighted score
  relevance_score: number;

  // Structured why-matched, persisted for audit/coverage and retained for
  // legacy briefing compatibility when needed.
  match_reasons: MatchReason[];

  // Whether selected for briefing
  selected_for_briefing: boolean;
}

export interface ScanItemInput {
  headline: string;
  category: string;
  regions: string[];
  tags: string[];
  patterns: string[];
  significance: string;
  connection: string;
  perception_gap?: number | null;
  coverage_breadth?: number | null;
}

// ---------------------------------------------------------------------------
// Weights (configurable, from spec)
// ---------------------------------------------------------------------------

const WEIGHTS = {
  geography: 0.20,
  sector: 0.20,
  theme: 0.15,
  entity: 0.15,
  supply_chain: 0.10,
  risk: 0.10,
  urgency: 0.05,
  significance: 0.05,
};

// ---------------------------------------------------------------------------
// Category → Sector mapping
// Maps scan item categories to company profile sector IDs.
// A scan category can map to multiple sectors.
// ---------------------------------------------------------------------------

const CATEGORY_TO_SECTORS: Record<string, string[]> = {
  "energy": ["energy-utilities", "mining-resources"],
  "climate-energy": ["energy-utilities", "mining-resources"],
  "economic-flows": ["finance-investment", "logistics-shipping"],
  "markets": ["finance-investment"],
  "tech-ai": ["technology-software"],
  "health": ["pharma-healthcare"],
  "food-agriculture": ["food-agriculture"],
  "food": ["food-agriculture"],
  "water": ["food-agriculture"],
  "conflict": ["government-public", "consulting-advisory", "legal-compliance"],
  "geopolitics": ["government-public", "consulting-advisory", "finance-investment"],
  "governance": ["government-public", "legal-compliance"],
  "current-events": [], // too broad to map
  "cyber-info-warfare": ["technology-software", "media-comms"],
  "information-warfare": ["media-comms", "technology-software"],
  "media-literacy": ["media-comms", "education-research"],
  "migration-demographics": ["government-public"],
  "science-space": ["education-research", "technology-software"],
  "natural-world": ["mining-resources", "food-agriculture"],
  "weather-climate": ["energy-utilities", "food-agriculture", "construction-infra"],
  "grassroots": [],
  "psychology-persuasion": ["media-comms", "consulting-advisory"],
  "culture": ["media-comms", "retail-consumer"],
  "influential-people": [],
  "life-systems": ["pharma-healthcare", "food-agriculture"],
  "breaking": [], // too broad
  "analysis": [],
  "perspectives": [],
  "retail-consumer": ["retail-consumer"],
  "construction-infra": ["construction-infra"],
  "manufacturing": ["manufacturing"],
  "logistics-shipping": ["logistics-shipping"],
};

// ---------------------------------------------------------------------------
// Region mapping
// Maps scan region keys to company profile region IDs.
// Scan regions use different keys than company regions in some cases.
// ---------------------------------------------------------------------------

const SCAN_REGION_TO_COMPANY_REGION: Record<string, string[]> = {
  "south-asia": ["south-asia"],
  "south_asia": ["south-asia"],
  "east-se-asia": ["east-se-asia"],
  "asia_pacific": ["east-se-asia"],
  "middle-east": ["middle-east"],
  "middle_east": ["middle-east"],
  "africa": ["africa"],
  "eastern-europe": ["eastern-europe"],
  "europe": ["western-europe", "eastern-europe"],
  "eu": ["western-europe", "eastern-europe"],
  "western-world": ["western-europe", "north-america"],
  "us": ["north-america"],
  "latin-americas": ["latin-americas"],
  "latam": ["latin-americas"],
  "global": [], // matches everything loosely
  "caribbean": ["caribbean"],
  "central-asia": ["central-asia"],
  "pacific-islands": ["pacific-islands"],
};

// ---------------------------------------------------------------------------
// Scan tags → Risk type mapping
// Maps common scan tags to company risk priority IDs.
// ---------------------------------------------------------------------------

const TAG_TO_RISK: Record<string, string[]> = {
  "supply-chain": ["supply-chain-disruption"],
  "shipping": ["supply-chain-disruption"],
  "port": ["supply-chain-disruption"],
  "logistics": ["supply-chain-disruption"],
  "freight": ["supply-chain-disruption"],
  "shortage": ["supply-chain-disruption"],
  "oil": ["commodity-price-volatility", "energy-price"],
  "gas": ["commodity-price-volatility", "energy-price"],
  "wheat": ["commodity-price-volatility", "food-water-security"],
  "fertiliser": ["commodity-price-volatility", "food-water-security"],
  "fertilizer": ["commodity-price-volatility", "food-water-security"],
  "commodity": ["commodity-price-volatility"],
  "price": ["commodity-price-volatility"],
  "war": ["geopolitical-conflict"],
  "conflict": ["geopolitical-conflict"],
  "military": ["geopolitical-conflict"],
  "crisis": ["geopolitical-conflict"],
  "geopolitics": ["geopolitical-conflict"],
  "invasion": ["geopolitical-conflict"],
  "strikes": ["geopolitical-conflict"],
  "regulation": ["regulatory-policy"],
  "policy": ["regulatory-policy"],
  "law": ["regulatory-policy"],
  "compliance": ["regulatory-policy"],
  "sanctions": ["trade-tariff-sanctions"],
  "tariff": ["trade-tariff-sanctions"],
  "tariffs": ["trade-tariff-sanctions"],
  "trade": ["trade-tariff-sanctions"],
  "export-ban": ["trade-tariff-sanctions"],
  "currency": ["currency-financial"],
  "inflation": ["currency-financial"],
  "interest-rates": ["currency-financial"],
  "bonds": ["currency-financial"],
  "markets": ["currency-financial"],
  "climate": ["climate-environmental"],
  "drought": ["climate-environmental", "food-water-security"],
  "flood": ["climate-environmental"],
  "wildfire": ["climate-environmental"],
  "emissions": ["climate-environmental"],
  "cyber": ["cyber-technology"],
  "hack": ["cyber-technology"],
  "cybersecurity": ["cyber-technology"],
  "data-breach": ["cyber-technology"],
  "deepfake": ["cyber-technology", "reputation-narrative"],
  "ai": ["cyber-technology"],
  "disinformation": ["reputation-narrative"],
  "narrative": ["reputation-narrative"],
  "propaganda": ["reputation-narrative"],
  "energy": ["energy-price"],
  "fuel": ["energy-price"],
  "power": ["energy-price"],
  "electricity": ["energy-price"],
  "food": ["food-water-security"],
  "famine": ["food-water-security"],
  "hunger": ["food-water-security"],
  "water": ["food-water-security"],
  "labour": ["labour-workforce"],
  "labor": ["labour-workforce"],
  "strike": ["labour-workforce"],
  "unemployment": ["labour-workforce"],
  "workforce": ["labour-workforce"],
  "union": ["labour-workforce"],
};

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

/**
 * Compute overlap score between two sets.
 * Returns 0 if either set is empty, otherwise returns |intersection| / |smaller set|.
 * This gives a 1.0 when the smaller set is fully contained in the larger.
 */
function overlapScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map(s => s.toLowerCase()));
  const matches = a.filter(item => setB.has(item.toLowerCase())).length;
  return matches / Math.min(a.length, b.length);
}

/**
 * Fuzzy tag match: checks if any tag in the story contains or is contained by
 * any term in the company list. Handles partial matches like
 * "iran-war" matching "iran" or "shipping-routes" matching "shipping".
 */
function fuzzyTagOverlap(storyTags: string[], companyTerms: string[]): number {
  if (storyTags.length === 0 || companyTerms.length === 0) return 0;

  const normalised = storyTags.map(t => t.toLowerCase());
  let matches = 0;

  for (const term of companyTerms) {
    const lower = term.toLowerCase();
    const found = normalised.some(tag =>
      tag === lower ||
      tag.includes(lower) ||
      lower.includes(tag)
    );
    if (found) matches++;
  }

  return matches / companyTerms.length;
}

/**
 * Sub-scorer result: a numeric score plus the company-side terms that
 * actually contributed to the match. `matched` may be empty when the
 * scorer fired on a non-list signal (e.g. urgency boost from significance).
 *
 * `canonical_topic_ids` runs parallel to `matched` (same length): the
 * canonical_topic_id that resolved each matched term, or null if matching
 * fell back to raw-string overlap (no canonical mapping yet).
 */
interface SubScore {
  score: number;
  matched: string[];
  canonical_topic_ids: (string | null)[];
  canonical_labels: (string | null)[];
}

const EMPTY_SUB_SCORE: SubScore = {
  score: 0,
  matched: [],
  canonical_topic_ids: [],
  canonical_labels: [],
};

function tagFuzzyMatchesAny(storyTagsLower: string[], term: string): boolean {
  if (!term) return false;
  return storyTagsLower.some(
    (tag) => tag === term || tag.includes(term) || term.includes(tag)
  );
}

type CanonicalBucket = Map<string, { canonical_topic_id: string; canonical_label: string; terms: string[] }>;

/**
 * Look up the expanded term set for a company-side value, falling back to
 * just the raw value (lowercased) when no canonical mapping exists.
 */
function expandedTerms(
  companyTerm: string,
  bucket: CanonicalBucket | undefined
): { terms: string[]; canonicalId: string | null; canonicalLabel: string | null } {
  const lower = companyTerm.toLowerCase();
  const entry = bucket?.get(lower);
  if (entry) {
    return {
      terms: entry.terms,
      canonicalId: entry.canonical_topic_id,
      canonicalLabel: entry.canonical_label,
    };
  }
  return { terms: [lower], canonicalId: null, canonicalLabel: null };
}

/**
 * Fuzzy-overlap variant that returns the score, which company terms were
 * responsible, and (when available) their canonical topic ids.
 */
function fuzzyTagOverlapWithMatches(
  storyTags: string[],
  companyTerms: string[],
  bucket?: CanonicalBucket
): SubScore {
  if (storyTags.length === 0 || companyTerms.length === 0) return EMPTY_SUB_SCORE;
  const normalised = storyTags.map((t) => t.toLowerCase());
  const matched: string[] = [];
  const canonicalIds: (string | null)[] = [];
  const canonicalLabels: (string | null)[] = [];
  for (const term of companyTerms) {
    const { terms, canonicalId, canonicalLabel } = expandedTerms(term, bucket);
    if (terms.some((t) => tagFuzzyMatchesAny(normalised, t))) {
      matched.push(term);
      canonicalIds.push(canonicalId);
      canonicalLabels.push(canonicalLabel);
    }
  }
  return {
    score: matched.length / companyTerms.length,
    matched,
    canonical_topic_ids: canonicalIds,
    canonical_labels: canonicalLabels,
  };
}

/**
 * Score geography overlap between a scan item and a company profile.
 * Considers both region-level and country-level matches. Geography uses a
 * fixed scan-region → company-region mapping rather than the canonical
 * alias surface — Package 5/6 may revisit if multilingual region tagging
 * starts arriving on scan_items.
 */
function scoreGeography(
  storyRegions: string[],
  companyRegions: string[],
  companyCountries: string[],
  bucket?: CanonicalBucket
): SubScore {
  if (storyRegions.length === 0) return EMPTY_SUB_SCORE;
  if (companyRegions.length === 0 && companyCountries.length === 0) return EMPTY_SUB_SCORE;

  const mappedScanRegions: string[] = [];
  for (const r of storyRegions) {
    const mapped = SCAN_REGION_TO_COMPANY_REGION[r];
    if (mapped) {
      mappedScanRegions.push(...mapped);
    } else {
      mappedScanRegions.push(r);
    }
  }

  const scanRegionSet = new Set(mappedScanRegions.map((r) => r.toLowerCase()));
  const matched: string[] = [];
  const canonicalIds: (string | null)[] = [];
  const canonicalLabels: (string | null)[] = [];
  for (const r of companyRegions) {
    if (scanRegionSet.has(r.toLowerCase())) {
      matched.push(r);
      const entry = bucket?.get(r.toLowerCase());
      canonicalIds.push(entry?.canonical_topic_id ?? null);
      canonicalLabels.push(entry?.canonical_label ?? null);
    }
  }

  const regionScore = overlapScore(mappedScanRegions, companyRegions);
  return {
    score: Math.min(1, regionScore),
    matched,
    canonical_topic_ids: canonicalIds,
    canonical_labels: canonicalLabels,
  };
}

/**
 * Score sector match between a scan item category and a company sector.
 */
function scoreSector(
  storyCategory: string,
  companySector: string | null,
  bucket?: CanonicalBucket
): SubScore {
  if (!companySector || !storyCategory) return EMPTY_SUB_SCORE;

  const entry = bucket?.get(companySector.toLowerCase());
  const canonicalId = entry?.canonical_topic_id ?? null;
  const canonicalLabel = entry?.canonical_label ?? null;
  const mappedSectors = CATEGORY_TO_SECTORS[storyCategory] || [];
  if (mappedSectors.includes(companySector)) {
    return {
      score: 1.0,
      matched: [companySector],
      canonical_topic_ids: [canonicalId],
      canonical_labels: [canonicalLabel],
    };
  }

  const catLower = storyCategory.toLowerCase();
  const sectorLower = companySector.toLowerCase();
  if (catLower.includes(sectorLower) || sectorLower.includes(catLower)) {
    return {
      score: 0.5,
      matched: [companySector],
      canonical_topic_ids: [canonicalId],
      canonical_labels: [canonicalLabel],
    };
  }

  return EMPTY_SUB_SCORE;
}

/**
 * Score theme match: fuzzy overlap between story tags and company tracked
 * themes, expanded through canonical aliases when available.
 */
function scoreThemes(
  storyTags: string[],
  trackedThemes: string[],
  bucket?: CanonicalBucket
): SubScore {
  return fuzzyTagOverlapWithMatches(storyTags, trackedThemes, bucket);
}

/**
 * Score entity match: fuzzy overlap between story tags/headline and
 * watchlist entities, expanded through canonical aliases when available.
 */
function scoreEntities(
  storyTags: string[],
  storyHeadline: string,
  watchlistEntities: string[],
  bucket?: CanonicalBucket
): SubScore {
  if (watchlistEntities.length === 0) return EMPTY_SUB_SCORE;

  const headlineLower = storyHeadline.toLowerCase();
  const tagsLower = storyTags.map((t) => t.toLowerCase());
  const matched: string[] = [];
  const canonicalIds: (string | null)[] = [];
  const canonicalLabels: (string | null)[] = [];

  for (const entity of watchlistEntities) {
    const { terms, canonicalId, canonicalLabel } = expandedTerms(entity, bucket);
    let hit = false;
    for (const t of terms) {
      if (!t) continue;
      if (headlineLower.includes(t)) { hit = true; break; }
      if (tagsLower.some((tag) => tag === t || tag.includes(t) || t.includes(tag))) {
        hit = true; break;
      }
    }
    if (hit) {
      matched.push(entity);
      canonicalIds.push(canonicalId);
      canonicalLabels.push(canonicalLabel);
    }
  }

  return {
    score: matched.length / watchlistEntities.length,
    matched,
    canonical_topic_ids: canonicalIds,
    canonical_labels: canonicalLabels,
  };
}

/**
 * Score supply chain match: fuzzy overlap between story tags and supply
 * chain exposure, expanded through canonical aliases when available.
 */
function scoreSupplyChain(
  storyTags: string[],
  supplyChainExposure: string[],
  bucket?: CanonicalBucket
): SubScore {
  return fuzzyTagOverlapWithMatches(storyTags, supplyChainExposure, bucket);
}

/**
 * Score risk match: map story tags to risk types and check overlap with company risk priorities.
 */
function scoreRisk(
  storyTags: string[],
  storyCategory: string,
  riskPriorities: string[],
  bucket?: CanonicalBucket
): SubScore {
  if (riskPriorities.length === 0) return EMPTY_SUB_SCORE;

  const storyRisks = new Set<string>();
  for (const tag of storyTags) {
    const risks = TAG_TO_RISK[tag.toLowerCase()];
    if (risks) for (const r of risks) storyRisks.add(r);
  }
  const catRisks = TAG_TO_RISK[storyCategory];
  if (catRisks) for (const r of catRisks) storyRisks.add(r);

  if (storyRisks.size === 0) return EMPTY_SUB_SCORE;

  const matched: string[] = [];
  const canonicalIds: (string | null)[] = [];
  const canonicalLabels: (string | null)[] = [];
  for (const r of riskPriorities) {
    if (storyRisks.has(r)) {
      matched.push(r);
      const entry = bucket?.get(r.toLowerCase());
      canonicalIds.push(entry?.canonical_topic_id ?? null);
      canonicalLabels.push(entry?.canonical_label ?? null);
    }
  }
  return {
    score: matched.length / riskPriorities.length,
    matched,
    canonical_topic_ids: canonicalIds,
    canonical_labels: canonicalLabels,
  };
}

/**
 * Convert significance string to a 0-1 score.
 */
function significanceToScore(significance: string): number {
  switch (significance) {
    case "high": return 1.0;
    case "medium": return 0.6;
    case "low": return 0.3;
    default: return 0.5;
  }
}

/**
 * Urgency boost based on patterns and significance.
 */
function urgencyBoost(patterns: string[], significance: string): number {
  let score = 0;
  if (significance === "high") score += 0.5;
  if (patterns.includes("escalation")) score += 0.3;
  if (patterns.includes("breaking")) score += 0.2;
  if (patterns.includes("framing")) score += 0.1;
  return Math.min(1, score);
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

/**
 * Build the structured why-matched array from sub-score results.
 * Inclusion rule: dimensions with at least one matched term are always
 * included; urgency/significance are included only when the boost is
 * non-trivial (score > 0.3) since they have no list-of-terms to show.
 */
/**
 * Pick a canonical_topic_id + label for a match reason whose underlying
 * SubScore may have multiple matched terms. We collapse to a single id
 * only when every matched term resolved to the same canonical — otherwise
 * null, so the dashboard can render raw matched terms without misleading
 * "alias of" annotations.
 */
function pickReasonCanonical(sub: SubScore): { id: string | null; label: string | null } {
  const ids = sub.canonical_topic_ids.filter((id) => id != null);
  if (ids.length === 0) return { id: null, label: null };
  if (ids.length !== sub.matched.length) return { id: null, label: null };
  const first = ids[0];
  if (!ids.every((id) => id === first)) return { id: null, label: null };
  const label = sub.canonical_labels[0] ?? null;
  return { id: first, label };
}

function buildMatchReasons(opts: {
  geo: SubScore;
  sec: SubScore;
  thm: SubScore;
  ent: SubScore;
  sup: SubScore;
  rsk: SubScore;
  urg: number;
  sig: number;
  significance: string;
  patterns: string[];
}): MatchReason[] {
  const { geo, sec, thm, ent, sup, rsk, urg, sig, significance, patterns } = opts;
  const reasons: MatchReason[] = [];

  if (geo.matched.length > 0) {
    const c = pickReasonCanonical(geo);
    reasons.push({
      type: "geography",
      matched: geo.matched,
      score: geo.score,
      explanation:
        geo.matched.length === 1
          ? "Story regions overlap your operating region"
          : "Story regions overlap your operating regions",
      canonical_topic_id: c.id,
      canonical_label: c.label,
    });
  }
  if (sec.matched.length > 0) {
    const c = pickReasonCanonical(sec);
    reasons.push({
      type: "sector",
      matched: sec.matched,
      score: sec.score,
      explanation: "Story category aligns with your sector",
      canonical_topic_id: c.id,
      canonical_label: c.label,
    });
  }
  if (thm.matched.length > 0) {
    const c = pickReasonCanonical(thm);
    reasons.push({
      type: "tracked_theme",
      matched: thm.matched,
      score: thm.score,
      explanation:
        thm.matched.length === 1
          ? "Matches one of your tracked themes"
          : `Matches ${thm.matched.length} of your tracked themes`,
      canonical_topic_id: c.id,
      canonical_label: c.label,
    });
  }
  if (ent.matched.length > 0) {
    const c = pickReasonCanonical(ent);
    reasons.push({
      type: "watchlist_entity",
      matched: ent.matched,
      score: ent.score,
      explanation:
        ent.matched.length === 1
          ? "Mentions an entity on your watchlist"
          : `Mentions ${ent.matched.length} entities on your watchlist`,
      canonical_topic_id: c.id,
      canonical_label: c.label,
    });
  }
  if (sup.matched.length > 0) {
    const c = pickReasonCanonical(sup);
    reasons.push({
      type: "supply_chain",
      matched: sup.matched,
      score: sup.score,
      explanation: "Touches your supply chain exposure",
      canonical_topic_id: c.id,
      canonical_label: c.label,
    });
  }
  if (rsk.matched.length > 0) {
    const c = pickReasonCanonical(rsk);
    reasons.push({
      type: "risk_priority",
      matched: rsk.matched,
      score: rsk.score,
      explanation:
        rsk.matched.length === 1
          ? "Hits a risk you prioritise"
          : `Hits ${rsk.matched.length} risks you prioritise`,
      canonical_topic_id: c.id,
      canonical_label: c.label,
    });
  }
  if (urg > 0.3) {
    const triggers = ["escalation", "breaking", "framing"].filter((p) => patterns.includes(p));
    if (significance === "high") triggers.unshift("high significance");
    reasons.push({
      type: "urgency",
      matched: triggers,
      score: urg,
      explanation: "Urgency signal in the story itself",
      canonical_topic_id: null,
    });
  }
  if (sig > 0.3) {
    reasons.push({
      type: "significance",
      matched: [significance],
      score: sig,
      explanation: "Story marked as significant by the upstream scan",
      canonical_topic_id: null,
    });
  }

  return reasons;
}

/**
 * Score all scan items against a company profile.
 * Returns scored stories sorted by relevance (highest first).
 *
 * `canonicalIndex` is optional. When provided, the engine matches against
 * the canonical alias surface (Package 4) for any value the index covers
 * and falls back to raw-string overlap for values not yet mapped. Pass
 * `undefined` (or omit) to keep the original raw-only behavior — used in
 * tests and during early rollout before profiles are migrated.
 *
 * TODO(post-rollout): once every existing profile is fully mapped to the
 * canonical registry, the raw-string fallback inside the sub-scorers can
 * be removed and `canonicalIndex` made required.
 */
export function scoreStoriesForCompany(
  items: ScanItemInput[],
  profile: CompanyProfile,
  canonicalIndex?: CanonicalIndex
): ScoredStory[] {
  const idx = canonicalIndex ?? emptyCanonicalIndex();
  const scored: ScoredStory[] = items.map(item => {
    const geo = scoreGeography(item.regions, profile.regions, profile.countries, idx.regions);
    const sec = scoreSector(item.category, profile.sector, idx.sectors);
    const thm = scoreThemes(item.tags, profile.tracked_themes, idx.tracked_themes);
    const ent = scoreEntities(item.tags, item.headline, profile.watchlist_entities, idx.watchlist_entities);
    const sup = scoreSupplyChain(item.tags, profile.supply_chain_exposure, idx.supply_chain_exposure);
    const rsk = scoreRisk(item.tags, item.category, profile.risk_priorities, idx.risk_priorities);
    const urg = urgencyBoost(item.patterns, item.significance);
    const sig = significanceToScore(item.significance);

    const relevance =
      WEIGHTS.geography * geo.score +
      WEIGHTS.sector * sec.score +
      WEIGHTS.theme * thm.score +
      WEIGHTS.entity * ent.score +
      WEIGHTS.supply_chain * sup.score +
      WEIGHTS.risk * rsk.score +
      WEIGHTS.urgency * urg +
      WEIGHTS.significance * sig;

    const match_reasons = buildMatchReasons({
      geo,
      sec,
      thm,
      ent,
      sup,
      rsk,
      urg,
      sig,
      significance: item.significance,
      patterns: item.patterns,
    });

    return {
      headline: item.headline,
      category: item.category,
      regions: item.regions,
      tags: item.tags,
      patterns: item.patterns,
      significance: item.significance,
      connection: item.connection,
      geography_score: geo.score,
      sector_score: sec.score,
      theme_score: thm.score,
      entity_score: ent.score,
      supply_chain_score: sup.score,
      risk_score: rsk.score,
      urgency_score: urg,
      significance_score: sig,
      relevance_score: relevance,
      match_reasons,
      selected_for_briefing: false,
    };
  });

  // Sort by relevance score descending
  scored.sort((a, b) => b.relevance_score - a.relevance_score);

  // Select top 5-8 stories for the briefing
  // Use 5 as minimum, up to 8 if scores are close
  const MIN_STORIES = 5;
  const MAX_STORIES = 8;
  const SCORE_THRESHOLD = 0.05; // minimum relevance to be considered

  let selectedCount = Math.min(MIN_STORIES, scored.length);
  // Extend to up to MAX_STORIES if the next story is close in score to the last selected
  for (let i = selectedCount; i < Math.min(MAX_STORIES, scored.length); i++) {
    if (scored[i].relevance_score >= SCORE_THRESHOLD &&
        scored[i].relevance_score >= scored[selectedCount - 1].relevance_score * 0.7) {
      selectedCount = i + 1;
    } else {
      break;
    }
  }

  for (let i = 0; i < selectedCount; i++) {
    if (scored[i].relevance_score >= SCORE_THRESHOLD) {
      scored[i].selected_for_briefing = true;
    }
  }

  return scored;
}

/**
 * Get only the stories selected for the briefing.
 */
export function getSelectedStories(scored: ScoredStory[]): ScoredStory[] {
  return scored.filter(s => s.selected_for_briefing);
}

/**
 * Determine overall signal level for the briefing based on top story scores.
 */
export function determineSignalLevel(selected: ScoredStory[]): "low" | "moderate" | "elevated" | "high" {
  if (selected.length === 0) return "low";
  const avgRelevance = selected.reduce((sum, s) => sum + s.relevance_score, 0) / selected.length;
  const hasHighSignificance = selected.some(s => s.significance === "high");
  const hasUrgent = selected.some(s => s.urgency_score > 0.5);

  if (avgRelevance > 0.4 && hasHighSignificance && hasUrgent) return "high";
  if (avgRelevance > 0.3 || hasHighSignificance) return "elevated";
  if (avgRelevance > 0.15) return "moderate";
  return "low";
}
