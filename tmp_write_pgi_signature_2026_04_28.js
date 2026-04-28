const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const content_md = `# PGI Signature Piece — April 28, 2026

**Daily PGI:** 6.45 — **Competing Realities** 🔴  
**Stories analyzed:** 101 | **Regions tracked:** 11

---

## Executive Summary

April 28 closed with a **daily PGI of 6.45**, keeping the system firmly in **Competing Realities** territory for a second straight day. The aggregate number matched April 27 exactly, but the internal structure changed. Yesterday’s red-tier divergence was driven heavily by humanitarian and ceasefire credibility stories. Today’s red-tier pattern was more explicitly shaped by **information warfare, election legitimacy, war diplomacy around Iran and Hormuz, and regionally uneven attention to security breakdowns in Africa and the Sahel**.

The strongest single story was **Trump and aides keep chasing vote-rigging claims even after the latest probe finds nothing**, which scored **9.20**. The second-strongest story, **Reuters investigation finds Trump administration pushing to expand federal control over elections in at least eight states**, scored **9.13**. Both stories sat in a tightly aligned US-vs-Global divergence cluster. That matters because today’s highest tributary was **PGI-IW at 9.20**: the most polarising material was not only about conflict zones abroad, but about the **integrity of democratic reality itself** — who defines what counts as fraud, who controls electoral procedure, and whether institutional reassurances still carry persuasive force across regions.

The second major divergence field was the widening **Iran-Hormuz diplomacy complex**. Two near-identical high-PGI stories — **Iran offers to reopen the Strait of Hormuz if the US lifts its blockade and the war ends** and **Iran relays proposal to reopen Strait of Hormuz and end the war via Pakistani mediators** — both scored **9.12**. The factual core travelled across regions. The meaning did not. In the **Middle East**, the story could read as conditional de-escalation with immediate war implications. In the **US**, it could read as adversarial bargaining under pressure. In **South Asia**, the Pakistani mediation angle created a distinct diplomatic-agency frame. In **Europe**, the same development was more exposed to energy-security and shipping-risk interpretation.

A third divergence cluster sat around **African and Sahel security deterioration**, especially **Russia’s Africa Corps confirms withdrawal from Kidal in northern Mali after fierce fighting** at **9.10**. That story did not dominate the daily headline hierarchy the way the US election or Hormuz stories did, but it revealed a persistent structural pattern: conflicts that materially reshape regional security maps can still be narrated as urgent strategic reversals in one region and peripheral instability in another. The same applied to stories such as **Mali’s army is reported to be withdrawing from Tessit under insurgent pressure**, **Gunmen raid a Nigerian orphanage and kidnap 23 children**, and **At least 42 people are killed in Chad after a water-well dispute spirals into reprisal attacks**. These were not all among the top six PGI scores, but together they showed how severe violence can remain regionally compartmentalised.

The dimensional profile confirms that this was again a day when **interpretation outran fact**. **Cui bono divergence averaged 6.85**, the highest of the six dimensions, followed by **framing at 6.82**, **emotional divergence at 6.74**, and **causal divergence at 6.58**. **Factual divergence averaged 6.13**, the lowest layer. So the global information split was not primarily about different raw event claims. It was about **who benefits from a narrative, who gets centered, and what political meaning is attached to the same factual substrate**.

The temporal pattern also mattered. The **am scan averaged 6.24**, **midday 6.28**, and **pm 7.32**. The red-tier finish was therefore not a flat all-day condition. It intensified late, as election-legitimacy stories, Iran diplomacy stories, and hard-security reversals accumulated into a denser evening cluster of rival interpretations.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | 6.13 | Core facts still travelled more reliably than meaning, but even the factual layer remained notably fragmented. |
| **D2 — Causal** | 6.58 | Regions diverged on whether events were caused by institutional decay, strategic coercion, domestic power consolidation, or ordinary crisis management. |
| **D3 — Framing** | 6.82 | The same event could be narrated as democratic erosion, bargaining leverage, energy stabilization, insurgent momentum, or humanitarian neglect. |
| **D4 — Emotional** | 6.74 | Tone split sharply between alarm, procedural distance, and elite-management language. |
| **D5 — Actor Context** | 6.38 | Different regions centered different protagonists: voters, federal institutions, Tehran, Washington, Pakistani mediators, Sahel governments, or civilians under threat. |
| **D6 — Cui Bono** | 6.85 | **Highest dimension.** The sharpest divergence was over who gains legitimacy, leverage, protection, or narrative cover from the way events are described. |

The ordering is important. **Meaning, motive, and advantage** remain more contested than raw event description. That is the signature structure of a red-tier PGI day: people can still discuss the same event, but they are no longer inhabiting the same political story about it.

---

## Top Divergent Stories

### 1. **Trump and aides keep chasing vote-rigging claims even after the latest probe finds nothing** — PGI 9.20
- **Regions covered:** US, Global
- **Category:** media
- **Dimensional signal:** factual 8.7, causal 9.2, framing 9.4, emotional 9.5, actor 9.0, cui bono 9.4
- **What diverged:** The factual finding — that the latest probe found nothing — did not settle the story. The split turned on whether continued fraud claims are framed as democratic destabilisation, base mobilization, institutional failure, or just another escalation in partisan media warfare.
- **Why it matters:** This was the day’s clearest information-warfare story. It shows how election narratives now function as competing reality systems rather than simple disputes over one investigation.

### 2. **Reuters investigation finds Trump administration pushing to expand federal control over elections in at least eight states** — PGI 9.13
- **Regions covered:** US, Global
- **Category:** governance
- **Dimensional signal:** factual 8.7, causal 9.2, framing 9.3, emotional 9.3, actor 8.9, cui bono 9.4
- **What diverged:** One reading centers administrative authority and legal control; another centers democratic backsliding and the reconfiguration of electoral power.
- **Why it matters:** Together with the vote-rigging story, it formed a reinforced legitimacy cluster: not just whether fraud exists, but who gets to supervise the mechanisms for deciding that question.

### 3. **Iran offers to reopen the Strait of Hormuz if the US lifts its blockade and the war ends** — PGI 9.12
- **Regions covered:** Middle East, US, Europe, Global
- **Category:** diplomacy
- **Dimensional signal:** factual 8.6, causal 9.1, framing 9.4, emotional 9.3, actor 8.9, cui bono 9.4
- **What diverged:** The same conditional offer could read as a genuine de-escalatory opening, a pressure tactic, an energy-market signal, or a test of Western resolve.
- **Why it matters:** It bound together war, shipping, sanctions, and energy politics in a single narrative field, making it a natural amplifier of cross-regional divergence.

### 4. **Iran relays proposal to reopen Strait of Hormuz and end the war via Pakistani mediators** — PGI 9.12
- **Regions covered:** Middle East, South Asia, US, Global
- **Category:** diplomacy
- **Dimensional signal:** factual 8.6, causal 9.1, framing 9.4, emotional 9.3, actor 8.9, cui bono 9.4
- **What diverged:** South Asian coverage had a strong incentive to foreground Pakistani agency and mediation relevance; US framing was more likely to preserve a Washington-vs-Tehran bargaining structure; Middle Eastern framing remained closer to war-risk management.
- **Why it matters:** This was the story most clearly reflected in the day’s headline pair result: **Middle East vs South Asia at 8.80**, with **South Asia vs US also at 8.80**.

### 5. **Russia’s Africa Corps confirms withdrawal from Kidal in northern Mali after fierce fighting** — PGI 9.10
- **Regions covered:** Africa, Europe, Global
- **Category:** security
- **Dimensional signal:** factual 8.6, causal 9.1, framing 9.3, emotional 9.3, actor 8.9, cui bono 9.4
- **What diverged:** The same withdrawal can be read as a local battlefield setback, a strategic blow to Russia-backed force credibility, or another chapter in a chronic Sahel instability story that never fully enters wider global attention.
- **Why it matters:** It exposed how major African security reversals still struggle to command a unified interpretive frame across regions.

### 6. **Global hunger report warns war, drought and aid shortfalls will keep food crises critical in 2026** — PGI 8.17
- **Regions covered:** Global, Africa, Middle East, South Asia
- **Category:** food-agriculture
- **Dimensional signal:** factual 7.6, causal 8.1, framing 8.4, emotional 8.5, actor 8.0, cui bono 8.4
- **What diverged:** Regions agreed that conditions are severe, but diverged on whether the story is primarily about climate stress, war spillover, donor failure, or everyday survival.
- **Why it matters:** Even on a day led by election legitimacy and geopolitics, humanitarian narratives still contributed significantly to the red-tier structure.

---

## Regional Pattern Analysis

### **US vs Global: election legitimacy became the day’s sharpest democratic reality split**
The two highest-scoring stories were both US election-legitimacy stories and both registered a **9.3 pair PGI between Global and US**. That indicates a severe interpretive break around whether the core issue is misinformation, democratic erosion, state power, or partisan contest. This is not a small domestic-media dispute. It is a high-intensity divergence over the terms on which democratic legitimacy is narrated internationally.

### **Middle East vs South Asia vs US: Hormuz diplomacy created a three-way fracture**
The daily table’s headline pair result — **Middle East vs South Asia at 8.80** — did not arise from a broad all-day average alone. It was concentrated in high-significance Iran diplomacy stories, especially the Pakistani-mediation variant. **South Asia vs US also averaged 8.80**, showing how mediation stories are not merely about de-escalation; they are also about **whose diplomatic agency counts**.

### **Middle East remained the system’s main conflict-stress node**
Beyond the Hormuz stories, the **Middle East vs US pair averaged 7.98 across 13 stories**, while **Global vs Middle East averaged 7.83** and **Europe vs Middle East 7.83**. That is a strong signal of repeated disagreement, not a one-off spike. The Middle East remained the region where official narratives were most likely to be tested against immediate conflict consequences rather than abstract diplomatic language.

### **Africa’s severe security stories remained partly compartmentalised**
African and Sahel stories were some of the day’s most consequential in human and strategic terms, but they did not produce the same universal shared attention as US democratic stories or Hormuz diplomacy. Mali, Nigeria, and Chad all appeared inside the daily narrative field, yet they often remained structurally region-bound. That asymmetry matters: a system can be highly alert to power struggles in Washington while still treating mass insecurity elsewhere as geographically contained.

### **Europe sat between strategic and systems-management frames**
European coverage was central to the Hormuz and energy stories, but it often pulled them toward **risk management**, **shipping stability**, **sanctions implications**, and **household cushioning measures**. That did not erase divergence; it helped explain it. Europe frequently occupied the interpretive middle layer between frontline conflict framing and US institutional-strategic framing.

---

## Sector and Storyfield Signals

Today’s category profile showed how concentrated the pressure was:

- **Media:** 9.20
- **Migration:** 8.10
- **Trade:** 7.36
- **Diplomacy:** 7.26
- **Governance:** 7.24
- **Conflict:** 7.22
- **Social:** 7.20
- **Security:** 7.16

That distribution is revealing. The highest category was not battlefield violence but **media/information conflict**. The day’s red-tier status was therefore driven as much by **narrative authority** as by physical conflict. Meanwhile, diplomacy, governance, conflict, and security all clustered in the low-to-mid 7s, which meant divergence was broad enough across sectors to keep the total PGI elevated even without a single dominant war-only storyline.

---

## Bottom Line

April 28 was another **Competing Realities** day, but with a different center of gravity from April 27. The overall score remained **6.45**, yet the strongest pressure came from a combination of **US election-legitimacy conflict**, **Iran-Hormuz war diplomacy**, and **under-shared African security deterioration**.

The deepest split was once again about **meaning**, not just fact. **Cui bono (6.85)** and **framing (6.82)** outran **factual divergence (6.13)**. That means the global system could still carry common event descriptions, but it could not carry a common answer to the harder questions: **Who is manipulating the narrative? Who is gaining power? Who is bearing the risk? Which institutions still deserve trust?**

That is why April 28 stayed red. The world was not simply looking at different stories. It was looking at the same high-significance stories and deriving **different political realities** from them.`;

