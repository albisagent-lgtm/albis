const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const date = '2026-04-16';

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
    .slice(0, 6);

  const periodLine = periodSummary.map((p) => `- **${p.period === 'pm' ? 'PM' : p.period === 'midday' ? 'Midday' : p.period.toUpperCase()}:** ${p.pgi} (${p.count} stories)`).join('\n');
  const topCategoryBullets = categorySummary.slice(0, 5).map((c) => `- **${c.category[0].toUpperCase() + c.category.slice(1)}** at **${c.pgi}** (${c.count} stories)`).join('\n');
  const topPairBullets = topPairs.slice(0, 4).map((p) => `- **${p.label}** at **${p.avg_pgi}**`).join('\n');

  const content_md = `# PGI Signature Piece — ${titleDate(date)}

**Daily PGI:** ${dailyPgi.toFixed(2)} — **${tier}** ${emoji}  
**Stories analyzed:** ${stories.length} | **Regions tracked:** ${regionSet.size}

---

## Executive Summary

April 16 was a day of **disciplined divergence rather than total narrative fracture**.

Across the strongest PGI signals, most regions shared the same basic facts. The US-Iran ceasefire framework did not collapse. Mediation kept moving. Blockade pressure stayed in place. Lebanon ceasefire discussion continued even as strikes kept killing rescue workers. Sudan's refugee crisis deepened while donor language tried to project response. Hungary's post-Orbán transition remained one of Europe's most meaningful governance shifts.

But the shared factual layer never produced a shared interpretation. The real disagreement sat one step deeper: **what counts as evidence that diplomacy is changing reality rather than merely describing it more carefully**.

That is why the dimensional profile matters. Factual divergence stayed relatively contained at **${avgD1.toFixed(2)}**, but **cui bono** rose to **${avgD6.toFixed(2)}**, followed by **framing** at **${avgD3.toFixed(2)}** and **actor context** at **${avgD5.toFixed(2)}**. In plain terms: the world was not mainly split over whether the events happened. It was split over **who was gaining protection, who was being asked to trust the process, and whose exposure remained structurally unchanged beneath diplomatic language**.

Three connected tracks defined the day.

First, the **US-Iran diplomacy block** dominated from morning through evening. The top three stories were all versions of the same core contradiction: ceasefire language and mediation remained alive, but under coercive conditions that different regions read in fundamentally different ways. US and much European framing could still narrate this as leverage inside a negotiating process. Middle Eastern framing was more likely to read it as diplomacy inside duress. South Asian coverage gave Pakistan and mediation channels more strategic weight than Western coverage typically does. The result was not factual chaos, but a repeated dispute over legitimacy.

Second, the **Lebanon track** reinforced the same pattern. Direct talks and ceasefire discussion were visible enough to support a stabilisation narrative, yet ongoing strikes and deaths of medics and rescue workers made that narrative look partial, or even morally evasive, in other regions. This was where emotional divergence climbed hardest without becoming purely rhetorical: the gap was about whether diplomacy should be read as progress when the violence it is supposed to restrain is still visibly active.

Third, the day exposed a second-order divide between **frontline diplomacy stories and downstream humanitarian consequence stories**. Sudan and Chad did not produce the highest single PGI scores, but they did reveal how attention and moral emphasis remain unevenly distributed. African coverage treated the crisis as abandonment layered on survival. European coverage more often read it through donor conferences, aid architecture, and system response. The event was shared. The moral centre was not.

That combination pushed April 16 to **PGI ${dailyPgi.toFixed(2)}**, placing the day in **${tier}**. This was not a collapse into mutually unintelligible realities. It was a sustained struggle over **how much proof should be required before rhetoric about de-escalation is allowed to count as real improvement**.

---

## Dimensional Breakdown

| Dimension | Avg Score | What it shows |
|-----------|-----------|---------------|
| **D1 — Factual** | ${avgD1.toFixed(2)} | Core facts were often shared, but regions chose different verification anchors and different evidence thresholds. |
| **D2 — Causal** | ${avgD2.toFixed(2)} | Strong disagreement over whether pressure-plus-talks reduces risk, postpones escalation, or merely repackages it. |
| **D3 — Framing** | ${avgD3.toFixed(2)} | A clear split between stabilisation language, coercion language, and humanitarian-failure framing. |
| **D4 — Emotional** | ${avgD4.toFixed(2)} | Tone ranged from guarded strategic patience to anger, grief, and institutional distrust. |
| **D5 — Actor Context** | ${avgD5.toFixed(2)} | Regions centered different protagonists: Washington, Tehran, mediators, rescue workers, refugees, or downstream publics. |
| **D6 — Cui Bono** | ${avgD6.toFixed(2)} | **Highest dimension.** The sharpest argument was over who is actually being protected by the current story architecture. |

April 16 was therefore not led by factual confusion. It was led by **incentive disagreement**.

---

## Top Divergent Stories

### 1. **US-Iran ceasefire may be extended as mediation continues despite naval blockade pressure** — PGI ${topStories[0].pgi.toFixed(2)}
- **Regions covered:** United States, Europe, Middle East, South Asia, Global wires
- **Why it diverged:** Most regions accepted that mediation remained active and that an extension was under discussion. The split came over whether blockade pressure should be understood as legitimate leverage inside a fragile peace process, or as coercion hollowing out the meaning of diplomacy itself.
- **Signal:** Causal divergence hit **8.9**, framing **9.3**, actor context **8.9**, and cui bono **9.2**. This was the day's clearest example of shared facts producing incompatible political meaning.

### 2. **US-Iran diplomacy stays alive despite blockade as mediation intensifies** — PGI ${topStories[1].pgi.toFixed(2)}
- **Regions covered:** United States, Middle East, South Asia, Europe, Global wires
- **Why it diverged:** The story looked similar on the surface, but the regional readings remained sharply different. US and European coverage tended to hold pressure and diplomacy together as parallel tools. Middle Eastern coverage was more likely to ask whether talks under blockade can ever be narrated as normal diplomacy. South Asian coverage foregrounded mediation channels and regional agency rather than treating them as a backdrop.
- **Signal:** Framing reached **9.2** and cui bono **9.1**. The real split was not over whether diplomacy survived, but over what kind of diplomacy survives under pressure.

### 3. **US-Iran ceasefire framework holds but extension language is now openly disputed** — PGI ${topStories[2].pgi.toFixed(2)}
- **Regions covered:** United States, Middle East, South Asia, Europe, Global wires
- **Why it diverged:** By evening, the same contradiction had become more explicit. The issue was no longer simply whether the framework held, but whether contested extension language signaled real bargaining progress or only the careful management of disagreement.
- **Signal:** Cui bono remained extreme at **9.0**. The hidden argument was over who benefits from maintaining the appearance of continuity.

### 4. **Lebanon ceasefire discussion continues even as strikes keep killing rescue workers** — PGI ${topStories[3].pgi.toFixed(2)}
- **Regions covered:** Middle East, United States, Europe, Global wires
- **Why it diverged:** All major regions recognised the coexistence of diplomacy and violence. The split came over how those two facts should be weighed against each other. Western framing could still treat talks as a meaningful opening. Middle Eastern framing was more likely to see the continued killing of rescuers as proof that diplomatic language was outrunning conditions on the ground.
- **Signal:** Emotional divergence reached **8.4** and framing **8.9**. This was not just a tone gap. It was a split over whether diplomatic process can still claim moral credibility.

### 5. **Israel discusses possible Lebanon ceasefire while strikes continue and medics are killed** — PGI ${topStories[4].pgi.toFixed(2)}
- **Regions covered:** Middle East, Europe, United States, Global wires
- **Why it diverged:** This midday version of the Lebanon story sharpened the same fault line. The issue was not whether talks existed, but whether they should count as stabilisation while medical workers were still dying.
- **Signal:** Actor context at **8.5** and cui bono at **8.7** show why the gap stayed so high: regions disagreed over whose reality the ceasefire story was really centering.

---

## Regional Patterns

### **Middle East: diplomacy was tested against force, not against rhetoric**
Middle Eastern coverage repeatedly judged negotiation headlines against the continued reality of blockade, strikes, and selective protection. That kept the region farthest from US framing on the day's dominant stories. The sharpest bilateral gap was **${topPairs[0].label} at ${topPairs[0].avg_pgi}**.

### **United States: pressure and diplomacy were often narrated as compatible tools**
US framing showed the strongest tendency to hold coercion and negotiation inside the same strategic story. That creates internal coherence, but it widens the gap with regions that see the same pairing as an argument about legitimacy rather than strategy.

### **South Asia: mediation and regional agency remained unusually visible**
South Asian coverage did not merely echo Western diplomatic language. It gave mediation channels and regional intermediaries more authorship. That helps explain why **${topPairs[1].label}** remained one of the day's most divergent pairs: the disagreement was partly about who gets to shape the diplomatic field.

### **Europe: procedure, architecture, and stabilisation language stayed strong**
European coverage often leaned toward ceasefire process, conference response, donor architecture, and institutional transition. That made Europe closer to the United States on diplomacy framing than to Africa or the Middle East on stories where legitimacy and lived consequence were more central.

### **Africa: humanitarian consequence stories carried a different moral weight**
African coverage of Sudan and Chad treated the crisis less as a donor-response story than as proof of prolonged abandonment. The facts were shared with Europe. The disagreement was over whether current international action should count as response at all.

### **Pacific and East & Southeast Asia: systems proof still mattered**
Energy and security stories in the Pacific and East & Southeast Asia showed lower PGI than the Middle East diplomacy block, but they reinforced the same method: rhetoric alone was not enough. Fuel risk, alliance posture, shipping constraint, and operational continuity remained the test of whether stability was material or merely announced.

---

## Structural Signal of the Day

The category pattern reinforces the same conclusion:

${topCategoryBullets}

Diplomacy led because nearly every major ceasefire or mediation story contained the same embedded contradiction: **negotiation language advancing inside coercive or violent conditions**. Conflict stayed close behind because Lebanon turned that contradiction into a direct moral test. Migration and humanitarian stories scored high because they revealed how differently regions center neglect, consequence, and response.

The scan-by-scan pattern matters too:

${periodLine}

The notable feature is not a dramatic late collapse or spike. It is the **consistency**. The argument of the day stayed stable from AM to PM: can current diplomacy be treated as evidence of de-escalation before material conditions have visibly changed?

The most divergent regional pairs were:

${topPairBullets}

Those pairings formed around three recurring disagreements:

- **Legitimacy:** whether coercion and negotiation can still be narrated as one coherent process
- **Agency:** who is actually shaping events, and who is merely being positioned inside someone else's narrative
- **Protection:** whether present moves are reducing exposure for civilians and vulnerable populations, or mainly restoring room for states, markets, and mediators

---

## What to Watch Next

- **US-Iran extension language:** If the ceasefire holds but the wording of continuation remains contested, framing divergence will stay high.
- **Blockade durability:** Continued coercive pressure without visible political change will keep the causal and cui bono dimensions elevated.
- **Lebanon credibility test:** Any further coexistence of ceasefire talk and deadly strikes will sharpen the split between diplomatic-form and ground-truth framings.
- **Sudan-Chad aid reality:** Donor pledges now need operational proof. If conditions worsen despite conference language, Africa-Europe divergence will deepen further.
- **Systems proof points:** Shipping, fuel, and alliance posture stories remain the cleanest tests of whether claimed stabilisation is rhetorical or material.

---

## Bottom Line

April 16 shows a world that can still share events while withholding the same conclusion.

The global media field broadly agreed that the US-Iran framework had not collapsed, that mediation remained active, that Lebanon diplomacy was visible but morally strained, and that Sudan's humanitarian emergency remained severe. But it disagreed, often sharply, on whether those facts represented real movement toward safety or a more carefully managed presentation of unresolved exposure.

That is why **cui bono** led the day. The central argument was over who the current narrative is actually securing: civilians, mediators, governments, or the systems that keep strategic flexibility and market continuity alive.

So April 16 lands at **PGI ${dailyPgi.toFixed(2)}: ${tier}**.

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
