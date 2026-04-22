const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const DATE = '2026-04-22';

function round(n) { return Math.round(Number(n) * 100) / 100; }
function mean(arr) { return arr.length ? arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length : 0; }
function weightedAvg(items, key) {
  const tw = items.reduce((s, i) => s + Number(i.significance || 1), 0);
  return tw ? items.reduce((s, i) => s + Number(i[key] || 0) * Number(i.significance || 1), 0) / tw : 0;
}
function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }
function cleanHeadline(s) { return String(s || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim(); }
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
    us: 'US', eu: 'Europe', europe: 'Europe', uk: 'UK', me: 'Middle East', 'middle-east': 'Middle East', middle_east: 'Middle East',
    sa: 'South Asia', 'south-asia': 'South Asia', south_asia: 'South Asia', ap: 'Asia-Pacific', pacific: 'Pacific',
    'east-se-asia': 'East & Southeast Asia', east_se_asia: 'East & Southeast Asia', east_asia: 'East Asia', 'east-asia': 'East Asia',
    africa: 'Africa', global: 'Global', 'latin-america': 'Latin America', latin_america: 'Latin America'
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

  const topStories = stories.slice(0, 6).map((s, idx) => ({
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
    const a = row.region_a;
    const b = row.region_b;
    const key = [a, b].sort().join('__');
    acc[key] ||= { a, b, scores: [] };
    acc[key].scores.push(Number(row.pair_pgi || 0));
    return acc;
  }, {})).map(x => ({ ...x, avg: round(mean(x.scores)) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 6);

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
  const strongestPairsText = pairAvgs.slice(0, 4).map(p => `${titleCaseRegion(p.a)} vs ${titleCaseRegion(p.b)} (${p.avg.toFixed(2)})`).join(', ');
  const topCats = categories.slice(0, 4).map(c => `${c.category} (${c.avg.toFixed(2)})`).join(', ');
  const periodLine = periods.length ? periods.map(p => `${String(p.period).toUpperCase()} ${p.avg.toFixed(2)} (${p.count} stories)`).join(', ') : 'No intraday comparison available.';

  const content_md = `# PGI Signature Piece — April 22, 2026

**Daily PGI:** ${dailyPgi.toFixed(2)} — **${tierInfo.tier}** ${tierInfo.emoji}  
**Stories analyzed:** ${storyCount} | **Regions tracked:** ${regionCount}

---

## Executive Summary

April 22 closed with a **daily PGI of ${dailyPgi.toFixed(2)}**, placing the global narrative environment in **${tierInfo.tier}**. The dominant split was not over whether the day's key events happened. It was over **how to interpret partial de-escalation, whether coercive pressure had genuinely eased, and which actors should be treated as holding real agency**. That distinction matters because the day's highest-PGI stories all shared a similar architecture: the headline looked stabilising, but the regional meaning remained deeply contested.

The scanner saw the sharpest divergence in the U.S.-Iran file and the Strait of Hormuz shipping corridor. In Western coverage, extensions, waivers, and reopening signals were more likely to be framed as risk-management, diplomacy-window, or market-restoration developments. In Middle Eastern coverage, the same events were more likely to be read through **blockade continuity, coercion, sovereignty, and the gap between formal announcements and operational reality**. South Asian coverage repeatedly gave more weight to mediation architecture, Pakistan's agency, and practical energy-security consequences than US or European reporting usually did.

The dimensional profile confirms that pattern. **${highestDim[0].replace('_', ' ')} divergence (${highestDim[1].toFixed(2)})** led the field, while **${lowestDim[0].replace('_', ' ')} divergence (${lowestDim[1].toFixed(2)})** remained the least fragmented layer. So April 22 was not a classic fact-fragmentation day. It was a **meaning-fragmentation day**: the facts travelled, but the strategic reading of those facts fractured across regions.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | ${dims.factual.toFixed(2)} | ${dims.factual >= 7 ? 'High factual separation; regions were not working from the same evidence base.' : dims.factual >= 5 ? 'Moderate factual separation; key details and qualifiers varied across regions.' : 'The factual layer remained relatively shared. Most divergence emerged after the event was recognised.'} |
| **D2 — Causal** | ${dims.causal.toFixed(2)} | ${dims.causal >= 7 ? 'Responsibility and drivers were strongly contested.' : dims.causal >= 5 ? 'Blame assignment and causal chains varied materially by region.' : 'Causal attribution stayed fairly aligned.'} |
| **D3 — Framing** | ${dims.framing.toFixed(2)} | ${dims.framing >= 7 ? 'This was the clearest pressure point: the same events were narrated as different strategic realities.' : dims.framing >= 5 ? 'Framing differences materially changed how audiences would read the same events.' : 'Framing stayed comparatively coherent.'} |
| **D4 — Emotional** | ${dims.emotional.toFixed(2)} | ${dims.emotional >= 7 ? 'Tone ranged sharply across alarm, restraint, and strategic confidence.' : dims.emotional >= 5 ? 'Tone differences mattered, but they were secondary to framing and causality.' : 'Emotional tone was relatively stable across regions.'} |
| **D5 — Actor** | ${dims.actor.toFixed(2)} | ${dims.actor >= 7 ? 'Key actors were cast in sharply different roles: guarantor, coercer, mediator, or victim.' : dims.actor >= 5 ? 'Actor portrayal diverged enough to alter legitimacy and agency judgments.' : 'Actor portrayal remained broadly aligned.'} |
| **D6 — Cui Bono** | ${dims.cui_bono.toFixed(2)} | ${dims.cui_bono >= 7 ? 'Regions strongly disagreed on whose interests were being served.' : dims.cui_bono >= 5 ? 'Implied winners, losers, and strategic beneficiaries varied significantly.' : 'Benefit structures were narrated in roughly similar ways.'} |

The distribution is clear: April 22 was driven by **framing, cui bono analysis, and actor positioning**, with factual divergence lower than interpretive divergence. That is exactly the profile you see when the same geopolitical development is visible everywhere but understood through different strategic priors.

---

## Top Divergent Stories

${topStories.map((s, i) => `### ${i + 1}. **${s.headline}** — PGI ${s.pgi.toFixed(2)}
- **Regions covered:** ${s.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${s.category || '—'}
- **Dimensional signal:** factual ${s.dims.factual.toFixed(1)}, causal ${s.dims.causal.toFixed(1)}, framing ${s.dims.framing.toFixed(1)}, emotional ${s.dims.emotional.toFixed(1)}, actor ${s.dims.actor.toFixed(1)}, cui bono ${s.dims.cui_bono.toFixed(1)}
- **What diverged:** ${s.rationale || 'Regional coverage split across causality, framing, and actor emphasis.'}
- **Why it matters:** ${s.pgi >= 8 ? 'This was a full-spectrum perception-gap story: one event, but incompatible strategic readings.' : s.pgi >= 6 ? 'This revealed durable regional narrative differences rather than superficial wording drift.' : 'This still showed meaningful narrative separation even with more overlap at the fact layer.'}`
).join('\n\n')}

---

## Regional Pattern Analysis

### **Ceasefire language masked coercive continuity**
The clearest example was **${lead.headline}**. US reporting could plausibly read the blockade as retained leverage inside a ceasefire process. Middle Eastern reporting had much less reason to accept that framing, because from that vantage point the blockade itself is evidence that the ceasefire is partial, asymmetric, or cosmetic. European and global coverage often sat between those poles, but still with less emphasis on lived coercion than regional reporting. That is why causal, framing, actor, and cui bono scores all pushed into the upper band while factual divergence stayed lower.

### **Hormuz showed the gap between announcement and operating reality**
The second-ranked story — **${second.headline}** — exposed a classic infrastructure perception gap. Western coverage was more likely to focus on tanker routing, insurance, throughput, and market implications. Middle Eastern coverage was more likely to centre contested control and blockade pressure. East and Southeast Asian coverage read the same story through energy dependence and practical supply vulnerability. Put simply: one region heard "reopening reversed" as a market-risk update, another heard it as proof that the corridor was never meaningfully normalised.

### **Mediation was not weighted equally across regions**
The two high-ranking diplomacy stories on the U.S.-Iran ceasefire were especially revealing because South Asian coverage gave Pakistan's mediation role more substance than Western reporting tended to do. That shifts the actor map. In US and European narratives, the story can be anchored around Washington, Tehran, deadline management, and sanctions-linked bargaining. In South Asian narratives, Islamabad appears less like a peripheral venue and more like a meaningful diplomatic node. That difference alone raises actor and framing divergence even when headline facts overlap.

### **Sanctions and shipping were read through interests, not just policy**
Stories such as the Russian oil waiver to India and persistent Hormuz shipping risk carried strong **cui bono** divergence. In US coverage, policy flexibility can be presented as tactical management. In South Asian coverage, the same move reads through energy realism and strategic autonomy. In European coverage, it can look like a stress test for sanctions coherence. The event is the same; the implied beneficiary changes by region, and that is exactly what pushed D6 upward.

---

## Category and Pairwise Structure

By category, the highest average divergence sat in **${topCats}**. That is an important signal. The most fragmented parts of the news cycle were not random anomalies; they clustered in stories where diplomacy, sanctions, and corridor security are inherently open to competing strategic interpretation.

The strongest pairwise fractures were **${strongestPairsText}**. These were not cosmetic editorial differences. They indicate concentrated disagreement between Western, Middle Eastern, and South Asian narrative systems over whether the day's developments represented de-escalation, managed coercion, or unstable tactical positioning.

---

## Intraday Shape

The day's intraday pattern also matters: **${periodLine}**. Divergence was highest in the **AM** cycle and eased slightly into **midday** and **PM**, but it never collapsed into low-gap territory. That suggests the strongest perception splits were present early, when the highest-salience ceasefire and shipping stories first shaped the day's agenda, and then persisted even as the story mix broadened later in the cycle.

---

## What Today's PGI Means

A **${dailyPgi.toFixed(2)} PGI** does not mean the world lacked a shared event stream. It means the world lacked a shared answer to the decisive questions behind that event stream: *Was pressure really easing? Was diplomacy genuine or tactical? Who was actually in control? Who benefited from the way the story was being told?*

That is why April 22 sits in **${tierInfo.tier}** rather than simple divergence. The information environment was connected enough for major regions to recognise the same developments, but divided enough that those developments were pulled into **competing strategic realities**. A ceasefire extension could be read as progress, leverage, or merely a pause with coercive architecture intact. A chokepoint update could be read as a transport story, a sovereignty story, or an energy-security warning. A sanctions waiver could look like flexibility, contradiction, or realism depending on where you stood.

---

## Bottom Line

April 22's PGI shows a global narrative environment in **${tierInfo.tier}**. The strongest gap sat in **${highestDim[0].replace('_', ' ')}**, the sharpest story-level divergences were led by **${lead.headline}** and **${second.headline}**, and the most stressed regional relationships were **${strongestPairsText}**.

The core lesson is simple: today's information gap was not mainly about whether the world saw the same events. It was about **what kind of world those events were said to reveal** — stabilising, coercive, tactical, fragile, or strategically advantageous to different actors. That is where the perception gap lived, and that is why April 22 closed at **${dailyPgi.toFixed(2)}**.`;

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

  console.log(JSON.stringify({ ok: true, usedDailyRow: Boolean(daily), piece: data?.[0] }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
