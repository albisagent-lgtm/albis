// ---------------------------------------------------------------------------
// Signal parser — Package 5.
//
// Deterministic transformer: raw article → SignalDraft. No LLM calls.
// Package 8 may upgrade this with OpenAI extraction; this V1 keeps the
// extraction local, predictable, and testable.
//
// Behavior:
//   - headline pulled verbatim from the article
//   - summary built from the first 2-3 sentences of the body
//   - signal_type inferred from headline keyword scan (default 'other')
//   - entities / themes / regions extracted by scanning the canonical
//     alias index against headline + summary text. Type-scoped: only
//     'entity' canonicals can populate entities[], etc.
//   - canonical_*_ids populated alongside the raw arrays since the
//     extraction step already knows the canonical id for every match.
//   - source_* fields passed through from the article
//   - confidence default 1.0 (deterministic)
//   - urgency / significance default 0.50 (neutral; package 6+ may infer)
// ---------------------------------------------------------------------------
import type { CanonicalAliasIndex, CanonicalAliasIndexEntry } from "./canonical-alias-index";
import type { RawArticle, SignalDraft, SignalType } from "./types";
import type { CanonicalTopicType } from "../canonical-resolver";

// TODO(pkg-8): consider an OpenAI-backed extraction path that returns
// signal_type, entities, themes, regions, urgency, and significance in a
// single structured-output call. Keep this deterministic path as the
// always-available fallback.

const SIGNAL_TYPE_KEYWORDS: Array<{ type: SignalType; terms: string[] }> = [
  {
    type: "regulatory",
    terms: [
      "regulation", "regulatory", "regulator", "compliance", "filing",
      "rule", "ruling", "watchdog", "oversight",
    ],
  },
  {
    type: "policy",
    terms: [
      "policy", "law", "legislation", "bill", "act", "statute",
      "executive order", "decree", "directive", "framework",
    ],
  },
  {
    type: "disruption",
    terms: [
      "disruption", "outage", "shortage", "strike", "blockade", "halt",
      "shutdown", "delay", "closure", "suspension", "evacuation",
      "shutdown", "force majeure",
    ],
  },
  {
    type: "market",
    terms: [
      "price", "prices", "market", "shares", "stock", "rally", "slump",
      "tumble", "surge", "rate", "yields", "currency", "futures",
    ],
  },
  {
    type: "statement",
    terms: [
      "statement", "said", "told", "warned", "denied", "comment",
      "remarks", "address", "speech", "interview",
    ],
  },
  {
    type: "announcement",
    terms: [
      "announces", "announced", "launches", "launched", "unveils",
      "unveiled", "introduces", "release", "released", "rollout",
      "deal", "agreement", "partnership", "merger", "acquisition",
    ],
  },
];

export function inferSignalType(headline: string): SignalType {
  const lower = headline.toLowerCase();
  for (const { type, terms } of SIGNAL_TYPE_KEYWORDS) {
    if (terms.some((t) => lower.includes(t))) return type;
  }
  return "other";
}

/**
 * Build a 2-3 sentence summary from raw body text. Trims, splits on
 * sentence-ending punctuation, joins the first chunks, caps length.
 */
export function buildSummary(body: string, maxChars: number = 480): string {
  const trimmed = (body || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";

  const sentenceEnd = /([.!?])\s+/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = sentenceEnd.exec(trimmed)) !== null) {
    sentences.push(trimmed.slice(lastIndex, match.index + 1).trim());
    lastIndex = match.index + match[0].length;
    if (sentences.length >= 3) break;
  }
  if (sentences.length === 0) {
    // No sentence punctuation — return a hard slice.
    return trimmed.slice(0, maxChars).trim();
  }
  if (sentences.length < 3 && lastIndex < trimmed.length) {
    sentences.push(trimmed.slice(lastIndex).trim());
  }
  let out = sentences.slice(0, 3).join(" ").trim();
  if (out.length > maxChars) out = out.slice(0, maxChars).trim();
  return out;
}

/**
 * Type → (raw arrays, canonical id arrays) buckets for an article. Same
 * topic_type may map to multiple Signal fields (e.g. 'theme' → themes[],
 * 'commodity' / 'risk' / 'policy' / 'route' also flow into themes[] for
 * V1 since the Signal schema doesn't carve those out separately).
 */
const TYPE_TO_FIELD: Record<CanonicalTopicType, "entities" | "themes" | "regions" | null> = {
  entity: "entities",
  institution: "entities",
  region: "regions",
  theme: "themes",
  sector: "themes",
  commodity: "themes",
  policy: "themes",
  route: "themes",
  risk: "themes",
};

interface ExtractionBuckets {
  entities: { raw: string[]; ids: string[] };
  themes: { raw: string[]; ids: string[] };
  regions: { raw: string[]; ids: string[] };
}

function emptyBuckets(): ExtractionBuckets {
  return {
    entities: { raw: [], ids: [] },
    themes: { raw: [], ids: [] },
    regions: { raw: [], ids: [] },
  };
}

function tryMatchEntry(text: string, entry: CanonicalAliasIndexEntry): boolean {
  for (const term of entry.terms) {
    if (term.length < 3) continue; // skip noise like "us" / "ai"
    if (text.includes(term)) return true;
  }
  return false;
}

/**
 * Scan article text against the canonical alias index, populating the
 * per-field raw + canonical id arrays. Type-scoped: an "entity" canonical
 * only populates entities[], etc. Skips dedupes.
 */
export function extractCanonicalsFromText(
  text: string,
  index: CanonicalAliasIndex
): ExtractionBuckets {
  const buckets = emptyBuckets();
  if (!text) return buckets;
  const lower = text.toLowerCase();

  const seen = new Set<string>();
  for (const [topicType, entries] of index.byType) {
    const field = TYPE_TO_FIELD[topicType];
    if (!field) continue;
    for (const entry of entries) {
      if (seen.has(entry.canonical_topic_id)) continue;
      if (!tryMatchEntry(lower, entry)) continue;
      seen.add(entry.canonical_topic_id);
      buckets[field].raw.push(entry.canonical_label);
      buckets[field].ids.push(entry.canonical_topic_id);
    }
  }
  return buckets;
}

/**
 * Build a SignalDraft from a raw article + the preloaded canonical alias
 * index. Returns null only if the article lacks a usable headline.
 */
export function parseSignalFromArticle(
  article: RawArticle,
  index: CanonicalAliasIndex,
  options: { signalDate?: string } = {}
): SignalDraft | null {
  const headline = (article.headline || "").trim();
  if (!headline) return null;

  const summary = buildSummary(article.body || "");
  const signalDate =
    options.signalDate ||
    (article.published_at
      ? article.published_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10));

  const text = `${headline}\n${summary}`;
  const buckets = extractCanonicalsFromText(text, index);

  return {
    signal_date: signalDate,
    headline,
    summary,
    signal_type: inferSignalType(headline),
    entities: buckets.entities.raw,
    canonical_entity_ids: buckets.entities.ids,
    themes: buckets.themes.raw,
    canonical_theme_ids: buckets.themes.ids,
    regions: buckets.regions.raw,
    canonical_region_ids: buckets.regions.ids,
    source_url: article.url || null,
    source_domain: article.source_domain || null,
    source_language: article.source_language || null,
    source_region: article.source_region || null,
    confidence: 1.0,
    urgency: 0.5,
    significance: 0.5,
  };
}
