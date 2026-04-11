const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

loadSimpleEnv(path.resolve(process.cwd(), '.env.local'));

const scanDate = '2026-04-12';
const scanPeriod = 'am';
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-12-am-scores.json');

const REGION_DISTANCE = {
  'eu|us': 0.2,
  'middle_east|us': 0.9,
  'south_asia|us': 0.6,
  'east_se_asia|us': 0.3,
  'latin_americas|us': 0.5,
  'africa|us': 0.6,
  'east_se_asia|eu': 0.2,
  'middle_east|eu': 0.5,
  'south_asia|eu': 0.4,
  'latin_americas|eu': 0.35,
  'africa|eu': 0.35,
  'east_se_asia|middle_east': 0.4,
  'middle_east|south_asia': 0.4,
  'latin_americas|middle_east': 0.5,
  'africa|middle_east': 0.4,
  'east_se_asia|south_asia': 0.25,
  'latin_americas|south_asia': 0.35,
  'africa|south_asia': 0.3,
  'east_se_asia|latin_americas': 0.35,
  'africa|east_se_asia': 0.4,
  'africa|latin_americas': 0.25,
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
  return sig === 'critical' ? 5 : sig === 'high' ? 4 : sig === 'medium' ? 3 : sig === 'low' ? 2 : 1;
}

