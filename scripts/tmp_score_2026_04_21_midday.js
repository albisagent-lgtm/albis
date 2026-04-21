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
    process.env[key] = value;
  }
}

function average(values) {
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function significanceNum(sig) {
  return sig === 'critical' ? 4 : sig === 'high' ? 3 : sig === 'medium' ? 2 : 1;
}

loadEnv(path.join(__dirname, '..', '.env.local'));
loadEnv(path.join(__dirname, '..', '..', '.env.credentials'));
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const scanDate = '2026-04-21';
const scanPeriod = 'midday';
const outPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-21-midday-scores.json';

const scored = [
  {
    story_slug: 'u-s-iran-ceasefire-hangs-in-the-balance-as-pakistan-mediation-stays-alive',
    story_headline: 'U.S.-Iran ceasefire hangs in the balance as Pakistan mediation stays alive',
    category: 'conflict',
    significance: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'east-se-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: {
      d1_factual: 5.5,
      d2_causal: 8.9,
      d3_framing: 9.3,
      d4_emotional: 7.8,
      d5_actor_context: 9.1,
      d6_cui_bono: 9.0,
    },
    gai_dimensions: { d1: 4.0, d2: 5.2, d3: 5.0, d4: 9.3 },
    pair_pgi: {
      'europe|us': 8.4,
      'middle-east|us': 9.3,
      'south-asia|us': 8.8,
      'east-se-asia|us': 8.5,
      'global|us': 8.4,
      'europe|middle-east': 8.9,
      'europe|south-asia': 8.6,
      'east-se-asia|europe': 8.2,
      'europe|global': 8.3,
      'middle-east|south-asia': 8.7,
      'east-se-asia|middle-east': 8.5,
      'global|middle-east': 8.6,
      'east-se-asia|south-asia': 8.1,
      'global|south-asia': 8.3,
      'east-se-asia|global': 8.0,
    },
    scoring_rationale: 'This is the midday scan’s clearest high-PGI story because the factual core is shared but the interpretive architecture diverges sharply. US and European coverage is deadline- and deterrence-driven, with emphasis on whether Washington extends the ceasefire and how markets price renewed risk. Middle East framing is more likely to foreground coercion, sovereignty, and whether talks are a genuine off-ramp or a pressure tactic. South Asian coverage gives Pakistan’s mediator role more agency than Western coverage, while East Asian coverage tends to compress the story into shipping and energy-risk calculations. That keeps factual divergence moderate but makes causal, narrative, actor-portrayal, and cui-bono divergence extremely high. GAI is only mid-level because the story is widely visible in the main geopolitical regions even though large parts of the world still underweight its systemic significance.'
  },
  {
    story_slug: 'imf-cuts-2026-global-growth-outlook-as-iran-war-shock-lifts-inflation-risk',
    story_headline: 'IMF cuts 2026 global growth outlook as Iran war shock lifts inflation risk',
    category: 'economic',
    significance: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'africa', 'south-asia', 'east-se-asia', 'latin-america', 'global'],
    regions_absent: ['pacific', 'caribbean', 'central-asia'],
    dimensions: {
      d1_factual: 3.9,
      d2_causal: 5.0,
      d3_framing: 5.2,
      d4_emotional: 4.3,
      d5_actor_context: 4.9,
      d6_cui_bono: 5.0,
    },
    gai_dimensions: { d1: 2.5, d2: 3.6, d3: 3.2, d4: 8.3 },
    pair_pgi: {
      'europe|us': 4.8,
      'middle-east|us': 5.5,
      'africa|us': 5.0,
      'south-asia|us': 5.1,
      'east-se-asia|us': 4.9,
      'latin-america|us': 4.8,
      'global|us': 4.7,
      'europe|middle-east': 5.1,
      'africa|europe': 4.8,
      'europe|south-asia': 4.9,
      'east-se-asia|europe': 4.7,
      'europe|latin-america': 4.6,
      'europe|global': 4.6,
      'africa|middle-east': 5.0,
      'middle-east|south-asia': 5.1,
      'east-se-asia|middle-east': 5.0,
      'latin-america|middle-east': 4.9,
      'global|middle-east': 4.9,
      'africa|south-asia': 4.8,
      'africa|east-se-asia': 4.7,
      'africa|latin-america': 4.6,
      'africa|global': 4.6,
      'east-se-asia|south-asia': 4.8,
      'latin-america|south-asia': 4.7,
      'global|south-asia': 4.6,
      'east-se-asia|latin-america': 4.5,
      'east-se-asia|global': 4.5,
      'global|latin-america': 4.4,
    },
    scoring_rationale: 'This is a relatively low-PGI story by comparison because the IMF revision acts as a common factual anchor across regions. The disagreement is mostly about emphasis rather than competing realities: some coverage treats the downgrade as proof that the war is now a macroeconomic systems event, while other outlets frame it as one more data point in an already weak global cycle. Poorer import-dependent regions have more reason to stress food, fuel, and budget pain than large-economy market coverage does, but the underlying institutional signal is broadly shared. GAI is low-to-moderate because coverage breadth is strong across most major regions, though the Pacific and smaller attention systems still barely register it.'
  },
  {
    story_slug: 'gaza-diplomacy-shows-a-real-if-limited-de-escalation-signal',
    story_headline: 'Gaza diplomacy shows a real, if limited, de-escalation signal',
    category: 'diplomacy',
    significance: 'high',
    regions_found: ['middle-east', 'europe', 'us', 'global'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: {
      d1_factual: 4.8,
      d2_causal: 7.2,
      d3_framing: 7.9,
      d4_emotional: 7.1,
      d5_actor_context: 7.8,
      d6_cui_bono: 7.6,
    },
    gai_dimensions: { d1: 6.5, d2: 5.3, d3: 6.6, d4: 8.5 },
    pair_pgi: {
      'middle-east|us': 8.0,
      'europe|us': 7.2,
      'global|us': 7.1,
      'europe|middle-east': 7.8,
      'global|middle-east': 7.5,
      'europe|global': 7.0,
    },
    scoring_rationale: 'The factual proposition is simple enough — there is a live diplomatic track around disarmament and guarded optimism from the envoy — but the meaning of that track differs sharply by region. Middle East coverage is more likely to weigh sovereignty, enforceability, humanitarian access, and whether disarmament language masks coercive asymmetry. US and some European coverage more readily frame the item through security architecture and whether Hamas can be neutralised as a military actor. Global wire framing can flatten the uncertainty into a generic peace-process update. That produces a high PGI, though not as extreme as the US-Iran file because the event itself is narrower. GAI is high because this is a real de-escalation signal that risks being buried under the larger Iran story.'
  },
  {
    story_slug: 'pakistan-freezes-1-5bn-sudan-weapons-deal-after-saudi-objection',
    story_headline: 'Pakistan freezes $1.5bn Sudan weapons deal after Saudi objection',
    category: 'security',
    significance: 'high',
    regions_found: ['africa', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['us', 'europe', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: {
      d1_factual: 4.5,
      d2_causal: 6.6,
      d3_framing: 7.3,
      d4_emotional: 5.9,
      d5_actor_context: 7.2,
      d6_cui_bono: 7.4,
    },
    gai_dimensions: { d1: 6.5, d2: 5.8, d3: 6.5, d4: 8.6 },
    pair_pgi: {
      'africa|middle-east': 7.0,
      'africa|south-asia': 6.8,
      'africa|global': 6.6,
      'middle-east|south-asia': 7.1,
      'global|middle-east': 6.8,
      'global|south-asia': 6.6,
    },
    scoring_rationale: 'There is a shared factual shift here — a major arms deal appears frozen after Saudi pressure — but the explanatory frame differs across regions. Africa-focused coverage is likelier to view it through Sudan’s war trajectory, RSF cohesion, and concrete battlefield consequences. Middle East framing is more attuned to Saudi leverage, Gulf competition, and proxy-alignment implications. South Asian coverage puts more emphasis on Pakistan’s role and external balancing. Global coverage often notices the story only when an outside power visibly intervenes. That yields a solidly high PGI, especially on actor portrayal and cui bono. GAI is also high because a genuine external constraint on Sudan’s war machine remains badly under-covered in Western and East Asian attention systems.'
  },
  {
    story_slug: 'chad-expands-haiti-deployment-for-un-backed-security-force',
    story_headline: 'Chad expands Haiti deployment for UN-backed security force',
    category: 'security',
    significance: 'medium',
    regions_found: ['caribbean', 'latin-america', 'africa', 'global'],
    regions_absent: ['us', 'europe', 'middle-east', 'south-asia', 'east-se-asia', 'pacific', 'central-asia'],
    dimensions: {
      d1_factual: 4.1,
      d2_causal: 5.5,
      d3_framing: 5.9,
      d4_emotional: 5.0,
      d5_actor_context: 5.7,
      d6_cui_bono: 5.6,
    },
    gai_dimensions: { d1: 6.5, d2: 5.0, d3: 6.2, d4: 7.0 },
    pair_pgi: {
      'caribbean|latin-america': 5.8,
      'africa|caribbean': 5.7,
      'caribbean|global': 5.4,
      'africa|latin-america': 5.5,
      'global|latin-america': 5.3,
      'africa|global': 5.2,
    },
    scoring_rationale: 'This is a moderate-PGI story rather than a narrative-war story. Most regions that covered it agree that the meaningful shift is the increase in deployable force numbers. The divergence is in what that means: Caribbean and Latin American coverage tends to ask whether outside security reinforcement can actually restore order or merely delay governance failure; African framing can focus more on Chad’s role and the unusual South-South security dimension; global wire coverage often treats it as another incremental mission update. GAI is the stronger signal. A mission-capacity change with migration and regional security implications is still barely visible outside the Americas and Africa.'
  },
  {
    story_slug: 'u-s-tariff-refund-portal-goes-live-in-a-court-driven-trade-reversal',
    story_headline: 'U.S. tariff refund portal goes live in a court-driven trade reversal',
    category: 'trade',
    significance: 'high',
    regions_found: ['us', 'europe', 'east-se-asia', 'global'],
    regions_absent: ['africa', 'middle-east', 'south-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    dimensions: {
      d1_factual: 3.8,
      d2_causal: 5.2,
      d3_framing: 5.8,
      d4_emotional: 4.0,
      d5_actor_context: 5.4,
      d6_cui_bono: 5.7,
    },
    gai_dimensions: { d1: 6.5, d2: 5.1, d3: 6.3, d4: 8.2 },
    pair_pgi: {
      'europe|us': 5.2,
      'east-se-asia|us': 5.4,
      'global|us': 5.1,
      'east-se-asia|europe': 5.0,
      'europe|global': 4.9,
      'east-se-asia|global': 5.0,
    },
    scoring_rationale: 'This is more bureaucratic than ideological, so PGI stays in the mid range. The facts are stable: the refund system is live, importers can claim back money, and a legal reversal is now producing operational consequences. The gap is about significance. US coverage leans into domestic political and legal fallout, East Asian business framing is more likely to interpret it through supply chains and exporter cash-flow expectations, and European/global coverage often sees it as a trade-governance story rather than a political one. Actor-context and cui-bono gaps exist, but they are not radical. GAI is higher because administrative reversals with real trade consequences often remain invisible outside the regions most directly tied into those supply chains.'
  },
  {
    story_slug: 'china-sends-carrier-liaoning-through-the-taiwan-strait-in-a-new-signalling-move',
    story_headline: 'China sends carrier Liaoning through the Taiwan Strait in a new signalling move',
    category: 'security',
    significance: 'high',
    regions_found: ['east-se-asia', 'us', 'pacific', 'global'],
    regions_absent: ['africa', 'europe', 'middle-east', 'south-asia', 'latin-america', 'caribbean', 'central-asia'],
    dimensions: {
      d1_factual: 4.7,
      d2_causal: 6.9,
      d3_framing: 7.8,
      d4_emotional: 6.4,
      d5_actor_context: 7.6,
      d6_cui_bono: 7.3,
    },
    gai_dimensions: { d1: 6.5, d2: 5.4, d3: 6.8, d4: 8.4 },
    pair_pgi: {
      'east-se-asia|us': 7.8,
      'east-se-asia|pacific': 7.3,
      'east-se-asia|global': 7.2,
      'pacific|us': 7.0,
      'global|us': 7.1,
      'global|pacific': 6.8,
    },
    scoring_rationale: 'Carrier transit stories reliably generate a meaningful perception gap because the movement is concrete but its purpose is deeply contested. East Asian coverage tends to read this as direct coercive signalling inside a lived regional security environment. US coverage more readily folds it into broader strategic competition and deterrence messaging. Pacific framing is often allied-security oriented, while global wire coverage reports the event clearly but with less embedded regional context. That makes narrative, actor-portrayal, and cui-bono divergence much stronger than factual divergence. GAI is also high because even major Indo-Pacific signalling events remain under-seen in regions that are not structurally plugged into that security theatre.'
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
    scanFile: '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-21-midday.md',
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
