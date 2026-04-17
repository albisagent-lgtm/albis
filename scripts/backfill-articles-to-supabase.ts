/**
 * Backfill the `articles` Supabase table from content/blog/*.md files.
 * Idempotent — upserts on slug, safe to re-run.
 *
 *   npx tsx scripts/backfill-articles-to-supabase.ts
 *   npx tsx scripts/backfill-articles-to-supabase.ts --dry
 */

import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync } from "fs";
import { resolve, join } from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const envPath = resolve(__dirname, "../.env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const k = m[1].trim();
      const v = m[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  }
} catch {
  // no .env.local — assume env vars are already set
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry");
const BLOG_DIR = resolve(__dirname, "../content/blog");
const BATCH_SIZE = 100;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface ArticleRow {
  slug: string;
  title: string;
  description: string | null;
  date: string | null;
  category: string | null;
  tags: string[];
  keywords: string[];
  image: string | null;
  excerpt: string | null;
  author: string | null;
  content: string;
  reading_time: number | null;
  published_at: string;
  frontmatter: Record<string, unknown>;
}

const KNOWN_TOP_LEVEL = new Set([
  "title",
  "description",
  "date",
  "publishDate",
  "publishedAt",
  "category",
  "tags",
  "keywords",
  "image",
  "excerpt",
  "author",
  "readingTime",
]);

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

function parseDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().split("T")[0];
  return String(v);
}

function toIso(v: unknown): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function fileToRow(fileName: string): ArticleRow | null {
  const slug = fileName.replace(/\.mdx?$/, "");
  const fullPath = join(BLOG_DIR, fileName);
  const raw = readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  if (!data.title) {
    console.warn(`[skip] ${fileName}: no title`);
    return null;
  }

  const rt = readingTime(content);
  const dateRaw = data.date || data.publishDate || data.publishedAt;

  const extras: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!KNOWN_TOP_LEVEL.has(k)) extras[k] = v;
  }

  return {
    slug,
    title: String(data.title),
    description: data.description ? String(data.description) : null,
    date: parseDate(dateRaw),
    category: data.category ? String(data.category) : null,
    tags: toStringArray(data.tags),
    keywords: toStringArray(data.keywords),
    image: data.image ? String(data.image) : null,
    excerpt: data.excerpt ? String(data.excerpt) : null,
    author: data.author ? String(data.author) : "Albis",
    content,
    reading_time: typeof data.readingTime === "number" ? data.readingTime : Math.ceil(rt.minutes),
    published_at: toIso(dateRaw),
    frontmatter: extras,
  };
}

async function upsertBatch(rows: ArticleRow[]): Promise<number> {
  if (DRY_RUN) {
    console.log(`[dry] would upsert ${rows.length} articles`);
    return rows.length;
  }
  const { error, count } = await supabase
    .from("articles")
    .upsert(rows, { onConflict: "slug", count: "exact" });
  if (error) {
    console.error("upsert error:", error.message);
    return 0;
  }
  return count ?? rows.length;
}

async function main() {
  console.log(`Reading from ${BLOG_DIR}${DRY_RUN ? " (DRY RUN)" : ""}`);

  const files = readdirSync(BLOG_DIR).filter(
    (f) => f.endsWith(".md") || f.endsWith(".mdx")
  );
  console.log(`Found ${files.length} markdown files`);

  const rows: ArticleRow[] = [];
  let skipped = 0;
  for (const f of files) {
    try {
      const row = fileToRow(f);
      if (row) rows.push(row);
      else skipped++;
    } catch (e) {
      console.error(`[error] ${f}:`, e instanceof Error ? e.message : e);
      skipped++;
    }
  }

  console.log(`Parsed ${rows.length} articles (${skipped} skipped)`);

  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const n = await upsertBatch(batch);
    written += n;
    console.log(`  batch ${i / BATCH_SIZE + 1}: ${n} rows (total ${written}/${rows.length})`);
  }

  console.log(`Done. Upserted ${written} articles.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
