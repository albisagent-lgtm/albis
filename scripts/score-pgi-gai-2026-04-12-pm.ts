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

const scanDate = '2026-04-12';
const scanPeriod = 'pm';
const outPath = path.resolve(process.cwd(), '../memory/scans/2026-04-12-pm-scores.json');

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
  return sig === 'critical' ? 5 : sig === 'high' ? 4 : sig === 'medium' ? 3 : sig === 'low' ? 2 : 1;
}

const stories = [
  {
    story_headline: 'US-Iran negotiations continue under a fragile ceasefire as Strait of Hormuz reopening remains central',
    category: 'diplomacy',
    significance_label: 'critical',
    regions_found: ['us', 'eu', 'middle_east', 'south_asia'],
    regions_absent: ['africa', 'latin_americas', 'east_se_asia'],
    d1_factual: 5.7,
    d2_causal: 7.8,
    d3_framing: 8.6,
    d4_emotional: 7.3,
    d5_actor_context: 8.5,
    d6_cui_bono: 9.0,
    gai: { d1: 5.7, d2: 6.8, d3: 8.3, d4: 9.6 },
    rationale: 'Core facts broadly align: talks continued, a final deal was not reached, and Hormuz reopening remains bound to the ceasefire framework. The gap opens on meaning. U.S. and European coverage leans toward process, sequencing and verification; Middle East coverage is more likely to foreground coercion, sovereignty and whether de-escalation changes realities on the ground; South Asian framing raises Pakistan’s mediator role and regional balancing. Actor portrayal and cui bono run especially high because each region implies different leverage, sincerity and beneficiaries.'
  },
  {
    story_headline: 'Russia and Ukraine begin an Orthodox Easter ceasefire but quickly accuse each other of violations',
    category: 'conflict',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'middle_east'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 5.9,
    d2_causal: 7.0,
    d3_framing: 8.0,
    d4_emotional: 7.1,
    d5_actor_context: 7.9,
    d6_cui_bono: 8.2,
    gai: { d1: 7.0, d2: 7.2, d3: 7.8, d4: 8.8 },
    rationale: 'Most coverage agrees the truce and prisoner exchange happened. Divergence starts immediately around motive and credibility. European coverage carries the deepest pattern-memory scepticism, U.S. framing often tests strategic optics, and Middle East coverage is more willing to treat the pause as a real but fragile de-escalation signal. The perception gap is driven more by interpretation than by dispute over the event itself.'
  },
  {
    story_headline: 'Israel approves direct talks with Lebanon while refusing a Hezbollah ceasefire',
    category: 'diplomacy',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'middle_east'],
    regions_absent: ['africa', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 5.4,
    d2_causal: 7.1,
    d3_framing: 8.5,
    d4_emotional: 8.0,
    d5_actor_context: 8.4,
    d6_cui_bono: 8.8,
    gai: { d1: 7.0, d2: 7.9, d3: 8.3, d4: 8.9 },
    rationale: 'The diplomatic opening itself is real, but regions narrate it very differently. U.S. and some European reporting tends to see a security-architecture opening; Middle East framing is more alert to whether diplomacy is genuine or simply layered over continued coercion and selective restraint. Emotional tone, actor portrayal and beneficiary logic diverge sharply because each frame assigns different meaning to talking without agreeing to a ceasefire.'
  },
  {
    story_headline: 'Iraq elects Nizar Amedi president, ending five months of political deadlock',
    category: 'governance',
    significance_label: 'medium',
    regions_found: ['eu', 'middle_east'],
    regions_absent: ['us', 'africa', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 4.6,
    d2_causal: 5.8,
    d3_framing: 6.4,
    d4_emotional: 5.1,
    d5_actor_context: 6.2,
    d6_cui_bono: 6.9,
    gai: { d1: 8.2, d2: 7.0, d3: 8.0, d4: 7.5 },
    rationale: 'The election result is not heavily disputed. The divergence is about its weight: Middle East coverage treats it as a meaningful stabilisation signal after institutional paralysis, while European coverage is likelier to see it as important but procedural unless it spills into security or energy consequences. GAI is elevated because governance continuity in Iraq matters more systemically than its modest cross-regional attention suggests.'
  },
  {
    story_headline: 'Hungarians vote in a landmark election that could end Viktor Orban’s 16-year rule',
    category: 'governance',
    significance_label: 'high',
    regions_found: ['us', 'eu'],
    regions_absent: ['middle_east', 'africa', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 5.0,
    d2_causal: 6.6,
    d3_framing: 7.5,
    d4_emotional: 6.3,
    d5_actor_context: 7.6,
    d6_cui_bono: 8.1,
    gai: { d1: 8.2, d2: 7.4, d3: 8.2, d4: 8.7 },
    rationale: 'Basic electoral facts are stable, but the story carries very different stakes across the Atlantic. European coverage is saturated with implications for Brussels, Russia and rule-of-law politics; U.S. coverage often frames it through broader right-populist currents and alliance alignment. That makes framing and actor-context gaps materially higher than factual divergence. The GAI stays high because a pivotal EU election is still relatively region-bound in attention.'
  },
  {
    story_headline: 'US trade court questions the legal basis for Trump’s 10% global tariffs',
    category: 'trade',
    significance_label: 'high',
    regions_found: ['us', 'eu', 'east_se_asia'],
    regions_absent: ['middle_east', 'africa', 'latin_americas', 'south_asia'],
    d1_factual: 4.9,
    d2_causal: 6.3,
    d3_framing: 7.1,
    d4_emotional: 5.6,
    d5_actor_context: 6.8,
    d6_cui_bono: 7.6,
    gai: { d1: 7.0, d2: 7.1, d3: 8.1, d4: 8.8 },
    rationale: 'The courtroom development is straightforward, but its significance is read differently. U.S. coverage emphasizes constitutional and statutory limits on executive trade power; European and East Asian coverage focuses more on predictability, market implications and whether Washington’s tariff toolkit is weakening. The perception gap is moderate rather than extreme because the legal event itself is concrete, yet causal narratives around what it means for global trade diverge noticeably.'
  },
  {
    story_headline: 'China pushes harder into foreign markets as US barriers rise',
    category: 'economic_flows',
    significance_label: 'medium',
    regions_found: ['us', 'eu', 'east_se_asia'],
    regions_absent: ['middle_east', 'africa', 'latin_americas', 'south_asia'],
    d1_factual: 5.0,
    d2_causal: 6.5,
    d3_framing: 7.6,
    d4_emotional: 5.8,
    d5_actor_context: 7.1,
    d6_cui_bono: 7.9,
    gai: { d1: 7.0, d2: 7.3, d3: 8.0, d4: 7.6 },
    rationale: 'The underlying direction is broadly accepted: rising U.S. barriers are accelerating Chinese export redirection. The gap lies in how that shift is narrated. U.S. framing sees strategic evasion and competitive pressure; European coverage weighs dumping, market overflow and industrial vulnerability; East Asian coverage tends to focus on flow re-routing and third-market consequences. Cui bono scores higher than factual divergence because the story is really about who absorbs the pressure.'
  },
  {
    story_headline: 'Japan approves an additional $4 billion for chipmaker Rapidus',
    category: 'tech-ai',
    significance_label: 'medium',
    regions_found: ['us', 'eu', 'east_se_asia'],
    regions_absent: ['middle_east', 'africa', 'latin_americas', 'south_asia'],
    d1_factual: 4.6,
    d2_causal: 5.8,
    d3_framing: 6.6,
    d4_emotional: 4.9,
    d5_actor_context: 6.4,
    d6_cui_bono: 7.3,
    gai: { d1: 7.0, d2: 6.8, d3: 7.7, d4: 7.4 },
    rationale: 'This is a relatively low-factual-dispute story: Japan added more state support and semiconductor policy remains strategic. Divergence comes from emphasis. East Asian coverage reads it as sovereign capacity-building, U.S. reporting folds it into alliance-side chip competition, and European framing more often sees subsidy races and resilience politics. PGI is moderate because most disagreement is about strategic framing rather than the event itself.'
  },
  {
    story_headline: 'South Africa unveils a draft national AI policy with new institutions and incentives',
    category: 'tech-ai',
    significance_label: 'medium',
    regions_found: ['us', 'eu', 'africa'],
    regions_absent: ['middle_east', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 4.8,
    d2_causal: 6.0,
    d3_framing: 6.9,
    d4_emotional: 5.2,
    d5_actor_context: 6.7,
    d6_cui_bono: 7.4,
    gai: { d1: 7.0, d2: 7.6, d3: 8.2, d4: 7.5 },
    rationale: 'The policy process itself is clear enough. The gap is interpretive: Africa-focused coverage sees state capacity, agency and rule-setting ambition; U.S. and European coverage is more likely to treat it as secondary to major-power AI governance. That produces a moderate PGI and a relatively high GAI because important rule-setting outside the US-EU-China triangle still struggles to travel proportionally.'
  },
  {
    story_headline: 'Peru votes amid crime, corruption and prolonged political instability',
    category: 'governance',
    significance_label: 'medium',
    regions_found: ['us', 'eu', 'latin_americas'],
    regions_absent: ['middle_east', 'africa', 'south_asia', 'east_se_asia'],
    d1_factual: 4.9,
    d2_causal: 6.1,
    d3_framing: 7.0,
    d4_emotional: 5.9,
    d5_actor_context: 6.8,
    d6_cui_bono: 7.5,
    gai: { d1: 7.0, d2: 7.5, d3: 8.1, d4: 7.6 },
    rationale: 'Most outlets align on the backdrop of fatigue, corruption and instability. What changes by region is what the election represents: Latin American coverage places it inside local institutional exhaustion and lived insecurity, while U.S. and European attention more often filters it through investability, minerals and governance risk. The story is more globally important than its relatively narrow attention footprint implies.'
  },
  {
    story_headline: 'Artemis II returns safely after a historic crewed trip around the moon',
    category: 'science',
    significance_label: 'medium',
    regions_found: ['us', 'eu', 'east_se_asia'],
    regions_absent: ['middle_east', 'africa', 'latin_americas', 'south_asia'],
    d1_factual: 2.2,
    d2_causal: 2.8,
    d3_framing: 3.3,
    d4_emotional: 2.7,
    d5_actor_context: 3.0,
    d6_cui_bono: 3.4,
    gai: { d1: 7.0, d2: 6.2, d3: 7.4, d4: 7.3 },
    rationale: 'This is one of the lowest-PGI stories in the scan because the facts are clear, the symbolic framing is broadly shared, and few regions are meaningfully at odds about what happened. Small differences remain around whether the mission is mostly scientific, prestige-driven or tied to strategic space competition, but the overall narrative is unusually aligned. GAI is moderate: it reached multiple regions, though still not universally with equal salience.'
  },
  {
    story_headline: 'The US expands its Nigeria travel warning and authorises some embassy departures from Abuja',
    category: 'security',
    significance_label: 'medium',
    regions_found: ['us', 'eu', 'africa'],
    regions_absent: ['middle_east', 'latin_americas', 'south_asia', 'east_se_asia'],
    d1_factual: 4.5,
    d2_causal: 5.6,
    d3_framing: 6.5,
    d4_emotional: 5.6,
    d5_actor_context: 6.1,
    d6_cui_bono: 6.9,
    gai: { d1: 7.0, d2: 7.9, d3: 8.4, d4: 7.5 },
    rationale: 'There is little dispute that Washington changed its security posture. Divergence lies in interpretation: U.S. coverage treats it as a consular risk-management decision, European coverage reads it through diplomatic and business confidence, and African framing is more sensitive to how external warnings shape perceptions of state stability and foreign engagement. GAI is relatively high because official security downgrades in a major African state still receive limited broad follow-through.'
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
    coverage_breadth: story.regions_found.length,
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
