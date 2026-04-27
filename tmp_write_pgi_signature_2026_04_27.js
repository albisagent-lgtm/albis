const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const content_md = `# PGI Signature Piece — April 27, 2026

**Daily PGI:** 6.45 — **Competing Realities** 🔴  
**Stories analyzed:** 108 | **Regions tracked:** 10

---

## Executive Summary

April 27 closed with a **daily PGI of 6.45**, pushing the system into **Competing Realities** territory. That is a meaningful escalation from the orange-band pattern of recent days. The information environment was not merely showing normal regional shading or selective emphasis. It was producing **rival moral maps** around some of the day’s most consequential stories: humanitarian collapse in Sudan and Chad, ceasefire credibility in Lebanon, sanctions and trade pressure around China and Taiwan, and legal or sovereignty disputes stretching from Syria to Mexico.

The strongest single story was **UN agencies warn more than one million Sudanese refugees in Chad face drastic aid cuts**, which scored **9.20**. Close behind was **NGOs say millions in Sudan are surviving on one meal a day as the food crisis deepens** at **9.17**. Those scores matter because they show that even stories with apparently simple humanitarian facts are no longer landing in a shared way. Regions were not only disagreeing over urgency. They were diverging over **responsibility, political framing, and whether these crises are narrated as structural abandonment, donor fatigue, security spillover, or generic global need**.

The dimensional profile makes the pattern unusually clear. **Cui bono divergence averaged 6.86**, the highest of the six dimensions, followed by **framing at 6.82**, **emotional divergence at 6.76**, and **causal divergence at 6.61**. **Factual divergence, at 6.16, was again the lowest layer**. That means the day was not primarily about wholesale factual collapse. It was about what facts were made to mean: **who is judged responsible, who is portrayed as exposed, and whose interpretation of the crisis becomes the default global story**.

There were four major perception-gap clusters driving the red-tier result.

First, **Sudan-Chad humanitarian coverage** became the day’s most polarising narrative field. African and global coverage often addressed the same emergency, but they did not weight the same actors or stakes. African framing was more likely to foreground lived proximity, regional burden, and the political consequences of abandonment. Global narratives were more likely to package the crisis through multilateral warning language, donor scarcity, or abstract humanitarian escalation.

Second, **Lebanon ceasefire stories showed another trust gap around official de-escalation language**. Both **Hezbollah says the extended US-mediated Lebanon ceasefire is meaningless** and **Israel-Lebanon ceasefire extended by three weeks, but strikes and rocket fire continue** scored **8.17**. The core divergence was not whether violence persisted. It was whether ceasefire language still deserved interpretive authority once events on the ground kept undermining it.

Third, **US-Iran-Pakistan diplomacy sustained a recurring South Asia–US split**. Stories such as **Iran foreign minister returns to Pakistan as Trump says US-Iran contact can continue by phone** and **Trump cancels Pakistan envoy trip as US-Iran talks stall** did not rank at the absolute top, but they repeatedly produced high pairwise gaps. South Asian coverage gave more agency to Pakistan and to regional mediation dynamics. US coverage was more likely to frame the same developments as negotiation management or tactical delay inside a larger Washington-Tehran process.

Fourth, **China-facing pressure stories widened the gap into sanctions, capital, and geopolitical coercion**. **China bans dual-use exports to seven European entities over Taiwan arms sales** and **China plans tighter approval rules for top tech firms taking US capital** pushed East & SE Asia, Europe, and the US into sharper interpretive separation. These were not just policy updates. They were stories about how different regions assign legitimacy to retaliation, strategic autonomy, and economic leverage.

So April 27 was a red-tier day not because everything fragmented, but because enough **high-significance stories** split strongly enough on meaning, blame, and benefit to create multiple competing interpretive realities at once.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | 6.16 | Facts remained more portable than conclusions, but even the factual layer was less shared than on recent orange-tier days. |
| **D2 — Causal** | 6.61 | Regions diverged on whether crises were caused by abandonment, coercion, policy failure, or strategic manoeuvre. |
| **D3 — Framing** | 6.82 | The same story could appear as humanitarian emergency, diplomatic theatre, security management, sovereignty conflict, or strategic signalling. |
| **D4 — Emotional** | 6.76 | Tone divergence was intense: some regions narrated grief, urgency, or betrayal; others kept a procedural or elite-management register. |
| **D5 — Actor Context** | 6.40 | Different actors were centered depending on region: refugees, donors, Pakistan, Washington, Hezbollah, Beijing, or institutional intermediaries. |
| **D6 — Cui Bono** | 6.86 | **Highest dimension.** The sharpest gap was over who gains legitimacy, leverage, insulation, or narrative cover from the way the story is told. |

The ordering matters. **Meaning outran fact.** Once a story crossed regions, the main fracture was not simple event denial. It was whether the event demonstrated humanitarian abandonment, diplomatic hollowness, sovereign resistance, or effective crisis management.

---

## Top Divergent Stories

### 1. **UN agencies warn more than one million Sudanese refugees in Chad face drastic aid cuts** — PGI 9.20
- **Regions covered:** Africa, Global
- **Category:** migration
- **Dimensional signal:** factual 8.7, causal 9.2, framing 9.4, emotional 9.5, actor 9.0, cui bono 9.4
- **What diverged:** Regions broadly recognised the scale of the crisis, but diverged sharply on whether the core story was donor retreat, regional burden, institutional warning, or systemic neglect.
- **Why it matters:** This was the day’s clearest proof that humanitarian stories can now split as hard as battlefield or sanctions stories when burden and responsibility are distributed unequally.

### 2. **NGOs say millions in Sudan are surviving on one meal a day as the food crisis deepens** — PGI 9.17
- **Regions covered:** Africa, Global
- **Category:** food-agriculture
- **Dimensional signal:** factual 8.7, causal 9.2, framing 9.3, emotional 9.5, actor 8.9, cui bono 9.4
- **What diverged:** The split turned on whether the famine dynamic was narrated as a consequence of war and aid failure close to the ground, or as a global hunger warning abstracted into a broader crisis frame.
- **Why it matters:** Together with the Chad refugee story, it created the day’s most powerful humanitarian divergence cluster and helped pull the overall PGI into red territory.

### 3. **Hezbollah says the extended US-mediated Lebanon ceasefire is meaningless** — PGI 8.17
- **Regions covered:** Middle East, Global
- **Category:** conflict
- **Dimensional signal:** factual 7.7, causal 8.2, framing 8.3, emotional 8.5, actor 7.9, cui bono 8.4
- **What diverged:** Regions were not debating whether ceasefire language existed. They were diverging over whether that language retained credibility once low-level violence and distrust remained active.
- **Why it matters:** This is the cleanest example of procedural diplomacy losing persuasive power in one regional lens while retaining partial legitimacy in another.

### 4. **Israel-Lebanon ceasefire extended by three weeks, but strikes and rocket fire continue** — PGI 8.17
- **Regions covered:** Middle East, US
- **Category:** conflict
- **Dimensional signal:** factual 7.7, causal 8.2, framing 8.3, emotional 8.5, actor 7.9, cui bono 8.4
- **What diverged:** The same extension could be narrated as evidence of de-escalatory process or as thin administrative cover over an unstable military reality.
- **Why it matters:** It shows the day’s wider pattern: official continuity did not produce interpretive convergence.

### 5. **China bans dual-use exports to seven European entities over Taiwan arms sales** — PGI 8.15
- **Regions covered:** East & SE Asia, Europe
- **Category:** sanctions
- **Dimensional signal:** factual 7.7, causal 8.2, framing 8.4, emotional 8.3, actor 7.9, cui bono 8.4
- **What diverged:** One region can frame the move as retaliatory overreach; another can frame it as sovereign counter-pressure inside an escalating arms and deterrence contest.
- **Why it matters:** The story captures how sanctions are increasingly read less as neutral policy tools and more as claims about legitimacy and hierarchy.

### 6. **Mexico says US agents killed in crash were not authorised to operate there** — PGI 8.13
- **Regions covered:** Latin America, US
- **Category:** governance
- **Dimensional signal:** factual 7.7, causal 8.2, framing 8.3, emotional 8.3, actor 7.9, cui bono 8.4
- **What diverged:** Latin American framing had stronger incentives to foreground sovereignty, asymmetry, and the opacity of US-linked operations. US framing was more exposed to institutional or security-context interpretation.
- **Why it matters:** It extended the day’s divergence structure beyond war and aid into state legitimacy and cross-border authority.

---

## Regional Pattern Analysis

### **The sharpest recurring divide was South Asia vs US**
Although the single highest pair in the daily table was **Latin America vs Middle East at 8.3**, that occurred on a very narrow sample. The most meaningful recurring split was **South Asia vs US at 8.05 across four stories**, followed by **Middle East vs US at 7.86 across nine stories**. That matters because it shows a structural pattern rather than a one-off spike. The South Asia–US gap clustered around Pakistan-Iran diplomacy, where South Asian coverage gave more weight to regional agency and mediation, while US coverage was more likely to preserve a Washington-centered process frame.

### **Middle East coverage remained the main stress test for ceasefire credibility**
The strongest sustained conflict-related gaps sat around pairings involving the **Middle East**: **Middle East vs US (7.86)**, **Middle East vs South Asia (7.73)**, **Europe vs Middle East (7.43)**, and **Global vs Middle East (7.36)**. Across Lebanon stories, the question was not whether a ceasefire had been extended. It was whether that extension meant anything substantive once strikes and rocket fire continued. Middle Eastern narratives judged the official language against operational reality much more harshly.

### **Africa vs Global drove the humanitarian fracture**
The pair **Africa vs Global averaged 6.91 across fourteen stories**, but that average hides the day’s two most extreme humanitarian divergences, both at **9.3** pairwise intensity. That tells us something important: global coverage and African coverage were often close enough on routine stories, yet they split dramatically when the subject became regional burden, famine, displacement, and aid collapse. In those moments, “global” often functioned as a smoothing lens, while African coverage carried more proximity, urgency, and political specificity.

### **East & SE Asia, Europe, and the US separated over coercion and economic leverage**
**East & SE Asia vs Europe averaged 7.55**, and **East & SE Asia vs US also averaged 7.55**. These gaps were concentrated in sanctions, export controls, and capital-access stories. East & SE Asia had stronger incentives to read them through competitive-state logic and strategic retaliation. European and US narratives more often highlighted rule-setting, defensive policy, or institutional justification. The same moves therefore carried different implied norms.

### **Latin America kept sovereignty and accountability in the frame**
The **Latin America vs US pair averaged 6.84**, with the Mexico crash-authorisation story the clearest example. Latin American framing more readily treated the event as a question of who has the right to operate, narrate, and intervene. US framing had greater structural pull toward procedural explanation. That difference is small in wording but large in legitimacy effect.

---

## Category Structure

The hottest categories by average PGI were **geopolitics (8.12)**, **sanctions (7.63)**, **diplomacy (7.42)**, **legal (7.34)**, **conflict (7.29)**, **migration (7.18)**, and **trade (7.11)**.

- **Humanitarian and migration stories** helped set the day’s emotional ceiling. They made burden, abandonment, and unequal exposure impossible to narrate neutrally.
- **Conflict and diplomacy** ran hot because official de-escalation language was repeatedly tested against events that did not look de-escalated.
- **Sanctions, trade, and geopolitics** stayed elevated because cross-border coercion is now interpreted as a legitimacy struggle rather than a purely technical policy domain.
- **Legal and governance** stories mattered because they translated courts, inquiries, elections, and state authorisation disputes into very different stories of accountability depending on region.
- Lower-intensity categories such as **science (4.06)**, **infrastructure (4.95)**, and **culture (3.71)** were still shareable by comparison. They did not drive the day’s red-tier reading.

This is the profile of a genuine **Competing Realities** day: a broad enough spread of high-PGI stories across humanitarian, conflict, diplomatic, and geopolitical categories that no single frame can comfortably contain the whole day.

---

## Intraday Shape

The day intensified as it progressed:

- **AM:** 5.95 across 32 stories  
- **Midday:** 6.61 across 38 stories  
- **PM:** 7.14 across 38 stories

That progression is important. The morning still looked like a high-orange environment. By midday the field had tipped into red, and by evening the divergence became more systemically entrenched rather than cooling off. In other words, April 27 did not produce one isolated spike. It accumulated competing realities over the course of the day.

---

## What Today’s PGI Means

A **6.45 PGI** means the world did not simply disagree about emphasis. It disagreed about **which reality was primary**.

Was Sudan’s famine-and-displacement emergency mainly a story of institutional warning, or of abandonment visible most sharply from within the region?  
Was Lebanon’s ceasefire an active diplomatic container, or a phrase that no longer matched the lived security picture?  
Were China’s trade and sanctions moves defensive retaliation, coercive escalation, or predictable power politics?  
Was sovereignty in the Mexico crash story the core issue, or merely one contextual layer in a broader security narrative?

Those are not cosmetic differences. They shape trust in institutions, the perceived legitimacy of mediators, and the moral ranking of who is protected versus who is exposed.

---

## Bottom Line

April 27 was a **Competing Realities** day because the strongest stories were not just framed differently — they were embedded inside **different causal and moral worlds**.

The day’s two Sudan-linked humanitarian stories scored **9.20** and **9.17**, showing that even apparently straightforward humanitarian emergencies now produce severe divergence when regions assign responsibility and urgency differently. Lebanon stories reinforced a second major fracture, with the **Middle East** repeatedly refusing to treat ceasefire language as self-validating. Diplomacy around **Iran, Pakistan, and the US** sustained the strongest recurring regional split, **South Asia vs US (8.05)**, while sanctions and capital-control stories widened the gap across **East & SE Asia, Europe, and the US**.

Most importantly, **cui bono (6.86)** and **framing (6.82)** again outran factual divergence (**6.16**). That means April 27 was not fundamentally about facts failing to travel. It was about **trust failing to travel** — and about different regions assigning radically different meaning to who benefits, who bears the cost, and which version of the story gets to count as reality.

That is what **Competing Realities** looked like on April 27, 2026.`;

