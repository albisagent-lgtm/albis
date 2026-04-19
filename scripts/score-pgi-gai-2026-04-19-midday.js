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

const scanDate = '2026-04-19';
const scanPeriod = 'midday';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-19-midday.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-19-midday-scores.json');

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
    story_headline: 'Iran temporarily reopens Strait of Hormuz amid fragile de-escalation signals',
    category: 'conflict',
    significance_label: 'critical',
    regions_found: ['middle-east', 'europe', 'east-se-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'south-asia', 'central-asia', 'us'],
    d1_factual: 4.5,
    d2_causal: 8.1,
    d3_framing: 8.6,
    d4_emotional: 6.6,
    d5_actor_context: 8.5,
    d6_cui_bono: 8.7,
    gai: { d1: 5.2, d2: 6.6, d3: 5.8, d4: 8.9 },
    rationale: 'The event itself is clear enough: Hormuz was temporarily reopened. The gap is over what that action means. European and global business coverage tends to centre energy risk and market relief, Middle East framing is likelier to treat the move as tactical sovereignty and leverage, while East Asian coverage reads it through shipping dependency and import vulnerability. So the strongest divergence sits in causal logic, actor portrayal and who benefits from the temporary opening.'
  },
  {
    story_headline: 'Israel-Lebanon 10-day ceasefire takes effect',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['middle-east', 'europe', 'us', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'south-asia', 'central-asia', 'east-se-asia'],
    d1_factual: 3.6,
    d2_causal: 6.3,
    d3_framing: 7.1,
    d4_emotional: 7.2,
    d5_actor_context: 6.9,
    d6_cui_bono: 6.8,
    gai: { d1: 5.1, d2: 5.8, d3: 5.2, d4: 8.7 },
    rationale: 'There is relatively little dispute that a ceasefire window began, which keeps the factual score lower than the interpretive ones. The split comes in whether this is treated as a meaningful peace opening, a tactical pause, or a fragile holding pattern. Middle East coverage is more likely to foreground carve-outs and durability risks, while US and European reporting more often emphasise the diplomatic signal and immediate de-escalation value.'
  },
  {
    story_headline: 'US and Iran keep door open to renewed talks despite sanctions threats and maritime pressure',
    category: 'diplomacy',
    significance_label: 'high',
    regions_found: ['us', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia', 'europe'],
    d1_factual: 4.8,
    d2_causal: 7.9,
    d3_framing: 8.2,
    d4_emotional: 6.4,
    d5_actor_context: 8.0,
    d6_cui_bono: 8.4,
    gai: { d1: 5.4, d2: 6.3, d3: 6.0, d4: 8.2 },
    rationale: 'This is a classic high-PGI diplomacy story. The raw facts are mostly shared, but regions assign different meanings to the same dual-track pattern of talks plus coercion. US coverage often frames pressure as bargaining architecture, Middle East coverage is more likely to see asymmetry and coercive hypocrisy, and South Asian framing gives mediation channels more agency than Western accounts usually do.'
  },
  {
    story_headline: 'US launches tariff refund pathway after Supreme Court curbs emergency tariff powers',
    category: 'trade',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'east-se-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'middle-east', 'south-asia', 'central-asia'],
    d1_factual: 3.9,
    d2_causal: 5.8,
    d3_framing: 6.0,
    d4_emotional: 4.2,
    d5_actor_context: 5.7,
    d6_cui_bono: 6.1,
    gai: { d1: 5.6, d2: 5.9, d3: 5.7, d4: 7.9 },
    rationale: 'This is more of an institutional-governance story than a heavily polarised one. Most regions accept that the court forced a rollback mechanism. Divergence appears in what gets emphasised: judicial restraint on executive power, relief for importers, or a broader trade-policy retreat. That keeps PGI moderate rather than extreme, while GAI stays meaningful because the decision matters beyond the places that gave it strong attention.'
  },
  {
    story_headline: 'IMF cuts growth outlook as war shock darkens macro picture',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['global', 'us', 'europe', 'east-se-asia', 'middle-east'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'south-asia', 'central-asia'],
    d1_factual: 3.5,
    d2_causal: 4.4,
    d3_framing: 4.8,
    d4_emotional: 3.9,
    d5_actor_context: 4.2,
    d6_cui_bono: 4.3,
    gai: { d1: 4.6, d2: 4.8, d3: 4.5, d4: 7.8 },
    rationale: 'Institutional macro stories tend to produce more consensus than war or sovereignty stories. Most regions treat the IMF cut as a systems-level acknowledgement that geopolitical disruption is now feeding into the economic baseline. Differences exist in who gets centred—markets, import-dependent states, or policymakers—but the framing split is still modest compared with the Middle East diplomacy cluster.'
  },
  {
    story_headline: 'Donors pledge nearly $1.8 billion for Sudan humanitarian crisis',
    category: 'health',
    significance_label: 'high',
    regions_found: ['africa', 'europe', 'global', 'middle-east'],
    regions_absent: ['us', 'latin-america', 'pacific', 'caribbean', 'south-asia', 'central-asia', 'east-se-asia'],
    d1_factual: 4.1,
    d2_causal: 5.9,
    d3_framing: 6.5,
    d4_emotional: 6.1,
    d5_actor_context: 6.2,
    d6_cui_bono: 6.0,
    gai: { d1: 6.2, d2: 6.9, d3: 6.5, d4: 9.1 },
    rationale: 'The aid figure is broadly accepted, but the story is not framed the same way across regions. African and regional coverage is likelier to centre hunger, access and abandonment, while European and global wire framing often foregrounds the conference itself and donor mobilisation. The stronger signal here is GAI: a huge humanitarian story still needs an official pledge event to break through internationally.'
  },
  {
    story_headline: 'China reportedly blocks access to disputed South China Sea shoal',
    category: 'security',
    significance_label: 'high',
    regions_found: ['east-se-asia', 'us', 'pacific', 'global'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'middle-east', 'south-asia', 'central-asia', 'europe'],
    d1_factual: 4.7,
    d2_causal: 7.3,
    d3_framing: 7.8,
    d4_emotional: 5.9,
    d5_actor_context: 7.6,
    d6_cui_bono: 7.7,
    gai: { d1: 5.8, d2: 6.4, d3: 5.9, d4: 8.3 },
    rationale: 'The physical obstruction claim is concrete enough to keep factual divergence from blowing out, but interpretation varies sharply. US and allied coverage often frames it as coercive revisionism and alliance testing, while regional reporting can be more operational, more sovereignty-focused, or more cautious about escalation language. That produces a solidly high PGI with elevated GAI because the security significance exceeds its actual geographic visibility.'
  },
  {
    story_headline: 'EU orders rollback of Meta WhatsApp AI fee',
    category: 'tech-ai',
    significance_label: 'medium',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'middle-east', 'south-asia', 'central-asia', 'east-se-asia'],
    d1_factual: 3.8,
    d2_causal: 4.8,
    d3_framing: 5.2,
    d4_emotional: 3.6,
    d5_actor_context: 5.0,
    d6_cui_bono: 5.3,
    gai: { d1: 6.3, d2: 6.0, d3: 6.1, d4: 6.8 },
    rationale: 'This is not an especially fractured story in perception terms. The regulatory intervention is straightforward, and most divergence comes from whether it is framed as pro-competition correction, anti-Big-Tech pressure, or regulatory overreach. GAI is more notable than PGI because a decision affecting global platform gatekeeping still received concentrated attention in Europe, the US and wire coverage.'
  },
  {
    story_headline: 'US chip restrictions bill on China scaled back but still restrictive',
    category: 'tech-ai',
    significance_label: 'medium',
    regions_found: ['us', 'europe', 'east-se-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'middle-east', 'south-asia', 'central-asia'],
    d1_factual: 4.4,
    d2_causal: 6.2,
    d3_framing: 6.7,
    d4_emotional: 4.7,
    d5_actor_context: 6.4,
    d6_cui_bono: 6.8,
    gai: { d1: 5.8, d2: 5.7, d3: 5.4, d4: 7.1 },
    rationale: 'Most regions agree the bill was softened but not abandoned. The gap lies in what the softening means: tactical adjustment, industrial realism, or continued containment by other means. East Asian coverage is likelier to stress supply-chain and industrial consequences, while US framing more often centres strategic competition. So PGI is meaningful but not extreme.'
  },
  {
    story_headline: 'New Zealand emergency declarations after Cyclone Vaianu',
    category: 'climate',
    significance_label: 'medium',
    regions_found: ['pacific', 'global'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'middle-east', 'south-asia', 'central-asia', 'east-se-asia', 'europe', 'us'],
    d1_factual: 2.9,
    d2_causal: 3.1,
    d3_framing: 3.4,
    d4_emotional: 3.7,
    d5_actor_context: 3.3,
    d6_cui_bono: 3.0,
    gai: { d1: 7.5, d2: 7.2, d3: 6.8, d4: 7.4 },
    rationale: 'Emergency declarations are usually low-PGI because the official state action is easy to verify and not especially contested. The real issue is invisibility: a meaningful governance and public-safety shift in the Pacific gets relatively little attention outside the immediate region unless the event becomes catastrophic. So this is one of the clearest high-GAI, low-PGI stories in the batch.'
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
