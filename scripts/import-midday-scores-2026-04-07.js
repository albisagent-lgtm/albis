#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const scanDate = '2026-04-07';
const scanPeriod = 'midday';
const scoresPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-07-midday-scores.json';
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

const significanceValue = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
};

async function main() {
  const env = loadEnv(envPath);
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const payload = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
  const stories = payload.scored || [];

  let pgiCount = 0;
  let gaiCount = 0;
  let pairCount = 0;

  for (const story of stories) {
    const significance = significanceValue[String(story.significance || '').toLowerCase()] || 3;

    const pgiRow = {
      story_slug: story.story_slug,
      story_headline: story.story_headline,
      category: story.category,
      regions_covered: story.regions_found || [],
      region_count: (story.regions_found || []).length,
      d1_factual: story.dimensions?.d1_factual ?? null,
      d2_causal: story.dimensions?.d2_causal ?? null,
      d3_framing: story.dimensions?.d3_framing ?? null,
      d4_emotional: story.dimensions?.d4_emotional ?? null,
      d5_actor_context: story.dimensions?.d5_actor_context ?? null,
      d6_cui_bono: story.dimensions?.d6_cui_bono ?? null,
      significance,
      scoring_rationale: story.scoring_rationale || null,
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

    for (const [key, pair_pgi] of Object.entries(story.pair_pgi || {})) {
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
      regions_found: story.regions_found || [],
      regions_absent: story.regions_absent || [],
      coverage_breadth: (story.regions_found || []).length,
      d1_coverage_breadth: story.gai_dimensions?.d1_coverage_breadth ?? null,
      d2_prominence_disparity: story.gai_dimensions?.d2_prominence_disparity ?? null,
      d3_population_exposure: story.gai_dimensions?.d3_population_exposure ?? null,
      d4_significance_severity: story.gai_dimensions?.d4_significance_severity ?? null,
      story_gai: story.story_gai,
      significance,
      scoring_rationale: story.scoring_rationale || null,
      is_latest: true,
    };

    const { error: gaiError } = await supabase
      .from('gai_story_scores')
      .upsert(gaiRow, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });

    if (gaiError) throw gaiError;
    gaiCount += 1;
  }

  console.log(JSON.stringify({ ok: true, scanDate, scanPeriod, stories: stories.length, pgiCount, pairCount, gaiCount }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
