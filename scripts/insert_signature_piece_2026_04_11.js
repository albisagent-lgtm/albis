const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const content_md = `# PGI Signature Piece — April 11, 2026

**Daily PGI:** 7.24 — **Competing Realities** 🔴  
**Stories analyzed:** 22 | **Regions tracked:** 7

---

## Executive Summary

April 11 was another day when the global information field did not fracture over whether events happened. It fractured over **whether diplomatic motion deserved to be read as real de-escalation at all**.

Across the day's biggest stories, there was broad factual agreement that the U.S.-Iran ceasefire formally held, that talks opened in Pakistan, that Lebanon remained a contested edge case, and that Russia announced an Orthodox Easter pause in Ukraine. But the numerical pattern shows that factual agreement was the weakest source of divergence. **Factual spread averaged just 5.46**, while **cui bono surged to 8.52**, framing hit **7.81**, and actor context reached **7.72**.

That is the signature of a world arguing less about events than about **meaning, trust, and distribution of advantage**. One bloc read ceasefire language as an implementation problem: Can it be verified? Will shipping normalise? Are negotiations holding? Another read the same events as a legitimacy problem: Who is still excluded? Which fronts remain exposed? Whose security is being counted, and whose is being deferred behind diplomatic language?

The strongest cluster ran through the Lebanon carve-out dispute, the fragile U.S.-Iran track, and repeated tests of whether operational normality was actually returning in the Gulf. US and European coverage leaned toward architecture, enforceability, and staged progress. Middle Eastern coverage was far more sensitive to selective scope, unresolved coercion, and the possibility that the label of ceasefire was outrunning conditions on the ground. South Asian coverage consistently granted more weight to Pakistan's mediating role. East and Southeast Asian coverage stayed focused on practical proof, especially whether trade and shipping routes were normalising rather than merely being described as stable.

That combination pushed the weighted daily PGI to **7.24**, comfortably inside **Competing Realities**. The day was not driven by isolated outrage. It was driven by repeated disagreement over a single underlying question:

**Is the region moving toward peace, or simply entering a better-branded phase of managed instability?**

---

## Dimensional Breakdown

| Dimension | Avg Score | What it shows |
|-----------|-----------|---------------|
| **D1 — Factual** | 5.46 | Moderate factual spread. Most regions recognised the same headline events, but still weighted evidence differently. |
| **D2 — Causal** | 6.93 | Strong divergence over what current talks and pauses will actually produce next. |
| **D3 — Framing** | 7.81 | A sharp split between de-escalation framing, coercion framing, and systems-management framing. |
| **D4 — Emotional** | 6.98 | Tone ranged from guarded optimism to deep suspicion and conditional distrust. |
| **D5 — Actor Context** | 7.72 | Regions centred different protagonists: mediators, states, civilians, shipping systems, or military leverage. |
| **D6 — Cui Bono** | 8.52 | **Highest dimension.** The core disagreement was over who gains room, legitimacy, time, or strategic advantage from the current narrative. |

The pattern is unmistakable. April 11 was primarily a day of **incentive divergence**.

---

## Top Divergent Stories

### 1. **Lebanon coverage dispute tests what the Iran ceasefire actually covers** — PGI 8.43
- **Regions covered:** US, Europe, Middle East
- **Why it diverged:** This was the clearest scope dispute in the dataset. Western coverage often treated Lebanon as a definitional or implementation edge case inside a wider ceasefire structure. Middle Eastern coverage was more likely to treat that very carve-out as the signal that the structure remained politically selective.
- **Signal:** Cui bono hit **10.0**, actor context **8.9**, and framing **9.0**. The fight was not over facts. It was over whose security the ceasefire was actually built to stabilise.

### 2. **U.S.-Iran ceasefire holds formally, but talks face last-minute strain** — PGI 7.87
- **Regions covered:** US, Europe, Middle East, South Asia, East & Southeast Asia
- **Why it diverged:** Most regions accepted the formal holding pattern. The split came over whether that formal stability should be read as progress, tactical pause, or simply delayed rupture.
- **Signal:** The story scored **9.2 on cui bono** and **8.4 on framing**. The central question was whether diplomatic continuity meant real reduction of risk, or only temporary redistribution of it.

### 3. **Gaza remains in ceasefire without humanitarian or political resolution** — PGI 7.80
- **Regions covered:** Middle East, Europe, US
- **Why it diverged:** This story widened the gap between procedural readings of ceasefire and lived readings of unresolved reality. Coverage differed sharply on whether absence of renewed escalation should be treated as meaningful stability when humanitarian and political fundamentals remained unchanged.
- **Signal:** Emotional divergence rose to **8.3**, actor context to **8.7**, and cui bono to **8.8**. One narrative saw reduced temperature; another saw suspended crisis.

### 4. **U.S.-Iran talks open in Pakistan under a fragile ceasefire that has not normalised the region** — PGI 7.75
- **Regions covered:** US, Europe, Middle East, South Asia, East & Southeast Asia
- **Why it diverged:** South Asian coverage gave Pakistan visible diplomatic agency. Western coverage more often treated the talks through process and fragility. Middle Eastern framing remained alert to the gap between talks opening and conditions actually improving.
- **Signal:** The divergence turned on who the main actor is: mediator, superpower, regional stakeholder, or exposed population.

### 5. **Russia announces Orthodox Easter ceasefire and Ukraine signals reciprocity** — PGI 7.45
- **Regions covered:** US, Europe, East & Southeast Asia
- **Why it diverged:** The fact of the announcement was broadly shared. The disagreement centred on motive: symbolic opening, tactical repositioning, propaganda move, or narrow operational pause.
- **Signal:** Once again, cui bono outpaced factual disagreement. Trust, not occurrence, drove the score.

---

## Regional Patterns

### **Middle East: ceasefire language was tested against exclusion, not just compliance**
Middle Eastern coverage consistently resisted taking headline de-escalation at face value. The dominant question was not simply whether a ceasefire exists, but whether it is **evenly real across fronts**. That is why the Lebanon dispute produced the day's highest score. In this lens, selective coverage scope is not a minor drafting issue. It is the evidence.

### **United States and Europe: systems logic and verification remained the default frame**
US and European narratives were not naïve, but they were more likely to organise the day around implementation, enforcement, sequencing, and strategic durability. That tends to produce a procedural vocabulary: talks, openings, compliance, verification, restoration. It lowers factual chaos, but it can widen the perception gap when other regions are asking a more immediate legitimacy question.

### **South Asia: mediation mattered as a real source of agency**
South Asian coverage stood out by making Pakistan more central to the story architecture. In Western accounts, mediation often appeared as a channel. In South Asian framing, it appeared closer to authorship. That distinction matters because it changes the answer to who is shaping events rather than merely reacting to them.

### **East and Southeast Asia: reality was measured through operational normalisation**
East and Southeast Asian coverage, especially around Gulf instability, repeatedly treated shipping and regional flow as the hard test of whether peace language had substance. That lens is less interested in diplomatic branding and more interested in proof. If trade routes are only partially normalised, then the ceasefire remains only partially real.

### **Africa and Latin America: thinner direct presence, stronger downstream positioning**
Africa and Latin America appeared less often in the top divergence cluster, and that matters. Their lighter presence suggests that on a diplomacy-heavy day, these regions entered the narrative more through consequence than authorship. That absence is not neutral. It shows how global crisis interpretation can still be led elsewhere even when downstream costs are widely shared.

---

## Structural Signal of the Day

The category structure reinforces the same conclusion:

- **Conflict** was the most divergent category at **7.72**
- **Geopolitics** followed at **7.42**
- **Humanitarian** stories stayed elevated at **7.10**
- Even lower-scoring economic and market stories still carried the same interpretive divide: not whether stress exists, but who bears it and who gets strategic breathing room

The scan-by-scan pattern was also remarkably stable:

- **AM:** 7.26
- **Midday:** 7.13
- **PM:** 7.28

That consistency matters. April 11 was not a single spike produced by one anomalous headline. The divergence persisted throughout the day because the same fault line kept reappearing in slightly different forms.

The most divided region pair was **Middle East vs United States (8.28)**, followed by **East & Southeast Asia vs South Asia (7.83)** and **South Asia vs United States (7.80)**. In other words, the sharpest gaps emerged between regions disagreeing about **scope, agency, and proof**.

---

## What to Watch Next

- **Lebanon scope language:** If ceasefire rhetoric continues while exceptions remain materially active, the framing gap will widen again.
- **Hormuz normalisation:** Shipping recovery is still the cleanest reality check on whether diplomacy is changing behaviour rather than merely language.
- **Pakistan's mediator role:** If talks keep running through Pakistani channels, South Asian and Western narratives may diverge further on where strategic credit belongs.
- **Humanitarian persistence under nominal ceasefire:** Gaza and related stories will keep testing whether procedural calm is being mistaken for substantive resolution.

---

## Bottom Line

April 11 shows a world that can still agree on the headline while disagreeing profoundly on the substance.

That is why **cui bono** led every dimension. The sharpest split was over who benefits from current diplomacy, who gains time, who gains legitimacy, and who remains exposed while the vocabulary of de-escalation circulates. Western coverage mostly asked whether implementation was holding. Middle Eastern coverage asked whether inclusion was genuine. South Asian coverage asked who was actively brokering outcomes. East and Southeast Asian coverage asked whether practical normality was returning at all.

Those are not small editorial differences. They are competing definitions of what counts as peace.

That is why April 11 lands at **PGI 7.24: Competing Realities**. The global media field was not confused about what happened. It was divided over **what the same events are worth believing**.`;

