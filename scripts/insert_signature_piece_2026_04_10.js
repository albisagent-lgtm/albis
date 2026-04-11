const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const content_md = `# PGI Signature Piece — April 10, 2026

**Daily PGI:** 7.03 — **Competing Realities** 🔴  
**Stories analyzed:** 16 | **Regions tracked:** 9

---

## Executive Summary

April 10 was not a day of factual chaos. It was a day of **interpretive fracture**.

Across the highest-scoring stories, regions broadly agreed that ceasefires, negotiations, and partial reopenings were being announced. The gap opened around the next question: **are these real de-escalation steps, tactical pauses, or rhetorical cover for leverage that is still fully intact?** That is why the strongest dimensional signal today is not factual divergence, which stayed relatively low at **5.44**, but **cui bono divergence at 8.10**, followed by **framing at 7.60** and **actor context at 7.46**.

In plain terms: the world saw the same headlines, but disagreed sharply on who was actually gaining time, legitimacy, or strategic room from them.

The dominant cluster sat around the U.S.-Iran ceasefire architecture, the Lebanon carve-out dispute, and the operational reality in Hormuz. US and European coverage leaned toward verification, market restoration, and enforceability. Middle Eastern coverage was more sensitive to scope, sovereignty, exclusion, and whether force was continuing under diplomatic language. South Asian coverage repeatedly elevated mediation and regional agency, especially Pakistan's role. East and Southeast Asian business-oriented coverage treated shipping normalisation as the real test of whether the diplomatic story had substance.

That combination pushed today's score to **7.03**, just over the threshold into **Competing Realities**. The key insight is simple: today's divergence did not come from people seeing different events. It came from people assigning those events **different meanings, different beneficiaries, and different thresholds for believing that peace is real**.

---

## Dimensional Breakdown

| Dimension | Avg Score | What it shows |
|-----------|-----------|---------------|
| **D1 — Factual** | 5.44 | Moderate factual spread. Core events were broadly shared, but evidence priorities still differed. |
| **D2 — Causal** | 6.68 | Regions diverged on what would actually follow from today's announcements. |
| **D3 — Framing** | 7.60 | Strong split between de-escalation language, coercion language, and market language. |
| **D4 — Emotional** | 6.88 | Tone varied from guarded optimism to distrust and active suspicion. |
| **D5 — Actor Context** | 7.46 | Different regions centered different protagonists: mediators, states, civilians, or enforcement systems. |
| **D6 — Cui Bono** | 8.10 | **Highest dimension.** The sharpest disagreement was over who benefits from the ceasefire narrative and who remains exposed. |

The order matters. Today's global media field was not primarily split over facts. It was split over **incentives**.

---

## Top Divergent Stories

### 1. **Israel-Lebanon front complicates the U.S.-Iran ceasefire with a disputed carve-out** — PGI 8.15
- **Regions covered:** US, Europe, Middle East
- **Why it diverged:** This was the clearest example of a scope battle. US and European coverage often treated Lebanon as a distinct enforcement question inside a wider ceasefire environment. Middle Eastern coverage was far less willing to separate theaters so neatly, reading the carve-out itself as a signal about whose security counts and whose does not.
- **Signal:** Actor context (**8.8**) and cui bono (**9.1**) were the story. The fight was over legitimacy, not just geography.

### 2. **Dispute grows over whether Lebanon is covered by the wider U.S.-Iran ceasefire** — PGI 8.07
- **Regions covered:** US, Middle East
- **Why it diverged:** The disagreement was nearly all interpretive. One lens treated the ceasefire terms as something to clarify through official architecture. The other treated them as something that could already be exposing political bad faith.
- **Signal:** Framing (**8.6**) and emotional tone (**8.1**) show that this was not a technical disagreement. It was a trust disagreement.

### 3. **U.S.-Iran ceasefire enters implementation test as Hormuz reopens only partially** — PGI 7.57
- **Regions covered:** US, Europe, Middle East, East/Southeast Asia, South Asia
- **Why it diverged:** Western coverage looked to verification and shipping recovery. Middle Eastern coverage looked to sovereignty and real scope. South Asian coverage foregrounded Pakistan's mediation role. East and Southeast Asian business coverage treated vessel flow as the concrete test of truth.
- **Signal:** This is today's core pattern in one story: same ceasefire, different proof standard.

### 4. **Putin announces a two-day Orthodox Easter ceasefire in Ukraine** — PGI 7.42
- **Regions covered:** US, Europe, Asia-Pacific
- **Why it diverged:** Most regions accepted that the announcement happened. The split came over motive: genuine pause, tactical repositioning, propaganda, or symbolic gesture.
- **Signal:** Again, cui bono (**8.2**) ran above factual divergence (**5.8**). The issue was credibility, not occurrence.

### 5. **Israel authorises direct negotiations with Lebanon while strikes continue** — PGI 7.37
- **Regions covered:** US, Europe, Middle East
- **Why it diverged:** Some coverage treated negotiation as a meaningful diplomatic opening. Other coverage treated it as diplomacy running alongside continued coercion, and therefore not a clean opening at all.
- **Signal:** The coexistence of talks and strikes widened the gap between process-based and lived-experience readings of the same event.

---

## Regional Patterns

### **Middle East: Scope, sovereignty, and exclusion were central**
Middle Eastern coverage repeatedly resisted clean diplomatic packaging. Where Western coverage often asked whether a ceasefire was holding procedurally, Middle Eastern framing asked a harder question: **holding for whom?** That is why the Lebanon carve-out stories scored so high. The region was less interested in headline de-escalation than in whether the architecture was selectively protecting some fronts while leaving others exposed.

### **United States and Europe: Verification and systems logic stayed dominant**
US and European coverage was not blind to risk. But it repeatedly filtered events through enforceability, maritime normalisation, sanctions conditionality, and strategic credibility. That produces more procedural language and less existential language. The result is a perception gap in which one bloc reads today's stories as tests of implementation, while another reads them as tests of sincerity.

### **South Asia: Mediation and regional agency mattered more than in Western narratives**
South Asian coverage stood out for granting real weight to Pakistan's mediation role and to the wider regional diplomatic architecture. In Western coverage, Pakistan often appears as a supporting channel. In South Asian framing, it is closer to an active shaper of outcomes. That difference matters because it changes who the story is fundamentally *about*.

### **East and Southeast Asia: The shipping test overrode the diplomatic headline**
In East and Southeast Asian coverage, especially around Hormuz, the practical indicator was not rhetoric but traffic. If ships are not moving normally, then the ceasefire is not yet fully real in economic terms. This produced a distinct but highly coherent lens: less invested in symbolic declarations, more invested in restored flow.

### **Africa and Latin America: Present but thinner, mostly through downstream stress**
Africa and Latin America appeared less often in today's top cluster, but when they did, the emphasis tilted toward downstream vulnerability: humanitarian strain, growth downgrades, and exposure to global shocks generated elsewhere. The relative thinness of direct presence is itself a signal. On a day dominated by ceasefire architecture, these regions show up more through consequence than authorship.

---

## Structural Signal of the Day

Today's dataset is smaller than the 40-plus-story days earlier in the week, but that actually sharpens the signal. The concentration is unmistakable:

- **Conflict** was the highest-divergence category at **7.66**.
- **Current events** followed at **7.47**.
- **Geopolitics** remained elevated at **6.88**.
- Even when stories moved into shipping and growth, the strongest split still came from **who benefits, who remains vulnerable, and what counts as proof**.

That last point is crucial. The daily PGI crossed into Competing Realities not because every story was maximally polarized, but because the major stories all revolved around the same unresolved narrative fault line:

**Is today's de-escalation real, partial, tactical, selective, or cosmetic?**

Different regions answered that question in structurally different ways.

---

## What to Watch Next

- **Lebanon carve-out language:** If fighting continues while ceasefire rhetoric holds elsewhere, today's framing gap will widen fast.
- **Hormuz traffic restoration:** Shipping volume is the cleanest external reality check on whether diplomacy is changing behavior.
- **Sanctions relief versus symbolic diplomacy:** Middle Eastern coverage is already signaling that words without material policy change will not close the gap.
- **Mediator visibility:** If Pakistan's role grows, South Asian and Western narratives may diverge even further on who deserves strategic credit.

---

## Bottom Line

April 10 shows a world willing to report the same diplomatic headlines but not willing to grant them the same meaning.

That is why **cui bono** led every dimension. The sharpest disagreement was over who gains legitimacy, who gets breathing room, and who remains exposed while the language of de-escalation circulates. Western coverage mostly asked whether implementation is credible. Middle Eastern coverage more often asked whether inclusion is genuine. South Asian coverage asked who is actually brokering outcomes. East and Southeast Asian coverage asked whether ships are really moving.

Put together, those are not minor editorial differences. They are competing definitions of what peace looks like.

That is why April 10 lands at **PGI 7.03: Competing Realities**.`;

