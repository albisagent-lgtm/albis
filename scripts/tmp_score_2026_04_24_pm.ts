import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { createAdminClient } from '../src/lib/supabase/admin';

const supabase = createAdminClient();

const SCAN_DATE = '2026-04-24';
const SCAN_PERIOD = 'pm';
const scanPath = path.join(__dirname, '..', '..', 'memory', 'scans', '2026-04-24-pm.md');
const outPath = path.join(__dirname, '..', '..', 'memory', 'scans', '2026-04-24-pm-scores.json');

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min = 1, max = 10) {
  return Math.max(min, Math.min(max, n));
}

function roundInt(n: number) {
  return Math.round(n);
}

function significanceValue(sig: string) {
  return sig === 'critical' ? 5 : sig === 'high' ? 3 : sig === 'medium' ? 2 : 1;
}

function coreRegionCode(label: string) {
  const map: Record<string, string | null> = {
    us: 'us',
    europe: 'eu',
    'middle-east': 'me',
    'south-asia': 'sa',
    'east-se-asia': 'ap',
    'latin-america': 'la',
    africa: 'af',
    russia: 'ru',
    canada: 'us',
    global: null,
    pacific: null,
    caribbean: null,
    'central-asia': null,
  };
  return map[label] ?? null;
}

const REGION_DISTANCE: Record<string, number> = {
  'eu|me': 0.7,
  'eu|us': 0.2,
  'me|us': 1.0,
  'ap|us': 0.7,
  'ap|me': 0.6,
  'ap|eu': 0.4,
  'af|eu': 0.3,
  'af|us': 0.5,
  'af|la': 0.2,
  'af|me': 0.4,
  'la|eu': 0.2,
  'la|us': 0.4,
  'la|me': 0.6,
  'sa|us': 0.5,
  'sa|eu': 0.4,
  'me|sa': 0.7,
  'ap|sa': 0.3,
  'ru|eu': 0.8,
  'ru|us': 0.9,
  'ru|me': 0.6,
  'eu|sa': 0.4,
};

const raw = fs.readFileSync(scanPath, 'utf8');
const jsonBlockMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
if (!jsonBlockMatch) throw new Error('Could not find JSON block in scan file');
const stories = JSON.parse(jsonBlockMatch[1]);

const scored = stories.map((story: any) => {
  const headline = story.headline.trim();
  const slug = slugify(headline);
  const sig = story.significance;
  const base = Number(story.perception_gap || 5);
  const text = `${headline} ${story.connection || ''} ${(story.tags || []).join(' ')} ${(story.patterns || []).join(' ')}`.toLowerCase();

  let d1 = base - 0.6;
  let d2 = base - 0.1;
  let d3 = base + 0.4;
  let d4 = base + (sig === 'critical' ? 0.2 : sig === 'high' ? 0.1 : 0);
  let d5 = base + 0.1;
  let d6 = base + 0.2;

  if (/ceasefire|mediat|extension|talks|diplomacy|legal lifeline|court adviser/.test(text)) {
    d2 += 0.4; d3 += 0.6; d5 += 0.4; d6 += 0.4;
  }
  if (/hormuz|shipping|ship|oil|sanctions|loan|veto|tariff|trade|migration|border|deport|asylum/.test(text)) {
    d2 += 0.2; d3 += 0.3; d6 += 0.4;
  }
  if (/iran|israel|ukraine|russia|china|trump|ice|refugee|sudan/.test(text)) {
    d3 += 0.3; d5 += 0.2;
  }
  if (/health|measles|meningitis|vaccine|death|custody|shooting|violence/.test(text)) {
    d4 += 0.5; d5 += 0.2;
  }
  if (/markets|shares|earnings|sales|bookings|debt|inflation|manufacturers|solar demand/.test(text)) {
    d1 -= 0.2; d4 -= 0.1;
  }
  if (/ai|openai|cerebras|chips|cloud|compute|data-centre|quantum/.test(text)) {
    d1 -= 0.4; d4 -= 0.2; d5 += 0.1;
  }
  if (/africa finance|infrastructure|panama canal|dataset|alibaba/.test(text)) {
    d3 += 0.2; d6 += 0.2;
  }

  const dimensions = {
    d1_factual: round1(clamp(d1)),
    d2_causal: round1(clamp(d2)),
    d3_framing: round1(clamp(d3)),
    d4_emotional: round1(clamp(d4)),
    d5_actor_context: round1(clamp(d5)),
    d6_cui_bono: round1(clamp(d6)),
  };

  const story_pgi = round1(Object.values(dimensions).reduce((a, b) => a + b, 0) / 6);

  const foundCore = [...new Set((story.regions_found || []).map(coreRegionCode).filter(Boolean))] as string[];
  const pair_pgi: Record<string, number> = {};
  for (let i = 0; i < foundCore.length; i++) {
    for (let j = i + 1; j < foundCore.length; j++) {
      const pair = [foundCore[i], foundCore[j]].sort();
      const key = pair.join('|');
      pair_pgi[key] = round1(clamp(story_pgi + (REGION_DISTANCE[key] ?? 0.35)));
    }
  }

  const totalRegions = 7;
  const covered = foundCore.length;
  const missing = Math.max(0, totalRegions - covered);
  const d1g = round1(clamp(1 + (missing / totalRegions) * 9));
  let d2g = 4.5 + missing * 0.6;
  let d3g = 4.3 + missing * 0.55;
  let d4g = sig === 'critical' ? 9.4 : sig === 'high' ? 8.5 : sig === 'medium' ? 7.2 : 5.8;

  if (/hormuz|oil|sanctions|shipping|ukraine|russia|refugee|measles|meningitis|ice custody/.test(text)) d4g += 0.4;
  if (/ai|chips|compute|quantum|sales|bookings/.test(text)) d4g -= 0.2;
  if (/migration|border|canal|debt|state-aid/.test(text)) d4g -= 0.1;
  if (/markets|shares/.test(text)) d2g -= 0.2;

  const gai_dimensions = {
    d1_coverage_breadth: round1(clamp(d1g)),
    d2_prominence_disparity: round1(clamp(d2g)),
    d3_population_exposure: round1(clamp(d3g)),
    d4_significance_severity: round1(clamp(d4g)),
  };
  const story_gai = round1(Object.values(gai_dimensions).reduce((a, b) => a + b, 0) / 4);

  return {
    story_slug: slug,
    story_headline: headline,
    category: story.category,
    significance: sig,
    significance_value: significanceValue(sig),
    story_pgi,
    story_gai,
    regions_found: story.regions_found,
    regions_absent: story.regions_absent,
    regions_covered: foundCore,
    dimensions,
    gai_dimensions,
    pair_pgi,
    scoring_rationale: story.connection,
  };
});