const piece = {
  date: '2026-04-27',
  daily_pgi: 6.45,
  tier: 'Competing Realities',
  emoji: '🔴',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 6.16,
  avg_d2_causal: 6.61,
  avg_d3_framing: 6.82,
  avg_d4_emotional: 6.76,
  avg_d5_actor: 6.4,
  avg_d6_cui_bono: 6.86,
  story_count: 108,
  region_count: 10,
  methodology_version: '1.0',
  top_stories: [
    {
      slug: 'un-agencies-warn-more-than-one-million-sudanese-refugees-in-chad-face-drastic-aid-cuts',
      headline: 'UN agencies warn more than one million Sudanese refugees in Chad face drastic aid cuts',
      pgi: 9.2,
      category: 'migration',
      regions: ['Africa', 'Global']
    },
    {
      slug: 'ngos-say-millions-in-sudan-are-surviving-on-one-meal-a-day-as-the-food-crisis-deepens',
      headline: 'NGOs say millions in Sudan are surviving on one meal a day as the food crisis deepens',
      pgi: 9.17,
      category: 'food-agriculture',
      regions: ['Africa', 'Global']
    },
    {
      slug: 'hezbollah-says-the-extended-us-mediated-lebanon-ceasefire-is-meaningless',
      headline: 'Hezbollah says the extended US-mediated Lebanon ceasefire is meaningless',
      pgi: 8.17,
      category: 'conflict',
      regions: ['Middle East', 'Global']
    },
    {
      slug: 'israel-lebanon-ceasefire-extended-by-three-weeks-but-strikes-and-rocket-fire-continue',
      headline: 'Israel-Lebanon ceasefire extended by three weeks, but strikes and rocket fire continue',
      pgi: 8.17,
      category: 'conflict',
      regions: ['Middle East', 'US']
    },
    {
      slug: 'china-bans-dual-use-exports-to-seven-european-entities-over-taiwan-arms-sales',
      headline: 'China bans dual-use exports to seven European entities over Taiwan arms sales',
      pgi: 8.15,
      category: 'sanctions',
      regions: ['East & SE Asia', 'Europe']
    },
    {
      slug: 'mexico-says-us-agents-killed-in-crash-were-not-authorised-to-operate-there',
      headline: 'Mexico says US agents killed in crash were not authorised to operate there',
      pgi: 8.13,
      category: 'governance',
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
