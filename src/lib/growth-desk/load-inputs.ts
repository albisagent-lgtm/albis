import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { AngleCandidate, GrowthDeskInputs, MetricsSnapshot } from './types';
import { createAdminClient } from '../supabase/admin';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.albis.news';
const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function asString(value: unknown, fallback = ''): string {
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function articleUrl(category: string, slug: string): string {
  return `${SITE_URL.replace(/\/$/, '')}/${category || 'world'}/${slug}`;
}

function initialScores(title: string, description: string, content: string, category: string, tags: string[]) {
  const blob = `${title} ${description} ${content} ${tags.join(' ')}`.toLowerCase();
  const hasRegion = /(africa|asia|pacific|latin|europe|middle east|gulf|india|china|russia|ukraine|israel|palestine|south africa|nigeria|kenya|asean|eu|us|america)/.test(blob);
  const hasBusiness = /(supply|shipping|port|trade|tariff|sanction|company|market|energy|oil|gas|regulation|policy|risk|logistics|currency|inflation|bank)/.test(blob);
  const hasFraming = /(coverage|framing|sources|region|global|local|missing|attention|perspective|narrative|different)/.test(blob);
  const hasHuman = /(people|families|children|workers|farmers|patients|voters|residents|students|coaches)/.test(blob);
  const isRoutine = /(announces|statement|meeting|update|continues|says)/.test(title.toLowerCase());
  const uniqueness = Math.min(10, 4 + (hasRegion ? 2 : 0) + (hasFraming ? 2 : 0) + (category === 'perspectives' ? 1 : 0) - (isRoutine ? 1 : 0));
  const coverageGap = Math.min(10, 3 + (hasRegion ? 2 : 0) + (hasFraming ? 3 : 0) + (/africa|pacific|latin|asean|global south/.test(blob) ? 1 : 0));
  const businessRelevance = Math.min(10, 3 + (hasBusiness ? 4 : 0) + (/policy|regulation|risk|trade/.test(blob) ? 1 : 0));
  const publicHook = Math.min(10, 4 + (hasHuman ? 1 : 0) + (hasRegion ? 1 : 0) + (hasFraming ? 2 : 0));
  const founderRecordability = Math.min(10, 5 + (title.length < 115 ? 1 : 0) + (description.length > 50 && description.length < 220 ? 2 : 0));
  const risk = Math.min(10, /(war|death|killed|health|outbreak|legal|court|accused|fraud)/.test(blob) ? 5 : 2);
  const total = uniqueness * 1.25 + coverageGap * 1.4 + businessRelevance * 0.8 + publicHook * 1.4 + founderRecordability * 0.6 - risk * 0.9;
  return { uniqueness, coverageGap, businessRelevance, publicHook, founderRecordability, risk, total: Number(total.toFixed(2)) };
}

export function loadLocalArticleCandidates(limit = 20): AngleCandidate[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const parsed = matter(raw);
      const title = asString(parsed.data.title, slug);
      const description = asString(parsed.data.description || parsed.data.excerpt, '');
      const category = asString(parsed.data.category, 'world');
      const date = asString(parsed.data.date || parsed.data.publishDate || parsed.data.publishedAt, '');
      const tags = asStringArray(parsed.data.tags || parsed.data.keywords);
      const contentPreview = stripMarkdown(parsed.content).slice(0, 900);
      const scores = initialScores(title, description, contentPreview, category, tags);
      const reasons = [
        scores.coverageGap >= 7 ? 'strong coverage-gap potential' : 'moderate coverage-gap potential',
        scores.publicHook >= 7 ? 'strong public hook' : 'needs sharper hook',
        scores.businessRelevance >= 7 ? 'usable business/narrative-risk angle' : 'mostly public-audience angle',
      ];
      return { slug, title, description, category, date, url: articleUrl(category, slug), contentPreview, tags, scores, reasons };
    })
    .sort((a, b) => {
      const dateCmp = String(b.date).localeCompare(String(a.date));
      if (dateCmp !== 0) return dateCmp;
      return b.scores.total - a.scores.total;
    })
    .slice(0, limit);
}

export async function loadMetricsSnapshot(): Promise<MetricsSnapshot> {
  const notes: string[] = [];
  const metrics: MetricsSnapshot = { notes };
  try {
    const supabase = createAdminClient();
    const [subs, companies] = await Promise.all([
      supabase.from('subscribers').select('email', { count: 'exact', head: true }),
      supabase.from('company_profiles').select('id', { count: 'exact', head: true }),
    ]);
    if (subs.error) notes.push(`Subscriber count unavailable: ${subs.error.message}`);
    else metrics.subscribers = subs.count ?? undefined;
    if (companies.error) notes.push(`Company profile count unavailable: ${companies.error.message}`);
    else metrics.companyProfiles = companies.count ?? undefined;
  } catch (error) {
    notes.push(`Metrics unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  return metrics;
}

export async function loadGrowthDeskInputs(date: string): Promise<GrowthDeskInputs> {
  return {
    date,
    candidates: loadLocalArticleCandidates(30),
    metrics: await loadMetricsSnapshot(),
  };
}
