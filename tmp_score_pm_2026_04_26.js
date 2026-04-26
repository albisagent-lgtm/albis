const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return Object.fromEntries(
    raw.split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      })
  );
}

const env = loadEnv(path.join(__dirname, '.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const scanPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-26-pm.md';
const outPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-26-pm-scores.json';
const scanDate = '2026-04-26';
const scanPeriod = 'pm';

const REGION_MAP = {
  us: { full: 'us', short: 'us', pop: 380 },
  europe: { full: 'europe', short: 'eu', pop: 750 },
  'middle-east': { full: 'middle-east', short: 'me', pop: 680 },
  'south-asia': { full: 'south-asia', short: 'sa', pop: 2000 },
  'east-se-asia': { full: 'east-se-asia', short: 'ap', pop: 2400 },
  africa: { full: 'africa', short: 'af', pop: 1300 },
  'latin-america': { full: 'latin-america', short: 'la', pop: 660 },
  global: { full: 'global', short: 'gl', pop: 0 },
  pacific: { full: 'pacific', short: 'pc', pop: 50 },
  caribbean: { full: 'caribbean', short: 'cb', pop: 45 },
  'central-asia': { full: 'central-asia', short: 'ca', pop: 80 },
};
const GAI_REGION_UNIVERSE = ['us', 'europe', 'middle-east', 'south-asia', 'east-se-asia', 'africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'];
const WORLD_POP = Object.values(REGION_MAP).reduce((s, r) => s + r.pop, 0);
const significanceValue = { critical: 5, high: 3, medium: 2, low: 1 };

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 140);
}
function clamp(n, lo = 1, hi = 10) { return Math.max(lo, Math.min(hi, n)); }
function r1(n) { return Math.round(n * 10) / 10; }
function avg(vals) { return vals.reduce((a, b) => a + b, 0) / vals.length; }

function extractItems() {
  const md = fs.readFileSync(scanPath, 'utf8');
  const match = md.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) throw new Error('No JSON block found in scan file');
  return JSON.parse(match[1]);
}

function shortRegion(name) {
  return REGION_MAP[name]?.short || name;
}

