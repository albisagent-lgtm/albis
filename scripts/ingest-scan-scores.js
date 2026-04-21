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

const scorePath = process.argv[2];
if (!scorePath) {
  console.error('Usage: node scripts/ingest-scan-scores.js <scores.json>');
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(scorePath, 'utf8'));
const significanceMap = { critical: 5, high: 3, medium: 2, low: 1 };

async function main() {
  let pgiCount = 0;
  let pairCount = 0;
  let gaiCount = 0;

  for (const story of payload.scored) {
    const significance = significanceMap[story.significance] ?? null;

    const pgiRow = {
      story_slug: story.story_slug,
      story_headline: story.story_headline,
      category: story.category,
      regions_covered: story.regions_found,
      region_count: story.regions_found.length,
      d1_factual: story.dimensions.d1_factual,
      d2_causal: story.dimensions.d2_causal,
      d3_framing: story.dimensions.d3_framing,
      d4_emotional: story.dimensions.d4_emotional,
      d5_actor_context: story.dimensions.d5_actor_context,
      d6_cui_bono: story.dimensions.d6_cui_bono,
      significance,
      scoring_rationale: story.scoring_rationale,
      scan_date: payload.scanDate,
      scan_period: payload.scanPeriod,
      is_latest: true,
    };

    const { data: pgiInserted, error: pgiError } = await supabase
      .from('pgi_story_scores')
      .upsert(pgiRow, {
        onConflict: 'story_slug,scan_date,scan_period',
        ignoreDuplicates: false,
      })
      .select('id')
      .single();

    if (pgiError) throw new Error(`PGI upsert failed for ${story.story_slug}: ${pgiError.message}`);
    pgiCount++;

    for (const [pairKey, pairScore] of Object.entries(story.pair_pgi)) {
      const [a, b] = pairKey.split('|').sort();
      const { error: pairError } = await supabase.from('pgi_region_pairs').upsert({
        story_score_id: pgiInserted.id,
        region_a: a,
        region_b: b,
        pair_pgi: pairScore,
        scan_date: payload.scanDate,
      }, {
        onConflict: 'story_score_id,region_a,region_b',
        ignoreDuplicates: false,
      });
      if (pairError) throw new Error(`Pair upsert failed for ${story.story_slug} ${pairKey}: ${pairError.message}`);
      pairCount++;
    }

    const gaiRow = {
      story_slug: story.story_slug,
      story_headline: story.story_headline,
      category: story.category,
      regions_found: story.regions_found,
      regions_absent: story.regions_absent,
      coverage_breadth: story.coverage_breadth,
      d1_coverage_breadth: story.gai_dimensions.d1,
      d2_prominence_disparity: story.gai_dimensions.d2,
      d3_population_exposure: story.gai_dimensions.d3,
      d4_significance_severity: story.gai_dimensions.d4,
      significance,
      scoring_rationale: story.scoring_rationale,
      scan_date: payload.scanDate,
      scan_period: payload.scanPeriod,
      is_latest: true,
    };

    const { error: gaiError } = await supabase
      .from('gai_story_scores')
      .upsert(gaiRow, {
        onConflict: 'story_slug,scan_date,scan_period',
        ignoreDuplicates: false,
      });

    if (gaiError) throw new Error(`GAI upsert failed for ${story.story_slug}: ${gaiError.message}`);
    gaiCount++;
  }

  console.log(JSON.stringify({ ok: true, pgiCount, pairCount, gaiCount, scanDate: payload.scanDate, scanPeriod: payload.scanPeriod }, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
