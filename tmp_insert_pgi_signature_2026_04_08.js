const fs = require('fs');
const { createClient } = require('./node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

// Supabase admin client (service role)
const supabase = createClient(supabaseUrl, serviceRoleKey);

const content_md = `# PGI Signature Piece — April 8, 2026

**Daily PGI:** 6.63 — **Competing Realities** 🔴  
**Stories analyzed:** 43 | **Regions tracked:** 9

---

## Executive Summary

April 8 produced a perception map organised around one dominant theme: **the same energy shock was not experienced as the same story**. Across today's corpus, the highest-gap coverage converged around Hormuz, oil, food prices, and civilian vulnerability, but regions split sharply over what the real center of gravity was. US and much of European coverage continued to treat the disruption primarily as a strategic and market event. Middle Eastern, African, South Asian, and Latin American coverage pushed the story closer to the household: kitchens, transport, medicines, water, and affordability.

That pattern is visible in the dimensional scores. **Framing divergence (7.02)** led the table again, closely followed by **cui bono divergence (6.93)**. In other words, the strongest disagreement was not about whether disruption exists. It was about **what kind of disruption it is**, **who carries the pain**, and **who remains insulated long enough to narrate it abstractly**.

The day closed at **PGI 6.63**, placing it firmly in **Competing Realities**. That is slightly above April 7's 6.52, and the increase matters: today's divergence is less about one diplomatic flashpoint and more about a widening cross-regional split over the lived meaning of war-linked economic stress.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | 6.15 | Moderate factual separation; regions share core events but prioritize different evidence |
| **D2 — Causal** | 6.61 | Strong divergence on what drives the crisis and what comes next |
| **D3 — Framing** | 7.02 | **Highest dimension**; market shock vs household emergency remains the key split |
| **D4 — Emotional** | 6.61 | Tone diverges from technocratic caution to direct urgency and fear |
| **D5 — Actor Context** | 6.48 | Different protagonists dominate: households, states, aid systems, or markets |
| **D6 — Cui Bono** | 6.93 | Near-peak disagreement over who benefits, who pays, and who is shielded |

The pattern is clear: **meaning diverges faster than facts**. Regions are not entirely disconnected on the event stream. They are disconnected on the story architecture wrapped around those events.

---

## Top Divergent Stories

### 1. **Hormuz shock hits kitchens first** — PGI 9.15
- **Regions covered:** US, EU, Middle East, Latin America, South Asia, Africa
- **What diverged:** Western coverage often positioned the story as an energy-price and logistics issue. Middle Eastern, South Asian, African, and Latin American coverage translated the same shock directly into meals, household costs, and day-to-day survival.
- **Why it matters:** This was the day's clearest example of a market story in one region becoming a kitchen story in another. Emotional divergence (9.6) and framing divergence (9.3) show that the same disruption was being narrated at radically different human distance.

### 2. **Oil shock hits homes beyond pump** — PGI 9.10
- **Regions covered:** US, EU, Middle East, South Asia, Latin America
- **What diverged:** US and EU framing stayed closer to fuel inflation, macro stress, and transport economics. Middle Eastern and southern-region coverage widened the lens to rent, food, electricity, and household resilience.
- **Why it matters:** The strongest score in this story was **cui bono (9.8)**. Regions disagreed intensely on who absorbs shock, who profits from volatility, and whose exposure gets normalized.

### 3. **Food prices climb on war logistics** — PGI 9.10
- **Regions covered:** US, Middle East, EU, Latin America, Africa
- **What diverged:** Western coverage still treated logistics as a supply-chain problem. African and Latin American framing moved faster to affordability erosion and reduced food access.
- **Why it matters:** This is where the scanner sees war economics becoming body economics. Logistics is not an abstract bottleneck if it arrives as thinner diets and weaker purchasing power.

### 4. **Arab press foregrounds triple oil-gas-food shock** — PGI 8.28
- **Regions covered:** Middle East, EU, Africa
- **What diverged:** Arabic coverage bundled fuel, electricity, and food into one continuous civilian stress system. European coverage was more compartmentalized, while African coverage tracked the same shock through vulnerability and access.
- **Why it matters:** The framing score of 9.1 shows that the gap is not merely intensity. It is structural: one region narrates integrated household survival systems, another narrates sector-specific disruption.

### 5. **Latin outlets connect war to AI and food inputs** — PGI 8.27
- **Regions covered:** Latin America, Middle East, US
- **What diverged:** Latin coverage localized global war through inflation, production inputs, and downstream consumer pressure. US coverage stayed more segmented between technology, energy, and geopolitical analysis.
- **Why it matters:** This was one of the day's most revealing cross-domain stories: in Latin framing, war does not stay in one category. It spills across technology, food, and energy at once.

---

## Regional Patterns

### **Middle East: Civilian systems moved to the center**
Middle Eastern coverage repeatedly pulled the story away from abstract strategy and toward civilian exposure. Oil, food, gas, and infrastructure were treated as part of a single lived system. That is why several of today's highest-scoring stories tilt toward household vulnerability rather than diplomatic or military maneuvering.

### **Africa: Access and survival remain the lens**
African framing consistently emphasized the consequences of disruption rather than the prestige of response. In food and health stories alike, the question was not merely what happened but whether people can still obtain staples, medicine, or continuity of care. This compresses the moral distance between event and outcome.

### **Latin America: Global conflict translated into domestic affordability**
Latin outlets again acted as strong localizers. Rather than covering war as distant theatre, they translated it into input costs, inflation, and household pressure. That makes Latin coverage especially valuable in the PGI system: it reveals how regions outside the direct conflict zone metabolize global disruption into daily life.

### **South Asia: Causal chains were read through household fragility**
Where Western coverage often stopped at market movement, South Asian coverage pushed further down the chain: transport, prices, livelihoods, and the burden on lower-resilience households. That is one reason causal divergence remained elevated at 6.61.

### **US and Europe: Systems language still buffered the human story**
This was not absence of coverage. It was distance of framing. US and European reporting often remained closest to energy markets, logistics, strategic positioning, and institutional response. Accurate, but buffered. The effect is a perception gap in which other regions appear to be describing a more immediate and embodied crisis.

### **Russia and East/Southeast Asia: narrower but meaningful presence**
These regions appeared in fewer stories, but their inclusion helped widen today's regional map to nine tracked zones. Their presence reinforces a broader point: the global information field is no longer split only across the classic US-EU-ME triangle. Secondary regional lenses are becoming increasingly important to how divergence accumulates.

---

## Category-Level Signal

The strongest average divergence clustered around **water (8.10)**, **energy (8.03)**, and **food (7.63)**. That is the day's real message.

This is not a news cycle dominated by rhetorical disagreement alone. It is a cycle dominated by **infrastructure and survival narratives**:
- water systems,
- food affordability,
- power costs,
- medicine continuity,
- and the household consequences of prolonged logistics stress.

Technology also spiked, but in a different way. The technology-linked divergence came when regions embedded tech inside wider material systems rather than treating it as a silo. That crossover is important and likely to deepen.

---

## AM vs PM Shift

The day also intensified as it went on.

- **AM average PGI:** 6.51
- **PM average PGI:** 6.77

That tells us the later cycle became more polarized, not less. As the day progressed, stories moved from early warning and signal detection into clearer narrative camps. By evening, the same disruptions were being more openly interpreted through incompatible regional logics.

---

## What Today's PGI Actually Means

A **6.63 PGI** does not mean the world is unable to see the same events. It means the world is increasingly sorting those events into different moral and practical realities.

For one cluster of regions, today's dominant question was: **How does this affect stability, markets, and geopolitical leverage?**

For another cluster, the dominant question was: **How does this hit food, care, transport, bills, and daily survival?**

Those are not cosmetic differences. They generate different priorities, different policy instincts, and different thresholds for what counts as urgent.

---

## Bottom Line

April 8 was a day when **war-linked economic disruption stopped behaving like a single story**. The global narrative field split between those still able to read volatility at system level and those already reading it at household level.

That is why the top stories were so concentrated around kitchens, food prices, fuel, and integrated civilian stress. And that is why framing and cui bono once again led the table. The real divergence is not whether disruption is happening. It is over **where the pain is located**, **how directly it is felt**, and **whose experience becomes the default narrative**.

Today's PGI shows a world still connected by event flow but increasingly divided by lived interpretation. That is what **Competing Realities** looks like in practice.`;

const piece = {
  date: '2026-04-08',
  daily_pgi: 6.63,
  tier: 'Competing Realities',
  emoji: '🔴',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|\-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 6.15,
  avg_d2_causal: 6.61,
  avg_d3_framing: 7.02,
  avg_d4_emotional: 6.61,
  avg_d5_actor: 6.48,
  avg_d6_cui_bono: 6.93,
  story_count: 43,
  region_count: 9,
  top_stories: [
    {
      slug: 'hormuz-shock-hits-kitchens-first',
      headline: 'Hormuz shock hits kitchens first',
      pgi: 9.15,
      category: 'food/water',
      regions: ['us', 'eu', 'me', 'la', 'sa', 'af']
    },
    {
      slug: 'oil-shock-hits-homes-beyond-pump',
      headline: 'Oil shock hits homes beyond pump',
      pgi: 9.1,
      category: 'energy',
      regions: ['us', 'eu', 'middle_east', 'south_asia', 'latin_americas']
    },
    {
      slug: 'food-prices-climb-on-war-logistics',
      headline: 'Food prices climb on war logistics',
      pgi: 9.1,
      category: 'food/water',
      regions: ['us', 'middle_east', 'eu', 'latin_americas', 'africa']
    },
    {
      slug: 'arab-press-foregrounds-triple-oil-gas-food-shock',
      headline: 'Arab press foregrounds triple oil-gas-food shock',
      pgi: 8.28,
      category: 'energy/food',
      regions: ['middle_east', 'eu', 'africa']
    },
    {
      slug: 'latin-outlets-connect-war-to-ai-and-food-inputs',
      headline: 'Latin outlets connect war to AI and food inputs',
      pgi: 8.27,
      category: 'tech/food/energy',
      regions: ['latin_americas', 'middle_east', 'us']
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