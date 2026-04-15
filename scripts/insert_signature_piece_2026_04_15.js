const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const date = '2026-04-15';

function round(n) {
  return Math.round(n * 100) / 100;
}

function weightedAvg(items, key) {
  const totalWeight = items.reduce((sum, item) => sum + Number(item.significance || 1), 0);
  if (!totalWeight) return 0;
  return items.reduce((sum, item) => sum + Number(item[key] || 0) * Number(item.significance || 1), 0) / totalWeight;
}

function titleDate(dateStr) {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function prettyRegion(region) {
  const map = {
    us: 'United States',
    europe: 'Europe',
    'middle-east': 'Middle East',
    'south-asia': 'South Asia',
    'east-se-asia': 'East & Southeast Asia',
    africa: 'Africa',
    'latin-america': 'Latin America',
    global: 'Global wires',
    pacific: 'Pacific',
  };
  return map[region] || region;
}

function pairLabel(a, b) {
  return `${prettyRegion(a)} vs ${prettyRegion(b)}`;
}

function countWords(text) {
  return text.replace(/[#*_`>|\-]/g, ' ').split(/\s+/).filter(Boolean).length;
}

(async function main() {
  const [dailyRes, storiesRes, pairsRes] = await Promise.all([
    supabase.from('pgi_daily').select('*').eq('date', date).maybeSingle(),
    supabase.from('pgi_story_scores').select('*').eq('scan_date', date).eq('is_latest', true),
    supabase.from('pgi_region_pairs').select('*').eq('scan_date', date),
  ]);

  if (storiesRes.error) throw storiesRes.error;
  if (pairsRes.error) throw pairsRes.error;

  const stories = storiesRes.data || [];
  const pairs = pairsRes.data || [];
  if (!stories.length) throw new Error(`No pgi_story_scores found for ${date}`);

  const regionSet = new Set();
  const categories = {};
  const periods = {};
  for (const story of stories) {
    for (const region of story.regions_covered || []) regionSet.add(region);
    (categories[story.category] ||= []).push(story);
    (periods[story.scan_period] ||= []).push(story);
  }

  const dailyPgi = dailyRes.data?.daily_pgi != null ? Number(dailyRes.data.daily_pgi) : round(weightedAvg(stories, 'story_pgi'));
  const tier = dailyPgi <= 5 ? 'Different Angles' : dailyPgi <= 7 ? 'Diverging Narratives' : 'Competing Realities';
  const emoji = dailyPgi <= 5 ? '⚪' : dailyPgi <= 7 ? '🟠' : '🔴';

  const avgD1 = round(weightedAvg(stories, 'd1_factual'));
  const avgD2 = round(weightedAvg(stories, 'd2_causal'));
  const avgD3 = round(weightedAvg(stories, 'd3_framing'));
  const avgD4 = round(weightedAvg(stories, 'd4_emotional'));
  const avgD5 = round(weightedAvg(stories, 'd5_actor_context'));
  const avgD6 = round(weightedAvg(stories, 'd6_cui_bono'));

  const topStories = [...stories]
    .sort((a, b) => Number(b.story_pgi) - Number(a.story_pgi))
    .slice(0, 5)
    .map((story) => ({
      slug: story.story_slug,
      headline: story.story_headline,
      pgi: round(Number(story.story_pgi)),
      category: story.category,
      regions: story.regions_covered,
    }));

  const categorySummary = Object.entries(categories)
    .map(([category, items]) => ({ category, pgi: round(weightedAvg(items, 'story_pgi')), count: items.length }))
    .sort((a, b) => b.pgi - a.pgi);

  const periodSummary = Object.entries(periods)
    .map(([period, items]) => ({ period, pgi: round(weightedAvg(items, 'story_pgi')), count: items.length }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const pairAgg = {};
  for (const pair of pairs) {
    const key = `${pair.region_a}__${pair.region_b}`;
    (pairAgg[key] ||= { region_a: pair.region_a, region_b: pair.region_b, vals: [] }).vals.push(Number(pair.pair_pgi));
  }
  const topPairs = Object.values(pairAgg)
    .map((entry) => ({
      region_a: entry.region_a,
      region_b: entry.region_b,
      avg_pgi: round(entry.vals.reduce((a, b) => a + b, 0) / entry.vals.length),
      count: entry.vals.length,
      label: pairLabel(entry.region_a, entry.region_b),
    }))
    .sort((a, b) => b.avg_pgi - a.avg_pgi)
    .slice(0, 5);

  const periodLine = periodSummary.map((p) => `- **${p.period === 'pm' ? 'PM' : p.period === 'midday' ? 'Midday' : p.period.toUpperCase()}:** ${p.pgi} (${p.count} stories)`).join('\n');
  const topCategoryBullets = categorySummary.slice(0, 4).map((c) => `- **${c.category[0].toUpperCase() + c.category.slice(1)}** at **${c.pgi}** (${c.count} stories)`).join('\n');
  const topPairBullets = topPairs.slice(0, 3).map((p) => `- **${p.label}** at **${p.avg_pgi}**`).join('\n');

  const content_md = `# PGI Signature Piece — ${titleDate(date)}

**Daily PGI:** ${dailyPgi.toFixed(2)} — **${tier}** ${emoji}  
**Stories analyzed:** ${stories.length} | **Regions tracked:** ${regionSet.size}

---

## Executive Summary

April 15 was defined by a clear organising contradiction: **the same diplomatic language kept appearing alongside unmistakably coercive realities**.

Across the day’s strongest PGI signals, regions broadly agreed on the basic facts. The United States maintained pressure on Iran through a port-blockade frame. Washington and Tehran kept a narrow pathway open for more talks through Pakistan. Gaza remained lethal even as mediators tried to preserve ceasefire language. Israel and Lebanon held direct talks, but without removing the deeper structural uncertainty around the northern front. Europe pushed Hormuz talks on sanctions, seafarers, and shipping restart. Africa absorbed the downstream cost through higher fuel prices and humanitarian strain.

The disagreement sat one layer deeper than headline recognition. The world was not mainly split over whether the blockade existed or whether talks were happening. It was split over **what those moves meant**. Were they proof of stabilisation, tactical cover for escalation, symbolic diplomacy inside an unchanged coercive order, or selective protection for markets while civilians remained exposed?

That is why the dimensional profile matters so much. Factual divergence stayed relatively contained at **${avgD1.toFixed(2)}**, but **cui bono** rose to **${avgD6.toFixed(2)}**, with **framing** at **${avgD3.toFixed(2)}** and **actor context** at **${avgD5.toFixed(2)}**. In other words: the sharpest argument was not over what happened. It was over **who was being protected, who was being pressured, and whose reality was treated as the real one**.

The day’s weighted PGI comes in at **${dailyPgi.toFixed(2)}**, placing April 15 in **${tier}**. This was not a full collapse into mutually unintelligible realities. It was a day when the same events were repeatedly given different moral and strategic meanings — especially wherever diplomacy and coercion appeared in the same sentence.

---

## Dimensional Breakdown

| Dimension | Avg Score | What it shows |
|-----------|-----------|---------------|
| **D1 — Factual** | ${avgD1.toFixed(2)} | Core facts were often shared, but regions chose different proof points and different evidentiary anchors. |
| **D2 — Causal** | ${avgD2.toFixed(2)} | Strong disagreement over where today’s pressure-and-talks mix leads next: deterrence, retaliation, or managed drift. |
| **D3 — Framing** | ${avgD3.toFixed(2)} | One of the day’s clearest splits. The same events were framed as enforcement, escalation, mediation, or partial de-escalation depending on region. |
| **D4 — Emotional** | ${avgD4.toFixed(2)} | Tone ranged from strategic caution to humanitarian alarm and market anxiety. |
| **D5 — Actor Context** | ${avgD5.toFixed(2)} | Regions centered different protagonists: Washington, Tehran, mediators, civilians, shippers, or downstream economies. |
| **D6 — Cui Bono** | ${avgD6.toFixed(2)} | **Highest dimension.** The sharpest disagreement was over who benefits from the current story architecture — security actors, diplomats, markets, or affected populations. |

The sequence tells the story. April 15 was not led by factual confusion. It was led by **interpretive conflict over incentives, legitimacy, and whose interests diplomacy is actually serving**.

---

## Top Divergent Stories

### 1. **US port blockade on Iran remains the dominant state change, raising retaliation risk** — PGI ${topStories[0].pgi.toFixed(2)}
- **Regions covered:** United States, Europe, Middle East, East & Southeast Asia, Global wires
- **Why it diverged:** Most regions accepted that the blockade posture was real. The split came over whether it should be understood as coercive leverage, open provocation, shipping-risk escalation, or the beginning of a wider war-economy phase.
- **Signal:** Causal divergence hit **8.9**, framing **9.4**, actor context **9.0**, and cui bono **9.5**. This was the clearest example of a shared event producing radically different meanings.

### 2. **US blockade of Iranian ports continues while Washington and Tehran leave door open to more talks in Pakistan** — PGI ${topStories[1].pgi.toFixed(2)}
- **Regions covered:** United States, Europe, Middle East, South Asia, Global wires
- **Why it diverged:** This story concentrated the day’s central contradiction. Western coverage could still treat diplomacy as active. Middle Eastern coverage was more likely to read talks under blockade as diplomacy inside coercion. South Asian framing gave Pakistan real agency rather than treating it as a passive venue.
- **Signal:** Framing rose to **9.2** and actor context to **9.0**. The real dispute was whether diplomacy was shaping the conflict, or merely cushioning its presentation.

### 3. **Israeli fire kills Palestinians in Gaza as mediators continue trying to shore up a fragile ceasefire** — PGI ${topStories[2].pgi.toFixed(2)}
- **Regions covered:** Middle East, Europe, United States, Global wires
- **Why it diverged:** Regions recognised the deaths and the mediation effort, but differed sharply on how to connect them. Middle Eastern coverage foregrounded civilian harm and structural failure. US and some European framing was more likely to keep the ceasefire process itself in view.
- **Signal:** Emotional divergence reached **9.0** and framing **9.1**. This was not just a tone gap. It was a split over whether current ceasefire architecture can still credibly describe reality.

### 4. **US and Iran keep a narrow path open for renewed talks despite the blockade** — PGI ${topStories[3].pgi.toFixed(2)}
- **Regions covered:** United States, Europe, Middle East, South Asia, Global wires
- **Why it diverged:** The existence of a diplomatic lane was not disputed. Its credibility was. In some regions it looked like a real off-ramp; in others, like a symbolic channel operating inside a worsening pressure environment.
- **Signal:** Cui bono reached **8.8**. The hidden argument was over who gains from maintaining the appearance of dialogue.

### 5. **Israel and Lebanon hold rare direct talks in the United States but progress remains uncertain** — PGI ${topStories[4].pgi.toFixed(2)}
- **Regions covered:** Middle East, United States, Europe, Global wires
- **Why it diverged:** Direct talks were widely acknowledged, but regions disagreed over whether they represented genuine progress or a contact event being over-read because the wider security picture remained unresolved.
- **Signal:** The diplomacy itself was legible. The gap was over whether diplomatic form should count as strategic progress before coercive conditions materially change.

---

## Regional Patterns

### **Middle East: diplomacy was measured against force, not against rhetoric**
Middle Eastern coverage repeatedly tested every negotiation headline against the continuing reality of blockade, firepower, exclusion, and civilian exposure. That kept the region furthest from US framing on the day’s most important stories. The sharpest bilateral gap was **${topPairs[0].label} at ${topPairs[0].avg_pgi}**.

### **United States: coercion and negotiation were often narrated as parallel tools**
US framing showed the strongest tendency to hold pressure and diplomacy together in the same strategic frame: blockade as leverage, talks as optionality, crisis management as process. That produces coherence internally, but it widens the gap with regions that treat those same elements as mutually undermining.

### **Europe: stabilisation language stayed strong, especially on corridor-management stories**
European coverage was often more procedural and infrastructural — shipping, sanctions coordination, mediation architecture, managed de-escalation. That was visible in the Hormuz stories, where Europe tended to present practical statecraft while Middle Eastern perspectives remained more sceptical about whose security was really being restored.

### **South Asia: Pakistan’s role shifted from backdrop to actor**
South Asian coverage did not simply absorb Western diplomatic language. It gave Pakistan clearer agency in keeping a bargaining lane alive. That helps explain why **${topPairs[2].label}** was one of the day’s most divergent pairs: the disagreement was partly about authorship and strategic credit.

### **Africa and Latin America: downstream consequences remained visible, but less central in the global story hierarchy**
Africa appeared most clearly through consequence stories — Sudan’s under-covered humanitarian emergency and Kenya’s fuel-price jump tied to Middle East disruption. Latin America was present through trade de-escalation rather than the main war narrative. These stories matter because they show how the perception field privileges frontline strategic actors while often marginalising where pressure is actually felt.

---

## Structural Signal of the Day

The category pattern reinforces the same conclusion:

${topCategoryBullets}

Conflict led because the blockade stories created the day’s clearest moral and strategic split. Diplomacy stayed close behind because nearly every negotiation headline was being interpreted through the coercive conditions surrounding it. Migration and governance were smaller in count, but still elevated where humanitarian neglect or institutional power shifts carried very different meanings across regions.

The scan-by-scan pattern matters too:

${periodLine}

The stability between midday and PM is striking. There was no dramatic late-day collapse in narrative distance. Instead, the same core argument kept reappearing: **does diplomacy indicate genuine de-escalation, or is it now inseparable from pressure architecture?**

The most divergent regional pairs were:

${topPairBullets}

Those pairings are not random. They formed around three recurring disagreements:

- **Legitimacy:** whether pressure plus talks counts as stabilisation or contradiction
- **Agency:** who is really shaping the diplomatic field
- **Protection:** whether current moves are reducing harm for people, or mainly restoring flexibility for states and markets

---

## What to Watch Next

- **Blockade durability:** If the US pressure posture persists without a visible political concession, the causal and framing gaps will widen further.
- **Pakistan channel:** If Washington-Tehran talks continue via Pakistan, South Asia’s divergence with Western framing is likely to stay elevated.
- **Gaza ceasefire credibility:** Continued civilian deaths under ceasefire language will keep emotional and framing divergence high.
- **Hormuz operational proof:** Shipping restart, sanctions detail, and seafarer releases remain the cleanest test of whether “stability” is material or rhetorical.
- **Downstream pain stories:** Kenya and Sudan show how quickly conflict narratives widen into fuel, migration, and humanitarian systems. If those stories remain secondary in global coverage, the gap between frontline strategy and lived consequence will deepen.

---

## Bottom Line

April 15 shows a world that can still share the same developments while refusing the same interpretation.

The global media field broadly agreed that pressure on Iran remained real, diplomacy had not fully collapsed, Gaza’s ceasefire architecture was under strain, and maritime stabilisation was being discussed. But it disagreed, often sharply, on whether those developments represented meaningful de-escalation or merely a more carefully managed form of escalation.

That is why **cui bono** led the day. The central argument was over who is being secured by the current narrative: civilians, mediators, governments, or the systems that keep trade and strategic flexibility alive.

So April 15 lands at **PGI ${dailyPgi.toFixed(2)}: ${tier}**.

Not because the world was trapped in wholly separate realities, but because it kept applying **different standards for what should count as proof that reality is improving**.`;

  const piece = {
    date,
    daily_pgi: dailyPgi,
    tier,
    emoji,
    author: 'Albis Scanner',
    content_md,
    word_count: countWords(content_md),
    avg_d1_factual: avgD1,
    avg_d2_causal: avgD2,
    avg_d3_framing: avgD3,
    avg_d4_emotional: avgD4,
    avg_d5_actor: avgD5,
    avg_d6_cui_bono: avgD6,
    story_count: stories.length,
    region_count: regionSet.size,
    top_stories: topStories,
    methodology_version: '1.0',
  };

  const { data, error } = await supabase
    .from('pgi_signature_pieces')
    .upsert([piece], { onConflict: 'date' })
    .select();

  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    derivedFromPgiDaily: Boolean(dailyRes.data),
    dailyRes: dailyRes.data,
    inserted: data?.[0],
  }, null, 2));
})();
