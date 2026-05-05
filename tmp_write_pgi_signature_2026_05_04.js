const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const content_md = `# PGI Signature Piece — May 4, 2026

**Daily PGI:** 5.21 — **Diverging Narratives** 🟠  
**Stories analyzed:** 111 | **Regions tracked:** 11

---

## Executive Summary

May 4 closed with a **daily PGI of 5.21**, up modestly from **5.01** on May 3 and firmly inside **Diverging Narratives** territory. This was not a red-band day of total informational rupture. It was a day in which the global information field stayed recognisably connected at the factual level, while repeatedly splitting once stories turned to **leverage, mediation, legitimacy, and who pays the downstream costs**.

The dimensional profile is clear. **Factual divergence was again the lowest layer at 4.66**, while **framing (5.45)** and **cui bono (5.44)** were the two highest dimensions, followed closely by **causal (5.37)**, **actor context (5.35)**, and **emotional divergence (5.34)**. In practical terms, regions were often talking about the same events, but they were not agreeing on what those events meant. The fault line sat in interpretation: whether a proposal was a peace opening or a coercive bargain, whether maritime action was security enforcement or rights suppression, whether sanctions were accountability or geopolitical signalling, and whether environmental collapse was an abstract global warning or a direct food-and-livelihood emergency.

The day’s strongest story was **US-Iran ceasefire extended as Pakistan-mediated talks widen to Hormuz, sanctions and reconstruction**, which scored **8.22**. The second-highest story, **Iran sends new peace framework to Washington via Pakistan mediators**, scored **8.12**. Together they formed the core narrative engine of the day. The story was not simply “ceasefire holds” versus “ceasefire weakens.” Different regions were assigning different weight to Pakistan’s role, to sanctions relief, to freedom of navigation through Hormuz, and to whether diplomacy was stabilising the region or merely postponing another round of force.

What made May 4 especially interesting is that the Iran file was not the only driver. A very different outlier — **Migratory freshwater fish populations have fallen about 81% since 1970, global report says** at **8.03** — reveals the day’s broader pattern. Even a scientific story with a strong shared fact base diverged sharply once regions mapped it onto their own stakes: biodiversity loss, food security, river livelihoods, infrastructure pressure, and long-run development burdens. That is an important signal. On May 4, the perception gap was not confined to war and diplomacy. It extended into how regions translated slow crisis into lived consequence.

Around those top stories sat three major narrative clusters.

First, **Iran-Hormuz diplomacy** drove the strongest recurring pair splits, especially **South Asia vs US (7.35 across four stories)** and **Middle East vs US (7.26 across eleven stories)**. South Asian coverage had more reason to center Pakistan’s agency and regional economic exposure. US coverage was more likely to frame developments through deal viability, deterrence, and Washington’s acceptable terms. Middle Eastern coverage remained more sensitive to credibility, sovereignty, and the possibility that shipping policy or military signaling could shatter the ceasefire.

Second, a **Gaza flotilla / detention / aid-access cluster** kept **Europe and the Middle East** sharply separated. Stories such as **Israeli forces intercept Gaza-bound aid flotilla boats in international waters and route vessels to Crete**, **Reporters Without Borders condemns the detention of three journalists aboard the Gaza flotilla**, and **Detained flotilla activists appear in Israeli court and allege torture in custody** all sat around **7.3** and repeatedly produced a **Europe ↔ Middle East average of 7.15 across ten stories**. The split was not over whether events happened. It was over whether the dominant frame should be maritime enforcement, legal procedure, humanitarian access, press freedom, or state violence.

Third, **resource and food-security stories** widened the map beyond classic hard-security topics. The **WFP warning that Middle East escalation could push acute hunger to record levels in 2026** produced the single highest pair score in the daily aggregate — **Africa vs Middle East at 7.5** — even though it was based on one story. Meanwhile, **Violence over fish stocks is escalating into a ‘sea war’ off Gambia** and the freshwater-fish collapse story helped pull Africa, Latin America, South Asia, and Global coverage apart over whether these were conservation headlines, food-system threats, or symptoms of extractive pressure on already exposed communities.

So May 4 was a classic orange-tier day: not one overwhelming breakdown, but a broad pattern in which **shared facts kept colliding with unshared meanings**.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | 4.66 | The most stable layer. Regions generally recognised the same core events even when they took them in different directions. |
| **D2 — Causal** | 5.37 | Divergence rose once blame and drivers were assigned: coercion, mediation, market pressure, conflict spillover, or institutional failure. |
| **D3 — Framing** | 5.45 | **Highest dimension.** The same story could become peace process, managed escalation, press-freedom dispute, sovereignty test, or food-security warning. |
| **D4 — Emotional** | 5.34 | Tone varied between urgency, alarm, procedural language, and strategic coolness. |
| **D5 — Actor Context** | 5.35 | Regions centered different protagonists: Pakistan, Washington, Tehran, detained activists, WFP, fishers, or sanctioning institutions. |
| **D6 — Cui Bono** | 5.44 | Nearly tied for highest. The sharpest split was over who gains leverage, protection, legitimacy, or narrative cover from how stories are told. |

The ordering matters. May 4 was **not** primarily a day of factual breakdown. It was a day of **interpretive divergence**. Once stories moved from event description to consequence and advantage, the gap widened quickly.

---

## Top Divergent Stories

### 1. **US-Iran ceasefire extended as Pakistan-mediated talks widen to Hormuz, sanctions and reconstruction** — PGI 8.22
- **Regions covered:** Middle East, South Asia, US, Global
- **Category:** diplomacy
- **Dimensional signal:** factual 7.3, causal 8.3, framing 8.5, emotional 8.3, actor 8.3, cui bono 8.6
- **What diverged:** Regions agreed that the negotiation expanded beyond a simple ceasefire. They diverged over whether that widening meant real de-escalation or a more complicated bargain bundling shipping access, sanctions relief, and strategic leverage.
- **Why it mattered:** This was the day’s clearest proof that peace-process stories now function as **multi-theater legitimacy contests**, not just diplomatic updates.

### 2. **Iran sends new peace framework to Washington via Pakistan mediators** — PGI 8.12
- **Regions covered:** Middle East, South Asia, US, Global
- **Category:** diplomacy
- **Dimensional signal:** factual 7.3, causal 8.1, framing 8.6, emotional 8.3, actor 8.1, cui bono 8.3
- **What diverged:** The central split was over the mediator itself. South Asian coverage had stronger incentives to highlight Pakistan’s agency and regional centrality. US framing more naturally pulled the story back toward Washington’s decision calculus.
- **Why it mattered:** It reinforced the structural **South Asia–US** divide that shaped the whole day.

### 3. **Migratory freshwater fish populations have fallen about 81% since 1970, global report says** — PGI 8.03
- **Regions covered:** Global, Africa, South Asia, Latin America
- **Category:** science
- **Dimensional signal:** factual 7.3, causal 8.0, framing 8.4, emotional 8.2, actor 8.1, cui bono 8.2
- **What diverged:** The science itself was portable. The disagreement came in what the story was *for*: biodiversity alarm, food security, development risk, river governance, or livelihood collapse.
- **Why it mattered:** It showed that even non-war stories now produce strong PGI readings when consequences land unevenly across regions.

### 4. **Israeli forces intercept Gaza-bound aid flotilla boats in international waters and route vessels to Crete** — PGI 7.30
- **Regions covered:** Middle East, Europe
- **Category:** conflict
- **What diverged:** European narratives had more pull toward maritime enforcement, diplomacy, and legal process. Middle Eastern narratives had stronger incentives to foreground blockade politics, access denial, and coercive control.
- **Why it mattered:** It anchored one of the day’s clearest recurring regional gaps.

### 5. **Palestinian factions reject Gaza aid plan tied to weapons surrender** — PGI 7.30
- **Regions covered:** Middle East, Europe, Global
- **Category:** governance
- **What diverged:** One region could frame the proposal as a conditional governance mechanism; another could read it as political coercion disguised as humanitarian design.
- **Why it mattered:** It fused aid, legitimacy, and disarmament into one contested narrative field.

### 6. **Taiwan is sidelined while a Trump-Xi summit approaches** — PGI 7.30
- **Regions covered:** East & SE Asia, US, Global
- **Category:** geopolitics
- **What diverged:** US coverage could cast the summit as strategic management. East and Southeast Asian coverage had more reason to treat exclusion itself as the story.
- **Why it mattered:** It sustained the durable **East & SE Asia ↔ US** gap around security decisions made over the region without the region fully present.

### 7. **WFP warns Middle East escalation could push acute hunger to record levels in 2026** — PGI 7.30
- **Regions covered:** Global, Middle East, Africa
- **Category:** food-agriculture
- **What diverged:** One lens emphasized the macro humanitarian warning; another emphasized how conflict spillover and market shocks will hit already exposed populations first.
- **Why it mattered:** It generated the single highest pair score in the daily aggregate, **Africa ↔ Middle East at 7.5**.

### 8. **The UN sanctions the brother of the RSF chief and three Colombians accused of recruiting fighters for Sudan** — PGI 7.30
- **Regions covered:** Africa, Latin America, Global
- **Category:** sanctions
- **What diverged:** The story could be framed as international accountability, transnational mercenary disruption, or another example of conflict externalisation.
- **Why it mattered:** It linked Sudan’s war to broader cross-border networks and widened the perception gap into Latin America.

### 9. **US plan to guide ships through the Strait of Hormuz draws Iranian warning of ceasefire violation** — PGI 7.30
- **Regions covered:** Middle East, US, Global
- **Category:** security
- **What diverged:** The same navigation move could read as stabilising deterrence or as provocative encroachment that risks breaking the truce.
- **Why it mattered:** It kept the Hormuz file anchored in both diplomacy and military signaling at once.

### 10. **Reporters Without Borders condemns the detention of three journalists aboard the Gaza flotilla** — PGI 7.30
- **Regions covered:** Middle East, Europe, Global
- **Category:** media
- **What diverged:** Some regions treated this primarily as a press-freedom issue; others folded it into the broader confrontation over blockade, maritime power, and wartime control.
- **Why it mattered:** It showed how media-rights stories themselves now inherit the full geometry of a conflict narrative.

---

## Regional Pattern Analysis

### **South Asia vs US was the sharpest recurring divide**
The most important structural split on May 4 was **South Asia ↔ US at 7.35 across four stories**. That pairing was driven mainly by the two Pakistan-mediated Iran stories and reinforced by tech-security coverage. The key issue was agency. South Asian coverage had more reason to position Pakistan as an active diplomatic intermediary with direct regional stakes. US coverage more often recenters the decision on Washington’s acceptability threshold and threat posture. That creates a familiar asymmetry: one region sees mediation as regional statecraft, the other sees it as one input into US strategic choice.

### **Middle East vs US remained a broad stress line**
At **7.26 across eleven stories**, **Middle East ↔ US** was not just a single-file divergence. It stretched across ceasefire language, Hormuz escort plans, warning signals from Tehran, and the wider Iran-war handling debate. US framing leaned more toward deterrence management and negotiation terms. Middle Eastern framing was more sensitive to whether those same moves looked credible, escalatory, or structurally tilted toward force.

### **Europe vs Middle East split most clearly on Gaza-linked stories**
The **Europe ↔ Middle East pair averaged 7.15 across ten stories**, and the sample tells the story plainly: flotilla interception, journalist detention, detainee abuse allegations, and aid tied to weapons surrender. Europe had more procedural and legal language available. Middle Eastern narratives more often judged those procedures against lived coercion and access denial. The result was not disagreement about the events themselves, but disagreement over whether institutional handling should be granted moral authority.

### **East & SE Asia vs US kept widening around Taiwan and regional security**
At **6.83 across nine stories**, **East & SE Asia ↔ US** remained a stable divergence zone. The best example was **Taiwan is sidelined while a Trump-Xi summit approaches**, but the pattern also appeared in South China Sea and China-tech stories. US narratives often read these as components of strategic balancing. Regional narratives more readily feel the consequences of exclusion, ambiguity, and great-power bargaining done over local security space.

### **Africa’s strongest gaps came through consequence stories**
The single highest one-off pair in the daily table was **Africa ↔ Middle East at 7.5**, driven by the WFP hunger warning. **Africa ↔ Europe** also averaged **6.70 across five stories**, with examples including the Gambia fish-stock conflict, press-freedom stories, and Mali security developments. What unifies them is not one ideology. It is consequence. African coverage repeatedly carried stronger incentives to center burden, extraction, food exposure, and on-the-ground instability rather than treating them as secondary effects.

---

## Category Structure

The hottest categories by average PGI were:

- **Geopolitics:** 7.24  
- **Media:** 6.44  
- **Sanctions:** 6.40  
- **Tech-AI:** 5.95  
- **Diplomacy:** 5.89  
- **Economic-flows:** 5.61  
- **Food-agriculture:** 5.55  
- **Security:** 5.55  

This mix is revealing.

- **Diplomacy and security** remained elevated because the Iran ceasefire was never just a ceasefire; it was a dispute over shipping, sanctions, reconstruction, and mediator legitimacy.
- **Media and legal-adjacent Gaza stories** ran hot because they asked whether detention, access, and reporting should be interpreted as security management or suppression.
- **Sanctions** stayed elevated because they are rarely neutral in regional perception: the Kabila story, Sudan recruitment sanctions, and China-facing measures all carry strong questions about selective enforcement and strategic signaling.
- **Tech-AI** appearing this high matters. Stories about Huawei chips, Pentagon AI expansion, and cybersecurity concerns are increasingly read through national strategy rather than innovation alone.
- **Food-agriculture and science** mattered because ecological stress no longer lands as a “soft” story when different regions understand it as livelihood risk, hunger risk, or export pressure.

The category mix confirms that May 4’s orange-tier reading came from **breadth**, not just one geopolitical flashpoint.

---

## Intraday Shape

The day rose, then stabilised at an elevated level:

- **AM:** 5.04 across 31 stories  
- **Midday:** 5.49 across 37 stories  
- **PM:** 5.25 across 43 stories

This pattern matters. Divergence peaked in the middle of the day as the Iran package widened and the freshwater-collapse story entered the mix, then eased slightly without normalising. That suggests May 4 was not driven by a single isolated spike. It accumulated narrative tension and then held it.

---

## What Today’s PGI Means

A **5.21 PGI** means the world remained partly connected, but not comfortably so.

Regions could recognise that Iran and the US were still talking. They could recognise that Gaza-linked flotilla confrontations escalated into detention and legal dispute. They could recognise that fish populations are collapsing and that WFP is warning about hunger. But recognition did not produce convergence. The real fight was over interpretation:

- Is Pakistan’s role evidence of meaningful regional diplomacy, or just a side channel to Washington’s real decision?  
- Is Hormuz escort policy stabilising, or itself a ceasefire risk?  
- Is flotilla enforcement legal process, or an extension of coercive control?  
- Is biodiversity collapse an environmental headline, or a food-and-livelihood emergency already distributing costs unevenly?  
- Are sanctions accountability tools, or selective instruments that clarify who holds power to punish and who absorbs fallout?

Those are not cosmetic differences. They shape how legitimacy travels across regions.

---

## Bottom Line

May 4 was a **Diverging Narratives** day because shared facts repeatedly broke apart at the level of **meaning, leverage, and burden**.

The strongest stories were not simply the loudest ones. They were the ones that forced regions to decide **who gets to define the stakes**. The Iran ceasefire-and-Hormuz package drove the day’s clearest recurring splits, especially **South Asia vs US** and **Middle East vs US**. Gaza flotilla and detention stories sustained a sharp **Europe vs Middle East** divide over whether institutional handling deserved trust. Resource and food-security stories showed that even science and humanitarian warnings now diverge hard when regions map them onto unequal exposure.

Most importantly, **framing (5.45)** and **cui bono (5.44)** again outran **factual divergence (4.66)**. That tells us May 4 was not a day of reality collapse. It was a day of **reality contest**: a world still looking at many of the same events, but repeatedly disagreeing over who benefits, who is protected, and which interpretation should count as common sense.

That is what **Diverging Narratives** looked like on May 4, 2026.`;

