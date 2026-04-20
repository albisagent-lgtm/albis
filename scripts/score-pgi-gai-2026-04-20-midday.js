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
const scanPeriod = 'midday';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-20-midday.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-20-midday-scores.json');

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
  'central-asia|global': 0.3,
  'central-asia|us': 0.5,
  'central-asia|europe': 0.35,
  'central-asia|middle-east': 0.35,
  'central-asia|south-asia': 0.25,
  'central-asia|east-se-asia': 0.25,
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
    story_headline: 'Hormuz ceasefire remains fragile as US seizes Iranian-flagged ship and Pakistan-hosted talks stay uncertain',
    category: 'conflict',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 5.6,
    d2_causal: 9.0,
    d3_framing: 9.3,
    d4_emotional: 7.8,
    d5_actor_context: 9.2,
    d6_cui_bono: 9.1,
    gai: { d1: 4.5, d2: 5.8, d3: 5.6, d4: 9.4 },
    rationale: 'This is the dominant high-PGI story because the same event is being narrated as fragile diplomacy, coercive blockade management, market-security risk, or contested sovereignty depending on the region. The factual core is recognizable across outlets, but the causal story splits sharply over whether Washington is enforcing deterrence, sabotaging de-escalation, or preserving negotiating leverage. Middle East framing is much more likely to foreground blockade pressure and humiliation dynamics; US and Europe tend to privilege maritime security, deterrence, and talks sequencing; South Asia gives mediation and Pakistan-hosted process more agency. That makes framing, actor portrayal, and cui-bono divergence all very high.'
  },
  {
    story_headline: 'DRC government and M23 commit to protect civilians and aid deliveries, with progress on ceasefire oversight',
    category: 'diplomacy',
    significance_label: 'high',
    regions_found: ['africa', 'europe', 'middle-east', 'global'],
    regions_absent: ['us', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.2,
    d2_causal: 5.8,
    d3_framing: 6.1,
    d4_emotional: 5.7,
    d5_actor_context: 6.0,
    d6_cui_bono: 5.8,
    gai: { d1: 6.2, d2: 5.0, d3: 6.8, d4: 8.6 },
    rationale: 'The underlying facts here are relatively stable: the parties made commitments on civilian protection, aid access, and ceasefire oversight. The gap is more about emphasis than outright contradiction. African coverage is likelier to center implementation, local civilian stakes, and whether monitoring actually works on the ground, while European and global framing can flatten it into another diplomatic-process update. So PGI is moderate rather than extreme. GAI is high because one of the day’s clearest genuine de-escalation signals in Africa still remains under-seen across major attention systems.'
  },
  {
    story_headline: 'US extends Russian sanctions waiver to ease energy crunch linked to the Middle East war',
    category: 'sanctions',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'global'],
    regions_absent: ['africa', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia', 'east-se-asia'],
    d1_factual: 4.5,
    d2_causal: 7.2,
    d3_framing: 7.6,
    d4_emotional: 5.2,
    d5_actor_context: 7.5,
    d6_cui_bono: 7.4,
    gai: { d1: 7.0, d2: 6.1, d3: 7.4, d4: 8.7 },
    rationale: 'There is a strong interpretive split in how this waiver is understood. One frame treats it as pragmatic energy stabilization under wartime pressure; another sees it as strategic inconsistency or selective flexibility in the sanctions regime. Europe reads it through energy dependence and Ukraine implications, the US through tactical policy management, and global coverage through contradiction between rhetoric and exception. Facts are mostly stable, but causal logic and actor portrayal diverge sharply. GAI is high because a meaningful sanctions-policy shift with global energy consequences received surprisingly narrow regional pickup.'
  },
  {
    story_headline: 'EU exports to the US fall sharply for a second month as tariff distortions deepen',
    category: 'trade',
    significance_label: 'high',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['africa', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia', 'east-se-asia'],
    d1_factual: 3.9,
    d2_causal: 5.6,
    d3_framing: 5.8,
    d4_emotional: 4.2,
    d5_actor_context: 5.4,
    d6_cui_bono: 5.1,
    gai: { d1: 7.3, d2: 5.6, d3: 7.0, d4: 8.4 },
    rationale: 'This is less a fierce narrative war than a contested interpretation of trade data. Most coverage agrees exports fell, but disagreement emerges over how much is true tariff damage versus distorted comparison after earlier front-loading. European framing leans toward structural pressure on exporters and the meaning for transatlantic trade, while US/global coverage more often treats it as a messy data point inside broader tariff politics. PGI lands in the mid range. GAI is higher because a persistent trade-flow distortion story with real supply-chain implications is not attracting proportionate global attention.'
  },
  {
    story_headline: 'Peru delays final presidential election results until mid-May as fraud allegations linger',
    category: 'governance',
    significance_label: 'medium',
    regions_found: ['latin-america', 'europe', 'global'],
    regions_absent: ['us', 'africa', 'middle-east', 'pacific', 'caribbean', 'central-asia', 'south-asia', 'east-se-asia'],
    d1_factual: 4.6,
    d2_causal: 6.1,
    d3_framing: 6.6,
    d4_emotional: 5.9,
    d5_actor_context: 6.4,
    d6_cui_bono: 6.3,
    gai: { d1: 6.5, d2: 5.8, d3: 6.9, d4: 7.4 },
    rationale: 'Election delays create fertile ground for framing divergence even when institutions insist the process remains within democratic norms. Latin American coverage is more likely to feel the legitimacy risk and protest potential in real political terms, while European/global coverage gives more weight to observer validation and procedural reassurance. So the factual base is fairly stable, but narrative and actor-portrayal gaps widen around whether this is ordinary delay-management or a mounting legitimacy crisis. GAI is elevated because democratic trust shocks in Peru matter regionally, but are still peripheral in wider global attention.'
  },
  {
    story_headline: 'Bulgaria exit polls put Rumen Radev\'s bloc ahead, but coalition bargaining still looms',
    category: 'governance',
    significance_label: 'medium',
    regions_found: ['europe', 'global'],
    regions_absent: ['us', 'africa', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia', 'east-se-asia'],
    d1_factual: 3.8,
    d2_causal: 5.5,
    d3_framing: 5.9,
    d4_emotional: 4.1,
    d5_actor_context: 5.8,
    d6_cui_bono: 5.5,
    gai: { d1: 7.6, d2: 5.4, d3: 7.2, d4: 7.0 },
    rationale: 'The basic fact pattern is narrow and stable: a bloc leads, but coalition arithmetic still stands between momentum and governability. The gap comes from what that lead means. European coverage is more attuned to downstream coalition bargaining and regional political fragmentation, whereas generic global pickup can simplify it into a straightforward win narrative. That keeps PGI moderate. GAI is high because European governance stories with real implications for bloc cohesion often remain almost invisible outside Europe-centered attention circuits.'
  },
  {
    story_headline: 'Record US drought raises fire, water-supply, and food-price concerns',
    category: 'climate',
    significance_label: 'high',
    regions_found: ['us', 'global'],
    regions_absent: ['europe', 'africa', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia', 'east-se-asia'],
    d1_factual: 3.7,
    d2_causal: 5.1,
    d3_framing: 5.4,
    d4_emotional: 4.8,
    d5_actor_context: 5.0,
    d6_cui_bono: 4.9,
    gai: { d1: 7.8, d2: 5.3, d3: 8.1, d4: 8.6 },
    rationale: 'There is not huge disagreement over the drought itself; the main divergence is whether it is framed as a domestic weather stress, a climate-systems warning, or an early economic-food shock signal. That produces a moderate PGI, not an extreme one. The bigger story is GAI: a record drought in a major agricultural and financial economy should travel more broadly because the consequences spill into commodity markets, insurance, and food expectations well beyond the US. Its invisibility outside US/global coverage is the main gap.'
  },
  {
    story_headline: 'China sculptor Gao Zhen arrest highlights a new phase of retrospective censorship',
    category: 'media',
    significance_label: 'medium',
    regions_found: ['east-se-asia', 'europe', 'global'],
    regions_absent: ['us', 'africa', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia'],
    d1_factual: 4.4,
    d2_causal: 6.3,
    d3_framing: 7.1,
    d4_emotional: 6.2,
    d5_actor_context: 7.0,
    d6_cui_bono: 6.7,
    gai: { d1: 7.2, d2: 5.7, d3: 7.1, d4: 7.1 },
    rationale: 'This story produces a meaningful framing gap because the same arrest can be narrated as an isolated legal-cultural case, a rights abuse, or evidence of a broader regime tendency toward retrospective control. European coverage tends to universalize it as a free-expression and rights story, while East and Southeast Asia coverage is more likely to register context, state sensitivity, and the politics of symbolic dissent differently. Facts are clearer than meanings. GAI is also high because information-control stories with long-term governance significance are often treated as niche cultural items rather than structural state signals.'
  },
  {
    story_headline: 'Sabah coastal-village fire in Malaysia destroys about 1,000 homes and displaces thousands',
    category: 'infrastructure',
    significance_label: 'medium',
    regions_found: ['east-se-asia', 'global'],
    regions_absent: ['us', 'europe', 'africa', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia'],
    d1_factual: 3.4,
    d2_causal: 4.2,
    d3_framing: 4.5,
    d4_emotional: 4.8,
    d5_actor_context: 4.3,
    d6_cui_bono: 4.1,
    gai: { d1: 8.3, d2: 5.0, d3: 7.4, d4: 7.2 },
    rationale: 'This is a low-to-moderate PGI story because there is little evidence of sharp interpretive conflict: a major fire displaced thousands and exposed housing and infrastructure vulnerability. The main difference is scale of attention and whether it is framed as local tragedy or a wider systems issue about precarious settlement, resilience, and public infrastructure. GAI is the real signal here. A disaster displacing thousands in Southeast Asia can vanish quickly from global view unless it intersects with geopolitics, which is exactly the blind spot this index is meant to capture.'
  },
  {
    story_headline: 'China turns a humanoid half-marathon into a public AI capability moment',
    category: 'tech-ai',
    significance_label: 'medium',
    regions_found: ['east-se-asia', 'us', 'europe', 'global'],
    regions_absent: ['africa', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia'],
    d1_factual: 3.9,
    d2_causal: 5.8,
    d3_framing: 6.4,
    d4_emotional: 5.1,
    d5_actor_context: 6.0,
    d6_cui_bono: 6.2,
    gai: { d1: 5.5, d2: 5.1, d3: 6.0, d4: 6.8 },
    rationale: 'The interesting divide here is not whether the race happened, but what it signifies. Chinese and regional framing can treat it as industrial confidence, national futurism, and visible embodied-AI progress, while Western coverage is more prone to read it as spectacle, signaling, or soft propaganda wrapped around still-limited capability. That produces a solid mid-level PGI, especially on framing and cui bono. GAI is moderate rather than extreme because the story did travel across major tech-attention regions even if much of the Global South barely touched it.'
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
