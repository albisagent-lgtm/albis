import fs from 'fs';
import path from 'path';
import { createAdminClient } from '../src/lib/supabase/admin';

function loadSimpleEnv(filePath: string) {
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

const scanDate = '2026-04-17';
const scanPeriod = 'midday';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-17-midday.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-17-midday-scores.json');

const REGION_DISTANCE: Record<string, number> = {
  'europe|us': 0.2,
  'middle-east|us': 1.0,
  'south-asia|us': 0.6,
  'east-se-asia|us': 0.4,
  'latin-america|us': 0.5,
  'africa|us': 0.6,
  'global|us': 0.3,
  'pacific|us': 0.45,
  'caribbean|us': 0.45,
  'central-asia|us': 0.55,
  'europe|middle-east': 0.6,
  'europe|south-asia': 0.4,
  'east-se-asia|europe': 0.2,
  'europe|latin-america': 0.35,
  'africa|europe': 0.35,
  'europe|global': 0.15,
  'europe|pacific': 0.35,
  'caribbean|europe': 0.35,
  'central-asia|europe': 0.35,
  'east-se-asia|middle-east': 0.45,
  'middle-east|south-asia': 0.35,
  'latin-america|middle-east': 0.55,
  'africa|middle-east': 0.45,
  'global|middle-east': 0.4,
  'middle-east|pacific': 0.5,
  'caribbean|middle-east': 0.55,
  'central-asia|middle-east': 0.4,
  'east-se-asia|south-asia': 0.25,
  'east-se-asia|latin-america': 0.4,
  'africa|east-se-asia': 0.4,
  'east-se-asia|global': 0.2,
  'east-se-asia|pacific': 0.2,
  'caribbean|east-se-asia': 0.4,
  'central-asia|east-se-asia': 0.3,
  'latin-america|south-asia': 0.35,
  'africa|south-asia': 0.3,
  'global|south-asia': 0.25,
  'pacific|south-asia': 0.3,
  'caribbean|south-asia': 0.35,
  'africa|latin-america': 0.25,
  'global|latin-america': 0.25,
  'latin-america|pacific': 0.3,
  'caribbean|latin-america': 0.2,
  'africa|global': 0.3,
  'africa|pacific': 0.35,
  'global|pacific': 0.25,
  'caribbean|global': 0.3,
  'central-asia|global': 0.3,
  'caribbean|pacific': 0.35,
  'africa|caribbean': 0.35,
  'africa|central-asia': 0.35,
  'latin-america|central-asia': 0.4,
  'pacific|central-asia': 0.4,
  'caribbean|central-asia': 0.35,
};

function clamp(n: number, min = 1, max = 10) {
  return Math.max(min, Math.min(max, n));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function average(values: number[]) {
  return round1(values.reduce((a, b) => a + b, 0) / values.length);
}
function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}
function significanceValue(sig: string) {
  return sig === 'critical' ? 5 : sig === 'high' ? 4 : sig === 'medium' ? 3 : sig === 'low' ? 2 : 1;
}

const stories = [
  {
    story_headline: 'Israel-Lebanon 10-day ceasefire takes effect as displaced people begin returning',
    category: 'conflict',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia'],
    d1_factual: 3.4,
    d2_causal: 6.8,
    d3_framing: 7.3,
    d4_emotional: 7.6,
    d5_actor_context: 7.1,
    d6_cui_bono: 6.3,
    gai: { d1: 3.2, d2: 4.0, d3: 4.8, d4: 8.5 },
    rationale: 'The ceasefire itself is a hard fact and the humanitarian signal of civilians returning narrows disagreement over whether something materially changed. The gap opens around durability and blame: Western and wire coverage lean toward practical de-escalation, while Middle East framing is more likely to stress fragility, asymmetry, and what the pause does not resolve. South Asian coverage tends to read it through regional stability and mediation logic. So PGI is meaningful but not extreme: strong factual consensus, moderate narrative divergence.'
  },
  {
    story_headline: 'Pakistan-mediated U.S.-Iran talks appear set to resume with gaps narrowing',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'east-se-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.7,
    d2_causal: 7.8,
    d3_framing: 8.4,
    d4_emotional: 7.1,
    d5_actor_context: 8.0,
    d6_cui_bono: 8.2,
    gai: { d1: 2.8, d2: 4.8, d3: 4.4, d4: 8.7 },
    rationale: 'This story carries one of the clearest perception gaps in the scan. Most regions accept that mediation is active, but they disagree on what the resumed channel means: risk reduction, coercive bargaining, Pakistani diplomatic leverage, or merely tactical pause management. US and Europe tend to weight market stability and strategic restraint; Middle East framing is more likely to foreground pressure, sanctions sequencing, and sovereignty; South Asia assigns greater agency to Pakistan. High PGI, but with broad enough coverage that GAI stays moderate.'
  },
  {
    story_headline: 'Sanctions pressure continues even as U.S.-Iran diplomacy advances',
    category: 'sanctions',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia', 'south-asia'],
    d1_factual: 4.9,
    d2_causal: 7.2,
    d3_framing: 7.7,
    d4_emotional: 6.4,
    d5_actor_context: 7.5,
    d6_cui_bono: 8.1,
    gai: { d1: 4.3, d2: 6.4, d3: 6.2, d4: 7.9 },
    rationale: 'There is broad agreement that the coercive economic track remains live. The gap is in interpretation: US coverage frames sanctions as leverage; Middle East coverage tends to frame them as proof that diplomatic thaw has hard limits; European and global coverage emphasise contradiction between negotiation and pressure. That makes PGI high but below the mediation story, because the action itself is less disputed than its meaning. GAI rises because large non-Western audiences are not prominently covering the sanctions mechanics.'
  },
  {
    story_headline: 'Hormuz disruption continues to distort physical oil and shipping markets despite diplomacy hopes',
    category: 'energy',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'africa', 'east-se-asia', 'south-asia', 'global'],
    regions_absent: ['latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.2,
    d2_causal: 7.0,
    d3_framing: 7.8,
    d4_emotional: 6.1,
    d5_actor_context: 7.0,
    d6_cui_bono: 7.4,
    gai: { d1: 2.4, d2: 4.9, d3: 4.6, d4: 9.3 },
    rationale: 'This is globally important and widely covered, but not framed the same way. Financial and wire coverage often emphasise persistence of disruption relative to market optimism; import-dependent regions focus on fuel cost and supply stress; Middle East framing is more likely to connect the chokepoint to sovereignty and coercive leverage. PGI is solidly high because regions agree on disruption but diverge on whether the main story is markets, geopolitics, or lived economic pain. GAI stays lower because the coverage footprint is broad.'
  },
  {
    story_headline: 'China moves to tighten control at the entrance to Scarborough Shoal',
    category: 'security',
    significance_label: 'high',
    regions_found: ['east-se-asia', 'us', 'europe', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia', 'middle-east'],
    d1_factual: 4.6,
    d2_causal: 7.1,
    d3_framing: 7.8,
    d4_emotional: 6.0,
    d5_actor_context: 7.7,
    d6_cui_bono: 8.0,
    gai: { d1: 4.5, d2: 6.5, d3: 6.0, d4: 7.9 },
    rationale: 'The underlying move is concrete enough, but the strategic reading differs sharply. East and Southeast Asian framing treats it as nearby maritime coercion with immediate deterrence implications; US coverage places it in larger China-containment and alliance terms; European/global outlets often compress it into another strategic flashpoint. That creates a strong PGI on actor portrayal and motive. GAI is also elevated because the issue matters to global trade and security yet remains missing in many regions.'
  },
  {
    story_headline: 'Slovakia says it may block the EU\'s 20th sanctions package on Russia while backing Ukraine loan',
    category: 'governance',
    significance_label: 'high',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia', 'east-se-asia', 'middle-east'],
    d1_factual: 5.1,
    d2_causal: 7.8,
    d3_framing: 8.0,
    d4_emotional: 5.8,
    d5_actor_context: 8.2,
    d6_cui_bono: 8.4,
    gai: { d1: 5.2, d2: 6.9, d3: 6.8, d4: 7.6 },
    rationale: 'The policy signal is fairly clear, but the framing gap is large. European coverage can split between coalition-management realism and unity-fracture alarm; US coverage tends to fold it into the question of Western resolve; global wires summarize it as procedural divergence. Actor portrayal and cui bono produce the largest spread: is Slovakia pragmatic, obstructive, bargaining, or simply exposing the limits of consensus? GAI is high because this matters for the sanctions regime but has a concentrated regional audience.'
  },
  {
    story_headline: 'Middle East war shock and aid decline push more African states toward IMF support',
    category: 'economic-flows',
    significance_label: 'high',
    regions_found: ['africa', 'europe', 'us', 'global'],
    regions_absent: ['latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia', 'east-se-asia', 'middle-east'],
    d1_factual: 4.8,
    d2_causal: 6.7,
    d3_framing: 7.0,
    d4_emotional: 6.2,
    d5_actor_context: 7.1,
    d6_cui_bono: 7.5,
    gai: { d1: 5.0, d2: 7.2, d3: 7.0, d4: 8.4 },
    rationale: 'This is exactly the kind of consequential second-order story that gets underweighted outside the regions living with the fallout. African coverage is more likely to center debt stress, sovereignty, and household exposure; US and European coverage often treat it as spillover from the main Middle East story; global framing may reduce it to IMF dependence statistics. PGI is mid-high rather than extreme because the facts are mostly uncontested, but GAI is very high because the significance is global while the attention is uneven.'
  },
  {
    story_headline: 'ASML and TSMC forecasts signal the AI chip investment boom remains intact',
    category: 'tech-ai',
    significance_label: 'medium',
    regions_found: ['europe', 'east-se-asia', 'us', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia', 'middle-east'],
    d1_factual: 3.2,
    d2_causal: 4.2,
    d3_framing: 4.6,
    d4_emotional: 3.5,
    d5_actor_context: 4.4,
    d6_cui_bono: 4.8,
    gai: { d1: 4.6, d2: 5.2, d3: 5.8, d4: 6.3 },
    rationale: 'This is one of the most consensus-heavy stories in the scan. Different regions stress different winners and strategic implications, but they are broadly aligned that AI infrastructure spending remains strong despite geopolitical noise. That keeps PGI low. GAI lands in the middle: it is important, but not especially invisible inside the regions that drive tech and capital markets.'
  },
  {
    story_headline: 'U.S. and European equities rally on Middle East diplomacy and ceasefire hopes',
    category: 'economic',
    significance_label: 'medium',
    regions_found: ['us', 'europe', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia', 'east-se-asia', 'middle-east'],
    d1_factual: 3.8,
    d2_causal: 5.6,
    d3_framing: 6.4,
    d4_emotional: 5.2,
    d5_actor_context: 5.9,
    d6_cui_bono: 6.3,
    gai: { d1: 5.4, d2: 6.3, d3: 6.7, d4: 6.2 },
    rationale: 'Markets clearly rallied, so the factual layer is not contentious. The gap is interpretive: Western financial coverage can read the move as rational repricing of de-escalation risk, while other regions may see markets racing ahead of actual shipping, sanctions, and civilian conditions. That produces a moderate PGI. GAI is high enough to note because the story is heavily visible in Western business media but far less central elsewhere.'
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
  const pair_pgi: Record<string, number> = {};
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

  const pgiIdBySlug = new Map((insertedPgi || []).map((row: any) => [row.story_slug, row.id]));
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
    if (!story_score_id) return [] as any[];
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
  console.log(JSON.stringify({
    ok: true,
    outPath,
    stories: stories.length,
    pgiCount: pgiRows.length,
    gaiCount: gaiRows.length,
    pairCount: pairRows.length,
    topPgi: { story: topPgi.story_headline, score: topPgi.story_pgi },
    topGai: { story: topGai.story_headline, score: topGai.story_gai },
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
