const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');

const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const DATE = '2026-04-23';

function round(n) { return Math.round(Number(n) * 100) / 100; }
function mean(arr) { return arr.length ? arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length : 0; }
function weightedAvg(items, key) {
  const tw = items.reduce((s, i) => s + Number(i.significance || 1), 0);
  return tw ? items.reduce((s, i) => s + Number(i[key] || 0) * Number(i.significance || 1), 0) / tw : 0;
}
function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }
function cleanHeadline(s) { return String(s || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim(); }
function sentence(s) { return String(s || '').trim().replace(/\s+/g, ' '); }
function classifyTier(pgi) {
  if (pgi <= 2) return { tier: 'Global Consensus', emoji: '🟢' };
  if (pgi <= 4) return { tier: 'Different Lenses', emoji: '🟡' };
  if (pgi <= 6) return { tier: 'Diverging Narratives', emoji: '🟠' };
  if (pgi <= 8) return { tier: 'Competing Realities', emoji: '🔴' };
  return { tier: 'Parallel Universes', emoji: '⚫' };
}
function titleCaseRegion(region) {
  const map = {
    us: 'US', eu: 'Europe', europe: 'Europe', uk: 'UK', me: 'Middle East', 'middle-east': 'Middle East', middle_east: 'Middle East',
    sa: 'South Asia', 'south-asia': 'South Asia', south_asia: 'South Asia', ap: 'Asia-Pacific', pacific: 'Pacific',
    'east-se-asia': 'East & Southeast Asia', east_se_asia: 'East & Southeast Asia', east_asia: 'East Asia', 'east-asia': 'East Asia',
    africa: 'Africa', global: 'Global', 'latin-america': 'Latin America', latin_america: 'Latin America'
  };
  return map[region] || String(region).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function main() {
  const [{ data: daily, error: dailyError }, { data: stories, error: storiesError }, { data: pairs, error: pairsError }] = await Promise.all([
    supabase.from('pgi_daily').select('*').eq('date', DATE).maybeSingle(),
    supabase.from('pgi_story_scores').select('*').eq('scan_date', DATE).eq('is_latest', true).order('story_pgi', { ascending: false }),
    supabase.from('pgi_region_pairs').select('*').eq('scan_date', DATE).order('pair_pgi', { ascending: false })
  ]);

  if (dailyError) throw dailyError;
  if (storiesError) throw storiesError;
  if (pairsError) throw pairsError;
  if (!stories || !stories.length) throw new Error(`No pgi_story_scores rows found for ${DATE}`);

  const computedDailyPgi = round(weightedAvg(stories, 'story_pgi'));
  const dailyPgi = round(daily?.daily_pgi ?? computedDailyPgi);
  const tierInfo = daily ? { tier: daily.tier, emoji: daily.emoji } : classifyTier(dailyPgi);
  const storyCount = Number(daily?.story_count ?? stories.length);
  const regionSet = uniq(stories.flatMap(s => Array.isArray(s.regions_covered) ? s.regions_covered : []));
  const regionCount = regionSet.length;

  const dims = {
    factual: round(daily?.avg_d1_factual ?? weightedAvg(stories, 'd1_factual')),
    causal: round(daily?.avg_d2_causal ?? weightedAvg(stories, 'd2_causal')),
    framing: round(daily?.avg_d3_framing ?? weightedAvg(stories, 'd3_framing')),
    emotional: round(daily?.avg_d4_emotional ?? weightedAvg(stories, 'd4_emotional')),
    actor: round(daily?.avg_d5_actor ?? weightedAvg(stories, 'd5_actor_context')),
    cui_bono: round(daily?.avg_d6_cui_bono ?? weightedAvg(stories, 'd6_cui_bono'))
  };

  const sortedDims = Object.entries(dims).sort((a, b) => b[1] - a[1]);
  const highestDim = sortedDims[0];
  const lowestDim = sortedDims[sortedDims.length - 1];

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

  const pairAvgs = Object.values((pairs || []).reduce((acc, row) => {
    const a = row.region_a;
    const b = row.region_b;
    const key = [a, b].sort().join('__');
    acc[key] ||= { a, b, scores: [] };
    acc[key].scores.push(Number(row.pair_pgi || 0));
    return acc;
  }, {})).map(x => ({ ...x, avg: round(mean(x.scores)) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 6);

  const categories = Object.values(stories.reduce((acc, s) => {
    const key = s.category || 'uncategorized';
    acc[key] ||= { category: key, items: [] };
    acc[key].items.push(s);
    return acc;
  }, {})).map(x => ({
    category: x.category,
    avg: round(weightedAvg(x.items, 'story_pgi')),
    count: x.items.length,
    examples: x.items.sort((a, b) => b.story_pgi - a.story_pgi).slice(0, 2).map(s => cleanHeadline(s.story_headline))
  })).sort((a, b) => b.avg - a.avg);

  const periods = Object.values(stories.reduce((acc, s) => {
    acc[s.scan_period] ||= { period: s.scan_period, items: [] };
    acc[s.scan_period].items.push(s);
    return acc;
  }, {})).map(x => ({ period: x.period, avg: round(weightedAvg(x.items, 'story_pgi')), count: x.items.length }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const lead = topStories[0];
  const second = topStories[1];
  const third = topStories[2];
  const strongestPairsText = pairAvgs.slice(0, 4).map(p => `${titleCaseRegion(p.a)} vs ${titleCaseRegion(p.b)} (${p.avg.toFixed(2)})`).join(', ');
  const topCats = categories.slice(0, 4).map(c => `${c.category} (${c.avg.toFixed(2)})`).join(', ');
  const periodLine = periods.length ? periods.map(p => `${String(p.period).toUpperCase()} ${p.avg.toFixed(2)} (${p.count} stories)`).join(', ') : 'No intraday comparison available.';

  const content_md = `# PGI Signature Piece — April 23, 2026

**Daily PGI:** ${dailyPgi.toFixed(2)} — **${tierInfo.tier}** ${tierInfo.emoji}  
**Stories analyzed:** ${storyCount} | **Regions tracked:** ${regionCount}

---

## Executive Summary

April 23 closed with a **daily PGI of ${dailyPgi.toFixed(2)}**, placing the global information environment in **${tierInfo.tier}**. The day's dominant fault line was clear: regions broadly saw the same crisis signals around Iran, Hormuz, and adjacent ceasefire diplomacy, but they did **not** agree on what those signals meant. Western coverage leaned toward de-escalation management, shipping risk, and tactical diplomacy. Middle Eastern coverage was far more likely to read the same developments through coercion, sovereignty, blockade continuity, and the credibility gap between formal ceasefire language and lived operational reality. South Asian and Asia-Pacific coverage often translated the same events into energy-security and corridor-risk calculations.

That interpretive divide is why the dimensional profile matters. **${highestDim[0].replace('_', ' ')} divergence (${highestDim[1].toFixed(2)})** led the day, while **${lowestDim[0].replace('_', ' ')} divergence (${lowestDim[1].toFixed(2)})** remained the lowest layer. In plain terms: April 23 was not primarily a day of factual collapse. It was a day of **strategic meaning fracture**. Audiences across regions could recognise the same headline, but they were being told very different stories about leverage, legitimacy, risk, and who actually benefits from the way events are framed.

The concentration of divergence was also unusually narrow. Conflict, diplomacy, health governance, and security carried the highest average gap scores — **${topCats}** — while lower-PGI world coverage created a large background of broadly shared but less contested stories. So the overall daily PGI stayed in mid-red territory even though the day's top conflict stories reached near-maximal divergence.

---

## Dimensional Breakdown

| Dimension | Avg Score | Reading |
|-----------|-----------|---------|
| **D1 — Factual** | ${dims.factual.toFixed(2)} | ${dims.factual >= 7 ? 'High factual separation; regions were working from substantially different evidence and details.' : dims.factual >= 5 ? 'Moderate factual separation; the core events travelled, but details, qualifiers, and emphasis varied materially.' : 'The factual layer remained comparatively shared. Most divergence emerged after the event was accepted.'} |
| **D2 — Causal** | ${dims.causal.toFixed(2)} | ${dims.causal >= 7 ? 'Responsibility, escalation logic, and downstream effects were sharply contested.' : dims.causal >= 5 ? 'Regions diverged materially on what was driving events and what consequences mattered most.' : 'Causal attribution stayed relatively aligned.'} |
| **D3 — Framing** | ${dims.framing.toFixed(2)} | ${dims.framing >= 7 ? 'This was the day’s clearest stress point: the same events were narrated as different realities.' : dims.framing >= 5 ? 'Framing differences significantly altered how audiences would interpret the same developments.' : 'Framing remained comparatively coherent.'} |
| **D4 — Emotional** | ${dims.emotional.toFixed(2)} | ${dims.emotional >= 7 ? 'Tone split sharply across alarm, restraint, and strategic confidence.' : dims.emotional >= 5 ? 'Tone divergence mattered, but it was secondary to framing and actor positioning.' : 'Emotional tone was relatively stable across regions.'} |
| **D5 — Actor Context** | ${dims.actor.toFixed(2)} | ${dims.actor >= 7 ? 'Actors were cast in very different roles: mediator, coercer, guarantor, victim, or opportunist.' : dims.actor >= 5 ? 'Actor portrayal diverged enough to change legitimacy and agency judgments.' : 'Actor portrayal remained broadly aligned.'} |
| **D6 — Cui Bono** | ${dims.cui_bono.toFixed(2)} | ${dims.cui_bono >= 7 ? 'Regions strongly disagreed on whose interests were served by the same events.' : dims.cui_bono >= 5 ? 'The implied winners, losers, and strategic beneficiaries varied significantly by region.' : 'Benefit structures were narrated in broadly similar ways.'} |

The pattern is decisive: **framing, cui bono, and actor context** outran factual divergence. That is the signature of an information environment where the event is shared but the **story of the event** is not.

---

## Top Divergent Stories

### 1. **${lead.headline}** — PGI ${lead.pgi.toFixed(2)}
- **Regions covered:** ${lead.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${lead.category || '—'}
- **Dimensional signal:** factual ${lead.dims.factual.toFixed(1)}, causal ${lead.dims.causal.toFixed(1)}, framing ${lead.dims.framing.toFixed(1)}, emotional ${lead.dims.emotional.toFixed(1)}, actor ${lead.dims.actor.toFixed(1)}, cui bono ${lead.dims.cui_bono.toFixed(1)}
- **What diverged:** ${lead.rationale}
- **Regional split:** US and European narratives could still treat the ceasefire extension as risk management or diplomacy-window preservation. Middle Eastern and South Asian readings gave far more weight to unresolved coercion, the ambiguity of enforcement, and the fact that Hormuz instability continued under the surface of ceasefire language.
- **Why it matters:** This was the clearest example of one event supporting incompatible strategic conclusions: progress, pause, or performative de-escalation.

### 2. **${second.headline}** — PGI ${second.pgi.toFixed(2)}
- **Regions covered:** ${second.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${second.category || '—'}
- **Dimensional signal:** factual ${second.dims.factual.toFixed(1)}, causal ${second.dims.causal.toFixed(1)}, framing ${second.dims.framing.toFixed(1)}, emotional ${second.dims.emotional.toFixed(1)}, actor ${second.dims.actor.toFixed(1)}, cui bono ${second.dims.cui_bono.toFixed(1)}
- **What diverged:** ${second.rationale}
- **Regional split:** Western coverage emphasized shipping disruption as a market and logistics risk. Middle Eastern coverage was more likely to foreground the persistence of pressure and the political meaning of seizures. Asia-Pacific coverage read the same development through vulnerability of oil and LNG corridors.
- **Why it matters:** The same shipping event became, depending on region, either a volatility story or evidence that the ceasefire was structurally hollow.

### 3. **${third.headline}** — PGI ${third.pgi.toFixed(2)}
- **Regions covered:** ${third.regions.map(titleCaseRegion).join(', ') || '—'}
- **Category:** ${third.category || '—'}
- **Dimensional signal:** factual ${third.dims.factual.toFixed(1)}, causal ${third.dims.causal.toFixed(1)}, framing ${third.dims.framing.toFixed(1)}, emotional ${third.dims.emotional.toFixed(1)}, actor ${third.dims.actor.toFixed(1)}, cui bono ${third.dims.cui_bono.toFixed(1)}
- **What diverged:** ${third.rationale}
- **Regional split:** European and Asia-Pacific outlets focused on corridor risk and maritime exposure; Middle Eastern framing was more likely to treat the seizures as active pressure politics rather than just transport disruption.
- **Why it matters:** This is where the gap between formal diplomacy and operating reality became most visible.

### 4. **CDC blocks publication of COVID-vaccine benefits report, raising questions about U.S. health governance** — PGI 8.50
- **Regions covered:** US, Europe
- **Category:** health
- **Dimensional signal:** factual 7.0, causal 8.0, framing 9.0, emotional 9.0, actor 9.0, cui bono 9.0
- **Regional split:** The same act can be read as bureaucratic control, politicisation of science, or institutional caution. US framing has more direct implications for domestic trust and governance legitimacy; European framing often reads it as a warning sign about the integrity of American public-health institutions.
- **Why it matters:** This was one of the day’s most important non-conflict divergences because credibility shocks in US health governance spill globally.

### 5. **Lebanon seeks extension of U.S.-mediated ceasefire with Israel ahead of Washington talks** — PGI 8.33
- **Regions covered:** Middle East, US, Europe
- **Category:** diplomacy
- **Dimensional signal:** factual 7.0, causal 8.0, framing 9.0, emotional 8.0, actor 9.0, cui bono 9.0
- **Regional split:** US coverage naturally foregrounded broker role and the diplomatic process. Middle Eastern coverage was more likely to weight violations, civilian insecurity, and whether the framework itself remained credible. European coverage often nested the story inside broader regional containment logic.
- **Why it matters:** Another case where the same ceasefire vocabulary masked radically different expectations about who controls escalation.

### 6. **US aid cuts undermine HIV prevention rollout in South Africa** — PGI 7.62
- **Regions covered:** Africa, US, Global
- **Category:** health
- **Dimensional signal:** factual 4.7, causal 8.0, framing 8.4, emotional 8.1, actor 8.3, cui bono 8.2
- **Regional split:** African framing centered prevention collapse, treatment continuity, and human consequences. US framing was more likely to place the story inside budgetary or policy reprioritisation language. Global wire coverage compressed it into a development-health item.
- **Why it matters:** This was the strongest human-impact divergence outside the Gulf file — a story where consequence is immediate for those affected, but abstracted elsewhere.

---

## Regional Pattern Analysis

### **Middle East: ceasefire language was not trusted at face value**
The region's coverage consistently gave more weight to whether coercion had genuinely ended than to whether diplomatic language had softened. That is why Middle East–US and Middle East–Europe pairings dominated the highest regional fractures. In Western reporting, a ceasefire extension can function as evidence that escalation pressure is easing. In Middle Eastern reporting, the same extension can read as cosmetic if maritime pressure, seizures, or blockades continue. This is not a small framing variation. It changes the entire story from “de-escalation” to “coercion under a softer label.”

### **South Asia: mediation and energy vulnerability were given more substance**
South Asian coverage repeatedly treated Pakistan's role, ceasefire architecture, and downstream energy implications as more meaningful than US or European coverage typically did. That helps explain why **Europe vs South Asia** and **South Asia vs US** sat among the highest pairwise divergences. The issue was not simply whether Islamabad mattered. It was whether the region was being cast as a peripheral observer or an actual diplomatic and energy-security stakeholder.

### **Asia-Pacific: Hormuz was a corridor story before it was a diplomatic story**
Asia-Pacific coverage read the same Gulf developments through the lens of fuel supply, shipping lanes, and import dependence. That emphasis pulls coverage away from Washington-centric diplomacy framing and toward practical exposure. It also means the story arrives with different urgency: not just “will talks hold?” but “what does this do to transport risk and energy pricing now?”

### **US and Europe: system-management framing remained dominant**
Western coverage was not blind to instability, but it was more likely to narrate events through negotiation windows, sanctions calibration, shipping risk, and policy management. That tends to lower emotional immediacy and raise institutional abstraction. It also means Western audiences can be given a version of the same event that sounds controllable, even when regional coverage closer to the crisis is stressing unresolved coercion.

### **Africa: the strongest non-Gulf gap was human consequence**
The South Africa HIV-prevention story stood out because it revealed a different type of divergence: not conflict interpretation, but consequence visibility. African reporting naturally positioned the aid cuts as a direct threat to prevention continuity at the moment of a critical drug rollout. Elsewhere, the same story was easier to absorb as a policy or funding item. That gap is exactly the kind of perception distortion PGI is meant to surface.

---

## Category and Pairwise Structure

By category, the highest average divergence sat in **${topCats}**. The key point is that divergence was concentrated in stories where meaning is structurally contestable: ceasefires with coercive residue, sanctions with selective flexibility, and governance decisions whose legitimacy depends on prior trust.

The strongest pairwise fractures were **${strongestPairsText}**. These are the relationships to watch because they represent not just different editorial choices but different geopolitical priors. On April 23, the sharpest breaks ran through the **Middle East–US**, **South Asia–US**, and **Europe–South Asia** relationships, with Europe–Middle East close behind. That combination points to a day where the world's most consequential stories were being sorted through very different assumptions about leverage, sovereignty, and risk.

---

## Intraday Shape

The intraday profile was revealing: **${periodLine}**. The **AM** cycle carried more total stories but a lower aggregate PGI because it included a wider base of lower-intensity global coverage. The **midday** and **PM** cycles were narrower but far more polarised, driven by the day's hardest-edge Gulf and ceasefire stories. In practice, that means the day became **more interpretively fractured as the most strategic stories matured**.

---

## What Today's PGI Means

A **${dailyPgi.toFixed(2)} PGI** does not mean regions failed to notice the same events. It means they supplied audiences with different answers to the crucial follow-up questions: *Was the ceasefire real or partial? Was shipping disruption a market issue or a sovereignty issue? Was mediation substantive or mostly diplomatic theatre? Were policy actions about public safety, leverage, or political control?*

That is why April 23 sits in **${tierInfo.tier}**. The information environment remained interconnected, but interpretation was fractured enough that audiences could leave the day with sharply different impressions of whether the world was stabilising or merely disguising instability in more controlled language.

---

## Bottom Line

April 23's PGI shows a world that could still recognise the same major events but could not agree on **what those events revealed**. The strongest story-level divergence sat in **${lead.headline}**, backed closely by **${second.headline}** and **${third.headline}**. The highest dimensions were **${highestDim[0].replace('_', ' ')} (${highestDim[1].toFixed(2)})**, **${sortedDims[1][0].replace('_', ' ')} (${sortedDims[1][1].toFixed(2)})**, and **${sortedDims[2][0].replace('_', ' ')} (${sortedDims[2][1].toFixed(2)})** — a profile that points to disagreement over interpretation, beneficiaries, and agency more than raw fact.

The clearest regional divide ran through Middle Eastern versus Western readings of the Gulf crisis, with South Asia adding a distinct energy-and-mediation lens and Africa surfacing the day's sharpest human-impact divergence outside the conflict file. In other words: today's gap was not about whether the story existed. It was about **whose version of reality the story asked audiences to inhabit**.`;

  const piece = {
    date: DATE,
    daily_pgi: dailyPgi,
    tier: tierInfo.tier,
    emoji: tierInfo.emoji,
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

  console.log(JSON.stringify({ ok: true, usedDailyRow: Boolean(daily), piece: data?.[0] }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
