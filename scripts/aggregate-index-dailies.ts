#!/usr/bin/env tsx

import { resolve } from 'path';
import { createRequire } from 'module';

try {
  const require = createRequire(import.meta.url);
  const { config } = require('dotenv');
  config({ path: resolve(process.cwd(), '.env.local') });
} catch {
  // env already present
}

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[aggregate-index-dailies] missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const explicitDates = process.argv.slice(2).filter((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg));

const PGI_TRIBUTARY_ORDER = ['PGI-GP', 'PGI-IW', 'PGI-WR', 'PGI-EC', 'PGI-TE', 'PGI-HE', 'PGI-CL'] as const;
const GAI_TRIBUTARY_ORDER = ['GAI-GP', 'GAI-IW', 'GAI-WR', 'GAI-EC', 'GAI-TE', 'GAI-HE', 'GAI-CL'] as const;

function round2(n: number | null | undefined): number | null {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round(n * 100) / 100;
}

function pgiTier(pgi: number) {
  if (pgi <= 2) return { tier: 'Global Consensus', emoji: '🟢' };
  if (pgi <= 4) return { tier: 'Different Lenses', emoji: '🟡' };
  if (pgi <= 6) return { tier: 'Diverging Narratives', emoji: '🟠' };
  if (pgi <= 8) return { tier: 'Competing Realities', emoji: '🔴' };
  return { tier: 'Parallel Universes', emoji: '⚫' };
}

function gaiTier(gai: number) {
  if (gai <= 2) return 'Global Spotlight';
  if (gai <= 4) return 'Broad Awareness';
  if (gai <= 6) return 'Selective Visibility';
  if (gai <= 8) return 'Information Shadow';
  return 'Near Invisible';
}

function normaliseCategory(raw: string | null | undefined): string {
  return String(raw || '').trim().toLowerCase().replace(/_/g, '-');
}

function toPgiTributary(raw: string | null | undefined): typeof PGI_TRIBUTARY_ORDER[number] {
  const cat = normaliseCategory(raw);
  const map: Record<string, typeof PGI_TRIBUTARY_ORDER[number]> = {
    'power-conflict': 'PGI-GP',
    'conflict': 'PGI-GP',
    'geopolitics': 'PGI-GP',
    'diplomacy': 'PGI-GP',
    'migration-demographics': 'PGI-GP',
    'governance': 'PGI-GP',
    'culture': 'PGI-GP',
    'security': 'PGI-GP',
    'infrastructure': 'PGI-GP',
    'economic-flows': 'PGI-EC',
    'energy-power': 'PGI-EC',
    'energy': 'PGI-EC',
    'economic': 'PGI-EC',
    'economics': 'PGI-EC',
    'money-markets': 'PGI-EC',
    'food-water': 'PGI-EC',
    'food': 'PGI-EC',
    'sanctions': 'PGI-EC',
    'trade': 'PGI-EC',
    'information-framing': 'PGI-IW',
    'information-warfare': 'PGI-IW',
    'media': 'PGI-IW',
    'women-rights': 'PGI-WR',
    'tech-human-potential': 'PGI-TE',
    'tech': 'PGI-TE',
    'technology': 'PGI-TE',
    'cybersecurity': 'PGI-TE',
    'education-opportunity': 'PGI-TE',
    'ai-geopolitics': 'PGI-TE',
    'health-medicine': 'PGI-HE',
    'health': 'PGI-HE',
    'climate-natural': 'PGI-CL',
    'climate-energy': 'PGI-CL',
    'climate': 'PGI-CL',
  };
  return map[cat] || 'PGI-GP';
}

function toGaiTributary(raw: string | null | undefined): typeof GAI_TRIBUTARY_ORDER[number] {
  return toPgiTributary(raw).replace('PGI', 'GAI') as typeof GAI_TRIBUTARY_ORDER[number];
}

