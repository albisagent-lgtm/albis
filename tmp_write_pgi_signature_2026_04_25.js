const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const DATE = '2026-04-25';

function round(n) { return Math.round(Number(n) * 100) / 100; }
function weightedAvg(items, key) {
  const tw = items.reduce((s, i) => s + Number(i.significance || 1), 0);
  return tw ? items.reduce((s, i) => s + Number(i[key] || 0) * Number(i.significance || 1), 0) / tw : 0;
}
function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }
function cleanHeadline(s) { return String(s || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim(); }
function sentence(s) { return String(s || '').trim().replace(/\s+/g, ' '); }
function titleCaseRegion(region) {
  const map = {
    us: 'US', eu: 'Europe', europe: 'Europe', uk: 'UK', me: 'Middle East', 'middle-east': 'Middle East', middle_east: 'Middle East',
    sa: 'South Asia', 'south-asia': 'South Asia', south_asia: 'South Asia', ap: 'Asia-Pacific', pacific: 'Pacific',
    'east-se-asia': 'East & SE Asia', east_se_asia: 'East & SE Asia', east_asia: 'East Asia', 'east-asia': 'East Asia',
    africa: 'Africa', global: 'Global', 'latin-america': 'Latin America', latin_america: 'Latin America', 'latin-americas': 'Latin America', latin_americas: 'Latin America',
    'central-asia': 'Central Asia', central_asia: 'Central Asia'
  };
  return map[region] || String(region).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function main() {
  const [{ data: daily, error: dailyError }, { data: stories, error: storiesError }] = await Promise.all([
    supabase.from('pgi_daily').select('*').eq('date', DATE).maybeSingle(),
    supabase.from('pgi_story_scores').select('*').eq('scan_date', DATE).eq('is_latest', true).order('story_pgi', { ascending: false })
  ]);

  if (dailyError) throw dailyError;
  if (storiesError) throw storiesError;
  if (!daily) throw new Error(`No pgi_daily row found for ${DATE}`);
  if (!stories || !stories.length) throw new Error(`No pgi_story_scores rows found for ${DATE}`);

  const dailyPgi = round(daily.daily_pgi ?? weightedAvg(stories, 'story_pgi'));
  const storyCount = Number(daily.story_count ?? stories.length);
  const regionSet = uniq(stories.flatMap(s => Array.isArray(s.regions_covered) ? s.regions_covered : []));
  const regionCount = regionSet.length;

  const dims = {
    factual: round(daily.avg_d1_factual ?? weightedAvg(stories, 'd1_factual')),
    causal: round(daily.avg_d2_causal ?? weightedAvg(stories, 'd2_causal')),
    framing: round(daily.avg_d3_framing ?? weightedAvg(stories, 'd3_framing')),
    emotional: round(daily.avg_d4_emotional ?? weightedAvg(stories, 'd4_emotional')),
    actor: round(daily.avg_d5_actor ?? weightedAvg(stories, 'd5_actor_context')),
    cui_bono: round(daily.avg_d6_cui_bono ?? weightedAvg(stories, 'd6_cui_bono'))
  };

  const sortedDims = Object.entries(dims).sort((a, b) => b[1] - a[1]);
  const topStories = stories.slice(0, 6).map((s, idx) => ({
    rank: idx + 1,
    slug: s.story_slug || cleanHeadline(s.story_headline).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    headline: cleanHeadline(s.story_headline),
    pgi: round(s.story_pgi),
    category: s.category,
    regions: Array.isArray(s.regions_covered) ? s.regions_covered : [],
    rationale: sentence(s.scoring_rationale || ''),
    dims: {
      factual: round(s.d1_factual),
      causal: round(s.d2_causal),
      framing: round(s.d3_framing),
      emotional: round(s.d4_emotional),
      actor: round(s.d5_actor_context ?? s.d5_actor),
      cui_bono: round(s.d6_cui_bono)
    }
  }));

  const categories = Object.values(stories.reduce((acc, s) => {
    const key = s.category || 'uncategorized';
    acc[key] ||= { category: key, items: [] };
    acc[key].items.push(s);
    return acc;
  }, {})).map(x => ({
    category: x.category,
    avg: round(weightedAvg(x.items, 'story_pgi')),
    count: x.items.length,
    examples: x.items.slice().sort((a, b) => b.story_pgi - a.story_pgi).slice(0, 2).map(s => cleanHeadline(s.story_headline))
  })).sort((a, b) => b.avg - a.avg);

  const periods = Object.values(stories.reduce((acc, s) => {
    acc[s.scan_period] ||= { period: s.scan_period, items: [] };
    acc[s.scan_period].items.push(s);
    return acc;
  }, {})).map(x => ({ period: x.period, avg: round(weightedAvg(x.items, 'story_pgi')), count: x.items.length }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const [lead, second, third, fourth, fifth, sixth] = topStories;
  const topCats = categories.slice(0, 5).map(c => `${c.category} (${c.avg.toFixed(2)})`).join(', ');
  const periodLine = periods.map(p => `${String(p.period).toUpperCase()} ${p.avg.toFixed(2)} (${p.count} stories)`).join(', ');

  const content_md = `# PGI Signature Piece — April 25, 2026

**Daily PGI:** ${dailyPgi.toFixed(2)} — **${daily.tier}** ${daily.emoji}  
**Stories analyzed:** ${storyCount} | **Regions tracked:** ${regionCount}

---

## Executive Summary

April 25 produced a **daily PGI of ${dailyPgi.toFixed(2)}**, placing the global information environment in **${daily.tier}**. This was not a day of total information fracture. It was a day of **sustained narrative splitting across a very large story set**: 113 stories across 11 tracked regions, with the sharpest gaps clustering around migration, Gulf diplomacy, U.S. detention policy, health-system fallout from U.S. disruptions, and AI-security escalation between Washington and Beijing.

The dimensional profile explains the structure of the gap. **${sortedDims[0][0].replace('_', ' ')} (${sortedDims[0][1].toFixed(2)})** and **${sortedDims[1][0].replace('_', ' ')} (${sortedDims[1][1].toFixed(2)})** led the day, while factual divergence remained lower at **${dims.factual.toFixed(2)}**. That is the signature of a world where the basic event often travels, but the meaning, beneficiaries, and moral center of the story do not. Audiences were not simply shown different facts. They were shown different answers to the questions that matter most: *Who is under threat? Who is acting legitimately? Who gains from the framing?*

Two broad patterns dominated. First, **U.S.-centered migration and detention stories** generated the strongest perception gaps of the day because Latin American, African, and global-rights framings emphasized human vulnerability, racial selectivity, and institutional danger, while U.S. political framing could still treat the same developments as enforcement choices or policy management. Second, **Iran/Hormuz diplomacy** continued to split regions between formal ceasefire language and operational reality. Western and global system-management narratives kept stressing negotiation channels and stabilization messaging; Middle Eastern and South Asian coverage gave more weight to unresolved coercion, corridor risk, and whether the ceasefire changed anything material on the ground.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | ${dims.factual.toFixed(2)} | Core events were often shared, but evidence selection and factual emphasis still shifted by region. |
| **D2 — Causal** | ${dims.causal.toFixed(2)} | Regions diverged materially on what was driving events and which downstream consequences mattered most. |
| **D3 — Framing** | ${dims.framing.toFixed(2)} | The same events were repeatedly packaged into different moral and political realities. |
| **D4 — Emotional** | ${dims.emotional.toFixed(2)} | Urgency, alarm, and restraint varied enough to change how threatening stories felt. |
| **D5 — Actor Context** | ${dims.actor.toFixed(2)} | Governments, migrants, diplomats, and corporations were cast in very different roles across regions. |
| **D6 — Cui Bono** | ${dims.cui_bono.toFixed(2)} | The strongest question of the day was who benefited from the same policy or narrative move. |

The pattern is clear: **framing and cui bono outran fact**. April 25 was less about whether something happened than about whether it should be read as protection, coercion, deterrence, discrimination, stabilization, or theatre.

---

## Top Divergent Stories

### 1. **${lead.headline}** — PGI ${lead.pgi.toFixed(2)}
- **Regions covered:** ${lead.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${lead.category || '—'}
- **Dimensional signal:** factual ${lead.dims.factual.toFixed(1)}, causal ${lead.dims.causal.toFixed(1)}, framing ${lead.dims.framing.toFixed(1)}, emotional ${lead.dims.emotional.toFixed(1)}, actor ${lead.dims.actor.toFixed(1)}, cui bono ${lead.dims.cui_bono.toFixed(1)}
- **What diverged:** Rising deaths in detention were not framed as a neutral administrative failure. In Latin American and global-rights oriented readings, the story pointed to structural danger inside the U.S. detention system and the human cost of enforcement-first policy. In U.S. political space, the same story can still be absorbed into bureaucratic accountability, border management, or partisan contest.
- **Why it mattered:** This was the day’s clearest human-rights fracture. The gap was not over whether deaths were rising. It was over whether the event revealed a tragic policy stress point or a deeper indictment of the system itself.

### 2. **${second.headline}** — PGI ${second.pgi.toFixed(2)}
- **Regions covered:** ${second.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${second.category || '—'}
- **Dimensional signal:** factual ${second.dims.factual.toFixed(1)}, causal ${second.dims.causal.toFixed(1)}, framing ${second.dims.framing.toFixed(1)}, emotional ${second.dims.emotional.toFixed(1)}, actor ${second.dims.actor.toFixed(1)}, cui bono ${second.dims.cui_bono.toFixed(1)}
- **What diverged:** In African coverage, the story naturally carried the history of race, post-apartheid inequality, and external political instrumentalization. In U.S. coverage, it can be narrated as humanitarian protection, culture-war signaling, or selective refugee policy. The distance between those lenses is exactly why the score moved above 9.
- **Why it mattered:** This story concentrated one of the year’s most explosive framing questions: when is asylum a protection mechanism, and when is it a geopolitical or ideological statement about whose suffering counts?

### 3. **${third.headline}** — PGI ${third.pgi.toFixed(2)}
- **Regions covered:** ${third.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${third.category || '—'}
- **Dimensional signal:** factual ${third.dims.factual.toFixed(1)}, causal ${third.dims.causal.toFixed(1)}, framing ${third.dims.framing.toFixed(1)}, emotional ${third.dims.emotional.toFixed(1)}, actor ${third.dims.actor.toFixed(1)}, cui bono ${third.dims.cui_bono.toFixed(1)}
- **What diverged:** Middle Eastern coverage treated continued strikes as evidence that ceasefire language had lost operational credibility. Global framing was more likely to preserve a broader de-escalation story or present the ceasefire as weakened rather than empty.
- **Why it mattered:** This is a classic PGI pattern: one region hears “fragile ceasefire,” another hears “meaningless ceasefire.” The policy implications are completely different.

### 4. **${fourth.headline}** — PGI ${fourth.pgi.toFixed(2)}
- **Regions covered:** ${fourth.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${fourth.category || '—'}
- **Dimensional signal:** factual ${fourth.dims.factual.toFixed(1)}, causal ${fourth.dims.causal.toFixed(1)}, framing ${fourth.dims.framing.toFixed(1)}, emotional ${fourth.dims.emotional.toFixed(1)}, actor ${fourth.dims.actor.toFixed(1)}, cui bono ${fourth.dims.cui_bono.toFixed(1)}
- **What diverged:** African and global-health framings put the stress on real delivery disruption, disease control risk, and the immediate vulnerability of treatment and prevention systems. Elsewhere, the same story is easier to collapse into procurement mechanics or donor-policy turbulence.
- **Why it mattered:** It exposed a recurring gap between regions living the consequences of aid disruption and regions discussing the same event through institutional abstraction.

### 5. **${fifth.headline}** — PGI ${fifth.pgi.toFixed(2)}
- **Regions covered:** ${fifth.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${fifth.category || '—'}
- **Dimensional signal:** factual ${fifth.dims.factual.toFixed(1)}, causal ${fifth.dims.causal.toFixed(1)}, framing ${fifth.dims.framing.toFixed(1)}, emotional ${fifth.dims.emotional.toFixed(1)}, actor ${fifth.dims.actor.toFixed(1)}, cui bono ${fifth.dims.cui_bono.toFixed(1)}
- **What diverged:** This story was highly localized in African coverage, where the inquiry was a governance and accountability shock. Outside the region it had far less narrative oxygen, demonstrating how severe political violence can remain regionally intense but globally muted.
- **Why it mattered:** High PGI can emerge not only from disagreement but from **asymmetric visibility**. What is existential in one region can remain peripheral elsewhere.

### 6. **${sixth.headline}** — PGI ${sixth.pgi.toFixed(2)}
- **Regions covered:** ${sixth.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${sixth.category || '—'}
- **Dimensional signal:** factual ${sixth.dims.factual.toFixed(1)}, causal ${sixth.dims.causal.toFixed(1)}, framing ${sixth.dims.framing.toFixed(1)}, emotional ${sixth.dims.emotional.toFixed(1)}, actor ${sixth.dims.actor.toFixed(1)}, cui bono ${sixth.dims.cui_bono.toFixed(1)}
- **What diverged:** Washington framed AI theft claims as a strategic warning campaign requiring allied alignment. East and Southeast Asian readings had more incentive to treat the move as escalation inside the tech rivalry, while European audiences could receive it as a security issue but with different exposure and urgency.
- **Why it mattered:** The AI race is increasingly not just a technology story but a legitimacy story: who is innovating, who is stealing, and who gets asked to choose sides.

---

## Regional Pattern Analysis

### **US vs Global South: migration and detention became a moral fracture line**
The strongest single story-level divergence of the day sat in U.S. detention deaths, followed closely by the white South African refugee story. Both reveal the same deeper split: U.S. policy stories are not received internationally as mere domestic governance. They are read through race, rights, selectivity, and the hierarchy of whose suffering becomes legible. Latin American and African coverage was far less willing to treat these stories as ordinary policy disputes. They landed as evidence of a value system.

### **Middle East: ceasefire vocabulary still lacked trust**
The Lebanon-Israel ceasefire story, together with the day's wider Hormuz and Iran diplomacy coverage, showed that regional audiences closest to the conflict remained much less willing to treat ceasefire language as self-validating. For Middle Eastern coverage, continued strikes and persistent pressure mean the operational reality outranks the diplomatic headline. That is why ceasefire-related stories remained among the day's highest-PGI items even though the factual shell of the story was widely recognizable.

### **South Asia: diplomacy was read through proximity and stake, not optics**
Pakistan-related U.S.-Iran contact stories scored highly because South Asian coverage had more reason to treat Pakistan as an actual strategic venue rather than just a line item in U.S. diplomacy. That creates a structural gap with Western framing, where the same story can be subordinated to the Washington-Iran lens. South Asia was not just watching the diplomacy. It was inside the geography of the diplomacy.

### **Africa: consequence visibility stayed sharper than global visibility**
The Tanzania inquiry and malaria/HIV supply-chain stress both showed how African coverage often carries the human and governance consequences more directly than global summaries do. This does not necessarily mean facts differ. It means urgency, scale, and stakes are narrated differently. When that happens repeatedly, audiences in different regions leave with very different judgments about what deserves attention now.

### **Europe and East & SE Asia: tech-security stories widened the field**
The U.S. warning campaign over alleged Chinese AI theft pulled Europe and East & SE Asia into one of the day's key non-migration divergences. For Europe, the issue is strategic alignment and industrial security. For East & SE Asia, it is inseparable from regional supply chains, technological competition, and the costs of bloc pressure. The result is a story that looks globally coherent on the surface but distributes very different risk calculations underneath.

---

## Category and Intraday Structure

By category, the highest average divergence sat in **${topCats}**. That mix matters. April 25 was not dominated by a single war file. It was a **cross-domain divergence day**, with migration, diplomacy, social-policy, media control, conflict, and governance all contributing meaningfully.

The intraday profile reinforced that pattern: **${periodLine}**. The **AM cycle** was materially calmer, while **midday and PM** carried the sharper fractures. In practical terms, the day hardened as more politically charged migration, detention, AI-rivalry, and ceasefire stories accumulated. The result was a moderate-to-high daily PGI built not on one massive rupture, but on repeated high-intensity gaps across multiple systems.

---

## What Today's PGI Means

A **${dailyPgi.toFixed(2)} PGI** means the world was still connected enough to see the same major events, but not connected enough to agree on what those events signified. On April 25, the strongest disagreements clustered around three questions:

1. **Is state power being used for protection or selective coercion?**  
   This drove the migration and detention stories.
2. **Is diplomacy stabilizing a crisis, or merely narrating over unresolved force?**  
   This drove the Iran, Hormuz, and Lebanon-related files.
3. **Are global system disruptions being read as technical problems or lived human threats?**  
   This drove the health and governance stories, especially in Africa.

That is why the day sits in **${daily.tier}** rather than full red. There was no universal collapse into parallel realities. But there was enough repeated narrative distance that audiences across regions would come away with materially different maps of who is endangered, who is credible, and whose interests are being served.

---

## Bottom Line

April 25 was a **broad-spectrum divergence day**. The global narrative field did not split around just one headline. It fractured across migration, detention, ceasefire credibility, African governance violence, global health-system disruption, and AI rivalry. The day's top story — **${lead.headline}** — captured the sharpest fault line: human consequence versus administrative framing. The second — **${second.headline}** — revealed how refugee language itself can become an argument about race and geopolitical signaling. The Gulf stories then kept pressure on the old question of whether formal diplomacy reflects reality or obscures it.

With **framing (${dims.framing.toFixed(2)})** and **cui bono (${dims.cui_bono.toFixed(2)})** leading the dimensional profile, the message is straightforward: the decisive gap on April 25 was not over raw fact. It was over **whose story the fact was made to serve**.`;

  const piece = {
    date: DATE,
    daily_pgi: dailyPgi,
    tier: daily.tier,
    emoji: daily.emoji,
    author: 'Albis Scanner',
    content_md,
    word_count: content_md.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length,
    avg_d1_factual: dims.factual,
    avg_d2_causal: dims.causal,
    avg_d3_framing: dims.framing,
    avg_d4_emotional: dims.emotional,
    avg_d5_actor: dims.actor,
    avg_d6_cui_bono: dims.cui_bono,
    story_count: storyCount,
    region_count: regionCount,
    top_stories: topStories.map(({ slug, headline, pgi, category, regions }) => ({ slug, headline, pgi, category, regions }))
  };

  const { data, error } = await supabase
    .from('pgi_signature_pieces')
    .upsert([piece], { onConflict: 'date' })
    .select();

  if (error) throw error;

  console.log(JSON.stringify({ ok: true, piece: data?.[0] }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