const piece = {
  date: '2026-04-28',
  daily_pgi: 6.45,
  tier: 'Competing Realities',
  emoji: '🔴',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 6.13,
  avg_d2_causal: 6.58,
  avg_d3_framing: 6.82,
  avg_d4_emotional: 6.74,
  avg_d5_actor: 6.38,
  avg_d6_cui_bono: 6.85,
  story_count: 101,
  region_count: 11,
  top_stories: [
    {
      slug: 'trump-and-aides-keep-chasing-vote-rigging-claims-even-after-the-latest-probe-finds-nothing',
      headline: 'Trump and aides keep chasing vote-rigging claims even after the latest probe finds nothing',
      pgi: 9.2,
      category: 'media',
      regions: ['US', 'Global']
    },
    {
      slug: 'reuters-investigation-finds-trump-administration-pushing-to-expand-federal-control-over-elections-in-at-least-eight-states',
      headline: 'Reuters investigation finds Trump administration pushing to expand federal control over elections in at least eight states',
      pgi: 9.13,
      category: 'governance',
      regions: ['US', 'Global']
    },
    {
      slug: 'iran-offers-to-reopen-the-strait-of-hormuz-if-the-us-lifts-its-blockade-and-the-war-ends',
      headline: 'Iran offers to reopen the Strait of Hormuz if the US lifts its blockade and the war ends',
      pgi: 9.12,
      category: 'diplomacy',
      regions: ['Middle East', 'US', 'Europe', 'Global']
    },
    {
      slug: 'iran-relays-proposal-to-reopen-strait-of-hormuz-and-end-the-war-via-pakistani-mediators',
      headline: 'Iran relays proposal to reopen Strait of Hormuz and end the war via Pakistani mediators',
      pgi: 9.12,
      category: 'diplomacy',
      regions: ['Middle East', 'South Asia', 'US', 'Global']
    },
    {
      slug: 'russia-s-africa-corps-confirms-withdrawal-from-kidal-in-northern-mali-after-fierce-fighting',
      headline: 'Russia’s Africa Corps confirms withdrawal from Kidal in northern Mali after fierce fighting',
      pgi: 9.1,
      category: 'security',
      regions: ['Africa', 'Europe', 'Global']
    },
    {
      slug: 'global-hunger-report-warns-war-drought-and-aid-shortfalls-will-keep-food-crises-critical-in-2026',
      headline: 'Global hunger report warns war, drought and aid shortfalls will keep food crises critical in 2026',
      pgi: 8.17,
      category: 'food-agriculture',
      regions: ['Global', 'Africa', 'Middle East', 'South Asia']
    }
  ]
};

async function main() {
  const { data, error } = await supabase
    .from('pgi_signature_pieces')
    .upsert([piece], { onConflict: 'date' })
    .select();

  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, row: data?.[0], word_count: piece.word_count }, null, 2));
}

main();
