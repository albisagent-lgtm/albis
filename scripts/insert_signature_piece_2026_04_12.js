const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const content_md = `# PGI Signature Piece — April 12, 2026

**Daily PGI:** 6.87 — **Diverging Narratives** 🟠  
**Stories analyzed:** 27 | **Regions tracked:** 7

---

## Executive Summary

April 12 did not produce total narrative fracture. It produced something more disciplined and, in some ways, more important: **stable, repeated divergence around what counts as meaningful de-escalation**.

Across the day's highest-scoring stories, regions broadly agreed on the core facts. U.S.-Iran talks opened in Islamabad. The ceasefire framework held, but only shakily. Lebanon moved deeper into direct-talks language without resolving the underlying instability. Russia and Ukraine used the Orthodox Easter window for a narrow pause and prisoner exchange. The Strait of Hormuz showed signs of reopening, but not full normalisation.

The disagreement emerged one layer deeper. Was this a real reduction in risk, a tactical pause, a selectively managed truce, or simply a more market-friendly presentation of unresolved conflict?

That is why the clearest dimensional signature today was not factual divergence, which stayed relatively contained at **5.14**, but **cui bono divergence at 8.07**, followed by **framing at 7.52** and **actor context at 7.38**. The world was not mainly arguing over what happened. It was arguing over **who gained room, who retained leverage, and whose exposure was being hidden behind diplomatic language**.

The strongest cluster ran through three connected tracks:

1. **The U.S.-Iran bargaining channel** — whether talks represent genuine risk reduction or only a fragile postwar holding pattern.
2. **The Lebanon front** — whether direct talks should be read as progress, or as diplomacy layered over instability that remains structurally unresolved.
3. **Operational proof tests** such as Hormuz reopening — whether system-level normalisation is actually catching up with the rhetoric of calm.

Those repeated disagreements pushed the weighted daily PGI to **6.87**, keeping April 12 in **Diverging Narratives** rather than tipping it into full Competing Realities. The distinction matters. Today the global media field was not split into incompatible worlds. It was split into **competing interpretations of the same transitional moment**.

---

## Dimensional Breakdown

| Dimension | Avg Score | What it shows |
|-----------|-----------|---------------|
| **D1 — Factual** | 5.14 | Moderate factual spread. Regions mostly recognised the same events, but prioritised different evidence and verification signals. |
| **D2 — Causal** | 6.60 | Strong divergence over what current diplomacy and pause windows will actually produce next. |
| **D3 — Framing** | 7.52 | A clear split between de-escalation framing, coercion framing, and systems-management framing. |
| **D4 — Emotional** | 6.53 | Tone ranged from guarded relief to strategic distrust and unresolved anxiety. |
| **D5 — Actor Context** | 7.38 | Regions centered different protagonists: mediators, states, civilians, markets, or coercive actors. |
| **D6 — Cui Bono** | 8.07 | **Highest dimension.** The sharpest disagreement was over who benefits from the current narrative of stabilisation. |

The order of these scores is the key to the day. April 12 was not driven by factual confusion. It was driven by **incentive disagreement**.

---

## Top Divergent Stories

### 1. **U.S.-Iran talks begin in Islamabad while the ceasefire holds only shakily** — PGI 7.82
- **Regions covered:** US, Europe, Middle East, South Asia, East & Southeast Asia
- **Why it diverged:** Most regions accepted that direct talks had opened. The split came over what the talks meant. Western coverage leaned toward process and diplomatic continuity. Middle Eastern coverage remained more alert to fragility and selective inclusion. South Asian coverage gave Pakistan visible agency. East and Southeast Asian coverage looked for proof that negotiations were changing regional behaviour rather than simply changing tone.
- **Signal:** Framing hit **8.5**, actor context **8.4**, and cui bono **9.1**. This was a dispute over ownership and credibility, not occurrence.

### 2. **US-Iran negotiations continue under a fragile ceasefire as Strait of Hormuz reopening remains central** — PGI 7.82
- **Regions covered:** US, Europe, Middle East, South Asia
- **Why it diverged:** The headline looked stabilising, but the underlying question was whether the Strait's partial reopening should be treated as evidence of genuine de-escalation or merely a provisional systems recovery inside an unresolved conflict environment.
- **Signal:** Cui bono reached **9.0** and actor context **8.5**. The core disagreement was over whose interests were being restored first: regional civilians, shipping markets, diplomats, or strategic actors buying time.

### 3. **U.S.-Iran direct talks enter a fragile postwar bargaining phase** — PGI 7.80
- **Regions covered:** US, Europe, Middle East, South Asia, East & Southeast Asia
- **Why it diverged:** This story extended the same pattern into midday coverage. Some regions read the talks as a meaningful channel. Others treated them as an unstable bargaining layer sitting on top of unresolved coercion.
- **Signal:** Again, factual spread stayed relatively modest while framing (**8.5**) and cui bono (**9.0**) carried the divergence.

### 4. **Israel approves direct talks with Lebanon while refusing a Hezbollah ceasefire** — PGI 7.70
- **Regions covered:** US, Europe, Middle East
- **Why it diverged:** Western coverage was more likely to treat direct talks as a diplomatic opening worth tracking on its own merits. Middle Eastern framing was more likely to stress the contradiction: diplomacy was advancing rhetorically while refusal on the Hezbollah front kept the security architecture visibly partial.
- **Signal:** Emotional divergence rose to **8.0**, framing to **8.5**, and cui bono to **8.8**. The real split was whether this counted as progress or as selective progress.

### 5. **Lebanon enters direct talks but remains the main fault line in the ceasefire map** — PGI 7.68
- **Regions covered:** US, Europe, Middle East
- **Why it diverged:** This was the clearest example of regions disagreeing over the meaning of diplomatic form. The presence of talks did not resolve the perception gap because the underlying violence and structural exclusions were still visible.
- **Signal:** The Lebanon track shows why today's divergence stayed elevated even without crossing into full narrative rupture: regions were not seeing different headlines, but they were applying different standards for what deserves to be called stabilisation.

---

## Regional Patterns

### **Middle East: diplomatic language was judged against what remained unresolved**
Middle Eastern coverage consistently treated ceasefire and talks language as something to be tested against exclusions, force continuity, and uneven security realities. In that lens, the presence of a negotiation channel does not by itself reduce the perception gap. It can even widen it if the diplomatic frame appears to outrun conditions on the ground.

### **United States and Europe: process, verification, and architecture remained the default frame**
US and European narratives were generally more procedural. They focused on whether talks were opening, whether channels were holding, whether a pause could be verified, and whether regional systems were moving back toward normality. That frame produces coherence, but it also widens the gap whenever other regions are asking a more basic legitimacy question: **stability for whom, and at whose expense?**

### **South Asia: Pakistan's mediating role mattered materially, not just ceremonially**
South Asian coverage repeatedly gave Islamabad real strategic weight. In Western accounts, Pakistan often appears as a venue or conduit. In South Asian framing, it appears closer to an actor helping shape the diplomatic field itself. That changes the story's center of gravity and helps explain why South Asia's sharpest gap was not with Europe, but with the United States.

### **East and Southeast Asia: proof was measured through operational normalisation**
East and Southeast Asian coverage was particularly disciplined around practical proof. It was less impressed by de-escalation language alone and more interested in whether shipping, trade, and regional risk conditions were actually normalising. That is why Hormuz remained such a critical interpretive test.

### **Africa and Latin America: lighter direct presence, heavier downstream vulnerability**
Africa and Latin America were not central authors of the day's top divergence cluster, but their thinner presence is meaningful in itself. On diplomacy-heavy days, these regions often enter the narrative more through exposure to consequences than through ownership of the story architecture. That asymmetry is part of the broader perception environment.

---

## Structural Signal of the Day

The category pattern reinforces the same conclusion:

- **Diplomacy** was the highest-divergence category at **7.77**
- **Conflict** followed at **7.51**
- **Geopolitics** remained elevated at **7.44**
- **Economic flows** also stayed high at **7.01**, showing that infrastructure and market stories were not separate from the conflict narrative — they were one of its proof mechanisms

The scan-by-scan pattern matters too:

- **AM:** 6.95
- **Midday:** 7.49
- **PM:** 6.46

The midday spike shows the day's sharpest divergence emerging when diplomatic and ceasefire narratives were most actively being interpreted, not merely reported. By evening, the score cooled slightly, but not because the core questions were resolved. It cooled because the conflict field became more legible: the same tensions persisted, just with fewer fresh interpretive openings.

The most divergent region pair was **Middle East vs United States (8.36)**, followed by **South Asia vs United States (8.13)** and **East & Southeast Asia vs South Asia (8.10)**. That pattern is highly revealing. The deepest gaps were not random. They formed around three recurring disagreements:

- **Scope:** whether the diplomacy being described is genuinely inclusive
- **Agency:** who is actually shaping outcomes
- **Proof:** what must change materially before calm should be believed

---

## What to Watch Next

- **Islamabad talks:** If the talks continue without visible reduction in regional instability, the framing gap will widen further.
- **Lebanon track:** Any continued coexistence of direct talks and partial exclusion will keep the legitimacy question alive.
- **Hormuz traffic:** Partial reopening is not the same as restored normality. This remains the cleanest systems-level reality check.
- **Pakistan's diplomatic role:** If mediation continues through South Asian channels, regional disagreement over authorship and strategic credit is likely to deepen.
- **Temporary ceasefire windows elsewhere:** Russia-Ukraine showed again that announcement and trust are now analytically separate variables.

---

## Bottom Line

April 12 shows a world that can still share the same headline while withholding the same conclusion.

The global media field agreed that diplomacy was moving, that pause windows were opening, and that some operational indicators were improving. But it disagreed over whether those developments represented real de-escalation, selective stabilisation, or a holding pattern marketed as peace.

That is why **cui bono** once again led every dimension. The central argument was over who gains legitimacy, who gains time, who gains economic breathing room, and who remains exposed while the language of stabilisation circulates.

So the score lands at **PGI 6.87: Diverging Narratives**.

Not because the world was split into separate realities, but because it was still applying **different standards for when reality has actually changed**.`;

