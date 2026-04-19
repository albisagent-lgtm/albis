const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const date = '2026-04-19';

function round(n) {
  return Math.round(Number(n) * 100) / 100;
}

function weightedAvg(items, key) {
  const totalWeight = items.reduce((sum, item) => sum + Number(item.significance || 1), 0);
  if (!totalWeight) return 0;
  return items.reduce((sum, item) => sum + Number(item[key] || 0) * Number(item.significance || 1), 0) / totalWeight;
}

function titleDate(dateStr) {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function prettyRegion(region) {
  const map = {
    us: 'United States',
    europe: 'Europe',
    'middle-east': 'Middle East',
    'south-asia': 'South Asia',
    'east-se-asia': 'East & Southeast Asia',
    africa: 'Africa',
    pacific: 'Pacific',
    global: 'Global wires',
  };
  return map[region] || region;
}

function pairLabel(a, b) {
  return `${prettyRegion(a)} vs ${prettyRegion(b)}`;
}

function countWords(text) {
  return text.replace(/[#*_`>|\-]/g, ' ').split(/\s+/).filter(Boolean).length;
}

(async function main() {
  const [dailyRes, storiesRes, pairsRes] = await Promise.all([
    supabase.from('pgi_daily').select('*').eq('date', date).maybeSingle(),
    supabase.from('pgi_story_scores').select('*').eq('scan_date', date).eq('is_latest', true),
    supabase.from('pgi_region_pairs').select('*').eq('scan_date', date),
  ]);

  if (dailyRes.error) throw dailyRes.error;
  if (storiesRes.error) throw storiesRes.error;
  if (pairsRes.error) throw pairsRes.error;

  const daily = dailyRes.data;
  const stories = storiesRes.data || [];
  const pairs = pairsRes.data || [];
  if (!daily) throw new Error(`No pgi_daily found for ${date}`);
  if (!stories.length) throw new Error(`No pgi_story_scores found for ${date}`);

  const regionSet = new Set();
  const categories = {};
  const periods = {};
  for (const story of stories) {
    for (const region of story.regions_covered || []) regionSet.add(region);
    (categories[story.category] ||= []).push(story);
    (periods[story.scan_period] ||= []).push(story);
  }

  const dailyPgi = round(Number(daily.daily_pgi));
  const tier = 'Competing Realities';
  const emoji = '🔴';

  const avgD1 = round(weightedAvg(stories, 'd1_factual'));
  const avgD2 = round(weightedAvg(stories, 'd2_causal'));
  const avgD3 = round(weightedAvg(stories, 'd3_framing'));
  const avgD4 = round(weightedAvg(stories, 'd4_emotional'));
  const avgD5 = round(weightedAvg(stories, 'd5_actor_context'));
  const avgD6 = round(weightedAvg(stories, 'd6_cui_bono'));

  const topStories = [...stories]
    .sort((a, b) => Number(b.story_pgi) - Number(a.story_pgi))
    .slice(0, 5)
    .map((story) => ({
      slug: story.story_slug,
      headline: story.story_headline,
      pgi: round(Number(story.story_pgi)),
      category: story.category,
      regions: story.regions_covered,
    }));

  const categorySummary = Object.entries(categories)
    .map(([category, items]) => ({ category, pgi: round(weightedAvg(items, 'story_pgi')), count: items.length }))
    .sort((a, b) => b.pgi - a.pgi);

  const periodSummary = Object.entries(periods)
    .map(([period, items]) => ({ period, pgi: round(weightedAvg(items, 'story_pgi')), count: items.length }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const pairAgg = {};
  for (const pair of pairs) {
    const key = `${pair.region_a}__${pair.region_b}`;
    (pairAgg[key] ||= { region_a: pair.region_a, region_b: pair.region_b, vals: [] }).vals.push(Number(pair.pair_pgi));
  }
  const topPairs = Object.values(pairAgg)
    .map((entry) => ({
      region_a: entry.region_a,
      region_b: entry.region_b,
      avg_pgi: round(entry.vals.reduce((a, b) => a + b, 0) / entry.vals.length),
      count: entry.vals.length,
      label: pairLabel(entry.region_a, entry.region_b),
    }))
    .sort((a, b) => b.avg_pgi - a.avg_pgi)
    .slice(0, 6);

  const periodLine = periodSummary.map((p) => `- **${p.period === 'pm' ? 'PM' : p.period === 'midday' ? 'Midday' : p.period.toUpperCase()}:** ${p.pgi} (${p.count} stories)`).join('\n');
  const topCategoryBullets = categorySummary.slice(0, 5).map((c) => `- **${c.category[0].toUpperCase() + c.category.slice(1)}** at **${c.pgi}** (${c.count} stories)`).join('\n');
  const topPairBullets = topPairs.slice(0, 4).map((p) => `- **${p.label}** at **${p.avg_pgi}**`).join('\n');

  const content_md = `# PGI Signature Piece — ${titleDate(date)}

**Daily PGI:** ${dailyPgi.toFixed(2)} — **${tier}** ${emoji}  
**Stories analyzed:** ${stories.length} | **Regions tracked:** ${regionSet.size}

---

## Executive Summary

April 19 produced a **PGI of ${dailyPgi.toFixed(2)}**, high enough to place the day in **${tier}**. The decisive feature was not total factual fracture. It was a repeated split over whether visible moves toward de-escalation and market stabilisation should be treated as real shifts in the situation, or as tactical surface changes inside the same coercive structure.

That is why the day's flagship story mattered so much. The top divergence signal — **${topStories[0].headline}** at **${topStories[0].pgi.toFixed(2)}** — looked, on the surface, like an operational shipping update. But regions did not read it as a neutral logistics event. Western business and policy coverage tended to frame the Strait of Hormuz through market disruption and risk management. Middle Eastern coverage was more likely to interpret the same opening-and-closing sequence as leverage inside a sovereignty contest. South and East Asian coverage centred shipping dependency, import exposure, and the lived cost of instability. The disagreement sat less in what happened than in what the reversal revealed.

That same structure repeated across the diplomacy block. **${topStories[1].headline}**, **${topStories[3].headline}**, and **${topStories[4].headline}** all pointed to the same underlying divide: a shared awareness that mediation channels remained active, but deep disagreement over whether talks under sanctions pressure, naval pressure, or strategic asymmetry count as meaningful de-escalation. South Asian coverage gave Pakistan more agency than US or European framing usually does. Middle Eastern coverage put greater weight on coercion, credibility, and sovereignty. US framing was more willing to keep pressure and diplomacy inside the same strategic story.

The dimensional profile confirms that interpretation outran fact dispute. **Factual divergence stayed relatively contained at ${avgD1.toFixed(2)}**, but **framing rose to ${avgD3.toFixed(2)}**, **cui bono to ${avgD6.toFixed(2)}**, and **actor context to ${avgD5.toFixed(2)}**. In plain language: the world broadly recognised the same events, but it did not agree on who was controlling them, whose interests they served, or whether the visible changes represented relief, leverage, or selective narrative management.

This is what pushed April 19 into **Competing Realities** territory. The day did not collapse into mutually unknowable facts. It hardened into a conflict over **how to interpret unstable progress** — especially when de-escalation signals arrived inside the same systems of pressure that produced the crisis in the first place.

---

## Dimensional Breakdown

| Dimension | Avg Score | What it shows |
|-----------|-----------|---------------|
| **D1 — Factual** | ${avgD1.toFixed(2)} | Core events largely travelled across regions. The biggest splits were not over whether things happened, but over which details counted as decisive. |
| **D2 — Causal** | ${avgD2.toFixed(2)} | Regions diverged strongly on whether pressure was producing de-escalation, preserving leverage, or simply repackaging coercion. |
| **D3 — Framing** | ${avgD3.toFixed(2)} | **Highest interpretive pressure.** The same stories were told as market shocks, sovereignty contests, mediation breakthroughs, or selective stabilisation. |
| **D4 — Emotional** | ${avgD4.toFixed(2)} | Tone varied meaningfully, but not as sharply as framing. The day was more analytically split than emotionally explosive. |
| **D5 — Actor Context** | ${avgD5.toFixed(2)} | Regions centred different protagonists: Washington, Tehran, Pakistan, shipping markets, sanctions architects, or vulnerable import-dependent publics. |
| **D6 — Cui Bono** | ${avgD6.toFixed(2)} | One of the clearest fault lines. The sharpest argument was over who benefits from temporary openings, temporary waivers, and temporary diplomatic windows. |

April 19 therefore was not primarily a day of factual confusion. It was a day of **strategic disagreement over meaning, agency, and advantage**.

---

## Top Divergent Stories

### 1. **${topStories[0].headline}** — PGI ${topStories[0].pgi.toFixed(2)}
- **Regions covered:** United States, Europe, Middle East, South Asia, East & Southeast Asia, Global wires
- **Why it diverged:** Everyone recognised that Hormuz reopened and then closed again. The split came over whether this should be read as market volatility, tactical signalling, sovereignty leverage, or a warning about import vulnerability.
- **Signal:** Causal divergence hit **8.7**, framing **9.1**, actor context **8.9**, and cui bono **9.0**. This was the cleanest example of a shared operational event producing incompatible political meaning.

### 2. **${topStories[1].headline}** — PGI ${topStories[1].pgi.toFixed(2)}
- **Regions covered:** United States, Europe, Middle East, South Asia, Global wires
- **Why it diverged:** Regions broadly agreed that mediation was active and an extension was being discussed. They diverged on what that meant. US and European coverage tended to see mediation as de-escalation architecture; Middle Eastern coverage tested it against coercion and credibility; South Asian coverage gave Pakistan far more visible agency.
- **Signal:** Framing reached **8.7**, actor context **8.5**, and cui bono **8.8**. The disagreement was not about whether the ceasefire window existed, but about whose leverage defined it.

### 3. **${topStories[2].headline}** — PGI ${topStories[2].pgi.toFixed(2)}
- **Regions covered:** Middle East, Europe, East & Southeast Asia, Global wires
- **Why it diverged:** The temporary reopening was widely acknowledged, but interpreted through completely different stakes: relief for markets, tactical signalling from Tehran, or exposure for import-reliant economies.
- **Signal:** The score stayed high because the reopening did not resolve the underlying argument. It only sharpened the question of whether tactical flexibility should be mistaken for structural stability.

### 4. **${topStories[3].headline}** — PGI ${topStories[3].pgi.toFixed(2)}
- **Regions covered:** United States, Europe, Middle East, South Asia, Global wires
- **Why it diverged:** This was one of the clearest diplomacy stories of the day. Shared facts coexisted with sharply different readings of interimism itself: prudent stabilisation in some regions, asymmetrical pressure management in others.
- **Signal:** Cui bono at **8.3** and framing at **8.4** show why the gap stayed elevated. The hidden question was whether an interim deal protects peace, preserves leverage, or simply postpones harder confrontation.

### 5. **${topStories[4].headline}** — PGI ${topStories[4].pgi.toFixed(2)}
- **Regions covered:** United States, Middle East, South Asia, Global wires
- **Why it diverged:** The familiar dual-track pattern — talks plus pressure — remained visible. Regions differed over whether sanctions threats and maritime pressure strengthened diplomacy or undermined its legitimacy.
- **Signal:** Once again, the decisive split was interpretive. Pressure and diplomacy did not carry the same meaning from one regional lens to another.

---

## Regional Patterns

### **Middle East and South Asia formed the sharpest recurring fault line**
The most divergent aggregate pair was **${topPairs[0].label} at ${topPairs[0].avg_pgi}**. That pairing mattered because the two regions were not simply far apart in tone. They often assigned different weight to mediation agency, sovereignty logic, and the meaning of pressure inside diplomacy.

### **South Asia and the United States also split consistently**
The second-most divergent pair, **${topPairs[1].label} at ${topPairs[1].avg_pgi}**, reflects how often South Asian coverage foregrounded Pakistan's role and regional strategic agency while US coverage folded the same developments into a broader leverage-and-stability frame.

### **US–Middle East divergence stayed structurally important**
At **${topPairs[2].label} (${topPairs[2].avg_pgi})**, the core divide remained familiar: whether pressure and negotiation can coherently belong to the same stabilisation story, or whether one invalidates the moral claims of the other.

### **Europe sat closer to institutional process, but not always to consensus**
European framing often leaned toward sanctions coherence, compliance architecture, and stabilisation language. That narrowed some gaps with the United States, but widened others with regions more focused on credibility, asymmetry, and downstream exposure.

### **East & Southeast Asia and the Pacific read the day through vulnerability to disruption**
Where Western coverage often prioritised statecraft or market interpretation, Asian and Pacific coverage more readily translated Hormuz and maritime stories into shipping risk, energy dependency, and operational fragility. This did not always produce the highest PGI, but it repeatedly changed what counted as the real consequence of the story.

---

## Structural Signal of the Day

The category pattern reinforces the same conclusion:

${topCategoryBullets}

This matters because the day's highest-PGI categories were not random. **Economic flows, diplomacy, and sanctions** were the main engines of divergence because they sat exactly at the point where strategic state action meets unequal downstream exposure. One region sees leverage. Another sees selective flexibility. Another sees vulnerability that never really went away.

The intraday pattern also told a clear story:

${periodLine}

The day did not begin at maximum divergence. It hardened into it. The jump from **AM 5.99** and **Midday 5.84** to **PM 6.82** suggests that once more policy, shipping, and waiver details accumulated, the interpretive split became sharper rather than softer.

The most divergent region pairs were:

${topPairBullets}

Together, these point to three recurring disagreements:

- **What counts as de-escalation:** Is a temporary opening, waiver, or diplomatic window evidence of real improvement or only tactical breathing room?
- **Who has agency:** Are mediators and regional actors genuinely shaping outcomes, or being narrated inside someone else's strategic architecture?
- **Who benefits:** Do these shifts protect civilians and exposed economies, or mainly preserve room for states, markets, and negotiators?

---

## What to Watch Next

- **Hormuz continuity:** If the strait keeps oscillating between opening and closure, framing and cui bono divergence will remain elevated.
- **Pakistan's mediation role:** The more visible Islamabad becomes, the more sharply South Asian and Western framings may separate.
- **Sanctions-waiver contradictions:** Selective flexibility inside sanctions policy will continue feeding actor and benefit-based divergence.
- **Maritime pressure plus diplomacy:** So long as coercive tools and negotiation remain coupled, causal divergence will stay high.
- **Regional vulnerability narratives:** Import-dependent and shipping-dependent regions will keep testing official stabilisation claims against practical exposure.

---

## Bottom Line

April 19 lands at **PGI ${dailyPgi.toFixed(2)}: ${tier}** because the world shared the events but not the meaning of the events.

Most regions recognised the same broad facts: Hormuz shifted from open to closed again, mediation channels stayed active, sanctions signals remained mixed, and diplomatic language did not disappear. But that common factual layer never produced a common interpretation. The argument was over whether these shifts represented genuine de-escalation, selective tactical management, or instability being narrated more carefully.

That is why framing, actor context, and cui bono led the day. The deepest gap was over **who was acting, who was exposed, and who was actually being protected by the current story architecture**.

So April 19 was not a day of shared understanding. It was a day when the same headlines were assembled into competing realities about leverage, legitimacy, and vulnerability.`;

  const piece = {
    date,
    daily_pgi: dailyPgi,
    tier,
    emoji,
    author: 'Albis Scanner',
    content_md,
    word_count: countWords(content_md),
    avg_d1_factual: avgD1,
    avg_d2_causal: avgD2,
    avg_d3_framing: avgD3,
    avg_d4_emotional: avgD4,
    avg_d5_actor: avgD5,
    avg_d6_cui_bono: avgD6,
    story_count: stories.length,
    region_count: regionSet.size,
    top_stories: topStories,
  };

  const { data, error } = await supabase
    .from('pgi_signature_pieces')
    .upsert([piece], { onConflict: 'date' })
    .select();

  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, inserted: data?.[0] }, null, 2));
})();