const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
  ? path.join(process.cwd(), '.env.local')
  : path.join(process.cwd(), '..', '.env.credentials');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1];

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('[write_pgi_signature_piece] Missing Supabase env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const date = process.argv[2] || '2026-05-09';

function round2(n) {
  return Math.round(n * 100) / 100;
}

function avg(items, key) {
  return round2(items.reduce((sum, item) => sum + Number(item[key] || 0), 0) / items.length);
}

function formatDateLabel(isoDate) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString('en-NZ', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function wordCount(text) {
  return text.replace(/[#*_`>|-]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function tierForPgi(pgi) {
  if (pgi <= 2) return { tier: 'Global Consensus', emoji: '🟢' };
  if (pgi <= 4) return { tier: 'Different Lenses', emoji: '🟡' };
  if (pgi <= 6) return { tier: 'Diverging Narratives', emoji: '🟠' };
  if (pgi <= 8) return { tier: 'Competing Realities', emoji: '🔴' };
  return { tier: 'Parallel Universes', emoji: '⚫' };
}

(async function main() {
  const [{ data: daily, error: dailyError }, { data: stories, error: storiesError }, { data: pairs, error: pairsError }] = await Promise.all([
    supabase.from('pgi_daily').select('*').eq('date', date).maybeSingle(),
    supabase.from('pgi_story_scores').select('*').eq('scan_date', date).eq('is_latest', true).order('story_pgi', { ascending: false }),
    supabase.from('pgi_region_pairs').select('*').eq('scan_date', date),
  ]);

  if (dailyError) throw dailyError;
  if (storiesError) throw storiesError;
  if (pairsError) throw pairsError;
  if (!daily) throw new Error(`No pgi_daily row found for ${date}`);
  if (!stories?.length) throw new Error(`No pgi_story_scores rows found for ${date}`);

  const dims = {
    d1: avg(stories, 'd1_factual'),
    d2: avg(stories, 'd2_causal'),
    d3: avg(stories, 'd3_framing'),
    d4: avg(stories, 'd4_emotional'),
    d5: avg(stories, 'd5_actor_context'),
    d6: avg(stories, 'd6_cui_bono'),
  };

  const distinctRegions = [...new Set(stories.flatMap((story) => story.regions_covered || []))].sort();
  const regionCount = distinctRegions.length;
  const topStories = stories.slice(0, 10).map((story) => ({
    slug: story.story_slug,
    headline: story.story_headline,
    pgi: round2(Number(story.story_pgi || 0)),
    category: story.category,
    regions: story.regions_covered || [],
  }));

  const pairBuckets = new Map();
  for (const pair of pairs || []) {
    const key = [pair.region_a, pair.region_b].sort().join(' ↔ ');
    const current = pairBuckets.get(key) || { pair: key, total: 0, count: 0, max: 0 };
    current.total += Number(pair.pair_pgi || 0);
    current.count += 1;
    current.max = Math.max(current.max, Number(pair.pair_pgi || 0));
    pairBuckets.set(key, current);
  }
  const recurringPairs = [...pairBuckets.values()]
    .map((entry) => ({ pair: entry.pair, count: entry.count, avg: round2(entry.total / entry.count), max: round2(entry.max) }))
    .filter((entry) => entry.count >= 2)
    .sort((a, b) => b.avg - a.avg || b.count - a.count);

  const categoryBuckets = new Map();
  for (const story of stories) {
    const current = categoryBuckets.get(story.category) || [];
    current.push(Number(story.story_pgi || 0));
    categoryBuckets.set(story.category, current);
  }
  const categoryAverages = [...categoryBuckets.entries()]
    .map(([category, values]) => ({ category, count: values.length, avg: round2(values.reduce((sum, value) => sum + value, 0) / values.length) }))
    .sort((a, b) => b.avg - a.avg);

  const scanPeriods = stories.reduce((acc, story) => {
    const key = story.scan_period || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const reportDate = formatDateLabel(date);
  const { tier, emoji } = tierForPgi(Number(daily.daily_pgi));

  const contentMd = `# PGI Signature Piece — ${reportDate}

**Daily PGI:** ${Number(daily.daily_pgi).toFixed(2)} — **${tier}** ${emoji}  
**Stories analyzed:** ${stories.length} | **Regions tracked:** ${regionCount}

---

## Executive Summary

May 9 moved the PGI back up to **${Number(daily.daily_pgi).toFixed(2)}**, a clear step above May 8's **4.66** and still firmly inside **Diverging Narratives** rather than full red-tier fragmentation. The field was not blown open across every topic at once. But today’s divergence was **broader, harder, and more politically charged** than yesterday’s. The strongest perception gaps clustered around five pressure points: **Hormuz ceasefire credibility, Sudan’s regionalization, Cuba sanctions, climate-risk consequences, and the fight over how media and institutions describe stress itself**.

The daily structure matters. The two highest dimensions were **framing (${dims.d3.toFixed(2)})** and **cui bono (${dims.d6.toFixed(2)})**, with **causal divergence (${dims.d2.toFixed(2)})** right behind. **Factual divergence remained lower at ${dims.d1.toFixed(2)}**. That is the signature of a day when regions are still looking at many of the same core events, but increasingly disagree over **what those events mean, whose interpretation should dominate, and who will carry the cost if one narrative wins**.

The top story, **Iran reviews U.S. ceasefire proposal while exchanges continue near Hormuz**, came in at **7.30**. The numbers show this was not just another process update. **Middle East ↔ US averaged 7.35 across recurring pairings today**, and the Gulf file kept driving that split. In one frame, a ceasefire proposal is evidence that diplomacy is working. In another, it is simply a thin layer of negotiation stretched over blockade risk, tanker pressure, and unresolved coercion.

Sudan added a second high-intensity cluster. **Sudan accuses Ethiopia and the UAE of involvement in a Khartoum airport drone attack** also scored **7.30**, pushing **Africa ↔ Middle East to 7.35** in recurring regional averages. Here too, the disagreement was not over whether the accusation mattered. It was over whether to read it primarily as a localized conflict escalation, a proxy-war widening, or another sign that regional power competition is being redistributed through Sudan’s battlefield.

The day also widened beyond war. **Research funders are struggling with a wave of AI-assisted applications** scored **7.30** across **Europe, the US, and Global** coverage. That is a striking signal. It shows that even outside conflict and sanctions, perception gaps are now opening around **institutional legitimacy**: whether AI assistance is a governance problem, an access/equity problem, a fraud problem, or an inevitable adaptation pressure on science itself.

Climate and sanctions both ran hot. **Odds of a ‘super El Niño’ are rising, with broad flood-and-drought warnings** scored **7.23** across five regions, and **U.S. sanctions pressure deepens across the Cuban economy** scored **7.23** across the **US, Caribbean, and Latin America**. One story turned on uneven exposure to climate shock; the other on whether sanctions are read as pressure, punishment, containment, or collateral burden. In both cases, the strongest divergence showed up not in basic facts, but in the translation from event to consequence.

There is one important structural caveat. Today’s aggregate is built from **${Object.entries(scanPeriods).map(([period, count]) => `${period.toUpperCase()} ${count}`).join(', ')}** only. So May 9 should be read as a strong scored daily field, but still as a **single-tranche day** rather than a layered AM-midday-PM arc. Even so, the shape is coherent: narrative pressure rose across multiple domains at once, and the highest-PGI stories repeatedly turned on **legitimacy, burden, and strategic interpretation**.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | ${dims.d1.toFixed(2)} | Lowest dimension. Regions mostly shared the same event skeletons, even when they weighted facts differently. |
| **D2 — Causal** | ${dims.d2.toFixed(2)} | Divergence rose once stories moved from description to consequence: what is driving the event, and what follows next? |
| **D3 — Framing** | ${dims.d3.toFixed(2)} | **Joint-highest dimension.** The same stories were cast as stabilization, coercion, reassurance, governance stress, or strategic repositioning. |
| **D4 — Emotional** | ${dims.d4.toFixed(2)} | Tone split between official calm, regional anxiety, and institutional alarm. |
| **D5 — Actor Context** | ${dims.d5.toFixed(2)} | Regions repeatedly foregrounded different protagonists: states, institutions, mediators, publics, or exposed populations. |
| **D6 — Cui Bono** | ${dims.d6.toFixed(2)} | **Joint-highest dimension.** Many of today’s sharpest gaps came down to who gains leverage, legitimacy, cover, or relief if one framing takes hold. |

The ranking is the key. May 9 was not mainly a day of hidden facts or factual collapse. It was a day of **interpretive contest**. Once a story turned into a question of **who benefits, who pays, and which frame becomes common sense**, the gap widened quickly.

---

## Top Divergent Stories

### 1. **Iran reviews U.S. ceasefire proposal while exchanges continue near Hormuz** — PGI 7.30
- **Regions covered:** Middle East, US, Global
- **Category:** diplomacy
- **Dimensional signal:** factual 6.8, causal 7.4, framing 7.4, emotional 7.4, actor 7.4, cui bono 7.4
- **What diverged:** Regions agreed that the ceasefire file had moved into negotiation. They diverged over whether that movement represented real de-escalation or merely a more formalized struggle over blockade pressure, shipping access, and bargaining position.
- **Why it mattered:** It anchored one of the day’s clearest recurring divides: **Middle East ↔ US = 7.35** across the Gulf cluster.

### 2. **Sudan accuses Ethiopia and the UAE of involvement in a Khartoum airport drone attack** — PGI 7.30
- **Regions covered:** Africa, Middle East, Global
- **Category:** security
- **Dimensional signal:** factual 6.8, causal 7.4, framing 7.4, emotional 7.4, actor 7.4, cui bono 7.4
- **What diverged:** Some framing treated the accusation as a severe but still local escalation. Other framing widened it immediately into a proxy and regional-power story.
- **Why it mattered:** It drove **Africa ↔ Middle East = 7.35**, showing how Sudan increasingly functions as a regional legitimacy and influence contest, not only a civil-war file.

### 3. **Research funders are struggling with a wave of AI-assisted applications** — PGI 7.30
- **Regions covered:** Europe, US, Global
- **Category:** science
- **Dimensional signal:** factual 6.8, causal 7.4, framing 7.4, emotional 7.4, actor 7.4, cui bono 7.4
- **What diverged:** The split was over whether AI assistance should be understood chiefly as fraud risk, governance lag, unequal access, or the beginning of a new research norm.
- **Why it mattered:** It pushed **Europe ↔ US** and **Europe ↔ Global** to **7.50**, making institutional legitimacy in science one of the day’s unexpectedly sharp divergence zones.

### 4. **Odds of a ‘super El Niño’ are rising, with broad flood-and-drought warnings** — PGI 7.23
- **Regions covered:** Global, Latin America, Africa, Pacific, US
- **Category:** climate
- **Dimensional signal:** factual 6.3, causal 7.4, framing 7.5, emotional 7.3, actor 7.3, cui bono 7.6
- **What diverged:** Regions did not mainly dispute the climate warning. They diverged over whether to foreground scientific caution, disaster exposure, food risk, or downstream economic burden.
- **Why it mattered:** It produced several of the day’s highest one-off pair scores, including **Africa ↔ Latin America = 7.40** and **Pacific ↔ US = 7.40**, showing how a shared climate signal still maps onto very different consequence frames.

### 5. **U.S. sanctions pressure deepens across the Cuban economy** — PGI 7.23
- **Regions covered:** US, Caribbean, Latin America
- **Category:** sanctions
- **Dimensional signal:** factual 6.3, causal 7.4, framing 7.5, emotional 7.3, actor 7.3, cui bono 7.6
- **What diverged:** One reading centers state pressure and strategic leverage. Another centers social burden, hemispheric asymmetry, and the lived cost of sanctions policy.
- **Why it mattered:** It sharpened both **Latin America ↔ US** and **Caribbean ↔ US** divides at **7.40**.

### 6. **Trump announces a 9–11 May Russia-Ukraine ceasefire and 1,000-for-1,000 prisoner exchange track** — PGI 7.18
- **Regions covered:** Europe, US, Global
- **Category:** diplomacy
- **What diverged:** The issue was whether this should be read as a substantive de-escalation signal or a fragile political announcement whose main significance lies in who controls the narrative around progress.
- **Why it mattered:** It kept **Europe ↔ US** elevated and reinforced today’s broader pattern: diplomacy stories diverged most once they became credibility tests.

### 7. **Press freedom hits a 25-year low as outlets renew calls for Gaza access** — PGI 7.13
- **Regions covered:** Global, Middle East, Europe
- **Category:** media
- **What diverged:** Regions split over whether the story is primarily about journalism, war transparency, information control, or institutional accountability.
- **Why it mattered:** It helped lift **PGI-IW to 7.06**, the hottest tributary in the daily aggregate.

### 8. **ASEAN leaders adopt a crisis plan to reduce Middle East war backlash** — PGI 7.13
- **Regions covered:** East & SE Asia, Middle East, Global
- **Category:** governance
- **What diverged:** The same move could be framed as prudent contingency planning, regional insulation, or proof that the Middle East war is already being internalized as an Asian domestic-risk issue.
- **Why it mattered:** It showed that secondary-regional responses are now generating their own strong narrative spreads, not just echoing the primary conflict file.

### 9. **UN peacekeeping budget proposal falls to $5.23 billion as the liquidity crisis bites** — PGI 7.03
- **Regions covered:** Global, Africa, Middle East
- **Category:** governance
- **What diverged:** Some coverage emphasized institutional austerity and financing strain. Other coverage emphasized what budget compression means on the ground for already fragile missions and exposed populations.
- **Why it mattered:** It reinforced **Africa ↔ Global** and **Africa ↔ Middle East** tensions around burden allocation.

### 10. **U.S. forces disable two more Iranian tankers during blockade enforcement** — PGI 7.03
- **Regions covered:** Middle East, US, Global
- **Category:** security
- **What diverged:** The split was between deterrence-and-enforcement framing and escalation-and-provocation framing.
- **Why it mattered:** It kept the Hormuz file anchored simultaneously in diplomacy and hard-security signaling.

---

## Regional Pattern Analysis

### **Middle East ↔ US stayed the most important recurring strategic fault line**
The strongest recurring divide in the daily field was **Middle East ↔ US at 7.35**, driven by the ceasefire-proposal story and tanker-enforcement story. The shared pattern is clear: US-linked framing more readily treats developments as bargaining signals, deterrence management, or controlled escalation. Middle Eastern framing has stronger incentives to judge the same developments against proximity, coercion, corridor exposure, and whether power is being normalized under diplomatic language.

### **Africa ↔ Middle East widened through Sudan and multilateral strain**
Also at **7.35**, **Africa ↔ Middle East** emerged as a second structural line, mainly through Sudan and the UN peacekeeping budget story. This pairing matters because it is not simply a disagreement over facts. It is a disagreement over whether events should be read through the lens of local battlefield cost, regional influence, or institutional survivability.

### **Europe ↔ US ran hot outside the war file**
At **7.08 across four stories**, **Europe ↔ US** was not driven only by traditional geopolitics. It ran through AI-assisted research governance as well as Russia-Ukraine ceasefire framing. That is important. The transatlantic split today was as much about **institutional standards and legitimacy thresholds** as it was about security diplomacy.

### **Latin America ↔ US sharpened around sanctions and consequence framing**
**Latin America ↔ US averaged 7.03 across three stories**, led by the Cuba sanctions file. The persistent issue here is burden translation: whether a policy is narrated as strategic pressure or as an unevenly distributed social cost. That same pattern also appeared in climate-risk interpretation.

### **Africa ↔ Europe stayed active through health and exposure stories**
**Africa ↔ Europe averaged 6.68 across four stories**, including the cruise-ship hantavirus cluster and broader climate-risk framing. The divergence was less about contradiction than about weighting. Europe-linked institutional coverage had more room to foreground management and reassurance; Africa-linked framing more often kept downstream exposure visible.

### **Global coverage remained the generalizing frame under pressure from consequence-heavy regional lenses**
Global labels appeared across many of the day’s sharpest stories, especially around Hormuz, Sudan, AI governance, and press freedom. That does not make the Global frame neutral. It means it continues to function as the broad summary layer that regional consequence frames repeatedly push against.

---

## Category Structure

The strongest story-category averages were:

- **Sanctions:** 7.23  
- **Security:** 7.17  
- **Media:** 7.06  
- **Migration:** 7.02  
- **Diplomacy:** 6.19  
- **Trade:** 6.17  
- **Climate:** 5.67  
- **Health:** 5.39  
- **Governance:** 5.29

The tributary structure tells an even cleaner story:

- **PGI-IW:** 7.06  
- **PGI-CL:** 5.67  
- **PGI-HE:** 5.39  
- **PGI-GP:** 5.25  
- **PGI-EC:** 5.00  
- **PGI-TE / PGI-WR:** no daily contribution in the current aggregate

That mix is revealing.

- **Information and media divergence led the day.** Press-freedom and Gaza-access stories did not sit at the edge of the field; they were central to it. The argument over who gets to describe reality is increasingly part of the reality being contested.
- **Security and sanctions stayed high** because both categories force regions to answer the same question: is this pressure legitimate, stabilizing, punitive, selective, or destabilizing?
- **Climate ran warmer than a routine science day** because climate warnings were immediately translated into uneven exposure, not parked in abstract forecasting language.
- **Health remained elevated but not dominant**, suggesting the hantavirus cluster still matters, though on May 9 it sat inside a wider field of geopolitical and institutional divergence.

So May 9 was not a single-theme divergence day. It was a **stacked narrative day**: war, sanctions, science governance, climate consequence, and media legitimacy all produced meaningful spread at once.

---

## Intraday Shape

Today’s daily aggregate is built from a **single scored AM tranche covering 36 stories**.

- **AM:** ${Number(daily.daily_pgi).toFixed(2)} across 36 stories  
- **Midday / PM:** no additional scored tranches in the current daily table

That means this report should be read as a strong full-field morning snapshot rather than a layered all-day arc. Even so, the pattern is internally consistent. **11 stories scored 7.0 or above**, and **16 scored 6.0 or above**. The top of the table was not dominated by one isolated file. It was distributed across **Hormuz, Sudan, Cuba sanctions, super El Niño, AI governance, Gaza-related press freedom, and outbreak management**.

That breadth is why the daily PGI rose back above yesterday. Divergence did not simply intensify in one corner. It spread across several narratives that all ask versions of the same question: **whose interpretation will govern response?**

---

## What Today’s PGI Means

A **${Number(daily.daily_pgi).toFixed(2)} PGI** means the world was still looking at a broadly shared event field on May 9, but increasingly through **non-shared consequence maps**.

- Is a Hormuz ceasefire proposal a real stabilizing move, or a tactical wrapper around ongoing coercion?  
- Is Sudan’s latest escalation a domestic war development, or another sign of externalized regional competition?  
- Is AI use in research mainly a misconduct problem, a governance lag problem, or a fairness problem?  
- Are sanctions a tool of strategic pressure, or a narrative that shifts moral burden away from populations absorbing the cost?  
- Are climate warnings primarily scientific alerts, or already social-risk and food-risk stories depending on where you stand?  
- Is press-freedom language around Gaza a media-rights issue, or a direct contest over who gets to witness and define a conflict?  

Those are not cosmetic differences. They shape how legitimacy travels across regions, and whether institutional language feels persuasive or evasive.

---

## Bottom Line

May 9 was a **Diverging Narratives** day, but a stronger and broader one than May 8.

The world did not split into fully incompatible realities. It did, however, repeatedly split over **what counts as stabilization, what counts as exposure, and who benefits when stress is narrated as manageable**.

The Gulf file kept **Middle East ↔ US** elevated at **7.35**. Sudan pushed **Africa ↔ Middle East** to the same level. AI-assisted research governance unexpectedly pushed **Europe ↔ US** and **Europe ↔ Global** to **7.50**. Cuba sanctions sharpened **Latin America ↔ US** and **Caribbean ↔ US**. Super El Niño showed how even a shared climate warning produces different realities once consequences are localized.

Most importantly, **framing (${dims.d3.toFixed(2)})** and **cui bono (${dims.d6.toFixed(2)})** again led the field, while **factual divergence stayed lower at ${dims.d1.toFixed(2)}**. That tells us May 9 was not mainly a day of contested facts. It was a day of contested **meaning, leverage, and burden**.

That is what the perception gap looked like on May 9, 2026.`;

  const payload = {
    date,
    daily_pgi: round2(Number(daily.daily_pgi)),
    tier,
    emoji,
    author: 'Albis Scanner',
    content_md: contentMd,
    word_count: wordCount(contentMd),
    avg_d1_factual: dims.d1,
    avg_d2_causal: dims.d2,
    avg_d3_framing: dims.d3,
    avg_d4_emotional: dims.d4,
    avg_d5_actor: dims.d5,
    avg_d6_cui_bono: dims.d6,
    story_count: stories.length,
    region_count: regionCount,
    top_stories: topStories,
    methodology_version: '1.0',
  };

  const { data: upserted, error: upsertError } = await supabase
    .from('pgi_signature_pieces')
    .upsert([payload], { onConflict: 'date' })
    .select();

  if (upsertError) throw upsertError;

  console.log(JSON.stringify({ ok: true, date, word_count: payload.word_count, row: upserted?.[0], recurringPairs: recurringPairs.slice(0, 6), categoryAverages: categoryAverages.slice(0, 8) }, null, 2));
})().catch((error) => {
  console.error('[write_pgi_signature_piece] failed:', error?.message || error);
  process.exit(1);
});
