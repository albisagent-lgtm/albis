#!/usr/bin/env tsx
import path from 'path';
import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/admin';
import { loadVerifiedScanItems, type ScanPeriod } from '../src/lib/pipeline-db';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseArgs() {
  const date = process.argv[2];
  const period = process.argv[3] as ScanPeriod | undefined;
  if (!date || !period || !['am', 'midday', 'pm'].includes(period)) {
    fail('Usage: npx tsx scripts/score-verified-scan.ts YYYY-MM-DD <am|midday|pm>');
  }
  return { date, period };
}

function clamp(n: number, min = 1, max = 10) {
  return Math.max(min, Math.min(max, Number(n.toFixed(1))));
}

function avg(values: number[]) {
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

function significanceToNumeric(sig: string) {
  if (sig === 'critical') return 4;
  if (sig === 'high') return 3;
  if (sig === 'medium') return 2;
  return 1;
}

const REGION_ALIASES: Record<string, string> = {
  us: 'us',
  'united states': 'us',
  eu: 'europe',
  europe: 'europe',
  'middle east': 'middle-east',
  'middle-east': 'middle-east',
  middle_east: 'middle-east',
  'south asia': 'south-asia',
  'south-asia': 'south-asia',
  south_asia: 'south-asia',
  'east & se asia': 'east-se-asia',
  'east and se asia': 'east-se-asia',
  'east & southeast asia': 'east-se-asia',
  'east-se-asia': 'east-se-asia',
  east_se_asia: 'east-se-asia',
  'asia-pacific': 'pacific',
  'asia pacific': 'pacific',
  asia_pacific: 'pacific',
  pacific: 'pacific',
  africa: 'africa',
  'latin america': 'latin-america',
  'latin-america': 'latin-america',
  latin_america: 'latin-america',
  latam: 'latin-america',
  caribbean: 'caribbean',
  'central asia': 'central-asia',
  'central-asia': 'central-asia',
  central_asia: 'central-asia',
  global: 'global',
};

const GAI_REGION_UNIVERSE = [
  'us',
  'europe',
  'middle-east',
  'south-asia',
  'east-se-asia',
  'africa',
  'latin-america',
  'pacific',
  'caribbean',
  'central-asia',
];

const REGION_POP: Record<string, number> = {
  us: 380,
  europe: 750,
  'middle-east': 680,
  africa: 1300,
  'south-asia': 2000,
  'east-se-asia': 2400,
  'latin-america': 660,
  pacific: 50,
  caribbean: 45,
  'central-asia': 80,
};

const WORLD_POP = Object.values(REGION_POP).reduce((sum, n) => sum + n, 0);

function uniq<T>(items: T[]) {
  return [...new Set(items)];
}

function normRegion(region: string | null | undefined) {
  if (!region) return null;
  const key = String(region).trim().toLowerCase().replace(/_/g, ' ');
  return REGION_ALIASES[key] || REGION_ALIASES[key.replace(/\s+/g, '-')] || key.replace(/\s+/g, '-');
}

const REGION_DISTANCE: Record<string, number> = {
  'middle-east|us': 0.4,
  'middle-east|europe': 0.1,
  'middle-east|east-se-asia': 0.1,
  'middle-east|latin-americas': 0.3,
  'middle-east|africa': 0.2,
  'us|europe': -0.2,
  'us|east-se-asia': 0.2,
  'us|latin-americas': 0.25,
  'us|africa': 0.35,
  'europe|east-se-asia': 0.15,
  'europe|latin-americas': 0.05,
  'europe|africa': 0.2,
  'east-se-asia|latin-americas': 0.15,
  'east-se-asia|africa': 0.3,
  'latin-americas|africa': 0.2,
};

function scorePgi(item: Awaited<ReturnType<typeof loadVerifiedScanItems>>[number]) {
  const base = item.perception_gap ?? 5;
  const regionCount = item.regions.length;
  const scarcityBoost = regionCount <= 2 ? 0.5 : regionCount === 3 ? 0.2 : 0;
  const sigBoost = item.significance === 'high' ? 0.2 : item.significance === 'medium' ? 0.05 : 0;
  const h = item.headline.toLowerCase();
  const techBoost = /(ai|chip|cloud|compute|data)/.test(h) ? 0.2 : 0;
  const humanBoost = /(aid|civilian|food|fuel|inflation|migration|ceasefire|shipping)/.test(h) ? 0.2 : 0;

  const d1 = clamp(base - 0.4 + scarcityBoost * 0.2);
  const d2 = clamp(base - 0.1 + scarcityBoost * 0.2 + sigBoost);
  const d3 = clamp(base + 0.3 + techBoost * 0.3 + humanBoost * 0.2);
  const d4 = clamp(base + 0.1 + humanBoost + (item.significance === 'high' ? 0.2 : 0));
  const d5 = clamp(base - 0.1 + techBoost * 0.2 + humanBoost * 0.1);
  const d6 = clamp(base + 0.2 + sigBoost + humanBoost * 0.1);

  return {
    d1_factual: d1,
    d2_causal: d2,
    d3_framing: d3,
    d4_emotional: d4,
    d5_actor_context: d5,
    d6_cui_bono: d6,
    story_pgi: avg([d1, d2, d3, d4, d5, d6]),
  };
}

function scoreGai(item: Awaited<ReturnType<typeof loadVerifiedScanItems>>[number]) {
  const found = uniq((item.regions || []).map(normRegion).filter(Boolean) as string[]).filter((r) => r !== 'global');
  const absent = GAI_REGION_UNIVERSE.filter((region) => !found.includes(region));
  const covered = item.coverage_breadth || found.length || 1;
  const significance = significanceToNumeric(item.significance);
  const d1 = clamp(8 - covered);
  const d2 = clamp(2 + absent.length * 0.6);
  const missingPop = absent.reduce((sum, region) => sum + (REGION_POP[region] || 0), 0);
  const d3 = clamp(1 + (missingPop / WORLD_POP) * 9);
  const d4 = clamp(1 + ((significance - 1) / 3) * 6 + ((GAI_REGION_UNIVERSE.length - covered) / GAI_REGION_UNIVERSE.length) * 2);
  const story_gai = avg([d1, d2, d3, d4]);

  return {
    regions_found: found,
    regions_absent: absent,
    coverage_breadth: covered,
    d1_coverage_breadth: d1,
    d2_prominence_disparity: d2,
    d3_population_exposure: d3,
    d4_significance_severity: d4,
    story_gai,
  };
}

function buildPairScores(storyPgi: number, regions: string[]) {
  const pairs: Array<{ region_a: string; region_b: string; pair_pgi: number }> = [];
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const [region_a, region_b] = [regions[i], regions[j]].sort();
      const key = `${region_a}|${region_b}`;
      const distance = REGION_DISTANCE[key] ?? 0.15;
      pairs.push({ region_a, region_b, pair_pgi: clamp(storyPgi + distance) });
    }
  }
  return pairs;
}

