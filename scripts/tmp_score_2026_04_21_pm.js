const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    process.env[trimmed.slice(0, i)] = trimmed.slice(i + 1);
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
const scanPeriod = 'pm';
const outPath = '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-21-pm-scores.json';

const scored = [
  {
    story_slug: 'us-iran-talks-clouded-as-ceasefire-deadline-nears-after-us-seizes-iranian-flagged-cargo-ship',
    story_headline: 'US-Iran talks clouded as ceasefire deadline nears after US seizes Iranian-flagged cargo ship',
    category: 'diplomacy',
    significance: 'critical',
    regions_found: ['middle-east', 'europe', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'pacific', 'central-asia'],
    dimensions: { d1_factual: 5.4, d2_causal: 9.1, d3_framing: 9.3, d4_emotional: 8.0, d5_actor_context: 9.2, d6_cui_bono: 9.0 },
    gai_dimensions: { d1: 6.2, d2: 5.0, d3: 6.1, d4: 9.1 },
    pair_pgi: {
      'europe|middle-east': 9.0,
      'middle-east|south-asia': 8.6,
      'global|middle-east': 8.5,
      'europe|south-asia': 8.3,
      'europe|global': 8.1,
      'global|south-asia': 8.0,
    },
    scoring_rationale: 'The basic facts line up, but nearly everything about meaning splits. European and global wire framing treats the story as a ceasefire-expiry and shipping-security test. Middle Eastern framing is much more likely to stress coercion, sovereignty, and whether seizure politics hollow out diplomacy. South Asian coverage gives mediation and regional spillover more weight than Western coverage. That keeps factual divergence moderate while causal, narrative, actor portrayal, and cui-bono divergence push into near-parallel-reality territory. GAI is high but not extreme because the main geopolitical regions do see it, even if whole population blocs still barely register the stakes.'
  },
  {
    story_slug: 'fragile-israel-hezbollah-ceasefire-holds-as-lebanon-and-israel-prepare-for-another-round-of-direct-talks',
    story_headline: 'Fragile Israel-Hezbollah ceasefire holds as Lebanon and Israel prepare for another round of direct talks',
    category: 'conflict',
    significance: 'critical',
    regions_found: ['middle-east', 'europe', 'global'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'latin-america', 'caribbean', 'pacific', 'central-asia', 'us'],
    dimensions: { d1_factual: 4.8, d2_causal: 7.8, d3_framing: 8.1, d4_emotional: 7.6, d5_actor_context: 8.0, d6_cui_bono: 7.9 },
    gai_dimensions: { d1: 7.0, d2: 5.1, d3: 6.8, d4: 9.0 },
    pair_pgi: {
      'europe|middle-east': 8.0,
      'global|middle-east': 7.7,
      'europe|global': 6.8,
    },
    scoring_rationale: 'All covered regions recognise the ceasefire and direct-talks signal, but they do not narrate it the same way. Middle Eastern coverage tends to hold the pause alongside destruction, displacement, and asymmetry, so the ceasefire reads as fragile and morally unresolved. European and global wire treatment more often centres diplomatic process, stability, and whether the pause holds. That produces a strong framing and actor-portrayal gap even without severe factual disagreement. GAI is high because a real de-escalation marker on a major front is still missing from much of the world’s attention.'
  },
  {
    story_slug: 'eu-and-un-estimate-gaza-recovery-will-require-more-than-71-billion-over-the-next-decade',
    story_headline: 'EU and UN estimate Gaza recovery will require more than $71 billion over the next decade',
    category: 'governance',
    significance: 'high',
    regions_found: ['middle-east', 'europe', 'global'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'latin-america', 'caribbean', 'pacific', 'central-asia'],
    dimensions: { d1_factual: 3.9, d2_causal: 6.4, d3_framing: 6.8, d4_emotional: 6.0, d5_actor_context: 6.6, d6_cui_bono: 6.5 },
    gai_dimensions: { d1: 6.8, d2: 4.7, d3: 6.5, d4: 8.2 },
    pair_pgi: {
      'europe|middle-east': 6.9,
      'global|middle-east': 6.5,
      'europe|global': 5.7,
    },
    scoring_rationale: 'The reconstruction number itself is not heavily disputed, so factual divergence stays low. The gap appears in what the number means: Middle Eastern framing is likelier to treat the estimate as a measure of destruction, accountability, and unresolved political injury, while European framing is more institutionally focused on aid, governance, and diplomatic bandwidth. Global wire coverage often compresses it into a large reconstruction bill without the deeper political charge. That yields mid-to-high PGI rather than extreme PGI. GAI is high because a major postwar-governance signal remains far less visible than frontline violence.'
  },
  {
    story_slug: 'eu-moves-to-widen-iran-sanctions-criteria-to-include-those-responsible-for-blocking-the-strait-of-hormuz',
    story_headline: 'EU moves to widen Iran sanctions criteria to include those responsible for blocking the Strait of Hormuz',
    category: 'sanctions',
    significance: 'high',
    regions_found: ['europe', 'middle-east', 'global'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'latin-america', 'caribbean', 'pacific', 'central-asia'],
    dimensions: { d1_factual: 3.8, d2_causal: 5.4, d3_framing: 5.8, d4_emotional: 4.8, d5_actor_context: 5.5, d6_cui_bono: 5.9 },
    gai_dimensions: { d1: 6.8, d2: 4.5, d3: 6.4, d4: 8.0 },
    pair_pgi: {
      'europe|middle-east': 6.0,
      'europe|global': 5.3,
      'global|middle-east': 5.6,
    },
    scoring_rationale: 'This is a cleaner policy-shift story than a narrative-war story. Europe sees an official sanctions broadening tied to maritime disruption and legal response. Middle Eastern coverage is more likely to place the move inside a broader coercion-and-retaliation cycle rather than neutral rule-setting. Global wire treatment often describes the sanctions expansion as a market-relevant policy development. The result is only moderate divergence, with cui bono slightly higher because regions infer different beneficiaries and burdens from the same legal step. GAI is elevated because a formal sanctions change with shipping implications is still absent from many regions.'
  },
  {
    story_slug: 'oil-prices-swing-sharply-as-markets-reassess-ceasefire-durability-and-the-operational-status-of-the-strait-of-hormuz',
    story_headline: 'Oil prices swing sharply as markets reassess ceasefire durability and the operational status of the Strait of Hormuz',
    category: 'energy',
    significance: 'high',
    regions_found: ['middle-east', 'europe', 'us', 'global'],
    regions_absent: ['africa', 'south-asia', 'latin-america', 'caribbean', 'pacific', 'central-asia'],
    dimensions: { d1_factual: 4.2, d2_causal: 6.1, d3_framing: 6.6, d4_emotional: 5.4, d5_actor_context: 6.0, d6_cui_bono: 6.2 },
    gai_dimensions: { d1: 5.9, d2: 4.8, d3: 5.8, d4: 8.1 },
    pair_pgi: {
      'middle-east|us': 6.9,
      'europe|us': 6.1,
      'global|us': 5.8,
      'europe|middle-east': 6.5,
      'global|middle-east': 6.1,
      'europe|global': 5.4,
    },
    scoring_rationale: 'Most regions agree on the market move, but not on the story underneath it. US and European coverage often treats oil as the main transmission channel. Middle Eastern framing is more likely to invert that logic and treat prices as downstream evidence of an unresolved coercive struggle over the waterway itself. Global wire coverage splits the difference. That keeps PGI in the diverging-narratives band rather than the highest tier. GAI sits in the middle-high range because the story is visible in the major market regions but still absent from many populations that would feel the price consequences.'
  },
  {
    story_slug: 'ukraine-drone-strike-on-russias-tuapse-port-sparks-fire-and-casualties',
    story_headline: 'Ukraine drone strike on Russia’s Tuapse port sparks fire and casualties',
    category: 'security',
    significance: 'high',
    regions_found: ['europe', 'global'],
    regions_absent: ['middle-east', 'africa', 'south-asia', 'east-se-asia', 'latin-america', 'caribbean', 'pacific', 'central-asia', 'us'],
    dimensions: { d1_factual: 3.2, d2_causal: 4.2, d3_framing: 4.5, d4_emotional: 4.0, d5_actor_context: 4.4, d6_cui_bono: 4.3 },
    gai_dimensions: { d1: 8.0, d2: 4.0, d3: 7.2, d4: 8.2 },
    pair_pgi: {
      'europe|global': 4.3,
    },
    scoring_rationale: 'Where the story is covered, the event itself is reported quite similarly: a Ukrainian strike hit Tuapse, caused a fire, and reinforced Black Sea risk. The split is more about emphasis than interpretation, with European coverage slightly more attuned to infrastructure persistence and regional consequences than generic global wire framing. That keeps PGI low-to-moderate. GAI is the stronger signal. A repeat strike on a major Black Sea node should have broader global salience than its actual coverage footprint suggests.'
  },
  {
    story_slug: 'japan-eases-tsunami-warning-after-major-offshore-earthquake-while-cautioning-over-elevated-megaquake-risk',
    story_headline: 'Japan eases tsunami warning after major offshore earthquake while cautioning over elevated megaquake risk',
    category: 'climate',
    significance: 'high',
    regions_found: ['east-se-asia', 'pacific', 'global'],
    regions_absent: ['middle-east', 'africa', 'south-asia', 'latin-america', 'caribbean', 'central-asia'],
    dimensions: { d1_factual: 2.6, d2_causal: 2.9, d3_framing: 3.1, d4_emotional: 3.4, d5_actor_context: 3.0, d6_cui_bono: 2.8 },
    gai_dimensions: { d1: 7.0, d2: 4.2, d3: 6.0, d4: 8.0 },
    pair_pgi: {
      'east-se-asia|pacific': 3.2,
      'east-se-asia|global': 3.0,
      'global|pacific': 2.8,
    },
    scoring_rationale: 'Natural-disaster warning stories produce the lowest PGI in the scan because the factual core is shared and the interpretive room is small. The main difference is one of proximity: East Asian and Pacific coverage may carry more lived urgency around preparedness and aftershock risk, while global wire framing is more stripped down and procedural. That is a different lens, not a competing reality. GAI is still meaningful because even important emergency-status downgrades often fail to travel widely outside the immediately affected region.'
  },
  {
    story_slug: 'india-and-south-korea-target-50-billion-in-trade-by-2030-with-deeper-cooperation-in-strategic-industries',
    story_headline: 'India and South Korea target $50 billion in trade by 2030 with deeper cooperation in strategic industries',
    category: 'economic-flows',
    significance: 'medium',
    regions_found: ['south-asia', 'east-se-asia', 'global'],
    regions_absent: ['middle-east', 'africa', 'europe', 'latin-america', 'caribbean', 'pacific', 'central-asia', 'us'],
    dimensions: { d1_factual: 3.0, d2_causal: 4.1, d3_framing: 4.4, d4_emotional: 3.3, d5_actor_context: 4.1, d6_cui_bono: 4.5 },
    gai_dimensions: { d1: 7.0, d2: 4.1, d3: 6.6, d4: 6.9 },
    pair_pgi: {
      'east-se-asia|south-asia': 4.4,
      'global|south-asia': 4.0,
      'east-se-asia|global': 3.8,
    },
    scoring_rationale: 'This is a classic lower-PGI state-change story: the trade target and strategic sectors are broadly shared, but regions weight them differently. South Asian coverage is more likely to frame the deal through industrial ascent and strategic balancing. East Asian framing tends to emphasise supply chains, semiconductors, and shipbuilding complementarities. Global wire coverage presents it as a straightforward trade expansion. That creates some framing and cui-bono separation without serious factual conflict. GAI is higher than PGI because the agreement matters beyond the regions paying attention to it.'
  },
  {
    story_slug: 'fire-at-indias-rajasthan-refinery-is-brought-under-control-delaying-planned-inauguration',
    story_headline: 'Fire at India’s Rajasthan refinery is brought under control, delaying planned inauguration',
    category: 'infrastructure',
    significance: 'medium',
    regions_found: ['south-asia', 'global'],
    regions_absent: ['middle-east', 'africa', 'europe', 'east-se-asia', 'latin-america', 'caribbean', 'pacific', 'central-asia', 'us'],
    dimensions: { d1_factual: 2.7, d2_causal: 3.1, d3_framing: 3.4, d4_emotional: 2.9, d5_actor_context: 3.1, d6_cui_bono: 3.3 },
    gai_dimensions: { d1: 8.0, d2: 3.8, d3: 7.0, d4: 6.8 },
    pair_pgi: {
      'global|south-asia': 3.1,
    },
    scoring_rationale: 'This is one of the least divisive PGI stories in the file. The event is specific, the immediate outcome is clear, and there is little room for radically different narratives. South Asian coverage will naturally give it more operational and political texture than global wire coverage, but the story remains mostly stable across both. GAI is much higher because a refinery incident with timing, energy, and infrastructure relevance barely travels beyond the directly affected region.'
  },
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
    scanFile: '/Users/treelight/.openclaw/workspace/memory/scans/2026-04-21-pm.md',
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

module.exports = { scored, scanDate, scanPeriod, outPath, main };

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
