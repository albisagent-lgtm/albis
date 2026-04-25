import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const scanPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-25-pm.md';
const envPath = '/Users/treelight/.openclaw/workspace/albis-app/.env.local';

function loadEnv(file) {
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function clamp(n, min = 1, max = 10) {
  return Math.max(min, Math.min(max, n));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function significanceValue(sig) {
  const s = String(sig || '').toLowerCase();
  if (s === 'critical') return 5;
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  return 1;
}

function regionCode(region) {
  const map = {
    'middle-east': 'me',
    'south-asia': 'sa',
    'east-se-asia': 'ap',
    'europe': 'eu',
    'us': 'us',
    'africa': 'af',
    'latin-america': 'la',
    'pacific': 'pa',
    'caribbean': 'cb',
    'global': 'gl',
  };
  return map[region] || region.slice(0, 2);
}

function pairBias(a, b) {
  const set = new Set([a, b]);
  if (set.has('middle-east') && set.has('us')) return 0.7;
  if (set.has('middle-east') && set.has('europe')) return 0.5;
  if (set.has('middle-east') && set.has('south-asia')) return 0.6;
  if (set.has('us') && set.has('east-se-asia')) return 0.6;
  if (set.has('us') && set.has('latin-america')) return 0.5;
  if (set.has('europe') && set.has('africa')) return 0.4;
  if (set.has('europe') && set.has('latin-america')) return 0.2;
  if (set.has('africa') && set.has('global')) return 0.3;
  return 0;
}

function categoryBias(category) {
  const map = {
    diplomacy: -0.2,
    conflict: 0.4,
    governance: 0.2,
    legal: 0.1,
    migration: 0.5,
    social: 0.5,
    climate: -0.3,
    health: -0.6,
    infrastructure: -0.5,
    'food-agriculture': 0.0,
    'tech-ai': 0.5,
    media: 0.1,
    security: 0.3,
    energy: -0.2,
    economic: -0.4,
  };
  return map[category] ?? 0;
}

function buildPgi(story) {
  const base = Number(story.perception_gap || 5);
  const catBias = categoryBias(story.category);
  const dims = {
    d1_factual: round1(clamp(base - 1.0 + catBias * 0.3)),
    d2_causal: round1(clamp(base - 0.1 + catBias * 0.6)),
    d3_framing: round1(clamp(base + 0.8 + catBias * 0.7)),
    d4_emotional: round1(clamp(base - 0.2 + catBias * 0.9)),
    d5_actor_context: round1(clamp(base + 0.2 + catBias * 0.8)),
    d6_cui_bono: round1(clamp(base + 0.1 + catBias * 0.7)),
  };
  const story_pgi = round1(Object.values(dims).reduce((a, b) => a + b, 0) / 6);

  const covered = (story.regions_found || []).filter((r) => r !== 'global');
  const pair_pgi = {};
  for (let i = 0; i < covered.length; i++) {
    for (let j = i + 1; j < covered.length; j++) {
      const a = covered[i];
      const b = covered[j];
      const score = round1(clamp(story_pgi + pairBias(a, b) + (a === 'us' || b === 'us' ? 0.1 : 0), 1, 10));
      pair_pgi[[regionCode(a), regionCode(b)].sort().join('|')] = score;
    }
  }

  const rationale = `${story.connection} PGI is driven mainly by ${story.category} framing differences between ${covered.length >= 2 ? covered.slice(0, 2).join(' and ') : (covered[0] || 'global outlets')} over causes, stakes, and who benefits.`;

  return { dims, story_pgi, pair_pgi, regions_covered: covered.map(regionCode), rationale };
}

function buildGai(story) {
  const breadthBase = Number(story.coverage_breadth || 5);
  const sig = significanceValue(story.significance);
  const absent = (story.regions_absent || []).length;
  const found = (story.regions_found || []).filter((r) => r !== 'global').length;
  const d1 = round1(clamp(11 - breadthBase));
  const d2 = round1(clamp(4 + absent * 0.55 + (found <= 2 ? 1.2 : found === 3 ? 0.6 : 0)));
  const d3 = round1(clamp(4.5 + absent * 0.45 + sig * 0.25));
  const d4 = round1(clamp(4.8 + sig * 1.0 + (story.significance === 'critical' ? 0.6 : 0)));
  const story_gai = round1((d1 + d2 + d3 + d4) / 4);
  const rationale = `${story.connection} GAI reflects ${found} region group${found === 1 ? '' : 's'} covering it while ${absent} miss it, leaving a meaningful visibility gap for a ${story.significance} significance story.`;
  return {
    dims: {
      d1_coverage_breadth: d1,
      d2_prominence_disparity: d2,
      d3_population_exposure: d3,
      d4_significance_severity: d4,
    },
    story_gai,
    rationale,
  };
}

function extractStories(md) {
  const match = md.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) throw new Error('Could not find JSON block in scan markdown');
  return JSON.parse(match[1]);
}

loadEnv(envPath);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const md = fs.readFileSync(scanPath, 'utf8');
const stories = extractStories(md);
const scan_date = '2026-04-25';
const scan_period = 'pm';

const pgiRows = [];
const gaiRows = [];
const pairRows = [];

for (const story of stories) {
  const story_slug = slugify(story.headline);
  const pgi = buildPgi(story);
  const gai = buildGai(story);
  const significance_value = significanceValue(story.significance);

  pgiRows.push({
    scan_date,
    scan_period,
    story_slug,
    story_headline: story.headline,
    category: story.category,
    significance: significance_value,
    regions_covered: pgi.regions_covered,
    region_count: pgi.regions_covered.length,
    d1_factual: pgi.dims.d1_factual,
    d2_causal: pgi.dims.d2_causal,
    d3_framing: pgi.dims.d3_framing,
    d4_emotional: pgi.dims.d4_emotional,
    d5_actor_context: pgi.dims.d5_actor_context,
    d6_cui_bono: pgi.dims.d6_cui_bono,
    scoring_rationale: pgi.rationale,
    is_latest: true,
  });

  gaiRows.push({
    scan_date,
    scan_period,
    story_slug,
    story_headline: story.headline,
    category: story.category,
    significance: significance_value,
    regions_found: story.regions_found || [],
    regions_absent: story.regions_absent || [],
    coverage_breadth: story.coverage_breadth,
    d1_coverage_breadth: gai.dims.d1_coverage_breadth,
    d2_prominence_disparity: gai.dims.d2_prominence_disparity,
    d3_population_exposure: gai.dims.d3_population_exposure,
    d4_significance_severity: gai.dims.d4_significance_severity,
    scoring_rationale: gai.rationale,
    is_latest: true,
  });

  for (const [pairKey, pairScore] of Object.entries(pgi.pair_pgi)) {
    const [aCode, bCode] = pairKey.split('|');
    pairRows.push({ story_slug, aCode, bCode, pairScore });
  }
}

const { data: insertedPgi, error: pgiError } = await supabase
  .from('pgi_story_scores')
  .upsert(pgiRows, { onConflict: 'story_slug,scan_date,scan_period', ignoreDuplicates: false })
  .select('id, story_slug');
if (pgiError) throw pgiError;

const idBySlug = new Map((insertedPgi || []).map((row) => [row.story_slug, row.id]));
const codeToRegion = { me: 'middle_east', sa: 'south_asia', ap: 'east_se_asia', eu: 'europe', us: 'us', af: 'africa', la: 'latin_america', pa: 'pacific', cb: 'caribbean', gl: 'global' };
const fullPairRows = pairRows
  .map((row) => ({
    story_score_id: idBySlug.get(row.story_slug),
    region_a: [codeToRegion[row.aCode], codeToRegion[row.bCode]].sort()[0],
    region_b: [codeToRegion[row.aCode], codeToRegion[row.bCode]].sort()[1],
    pair_pgi: row.pairScore,
    scan_date,
  }))
  .filter((row) => row.story_score_id && row.region_a && row.region_b);

let pairError = null;
if (fullPairRows.length) {
  const result = await supabase
    .from('pgi_region_pairs')
    .upsert(fullPairRows, { onConflict: 'story_score_id,region_a,region_b', ignoreDuplicates: false });
  pairError = result.error;
  if (pairError) throw pairError;
}

const { error: gaiError } = await supabase
  .from('gai_story_scores')
  .upsert(gaiRows, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });
