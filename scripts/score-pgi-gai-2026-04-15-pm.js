const fs = require('fs');
const path = require('path');
const { createAdminClient } = require('../src/lib/supabase/admin');

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

const scanDate = '2026-04-15';
const scanPeriod = 'pm';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-15-pm.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-15-pm-scores.json');

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
    story_headline: 'US blockade of Iranian ports continues while Washington and Tehran leave door open to more talks in Pakistan',
    category: 'conflict',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 6.2,
    d2_causal: 8.8,
    d3_framing: 9.2,
    d4_emotional: 8.7,
    d5_actor_context: 9.0,
    d6_cui_bono: 9.1,
    gai: { d1: 3.6, d2: 5.6, d3: 5.2, d4: 9.7 },
    rationale: 'All regions acknowledge the blockade and the survival of a diplomatic lane, but they do not agree on what that means. US coverage leans on coercive leverage and crisis management, Middle East coverage reads sovereignty violation and punitive escalation, South Asian framing highlights Pakistan’s mediating agency, and European/global coverage emphasises shipping risk and escalation containment. The deepest gap is over whether the blockade is an enforcement tool inside diplomacy or proof that diplomacy is already being hollowed out.'
  },
  {
    story_headline: 'Britain and France prepare Hormuz talks focused on sanctions, seafarer releases and readiness to resume shipping',
    category: 'diplomacy',
    significance_label: 'high',
    regions_found: ['europe', 'middle-east', 'global', 'us'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 5.8,
    d2_causal: 7.0,
    d3_framing: 7.4,
    d4_emotional: 6.3,
    d5_actor_context: 7.6,
    d6_cui_bono: 7.8,
    gai: { d1: 4.8, d2: 6.8, d3: 6.1, d4: 8.7 },
    rationale: 'The base facts are shared, but the frame splits quickly. Europe treats the talks as practical corridor-restoration statecraft; US coverage sees burden-sharing and maritime stabilisation; Middle East framing is more suspicious because sanctions and convoy logic can look like commercial de-escalation for outsiders but pressure architecture for those inside the theatre. PGI is solidly high, though lower than the blockade story because the underlying event is procedural rather than kinetic.'
  },
  {
    story_headline: 'Tankers probe the Strait of Hormuz as some vessels turn back and others attempt transit again',
    category: 'economic-flows',
    significance_label: 'high',
    regions_found: ['europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['us', 'africa', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 4.9,
    d2_causal: 5.5,
    d3_framing: 5.8,
    d4_emotional: 4.7,
    d5_actor_context: 5.6,
    d6_cui_bono: 6.0,
    gai: { d1: 5.0, d2: 6.5, d3: 6.0, d4: 8.2 },
    rationale: 'There is less ideological divergence here than in the diplomatic or war headlines because tanker movement is a hard behavioural signal. Still, regional emphasis varies: Europe watches insurance and shipping continuity, South Asia sees import vulnerability, Middle East outlets read tactical risk and signalling, while global wires compress it into a corridor-status indicator. That keeps PGI moderate, while GAI rises because a key systems story remains narrower than its real-world importance warrants.'
  },
  {
    story_headline: 'Israel and Lebanon hold rare direct talks in the United States but progress remains uncertain',
    category: 'diplomacy',
    significance_label: 'high',
    regions_found: ['middle-east', 'us', 'europe', 'global'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 5.4,
    d2_causal: 7.2,
    d3_framing: 8.0,
    d4_emotional: 7.1,
    d5_actor_context: 7.8,
    d6_cui_bono: 8.1,
    gai: { d1: 4.9, d2: 6.7, d3: 6.1, d4: 8.5 },
    rationale: 'The direct talks themselves are not really disputed; what differs is whether they represent a meaningful channel or a symbolic gesture with little coercive power behind it. US framing naturally leans toward diplomatic opening, European coverage toward stabilisation, and Middle East reporting is more alert to Hezbollah rejection, ceasefire scope disputes, and the risk of over-reading a contact event. That creates a high PGI without reaching the intensity of the core Iran stories.'
  },
  {
    story_headline: 'Israeli fire kills Palestinians in Gaza as mediators continue trying to shore up a fragile ceasefire',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['middle-east', 'europe', 'us', 'global'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 5.9,
    d2_causal: 8.2,
    d3_framing: 9.1,
    d4_emotional: 9.0,
    d5_actor_context: 8.8,
    d6_cui_bono: 9.0,
    gai: { d1: 4.8, d2: 6.0, d3: 5.8, d4: 9.0 },
    rationale: 'Shared facts around deaths and ceasefire erosion exist, but the story remains one of stark narrative divergence. Middle East coverage foregrounds civilian harm, siege conditions, and accountability; US coverage often balances tactical/security framing against mediation efforts; European and global coverage sit somewhere between humanitarian alarm and process updates. The gap is not just emotional tone but causal story: violation, tragic byproduct of war, or evidence that the current ceasefire architecture is structurally failing.'
  },
  {
    story_headline: 'China sharply reduces tariffs on European Union pork imports in a partial easing of trade pressure',
    category: 'trade',
    significance_label: 'medium',
    regions_found: ['europe', 'east-se-asia', 'global'],
    regions_absent: ['us', 'middle-east', 'africa', 'south-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 4.3,
    d2_causal: 5.0,
    d3_framing: 5.4,
    d4_emotional: 4.2,
    d5_actor_context: 5.1,
    d6_cui_bono: 5.6,
    gai: { d1: 6.0, d2: 7.0, d3: 6.4, d4: 6.4 },
    rationale: 'This is a selective easing story, so the factual layer is fairly stable. The split is mostly in interpretation: Europe reads possible compartmentalisation and relief for exporters; East and Southeast Asian framing is likelier to place it within broader Chinese trade calibration; global coverage treats it as a modest but real de-escalation marker. PGI stays moderate, but GAI is elevated because constructive trade reversals outside the dominant war narrative get underplayed.'
  },
  {
    story_headline: 'Singapore tightens monetary policy as war-driven energy prices raise inflation risks across Asia',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['east-se-asia', 'global', 'europe'],
    regions_absent: ['us', 'middle-east', 'africa', 'south-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 3.8,
    d2_causal: 4.4,
    d3_framing: 4.7,
    d4_emotional: 4.0,
    d5_actor_context: 4.5,
    d6_cui_bono: 4.9,
    gai: { d1: 6.3, d2: 7.1, d3: 6.8, d4: 8.1 },
    rationale: 'Regional disagreement here is muted because this is a formal policy move with a clear stated rationale. East and Southeast Asian coverage naturally gives it greater systems importance as an early macro signal, while Europe/global wires register it as evidence of Gulf spillover into inflation management. So PGI remains low-moderate, but GAI is meaningfully high because a genuine policy transmission story is not receiving the breadth of attention its significance deserves.'
  },
  {
    story_headline: 'Kenya raises retail fuel prices sharply as Middle East conflict squeezes supplies and lifts crude costs',
    category: 'energy',
    significance_label: 'high',
    regions_found: ['africa', 'global', 'middle-east'],
    regions_absent: ['us', 'europe', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 4.8,
    d2_causal: 6.0,
    d3_framing: 6.7,
    d4_emotional: 6.1,
    d5_actor_context: 6.4,
    d6_cui_bono: 6.9,
    gai: { d1: 6.5, d2: 7.6, d3: 7.4, d4: 8.4 },
    rationale: 'The hard fact of the fuel-price hike is consistent, but regional framing differs over what kind of story this is. African coverage treats it as immediate household and transport pain, Middle East framing links it to the regional war shock, and global wires tend to present it as downstream economic fallout. That creates a mid-high PGI. GAI is higher because this is precisely the sort of lived-impact story that matters enormously yet is often overshadowed by frontline or market narratives.'
  },
  {
    story_headline: 'Germany commits additional aid for Sudan as humanitarian needs remain severe',
    category: 'migration',
    significance_label: 'medium',
    regions_found: ['europe', 'africa'],
    regions_absent: ['us', 'middle-east', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean', 'global'],
    d1_factual: 5.5,
    d2_causal: 7.0,
    d3_framing: 7.5,
    d4_emotional: 6.8,
    d5_actor_context: 7.2,
    d6_cui_bono: 7.4,
    gai: { d1: 7.8, d2: 8.4, d3: 7.8, d4: 7.6 },
    rationale: 'The aid figure is straightforward, but regions diverge over what the donation signifies. European coverage can frame it as donor continuity and responsibility; African coverage is more likely to place it against the overwhelming scale of the humanitarian shortfall and the world’s neglect. That produces a high PGI despite narrow regional participation, and the story’s visibility gap is severe because Sudan remains dramatically under-covered relative to human need.'
  },
  {
    story_headline: 'Libya’s rival forces join the same US-led military exercise for the first time',
    category: 'security',
    significance_label: 'medium',
    regions_found: ['africa', 'us', 'europe'],
    regions_absent: ['middle-east', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean', 'global'],
    d1_factual: 4.7,
    d2_causal: 5.8,
    d3_framing: 6.1,
    d4_emotional: 5.1,
    d5_actor_context: 6.0,
    d6_cui_bono: 6.3,
    gai: { d1: 6.7, d2: 7.8, d3: 7.0, d4: 6.8 },
    rationale: 'This is a modest but real coordination signal. African coverage is likelier to weigh fragmentation and local power balances, US framing emphasises security cooperation, and European/global-adjacent reporting often reads it through stability management on the Mediterranean edge. PGI is moderate-high rather than extreme, while GAI is elevated because tactical de-escalation signals in fragile states rarely travel far.'
  },
  {
    story_headline: 'US tariff restoration risk returns as Treasury signals pre-court tariff levels could come back by July',
    category: 'trade',
    significance_label: 'medium',
    regions_found: ['us', 'europe', 'east-se-asia', 'global'],
    regions_absent: ['middle-east', 'africa', 'south-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 4.6,
    d2_causal: 5.4,
    d3_framing: 5.7,
    d4_emotional: 4.8,
    d5_actor_context: 5.5,
    d6_cui_bono: 5.8,
    gai: { d1: 4.9, d2: 6.3, d3: 6.0, d4: 7.1 },
    rationale: 'This is still a risk story rather than an executed policy shift, which limits both divergence and urgency. US coverage naturally centres domestic legal and political implications; Europe and East/SE Asia care more about planning uncertainty for trade and supply chains. That keeps PGI moderate. GAI is also moderate because the story is fairly visible in relevant economic regions, even if absent elsewhere.'
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
