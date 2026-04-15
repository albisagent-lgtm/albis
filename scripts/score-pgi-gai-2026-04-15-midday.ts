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

const scanDate = '2026-04-15';
const scanPeriod = 'midday';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-15-midday.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-15-midday-scores.json');

const REGION_DISTANCE: Record<string, number> = {
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
    story_headline: 'US port blockade on Iran remains the dominant state change, raising retaliation risk',
    category: 'conflict',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'east-se-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'pacific', 'central-asia', 'south-asia'],
    d1_factual: 6.7,
    d2_causal: 8.9,
    d3_framing: 9.4,
    d4_emotional: 8.8,
    d5_actor_context: 9.0,
    d6_cui_bono: 9.5,
    gai: { d1: 2.8, d2: 5.7, d3: 4.9, d4: 9.8 },
    rationale: 'Shared core facts exist around the blockade posture, but the meaning of the move diverges sharply by region. US coverage tends to frame it as coercive leverage and enforcement; European coverage stresses shipping and escalation management; Middle East coverage reads it through sovereignty, punishment, and retaliation risk; East and Southeast Asian coverage leans toward trade, tanker, and energy exposure; global-wire framing compresses these into crisis management. The biggest gap is not whether the blockade exists, but whether it is deterrence, provocation, or the start of a wider war economy.'
  },
  {
    story_headline: 'US and Iran keep a narrow path open for renewed talks despite the blockade',
    category: 'diplomacy',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'pacific', 'central-asia', 'east-se-asia'],
    d1_factual: 5.9,
    d2_causal: 8.0,
    d3_framing: 8.7,
    d4_emotional: 7.9,
    d5_actor_context: 8.4,
    d6_cui_bono: 8.8,
    gai: { d1: 3.8, d2: 6.3, d3: 5.6, d4: 8.8 },
    rationale: 'There is broad factual overlap that the channel remains open, but regions disagree on whether that lane is meaningful or mostly theatrical. US reporting often foregrounds negotiation sequencing and White House optionality; Middle East framing is more sceptical about talks under pressure; South Asian coverage gives more weight to Islamabad and mediation space; European coverage treats diplomacy as necessary but fragile. The perception gap comes from trust, agency, and whether dialogue is a real off-ramp or just a buffer inside a worsening coercive environment.'
  },
  {
    story_headline: 'Britain and France organize Hormuz talks on sanctions, seafarers, and shipping restart',
    category: 'security',
    significance_label: 'high',
    regions_found: ['europe', 'us', 'middle-east', 'global'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'pacific', 'central-asia', 'south-asia', 'east-se-asia'],
    d1_factual: 5.6,
    d2_causal: 7.1,
    d3_framing: 7.8,
    d4_emotional: 6.8,
    d5_actor_context: 7.9,
    d6_cui_bono: 8.2,
    gai: { d1: 4.7, d2: 7.2, d3: 6.3, d4: 8.6 },
    rationale: 'Coverage agrees the talks are happening, but diverges on what Europe is actually doing: stabilising shipping, preparing another pressure instrument, or trying to reclaim relevance beside Washington. European coverage naturally emphasises maritime management and institutional coordination; US coverage treats it as allied burden-sharing; Middle East framing is more ambivalent because sanctions and military escort logic can look like de-escalation for commerce but escalation for sovereignty. That makes this a moderate-high PGI story with a higher attention gap than the main blockade headline.'
  },
  {
    story_headline: 'IMF cuts global growth outlook as war-driven energy shock spreads',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['global', 'us', 'europe', 'middle-east', 'east-se-asia', 'south-asia', 'africa', 'latin-america'],
    regions_absent: ['caribbean', 'pacific', 'central-asia'],
    d1_factual: 3.9,
    d2_causal: 4.8,
    d3_framing: 5.1,
    d4_emotional: 4.4,
    d5_actor_context: 4.7,
    d6_cui_bono: 5.2,
    gai: { d1: 1.8, d2: 2.9, d3: 2.4, d4: 8.5 },
    rationale: 'The underlying facts and baseline interpretation are comparatively stable: the IMF downgraded growth because Gulf disruption is feeding into inflation, trade, and confidence. Regional differences exist mostly in emphasis, with richer economies leaning macro and market-oriented while poorer regions localise fuel, food, and affordability pain. The PGI is therefore modest. GAI is also relatively low because the story travels widely, though its human impact remains globally significant.'
  },
  {
    story_headline: 'Hungary election result may unlock rapid EU aid release for Ukraine',
    category: 'governance',
    significance_label: 'high',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'pacific', 'central-asia', 'south-asia', 'east-se-asia', 'middle-east'],
    d1_factual: 5.1,
    d2_causal: 6.9,
    d3_framing: 7.5,
    d4_emotional: 6.2,
    d5_actor_context: 7.4,
    d6_cui_bono: 8.0,
    gai: { d1: 5.7, d2: 7.0, d3: 6.8, d4: 8.4 },
    rationale: 'The event itself is fairly clear, but what it means is contested. European coverage reads the result through institutional throughput, Orban-era obstruction, and strategic cohesion; US coverage places it inside the broader Ukraine support architecture; global-wire framing flattens those distinctions. The perception gap is driven by how much agency the new Hungarian outcome is thought to have over the war-support system, while GAI is elevated because a potentially important EU internal shift remains concentrated in Atlantic and European attention zones.'
  },
  {
    story_headline: 'Colombia reverses blanket 100% tariffs on Ecuador in a clear policy rollback',
    category: 'trade',
    significance_label: 'medium',
    regions_found: ['latin-america', 'us', 'global'],
    regions_absent: ['africa', 'caribbean', 'pacific', 'central-asia', 'south-asia', 'east-se-asia', 'middle-east', 'europe'],
    d1_factual: 4.2,
    d2_causal: 5.8,
    d3_framing: 6.2,
    d4_emotional: 5.1,
    d5_actor_context: 5.9,
    d6_cui_bono: 6.4,
    gai: { d1: 7.0, d2: 8.1, d3: 7.2, d4: 6.2 },
    rationale: 'This is a cleaner policy reversal than many geopolitical stories, so basic facts are relatively stable. Latin American coverage naturally treats it as a meaningful de-escalation in a live regional dispute, while global and US framing tends to downgrade it as a secondary item beneath larger war and market narratives. That keeps PGI moderate rather than extreme, but GAI relatively high because genuine de-escalation outside the main power centres is exactly the kind of story much of the world misses.'
  },
  {
    story_headline: 'Cyclone Vaianu triggers evacuations and infrastructure stress in New Zealand',
    category: 'climate',
    significance_label: 'medium',
    regions_found: ['pacific', 'global'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'central-asia', 'south-asia', 'east-se-asia', 'middle-east', 'europe', 'us'],
    d1_factual: 3.4,
    d2_causal: 4.0,
    d3_framing: 4.5,
    d4_emotional: 4.3,
    d5_actor_context: 4.1,
    d6_cui_bono: 4.7,
    gai: { d1: 8.5, d2: 8.3, d3: 8.8, d4: 6.5 },
    rationale: 'Hazard reporting usually produces less factual divergence, and that is true here. The split is mostly one of salience: Pacific framing treats evacuations, outages, and emergency management as a concrete systems story, while global coverage tends to register it briefly if at all. So PGI stays low-moderate but GAI climbs sharply, because a meaningful civil-protection event is largely invisible outside the directly affected region.'
  },
  {
    story_headline: 'Pope Leo XIV opens Algeria trip with a peace message amid wider war tensions',
    category: 'diplomacy',
    significance_label: 'low',
    regions_found: ['africa', 'europe', 'global'],
    regions_absent: ['latin-america', 'caribbean', 'pacific', 'central-asia', 'south-asia', 'east-se-asia', 'us'],
    d1_factual: 4.0,
    d2_causal: 4.9,
    d3_framing: 5.5,
    d4_emotional: 5.2,
    d5_actor_context: 5.3,
    d6_cui_bono: 5.6,
    gai: { d1: 7.0, d2: 7.4, d3: 6.6, d4: 4.8 },
    rationale: 'The facts are straightforward, but regions assign different weight to the visit. African and European coverage can treat it as meaningful moral diplomacy and symbolic peace framing, while other regions often regard it as a lower-priority soft-power story amid harder operational developments. That produces only a modest PGI, but a noticeable GAI because symbolic diplomatic narratives often disappear outside the regions most culturally or institutionally connected to them.'
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
  return { ...story, story_slug, story_pgi, pair_pgi, story_gai: average([story.gai.d1, story.gai.d2, story.gai.d3, story.gai.d4]) };
});

async function main() {
  const scanExists = fs.existsSync(scanPath);
  if (!scanExists) {
    throw new Error(`Scan file not found: ${scanPath}`);
  }

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
  console.log(JSON.stringify({ ok: true, outPath, stories: stories.length, pgiCount: pgiRows.length, gaiCount: gaiRows.length, pairCount: pairRows.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
