// ---------------------------------------------------------------------------
// Article quality scoring — Package 8A.
//
// Scores how useful a specific article is as briefing evidence,
// independent of source reputation. Produces a 0–100 score and
// A/B/C/D/Block grade.
//
// V1 uses deterministic text heuristics. No LLM calls.
// ---------------------------------------------------------------------------
import type {
  QualityGrade,
  AuthorType,
  HardBlockReason,
} from "./types";
import { gradeFromScore } from "./source-quality";

// ---------------------------------------------------------------------------
// Heuristic helpers
// ---------------------------------------------------------------------------

// Event/action keywords — indicates the article describes a concrete happening
const EVENT_ACTION_PATTERNS = [
  /\b(announced|confirms?|confirmed|approved|rejected|signed|filed|launched|opened|closed|suspended|arrested|charged|sentenced|convicted|indicted|sanctioned|banned|recalled|withdrawn)\b/i,
  /\b(regulation|investigation|enforcement|ruling|decision|verdict|settlement|merger|acquisition|ipo|earnings|quarterly|fiscal)\b/i,
  /\b(strike|protest|shutdown|disruption|outage|shortage|evacuati|explosion|collapse|crash|flood|earthquake|fire|attack|breach)\b/i,
];

function hasEventOrAction(title: string, body: string): boolean {
  const text = `${title}\n${body}`.slice(0, 2000);
  return EVENT_ACTION_PATTERNS.some((p) => p.test(text));
}

// Primary evidence patterns — direct quotes, documents, data
const PRIMARY_EVIDENCE_PATTERNS = [
  /[""\u201C\u201D].{10,}[""\u201C\u201D]/,  // quoted speech
  /\baccording\s+to\s+(the|a)\s+/i,
  /\bfiling\s+(show|reveal|indicate)/i,
  /\btranscript\b/i,
  /\bofficial\s+(data|statistic|figure|report|document)/i,
  /\bcourt\s+(document|filing|record|order)/i,
  /\bsec\s+filing/i,
  /\bstatement\s+(from|by|issued)/i,
  /\bpress\s+release/i,
  /\bdata\s+(show|reveal|indicate)/i,
];

function hasPrimaryEvidence(text: string): boolean {
  return PRIMARY_EVIDENCE_PATTERNS.some((p) => p.test(text));
}

// Factual density: count of numbers, proper nouns, dates, specific places
function computeFactualDensity(text: string): number {
  if (!text || text.length < 100) return 0;

  const sample = text.slice(0, 3000);
  const words = sample.split(/\s+/).length;
  if (words < 20) return 0;

  // Count factual markers
  let markers = 0;

  // Numbers (amounts, percentages, dates)
  markers += (sample.match(/\d+[.,]?\d*\s*(%|percent|million|billion|thousand|USD|EUR|GBP|\$|€|£)/gi) || []).length * 2;
  markers += (sample.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) || []).length;
  markers += (sample.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/gi) || []).length;

  // Named entities (capitalized multi-word sequences)
  markers += (sample.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || []).length;

  // Quoted text
  markers += (sample.match(/[""\u201C].*?[""\u201D]/g) || []).length * 2;

  return Math.min(1.0, markers / (words / 15));
}

// Sensitivity flags detection
type SensitivityFlag =
  | "legal"
  | "regulatory"
  | "market_moving"
  | "safety"
  | "security"
  | "casualty"
  | "geopolitical"
  | "sanctions"
  | "misconduct"
  | "health"
  | "environment";