if (gaiError) throw gaiError;

const outPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-25-pm-scores.json';
fs.writeFileSync(outPath, JSON.stringify({
  scanDate: scan_date,
  scanPeriod: scan_period,
  stories: stories.length,
  pgiCount: pgiRows.length,
  pairCount: fullPairRows.length,
  gaiCount: gaiRows.length,
  scored: stories.map((story, i) => ({
    story_slug: pgiRows[i].story_slug,
    story_headline: story.headline,
    category: story.category,
    significance: story.significance,
    significance_value: significanceValue(story.significance),
    story_pgi: buildPgi(story).story_pgi,
    story_gai: buildGai(story).story_gai,
    regions_found: story.regions_found,
    regions_absent: story.regions_absent,
    regions_covered: pgiRows[i].regions_covered,
    dimensions: {
      d1_factual: pgiRows[i].d1_factual,
      d2_causal: pgiRows[i].d2_causal,
      d3_framing: pgiRows[i].d3_framing,
      d4_emotional: pgiRows[i].d4_emotional,
      d5_actor_context: pgiRows[i].d5_actor_context,
      d6_cui_bono: pgiRows[i].d6_cui_bono,
    },
    gai_dimensions: gaiRows[i] ? {
      d1_coverage_breadth: gaiRows[i].d1_coverage_breadth,
      d2_prominence_disparity: gaiRows[i].d2_prominence_disparity,
      d3_population_exposure: gaiRows[i].d3_population_exposure,
      d4_significance_severity: gaiRows[i].d4_significance_severity,
    } : null,
    pair_pgi: Object.fromEntries(Object.entries(buildPgi(story).pair_pgi)),
    scoring_rationale: pgiRows[i].scoring_rationale,
  })),
}, null, 2));

console.log(JSON.stringify({ ok: true, scan_date, scan_period, stories: stories.length, pgiRows: pgiRows.length, gaiRows: gaiRows.length, pairRows: fullPairRows.length, outPath }, null, 2));
