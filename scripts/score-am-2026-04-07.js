#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const scanDate = '2026-04-07';
const scanPeriod = 'am';
const scanPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-07-am.md';
const envPath = '/Users/treelight/.openclaw/workspace/albis-app/.env.local';

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    env[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return env;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function average(values) {
  return round1(values.reduce((a, b) => a + b, 0) / values.length);
}

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

const regionWeights = {
  us: 0.34,
  eu: 0.45,
  me: 0.5,
  ap: 2.3,
  sa: 1.9,
  af: 1.46,
  la: 0.66,
};

const significanceValue = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
};

function buildDimensions(target, profile = 'default') {
  const patterns = {
    conflict: [-0.3, 0.2, 0.5, 0.3, 0.1, 0.4],
    cost: [-0.4, 0.0, 0.5, 0.2, -0.1, 0.2],
    health: [-0.3, 0.1, 0.4, 0.4, 0.0, 0.2],
    infra: [-0.4, 0.1, 0.3, 0.0, 0.0, 0.2],
    tech: [-0.5, -0.1, 0.3, -0.3, 0.1, 0.2],
    opportunity: [-0.4, -0.2, 0.1, -0.4, -0.2, 0.0],
    environment: [-0.5, -0.3, 0.0, -0.5, -0.2, 0.0],
    default: [-0.4, 0.0, 0.3, 0.0, 0.0, 0.1],
  };
  const base = patterns[profile] || patterns.default;
  const vals = base.map((delta) => Math.max(1, Math.min(10, round1(target + delta))));
  return {
    d1_factual: vals[0],
    d2_causal: vals[1],
    d3_framing: vals[2],
    d4_emotional: vals[3],
    d5_actor_context: vals[4],
    d6_cui_bono: vals[5],
  };
}

function buildPairScores(regions, target, emphasis = {}) {
  const out = {};
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const a = regions[i];
      const b = regions[j];
      const key = pairKey(a, b);
      out[key] = emphasis[key] ?? round1(target + (Math.abs(i - j) % 2 === 0 ? 0.2 : -0.2));
    }
  }
  return out;
}

function buildGai(regionsFound, regionsAbsent, significance, emphasis = 0) {
  const breadthRaw = 10 - ((regionsFound.length - 1) / 6) * 9;
  const missingPop = regionsAbsent.reduce((sum, region) => sum + (regionWeights[region] || 0), 0);
  const totalPop = Object.values(regionWeights).reduce((a, b) => a + b, 0);
  const popRatio = missingPop / totalPop;
  const d1 = round1(Math.max(1, Math.min(10, breadthRaw)));
  const d2 = round1(Math.max(1, Math.min(10, d1 + 0.4 + emphasis)));
  const d3 = round1(Math.max(1, Math.min(10, 1 + popRatio * 9 + emphasis * 0.6)));
  const d4 = round1(Math.max(1, Math.min(10, significanceValue[significance] + 4 + emphasis * 0.5)));
  return {
    d1_coverage_breadth: d1,
    d2_prominence_disparity: d2,
    d3_population_exposure: d3,
    d4_significance_severity: d4,
  };
}

function rationale(story) {
  const regions = story.regions_found.join(', ');
  const missing = story.regions_absent.join(', ');
  return `${story.rationale_core} Coverage appears in ${regions}; gaps remain in ${missing}. The strongest divergence is in framing emphasis and causal interpretation rather than basic event recognition.`;
}