const SENSITIVITY_PATTERNS: Array<{ flag: SensitivityFlag; pattern: RegExp }> = [
  { flag: "legal", pattern: /\b(lawsuit|litigation|sue[ds]?|court\s+order|verdict|settlement|indictment|convicted|acquitted)\b/i },
  { flag: "regulatory", pattern: /\b(regulator|compliance|enforcement|fine[ds]?|violation|sanction|penalty|investigation\s+by|oversight|audit)\b/i },
  { flag: "market_moving", pattern: /\b(earnings|profit\s+warning|revenue|downgrade|upgrade|ipo|merger|acquisition|delisting|bankruptcy|insolvency)\b/i },
  { flag: "safety", pattern: /\b(safety\s+recall|contamination|hazard|defect|injury|death|accident|crash|explosion|toxic)\b/i },
  { flag: "security", pattern: /\b(cybersecurity|breach|hack|ransomware|vulnerability|exploit|attack|espionage|intelligence)\b/i },
  { flag: "casualty", pattern: /\b(killed|died|dead|fatalities|casualties|injured|wounded|missing)\b/i },
  { flag: "geopolitical", pattern: /\b(sanctions?|embargo|tariff|trade\s+war|diplomatic|sovereignty|territorial|military|weapons?|nuclear)\b/i },
  { flag: "sanctions", pattern: /\b(sanctions?|blacklist|entity\s+list|ofac|designated|restricted\s+party)\b/i },
  { flag: "misconduct", pattern: /\b(fraud|bribery|corruption|misconduct|whistleblower|insider\s+trading|money\s+laundering|embezzlement)\b/i },
  { flag: "health", pattern: /\b(outbreak|pandemic|epidemic|vaccine|drug\s+recall|clinical\s+trial|fda\s+approval|who\s+alert)\b/i },
  { flag: "environment", pattern: /\b(pollution|emission|climate|environmental\s+damage|oil\s+spill|contamination|deforestation|epa)\b/i },
];

function detectSensitivityFlags(text: string): SensitivityFlag[] {
  const flags: SensitivityFlag[] = [];
  const seen = new Set<SensitivityFlag>();
  for (const { flag, pattern } of SENSITIVITY_PATTERNS) {
    if (!seen.has(flag) && pattern.test(text)) {
      flags.push(flag);
      seen.add(flag);
    }
  }
  return flags;
}

// Clickbait / title-body mismatch heuristic
function isClickbait(title: string, body: string): boolean {
  if (!title || !body) return false;
  const titleLower = title.toLowerCase();
  // Clickbait patterns
  if (/\bwon['']?t\s+believe\b/i.test(titleLower)) return true;
  if (/\bshocking\b/i.test(titleLower)) return true;
  if (/\byou['']?ll\s+never\s+guess\b/i.test(titleLower)) return true;
  if (/\bone\s+simple\s+trick\b/i.test(titleLower)) return true;
  return false;
}

