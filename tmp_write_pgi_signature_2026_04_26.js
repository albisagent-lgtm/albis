const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');
const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const content_md = `# PGI Signature Piece — April 26, 2026

**Daily PGI:** 5.63 — **Diverging Narratives** 🟠  
**Stories analyzed:** 123 | **Regions tracked:** 12

---

## Executive Summary

April 26 closed with a **daily PGI of 5.63**, keeping the global information environment in **Diverging Narratives** territory rather than pushing into full red-zone fragmentation. That distinction matters. The world was not split across everything. It was split across a concentrated band of politically loaded stories where legitimacy, mediation, sovereignty, and moral framing mattered more than bare factual disagreement.

The day’s main fault line ran through **Iran diplomacy, Lebanon ceasefire credibility, and migration-enforcement politics**. The single highest-scoring story — **Iranian foreign minister visits Pakistan for diplomacy amid ceasefire uncertainty** — landed at **8.17**. Several stories then clustered right behind it at the same high-divergence level: **ICE custody deaths and US immigration enforcement debate**, **Hezbollah saying ceasefire language is meaningless while low-level fighting continues**, and **a shaky Iran-US ceasefire framework remaining unresolved despite earlier extension**. In other words, the day’s strongest fractures all sat around one underlying question: **when official de-escalation or institutional management language appears, do regions treat it as substantive change, or as rhetoric wrapped around unresolved coercive reality?**

The dimensional profile makes the structure of the gap unusually clear. **Cui bono divergence averaged 6.07**, the highest of the six dimensions, narrowly ahead of **framing at 6.04** and **emotional divergence at 5.97**. **Factual divergence stayed lowest at 5.37**. So this was not mainly a day of regions denying each other’s facts. It was a day of regions drawing different conclusions about **who benefits, whose pain is foregrounded, and whether institutional language deserves trust**.

That pattern was visible across three story clusters.

First, **Iran-Pakistan-US diplomatic narratives** drove the top of the table. South Asian coverage gave Pakistan greater agency as a consequential intermediary. Middle Eastern coverage judged diplomacy against unresolved coercive structure and ceasefire fragility. US framing was more likely to preserve room for strategic process language even when the substantive breakthrough remained unclear. That is why **South Asia vs US averaged 8.3**, the day’s strongest regional pair.

Second, **Lebanon and Gaza stories exposed a credibility gap around ceasefire and governance language**. Formal extensions, votes, and mediated arrangements existed in the information field, but they did not produce narrative convergence. For some regions, these were cautious signs of political process. For others, they were thin procedural overlays on top of a security reality that had not materially stabilised.

Third, **migration and sovereignty stories widened the gap beyond the Middle East**. The story on **ICE custody deaths** scoring **8.17**, and the story on **Mexico saying reported CIA-linked Americans killed in a crash were not authorised to operate there** at **8.13**, show the same PGI logic outside war coverage. Latin American narratives more readily foregrounded state overreach, asymmetry, and accountability. US narratives were more exposed to domestic institutional framing, enforcement logic, or damage-control interpretation.

So April 26 was not a day of universal narrative splintering. It was a day where a relatively moderate overall average concealed a **dense high-PGI cluster around legitimacy**: diplomacy without trust, ceasefires without confidence, governance without shared interpretation, and enforcement without shared moral framing.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | 5.37 | Core events still travelled reasonably well across regions. Disagreement intensified after the factual layer rather than before it. |
| **D2 — Causal** | 5.82 | Regions diverged on whether diplomacy was lowering risk, delaying confrontation, or masking unresolved power structures. |
| **D3 — Framing** | 6.04 | The same events were cast as breakthrough, theatre, pressure-management, sovereignty contest, or institutional failure depending on region. |
| **D4 — Emotional** | 5.97 | Tone mattered: some regions narrated exposure, grief, or distrust; others maintained managerial or procedural distance. |
| **D5 — Actor Context** | 5.61 | Different regions elevated different protagonists — Pakistan, Washington, Hezbollah, Gazan voters, immigration authorities, or regional publics. |
| **D6 — Cui Bono** | 6.07 | **Highest dimension.** The sharpest gap was over who gained leverage, legitimacy, or protection from the day’s official narratives. |

The ordering is revealing. **Facts remained more portable than meaning.** Once events crossed regional boundaries, the strongest divergence emerged in how those facts were interpreted: who was shaping outcomes, who was paying the cost, and whether official process language was doing explanatory work or simply reputational work.

---

## Top Divergent Stories

### 1. **Iranian foreign minister visits Pakistan for diplomacy amid ceasefire uncertainty** — PGI 8.17
- **Regions covered:** Middle East, South Asia, Global
- **Category:** diplomacy
- **Dimensional signal:** factual 7.6, causal 8.1, framing 8.4, emotional 8.5, actor 8.0, cui bono 8.4
- **What diverged:** Regions broadly agreed on the diplomatic movement itself. The split came over what Pakistan’s role signified and whether the visit represented a meaningful de-escalatory channel or a fragile manoeuvre inside an unresolved conflict architecture.
- **Why it matters:** South Asian coverage gave Pakistan clear diplomatic authorship. Middle Eastern framing was more likely to test the story against ceasefire uncertainty and coercive backdrop. Global coverage compressed the event into a more generic diplomacy narrative.

### 2. **ICE custody deaths add pressure to US immigration enforcement debate** — PGI 8.17
- **Regions covered:** US, Latin America
- **Category:** migration
- **Dimensional signal:** factual 7.7, causal 8.2, framing 8.3, emotional 8.5, actor 7.9, cui bono 8.4
- **What diverged:** The same deaths could be narrated as an accountability crisis, a systemic human-cost story, or as pressure inside a domestic enforcement-policy debate.
- **Why it matters:** Latin American interpretation more readily foregrounded vulnerability, state violence, and asymmetry. US framing was more likely to absorb the event into institutional debate over enforcement practice and political responsibility.

### 3. **Hezbollah says ceasefire is meaningless as low-level fighting continues in south Lebanon** — PGI 8.17
- **Regions covered:** Middle East, Global
- **Category:** conflict
- **Dimensional signal:** factual 7.7, causal 8.2, framing 8.3, emotional 8.5, actor 7.9, cui bono 8.4
- **What diverged:** Regions were not really disputing that low-level violence continued. The fracture was over whether ceasefire language retained any credibility once operational reality kept contradicting it.
- **Why it matters:** This is the day’s clearest illustration of procedural language failing to stabilise interpretation. For Middle Eastern audiences, continued friction weakened the meaning of the ceasefire itself. Global framing was more able to preserve the ceasefire as a still-functioning political container.

### 4. **Shaky Iran-US ceasefire framework remains unresolved despite earlier extension** — PGI 8.17
- **Regions covered:** US, Middle East, South Asia, Global
- **Category:** conflict
- **Dimensional signal:** factual 7.6, causal 8.1, framing 8.4, emotional 8.5, actor 8.0, cui bono 8.4
- **What diverged:** The extension existed, but regions split over whether that counted as progress. For some, extension itself signalled diplomatic traction. For others, unresolved structure was the real story.
- **Why it matters:** This story concentrated the day’s dominant perception gap: does formal continuity equal substantive stability?

### 5. **Lebanon-Israel ceasefire extended by three weeks after US-hosted talks** — PGI 8.13
- **Regions covered:** Middle East, US, Global
- **Category:** diplomacy
- **Dimensional signal:** factual 7.6, causal 8.1, framing 8.3, emotional 8.5, actor 7.9, cui bono 8.4
- **What diverged:** Extension language could be read as a success for mediation, or as a temporary administrative layer over a still-contested reality.
- **Why it matters:** US-hosted diplomacy gained visibility in some regional framings, while Middle Eastern narratives were more likely to withhold trust until violence meaningfully receded.

### 6. **Mexico says two reported CIA-linked Americans killed in a crash were not authorised to operate there** — PGI 8.13
- **Regions covered:** Latin America, US
- **Category:** security
- **Dimensional signal:** factual 7.7, causal 8.2, framing 8.3, emotional 8.3, actor 7.9, cui bono 8.4
- **What diverged:** The event could be framed as a sensitive security incident, a sovereignty breach, or a story about the opacity of US-linked operations abroad.
- **Why it matters:** Latin American coverage had stronger incentives to foreground authorisation, sovereignty, and asymmetry. US interpretation had greater structural pull toward security-context framing and institutional ambiguity.

---

## Regional Pattern Analysis

### **South Asia vs US was the day’s sharpest recurring divide**
The strongest regional pair average was **South Asia vs US at 8.3**. That is analytically important because it did not emerge from one random story. It came from the diplomatic cluster around Iran, Pakistan, and ceasefire uncertainty. South Asian narratives assigned more weight to **regional mediation, Pakistan’s agency, and the political meaning of engagement**. US narratives were more willing to maintain a process-oriented frame in which diplomacy remains alive even while substantive outcomes stay unresolved. The gap was not just over events. It was over **who gets to count as a maker of events**.

### **Middle East remained the interpretive anchor on ceasefire credibility**
The next major pair was **Middle East vs US at 7.37**, with **Middle East vs South Asia at 7.59** and **Global vs Middle East at 7.13** also elevated. Across the Lebanon and broader ceasefire stories, Middle Eastern coverage repeatedly judged official de-escalation language against lived operational conditions. That produces a more sceptical threshold: ceasefire language is not self-validating. It has to prove itself. This is why the same formal extension can read as a breakthrough in one frame and as rhetorical overstatement in another.

### **Latin America widened the day beyond conflict into sovereignty and enforcement**
The pair **Latin America vs US averaged 7.11**, and **Europe vs Latin America reached 8.25** on a smaller sample. That matters because it shows the day’s perception gaps were not confined to the Middle East. Latin American stories on immigration, covert-authority claims, and border or operational legitimacy were more likely to center **power imbalance, accountability, and sovereignty**. US and European narratives, depending on the story, more often nested those same events inside institutional debate or strategic framing.

### **Global coverage often acted as a smoothing layer**
Global coverage appeared in many of the day’s highest-ranking stories, but it often functioned as a portability mechanism. It made stories travel, yet sometimes at the cost of regional texture. The pair averages — **Global vs US at 6.08**, **Global vs Latin America at 6.15**, **Global vs Middle East at 7.13** — suggest that global narratives frequently compress locally specific legitimacy struggles into broader headline form. Again, this is not necessarily inaccurate. But it changes what audiences feel is most salient.

### **Europe and East & SE Asia showed focused but not dominant divergence**
**East & SE Asia vs Europe averaged 6.28**, while **Europe vs Middle East averaged 6.27**. These were not the day’s defining gaps, but they matter because they clustered around trade restrictions, diplomatic positioning, and strategic credibility. East & SE Asia tended to metabolise these stories through exposure, leverage, and state-competition logic. European narratives more often carried institutional or rules-based emphasis. The difference is subtle, but it shifts how audiences evaluate intent and consequence.

---

## Category Structure

By average PGI, the hottest categories were **migration (7.61)**, **diplomacy (7.11)**, **social (6.89)**, **security (6.41)**, **conflict (6.38)**, and **governance (6.38)**. That mix tells us a lot about the shape of April 26.

- **Migration** led the category table because it forces moral ranking into the open: who is protected, who is exposed, and whether institutions are seen as lawful guardians or coercive systems.
- **Diplomacy** ran hot because ceasefire and mediation stories carried shared facts but unstable legitimacy. Regions were not disagreeing that talks happened; they were disagreeing on whether talks had earned interpretive trust.
- **Conflict** stayed elevated because ongoing low-level violence kept undercutting the symbolic power of official de-escalation language.
- **Governance** and **security** mattered because they translated procedural events — votes, authorisations, institutional actions — into different narratives of sovereignty, control, and credibility.
- By contrast, categories such as **climate (3.6)**, **economic (4.08)**, **food-agriculture (4.13)**, and **energy (4.58)** stayed much lower. Those areas still showed divergence, but they did not drive the day’s overall perception gap.

This is the profile of a classic orange-tier day: **not universal fragmentation, but concentrated and consequential disagreement in the most legitimacy-heavy stories**.

---

## What Today’s PGI Means

A **5.63 PGI** means the global information field stayed partially shared, but the interpretation layered over it kept pulling apart. Most audiences could access the same broad events. What they could not access in the same way was the **meaning hierarchy** built around those events.

Was Pakistan a consequential mediator, or a supporting actor inside a bigger Washington-Tehran drama?  
Was a ceasefire extension evidence of progress, or proof that diplomacy had become a substitute for resolution?  
Were custody deaths and unauthorised operations signs of systemic abuse and asymmetry, or episodes to be contained within domestic institutional discourse?  
Was governance language stabilising reality, or merely stabilising appearances?

Those are not cosmetic differences. They shape how publics assign legitimacy, how much trust they place in official mediation, and whether they understand institutions as protective, performative, or coercive.

---

## Bottom Line

April 26 was a **Diverging Narratives** day because shared events continued to circulate, but high-salience stories about diplomacy, ceasefires, migration, and sovereignty generated sharply different moral and strategic readings.

The strongest single pair was **South Asia vs US (8.3)**, reflecting a deep split over diplomatic agency and the meaning of mediation. **Middle Eastern coverage** remained the decisive interpretive counterweight on ceasefire stories, repeatedly refusing to grant full legitimacy to de-escalation language that operational reality had not yet validated. **Latin American coverage** broadened the day’s gap structure into migration and security narratives, where asymmetry and sovereignty were foregrounded more sharply than in US framing.

The day’s most important analytical fact is that **cui bono (6.07)** and **framing (6.04)** outran factual divergence (**5.37**). That means April 26 was not primarily about contested facts. It was about **contested trust** — who benefits from telling the story this way, who gets centered by official language, and what audiences are being asked to accept as real before reality has fully earned it.

That is what **Diverging Narratives** looked like on April 26, 2026.`;