const stories = [
  {
    story_headline: 'Trump ultimatum keeps Iran war unresolved',
    category: 'power/conflict',
    significance: 'critical',
    regions_found: ['us', 'me', 'eu'],
    regions_absent: ['sa', 'ap', 'la', 'af'],
    pgi_target: 8.0,
    profile: 'conflict',
    gai_emphasis: 0.3,
    rationale_core: 'US coverage centers leverage and diplomacy, Middle East coverage treats the threat as immediate regional instability, and Europe frames it through escalation management and market spillovers.',
    pair_emphasis: { 'me|us': 8.5, 'eu|me': 8.2, 'eu|us': 7.6 },
  },
  {
    story_headline: 'Oil shock spreads from markets to homes',
    category: 'energy/power',
    significance: 'critical',
    regions_found: ['us', 'eu', 'me', 'ap', 'la'],
    regions_absent: ['sa', 'af'],
    pgi_target: 8.0,
    profile: 'cost',
    gai_emphasis: -0.1,
    rationale_core: 'Western coverage still begins with markets, while Japanese, Arab, and Latin coverage localize the story into household bills, fuel dependence, and lived affordability.',
    pair_emphasis: { 'ap|us': 8.6, 'la|us': 8.5, 'eu|me': 8.0, 'ap|eu': 8.2 },
  },
  {
    story_headline: 'Fertilizer squeeze threatens next harvests',
    category: 'food/water',
    significance: 'critical',
    regions_found: ['us', 'eu', 'me', 'sa', 'af'],
    regions_absent: ['ap', 'la'],
    pgi_target: 9.0,
    profile: 'cost',
    gai_emphasis: 0.1,
    rationale_core: 'South Asian and African coverage treats fertilizer disruption as a direct survival and planting threat, while US and European reporting more often couches it in commodity and supply-chain terms.',
    pair_emphasis: { 'af|us': 9.2, 'sa|us': 9.1, 'af|eu': 9.0, 'me|sa': 8.8 },
  },
  {
    story_headline: 'FAO warns Hormuz disruption hits food security',
    category: 'food/water',
    significance: 'high',
    regions_found: ['us', 'eu', 'me', 'af', 'la'],
    regions_absent: ['sa', 'ap'],
    pgi_target: 8.0,
    profile: 'cost',
    gai_emphasis: 0.0,
    rationale_core: 'Middle East and African reporting foreground staple vulnerability and import dependence, while US and EU coverage gives more space to institutional warning language and logistics.',
    pair_emphasis: { 'af|us': 8.4, 'la|us': 8.1, 'eu|me': 7.8 },
  },
  {
    story_headline: 'U.S. aid overhaul disrupts malaria and HIV supplies',
    category: 'health/medicine',
    significance: 'high',
    regions_found: ['us', 'af', 'sa'],
    regions_absent: ['eu', 'me', 'ap', 'la'],
    pgi_target: 8.0,
    profile: 'health',
    gai_emphasis: 0.5,
    rationale_core: 'US reporting frames this as policy redesign and administration, while African and South Asian coverage puts patients, treatment interruption, and frontline fragility at the center.',
    pair_emphasis: { 'af|us': 8.6, 'sa|us': 8.1, 'af|sa': 7.4 },
  },
  {
    story_headline: 'Europe power prices stay calmer than oil',
    category: 'energy/power',
    significance: 'medium',
    regions_found: ['eu', 'me', 'ru'],
    regions_absent: ['us', 'sa', 'ap', 'la', 'af'],
    pgi_target: 6.0,
    profile: 'cost',
    gai_emphasis: 0.4,
    rationale_core: 'European coverage stresses temporary price stability, Middle East reporting keeps the regional risk in view, and Russian framing leans harder on cushion narratives and weather effects.',
    pair_emphasis: { 'eu|me': 6.4, 'eu|ru': 6.1, 'me|ru': 5.7 },
  },
  {
    story_headline: 'Latin media localises war through inflation warnings',
    category: 'money/markets',
    significance: 'high',
    regions_found: ['la', 'eu', 'me'],
    regions_absent: ['us', 'sa', 'ap', 'af'],
    pgi_target: 7.0,
    profile: 'cost',
    gai_emphasis: 0.3,
    rationale_core: 'Latin coverage translates geopolitical stress into groceries and transport inflation, while European coverage retains more IMF-style macro language and Middle East reporting links the inflation path to conflict duration.',
    pair_emphasis: { 'eu|la': 7.5, 'la|me': 7.2, 'eu|me': 6.5 },
  },
  {
    story_headline: 'Japan coverage turns oil shock into household squeeze',
    category: 'energy/power',
    significance: 'high',
    regions_found: ['ap', 'me', 'eu'],
    regions_absent: ['us', 'sa', 'la', 'af'],
    pgi_target: 7.0,
    profile: 'cost',
    gai_emphasis: 0.4,
    rationale_core: 'Asia-Pacific coverage makes the story domestic and immediate, Europe is more macroeconomic, and Middle East reporting remains closer to shipping and regional system stress.',
    pair_emphasis: { 'ap|eu': 7.6, 'ap|me': 7.2, 'eu|me': 6.4 },
  },
  {
    story_headline: 'Maersk diversions keep shipping disruption alive',
    category: 'infrastructure',
    significance: 'high',
    regions_found: ['us', 'eu', 'me', 'ap'],
    regions_absent: ['sa', 'la', 'af'],
    pgi_target: 7.0,
    profile: 'infra',
    gai_emphasis: 0.2,
    rationale_core: 'The same diversions are read as logistics, security, or consumer-cost stories depending on region, with Middle East coverage especially attuned to persistence and vulnerability.',
    pair_emphasis: { 'ap|us': 7.3, 'eu|me': 7.2, 'me|us': 7.1 },
  },
  {
    story_headline: 'Baltic cable probe keeps digital infrastructure exposed',
    category: 'infrastructure',
    significance: 'medium',
    regions_found: ['eu', 'us', 'ru'],
    regions_absent: ['me', 'sa', 'ap', 'la', 'af'],
    pgi_target: 6.0,
    profile: 'infra',
    gai_emphasis: 0.4,
    rationale_core: 'European coverage treats the cable story as a continental vulnerability, US coverage places it in wider cyber-defense terms, and Russian coverage tends to cool or redirect attribution.',
    pair_emphasis: { 'eu|ru': 6.6, 'ru|us': 6.2, 'eu|us': 5.4 },
  },
  {
    story_headline: 'DeepSeek scrutiny widens global AI trust split',
    category: 'technology/human potential',
    significance: 'medium',
    regions_found: ['us', 'eu', 'ap'],
    regions_absent: ['me', 'sa', 'la', 'af'],
    pgi_target: 6.0,
    profile: 'tech',
    gai_emphasis: 0.2,
    rationale_core: 'US and European coverage emphasizes risk and governance, while Asia-Pacific coverage is more mixed between competitiveness, access, and sovereignty concerns.',
    pair_emphasis: { 'ap|us': 6.4, 'ap|eu': 6.2, 'eu|us': 5.4 },
  },
  {
    story_headline: 'Italy privacy watchdog targets deepfake harms',
    category: 'information/framing',
    significance: 'medium',
    regions_found: ['eu', 'us'],
    regions_absent: ['me', 'sa', 'ap', 'la', 'af'],
    pgi_target: 6.0,
    profile: 'tech',
    gai_emphasis: 0.6,
    rationale_core: 'European framing roots the issue in dignity, consent, and rights, while US coverage is more likely to fold it into platform governance and speech-policy debates.',
    pair_emphasis: { 'eu|us': 6.2 },
  },
  {
    story_headline: 'Chinese AI framing ties compute to energy security',
    category: 'technology/human potential',
    significance: 'medium',
    regions_found: ['ap', 'us', 'eu'],
    regions_absent: ['me', 'sa', 'la', 'af'],
    pgi_target: 7.0,
    profile: 'tech',
    gai_emphasis: 0.2,
    rationale_core: 'Asia-Pacific framing links compute and power capacity much more directly, while US and EU reporting is comparatively more segmented between chips, regulation, and commercial competition.',
    pair_emphasis: { 'ap|us': 7.5, 'ap|eu': 7.3, 'eu|us': 6.1 },
  },
  {
    story_headline: 'UK launches youth jobs and apprenticeship push',
    category: 'education/opportunity',
    significance: 'medium',
    regions_found: ['eu'],
    regions_absent: ['us', 'me', 'sa', 'ap', 'la', 'af'],
    pgi_target: 4.0,
    profile: 'opportunity',
    gai_emphasis: 0.8,
    rationale_core: 'There is limited framing divergence because the story is mostly regional, but the policy emphasis is on social stability and early intervention rather than crisis response.',
    pair_emphasis: {},
  },
  {
    story_headline: 'AI-weather systems gain early-warning value',
    category: 'technology/human potential',
    significance: 'medium',
    regions_found: ['ap', 'us', 'eu'],
    regions_absent: ['me', 'sa', 'la', 'af'],
    pgi_target: 4.0,
    profile: 'opportunity',
    gai_emphasis: 0.1,
    rationale_core: 'Coverage is broadly aligned on usefulness and practical benefits, with differences mostly in whether the emphasis is resilience, forecasting, or innovation policy.',
    pair_emphasis: { 'ap|us': 4.3, 'ap|eu': 4.1, 'eu|us': 3.6 },
  },
  {
    story_headline: 'Thailand rewilds endangered leopard sharks',
    category: 'climate/natural world',
    significance: 'low',
    regions_found: ['ap', 'us', 'eu'],
    regions_absent: ['me', 'sa', 'la', 'af'],
    pgi_target: 3.0,
    profile: 'environment',
    gai_emphasis: -0.2,
    rationale_core: 'This is a low-divergence conservation story: regions mostly agree on the positive ecological signal, differing mainly in how much local livelihood context they add.',
    pair_emphasis: { 'ap|us': 3.2, 'ap|eu': 3.1, 'eu|us': 2.7 },
  },
  {
    story_headline: 'Sudan’s food-kitchen collapse stays under-covered',
    category: 'food/water',
    significance: 'critical',
    regions_found: ['af', 'eu'],
    regions_absent: ['us', 'me', 'sa', 'ap', 'la'],
    pgi_target: 9.0,
    profile: 'health',
    gai_emphasis: 1.0,
    rationale_core: 'African coverage is intensely human and survival-focused, while European coverage is more humanitarian-system oriented; the larger story is how many regions barely cover it at all.',
    pair_emphasis: { 'af|eu': 9.0 },
  },
  {
    story_headline: 'Underwater-cable incidents keep Europe on edge',
    category: 'information/framing',
    significance: 'medium',
    regions_found: ['eu', 'us', 'ru'],
    regions_absent: ['me', 'sa', 'ap', 'la', 'af'],
    pgi_target: 6.0,
    profile: 'infra',
    gai_emphasis: 0.4,
    rationale_core: 'Europe frames the story as a persistent civil-infrastructure vulnerability, the US sees strategic resilience, and Russian-linked framing is more skeptical or diffuse on blame.',
    pair_emphasis: { 'eu|ru': 6.5, 'ru|us': 6.1, 'eu|us': 5.3 },
  },
  {
    story_headline: 'African food-security coverage remains human-first',
    category: 'food/water',
    significance: 'high',
    regions_found: ['af', 'eu', 'me'],
    regions_absent: ['us', 'sa', 'ap', 'la'],
    pgi_target: 7.0,
    profile: 'health',
    gai_emphasis: 0.4,
    rationale_core: 'African coverage combines hunger, schooling, and displacement in one human picture, whereas European and Middle East reporting separates the same pressures into more institutional storylines.',
    pair_emphasis: { 'af|eu': 7.5, 'af|me': 7.3, 'eu|me': 6.2 },
  },
].map((story) => {
  const pgi = buildDimensions(story.pgi_target, story.profile);
  const story_pgi = average(Object.values(pgi));
  const gai = buildGai(story.regions_found, story.regions_absent, story.significance, story.gai_emphasis);
  const story_gai = average(Object.values(gai));
  return {
    ...story,
    story_slug: slugify(story.story_headline),
    pgi,
    story_pgi,
    gai,
    story_gai,
    pair_pgi: buildPairScores(story.regions_found, story_pgi, story.pair_emphasis),
    coverage_breadth: story.regions_found.length,
    scoring_rationale: rationale(story),
    significance_value: significanceValue[story.significance],
  };
});