// Check for syndication without attribution
function isSyndicatedWithoutAttribution(body: string): boolean {
  // Very rough V1: short body that looks like it was copied
  if (body.length < 200 && body.length > 50) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Main article scoring
// ---------------------------------------------------------------------------

export interface ArticleScoringInput {
  title: string;
  body: string;
  domain: string;
  author_type: AuthorType;
  has_reliable_timestamp: boolean;
  published_at?: string | null;
  scan_window_start?: string | null;
  has_canonical_attribution: boolean;
  is_syndicated: boolean;
}

export interface ArticleScoreResult {
  article_quality_score: number;
  article_quality_grade: QualityGrade;
  article_quality_reasons: string[];
  hard_block_reasons: HardBlockReason[];
  has_extractable_event: boolean;
  has_primary_evidence: boolean;
  has_original_reporting: boolean;
  has_local_detail: boolean;
  has_named_quotes_or_documents: boolean;
  factual_density_score: number;
  boilerplate_ratio: number;
  sensitivity_flags: SensitivityFlag[];
}

/**
 * Score a specific article for quality as briefing evidence.
 * Returns numeric score, grade, and detailed reasons.
 */
export function scoreArticle(input: ArticleScoringInput): ArticleScoreResult {
  const reasons: string[] = [];
  const hardBlocks: HardBlockReason[] = [];
  const fullText = `${input.title}\n${input.body}`;

  // Hard block checks first
  // Prompt injection checked separately in sludge module, but we also detect here
  const hasEvent = hasEventOrAction(input.title, input.body);
  const hasPrimary = hasPrimaryEvidence(fullText);
  const factualDensity = computeFactualDensity(input.body);
  const sensFlags = detectSensitivityFlags(fullText);

  // No factual event at all
  if (!hasEvent && !hasPrimary && factualDensity < 0.05 && input.body.length > 50) {
    // Only flag as hard block if body exists but has no substance
    if (input.body.length > 200) {
      hardBlocks.push("no_factual_event");
    }
  }

  if (hardBlocks.length > 0) {
    return {
      article_quality_score: 0,
      article_quality_grade: "Block",
      article_quality_reasons: ["hard block: " + hardBlocks.join(", ")],
      hard_block_reasons: hardBlocks,
      has_extractable_event: false,
      has_primary_evidence: false,
      has_original_reporting: false,
      has_local_detail: false,
      has_named_quotes_or_documents: false,
      factual_density_score: 0,
      boilerplate_ratio: 1,
      sensitivity_flags: sensFlags,
    };
  }

  let score = 50;

  // --- Additions ---

  // +15 clear event/action/decision/release
  if (hasEvent) {
    score += 15;
    reasons.push("+15 clear event/action/decision");
  }

  // +10 reliable timestamp in scan window
  if (input.has_reliable_timestamp) {
    score += 10;
    reasons.push("+10 reliable timestamp");
  }

  // +10 primary document/direct quote/official data
  if (hasPrimary) {
    score += 10;
    reasons.push("+10 primary evidence/direct quote/official data");
  }

  // +10 original reporting or local detail
  // V1: estimate from factual density and body length
  const likelyOriginal = factualDensity > 0.3 && input.body.length > 500;
  if (likelyOriginal) {
    score += 10;
    reasons.push("+10 likely original reporting/local detail");
  }

  // +8 high factual density
  if (factualDensity >= 0.4) {
    score += 8;
    reasons.push("+8 high factual density");
  } else if (factualDensity >= 0.25) {
    score += 4;
    reasons.push("+4 moderate factual density");
  }

  // +7 clear fact/opinion/sponsored distinction (V1: proxied by body length + density)
  if (input.body.length > 400 && factualDensity > 0.2) {
    score += 7;
    reasons.push("+7 clear fact/reporting structure");
  }

  // +5 canonical/source attribution if syndicated
  if (input.is_syndicated && input.has_canonical_attribution) {
    score += 5;
    reasons.push("+5 syndicated with canonical attribution");
  }

  // +5 useful specificity (body length + events as proxy)
  if (input.body.length > 600 && hasEvent) {
    score += 5;
    reasons.push("+5 useful specificity");
  }

  // --- Penalties ---

  // -15 no reliable timestamp
  if (!input.has_reliable_timestamp) {
    score -= 15;
    reasons.push("-15 no reliable timestamp");
  }

  // -15 no author/accountable newsroom
  if (input.author_type === "none" || input.author_type === "unknown") {
    score -= 15;
    reasons.push("-15 no author/accountable newsroom");
  }

  // -20 no original facts beyond other articles
  if (!hasEvent && !hasPrimary && factualDensity < 0.15) {
    score -= 20;
    reasons.push("-20 no original facts");
  }

  // -15 thin body / low factual density
  if (input.body.length < 200 || factualDensity < 0.1) {
    score -= 15;
    reasons.push("-15 thin body/low factual density");
  }

  // -10 clickbait/title-body mismatch
  if (isClickbait(input.title, input.body)) {
    score -= 10;
    reasons.push("-10 clickbait title pattern");
  }

  // -15 opinion/sponsored not clearly labelled (V1: skip — needs page structure analysis)

  // -25 copied/syndicated without canonical attribution
  if (input.is_syndicated && !input.has_canonical_attribution) {
    score -= 25;
    reasons.push("-25 syndicated without attribution");
  } else if (isSyndicatedWithoutAttribution(input.body) && !input.has_canonical_attribution) {
    score -= 15;
    reasons.push("-15 possible uncited syndication (short body)");
  }

  score = Math.max(0, Math.min(100, score));
  const grade = gradeFromScore(score);

  // Determine boolean flags
  const hasNamedQuotes = /[""\u201C\u201D].{10,}[""\u201C\u201D]/.test(fullText) || hasPrimary;
  const hasLocalDetail = /\b(local|community|resident|neighborhood|district|village|town|county)\b/i.test(fullText) &&
    factualDensity > 0.2;
  const boilerplateRatio = factualDensity > 0 ? Math.max(0, 1 - factualDensity) : 1;

  return {
    article_quality_score: score,
    article_quality_grade: grade,
    article_quality_reasons: reasons,
    hard_block_reasons: hardBlocks,
    has_extractable_event: hasEvent,
    has_primary_evidence: hasPrimary,
    has_original_reporting: likelyOriginal,
    has_local_detail: hasLocalDetail,
    has_named_quotes_or_documents: hasNamedQuotes,
    factual_density_score: Math.round(factualDensity * 100) / 100,
    boilerplate_ratio: Math.round(boilerplateRatio * 100) / 100,
    sensitivity_flags: sensFlags,
  };
}
