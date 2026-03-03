import fs from "fs";
import path from "path";
import matter from "gray-matter";
export { CATEGORIES } from "./categories";
export type { CategorySlug } from "./categories";
import type { CategorySlug } from "./categories";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface FAQ {
  q: string;
  a: string;
}

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
  faqs?: FAQ[];
  readingTime: number;
  content: string;
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 230);
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => getPostBySlug(file.replace(/\.md$/, ""))!).filter(Boolean);
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
    description: data.description || "",
    date: data.date || "",
    updatedDate: data.updatedDate || undefined,
    author: data.author || "Albis",
    image: data.image || "/og-image.png",
    tags: data.tags || [],
    category: (data.category as CategorySlug) || 'analysis',
    faqs: data.faqs || undefined,
    readingTime: estimateReadingTime(content),
    content,
  };
}

export function getPostsByCategory(category: string): BlogPost[] {
  const posts = getAllPosts();
  if (category === 'all') return posts;
  return posts.filter((post) => post.category === category);
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}
