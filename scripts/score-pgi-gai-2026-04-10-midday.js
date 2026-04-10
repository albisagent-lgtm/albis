const fs = require('fs');
const path = require('path');

function loadSimpleEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadSimpleEnv(path.resolve(__dirname, '../.env.local'));
const { createClient } = require('@supabase/supabase-js');

function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const scanDate = '2026-04-10';
const scanPeriod = 'midday';
const outPath = path.resolve(__dirname, '../../memory/scans/2026-04-10-midday-scores.json');

const ALL_REGIONS = ['us', 'eu', 'me', 'sa', 'ap', 'la', 'af'];
const REGION_DISTANCE = {
  'me|us': 0.9,
  'me|eu': 0.5,
  'me|ap': 0.4,
  'me|la': 0.5,
  'me|af': 0.4,
  'me|sa': 0.4,
  'us|eu': 0.2,
  'us|ap': 0.4,
  'us|la': 0.5,
  'us|af': 0.6,
  'us|sa': 0.5,
  'eu|ap': 0.3,
  'eu|la': 0.35,
  'eu|af': 0.35,
  'eu|sa': 0.35,
  'ap|la': 0.35,
  'ap|af': 0.4,
  'ap|sa': 0.3,
  'la|af': 0.25,
  'la|sa': 0.25,
  'af|sa': 0.2,
};

function clamp(n, min = 1, max = 10) {
  return Math.max(min, Math.min(max, n));
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function average(values) {
  return round1(values.reduce((a, b) => a + b, 0) / values.length);
}
function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}
function significanceValue(sig) {
  return sig === 'critical' ? 4 : sig === 'high' ? 3 : sig === 'medium' ? 2 : 1;
}

