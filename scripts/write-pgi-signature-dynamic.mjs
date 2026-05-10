#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function readEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}
const APP = process.cwd();
const ROOT = path.resolve(APP, '..');
const env = { ...readEnv(path.join(APP, '.env.local')), ...readEnv(path.join(ROOT, '.env.credentials')), ...process.env };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
const outDir = path.join(ROOT, 'memory/pgi/signature-pieces');
fs.mkdirSync(outDir, { recursive: true });

function nzDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
function round2(n) { return Math.round(Number(n || 0) * 100) / 100; }
function avg(items, key) { return items.length ? round2(items.reduce((s, x) => s + Number(x[key] || 0), 0) / items.length) : 0; }
function wordCount(text) { return text.replace(/[#*_`>|-]/g, ' ').trim().split(/\s+/).filter(Boolean).length; }
function tierForPgi(pgi) {
  if (pgi <= 2) return { tier: 'Global Consensus', emoji: '🟢' };
  if (pgi <= 4) return { tier: 'Different Lenses', emoji: '🟡' };
  if (pgi <= 6) return { tier: 'Diverging Narratives', emoji: '🟠' };
  if (pgi <= 8) return { tier: 'Competing Realities', emoji: '🔴' };
  return { tier: 'Parallel Universes', emoji: '⚫' };
}

const date = process.argv[2] || nzDate();
const out = path.join(outDir, `${date}.md`);
if (!supabaseUrl || !supabaseKey) {
  fs.writeFileSync(out, `# PGI Signature Piece — ${date}\n\nSkipped: Supabase service credentials unavailable.\n`);
  console.log(JSON.stringify({ ok: true, status: 'skipped_no_credentials', date, out }, null, 2));
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const [{ data: daily, error: dailyError }, { data: stories, error: storiesError }, { data: pairs, error: pairsError }] = await Promise.all([
  supabase.from('pgi_daily').select('*').eq('date', date).maybeSingle(),
  supabase.from('pgi_story_scores').select('*').eq('scan_date', date).eq('is_latest', true).order('story_pgi', { ascending: false }),
  supabase.from('pgi_region_pairs').select('*').eq('scan_date', date),
]);
if (dailyError || storiesError || pairsError) throw (dailyError || storiesError || pairsError);
if (!daily || !stories?.length) {
  fs.writeFileSync(out, `# PGI Signature Piece — ${date}\n\nSkipped: PGI daily/story rows are not ready yet for ${date}.\n`);
  console.log(JSON.stringify({ ok: true, status: 'skipped_no_data', date, out }, null, 2));
  process.exit(0);
}

const pgi = round2(daily.daily_pgi);
const { tier, emoji } = tierForPgi(pgi);
const dims = {
  factual: avg(stories, 'd1_factual'), causal: avg(stories, 'd2_causal'), framing: avg(stories, 'd3_framing'),
  emotional: avg(stories, 'd4_emotional'), actor: avg(stories, 'd5_actor_context'), cuiBono: avg(stories, 'd6_cui_bono'),
};
const regions = [...new Set(stories.flatMap((s) => s.regions_covered || []))].sort();
const topStories = stories.slice(0, 10).map((story) => ({
  slug: story.story_slug, headline: story.story_headline, pgi: round2(story.story_pgi), category: story.category, regions: story.regions_covered || [],
}));
const pairMap = new Map();
for (const pair of pairs || []) {
  const key = [pair.region_a, pair.region_b].sort().join(' ↔ ');
  const cur = pairMap.get(key) || { pair: key, total: 0, count: 0, max: 0 };
  cur.total += Number(pair.pair_pgi || 0); cur.count += 1; cur.max = Math.max(cur.max, Number(pair.pair_pgi || 0));
  pairMap.set(key, cur);
}
const recurringPairs = [...pairMap.values()].map((p) => ({ ...p, avg: round2(p.total / p.count), max: round2(p.max) })).sort((a, b) => b.avg - a.avg).slice(0, 8);
const categoryMap = new Map();
for (const story of stories) categoryMap.set(story.category || 'uncategorised', [...(categoryMap.get(story.category || 'uncategorised') || []), Number(story.story_pgi || 0)]);
const categories = [...categoryMap.entries()].map(([category, values]) => ({ category, count: values.length, avg: round2(values.reduce((a,b)=>a+b,0)/values.length) })).sort((a,b)=>b.avg-a.avg);

const contentMd = `# PGI Signature Piece — ${date}

**Daily PGI:** ${pgi.toFixed(2)} — **${tier}** ${emoji}  
**Stories analyzed:** ${stories.length} | **Regions tracked:** ${regions.length}

## Executive summary

Today's PGI field sits at **${pgi.toFixed(2)}**, which places the day in **${tier}**. The important signal is not only the score; it is where the disagreement concentrates. The strongest gaps appear when coverage moves from shared facts into causality, framing, emotional tone, actor responsibility, and who benefits from a given interpretation.

The top divergent stories show where global publics are least likely to receive the same picture. In these files, regions may agree on the broad event while disagreeing over whether it represents escalation, restraint, institutional failure, strategic leverage, human cost, or missing context.

## Dimensional profile

| Dimension | Avg score |
|---|---:|
| Factual divergence | ${dims.factual.toFixed(2)} |
| Causal divergence | ${dims.causal.toFixed(2)} |
| Framing divergence | ${dims.framing.toFixed(2)} |
| Emotional divergence | ${dims.emotional.toFixed(2)} |
| Actor/context divergence | ${dims.actor.toFixed(2)} |
| Cui bono divergence | ${dims.cuiBono.toFixed(2)} |

## Top divergent stories

${topStories.map((story, i) => `### ${i + 1}. ${story.headline || story.slug}\n- **PGI:** ${story.pgi.toFixed(2)}\n- **Category:** ${story.category || 'uncategorised'}\n- **Regions:** ${story.regions.join(', ') || 'not specified'}\n- **Reading:** This story should be checked for differences in causality, responsibility, consequence, and missing local context.`).join('\n\n')}

## Regional pair pressure

${recurringPairs.length ? recurringPairs.map((p) => `- **${p.pair}:** avg ${p.avg.toFixed(2)} across ${p.count} story pairings; max ${p.max.toFixed(2)}.`).join('\n') : '- No recurring regional pair data available.'}

## Category pressure

${categories.map((c) => `- **${c.category}:** avg ${c.avg.toFixed(2)} across ${c.count} stories.`).join('\n')}

## Editorial note

This piece is generated from PGI scoring data and should be treated as an inspectable daily signal, not a claim of absolute truth. Strong PGI means coverage differs in framing and interpretation; it does not by itself prove which frame is correct.
`;
fs.writeFileSync(out, contentMd);

const row = {
  date,
  daily_pgi: pgi,
  tier,
  emoji,
  author: 'Albis Scanner',
  content_md: contentMd,
  word_count: wordCount(contentMd),
  top_stories: topStories,
  avg_d1_factual: dims.factual,
  avg_d2_causal: dims.causal,
  avg_d3_framing: dims.framing,
  avg_d4_emotional: dims.emotional,
  avg_d5_actor: dims.actor,
  avg_d6_cui_bono: dims.cuiBono,
  story_count: stories.length,
  region_count: regions.length,
  methodology_version: '2.0',
  updated_at: new Date().toISOString(),
};
const { data: existing, error: existingError } = await supabase.from('pgi_signature_pieces').select('id').eq('date', date).maybeSingle();
if (existingError) throw existingError;
const write = existing?.id
  ? await supabase.from('pgi_signature_pieces').update(row).eq('id', existing.id)
  : await supabase.from('pgi_signature_pieces').insert(row);
if (write.error) throw write.error;
console.log(JSON.stringify({ ok: true, status: existing?.id ? 'updated' : 'inserted', date, daily_pgi: pgi, stories: stories.length, out }, null, 2));
