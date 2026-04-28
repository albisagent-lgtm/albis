// ---------------------------------------------------------------------------
// SEO-sludge detector — Package 8A.
//
// Scores how likely an article is made for search/commercial extraction
// rather than useful reporting. High sludge does not mean fake — it means
// the content should not dominate the evidence packet.
//
// V1 uses deterministic text heuristics. No LLM calls.
// ---------------------------------------------------------------------------
import type { SludgeSignal, SludgeAction, HardBlockReason, AuthorType } from "./types";

// ---------------------------------------------------------------------------
// Signal detectors
// ---------------------------------------------------------------------------

// Keyword-stuffed / search-shaped title patterns
const SEARCH_TITLE_PATTERNS = [
  /\bbest\s+\w+\s+(for|in|of)\b/i,
  /\beverything\s+you\s+need\s+to\s+know\b/i,
  /\bhow\s+to\s+(get|find|buy|book|apply|claim|avoid)\b/i,
  /\btop\s+\d+\b/i,
  /\bcheap(est)?\s+(flights?|hotels?|deals?|tickets?)/i,
  /\b(price|cost|review|rating|comparison|vs\.?|versus)\b.*\b(2025|2026|2027)\b/i,
  /\b(2025|2026|2027)\b.*\b(guide|tips|tricks|hacks|secrets)\b/i,
  /\b(what|when|where|how|why)\s+.*\?\s*$/i, // question headlines without reporting
  /[|]{2,}/, // excessive pipe separators
  /:{2,}/, // excessive colons
];

// Additional keyword-stuffed patterns (long titles with many keywords)
function hasKeywordStuffedTitle(title: string): boolean {
  if (!title) return false;
  // Count pipe/colon separators (SEO fragment style)
  const separators = (title.match(/[|:—–]/g) || []).length;
  if (separators >= 3) return true;

  // Very long titles with many capitalized words (SEO shape)
  if (title.length > 120) {
    const words = title.split(/\s+/);
    if (words.length > 15) return true;
  }

  return SEARCH_TITLE_PATTERNS.some((p) => p.test(title));
}

// Affiliate / commercial language
const AFFILIATE_PATTERNS = [
  /\baffiliate\b/i,
  /\bcoupon(s)?\b/i,
  /\bdiscount\s+code/i,
  /\bbuy\s+now\b/i,
  /\bshop\s+now\b/i,
  /\bbest\s+(deals?|platforms?|picks?|options?)\b/i,
  /\bcheap\s+flights?\b/i,
  /\bbook(ing)?\s+(now|here|today)\b/i,
  /\bpromo\s+code\b/i,
  /\bsign\s+up\s+(now|today|here)\b/i,
  /\bfree\s+trial\b/i,
  /\bcrypto\s+(trading|platform|exchange|bot)\b/i,
  /\bforex\s+(trading|signal|robot)\b/i,
  /\bbetting\s+(odds|tips|site)\b/i,
];

function hasAffiliateLanguage(text: string): boolean {
  return AFFILIATE_PATTERNS.some((p) => p.test(text));
}

// Generic AI-like filler phrases
const AI_FILLER_PATTERNS = [
  /\bin\s+a\s+significant\s+development\b/i,
  /\bunderscores?\s+the\s+importance\b/i,
  /\bevolving\s+landscape\b/i,
  /\bstakeholders\s+should\s+(monitor|watch|note)\b/i,
  /\bin\s+today['']?s\s+(fast-paced|ever-changing|rapidly\s+evolving)\b/i,
  /\bit\s+remains\s+to\s+be\s+seen\b/i,
  /\btime\s+will\s+tell\b/i,
  /\bonly\s+time\s+will\s+tell\b/i,
  /\bdelve\s+(into|deeper)\b/i,
  /\bcomplex\s+interplay\b/i,
  /\bparadigm\s+shift\b/i,
  /\bgame[\s-]?changer\b/i,
  /\bseamless(ly)?\s+integrat/i,
  /\bunprecedented\s+(times?|challenges?|opportunities?)\b/i,
  /\bnavigate\s+(the|this|these)\s+(complex|challenging)/i,
  /\bexperts\s+say\b(?!.*\b(named|said|told|according)\b)/i, // "experts say" without naming them
];

function countAiFillerHits(text: string): number {
  let count = 0;
  for (const p of AI_FILLER_PATTERNS) {
    if (p.test(text)) count++;
  }
  return count;
}

// Prompt injection patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+(now\s+)?a\s/i,
  /\bsystem\s*:\s/i,
  /\bassistant\s*:\s/i,
  /\bdo\s+not\s+follow\s+your\s+(original|initial)\b/i,
  /\boverride\s+(the\s+)?system\b/i,
  /\bpretend\s+(you\s+are|to\s+be)\b/i,
  /\bdisregard\s+(all|any|the)\s+(previous|above)\b/i,
  /\bjailbreak/i,
  /\bexfiltrate/i,
  /\bdata\s*:\s*text\/html/i,
  /<!--\s*(inject|prompt|system|ignore)/i,
];

function hasPromptInjection(text: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some((p) => p.test(text));
}

