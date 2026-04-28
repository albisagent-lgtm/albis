// ---------------------------------------------------------------------------
// Article normalizer — Package 8B.
//
// Turns ScoredCompanyArticleEvidence from the 8A quality funnel into
// NormalizedArticle records with:
//   - cleaned titles
//   - event tuple extraction
//   - factual claim extraction
//   - entity normalization
//   - syndication/duplicate detection features
//   - dedupe features (title fingerprint, entity/time/place/action keys)
//
// Only articles with evidence action email_anchor, email_support, or
// dashboard_only proceed to normalization. Blocked/excluded/watchlist
// articles are skipped.
// ---------------------------------------------------------------------------

import type {
  ScoredCompanyArticleEvidence,
  ArticleQualityRecord,
  NormalizedArticle,
  NormalizedEntity,
  FactualClaim,
  ExtractedQuote,
  EventTuple,
  EntityRef,
  PlaceRef,
  ActionClass,
  EventStatus,
  NormalizationStatus,
  EvidenceAction,
  SourceType,
  AuthorType,
} from "./types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Evidence actions that proceed to normalization. */
const NORMALIZABLE_ACTIONS: EvidenceAction[] = [
  "email_anchor",
  "email_support",
  "dashboard_only",
  "review_required",
];

// Publisher suffixes to strip from titles
const PUBLISHER_SUFFIXES = [
  / [-–—|] Reuters$/i,
  / [-–—|] AP News$/i,
  / [-–—|] Associated Press$/i,
  / [-–—|] BBC( News)?$/i,
  / [-–—|] Bloomberg$/i,
  / [-–—|] CNBC$/i,
  / [-–—|] CNN$/i,
  / [-–—|] Financial Times$/i,
  / [-–—|] The Guardian$/i,
  / [-–—|] The New York Times$/i,
  / [-–—|] Wall Street Journal$/i,
  / [-–—|] WSJ$/i,
  / [-–—|] Al Jazeera$/i,
  / [-–—|] DW$/i,
  / [-–—|] France ?24$/i,
  / [-–—|] NHK$/i,
  / [-–—|] Politico$/i,
  / [-–—|] The Economist$/i,
  / [-–—|] AFP$/i,
  / [-–—|] [A-Z][a-zA-Z\s]{2,30}$/,  // Generic trailing source after dash/pipe
];

// SEO title patterns to clean
const SEO_TITLE_PATTERNS = [
  /\s*\|\s*[A-Z][a-zA-Z\s]{2,40}$/, // "Title | Source Name"
  /\s*[-–—]\s*[A-Z][a-zA-Z\s]{2,40}$/, // "Title - Source Name"
  /^(BREAKING|JUST IN|EXCLUSIVE|UPDATE \d*|WATCH|LIVE):\s*/i,
  /\s*\[(?:Updated|Exclusive|Breaking|Video|Photos?|Gallery)\]\s*/gi,
];

// Wire service indicators for syndication detection
const WIRE_SERVICE_PATTERNS = [
  /\(reuters\)/i,
  /\(ap\)/i,
  /\(afp\)/i,
  /\breuters\b/i,
  /\bassociated press\b/i,
  /\bagence france.presse\b/i,
  /\bpa media\b/i,
];

const WIRE_BYLINES = ["reuters", "ap", "afp", "associated press", "pa media"];

// Action class detection keywords
const ACTION_CLASS_KEYWORDS: Record<ActionClass, RegExp[]> = {
  regulatory_action: [/\bregulat/i, /\bfine[ds]?\b/i, /\bprobe\b/i, /\binvestigat/i, /\benforcemen/i, /\bcompliance\b/i, /\bsanction[sed]/i],
  legal_action: [/\blawsuit/i, /\bsu(?:ed?|ing)\b/i, /\bcourt\b/i, /\btrial\b/i, /\bverdict\b/i, /\blitigation\b/i, /\binjunction\b/i],
  policy_change: [/\bpolicy\b/i, /\blegislat/i, /\bbill\b/i, /\blaw\b/i, /\bregulat/i, /\bmandate\b/i, /\bpropos(?:ed?|al)\b/i],
  financial_result: [/\bearnings\b/i, /\brevenue\b/i, /\bprofit\b/i, /\bquarter(?:ly)?\b/i, /\bQ[1-4]\b/, /\bfiscal\b/i, /\bresults\b/i],
  market_move: [/\bstock\b/i, /\bshare[s ]?\b/i, /\bmarket\b/i, /\brall(?:y|ied)\b/i, /\bIPO\b/i, /\bbond\b/i, /\bcurrenc/i],
  merger_acquisition: [/\bmerger\b/i, /\bacquisition\b/i, /\bacquir/i, /\btakeover\b/i, /\bbuyout\b/i, /\bmerge[ds]?\b/i],
  product_launch: [/\blaunch/i, /\breleas/i, /\bunveil/i, /\bannounce[ds]?\s+(?:new|its)\b/i, /\broll(?:ed|ing)?\s*out\b/i],
  partnership: [/\bpartnership\b/i, /\bjoint venture\b/i, /\bcollaborat/i, /\balliance\b/i, /\bteam(?:ed|ing)?\s*up\b/i],
  supply_chain_disruption: [/\bsupply chain\b/i, /\bshortage\b/i, /\bdisrupt/i, /\bshipping\b/i, /\bfreight\b/i, /\bport\b/i],
  security_incident: [/\bbreach\b/i, /\bhack/i, /\bcyber/i, /\bransomware\b/i, /\bdata leak\b/i, /\bsecurity incident\b/i],
  labor_workforce: [/\bstrike\b/i, /\blayoff/i, /\bhiring\b/i, /\bunion\b/i, /\bworker/i, /\bjob cut/i, /\brestructur/i],
  geopolitical_event: [/\bsanction/i, /\btariff/i, /\btrade war\b/i, /\bgeopolitic/i, /\bdiplomat/i, /\bembargo\b/i],
  natural_disaster: [/\bearthquake\b/i, /\bflood/i, /\bhurricane\b/i, /\btyphoon\b/i, /\bwildfire\b/i, /\btsunami\b/i],
  public_health_safety: [/\brecall\b/i, /\bcontaminat/i, /\bhealth\b/i, /\bsafety\b/i, /\boutbreak\b/i, /\bpandemic\b/i],
  executive_change: [/\bCEO\b/i, /\bCFO\b/i, /\bCTO\b/i, /\bappoint/i, /\bresign/i, /\bstep(?:ped|ping)?\s*down\b/i],
  company_statement: [/\bstatement\b/i, /\bsaid\b/i, /\bannounce[ds]?\b/i, /\bconfirm/i, /\bdeclare/i],
  research_report: [/\breport\b/i, /\bstudy\b/i, /\bresearch\b/i, /\bsurvey\b/i, /\banalysis\b/i, /\bforecast\b/i],
  other: [],
};

