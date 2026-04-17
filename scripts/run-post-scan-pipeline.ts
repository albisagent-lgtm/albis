#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

type Period = 'am' | 'midday' | 'pm';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function run(command: string, args: string[], cwd = process.cwd()) {
  console.log(`\n▶ ${command} ${args.join(' ')}`);
  const res = spawnSync(command, args, { cwd, env: process.env, encoding: 'utf8' });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  if (res.status !== 0) fail(`${command} failed with exit code ${res.status}`);
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

function inferCategory(cat: string) {
  const c = (cat || '').toLowerCase();
  if (c.includes('economic')) return 'economic-flows';
  if (c.includes('energy')) return 'energy';
  if (c.includes('diplomacy')) return 'diplomacy';
  if (c.includes('sanction')) return 'sanctions';
  if (c.includes('conflict')) return 'conflict';
  return c || 'world';
}

function chooseImage(cat: string) {
  const c = cat.toLowerCase();
  if (c.includes('conflict')) return 'https://images.pexels.com/photos/8553864/pexels-photo-8553864.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
  if (c.includes('economic')) return 'https://images.pexels.com/photos/709552/pexels-photo-709552.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
  if (c.includes('energy')) return 'https://images.pexels.com/photos/163726/belgium-antwerp-shipping-container-163726.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
  return 'https://images.pexels.com/photos/262353/pexels-photo-262353.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
}

function parseArgs() {
  const date = process.argv[2];
  const period = process.argv[3] as Period | undefined;
  if (!date || !period || !['am', 'midday', 'pm'].includes(period)) {
    fail('Usage: npx tsx scripts/run-post-scan-pipeline.ts YYYY-MM-DD <am|midday|pm>');
  }
  return { date, period } as { date: string; period: Period };
}

function readScanFile(scanPath: string) {
  if (!fs.existsSync(scanPath)) fail(`Scan file not found: ${scanPath}`);
  const md = fs.readFileSync(scanPath, 'utf8');
  if (!/```json\s*[\r\n]/.test(md)) fail('Scan file missing fenced JSON block');
  return md;
}

function extractItems(md: string) {
  const matches = [...md.matchAll(/```json\s*\n([\s\S]*?)```/g)];
  for (const m of matches) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
  }
  fail('Could not extract structured JSON items from scan markdown');
}

async function verifyScan(date: string, period: Period) {
  const { data, error } = await supabase
    .from('scans')
    .select('scan_date,scan_time,items,raw_markdown')
    .eq('scan_date', date)
    .eq('scan_time', period)
    .limit(1);
  if (error) fail(`Scan verify failed: ${error.message}`);
  if (!data || !data.length) fail(`No scans row found for ${date} ${period}`);
  const row = data[0] as any;
  if (!Array.isArray(row.items) || row.items.length === 0) fail(`Scans row for ${date} ${period} has empty items`);
  console.log(`✅ Verified scan row for ${date} ${period} with ${row.items.length} items`);
}

async function verifyPgi(date: string) {
  const { data, error } = await supabase.from('pgi_story_scores').select('id').eq('scan_date', date).limit(1);
  if (error) fail(`PGI verify failed: ${error.message}`);
  if (!data || !data.length) fail(`No PGI rows found for ${date}`);
  console.log('✅ Verified PGI rows');
}

async function verifyGai(date: string) {
  const { data, error } = await supabase.from('gai_story_scores').select('id').eq('scan_date', date).limit(1);
  if (error) fail(`GAI verify failed: ${error.message}`);
  if (!data || !data.length) fail(`No GAI rows found for ${date}`);
  console.log('✅ Verified GAI rows');
}

async function verifyBriefing(date: string) {
  const { data, error } = await supabase.from('briefings').select('date,title').eq('date', date).limit(1);
  if (error) fail(`Briefing verify failed: ${error.message}`);
  if (!data || !data.length) fail(`No briefing row found for ${date}`);
  console.log(`✅ Verified briefing row for ${date}`);
}

function titleFromHeadline(headline: string) {
  return headline
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^\w)|([.!?]\s+\w)/g, (m) => m.toUpperCase());
}

function buildArticle(item: any, date: string) {
  const title = titleFromHeadline(item.headline);
  const slug = slugify(item.headline) + '-2026';
  const category = inferCategory(item.category);
  const excerpt = item.connection || item.headline;
  const description = excerpt;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const body = `${item.headline.startsWith('A ') || item.headline.startsWith('The ') ? item.headline : title} matters because it changes the system around it, not just the headline cycle.\n\n${item.connection || 'The underlying shift in this story is larger than the immediate event.'}\n\nFrom the ${date} ${item.category || 'global'} scan, the important signal is not only what happened but what it changes next: who gains leverage, what becomes more fragile, and which regions treat the story as core rather than peripheral.\n\nThe framing pattern in the scan points to a real gap between simple event coverage and systems consequences. ${Array.isArray(item.patterns) && item.patterns.length ? `This story is best understood through the pattern of ${item.patterns.join(', ')}.` : 'The downstream effects are likely to matter as much as the immediate trigger.'}\n\nWhat matters now is whether this becomes a one-cycle headline or a durable state change. That depends on what happens next in policy, markets, diplomacy and public response.\n\nFor Albis, this is exactly the kind of story worth publishing: globally relevant, unevenly framed, and more structurally important than it may first appear.`;

  const frontmatter = {
    title,
    description,
    date: `${date}T21:59:00+12:00`,
    category,
    tags,
    image: chooseImage(category),
    excerpt,
    author: 'Albis',
  };
  const markdown = matter.stringify(body, frontmatter);
  return {
    slug,
    title,
    description,
    date,
    category,
    tags,
    image: frontmatter.image,
    excerpt,
    author: 'Albis',
    content: body,
    markdown,
    reading_time: `${Math.ceil(readingTime(body).minutes)} min read`,
    frontmatter,
  };
}

function writeArticlesLocally(articles: ReturnType<typeof buildArticle>[]) {
  const blogDir = path.resolve(process.cwd(), 'content/blog');
  for (const article of articles) {
    const fullPath = path.join(blogDir, `${article.slug}.md`);
    fs.writeFileSync(fullPath, article.markdown);
    console.log(`✅ Wrote backup article ${path.basename(fullPath)}`);
  }
}

async function ingestArticles(articles: ReturnType<typeof buildArticle>[]) {
  const key = process.env.SCAN_INGEST_KEY;
  if (!key) fail('Missing SCAN_INGEST_KEY for article ingest');

  for (const article of articles) {
    const res = await fetch('https://www.albis.news/api/articles/ingest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: article.slug,
        title: article.title,
        description: article.description,
        date: article.date,
        category: article.category,
        tags: article.tags,
        image: article.image,
        excerpt: article.excerpt,
        author: article.author,
        content: article.content,
        reading_time: article.reading_time,
        frontmatter: article.frontmatter,
      }),
    });

    const text = await res.text();
    if (!res.ok) fail(`Article ingest failed for ${article.slug}: ${res.status} ${text}`);
    console.log(`✅ Ingested article ${article.slug}`);
  }
}

async function verifyArticles(articles: ReturnType<typeof buildArticle>[]) {
  const slugs = articles.map((a) => a.slug);
  const { data, error } = await supabase.from('articles').select('slug').in('slug', slugs);
  if (error) fail(`Article verify failed: ${error.message}`);
  if (!data || data.length !== slugs.length) fail(`Expected ${slugs.length} articles in Supabase, found ${data?.length || 0}`);
  console.log(`✅ Verified ${data.length} article row(s) in Supabase`);
}

async function verifySnapshot(date: string) {
  const { data, error } = await supabase.from('site_snapshot').select('updated_at,briefing_date').eq('id', 1).single();
  if (error) fail(`Snapshot verify failed: ${error.message}`);
  if (!data || data.briefing_date !== date) fail(`Snapshot not updated to ${date}`);
  console.log(`✅ Verified site_snapshot updated for briefing_date=${date}`);
}

function maybeCommitAndPushCodeChanges() {
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' });
  const changed = (status.stdout || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.includes('content/blog/'));
  if (!changed.length) {
    console.log('ℹ️ No code changes to commit');
    return;
  }
  run('git', ['add', '.']);
  run('git', ['commit', '-m', 'chore: update pipeline code']);
  run('git', ['push', 'origin', 'main']);
  console.log('✅ Code changes committed and pushed');
}

async function main() {
  const { date, period } = parseArgs();
  const scanPath = path.resolve(process.cwd(), `../memory/scans/${date}-${period}.md`);
  console.log(`🚀 Starting post-scan pipeline for ${date} ${period}`);
  const md = readScanFile(scanPath);
  const items = extractItems(md);

  run('node', ['scripts/push-scan-to-supabase.js', `${date}-${period}`]);
  await verifyScan(date, period);

  run('npx', ['tsx', `scripts/score-pgi-gai-${date}-${period}.ts`]);
  await verifyPgi(date);
  await verifyGai(date);

  run('openclaw', ['cron', 'run', 'a79cb02a-98ef-4e9a-85e6-f10e37a8deb9'], path.resolve(process.cwd(), '..'));
  await verifyBriefing(date);

  const articles = items.slice(0, 3).map((item: any) => buildArticle(item, date));
  writeArticlesLocally(articles);
  await ingestArticles(articles);
  await verifyArticles(articles);

  run('npx', ['tsx', 'scripts/write-site-snapshot.ts']);
  await verifySnapshot(date);

  maybeCommitAndPushCodeChanges();
  console.log('🎉 Post-scan pipeline completed successfully');
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
