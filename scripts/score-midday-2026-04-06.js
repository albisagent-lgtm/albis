#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const scanDate = '2026-04-06';
const scanPeriod = 'midday';
const scanPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-06-midday.md';
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

const stories = [
  {
    story_headline: 'Gulf water plants enter firing line',
    category: 'energy',
    significance: 5,
    regions_found: ['us', 'eu', 'me', 'ap'],
    regions_absent: ['sa', 'la', 'af'],
    pgi: { d1_factual: 8, d2_causal: 9, d3_framing: 10, d4_emotional: 9, d5_actor_context: 9, d6_cui_bono: 9 },
    pair_pgi: buildPairScores(['us', 'eu', 'me', 'ap'], 9, { 'ap|me': 10, 'eu|me': 9.5, 'me|us': 9.5, 'ap|us': 9, 'ap|eu': 8.5, 'eu|us': 8.5 }),
    gai: { d1_coverage_breadth: 6, d2_prominence_disparity: 8, d3_population_exposure: 8, d4_significance_severity: 10 },
    scoring_rationale: 'All covered the infrastructure risk, but Middle East and Asia framed it as civilian water survival while US/EU leaned harder on military escalation and market shock.'
  },
  {
    story_headline: 'Kuwait strike widens survival-war logic',
    category: 'conflict',
    significance: 5,
    regions_found: ['us', 'me', 'eu'],
    regions_absent: ['sa', 'ap', 'la', 'af'],
    pgi: { d1_factual: 8, d2_causal: 9, d3_framing: 10, d4_emotional: 9, d5_actor_context: 9, d6_cui_bono: 9 },
    pair_pgi: buildPairScores(['us', 'me', 'eu'], 9, { 'eu|me': 9.5, 'me|us': 9.5, 'eu|us': 8.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 9, d3_population_exposure: 8, d4_significance_severity: 10 },
    scoring_rationale: 'Shared facts about the strike were fairly stable, but regional treatment split sharply between survival-pressure logic in Gulf coverage and escalation narratives in Western coverage.'
  },
  {
    story_headline: 'Oil surge becomes cost-of-living story',
    category: 'money',
    significance: 1,
    regions_found: ['us', 'eu', 'me', 'ap'],
    regions_absent: ['sa', 'la', 'af'],
    pgi: { d1_factual: 7, d2_causal: 8, d3_framing: 9, d4_emotional: 8, d5_actor_context: 8, d6_cui_bono: 8 },
    pair_pgi: buildPairScores(['us', 'eu', 'me', 'ap'], 8, { 'ap|me': 8.5, 'eu|me': 8.5, 'me|us': 8.5, 'ap|us': 8, 'ap|eu': 7.5, 'eu|us': 7.5 }),
    gai: { d1_coverage_breadth: 6, d2_prominence_disparity: 7, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'Arabic and Asian coverage foregrounded household pain and supply continuity; US and EU outlets covered the same price move with more market and geopolitical emphasis.'
  },
  {
    story_headline: 'Fertiliser shock threatens next harvests',
    category: 'food/water',
    significance: 5,
    regions_found: ['us', 'me', 'sa', 'af'],
    regions_absent: ['eu', 'ap', 'la'],
    pgi: { d1_factual: 8, d2_causal: 9, d3_framing: 9, d4_emotional: 9, d5_actor_context: 9, d6_cui_bono: 10 },
    pair_pgi: buildPairScores(['us', 'me', 'sa', 'af'], 9, { 'af|us': 9.5, 'af|me': 9, 'af|sa': 8.5, 'me|us': 9, 'me|sa': 8.5, 'sa|us': 8.5 }),
    gai: { d1_coverage_breadth: 6, d2_prominence_disparity: 8, d3_population_exposure: 9, d4_significance_severity: 10 },
    scoring_rationale: 'Food-system outlets and vulnerable-region coverage treated fertiliser as a next-harvest crisis, while US reporting kept one foot in commodity-market framing.'
  },
  {
    story_headline: 'FAO food-price warning climbs again',
    category: 'food/water',
    significance: 1,
    regions_found: ['us', 'me', 'eu'],
    regions_absent: ['sa', 'ap', 'la', 'af'],
    pgi: { d1_factual: 7, d2_causal: 8, d3_framing: 8, d4_emotional: 8, d5_actor_context: 8, d6_cui_bono: 9 },
    pair_pgi: buildPairScores(['us', 'me', 'eu'], 8, { 'eu|me': 8.5, 'me|us': 8.5, 'eu|us': 7.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 8, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'Consensus existed on rising food prices, but Middle East coverage made it more immediate for households while Western outlets framed it as a macroeconomic warning.'
  },
  {
    story_headline: 'WFP warns hunger could hit record levels',
    category: 'food/water',
    significance: 5,
    regions_found: ['us', 'af', 'me'],
    regions_absent: ['eu', 'sa', 'ap', 'la'],
    pgi: { d1_factual: 7, d2_causal: 8, d3_framing: 9, d4_emotional: 9, d5_actor_context: 8, d6_cui_bono: 8 },
    pair_pgi: buildPairScores(['us', 'af', 'me'], 8, { 'af|me': 8.5, 'af|us': 9, 'me|us': 8.5 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 9, d3_population_exposure: 9, d4_significance_severity: 10 },
    scoring_rationale: 'African and Middle Eastern framing centered humanitarian urgency and ration cuts; US coverage acknowledged the warning but gave it less centrality than conflict-market stories.'
  },
  {
    story_headline: 'Somalia drought worsens as aid thins',
    category: 'climate',
    significance: 1,
    regions_found: ['us', 'af'],
    regions_absent: ['eu', 'me', 'sa', 'ap', 'la'],
    pgi: { d1_factual: 6, d2_causal: 7, d3_framing: 7, d4_emotional: 8, d5_actor_context: 7, d6_cui_bono: 7 },
    pair_pgi: buildPairScores(['us', 'af'], 7, { 'af|us': 7 }),
    gai: { d1_coverage_breadth: 9, d2_prominence_disparity: 8, d3_population_exposure: 9, d4_significance_severity: 8 },
    scoring_rationale: 'This was less a framing war than a visibility problem: African coverage treated it as a direct survival issue while broader international coverage was sparse and episodic.'
  },
  {
    story_headline: 'EU gas-oil squeeze returns to front pages',
    category: 'energy',
    significance: 1,
    regions_found: ['eu', 'ru', 'us'],
    regions_absent: ['me', 'sa', 'ap', 'la', 'af'],
    pgi: { d1_factual: 6, d2_causal: 7, d3_framing: 8, d4_emotional: 7, d5_actor_context: 7, d6_cui_bono: 7 },
    pair_pgi: buildPairScores(['eu', 'ru', 'us'], 7, { 'eu|ru': 8, 'ru|us': 7.5, 'eu|us': 6.5 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 7, d3_population_exposure: 7, d4_significance_severity: 8 },
    scoring_rationale: 'Russian coverage pushed European vulnerability more aggressively, while EU and US stories treated the squeeze as a renewed cost and supply risk rather than strategic weakness.'
  },
  {
    story_headline: 'Japan shifts from geopolitics to fuel security',
    category: 'energy',
    significance: 1,
    regions_found: ['ap', 'us'],
    regions_absent: ['eu', 'me', 'sa', 'la', 'af'],
    pgi: { d1_factual: 7, d2_causal: 8, d3_framing: 8, d4_emotional: 8, d5_actor_context: 8, d6_cui_bono: 9 },
    pair_pgi: buildPairScores(['ap', 'us'], 8, { 'ap|us': 8 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 7, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'Japanese coverage localized the story around continuity, utilities, and factory exposure; US framing stayed closer to strategy and regional contest.'
  },
  {
    story_headline: 'UN Chinese coverage spotlights poorest importers',
    category: 'food/water',
    significance: 1,
    regions_found: ['ap', 'af', 'sa', 'me'],
    regions_absent: ['us', 'eu', 'la'],
    pgi: { d1_factual: 6, d2_causal: 7, d3_framing: 8, d4_emotional: 7, d5_actor_context: 7, d6_cui_bono: 7 },
    pair_pgi: buildPairScores(['ap', 'af', 'sa', 'me'], 7, { 'af|ap': 7.5, 'af|me': 7, 'af|sa': 7, 'ap|me': 7.5, 'ap|sa': 7.5, 'me|sa': 6.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 8, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'Mandarin-linked and vulnerable-region coverage emphasized poor importers and downstream hardship, a perspective notably underplayed in US/EU discussion.'
  },
  {
    story_headline: 'U.S. aid disruption creates malaria-drug gaps',
    category: 'health',
    significance: 1,
    regions_found: ['us', 'sa', 'af'],
    regions_absent: ['eu', 'me', 'ap', 'la'],
    pgi: { d1_factual: 7, d2_causal: 8, d3_framing: 8, d4_emotional: 8, d5_actor_context: 8, d6_cui_bono: 9 },
    pair_pgi: buildPairScores(['us', 'sa', 'af'], 8, { 'af|us': 8.5, 'af|sa': 7.5, 'sa|us': 8 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 8, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'African coverage made the treatment gap visceral, while US stories framed it more as a policy-disruption consequence than an immediate frontline health emergency.'
  },
  {
    story_headline: '53 million lose care as 6,600 facilities falter',
    category: 'health',
    significance: 1,
    regions_found: ['us', 'af', 'me'],
    regions_absent: ['eu', 'sa', 'ap', 'la'],
    pgi: { d1_factual: 5, d2_causal: 6, d3_framing: 7, d4_emotional: 6, d5_actor_context: 6, d6_cui_bono: 6 },
    pair_pgi: buildPairScores(['us', 'af', 'me'], 6, { 'af|me': 6.5, 'af|us': 6.5, 'me|us': 5.5 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 8, d3_population_exposure: 8, d4_significance_severity: 8 },
    scoring_rationale: 'The framing gap was moderate: most outlets described a systems collapse, but affected-region coverage gave more texture about daily service loss than US reports did.'
  },
  {
    story_headline: 'Deepfake rules still lag election-year reality',
    category: 'info',
    significance: 1,
    regions_found: ['us', 'eu', 'me'],
    regions_absent: ['sa', 'ap', 'la', 'af'],
    pgi: { d1_factual: 7, d2_causal: 8, d3_framing: 9, d4_emotional: 8, d5_actor_context: 8, d6_cui_bono: 8 },
    pair_pgi: buildPairScores(['us', 'eu', 'me'], 8, { 'eu|me': 8.5, 'me|us': 8.5, 'eu|us': 7.5 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 8, d3_population_exposure: 7, d4_significance_severity: 8 },
    scoring_rationale: 'Western coverage stressed regulation and platform response, while Middle East framing leaned more toward real-time truth verification under conflict conditions.'
  },
  {
    story_headline: 'Chip controls keep tightening as AI splits',
    category: 'technology',
    significance: 1,
    regions_found: ['us', 'eu', 'ap'],
    regions_absent: ['me', 'sa', 'la', 'af'],
    pgi: { d1_factual: 6, d2_causal: 7, d3_framing: 7, d4_emotional: 7, d5_actor_context: 7, d6_cui_bono: 8 },
    pair_pgi: buildPairScores(['us', 'eu', 'ap'], 7, { 'ap|us': 7.5, 'ap|eu': 7, 'eu|us': 6.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 7, d3_population_exposure: 7, d4_significance_severity: 6 },
    scoring_rationale: 'US coverage centered strategic controls, Asia focused access and supply-chain consequences, and Europe sat between competitiveness and alignment.'
  },
  {
    story_headline: 'India’s jobs gap remains an education crisis',
    category: 'education',
    significance: 1,
    regions_found: ['sa', 'us'],
    regions_absent: ['eu', 'me', 'ap', 'la', 'af'],
    pgi: { d1_factual: 5, d2_causal: 6, d3_framing: 6, d4_emotional: 6, d5_actor_context: 6, d6_cui_bono: 7 },
    pair_pgi: buildPairScores(['sa', 'us'], 6, { 'sa|us': 6 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 7, d3_population_exposure: 8, d4_significance_severity: 6 },
    scoring_rationale: 'Indian framing was more structural and lived-in, while US attention was lighter and more explanatory than urgent.'
  },
  {
    story_headline: 'Brain drain accelerates from fragile economies',
    category: 'education',
    significance: 1,
    regions_found: ['sa', 'ap'],
    regions_absent: ['us', 'eu', 'me', 'la', 'af'],
    pgi: { d1_factual: 5, d2_causal: 6, d3_framing: 6, d4_emotional: 6, d5_actor_context: 6, d6_cui_bono: 7 },
    pair_pgi: buildPairScores(['sa', 'ap'], 6, { 'ap|sa': 6 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 7, d3_population_exposure: 7, d4_significance_severity: 6 },
    scoring_rationale: 'Regional coverage treated out-migration as system weakening; outside coverage was largely absent, making invisibility as important as any framing gap.'
  },
  {
    story_headline: 'No country reaches full legal equality for women',
    category: "women's rights",
    significance: 1,
    regions_found: ['us', 'eu', 'af'],
    regions_absent: ['me', 'sa', 'ap', 'la'],
    pgi: { d1_factual: 4, d2_causal: 5, d3_framing: 5, d4_emotional: 5, d5_actor_context: 5, d6_cui_bono: 6 },
    pair_pgi: buildPairScores(['us', 'eu', 'af'], 5, { 'af|eu': 5.5, 'af|us': 5.5, 'eu|us': 4.5 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 7, d3_population_exposure: 7, d4_significance_severity: 6 },
    scoring_rationale: 'There was broad agreement on the rights gap, with differences mainly in whether it was framed as justice access, institutional lag, or development policy.'
  },
  {
    story_headline: 'ISS cargo launch offers rare non-crisis science signal',
    category: 'science',
    significance: 1,
    regions_found: ['us', 'eu', 'ap'],
    regions_absent: ['me', 'sa', 'la', 'af'],
    pgi: { d1_factual: 3, d2_causal: 3, d3_framing: 3, d4_emotional: 3, d5_actor_context: 3, d6_cui_bono: 3 },
    pair_pgi: buildPairScores(['us', 'eu', 'ap'], 3, { 'ap|us': 3.5, 'ap|eu': 3, 'eu|us': 2.5 }),
    gai: { d1_coverage_breadth: 7, d2_prominence_disparity: 5, d3_population_exposure: 5, d4_significance_severity: 3 },
    scoring_rationale: 'Low-gap science coverage: regions mostly aligned on facts and cooperative research value, with only small differences in prestige and utility emphasis.'
  },
  {
    story_headline: 'ESA-China SMILE mission nears launch',
    category: 'science',
    significance: 1,
    regions_found: ['eu', 'ap'],
    regions_absent: ['us', 'me', 'sa', 'la', 'af'],
    pgi: { d1_factual: 4, d2_causal: 4, d3_framing: 4, d4_emotional: 4, d5_actor_context: 4, d6_cui_bono: 4 },
    pair_pgi: buildPairScores(['eu', 'ap'], 4, { 'ap|eu': 4 }),
    gai: { d1_coverage_breadth: 8, d2_prominence_disparity: 6, d3_population_exposure: 6, d4_significance_severity: 4 },
    scoring_rationale: 'Coverage was relatively aligned and calm, but the story remained quiet outside Europe and Asia despite its cooperation signal.'
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
  if (!scanMarkdown.includes('# Scan — 2026-04-06 — Midday')) {
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

  const outPath = path.join('/Users/treelight/.openclaw/workspace/memory/scans', '2026-04-06-midday-scores.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
