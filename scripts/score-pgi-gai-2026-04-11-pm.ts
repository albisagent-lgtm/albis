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

const scanDate = '2026-04-11';
const scanPeriod = 'pm';
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-11-pm-scores.json');

const REGION_DISTANCE: Record<string, number> = {
  'eu|us': 0.2,
  'middle_east|us': 0.9,
  'south_asia|us': 0.6,
  'east_se_asia|us': 0.3,
  'latin_americas|us': 0.5,
  'africa|us': 0.6,
  'east_se_asia|eu': 0.2,
  'middle_east|eu': 0.5,
  'south_asia|eu': 0.4,
  'latin_americas|eu': 0.35,
  'africa|eu': 0.35,
  'east_se_asia|middle_east': 0.4,
  'middle_east|south_asia': 0.4,
  'latin_americas|middle_east': 0.5,
  'africa|middle_east': 0.4,
  'east_se_asia|south_asia': 0.25,
  'latin_americas|south_asia': 0.35,
  'africa|south_asia': 0.3,
  'east_se_asia|latin_americas': 0.35,
  'africa|east_se_asia': 0.4,
  'africa|latin_americas': 0.25,
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
  return sig === 'critical' ? 4 : sig === 'high' ? 3 : sig === 'medium' ? 2 : 1;
}

