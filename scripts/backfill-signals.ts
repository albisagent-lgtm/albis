#!/usr/bin/env tsx
import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { generatePublicSignalFromArticle } from "../src/lib/public-signal-generator";
import { upsertSignal } from "../src/lib/signals";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

type ArticleRow = {
  slug: string;
  title: string;
  description: string | null;
  date: string | null;
  category: string | null;
  tags: string[] | null;
  excerpt: string | null;
  content: string | null;
  published_at: string;
  frontmatter: Record<string, unknown> | null;
};

function parseLimit() {
  const index = process.argv.findIndex((arg) => arg === "--limit");
  if (index >= 0) {
    const value = Number(process.argv[index + 1]);
    if (Number.isFinite(value) && value > 0) return Math.min(Math.floor(value), 100);
  }
  return 20;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  const limit = parseLimit();
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from("articles")
    .select("slug,title,description,date,category,tags,excerpt,content,published_at,frontmatter")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Could not load articles: ${error.message}`);

  let upserted = 0;
  let skipped = 0;
  for (const row of (data || []) as ArticleRow[]) {
    const signal = generatePublicSignalFromArticle({
      slug: row.slug,
      title: row.title,
      description: row.description || row.excerpt || "",
      category: row.category || "analysis",
      tags: row.tags || [],
      date: row.date || row.published_at,
      content: row.content || "",
      frontmatter: row.frontmatter || {},
      excerpt: row.excerpt || undefined,
    });

    if (!signal) {
      skipped += 1;
      console.log(`⚠️ skipped ${row.slug}: could not build 3 validated bullets`);
      continue;
    }

    await upsertSignal(signal);
    upserted += 1;
    console.log(`✅ upserted ${signal.slug}`);
  }

  console.log(`Done. Upserted ${upserted}, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