const stories = [
  {
    story_headline: 'U.S.-Iran ceasefire holds formally while Hormuz traffic stays far below normal',
    category: 'current-events',
    significance_label: 'critical',
    regions_found: ['us', 'eu', 'me', 'ap'],
    regions_absent: ['la', 'af', 'sa'],
    d1_factual: 5.9,
    d2_causal: 6.6,
    d3_framing: 7.8,
    d4_emotional: 7.2,
    d5_actor_context: 7.4,
    d6_cui_bono: 7.9,
    gai: { d1: 5.7, d2: 7.2, d3: 7.8, d4: 9.4 },
    rationale: 'Broad agreement that a ceasefire exists, but strong divergence on what counts as implementation: Western coverage stresses maritime normalisation and credibility, Middle East framing emphasises sovereignty, mediation, and scope, and markets coverage treats Hormuz flows as the real truth test. High PGI comes from split causal and strategic framing more than factual disagreement.'
  },
  {
    story_headline: 'Israel authorises direct negotiations with Lebanon while strikes continue',
    category: 'current-events',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'me'],
    regions_absent: ['ap', 'la', 'af', 'sa'],
    d1_factual: 5.3,
    d2_causal: 6.9,
    d3_framing: 8.1,
    d4_emotional: 7.8,
    d5_actor_context: 8.0,
    d6_cui_bono: 8.1,
    gai: { d1: 7.0, d2: 7.8, d3: 8.0, d4: 8.7 },
    rationale: 'The same underlying event is framed either as a meaningful diplomatic opening, a tactical manoeuvre under continued coercion, or proof that force still dominates. Actor portrayal diverges sharply between security-first, sovereignty-first, and truce-fragility lenses.'
  },
  {
    story_headline: 'Dispute grows over whether Lebanon is covered by the wider U.S.-Iran ceasefire',
    category: 'current-events',
    significance_label: 'high',
    regions_found: ['us', 'me'],
    regions_absent: ['eu', 'ap', 'la', 'af', 'sa'],
    d1_factual: 6.8,
    d2_causal: 7.7,
    d3_framing: 8.6,
    d4_emotional: 8.1,
    d5_actor_context: 8.5,
    d6_cui_bono: 8.7,
    gai: { d1: 8.5, d2: 8.4, d3: 8.8, d4: 8.6 },
    rationale: 'This is almost pure scope-and-interpretation conflict. The gap is high because the story is not just about events on the ground but about who gets to define the ceasefire terms, whose statement is authoritative, and whether the architecture is real or rhetorical.'
  },
  {
    story_headline: 'Putin announces a two-day Orthodox Easter ceasefire in Ukraine',
    category: 'current-events',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'ap'],
    regions_absent: ['me', 'la', 'af', 'sa'],
    d1_factual: 5.8,
    d2_causal: 7.0,
    d3_framing: 8.0,
    d4_emotional: 7.4,
    d5_actor_context: 8.1,
    d6_cui_bono: 8.2,
    gai: { d1: 7.0, d2: 7.4, d3: 7.8, d4: 8.4 },
    rationale: 'Most outlets agree the announcement happened; divergence centers on motive. Some frame it as a real pause signal, others as theatre, tactical repositioning, or propaganda. The actor-portrayal and cui-bono dimensions therefore run high.'
  },
  {
    story_headline: 'Serbia\'s NIS seeks another U.S. sanctions waiver to keep crude imports flowing',
    category: 'economic-flows',
    significance_label: 'medium',
    regions_found: ['eu', 'us'],
    regions_absent: ['me', 'ap', 'la', 'af', 'sa'],
    d1_factual: 4.8,
    d2_causal: 5.8,
    d3_framing: 6.9,
    d4_emotional: 5.3,
    d5_actor_context: 6.8,
    d6_cui_bono: 7.4,
    gai: { d1: 8.5, d2: 7.0, d3: 7.2, d4: 6.9 },
    rationale: 'This is more technocratic than the war stories but still shows real framing distance: sanctions compliance, energy security, and geopolitical leverage are emphasised differently depending on whether the lens is Brussels/Washington policy or Balkan economic vulnerability.'
  },
  {
    story_headline: 'Taiwan opposition reconciliation signals toward China coexist with security warnings over chip talent targeting',
    category: 'tech-ai',
    significance_label: 'medium',
    regions_found: ['ap', 'us'],
    regions_absent: ['eu', 'me', 'la', 'af', 'sa'],
    d1_factual: 5.0,
    d2_causal: 6.2,
    d3_framing: 7.3,
    d4_emotional: 6.1,
    d5_actor_context: 7.1,
    d6_cui_bono: 7.7,
    gai: { d1: 8.5, d2: 7.1, d3: 7.9, d4: 7.1 },
    rationale: 'The contrast between reconciliation language and national-security alarms creates a split story. Asia-Pacific coverage reads it through cross-strait political temperature, while U.S.-aligned framing foregrounds technology protection and strategic competition.'
  },
  {
    story_headline: 'World Bank trims Latin America and Caribbean 2026 growth outlook amid global strain',
    category: 'economic-flows',
    significance_label: 'medium',
    regions_found: ['la', 'us', 'eu'],
    regions_absent: ['me', 'ap', 'af', 'sa'],
    d1_factual: 4.2,
    d2_causal: 5.3,
    d3_framing: 6.1,
    d4_emotional: 5.2,
    d5_actor_context: 5.9,
    d6_cui_bono: 6.3,
    gai: { d1: 7.0, d2: 6.8, d3: 7.6, d4: 6.8 },
    rationale: 'Coverage is fairly aligned on the downgrade itself, but causation and who bears responsibility differ: structural weakness, external shocks, borrowing costs, and geopolitical spillover are weighted differently across regional lenses.'
  }
].map((story) => {
  const story_slug = slugify(story.story_headline);
  const story_pgi = average([story.d1_factual, story.d2_causal, story.d3_framing, story.d4_emotional, story.d5_actor_context, story.d6_cui_bono]);
  const pair_pgi = {};
  for (let i = 0; i < story.regions_found.length; i++) {
    for (let j = i + 1; j < story.regions_found.length; j++) {
      const [a, b] = [story.regions_found[i], story.regions_found[j]].sort();
      const key = `${a}|${b}`;
      pair_pgi[key] = round1(clamp(story_pgi + (REGION_DISTANCE[key] ?? 0.3)));
    }
  }
  return {
    ...story,
    story_slug,
    story_pgi,
    pair_pgi,
  };
});