async function listDates(table: 'pgi_story_scores' | 'gai_story_scores', explicit: string[]) {
  if (explicit.length > 0) return explicit;
  const { data, error } = await supabase.from(table).select('scan_date').order('scan_date', { ascending: true });
  if (error) throw new Error(`[aggregate-index-dailies] failed to list ${table} dates: ${error.message}`);
  return [...new Set((data || []).map((row: any) => row.scan_date))];
}

async function aggregatePgiDate(date: string) {
  const { data: stories, error } = await supabase
    .from('pgi_story_scores')
    .select('story_slug, story_headline, story_pgi, category, scan_date, significance, is_latest')
    .eq('scan_date', date)
    .eq('is_latest', true)
    .order('story_pgi', { ascending: false });
  if (error) throw new Error(`[aggregate-index-dailies] PGI stories failed for ${date}: ${error.message}`);
  if (!stories || stories.length === 0) return null;

  const storyCount = stories.length;
  const dailyPgi = round2(stories.reduce((sum: number, s: any) => sum + Number(s.story_pgi || 0), 0) / storyCount)!;
  const topStory = stories[0];

  const categoryPgis: Record<string, number | null> = {
    'PGI-GP': null,
    'PGI-IW': null,
    'PGI-WR': null,
    'PGI-EC': null,
    'PGI-TE': null,
    'PGI-HE': null,
    'PGI-CL': null,
  };
  for (const key of PGI_TRIBUTARY_ORDER) {
    const subset = stories.filter((s: any) => toPgiTributary(s.category) === key);
    if (subset.length > 0) {
      categoryPgis[key] = round2(subset.reduce((sum: number, s: any) => sum + Number(s.story_pgi || 0), 0) / subset.length);
    }
  }

  const { data: pairs, error: pairsError } = await supabase
    .from('pgi_region_pairs')
    .select('region_a, region_b, pair_pgi')
    .eq('scan_date', date);
  if (pairsError) throw new Error(`[aggregate-index-dailies] PGI pairs failed for ${date}: ${pairsError.message}`);

  const pairMeans = new Map<string, { total: number; count: number; a: string; b: string }>();
  for (const pair of pairs || []) {
    const a = String((pair as any).region_a || '');
    const b = String((pair as any).region_b || '');
    const key = [a, b].sort().join('|');
    const current = pairMeans.get(key) || { total: 0, count: 0, a, b };
    current.total += Number((pair as any).pair_pgi || 0);
    current.count += 1;
    pairMeans.set(key, current);
  }
  const averagedPairs = [...pairMeans.values()].map((pair) => ({
    pair: [pair.a, pair.b],
    pgi: round2(pair.total / pair.count)!,
  }));
  averagedPairs.sort((a, b) => b.pgi - a.pgi);

  const { tier, emoji } = pgiTier(dailyPgi);
  return {
    date,
    daily_pgi: dailyPgi,
    tier,
    emoji,
    story_count: storyCount,
    rolling_7d: null as number | null,
    trend_7d: null as number | null,
    top_story_slug: topStory.story_slug ?? null,
    top_story_headline: topStory.story_headline ?? null,
    top_story_pgi: round2(Number(topStory.story_pgi || 0)),
    category_pgis: categoryPgis,
    most_divergent_pair: averagedPairs[0]?.pair ?? null,
    most_divergent_pair_pgi: averagedPairs[0]?.pgi ?? null,
    most_aligned_pair: averagedPairs.at(-1)?.pair ?? null,
    most_aligned_pair_pgi: averagedPairs.at(-1)?.pgi ?? null,
  };
}

async function hydratePgiRollingFields(rows: Array<any>) {
  const ordered = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < ordered.length; i++) {
    const window = ordered.slice(Math.max(0, i - 6), i + 1);
    ordered[i].rolling_7d = round2(window.reduce((sum, row) => sum + Number(row.daily_pgi || 0), 0) / window.length);
    if (i >= 7) {
      ordered[i].trend_7d = round2(Number(ordered[i].daily_pgi) - Number(ordered[i - 7].daily_pgi));
    } else {
      ordered[i].trend_7d = null;
    }
  }
  return ordered;
}

