import fs from 'fs';
import path from 'path';
import { createAdminClient } from '../src/lib/supabase/admin';

type Region = 'us' | 'eu' | 'me' | 'sa' | 'ap' | 'la' | 'af' | 'ru';

type Story = {
  story_slug: string;
  story_headline: string;
  category: string;
  significance: 'critical' | 'high' | 'medium' | 'low';
  regions_found: Region[];
  regions_absent: Region[];
  scan_hint_pgi: number;
  note: string;
};

const scanDate = '2026-04-07';
const scanPeriod = 'midday';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-07-midday.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-07-midday-scores.json');

const raw = fs.readFileSync(scanPath, 'utf8');
const storiesSection = raw.split('## Stories')[1]?.split('## Systems Status Updates')[0] ?? '';
const storyLines = storiesSection.split('\n').filter((line) => line.startsWith('- '));

const ALL_REGIONS: Region[] = ['us', 'eu', 'me', 'sa', 'ap', 'la', 'af'];

function parseLine(line: string): Story | null {
  const parts = line.replace(/^-\s+/, '').split(' | ');
  if (parts.length < 8) return null;
  const headline = parts[0];
  const category = parts[1];
  const pgi = parts[2].replace('PGI:', '').trim();
  const significance = parts[3].trim();
  const found = parts[4].replace('regions_found:', '').trim();
  const absent = parts[5].replace(/^!/, '').trim();
  const hiIndex = parts.findIndex((part) => part.startsWith('HI:'));
  const note = hiIndex > 6 ? parts[hiIndex - 1] : parts[6];
  const foundRegions = found.split(',').map((s) => s.trim()) as Region[];
  const absentRegions = absent.split(',').map((s) => s.trim()) as Region[];
  return {
    story_slug: headline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
    story_headline: headline.trim(),
    category: category.trim(),
    significance: significance.toLowerCase() as Story['significance'],
    regions_found: foundRegions,
    regions_absent: absentRegions,
    scan_hint_pgi: Number(pgi),
    note: note.trim(),
  };
}

const parsedStories = storyLines.map(parseLine).filter(Boolean) as Story[];

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function roundInt(n: number) {
  return Math.round(n);
}

function clamp(n: number, min = 1, max = 10) {
  return Math.max(min, Math.min(max, n));
}

function sigWeight(sig: Story['significance']) {
  return sig === 'critical' ? 1.4 : sig === 'high' ? 0.9 : sig === 'medium' ? 0.2 : -0.2;
}

function sigValue(sig: Story['significance']) {
  return sig === 'critical' ? 3 : sig === 'high' ? 2 : sig === 'medium' ? 1 : 0;
}

function framingBoost(s: Story) {
  const t = `${s.story_headline} ${s.note}`.toLowerCase();
  let boost = 0;
  if (t.includes('arabic') || t.includes('spanish') || t.includes('russian framing') || t.includes('domestic and english frames diverge')) boost += 0.7;
  if (t.includes('not only oil') || t.includes('citizens not strategy') || t.includes('resilience over crisis')) boost += 0.5;
  if (t.includes('unifying science') || t.includes('conservation success')) boost -= 0.7;
  return boost;
}

function computePgiDimensions(s: Story) {
  const base = s.scan_hint_pgi;
  const foundCount = s.regions_found.length;
  const frame = framingBoost(s);
  const factual = clamp(base - 0.6 + (foundCount >= 4 ? 0.2 : 0) + (s.category.includes('science') ? -0.3 : 0));
  const causal = clamp(base - 0.1 + sigWeight(s.significance) * 0.2);
  const narrative = clamp(base + 0.4 + frame);
  const emotional = clamp(base + (s.significance === 'critical' ? 0.3 : s.significance === 'high' ? 0.1 : 0) + (s.category.includes('health') || s.category.includes('migration') || s.category.includes('food') ? 0.2 : 0));
  const actor = clamp(base - 0.2 + frame * 0.6 + (s.regions_found.includes('me') && s.regions_found.includes('us') ? 0.2 : 0));
  const cui = clamp(base + 0.2 + sigWeight(s.significance) * 0.15 + (s.category.includes('technology') || s.category.includes('energy') ? 0.2 : 0));
  return {
    d1_factual: round1(factual),
    d2_causal: round1(causal),
    d3_framing: round1(narrative),
    d4_emotional: round1(emotional),
    d5_actor_context: round1(actor),
    d6_cui_bono: round1(cui),
  };
}

function regionPairDelta(a: Region, b: Region, s: Story) {
  const set = new Set([a, b]);
  let delta = 0;
  if (set.has('us') && set.has('me')) delta += 0.5;
  if (set.has('us') && set.has('ap')) delta += 0.4;
  if (set.has('eu') && set.has('ru')) delta += 0.5;
  if (set.has('la') && set.has('me')) delta += 0.3;
  if (set.has('af') && set.has('us') && (s.category.includes('health') || s.category.includes('migration') || s.category.includes('food'))) delta += 0.5;
  if (set.has('eu') && set.has('us')) delta -= 0.3;
  if (s.story_headline.toLowerCase().includes('artemis') || s.story_headline.toLowerCase().includes('rhinos')) delta -= 0.6;
  if (s.note.toLowerCase().includes('unifying')) delta -= 0.4;
  return delta;
}

function buildPairScores(s: Story, storyPgi: number) {
  const pairs: Record<string, number> = {};
  for (let i = 0; i < s.regions_found.length; i++) {
    for (let j = i + 1; j < s.regions_found.length; j++) {
      const a = s.regions_found[i];
      const b = s.regions_found[j];
      const score = round1(clamp(storyPgi + regionPairDelta(a, b, s), 1, 10));
      pairs[[a, b].sort().join('|')] = score;
    }
  }
  return pairs;
}

