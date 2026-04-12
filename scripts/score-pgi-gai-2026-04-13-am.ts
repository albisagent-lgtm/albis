import fs from 'fs';
import path from 'path';
import { createAdminClient } from '../src/lib/supabase/admin';

function loadSimpleEnv(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadSimpleEnv(path.resolve(process.cwd(), '.env.local'));

const SCAN_PATH = path.resolve(process.cwd(), '../memory/scans/2026-04-13-am.md');
const SCAN_DATE = '2026-04-13';
const SCAN_PERIOD = 'am';

const REGION_ALIAS: Record<string, string> = {
  us: 'us',
  europe: 'europe',
  'middle-east': 'middle-east',
  middleeast: 'middle-east',
  'south-asia': 'south-asia',
  'east-se-asia': 'east-se-asia',
  africa: 'africa',
  'latin-america': 'latin-america',
  caribbean: 'caribbean',
  pacific: 'pacific',
  'central-asia': 'central-asia',
  global: 'global',
};

const REGION_POP: Record<string, number> = {
  us: 340,
  europe: 750,
  'middle-east': 500,
  'south-asia': 2000,
  'east-se-asia': 2300,
  africa: 1500,
  'latin-america': 670,
  caribbean: 45,
  pacific: 15,
  'central-asia': 80,
};

const REGION_DISTANCE: Record<string, number> = {
  'middle-east|us': 1.3,
  'europe|middle-east': 0.8,
  'south-asia|us': 0.9,
  'east-se-asia|us': 0.7,
  'europe|us': 0.4,
  'africa|europe': 0.6,
  'africa|us': 0.7,
  'africa|middle-east': 0.5,
  'latin-america|us': 0.7,
  'caribbean|us': 0.5,
  'central-asia|europe': 0.6,
  'central-asia|us': 0.8,
  'east-se-asia|europe': 0.5,
  'east-se-asia|middle-east': 0.7,
  'south-asia|europe': 0.6,
  'south-asia|middle-east': 0.7,
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

function clamp(n: number, min = 1, max = 10) {
  return Math.max(min, Math.min(max, Number(n.toFixed(1))));
}

function avg(values: number[]) {
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}

function normalizeRegion(region: string) {
  const key = region.trim().toLowerCase();
  return REGION_ALIAS[key] || key;
}

function significanceNum(sig: string) {
  switch (sig.toLowerCase()) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    default: return 1;
  }
}

function extractItems(raw: string) {
  const start = raw.indexOf('```json');
  const end = raw.lastIndexOf('```');
  if (start === -1 || end === -1 || end <= start) throw new Error('Could not locate JSON block in scan');
  const json = raw.slice(start + 7, end).trim();
  return JSON.parse(json);
}

function computePgiDimensions(item: any) {
  const base = clamp(Number(item.perception_gap || 5));
  const foundCount = (item.regions_found || []).length;
  const absCount = (item.regions_absent || []).length;
  const sig = String(item.significance || 'medium').toLowerCase();
  const category = String(item.category || '').toLowerCase();
  const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';

  const conflictBoost = /(conflict|security|diplomacy|war|ceasefire)/.test(category + ' ' + tags) ? 0.5 : 0;
  const humanitarianBoost = /(migration|food|water|refugee|aid|inflation|economic)/.test(category + ' ' + tags) ? 0.4 : 0;
  const governanceBoost = /(governance|election|decree)/.test(category + ' ' + tags) ? 0.3 : 0;
  const scarcityBoost = absCount >= 4 ? 0.4 : absCount >= 2 ? 0.2 : 0;
  const sigBoost = sig === 'critical' ? 0.5 : sig === 'high' ? 0.3 : 0.1;
  const consensusDrag = foundCount >= 5 ? 0.2 : 0;

  const d1 = clamp(base - 1.2 - consensusDrag + scarcityBoost * 0.2);
  const d2 = clamp(base + 0.2 + conflictBoost + governanceBoost * 0.2);
  const d3 = clamp(base + 0.8 + scarcityBoost + conflictBoost * 0.2);
  const d4 = clamp(base + 0.1 + humanitarianBoost + conflictBoost * 0.2);
  const d5 = clamp(base + 0.3 + conflictBoost * 0.5 + governanceBoost * 0.2);
  const d6 = clamp(base + 0.4 + sigBoost + scarcityBoost * 0.3 + humanitarianBoost * 0.2);

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

function computePairScores(storyPgi: number, regionsFound: string[]) {
  const out: Record<string, number> = {};
  const regs = [...regionsFound].sort();
  for (let i = 0; i < regs.length; i++) {
    for (let j = i + 1; j < regs.length; j++) {
      const key = `${regs[i]}|${regs[j]}`;
      const distance = REGION_DISTANCE[key] ?? 0.5;
      out[key] = clamp(storyPgi + distance);
    }
  }
  return out;
}

function computeGai(item: any, regionsFound: string[], regionsAbsent: string[]) {
  const significance = String(item.significance || 'medium').toLowerCase();
  const significanceSeverity = clamp(significance === 'critical' ? 9.5 : significance === 'high' ? 8.3 : significance === 'medium' ? 6.8 : 5.4);

  const coverageBreadth = Number(item.coverage_breadth || regionsFound.length || 0);
  const totalCoverageUniverse = 9; // matches scan baseline scale more closely than hardcoding 7
  const d1 = clamp(1 + ((totalCoverageUniverse - coverageBreadth) / (totalCoverageUniverse - 1)) * 9);

  const breadthGap = regionsAbsent.length;
  const d2 = clamp(3.2 + breadthGap * 1.1 + (coverageBreadth <= 4 ? 0.8 : 0));

  const missingPopulation = regionsAbsent.reduce((sum, region) => sum + (REGION_POP[region] || 0), 0);
  const worldPopulation = Object.values(REGION_POP).reduce((a, b) => a + b, 0);
  const exposureShare = worldPopulation ? missingPopulation / worldPopulation : 0;
  const d3 = clamp(1 + exposureShare * 9 + (breadthGap >= 4 ? 0.5 : 0));

  const story_gai = avg([d1, d2, d3, significanceSeverity]);

  return {
    coverage_breadth: coverageBreadth,
    d1_coverage_breadth: d1,
    d2_prominence_disparity: d2,
    d3_population_exposure: d3,
    d4_significance_severity: significanceSeverity,
    story_gai,
  };
}

async function main() {
  const raw = fs.readFileSync(SCAN_PATH, 'utf8');
  const items = extractItems(raw);
  const supabase = createAdminClient();

  const stories = items.map((item: any) => {
    const regionsFound = (item.regions_found || []).map(normalizeRegion).filter((r: string) => r !== 'global');
    const regionsAbsent = (item.regions_absent || []).map(normalizeRegion).filter((r: string) => r !== 'global');
    const pgi = computePgiDimensions(item);
    const gai = computeGai(item, regionsFound, regionsAbsent);
    const pairScores = computePairScores(pgi.story_pgi, regionsFound);
    const significance = significanceNum(item.significance || 'medium');
    const rationale = `${item.connection} PGI uses the scan baseline perception gap (${item.perception_gap}/10) and expands it across factual, causal, framing, emotional, actor portrayal, and cui bono dimensions; GAI reflects ${regionsFound.length} regions covering and ${regionsAbsent.length} missing, weighted by prominence disparity, exposed population, and significance.`;

    return {
      story_slug: slugify(item.headline),
      story_headline: item.headline,
      category: item.category,
      regionsFound,
      regionsAbsent,
      significance,
      pgi,
      gai,
      pairScores,
      scoring_rationale: rationale,
    };
  });

  const pgiRows = stories.map((story) => ({
    story_slug: story.story_slug,
    story_headline: story.story_headline,
    category: story.category,
    regions_covered: story.regionsFound,
    region_count: story.regionsFound.length,
    d1_factual: story.pgi.d1_factual,
    d2_causal: story.pgi.d2_causal,
    d3_framing: story.pgi.d3_framing,
    d4_emotional: story.pgi.d4_emotional,
    d5_actor_context: story.pgi.d5_actor_context,
    d6_cui_bono: story.pgi.d6_cui_bono,
    significance: story.significance,
    scoring_rationale: story.scoring_rationale,
    scan_date: SCAN_DATE,
    scan_period: SCAN_PERIOD,
    is_latest: true,
  }));

  const gaiRows = stories.map((story) => ({
    scan_date: SCAN_DATE,
    scan_period: SCAN_PERIOD,
    story_slug: story.story_slug,
    story_headline: story.story_headline,
    category: story.category,
    regions_found: story.regionsFound,
    regions_absent: story.regionsAbsent,
    coverage_breadth: story.gai.coverage_breadth,
    d1_coverage_breadth: story.gai.d1_coverage_breadth,
    d2_prominence_disparity: story.gai.d2_prominence_disparity,
    d3_population_exposure: story.gai.d3_population_exposure,
    d4_significance_severity: story.gai.d4_significance_severity,
    story_gai: story.gai.story_gai,
    significance: story.significance,
    scoring_rationale: story.scoring_rationale,
    is_latest: true,
  }));

  const { data: insertedPgi, error: pgiError } = await supabase
    .from('pgi_story_scores')
    .upsert(pgiRows, { onConflict: 'story_slug,scan_date,scan_period', ignoreDuplicates: false })
    .select('id, story_slug');
  if (pgiError) throw pgiError;

  const pgiIdBySlug = new Map((insertedPgi || []).map((row: any) => [row.story_slug, row.id]));
  const pairRows = stories.flatMap((story) => {
    const story_score_id = pgiIdBySlug.get(story.story_slug);
    if (!story_score_id) return [];
    return Object.entries(story.pairScores).map(([pairKey, pair_pgi]) => {
      const [region_a, region_b] = pairKey.split('|').sort();
      return { story_score_id, region_a, region_b, pair_pgi, scan_date: SCAN_DATE };
    });
  });

  const storyIds = Array.from(pgiIdBySlug.values());
  if (storyIds.length) {
    const { error: deletePairError } = await supabase
      .from('pgi_region_pairs')
      .delete()
      .eq('scan_date', SCAN_DATE)
      .in('story_score_id', storyIds);
    if (deletePairError) throw deletePairError;
  }

  if (pairRows.length) {
    const { error: pairError } = await supabase
      .from('pgi_region_pairs')
      .upsert(pairRows, { onConflict: 'story_score_id,region_a,region_b', ignoreDuplicates: false });
    if (pairError) throw pairError;
  }

  const { error: gaiError } = await supabase
    .from('gai_story_scores')
    .upsert(gaiRows, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });
  if (gaiError) throw gaiError;

  const output = {
    ok: true,
    scanDate: SCAN_DATE,
    scanPeriod: SCAN_PERIOD,
    stories: stories.length,
    pgiCount: pgiRows.length,
    pairCount: pairRows.length,
    gaiCount: gaiRows.length,
    topPgi: [...stories].sort((a, b) => b.pgi.story_pgi - a.pgi.story_pgi)[0],
    topGai: [...stories].sort((a, b) => b.gai.story_gai - a.gai.story_gai)[0],
  };

  const outPath = SCAN_PATH.replace(/\.md$/, '-scores.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