async function aggregateGaiDate(date: string) {
  const { data: stories, error } = await supabase
    .from('gai_story_scores')
    .select('story_headline, story_gai, category, regions_absent, scan_date, is_latest')
    .eq('scan_date', date)
    .eq('is_latest', true)
    .order('story_gai', { ascending: false });
  if (error) throw new Error(`[aggregate-index-dailies] GAI stories failed for ${date}: ${error.message}`);
  if (!stories || stories.length === 0) return null;

  const storyCount = stories.length;
  const dailyGai = round2(stories.reduce((sum: number, s: any) => sum + Number(s.story_gai || 0), 0) / storyCount)!;
  const ranked = [...stories].sort((a: any, b: any) => Number(b.story_gai || 0) - Number(a.story_gai || 0));

  const tributaries: Record<string, { gai: number | null; tier: string; story_count: number; most_invisible: string | null }> = {};
  for (const key of GAI_TRIBUTARY_ORDER) {
    const subset = stories.filter((s: any) => toGaiTributary(s.category) === key);
    if (subset.length === 0) {
      tributaries[key] = { gai: null, tier: 'No Data', story_count: 0, most_invisible: null };
      continue;
    }
    const sorted = [...subset].sort((a: any, b: any) => Number(b.story_gai || 0) - Number(a.story_gai || 0));
    const avg = round2(subset.reduce((sum: number, s: any) => sum + Number(s.story_gai || 0), 0) / subset.length);
    tributaries[key] = {
      gai: avg,
      tier: avg == null ? 'No Data' : gaiTier(avg),
      story_count: subset.length,
      most_invisible: sorted[0]?.story_headline ?? null,
    };
  }

  const blindRegionRanking: Record<string, number> = {};
  for (const story of stories) {
    for (const region of (story as any).regions_absent || []) {
      const key = String(region);
      blindRegionRanking[key] = (blindRegionRanking[key] || 0) + 1;
    }
  }
  const orderedBlindRegionRanking = Object.fromEntries(
    Object.entries(blindRegionRanking).sort((a, b) => b[1] - a[1])
  );

  return {
    date,
    daily_gai: dailyGai,
    tier: gaiTier(dailyGai),
    story_count: storyCount,
    tributaries,
    blind_region_ranking: orderedBlindRegionRanking,
    most_invisible_story: ranked[0]?.story_headline ?? null,
    most_invisible_gai: round2(Number(ranked[0]?.story_gai || 0)),
    most_visible_story: ranked.at(-1)?.story_headline ?? null,
    most_visible_gai: round2(Number(ranked.at(-1)?.story_gai || 0)),
  };
}

async function main() {
  const pgiDates = await listDates('pgi_story_scores', explicitDates);
  const gaiDates = await listDates('gai_story_scores', explicitDates);

  const pgiRows = (await Promise.all(pgiDates.map(aggregatePgiDate))).filter(Boolean) as any[];
  const hydratedPgiRows = await hydratePgiRollingFields(pgiRows);
  if (hydratedPgiRows.length > 0) {
    const { error } = await supabase.from('pgi_daily').upsert(hydratedPgiRows, { onConflict: 'date' });
    if (error) throw new Error(`[aggregate-index-dailies] PGI upsert failed: ${error.message}`);
  }

  const gaiRows = (await Promise.all(gaiDates.map(aggregateGaiDate))).filter(Boolean) as any[];
  if (gaiRows.length > 0) {
    const { error } = await supabase.from('gai_daily').upsert(gaiRows, { onConflict: 'date' });
    if (error) throw new Error(`[aggregate-index-dailies] GAI upsert failed: ${error.message}`);
  }

  console.log(
    `[aggregate-index-dailies] done: pgi=${hydratedPgiRows.length} date(s), gai=${gaiRows.length} date(s)`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
