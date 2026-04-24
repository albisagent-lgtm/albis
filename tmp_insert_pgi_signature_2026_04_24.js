const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const content_md = `# PGI Signature Piece — April 24, 2026

**Daily PGI:** 5.41 — **Diverging Narratives** 🟠  
**Stories analyzed:** 86 | **Regions tracked:** 10

---

## Executive Summary

April 24 closed with a **daily PGI of 5.41**, placing the global information environment in **Diverging Narratives** rather than full red-zone fragmentation. That matters. The world was not split across every story. It was split across a smaller set of strategically important stories that carried outsized interpretive weight.

The day’s clearest fracture sat around **Hormuz, shipping insecurity, and the credibility of ceasefire language**. The top story — **Hormuz confrontation deepens as ceasefire language persists but shipping insecurity worsens** — scored **9.13**, easily the day’s most polarized item. Regions could all recognise the same broad event field: ceasefire signalling on one side, insecurity in a vital maritime corridor on the other. But they diverged sharply on what that combination meant. For some, it was still a diplomacy-management story. For others, it was proof that stabilising language was running ahead of operational reality.

The dimensional profile explains the structure of the gap. **Cui bono divergence (5.82)** and **framing divergence (5.79)** led the day, with **emotional divergence (5.72)** and **causal divergence (5.55)** close behind. **Factual divergence (5.09)** remained the lowest layer. In plain terms: April 24 was not primarily a day of factual collapse. It was a day of disagreement over **who benefits, whose risk counts, and what kind of story audiences were being asked to inhabit**.

There was also an important asymmetry in the day’s composition. Most of the 86 stories sat in the moderate range. But the high-PGI cluster was concentrated in conflict, migration, governance, legal, and tech-geopolitical stories — exactly the areas where narrative framing changes public interpretation fastest. That is why the daily average stayed orange while the top stories themselves pushed into deep-red territory.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | 5.09 | Core events were broadly shared, but specifics, qualifiers, and salience still varied. |
| **D2 — Causal** | 5.55 | Regions increasingly disagreed on why events were happening and which consequences mattered most. |
| **D3 — Framing** | 5.79 | The strongest structural gap: the same event was narrated through meaningfully different lenses. |
| **D4 — Emotional** | 5.72 | Tone divergence mattered; some regions narrated urgency and exposure, others management and abstraction. |
| **D5 — Actor Context** | 5.35 | Protagonists and legitimacy cues shifted enough to change audience judgment. |
| **D6 — Cui Bono** | 5.82 | **Highest dimension**; regions diverged most on who gains leverage, who carries cost, and who is protected. |

The sequence matters. **Facts travelled farther than meaning.** Once the event crossed borders, the biggest divergence emerged in the interpretation layered on top of it: who is controlling events, who is absorbing the consequences, and whether formal de-escalation language can be trusted.

---

## Top Divergent Stories

### 1. **Hormuz confrontation deepens as ceasefire language persists but shipping insecurity worsens** — PGI 9.13
- **Regions covered:** Middle East, US, Europe, Global, South Asia, East & SE Asia
- **Category:** conflict
- **Dimensional signal:** factual 8.6, causal 9.1, framing 9.3, emotional 9.5, actor 8.9, cui bono 9.4
- **What diverged:** The same mix of ceasefire rhetoric and maritime insecurity produced radically different readings: partial stabilisation for some audiences, strategic unreliability for others.
- **Regional split:** Western narratives were more able to frame the moment as risk management under pressure. Middle Eastern and Asian lenses were more likely to treat continued shipping insecurity as evidence that the underlying coercive architecture had not changed.
- **Why it matters:** This was the day’s signature contradiction: ceasefire language existed, but the corridor still behaved like an active pressure zone.

### 2. **White House accuses China of industrial-scale theft of AI technology ahead of leaders’ summit** — PGI 8.15
- **Regions covered:** US, East & SE Asia
- **Category:** tech-ai
- **Dimensional signal:** factual 7.7, causal 8.2, framing 8.4, emotional 8.3, actor 7.9, cui bono 8.4
- **What diverged:** The story could be told as a security warning, a summit-positioning move, or part of a broader contest over technological legitimacy.
- **Regional split:** US framing leaned toward strategic theft and national-security exposure; East and Southeast Asian interpretation was more likely to read the accusation inside wider power competition and summit leverage.
- **Why it matters:** This was not just a bilateral tech story. It was a test of who gets to define the rules of legitimacy in AI competition.

### 3. **Druzhba restart helps unblock EU liquidity politics around Kyiv** — PGI 8.13
- **Regions covered:** Europe, Global
- **Category:** governance
- **Dimensional signal:** factual 7.7, causal 8.2, framing 8.3, emotional 8.3, actor 7.9, cui bono 8.4
- **What diverged:** A pipeline-and-finance story became either a technical governance update or a sign of the political economy being reorganised around wartime constraints.
- **Regional split:** European coverage had more institutional texture and proximity to internal tradeoffs; global coverage compressed the story into an external systems-development narrative.
- **Why it matters:** This is a classic PGI pattern: administrative adjustments can look procedural in one region and strategically revealing in another.

### 4. **China pressure over African overflight clearances forces Taiwan president to cancel Eswatini trip** — PGI 8.12
- **Regions covered:** Africa, East & SE Asia, US, Global
- **Category:** geopolitics
- **Dimensional signal:** factual 7.6, causal 8.1, framing 8.4, emotional 8.3, actor 7.9, cui bono 8.4
- **What diverged:** The same cancellation could be framed as diplomatic coercion, airspace politics, symbolic containment, or evidence of Beijing’s expanding influence over third-country decisions.
- **Regional split:** African coverage foregrounded sovereignty and direct operational consequence. US and East Asian coverage folded the event into wider Taiwan–China contestation. Global reporting tended to smooth those distinctions.
- **Why it matters:** It showed how great-power competition is increasingly mediated through smaller states and technical permissions rather than headline confrontation alone.

### 5. **Meta starts capturing employee mouse movements and keystrokes for AI training data** — PGI 8.12
- **Regions covered:** US, Europe, Global
- **Category:** legal
- **Dimensional signal:** factual 7.6, causal 8.1, framing 8.4, emotional 8.3, actor 7.9, cui bono 8.4
- **What diverged:** One region can read this as efficiency and model-development infrastructure; another reads it as labour surveillance and asymmetrical extraction.
- **Regional split:** US coverage more readily nests the story inside company strategy and AI competition. European framing is more likely to stress rights, consent, and the legitimacy of workplace monitoring.
- **Why it matters:** It is a revealing example of cui bono divergence: the exact same data-capture practice looks either like capability-building or like worker dispossession, depending on the lens.

### 6. **Trump administration considers expanding refugee intake for white South Africans** — PGI 8.10
- **Regions covered:** US, Africa, Global
- **Category:** migration
- **Dimensional signal:** factual 7.6, causal 8.1, framing 8.3, emotional 8.3, actor 7.9, cui bono 8.4
- **What diverged:** The issue could be cast as humanitarian protection, racialised selectivity, domestic political signalling, or geopolitical messaging toward South Africa.
- **Regional split:** US narratives were more exposed to domestic partisan framing; African coverage had stronger incentives to interrogate the racial and political assumptions built into the selection logic.
- **Why it matters:** Migration stories often reveal value hierarchies more clearly than official doctrine does. This one did exactly that.

---

## Regional Pattern Analysis

### **US vs Africa was the sharpest recurring fracture**
The most divergent average regional pairing of the day was **Africa vs US (8.0)**. That is not accidental. Several of the day’s highest-gap stories — including the Taiwan/Eswatini overflight cancellation and the white South African refugee story — turned on whether Africa was treated as an actor with its own political logic or as a stage on which larger powers played out their priorities. US framing often tilted toward strategic or domestic-political implications. African framing more often emphasised sovereignty, selective standards, and the asymmetry of who gets narrated as fully human or fully strategic.

### **Middle East remained the interpretive pivot on conflict stories**
On the day’s top story, the Middle East was at the center of the strongest pairwise gaps. Every key pairing attached to the Hormuz story involving the Middle East sat at **9.3**. That is a decisive signal. Regional coverage closer to the theatre put more weight on the disconnect between diplomatic language and operating conditions. Western and global coverage could still interpret the same developments through de-escalation management, market risk, or strategic signalling. The gap was not whether insecurity existed. It was whether insecurity invalidated the meaning of the ceasefire language surrounding it.

### **South Asia and East & SE Asia translated Gulf instability into corridor and dependency risk**
The strongest non-Western pair averages after Africa–US included **South Asia vs US (7.63)** and **East & SE Asia vs South Asia (7.28)**. These regions did not merely consume Gulf stories as foreign-policy news. They metabolised them through energy exposure, shipping dependence, and supply-chain vulnerability. That creates a different emotional and causal architecture: less about elite diplomacy, more about corridor reliability and downstream economic exposure.

### **Europe and Global coverage often compressed local strategic texture**
Europe was one of the most present regions in the data, appearing in **44 stories**, while **Global** appeared in **63**. That gave both large narrative weight. But “global” coverage in particular often functioned as a smoothing mechanism, reducing local or regional texture into portable headline form. That does not make it false. It does make it structurally different. Several of the day’s governance, migration, and geopolitical stories showed exactly this pattern: local stakes and institutional nuance were flattened when reframed for transregional audiences.

### **Peripheral regions mattered even at low volume**
The **Pacific** appeared in only **3 stories** and **Central Asia** in **1**, but the pairwise structure shows that low-frequency regions can still generate strong divergence when they do appear. **Global vs Pacific averaged 7.7**, and **East & SE Asia vs Pacific** and **US vs Pacific** both hit **7.3** on the stories where they intersected. This is a useful warning: narrative divergence is not only driven by high-volume blocs. Small regional lenses can generate disproportionate shifts in interpretation when they enter the frame.

---

## Category Structure

By category, the highest average divergence sat in **social (7.61)**, **conflict (7.46)**, **geopolitics (6.89)**, **migration (6.82)**, and **governance (6.69)**. That category profile is revealing.

- **Conflict** stayed high because the day’s main Hormuz story concentrated near-maximal disagreement on whether ceasefire language could still carry meaning.
- **Migration** and **social** stories ran hot because they force normative judgments into the foreground: who deserves protection, whose suffering gets narrated, and what policy selectivity reveals.
- **Governance** and **legal** divergence showed how much narrative distance can be generated by institutional stories that appear procedural on the surface.
- By contrast, **energy (3.97)** and **economic (4.18)** averaged much lower across the full set. That suggests a day where market and macro stories were relatively more shareable across regions than the value-laden stories about conflict, migration, or coercion.

This is a classic orange-day profile: not universal disagreement, but sharp and consequential disagreement concentrated in high-salience narratives.

---

## Intraday Shape

The day’s intraday structure was striking:

- **AM:** 5.95 across 7 stories  
- **Midday:** 6.33 across 35 stories  
- **PM:** 4.84 across 44 stories

The divergence peaked in the **midday** block, where the story mix concentrated around geopolitics, migration, legal conflict-overhang, and corridor-risk narratives. By evening, the larger PM volume diluted the aggregate with more moderate stories. So the day did **not** intensify in a straight line. Instead, it spiked around a middle cycle in which the most interpretively loaded stories had matured, then cooled at the aggregate level as the broader story field widened.

That matters analytically. A daily PGI of **5.41** can hide a period of much sharper narrative fracture inside the day. On April 24, that fracture was real — it just did not dominate the entire output set from morning to night.

---

## What Today’s PGI Means

A **5.41 PGI** means the global information environment remained partially shared, but not evenly shared. Audiences could still access many of the same core events. What they could not access in the same way was **the implied hierarchy of meaning**.

Was Hormuz evidence of active unresolved coercion, or a stressed but manageable corridor under diplomatic negotiation?  
Was AI theft framing a security warning, or summit leverage under another name?  
Was refugee policy a humanitarian act, or a highly selective moral signal?  
Was workplace data capture productive infrastructure, or labour extraction dressed up as innovation?

Those are not cosmetic disagreements. They shape how publics interpret legitimacy, priority, and risk. April 24’s orange-tier PGI shows a world where the event layer still overlaps — but the explanatory layer is pulling apart.

---

## Bottom Line

April 24 was a **Diverging Narratives** day because most stories remained within a shared range, while a smaller set of highly strategic stories split hard across regions. The defining example was **Hormuz confrontation deepens as ceasefire language persists but shipping insecurity worsens**, which reached **9.13** and exposed the day’s core contradiction: formal de-escalation language was not enough to erase lived corridor instability.

The strongest dimensions were **cui bono (5.82)** and **framing (5.79)**, followed closely by **emotional (5.72)** and **causal (5.55)**. The sharpest recurrent regional fracture was **Africa vs US (8.0)**, while Middle Eastern pairings dominated the highest conflict-related breaks. That combination tells us exactly what kind of day this was: not a breakdown of shared facts, but a widening split over who is centered, whose risks are normalised, and whose interpretation becomes the default global story.

April 24 did not produce one global reality. It produced a partially shared event field overlaid with increasingly divergent moral and strategic maps. That is what **Diverging Narratives** looks like in practice.`;

