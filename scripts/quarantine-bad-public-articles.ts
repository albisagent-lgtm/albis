#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

type ArticleRow = {
  slug: string;
  title: string | null;
  content: string | null;
  frontmatter: Record<string, unknown> | null;
};

const PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'scanner/planner mention', pattern: /\b(?:scan|scanner|selected item|article slot|published set|writeability|draft quality|story plan|article form)\b/i },
  { label: 'planner instruction', pattern: /\b(?:make clear|show how|connect (?:a|the) concrete|use (?:an|a) unusual|report what|write (?:a|the)|article should)\b/i },
  { label: 'template shift phrase', pattern: /\b(?:points to a concrete shift|is the engine here|not a side note|decision space around|is now narrower than it was before)\b/i },
  { label: 'abstract constraint phrase', pattern: /\b(?:where an abstract development starts becoming a practical constraint|the practical test now is whether|stays narrow or forces a wider reset)\b/i },
  { label: 'synthetic meta phrase', pattern: /\b(?:visible event and the practical fallout|this is the point of entry|operating reality|cleanest route into the larger pattern|turns this from a single update into a moving story)\b/i },
  { label: 'generic AI analysis phrase', pattern: /\b(?:this matters because|why it matters|the deeper signal|the headline is about|the underlying story is|the useful question|the useful reading)\b/i },
];

const apply = process.argv.includes('--apply');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) : Infinity;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function labelsFor(content: string): string[] {
  return PATTERNS.filter(({ pattern }) => pattern.test(content)).map(({ label }) => label);
}

async function main() {
  let from = 0;
  const pageSize = 500;
  const bad: Array<ArticleRow & { labels: string[] }> = [];

  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('slug,title,content,frontmatter')
      .order('published_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    for (const row of data as ArticleRow[]) {
      const labels = labelsFor(row.content || '');
      if (labels.length) bad.push({ ...row, labels });
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const selected = bad.slice(0, Number.isFinite(limit) ? limit : bad.length);
  console.log(`${apply ? 'APPLY' : 'DRY RUN'}: ${bad.length} bad public article row(s) found; ${selected.length} selected.`);
  for (const row of selected.slice(0, 30)) {
    console.log(`- ${row.slug}: ${row.labels.join(', ')}`);
  }
  if (!apply) {
    console.log('\nNo changes made. Re-run with --apply to set frontmatter.noindex=true and public_quality.status="quarantined".');
    return;
  }

  for (const row of selected) {
    const nextFrontmatter = {
      ...(row.frontmatter || {}),
      noindex: true,
      public_quality: {
        status: 'quarantined',
        reason: 'planner_or_scaffold_language_detected',
        labels: row.labels,
        quarantined_at: new Date().toISOString(),
      },
    };
    const { error } = await supabase
      .from('articles')
      .update({ frontmatter: nextFrontmatter })
      .eq('slug', row.slug);
    if (error) throw new Error(`${row.slug}: ${error.message}`);
  }
  console.log(`Quarantined ${selected.length} article row(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
