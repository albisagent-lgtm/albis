const fs = require('fs');
const { createClient } = require('./node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey);

const DATE = '2026-04-18';

function round(n) {
  return Math.round(Number(n) * 100) / 100;
}

function classifyTier(pgi) {
  if (pgi <= 2) return { tier: 'Global Consensus', emoji: '🟢', color: 'green' };
  if (pgi <= 4) return { tier: 'Different Lenses', emoji: '🟡', color: 'yellow' };
  if (pgi <= 6) return { tier: 'Diverging Narratives', emoji: '🟠', color: 'orange' };
  if (pgi <= 8) return { tier: 'Competing Realities', emoji: '🔴', color: 'red' };
  return { tier: 'Parallel Universes', emoji: '⚫', color: 'black' };
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length;
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function titleCaseRegion(region) {
  const map = {
    us: 'US', eu: 'Europe', uk: 'UK', africa: 'Africa', af: 'Africa',
    middle_east: 'Middle East', me: 'Middle East', latin_america: 'Latin America', latin_americas: 'Latin America', la: 'Latin America',
    south_asia: 'South Asia', sa: 'South Asia', east_asia: 'East Asia', east_southeast_asia: 'East & Southeast Asia',
    southeast_asia: 'Southeast Asia', russia: 'Russia', oceania: 'Oceania', global: 'Global'
  };
  return map[region] || String(region).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function cleanHeadline(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function sentence(s) { return String(s || '').trim().replace(/\s+/g, ' '); }

async function main() {
  const [{ data: daily, error: dailyError }, { data: stories, error: storiesError }, { data: pairs, error: pairsError }] = await Promise.all([
    supabase.from('pgi_daily').select('*').eq('date', DATE).maybeSingle(),
    supabase.from('pgi_story_scores').select('*').eq('scan_date', DATE).eq('is_latest', true).order('story_pgi', { ascending: false }),
    supabase.from('pgi_region_pairs').select('*').eq('scan_date', DATE).order('pair_pgi', { ascending: false })
  ]);

  if (dailyError) throw dailyError;
  if (storiesError) throw storiesError;
  if (pairsError) throw pairsError;
  if (!daily) throw new Error(`No pgi_daily row found for ${DATE}`);
  if (!stories || !stories.length) throw new Error(`No pgi_story_scores rows found for ${DATE}`);

  const dailyPgi = round(daily.daily_pgi ?? daily.avg_pgi ?? mean(stories.map(s => s.story_pgi)));
  const tierInfo = classifyTier(dailyPgi);
  const storyCount = Number(daily.story_count ?? stories.length);
  const regionSet = uniq(stories.flatMap(s => Array.isArray(s.regions_covered) ? s.regions_covered : []));
  const regionCount = Number(daily.region_count ?? regionSet.length);

  const dims = {
    factual: round(daily.avg_d1_factual ?? mean(stories.map(s => s.d1_factual))),
    causal: round(daily.avg_d2_causal ?? mean(stories.map(s => s.d2_causal))),
    framing: round(daily.avg_d3_framing ?? mean(stories.map(s => s.d3_framing))),
    emotional: round(daily.avg_d4_emotional ?? mean(stories.map(s => s.d4_emotional))),
    actor: round(daily.avg_d5_actor ?? mean(stories.map(s => s.d5_actor_context ?? s.d5_actor))),
    cui_bono: round(daily.avg_d6_cui_bono ?? mean(stories.map(s => s.d6_cui_bono)))
  };

  const sortedDims = Object.entries(dims).sort((a,b) => b[1]-a[1]);
  const highestDim = sortedDims[0];
  const lowestDim = sortedDims[sortedDims.length - 1];

  const periodGroups = ['am', 'midday', 'pm'].map(period => {
    const rows = stories.filter(s => s.scan_period === period);
    return { period, avg: round(mean(rows.map(r => r.story_pgi))), count: rows.length };
  }).filter(x => x.count > 0);

  const topStories = stories.slice(0, 5).map((s, idx) => ({
    rank: idx + 1,
    slug: s.story_slug || cleanHeadline(s.story_headline).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    headline: cleanHeadline(s.story_headline),
    pgi: round(s.story_pgi),
    category: s.category,
    regions: Array.isArray(s.regions_covered) ? s.regions_covered : [],
    region_count: s.region_count,
    rationale: sentence(s.scoring_rationale || '')
  }));

  const pairAvgs = Object.values((pairs || []).reduce((acc, row) => {
    const key = `${row.region_a} ↔ ${row.region_b}`;
    acc[key] ||= { pair: key, scores: [], a: row.region_a, b: row.region_b };
    acc[key].scores.push(Number(row.pair_pgi || 0));
    return acc;
  }, {})).map(x => ({ ...x, avg: round(mean(x.scores)) })).sort((a,b) => b.avg - a.avg).slice(0,6);

  const categories = Object.values(stories.reduce((acc, s) => {
    const key = s.category || 'uncategorized';
    acc[key] ||= { category: key, scores: [] };
    acc[key].scores.push(Number(s.story_pgi || 0));
    return acc;
  }, {})).map(x => ({ ...x, avg: round(mean(x.scores)), count: x.scores.length })).sort((a,b) => b.avg - a.avg);

  const lead = topStories[0];
  const second = topStories[1];
  const strongestPairsText = pairAvgs.slice(0,3).map(p => `${titleCaseRegion(p.a)} vs ${titleCaseRegion(p.b)} (${p.avg})`).join(', ');
  const topCats = categories.slice(0,3).map(c => `${c.category} (${c.avg})`).join(', ');
  const am = periodGroups.find(p => p.period === 'am');
  const pm = periodGroups.find(p => p.period === 'pm');
  const midday = periodGroups.find(p => p.period === 'midday');

  const content_md = `# PGI Signature Piece — April 18, 2026

**Daily PGI:** ${dailyPgi.toFixed(2)} — **${tierInfo.tier}** ${tierInfo.emoji}  
**Stories analyzed:** ${storyCount} | **Regions tracked:** ${regionCount}

---

## Executive Summary

April 18 closed with a **daily PGI of ${dailyPgi.toFixed(2)}**, placing the global media environment in **${tierInfo.tier}**. The day was defined less by disagreement over whether the major events occurred than by disagreement over **what those events meant**, **who they implicated**, and **whose pain was foregrounded**. The scanner's strongest gaps clustered around **${lead?.headline || 'the top story'}** and **${second?.headline || 'the second-ranked story'}**, where the same event stream produced visibly different regional narratives.

The clearest signal sits in the dimensional spread. **${highestDim[0].replace('_', ' ')} divergence (${highestDim[1].toFixed(2)})** led the table, while **${lowestDim[0].replace('_', ' ')} divergence (${lowestDim[1].toFixed(2)})** was the most stable dimension. That tells us today's perception gaps were driven primarily by differences in interpretation architecture rather than total factual separation. Regions often shared the basic event, but split over causality, moral emphasis, actor positioning, and who ultimately benefits.

The most divergent region pairs were **${strongestPairsText || 'notable cross-regional pairings'}**. That matters because it shows the gap is not diffuse background noise. It is concentrated in specific regional relationships where the same story is being socially processed through different strategic interests, historical memories, and domestic pressures.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | ${dims.factual.toFixed(2)} | ${dims.factual >= 7 ? 'High factual separation; regions do not prioritise the same evidence.' : dims.factual >= 5 ? 'Moderate factual separation; the same events are reported with different evidentiary emphasis.' : 'Relatively low factual separation; core facts largely travel across regions.'} |
| **D2 — Causal** | ${dims.causal.toFixed(2)} | ${dims.causal >= 7 ? 'Strong disagreement over blame, drivers, and strategic meaning.' : dims.causal >= 5 ? 'Noticeable differences in causality and responsibility.' : 'Causal lines remained comparatively aligned.'} |
| **D3 — Framing** | ${dims.framing.toFixed(2)} | ${dims.framing >= 7 ? '**Highest-pressure framing environment**; regions are telling different versions of the same reality.' : dims.framing >= 5 ? 'Framing differences are material and shape reader interpretation.' : 'Framing remained relatively coherent across regions.'} |
| **D4 — Emotional** | ${dims.emotional.toFixed(2)} | ${dims.emotional >= 7 ? 'Emotional tone diverged sharply, from restrained language to charged urgency.' : dims.emotional >= 5 ? 'Tone differences matter and alter perceived stakes.' : 'Emotional tone was relatively consistent.'} |
| **D5 — Actor** | ${dims.actor.toFixed(2)} | ${dims.actor >= 7 ? 'Key actors were cast very differently across regions.' : dims.actor >= 5 ? 'Actor portrayal diverged in meaningful but not total ways.' : 'Actor portrayal remained comparatively stable.'} |
| **D6 — Cui Bono** | ${dims.cui_bono.toFixed(2)} | ${dims.cui_bono >= 7 ? 'Regions strongly disagreed over who benefits, who pays, and whose incentives matter.' : dims.cui_bono >= 5 ? 'There were clear differences in who was seen as gaining or absorbing costs.' : 'Benefit structures were narrated in broadly similar ways.'} |

The overall shape is clear: **meaning diverged faster than event recognition**. Today's information field was not fully disconnected, but it was unevenly moralised.

---

## Top Divergent Stories

${topStories.map((s, i) => `### ${i+1}. **${s.headline}** — PGI ${s.pgi.toFixed(2)}
- **Regions covered:** ${s.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${s.category || '—'}
- **What diverged:** ${s.rationale || 'Regional coverage split across framing, causality, and actor emphasis.'}
- **Why it matters:** ${s.pgi >= 8 ? 'This story operated as a high-voltage perception splitter, where shared events generated incompatible readings.' : s.pgi >= 6 ? 'This story exposed durable regional narrative differences rather than isolated wording changes.' : 'This story still showed measurable cross-regional divergence, though with more overlap than the day\'s top outliers.'}`
).join('\n')}

---

## Regional Pattern Analysis

### **Where the strongest splits sat**
The most intense cross-regional tensions appeared in **${strongestPairsText || 'the leading region pairs'}**. In practice, these pairs were not merely choosing different headlines. They were emphasising different protagonists, different harms, and different implied policy responses. That is the core PGI signal: the perception gap becomes politically meaningful when different regions are not just disagreeing on tone, but organising the same facts into conflicting action frameworks.

### **Framing pressure across categories**
By category, the highest average divergence clustered around **${topCats || 'the top-ranked categories'}**. This suggests today's gaps were not evenly distributed across the news agenda. Specific verticals acted as perception stress points, pulling regional coverage apart faster than the rest of the corpus.

### **How the day evolved**
${am && pm ? `The day intensified from **AM ${am.avg.toFixed(2)}** to **PM ${pm.avg.toFixed(2)}** PGI, indicating that later coverage hardened into more distinct narrative camps.` : midday ? `Midday coverage averaged **${midday.avg.toFixed(2)}**, showing the divergence was already established by the middle of the news cycle.` : `The scan set still shows a clear through-line of regional divergence even without a full intraday comparison.`} That shift matters because narrative distance often widens as early reporting gives way to interpretation, blame assignment, and strategic positioning.

---

## What Today's PGI Means

A **${dailyPgi.toFixed(2)} PGI** does not mean the world is looking at different planets. It means regions are increasingly processing the same events through **different lived priorities and institutional lenses**. One region may read a story as a strategic contest. Another may read the same story as a household burden, legitimacy crisis, or proof of structural hypocrisy. Those are not cosmetic differences. They shape public emotion, diplomatic appetite, and what each audience believes counts as the real story.

Today's report therefore points to a world where **narrative coordination is weaker than event circulation**. Facts still travel. Interpretations diverge.

---

## Bottom Line

April 18's PGI shows a global information environment in **${tierInfo.tier}**: connected enough to recognise the same events, but divided enough to build different realities around them. The strongest pressure came from **${highestDim[0].replace('_', ' ')} divergence**, the sharpest story-level splits were led by **${lead?.headline || 'the day\'s top-ranked stories'}**, and the biggest fractures sat between **${strongestPairsText || 'the leading regional pairings'}**.

That is the operative lesson from today's scan: the world's news is not just fragmenting by topic. It is fragmenting by **interpretive gravity** — by where blame lands, where empathy lands, and where consequence is allowed to feel real.`;

  const piece = {
    date: DATE,
    daily_pgi: dailyPgi,
    tier: tierInfo.tier,
    emoji: tierInfo.emoji,
    author: 'Albis Scanner',
    content_md,
    word_count: content_md.replace(/[#*_`>|\-]/g, ' ').split(/\s+/).filter(Boolean).length,
    avg_d1_factual: dims.factual,
    avg_d2_causal: dims.causal,
    avg_d3_framing: dims.framing,
    avg_d4_emotional: dims.emotional,
    avg_d5_actor: dims.actor,
    avg_d6_cui_bono: dims.cui_bono,
    story_count: storyCount,
    region_count: regionCount,
    top_stories: topStories.map(({slug, headline, pgi, category, regions}) => ({ slug, headline, pgi, category, regions }))
  };

  const { data, error } = await supabase
    .from('pgi_signature_pieces')
    .upsert([piece], { onConflict: 'date' })
    .select();

  if (error) throw error;

  console.log(JSON.stringify({ ok: true, daily, piece: data?.[0], topStories, pairAvgs: pairAvgs.slice(0,3), categories: categories.slice(0,5), periodGroups }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
