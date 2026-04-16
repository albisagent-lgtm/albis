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

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const scanDate = '2026-04-16';
const scanPeriod = 'pm';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-16-pm.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-16-pm-scores.json');

const REGION_DISTANCE = {
  'europe|us': 0.2,
  'middle-east|us': 1.0,
  'south-asia|us': 0.6,
  'east-se-asia|us': 0.4,
  'latin-america|us': 0.5,
  'africa|us': 0.6,
  'global|us': 0.3,
  'pacific|us': 0.45,
  'europe|middle-east': 0.6,
  'europe|south-asia': 0.4,
  'east-se-asia|europe': 0.2,
  'europe|latin-america': 0.35,
  'africa|europe': 0.35,
  'europe|global': 0.15,
  'europe|pacific': 0.35,
  'east-se-asia|middle-east': 0.45,
  'middle-east|south-asia': 0.35,
  'latin-america|middle-east': 0.55,
  'africa|middle-east': 0.45,
  'global|middle-east': 0.4,
  'middle-east|pacific': 0.5,
  'east-se-asia|south-asia': 0.25,
  'east-se-asia|latin-america': 0.4,
  'africa|east-se-asia': 0.4,
  'east-se-asia|global': 0.2,
  'east-se-asia|pacific': 0.2,
  'latin-america|south-asia': 0.35,
  'africa|south-asia': 0.3,
  'global|south-asia': 0.25,
  'pacific|south-asia': 0.3,
  'africa|latin-america': 0.25,
  'global|latin-america': 0.25,
  'latin-america|pacific': 0.3,
  'africa|global': 0.3,
  'africa|pacific': 0.35,
  'global|pacific': 0.25,
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
    story_headline: 'US-Iran ceasefire framework holds but extension language is now openly disputed',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'middle-east', 'south-asia', 'europe', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia'],
    d1_factual: 6.1,
    d2_causal: 8.8,
    d3_framing: 9.2,
    d4_emotional: 8.1,
    d5_actor_context: 8.7,
    d6_cui_bono: 9.0,
    gai: { d1: 3.9, d2: 5.8, d3: 5.6, d4: 9.8 },
    rationale: 'All major regions acknowledge that the ceasefire has not collapsed and that mediation is still active, but they disagree sharply on what the contested extension language means. US and much European coverage tend to frame the blockade and pressure campaign as leverage inside a fragile bargaining process; Middle East coverage is more likely to read the same facts as coercion threatening to empty diplomacy of substance; South Asian framing gives more weight to mediation channels and regional diplomatic agency; global wires compress the contradiction into cautious de-escalation language. The gap is driven less by whether talks exist than by whether pressure and diplomacy can still be treated as compatible.'
  },
  {
    story_headline: 'Lebanon ceasefire discussion continues even as strikes keep killing rescue workers',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['middle-east', 'us', 'europe', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 5.8,
    d2_causal: 8.3,
    d3_framing: 8.9,
    d4_emotional: 8.4,
    d5_actor_context: 8.5,
    d6_cui_bono: 8.8,
    gai: { d1: 4.8, d2: 6.6, d3: 6.0, d4: 9.1 },
    rationale: 'The shared factual core is clear: talks are happening, strikes are also continuing, and rescue workers are among the dead. The split comes from what those simultaneous truths signify. Western coverage often treats the diplomacy as a weak but meaningful opening; Middle East reporting gives greater weight to the contradiction between negotiation and ongoing lethal force; US framing is more likely to separate the Lebanon track from the wider Iran file, while regional reporting questions that compartmentalisation. PGI is high because the disagreement is over whether this is real de-escalation, theatre management, or diplomatic cover for continued violence.'
  },
  {
    story_headline: 'Pakistan mediation remains active despite blockade pressure on Iran',
    category: 'diplomacy',
    significance_label: 'high',
    regions_found: ['south-asia', 'middle-east', 'us', 'europe', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 5.3,
    d2_causal: 6.7,
    d3_framing: 6.9,
    d4_emotional: 5.8,
    d5_actor_context: 6.5,
    d6_cui_bono: 6.9,
    gai: { d1: 4.9, d2: 6.0, d3: 5.8, d4: 8.5 },
    rationale: 'Most regions agree that Pakistan remains a meaningful mediation channel, but they do not attach the same weight to it. South Asian coverage is more likely to see the mediation lane as substantive regional agency; US and European reporting often treats it as a possible off-ramp inside a broader pressure strategy; Middle East framing is more alert to the possibility that active coercion can overwhelm diplomacy. The resulting gap is real but lower than the core ceasefire story because the main dispute is not whether mediation exists, but whether it can materially shape the outcome.'
  },
  {
    story_headline: 'Geelong refinery fire deepens Australia fuel-security stress during Gulf shock',
    category: 'energy',
    significance_label: 'high',
    regions_found: ['pacific', 'east-se-asia', 'global'],
    regions_absent: ['us', 'europe', 'africa', 'middle-east', 'south-asia', 'latin-america', 'caribbean', 'central-asia'],
    d1_factual: 3.8,
    d2_causal: 4.4,
    d3_framing: 4.6,
    d4_emotional: 4.0,
    d5_actor_context: 4.3,
    d6_cui_bono: 4.7,
    gai: { d1: 7.0, d2: 7.4, d3: 7.1, d4: 7.8 },
    rationale: 'There is little hard factual dispute here: a refinery fire has become a live fuel-system risk. The divergence is mostly about salience. Pacific coverage treats it as immediate national and regional resilience stress; East and Southeast Asian coverage places it inside wider energy vulnerability; global coverage notices it mainly as one component of a larger shock map. PGI stays low because the story is concrete and not ideologically saturated, but GAI is high because an important infrastructure stress signal is barely visible across much of the world.'
  },
  {
    story_headline: 'China tightens Scarborough Shoal control as US-Philippines drills approach',
    category: 'security',
    significance_label: 'high',
    regions_found: ['east-se-asia', 'us', 'pacific', 'global'],
    regions_absent: ['europe', 'africa', 'middle-east', 'south-asia', 'latin-america', 'caribbean', 'central-asia'],
    d1_factual: 4.5,
    d2_causal: 5.6,
    d3_framing: 6.1,
    d4_emotional: 5.1,
    d5_actor_context: 5.8,
    d6_cui_bono: 6.2,
    gai: { d1: 5.5, d2: 6.2, d3: 6.0, d4: 8.2 },
    rationale: 'The underlying event is widely shared among the regions that cover it, but they do not attach the same strategic meaning to it. US coverage foregrounds deterrence credibility and allied posture; East and Southeast Asian framing is more sensitive to local escalation risk and maritime access; Pacific/global treatment often reads it as a posture signal inside a crowded crisis environment. That makes PGI moderate rather than extreme. GAI remains meaningful because outside the Indo-Pacific security lens, the story receives thinner attention than its strategic importance warrants.'
  },
  {
    story_headline: 'Philippines urges ASEAN fuel-sharing activation as Gulf oil shock spreads',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['east-se-asia', 'middle-east', 'global'],
    regions_absent: ['us', 'europe', 'africa', 'south-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 3.9,
    d2_causal: 4.4,
    d3_framing: 4.6,
    d4_emotional: 4.1,
    d5_actor_context: 4.3,
    d6_cui_bono: 4.7,
    gai: { d1: 7.4, d2: 7.7, d3: 7.5, d4: 8.4 },
    rationale: 'This is a concrete policy-response story rather than a heavily contested narrative battlefield. East and Southeast Asian coverage naturally treats the ASEAN fuel-sharing discussion as a serious systems signal; Middle East framing links it to downstream effects of the Hormuz crisis; global coverage registers it, but often with less urgency than the regional implications justify. That keeps PGI low-moderate. GAI is high because a genuine policy transmission story with regional strategic implications is still under-seen outside the immediate geography.'
  },
  {
    story_headline: 'Singapore keeps tightening as war-driven energy inflation crosses into policy',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['east-se-asia', 'global', 'europe'],
    regions_absent: ['us', 'middle-east', 'africa', 'south-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 3.7,
    d2_causal: 4.2,
    d3_framing: 4.5,
    d4_emotional: 3.9,
    d5_actor_context: 4.4,
    d6_cui_bono: 4.8,
    gai: { d1: 7.5, d2: 7.9, d3: 7.4, d4: 8.3 },
    rationale: 'Regional disagreement is muted because this is a formal policy decision with a clear rationale. East and Southeast Asian coverage naturally gives it greater macro importance as an early signal of war-driven inflation transmission; Europe/global reporting notices it as evidence that the Gulf shock is moving into policy settings beyond the battlefield. PGI remains low because the event is technocratic and clear. GAI is substantially higher because distant but meaningful macro spillover stories are still not receiving the breadth of attention their significance deserves.'
  },
  {
    story_headline: 'Kenya fuel-price surge shows Gulf conflict hitting household costs fast',
    category: 'energy',
    significance_label: 'high',
    regions_found: ['africa', 'middle-east', 'global'],
    regions_absent: ['us', 'europe', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.8,
    d2_causal: 6.1,
    d3_framing: 6.6,
    d4_emotional: 6.2,
    d5_actor_context: 6.4,
    d6_cui_bono: 6.8,
    gai: { d1: 7.6, d2: 7.9, d3: 7.8, d4: 8.7 },
    rationale: 'The hard fact of the fuel-price increase is consistent across the regions that cover it, but the interpretive frame differs. African coverage is more likely to treat it as immediate lived-cost pain with transport and food implications; Middle East framing links it back to the originating regional war shock; global coverage tends to present it as downstream economic fallout. That creates a mid-high PGI. GAI is very high because household-level transmission stories affecting millions are routinely overshadowed by frontline or market narratives.'
  },
  {
    story_headline: 'Sudan-Chad refugee crisis stays under-covered despite new donor pledges',
    category: 'migration',
    significance_label: 'critical',
    regions_found: ['africa', 'europe', 'global'],
    regions_absent: ['us', 'middle-east', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 5.4,
    d2_causal: 6.9,
    d3_framing: 7.6,
    d4_emotional: 7.1,
    d5_actor_context: 7.2,
    d6_cui_bono: 7.7,
    gai: { d1: 8.2, d2: 8.5, d3: 8.2, d4: 9.4 },
    rationale: 'The humanitarian facts are fairly stable, but the moral and political reading is not. African coverage is more likely to frame this as chronic abandonment layered onto a regional survival crisis; European coverage often treats it through donor pressure, pledges and conference language; global coverage recognises the scale but still gives it less narrative weight than the severity warrants. PGI is strong because regions disagree on whether this is a tragic but familiar aid story or a major global failure. GAI is extremely high because a crisis affecting well over a million people remains strikingly under-seen outside the directly engaged zones.'
  },
  {
    story_headline: 'Hungary’s post-Orban transition remains Europe’s clearest governance reset',
    category: 'governance',
    significance_label: 'high',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['africa', 'middle-east', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 5.1,
    d2_causal: 6.8,
    d3_framing: 7.4,
    d4_emotional: 6.2,
    d5_actor_context: 7.3,
    d6_cui_bono: 7.8,
    gai: { d1: 5.9, d2: 7.2, d3: 6.9, d4: 8.6 },
    rationale: 'The result itself is clear, but its meaning is regionally uneven. European coverage sees a structural shift in EU politics, rule-of-law disputes and bloc coordination; US coverage reads it through democratic-backsliding and alliance implications; global coverage recognises the upset but often treats it as a secondary European item. PGI is solidly elevated because the disagreement is about scale and consequences rather than the vote count itself. GAI is also high because much of the world barely tracks the internal European significance.'
  },
  {
    story_headline: 'China cuts pork tariffs on the EU in a selective easing signal',
    category: 'trade',
    significance_label: 'medium',
    regions_found: ['europe', 'east-se-asia', 'global'],
    regions_absent: ['us', 'middle-east', 'africa', 'south-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.2,
    d2_causal: 5.0,
    d3_framing: 5.3,
    d4_emotional: 4.1,
    d5_actor_context: 5.0,
    d6_cui_bono: 5.5,
    gai: { d1: 6.9, d2: 7.2, d3: 6.8, d4: 6.5 },
    rationale: 'This is a selective easing story, so the factual layer is fairly stable. The split is mostly in interpretation: Europe reads possible compartmentalisation and exporter relief; East and Southeast Asian framing is likelier to place it within broader Chinese trade calibration; global coverage treats it as a modest but real de-escalation marker. PGI stays moderate because the disagreement is about strategic meaning, not the event itself. GAI is elevated because constructive trade reversals outside the dominant war narrative are underplayed.'
  },
].map((story) => {
  const story_slug = slugify(story.story_headline);
  const story_pgi = average([
    story.d1_factual,
    story.d2_causal,
    story.d3_framing,
    story.d4_emotional,
    story.d5_actor_context,
    story.d6_cui_bono,
  ]);
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
    story_gai: average([story.gai.d1, story.gai.d2, story.gai.d3, story.gai.d4]),
  };
});

async function main() {
  if (!fs.existsSync(scanPath)) throw new Error(`Scan file not found: ${scanPath}`);

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
    coverage_breadth: story.regions_found.length,
    d1_coverage_breadth: story.gai.d1,
    d2_prominence_disparity: story.gai.d2,
    d3_population_exposure: story.gai.d3,
    d4_significance_severity: story.gai.d4,
    story_gai: story.story_gai,
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

  const topPgi = [...stories].sort((a, b) => b.story_pgi - a.story_pgi)[0];
  const topGai = [...stories].sort((a, b) => b.story_gai - a.story_gai)[0];

  const artifact = {
    ok: true,
    scanFile: scanPath,
    scanDate,
    scanPeriod,
    stories: stories.length,
    pgiCount: pgiRows.length,
    pairCount: pairRows.length,
    gaiCount: gaiRows.length,
    topPgi: {
      story_slug: topPgi.story_slug,
      story_headline: topPgi.story_headline,
      category: topPgi.category,
      regionsFound: topPgi.regions_found,
      regionsAbsent: topPgi.regions_absent,
      significance: significanceValue(topPgi.significance_label),
      pgi: {
        d1_factual: topPgi.d1_factual,
        d2_causal: topPgi.d2_causal,
        d3_framing: topPgi.d3_framing,
        d4_emotional: topPgi.d4_emotional,
        d5_actor_context: topPgi.d5_actor_context,
        d6_cui_bono: topPgi.d6_cui_bono,
        story_pgi: topPgi.story_pgi,
      },
      gai: {
        coverage_breadth: topPgi.regions_found.length,
        d1_coverage_breadth: topPgi.gai.d1,
        d2_prominence_disparity: topPgi.gai.d2,
        d3_population_exposure: topPgi.gai.d3,
        d4_significance_severity: topPgi.gai.d4,
        story_gai: topPgi.story_gai,
      },
      pairScores: topPgi.pair_pgi,
      scoring_rationale: topPgi.rationale,
    },
    topGai: {
      story_slug: topGai.story_slug,
      story_headline: topGai.story_headline,
      category: topGai.category,
      regionsFound: topGai.regions_found,
      regionsAbsent: topGai.regions_absent,
      significance: significanceValue(topGai.significance_label),
      pgi: {
        d1_factual: topGai.d1_factual,
        d2_causal: topGai.d2_causal,
        d3_framing: topGai.d3_framing,
        d4_emotional: topGai.d4_emotional,
        d5_actor_context: topGai.d5_actor_context,
        d6_cui_bono: topGai.d6_cui_bono,
        story_pgi: topGai.story_pgi,
      },
      gai: {
        coverage_breadth: topGai.regions_found.length,
        d1_coverage_breadth: topGai.gai.d1,
        d2_prominence_disparity: topGai.gai.d2,
        d3_population_exposure: topGai.gai.d3,
        d4_significance_severity: topGai.gai.d4,
        story_gai: topGai.story_gai,
      },
      pairScores: topGai.pair_pgi,
      scoring_rationale: topGai.rationale,
    },
    scored: stories.map((story) => ({
      story_slug: story.story_slug,
      story_headline: story.story_headline,
      category: story.category,
      significance: story.significance_label,
      story_pgi: story.story_pgi,
      story_gai: story.story_gai,
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