async function main() {
  const { data: existingPgiRows, error: fetchPgiError } = await supabase
    .from('pgi_story_scores')
    .select('id')
    .eq('scan_date', SCAN_DATE)
    .eq('scan_period', SCAN_PERIOD);
  if (fetchPgiError) throw fetchPgiError;

  const existingIds = (existingPgiRows || []).map((r: any) => r.id);
  if (existingIds.length) {
    const { error: delPairsErr } = await supabase
      .from('pgi_region_pairs')
      .delete()
      .in('story_score_id', existingIds);
    if (delPairsErr) throw delPairsErr;
  }

  const { error: delPgiErr } = await supabase
    .from('pgi_story_scores')
    .delete()
    .eq('scan_date', SCAN_DATE)
    .eq('scan_period', SCAN_PERIOD);
  if (delPgiErr) throw delPgiErr;

  const { error: delGaiErr } = await supabase
    .from('gai_story_scores')
    .delete()
    .eq('scan_date', SCAN_DATE)
    .eq('scan_period', SCAN_PERIOD);
  if (delGaiErr) throw delGaiErr;

  const pgiRows = scored.map((s) => ({
    story_slug: s.story_slug,
    story_headline: s.story_headline,
    category: s.category,
    regions_covered: s.regions_covered,
    region_count: s.regions_covered.length,
    d1_factual: roundInt(s.dimensions.d1_factual),
    d2_causal: roundInt(s.dimensions.d2_causal),
    d3_framing: roundInt(s.dimensions.d3_framing),
    d4_emotional: roundInt(s.dimensions.d4_emotional),
    d5_actor_context: roundInt(s.dimensions.d5_actor_context),
    d6_cui_bono: roundInt(s.dimensions.d6_cui_bono),
    significance: s.significance_value,
    scoring_rationale: s.scoring_rationale,
    scan_date: SCAN_DATE,
    scan_period: SCAN_PERIOD,
    is_latest: true,
  }));

  const { data: insertedPgi, error: pgiError } = await supabase
    .from('pgi_story_scores')
    .insert(pgiRows)
    .select('id, story_slug');
  if (pgiError) throw pgiError;

  const idBySlug = new Map((insertedPgi || []).map((r: any) => [r.story_slug, r.id]));
  const pairRows: Array<{ story_score_id: any; region_a: string; region_b: string; pair_pgi: number; scan_date: string }> = [];
  for (const s of scored) {
    const storyId = idBySlug.get(s.story_slug);
    if (!storyId) continue;
    for (const [key, val] of Object.entries(s.pair_pgi)) {
      const [region_a, region_b] = key.split('|').sort();
      pairRows.push({ story_score_id: storyId, region_a, region_b, pair_pgi: roundInt(val), scan_date: SCAN_DATE });
    }
  }

  if (pairRows.length) {
    const { error: pairError } = await supabase.from('pgi_region_pairs').insert(pairRows);
    if (pairError) throw pairError;
  }

  const gaiRows = scored.map((s) => ({
    scan_date: SCAN_DATE,
    scan_period: SCAN_PERIOD,
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
    significance: s.significance_value,
    scoring_rationale: s.scoring_rationale,
    is_latest: true,
  }));

  const { error: gaiError } = await supabase.from('gai_story_scores').insert(gaiRows);
  if (gaiError) throw gaiError;

  const artifact = {
    scanDate: SCAN_DATE,
    scanPeriod: SCAN_PERIOD,
    stories: scored.length,
    pgiCount: pgiRows.length,
    pairCount: pairRows.length,
    gaiCount: gaiRows.length,
    scored,
  };

  fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2) + '\n');
  console.log(JSON.stringify({ ok: true, scanDate: SCAN_DATE, scanPeriod: SCAN_PERIOD, stories: scored.length, pairCount: pairRows.length, outPath }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
