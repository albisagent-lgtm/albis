const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file) {
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function average(values) {
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function significanceNum(sig) {
  return sig === 'critical' ? 4 : sig === 'high' ? 3 : sig === 'medium' ? 2 : 1;
}

loadEnv(path.join(__dirname, '..', '.env.local'));
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const scanDate = '2026-04-21';
const scanPeriod = 'am';
const outPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-21-am-scores.json';

const scored = [
  {
    story_slug: 'u-s-iran-ceasefire-enters-a-more-dangerous-but-still-negotiable-phase',
    story_headline: 'U.S.-Iran ceasefire enters a more dangerous but still negotiable phase',
    category: 'diplomacy',
    significance: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia'],
    dimensions: {
      d1_factual: 5.4,
      d2_causal: 8.9,
      d3_framing: 9.2,
      d4_emotional: 7.7,
      d5_actor_context: 9.0,
      d6_cui_bono: 9.1,
    },
    gai_dimensions: { d1: 4.6, d2: 5.8, d3: 5.5, d4: 9.4 },
    pair_pgi: {
      'europe|us': 8.4,
      'middle-east|us': 9.3,
      'south-asia|us': 8.8,
      'global|us': 8.5,
      'europe|middle-east': 8.9,
      'europe|south-asia': 8.4,
      'europe|global': 8.2,
      'middle-east|south-asia': 8.6,
      'global|middle-east': 8.5,
      'global|south-asia': 8.2,
    },
    scoring_rationale: 'This is the scan’s clearest high-PGI story. Regions broadly agree on the ceasefire deadline, the Islamabad talks track, and the vessel seizure, but diverge sharply on agency and meaning. US and European framing leans toward leverage, compliance, and market-risk management; Middle East coverage is more likely to stress sovereignty, coercion, and distrust; South Asian coverage gives Pakistan’s mediation role more weight than Western coverage. That keeps factual divergence moderate, but pushes causal, narrative, actor-portrayal, and cui-bono divergence very high. GAI stays elevated rather than extreme because the story is widely noticed in core geopolitical regions, but large parts of the world still leave it as background noise despite its systemic significance.'
  },
  {
    story_slug: 'strait-of-hormuz-status-remains-unstable-reopening-headlines-were-premature',
    story_headline: 'Strait of Hormuz status remains unstable; reopening headlines were premature',
    category: 'infrastructure',
    significance: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: {
      d1_factual: 5.7,
      d2_causal: 8.6,
      d3_framing: 9.0,
      d4_emotional: 7.2,
      d5_actor_context: 8.8,
      d6_cui_bono: 8.9,
    },
    gai_dimensions: { d1: 4.4, d2: 5.7, d3: 5.6, d4: 9.3 },
    pair_pgi: {
      'europe|us': 8.2,
      'middle-east|us': 9.0,
      'south-asia|us': 8.5,
      'global|us': 8.3,
      'europe|middle-east': 8.7,
      'europe|south-asia': 8.2,
      'europe|global': 8.0,
      'middle-east|south-asia': 8.4,
      'global|middle-east': 8.4,
      'global|south-asia': 8.1,
    },
    scoring_rationale: 'Hormuz is a chokepoint story, so small wording differences create large perception gaps. Most regions agree that traffic has not cleanly normalised, but they do not frame the corridor the same way: Western outlets tend to emphasise insurance, throughput and market restoration; Middle East framing more readily centres blockade pressure, coercion and contested control; South Asian coverage gives shipping reality and regional diplomacy more texture. Because the binary “open/closed” frame itself is misleading, the narrative and actor-context gaps are especially wide. GAI is moderately high because the story is globally consequential yet still absent or thinly handled across many regions outside the immediate energy-security conversation.'
  },
  {
    story_slug: 'oil-price-action-reflects-de-escalation-hope-but-supply-risk-is-still-unresolved',
    story_headline: 'Oil price action reflects de-escalation hope, but supply risk is still unresolved',
    category: 'energy',
    significance: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'pacific'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'central-asia', 'south-asia', 'east-se-asia'],
    dimensions: {
      d1_factual: 3.8,
      d2_causal: 5.5,
      d3_framing: 6.1,
      d4_emotional: 4.4,
      d5_actor_context: 5.1,
      d6_cui_bono: 5.4,
    },
    gai_dimensions: { d1: 5.5, d2: 5.0, d3: 6.1, d4: 8.4 },
    pair_pgi: {
      'europe|us': 5.2,
      'middle-east|us': 6.0,
      'pacific|us': 5.1,
      'europe|middle-east': 5.8,
      'europe|pacific': 4.9,
      'middle-east|pacific': 5.6,
    },
    scoring_rationale: 'This is more consensus-driven than the ceasefire and Hormuz stories because price action is a shared observable. The real gap lies in interpretation: Western business coverage tends to reward de-escalation headlines immediately, while regional and shipping-aware coverage is more sceptical because physical flows, tanker positioning and insurer confidence lag the headline. That produces only a moderate PGI. GAI is higher because energy-price stories reach many audiences indirectly while the underlying supply-risk nuance remains missing in large regions, creating a blind spot between market reaction and logistical reality.'
  },
  {
    story_slug: 'lebanon-opens-an-official-negotiation-channel-with-israel',
    story_headline: 'Lebanon opens an official negotiation channel with Israel',
    category: 'diplomacy',
    significance: 'high',
    regions_found: ['middle-east', 'south-asia', 'global'],
    regions_absent: ['us', 'europe', 'africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia'],
    dimensions: {
      d1_factual: 4.2,
      d2_causal: 6.8,
      d3_framing: 7.6,
      d4_emotional: 7.0,
      d5_actor_context: 7.4,
      d6_cui_bono: 7.2,
    },
    gai_dimensions: { d1: 7.0, d2: 5.7, d3: 7.0, d4: 8.7 },
    pair_pgi: {
      'middle-east|south-asia': 7.4,
      'global|middle-east': 7.2,
      'global|south-asia': 6.7,
    },
    scoring_rationale: 'The factual claim here is comparatively stable: Lebanon has named an official delegation channel. The gap opens on what that institutional move means. Middle East coverage is more likely to read it through fragility, temporary ceasefire conditions, Hezbollah constraints, and asymmetry on the ground; global wire treatment can make it look like a cleaner diplomatic breakthrough; South Asian coverage often sits somewhere between those two poles. PGI is therefore solidly high but not extreme. GAI is higher still because a meaningful de-escalation architecture story is surprisingly under-covered outside the directly affected region.'
  },
  {
    story_slug: 'russian-oil-sanctions-enforcement-appears-to-soften-via-u-s-waiver',
    story_headline: 'Russian oil sanctions enforcement appears to soften via U.S. waiver',
    category: 'sanctions',
    significance: 'high',
    regions_found: ['europe', 'global'],
    regions_absent: ['us', 'middle-east', 'africa', 'latin-america', 'pacific', 'caribbean', 'south-asia', 'east-se-asia', 'central-asia'],
    dimensions: {
      d1_factual: 4.6,
      d2_causal: 6.3,
      d3_framing: 7.1,
      d4_emotional: 4.8,
      d5_actor_context: 6.9,
      d6_cui_bono: 7.0,
    },
    gai_dimensions: { d1: 7.8, d2: 6.5, d3: 7.6, d4: 8.5 },
    pair_pgi: {
      'europe|global': 6.4,
    },
    scoring_rationale: 'This is a mixed-signal sanctions story: the core policy move is clear, but its meaning is not. European framing is more likely to read the waiver through enforcement credibility, Russian revenue, and the politics of allied firmness; global wire framing is more likely to present it as a market-relief or policy-adjustment story. That gives it a moderate-to-high PGI despite limited regional spread. GAI is notably high because an energy-sanctions enforcement shift with clear implications for Europe, Russia, and wider oil markets barely registers outside a narrow attention zone.'
  },
  {
    story_slug: 'mexico-and-spain-move-to-repair-relations',
    story_headline: 'Mexico and Spain move to repair relations',
    category: 'diplomacy',
    significance: 'medium',
    regions_found: ['europe', 'latin-america'],
    regions_absent: ['us', 'middle-east', 'africa', 'pacific', 'caribbean', 'south-asia', 'east-se-asia', 'central-asia', 'global'],
    dimensions: {
      d1_factual: 2.7,
      d2_causal: 3.4,
      d3_framing: 3.9,
      d4_emotional: 3.0,
      d5_actor_context: 3.5,
      d6_cui_bono: 3.6,
    },
    gai_dimensions: { d1: 7.6, d2: 5.8, d3: 6.8, d4: 6.7 },
    pair_pgi: {
      'europe|latin-america': 3.5,
    },
    scoring_rationale: 'This is a relatively low-PGI story because the basic frame is broadly shared: a bilateral thaw after years of chill. Europe and Latin America may differ in emphasis — symbolism, summit politics, investment, or post-colonial undertones — but not enough to create a deep narrative fracture. The more interesting score is GAI: it is a meaningful diplomatic normalisation story that remains almost entirely localised in attention, making it easy for other regions to miss despite its real bloc-coordination implications.'
  },
  {
    story_slug: 'africa-watch-fiscal-transparency-fuel-pressure-and-sovereignty-signalling-dominate-more-than-outright-rupture',
    story_headline: 'Africa watch: fiscal transparency, fuel pressure, and sovereignty signalling dominate more than outright rupture',
    category: 'governance',
    significance: 'medium',
    regions_found: ['africa', 'global'],
    regions_absent: ['us', 'europe', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'south-asia', 'east-se-asia', 'central-asia'],
    dimensions: {
      d1_factual: 3.5,
      d2_causal: 4.2,
      d3_framing: 5.0,
      d4_emotional: 4.1,
      d5_actor_context: 4.8,
      d6_cui_bono: 4.6,
    },
    gai_dimensions: { d1: 7.9, d2: 6.0, d3: 7.8, d4: 6.8 },
    pair_pgi: {
      'africa|global': 4.4,
    },
    scoring_rationale: 'This is less a single hard event than a regional signal cluster, which keeps PGI modest. African coverage is more grounded in legitimacy, cost-of-living pressure, petroleum revenue politics, and sovereignty language, while global framing often compresses those realities into a generic governance watch item. That creates some framing distance, but not the kind of sharp factual or causal split seen in active conflict diplomacy. GAI is the stronger signal here: stories that matter materially to African political economy remain chronically under-seen elsewhere unless they erupt into crisis.'
  }
];

for (const story of scored) {
  story.story_pgi = average(Object.values(story.dimensions));
  story.story_gai = average(Object.values(story.gai_dimensions));
  story.coverage_breadth = story.regions_found.length;
}

async function main() {
  const pgiRows = scored.map((story) => ({
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
    significance: significanceNum(story.significance),
    scoring_rationale: story.scoring_rationale,
    scan_date: scanDate,
    scan_period: scanPeriod,
    is_latest: true,
  }));

  const gaiRows = scored.map((story) => ({
    scan_date: scanDate,
    scan_period: scanPeriod,
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
    story_gai: story.story_gai,
    significance: significanceNum(story.significance),
    scoring_rationale: story.scoring_rationale,
    is_latest: true,
  }));

  const { data: insertedPgi, error: pgiError } = await supabase
    .from('pgi_story_scores')
    .upsert(pgiRows, { onConflict: 'story_slug,scan_date,scan_period', ignoreDuplicates: false })
    .select('id, story_slug');
  if (pgiError) throw pgiError;

  const pgiIdBySlug = new Map((insertedPgi || []).map((row) => [row.story_slug, row.id]));
  const ids = Array.from(pgiIdBySlug.values());
  if (ids.length) {
    const { error: deletePairError } = await supabase
      .from('pgi_region_pairs')
      .delete()
      .eq('scan_date', scanDate)
      .in('story_score_id', ids);
    if (deletePairError) throw deletePairError;
  }

  const pairRows = scored.flatMap((story) => {
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

  const output = {
    ok: true,
    scanFile: '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-21-am.md',
    scanDate,
    scanPeriod,
    stories: scored.length,
    pgiCount: pgiRows.length,
    pairCount: pairRows.length,
    gaiCount: gaiRows.length,
    scored,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({ ok: true, outPath, stories: scored.length, pairCount: pairRows.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
