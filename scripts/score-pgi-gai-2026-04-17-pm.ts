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
const scanPeriod = 'pm';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-17-pm.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-17-pm-scores.json');

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
    story_headline: 'Israel-Lebanon 10-day ceasefire takes effect but early violation claims cloud durability',
    category: 'conflict',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 3.6,
    d2_causal: 6.9,
    d3_framing: 7.5,
    d4_emotional: 7.7,
    d5_actor_context: 7.3,
    d6_cui_bono: 6.7,
    gai: { d1: 3.0, d2: 4.2, d3: 4.9, d4: 8.8 },
    rationale: 'The ceasefire itself is widely accepted as a real state change, which keeps the factual gap low. The divergence opens over what the first-hours violations mean: Western wires often treat them as stress on an otherwise meaningful de-escalation, regional reporting is more likely to foreground fragility, distrust, and civilian risk, and South Asian framing leans toward whether mediation space can hold. So the PGI is solid but not extreme: broad agreement on the event, stronger disagreement on durability, blame, and who actually benefits from the pause.'
  },
  {
    story_headline: 'Pakistan-led mediation keeps U.S.-Iran diplomacy alive as parties narrow gaps',
    category: 'diplomacy',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia'],
    regions_absent: ['africa', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.8,
    d2_causal: 7.9,
    d3_framing: 8.5,
    d4_emotional: 7.0,
    d5_actor_context: 8.1,
    d6_cui_bono: 8.3,
    gai: { d1: 4.2, d2: 6.0, d3: 5.8, d4: 8.4 },
    rationale: 'This is the sharpest perception-gap story in the PM cycle. Most regions accept that mediation is active, but they assign very different meaning to it: a genuine off-ramp, bargaining under pressure, Pakistan’s rise as a useful broker, or a narrow tactical pause in a coercive environment. US and Europe tilt toward risk reduction and process management; Middle East framing emphasizes sovereignty, sanctions sequencing, and distrust; South Asia gives more weight to Pakistani agency. High PGI, with GAI elevated because coverage is still concentrated despite the global stakes.'
  },
  {
    story_headline: 'Hormuz reopening signals and deal speculation push oil lower as traders price de-escalation',
    category: 'economic-flows',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia'],
    regions_absent: ['africa', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.1,
    d2_causal: 7.0,
    d3_framing: 7.6,
    d4_emotional: 5.9,
    d5_actor_context: 6.8,
    d6_cui_bono: 7.2,
    gai: { d1: 4.1, d2: 5.7, d3: 5.8, d4: 9.1 },
    rationale: 'The underlying signal is tentative rather than settled, which creates some factual ambiguity, but the main gap is interpretive. Financial and Western coverage tends to treat the story through oil pricing and market repricing; Middle East reporting is more likely to connect Hormuz access to sovereignty, bargaining leverage, and sanction relief; South Asian framing gives stronger weight to import dependence and shipping exposure. PGI lands in the mid-high range. GAI is also high because the significance is global while the coverage map is still patchy relative to the story’s system importance.'
  },
  {
    story_headline: 'Washington escalates economic pressure on Iran even as diplomacy remains possible',
    category: 'sanctions',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia'],
    regions_absent: ['africa', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.9,
    d2_causal: 7.3,
    d3_framing: 7.8,
    d4_emotional: 6.4,
    d5_actor_context: 7.6,
    d6_cui_bono: 8.2,
    gai: { d1: 4.2, d2: 6.1, d3: 5.9, d4: 8.2 },
    rationale: 'There is broad agreement that pressure is still intensifying even while diplomacy remains open. The gap lies in what sanctions are understood to be doing: leverage for a deal, proof that the diplomatic opening is shallow, or a structural contradiction that makes snapback more likely. US framing is most likely to justify coercion as bargaining power; Middle East framing is more likely to read it as domination and bad-faith sequencing; European and South Asian coverage often emphasize instability created by pressure-plus-talks. High PGI, though slightly below the mediation story because the factual layer is more stable.'
  },
  {
    story_headline: 'Germany cuts growth forecasts as Iran-war energy shock hits Europe',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['middle-east', 'africa', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 3.3,
    d2_causal: 4.8,
    d3_framing: 5.1,
    d4_emotional: 4.1,
    d5_actor_context: 4.9,
    d6_cui_bono: 5.4,
    gai: { d1: 5.8, d2: 7.0, d3: 6.8, d4: 8.0 },
    rationale: 'This is more of a consensus macro story than a narrative-war story. Most covered regions agree that Germany’s downgrade reflects energy shock transmission from the Middle East conflict. The gap is mostly about emphasis: European reporting naturally centers industrial slowdown and inflation stress, US coverage folds it into broader market and rate expectations, while global framing compresses it into a general Europe-growth warning. PGI stays relatively low. GAI is meaningfully high because the economic significance is wide but the coverage remains concentrated in Europe-facing and financial-news audiences.'
  },
  {
    story_headline: 'White House moves toward controlled Mythos access for agencies as cyber fears spread',
    category: 'tech-ai',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'east-se-asia'],
    regions_absent: ['middle-east', 'africa', 'south-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.5,
    d2_causal: 7.6,
    d3_framing: 8.2,
    d4_emotional: 6.8,
    d5_actor_context: 8.0,
    d6_cui_bono: 8.1,
    gai: { d1: 5.6, d2: 7.1, d3: 7.0, d4: 8.3 },
    rationale: 'This is a strong PGI story because the same development can be read as prudent cyber defense, frontier-model containment, or quiet state capture of strategic AI capability. US coverage is most likely to frame controlled access as a governance response; European coverage leans toward cyber risk and regulatory implications; East Asian framing often ties it to strategic competition and infrastructure resilience. The issue is highly consequential but still absent across many regions, so GAI is also high.'
  },
  {
    story_headline: 'Lula attacks Trump-era tariffs and sanctions pressure in sovereignty-focused Brazil framing',
    category: 'trade',
    significance_label: 'medium',
    regions_found: ['latin-america', 'europe'],
    regions_absent: ['us', 'middle-east', 'africa', 'south-asia', 'east-se-asia', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 5.2,
    d2_causal: 7.9,
    d3_framing: 8.7,
    d4_emotional: 7.4,
    d5_actor_context: 8.5,
    d6_cui_bono: 8.8,
    gai: { d1: 7.4, d2: 8.1, d3: 8.0, d4: 6.7 },
    rationale: 'This is the clearest framing split outside the Middle East cluster. Latin American coverage is more likely to cast the dispute through sovereignty, judicial legitimacy, and external pressure on domestic institutions; European coverage reads it more as an interview-driven geopolitical signal within a wider tariffs-and-sanctions pattern. Because the US is notably absent from the regions_found despite being central to the dispute, GAI rises sharply. PGI is very high because the clash is less about raw facts than about the political meaning of pressure itself.'
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
