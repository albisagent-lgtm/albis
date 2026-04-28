// ---------------------------------------------------------------------------
// Source quality scoring — Package 8A.
//
// Scores a source (by domain/metadata) on accountability, reliability,
// role strength, and regional protection. Produces a 0–100 score and
// A/B/C/D/Block grade.
//
// V1 uses deterministic heuristics and a small known-source registry.
// Future versions may incorporate learned reputation scores.
// ---------------------------------------------------------------------------
import type {
  QualityGrade,
  SourceType,
  SourceQualityRecord,
  HardBlockReason,
} from "./types";

// ---------------------------------------------------------------------------
// Known-source registry (V1 bootstrap)
// ---------------------------------------------------------------------------
interface KnownSourceEntry {
  domain: string;
  display_name: string;
  source_type: SourceType;
  grade_hint: QualityGrade;
  home_region?: string;
  known_wire_partner?: boolean;
}

const KNOWN_A_SOURCES: KnownSourceEntry[] = [
  { domain: "reuters.com", display_name: "Reuters", source_type: "wire", grade_hint: "A" },
  { domain: "apnews.com", display_name: "AP News", source_type: "wire", grade_hint: "A" },
  { domain: "bbc.com", display_name: "BBC", source_type: "major_outlet", grade_hint: "A", home_region: "UK" },
  { domain: "bbc.co.uk", display_name: "BBC", source_type: "major_outlet", grade_hint: "A", home_region: "UK" },
  { domain: "bloomberg.com", display_name: "Bloomberg", source_type: "major_outlet", grade_hint: "A" },
  { domain: "ft.com", display_name: "Financial Times", source_type: "major_outlet", grade_hint: "A", home_region: "UK" },
  { domain: "wsj.com", display_name: "Wall Street Journal", source_type: "major_outlet", grade_hint: "A" },
  { domain: "nytimes.com", display_name: "New York Times", source_type: "major_outlet", grade_hint: "A" },
  { domain: "washingtonpost.com", display_name: "Washington Post", source_type: "major_outlet", grade_hint: "A" },
  { domain: "theguardian.com", display_name: "The Guardian", source_type: "major_outlet", grade_hint: "A", home_region: "UK" },
  { domain: "economist.com", display_name: "The Economist", source_type: "major_outlet", grade_hint: "A", home_region: "UK" },
  { domain: "aljazeera.com", display_name: "Al Jazeera", source_type: "major_outlet", grade_hint: "A", home_region: "Qatar" },
  { domain: "afp.com", display_name: "AFP", source_type: "wire", grade_hint: "A", home_region: "France" },
  { domain: "dw.com", display_name: "Deutsche Welle", source_type: "major_outlet", grade_hint: "A", home_region: "Germany" },
  { domain: "nhk.or.jp", display_name: "NHK", source_type: "major_outlet", grade_hint: "A", home_region: "Japan" },
  { domain: "cnbc.com", display_name: "CNBC", source_type: "major_outlet", grade_hint: "A" },
  { domain: "politico.eu", display_name: "Politico EU", source_type: "major_outlet", grade_hint: "A", home_region: "EU" },
  { domain: "politico.com", display_name: "Politico", source_type: "major_outlet", grade_hint: "A" },
];

const KNOWN_B_SOURCES: KnownSourceEntry[] = [
  { domain: "scmp.com", display_name: "South China Morning Post", source_type: "major_outlet", grade_hint: "B", home_region: "Hong Kong" },
  { domain: "timesofindia.indiatimes.com", display_name: "Times of India", source_type: "major_outlet", grade_hint: "B", home_region: "India" },
  { domain: "thehindu.com", display_name: "The Hindu", source_type: "major_outlet", grade_hint: "B", home_region: "India" },
  { domain: "japantimes.co.jp", display_name: "Japan Times", source_type: "local_outlet", grade_hint: "B", home_region: "Japan" },
  { domain: "straitstimes.com", display_name: "Straits Times", source_type: "major_outlet", grade_hint: "B", home_region: "Singapore" },
  { domain: "techcrunch.com", display_name: "TechCrunch", source_type: "trade", grade_hint: "B" },
  { domain: "arstechnica.com", display_name: "Ars Technica", source_type: "trade", grade_hint: "B" },
  { domain: "semafor.com", display_name: "Semafor", source_type: "major_outlet", grade_hint: "B" },
  { domain: "therecord.media", display_name: "The Record", source_type: "trade", grade_hint: "B" },
  { domain: "defenseone.com", display_name: "Defense One", source_type: "trade", grade_hint: "B" },
];

