import type { BlogPost } from "./blog";

export type GeneratedSignal = {
  slug: string;
  article_slug: string;
  article_url: string;
  title: string;
  summary: string;
  bullets: string[];
  still_unclear: string | null;
  category: string | null;
  region: string | null;
  tags: string[];
  source_note: string | null;
  published_at?: string;
  metadata: Record<string, unknown>;
};

type ArticleLike = Pick<BlogPost, "slug" | "title" | "description" | "category" | "tags" | "date" | "content"> & {
  frontmatter?: Record<string, unknown>;
  excerpt?: string;
  research?: unknown;
};

const BANNED_SIGNAL_PHRASES = [
  "why it matters",
  "that is why",
  "that is hot",
  "that time lag is the story",
  "the deeper signal",
  "this is more than",
  "the headline is about",
  "for albis",
  "not at a standstill",
  "the money is large",
  "the schedule is long",
  "the heat is already here",
];

const CATEGORY_SECTION_MAP: Record<string, string> = {
  "current-events": "world",
  geopolitics: "world",
  conflict: "world",
  governance: "world",
  breaking: "world",
  health: "health",
  "economic-flows": "business",
  business: "business",
  money: "money",
  "tech-ai": "technology",
  "cyber-info-warfare": "technology",
  technology: "technology",
  "science-space": "science",
  climate: "climate",
  energy: "life-systems",
  food: "life-systems",
  water: "life-systems",
  "life-systems": "life-systems",
  "climate-energy": "life-systems",
  perspectives: "perspectives",
  "media-literacy": "perspectives",
};

function cleanText(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .replace(/[\s,;:.-]+$/, "")
    .trim();
}

function sentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ensurePeriod(value: string) {
  if (!value) return value;
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function hasBannedScaffolding(value: string) {
  const lower = value.toLowerCase();
  return BANNED_SIGNAL_PHRASES.some((phrase) => lower.includes(phrase));
}

function splitSentences(text: string) {
  return text
    .replace(/\[[^\]]+\]/g, "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => cleanText(s, 180))
    .filter((s) => s.length >= 35 && s.length <= 180)
    .filter((s) => !hasBannedScaffolding(s));
}

function uniq(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const found = value.find((v) => typeof v === "string" && v.trim());
    return found ? found.trim() : null;
  }
  return null;
}

function deriveRegion(article: ArticleLike) {
  const fm = article.frontmatter || {};
  return (
    firstString(fm.primaryLocation) ||
    firstString(fm.primary_location) ||
    firstString(fm.regions_found) ||
    firstString(fm.regions) ||
    firstString((fm.articleSignals as Record<string, unknown> | undefined)?.primaryLocation) ||
    null
  );
}

export function getArticleUrlForSignal(article: Pick<ArticleLike, "slug" | "category">) {
  const section = CATEGORY_SECTION_MAP[article.category || ""] || "analysis";
  return `/${section}/${article.slug}`;
}

export function validateGeneratedSignal(signal: GeneratedSignal): { ok: true } | { ok: false; reason: string } {
  if (!signal.title || signal.title.length > 120) return { ok: false, reason: "title missing or too long" };
  if (signal.summary && signal.summary.length > 260) return { ok: false, reason: "summary too long" };
  if (!Array.isArray(signal.bullets) || signal.bullets.length < 3 || signal.bullets.length > 6) {
    return { ok: false, reason: `expected 3-6 bullets, got ${signal.bullets?.length || 0}` };
  }
  for (const bullet of signal.bullets) {
    if (!bullet || bullet.length > 180) return { ok: false, reason: "bullet missing or too long" };
  }
  if (signal.still_unclear && signal.still_unclear.length > 220) return { ok: false, reason: "still_unclear too long" };
  const combined = [signal.title, signal.summary, ...signal.bullets, signal.still_unclear || ""].join("\n");
  if (hasBannedScaffolding(combined)) return { ok: false, reason: "contains banned signal scaffolding" };
  return { ok: true };
}

export function generatePublicSignalFromArticle(article: ArticleLike): GeneratedSignal | null {
  const fm = article.frontmatter || {};
  const articleSignals = (fm.article_signals || fm.articleSignals || {}) as Record<string, unknown>;
  const contentSentences = splitSentences(article.content || "").slice(0, 10);
  const frontmatterCandidates = [
    firstString(articleSignals.coreFact),
    firstString(articleSignals.keyNumber),
    firstString(articleSignals.mechanism),
    firstString(articleSignals.connection),
    firstString(fm.significance),
    firstString(fm.connection),
  ]
    .filter(Boolean)
    .map((v) => ensurePeriod(sentenceCase(cleanText(v, 180))));

  const bullets = uniq([...frontmatterCandidates, ...contentSentences.map((s) => ensurePeriod(s))])
    .filter((b) => b.length >= 28 && b.length <= 180)
    .slice(0, 5);

  if (bullets.length < 3) return null;

  const stillUnclear = cleanText(
    firstString(fm.still_unclear) || firstString(fm.open_question) || "What local readers are seeing from the ground.",
    220,
  );

  const title = cleanText(article.title, 120);
  const summary = cleanText(article.description || article.excerpt || bullets[0], 260);
  const sourceNote = firstString(fm.source_note) || "Generated from a published Albis report.";

  const signal: GeneratedSignal = {
    slug: article.slug,
    article_slug: article.slug,
    article_url: getArticleUrlForSignal(article),
    title,
    summary,
    bullets,
    still_unclear: stillUnclear || null,
    category: article.category || null,
    region: deriveRegion(article),
    tags: article.tags || [],
    source_note: sourceNote,
    published_at: article.date ? new Date(article.date).toISOString() : undefined,
    metadata: {
      generated_by: "deterministic_mvp",
      article_date: article.date || null,
    },
  };

  const validation = validateGeneratedSignal(signal);
  return validation.ok ? signal : null;
}
