const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const content_md = `# PGI Signature Piece — May 5, 2026

**Daily PGI:** 5.22 — **Diverging Narratives** 🟠  
**Stories analyzed:** 91 | **Regions tracked:** 12

---

## Executive Summary

May 5 closed at **5.22**, almost unchanged from **5.21** the day before. That flat headline is slightly deceptive. The global information field did not calm down so much as **rotate its points of tension**. The strongest divergence no longer sat in one overwhelming conflict flashpoint. It spread across three different arenas at once: **Iran diplomacy and Hormuz access, institutional legitimacy stories around media freedom and sanctions, and burden-sharing stories around Sudan and cross-border health risk**.

The dimensional profile makes the pattern clear. **Factual divergence remained the lowest layer at 4.71**, while **framing rose to 5.48**, **cui bono to 5.46**, and **causal divergence to 5.40**. Emotional tone and actor context both sat at **5.38**. In other words, regions were still broadly able to recognise the same events. The gap opened once those events had to be interpreted. Was Pakistan’s role a genuine diplomatic channel or just another instrument inside a U.S.-Iran power negotiation? Was a Strait of Hormuz passage reopening evidence of stabilisation or a sign that military leverage still sat behind the deal? Was a press-freedom report an institutional benchmark, a geopolitical mirror, or a selective test applied unevenly across regions? Those were the arguments driving the daily score.

The day’s top story, **Pakistan-mediated U.S.-Iran talks remain active**, scored **8.12** and produced the sharpest pair split in the entire daily table: **Global vs South Asia at 8.3**, matched by **Middle East vs South Asia at 8.3**. That is a strong sign that the core dispute was not over whether talks existed. It was over **who gets to define the meaning of the talks**. South Asian coverage had stronger incentives to treat mediation itself as agency and regional relevance. Global and U.S.-anchored narratives had more tendency to read the same development through outcome probability, leverage, and whether Washington and Tehran were genuinely moving closer.

Just below that came three stories at **8.03** that reveal how broad the divergence field really was. **Iran says a deal is “just inches away,” but no further talks are scheduled** widened the Middle East–US–Europe split over whether negotiation language should be trusted as progress or treated as tactical messaging. **RSF says global press freedom has fallen to a 25-year low** generated an unusually sharp institutional-perception split across **Africa, Europe, Latin America, the US, and Global coverage**. And **Suspected hantavirus outbreak on MV Hondius kills three passengers** showed that even a health incident can travel through very different regional lenses: containment, vulnerability, tourism and transport risk, or another case where crisis is experienced differently depending on who is exposed and who is observing from distance.

So May 5 was not a day of reality collapse. It was a day of **layered legitimacy contest**. Diplomatic process, media credibility, sanctions authority, and humanitarian burden all pushed regions apart in different ways, while the underlying fact pattern stayed relatively more stable.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | 4.71 | The most connected layer. Regions generally recognised the same underlying developments even when they drew very different meanings from them. |
| **D2 — Causal** | 5.40 | Divergence rose when stories turned to why events were happening: mediation, coercion, institutional decline, selective enforcement, or accumulated conflict pressure. |
| **D3 — Framing** | 5.48 | **Highest dimension.** The same story became diplomacy, brinkmanship, legitimacy test, containment failure, or humanitarian warning depending on region. |
| **D4 — Emotional** | 5.38 | Tone varied between urgency, procedural caution, strategic optimism, and distrust. |
| **D5 — Actor Context** | 5.38 | Different regions centered different protagonists: Pakistan, Washington, Tehran, RSF, Kabila, displaced Sudanese civilians, or public-health responders. |
| **D6 — Cui Bono** | 5.46 | Nearly tied for highest. The strongest questions were about who gains leverage, legitimacy, or narrative advantage from how events are framed. |

The important point is that May 5 again followed the same structural rule as recent orange-tier days: **interpretation outran observation**. The world was not primarily disagreeing about whether things happened. It was disagreeing about what those events should count as.

---

## Top Divergent Stories

### 1. **Pakistan-mediated U.S.-Iran talks remain active** — PGI 8.12
- **Regions covered:** US, Middle East, South Asia, Global
- **Category:** diplomacy
- **Dimensional signal:** factual 7.3, causal 8.1, framing 8.6, emotional 8.3, actor 8.1, cui bono 8.3
- **What diverged:** The split was over whether the real story was diplomatic momentum, Pakistan’s regional agency, or another round of leverage politics between Washington and Tehran.
- **Why it mattered:** It produced the day’s sharpest pair gaps: **Global vs South Asia** and **Middle East vs South Asia**, both at **8.3**.

### 2. **Suspected hantavirus outbreak on MV Hondius kills three passengers** — PGI 8.03
- **Regions covered:** Africa, Latin America, Europe, Global
- **Category:** health
- **Dimensional signal:** factual 7.3, causal 8.1, framing 8.3, emotional 8.1, actor 8.1, cui bono 8.3
- **What diverged:** Regions were not only covering a health event. They were deciding whether it should be read as a contained shipboard outbreak, a cross-border public-health risk, or a wider story about exposure and response capacity.
- **Why it mattered:** It showed that high divergence is not confined to war or diplomacy. Health stories can also split hard once consequence and vulnerability enter the frame.

### 3. **Iran says a deal is 'just inches away,' but no further talks are scheduled** — PGI 8.03
- **Regions covered:** Middle East, US, Europe
- **Category:** diplomacy
- **Dimensional signal:** factual 7.3, causal 8.1, framing 8.3, emotional 8.1, actor 8.1, cui bono 8.3
- **What diverged:** The same phrase could be read as real proximity to agreement, tactical rhetoric, or a warning that symbolic progress was outrunning actual process.
- **Why it mattered:** It reinforced the day’s broad **Middle East–US–Europe** split over the credibility of de-escalation language.

### 4. **RSF says global press freedom has fallen to a 25-year low** — PGI 8.03
- **Regions covered:** Global, US, Europe, Latin America, Africa
- **Category:** media
- **Dimensional signal:** factual 7.3, causal 8.1, framing 8.3, emotional 8.1, actor 8.1, cui bono 8.3
- **What diverged:** The report could function as a universal alarm, a Western institutional benchmark, or evidence that information freedom is declining unevenly and being judged selectively.
- **Why it mattered:** It was the clearest driver of the day’s **information-warfare tributary**, which was the highest tributary in the daily aggregate at **6.68**.

### 5. **U.S. sanctions former DR Congo president Joseph Kabila over alleged rebel support** — PGI 7.37
- **Regions covered:** Africa, US, Global
- **Category:** sanctions
- **What diverged:** Some narratives foregrounded accountability and rebel-link disruption; others were more likely to read the move through selective enforcement and external power over an African conflict.
- **Why it mattered:** It widened the **Africa vs US** gap and kept sanctions among the day’s hottest categories.

### 6. **U.S. moves to reopen the Strait of Hormuz under fire** — PGI 7.30
- **Regions covered:** US, Middle East, Global
- **Category:** diplomacy
- **What diverged:** The same operation could read as stabilising commercial navigation or as a coercive act still anchored in force.
- **Why it mattered:** It tied shipping access directly to the credibility of the wider Iran process.

### 7. **Iran signals a Hormuz-for-relief bargain** — PGI 7.30
- **Regions covered:** Middle East, US, Global
- **Category:** diplomacy
- **What diverged:** Regions split over whether the bargain looked like practical de-escalation, transactional leverage, or proof that the ceasefire remained conditional.
- **Why it mattered:** It sharpened the question of whether relief and maritime access were becoming a negotiated settlement or a pressure exchange.

### 8. **Armenia hosts EPC and first EU-Armenia summit in Yerevan** — PGI 7.30
- **Regions covered:** Europe, Central Asia, Global
- **Category:** diplomacy
- **What diverged:** European coverage had more reason to frame the summit as integration and stability; Central Asian and wider regional readings could see it more as geopolitical realignment.
- **Why it mattered:** It produced a rare but very sharp **Central Asia vs Europe / Global** split at **7.5**.

### 9. **China expands zero-tariff treatment across African diplomatic partners, excluding Eswatini** — PGI 7.30
- **Regions covered:** Africa, East & SE Asia, Global
- **Category:** trade
- **What diverged:** The same trade move could be framed as development opportunity, diplomatic signalling around recognition, or a strategic economic map being redrawn.
- **Why it mattered:** It pushed **trade** to the top of the raw category ranking at **7.30**, despite only one story.

### 10. **Nature Medicine calls for an independent international scientific foundation for AI governance** — PGI 7.30
- **Regions covered:** US, Europe, Global
- **Category:** tech-ai
- **What diverged:** Some regions treated the proposal as a governance safeguard; others as a question of who gets to write the rules for a strategic technology stack.
- **Why it mattered:** It helped keep **Europe vs US** elevated even outside pure geopolitics.

---

## Regional Pattern Analysis

### **South Asia was the key outlier on the Iran file**
The strongest structural signal in the daily table was the **South Asia split** around the Pakistan-mediated Iran story. **Global vs South Asia** and **Middle East vs South Asia** both hit **8.3**, while **South Asia vs US** averaged **7.3** across two stories. The issue was not only optimism versus pessimism. It was agency. South Asian narratives had much more reason to treat mediation as a substantive regional role. U.S. and more globally standardised narratives were more likely to collapse the story back into the Washington-Tehran axis.

### **Middle East vs US remained a broad diplomatic stress line**
The **Middle East ↔ US pair averaged 7.15 across eight stories**, with the highest examples concentrated in the Iran/Hormuz package: active Pakistan-mediated talks, a deal being “just inches away,” and the U.S. claim that a passage through Hormuz had been reopened for initial merchant transits. The consistent fault line was credibility. U.S. framing leaned more toward operational success and deal pathway. Middle Eastern framing had more room for skepticism about whether those same developments represented durable de-escalation or just another conditional pause.

### **Africa’s strongest gaps came through legitimacy and burden stories**
Africa appeared in **29 stories**, second only to Global coverage, and its sharpest recurring gaps were not random. **Africa vs Europe averaged 7.45 across four stories**, with the strongest examples being the **MV Hondius hantavirus outbreak**, the **RSF press freedom report**, and the **UK visa-brake debate**. **Africa vs US averaged 7.4 across four stories**, driven by **RSF**, **Kabila sanctions**, and **Zambia’s demand to uncouple a stalled U.S. health deal from critical-minerals access**. The recurring pattern was simple: African coverage had stronger reason to ask who carries the real cost when institutional decisions, sanctions, or global standards are imposed from outside.

### **Europe and the Middle East split on diplomacy and Gaza-linked accountability**
The **Europe ↔ Middle East pair averaged 7.25 across four stories**. The highest entry was again the “deal is just inches away” Iran story, but Gaza-linked narratives also mattered, especially **Gaza ceasefire implementation remains stalled as pressure builds for sanctions and accountability** and **Israel’s interception of the Gaza flotilla revives pressure for a humanitarian corridor**. Europe had more procedural and accountability language available. Middle Eastern narratives more readily judged those same developments by access, coercion, and the credibility of enforcement.

### **Europe and the US also separated on institutional authority**
At **7.03 across nine stories**, **Europe ↔ US** was a lower-intensity but broader split. The pair was pulled upward by **RSF’s 25-year low press-freedom report**, two **AI governance** stories, and the **US decision to leave UNESCO at end-2026**. This is worth noting because it signals a quieter but important pattern: even when allied regions are covering the same institutional stories, they are not always assigning the same value to the institutions involved.

---

## Category Structure

Two category views help explain the day.

### Raw story-category leaders
- **Trade:** 7.30  
- **Diplomacy:** 7.17  
- **Media:** 6.92  
- **Sanctions:** 5.88  
- **Legal:** 5.73  
- **Tech-AI:** 5.63  

### Tributary view from the daily aggregate
- **PGI-IW (information warfare / media):** 6.68  
- **PGI-EC (economic / sanctions / trade):** 5.49  
- **PGI-GP (geopolitics / diplomacy / conflict):** 5.15  
- **PGI-HE (health):** 4.83  
- **PGI-CL (climate):** 4.73  

The raw ranking shows how hot **diplomacy, media, and sanctions** were at story level. The tributary ranking shows something even more important: the day’s strongest systemic divergence sat in the **information field itself**. Press freedom, institutional credibility, and the authority to define standards were doing as much work as classic war-and-peace stories.

---

## Intraday Shape

May 5 eased through the day rather than escalating:

- **AM:** 5.47 across 31 stories  
- **Midday:** 5.38 across 30 stories  
- **PM:** 5.04 across 30 stories

That matters because it tells us the daily score was built early. The hardest splits came in the morning and midday around Iran diplomacy, the hantavirus outbreak, and the RSF report. By evening the field had not normalised, but it had become somewhat less jagged.

---

## What Today’s PGI Means

A **5.22 PGI** means the information environment remained connected enough to share common reference points, but still divided enough that **the same event could support incompatible political meanings**.

On May 5 the world could largely agree that:
- Pakistan-mediated U.S.-Iran talks were still active.  
- Iran was publicly signalling that a deal was close.  
- The U.S. was trying to reopen movement through Hormuz.  
- RSF had published a severe warning on global press freedom.  
- Washington had sanctioned Joseph Kabila.  
- Sudan’s war burden remained catastrophic.  

But agreement on the event did not produce agreement on the interpretation.

- Was Pakistan a true mediator with regional weight, or just a channel for other powers?  
- Was Hormuz reopening a stabilising move, or leverage under another name?  
- Was the press-freedom story a universal democratic alarm, or another selective mirror shaped by who gets judged and who does the judging?  
- Were sanctions in Congo accountability, or another reminder that external power still decides legitimacy?  
- Was Sudan being covered as a humanitarian burden to manage, or as a lived catastrophe whose meaning changes depending on where you stand?  

Those are exactly the kinds of disagreements that keep a day in orange territory.

---

## Bottom Line

May 5 was a **Diverging Narratives** day not because facts broke apart, but because **authority kept changing hands depending on region**.

The Iran file drove the strongest divergence, especially where **South Asia’s mediator-centered reading** ran into **U.S. and globally standardised leverage-centered readings**. Media and institutional stories widened the gap further, with **RSF’s press-freedom report** and **Kabila sanctions** exposing how differently regions judge standards, accountability, and selective power. Human burden stories — from **Sudan’s 14 million displaced** to the **MV Hondius hantavirus outbreak** — showed that consequence itself remains unevenly narrated.

Most importantly, **framing (5.48)** and **cui bono (5.46)** again outran **factual divergence (4.71)**. That is the signature of a world still sharing many of the same events, but not the same hierarchy of meaning. On May 5, the real perception gap was over **who gets to name progress, who gets to define legitimacy, and who is expected to absorb the cost when official narratives fail**.`;