// Known content farms / spam domains — hard block
const KNOWN_SPAM_DOMAINS = new Set([
  "newsbreak.com",
  "msn.com", // aggregator, not primary
]);

const KNOWN_CONTENT_FARM_PATTERNS = [
  /^(www\.)?buzzfeed\.com$/,
];

// Official/government domain patterns
const OFFICIAL_DOMAIN_PATTERNS = [
  /\.gov($|\.)/,
  /\.mil($|\.)/,
  /\.edu($|\.)/,
  /\.europa\.eu$/,
  /\.un\.org$/,
  /sec\.gov$/,
  /federalregister\.gov$/,
  /who\.int$/,
  /imf\.org$/,
  /worldbank\.org$/,
];

function buildKnownSourceMap(): Map<string, KnownSourceEntry> {
  const map = new Map<string, KnownSourceEntry>();
  for (const entry of [...KNOWN_A_SOURCES, ...KNOWN_B_SOURCES]) {
    map.set(entry.domain, entry);
  }
  return map;
}

const knownSourceMap = buildKnownSourceMap();

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function gradeFromScore(score: number): QualityGrade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "Block";
}

function isOfficialDomain(domain: string): boolean {
  return OFFICIAL_DOMAIN_PATTERNS.some((p) => p.test(domain));
}

// ---------------------------------------------------------------------------
// Source scoring input — lightweight shape callers can build from
// whatever metadata they have available.
// ---------------------------------------------------------------------------
export interface SourceScoringInput {
  domain: string;
  source_name?: string | null;
  source_type?: SourceType | null;
  home_region?: string | null;
  author_raw?: string | null;
  has_author: boolean;
  has_timestamp: boolean;
  ownership_transparent?: boolean;
  masthead_or_contact_found?: boolean;
  corrections_policy_found?: boolean;
  editorial_policy_found?: boolean;
  funding_or_ad_policy_found?: boolean;
  news_opinion_ad_labels_clear?: boolean;
  original_reporting_likelihood?: number;
  syndication_likelihood?: number;
  known_unreliable_pattern?: boolean;
  manual_whitelist?: boolean;
  manual_blocklist?: boolean;
  is_local_to_event?: boolean;
  local_language_source?: boolean;
  quotes_local_actors?: boolean;
}

export interface SourceScoreResult {
  source_quality_score: number;
  source_quality_grade: QualityGrade;
  source_quality_reasons: string[];
  source_type: SourceType;
  display_name: string;
  hard_block_reasons: HardBlockReason[];
}

/**
 * Score a source. Returns numeric score, grade, reasons, and any hard blocks.
 */