const piece = {
  date: '2026-04-12',
  daily_pgi: 6.87,
  tier: 'Diverging Narratives',
  emoji: '🟠',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|\-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 5.14,
  avg_d2_causal: 6.60,
  avg_d3_framing: 7.52,
  avg_d4_emotional: 6.53,
  avg_d5_actor: 7.38,
  avg_d6_cui_bono: 8.07,
  story_count: 27,
  region_count: 7,
  top_stories: [
    {
      slug: 'u-s-iran-talks-begin-in-islamabad-while-the-ceasefire-holds-only-shakily',
      headline: 'U.S.-Iran talks begin in Islamabad while the ceasefire holds only shakily',
      pgi: 7.82,
      category: 'geopolitics',
      regions: ['us', 'eu', 'middle_east', 'south_asia', 'east_se_asia']
    },
    {
      slug: 'us-iran-negotiations-continue-under-a-fragile-ceasefire-as-strait-of-hormuz-reopening-remains-central',
      headline: 'US-Iran negotiations continue under a fragile ceasefire as Strait of Hormuz reopening remains central',
      pgi: 7.82,
      category: 'diplomacy',
      regions: ['us', 'eu', 'middle_east', 'south_asia']
    },
    {
      slug: 'u-s-iran-direct-talks-enter-a-fragile-postwar-bargaining-phase',
      headline: 'U.S.-Iran direct talks enter a fragile postwar bargaining phase',
      pgi: 7.8,
      category: 'geopolitics',
      regions: ['us', 'eu', 'middle_east', 'south_asia', 'east_se_asia']
    },
    {
      slug: 'israel-approves-direct-talks-with-lebanon-while-refusing-a-hezbollah-ceasefire',
      headline: 'Israel approves direct talks with Lebanon while refusing a Hezbollah ceasefire',
      pgi: 7.7,
      category: 'diplomacy',
      regions: ['us', 'eu', 'middle_east']
    },
    {
      slug: 'lebanon-enters-direct-talks-but-remains-the-main-fault-line-in-the-ceasefire-map',
      headline: 'Lebanon enters direct talks but remains the main fault line in the ceasefire map',
      pgi: 7.68,
      category: 'conflict',
      regions: ['us', 'eu', 'middle_east']
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
