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
const scanPeriod = 'am';
const scanPath = path.resolve(process.cwd(), '../memory/scans/2026-04-19-am.md');
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-19-am-scores.json');

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
    story_headline: 'U.S. and Iran shift toward interim deal under Pakistani mediation',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'south-asia', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia', 'east-se-asia'],
    d1_factual: 4.6,
    d2_causal: 7.8,
    d3_framing: 8.4,
    d4_emotional: 6.7,
    d5_actor_context: 8.0,
    d6_cui_bono: 8.3,
    gai: { d1: 4.0, d2: 5.6, d3: 5.4, d4: 8.2 },
    rationale: 'Most regions accept that a mediation channel remains open and that the talks are narrowing toward something interim rather than comprehensive. The gap opens around what that means: Washington and much of Europe read it as strategic risk management, Middle East coverage is likelier to stress sovereignty, leverage and sanctions asymmetry, while South Asian framing gives Pakistan more real agency than Western coverage usually does. So the factual layer is not wildly split, but causal attribution, actor portrayal and cui bono are.'
  },
  {
    story_headline: 'Israel-Lebanon 10-day ceasefire takes effect and may be extended',
    category: 'conflict',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'central-asia'],
    d1_factual: 3.4,
    d2_causal: 6.0,
    d3_framing: 6.8,
    d4_emotional: 6.9,
    d5_actor_context: 6.5,
    d6_cui_bono: 6.4,
    gai: { d1: 4.8, d2: 4.7, d3: 4.6, d4: 8.1 },
    rationale: 'The basic fact of a ceasefire is comparatively stable across regions, which keeps factual divergence low. The split is over durability, blame and meaning: Western coverage tends to highlight a formal de-escalation window, while Middle East reporting is more likely to foreground fragility, carve-outs and unresolved force dynamics. That makes this a moderate-to-high PGI story rather than an extreme one.'
  },
  {
    story_headline: 'Iran declares commercial passage through the Strait of Hormuz open during ceasefire window',
    category: 'economic-flows',
    significance_label: 'critical',
    regions_found: ['us', 'europe', 'middle-east', 'east-se-asia', 'global'],
    regions_absent: ['caribbean', 'pacific'],
    d1_factual: 3.8,
    d2_causal: 6.7,
    d3_framing: 7.0,
    d4_emotional: 5.2,
    d5_actor_context: 7.5,
    d6_cui_bono: 7.9,
    gai: { d1: 2.8, d2: 4.2, d3: 3.5, d4: 8.0 },
    rationale: 'There is broad agreement that Tehran signalled an opening for commercial shipping, so the raw event is not heavily contested. The divergence sits in interpretation: de-escalation signal, tactical concession, market stabiliser, or leverage move. Actor portrayal and beneficiary logic vary by region, especially between Western security framing, Middle East sovereignty framing, and East Asian energy-security framing.'
  },
  {
    story_headline: 'U.S. renews waiver for sanctioned Russian oil purchases at sea after earlier non-renewal signal',
    category: 'sanctions',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'south-asia', 'middle-east', 'east-se-asia', 'central-asia'],
    d1_factual: 4.4,
    d2_causal: 7.1,
    d3_framing: 7.7,
    d4_emotional: 5.8,
    d5_actor_context: 7.4,
    d6_cui_bono: 8.1,
    gai: { d1: 6.0, d2: 7.0, d3: 7.2, d4: 8.4 },
    rationale: 'The policy reversal itself is concrete enough, but the meaning diverges sharply. US coverage tends to treat it as tactical calibration, European coverage as an energy-flow and credibility issue, while global framing tends to absorb it into a larger contradiction inside the sanctions regime. High PGI because the disagreement is over whether this is pragmatic flexibility, incoherence, or selective relief.'
  },
  {
    story_headline: 'U.S. says it will not renew some waivers for Iranian and Russian oil purchases',
    category: 'sanctions',
    significance_label: 'high',
    regions_found: ['us', 'europe', 'middle-east', 'global'],
    regions_absent: ['caribbean', 'pacific', 'latin-america'],
    d1_factual: 4.2,
    d2_causal: 7.2,
    d3_framing: 7.8,
    d4_emotional: 6.0,
    d5_actor_context: 7.6,
    d6_cui_bono: 8.0,
    gai: { d1: 4.8, d2: 5.5, d3: 4.2, d4: 8.0 },
    rationale: 'This is the other half of the sanctions contradiction. Regions share the fact of a tightening line, but not the story being told about it: pressure for diplomacy, evidence of coercive inconsistency, or normal sanctions maintenance. Middle East coverage is more likely to read it as leverage structure rather than neutral enforcement, which keeps the gap high.'
  },
  {
    story_headline: 'Ukraine and Russia complete prisoner swap but Russian strikes kill at least 17 in Ukraine',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['caribbean', 'pacific', 'africa'],
    d1_factual: 3.9,
    d2_causal: 5.3,
    d3_framing: 5.9,
    d4_emotional: 5.4,
    d5_actor_context: 5.5,
    d6_cui_bono: 5.1,
    gai: { d1: 4.8, d2: 5.1, d3: 3.8, d4: 7.2 },
    rationale: 'The facts are relatively stable: a swap occurred, but heavier violence dominated the strategic picture. That narrows the PGI. The main difference is emphasis—humanitarian channel versus overwhelming battlefield signal—so this sits in the mid-range rather than among the strongest perception-gap stories.'
  },
  {
    story_headline: 'Donors pledge nearly $1.8 billion for Sudan as humanitarian aid resumes at scale',
    category: 'health',
    significance_label: 'high',
    regions_found: ['africa', 'europe', 'middle-east', 'global'],
    regions_absent: ['caribbean', 'pacific', 'latin-america', 'east-se-asia'],
    d1_factual: 4.0,
    d2_causal: 5.8,
    d3_framing: 6.2,
    d4_emotional: 5.6,
    d5_actor_context: 6.1,
    d6_cui_bono: 6.4,
    gai: { d1: 5.0, d2: 6.4, d3: 5.6, d4: 8.7 },
    rationale: 'Coverage largely agrees that the pledges are real but do not amount to military or political de-escalation. The gap comes from emphasis: African and regional coverage is more likely to stress famine risk, access and delivery failure, while European and global framing often foregrounds donor mobilisation. More omission than total narrative fracture.'
  },
  {
    story_headline: 'IMF cuts growth outlook and warns more countries may need loans due to Middle East war shock',
    category: 'economic',
    significance_label: 'high',
    regions_found: ['global', 'africa', 'europe', 'us', 'middle-east', 'east-se-asia'],
    regions_absent: ['caribbean'],
    d1_factual: 3.5,
    d2_causal: 4.3,
    d3_framing: 4.9,
    d4_emotional: 4.1,
    d5_actor_context: 4.4,
    d6_cui_bono: 4.0,
    gai: { d1: 2.0, d2: 3.8, d3: 2.1, d4: 6.9 },
    rationale: 'Institutional macro stories produce less regional fracture than hot conflict stories. The IMF warning is broadly shared as a systems-risk signal, with differences mainly in who gets centred—fragile importers, markets, or policy managers. So PGI stays modest and GAI stays comparatively low because this is widely visible across the regions that track financial risk.'
  },
  {
    story_headline: 'EU says Google should give third-party search engines and AI tools access to search data',
    category: 'tech-ai',
    significance_label: 'medium',
    regions_found: ['europe', 'us', 'global'],
    regions_absent: ['africa', 'latin-america', 'pacific', 'caribbean', 'middle-east'],
    d1_factual: 4.3,
    d2_causal: 5.2,
    d3_framing: 5.8,
    d4_emotional: 4.1,
    d5_actor_context: 5.6,
    d6_cui_bono: 5.7,
    gai: { d1: 6.0, d2: 5.7, d3: 5.0, d4: 7.1 },
    rationale: 'The regulatory move itself is clear, but it gets framed differently as pro-competition reform, anti-gatekeeper pressure, or a structural intervention in the AI information stack. The divergence is real but contained. GAI is elevated because this matters to the global information economy while still being mainly visible in Europe, the US and wire coverage.'
  },
  {
    story_headline: 'U.S. lawmakers scale back bill targeting Chinese chipmaking while keeping core restrictions',
    category: 'trade',
    significance_label: 'medium',
    regions_found: ['us', 'east-se-asia', 'europe', 'global'],
    regions_absent: ['africa', 'latin-america', 'caribbean', 'pacific', 'middle-east'],
    d1_factual: 4.5,
    d2_causal: 6.1,
    d3_framing: 6.5,
    d4_emotional: 4.8,
    d5_actor_context: 6.2,
    d6_cui_bono: 6.6,
    gai: { d1: 5.0, d2: 5.8, d3: 5.1, d4: 7.3 },
    rationale: 'This story is not about whether the bill changed, but about what the softening signifies: tactical moderation, industrial constraint, or phased containment. US, European and East Asian business-geopolitical frames assign different meanings to the same partial rollback. That pushes the score into solid mid-high territory.'
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