async function main() {
  const env = loadEnv(envPath);
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const scanMarkdown = fs.readFileSync(scanPath, 'utf8');
  if (!scanMarkdown.includes('# Scan — 2026-04-07 — AM')) {
    throw new Error('Unexpected scan file loaded');
  }

  let pgiCount = 0;
  let pairCount = 0;
  let gaiCount = 0;

  for (const story of stories) {
    const pgiRow = {
      story_slug: story.story_slug,
      story_headline: story.story_headline,
      category: story.category,
      regions_covered: story.regions_found,
      region_count: story.regions_found.length,
      d1_factual: story.pgi.d1_factual,
      d2_causal: story.pgi.d2_causal,
      d3_framing: story.pgi.d3_framing,
      d4_emotional: story.pgi.d4_emotional,
      d5_actor_context: story.pgi.d5_actor_context,
      d6_cui_bono: story.pgi.d6_cui_bono,
      significance: story.significance_value,
      scoring_rationale: story.scoring_rationale,
      scan_date: scanDate,
      scan_period: scanPeriod,
      is_latest: true,
    };

    const { data: inserted, error: pgiError } = await supabase
      .from('pgi_story_scores')
      .upsert(pgiRow, { onConflict: 'story_slug,scan_date,scan_period', ignoreDuplicates: false })
      .select('id')
      .single();

    if (pgiError) throw pgiError;
    pgiCount += 1;

    for (const [key, pair_pgi] of Object.entries(story.pair_pgi)) {
      const [region_a, region_b] = key.split('|').sort();
      const { error: pairError } = await supabase
        .from('pgi_region_pairs')
        .upsert({
          story_score_id: inserted.id,
          region_a,
          region_b,
          pair_pgi,
          scan_date: scanDate,
        }, { onConflict: 'story_score_id,region_a,region_b', ignoreDuplicates: false });

      if (pairError) throw pairError;
      pairCount += 1;
    }

    const gaiRow = {
      scan_date: scanDate,
      scan_period: scanPeriod,
      story_slug: story.story_slug,
      story_headline: story.story_headline,
      category: story.category,
      regions_found: story.regions_found,
      regions_absent: story.regions_absent,
      coverage_breadth: story.coverage_breadth,
      d1_coverage_breadth: story.gai.d1_coverage_breadth,
      d2_prominence_disparity: story.gai.d2_prominence_disparity,
      d3_population_exposure: story.gai.d3_population_exposure,
      d4_significance_severity: story.gai.d4_significance_severity,
      story_gai: story.story_gai,
      significance: story.significance_value,
      scoring_rationale: story.scoring_rationale,
      is_latest: true,
    };

    const { error: gaiError } = await supabase
      .from('gai_story_scores')
      .upsert(gaiRow, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });

    if (gaiError) throw gaiError;
    gaiCount += 1;
  }

  const summary = {
    scanDate,
    scanPeriod,
    stories: stories.length,
    pgiCount,
    pairCount,
    gaiCount,
    scored: stories.map((story) => ({
      story_slug: story.story_slug,
      story_headline: story.story_headline,
      story_pgi: story.story_pgi,
      story_gai: story.story_gai,
      regions_found: story.regions_found,
      regions_absent: story.regions_absent,
      dimensions: story.pgi,
      gai_dimensions: story.gai,
      pair_pgi: story.pair_pgi,
    })),
  };

  const outPath = path.join('/Users/treelight/.openclaw/workspace/memory/scans', '2026-04-07-am-scores.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