const piece = {
  date: '2026-04-26',
  daily_pgi: 5.63,
  tier: 'Diverging Narratives',
  emoji: '🟠',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 5.37,
  avg_d2_causal: 5.82,
  avg_d3_framing: 6.04,
  avg_d4_emotional: 5.97,
  avg_d5_actor: 5.61,
  avg_d6_cui_bono: 6.07,
  story_count: 123,
  region_count: 12,
  methodology_version: '1.0',
  top_stories: [
    {
      slug: 'iranian-foreign-minister-visits-pakistan-for-diplomacy-amid-ceasefire-uncertainty',
      headline: 'Iranian foreign minister visits Pakistan for diplomacy amid ceasefire uncertainty',
      pgi: 8.17,
      category: 'diplomacy',
      regions: ['Middle East', 'South Asia', 'Global']
    },
    {
      slug: 'ice-custody-deaths-add-pressure-to-us-immigration-enforcement-debate',
      headline: 'ICE custody deaths add pressure to US immigration enforcement debate',
      pgi: 8.17,
      category: 'migration',
      regions: ['US', 'Latin America']
    },
    {
      slug: 'hezbollah-says-ceasefire-is-meaningless-as-low-level-fighting-continues-in-south-lebanon',
      headline: 'Hezbollah says ceasefire is meaningless as low-level fighting continues in south Lebanon',
      pgi: 8.17,
      category: 'conflict',
      regions: ['Middle East', 'Global']
    },
    {
      slug: 'shaky-iran-us-ceasefire-framework-remains-unresolved-despite-earlier-extension',
      headline: 'Shaky Iran-US ceasefire framework remains unresolved despite earlier extension',
      pgi: 8.17,
      category: 'conflict',
      regions: ['US', 'Middle East', 'South Asia', 'Global']
    },
    {
      slug: 'lebanon-israel-ceasefire-extended-by-three-weeks-after-us-hosted-talks',
      headline: 'Lebanon-Israel ceasefire extended by three weeks after US-hosted talks',
      pgi: 8.13,
      category: 'diplomacy',
      regions: ['Middle East', 'US', 'Global']
    },
    {
      slug: 'mexico-says-two-reported-cia-linked-americans-killed-in-a-crash-were-not-authorised-to-operate-there',
      headline: 'Mexico says two reported CIA-linked Americans killed in a crash were not authorised to operate there',
      pgi: 8.13,
      category: 'security',
      regions: ['Latin America', 'US']
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