async function main() {
  const { date, period } = parseArgs();
  const supabase = createAdminClient();
  const items = await loadVerifiedScanItems(supabase, date, period);

  const { data: oldPgi } = await supabase
    .from('pgi_story_scores')
    .select('id')
    .eq('scan_date', date)
    .eq('scan_period', period);
  const oldIds = (oldPgi || []).map((row: any) => row.id).filter(Boolean);
  if (oldIds.length) {
    await supabase.from('pgi_region_pairs').delete().in('story_score_id', oldIds);
  }
  await supabase.from('pgi_story_scores').delete().eq('scan_date', date).eq('scan_period', period);
  await supabase.from('gai_story_scores').delete().eq('scan_date', date).eq('scan_period', period);

  const pgiRows = items.map((item) => {
    const pgi = scorePgi(item);
    return {
      story_slug: slugify(item.headline),
      story_headline: item.headline,
      category: item.category,
      regions_covered: item.regions,
      region_count: item.regions.length,
      d1_factual: pgi.d1_factual,
      d2_causal: pgi.d2_causal,
      d3_framing: pgi.d3_framing,
      d4_emotional: pgi.d4_emotional,
      d5_actor_context: pgi.d5_actor_context,
      d6_cui_bono: pgi.d6_cui_bono,
      significance: significanceToNumeric(item.significance),
      scoring_rationale: `DB-truth-first scorer using verified scan items for ${date} ${period}`,
      scan_date: date,
      scan_period: period,
      is_latest: true,
    };
  });

  const gaiRows = items.map((item) => {
    const gai = scoreGai(item);
    return {
      scan_date: date,
      scan_period: period,
      story_slug: slugify(item.headline),
      story_headline: item.headline,
      category: item.category,
      regions_found: gai.regions_found,
      regions_absent: gai.regions_absent,
      coverage_breadth: gai.coverage_breadth,
      d1_coverage_breadth: gai.d1_coverage_breadth,
      d2_prominence_disparity: gai.d2_prominence_disparity,
      d3_population_exposure: gai.d3_population_exposure,
      d4_significance_severity: gai.d4_significance_severity,
      story_gai: gai.story_gai,
      significance: significanceToNumeric(item.significance),
      scoring_rationale: `DB-truth-first scorer using verified scan items for ${date} ${period}`,
      is_latest: true,
    };
  });

  const { data: insertedPgi, error: pgiError } = await supabase.from('pgi_story_scores').insert(pgiRows).select('id, story_slug, story_pgi, regions_covered');
  if (pgiError) fail(`PGI insert failed: ${pgiError.message}`);

  const pairRows = (insertedPgi || []).flatMap((row: any) =>
    buildPairScores(row.story_pgi, Array.isArray(row.regions_covered) ? row.regions_covered : []).map((pair) => ({
      story_score_id: row.id,
      region_a: pair.region_a,
      region_b: pair.region_b,
      pair_pgi: pair.pair_pgi,
      scan_date: date,
    }))
  );
  if (pairRows.length) {
    const { error: pairError } = await supabase.from('pgi_region_pairs').insert(pairRows);
    if (pairError) fail(`PGI pair insert failed: ${pairError.message}`);
  }

  const { error: gaiError } = await supabase.from('gai_story_scores').insert(gaiRows);
  if (gaiError) fail(`GAI insert failed: ${gaiError.message}`);

  console.log(JSON.stringify({ ok: true, date, period, items: items.length, pgiRows: pgiRows.length, gaiRows: gaiRows.length, pairRows: pairRows.length }, null, 2));
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
