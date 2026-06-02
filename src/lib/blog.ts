import fs from "fs";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";
import { createAnonClient } from "@/lib/supabase/anon";
export { CATEGORIES } from "./categories";
export type { CategorySlug } from "./categories";
import type { CategorySlug } from "./categories";
export { PILLARS } from "./pillars";
export type { PillarSlug } from "./pillars";
import type { PillarSlug } from "./pillars";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface FAQ {
  q: string;
  a: string;
}

export interface Source {
  name: string;
  url?: string;
  region?: string;
}

export type ConfidenceLevel = 'confirmed' | 'developing' | 'disputed' | 'unverifiable';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedDate?: string;
  author: string;
  image: string;
  tags: string[];
  category: CategorySlug;
  pillars?: PillarSlug[];
  faqs?: FAQ[];
  sources: Source[];
  confidence: ConfidenceLevel;
  readingTime: number;
  content: string;
  noindex?: boolean;
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 230);
}

/* ─── Supabase row shape ─── */

interface ArticleRow {
  slug: string;
  title: string;
  description: string | null;
  date: string | null;
  category: string | null;
  tags: string[] | null;
  keywords: string[] | null;
  image: string | null;
  excerpt: string | null;
  author: string | null;
  // Optional: listing queries omit this column to keep payloads small. Only
  // single-article reads (getPostBySlug) include it.
  content?: string | null;
  reading_time: number | null;
  published_at: string;
  frontmatter: Record<string, unknown> | null;
}

function rowToPost(row: ArticleRow): BlogPost {
  const fm = (row.frontmatter ?? {}) as Record<string, unknown>;
  const pillarsRaw = fm.pillars;
  const pillars = pillarsRaw
    ? (Array.isArray(pillarsRaw) ? pillarsRaw : [pillarsRaw]) as PillarSlug[]
    : undefined;

  const dateStr = (() => {
    if (row.date) return row.date;
    if (row.published_at) return row.published_at.split("T")[0];
    return "";
  })();

  return {
    slug: row.slug,
    title: row.title || row.slug,
    description: row.description || row.excerpt || "",
    date: dateStr,
    updatedDate: typeof fm.updatedDate === "string" ? fm.updatedDate : undefined,
    author: row.author || "Albis",
    image: row.image || "/og-image.png",
    tags: row.tags || [],
    category: (row.category as CategorySlug) || 'analysis',
    pillars,
    faqs: Array.isArray(fm.faqs) ? (fm.faqs as FAQ[]) : undefined,
    sources: Array.isArray(fm.sources) ? (fm.sources as Source[]) : [],
    confidence: (typeof fm.confidence === "string" ? fm.confidence : "developing") as ConfidenceLevel,
    readingTime: row.reading_time ?? estimateReadingTime(row.content || ""),
    content: row.content || "",
    noindex: fm.noindex === true,
  };
}

// Listing columns omit `content` — the body is several KB per row and
// a 951-row fetch was pulling multi-MB payloads (~3.3s) for every page
// render that needed a link-candidate list or section grid.
const ARTICLE_COLUMNS_LIST = "slug,title,description,date,category,tags,keywords,image,excerpt,author,reading_time,published_at,frontmatter";
const ARTICLE_COLUMNS_FULL = ARTICLE_COLUMNS_LIST + ",content";

/* ─── Supabase fetchers ─── */

async function supabaseGetAllPosts(): Promise<BlogPost[] | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_COLUMNS_LIST)
      .order("published_at", { ascending: false })
      .limit(2000);
    if (error) {
      console.error("[blog] supabase getAllPosts error:", error.message);
      return null;
    }
    if (!data || data.length === 0) return null;
    return (data as ArticleRow[]).map(rowToPost).filter((p) => !p.noindex);
  } catch (e) {
    console.error("[blog] supabase getAllPosts threw:", e);
    return null;
  }
}

async function supabaseGetRecentPosts(limit: number): Promise<BlogPost[] | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_COLUMNS_LIST)
      .order("published_at", { ascending: false })
      .limit(Math.max(1, Math.min(limit, 200)));
    if (error) {
      console.error("[blog] supabase getRecentPosts error:", error.message);
      return null;
    }
    if (!data || data.length === 0) return null;
    return (data as ArticleRow[]).map(rowToPost).filter((p) => !p.noindex).slice(0, limit);
  } catch (e) {
    console.error("[blog] supabase getRecentPosts threw:", e);
    return null;
  }
}

async function supabaseGetPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_COLUMNS_FULL)
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      console.error(`[blog] supabase getPostBySlug(${slug}) error:`, error.message);
      return null;
    }
    if (!data) return null;
    return rowToPost(data as unknown as ArticleRow);
  } catch (e) {
    console.error(`[blog] supabase getPostBySlug(${slug}) threw:`, e);
    return null;
  }
}

