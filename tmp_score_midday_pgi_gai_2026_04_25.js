const fs = require('fs');
const path = require('path');
const { createClient } = require('./node_modules/@supabase/supabase-js');

const env = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const scanPath = path.join(__dirname, '../memory/scans/2026-04-25-midday.md');
const scanText = fs.readFileSync(scanPath, 'utf8');
const match = scanText.match(/```json\s*([\s\S]*?)\s*```/);
if (!match) throw new Error('Could not find JSON block in scan file');
const stories = JSON.parse(match[1]);

const scan_date = '2026-04-25';
const scan_period = 'midday';

const REGION_MAP = {
  'US': 'us',
  'us': 'us',
  'Europe': 'eu',
  'europe': 'eu',
  'EU': 'eu',
  'Middle East': 'middle_east',
  'middle-east': 'middle_east',
  'middle_east': 'middle_east',
  'South Asia': 'south_asia',
  'south-asia': 'south_asia',
  'south_asia': 'south_asia',
  'East & SE Asia': 'east_se_asia',
  'East and SE Asia': 'east_se_asia',
  'east-se-asia': 'east_se_asia',
  'east_se_asia': 'east_se_asia',
  'Latin America': 'latin_americas',
  'latin-america': 'latin_americas',
  'latin_americas': 'latin_americas',
  'Africa': 'africa',
  'africa': 'africa',
  'Pacific': 'pacific',
  'pacific': 'pacific',
  'Caribbean': 'caribbean',
  'caribbean': 'caribbean',
  'Central Asia': 'central_asia',
  'central-asia': 'central_asia',
  'central_asia': 'central_asia',
  'Global': 'global',
  'global': 'global'
};

const ALL_GAI_REGIONS = ['us', 'eu', 'middle_east', 'east_se_asia', 'south_asia', 'africa', 'latin_americas', 'pacific', 'caribbean'];
const SIGNIFICANCE = { critical: 5, high: 4, medium: 3, low: 2 };
const REGION_LABEL = {
  us: 'US',
  eu: 'Europe',
  middle_east: 'Middle East',
  east_se_asia: 'East & SE Asia',
  south_asia: 'South Asia',
  africa: 'Africa',
  latin_americas: 'Latin America',
  pacific: 'Pacific',
  caribbean: 'Caribbean',
  central_asia: 'Central Asia',
  global: 'Global'
};
const REGION_ORDER = ['Global', 'US', 'Europe', 'Middle East', 'South Asia', 'East & SE Asia', 'Africa', 'Latin America', 'Pacific', 'Caribbean', 'Central Asia'];
const PAIR_ORIENTATION = {
  'Europe|US': ['Europe', 'US'],
  'Europe|Middle East': ['Europe', 'Middle East'],
  'Europe|South Asia': ['Europe', 'South Asia'],
  'Europe|Global': ['Europe', 'Global'],
  'Middle East|US': ['Middle East', 'US'],
  'Middle East|South Asia': ['Middle East', 'South Asia'],
  'Global|US': ['Global', 'US'],
  'Global|Middle East': ['Global', 'Middle East'],
  'Global|South Asia': ['Global', 'South Asia'],
  'East & SE Asia|Middle East': ['East & SE Asia', 'Middle East'],
  'East & SE Asia|US': ['East & SE Asia', 'US'],
  'East & SE Asia|Europe': ['Europe', 'East & SE Asia'],
  'East & SE Asia|Global': ['East & SE Asia', 'Global'],
  'South Asia|US': ['South Asia', 'US'],
  'Africa|Global': ['Africa', 'Global'],
  'Africa|Europe': ['Africa', 'Europe'],
  'Africa|US': ['Africa', 'US'],
  'Latin America|US': ['Latin America', 'US'],
  'Latin America|Europe': ['Latin America', 'Europe'],
  'Pacific|Global': ['Pacific', 'Global'],
  'Pacific|US': ['Pacific', 'US'],
  'Pacific|Europe': ['Pacific', 'Europe'],
  'Central Asia|Europe': ['Central Asia', 'Europe'],
  'Central Asia|US': ['Central Asia', 'US']
};
const ALLOWED_PAIRS = new Set([
  'Africa|Global','Africa|Latin America','Africa|Middle East','Africa|South Asia',
  'East & SE Asia|Europe','East & SE Asia|Global','East & SE Asia|Latin America','East & SE Asia|Middle East','East & SE Asia|Pacific','East & SE Asia|South Asia','East & SE Asia|US',
  'Europe|Global','Europe|Latin America','Europe|Middle East','Europe|South Asia','Europe|US',
  'Global|Latin America','Global|Middle East','Global|Pacific','Global|South Asia','Global|US',
  'Latin America|Middle East','Latin America|Pacific','Latin America|South Asia','Latin America|US',
  'Middle East|South Asia','Middle East|US','Pacific|South Asia','South Asia|US'
]);
function orientPair(a, b) {
  const key = [a, b].sort().join('|');
  const oriented = PAIR_ORIENTATION[key] || [a, b].sort((x, y) => REGION_ORDER.indexOf(x) - REGION_ORDER.indexOf(y));
  return ALLOWED_PAIRS.has(`${oriented[0]}|${oriented[1]}`) ? oriented : null;
}

