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

const scanDate = '2026-04-16';
const scanPeriod = 'am';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-16-am.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-16-am-scores.json');

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
    story_headline: 'US-Iran diplomacy stays alive despite blockade as mediation intensifies',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'middle-east', 'south-asia', 'europe', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia'],
    d1_factual: 6.1,
    d2_causal: 8.8,
    d3_framing: 9.2,
    d4_emotional: 8.2,
    d5_actor_context: 8.9,
    d6_cui_bono: 9.1,
    gai: { d1: 3.9, d2: 5.7, d3: 5.5, d4: 9.8 },
    rationale: 'Most regions accept the basic facts that pressure and diplomacy are running in parallel, but they sharply disagree on what kind of process this is. US coverage tends to frame coercion as leverage for a deal; Middle East framing is more likely to read it as negotiation under duress and a sovereignty struggle; South Asian reporting gives real agency to Pakistan’s mediation role; Europe emphasises escalation management and sanctions sequencing; global wires compress the whole picture into a fragile de-escalation signal. The perception gap is driven less by disputed facts than by radically different meanings assigned to talks under blockade.'
  },
  {
    story_headline: 'Lebanon-Israel direct talks raise prospect of a separate ceasefire track',
    category: 'diplomacy',
    significance_label: 'high',
    regions_found: ['middle-east', 'us', 'europe', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 5.8,
    d2_causal: 8.1,
    d3_framing: 8.7,
    d4_emotional: 7.7,
    d5_actor_context: 8.4,
    d6_cui_bono: 8.8,
    gai: { d1: 4.6, d2: 6.4, d3: 5.8, d4: 8.9 },
    rationale: 'The existence of direct contact is broadly shared, but the meaning of that contact varies a lot. US and European coverage often frame the talks as a practical off-ramp and evidence that the war map may be narrowing; Middle East coverage is more likely to ask whether this is a real ceasefire lane, a tactical pause, or a diplomatic theatre masking continued coercion; global coverage tends to flatten that tension. The PGI is high because the same talks can be read as breakthrough, compartmentalisation, or strategic illusion depending on region.'
  },
  {
    story_headline: 'Hormuz traffic remains constrained as vessels turn back and reopening terms stay contested',
    category: 'economic-flows',
    significance_label: 'critical',
    regions_found: ['middle-east', 'europe', 'east-se-asia', 'south-asia', 'global'],
    regions_absent: ['latin-america', 'caribbean', 'pacific'],
    d1_factual: 5.3,
    d2_causal: 6.8,
    d3_framing: 7.2,
    d4_emotional: 6.0,
    d5_actor_context: 6.9,
    d6_cui_bono: 7.4,
    gai: { d1: 3.2, d2: 5.0, d3: 4.7, d4: 9.5 },
    rationale: 'The shipping behaviour itself is relatively concrete, so factual divergence is lower than in the diplomatic stories. But regions still weight the implications differently: Middle East coverage sees strategic pressure and sovereignty bargaining; Europe focuses on maritime risk, insurance, and inflation spillovers; South and East Asian coverage foregrounds import dependence and supply vulnerability; global wires frame it as a systems choke point. That makes PGI moderate-high rather than extreme, while GAI stays meaningful because the story matters far beyond the regions following corridor detail closely.'
  },
  {
    story_headline: 'IMF cuts global growth outlook and warns war-driven energy shock could worsen',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['global', 'us', 'europe', 'east-se-asia', 'middle-east', 'africa', 'latin-america'],
    regions_absent: ['caribbean'],
    d1_factual: 3.9,
    d2_causal: 4.7,
    d3_framing: 4.9,
    d4_emotional: 4.3,
    d5_actor_context: 4.8,
    d6_cui_bono: 5.2,
    gai: { d1: 1.8, d2: 2.8, d3: 2.4, d4: 8.7 },
    rationale: 'This is one of the more consensus-driven stories in the scan. Regions broadly agree that the IMF downgrade reflects war-fed energy stress and reduced policy room, though emphasis differs: wealthier regions frame it via central banks, markets and growth; poorer regions localise it through fuel costs, subsidy dilemmas and household pain. The PGI is therefore comparatively low. GAI is also low because the story travels globally, even if its significance remains high.'
  },
  {
    story_headline: 'IAEA says North Korea is sharply boosting nuclear weapons capacity',
    category: 'security',
    significance_label: 'high',
    regions_found: ['east-se-asia', 'us', 'global'],
    regions_absent: ['middle-east', 'africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.8,
    d2_causal: 6.6,
    d3_framing: 6.9,
    d4_emotional: 6.1,
    d5_actor_context: 6.8,
    d6_cui_bono: 7.0,
    gai: { d1: 5.8, d2: 6.5, d3: 6.2, d4: 8.4 },
    rationale: 'The factual core is reasonably stable because the IAEA signal anchors the story, but there is still a notable framing split. East Asian coverage tends to read this through direct deterrence and alliance risk, US coverage through strategic balance and missile defence posture, while global reporting often reduces it to a background escalation item. The story is under-seen outside the most security-attentive regions, so GAI rises meaningfully even though the issue is structurally important.'
  },
  {
    story_headline: 'Russia launches more than 300 drones and missiles at Ukraine overnight',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['middle-east', 'africa', 'latin-america', 'pacific', 'caribbean'],
    d1_factual: 4.6,
    d2_causal: 5.8,
    d3_framing: 6.0,
    d4_emotional: 5.5,
    d5_actor_context: 6.2,
    d6_cui_bono: 6.4,
    gai: { d1: 4.9, d2: 5.8, d3: 5.6, d4: 8.6 },
    rationale: 'The attack scale is clear, but the story is framed differently across the regions that still give it sustained attention. European coverage reads it as a live war-of-endurance story with direct security consequences; US framing often folds it into aid, stockpile and strategic commitment debates; global coverage acknowledges intensity but gives it less narrative space than the Middle East. PGI is moderate, while GAI is elevated because even major Ukraine attacks are increasingly crowded out elsewhere.'
  },
  {
    story_headline: 'Hungary’s election winner promises democratic reset and EU funds push',
    category: 'governance',
    significance_label: 'medium',
    regions_found: ['europe', 'global'],
    regions_absent: ['us', 'middle-east', 'africa', 'latin-america', 'pacific', 'caribbean', 'south-asia', 'east-se-asia'],
    d1_factual: 5.0,
    d2_causal: 6.5,
    d3_framing: 7.0,
    d4_emotional: 5.8,
    d5_actor_context: 6.9,
    d6_cui_bono: 7.2,
    gai: { d1: 6.5, d2: 7.4, d3: 6.9, d4: 6.7 },
    rationale: 'The result is straightforward enough, but its implications are not. European coverage naturally treats Hungary through the lens of rule-of-law disputes, Brussels funding and bloc governance, while global-wire framing flattens it into a general democratic-reset headline. Because the story remains concentrated in Europe-centric attention zones despite real policy implications, GAI is high. PGI is solidly above mid-range because the same election can be read as a structural reset, a partial correction, or an overinterpreted symbolic shift.'
  },
  {
    story_headline: 'Germany pledges more aid for Sudan as conference seeks broader humanitarian support',
    category: 'health',
    significance_label: 'medium',
    regions_found: ['africa', 'europe', 'global'],
    regions_absent: ['us', 'middle-east', 'latin-america', 'pacific', 'caribbean', 'east-se-asia'],
    d1_factual: 5.3,
    d2_causal: 7.0,
    d3_framing: 7.6,
    d4_emotional: 6.9,
    d5_actor_context: 7.2,
    d6_cui_bono: 7.5,
    gai: { d1: 7.6, d2: 8.3, d3: 7.8, d4: 7.7 },
    rationale: 'The aid pledge itself is clear, but regions interpret what it means very differently. European coverage may frame it as donor responsibility and conference diplomacy; African framing is more likely to place it against the scale of need, hunger and years of neglect; global coverage often recognises the crisis but still underweights it. That creates a high attention gap and a strong PGI, because the disagreement is not over whether aid matters, but over whether the world is meaningfully responding at all.'
  },
  {
    story_headline: 'Brazil runoff polling shows Lula and Flavio Bolsonaro statistically tied',
    category: 'governance',
    significance_label: 'medium',
    regions_found: ['latin-america', 'global'],
    regions_absent: ['us', 'europe', 'middle-east', 'africa', 'pacific', 'caribbean', 'south-asia'],
    d1_factual: 4.7,
    d2_causal: 6.1,
    d3_framing: 6.8,
    d4_emotional: 6.0,
    d5_actor_context: 6.5,
    d6_cui_bono: 6.8,
    gai: { d1: 6.9, d2: 7.6, d3: 7.1, d4: 6.6 },
    rationale: 'Polling is inherently more interpretation-heavy than hard-event reporting, and regional framing reflects that. Latin American coverage is more likely to treat the result as an early but important signal about institutional direction, polarisation and bloc politics; global coverage tends to present it as a notable but still preliminary election development. PGI is moderately high because the dispute is about trajectory and significance rather than raw data. GAI is also high because one of the world’s most important democracies still attracts uneven attention outside the region.'
  },
  {
    story_headline: 'AI infrastructure race continues as Meta expands chip partnership and South Korea pushes robot AI',
    category: 'tech-ai',
    significance_label: 'medium',
    regions_found: ['us', 'east-se-asia', 'europe', 'global'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'pacific', 'middle-east'],
    d1_factual: 3.5,
    d2_causal: 4.0,
    d3_framing: 4.3,
    d4_emotional: 3.8,
    d5_actor_context: 4.2,
    d6_cui_bono: 4.5,
    gai: { d1: 5.0, d2: 5.5, d3: 5.8, d4: 6.2 },
    rationale: 'This is a relatively low-divergence story because the facts fit an already familiar global narrative: AI capability races continue despite macro volatility. Regions differ more in emphasis than interpretation, with US coverage stressing compute strategy, East Asian coverage highlighting industrial deployment and hardware capacity, European/global coverage focusing on competitiveness and power balance. PGI is therefore low. GAI is middle-range because the story is visible in tech-attentive regions but not universal outside them.'
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