const piece = {
  date: '2026-04-24',
  daily_pgi: 5.41,
  tier: 'Diverging Narratives',
  emoji: '🟠',
  author: 'Albis Scanner',
  content_md,
  word_count: content_md.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length,
  avg_d1_factual: 5.09,
  avg_d2_causal: 5.55,
  avg_d3_framing: 5.79,
  avg_d4_emotional: 5.72,
  avg_d5_actor: 5.35,
  avg_d6_cui_bono: 5.82,
  story_count: 86,
  region_count: 10,
  methodology_version: '1.0',
  top_stories: [
    {
      slug: 'hormuz-confrontation-deepens-as-ceasefire-language-persists-but-shipping-insecurity-worsens',
      headline: 'Hormuz confrontation deepens as ceasefire language persists but shipping insecurity worsens',
      pgi: 9.13,
      category: 'conflict',
      regions: ['middle-east', 'us', 'europe', 'global', 'south-asia', 'east-se-asia']
    },
    {
      slug: 'white-house-accuses-china-of-industrial-scale-theft-of-ai-technology-ahead-of-leaders-summit',
      headline: 'White House accuses China of industrial-scale theft of AI technology ahead of leaders’ summit',
      pgi: 8.15,
      category: 'tech-ai',
      regions: ['us', 'east-se-asia']
    },
    {
      slug: 'druzhba-restart-helps-unblock-eu-liquidity-politics-around-kyiv',
      headline: 'Druzhba restart helps unblock EU liquidity politics around Kyiv',
      pgi: 8.13,
      category: 'governance',
      regions: ['europe', 'global']
    },
    {
      slug: 'china-pressure-over-african-overflight-clearances-forces-taiwan-president-to-cancel-eswatini-trip',
      headline: 'China pressure over African overflight clearances forces Taiwan president to cancel Eswatini trip',
      pgi: 8.12,
      category: 'geopolitics',
      regions: ['africa', 'east-se-asia', 'us', 'global']
    },
    {
      slug: 'meta-starts-capturing-employee-mouse-movements-and-keystrokes-for-ai-training-data',
      headline: 'Meta starts capturing employee mouse movements and keystrokes for AI training data',
      pgi: 8.12,
      category: 'legal',
      regions: ['us', 'europe', 'global']
    },
    {
      slug: 'trump-administration-considers-expanding-refugee-intake-for-white-south-africans',
      headline: 'Trump administration considers expanding refugee intake for white South Africans',
      pgi: 8.1,
      category: 'migration',
      regions: ['us', 'africa', 'global']
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