const piece = {
  date: '2026-04-10',
  daily_pgi: 7.03,
  tier: 'Competing Realities',
  emoji: '🔴',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|\-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 5.44,
  avg_d2_causal: 6.68,
  avg_d3_framing: 7.60,
  avg_d4_emotional: 6.88,
  avg_d5_actor: 7.46,
  avg_d6_cui_bono: 8.10,
  story_count: 16,
  region_count: 9,
  top_stories: [
    {
      slug: 'israel-lebanon-front-complicates-the-u-s-iran-ceasefire-with-a-disputed-carve-out',
      headline: 'Israel-Lebanon front complicates the U.S.-Iran ceasefire with a disputed carve-out',
      pgi: 8.15,
      category: 'conflict',
      regions: ['us', 'middle_east', 'eu']
    },
    {
      slug: 'dispute-grows-over-whether-lebanon-is-covered-by-the-wider-u-s-iran-ceasefire',
      headline: 'Dispute grows over whether Lebanon is covered by the wider U.S.-Iran ceasefire',
      pgi: 8.07,
      category: 'current-events',
      regions: ['us', 'me']
    },
    {
      slug: 'us-iran-ceasefire-enters-implementation-test-as-hormuz-reopens-only-partially',
      headline: 'U.S.-Iran ceasefire enters implementation test as Hormuz reopens only partially',
      pgi: 7.57,
      category: 'conflict',
      regions: ['us', 'eu', 'middle_east', 'east_se_asia', 'south_asia']
    },
    {
      slug: 'putin-announces-a-two-day-orthodox-easter-ceasefire-in-ukraine',
      headline: 'Putin announces a two-day Orthodox Easter ceasefire in Ukraine',
      pgi: 7.42,
      category: 'current-events',
      regions: ['us', 'eu', 'ap']
    },
    {
      slug: 'israel-authorises-direct-negotiations-with-lebanon-while-strikes-continue',
      headline: 'Israel authorises direct negotiations with Lebanon while strikes continue',
      pgi: 7.37,
      category: 'current-events',
      regions: ['us', 'eu', 'me']
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
