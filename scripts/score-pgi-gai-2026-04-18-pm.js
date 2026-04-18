const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return Object.fromEntries(
    raw
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      })
  );
}

const env = loadEnv(path.join(__dirname, '..', '.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const scanDate = '2026-04-18';
const scanPeriod = 'pm';
const outPath = path.join(__dirname, '..', '..', 'memory', 'scans', '2026-04-18-pm-scores.json');

const REGION_ALIASES = {
  us: 'us',
  europe: 'eu',
  eu: 'eu',
  'middle-east': 'middle_east',
  'middle east': 'middle_east',
  africa: 'africa',
  'south-asia': 'south_asia',
  'south asia': 'south_asia',
  'east-se-asia': 'asia_pacific',
  'east & se asia': 'asia_pacific',
  'east and se asia': 'asia_pacific',
  pacific: 'asia_pacific',
  'latin-america': 'latam',
  'latin america': 'latam',
  caribbean: 'latam',
  'central-asia': 'south_asia',
  'central asia': 'south_asia',
  global: 'global',
};

const REGION_POP = {
  us: 380,
  eu: 750,
  middle_east: 680,
  africa: 1300,
  south_asia: 2000,
  asia_pacific: 2400,
  latam: 660,
};
const WORLD_POP = Object.values(REGION_POP).reduce((a, b) => a + b, 0);

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
function normRegion(r) {
  if (!r) return null;
  const key = String(r).trim().toLowerCase();
  return REGION_ALIASES[key] || key.replace(/[^a-z0-9]+/g, '_');
}
function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}
function r1(n) { return Math.round(n * 10) / 10; }
function avg(nums) { return nums.reduce((a,b)=>a+b,0)/nums.length; }
function significanceNum(sig) {
  const s = String(sig || '').toLowerCase();
  if (s.includes('critical')) return 5;
  if (s.includes('high')) return 4;
  if (s.includes('medium')) return 3;
  if (s.includes('low')) return 2;
  return 3;
}

const stories = [
  {
    headline: 'Israel and Lebanon begin ceasefire as diplomatic space opens for wider US-Iran talks',
    category: 'diplomacy',
    significance: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia'],
    regions_absent: ['africa', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: { d1_factual: 6.8, d2_causal: 7.9, d3_framing: 8.1, d4_emotional: 7.5, d5_actor_context: 8.0, d6_cui_bono: 7.7 },
    region_pairs: {
      'middle_east_us': 8.8,
      'middle_east_eu': 8.2,
      'middle_east_south_asia': 7.8,
      'us_eu': 7.0,
      'us_south_asia': 7.4,
      'eu_south_asia': 6.8,
    },
    rationale: 'The ceasefire itself is broadly accepted across covered regions, so the factual gap is moderate rather than extreme. The real split is over meaning: Western coverage leans toward de-escalation architecture, regional coverage foregrounds fragility, mistrust, and civilian cost already absorbed, and South Asian coverage is more likely to stress mediation durability. Actor portrayal and framing diverge sharply even with a shared core event.'
  },
  {
    headline: 'Iran says Strait of Hormuz is open for commercial traffic during ceasefire, but conditions remain',
    category: 'infrastructure',
    significance: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'east-se-asia'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: { d1_factual: 7.2, d2_causal: 8.7, d3_framing: 8.9, d4_emotional: 7.6, d5_actor_context: 8.8, d6_cui_bono: 9.0 },
    region_pairs: {
      'middle_east_us': 9.3,
      'middle_east_eu': 8.9,
      'middle_east_south_asia': 8.4,
      'middle_east_asia_pacific': 8.5,
      'us_eu': 7.3,
      'us_south_asia': 7.9,
      'us_asia_pacific': 8.0,
      'eu_south_asia': 7.5,
      'eu_asia_pacific': 7.2,
      'asia_pacific_south_asia': 7.0,
    },
    rationale: 'There is wide agreement that a reopening signal exists, but the conditionality drives a major interpretation gap. Western business coverage reads a risk-easing market event, Middle East coverage reads leverage and conditional sovereignty, and Asian coverage tends to focus on shipping continuity and import exposure. The strongest divergence is over causality and beneficiaries: is this a peace signal, a bargaining tool, or simply a temporary operational window?'
  },
  {
    headline: 'Oil drops sharply after Hormuz reopening signal and ceasefire optimism',
    category: 'energy',
    significance: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'east-se-asia'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia'],
    dimensions: { d1_factual: 4.2, d2_causal: 6.3, d3_framing: 6.7, d4_emotional: 4.8, d5_actor_context: 5.9, d6_cui_bono: 6.5 },
    region_pairs: {
      'middle_east_us': 7.4,
      'middle_east_eu': 7.0,
      'middle_east_asia_pacific': 6.8,
      'us_eu': 5.8,
      'us_asia_pacific': 6.1,
      'eu_asia_pacific': 5.6,
    },
    rationale: 'This is more consensus macro story than narrative-war story. Regions mostly agree that de-escalation signals crushed part of the oil war premium. The gap shows up in emphasis: Western outlets centre traders, inflation, and rate-cut implications; Middle East framing is more likely to tie the move back to political conditions and ceasefire reversibility; Asian coverage tends to stress import dependence and supply-chain relief.'
  },
  {
    headline: 'Hungary enters post-Orbán transition as incoming leadership links change to energy rerouting and Druzhba restart',
    category: 'governance',
    significance: 'high',
    regions_found: ['europe', 'us'],
    regions_absent: ['middle-east', 'africa', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean'],
    dimensions: { d1_factual: 5.6, d2_causal: 6.5, d3_framing: 7.0, d4_emotional: 5.9, d5_actor_context: 7.1, d6_cui_bono: 7.3 },
    region_pairs: {
      'eu_us': 6.9,
    },
    rationale: 'The base event is stable — Orbán-era politics has been interrupted — but the meaning differs. European coverage naturally treats the story as an EU energy-routing and bloc-alignment shift, while US framing compresses it into a democracy-and-Russia story. Because the issue touches sanctions, Ukraine, and oil routes, causal and actor-portrayal gaps rise above the factual layer.'
  },
  {
    headline: 'UN warns South Sudan is at risk of full-scale famine and collapse as fighting intensifies',
    category: 'food-agriculture',
    significance: 'critical',
    regions_found: ['africa', 'middle-east', 'global'],
    regions_absent: ['us', 'europe', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: { d1_factual: 2.9, d2_causal: 3.6, d3_framing: 4.1, d4_emotional: 5.0, d5_actor_context: 4.2, d6_cui_bono: 4.4 },
    region_pairs: {
      'africa_middle_east': 4.6,
      'africa_global': 4.1,
      'global_middle_east': 3.9,
    },
    rationale: 'This is primarily an omission and prioritisation story, not a major perception schism. Regions that cover it broadly agree on famine risk, conflict intensification, and humanitarian danger. African reporting carries more immediacy and systems context, while global and Middle East coverage compresses it into warning language. PGI stays low-to-moderate; the more striking signal is how many major regions barely show it at all.'
  },
  {
    headline: 'US Congress extends controversial FISA surveillance power for 10 days after longer deal fails',
    category: 'security',
    significance: 'medium',
    regions_found: ['us', 'middle-east', 'europe'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: { d1_factual: 4.4, d2_causal: 6.4, d3_framing: 7.0, d4_emotional: 5.8, d5_actor_context: 6.8, d6_cui_bono: 7.2 },
    region_pairs: {
      'middle_east_us': 8.0,
      'eu_us': 6.3,
      'eu_middle_east': 7.1,
    },
    rationale: 'Everyone agrees Congress bought only a short extension, but they do not agree on what that means. US framing often reads as institutional deadlock around security powers; European coverage is more likely to tilt toward civil-liberties and governance concerns; Middle East coverage is more inclined to treat it through the lens of enduring American security-state reach. That pushes framing and cui bono materially higher than factual divergence.'
  },
  {
    headline: 'Turkey’s school shootings trigger both mourning and a sweeping online crackdown',
    category: 'social',
    significance: 'medium',
    regions_found: ['europe', 'middle-east', 'us'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: { d1_factual: 5.0, d2_causal: 6.8, d3_framing: 7.6, d4_emotional: 7.3, d5_actor_context: 7.2, d6_cui_bono: 7.0 },
    region_pairs: {
      'eu_middle_east': 7.7,
      'eu_us': 6.8,
      'middle_east_us': 7.5,
    },
    rationale: 'The violence is undisputed, but the event quickly becomes a second-order story about speech control, legitimacy, and state narrative management. European coverage often frames the crackdown as a democratic-rights concern, Middle East coverage tends to give more room to stability and state-response logic, and US coverage reads it through familiar debates about violence plus platform control. Emotional and framing divergence are both high.'
  },
  {
    headline: 'Japan coins a new term for 40C-plus days after record heat, signalling climate adaptation shift',
    category: 'climate',
    significance: 'medium',
    regions_found: ['east-se-asia', 'europe'],
    regions_absent: ['us', 'africa', 'south-asia', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: { d1_factual: 2.4, d2_causal: 3.0, d3_framing: 3.8, d4_emotional: 2.8, d5_actor_context: 3.2, d6_cui_bono: 3.1 },
    region_pairs: {
      'asia_pacific_eu': 3.6,
    },
    rationale: 'This is a relatively aligned story where it appears. Both covered regions broadly treat the naming move as a marker of climate adaptation and social normalisation of extreme heat. The gap is modest because the core interpretation is shared; the bigger issue is that a meaningful climate-governance signal is still missing from much of the global attention map.'
  },
];

function buildGai(item) {
  const found = uniq(item.regions_found.map(normRegion)).filter((r) => r !== 'global');
  const absent = uniq(item.regions_absent.map(normRegion)).filter((r) => r !== 'global');
  const coverage = found.length;
  const missingPop = absent.reduce((sum, r) => sum + (REGION_POP[r] || 0), 0);
  const exposureShare = missingPop / WORLD_POP;
  const significance = significanceNum(item.significance);

  const d1 = r1(Math.max(1, Math.min(10, 9 - coverage)));
  const d2 = r1(Math.max(1, Math.min(10, 2 + absent.length * 0.6 + (coverage <= 2 ? 1.2 : coverage <= 4 ? 0.6 : 0))));
  const d3 = r1(Math.max(1, Math.min(10, 1 + exposureShare * 9)));
  const d4 = r1(Math.max(1, Math.min(10, 1 + ((significance - 1) / 4) * 5 + ((7 - coverage) / 6) * 3)));
  const story_gai = r1(avg([d1, d2, d3, d4]));

  return { found, absent, coverage, d1, d2, d3, d4, story_gai, missingPop, exposureShare };
}

(async () => {
  const insertedSummary = [];
  let pgiCount = 0;
  let pairCount = 0;
  let gaiCount = 0;

  for (const story of stories) {
    const story_slug = slugify(story.headline);
    const regionsCovered = uniq(story.regions_found.map(normRegion)).filter((r) => r && r !== 'global');
    const significance = significanceNum(story.significance);
    const dims = story.dimensions;
    const story_pgi = r1(avg(Object.values(dims)));

    const pgiRow = {
      story_slug,
      story_headline: story.headline,
      category: story.category,
      regions_covered: regionsCovered,
      region_count: regionsCovered.length,
      d1_factual: dims.d1_factual,
      d2_causal: dims.d2_causal,
      d3_framing: dims.d3_framing,
      d4_emotional: dims.d4_emotional,
      d5_actor_context: dims.d5_actor_context,
      d6_cui_bono: dims.d6_cui_bono,
      significance,
      scoring_rationale: story.rationale,
      scan_date: scanDate,
      scan_period: scanPeriod,
      is_latest: true,
    };

    const { data: inserted, error: pgiErr } = await supabase
      .from('pgi_story_scores')
      .upsert(pgiRow, { onConflict: 'story_slug,scan_date,scan_period', ignoreDuplicates: false })
      .select('id')
      .single();
    if (pgiErr) throw pgiErr;
    pgiCount++;

    await supabase.from('pgi_region_pairs').delete().eq('story_score_id', inserted.id);
    for (const [pairKey, pairPgi] of Object.entries(story.region_pairs)) {
      const protectedKey = pairKey
        .replaceAll('middle_east', 'middleEast')
        .replaceAll('south_asia', 'southAsia')
        .replaceAll('asia_pacific', 'asiaPacific');
      const parts = protectedKey
        .split('_')
        .map((p) => p.replaceAll('middleEast', 'middle_east').replaceAll('southAsia', 'south_asia').replaceAll('asiaPacific', 'asia_pacific'));
      if (parts.length !== 2) throw new Error(`Bad pair key: ${pairKey}`);
      const [region_a, region_b] = parts.sort();
      const { error: pairErr } = await supabase.from('pgi_region_pairs').upsert({
        story_score_id: inserted.id,
        region_a,
        region_b,
        pair_pgi: pairPgi,
        scan_date: scanDate,
      }, { onConflict: 'story_score_id,region_a,region_b', ignoreDuplicates: false });
      if (pairErr) throw pairErr;
      pairCount++;
    }

    const gai = buildGai(story);
    const gaiRow = {
      scan_date: scanDate,
      scan_period: scanPeriod,
      story_slug,
      story_headline: story.headline,
      category: story.category,
      regions_found: gai.found,
      regions_absent: gai.absent,
      coverage_breadth: gai.coverage,
      d1_coverage_breadth: gai.d1,
      d2_prominence_disparity: gai.d2,
      d3_population_exposure: gai.d3,
      d4_significance_severity: gai.d4,
      story_gai: gai.story_gai,
      significance,
      scoring_rationale: `Covered in ${gai.coverage} of 7 tracked regions; absent from ${gai.absent.length}. Missing-population share ≈ ${Math.round(gai.exposureShare * 100)}%. ${story.rationale}`,
      is_latest: true,
    };

    const { error: gaiErr } = await supabase
      .from('gai_story_scores')
      .upsert(gaiRow, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });
    if (gaiErr) throw gaiErr;
    gaiCount++;

    insertedSummary.push({
      story_slug,
      story_headline: story.headline,
      story_pgi,
      story_gai: gai.story_gai,
      regions_found: gai.found,
      regions_absent: gai.absent,
      dimensions: dims,
      gai_dimensions: {
        d1_coverage_breadth: gai.d1,
        d2_prominence_disparity: gai.d2,
        d3_population_exposure: gai.d3,
        d4_significance_severity: gai.d4,
      },
      region_pairs: story.region_pairs,
      rationale: story.rationale,
    });

    console.log(`${story.headline}\n  PGI ${story_pgi.toFixed(1)} | GAI ${gai.story_gai.toFixed(1)}`);
  }

  const topPgi = [...insertedSummary].sort((a, b) => b.story_pgi - a.story_pgi)[0];
  const topGai = [...insertedSummary].sort((a, b) => b.story_gai - a.story_gai)[0];

  const artifact = {
    ok: true,
    scan_date: scanDate,
    scan_period: scanPeriod,
    stories: stories.length,
    pgi_scores_upserted: pgiCount,
    pgi_region_pairs_upserted: pairCount,
    gai_scores_upserted: gaiCount,
    top_pgi: topPgi,
    top_gai: topGai,
    scored: insertedSummary,
  };

  fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2) + '\n');
  console.log(JSON.stringify({
    ok: true,
    outPath,
    scan_date: scanDate,
    scan_period: scanPeriod,
    stories: stories.length,
    pgi_scores_upserted: pgiCount,
    pgi_region_pairs_upserted: pairCount,
    gai_scores_upserted: gaiCount,
    top_pgi: { story: topPgi.story_headline, score: topPgi.story_pgi },
    top_gai: { story: topGai.story_headline, score: topGai.story_gai },
  }, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
