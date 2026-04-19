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
const scanPeriod = 'am';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-20-am.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-20-am-scores.json');

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
  'caribbean|latin-america': 0.2,
  'caribbean|us': 0.35,
  'caribbean|global': 0.25,
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
    story_headline: 'U.S.-Iran talks remain contested as Strait of Hormuz access swings between reopening and renewed restrictions',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['latin-america', 'africa', 'east-se-asia', 'central-asia', 'pacific', 'caribbean'],
    d1_factual: 5.2,
    d2_causal: 8.8,
    d3_framing: 9.2,
    d4_emotional: 7.1,
    d5_actor_context: 9.0,
    d6_cui_bono: 9.1,
    gai: { d1: 4.8, d2: 5.9, d3: 5.4, d4: 9.0 },
    rationale: 'This is the clearest high-PGI story in the scan. Regions agree that a talks channel exists and that Hormuz access is moving, but they do not agree on what either change means. US and European framing leans toward leverage, deterrence and market-risk management; Middle East framing is more likely to centre sovereignty, blockade coercion and contested compliance; South Asian coverage gives mediation geography and Pakistan-related diplomacy more agency than Western coverage usually does. That keeps factual divergence moderate, but pushes causal, narrative, actor-portrayal and cui-bono gaps very high.'
  },
  {
    story_headline: 'Lebanon ceasefire appears to hold as temporary restoration work begins, but expiry risk remains high',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'global'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 3.9,
    d2_causal: 6.4,
    d3_framing: 7.0,
    d4_emotional: 7.1,
    d5_actor_context: 6.8,
    d6_cui_bono: 6.6,
    gai: { d1: 6.0, d2: 5.4, d3: 6.2, d4: 8.4 },
    rationale: 'The core fact of a ceasefire holding is comparatively stable, which keeps factual divergence lower than in the Iran-Hormuz story. The gap opens around durability, blame and what counts as meaningful de-escalation. Middle East coverage is likelier to foreground fragility, violation risk and asymmetry, while Western coverage more readily treats restoration work as evidence that a political bridge still exists. So this lands as a solid mid-high PGI story rather than an extreme one, with elevated GAI because many regions still barely engage it.'
  },
  {
    story_headline: 'DRC government and rebels move toward aid-convoy access, civilian protections, and ceasefire oversight',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['africa', 'europe', 'us', 'global'],
    regions_absent: ['middle-east', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 4.3,
    d2_causal: 5.8,
    d3_framing: 6.0,
    d4_emotional: 5.6,
    d5_actor_context: 5.9,
    d6_cui_bono: 5.7,
    gai: { d1: 6.0, d2: 5.1, d3: 6.7, d4: 8.5 },
    rationale: 'This is a real de-escalation marker, but it is not producing the same interpretive fracture as Middle East stories. The basic facts are fairly stable across Reuters-style and regional coverage. The main difference is emphasis: African framing is more likely to centre civilian protection, humanitarian access and implementation risk on the ground, while US, European and global wire framing can present it more as diplomatic process progress. PGI is therefore moderate, but GAI is high because a meaningful African conflict-state change is still absent from much of the wider world.'
  },
  {
    story_headline: 'Pro-Russian former president leads in Bulgaria election exit polls',
    category: 'governance',
    significance_label: 'high',
    regions_found: ['europe', 'global', 'us'],
    regions_absent: ['middle-east', 'africa', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 4.6,
    d2_causal: 7.0,
    d3_framing: 7.8,
    d4_emotional: 5.8,
    d5_actor_context: 7.6,
    d6_cui_bono: 7.4,
    gai: { d1: 7.0, d2: 6.6, d3: 7.1, d4: 8.5 },
    rationale: 'Exit polls themselves are concrete, but the meaning of the result differs sharply. European coverage is more likely to read the story through intra-EU balance, NATO cohesion and Ukraine policy implications, while US/global framing can flatten it into another pro-Russia signal or democratic-process storyline. That creates a high interpretive gap despite relatively stable facts. GAI is also high because a potentially consequential EU/NATO policy-vector story is mostly invisible outside Europe-centric attention zones.'
  },
  {
    story_headline: 'IMF and World Bank meetings expose limits of the global system’s ability to absorb repeated geopolitical shocks',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'global', 'middle-east'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 3.5,
    d2_causal: 4.7,
    d3_framing: 5.0,
    d4_emotional: 4.0,
    d5_actor_context: 4.6,
    d6_cui_bono: 4.4,
    gai: { d1: 6.0, d2: 4.8, d3: 6.4, d4: 8.3 },
    rationale: 'Institutional macro stories usually produce less narrative fracture than active conflict stories, and that holds here. Most regions that cover it accept the basic premise: multilateral institutions are admitting thinner shock-absorption capacity. The gap is mostly about emphasis—markets, governance bandwidth, vulnerable states or conflict spillover. PGI is therefore low-to-moderate. But GAI is meaningfully elevated because a system-level story with worldwide implications is not actually being covered with worldwide breadth.'
  },
  {
    story_headline: 'Kenya seeks emergency World Bank funds to cushion Iran-war economic shocks',
    category: 'economic-flows',
    significance_label: 'medium',
    regions_found: ['africa', 'global', 'us'],
    regions_absent: ['europe', 'middle-east', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 3.6,
    d2_causal: 4.4,
    d3_framing: 4.7,
    d4_emotional: 4.2,
    d5_actor_context: 4.5,
    d6_cui_bono: 4.3,
    gai: { d1: 7.0, d2: 5.0, d3: 7.3, d4: 7.8 },
    rationale: 'There is not a huge framing split over the fact of Kenya requesting emergency support. The real signal is that the conflict’s spillover has crossed into administrative reality in Africa. That keeps PGI relatively low. But GAI is high because a non-belligerent state formally moving for emergency cushioning should be more globally visible than it is, especially given its relevance to inflation, fiscal stress and imported-energy vulnerability across the Global South.'
  },
  {
    story_headline: 'IMF says Middle East war will deepen the economic divide in Latin America and the Caribbean',
    category: 'economic-flows',
    significance_label: 'medium',
    regions_found: ['latin-america', 'caribbean', 'global', 'us'],
    regions_absent: ['europe', 'middle-east', 'africa', 'south-asia', 'east-se-asia', 'central-asia', 'pacific'],
    d1_factual: 3.8,
    d2_causal: 4.9,
    d3_framing: 5.3,
    d4_emotional: 4.4,
    d5_actor_context: 4.8,
    d6_cui_bono: 4.9,
    gai: { d1: 6.0, d2: 5.3, d3: 6.9, d4: 7.7 },
    rationale: 'This is another spillover story where the main gap is not fierce narrative conflict but unequal visibility. Regions that cover it mostly agree on the core claim: the war is widening economic divergence through transport, energy and financing channels. The interpretive split is modest and mostly about which vulnerable countries are centred. PGI stays moderate-low, while GAI is high because the significance extends far beyond the regions that are actually naming the effect.'
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