export function scoreSource(input: SourceScoringInput): SourceScoreResult {
  const domain = (input.domain || "").toLowerCase().replace(/^www\./, "");
  const reasons: string[] = [];
  const hardBlocks: HardBlockReason[] = [];

  // Check manual blocklist first
  if (input.manual_blocklist) {
    hardBlocks.push("known_spam_domain");
    reasons.push("manual blocklist");
    return {
      source_quality_score: 0,
      source_quality_grade: "Block",
      source_quality_reasons: reasons,
      source_type: input.source_type || "unknown",
      display_name: input.source_name || domain,
      hard_block_reasons: hardBlocks,
    };
  }

  // Check known spam domains
  if (KNOWN_SPAM_DOMAINS.has(domain)) {
    // msn.com is aggregator — not hard block but very low score
    if (domain !== "msn.com") {
      hardBlocks.push("known_spam_domain");
      reasons.push(`known spam/content-farm domain: ${domain}`);
    }
  }

  if (KNOWN_CONTENT_FARM_PATTERNS.some((p) => p.test(domain))) {
    hardBlocks.push("known_spam_domain");
    reasons.push(`content-farm pattern: ${domain}`);
  }

  if (hardBlocks.length > 0) {
    return {
      source_quality_score: 0,
      source_quality_grade: "Block",
      source_quality_reasons: reasons,
      source_type: input.source_type || "unknown",
      display_name: input.source_name || domain,
      hard_block_reasons: hardBlocks,
    };
  }

  // Look up known source
  const known = knownSourceMap.get(domain);
  const sourceType = input.source_type || known?.source_type || (isOfficialDomain(domain) ? "official" : "unknown");
  const displayName = input.source_name || known?.display_name || domain;

  let score = 50;

  // --- Accountability / transparency (+25 max) ---
  let accountabilityAdd = 0;

  // Official domains (gov, mil, edu, etc.) get institutional accountability
  const isOfficial = isOfficialDomain(domain) ||
    sourceType === "official" || sourceType === "regulator" ||
    sourceType === "government" || sourceType === "court";

  // A-grade known sources and official domains get full accountability inference
  // B-grade known sources get partial credit (spec: "at least partial transparency")
  const isKnownA = known?.grade_hint === "A";
  const ownershipClear = input.ownership_transparent ?? (isKnownA || isOfficial);
  if (ownershipClear) {
    accountabilityAdd += 8;
    reasons.push("+8 ownership/institutional identity clear");
  } else if (known != null) {
    // B-grade known source: partial ownership credit
    accountabilityAdd += 4;
    reasons.push("+4 partial ownership transparency (known B source)");
  }

  const mastheadClear = input.masthead_or_contact_found ?? (isKnownA || isOfficial);
  if (mastheadClear) {
    accountabilityAdd += 5;
    reasons.push("+5 masthead/contact clear");
  } else if (known != null) {
    accountabilityAdd += 3;
    reasons.push("+3 partial masthead/contact (known B source)");
  }

  // Only A-grade and official sources get inferred corrections policy credit
  const correctionsClear = input.corrections_policy_found ?? (known?.grade_hint === "A" || isOfficial);
  if (correctionsClear) {
    accountabilityAdd += 5;
    reasons.push("+5 corrections/editorial policy visible");
  }

  // Official/institutional sources don't require named author for accountability
  const authorAccountable = input.has_author || (known != null && known.source_type === "wire") || isOfficial;
  if (authorAccountable) {
    accountabilityAdd += 4;
    reasons.push("+4 author/newsroom accountability");
  }

  // Only A-grade and official sources get inferred funding policy credit
  const fundingClear = input.funding_or_ad_policy_found ?? (known?.grade_hint === "A" || isOfficial);
  if (fundingClear) {
    accountabilityAdd += 3;
    reasons.push("+3 funding/ad distinction visible");
  }
  score += Math.min(25, accountabilityAdd);

  // --- Reliability / reputation (+25 max) ---
  let reliabilityAdd = 0;

  if (known?.grade_hint === "A" || isOfficialDomain(domain)) {
    reliabilityAdd += 10;
    reasons.push("+10 high-reliability source/official body");
  } else if (known?.grade_hint === "B") {
    reliabilityAdd += 5;
    reasons.push("+5 established credible source");
  }

  if (!(input.known_unreliable_pattern ?? false)) {
    reliabilityAdd += 5;
    reasons.push("+5 no known misinformation pattern");
  }

  // B-grade known sources get partial label credit, not full
  const labelsClear = input.news_opinion_ad_labels_clear ?? (known?.grade_hint === "A" || isOfficial);
  if (labelsClear) {
    reliabilityAdd += 5;
    reasons.push("+5 news/opinion/ad separation clear");
  }

  const originalLikelihood = input.original_reporting_likelihood ?? (known ? 0.7 : 0.3);
  if (originalLikelihood >= 0.6) {
    reliabilityAdd += 5;
    reasons.push("+5 original reporting history");
  }
  score += Math.min(25, reliabilityAdd);

  // --- Role strength (+20 max) ---
  let roleAdd = 0;
  if (sourceType === "official" || sourceType === "regulator" || sourceType === "government" || sourceType === "court") {
    roleAdd += 20;
    reasons.push("+20 official/primary source");
  } else if (sourceType === "wire") {
    roleAdd += 15;
    reasons.push("+15 wire service/original reporting");
  } else if (sourceType === "trade" || sourceType === "research" || sourceType === "ngo") {
    roleAdd += 10;
    reasons.push("+10 specialist/trade expertise");
  } else if (sourceType === "local_outlet") {
    roleAdd += 8;
    reasons.push("+8 local reporting");
  } else if (sourceType === "major_outlet") {
    roleAdd += 12;
    reasons.push("+12 major outlet with editorial standards");
  } else if (sourceType === "aggregator") {
    roleAdd += 3;
    reasons.push("+3 aggregator with attribution");
  }
  score += Math.min(20, roleAdd);

  // --- Regional/local protection (+10 max) ---
  let regionalAdd = 0;
  if (input.is_local_to_event) {
    regionalAdd += 5;
    reasons.push("+5 local outlet in event geography");
  }
  if (input.local_language_source) {
    regionalAdd += 3;
    reasons.push("+3 local-language source");
  }
  if (input.quotes_local_actors) {
    regionalAdd += 2;
    reasons.push("+2 quotes local actors");
  }
  score += Math.min(10, regionalAdd);

  // --- Penalties ---
  // Official/institutional sources are not penalized for missing named author
  if (!input.has_author && sourceType !== "wire" && !isOfficial) {
    score -= 10;
    reasons.push("-10 missing author/accountable newsroom");
  }

  if (!input.has_timestamp) {
    score -= 10;
    reasons.push("-10 weak/missing timestamp");
  }

  // Reduce ownership penalty for local outlets with named author and local context
  // Per spec: "Design quality is not editorial quality"
  if (!ownershipClear && !known) {
    const hasLocalContext = input.is_local_to_event && input.has_author;
    if (hasLocalContext) {
      score -= 5;
      reasons.push("-5 unclear ownership (reduced: local outlet with named reporter)");
    } else {
      score -= 10;
      reasons.push("-10 unclear ownership/contact");
    }
  }

  const syndicationLikelihood = input.syndication_likelihood ?? 0;
  if (syndicationLikelihood >= 0.7) {
    score -= 15;
    reasons.push("-15 mostly rewrite/aggregation");
  }

  if (input.known_unreliable_pattern) {
    score -= 25;
    reasons.push("-25 known unreliable pattern");
  }

  // Manual whitelist can lift score
  if (input.manual_whitelist && score < 70) {
    score = 70;
    reasons.push("manual whitelist floor: 70");
  }

  score = clamp(score, 0, 100);
  const grade = gradeFromScore(score);

  return {
    source_quality_score: score,
    source_quality_grade: grade,
    source_quality_reasons: reasons,
    source_type: sourceType,
    display_name: displayName,
    hard_block_reasons: hardBlocks,
  };
}

