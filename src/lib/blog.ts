import fs from "fs";
import path from "path";
import matter from "gray-matter";
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

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => getPostBySlug(file.replace(/\.md$/, ""))!).filter(Boolean).filter((p) => !p.noindex);
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
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

export function getPostsByCategory(category: string): BlogPost[] {
  const posts = getAllPosts();
  if (category === 'all') return posts;
  return posts.filter((post) => post.category === category);
}

export function getPostsByPillar(pillar: PillarSlug): BlogPost[] {
  const posts = getAllPosts();
  return posts.filter((post) => post.pillars?.includes(pillar));
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/* ─── Category → URL segment mapping ─── */

const CATEGORY_TO_SECTION: Record<string, string> = {
  "current-events": "world",
  "geopolitics": "world",
  "conflict": "world",
  "governance": "politics",
  "economic-flows": "business",
  "tech-ai": "technology",
  "cyber-info-warfare": "technology",
  "health": "health",
  "science-space": "science",
  "weather-climate": "science",
  "natural-world": "science",
  "climate-energy": "science",
  "perception-gap-index": "analysis",
  "analysis": "analysis",
  "information-warfare": "analysis",
  "media-literacy": "analysis",
  "weekly-report": "analysis",
  "framing-guide": "analysis",
  "explainer": "analysis",
  "comparison": "analysis",
  "perspectives": "analysis",
  "data": "analysis",
  "breaking": "analysis",
  "research": "analysis",
};

export function getPostSection(category: string): string {
  return CATEGORY_TO_SECTION[category] || "analysis";
}

export function getPostUrl(post: { slug: string; category: string }): string {
  return `/${getPostSection(post.category)}/${post.slug}`;
}

export function getPostsBySection(section: string): BlogPost[] {
  const posts = getAllPosts();
  return posts.filter((p) => getPostSection(p.category) === section);
}