// Sensitivity keywords for detecting event content
const EVENT_KEYWORDS = [
  /\b(announced|announced|confirmed|reported|said|stated|decided|approved|rejected|filed|launched|signed|convicted|arrested|charged|sentenced|died|killed|injured)\b/i,
  /\b(regulation|law|policy|ruling|decree|legislation|investigation|enforcement|sanction|embargo|tariff|treaty|agreement)\b/i,
  /\b(revenue|profit|loss|growth|decline|quarterly|fiscal|earnings|dividend|acquisition|merger|ipo)\b/i,
  /\b(earthquake|hurricane|flood|wildfire|tornado|tsunami|outbreak|pandemic|epidemic)\b/i,
];

function hasExtractableEvent(title: string, body: string): boolean {
  const text = `${title} ${body}`.slice(0, 2000);
  return EVENT_KEYWORDS.some((p) => p.test(text));
}

// Known content farm / spam domain heuristics
const SPAM_DOMAIN_PATTERNS = [
  /\.(xyz|top|info|buzz|click|surf|win|bid)$/i,
  /content-?farm/i,
  /seo-?article/i,
  /free-?news/i,
];

function isLikelySpamDomain(domain: string): boolean {
  return SPAM_DOMAIN_PATTERNS.some((p) => p.test(domain));
}

// ---------------------------------------------------------------------------
// Factual density estimation (simple V1)
// ---------------------------------------------------------------------------
function estimateFactualDensity(text: string): number {
  if (!text || text.length < 100) return 0;

  const sample = text.slice(0, 3000);
  const sentences = sample.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length === 0) return 0;

  let factualSentences = 0;
  for (const s of sentences) {
    // Sentences with numbers, proper nouns, dates, or quoted text
    if (/\d{2,}/.test(s) || /["""]/.test(s) || /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/.test(s)) {
      factualSentences++;
    }
  }
  return factualSentences / sentences.length;
}

// ---------------------------------------------------------------------------
// Main sludge scoring
// ---------------------------------------------------------------------------

export interface SludgeScoringInput {
  title: string;
  body: string;
  domain: string;
  author_type: AuthorType;
  has_reliable_timestamp: boolean;
  has_original_facts: boolean;
  published_at?: string | null;
}

export interface SludgeScoreResult {
  seo_sludge_score: number;
  seo_sludge_signals: SludgeSignal[];
  sludge_action: SludgeAction;
  hard_block_reasons: HardBlockReason[];
}

/**
 * Compute SEO-sludge score. 0–100, additive, capped at 100.
 * Higher = more likely to be search/commercial content rather than reporting.
 */
export function computeSeoSludgeScore(input: SludgeScoringInput): SludgeScoreResult {
  let score = 0;
  const signals: SludgeSignal[] = [];
  const hardBlocks: HardBlockReason[] = [];
  const fullText = `${input.title}\n${input.body}`;

  // +20 missing author/accountable newsroom
  if (input.author_type === "none" || input.author_type === "unknown") {
    score += 20;
    signals.push("missing_author");
  }

  // +15 missing/suspicious timestamp
  if (!input.has_reliable_timestamp) {
    score += 15;
    signals.push("missing_or_suspicious_timestamp");
  }

  // +20 no original facts
  if (!input.has_original_facts) {
    score += 20;
    signals.push("no_original_facts");
  }

  // +15 keyword-stuffed/search-title pattern
  if (hasKeywordStuffedTitle(input.title)) {
    score += 15;
    signals.push("keyword_stuffed_title");
  }

  // +15 affiliate/commercial intent
  if (hasAffiliateLanguage(fullText)) {
    score += 15;
    signals.push("affiliate_or_commercial_intent");
  }

  // +10 thin content / low factual density
  const density = estimateFactualDensity(input.body);
  if (input.body.length < 300 || density < 0.15) {
    score += 10;
    signals.push("thin_content");
  }

  // +10 copied/syndicated without canonical attribution
  // V1: check if body is very short and title-heavy (clone indicator)
  if (input.body.length > 0 && input.body.length < 200 && input.title.length > 60) {
    score += 10;
    signals.push("uncited_syndication_or_scrape");
  }

  // +10 generic AI-like filler
  const fillerHits = countAiFillerHits(fullText);
  if (fillerHits >= 2) {
    score += 10;
    signals.push("generic_ai_like_filler");
  }

  // +20 known content-farm/spam domain
  if (isLikelySpamDomain(input.domain)) {
    score += 20;
    signals.push("known_content_farm_or_spam_domain");
  }

  // +100 prompt-injection/malware/fabricated content
  if (hasPromptInjection(fullText)) {
    score += 100;
    signals.push("prompt_injection_or_malware");
    hardBlocks.push("prompt_injection");
  }

  // Check for no extractable event
  if (!hasExtractableEvent(input.title, input.body)) {
    signals.push("no_extractable_event");
    // Don't add to score — this is tracked as a signal but scored via article quality
  }

  score = Math.min(100, score);

  // Determine action
  let action: SludgeAction;
  if (hardBlocks.length > 0 || score >= 80) {
    action = "block";
  } else if (score >= 60) {
    action = "dashboard_only";
  } else if (score >= 40) {
    action = "downrank";
  } else {
    action = "allow";
  }

  return {
    seo_sludge_score: score,
    seo_sludge_signals: signals,
    sludge_action: action,
    hard_block_reasons: hardBlocks,
  };
}
