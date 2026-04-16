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
const scanPeriod = 'am';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-17-am.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-17-am-scores.json');

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
    story_headline: 'Israel and Lebanon begin a 10-day ceasefire with direct talks opened',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'global'],
    regions_absent: ['africa', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 5.9,
    d2_causal: 8.2,
    d3_framing: 8.8,
    d4_emotional: 8.1,
    d5_actor_context: 8.5,
    d6_cui_bono: 8.7,
    gai: { d1: 4.8, d2: 6.2, d3: 5.9, d4: 9.6 },
    rationale: 'The ceasefire itself is a concrete fact, but regions interpret its meaning very differently. US and European coverage tend to treat it as a practical de-escalation breakthrough; Middle East framing is more likely to ask whether this is a real diplomatic opening or merely a short tactical pause inside a still-fragile war architecture; global wires compress both readings into a headline peace signal. The gap is driven less by disagreement over whether the ceasefire exists than over whether it represents a durable turn, a managed pause, or strategic theatre.'
  },
  {
    story_headline: 'US-Iran talks narrow toward an interim deal after Pakistani mediation',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 6.0,
    d2_causal: 8.7,
    d3_framing: 9.1,
    d4_emotional: 8.0,
    d5_actor_context: 8.8,
    d6_cui_bono: 9.0,
    gai: { d1: 4.0, d2: 5.9, d3: 5.8, d4: 9.7 },
    rationale: 'Most regions broadly accept that diplomacy is moving toward a smaller interim arrangement, but they sharply diverge on what that means. US coverage frames the shift as pragmatic conflict management; Middle East coverage reads it through coercion, sovereignty and sanction leverage; South Asian coverage gives real agency to Pakistan’s mediation role; European and global coverage emphasise risk reduction and shipping stability. The perception gap is high because the same interim deal can be read as a genuine off-ramp, a face-saving pause, or negotiation under pressure.'
  },
  {
    story_headline: 'Hormuz transit rules soften at the margins while the blockade framework remains in force',
    category: 'economic-flows',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 5.7,
    d2_causal: 8.4,
    d3_framing: 9.0,
    d4_emotional: 7.7,
    d5_actor_context: 8.6,
    d6_cui_bono: 9.1,
    gai: { d1: 4.5, d2: 6.6, d3: 6.1, d4: 9.8 },
    rationale: 'The physical shipping question is concrete enough, but the frame around it varies dramatically. Middle East coverage treats Hormuz as a sovereignty and blockade-governance dispute; US coverage often presents transit changes as pressure-management within a strategic contest; South Asian and European coverage focus on import exposure, shipping risk and inflation spillovers; global wires flatten the story into market-sensitive corridor language. That produces an extremely high PGI because the same transit-rule softening can signal de-escalation, bargaining leverage, or a still-live chokehold depending on region.'
  },
  {
    story_headline: 'US warns buyers of Iranian oil they could face sanctions as diplomacy continues',
    category: 'sanctions',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'east-se-asia', 'global'],
    regions_absent: ['africa', 'south-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 5.4,
    d2_causal: 7.3,
    d3_framing: 7.8,
    d4_emotional: 6.8,
    d5_actor_context: 7.7,
    d6_cui_bono: 8.1,
    gai: { d1: 4.7, d2: 6.0, d3: 5.9, d4: 8.8 },
    rationale: 'There is broad agreement that sanctions pressure remains active, but the framing gap is still pronounced. US reporting tends to cast sanctions as leverage to shape negotiation behaviour; Middle East coverage is likelier to frame them as economic coercion that undercuts any talk of normalisation; East and Southeast Asian attention tracks exposure for buyers and refiners; European/global coverage emphasises the contradiction between diplomacy and continued pressure. PGI is solidly high, though lower than the main diplomacy stories because the coercive action itself is less ambiguous than its political meaning.'
  },
  {
    story_headline: 'Germany cuts growth forecasts as Europe prices in the Middle East energy shock',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['middle-east', 'africa', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 4.2,
    d2_causal: 5.1,
    d3_framing: 5.2,
    d4_emotional: 4.6,
    d5_actor_context: 5.0,
    d6_cui_bono: 5.5,
    gai: { d1: 6.0, d2: 6.5, d3: 6.1, d4: 8.2 },
    rationale: 'This is a comparatively consensus-heavy macro story. Europe and the US largely agree that growth downgrades reflect energy and supply-chain stress flowing out of the Middle East shock, with differences showing more in emphasis than worldview. The notable gap is attention: the story matters globally, but active coverage is concentrated in the regions most exposed to market and policy fallout. That keeps PGI moderate-low while pushing GAI higher than a purely domestic economic update.'
  },
  {
    story_headline: 'Nigeria airlines threaten shutdown and Kenya cuts fuel VAT as energy stress spreads',
    category: 'energy',
    significance_label: 'high',
    regions_found: ['africa', 'europe', 'global'],
    regions_absent: ['us', 'middle-east', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 4.8,
    d2_causal: 6.2,
    d3_framing: 6.4,
    d4_emotional: 5.7,
    d5_actor_context: 6.5,
    d6_cui_bono: 6.8,
    gai: { d1: 7.2, d2: 7.9, d3: 7.6, d4: 8.4 },
    rationale: 'The basic developments are straightforward, but the story lands very differently across regions. African coverage is more likely to frame the fuel stress through lived system pressure, transport fragility and government intervention; European/global coverage may treat it as secondary fallout from a wider energy shock rather than a first-order social and economic disruption in its own right. That produces a meaningful PGI and a very high GAI: this is exactly the kind of consequential systems story that large audiences outside the affected regions can miss.'
  },
  {
    story_headline: 'Australia boosts military spending as Iran war reshapes strategic calculations',
    category: 'security',
    significance_label: 'medium',
    regions_found: ['pacific', 'us', 'global'],
    regions_absent: ['europe', 'middle-east', 'africa', 'south-asia', 'east-se-asia', 'central-asia', 'latin-america', 'caribbean'],
    d1_factual: 4.5,
    d2_causal: 5.4,
    d3_framing: 5.8,
    d4_emotional: 5.0,
    d5_actor_context: 5.9,
    d6_cui_bono: 6.1,
    gai: { d1: 7.5, d2: 7.1, d3: 7.3, d4: 6.9 },
    rationale: 'The announcement is fairly clear, but its interpretation depends on whether the region sees the Middle East war as a local crisis or a systemic security shock. Pacific coverage naturally reads the move through allied readiness and strategic posture; US coverage places it within burden-sharing and deterrence language; global coverage acknowledges the signal but often underplays its significance. PGI is moderate, but GAI is high because a defence-posture shift in Australia says something bigger about how far this conflict is rippling.'
  },
  {
    story_headline: 'TSMC and ASML forecasts show the AI chip capex boom is still accelerating',
    category: 'tech-ai',
    significance_label: 'high',
    regions_found: ['east-se-asia', 'us', 'europe', 'global'],
    regions_absent: ['middle-east', 'africa', 'south-asia', 'central-asia', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 3.6,
    d2_causal: 4.1,
    d3_framing: 4.3,
    d4_emotional: 3.8,
    d5_actor_context: 4.2,
    d6_cui_bono: 4.6,
    gai: { d1: 5.1, d2: 5.4, d3: 5.9, d4: 7.1 },
    rationale: 'This is one of the most consensus-driven stories in the scan. Regions differ mainly in emphasis: East Asian coverage stresses manufacturing depth and capacity expansion, US coverage stresses compute competition and cloud demand, European/global framing highlights industrial balance and capex resilience. Because the overall narrative is widely shared, PGI stays low. GAI lands in the middle range because the story is important but still concentrated in tech-attentive coverage zones.'
  },
  {
    story_headline: 'Colombia court orders return of funds collected under unconstitutional emergency',
    category: 'governance',
    significance_label: 'medium',
    regions_found: ['latin-america', 'us'],
    regions_absent: ['europe', 'middle-east', 'africa', 'south-asia', 'east-se-asia', 'central-asia', 'pacific', 'caribbean', 'global'],
    d1_factual: 4.1,
    d2_causal: 4.8,
    d3_framing: 5.0,
    d4_emotional: 4.4,
    d5_actor_context: 5.1,
    d6_cui_bono: 5.3,
    gai: { d1: 8.1, d2: 7.8, d3: 7.7, d4: 6.8 },
    rationale: 'The legal reversal is clear, but most of the world barely sees it. Latin American framing is more likely to register it as a meaningful institutional correction with implications for executive power, while US coverage—where present—tends to compress it into a narrower rule-of-law or political-stability note. PGI is moderate because the core facts are not especially disputed, but GAI is very high: a real state-change in governance can still remain regionally siloed.'
  },
  {
    story_headline: 'El Salvador formalises life-sentence reforms in a further hardening of security policy',
    category: 'legal',
    significance_label: 'medium',
    regions_found: ['latin-america', 'us', 'global'],
    regions_absent: ['europe', 'middle-east', 'africa', 'south-asia', 'east-se-asia', 'central-asia', 'pacific', 'caribbean'],
    d1_factual: 4.5,
    d2_causal: 5.5,
    d3_framing: 6.0,
    d4_emotional: 5.6,
    d5_actor_context: 6.1,
    d6_cui_bono: 6.3,
    gai: { d1: 7.3, d2: 7.2, d3: 7.0, d4: 6.7 },
    rationale: 'The policy hardening itself is not ambiguous, but regional narratives diverge over what it represents. Latin American coverage is more likely to situate it inside the Bukele security model and its democratic trade-offs; US and global coverage often frame it through crime-control severity, rights concerns or headline authoritarianism. The disagreement is real but not extreme, so PGI sits in the middle. GAI remains high because the story carries broader implications for governance and security politics beyond the region.'
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
