const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const DATE = '2026-04-21';

function round(n) { return Math.round(Number(n) * 100) / 100; }
function mean(arr) { return arr.length ? arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length : 0; }
function weightedAvg(items, key) {
  const tw = items.reduce((s, i) => s + Number(i.significance || 1), 0);
  return tw ? items.reduce((s, i) => s + Number(i[key] || 0) * Number(i.significance || 1), 0) / tw : 0;
}
function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }
function cleanHeadline(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
function sentence(s) { return String(s || '').trim().replace(/\s+/g, ' '); }
function classifyTier(pgi) {
  if (pgi <= 2) return { tier: 'Global Consensus', emoji: '🟢' };
  if (pgi <= 4) return { tier: 'Different Lenses', emoji: '🟡' };
  if (pgi <= 6) return { tier: 'Diverging Narratives', emoji: '🟠' };
  if (pgi <= 8) return { tier: 'Competing Realities', emoji: '🔴' };
  return { tier: 'Parallel Universes', emoji: '⚫' };
}
function titleCaseRegion(region) {
  const map = {
    us: 'US', europe: 'Europe', eu: 'Europe', uk: 'UK', africa: 'Africa',
    'middle-east': 'Middle East', middle_east: 'Middle East',
    'latin-america': 'Latin America', latin_america: 'Latin America',
    'south-asia': 'South Asia', south_asia: 'South Asia',
    'east-asia': 'East Asia', east_asia: 'East Asia',
    pacific: 'Pacific', global: 'Global'
  };
  return map[region] || String(region).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function main() {
  const [{ data: daily, error: dailyError }, { data: stories, error: storiesError }, { data: pairs, error: pairsError }] = await Promise.all([
    supabase.from('pgi_daily').select('*').eq('date', DATE).maybeSingle(),
    supabase.from('pgi_story_scores').select('*').eq('scan_date', DATE).eq('is_latest', true).order('story_pgi', { ascending: false }),
    supabase.from('pgi_region_pairs').select('*').eq('scan_date', DATE).order('pair_pgi', { ascending: false })
  ]);

  if (dailyError) throw dailyError;
  if (storiesError) throw storiesError;
  if (pairsError) throw pairsError;
  if (!stories || !stories.length) throw new Error(`No pgi_story_scores rows found for ${DATE}`);

  const computedDailyPgi = round(weightedAvg(stories, 'story_pgi'));
  const dailyPgi = round(daily?.daily_pgi ?? computedDailyPgi);
  const tierInfo = daily ? { tier: daily.tier, emoji: daily.emoji } : classifyTier(dailyPgi);
  const storyCount = Number(daily?.story_count ?? stories.length);
  const regionSet = uniq(stories.flatMap(s => Array.isArray(s.regions_covered) ? s.regions_covered : []));
  const regionCount = regionSet.length;

  const dims = {
    factual: round(daily?.avg_d1_factual ?? weightedAvg(stories, 'd1_factual')),
    causal: round(daily?.avg_d2_causal ?? weightedAvg(stories, 'd2_causal')),
    framing: round(daily?.avg_d3_framing ?? weightedAvg(stories, 'd3_framing')),
    emotional: round(daily?.avg_d4_emotional ?? weightedAvg(stories, 'd4_emotional')),
    actor: round(daily?.avg_d5_actor ?? weightedAvg(stories, 'd5_actor_context')),
    cui_bono: round(daily?.avg_d6_cui_bono ?? weightedAvg(stories, 'd6_cui_bono'))
  };

  const sortedDims = Object.entries(dims).sort((a, b) => b[1] - a[1]);
  const highestDim = sortedDims[0];
  const lowestDim = sortedDims[sortedDims.length - 1];

  const topStories = stories.slice(0, 5).map((s, idx) => ({
    rank: idx + 1,
    slug: s.story_slug || cleanHeadline(s.story_headline).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    headline: cleanHeadline(s.story_headline),
    pgi: round(s.story_pgi),
    category: s.category,
    regions: Array.isArray(s.regions_covered) ? s.regions_covered : [],
    rationale: sentence(s.scoring_rationale || ''),
    dims: {
      factual: round(s.d1_factual),
      causal: round(s.d2_causal),
      framing: round(s.d3_framing),
      emotional: round(s.d4_emotional),
      actor: round(s.d5_actor_context ?? s.d5_actor),
      cui_bono: round(s.d6_cui_bono)
    }
  }));

  const pairAvgs = Object.values((pairs || []).reduce((acc, row) => {
    const key = `${row.region_a} ↔ ${row.region_b}`;
    acc[key] ||= { pair: key, scores: [], a: row.region_a, b: row.region_b };
    acc[key].scores.push(Number(row.pair_pgi || 0));
    return acc;
  }, {})).map(x => ({ ...x, avg: round(mean(x.scores)) })).sort((a, b) => b.avg - a.avg).slice(0, 6);

  const categories = Object.values(stories.reduce((acc, s) => {
    const key = s.category || 'uncategorized';
    acc[key] ||= { category: key, items: [] };
    acc[key].items.push(s);
    return acc;
  }, {})).map(x => ({
    category: x.category,
    avg: round(weightedAvg(x.items, 'story_pgi')),
    count: x.items.length,
    examples: x.items.sort((a, b) => b.story_pgi - a.story_pgi).slice(0, 2).map(s => cleanHeadline(s.story_headline))
  })).sort((a, b) => b.avg - a.avg);

  const periods = Object.values(stories.reduce((acc, s) => {
    acc[s.scan_period] ||= { period: s.scan_period, items: [] };
    acc[s.scan_period].items.push(s);
    return acc;
  }, {})).map(x => ({ period: x.period, avg: round(weightedAvg(x.items, 'story_pgi')), count: x.items.length }));

  const lead = topStories[0];
  const second = topStories[1];
  const strongestPairsText = pairAvgs.slice(0, 3).map(p => `${titleCaseRegion(p.a)} vs ${titleCaseRegion(p.b)} (${p.avg.toFixed(2)})`).join(', ');
  const topCats = categories.slice(0, 3).map(c => `${c.category} (${c.avg.toFixed(2)})`).join(', ');
  const periodLine = periods.length
    ? periods.map(p => `${p.period.toUpperCase()} ${p.avg.toFixed(2)} (${p.count} stories)`).join(', ')
    : 'No intraday comparison available.';

  const content_md = `# PGI Signature Piece — April 21, 2026

**Daily PGI:** ${dailyPgi.toFixed(2)} — **${tierInfo.tier}** ${tierInfo.emoji}  
**Stories analyzed:** ${storyCount} | **Regions tracked:** ${regionCount}

---

## Executive Summary

April 21 closed with a **daily PGI of ${dailyPgi.toFixed(2)}**, placing the information environment in **${tierInfo.tier}**. The gap was driven less by disputes over raw event recognition than by divergence over **who holds leverage**, **whether de-escalation is real or cosmetic**, and **which actors should be treated as central to the story**. The scanner's strongest splits clustered around the U.S.-Iran ceasefire track and the status of the Strait of Hormuz, where nominally shared developments produced markedly different regional readings.

The dimensional spread makes that pattern clear. **${highestDim[0].replace('_', ' ')} divergence (${highestDim[1].toFixed(2)})** led the field, while **${lowestDim[0].replace('_', ' ')} divergence (${lowestDim[1].toFixed(2)})** remained the most aligned layer. That means April 21 was not a day of completely separate fact worlds. It was a day of **contested interpretation**: regions often agreed that an event happened, but split over what it signalled, who was driving it, and who would ultimately benefit from the way it was being narrated.

The sharpest regional stress sat between **${strongestPairsText}**. This is a concentrated gap, not a diffuse one. South Asia, the Middle East, the US, Europe, and global wire framing were repeatedly processing the same diplomatic and shipping developments through different strategic priorities and threat models.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | ${dims.factual.toFixed(2)} | ${dims.factual >= 7 ? 'High factual separation; regions are not working from the same evidence base.' : dims.factual >= 5 ? 'Moderate factual separation; evidence selection differs even where the event is shared.' : 'Relatively low factual separation; the core facts travelled more widely than the interpretations.'} |
| **D2 — Causal** | ${dims.causal.toFixed(2)} | ${dims.causal >= 7 ? 'Strong disagreement over what is driving the situation and where responsibility sits.' : dims.causal >= 5 ? 'Noticeable variation in blame assignment and causal chains.' : 'Causal attribution stayed relatively aligned.'} |
| **D3 — Framing** | ${dims.framing.toFixed(2)} | ${dims.framing >= 7 ? 'The dominant gap today: regions told meaningfully different versions of the same reality.' : dims.framing >= 5 ? 'Framing differences were material and shaped public interpretation.' : 'Framing remained relatively coherent.'} |
| **D4 — Emotional** | ${dims.emotional.toFixed(2)} | ${dims.emotional >= 7 ? 'Tone diverged sharply between urgency, caution, and strategic restraint.' : dims.emotional >= 5 ? 'Tone differences were meaningful but not total.' : 'Emotional tone stayed comparatively stable.'} |
| **D5 — Actor** | ${dims.actor.toFixed(2)} | ${dims.actor >= 7 ? 'Key actors were cast very differently across regions, altering who appeared legitimate, threatening, or decisive.' : dims.actor >= 5 ? 'Actor portrayal diverged in substantive but partial ways.' : 'Actor portrayal was relatively consistent.'} |
| **D6 — Cui Bono** | ${dims.cui_bono.toFixed(2)} | ${dims.cui_bono >= 7 ? 'Regions strongly diverged on who benefits from the situation and whose interests are being served.' : dims.cui_bono >= 5 ? 'Benefit structures and implied winners varied across regions.' : 'Benefit structures were narrated in broadly similar ways.'} |

The shape of the day is straightforward: **facts travelled, but meaning fractured**. April 21 was powered by framing, actor positioning, and incentive analysis rather than pure factual contradiction.

---

## Top Divergent Stories

${topStories.map((s, i) => `### ${i + 1}. **${s.headline}** — PGI ${s.pgi.toFixed(2)}
- **Regions covered:** ${s.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${s.category || '—'}
- **Dimensional signal:** factual ${s.dims.factual.toFixed(1)}, causal ${s.dims.causal.toFixed(1)}, framing ${s.dims.framing.toFixed(1)}, emotional ${s.dims.emotional.toFixed(1)}, actor ${s.dims.actor.toFixed(1)}, cui bono ${s.dims.cui_bono.toFixed(1)}
- **What diverged:** ${s.rationale || 'Regional coverage split across causality, framing, and actor emphasis.'}
- **Why it matters:** ${s.pgi >= 8 ? 'This was a genuine perception-splitting story: a shared development, but incompatible strategic readings.' : s.pgi >= 6 ? 'This exposed durable regional narrative differences rather than simple wording drift.' : 'This still showed measurable narrative separation even with more baseline overlap.'}`
).join('\n\n')}

---

## Regional Pattern Analysis

### **Negotiation was not read as the same thing everywhere**
The lead story — **${lead.headline}** — illustrates the core split. US and European coverage leaned toward leverage, compliance, and risk management. Middle Eastern coverage read the same phase through sovereignty, coercion, and credibility. South Asian framing gave mediation and regional diplomatic agency more weight than Western narratives. That is why causal, actor, and cui bono scores all landed near the top of the daily range.

### **Shipping reality outpaced reopening headlines**
The second-ranked story — **${second.headline}** — showed how infrastructure narratives fragment. Western coverage often foregrounded throughput, insurance, and market restoration signals. Middle Eastern and South Asian coverage treated the chokepoint itself as contested and unstable, stressing coercion, shipping reality, and the lag between headline optimism and actual corridor security. This is a classic PGI pattern: a misleading binary frame — open versus closed — generates a wider perception gap because regions disagree on what the corridor's status should even be called.

### **Diplomacy dominated the gap structure**
By category, the highest average divergence sat in **${topCats}**. Diplomacy did not appear low-conflict today; it appeared as a zone where regional narratives competed hardest over interpretation. A negotiation channel, waiver, or temporary easing was not simply a procedural update. It became a proxy argument over credibility, asymmetry, and strategic advantage.

### **The strongest pairwise fractures were concentrated, not random**
The largest pairwise gaps — **${strongestPairsText}** — show that April 21 was especially sensitive to how South Asia, the Middle East, and Western regions positioned the same events. These are not cosmetic editorial differences. They shape whether audiences read the situation as stabilisation, managed coercion, or merely a pause before renewed pressure.

---

## Intraday Shape

Today's scan set was limited to one populated cycle, but even that single sweep showed a high baseline divergence: **${periodLine}**. In other words, the perception gap was present from the first pass rather than emerging only after the news cycle matured. That usually indicates the dominant stories were already being interpreted through entrenched regional frames rather than drifting apart later through commentary alone.

---

## What Today's PGI Means

A **${dailyPgi.toFixed(2)} PGI** does not mean the world lacked shared information. It means the world increasingly lacked **shared interpretive gravity**. On April 21, many regions recognised the same ceasefire developments, the same shipping uncertainty, and the same sanctions adjustment. What they did not share was the same answer to the key questions: *Is this genuine de-escalation or tactical repositioning? Who is exercising agency? Whose interests are being protected?*

That matters because public perception is shaped more by those questions than by the headline event itself. A corridor that is technically not closed but not functionally normal can still become a sharply divergent story if one region treats it as recovering normality and another treats it as unresolved coercion. A negotiation channel can be narrated either as diplomatic progress or as a fragile, asymmetric arrangement whose apparent movement hides deeper instability.

---

## Bottom Line

April 21's PGI shows a news environment in **${tierInfo.tier}**: connected enough that the same core events were visible across major regions, but divided enough that those events were absorbed into **competing strategic realities**. The heaviest pressure came from **${highestDim[0].replace('_', ' ')} divergence**, the strongest story-level splits were led by **${lead.headline}** and **${second.headline}**, and the biggest regional fractures sat between **${strongestPairsText}**.

The operative lesson is simple: today's information gap was not about whether diplomacy and chokepoint risk existed. It was about **what kind of world those developments were said to reveal** — stabilising, coercive, tactical, or fragile. That is where the perception gap lived, and that is why the day closed at **${dailyPgi.toFixed(2)}**.`;

  const piece = {
    date: DATE,
    daily_pgi: dailyPgi,
    tier: tierInfo.tier,
    emoji: tierInfo.emoji,
    author: 'Albis Scanner',
    content_md,
    word_count: content_md.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length,
    avg_d1_factual: dims.factual,
    avg_d2_causal: dims.causal,
    avg_d3_framing: dims.framing,
    avg_d4_emotional: dims.emotional,
    avg_d5_actor: dims.actor,
    avg_d6_cui_bono: dims.cui_bono,
    story_count: storyCount,
    region_count: regionCount,
    top_stories: topStories.map(({ slug, headline, pgi, category, regions }) => ({ slug, headline, pgi, category, regions }))
  };

  const { data, error } = await supabase
    .from('pgi_signature_pieces')
    .upsert([piece], { onConflict: 'date' })
    .select();

  if (error) throw error;

  console.log(JSON.stringify({ ok: true, usedDailyRow: Boolean(daily), piece: data?.[0], topStories, pairAvgs: pairAvgs.slice(0, 3), categories: categories.slice(0, 5), periods }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});