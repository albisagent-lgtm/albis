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
const scanPeriod = 'pm';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-19-pm.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-19-pm-scores.json');

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
    story_headline: 'Pakistani mediation keeps U.S.-Iran ceasefire window alive as extension is discussed',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia'],
    d1_factual: 4.9,
    d2_causal: 8.4,
    d3_framing: 8.7,
    d4_emotional: 6.8,
    d5_actor_context: 8.5,
    d6_cui_bono: 8.8,
    gai: { d1: 5.0, d2: 5.8, d3: 5.6, d4: 8.9 },
    rationale: 'The basic fact pattern is shared: mediation is active and a ceasefire extension is under discussion. The perception gap comes from what that means. US and European coverage tend to frame mediation as leverage management and de-escalation architecture, Middle East coverage weighs sovereignty, coercion and credibility, and South Asian coverage gives Pakistan far more agency than Western accounts usually do. That makes the largest divergence sit in causal logic, framing, actor portrayal and cui bono.'
  },
  {
    story_headline: 'Israel and Lebanon enter a U.S.-brokered 10-day ceasefire, though violations risk a relapse',
    category: 'conflict',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia'],
    d1_factual: 3.8,
    d2_causal: 6.9,
    d3_framing: 7.5,
    d4_emotional: 7.3,
    d5_actor_context: 7.4,
    d6_cui_bono: 7.1,
    gai: { d1: 5.0, d2: 5.8, d3: 5.3, d4: 8.8 },
    rationale: 'There is fairly broad agreement that a 10-day ceasefire exists, which keeps factual divergence lower than the interpretive dimensions. The split is over whether the pause should be read as a meaningful reduction in escalation risk or as a brittle tactical interlude already compromised by violations. Middle East reporting is more likely to foreground loopholes, breaches and asymmetry, while US and European framing more often emphasises the diplomatic achievement and stabilising signal.'
  },
  {
    story_headline: 'Strait of Hormuz reopened during the ceasefire, then closed again as blockade pressure returned',
    category: 'economic-flows',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'east-se-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 5.2,
    d2_causal: 8.7,
    d3_framing: 9.1,
    d4_emotional: 7.3,
    d5_actor_context: 8.9,
    d6_cui_bono: 9.0,
    gai: { d1: 4.3, d2: 5.0, d3: 4.9, d4: 9.0 },
    rationale: 'Everyone recognises Hormuz matters, but regions do not tell the same story about why its status flipped. Western business and policy coverage stresses market volatility and coercive disruption, Middle East framing is more likely to treat the strait as leverage in a sovereignty contest, and South/East Asian coverage centres shipping dependency and import vulnerability. Because the story is about a rapid operational reversal, the deepest gap lies in causation, framing, actor portrayal and who benefits from the closure-versus-reopening cycle.'
  },
  {
    story_headline: 'Washington tightens pressure on Iranian oil while renewing a temporary waiver for Russian oil purchases',
    category: 'sanctions',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'south-asia', 'global'],
    regions_absent: ['africa', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia'],
    d1_factual: 4.6,
    d2_causal: 7.8,
    d3_framing: 8.4,
    d4_emotional: 6.1,
    d5_actor_context: 8.2,
    d6_cui_bono: 8.6,
    gai: { d1: 5.7, d2: 6.2, d3: 6.0, d4: 8.1 },
    rationale: 'The policy moves are concrete, but their meaning is highly contested. US coverage can present the split as practical statecraft under energy stress, European coverage weighs coherence and compliance, while South Asian framing is more likely to see strategic selectivity and changed import bargaining power. That pushes the largest divergence into framing, actor portrayal and cui bono rather than factual dispute.'
  },
  {
    story_headline: 'IMF cuts growth outlook as governments move toward emergency support and coordinated energy measures',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'east-se-asia', 'south-asia', 'global'],
    regions_absent: ['africa', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 3.4,
    d2_causal: 5.0,
    d3_framing: 5.2,
    d4_emotional: 4.1,
    d5_actor_context: 4.8,
    d6_cui_bono: 5.1,
    gai: { d1: 4.3, d2: 4.8, d3: 4.7, d4: 7.9 },
    rationale: 'Macro-institutional stories usually produce more consensus than war diplomacy stories, and that is true here too. Most regions accept the growth downgrade and the move toward energy support measures. The gap is over emphasis: some centre inflation and markets, others import vulnerability or policy coordination failure. So PGI is moderate, not extreme, while GAI stays meaningful because the significance exceeds the breadth of truly engaged coverage.'
  },
  {
    story_headline: 'Africa faces rising IMF dependence as Middle East conflict and aid retrenchment squeeze fragile states',
    category: 'governance',
    significance_label: 'high',
    regions_found: ['africa', 'europe', 'global'],
    regions_absent: ['us', 'middle-east', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.2,
    d2_causal: 6.4,
    d3_framing: 6.8,
    d4_emotional: 6.0,
    d5_actor_context: 6.5,
    d6_cui_bono: 6.9,
    gai: { d1: 7.0, d2: 7.5, d3: 7.3, d4: 9.0 },
    rationale: 'The broad economics are clear, but the story is not framed equally across the regions that do cover it. African coverage is more likely to centre externalised shock, fiscal pain and state-capacity erosion, while European and global wire framing more often routes the story through debt, aid and IMF process language. The bigger signal is invisibility: a major second-order consequence of the war system is missing from many influential regions altogether, which drives GAI high.'
  },
  {
    story_headline: 'Gaza sees limited humanitarian state changes as Zikim reopens and medical evacuations resume',
    category: 'health',
    significance_label: 'medium',
    regions_found: ['middle-east', 'europe', 'global'],
    regions_absent: ['us', 'africa', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.0,
    d2_causal: 7.0,
    d3_framing: 7.7,
    d4_emotional: 7.5,
    d5_actor_context: 7.8,
    d6_cui_bono: 7.4,
    gai: { d1: 7.3, d2: 7.7, d3: 7.4, d4: 7.8 },
    rationale: 'The operational changes are real but modest, and that creates a framing split. Some coverage treats reopened crossings and resumed evacuations as tangible de-escalation signals, while other coverage sees them as tiny concessions against an overwhelming humanitarian baseline. Because the facts are shared but moral and strategic meaning differ sharply, the strongest divergence appears in framing, emotion, actor portrayal and cui bono. GAI is also elevated because even meaningful humanitarian state changes remain narrowly covered.'
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