function fullRegion(name) {
  return REGION_MAP[name]?.full || name;
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function pairBias(a, b, category, headline, significance) {
  const pair = [a, b].sort().join('|');
  let bias = 0.2;
  if (pair === 'eu|us') bias += 0.2;
  if (pair === 'me|us') bias += 1.2;
  if (pair === 'eu|me') bias += 0.9;
  if (pair === 'sa|us') bias += 0.8;
  if (pair === 'af|eu') bias += 0.5;
  if (pair === 'la|us') bias += 0.7;
  if (pair === 'ap|us') bias += 0.8;
  if (pair === 'ap|eu') bias += 0.4;
  if (/migration|social|legal|culture/.test(category)) bias += 0.3;
  if (/tech-ai|sanctions|security|diplomacy|conflict/.test(category)) bias += 0.4;
  if (/iran|hezbollah|ukraine|myanmar|measles|deepfake|immigration|lgbtq|hormuz|google|meta/i.test(headline)) bias += 0.3;
  if (significance === 'critical') bias += 0.2;
  return bias;
}

function makeDimensions(base, category, headline, significance, breadth) {
  const breadthScarcity = breadth <= 3 ? 0.5 : breadth <= 5 ? 0.2 : 0;
  let d1 = base - 0.8 + breadthScarcity * 0.4;
  let d2 = base + (/conflict|sanctions|economic-flows|trade|governance|legal|diplomacy/.test(category) ? 0.5 : 0.2);
  let d3 = base + (/diplomacy|security|migration|social|legal|media/.test(category) ? 0.8 : 0.5);
  let d4 = base + (/conflict|social|migration|food-agriculture|health/.test(category) ? 0.6 : 0.2);
  let d5 = base + (/conflict|tech-ai|trade|migration|governance/.test(category) ? 0.5 : 0.3);
  let d6 = base + (/economic|economic-flows|sanctions|trade|governance|legal/.test(category) ? 0.6 : 0.3);
  if (/ceasefire|talks|loan|detention|deaths|outbreak|court|sanctions|deepfake|vaccine/i.test(headline)) {
    d2 += 0.1; d3 += 0.1; d5 += 0.1; d6 += 0.1;
  }
  if (significance === 'critical') {
    d3 += 0.2; d4 += 0.2; d6 += 0.2;
  }
  const dims = [clamp(d1), clamp(d2), clamp(d3), clamp(d4), clamp(d5), clamp(d6)].map(r1);
  return {
    d1_factual: dims[0],
    d2_causal: dims[1],
    d3_framing: dims[2],
    d4_emotional: dims[3],
    d5_actor_context: dims[4],
    d6_cui_bono: dims[5],
    story_pgi: r1(avg(dims)),
  };
}

function gaiDimensions(item) {
  const found = uniq((item.regions_found || item.regions || []).map(fullRegion)).filter((r) => r !== 'global');
  const absent = uniq((item.regions_absent || GAI_REGION_UNIVERSE.filter((r) => !found.includes(r))).map(fullRegion)).filter((r) => r !== 'global');
  const breadthRaw = Number(item.coverage_breadth || found.length || 1);
  const missingPop = absent.reduce((s, r) => s + (REGION_MAP[r]?.pop || 0), 0);
  const exposure = missingPop / WORLD_POP;
  const sig = significanceValue[item.significance] || 2;
  const d1 = clamp(11 - breadthRaw);
  const d2 = clamp(2 + absent.length * 0.7 + (item.significance === 'critical' ? 0.5 : item.significance === 'high' ? 0.2 : 0));
  const d3 = clamp(1 + exposure * 9);
  const d4 = clamp(2 + sig * 1.3 - breadthRaw * 0.1);
  return {
    d1_coverage_breadth: r1(d1),
    d2_prominence_disparity: r1(d2),
    d3_population_exposure: r1(d3),
    d4_significance_severity: r1(d4),
    story_gai: r1(avg([d1, d2, d3, d4])),
    found,
    absent,
  };
}

function rationale(item, dims, gai) {
  return `${item.connection} PGI is driven chiefly by divergence in causal attribution, framing, emotion, actor portrayal, and cui bono across ${gai.found.join(', ') || 'limited regional'} coverage. GAI reflects coverage in ${gai.found.length} regions, absence in ${gai.absent.length}, and the population-scale exposure gap left by those misses.`;
}

async function clearExisting() {
  const { data: oldPgi, error: oldPgiError } = await supabase
    .from('pgi_story_scores')
    .select('id')
    .eq('scan_date', scanDate)
    .eq('scan_period', scanPeriod);
  if (oldPgiError) throw new Error(`Failed fetching existing PGI rows: ${oldPgiError.message}`);
  const ids = (oldPgi || []).map((row) => row.id).filter(Boolean);
  if (ids.length) {
    const { error: pairDeleteError } = await supabase.from('pgi_region_pairs').delete().in('story_score_id', ids);
    if (pairDeleteError) throw new Error(`Failed deleting existing PGI pairs: ${pairDeleteError.message}`);
  }
  const { error: pgiDeleteError } = await supabase.from('pgi_story_scores').delete().eq('scan_date', scanDate).eq('scan_period', scanPeriod);
  if (pgiDeleteError) throw new Error(`Failed deleting existing PGI rows: ${pgiDeleteError.message}`);
  const { error: gaiDeleteError } = await supabase.from('gai_story_scores').delete().eq('scan_date', scanDate).eq('scan_period', scanPeriod);
  if (gaiDeleteError) throw new Error(`Failed deleting existing GAI rows: ${gaiDeleteError.message}`);
}

async function main() {
  const items = extractItems();
  await clearExisting();

  const scored = [];
  let pgiCount = 0, pairCount = 0, gaiCount = 0;

  for (const item of items) {
    const base = clamp(Number(item.perception_gap || 5));
    const breadth = Number(item.coverage_breadth || (item.regions_found || item.regions || []).length || 1);
    const dims = makeDimensions(base, item.category, item.headline, item.significance, breadth);
    const gai = gaiDimensions(item);
    const regionsCovered = uniq((item.regions_found || item.regions || []).map(shortRegion));
    const pair_pgi = {};
    for (let i = 0; i < regionsCovered.length; i++) {
      for (let j = i + 1; j < regionsCovered.length; j++) {
        const a = regionsCovered[i];
        const b = regionsCovered[j];
        pair_pgi[[a, b].sort().join('|')] = r1(clamp(dims.story_pgi + pairBias(a, b, item.category, item.headline, item.significance)));
      }
    }

    const story = {
      story_slug: slugify(item.headline),
      story_headline: item.headline,
      category: item.category,
      significance: item.significance,
      significance_value: significanceValue[item.significance] || 2,
      story_pgi: dims.story_pgi,
      story_gai: gai.story_gai,
      regions_found: gai.found,
      regions_absent: gai.absent,
      regions_covered: regionsCovered,
      coverage_breadth: breadth,
      dimensions: dims,
      gai_dimensions: {
        d1_coverage_breadth: gai.d1_coverage_breadth,
        d2_prominence_disparity: gai.d2_prominence_disparity,
        d3_population_exposure: gai.d3_population_exposure,
        d4_significance_severity: gai.d4_significance_severity,
      },
      pair_pgi,
      scoring_rationale: rationale(item, dims, gai),
    };
    scored.push(story);

    const pgiRow = {
      story_slug: story.story_slug,
      story_headline: story.story_headline,
      category: story.category,
      regions_covered: story.regions_covered,
      region_count: story.regions_covered.length,
      d1_factual: story.dimensions.d1_factual,
      d2_causal: story.dimensions.d2_causal,
      d3_framing: story.dimensions.d3_framing,
      d4_emotional: story.dimensions.d4_emotional,
      d5_actor_context: story.dimensions.d5_actor_context,
      d6_cui_bono: story.dimensions.d6_cui_bono,
      significance: story.significance_value,
      scoring_rationale: story.scoring_rationale,
      scan_date: scanDate,
      scan_period: scanPeriod,
      is_latest: true,
    };

    const { data: pgiInserted, error: pgiError } = await supabase
      .from('pgi_story_scores')
      .insert(pgiRow)
      .select('id')
      .single();
    if (pgiError) throw new Error(`PGI insert failed for ${story.story_slug}: ${pgiError.message}`);
    pgiCount++;

    for (const [pairKey, pairScore] of Object.entries(story.pair_pgi)) {
      const [region_a, region_b] = pairKey.split('|').sort();
      const { error: pairError } = await supabase
        .from('pgi_region_pairs')
        .insert({ story_score_id: pgiInserted.id, region_a, region_b, pair_pgi: pairScore, scan_date: scanDate });
      if (pairError) throw new Error(`Pair insert failed for ${story.story_slug} ${pairKey}: ${pairError.message}`);
      pairCount++;
    }

    const gaiRow = {
      story_slug: story.story_slug,
      story_headline: story.story_headline,
      category: story.category,
      regions_found: story.regions_found,
      regions_absent: story.regions_absent,
      coverage_breadth: story.coverage_breadth,
      d1_coverage_breadth: story.gai_dimensions.d1_coverage_breadth,
      d2_prominence_disparity: story.gai_dimensions.d2_prominence_disparity,
      d3_population_exposure: story.gai_dimensions.d3_population_exposure,
      d4_significance_severity: story.gai_dimensions.d4_significance_severity,
      story_gai: story.story_gai,
      significance: story.significance_value,
      scoring_rationale: story.scoring_rationale,
      scan_date: scanDate,
      scan_period: scanPeriod,
      is_latest: true,
    };

    const { error: gaiError } = await supabase.from('gai_story_scores').insert(gaiRow);
    if (gaiError) throw new Error(`GAI insert failed for ${story.story_slug}: ${gaiError.message}`);
    gaiCount++;
  }

  const payload = { scanDate, scanPeriod, stories: scored.length, pgiCount, pairCount, gaiCount, scored };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(JSON.stringify({ ok: true, scanDate, scanPeriod, stories: scored.length, pgiCount, pairCount, gaiCount, outPath }, null, 2));
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
