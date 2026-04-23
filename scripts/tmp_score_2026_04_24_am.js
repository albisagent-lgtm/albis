const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split(/\n/)
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SCAN_DATE = '2026-04-24';
const SCAN_PERIOD = 'am';
const scanPath = path.join(__dirname, '..', '..', 'memory', 'scans', '2026-04-24-am.md');
const outPath = path.join(__dirname, '..', '..', 'memory', 'scans', '2026-04-24-am-scores.json');

function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function clamp(n, min = 1, max = 10) {
  return Math.max(min, Math.min(max, n));
}

function roundInt(n) {
  return Math.round(n);
}

function significanceValue(sig) {
  return sig === 'critical' ? 5 : sig === 'high' ? 3 : sig === 'medium' ? 2 : 1;
}

function coreRegionCode(label) {
  const map = {
    us: 'us',
    europe: 'eu',
    global: 'gl',
    'middle-east': 'me',
    'south-asia': 'sa',
    'east-se-asia': 'ap',
    'latin-america': 'la',
    africa: 'af',
    pacific: 'pc',
    caribbean: 'cb',
    'central-asia': 'ca',
  };
  return map[label] || null;
}

const REGION_DISTANCE = {
  'eu|me': 0.7,
  'eu|us': 0.2,
  'gl|us': 0.3,
  'gl|eu': 0.2,
  'gl|me': 0.4,
  'me|us': 1.0,
  'ap|us': 0.7,
  'ap|me': 0.6,
  'ap|eu': 0.4,
  'ap|gl': 0.3,
  'af|eu': 0.3,
  'af|us': 0.5,
  'af|la': 0.2,
  'af|me': 0.4,
  'af|gl': 0.3,
  'la|eu': 0.2,
  'la|us': 0.4,
  'la|me': 0.6,
  'la|gl': 0.3,
  'sa|us': 0.5,
  'sa|eu': 0.4,
  'sa|me': 0.7,
  'sa|ap': 0.3,
  'sa|gl': 0.3,
  'ca|eu': 0.5,
  'ca|us': 0.6,
  'ca|me': 0.5,
  'ca|gl': 0.3,
  'cb|us': 0.2,
  'pc|ap': 0.2,
  'pc|us': 0.4,
  'cb|gl': 0.2,
  'pc|gl': 0.2,
};

const raw = fs.readFileSync(scanPath, 'utf8');
const jsonBlockMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
if (!jsonBlockMatch) throw new Error('Could not find JSON block in scan file');
const stories = JSON.parse(jsonBlockMatch[1]);

const scored = stories.map((story) => {
  const headline = story.headline.trim();
  const slug = slugify(headline);
  const sig = story.significance;
  const base = Number(story.perception_gap || 5);
  const text = `${headline} ${story.connection || ''} ${(story.tags || []).join(' ')} ${(story.patterns || []).join(' ')}`.toLowerCase();

  let d1 = base - 0.6;
  let d2 = base - 0.1;
  let d3 = base + 0.4;
  let d4 = base + (sig === 'critical' ? 0.3 : sig === 'high' ? 0.1 : 0);
  let d5 = base + 0.1;
  let d6 = base + 0.2;

  if (/ceasefire|mediat|extension|talks|diplomacy/.test(text)) {
    d2 += 0.4; d3 += 0.5; d5 += 0.4; d6 += 0.4;
  }
  if (/hormuz|shipping|oil|sanctions|pipeline|transit|blockade|maritime|tanker/.test(text)) {
    d1 += 0.2; d2 += 0.3; d3 += 0.3; d4 += 0.2; d5 += 0.2; d6 += 0.5;
  }
  if (/ukraine|russia|eu approves|loan package/.test(text)) {
    d1 += 0.1; d2 += 0.2; d3 += 0.2; d6 += 0.3;
  }
  if (/medicine|humanitarian|supply chains|sudan|health/.test(text)) {
    d3 += 0.4; d4 += 0.5; d5 += 0.3; d6 += 0.2;
  }
  if (/jobless claims|labour market|business activity|inflation|energy shock|euro zone/.test(text)) {
    d2 += 0.2; d3 += 0.2; d6 += 0.2;
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

  const foundCore = [...new Set((story.regions_found || []).map(coreRegionCode).filter(Boolean))];
  const pair_pgi = {};
  for (let i = 0; i < foundCore.length; i++) {
    for (let j = i + 1; j < foundCore.length; j++) {
      const pair = [foundCore[i], foundCore[j]].sort();
      const key = pair.join('|');
      pair_pgi[key] = round1(clamp(story_pgi + (REGION_DISTANCE[key] ?? 0.35)));
    }
  }

  const totalRegions = 10;
  const covered = (story.regions_found || []).length;
  const missing = (story.regions_absent || []).length || Math.max(0, totalRegions - covered);
  const d1g = round1(clamp(1 + (missing / totalRegions) * 9));
  let d2g = 4.2 + missing * 0.55;
  let d3g = 4.0 + missing * 0.5;
  let d4g = sig === 'critical' ? 9.3 : sig === 'high' ? 8.4 : sig === 'medium' ? 7.0 : 5.8;

  if (/hormuz|oil|shipping|sanctions|pipeline|medicine|supply chains/.test(text)) d4g += 0.4;
  if (/ceasefire|talks|mediation|extension/.test(text)) d2g += 0.2;
  if (/jobless claims/.test(text)) d2g -= 0.3;

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

  const existingIds = (existingPgiRows || []).map((r) => r.id);
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

  const idBySlug = new Map((insertedPgi || []).map((r) => [r.story_slug, r.id]));
  const pairRows = [];
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
