// ---------------------------------------------------------------------------
// Relevance Scoring Engine — Phase 3
// Deterministic scoring of scan items against company profiles.
// No LLM calls. All matching is keyword/overlap based.
// ---------------------------------------------------------------------------

import type { CompanyProfile } from "./company-profile";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
 * Score geography overlap between a scan item and a company profile.
 * Considers both region-level and country-level matches.
 */
function scoreGeography(
  storyRegions: string[],
  companyRegions: string[],
  companyCountries: string[]
): number {
  if (storyRegions.length === 0) return 0;
  if (companyRegions.length === 0 && companyCountries.length === 0) return 0;

  // Map scan regions to company region keys
  const mappedScanRegions: string[] = [];
  for (const r of storyRegions) {
    const mapped = SCAN_REGION_TO_COMPANY_REGION[r];
    if (mapped) {
      mappedScanRegions.push(...mapped);
    } else {
      mappedScanRegions.push(r);
    }
  }

  // Region-level overlap
  const regionScore = overlapScore(mappedScanRegions, companyRegions);

  // Country-level: check if story tags/regions mention any country slugs
  // This is a weaker signal since scan items use region keys not country slugs,
  // but some tags do contain country names
  // For now, region score is the primary geography signal
  return Math.min(1, regionScore);
}

/**
 * Score sector match between a scan item category and a company sector.
 */
function scoreSector(storyCategory: string, companySector: string | null): number {
  if (!companySector || !storyCategory) return 0;

  // Direct category match
  const mappedSectors = CATEGORY_TO_SECTORS[storyCategory] || [];
  if (mappedSectors.includes(companySector)) return 1.0;

  // Check if the category name partially matches the sector
  const catLower = storyCategory.toLowerCase();
  const sectorLower = companySector.toLowerCase();
  if (catLower.includes(sectorLower) || sectorLower.includes(catLower)) return 0.5;

  return 0;
}

/**
 * Score theme match: fuzzy overlap between story tags and company tracked themes.
 */
function scoreThemes(storyTags: string[], trackedThemes: string[]): number {
  return fuzzyTagOverlap(storyTags, trackedThemes);
}

/**
 * Score entity match: fuzzy overlap between story tags/headline and watchlist entities.
 */
function scoreEntities(
  storyTags: string[],
  storyHeadline: string,
  watchlistEntities: string[]
): number {
  if (watchlistEntities.length === 0) return 0;

  const headlineLower = storyHeadline.toLowerCase();
  const tagsLower = storyTags.map(t => t.toLowerCase());
  let matches = 0;

  for (const entity of watchlistEntities) {
    const lower = entity.toLowerCase();
    // Check headline
    if (headlineLower.includes(lower)) {
      matches++;
      continue;
    }
    // Check tags
    if (tagsLower.some(tag => tag === lower || tag.includes(lower) || lower.includes(tag))) {
      matches++;
    }
  }

  return matches / watchlistEntities.length;
}

/**
 * Score supply chain match: fuzzy overlap between story tags and supply chain exposure terms.
 */
function scoreSupplyChain(storyTags: string[], supplyChainExposure: string[]): number {
  return fuzzyTagOverlap(storyTags, supplyChainExposure);
}

/**
 * Score risk match: map story tags to risk types and check overlap with company risk priorities.
 */
function scoreRisk(storyTags: string[], storyCategory: string, riskPriorities: string[]): number {
  if (riskPriorities.length === 0) return 0;

  // Collect all risk types implied by the story
  const storyRisks = new Set<string>();
  for (const tag of storyTags) {
    const risks = TAG_TO_RISK[tag.toLowerCase()];
    if (risks) {
      for (const r of risks) storyRisks.add(r);
    }
  }
  // Also check category
  const catRisks = TAG_TO_RISK[storyCategory];
  if (catRisks) {
    for (const r of catRisks) storyRisks.add(r);
  }

  if (storyRisks.size === 0) return 0;

  const matches = riskPriorities.filter(r => storyRisks.has(r)).length;
  return matches / riskPriorities.length;
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
 * Score all scan items against a company profile.
 * Returns scored stories sorted by relevance (highest first).
 */
export function scoreStoriesForCompany(
  items: ScanItemInput[],
  profile: CompanyProfile
): ScoredStory[] {
  const scored: ScoredStory[] = items.map(item => {
    const geo = scoreGeography(item.regions, profile.regions, profile.countries);
    const sec = scoreSector(item.category, profile.sector);
    const thm = scoreThemes(item.tags, profile.tracked_themes);
    const ent = scoreEntities(item.tags, item.headline, profile.watchlist_entities);
    const sup = scoreSupplyChain(item.tags, profile.supply_chain_exposure);
    const rsk = scoreRisk(item.tags, item.category, profile.risk_priorities);
    const urg = urgencyBoost(item.patterns, item.significance);
    const sig = significanceToScore(item.significance);

    const relevance =
      WEIGHTS.geography * geo +
      WEIGHTS.sector * sec +
      WEIGHTS.theme * thm +
      WEIGHTS.entity * ent +
      WEIGHTS.supply_chain * sup +
      WEIGHTS.risk * rsk +
      WEIGHTS.urgency * urg +
      WEIGHTS.significance * sig;

    return {
      headline: item.headline,
      category: item.category,
      regions: item.regions,
      tags: item.tags,
      patterns: item.patterns,
      significance: item.significance,
      connection: item.connection,
      geography_score: geo,
      sector_score: sec,
      theme_score: thm,
      entity_score: ent,
      supply_chain_score: sup,
      risk_score: rsk,
      urgency_score: urg,
      significance_score: sig,
      relevance_score: relevance,
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