async function main() {
  const supabase = createAdminClient();

  const pgiRows = stories.map((story) => ({
    story_slug: story.story_slug,
    story_headline: story.story_headline,
    category: story.category,
    regions_covered: story.regions_found,
    region_count: story.regions_found.length,
    d1_factual: story.d1_factual,
    d2_causal: story.d2_causal,
    d3_framing: story.d3_framing,
    d4_emotional: story.d4_emotional,
    d5_actor_context: story.d5_actor_context,
    d6_cui_bono: story.d6_cui_bono,
    significance: significanceValue(story.significance_label),
    scoring_rationale: story.rationale,
    scan_date: scanDate,
    scan_period: scanPeriod,
    is_latest: true,
  }));

  const gaiRows = stories.map((story) => ({
    scan_date: scanDate,
    scan_period: scanPeriod,
    story_slug: story.story_slug,
    story_headline: story.story_headline,
    category: story.category,
    regions_found: story.regions_found,
    regions_absent: story.regions_absent,
    coverage_breadth: Math.round(story.gai.d1),
    d1_coverage_breadth: story.gai.d1,
    d2_prominence_disparity: story.gai.d2,
    d3_population_exposure: story.gai.d3,
    d4_significance_severity: story.gai.d4,
    story_gai: average([story.gai.d1, story.gai.d2, story.gai.d3, story.gai.d4]),
    significance: significanceValue(story.significance_label),
    scoring_rationale: story.rationale,
    is_latest: true,
  }));

  const { data: insertedPgi, error: pgiError } = await supabase
    .from('pgi_story_scores')
    .upsert(pgiRows, { onConflict: 'story_slug,scan_date,scan_period', ignoreDuplicates: false })
    .select('id, story_slug');
  if (pgiError) throw pgiError;

  const pgiIdBySlug = new Map((insertedPgi || []).map((row) => [row.story_slug, row.id]));
  const pairStoryIds = Array.from(pgiIdBySlug.values());

  if (pairStoryIds.length) {
    const { error: deletePairError } = await supabase
      .from('pgi_region_pairs')
      .delete()
      .eq('scan_date', scanDate)
      .in('story_score_id', pairStoryIds);
    if (deletePairError) throw deletePairError;
  }

  const pairRows = stories.flatMap((story) => {
    const story_score_id = pgiIdBySlug.get(story.story_slug);
    if (!story_score_id) return [];
    return Object.entries(story.pair_pgi).map(([pairKey, pair_pgi]) => {
      const [region_a, region_b] = pairKey.split('|').sort();
      return { story_score_id, region_a, region_b, pair_pgi, scan_date: scanDate };
    });
  });

  if (pairRows.length) {
    const { error: pairError } = await supabase
      .from('pgi_region_pairs')
      .upsert(pairRows, { onConflict: 'story_score_id,region_a,region_b', ignoreDuplicates: false });
    if (pairError) throw pairError;
  }

  const { error: gaiError } = await supabase
    .from('gai_story_scores')
    .upsert(gaiRows, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });
  if (gaiError) throw gaiError;

  const artifact = {
    scanDate,
    scanPeriod,
    stories: stories.length,
    pgiCount: pgiRows.length,
    pairCount: pairRows.length,
    gaiCount: gaiRows.length,
    scored: stories.map((story) => ({
      story_slug: story.story_slug,
      story_headline: story.story_headline,
      category: story.category,
      significance: story.significance_label,
      story_pgi: story.story_pgi,
      story_gai: average([story.gai.d1, story.gai.d2, story.gai.d3, story.gai.d4]),
      regions_found: story.regions_found,
      regions_absent: story.regions_absent,
      dimensions: {
        d1_factual: story.d1_factual,
        d2_causal: story.d2_causal,
        d3_framing: story.d3_framing,
        d4_emotional: story.d4_emotional,
        d5_actor_context: story.d5_actor_context,
        d6_cui_bono: story.d6_cui_bono,
      },
      gai_dimensions: story.gai,
      pair_pgi: story.pair_pgi,
      scoring_rationale: story.rationale,
    })),
  };

  fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2) + '\n');
  console.log(JSON.stringify({ ok: true, outPath, stories: stories.length, pairCount: pairRows.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