function clamp(n, lo = 1, hi = 10) { return Math.max(lo, Math.min(hi, n)); }
function round2(n) { return Math.round(n * 100) / 100; }
function slugify(s) {
  return s.toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
function uniq(arr) { return [...new Set(arr)]; }
function normRegion(r) { return REGION_MAP[r] || REGION_MAP[String(r).trim()] || String(r).trim().toLowerCase().replace(/[\s&]+/g, '_').replace(/-+/g, '_'); }

function inferPgi(story) {
  const patterns = (story.patterns || []).map(String);
  const pairRegions = uniq((story.regions_found || story.regions || []).map(normRegion).map(r => REGION_LABEL[r] || r).filter(Boolean));
  const regions = uniq((story.regions_found || story.regions || []).map(normRegion).filter(r => r !== 'global'));
  const base = typeof story.perception_gap === 'number' ? story.perception_gap : 5;
  const sig = SIGNIFICANCE[String(story.significance).toLowerCase()] || 3;
  const cat = Array.isArray(story.category) ? story.category.join(' ') : String(story.category || '');

  const has = (x) => patterns.includes(x);
  const conflictish = /conflict|security|geopolitics|migration|sanctions|media|legal|diplomacy/i.test(cat);
  const governanceish = /governance|legal|diplomacy|geopolitics|tech-ai|economic-flows|infrastructure|energy/i.test(cat);

  const d1 = clamp(base + (has('consensus') ? -1 : 0) + (has('divergence') ? 1 : 0) + (has('framing') ? 1 : 0) + (regions.length <= 2 ? 1 : 0) - (regions.length >= 4 ? 1 : 0));
  const d2 = clamp(base + (has('divergence') ? 1 : 0) + (has('power-vacuum') ? 2 : 0) + (has('escalation') ? 1 : 0) + (sig >= 4 ? 1 : 0));
  const d3 = clamp(base + (has('framing') ? 2 : 0) + (has('divergence') ? 1 : 0) + (has('consensus') ? -1 : 0));
  const d4 = clamp(base + (conflictish ? 1 : 0) + (has('fear-amplification') ? 2 : 0) + (has('de-escalation') ? -1 : 0));
  const d5 = clamp(base + (governanceish ? 1 : 0) + (has('naming-trap') ? 1 : 0) + (has('information-asymmetry') ? 1 : 0) + (has('consensus') ? -1 : 0));
  const d6 = clamp(base + (has('omission') ? 2 : 0) + (has('power-vacuum') ? 2 : 0) + (has('information-asymmetry') ? 1 : 0) + (has('sovereignty-theatre') ? 1 : 0) + (has('naming-trap') ? 1 : 0));
  const story_pgi = round2((d1 + d2 + d3 + d4 + d5 + d6) / 6);

  const pairAdjust = {
    'us|eu': 0,
    'us|middle_east': 2,
    'eu|middle_east': 1,
    'us|east_se_asia': 1,
    'eu|east_se_asia': 1,
    'us|south_asia': 1,
    'eu|south_asia': 1,
    'east_se_asia|middle_east': 1,
    'africa|eu': 1,
    'africa|us': 1,
    'latin_americas|us': 1,
    'latin_americas|eu': 1,
    'central_asia|eu': 1,
    'central_asia|us': 1,
    'pacific|us': 1,
    'pacific|eu': 1,
    'caribbean|us': 1
  };

  const regionPairs = [];
  const sortedPairRegions = [...pairRegions].sort((a, b) => REGION_ORDER.indexOf(a) - REGION_ORDER.indexOf(b));
  for (let i = 0; i < sortedPairRegions.length; i++) {
    for (let j = i + 1; j < sortedPairRegions.length; j++) {
      const rawA = sortedPairRegions[i];
      const rawB = sortedPairRegions[j];
      const oriented = orientPair(rawA, rawB);
      if (!oriented) continue;
      const [aLabel, bLabel] = oriented;
      const a = normRegion(aLabel);
      const b = normRegion(bLabel);
      const key = [a, b].sort().join('|');
      const adj = pairAdjust[key] ?? 0.5;
      regionPairs.push({ region_a: aLabel, region_b: bLabel, pair_pgi: round2(story_pgi + adj) });
    }
  }

  const rationale = [
    `PGI scored from six dimensions across ${Math.max(regions.length, 1)} materially involved regions.`,
    `Base gap started at ${base}/10 from scan-level framing signal, then adjusted for patterns: ${(patterns.length ? patterns.join(', ') : 'none')}.`,
    `Highest divergence sits in causal/framing/cui-bono layers where this story changes meaning depending on who is narrating risk, legitimacy, or strategic benefit.`
  ].join(' ');

  return { regions, d1, d2, d3, d4, d5, d6, story_pgi, rationale, regionPairs };
}

function inferGai(story) {
  const found = uniq((story.regions_found || story.regions || []).map(normRegion).filter(r => ALL_GAI_REGIONS.includes(r)));
  const absent = story.regions_absent
    ? uniq(story.regions_absent.map(normRegion).filter(r => ALL_GAI_REGIONS.includes(r)))
    : ALL_GAI_REGIONS.filter(r => !found.includes(r));
  const breadth = typeof story.coverage_breadth === 'number' ? story.coverage_breadth : clamp(found.length, 1, 9);
  const sig = SIGNIFICANCE[String(story.significance).toLowerCase()] || 3;
  const patterns = (story.patterns || []).map(String);
  const cat = Array.isArray(story.category) ? story.category.join(' ') : String(story.category || '');
  const highImpact = /conflict|security|migration|health|climate|food|energy|infrastructure|geopolitics|tech-ai/i.test(cat);

  const d1 = clamp(11 - breadth);
  const d2 = clamp(4 + (patterns.includes('omission') ? 2 : 0) + (patterns.includes('divergence') ? 1 : 0) + (found.length <= 2 ? 1 : 0));
  const d3 = clamp(4 + (absent.includes('us') ? 1 : 0) + (absent.includes('eu') ? 1 : 0) + (absent.includes('south_asia') ? 1 : 0) + (absent.includes('africa') ? 1 : 0) + (found.length <= 2 ? 1 : 0));
  const d4 = clamp(sig + (highImpact ? 2 : 1));
  const story_gai = Math.round((d1 + d2 + d3 + d4) / 4);

  const rationale = [
    `GAI reflects visibility rather than disagreement.`,
    `Covered in ${found.length} tracked regions (${found.join(', ') || 'none'}) and absent in ${absent.length} (${absent.join(', ') || 'none'}).`,
    `Higher score comes from the gap between significance (${String(story.significance).toLowerCase()}) and uneven geographic pickup.`
  ].join(' ');

  return { found, absent, breadth, d1, d2, d3, d4, story_gai, rationale };
}

(async () => {
  const step = (name) => console.error(`STEP: ${name}`);
  const pgiRows = [];
  const gaiRows = [];
  const pairRows = [];

  for (const story of stories) {
    const headline = story.headline;
    const story_slug = slugify(headline);
    const category = Array.isArray(story.category) ? story.category[0] : story.category;
    const significance = SIGNIFICANCE[String(story.significance).toLowerCase()] || 3;

    const pgi = inferPgi(story);
    const gai = inferGai(story);

    pgiRows.push({
      scan_date,
      scan_period,
      story_slug,
      story_headline: headline,
      category,
      regions_covered: pgi.regions,
      region_count: pgi.regions.length,
      d1_factual: pgi.d1,
      d2_causal: pgi.d2,
      d3_framing: pgi.d3,
      d4_emotional: pgi.d4,
      d5_actor_context: pgi.d5,
      d6_cui_bono: pgi.d6,
      significance,
      scoring_rationale: pgi.rationale,
      is_latest: true
    });

    gaiRows.push({
      scan_date,
      scan_period,
      story_slug,
      story_headline: headline,
      category,
      regions_found: gai.found,
      regions_absent: gai.absent,
      coverage_breadth: gai.breadth,
      d1_coverage_breadth: gai.d1,
      d2_prominence_disparity: gai.d2,
      d3_population_exposure: gai.d3,
      d4_significance_severity: gai.d4,
      significance,
      scoring_rationale: gai.rationale,
      is_latest: true
    });

    pairRows.push({ story_slug, pairs: pgi.regionPairs });
  }

  step('mark old rows not latest');
  await supabase.from('pgi_story_scores').update({ is_latest: false }).eq('scan_date', scan_date).eq('scan_period', scan_period);
  await supabase.from('gai_story_scores').update({ is_latest: false }).eq('scan_date', scan_date).eq('scan_period', scan_period);

  step('delete existing rows for same date/period');
  const { error: delPgiErr } = await supabase.from('pgi_story_scores').delete().eq('scan_date', scan_date).eq('scan_period', scan_period);
  if (delPgiErr) throw delPgiErr;
  const { error: delGaiErr } = await supabase.from('gai_story_scores').delete().eq('scan_date', scan_date).eq('scan_period', scan_period);
  if (delGaiErr) throw delGaiErr;

  step('insert pgi rows');
  const { data: insertedPgi, error: pgiErr } = await supabase.from('pgi_story_scores').insert(pgiRows).select('id,story_slug');
  if (pgiErr) throw pgiErr;
  step('insert gai rows');
  const { error: gaiErr } = await supabase.from('gai_story_scores').insert(gaiRows);
  if (gaiErr) throw gaiErr;

  const pgiIdBySlug = Object.fromEntries((insertedPgi || []).map(r => [r.story_slug, r.id]));
  const finalPairRows = [];
  for (const row of pairRows) {
    const story_score_id = pgiIdBySlug[row.story_slug];
    if (!story_score_id) continue;
    for (const pair of row.pairs) {
      finalPairRows.push({ ...pair, story_score_id, scan_date });
    }
  }

  const storyIds = Object.values(pgiIdBySlug);
  step('replace pgi region pairs');
  if (storyIds.length) {
    await supabase.from('pgi_region_pairs').delete().in('story_score_id', storyIds);
  }
  if (finalPairRows.length) {
    const { error: pairErr } = await supabase.from('pgi_region_pairs').insert(finalPairRows);
    if (pairErr) throw pairErr;
  }

  console.log(JSON.stringify({
    ok: true,
    scan_date,
    scan_period,
    stories: stories.length,
    pgi_rows: pgiRows.length,
    gai_rows: gaiRows.length,
    pair_rows: finalPairRows.length,
    sample: {
      pgi: pgiRows[0],
      gai: gaiRows[0]
    }
  }, null, 2));
})().catch((error) => {
  console.error('FATAL', JSON.stringify(error, null, 2));
  process.exit(1);
});