const stories = [
  {
    story_headline: 'U.S.-Iran talks open in Pakistan under a fragile ceasefire that has not normalised the region',
    category: 'geopolitics',
    significance_label: 'critical',
    regions_found: ['us', 'eu', 'middle_east', 'south_asia', 'east_se_asia'],
    regions_absent: ['africa', 'latin_americas'],
    d1_factual: 5.7,
    d2_causal: 7.6,
    d3_framing: 8.4,
    d4_emotional: 7.4,
    d5_actor_context: 8.4,
    d6_cui_bono: 9.0,
    gai: { d1: 4.5, d2: 6.9, d3: 7.8, d4: 9.3 },
    rationale: 'The core facts are broadly shared: talks are real, Pakistan matters as host or mediator, and the ceasefire remains fragile. The perception gap opens over what those talks represent. U.S. and European coverage leans toward verification, sequencing, and risk management; Middle East framing gives more weight to coercion, sovereignty, and whether the ceasefire changes realities on the ground; South Asia naturally foregrounds Pakistan’s diplomatic agency; East and Southeast Asian coverage reads the story through energy and shipping stability. This is a high-PGI story because strategic meaning diverges more than baseline facts.'
  },
  {
    story_headline: 'The Strait of Hormuz is still not operationally reopened despite ceasefire language',
    category: 'economic_flows',
    significance_label: 'critical',
    regions_found: ['us', 'eu', 'middle_east', 'east_se_asia'],
    regions_absent: ['africa', 'latin_americas', 'south_asia'],
    d1_factual: 5.5,
    d2_causal: 6.9,
    d3_framing: 7.8,
    d4_emotional: 6.5,
    d5_actor_context: 7.7,
    d6_cui_bono: 8.7,
    gai: { d1: 5.7, d2: 7.4, d3: 8.2, d4: 9.6 },
    rationale: 'There is unusual cross-region agreement on the operational picture: the strait may be described as open diplomatically, but vessel flow remains far below normal. The gap comes from what counts as truth. Western and Asian market coverage treats traffic restoration as the real proof of de-escalation, while Middle East coverage more often centers leverage, deterrence, and who controls access. GAI is high because the chokepoint affects global energy and trade, yet direct attention remains concentrated in the regions closest to the security and shipping stakes.'
  },
  {
    story_headline: 'Israel authorises direct talks with Lebanon, creating a real but fragile diplomatic opening',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'middle_east'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 5.4,
    d2_causal: 7.0,
    d3_framing: 8.4,
    d4_emotional: 7.9,
    d5_actor_context: 8.3,
    d6_cui_bono: 8.6,
    gai: { d1: 7.0, d2: 8.0, d3: 8.4, d4: 8.9 },
    rationale: 'The authorization of direct talks is itself a meaningful state change, but regions do not narrate it the same way. U.S. and some European coverage tends to frame the move through security architecture and deterrence; Middle East coverage is more alert to whether diplomacy is genuine, conditional, or layered over continuing force. Actor portrayal and cui-bono run especially high because each frame assigns responsibility, sincerity, and leverage differently. GAI is elevated because this could matter regionally beyond the Levant, yet it is not being carried widely outside the most directly involved ecosystems.'
  },
  {
    story_headline: 'Russia declares an Orthodox Easter ceasefire and Ukraine reciprocates, but trust remains minimal',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'east_se_asia'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'middle_east'],
    d1_factual: 5.8,
    d2_causal: 7.1,
    d3_framing: 8.0,
    d4_emotional: 7.2,
    d5_actor_context: 8.0,
    d6_cui_bono: 8.3,
    gai: { d1: 7.0, d2: 7.3, d3: 7.9, d4: 8.8 },
    rationale: 'Most outlets agree the pause was announced and reciprocated in some form. Divergence begins with motive attribution and credibility. European coverage is more saturated with battlefield memory and skepticism, U.S. coverage often weighs strategic optics, and East/Southeast Asian framing is somewhat more event-driven and de-escalation attentive. This is a high-PGI story because the military status shift is real, yet its sincerity and usefulness are interpreted very differently.'
  },
  {
    story_headline: 'The Philippines declares a national energy emergency while Japan expands emergency oil releases',
    category: 'energy_security',
    significance_label: 'high',
    regions_found: ['east_se_asia', 'us', 'eu'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'middle_east'],
    d1_factual: 4.9,
    d2_causal: 6.5,
    d3_framing: 7.2,
    d4_emotional: 6.1,
    d5_actor_context: 7.0,
    d6_cui_bono: 7.8,
    gai: { d1: 7.0, d2: 7.8, d3: 8.6, d4: 9.2 },
    rationale: 'The policy actions are concrete and not very disputed, but coverage weights them differently. East and Southeast Asian reporting naturally treats these as front-line state responses to a live energy threat, while U.S. and European attention tends to absorb them into broader market or security narratives. PGI is moderate-high because the causal and narrative emphasis differs more than the facts. GAI is very high because these emergency moves affect large populations and reveal the crisis is still active, yet they are secondary in many global news agendas.'
  },
  {
    story_headline: 'India adapts to the energy shock with waivers and supply workarounds instead of waiting for normalisation',
    category: 'economic_flows',
    significance_label: 'medium',
    regions_found: ['south_asia', 'us', 'eu'],
    regions_absent: ['africa', 'latin_americas', 'middle_east', 'east_se_asia'],
    d1_factual: 4.8,
    d2_causal: 6.0,
    d3_framing: 6.6,
    d4_emotional: 5.4,
    d5_actor_context: 6.3,
    d6_cui_bono: 7.7,
    gai: { d1: 7.0, d2: 8.0, d3: 8.4, d4: 9.1 },
    rationale: 'Coverage is relatively aligned that India is managing exposure pragmatically through waivers, sourcing flexibility, and policy adaptation. The gap lies in emphasis: South Asian reporting foregrounds domestic resilience and statecraft, while U.S. and European coverage more often treats India as one downstream node in a wider oil-and-sanctions system. PGI is lower than the conflict stories because the facts are more stable. GAI is high because what happens in one of the world’s most populous countries is systemically important but not proportionally visible across regions.'
  },
  {
    story_headline: 'China pairs peace language on Taiwan with sustained maritime pressure rather than de-escalation',
    category: 'geopolitics',
    significance_label: 'high',
    regions_found: ['east_se_asia', 'us', 'eu'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'middle_east'],
    d1_factual: 5.2,
    d2_causal: 6.9,
    d3_framing: 8.1,
    d4_emotional: 7.0,
    d5_actor_context: 8.2,
    d6_cui_bono: 8.5,
    gai: { d1: 7.0, d2: 7.4, d3: 8.0, d4: 8.7 },
    rationale: 'The event frame is inherently split: diplomatic language suggests calm, while force posture suggests pressure. East Asian coverage tends to feel the contradiction most directly; U.S. framing often places it inside strategic competition and deterrence; European coverage is attentive but less saturated. Actor portrayal and framing score high because the same facts can be cast either as routine signalling, coercive pressure, or evidence that peace language is tactical camouflage. GAI is elevated because the issue is globally consequential but still not universal lead coverage this cycle.'
  },
  {
    story_headline: 'Gaza remains in ceasefire without humanitarian or political resolution',
    category: 'humanitarian',
    significance_label: 'high',
    regions_found: ['middle_east', 'eu', 'us'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 5.3,
    d2_causal: 7.2,
    d3_framing: 8.5,
    d4_emotional: 8.3,
    d5_actor_context: 8.7,
    d6_cui_bono: 8.8,
    gai: { d1: 7.0, d2: 8.1, d3: 8.5, d4: 9.4 },
    rationale: 'This is a strong perception-gap story because formal ceasefire language can coexist with radically different accounts of whether life has materially improved. U.S. and some European framing often tests process and diplomacy, while Middle East coverage is more likely to foreground the lived reality of continued attacks, constrained aid, stalled reconstruction, and unresolved power. Emotional and actor-portrayal gaps are especially high because moral weight and responsibility are distributed very differently across regions. GAI is also high: humanitarian stagnation of this scale should travel farther than it often does.'
  }
].map((story) => {
  const story_slug = slugify(story.story_headline);
  const story_pgi = average([story.d1_factual, story.d2_causal, story.d3_framing, story.d4_emotional, story.d5_actor_context, story.d6_cui_bono]);
  const pair_pgi: Record<string, number> = {};
  for (let i = 0; i < story.regions_found.length; i++) {
    for (let j = i + 1; j < story.regions_found.length; j++) {
      const [a, b] = [story.regions_found[i], story.regions_found[j]].sort();
      const key = `${a}|${b}`;
      pair_pgi[key] = round1(clamp(story_pgi + (REGION_DISTANCE[key] ?? 0.3)));
    }
  }
  return { ...story, story_slug, story_pgi, pair_pgi };
});

async function main() {
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
    coverage_breadth: Math.round(story.gai.d1),
    d1_coverage_breadth: story.gai.d1,
    d2_prominence_disparity: story.gai.d2,
    d3_population_exposure: story.gai.d3,
    d4_significance_severity: story.gai.d4,
    story_gai: average([story.gai.d1, story.gai.d2, story.gai.d3, story.gai.d4]),
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
      story_gai: average([story.gai.d1, story.gai.d2, story.gai.d3, story.gai.d4]),
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
