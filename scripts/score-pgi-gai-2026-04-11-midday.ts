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
const scanPeriod = 'midday';
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-11-midday-scores.json');

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
    story_headline: 'U.S.-Iran talks open in Pakistan under a fragile two-week ceasefire',
    category: 'geopolitics',
    significance_label: 'critical',
    regions_found: ['us', 'eu', 'middle_east', 'south_asia', 'east_se_asia'],
    regions_absent: ['africa', 'latin_americas'],
    d1_factual: 5.8,
    d2_causal: 7.5,
    d3_framing: 8.4,
    d4_emotional: 7.3,
    d5_actor_context: 8.3,
    d6_cui_bono: 9.0,
    gai: { d1: 4.5, d2: 6.9, d3: 7.6, d4: 9.2 },
    rationale: 'All regions broadly recognise that talks are happening, but they do not agree on what those talks mean. U.S. and European coverage leans toward verification, sequencing, and ceasefire durability; Middle East framing stresses sovereignty, coercion, and whether the truce is substantive; South Asia foregrounds Pakistan as a consequential mediator; East/Southeast Asian coverage reads the talks through shipping, oil, and stability. The gap is driven more by strategic interpretation than disputed facts.'
  },
  {
    story_headline: 'The Strait of Hormuz remains only partially reopened despite the ceasefire headline',
    category: 'economic_flows',
    significance_label: 'critical',
    regions_found: ['us', 'eu', 'middle_east', 'east_se_asia'],
    regions_absent: ['africa', 'latin_americas', 'south_asia'],
    d1_factual: 5.6,
    d2_causal: 7.0,
    d3_framing: 7.7,
    d4_emotional: 6.6,
    d5_actor_context: 7.5,
    d6_cui_bono: 8.6,
    gai: { d1: 5.7, d2: 7.2, d3: 8.0, d4: 9.5 },
    rationale: 'There is substantial factual overlap that traffic is still impaired, but the framing diverges over what counts as a real reopening. Western and Asian business coverage treats vessel flow as the truth test; Middle East framing pays more attention to leverage, control, and the politics of access. The story matters globally, yet direct coverage is still concentrated in regions most exposed to security and energy-market risk.'
  },
  {
    story_headline: 'Israel-Lebanon talks show a fresh opening, but truce conditions remain unstable',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'middle_east'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 5.2,
    d2_causal: 6.9,
    d3_framing: 8.2,
    d4_emotional: 7.8,
    d5_actor_context: 8.1,
    d6_cui_bono: 8.2,
    gai: { d1: 7.0, d2: 7.9, d3: 8.4, d4: 8.8 },
    rationale: 'The same diplomatic opening is read either as a meaningful step toward containment, a tactical manoeuvre under military pressure, or proof that diplomacy is still conditional and fragile. Actor portrayal diverges sharply between security-first, sovereignty-first, and de-escalation-first frames. High GAI reflects that a potentially important regional state change is not traveling widely beyond directly involved news ecosystems.'
  },
  {
    story_headline: 'Russia and Ukraine enter a short Orthodox Easter ceasefire with no durable talks yet',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'east_se_asia'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'middle_east'],
    d1_factual: 5.7,
    d2_causal: 7.0,
    d3_framing: 8.0,
    d4_emotional: 7.2,
    d5_actor_context: 8.0,
    d6_cui_bono: 8.3,
    gai: { d1: 7.0, d2: 7.3, d3: 7.9, d4: 8.7 },
    rationale: 'Most regions agree that a reciprocal holiday pause was announced, but disagreement starts immediately on motive and credibility. Europe tends to read it through war proximity and pattern recognition, U.S. coverage through strategic signalling, and East/Southeast Asian coverage through the possibility of de-escalation. The main PGI driver is motive attribution rather than contested event facts.'
  },
  {
    story_headline: 'Ecuador and Colombia formalise a tariff war with reciprocal 100% duties',
    category: 'economic_flows',
    significance_label: 'medium',
    regions_found: ['latin_americas', 'us', 'eu'],
    regions_absent: ['africa', 'south_asia', 'east_se_asia', 'middle_east'],
    d1_factual: 4.8,
    d2_causal: 5.9,
    d3_framing: 6.8,
    d4_emotional: 5.6,
    d5_actor_context: 6.5,
    d6_cui_bono: 7.4,
    gai: { d1: 7.0, d2: 7.1, d3: 7.5, d4: 7.6 },
    rationale: 'The tariff action itself is not highly disputed, but the meaning differs by vantage point. Latin American coverage reads it as a concrete bilateral escalation with regional trade implications, while U.S. and European attention is thinner and more technocratic. Lower PGI than the war stories, but still a meaningful blind-spot item because the policy change is real and under-amplified globally.'
  },
  {
    story_headline: 'War-driven oil and tariff pressure are feeding inflation and second-order market stress',
    category: 'business_markets',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'east_se_asia'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'middle_east'],
    d1_factual: 4.9,
    d2_causal: 6.6,
    d3_framing: 7.0,
    d4_emotional: 5.8,
    d5_actor_context: 6.8,
    d6_cui_bono: 7.6,
    gai: { d1: 7.0, d2: 6.8, d3: 7.8, d4: 8.2 },
    rationale: 'Coverage agrees that energy shock and tariff pass-through are shaping inflation narratives, but regions disagree on what matters most: geopolitics, central-bank pressure, consumer pain, or supply-chain resilience. This creates a moderate perception gap anchored in causal emphasis rather than factual conflict. GAI is elevated because the macro story affects many populations even when it is often treated as a secondary consequence instead of a lead event.'
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
