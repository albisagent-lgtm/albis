const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SCAN_PATH = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-26-midday.md';
const ENV_PATH = path.join(__dirname, '.env.local');
const SCAN_DATE = '2026-04-26';
const SCAN_PERIOD = 'midday';

const md = fs.readFileSync(SCAN_PATH, 'utf8');
const jsonMatch = md.match(/```json\n([\s\S]*?)\n```/);
if (!jsonMatch) throw new Error('Could not find JSON block in scan markdown');
const rawStories = JSON.parse(jsonMatch[1]);
const env = fs.readFileSync(ENV_PATH, 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
if (!url || !key) throw new Error('Missing Supabase env vars');
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const sigMap = { low: 2, medium: 3, high: 4, critical: 5 };
const regionMap = {
  us: 'us',
  europe: 'eu',
  'middle-east': 'middle_east',
  'south-asia': 'south_asia',
  'east-se-asia': 'east_se_asia',
  'latin-america': 'latin_americas',
  africa: 'africa',
  pacific: 'pacific',
  caribbean: 'caribbean',
  'central-asia': 'central_asia',
  global: 'global',
};
const influentialRegions = new Set(['us', 'eu', 'middle_east', 'east_se_asia', 'south_asia', 'latin_americas']);

const clamp = (n, min=1, max=10) => Math.max(min, Math.min(max, n));
const round2 = (n) => Math.round(n * 100) / 100;
const slugify = (s) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
const normRegions = (arr=[]) => arr.map(r => regionMap[r] || r.replace(/&/g,'').replace(/\s+/g,'_').replace(/-/g,'_').toLowerCase());

function pairBonus(a, b, story) {
  const set = new Set([a, b]);
  let bonus = 0;
  if (set.has('us') && set.has('middle_east')) bonus += 1.2;
  if (set.has('eu') && set.has('middle_east')) bonus += 0.8;
  if (set.has('us') && set.has('latin_americas')) bonus += 1.0;
  if (set.has('south_asia') && set.has('middle_east')) bonus += 0.7;
  if (set.has('us') && set.has('eu')) bonus += 0.4;
  if (story.patterns?.includes('divergence')) bonus += 0.5;
  if (story.patterns?.includes('framing')) bonus += 0.4;
  if (story.patterns?.includes('omission')) bonus += 0.3;
  if (story.category === 'conflict' || story.category === 'security') bonus += 0.4;
  return bonus;
}

function scorePGI(story) {
  const base = story.perception_gap || 5;
  const patterns = new Set(story.patterns || []);
  const cat = story.category;
  const sig = sigMap[story.significance] || 3;

  let d1 = base + (patterns.has('divergence') ? 1 : 0) + (patterns.has('consensus') ? -1 : 0) + ((cat === 'conflict' || cat === 'security') ? 0.5 : 0);
  let d2 = base + (patterns.has('divergence') ? 1.2 : 0) + ((cat === 'diplomacy' || cat === 'sanctions' || cat === 'legal') ? 0.8 : 0);
  let d3 = base + (patterns.has('framing') ? 1.6 : 0) + (patterns.has('omission') ? 0.7 : 0) + (patterns.has('consensus') ? -0.8 : 0);
  let d4 = base + ((cat === 'conflict' || cat === 'migration' || cat === 'security') ? 1 : 0) + (patterns.has('consensus') ? -1 : 0);
  let d5 = base + ((cat === 'governance' || cat === 'legal' || cat === 'tech-ai') ? 0.8 : 0) + (patterns.has('divergence') ? 0.6 : 0) + (patterns.has('consensus') ? -0.7 : 0);
  let d6 = base + ((cat === 'sanctions' || cat === 'security' || cat === 'economic-flows' || cat === 'tech-ai') ? 1 : 0) + (sig >= 4 ? 0.6 : 0) + (patterns.has('consensus') ? -0.8 : 0);

  const dims = [d1,d2,d3,d4,d5,d6].map(n => round2(clamp(n)));
  const story_pgi = round2(dims.reduce((a,b)=>a+b,0) / dims.length);
  return {
    d1_factual: dims[0],
    d2_causal: dims[1],
    d3_framing: dims[2],
    d4_emotional: dims[3],
    d5_actor_context: dims[4],
    d6_cui_bono: dims[5],
    story_pgi,
  };
}

function scoreGAI(story, found, absent) {
  const sig = sigMap[story.significance] || 3;
  const influentialMissing = absent.filter(r => influentialRegions.has(r)).length;
  const d1 = clamp(8 - found.length, 1, 10);
  const d2 = clamp(Math.round((absent.length / Math.max(found.length + absent.length, 1)) * 10) + (story.patterns?.includes('omission') ? 1 : 0), 1, 10);
  const d3 = clamp(2 + influentialMissing + (absent.includes('us') ? 1 : 0) + (absent.includes('eu') ? 1 : 0) + (absent.includes('east_se_asia') ? 1 : 0), 1, 10);
  const d4 = clamp(sig + (found.length <= 2 ? 3 : found.length <= 3 ? 2 : found.length <= 4 ? 1 : 0), 1, 10);
  const story_gai = round2((d1 + d2 + d3 + d4) / 4);
  return {
    d1_coverage_breadth: d1,
    d2_prominence_disparity: d2,
    d3_population_exposure: d3,
    d4_significance_severity: d4,
    story_gai,
  };
}

function rationale(story, pgi, gai, found, absent) {
  const f = found.join(', ');
  const m = absent.slice(0,5).join(', ');
  return `${story.connection} PGI ${pgi.story_pgi.toFixed(2)} reflects strongest divergence in framing/causal attribution across ${f || 'limited regions'}, while GAI ${gai.story_gai.toFixed(2)} reflects coverage present in ${found.length} region(s) and absent in ${absent.length} (${m || 'none'}).`;
}

(async()=>{
  const pgiStories = [];
  const pgiPairs = [];
  const gaiStories = [];

  for (const story of rawStories) {
    const story_slug = story.story_slug || slugify(story.headline);
    const regions_found = normRegions(story.regions_found || []);
    const regions_absent = normRegions(story.regions_absent || []);
    const regions_covered = regions_found.filter(r => r !== 'global');
    const significance = sigMap[story.significance] || 3;
    const pgi = scorePGI(story);
    const gai = scoreGAI(story, regions_found.filter(r => r !== 'global'), regions_absent);
    const scoring_rationale = rationale(story, pgi, gai, regions_found, regions_absent);

    pgiStories.push({
      story_slug,
      story_headline: story.headline,
      category: story.category,
      regions_covered,
      region_count: regions_covered.length,
      d1_factual: pgi.d1_factual,
      d2_causal: pgi.d2_causal,
      d3_framing: pgi.d3_framing,
      d4_emotional: pgi.d4_emotional,
      d5_actor_context: pgi.d5_actor_context,
      d6_cui_bono: pgi.d6_cui_bono,
      significance,
      scoring_rationale,
      scan_date: SCAN_DATE,
      scan_period: SCAN_PERIOD,
      is_latest: true,
    });

    const pairRegions = [...new Set(regions_covered)].sort();
    for (let i = 0; i < pairRegions.length; i++) {
      for (let j = i + 1; j < pairRegions.length; j++) {
        const region_a = pairRegions[i];
        const region_b = pairRegions[j];
        const pair_pgi = round2(clamp(pgi.story_pgi + pairBonus(region_a, region_b, story), 1, 10));
        pgiPairs.push({ story_slug, region_a, region_b, pair_pgi, scan_date: SCAN_DATE });
      }
    }

    gaiStories.push({
      scan_date: SCAN_DATE,
      scan_period: SCAN_PERIOD,
      story_slug,
      story_headline: story.headline,
      category: story.category,
      regions_found,
      regions_absent,
      coverage_breadth: regions_found.filter(r => r !== 'global').length,
      d1_coverage_breadth: gai.d1_coverage_breadth,
      d2_prominence_disparity: gai.d2_prominence_disparity,
      d3_population_exposure: gai.d3_population_exposure,
      d4_significance_severity: gai.d4_significance_severity,
      story_gai: gai.story_gai,
      significance,
      scoring_rationale,
      is_latest: true,
    });
  }

  const { data: inserted, error: pgiErr } = await supabase
    .from('pgi_story_scores')
    .upsert(pgiStories, { onConflict: 'story_slug,scan_date,scan_period', ignoreDuplicates: false })
    .select('id,story_slug');
  if (pgiErr) throw pgiErr;

  const idBySlug = Object.fromEntries((inserted || []).map(r => [r.story_slug, r.id]));
  const pairRows = pgiPairs
    .filter(p => idBySlug[p.story_slug])
    .map(p => ({ story_score_id: idBySlug[p.story_slug], region_a: p.region_a, region_b: p.region_b, pair_pgi: p.pair_pgi, scan_date: p.scan_date }));

  const { error: pairErr } = await supabase
    .from('pgi_region_pairs')
    .upsert(pairRows, { onConflict: 'story_score_id,region_a,region_b', ignoreDuplicates: false });
  if (pairErr) throw pairErr;

  const { error: gaiErr } = await supabase
    .from('gai_story_scores')
    .upsert(gaiStories, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });
  if (gaiErr) throw gaiErr;

  const out = { ok: true, stories: rawStories.length, pgiStories: pgiStories.length, pgiPairs: pairRows.length, gaiStories: gaiStories.length, sample: { pgi: pgiStories.slice(0,2), gai: gaiStories.slice(0,2) } };
  fs.writeFileSync(path.join(__dirname, 'tmp_score_midday_2026_04_26_output.json'), JSON.stringify({ pgiStories, pairRows, gaiStories }, null, 2));
  console.log(JSON.stringify(out, null, 2));
})();
