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
const scanPeriod = 'am';

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
    headline: 'Israel and Lebanon ceasefire takes effect, creating space for wider diplomacy',
    category: 'diplomacy',
    significance: 'critical',
    regions_found: ['middle-east','europe','us','global'],
    regions_absent: ['africa','south-asia','east-se-asia','central-asia','latin-america','pacific','caribbean'],
    dimensions: { d1_factual: 7.5, d2_causal: 8.4, d3_framing: 8.6, d4_emotional: 7.8, d5_actor_context: 8.7, d6_cui_bono: 8.8 },
    region_pairs: {
      'middle_east_us': 9.2,
      'middle_east_eu': 8.6,
      'us_eu': 7.2,
    },
    rationale: 'Shared core fact of a ceasefire exists, but regional framing diverges sharply over who won breathing room, whether this is humanitarian respite or strategic regrouping, and whether the U.S. is peacemaker, self-interested broker, or partial actor. Middle East coverage tends to foreground lived civilian relief and deterrence balance; U.S./European coverage leans toward diplomatic architecture and wider Iran implications.'
  },
  {
    headline: 'Iran says Strait of Hormuz is open for commercial vessels during ceasefire window',
    category: 'infrastructure',
    significance: 'critical',
    regions_found: ['middle-east','us','europe','east-se-asia','global'],
    regions_absent: ['africa','south-asia','central-asia','latin-america','pacific','caribbean'],
    dimensions: { d1_factual: 8.2, d2_causal: 9.0, d3_framing: 9.3, d4_emotional: 8.0, d5_actor_context: 9.1, d6_cui_bono: 9.4 },
    region_pairs: {
      'middle_east_us': 9.5,
      'middle_east_eu': 9.0,
      'middle_east_asia_pacific': 8.8,
      'us_eu': 7.6,
      'us_asia_pacific': 8.1,
      'eu_asia_pacific': 7.4,
    },
    rationale: 'The same shipping reopening can be framed as de-escalation, conditional coercive leverage, or fragile market stabilisation. The strongest gap is over agency and legitimacy: Iran presents controlled reopening; Western frames stress risk and conditionality; Asia is more likely to stress energy flow continuity. Cui bono divergence is especially high because every region reads beneficiaries differently.'
  },
  {
    headline: 'U.S.-Iran talks narrow toward an interim memorandum instead of a comprehensive deal',
    category: 'diplomacy',
    significance: 'high',
    regions_found: ['middle-east','us','europe','south-asia','global'],
    regions_absent: ['africa','east-se-asia','central-asia','latin-america','pacific','caribbean'],
    dimensions: { d1_factual: 7.1, d2_causal: 8.2, d3_framing: 8.5, d4_emotional: 7.2, d5_actor_context: 8.3, d6_cui_bono: 8.6 },
    region_pairs: {
      'middle_east_us': 8.9,
      'middle_east_eu': 8.1,
      'us_eu': 7.0,
      'us_south_asia': 7.8,
      'middle_east_south_asia': 8.0,
      'eu_south_asia': 7.1,
    },
    rationale: 'The factual base is fairly stable — talks are narrowing — but attribution and intent diverge: prudent conflict prevention, diplomatic retreat, tactical pause, or sanctions choreography. Regions also differ over whether the interim format signals realism or weakness, making framing, actor portrayal, and cui bono scores meaningfully elevated.'
  },
  {
    headline: 'Hungary election removes a major EU obstacle to Ukraine support',
    category: 'governance',
    significance: 'high',
    regions_found: ['europe','global'],
    regions_absent: ['us','middle-east','africa','south-asia','east-se-asia','central-asia','latin-america','pacific','caribbean'],
    dimensions: { d1_factual: 5.5, d2_causal: 6.1, d3_framing: 6.6, d4_emotional: 5.9, d5_actor_context: 6.8, d6_cui_bono: 6.9 },
    region_pairs: {
      'eu_global': 6.2,
    },
    rationale: 'Within Europe this is a systems-governance story about veto power, bloc functionality, and Ukraine financing. Outside Europe, where it appears, it tends to be compressed into a simple Orbán setback. That means the gap is moderate rather than extreme: the factual spine holds, but institutional meaning and who benefits are framed differently.'
  },
  {
    headline: 'Donors pledge nearly $1.8 billion in humanitarian aid for Sudan without a ceasefire',
    category: 'food-agriculture',
    significance: 'high',
    regions_found: ['africa','europe','global'],
    regions_absent: ['us','middle-east','south-asia','east-se-asia','central-asia','latin-america','pacific','caribbean'],
    dimensions: { d1_factual: 4.6, d2_causal: 5.0, d3_framing: 5.4, d4_emotional: 4.9, d5_actor_context: 5.1, d6_cui_bono: 5.3 },
    region_pairs: {
      'africa_eu': 5.8,
      'africa_global': 5.0,
      'eu_global': 4.5,
    },
    rationale: 'Coverage mostly agrees on the aid pledge and lack of ceasefire. The main differences are emphasis: African framing is likelier to stress delivery failure and war-ground reality, while European/global framing leans donor mobilisation and conference outcomes. The story is more omitted than heavily reframed.'
  },
  {
    headline: 'Bangladesh scales up emergency measles vaccination campaign',
    category: 'health',
    significance: 'medium',
    regions_found: ['south-asia','global'],
    regions_absent: ['us','europe','middle-east','africa','east-se-asia','central-asia','latin-america','pacific','caribbean'],
    dimensions: { d1_factual: 3.9, d2_causal: 4.1, d3_framing: 4.4, d4_emotional: 3.8, d5_actor_context: 4.0, d6_cui_bono: 4.2 },
    region_pairs: {
      'south_asia_global': 4.2,
    },
    rationale: 'Where covered, the framing is relatively aligned: outbreak, disrupted immunisation, mass response. The gap is low-to-moderate because it is more of an attention problem than a narrative war. South Asian outlets naturally add denser local public-health context than global coverage.'
  },
  {
    headline: 'Taiwan hardens against China’s expanding cognitive warfare tactics',
    category: 'security',
    significance: 'high',
    regions_found: ['east-se-asia','us','europe','global'],
    regions_absent: ['middle-east','africa','south-asia','central-asia','latin-america','pacific','caribbean'],
    dimensions: { d1_factual: 6.4, d2_causal: 7.3, d3_framing: 7.9, d4_emotional: 6.8, d5_actor_context: 7.8, d6_cui_bono: 7.7 },
    region_pairs: {
      'asia_pacific_us': 8.0,
      'asia_pacific_eu': 7.4,
      'us_eu': 6.7,
    },
    rationale: 'The broad fact pattern is stable, but framing diverges over whether this is defensive resilience, information-war escalation, or a sign of larger cross-strait contest. Actor portrayal is especially split because China can be cast as aggressor, strategic competitor, or expected great-power actor depending on lens.'
  },
  {
    headline: 'DeepSeek seeks fresh funding at a $10 billion valuation',
    category: 'tech-ai',
    significance: 'medium',
    regions_found: ['east-se-asia','us','europe','global'],
    regions_absent: ['middle-east','africa','south-asia','central-asia','latin-america','pacific','caribbean'],
    dimensions: { d1_factual: 4.7, d2_causal: 5.1, d3_framing: 5.4, d4_emotional: 4.6, d5_actor_context: 5.2, d6_cui_bono: 5.6 },
    region_pairs: {
      'asia_pacific_us': 5.9,
      'asia_pacific_eu': 5.2,
      'us_eu': 4.8,
    },
    rationale: 'This is mostly a capital-allocation and tech-competition story rather than a full narrative fracture. Differences arise in whether DeepSeek is framed as innovation proof, geopolitical challenge, or speculative hype. Cui bono and actor portrayal rise somewhat because Chinese AI champions carry strategic meaning beyond simple fundraising.'
  },
  {
    headline: 'IMF, World Bank and IEA urge countries not to hoard energy or impose export controls',
    category: 'energy',
    significance: 'high',
    regions_found: ['global','us','europe','middle-east','east-se-asia'],
    regions_absent: ['africa','south-asia','central-asia','latin-america','pacific','caribbean'],
    dimensions: { d1_factual: 5.8, d2_causal: 6.1, d3_framing: 6.4, d4_emotional: 5.7, d5_actor_context: 6.2, d6_cui_bono: 6.7 },
    region_pairs: {
      'us_eu': 5.9,
      'us_middle_east': 6.8,
      'eu_middle_east': 6.5,
      'asia_pacific_us': 6.2,
      'asia_pacific_eu': 5.8,
      'asia_pacific_middle_east': 6.4,
    },
    rationale: 'Institutions speak in one voice, but regional meaning still splits: some frames treat hoarding as the real accelerator of crisis, others as a rational sovereign response. Producer, consumer, and trade-dependent regions assign responsibility differently, pushing up causal, framing, and cui bono dimensions.'
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

  return { found, absent, coverage, d1, d2, d3, d4, story_gai };
}

(async () => {
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
      scoring_rationale: `Covered in ${gai.coverage} of 7 tracked regions; absent from ${gai.absent.length}. Missing-population share ≈ ${Math.round((gai.absent.reduce((s, r) => s + (REGION_POP[r] || 0), 0) / WORLD_POP) * 100)}%. ${story.rationale}`,
      is_latest: true,
    };

    const { error: gaiErr } = await supabase
      .from('gai_story_scores')
      .upsert(gaiRow, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });
    if (gaiErr) throw gaiErr;
    gaiCount++;

    console.log(`${story.headline}\n  PGI ${story_pgi.toFixed(1)} | GAI ${gai.story_gai.toFixed(1)}`);
  }

  console.log(JSON.stringify({
    ok: true,
    scan_date: scanDate,
    scan_period: scanPeriod,
    stories: stories.length,
    pgi_scores_upserted: pgiCount,
    pgi_region_pairs_upserted: pairCount,
    gai_scores_upserted: gaiCount,
  }, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