/* ─── Filesystem fallback (retained — primary path is Supabase) ─── */

function fsGetAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts = files
    .map((file) => fsGetPostBySlug(file.replace(/\.md$/, ""))!)
    .filter(Boolean)
    .filter((p) => !p.noindex);
  return posts.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}

function fsGetPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title || slug,
    description: data.description || data.excerpt || "",
    date: (() => {
      const raw = data.date || data.publishDate || data.publishedAt || "";
      if (raw instanceof Date) return raw.toISOString().split("T")[0];
      return String(raw);
    })(),
    updatedDate: data.updatedDate || undefined,
    author: data.author || "Albis",
    image: data.image || "/og-image.png",
    tags: data.tags || [],
    category: (data.category as CategorySlug) || 'analysis',
    pillars: data.pillars ? (Array.isArray(data.pillars) ? data.pillars : [data.pillars]) : undefined,
    faqs: data.faqs || undefined,
    sources: (data.sources as Source[]) || [],
    confidence: (data.confidence as ConfidenceLevel) || 'developing',
    readingTime: estimateReadingTime(content),
    content,
    noindex: data.noindex === true,
  };
}

/* ─── Public API (async — Supabase primary, fs fallback) ─── */

// React.cache dedupes calls within a single request render. Several server
// components (section grid + markdown link-candidate builder + related-posts
// selector) each need the full list; without this they each issued the same
// ~3s Supabase query.
export const getAllPosts = cache(async (): Promise<BlogPost[]> => {
  const fromDb = await supabaseGetAllPosts();
  if (fromDb && fromDb.length > 0) return fromDb;
  return fsGetAllPosts();
});

export const getRecentPosts = cache(async (limit = 48): Promise<BlogPost[]> => {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const fromDb = await supabaseGetRecentPosts(safeLimit);
  if (fromDb && fromDb.length > 0) return fromDb;
  return fsGetAllPosts().slice(0, safeLimit);
});

// React.cache so generateMetadata and the page component share one fetch
// per request instead of each calling Supabase independently.
export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const fromDb = await supabaseGetPostBySlug(slug);
  if (fromDb) return fromDb;
  return fsGetPostBySlug(slug);
});

// Route-entry helper for article pages: fires getPostBySlug and getAllPosts
// in parallel. The getAllPosts call warms the React.cache that ArticlePage's
// link-candidates + related-posts selector both consume, so the single-row
// and full-list round-trips overlap instead of running serially.
export async function getPostBySlugAndWarmListCache(
  slug: string
): Promise<BlogPost | null> {
  const [post] = await Promise.all([getPostBySlug(slug), getAllPosts()]);
  return post;
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  if (category === 'all') return posts;
  return posts.filter((post) => post.category === category);
}

export async function getPostsByPillar(pillar: PillarSlug): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.pillars?.includes(pillar));
}

export async function getAllSlugs(): Promise<string[]> {
  const posts = await getAllPosts();
  return posts.map((p) => p.slug);
}

/* ─── Category → URL segment mapping ─── */

const CATEGORY_TO_SECTION: Record<string, string> = {
  // World — conflicts, geopolitics, international affairs, health crises, migration
  "current-events": "world",
  "geopolitics": "world",
  "conflict": "world",
  "governance": "world",
  "health": "world",
  "breaking": "world",

  // Money — economy, trade, markets, cost of living
  "economic-flows": "money",
  "markets": "money",

  // Tech — AI, cyber, digital rights, surveillance
  "tech-ai": "tech",
  "cyber-info-warfare": "tech",

  // Climate — emissions, weather, biodiversity, climate policy, renewable transition
  "climate-energy": "climate",
  "weather-climate": "climate",
  "natural-world": "climate",
  "science-space": "climate",

  // Life Systems — energy security, food, water, cascade effects
  "energy": "life-systems",
  "food": "life-systems",
  "water": "life-systems",
  "life-systems": "life-systems",

  // Perspectives — framing analysis, perception gaps, blind spots, media literacy
  "perception-gap-index": "perspectives",
  "media-literacy": "perspectives",
  "information-warfare": "perspectives",
  "perspectives": "perspectives",
  "analysis": "perspectives",
  "data": "perspectives",
  "explainer": "perspectives",
  "comparison": "perspectives",
  "framing-guide": "perspectives",
  "weekly-report": "perspectives",
  "research": "perspectives",
};

export function getPostSection(category: string): string {
  return CATEGORY_TO_SECTION[category] || "analysis";
}

export function getPostUrl(post: { slug: string; category: string }): string {
  return `/${getPostSection(post.category)}/${post.slug}`;
}

export async function getPostsBySection(section: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => getPostSection(p.category) === section);
}