const piece = {
  date: '2026-05-05',
  daily_pgi: 5.22,
  tier: 'Diverging Narratives',
  emoji: '🟠',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 4.71,
  avg_d2_causal: 5.4,
  avg_d3_framing: 5.48,
  avg_d4_emotional: 5.38,
  avg_d5_actor: 5.38,
  avg_d6_cui_bono: 5.46,
  story_count: 91,
  region_count: 12,
  methodology_version: '1.0',
  top_stories: [
    {
      slug: 'pakistan-mediated-u-s-iran-talks-remain-active',
      headline: 'Pakistan-mediated U.S.-Iran talks remain active',
      pgi: 8.12,
      category: 'diplomacy',
      regions: ['US', 'Middle East', 'South Asia', 'Global']
    },
    {
      slug: 'suspected-hantavirus-outbreak-on-mv-hondius-kills-three-passengers',
      headline: 'Suspected hantavirus outbreak on MV Hondius kills three passengers',
      pgi: 8.03,
      category: 'health',
      regions: ['Africa', 'Latin America', 'Europe', 'Global']
    },
    {
      slug: 'iran-says-a-deal-is-just-inches-away-but-no-further-talks-are-scheduled',
      headline: "Iran says a deal is 'just inches away,' but no further talks are scheduled",
      pgi: 8.03,
      category: 'diplomacy',
      regions: ['Middle East', 'US', 'Europe']
    },
    {
      slug: 'rsf-says-global-press-freedom-has-fallen-to-a-25-year-low',
      headline: 'RSF says global press freedom has fallen to a 25-year low',
      pgi: 8.03,
      category: 'media',
      regions: ['Global', 'US', 'Europe', 'Latin America', 'Africa']
    },
    {
      slug: 'u-s-sanctions-former-dr-congo-president-joseph-kabila-over-alleged-rebel-support',
      headline: 'U.S. sanctions former DR Congo president Joseph Kabila over alleged rebel support',
      pgi: 7.37,
      category: 'sanctions',
      regions: ['Africa', 'US', 'Global']
    },
    {
      slug: 'u-s-moves-to-reopen-the-strait-of-hormuz-under-fire',
      headline: 'U.S. moves to reopen the Strait of Hormuz under fire',
      pgi: 7.3,
      category: 'diplomacy',
      regions: ['US', 'Middle East', 'Global']
    },
    {
      slug: 'iran-signals-a-hormuz-for-relief-bargain',
      headline: 'Iran signals a Hormuz-for-relief bargain',
      pgi: 7.3,
      category: 'diplomacy',
      regions: ['Middle East', 'US', 'Global']
    },
    {
      slug: 'armenia-hosts-epc-and-first-eu-armenia-summit-in-yerevan',
      headline: 'Armenia hosts EPC and first EU-Armenia summit in Yerevan',
      pgi: 7.3,
      category: 'diplomacy',
      regions: ['Europe', 'Central Asia', 'Global']
    },
    {
      slug: 'china-expands-zero-tariff-treatment-across-african-diplomatic-partners-excluding-eswatini',
      headline: 'China expands zero-tariff treatment across African diplomatic partners, excluding Eswatini',
      pgi: 7.3,
      category: 'trade',
      regions: ['Africa', 'East & SE Asia', 'Global']
    },
    {
      slug: 'nature-medicine-calls-for-an-independent-international-scientific-foundation-for-ai-governance',
      headline: 'Nature Medicine calls for an independent international scientific foundation for AI governance',
      pgi: 7.3,
      category: 'tech-ai',
      regions: ['US', 'Europe', 'Global']
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
