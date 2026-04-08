const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials', 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

const signaturePiece = {
  date: '2026-04-07',
  daily_pgi: 6.52,
  tier: 'Competing Realities',
  emoji: '🔴',
  author: 'Albis Scanner',
  content_md: `# PGI Signature Piece — April 7, 2026

**Daily PGI:** 6.52 — **Competing Realities** 🔴  
**Stories analyzed:** 41 | **Regions tracked:** 7 (US, EU, ME, AP, AF, LA, RU)

---

## Executive Summary

On April 7, 2026, the world's information sphere split along clear fault lines. While a ceasefire plan moved between Tehran and Washington, regional coverage diverged sharply on what that diplomacy actually means. The Hormuz crisis continues to cascade: food systems in Africa and South Asia report the oil shock as an immediate survival threat, while Western outlets still lead with market language. A fertilizer squeeze, aid disruptions, and food-security warnings compound into what Latin American and Arabic press already frame as a **hunger emergency**—a framing largely absent in Anglo-European coverage.

The dimensional data tells the story: **framing divergence (avg 7.89)** and **cui bono gaps (avg 7.84)** dominate, indicating that regions see not just different stories, but **different realities** emerging from the same events.

---

## Dimensional Breakdown

| Dimension | Avg Score | Interpretation |
|-----------|-----------|----------------|
| **D1 — Factual** | 6.31 | Moderate agreement on core facts; significant gaps in *which facts matter* |
| **D2 — Causal** | 6.88 | High divergence on cause-and-effect chains (oil → food vs. oil → markets) |
| **D3 — Framing** | 7.89 | **Peak divergence**: survival vs. systems, citizens vs. institutions |
| **D4 — Emotional** | 7.18 | Emotional tone varies from urgency (ME/AF) to caution (US/EU) |
| **D5 — Actor Context** | 7.03 | Different actors foregrounded: households vs. governments vs. institutions |
| **D6 — Cui Bono** | 7.84 | Near-peak divergence on *who benefits, who pays* from crisis outcomes |

---

## Top Divergent Stories

### 1. **Ceasefire plan reaches Tehran and Washington** — PGI 9.18
- **US coverage:** Leverage, diplomatic maneuvering, strategic optics
- **Middle East coverage:** Immediate regional stability, credibility of guarantees
- **EU coverage:** Escalation management, energy market implications
- **Why it diverges:** The same diplomatic text is read as a **power move** (US), a **survival question** (ME), and a **risk-mitigation exercise** (EU). Framing (9.4) and cui bono (9.6) scores reveal fundamentally incompatible interpretations of what "success" would look like.

### 2. **Sudan's food-kitchen collapse stays under-covered** — PGI 9.13
- **African coverage:** Intensely human, survival-focused, daily hunger narratives
- **European coverage:** Humanitarian-system breakdown, aid-agency perspectives
- **Coverage gaps:** US, ME, SA, AP, LA largely silent
- **Why it diverges:** For African outlets, this is a **lived emergency**. For European coverage, it's an **institutional failure**. Most of the world doesn't cover it at all—a divergence of *presence vs. absence*.

### 3. **WFP-linked warnings point to 45M more hungry** — PGI 9.12
- **Regions covered:** US, EU, AF
- **US/EU framing:** Shipping disruption → supply-chain stress → macro risk
- **African framing:** Shipping disruption → immediate food scarcity → survival crisis
- **Why it diverges:** Causal chains (9.2) and emotional tone (9.5) split sharply. Western coverage retains a buffer layer of *systems language*; African coverage has no buffer—it's already a hunger story.

### 4. **Fertilizer squeeze threatens next harvests** — PGI 9.07
- **Regions covered:** US, EU, ME, SA, AF (5 regions)
- **South Asia/Africa framing:** Direct planting threat, farmer survival, immediate food risk
- **US/EU framing:** Commodity prices, supply-chain bottlenecks, market volatility
- **Why it diverges:** The same nitrogen shortage is a **market story** in the West and a **starvation story** in the Global South. Framing (9.5) and causal (9.0) scores reflect this split.

---

## Regional Patterns

### **Middle East: From Strategy to Survival**
Arabic press is increasingly centering **household costs and citizen impact** over geopolitical strategy. The story "Arabic press foregrounds rising living costs" (PGI 8.37) shows a deliberate reframing of the Hormuz crisis—not as leverage, but as inflation directly hitting families. This framing gap (9.6) signals a shift from state-aligned narratives to **citizen-first** coverage.

### **Africa: Hunger Is Not Metaphor**
African coverage of food disruption uses **human-first language**: kitchens collapsing, people moving, children hungry. European coverage on the same events uses **system-first language**: humanitarian operations, aid flows, institutional capacity. The divergence isn't factual—it's existential. Africa's framing says: *this is happening to us now*. Europe's framing says: *this is a problem to manage*.

### **Latin America: Inflation as War**
Latin American outlets are **localizing global conflict through household economics**. The story "Latin media localises war through inflation warnings" (PGI 7.07) shows how geopolitical tensions are translated into grocery bills and transport costs—immediate, lived consequences. This contrasts with European macro-language and Middle Eastern strategic framing.

### **Asia-Pacific: Energy as Domestic Crisis**
Japanese coverage of oil shocks leads with **household squeeze**, not markets. The story "Japan coverage turns oil shock into household squeeze" (PGI 7.07) reflects a domestic-first framing: what does this mean for families, not just economies? This aligns with broader Asia-Pacific patterns of tying global risk to immediate, local impact.

### **US/EU: Systems Before Citizens**
Western coverage consistently **buffers human impact with institutional language**. FAO warnings, WFP projections, market indicators—all accurate, but structured to keep the human dimension at one remove. The framing gap isn't wrong, but it creates a perception split: systems stress vs. survival crisis.

---

## The Cascade Effect: Oil → Food → Migration

Today's data reveals a **multi-stage divergence cascade**:

1. **Stage 1 — Oil shock:** Western outlets lead with markets; ME/AP outlets lead with household costs
2. **Stage 2 — Fertilizer squeeze:** South Asia/Africa frame as planting threat; US/EU frame as commodity risk
3. **Stage 3 — Food warnings:** Africa/LA frame as hunger; US/EU frame as supply-chain disruption
4. **Stage 4 — Displacement:** ME/AF coverage centers human movement; US/EU coverage centers humanitarian systems

Each stage widens the perception gap. By stage 4, regions aren't just covering the same story differently—they're covering **different realities**.

---

## What to Watch

- **Ceasefire credibility:** If the Tehran-Washington plan stalls, framing gaps will widen further
- **Fertilizer supply:** The next harvest cycle is 60–90 days away; coverage divergence may intensify
- **Aid disruption:** US policy changes + Hormuz logistics = compounding stress on African/SA health systems
- **Localized inflation:** Latin America and Middle East coverage increasingly framing global shocks as domestic crises

---

## Bottom Line

**April 7, 2026** marks a day when the global information sphere operated in **competing realities**. The same diplomatic moves, the same supply disruptions, the same hunger warnings—but fundamentally incompatible interpretations of what they mean, who they affect, and what should be done.

The framing dimension (7.89) and cui bono dimension (7.84) drive today's PGI of **6.52**. Regions don't just disagree on emphasis—they disagree on **whose reality matters**. Western outlets buffer human impact with systems language. African, South Asian, and Latin American outlets center survival. Middle Eastern outlets oscillate between strategic and citizen framings.

This isn't bias. It's **perception geography**—and it's widening.`,
  word_count: 1249,
  avg_d1_factual: 6.31,
  avg_d2_causal: 6.88,
  avg_d3_framing: 7.89,
  avg_d4_emotional: 7.18,
  avg_d5_actor: 7.03,
  avg_d6_cui_bono: 7.84,
  story_count: 41,
  region_count: 7,
  top_stories: [
    {
      slug: 'ceasefire-plan-reaches-tehran-and-washington',
      headline: 'Ceasefire plan reaches Tehran and Washington',
      pgi: 9.18,
      category: 'conflict/energy',
      regions: ['us', 'eu', 'me', 'ap']
    },
    {
      slug: 'sudans-food-kitchen-collapse-stays-under-covered',
      headline: 'Sudan\'s food-kitchen collapse stays under-covered',
      pgi: 9.13,
      category: 'food/water',
      regions: ['af', 'eu']
    },
    {
      slug: 'wfp-linked-warnings-point-to-45m-more-hungry',
      headline: 'WFP-linked warnings point to 45M more hungry',
      pgi: 9.12,
      category: 'food/water',
      regions: ['us', 'eu', 'af']
    },
    {
      slug: 'fertilizer-squeeze-threatens-next-harvests',
      headline: 'Fertilizer squeeze threatens next harvests',
      pgi: 9.07,
      category: 'food/water',
      regions: ['us', 'eu', 'me', 'sa', 'af']
    }
  ]
};

async function insertSignaturePiece() {
  const { data, error } = await supabase
    .from('pgi_signature_pieces')
    .insert([signaturePiece])
    .select();
  
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  console.log('✅ Signature piece inserted successfully');
  console.log(JSON.stringify(data, null, 2));
}

insertSignaturePiece();