const stories = [
  {
    story_headline: 'U.S.-Iran talks begin in Islamabad while the ceasefire holds only shakily',
    category: 'geopolitics',
    significance_label: 'critical',
    regions_found: ['us', 'eu', 'middle_east', 'south_asia', 'east_se_asia'],
    regions_absent: ['africa', 'latin_americas'],
    d1_factual: 5.8,
    d2_causal: 7.7,
    d3_framing: 8.5,
    d4_emotional: 7.4,
    d5_actor_context: 8.4,
    d6_cui_bono: 9.1,
    gai: { d1: 4.5, d2: 6.8, d3: 7.7, d4: 9.4 },
    rationale: 'Most regions agree that talks are real and the ceasefire architecture still exists, but they do not agree on what phase the crisis is in. U.S. and European coverage leans toward verification, sequencing, and diplomatic fragility; Middle East framing stresses coercion, dignity, and whether Washington is bargaining from force; South Asia elevates Pakistan as an active mediator; East/Southeast Asia reads the story through shipping risk and energy stability. The gap is mainly about meaning, trust, and intended beneficiaries rather than contested basic facts.'
  },
  {
    story_headline: 'The Strait of Hormuz is in partial reopening, not full commercial normalisation',
    category: 'economic_flows',
    significance_label: 'critical',
    regions_found: ['us', 'eu', 'middle_east', 'east_se_asia'],
    regions_absent: ['africa', 'latin_americas', 'south_asia'],
    d1_factual: 5.4,
    d2_causal: 6.8,
    d3_framing: 7.6,
    d4_emotional: 6.6,
    d5_actor_context: 7.4,
    d6_cui_bono: 8.5,
    gai: { d1: 5.7, d2: 7.1, d3: 7.9, d4: 9.5 },
    rationale: 'There is broad overlap that the strait is moving from outright disruption toward managed reopening, but the divergence starts with what counts as meaningful recovery. Western and Asian business coverage treats vessel confidence and traffic scale as the truth test; Middle East coverage pays more attention to leverage, military control, and the politics of who gets to declare normalcy. This produces a moderate-high PGI and a high GAI because the consequences are global even though coverage remains concentrated in exposed regions.'
  },
  {
    story_headline: 'Lebanon enters ceasefire-talks language while violence on the ground keeps the track unstable',
    category: 'conflict',
    significance_label: 'critical',
    regions_found: ['us', 'eu', 'middle_east'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 5.3,
    d2_causal: 7.2,
    d3_framing: 8.4,
    d4_emotional: 8.0,
    d5_actor_context: 8.4,
    d6_cui_bono: 8.8,
    gai: { d1: 7.0, d2: 8.0, d3: 8.4, d4: 9.2 },
    rationale: 'The same opening is read in incompatible ways: as evidence diplomacy is spreading, as a tactical move under fire, or as proof that headline de-escalation remains politically hollow while civilians still absorb the cost. Actor portrayal diverges sharply between security-first Western coverage and sovereignty-plus-civilian-harm framing in Middle East coverage. High GAI reflects that a spoiler zone for the wider truce is not being carried deeply into most other regions.'
  },
  {
    story_headline: 'Russia-Ukraine Easter ceasefire window and 175-for-175 prisoner swap create a narrow de-escalation moment',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'east_se_asia'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'middle_east'],
    d1_factual: 5.9,
    d2_causal: 7.0,
    d3_framing: 8.0,
    d4_emotional: 7.1,
    d5_actor_context: 7.9,
    d6_cui_bono: 8.4,
    gai: { d1: 7.0, d2: 7.2, d3: 7.8, d4: 8.8 },
    rationale: 'Most coverage agrees the ceasefire window and swap happened, but diverges immediately on whether this is humanitarian substance, tactical messaging, or temporary optics with no durable negotiating path. Europe carries the strongest scepticism because of proximity and pattern memory; U.S. framing often centres strategic signalling; East/Southeast Asian coverage tends to be more event-led and de-escalation-sensitive. The perception gap is driven by motive attribution rather than by dispute over the events themselves.'
  },
  {
    story_headline: 'Russian oil waiver politics show how Middle East war spillovers are reshaping sanctions logic',
    category: 'geopolitics',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'middle_east'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 5.1,
    d2_causal: 7.4,
    d3_framing: 8.1,
    d4_emotional: 6.6,
    d5_actor_context: 7.7,
    d6_cui_bono: 9.0,
    gai: { d1: 7.0, d2: 7.7, d3: 8.0, d4: 8.9 },
    rationale: 'The story is not yet a clean policy reversal, which keeps factual divergence moderate, but the explanatory gap is wide. U.S. coverage tends to read waivers through price management and tactical flexibility; European coverage reads it through contradiction and sanctions credibility; Middle East framing is more likely to treat it as proof that energy reality outranks moral posture. Cui bono scores highest because each frame points to a different beneficiary and exposes different hypocrisies.'
  },
  {
    story_headline: 'Britain pauses the Chagos sovereignty transfer after U.S. pushback',
    category: 'geopolitics',
    significance_label: 'high',
    regions_found: ['eu', 'us', 'middle_east', 'south_asia'],
    regions_absent: ['africa', 'latin_americas', 'east_se_asia'],
    d1_factual: 4.9,
    d2_causal: 6.4,
    d3_framing: 7.3,
    d4_emotional: 5.9,
    d5_actor_context: 7.5,
    d6_cui_bono: 8.4,
    gai: { d1: 5.7, d2: 7.4, d3: 8.1, d4: 8.6 },
    rationale: 'This is a real policy hold, so facts are relatively stable. The split comes from what the pause signifies: strategic realism around Diego Garcia, neo-colonial inertia, or ordinary alliance management under U.S. pressure. South Asian and some post-colonial framings put sovereignty and precedent higher than Western security framings do. That creates a solid PGI despite relatively low factual disagreement.'
  },
  {
    story_headline: 'Djibouti re-elects Ismail Omar Guelleh with 97.8 percent, reinforcing strategic continuity not change',
    category: 'politics',
    significance_label: 'medium',
    regions_found: ['africa', 'eu'],
    regions_absent: ['us', 'latin_americas', 'south_asia', 'east_se_asia', 'middle_east'],
    d1_factual: 4.5,
    d2_causal: 5.7,
    d3_framing: 6.5,
    d4_emotional: 5.2,
    d5_actor_context: 6.7,
    d6_cui_bono: 7.4,
    gai: { d1: 8.2, d2: 7.2, d3: 8.5, d4: 7.4 },
    rationale: 'The election result itself is not especially disputed. The divergence is over whether this is merely continuity in a strategically located state, evidence of entrenched power, or a stability outcome in a geopolitically sensitive corridor. GAI is high because a strategically important Horn of Africa election barely travels outside directly attentive ecosystems.'
  },
  {
    story_headline: 'Sudanese refugee aid cuts are pushing more than one million people toward a worsening blind-spot crisis',
    category: 'humanitarian',
    significance_label: 'high',
    regions_found: ['africa', 'eu', 'us'],
    regions_absent: ['latin_americas', 'south_asia', 'east_se_asia', 'middle_east'],
    d1_factual: 5.0,
    d2_causal: 6.2,
    d3_framing: 7.0,
    d4_emotional: 7.3,
    d5_actor_context: 6.7,
    d6_cui_bono: 7.7,
    gai: { d1: 7.0, d2: 8.8, d3: 9.3, d4: 9.8 },
    rationale: 'There is little disagreement that the humanitarian squeeze is severe. The real divergence is between lived-survival framing in Africa-focused coverage and donor-logistics or budget-gap framing in Western coverage. GAI is extremely high because the human stakes are enormous while most of the world still receives the story as peripheral, if at all.'
  },
  {
    story_headline: 'Cyclone Vaianu drives evacuation orders in New Zealand and could become the day’s main civil-protection escalation',
    category: 'climate',
    significance_label: 'high',
    regions_found: ['east_se_asia', 'us', 'eu'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'middle_east'],
    d1_factual: 4.6,
    d2_causal: 5.2,
    d3_framing: 6.1,
    d4_emotional: 6.5,
    d5_actor_context: 5.8,
    d6_cui_bono: 6.7,
    gai: { d1: 7.0, d2: 7.5, d3: 8.2, d4: 8.7 },
    rationale: 'Natural-hazard reporting usually has lower factual divergence, and that remains true here. The gap comes from emphasis: local and regional coverage treats evacuation orders and Auckland flood risk as a live systems story, while broader international coverage may register it only as weather context. GAI is high because the event is regionally important but not yet globally salient.'
  },
  {
    story_headline: 'Japan backs Rapidus again, keeping chip industrial policy alive while export-control friction stays unresolved',
    category: 'technology',
    significance_label: 'medium',
    regions_found: ['east_se_asia', 'us', 'eu'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'middle_east'],
    d1_factual: 4.7,
    d2_causal: 6.0,
    d3_framing: 6.9,
    d4_emotional: 5.1,
    d5_actor_context: 6.6,
    d6_cui_bono: 7.8,
    gai: { d1: 7.0, d2: 7.0, d3: 7.9, d4: 7.5 },
    rationale: 'The funding signal itself is fairly clear, so factual divergence stays modest. The gap is interpretive: East Asian coverage reads it as industrial persistence and strategic capacity-building; U.S. coverage often folds it into alliance-side semiconductor competition; European framing is more likely to view it through subsidy races and resilience. High GAI reflects how meaningful industrial-policy shifts still remain mostly trapped inside the tech-power regions.'
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
  return { ...story, story_slug, story_pgi, pair_pgi };
});

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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
    coverage_breadth: story.regions_found.length,
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
  console.log(JSON.stringify({ ok: true, outPath, stories: stories.length, pgiCount: pgiRows.length, gaiCount: gaiRows.length, pairCount: pairRows.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
