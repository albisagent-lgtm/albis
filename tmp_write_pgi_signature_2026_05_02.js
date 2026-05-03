const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const content_md = `# PGI Signature Piece — May 2, 2026

**Daily PGI:** 4.96 — **Diverging Narratives** 🟠  
**Stories analyzed:** 100 | **Regions tracked:** 10

---

## Executive Summary

May 2 closed with a **daily PGI of 4.96**, keeping the system in **Diverging Narratives** territory for a second straight day. The number is almost flat versus May 1, but the structure underneath it changed. Yesterday’s strongest gaps were concentrated around **visibility, access, and migration protection**. Today’s divergence moved back toward **strategic power, alliance strain, and who gets to define whether de-escalation is real**.

The top two stories set the tone. **US-Iran ceasefire remains in place and has been extended into late May** scored **8.25**, and **US will withdraw 5,000 troops from Germany amid a widening Iran-war rift with Europe** scored **8.15**. Both stories sat inside the same fault line: the relationship between Washington’s management of the Iran crisis and Europe’s willingness to accept that framing. The event skeleton travelled. The meaning did not. In US coverage, the emphasis leaned more naturally toward **stabilisation, legal closure, and posture management**. In European and Middle Eastern coverage, the same developments carried stronger undertones of **credibility, coercion, alliance mistrust, and unresolved regional risk**.

That pattern shows up cleanly in the dimensional averages. **Framing divergence averaged 5.17** and **cui bono 5.15**, the two highest layers of the day, followed by **causal divergence at 5.06**, **actor context at 5.04**, and **emotional divergence at 5.03**. **Factual divergence was lowest at 4.33**. So May 2 was not a day of dramatic factual collapse. It was a day when regions often recognised the same event, but attached different political meaning to who had restored order, who remained exposed, and who benefited from the official interpretation.

The geography of divergence matters as much as the headline number. The daily table’s single highest pair was **East & SE Asia vs Pacific at 7.3**, but that rested on a lone climate story about **Pacific tuna economies** and should be read as a narrow spike rather than the day’s core structural split. The more meaningful recurring gaps were **Europe vs US (6.86 across 11 stories)**, **Africa vs US (7.02 across 4 stories)**, **Middle East vs US (6.18 across 12 stories)**, and **East & SE Asia vs US (6.58 across 5 stories)**. In other words, the system spent the day repeatedly testing how far US-centered interpretations would travel before other regions recentered the same story around **regional burden, alliance asymmetry, sanctions reach, media conditions, climate vulnerability, or sovereignty risk**.

A second important feature of May 2 is that it **cooled as the day went on**. The **AM scan averaged 5.46**, the **midday scan 4.92**, and the **PM scan 4.42**. That is not the shape of a system-wide escalation day. It is the shape of a day that opened with sharper interpretive fractures — especially around Iran, Taiwan, global media freedom, climate coordination, and sanctions architecture — and then broadened into more mixed but less uniformly intense coverage by evening.

At the tributary level, **PGI-IW led at 6.10**, followed by **PGI-CL at 5.34**, **PGI-GP at 4.92**, **PGI-EC at 4.87**, and **PGI-HE at 4.66**. That combination fits the day exactly. Information-war and media-legitimacy themes remained hot, climate narratives kept producing meaningful regional distance, and geopolitics stayed elevated without tipping the whole field into red-tier competition.

So the real May 2 read is this: the world was still sharing plenty of facts, but it was less willing to share the same **story about what those facts proved**.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | 4.33 | Facts remained the most portable layer. Most regions broadly agreed on what happened before separating over significance. |
| **D2 — Causal** | 5.06 | Regions differed on what was actually driving events: de-escalation, legal positioning, alliance pressure, sovereignty defence, or systemic neglect. |
| **D3 — Framing** | 5.17 | **Highest dimension.** The sharpest splits came from how stories were packaged: ceasefire stability versus fragile cover, alliance management versus transatlantic rupture, climate cooperation versus unequal exposure. |
| **D4 — Emotional** | 5.03 | Tone divergence was present but not dominant: some regions stayed procedural, while others leaned into urgency, vulnerability, or distrust. |
| **D5 — Actor Context** | 5.04 | Different regions centered different protagonists — Washington, European allies, Gulf states, Pacific economies, journalists, or local populations bearing the downstream cost. |
| **D6 — Cui Bono** | 5.15 | Very close to framing. The recurring question was who gains leverage, legitimacy, or narrative cover from the way the story is being told. |

The ordering is the clearest clue to the day. On May 2, **meaning outran fact**. The world was not mainly arguing over whether events occurred. It was arguing over **whose interpretation should become the default one**.

---

## Top Divergent Stories

### 1. **US-Iran ceasefire remains in place and has been extended into late May** — PGI 8.25
- **Regions covered:** US, Middle East, Europe
- **Dimensional signal:** factual 7.3, causal 8.3, framing 8.7, emotional 8.3, actor 8.3, cui bono 8.6
- **What diverged:** US coverage had more room to narrate the extension as stabilisation and proof of restored control. European and Middle Eastern coverage carried stronger questions about durability, motive, and whether the ceasefire meaningfully changed underlying risk.
- **Why it matters:** This was the day’s clearest example of a diplomatic headline doing different work in different regions: reassurance in one frame, strategic suspense in another.

### 2. **US will withdraw 5,000 troops from Germany amid a widening Iran-war rift with Europe** — PGI 8.15
- **Regions covered:** US, Europe, Middle East
- **Dimensional signal:** factual 7.3, causal 8.3, framing 8.3, emotional 8.1, actor 8.3, cui bono 8.6
- **What diverged:** In the US frame, troop movement can sit inside burden-sharing and posture recalibration. In Europe, the same move lands more directly as alliance stress and coercive signalling. In the Middle East, it is inseparable from wider questions about the credibility of Western security architecture.
- **Why it matters:** It turned an Iran-war disagreement into a visible NATO story, widening the gap beyond the Gulf itself.

### 3. **U.S. says Iran truce ended hostilities for War Powers deadline purposes** — PGI 7.37
- **Regions covered:** US, Middle East, Global
- **Dimensional signal:** factual 7.2, causal 7.4, framing 7.4, emotional 7.4, actor 7.4, cui bono 7.4
- **What diverged:** The US framing naturally emphasised legal closure and executive authority. Elsewhere, the same claim was easier to read as a procedural interpretation that may outrun conditions on the ground.
- **Why it matters:** It showed that legal language itself can become a perception gap when one region treats it as settlement and another treats it as positioning.

### 4. **A major 2026 diplomatic meeting may proceed without Taiwan** — PGI 7.30
- **Regions covered:** East & SE Asia, US, Global
- **Dimensional signal:** factual 6.8, causal 7.4, framing 7.4, emotional 7.4, actor 7.4, cui bono 7.4
- **What diverged:** In East & SE Asia, exclusion carries direct implications for deterrence, recognition, and regional order. In more global framing, the same development can be narrated as a procedural diplomatic constraint rather than a live sovereignty signal.
- **Why it matters:** It reinforced that representation stories are rarely procedural in the region most exposed to their consequences.

### 5. **Hong Kong updates U.N. Somalia sanctions rules** — PGI 7.30
- **Regions covered:** Africa, East & SE Asia, Global
- **Dimensional signal:** factual 6.8, causal 7.4, framing 7.4, emotional 7.4, actor 7.4, cui bono 7.4
- **What diverged:** One frame sees technical implementation of multilateral sanctions. Another sees the real distribution of enforcement power across regions that do not bear the same costs from instability.
- **Why it matters:** It is a classic case of a bureaucratic headline that looks small until regional distance reveals who experiences it as mere compliance and who experiences it as lived governance.

### 6. **Researchers report CAR-T gains in stiff-person syndrome** — PGI 7.30
- **Regions covered:** US, Europe, Global
- **Dimensional signal:** factual 6.8, causal 7.4, framing 7.4, emotional 7.4, actor 7.4, cui bono 7.4
- **What diverged:** Regions broadly shared the breakthrough itself, but differed over whether the story is mainly scientific promise, access inequality, cost pressure, or a sign of next-generation biotech power.
- **Why it matters:** It shows that perception gaps are not limited to war and diplomacy; even medical breakthroughs split once questions of who benefits come into view.

---

## Regional Pattern Analysis

### **Europe vs US was the most consequential recurring divide**
The day’s strongest repeatable split was **Europe vs US at 6.86 across 11 stories**. The biggest examples were the Iran ceasefire extension (**8.4 pair PGI**) and the troop-withdrawal story (**8.3**). But the divide was not confined to hard security. It also appeared in **CAR-T treatment**, **global climate cooperation**, and some media-freedom stories. That breadth matters. It suggests Europe was not merely disagreeing with the US on one conflict file; it was repeatedly shifting the center of gravity away from a US managerial read.

### **Middle East vs US kept testing whether de-escalation language was believable**
**Middle East vs US averaged 6.18 across 12 stories**, with the highest readings again tied to the Iran ceasefire extension (**8.4**), troop withdrawal (**8.3**), the War Powers truce claim (**7.5**), and even **FIFA confirming Iran’s World Cup place** (**7.5**). The common thread was trust. US framing could more easily treat diplomatic and institutional continuity as meaningful stabilisation. Middle Eastern coverage had stronger incentives to ask whether those signals actually changed lived security conditions.

### **Africa vs US ran high when stories moved from principle to burden**
The **Africa vs US pair averaged 7.02 across four stories**, one of the day’s strongest recurring gaps. The clearest examples were **UN climate chief warns cooperation is essential against heating and fossil-fuel cost chaos** (**7.4 pair PGI**), **World Press Freedom Day events in Lusaka spotlight worsening global media conditions** (**7.3**), and **World Press Freedom Index hits its lowest point in a quarter-century** (**7.2**). In US and global language these can read as principle-driven institutional stories. In African coverage, they sit closer to operational reality: climate vulnerability, governance stress, and media conditions as live constraints rather than abstract norms.

### **East & SE Asia generated two distinct kinds of gap**
The daily table’s single most divergent pair, **East & SE Asia vs Pacific at 7.3**, came from **Climate threat to Pacific tuna economies remains a strategic warning**. That is analytically useful but narrow. The broader structural pattern was **East & SE Asia vs US at 6.58 across five stories**, especially around **Taiwan exclusion**, **Chinese tech firms rushing for Huawei AI chips**, and a fresh public warning on China’s “hack-for-hire” ecosystem. The difference was not only geopolitical. It was about whether these stories are read first as regional strategic adaptation or as evidence of systemic threat.

### **Latin America vs US kept sovereignty in the frame**
The **Latin America vs US pair averaged 6.75 across two stories**, both tied to the Sinaloa governor confrontation. **US charges against Sinaloa Governor Rubén Rocha** produced a **7.3** pair score, while **Mexico demands evidence after U.S. links Sinaloa governor to cartels** scored **6.2**. US coverage naturally leaned toward law-enforcement and cartel-state accountability. Latin American framing had stronger incentives to foreground evidentiary standards, bilateral pressure, and the sovereignty implications of how accusations travel.

---

## Storyfield and Tributary Signals

The hottest story category with real volume was **diplomacy**, averaging **5.88 across 9 stories**. **Security** followed at **5.65 across 11 stories**, then **climate at 5.34**, **migration at 5.29**, **conflict at 5.13**, and **legal at 5.09**. A few categories posted higher averages on a single story — such as **sanctions** at **7.30** and **trade** at **6.20** — but the broad structure of the day came from recurring diplomatic and security interpretation, not from isolated outliers.

That aligns with the tributary pattern:

- **PGI-IW:** 6.10  
- **PGI-CL:** 5.34  
- **PGI-GP:** 4.92  
- **PGI-EC:** 4.87  
- **PGI-HE:** 4.66  

The high **information-war** reading fits the prominence of media-freedom, legitimacy, and official-language disputes. The elevated **climate** tributary reflects how strongly stories about cooperation, Pacific economies, and unequal exposure still split across regions. Geopolitics and economics remained important, but they did not dominate the field as cleanly as they do on red-tier days.

---

## Intraday Shape

May 2 cooled steadily rather than escalating:

- **AM:** 5.46 across 38 stories  
- **Midday:** 4.92 across 30 stories  
- **PM:** 4.42 across 32 stories

That tells us the day’s strongest fractures arrived early. The morning carried the heavier mix of **Iran truce interpretation, Taiwan diplomacy, climate cooperation, press-freedom stress, and sanctions architecture**. By evening, the storyfield was still divergent, but the average intensity had softened. So this was not a day where competing narratives accumulated into system-wide rupture. It was a day where sharper divides were established early and then partially diffused by a broader, more moderate mix of later coverage.

---

## Bottom Line

May 2 was a **Diverging Narratives** day because regions kept sharing the same headlines without granting those headlines the same conclusion.

The top Iran-related stories showed the clearest split: the US could more readily narrate ceasefire extension, troop repositioning, and War Powers language as evidence of regained control, while Europe and the Middle East treated the same moves as less settled and more strategically loaded. East & SE Asia pushed a second kind of divergence around **Taiwan, sanctions administration, cyber risk, and climate-linked regional vulnerability**. Africa generated another high-value contrast by pulling climate and press-freedom stories out of the realm of principle and back into the realm of burden. Latin America kept sovereignty and bilateral pressure alive in the Sinaloa coverage.

That is why **framing (5.17)** and **cui bono (5.15)** again sat above **factual divergence (4.33)**. May 2 was not a day when facts stopped travelling. It was a day when **trust in the official meaning of those facts** travelled badly.

So the core signal is straightforward: the global information environment remains comparatively shareable at the level of event recognition, but once the question becomes **who is safer, who is stronger, who is credible, and who gets to define what “stability” means**, the perception gap widens fast.`;