function computeGaiDimensions(s: Story) {
  const foundStandard = s.regions_found.filter((r) => ALL_REGIONS.includes(r as any)).length;
  const breadth = clamp(10 - (foundStandard - 1) * 1.5, 1, 10);
  let prominence = 5.5 + s.regions_absent.length * 0.6;
  let population = 4.8 + (s.regions_absent.includes('us') ? 1.0 : 0) + (s.regions_absent.includes('ap') ? 1.0 : 0) + (s.regions_absent.includes('af') ? 0.4 : 0) + (s.regions_absent.includes('la') ? 0.4 : 0);
  let severity = clamp(6.3 + sigWeight(s.significance) * 1.6 + (s.category.includes('food') || s.category.includes('health') || s.category.includes('migration') || s.category.includes('energy') ? 0.5 : 0));

  const t = `${s.story_headline} ${s.note}`.toLowerCase();
  if (t.includes('undercovered') || t.includes('missed') || t.includes('humanitarian emergency')) prominence += 0.7;
  if (t.includes('non-crisis') || t.includes('conservation success') || t.includes('science milestone')) severity -= 1.0;
  if (foundStandard <= 1) prominence += 1.2;
  if (foundStandard <= 2) population += 0.8;

  const d1 = round1(clamp(breadth));
  const d2 = round1(clamp(prominence));
  const d3 = round1(clamp(population));
  const d4 = round1(clamp(severity));
  const storyGai = round1((d1 + d2 + d3 + d4) / 4);
  return {
    d1_coverage_breadth: d1,
    d2_prominence_disparity: d2,
    d3_population_exposure: d3,
    d4_significance_severity: d4,
    story_gai: storyGai,
  };
}

function scoreStory(s: Story) {
  const dims = computePgiDimensions(s);
  const storyPgi = round1((Object.values(dims).reduce((a, b) => a + b, 0)) / 6);
  const pairPgi = buildPairScores(s, storyPgi);
  const gai = computeGaiDimensions(s);

  return {
    story_slug: s.story_slug,
    story_headline: s.story_headline,
    category: s.category,
    significance: s.significance,
    story_pgi: storyPgi,
    story_gai: gai.story_gai,
    regions_found: s.regions_found,
    regions_absent: s.regions_absent,
    dimensions: dims,
    gai_dimensions: {
      d1_coverage_breadth: gai.d1_coverage_breadth,
      d2_prominence_disparity: gai.d2_prominence_disparity,
      d3_population_exposure: gai.d3_population_exposure,
      d4_significance_severity: gai.d4_significance_severity,
    },
    pair_pgi: pairPgi,
    scoring_rationale: s.note,
  };
}

async function main() {
  const supabase = createAdminClient();
  const scored = parsedStories.map(scoreStory);

  const pgiRows = scored.map((s) => ({
    story_slug: s.story_slug,
    story_headline: s.story_headline,
    category: s.category,
    regions_covered: s.regions_found,
    region_count: s.regions_found.length,
    d1_factual: roundInt(s.dimensions.d1_factual),
    d2_causal: roundInt(s.dimensions.d2_causal),
    d3_framing: roundInt(s.dimensions.d3_framing),
    d4_emotional: roundInt(s.dimensions.d4_emotional),
    d5_actor_context: roundInt(s.dimensions.d5_actor_context),
    d6_cui_bono: roundInt(s.dimensions.d6_cui_bono),
    significance: sigValue(s.significance as Story['significance']),
    scoring_rationale: s.scoring_rationale,
    scan_date: scanDate,
    scan_period: scanPeriod,
    is_latest: true,
  }));

  const gaiRows = scored.map((s) => ({
    scan_date: scanDate,
    scan_period: scanPeriod,
    story_slug: s.story_slug,
    story_headline: s.story_headline,
    category: s.category,
    regions_found: s.regions_found,
    regions_absent: s.regions_absent,
    coverage_breadth: roundInt(s.gai_dimensions.d1_coverage_breadth),
    d1_coverage_breadth: roundInt(s.gai_dimensions.d1_coverage_breadth),
    d2_prominence_disparity: roundInt(s.gai_dimensions.d2_prominence_disparity),
    d3_population_exposure: roundInt(s.gai_dimensions.d3_population_exposure),
    d4_significance_severity: roundInt(s.gai_dimensions.d4_significance_severity),
    story_gai: roundInt(s.story_gai),
    significance: sigValue(s.significance as Story['significance']),
    scoring_rationale: s.scoring_rationale,
    is_latest: true,
  }));

  const { data: pgiInserted, error: pgiError } = await supabase
    .from('pgi_story_scores')
    .upsert(pgiRows, { onConflict: 'story_slug,scan_date,scan_period', ignoreDuplicates: false })
    .select('id, story_slug');

  if (pgiError) throw pgiError;

  const insertedMap = new Map((pgiInserted || []).map((row: any) => [row.story_slug, row.id]));

  const pairRows: any[] = [];
  for (const story of scored) {
    const storyScoreId = insertedMap.get(story.story_slug);
    if (!storyScoreId) continue;
    for (const [key, val] of Object.entries(story.pair_pgi)) {
      const [region_a, region_b] = key.split('|').sort();
      pairRows.push({
        story_score_id: storyScoreId,
        region_a,
        region_b,
        pair_pgi: roundInt(val),
        scan_date: scanDate,
      });
    }
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

  const artifact = {
    scanDate,
    scanPeriod,
    stories: scored.length,
    pgiCount: pgiRows.length,
    pairCount: pairRows.length,
    gaiCount: gaiRows.length,
    scored,
  };

  fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2));
  console.log(JSON.stringify({ ok: true, ...artifact }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