/**
 * Build a full SourceQualityRecord from scoring input. Convenience wrapper
 * used by the audit/debug path.
 */
export function buildSourceQualityRecord(
  input: SourceScoringInput,
  result: SourceScoreResult
): SourceQualityRecord {
  const domain = (input.domain || "").toLowerCase().replace(/^www\./, "");
  return {
    source_id: `domain:${domain}`,
    display_name: result.display_name,
    domain,
    source_type: result.source_type,
    home_region: input.home_region || undefined,
    coverage_regions: [],
    languages: [],
    ownership_transparent: input.ownership_transparent ?? false,
    masthead_or_contact_found: input.masthead_or_contact_found ?? false,
    corrections_policy_found: input.corrections_policy_found ?? false,
    editorial_policy_found: input.editorial_policy_found ?? false,
    funding_or_ad_policy_found: input.funding_or_ad_policy_found ?? false,
    news_opinion_ad_labels_clear: input.news_opinion_ad_labels_clear ?? false,
    author_transparency_default: input.has_author ? "medium" : "low",
    original_reporting_likelihood: input.original_reporting_likelihood ?? 0.3,
    syndication_likelihood: input.syndication_likelihood ?? 0,
    known_wire_partner: false,
    known_unreliable_pattern: input.known_unreliable_pattern ?? false,
    manual_whitelist: input.manual_whitelist ?? false,
    manual_blocklist: input.manual_blocklist ?? false,
    regional_context_bonus: 0,
    source_quality_score: result.source_quality_score,
    source_quality_grade: result.source_quality_grade,
    source_quality_reasons: result.source_quality_reasons,
    last_reviewed_at: new Date().toISOString(),
  };
}