// Event status keywords
const STATUS_KEYWORDS: Record<EventStatus, RegExp[]> = {
  announced: [/\bannounce[ds]?\b/i],
  proposed: [/\bpropos(?:ed?|al)\b/i, /\bplan(?:ned|ning|s)?\b/i, /\bconsider/i],
  confirmed: [/\bconfirm/i, /\bapprov/i, /\bfinali[sz]/i],
  reported: [/\breport(?:ed|s)?\b/i, /\baccording to\b/i],
  developing: [/\bdeveloping\b/i, /\bongoing\b/i, /\bcontinuing\b/i],
  alleged: [/\balleg/i, /\baccus/i, /\bclaim(?:ed|s)?\b/i],
  denied: [/\bdeni(?:ed|es|al)\b/i, /\breject/i, /\brefute/i],
  rumored: [/\brumor/i, /\brunconfirmed\b/i, /\bspeculat/i],
  analysis: [/\banalys[ie]s\b/i, /\bcommentar/i, /\bexpert/i, /\bopinion\b/i],
  background: [/\bbackground\b/i, /\bhistor/i, /\bexplain/i, /\boverview\b/i],
};

// Sensitivity patterns (already used in 8A but needed here for claim extraction)
const SENSITIVITY_PATTERNS: [string, RegExp][] = [
  ["legal", /\blawsuit|litigation|court|sue[ds]?\b/i],
  ["regulatory", /\bregulat|compliance|enforce|fine[ds]?\b/i],
  ["market_moving", /\bIPO|merger|acquisition|earnings|revenue|stock|market\b/i],
  ["safety", /\brecall|contaminat|injury|accident|safety\b/i],
  ["security", /\bbreach|hack|cyber|ransomware|espionage\b/i],
  ["geopolitical", /\bsanction|tariff|embargo|diplomatic|geopolit\b/i],
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface NormalizationInput {
  scored_evidence: ScoredCompanyArticleEvidence;
  ingest_run_id: string;
}

export interface NormalizationResult {
  article: NormalizedArticle | null;
  skipped: boolean;
  skip_reason?: string;
}

/**
 * Normalize a single scored article into a NormalizedArticle.
 * Returns null if the article's evidence action is not normalizable.
 */
export function normalizeArticle(input: NormalizationInput): NormalizationResult {
  const { scored_evidence, ingest_run_id } = input;
  const { article: aq, source: sq, extracted_facts } = scored_evidence;

  // Gate: only normalize articles that passed 8A quality
  if (!NORMALIZABLE_ACTIONS.includes(aq.evidence_action)) {
    return {
      article: null,
      skipped: true,
      skip_reason: `evidence_action=${aq.evidence_action}`,
    };
  }

  const domain = extractDomain(aq.raw_url);
  const title_raw = aq.title_raw || "";
  const title_normalized = normalizeTitle(title_raw);
  const body = extractBodyText(scored_evidence);
  const now = new Date().toISOString();

  // Determine processing status
  let status: NormalizationStatus = "normalized";
  let block_reason: string | null = null;

  if (aq.hard_block_reasons.length > 0) {
    status = "blocked";
    block_reason = aq.hard_block_reasons.join(", ");
  } else if (!domain || domain === "unknown") {
    status = "failed_extraction";
    block_reason = "missing_url_or_domain";
  } else if (!title_raw && !body) {
    status = "failed_extraction";
    block_reason = "no_title_or_body";
  }

  // Generate article ID
  const article_id = generateArticleId(aq.canonical_url || aq.raw_url, title_normalized, sq.domain, aq.published_at);

  // Extract entities from title + body
  const entities = extractEntities(title_normalized, body);

  // Extract event tuple
  const event_tuples = extractEventTuples(article_id, title_normalized, body, entities, aq.published_at);
  const primary_tuple_id = event_tuples.length > 0 ? event_tuples[0].event_tuple_id : null;

  // Convert 8A extracted_facts to FactualClaim format
  const factual_claims = convertToFactualClaims(article_id, extracted_facts, aq.sensitivity_flags);

  // Build dedupe features
  const title_tokens = tokenize(title_normalized);
  const title_fingerprint = computeFingerprint(title_tokens);
  const entity_key = buildEntityKey(entities);
  const time_bucket = computeTimeBucket(aq.published_at);
  const place_key = buildPlaceKey(entities);
  const action_key = buildActionKey(event_tuples);

  // Detect syndication
  const syndication = detectSyndication(title_raw, body, aq.author?.type, sq.domain);

  // Build the normalized article
  const normalized: NormalizedArticle = {
    article_id,
    ingest_run_id,

    urls: {
      raw_url: aq.raw_url,
      fetched_url: null,
      canonical_url: aq.canonical_url || null,
      url_hash: simpleHash(aq.canonical_url || aq.raw_url),
      domain,
    },

    source: {
      source_id: sq.source_id,
      display_name: sq.display_name,
      domain: sq.domain,
      source_type: sq.source_type as SourceType,
      source_quality_grade: sq.source_quality_grade,
      home_region: sq.home_region || null,
      source_region: null,
      audience_region: null,
    },

    article_meta: {
      title_raw,
      title_normalized,
      language: aq.language || "en",
      translated_from: null,
      author: {
        name: aq.author?.name || null,
        type: (aq.author?.type || "unknown") as AuthorType,
        confidence: aq.author?.confidence ?? 0.5,
      },
      published_at: aq.published_at || null,
      updated_at: aq.updated_at || null,
      retrieved_at: aq.retrieved_at,
      dateline: null,
    },

    quality: {
      seo_sludge_score: aq.seo_sludge_score,
      article_quality_score: aq.article_quality_score,
      evidence_action: aq.evidence_action,
      email_evidence_eligible: isEmailEvidenceAction(aq.evidence_action),
      extraction_confidence: status === "normalized" ? 0.7 : 0.2,
      prompt_injection_flags: aq.hard_block_reasons.filter(r => r === "prompt_injection"),
      quality_flags: buildQualityFlags(aq),
    },

    syndication,

    normalized_content: {
      summary_1_sentence: buildOneSentenceSummary(title_normalized, body),
      factual_claims,
      quotes: extractQuotes(body),
      entities,
      topics: inferTopics(title_normalized, body),
      region_scope: extractRegionScope(entities),
      raw_text_ref: `raw:${article_id}`,
    },

    event_extraction: {
      event_tuples,
      primary_event_tuple_id: primary_tuple_id,
      event_extraction_notes: [],
    },

    dedupe_features: {
      normalized_title_tokens: title_tokens,
      title_fingerprint,
      entity_key,
      time_bucket,
      place_key,
      action_key,
    },

    processing: {
      status,
      block_reason,
      created_at: now,
      updated_at: now,
      schema_version: "normalized_article_v1",
    },
  };

  return { article: normalized, skipped: false };
}

/**
 * Normalize a batch of scored articles.
 */
export function normalizeArticleBatch(
  scored: ScoredCompanyArticleEvidence[],
  ingest_run_id: string
): { normalized: NormalizedArticle[]; skipped: number; failed: number } {
  const normalized: NormalizedArticle[] = [];
  let skipped = 0;
  let failed = 0;

  for (const evidence of scored) {
    const result = normalizeArticle({ scored_evidence: evidence, ingest_run_id });
    if (result.skipped) {
      skipped++;
    } else if (result.article) {
      if (result.article.processing.status === "normalized") {
        normalized.push(result.article);
      } else {
        failed++;
      }
    }
  }

  return { normalized, skipped, failed };
}

function isEmailEvidenceAction(action: EvidenceAction): boolean {
  return action === "email_anchor" || action === "email_support" || action === "review_required";
}

// ---------------------------------------------------------------------------
// Title normalization
// ---------------------------------------------------------------------------

/**
 * Clean publisher clutter, SEO fragments, and formatting from a title.
 */
export function normalizeTitle(raw: string): string {
  let title = raw.trim();

  // Remove publisher suffixes
  for (const pattern of PUBLISHER_SUFFIXES) {
    title = title.replace(pattern, "");
  }

  // Remove SEO patterns
  for (const pattern of SEO_TITLE_PATTERNS) {
    title = title.replace(pattern, "");
  }

  // Remove repeated pipes/dashes that are orphaned
  title = title.replace(/\s*[|]\s*$/, "");
  title = title.replace(/\s*[-–—]\s*$/, "");

  // Collapse whitespace
  title = title.replace(/\s+/g, " ").trim();

  return title || raw.trim();
}

// ---------------------------------------------------------------------------
// Entity extraction (deterministic, keyword-based)
// ---------------------------------------------------------------------------

/**
 * Extract named entities from title and body text.
 * V1: uses capitalized-word heuristic + common entity patterns.
 */
function extractEntities(title: string, body: string): NormalizedEntity[] {
  const entities: Map<string, NormalizedEntity> = new Map();
  const text = `${title}. ${body}`;

  // Extract capitalized multi-word names (simple NER approximation)
  const namePattern = /\b([A-Z][a-z]+(?:\s+(?:of|the|and|for|de|la|van|von|al-)?\s*[A-Z][a-z]+){1,4})\b/g;
  let match: RegExpExecArray | null;
  while ((match = namePattern.exec(text)) !== null) {
    const name = match[1].trim();
    // Skip common false positives
    if (isCommonPhrase(name)) continue;
    if (name.length < 4) continue;

    const type = inferEntityType(name);
    const role = inferEntityRole(name, title);
    const key = name.toLowerCase();

    if (!entities.has(key)) {
      entities.set(key, {
        name,
        type,
        role,
        confidence: 0.6,
      });
    }
  }

  // Extract country/region mentions
  for (const [country, code] of COUNTRY_PATTERNS) {
    if (text.includes(country)) {
      const key = country.toLowerCase();
      if (!entities.has(key)) {
        entities.set(key, {
          name: country,
          entity_id: `country:${code}`,
          type: "place",
          role: "location",
          confidence: 0.8,
        });
      }
    }
  }

  return Array.from(entities.values());
}

// Common country/region mentions
const COUNTRY_PATTERNS: [string, string][] = [
  ["United States", "US"], ["United Kingdom", "GB"], ["European Union", "EU"],
  ["China", "CN"], ["Japan", "JP"], ["Germany", "DE"], ["France", "FR"],
  ["India", "IN"], ["Brazil", "BR"], ["Australia", "AU"], ["Canada", "CA"],
  ["South Korea", "KR"], ["Russia", "RU"], ["Saudi Arabia", "SA"],
  ["Singapore", "SG"], ["Taiwan", "TW"], ["Hong Kong", "HK"],
  ["Indonesia", "ID"], ["Mexico", "MX"], ["Turkey", "TR"],
];

const COMMON_PHRASES = new Set([
  "the united", "the new", "the white", "the world", "the european",
  "new york", "wall street", "the associated", "the financial",
  "north korea", "south korea", "north america", "south america",
  "the guardian", "the economist", "the times",
]);

function isCommonPhrase(name: string): boolean {
  return COMMON_PHRASES.has(name.toLowerCase());
}

function inferEntityType(name: string): NormalizedEntity["type"] {
  const lower = name.toLowerCase();
  // Government/regulatory bodies
  if (/\b(commission|ministry|department|agency|authority|regulator|bureau|office of)\b/i.test(lower)) return "regulator";
  if (/\b(government|administration|parliament|congress|senate)\b/i.test(lower)) return "government";
  // Companies (common suffixes)
  if (/\b(inc|corp|ltd|plc|gmbh|sa|ag|co|group|holdings)\b/i.test(lower)) return "company";
  // People (simple heuristic: 2-3 word names without org markers)
  const words = name.split(/\s+/);
  if (words.length <= 3 && !lower.includes("the ") && /^[A-Z][a-z]+\s+[A-Z]/.test(name)) return "person";
  return "org";
}

function inferEntityRole(name: string, title: string): NormalizedEntity["role"] {
  // If entity appears at the start of the title, likely actor
  if (title.startsWith(name)) return "actor";
  return "mentioned";
}

// ---------------------------------------------------------------------------
// Event tuple extraction
// ---------------------------------------------------------------------------

/**
 * Extract event tuples from article text.
 * V1: heuristic-based extraction from headline + lede.
 */
function extractEventTuples(
  article_id: string,
  title: string,
  body: string,
  entities: NormalizedEntity[],
  published_at: string | null | undefined
): EventTuple[] {
  if (!title && !body) return [];

  const text = title || body.slice(0, 200);
  const action_class = inferActionClass(text);
  const event_status = inferEventStatus(text);

  // Find primary actor (first entity mentioned in title, or first org/company)
  const actor_entity = entities.find(e => e.role === "actor") ||
    entities.find(e => e.type === "regulator" || e.type === "government") ||
    entities.find(e => e.type === "company") ||
    entities.find(e => e.type === "org");

  const actor: EntityRef = actor_entity
    ? { name: actor_entity.name, canonical_id: actor_entity.entity_id || null, type: actor_entity.type }
    : { name: extractFirstSubject(title) || "Unknown", type: "other" };

  // Find action verb
  const action_raw = extractActionPhrase(title) || "reported development";
  const action_lemma = lemmatizeAction(action_raw);

  // Find object (what was acted on)
  const object_entity = entities.find(e => e.role === "object") ||
    entities.find(e => e.type !== actor_entity?.type && e.type !== "place");
  const object: EntityRef = object_entity
    ? { name: object_entity.name, canonical_id: object_entity.entity_id || null, type: object_entity.type }
    : { name: extractObjectPhrase(title, action_raw) || "unspecified", type: "other" };

  // Find places
  const places: PlaceRef[] = entities
    .filter(e => e.type === "place")
    .map(e => ({
      name: e.name,
      canonical_id: e.entity_id || null,
      type: "country" as const,
    }));

  // Event time
  const event_time_date = published_at || null;
  const granularity = event_time_date ? "day" as const : "unknown" as const;

  const tuple_id = `et_${simpleHash(`${article_id}:${actor.name}:${action_lemma}:${object.name}`)}`;

  const tuple: EventTuple = {
    event_tuple_id: tuple_id,
    article_id,
    actor,
    action: {
      raw: action_raw,
      lemma: action_lemma,
      action_class,
    },
    object,
    affected_entities: entities
      .filter(e => e.type === "company" || e.type === "org")
      .filter(e => e.name !== actor.name && e.name !== object.name)
      .map(e => ({ name: e.name, canonical_id: e.entity_id || null, type: e.type })),
    place: places,
    event_time: {
      date: event_time_date,
      granularity,
    },
    status: event_status,
    polarity: null,
    confidence: computeTupleConfidence(title, body, entities),
    support_claim_ids: [],
  };

  return [tuple];
}

function inferActionClass(text: string): ActionClass {
  for (const [actionClass, patterns] of Object.entries(ACTION_CLASS_KEYWORDS) as [ActionClass, RegExp[]][]) {
    if (actionClass === "other") continue;
    for (const pattern of patterns) {
      if (pattern.test(text)) return actionClass;
    }
  }
  return "other";
}

function inferEventStatus(text: string): EventStatus {
  for (const [status, patterns] of Object.entries(STATUS_KEYWORDS) as [EventStatus, RegExp[]][]) {
    for (const pattern of patterns) {
      if (pattern.test(text)) return status;
    }
  }
  return "reported";
}

function extractFirstSubject(title: string): string | null {
  // Take words before the first verb-like word
  const words = title.split(/\s+/);
  const verbPatterns = /^(says?|said|announces?|reports?|opens?|launches?|proposes?|reveals?|confirms?|denies?|plans?|warns?|faces?|seeks?)/i;
  for (let i = 0; i < Math.min(words.length, 8); i++) {
    if (verbPatterns.test(words[i])) {
      return words.slice(0, i).join(" ") || null;
    }
  }
  return words.slice(0, 3).join(" ");
}

function extractActionPhrase(title: string): string | null {
  // Look for verb phrases in the title
  const verbMatch = title.match(
    /\b(opens?|launches?|proposes?|announces?|reports?|confirms?|denies?|plans?|reveals?|warns?|faces?|seeks?|investigat\w*|approv\w*|reject\w*|cut\w*|rais\w*|lower\w*|suspend\w*|ban\w*|fine[ds]?\w*|start\w*|end\w*|sign\w*|acquir\w*|merg\w*|recall\w*)\s+([^.!?]{3,50})/i
  );
  if (verbMatch) return verbMatch[0].trim();
  return null;
}

function extractObjectPhrase(title: string, actionPhrase: string): string | null {
  if (!actionPhrase) return null;
  const idx = title.toLowerCase().indexOf(actionPhrase.toLowerCase());
  if (idx >= 0) {
    let afterAction = title.slice(idx + actionPhrase.length).trim();
    // Truncate at natural break points for cleaner object names
    const breakMatch = afterAction.match(/^([^,;|–—]{3,60})(?:[,;|–—]|$)/);
    if (breakMatch) afterAction = breakMatch[1].trim();
    if (afterAction.length > 3) return afterAction.slice(0, 60);
  }
  return null;
}

function lemmatizeAction(raw: string): string {
  // Simple lemmatization: strip common suffixes
  return raw
    .toLowerCase()
    .replace(/\b(announces?d?)\b/g, "announce")
    .replace(/\b(proposed?s?)\b/g, "propose")
    .replace(/\b(open(?:ed|s)?)\b/g, "open")
    .replace(/\b(launch(?:ed|es)?)\b/g, "launch")
    .replace(/\b(report(?:ed|s)?)\b/g, "report")
    .replace(/\b(confirm(?:ed|s)?)\b/g, "confirm")
    .replace(/\b(den(?:ied|ies|y))\b/g, "deny")
    .replace(/\b(investigat(?:ed?|es?|ing|ion))\b/g, "investigate")
    .trim();
}

function computeTupleConfidence(title: string, body: string, entities: NormalizedEntity[]): number {
  let conf = 0.4; // base
  if (title.length > 20) conf += 0.1;
  if (body.length > 200) conf += 0.1;
  if (entities.length >= 2) conf += 0.1;
  if (entities.some(e => e.type === "place")) conf += 0.05;
  if (entities.some(e => e.type === "company" || e.type === "regulator")) conf += 0.1;
  // Cap at 0.9 since we're using heuristics, not NLP
  return Math.min(conf, 0.9);
}

// ---------------------------------------------------------------------------
// Syndication detection
// ---------------------------------------------------------------------------

function detectSyndication(
  title_raw: string,
  body: string,
  author_type: AuthorType | undefined,
  domain: string
): NormalizedArticle["syndication"] {
  const evidence: string[] = [];
  let is_syndicated = false;
  let canonical_wire: string | null = null;
  let confidence = 0;

  // Check for wire service byline
  if (author_type === "wire") {
    evidence.push("wire_byline");
    is_syndicated = true;
    confidence += 0.4;
  }

  // Check body for wire service markers
  for (const pattern of WIRE_SERVICE_PATTERNS) {
    if (pattern.test(body.slice(0, 500))) {
      evidence.push("wire_marker_in_lede");
      is_syndicated = true;
      confidence += 0.3;
      if (/reuters/i.test(body)) canonical_wire = "reuters";
      else if (/associated press|^\(ap\)/i.test(body)) canonical_wire = "ap";
      else if (/afp|agence france/i.test(body)) canonical_wire = "afp";
      break;
    }
  }

  // Check if title contains wire indicator
  if (/\breuters\b/i.test(title_raw) || /\bAP\b/.test(title_raw)) {
    evidence.push("wire_in_title");
    is_syndicated = true;
    confidence += 0.2;
  }

  return {
    is_syndicated,
    original_source_id: canonical_wire ? `wire:${canonical_wire}` : null,
    original_article_id: null,
    canonical_wire,
    syndication_confidence: Math.min(confidence, 1.0),
    evidence,
  };
}

// ---------------------------------------------------------------------------
// Factual claim conversion
// ---------------------------------------------------------------------------

function convertToFactualClaims(
  article_id: string,
  extracted_facts: ScoredCompanyArticleEvidence["extracted_facts"],
  sensitivity_flags: string[]
): FactualClaim[] {
  return extracted_facts.map((f, i) => {
    const claim_type = mapClaimType(f.claim_type);
    const uncertainty_flags: string[] = [];

    // Check for uncertainty language in the fact text
    if (/\balleg/i.test(f.text)) uncertainty_flags.push("alleged");
    if (/\breport(?:ed|s)?\b/i.test(f.text)) uncertainty_flags.push("reported");
    if (/\bestimate/i.test(f.text)) uncertainty_flags.push("estimated");
    if (/\bunnamed\b|unnamed source/i.test(f.text)) uncertainty_flags.push("unnamed_sources");
    if (/\bdeveloping\b/i.test(f.text)) uncertainty_flags.push("developing");

    return {
      claim_id: f.fact_id || `claim_${article_id}_${i}`,
      article_id,
      text: f.text,
      claim_type,
      entities: f.entities,
      confidence: f.confidence,
      requires_attribution: f.attribution_required || sensitivity_flags.length > 0,
      uncertainty_flags,
    };
  });
}

function mapClaimType(input: string): FactualClaim["claim_type"] {
  switch (input) {
    case "event": return "fact";
    case "number": return "stat";
    case "quote": return "quote";
    case "policy": return "fact";
    case "filing": return "fact";
    case "context": return "background";
    case "impact": return "analysis";
    default: return "fact";
  }
}

// ---------------------------------------------------------------------------
// Dedupe feature generation
// ---------------------------------------------------------------------------

/**
 * Tokenize text into lowercased, cleaned tokens.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Compute a stable fingerprint from token array using a simple hash.
 */
export function computeFingerprint(tokens: string[]): string {
  return simpleHash(tokens.join("|"));
}

/**
 * Build a sorted canonical entity key for blocking/comparison.
 */
function buildEntityKey(entities: NormalizedEntity[]): string {
  const key_entities = entities
    .filter(e => e.type === "company" || e.type === "regulator" || e.type === "org" || e.type === "person")
    .map(e => e.name.toLowerCase())
    .sort();
  return key_entities.join("|") || "no_entities";
}

function computeTimeBucket(published_at: string | null | undefined): string | null {
  if (!published_at) return null;
  try {
    const d = new Date(published_at);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return null;
  }
}

function buildPlaceKey(entities: NormalizedEntity[]): string | null {
  const places = entities
    .filter(e => e.type === "place")
    .map(e => e.name.toLowerCase())
    .sort();
  return places.length > 0 ? places.join("|") : null;
}

function buildActionKey(tuples: EventTuple[]): string | null {
  if (tuples.length === 0) return null;
  return tuples[0].action.action_class;
}

// ---------------------------------------------------------------------------
// Pairwise similarity for dedupe
// ---------------------------------------------------------------------------

export interface PairwiseSimilarity {
  article_a: string;
  article_b: string;
  title_similarity: number;
  entity_overlap: number;
  time_match: boolean;
  place_match: boolean;
  action_match: boolean;
  weighted_score: number;
  decision: "duplicate_copy" | "same_event" | "related" | "separate";
  reason_codes: string[];
}

/**
 * Compute pairwise similarity between two normalized articles.
 * Used by the clustering module to decide merges.
 */
export function computePairwiseSimilarity(
  a: NormalizedArticle,
  b: NormalizedArticle
): PairwiseSimilarity {
  const reason_codes: string[] = [];

  // 1. Canonical URL match
  if (a.urls.canonical_url && b.urls.canonical_url &&
      normalizeUrl(a.urls.canonical_url) === normalizeUrl(b.urls.canonical_url)) {
    return {
      article_a: a.article_id,
      article_b: b.article_id,
      title_similarity: 1.0,
      entity_overlap: 1.0,
      time_match: true,
      place_match: true,
      action_match: true,
      weighted_score: 1.0,
      decision: "duplicate_copy",
      reason_codes: ["canonical_url_match"],
    };
  }

  // 2. URL hash match (same raw URL, different canonical)
  if (a.urls.url_hash === b.urls.url_hash) {
    return {
      article_a: a.article_id,
      article_b: b.article_id,
      title_similarity: 1.0,
      entity_overlap: 1.0,
      time_match: true,
      place_match: true,
      action_match: true,
      weighted_score: 0.99,
      decision: "duplicate_copy",
      reason_codes: ["url_hash_match"],
    };
  }

  // 3. Title similarity (Jaccard over tokens)
  const title_sim = jaccardSimilarity(
    a.dedupe_features.normalized_title_tokens,
    b.dedupe_features.normalized_title_tokens
  );

  // 4. Entity overlap
  const entity_overlap = computeEntityOverlap(
    a.normalized_content.entities,
    b.normalized_content.entities
  );

  // 5. Time match
  const time_match = a.dedupe_features.time_bucket !== null &&
    b.dedupe_features.time_bucket !== null &&
    a.dedupe_features.time_bucket === b.dedupe_features.time_bucket;

  // 6. Place match
  const place_match = a.dedupe_features.place_key !== null &&
    b.dedupe_features.place_key !== null &&
    a.dedupe_features.place_key === b.dedupe_features.place_key;

  // 7. Action match
  const action_match = a.dedupe_features.action_key !== null &&
    b.dedupe_features.action_key !== null &&
    a.dedupe_features.action_key === b.dedupe_features.action_key;

  // 8. Title fingerprint exact match (near-duplicate titles)
  const fingerprint_match = a.dedupe_features.title_fingerprint === b.dedupe_features.title_fingerprint;

  // 9. Claim/body text overlap — compare factual claims as additional signal
  const claimsA = a.normalized_content.factual_claims.map(c => c.text.toLowerCase());
  const claimsB = b.normalized_content.factual_claims.map(c => c.text.toLowerCase());
  const claimTokensA = claimsA.flatMap(c => c.split(/\s+/).filter(t => t.length > 3));
  const claimTokensB = claimsB.flatMap(c => c.split(/\s+/).filter(t => t.length > 3));
  const claim_overlap = claimTokensA.length > 0 && claimTokensB.length > 0
    ? jaccardSimilarity(claimTokensA, claimTokensB)
    : 0;

  // Weighted score for event clustering (non-duplicate)
  // Weights from spec (adapted for v1 heuristic NER):
  // entity match 25%, title similarity 20%, action 15%, time 12%, place 10%,
  // claim overlap 10%, fingerprint 8%
  const weighted_score =
    0.25 * entity_overlap +
    0.20 * title_sim +
    0.15 * (action_match ? 1.0 : 0.0) +
    0.12 * (time_match ? 1.0 : 0.0) +
    0.10 * (place_match ? 1.0 : 0.0) +
    0.10 * claim_overlap +
    0.08 * (fingerprint_match ? 1.0 : 0.0);

  // Build reasons
  if (title_sim >= 0.9) reason_codes.push("near_identical_title");
  if (fingerprint_match) reason_codes.push("fingerprint_match");
  if (entity_overlap >= 0.7) reason_codes.push("high_entity_overlap");
  if (time_match) reason_codes.push("same_time_bucket");
  if (place_match) reason_codes.push("same_place");
  if (action_match) reason_codes.push("same_action_class");
  if (claim_overlap >= 0.3) reason_codes.push("claim_text_overlap");

  // Decision thresholds from spec
  let decision: PairwiseSimilarity["decision"];

  // Check for hard splits first
  if (hasHardSplit(a, b)) {
    decision = "separate";
    reason_codes.push("hard_split_condition");
  } else if (title_sim >= 0.90 || fingerprint_match) {
    decision = "duplicate_copy";
    reason_codes.push("near_duplicate_text");
  } else if (weighted_score >= 0.86) {
    decision = "same_event";
    reason_codes.push("high_confidence_same_event");
  } else if (weighted_score >= 0.68 && entity_overlap >= 0.5 && (time_match || action_match)) {
    decision = "same_event";
    reason_codes.push("medium_confidence_same_event");
  } else if (weighted_score >= 0.45 && action_match && time_match && entity_overlap > 0) {
    // V1 heuristic NER fallback: when structural signals (action class + time)
    // match and there is any entity overlap, treat as same event even if overall
    // score is moderate. This compensates for imprecise entity extraction.
    decision = "same_event";
    reason_codes.push("structural_match_same_event");
  } else if (weighted_score >= 0.50 && entity_overlap >= 0.3) {
    decision = "related";
    reason_codes.push("related_topic");
  } else if (weighted_score >= 0.40 && action_match && time_match) {
    decision = "related";
    reason_codes.push("structural_related");
  } else {
    decision = "separate";
    reason_codes.push("below_similarity_threshold");
  }

  return {
    article_a: a.article_id,
    article_b: b.article_id,
    title_similarity: title_sim,
    entity_overlap,
    time_match,
    place_match,
    action_match,
    weighted_score,
    decision,
    reason_codes,
  };
}

/**
 * Check for hard split conditions that prevent merging even if similarity
 * scores are high.
 */
function hasHardSplit(a: NormalizedArticle, b: NormalizedArticle): boolean {
  const a_tuples = a.event_extraction.event_tuples;
  const b_tuples = b.event_extraction.event_tuples;

  if (a_tuples.length === 0 || b_tuples.length === 0) return false;

  const a_tuple = a_tuples[0];
  const b_tuple = b_tuples[0];

  // Different quarters/results periods
  if (a_tuple.action.action_class === "financial_result" && b_tuple.action.action_class === "financial_result") {
    const a_q = extractQuarterMention(a.article_meta.title_normalized);
    const b_q = extractQuarterMention(b.article_meta.title_normalized);
    if (a_q && b_q && a_q !== b_q) return true;
  }

  // Different event dates (more than 7 days apart)
  const a_date = a.dedupe_features.time_bucket;
  const b_date = b.dedupe_features.time_bucket;
  if (a_date && b_date) {
    const diff = Math.abs(new Date(a_date).getTime() - new Date(b_date).getTime());
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) return true;
  }

  // Proposal vs final approval (different status)
  if (
    (a_tuple.status === "proposed" && b_tuple.status === "confirmed") ||
    (a_tuple.status === "confirmed" && b_tuple.status === "proposed")
  ) {
    // Only split if dates are materially different
    if (a_date && b_date && a_date !== b_date) return true;
  }

  return false;
}

