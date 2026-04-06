#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const scanDate = '2026-04-06';
const scanPeriod = 'pm';
const scanPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-06-pm.md';
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

function average(values) {
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

function buildPairScores(regions, base, adjustments = {}) {
  const out = {};
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const a = regions[i];
      const b = regions[j];
      const key = pairKey(a, b);
      out[key] = adjustments[key] ?? base;
    }
  }
  return out;
}

const sig = { critical: 5, high: 3, medium: 1 };

const stories = [
  {
    story_headline: 'Food inflation climbs on energy shock',
    category: 'food/water',
    significance: sig.critical,
    regions_found: ['eu', 'me', 'la', 'af'],
    regions_absent: ['us', 'sa', 'ap'],
    pgi: { d1_factual: 7, d2_causal: 8, d3_framing: 9, d4_emotional: 8, d5_actor_context: 8, d6_cui_bono: 8 },
    pair_pgi: buildPairScores(['eu', 'me', 'la', 'af'], 8, { 'eu|me': 8.5, 'la|me': 9, 'af|me': 8.5, 'eu|la': 7.5, 'af|eu': 7.5, 'af|la': 7.5 }),
    gai: { d1_coverage_breadth: 6, d2_prominence_disparity: 8, d3_population_exposure: 8, d4_significance_severity: 10 },
    scoring_rationale: 'Shared facts on the energy-food linkage are fairly stable, but Arab, Latin American, and African coverage stress household affordability and food security more directly than Europe’s macroeconomic framing.'
  },
  {
    story_headline: 'Philippines creates food-security task force',
    category: 'food/water',
    significance: sig.high,
    regions_found: ['ap', 'me'],
    regions_absent: ['us', 'eu', 'sa', 'la', 'af'],
    pgi: { d1_factual: 6, d2_causal: 7, d3_framing: 8, d4_emotional: 7, d5_actor_context: 7, d6_cui_bono: 7 },
    pair_pgi: buildPairScores(['ap', 'me'], 7.5, { 'ap|me': 7.5 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 8, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'The main gap is visibility: Asian coverage treats this as practical food-security management, while Middle East coverage reads it through shipping and fuel fragility. Most other regions barely register it.'
  },
  {
    story_headline: 'WTO warns trade slows if energy stays high',
    category: 'money/markets',
    significance: sig.high,
    regions_found: ['la', 'eu', 'ap'],
    regions_absent: ['us', 'me', 'sa', 'af'],
    pgi: { d1_factual: 6, d2_causal: 7, d3_framing: 7, d4_emotional: 6, d5_actor_context: 6, d6_cui_bono: 6 },
    pair_pgi: buildPairScores(['la', 'eu', 'ap'], 6.5, { 'ap|eu': 6.5, 'ap|la': 7, 'eu|la': 6.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 7, d3_population_exposure: 7, d4_significance_severity: 8 },
    scoring_rationale: 'Coverage agrees that energy volatility is feeding trade drag, but Latin American and Asian reporting localize the import-cost pain more than Europe’s institutional WTO lens.'
  },
  {
    story_headline: 'Indian farmers fear fertiliser crunch from Gulf war',
    category: 'food/water',
    significance: sig.critical,
    regions_found: ['sa', 'la', 'eu'],
    regions_absent: ['us', 'me', 'ap', 'af'],
    pgi: { d1_factual: 8, d2_causal: 9, d3_framing: 9, d4_emotional: 9, d5_actor_context: 9, d6_cui_bono: 9 },
    pair_pgi: buildPairScores(['sa', 'la', 'eu'], 8.8, { 'eu|sa': 9, 'la|sa': 9, 'eu|la': 8.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 8, d3_population_exposure: 9, d4_significance_severity: 10 },
    scoring_rationale: 'South Asian coverage makes the next-harvest threat concrete and immediate, while Latin American and European coverage recognize the same risk with more distance and policy framing.'
  },
  {
    story_headline: 'U.S. reshapes malaria-HIV supply chain',
    category: 'health/medicine',
    significance: sig.high,
    regions_found: ['sa', 'af', 'us'],
    regions_absent: ['eu', 'me', 'ap', 'la'],
    pgi: { d1_factual: 7, d2_causal: 8, d3_framing: 9, d4_emotional: 8, d5_actor_context: 8, d6_cui_bono: 8 },
    pair_pgi: buildPairScores(['sa', 'af', 'us'], 8, { 'af|us': 8.5, 'af|sa': 7.5, 'sa|us': 8 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 8, d3_population_exposure: 8, d4_significance_severity: 9 },
    scoring_rationale: 'African and Global South coverage foreground care disruption and patient risk, while US reporting leans more toward aid architecture and administrative redesign.'
  },
  {
    story_headline: 'Global food-price rise hits Arab framing hard',
    category: 'food/water',
    significance: sig.high,
    regions_found: ['me', 'af', 'eu'],
    regions_absent: ['us', 'sa', 'ap', 'la'],
    pgi: { d1_factual: 6, d2_causal: 7, d3_framing: 8, d4_emotional: 8, d5_actor_context: 7, d6_cui_bono: 7 },
    pair_pgi: buildPairScores(['me', 'af', 'eu'], 7.2, { 'af|me': 7.5, 'eu|me': 8, 'af|eu': 6.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 7, d3_population_exposure: 8, d4_significance_severity: 9 },
    scoring_rationale: 'Middle East coverage ties food inflation directly to war and staple insecurity; Europe is more institutional, and African coverage sits closer to affordability and import stress.'
  },
  {
    story_headline: 'Japan openly prioritises fuel stability',
    category: 'energy/power',
    significance: sig.high,
    regions_found: ['ap', 'me'],
    regions_absent: ['us', 'eu', 'sa', 'la', 'af'],
    pgi: { d1_factual: 5, d2_causal: 6, d3_framing: 7, d4_emotional: 5, d5_actor_context: 6, d6_cui_bono: 6 },
    pair_pgi: buildPairScores(['ap', 'me'], 6.5, { 'ap|me': 6.5 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 7, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'Japanese coverage is highly operational and domestic, focused on continuity and conservation. Middle East coverage reads the same shift through import dependence and regional vulnerability.'
  },
  {
    story_headline: 'China leans on trade resilience message',
    category: 'money/markets',
    significance: sig.medium,
    regions_found: ['ap', 'eu', 'af'],
    regions_absent: ['us', 'me', 'sa', 'la'],
    pgi: { d1_factual: 5, d2_causal: 5, d3_framing: 6, d4_emotional: 4, d5_actor_context: 5, d6_cui_bono: 5 },
    pair_pgi: buildPairScores(['ap', 'eu', 'af'], 5, { 'ap|eu': 5.5, 'af|ap': 5, 'af|eu': 4.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 6, d3_population_exposure: 7, d4_significance_severity: 6 },
    scoring_rationale: 'This is less a severe framing split than a messaging contrast: Chinese-linked coverage emphasizes resilience and multilateral steadiness, while other regions treat it more cautiously.'
  },
  {
    story_headline: 'South Korea fake-news law chills press debate',
    category: 'information/framing',
    significance: sig.medium,
    regions_found: ['ap', 'us'],
    regions_absent: ['eu', 'me', 'sa', 'la', 'af'],
    pgi: { d1_factual: 6, d2_causal: 7, d3_framing: 8, d4_emotional: 7, d5_actor_context: 8, d6_cui_bono: 8 },
    pair_pgi: buildPairScores(['ap', 'us'], 7.3, { 'ap|us': 7.3 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 7, d3_population_exposure: 7, d4_significance_severity: 7 },
    scoring_rationale: 'US framing leans toward democratic backsliding and speech rights, while Asian coverage is more entangled with crisis-information control and public-order logic.'
  },
  {
    story_headline: 'EU cloud breach spreads beyond Commission',
    category: 'information/framing',
    significance: sig.high,
    regions_found: ['eu', 'us'],
    regions_absent: ['me', 'sa', 'ap', 'la', 'af'],
    pgi: { d1_factual: 7, d2_causal: 8, d3_framing: 9, d4_emotional: 8, d5_actor_context: 8, d6_cui_bono: 8 },
    pair_pgi: buildPairScores(['eu', 'us'], 8, { 'eu|us': 8 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 7, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'European coverage treats the breach as an institutional trust failure; US coverage places it more in the broader cyber-risk and governance frame.'
  },
  {
    story_headline: 'Oil shock keeps grocery inflation alive in Spain',
    category: 'food/water',
    significance: sig.medium,
    regions_found: ['la', 'eu', 'me'],
    regions_absent: ['us', 'sa', 'ap', 'af'],
    pgi: { d1_factual: 5, d2_causal: 6, d3_framing: 7, d4_emotional: 6, d5_actor_context: 6, d6_cui_bono: 6 },
    pair_pgi: buildPairScores(['la', 'eu', 'me'], 6, { 'eu|la': 6, 'eu|me': 6.5, 'la|me': 6.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 6, d3_population_exposure: 7, d4_significance_severity: 7 },
    scoring_rationale: 'The facts largely align, but Spanish and Arab-linked framing are more food-first and domestic, while broader European treatment retains a macroeconomic cast.'
  },
  {
    story_headline: 'Latin coverage ties oil shock to poorer diets',
    category: 'food/water',
    significance: sig.high,
    regions_found: ['la', 'me', 'eu'],
    regions_absent: ['us', 'sa', 'ap', 'af'],
    pgi: { d1_factual: 6, d2_causal: 7, d3_framing: 8, d4_emotional: 8, d5_actor_context: 7, d6_cui_bono: 7 },
    pair_pgi: buildPairScores(['la', 'me', 'eu'], 7.2, { 'eu|la': 7.5, 'eu|me': 7.5, 'la|me': 6.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 7, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'Latin American framing localizes the oil shock through nutrition decline and household tradeoffs, a more visceral emphasis than the European macro lens.'
  },
  {
    story_headline: 'African coverage tracks food-energy squeeze',
    category: 'food/water',
    significance: sig.high,
    regions_found: ['af', 'eu', 'me'],
    regions_absent: ['us', 'sa', 'ap', 'la'],
    pgi: { d1_factual: 6, d2_causal: 7, d3_framing: 8, d4_emotional: 8, d5_actor_context: 7, d6_cui_bono: 7 },
    pair_pgi: buildPairScores(['af', 'eu', 'me'], 7.2, { 'af|eu': 7.5, 'af|me': 7, 'eu|me': 7 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 7, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'African reporting centers affordability and daily survival tradeoffs, while European and Arab coverage are closer to systems language and import dependency.'
  },
  {
    story_headline: 'Measles and medicine-shortage risk keeps widening',
    category: 'health/medicine',
    significance: sig.high,
    regions_found: ['us', 'eu', 'af', 'sa'],
    regions_absent: ['me', 'ap', 'la'],
    pgi: { d1_factual: 5, d2_causal: 6, d3_framing: 7, d4_emotional: 6, d5_actor_context: 6, d6_cui_bono: 6 },
    pair_pgi: buildPairScores(['us', 'eu', 'af', 'sa'], 6.2, { 'af|us': 6.5, 'af|eu': 6.5, 'af|sa': 6.5, 'eu|us': 5.5, 'eu|sa': 6, 'sa|us': 6 }),
    gai: { d1_coverage_breadth: 6, d2_prominence_disparity: 7, d3_population_exposure: 7, d4_significance_severity: 8 },
    scoring_rationale: 'This is more a systems-stress story than a full narrative split: affected-region coverage is more urgent and concrete, while US/EU reporting remains more institutional.'
  },
  {
    story_headline: 'AI-weather tools gain strategic relevance',
    category: 'technology/human potential',
    significance: sig.medium,
    regions_found: ['us', 'eu', 'ap'],
    regions_absent: ['me', 'sa', 'la', 'af'],
    pgi: { d1_factual: 3, d2_causal: 4, d3_framing: 4, d4_emotional: 3, d5_actor_context: 4, d6_cui_bono: 4 },
    pair_pgi: buildPairScores(['us', 'eu', 'ap'], 3.8, { 'ap|us': 4, 'ap|eu': 4, 'eu|us': 3.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 6, d3_population_exposure: 6, d4_significance_severity: 5 },
    scoring_rationale: 'Low divergence: regions mostly agree on utility and promise, differing mainly in whether the emphasis is innovation, resilience, or applied forecasting.'
  },
  {
    story_headline: 'Multi-cancer blood tests move closer to clinics',
    category: 'health/medicine',
    significance: sig.medium,
    regions_found: ['us', 'ap', 'eu'],
    regions_absent: ['me', 'sa', 'la', 'af'],
    pgi: { d1_factual: 3, d2_causal: 3, d3_framing: 4, d4_emotional: 3, d5_actor_context: 4, d6_cui_bono: 4 },
    pair_pgi: buildPairScores(['us', 'ap', 'eu'], 3.5, { 'ap|us': 4, 'ap|eu': 3.5, 'eu|us': 3 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 6, d3_population_exposure: 6, d4_significance_severity: 5 },
    scoring_rationale: 'Another low-gap science-health story: coverage is broadly aligned, with only modest differences in commercialization, clinic readiness, and innovation framing.'
  },
  {
    story_headline: 'Africa solar mini-grids keep gaining ground',
    category: 'energy/power',
    significance: sig.medium,
    regions_found: ['af', 'eu', 'us'],
    regions_absent: ['me', 'sa', 'ap', 'la'],
    pgi: { d1_factual: 4, d2_causal: 5, d3_framing: 5, d4_emotional: 4, d5_actor_context: 5, d6_cui_bono: 6 },
    pair_pgi: buildPairScores(['af', 'eu', 'us'], 4.8, { 'af|eu': 5, 'af|us': 5.5, 'eu|us': 4 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 6, d3_population_exposure: 7, d4_significance_severity: 6 },
    scoring_rationale: 'Coverage broadly agrees on the value of decentralized power, but African reporting is more grounded in lived infrastructure need than Western clean-tech optimism.'
  },
  {
    story_headline: 'UK school funding debate exposes inclusion strain',
    category: 'education/opportunity',
    significance: sig.medium,
    regions_found: ['eu'],
    regions_absent: ['us', 'me', 'sa', 'ap', 'la', 'af'],
    pgi: { d1_factual: 4, d2_causal: 5, d3_framing: 6, d4_emotional: 5, d5_actor_context: 5, d6_cui_bono: 5 },
    pair_pgi: {},
    gai: { d1_coverage_breadth: 10, d2_prominence_disparity: 8, d3_population_exposure: 8, d4_significance_severity: 7 },
    scoring_rationale: 'There is almost no cross-regional framing contest because there is almost no cross-regional coverage. The story is highly invisible despite meaningful social significance.'
  },
  {
    story_headline: 'No country reaches full legal equality for women',
    category: 'women’s rights',
    significance: sig.medium,
    regions_found: ['us', 'eu', 'af', 'la', 'sa'],
    regions_absent: ['me', 'ap'],
    pgi: { d1_factual: 4, d2_causal: 5, d3_framing: 5, d4_emotional: 5, d5_actor_context: 5, d6_cui_bono: 6 },
    pair_pgi: buildPairScores(['us', 'eu', 'af', 'la', 'sa'], 5, { 'eu|us': 4.5, 'af|eu': 5, 'af|us': 5, 'la|us': 5, 'la|eu': 5, 'sa|us': 5.5, 'sa|eu': 5, 'af|la': 5, 'af|sa': 5.5, 'la|sa': 5 }),
    gai: { d1_coverage_breadth: 4, d2_prominence_disparity: 6, d3_population_exposure: 5, d4_significance_severity: 8 },
    scoring_rationale: 'Broad cross-regional agreement keeps PGI moderate, but the remaining coverage gaps matter because this is a structurally significant global story still missing in some regions.'
  }
].map((story) => ({
  ...story,
  story_slug: slugify(story.story_headline),
  story_pgi: average(Object.values(story.pgi)),
  story_gai: average(Object.values(story.gai)),
  coverage_breadth: story.regions_found.length
}));

async function main() {
  const env = loadEnv(envPath);
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const scanMarkdown = fs.readFileSync(scanPath, 'utf8');
  if (!scanMarkdown.includes('# Scan — 2026-04-06 — PM')) {
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
      significance: story.significance,
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
      significance: story.significance,
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
      pair_pgi: story.pair_pgi,
    })),
  };

  const outPath = path.join('/Users/treelight/.openclaw/workspace/memory/scans', '2026-04-06-pm-scores.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