const piece = {
  date: '2026-05-02',
  daily_pgi: 4.96,
  tier: 'Diverging Narratives',
  emoji: '🟠',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 4.33,
  avg_d2_causal: 5.06,
  avg_d3_framing: 5.17,
  avg_d4_emotional: 5.03,
  avg_d5_actor: 5.04,
  avg_d6_cui_bono: 5.15,
  story_count: 100,
  region_count: 10,
  methodology_version: '1.0',
  top_stories: [
    {
      slug: 'us-iran-ceasefire-remains-in-place-and-has-been-extended-into-late-may',
      headline: 'US-Iran ceasefire remains in place and has been extended into late May',
      pgi: 8.25,
      category: 'diplomacy',
      regions: ['US', 'Middle East', 'Europe']
    },
    {
      slug: 'us-will-withdraw-5-000-troops-from-germany-amid-a-widening-iran-war-rift-with-europe',
      headline: 'US will withdraw 5,000 troops from Germany amid a widening Iran-war rift with Europe',
      pgi: 8.15,
      category: 'security',
      regions: ['US', 'Europe', 'Middle East']
    },
    {
      slug: 'u-s-says-iran-truce-ended-hostilities-for-war-powers-deadline-purposes',
      headline: 'U.S. says Iran truce ended hostilities for War Powers deadline purposes',
      pgi: 7.37,
      category: 'diplomacy',
      regions: ['US', 'Middle East', 'Global']
    },
    {
      slug: 'a-major-2026-diplomatic-meeting-may-proceed-without-taiwan',
      headline: 'A major 2026 diplomatic meeting may proceed without Taiwan',
      pgi: 7.3,
      category: 'diplomacy',
      regions: ['East & SE Asia', 'US', 'Global']
    },
    {
      slug: 'hong-kong-updates-u-n-somalia-sanctions-rules',
      headline: 'Hong Kong updates U.N. Somalia sanctions rules',
      pgi: 7.3,
      category: 'sanctions',
      regions: ['Africa', 'East & SE Asia', 'Global']
    },
    {
      slug: 'researchers-report-car-t-gains-in-stiff-person-syndrome',
      headline: 'Researchers report CAR-T gains in stiff-person syndrome',
      pgi: 7.3,
      category: 'science',
      regions: ['US', 'Europe', 'Global']
    }
  ]
};

async function main() {
  const { data, error } = await supabase
    .from('pgi_signature_pieces')
    .upsert([piece], { onConflict: 'date' })
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, date: data.date, daily_pgi: data.daily_pgi, tier: data.tier, word_count: piece.word_count }, null, 2));
}

main();