const piece = {
  date: '2026-05-04',
  daily_pgi: 5.21,
  tier: 'Diverging Narratives',
  emoji: '🟠',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 4.66,
  avg_d2_causal: 5.37,
  avg_d3_framing: 5.45,
  avg_d4_emotional: 5.34,
  avg_d5_actor: 5.35,
  avg_d6_cui_bono: 5.44,
  story_count: 111,
  region_count: 11,
  methodology_version: '1.0',
  top_stories: [
    {
      slug: 'us-iran-ceasefire-extended-as-pakistan-mediated-talks-widen-to-hormuz-sanctions-and-reconstruction',
      headline: 'US-Iran ceasefire extended as Pakistan-mediated talks widen to Hormuz, sanctions and reconstruction',
      pgi: 8.22,
      category: 'diplomacy',
      regions: ['Middle East', 'South Asia', 'US', 'Global']
    },
    {
      slug: 'iran-sends-new-peace-framework-to-washington-via-pakistan-mediators',
      headline: 'Iran sends new peace framework to Washington via Pakistan mediators',
      pgi: 8.12,
      category: 'diplomacy',
      regions: ['Middle East', 'South Asia', 'US', 'Global']
    },
    {
      slug: 'migratory-freshwater-fish-populations-have-fallen-about-81-since-1970-global-report-says',
      headline: 'Migratory freshwater fish populations have fallen about 81% since 1970, global report says',
      pgi: 8.03,
      category: 'science',
      regions: ['Global', 'Africa', 'South Asia', 'Latin America']
    },
    {
      slug: 'israeli-forces-intercept-gaza-bound-aid-flotilla-boats-in-international-waters-and-route-vessels-to-crete',
      headline: 'Israeli forces intercept Gaza-bound aid flotilla boats in international waters and route vessels to Crete',
      pgi: 7.3,
      category: 'conflict',
      regions: ['Middle East', 'Europe']
    },
    {
      slug: 'palestinian-factions-reject-gaza-aid-plan-tied-to-weapons-surrender',
      headline: 'Palestinian factions reject Gaza aid plan tied to weapons surrender',
      pgi: 7.3,
      category: 'governance',
      regions: ['Middle East', 'Europe', 'Global']
    },
    {
      slug: 'taiwan-is-sidelined-while-a-trump-xi-summit-approaches',
      headline: 'Taiwan is sidelined while a Trump-Xi summit approaches',
      pgi: 7.3,
      category: 'geopolitics',
      regions: ['East & SE Asia', 'US', 'Global']
    },
    {
      slug: 'wfp-warns-middle-east-escalation-could-push-acute-hunger-to-record-levels-in-2026',
      headline: 'WFP warns Middle East escalation could push acute hunger to record levels in 2026',
      pgi: 7.3,
      category: 'food-agriculture',
      regions: ['Global', 'Middle East', 'Africa']
    },
    {
      slug: 'the-un-sanctions-the-brother-of-the-rsf-chief-and-three-colombians-accused-of-recruiting-fighters-for-sudan',
      headline: 'The UN sanctions the brother of the RSF chief and three Colombians accused of recruiting fighters for Sudan',
      pgi: 7.3,
      category: 'sanctions',
      regions: ['Africa', 'Latin America', 'Global']
    },
    {
      slug: 'us-plan-to-guide-ships-through-the-strait-of-hormuz-draws-iranian-warning-of-ceasefire-violation',
      headline: 'US plan to guide ships through the Strait of Hormuz draws Iranian warning of ceasefire violation',
      pgi: 7.3,
      category: 'security',
      regions: ['Middle East', 'US', 'Global']
    },
    {
      slug: 'reporters-without-borders-condemns-the-detention-of-three-journalists-aboard-the-gaza-flotilla',
      headline: 'Reporters Without Borders condemns the detention of three journalists aboard the Gaza flotilla',
      pgi: 7.3,
      category: 'media',
      regions: ['Middle East', 'Europe', 'Global']
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