const piece = {
  date: '2026-04-11',
  daily_pgi: 7.24,
  tier: 'Competing Realities',
  emoji: '🔴',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|\-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 5.46,
  avg_d2_causal: 6.93,
  avg_d3_framing: 7.81,
  avg_d4_emotional: 6.98,
  avg_d5_actor: 7.72,
  avg_d6_cui_bono: 8.52,
  story_count: 22,
  region_count: 7,
  top_stories: [
    {
      slug: 'lebanon-coverage-dispute-tests-what-the-iran-ceasefire-actually-covers',
      headline: 'Lebanon coverage dispute tests what the Iran ceasefire actually covers',
      pgi: 8.43,
      category: 'conflict',
      regions: ['us', 'eu', 'middle_east']
    },
    {
      slug: 'us-iran-ceasefire-holds-formally-but-talks-face-last-minute-strain',
      headline: 'U.S.-Iran ceasefire holds formally, but talks face last-minute strain',
      pgi: 7.87,
      category: 'conflict',
      regions: ['us', 'eu', 'middle_east', 'south_asia', 'east_se_asia']
    },
    {
      slug: 'gaza-remains-in-ceasefire-without-humanitarian-or-political-resolution',
      headline: 'Gaza remains in ceasefire without humanitarian or political resolution',
      pgi: 7.80,
      category: 'humanitarian',
      regions: ['middle_east', 'eu', 'us']
    },
    {
      slug: 'u-s-iran-talks-open-in-pakistan-under-a-fragile-ceasefire-that-has-not-normalised-the-region',
      headline: 'U.S.-Iran talks open in Pakistan under a fragile ceasefire that has not normalised the region',
      pgi: 7.75,
      category: 'geopolitics',
      regions: ['us', 'eu', 'middle_east', 'south_asia', 'east_se_asia']
    },
    {
      slug: 'russia-announces-orthodox-easter-ceasefire-and-ukraine-signals-reciprocity',
      headline: 'Russia announces Orthodox Easter ceasefire and Ukraine signals reciprocity',
      pgi: 7.45,
      category: 'conflict',
      regions: ['us', 'eu', 'east_se_asia']
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
