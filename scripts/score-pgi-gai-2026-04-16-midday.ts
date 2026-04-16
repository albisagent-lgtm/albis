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
const scanPeriod = 'midday';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-16-midday.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-16-midday-scores.json');

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
    story_headline: 'US-Iran ceasefire may be extended as mediation continues despite naval blockade pressure',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 6.2,
    d2_causal: 8.9,
    d3_framing: 9.3,
    d4_emotional: 8.3,
    d5_actor_context: 8.9,
    d6_cui_bono: 9.2,
    gai: { d1: 3.8, d2: 5.9, d3: 5.6, d4: 9.8 },
    rationale: 'There is broad agreement that mediation is active and that an extension is being discussed, but regions split sharply on what that means. US and European coverage tends to frame blockade pressure as leverage inside a fragile bargaining process; Middle East coverage is more likely to read the same structure as coercion wrapped around diplomacy; South Asian framing often gives more weight to mediation channels and regional spillovers; global wires compress the whole story into cautious de-escalation. The gap is driven less by whether talks exist than by whether pressure and diplomacy can be treated as legitimate partners.'
  },
  {
    story_headline: 'Israel discusses possible Lebanon ceasefire while strikes continue and medics are killed',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['middle-east', 'europe', 'us', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'south-asia'],
    d1_factual: 5.9,
    d2_causal: 8.2,
    d3_framing: 8.8,
    d4_emotional: 8.1,
    d5_actor_context: 8.5,
    d6_cui_bono: 8.7,
    gai: { d1: 4.7, d2: 6.6, d3: 5.9, d4: 9.1 },
    rationale: 'The facts of continued strikes alongside ceasefire discussion are shared, but the narrative meaning diverges strongly. Western coverage often frames this as a weak but real diplomatic opening; regional coverage gives much more weight to the contradiction between talks and ongoing attacks, especially on medics; US framing is more likely to separate Lebanon from the wider Iran track, while Middle East reporting questions that separation. The perception gap comes from whether the talks look like genuine de-escalation, geographic compartmentalisation, or diplomatic cover for continued force.'
  },
  {
    story_headline: 'Hungary\'s opposition wins big as Viktor Orbán concedes defeat',
    category: 'governance',
    significance_label: 'high',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['africa', 'middle-east', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 5.2,
    d2_causal: 6.9,
    d3_framing: 7.5,
    d4_emotional: 6.3,
    d5_actor_context: 7.4,
    d6_cui_bono: 7.9,
    gai: { d1: 5.8, d2: 7.1, d3: 6.8, d4: 8.5 },
    rationale: 'The result itself is clear, but its meaning is regionally uneven. European coverage sees a structural shift in EU politics, rule-of-law disputes and Ukraine-related veto dynamics; US coverage reads it through alliance cohesion and democratic rollback narratives; global coverage recognises the upset but often treats it as a secondary European political item. PGI sits in the solid upper-middle range because the disagreement is about scale and consequences rather than the vote count itself, while GAI is high because much of the world barely tracks the internal EU significance.'
  },
  {
    story_headline: 'Fire at Australia\'s Geelong refinery threatens petrol supply during wider energy stress',
    category: 'energy',
    significance_label: 'high',
    regions_found: ['pacific', 'east-se-asia', 'global'],
    regions_absent: ['us', 'europe', 'africa', 'middle-east', 'south-asia', 'latin-america', 'caribbean', 'central-asia'],
    d1_factual: 3.8,
    d2_causal: 4.5,
    d3_framing: 4.7,
    d4_emotional: 4.1,
    d5_actor_context: 4.4,
    d6_cui_bono: 4.8,
    gai: { d1: 7.1, d2: 7.5, d3: 7.2, d4: 7.8 },
    rationale: 'There is not much factual disagreement here: a major refinery incident has created a live fuel-system risk. The split is mostly about salience. Pacific coverage treats it as an immediate resilience and supply story; East and Southeast Asian framing places it inside regional energy vulnerability; global coverage notices it mainly as part of a broader shock map. PGI remains low because the event is concrete, but GAI is high because a meaningful infrastructure stress event is barely visible in many larger attention zones.'
  },
  {
    story_headline: 'US-Philippines drills reinforce alliance posture in the South China Sea',
    category: 'security',
    significance_label: 'high',
    regions_found: ['us', 'east-se-asia', 'pacific', 'global'],
    regions_absent: ['europe', 'africa', 'middle-east', 'south-asia', 'latin-america', 'caribbean', 'central-asia'],
    d1_factual: 4.5,
    d2_causal: 5.7,
    d3_framing: 6.2,
    d4_emotional: 5.3,
    d5_actor_context: 6.0,
    d6_cui_bono: 6.3,
    gai: { d1: 5.4, d2: 6.2, d3: 6.0, d4: 8.1 },
    rationale: 'Most regions that cover the drills agree on the underlying event, but they do not attach the same strategic meaning to it. US reporting foregrounds deterrence credibility and multi-theatre commitment; East and Southeast Asian coverage is more sensitive to local escalation risk and alliance reassurance; Pacific/global framing tends to treat it as a posture signal rather than a policy change. The PGI is moderate because the disagreement is over interpretation and audience, not basic facts. GAI is also meaningful because outside the Indo-Pacific and US security lens, the story receives thinner attention than its strategic importance suggests.'
  },
  {
    story_headline: 'More than 1 million Sudanese refugees in Chad face drastic aid cuts',
    category: 'migration',
    significance_label: 'critical',
    regions_found: ['africa', 'europe', 'global'],
    regions_absent: ['us', 'middle-east', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 5.4,
    d2_causal: 6.9,
    d3_framing: 7.5,
    d4_emotional: 7.0,
    d5_actor_context: 7.1,
    d6_cui_bono: 7.6,
    gai: { d1: 8.0, d2: 8.3, d3: 8.1, d4: 9.3 },
    rationale: 'The humanitarian facts are fairly stable, but the moral and political reading is not. African coverage is more likely to frame this as chronic abandonment layered onto a regional survival crisis; European coverage often treats it through donor pressure and conference language; global coverage recognises the scale but still gives it less narrative weight than the severity warrants. PGI is strong because regions disagree on whether this is a tragic but familiar aid story or a major global failure. GAI is extremely high because a crisis affecting over a million people remains strikingly under-seen outside the most directly engaged zones.'
  },
  {
    story_headline: 'Turkey suffers a second school shooting in two days',
    category: 'social',
    significance_label: 'medium',
    regions_found: ['europe', 'middle-east', 'global'],
    regions_absent: ['us', 'africa', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.1,
    d2_causal: 4.8,
    d3_framing: 5.0,
    d4_emotional: 5.5,
    d5_actor_context: 5.1,
    d6_cui_bono: 5.2,
    gai: { d1: 6.2, d2: 6.8, d3: 6.4, d4: 6.9 },
    rationale: 'Event reporting keeps the factual base fairly aligned, but regions still frame the pattern differently. European and regional coverage give more attention to public safety, social stress and copycat risk, while global coverage treats it more as a tragic event item. The PGI stays moderate because there is no deep ideological split in the facts, but GAI is elevated since repeated school attacks in a major regional state still do not travel far beyond the immediate geography.'
  },
  {
    story_headline: 'South Africa appoints Roelf Meyer as ambassador to the United States',
    category: 'diplomacy',
    significance_label: 'medium',
    regions_found: ['africa', 'us', 'global'],
    regions_absent: ['europe', 'middle-east', 'south-asia', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 3.3,
    d2_causal: 3.9,
    d3_framing: 4.3,
    d4_emotional: 3.8,
    d5_actor_context: 4.5,
    d6_cui_bono: 4.8,
    gai: { d1: 6.5, d2: 6.9, d3: 6.6, d4: 5.9 },
    rationale: 'The facts are straightforward and relatively low-dispute, so PGI is modest. The real split is over importance: African coverage is more likely to see Meyer\'s transition-era credibility as meaningful diplomatic signalling, while US and global treatment tends to narrow the story into routine staffing unless the wider bilateral relationship is foregrounded. That keeps PGI low but GAI noticeable, because diplomatic state changes outside the main war theatres often pass with limited global attention.'
  },
  {
    story_headline: 'India prepares to decide women\'s quota bill amid parliamentary seat redistribution row',
    category: 'governance',
    significance_label: 'high',
    regions_found: ['south-asia', 'global'],
    regions_absent: ['us', 'europe', 'africa', 'middle-east', 'east-se-asia', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 4.6,
    d2_causal: 6.1,
    d3_framing: 6.9,
    d4_emotional: 5.9,
    d5_actor_context: 6.5,
    d6_cui_bono: 6.8,
    gai: { d1: 7.4, d2: 7.8, d3: 7.5, d4: 8.2 },
    rationale: 'International summaries often present this mainly as a women\'s representation story, while Indian coverage is much more alive to the delimitation fight and the federal redistribution of power underneath it. That creates a solid PGI: not because the bill itself is disputed, but because regions differ sharply on what the real story is. GAI is high because a governance shift in the world\'s most populous democracy remains under-covered outside South Asia relative to its long-term significance.'
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
