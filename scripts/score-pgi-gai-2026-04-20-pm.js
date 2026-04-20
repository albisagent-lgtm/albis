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

const scanDate = '2026-04-20';
const scanPeriod = 'pm';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-20-pm.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-20-pm-scores.json');

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
    story_headline: 'US-Iran ceasefire framework under visible strain after cargo-ship seizure',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['latin-america', 'caribbean', 'pacific', 'central-asia', 'africa', 'east-se-asia'],
    d1_factual: 5.4,
    d2_causal: 8.9,
    d3_framing: 9.3,
    d4_emotional: 7.8,
    d5_actor_context: 9.0,
    d6_cui_bono: 9.1,
    gai: { d1: 4.6, d2: 5.8, d3: 5.5, d4: 9.2 },
    rationale: 'The factual spine is broadly shared: the cargo ship was seized, retaliation was threatened, and the talks channel looks shakier. The gap opens over meaning. US and much European coverage frame the seizure through pressure, enforcement and bargaining leverage; Middle East framing is far more likely to treat it as proof that the ceasefire architecture is coercive and unstable; South Asian reporting gives more weight to mediation calendars, regional diplomatic spillover and the practical consequences for shipping. That keeps factual divergence moderate but pushes causal attribution, narrative framing, actor portrayal and cui bono very high.'
  },
  {
    story_headline: 'Strait of Hormuz reopening remains unresolved; practical de-escalation has not landed',
    category: 'economic-flows',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'east-se-asia', 'africa', 'global'],
    regions_absent: ['caribbean', 'latin-america', 'pacific', 'central-asia'],
    d1_factual: 4.7,
    d2_causal: 6.6,
    d3_framing: 6.8,
    d4_emotional: 5.6,
    d5_actor_context: 6.4,
    d6_cui_bono: 6.3,
    gai: { d1: 2.9, d2: 4.2, d3: 4.1, d4: 9.5 },
    rationale: 'Most regions agree the practical reopening has not stabilized, which keeps factual divergence below the top-tier Iran diplomacy story. The real split is over what the instability signifies: a temporary tactical standoff, a failed de-escalation test, or an intentional choke-point strategy. Middle East and South Asian framing often centres coercion and sovereignty, while Western and global market-oriented coverage can flatten the story into maritime risk and price exposure. PGI is elevated but not extreme because the event itself is concrete even as its strategic interpretation still varies.'
  },
  {
    story_headline: 'Eastern DRC talks produce concrete protocol progress on aid access and ceasefire oversight',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['africa', 'europe', 'us', 'global'],
    regions_absent: ['latin-america', 'caribbean', 'pacific', 'central-asia', 'middle-east', 'south-asia', 'east-se-asia'],
    d1_factual: 4.2,
    d2_causal: 5.6,
    d3_framing: 5.8,
    d4_emotional: 5.0,
    d5_actor_context: 5.7,
    d6_cui_bono: 5.6,
    gai: { d1: 6.0, d2: 5.1, d3: 6.9, d4: 8.8 },
    rationale: 'There is real protocol-level progress here, and the factual picture is relatively stable across the coverage that exists. The difference is emphasis. African framing is more likely to centre civilian protection, implementation risk and whether aid access will actually materialise on the ground; US, European and global wire framing often present it more as diplomatic process progress. That produces a moderate PGI rather than a sharp fracture. GAI is stronger because a meaningful de-escalation movement in a major African conflict is still invisible across much of the world.'
  },
  {
    story_headline: 'US renews waiver for some at-sea purchases of sanctioned Russian oil',
    category: 'sanctions',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'global'],
    regions_absent: ['pacific', 'caribbean', 'africa', 'middle-east', 'south-asia', 'east-se-asia', 'latin-america', 'central-asia'],
    d1_factual: 4.8,
    d2_causal: 6.7,
    d3_framing: 7.3,
    d4_emotional: 5.9,
    d5_actor_context: 7.0,
    d6_cui_bono: 7.2,
    gai: { d1: 7.0, d2: 6.1, d3: 7.0, d4: 8.0 },
    rationale: 'The waiver itself is straightforward, but its meaning is not. US coverage can frame it as narrow operational flexibility, while European coverage is more likely to read it through sanctions integrity, alliance coherence and the optics of selective easing during the Ukraine war. Global treatment often reduces it to a trade-flow adjustment. That pushes framing, actor portrayal and cui bono noticeably higher than the factual layer. GAI is high because a sanctions implementation shift with real geopolitical consequences still sits mostly inside Western attention zones.'
  },
  {
    story_headline: 'Kenya seeks emergency World Bank support to absorb Iran-war shock',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['africa', 'global'],
    regions_absent: ['latin-america', 'caribbean', 'pacific', 'central-asia', 'us', 'europe', 'middle-east', 'south-asia', 'east-se-asia'],
    d1_factual: 3.8,
    d2_causal: 4.7,
    d3_framing: 4.9,
    d4_emotional: 4.4,
    d5_actor_context: 4.6,
    d6_cui_bono: 4.8,
    gai: { d1: 8.0, d2: 5.8, d3: 7.8, d4: 8.5 },
    rationale: 'There is not a major narrative war over the fact of Kenya seeking emergency support. The signal is its existence: the conflict has crossed into sovereign financial stress for a non-belligerent African economy. African framing naturally treats this as lived macro vulnerability; global framing tends to register it as spillover. PGI remains low-to-moderate because the event is administrative and clear. GAI is high because a formal emergency support request tied to a major war shock should be much more globally visible than it is.'
  },
  {
    story_headline: 'Bangladesh raises fuel prices as war-linked costs climb',
    category: 'economic',
    significance_label: 'medium',
    regions_found: ['south-asia', 'global'],
    regions_absent: ['latin-america', 'caribbean', 'pacific', 'central-asia', 'us', 'europe', 'middle-east', 'africa', 'east-se-asia'],
    d1_factual: 3.6,
    d2_causal: 4.3,
    d3_framing: 4.5,
    d4_emotional: 4.1,
    d5_actor_context: 4.3,
    d6_cui_bono: 4.5,
    gai: { d1: 8.0, d2: 6.0, d3: 7.9, d4: 7.6 },
    rationale: 'This is an early transmission story: conflict-linked shipping, insurance and import costs are turning into domestic fuel policy. South Asian coverage is likelier to treat the move as immediate household and political pressure; global reporting usually places it under the broader inflation fallout bucket. That keeps PGI relatively low because the causal chain is concrete. But GAI is high: a major population centre absorbing war spillover through official price changes should be far more visible than it is.'
  },
  {
    story_headline: 'IMF downgrade remains the macro backdrop as war shock hardens into forecast reality',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'africa', 'south-asia', 'global'],
    regions_absent: ['caribbean', 'latin-america', 'pacific', 'central-asia', 'east-se-asia'],
    d1_factual: 3.5,
    d2_causal: 4.2,
    d3_framing: 4.4,
    d4_emotional: 3.8,
    d5_actor_context: 4.1,
    d6_cui_bono: 4.0,
    gai: { d1: 4.0, d2: 4.7, d3: 5.0, d4: 8.6 },
    rationale: 'Institutional macro stories usually produce less narrative fracture than live conflict stories, and that pattern holds here. Most regions that cover it accept the basic claim: the war shock is now embedded in official growth expectations. The variation is mainly about emphasis — markets, vulnerable importers, multilateral credibility or regional exposure. PGI therefore stays low. GAI is moderate rather than extreme because the story has broad coverage, but even then the significance of an IMF baseline revision still outstrips the depth of public attention it receives.'
  },
  {
    story_headline: 'Wellington flood cleanup begins after flash flooding hits New Zealand’s North Island',
    category: 'climate',
    significance_label: 'low',
    regions_found: ['pacific', 'global'],
    regions_absent: ['latin-america', 'caribbean', 'central-asia', 'us', 'europe', 'middle-east', 'africa', 'south-asia', 'east-se-asia'],
    d1_factual: 2.1,
    d2_causal: 2.2,
    d3_framing: 2.3,
    d4_emotional: 2.0,
    d5_actor_context: 2.1,
    d6_cui_bono: 2.0,
    gai: { d1: 8.0, d2: 5.0, d3: 7.8, d4: 4.5 },
    rationale: 'There is very little interpretive divergence here. The story is a local climate-disaster response event, and the regions that cover it mostly agree on what happened and what kind of story it is. PGI is therefore very low. GAI is still high-ish because the coverage footprint is narrow, but the significance dimension is lower than the geopolitics and economic-shock stories above, which keeps the overall GAI below true attention-desert territory.'
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

  const artifact = {
    ok: true,
    scanFile: scanPath,
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