function extractQuarterMention(text: string): string | null {
  const match = text.match(/\b(Q[1-4])\s*(\d{4})?\b/i);
  if (match) return match[0].toUpperCase();
  return null;
}

// ---------------------------------------------------------------------------
// Jaccard similarity
// ---------------------------------------------------------------------------

/**
 * Compute Jaccard similarity between two string arrays.
 */
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Compute entity name overlap between two entity lists.
 */
function computeEntityOverlap(a: NormalizedEntity[], b: NormalizedEntity[]): number {
  const namesA = new Set(a.map(e => e.name.toLowerCase()));
  const namesB = new Set(b.map(e => e.name.toLowerCase()));
  if (namesA.size === 0 && namesB.size === 0) return 0;
  let intersection = 0;
  for (const name of namesA) {
    if (namesB.has(name)) intersection++;
  }
  const union = namesA.size + namesB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function extractDomain(urlOrDomain: string | null | undefined): string {
  if (!urlOrDomain) return "unknown";
  try {
    if (urlOrDomain.includes("://")) {
      return new URL(urlOrDomain).hostname.replace(/^www\./, "");
    }
    return urlOrDomain.replace(/^www\./, "").toLowerCase();
  } catch {
    return urlOrDomain.replace(/^www\./, "").toLowerCase();
  }
}

function extractBodyText(evidence: ScoredCompanyArticleEvidence): string {
  // Use extracted facts as body proxy if no raw text
  if (evidence.extracted_facts.length > 0) {
    return evidence.extracted_facts.map(f => f.text).join(". ");
  }
  return "";
}

function generateArticleId(
  url: string,
  title: string,
  domain: string,
  published_at: string | null | undefined
): string {
  const key = url || `${title}:${domain}:${published_at || ""}`;
  return `art_${simpleHash(key)}`;
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).padStart(8, "0").slice(0, 8);
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`.replace(/\/$/, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function buildOneSentenceSummary(title: string, body: string): string {
  // Use the first sentence of body, or title
  if (body) {
    const firstSentence = body.match(/^[^.!?]+[.!?]/);
    if (firstSentence && firstSentence[0].length > 20) {
      return firstSentence[0].trim();
    }
  }
  return title || "No summary available.";
}

function extractQuotes(body: string): ExtractedQuote[] {
  const quotes: ExtractedQuote[] = [];
  // Match direct quotes: "..." said X or X said "..."
  const quotePattern = /"([^"]{10,200})"\s*(?:,?\s*(?:said|told|stated|added|noted|explained)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}))/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = quotePattern.exec(body)) !== null && i < 5) {
    quotes.push({
      quote_id: `q_${i}`,
      speaker: match[2],
      text: match[1],
      quote_type: "direct",
      confidence: 0.7,
    });
    i++;
  }
  return quotes;
}

function inferTopics(title: string, body: string): string[] {
  const topics: string[] = [];
  const text = `${title} ${body}`.toLowerCase();

  const topicPatterns: [string, RegExp][] = [
    ["regulation", /\bregulat|compliance|enforcement\b/],
    ["trade", /\btrade|tariff|import|export\b/],
    ["technology", /\btechnolog|ai |artificial intelligence|software|digital\b/],
    ["finance", /\bfinancial|banking|investment|fiscal\b/],
    ["energy", /\benergy|oil|gas|renewable|solar|wind\b/],
    ["healthcare", /\bhealth|pharma|medical|hospital\b/],
    ["climate", /\bclimate|emission|carbon|sustainability\b/],
    ["security", /\bcyber|security|defense|military\b/],
    ["labor", /\blabor|worker|union|employment|hiring\b/],
    ["supply_chain", /\bsupply chain|logistics|shipping|freight\b/],
  ];

  for (const [topic, pattern] of topicPatterns) {
    if (pattern.test(text)) topics.push(topic);
  }

  return topics.slice(0, 5);
}

function extractRegionScope(entities: NormalizedEntity[]): string[] {
  return entities
    .filter(e => e.type === "place")
    .map(e => e.name)
    .slice(0, 5);
}

function buildQualityFlags(aq: ArticleQualityRecord): string[] {
  const flags: string[] = [];
  if (!aq.has_reliable_timestamp) flags.push("no_timestamp");
  if (!aq.has_extractable_event) flags.push("no_event");
  if (aq.factual_density_score < 0.2) flags.push("thin_content");
  if (aq.syndication.is_syndicated && !aq.syndication.attribution_present) flags.push("uncited_syndication");
  if (aq.boilerplate_ratio > 0.6) flags.push("high_boilerplate");
  return flags;
}

// Stop words for tokenization
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "may", "might", "must", "can", "could", "to", "of", "in",
  "for", "on", "with", "at", "by", "from", "as", "into", "through",
  "during", "before", "after", "above", "below", "between", "out",
  "off", "up", "down", "and", "but", "or", "nor", "not", "no", "so",
  "if", "then", "than", "too", "very", "just", "about", "also", "more",
  "its", "it", "this", "that", "these", "those", "he", "she", "they",
  "we", "you", "who", "which", "what", "when", "where", "how", "all",
  "each", "every", "both", "few", "many", "much", "some", "any", "most",
  "other", "over", "such", "only",
]);
