import fs from 'fs';
import path from 'path';

for (const envPath of ['../.env.local', '../../.env.credentials']) {
  const abs = new URL(envPath, import.meta.url);
  if (!fs.existsSync(abs)) continue;
  for (const line of fs.readFileSync(abs, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

import { createAdminClient } from '../src/lib/supabase/admin.ts';

const SCAN_PATH = process.argv[2];
if (!SCAN_PATH) throw new Error('Usage: node scripts/score-midday-scan.mjs <scan-file>');

const REGION_CODE = {
  us: 'us',
  europe: 'eu',
  'middle-east': 'me',
  africa: 'af',
  'latin-america': 'la',
  pacific: 'pc',
  'south-asia': 'sa',
  'east-se-asia': 'ap',
  global: 'gl',
  'central-asia': 'ca',
  canada: 'ca_na',
};

const ALL_REGIONS = ['us','europe','middle-east','africa','latin-america','pacific','south-asia','east-se-asia','global','central-asia'];
const SIGNIFICANCE_VALUE = { low: 1, medium: 2, high: 3, critical: 5 };
const CATEGORY_PGI_BOOST = {
  conflict: 0.9, geopolitics: 0.8, sanctions: 0.7, migration: 0.7, legal: 0.7,
  governance: 0.6, diplomacy: 0.5, trade: 0.5, health: 0.4, 'tech-ai': 0.5,
  'economic-flows': 0.6, climate: 0.3, economic: 0.2, science: -0.8, security: 0.6,
  energy: 0.5, social: 0.5,
};

function clamp(n, min=1, max=10) { return Math.max(min, Math.min(max, n)); }
function round1(n) { return Math.round(n * 10) / 10; }
function avg(arr) { return arr.reduce((a,b)=>a+b,0) / arr.length; }
function slugify(s) {
  return String(s).toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
}
function parseScan(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const m = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!m) throw new Error('Could not locate JSON block in scan file');
  return JSON.parse(m[1]);
}
function inferMeta(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  const m = base.match(/(\d{4}-\d{2}-\d{2})-(am|midday|pm)$/);
  if (!m) throw new Error(`Could not infer scan_date/scan_period from ${base}`);
  return { scan_date: m[1], scan_period: m[2] };
}
function normalizeRegionsFound(item) {
  const found = (item.regions_found || []).map(r => r.toLowerCase());
  return [...new Set(found)];
}
function normalizeRegionsAbsent(item, found) {
  const absent = item.regions_absent?.length ? item.regions_absent.map(r => r.toLowerCase()) : ALL_REGIONS.filter(r => !found.includes(r));
  return [...new Set(absent.filter(r => !found.includes(r)))];
}
function pgiDimensions(item, found) {
  const base = clamp((Number(item.perception_gap) || 5) + (CATEGORY_PGI_BOOST[item.category] || 0), 1, 10);
  const patterns = new Set((item.patterns || []).map(p => p.toLowerCase()));
  const factual = clamp(base - 0.7 + (patterns.has('consensus') ? -0.4 : 0) + (patterns.has('omission') ? 0.2 : 0));
  const causal = clamp(base + (patterns.has('divergence') ? 0.4 : 0) + (['sanctions','geopolitics','governance','trade'].includes(item.category) ? 0.4 : 0));
  const framing = clamp(base + (patterns.has('framing') ? 1.0 : 0.5) + (patterns.has('divergence') ? 0.4 : 0));
  const emotional = clamp(base + (['conflict','migration','social','health'].includes(item.category) ? 0.5 : 0) + (patterns.has('de-escalation') ? -0.2 : 0));
  const actor = clamp(base + (['diplomacy','governance','geopolitics','legal','sanctions'].includes(item.category) ? 0.5 : 0));
  const cui = clamp(base + (['sanctions','trade','economic-flows','tech-ai','energy'].includes(item.category) ? 0.7 : 0.2) + (patterns.has('omission') ? 0.4 : 0));
  const story_pgi = round1(avg([factual, causal, framing, emotional, actor, cui]));
  const regions_covered = found.map(r => REGION_CODE[r] || r).filter(Boolean);
  return { base, story_pgi, regions_covered, d1_factual: round1(factual), d2_causal: round1(causal), d3_framing: round1(framing), d4_emotional: round1(emotional), d5_actor_context: round1(actor), d6_cui_bono: round1(cui) };
}
function pairAdjustment(a,b) {
  const key = [a,b].sort().join('|');
  const table = {
    'ap|us': 1.0, 'eu|me': 1.0, 'me|us': 1.2, 'af|us': 0.9, 'af|eu': 0.8,
    'la|us': 0.7, 'ap|eu': 0.7, 'sa|us': 0.8, 'sa|eu': 0.8, 'me|eu': 1.0,
    'gl|us': 0.4, 'eu|us': 0.5, 'gl|eu': 0.3, 'gl|me': 0.5, 'gl|ap': 0.4,
    'gl|sa': 0.4, 'gl|af': 0.5, 'gl|la': 0.5, 'ap|me': 0.9, 'ap|sa': 0.6,
    'la|eu': 0.5, 'la|me': 0.8, 'pc|us': 0.5, 'pc|eu': 0.6, 'pc|ap': 0.5,
  };
  return table[key] ?? 0.6;
}
function buildPairs(storyScoreId, scan_date, story_pgi, regions_covered) {
  const pairs = [];
  for (let i = 0; i < regions_covered.length; i++) {
    for (let j = i + 1; j < regions_covered.length; j++) {
      const region_a = [regions_covered[i], regions_covered[j]].sort()[0];
      const region_b = [regions_covered[i], regions_covered[j]].sort()[1];
      pairs.push({
        story_score_id: storyScoreId,
        region_a,
        region_b,
        pair_pgi: round1(clamp(story_pgi + pairAdjustment(region_a, region_b), 1, 10)),
        scan_date,
      });
    }
  }
  return pairs;
}
function gaiDimensions(item, found, absent) {
  const nonGlobalFound = found.filter(r => r !== 'global').length;
  const missingHeavy = ['us','europe','east-se-asia','south-asia','middle-east'].filter(r => absent.includes(r)).length;
  const patterns = new Set((item.patterns || []).map(p => p.toLowerCase()));
  const significance = String(item.significance || 'medium').toLowerCase();
  const d1 = clamp(10 - nonGlobalFound - (found.includes('global') ? 1 : 0), 1, 10);
  const d2 = clamp(d1 + (patterns.has('omission') ? 1.0 : 0.4) + (patterns.has('divergence') ? 0.5 : 0));
  const d3 = clamp(4.5 + missingHeavy * 1.1 + (absent.includes('latin-america') ? 0.4 : 0) + (absent.includes('africa') ? 0.4 : 0), 1, 10);
  const d4Base = significance === 'critical' ? 9.5 : significance === 'high' ? 8.3 : significance === 'medium' ? 7.1 : 5.6;
  const d4 = clamp(d4Base + (patterns.has('omission') ? 0.3 : 0));
  const story_gai = round1(avg([d1,d2,d3,d4]));
  return { coverage_breadth: nonGlobalFound + (found.includes('global') ? 1 : 0), d1_coverage_breadth: round1(d1), d2_prominence_disparity: round1(d2), d3_population_exposure: round1(d3), d4_significance_severity: round1(d4), story_gai };
}
function rationale(item, pgi, gai, absent) {
  const headline = item.headline;
  const missing = absent.slice(0,3).join(', ') || 'few regions';
  return `${headline} shows ${pgi.story_pgi >= 7 ? 'clear cross-region framing divergence' : pgi.story_pgi >= 5 ? 'meaningful framing variation' : 'limited framing divergence'}, while visibility remains ${gai.story_gai >= 8 ? 'narrow relative to significance' : gai.story_gai >= 6 ? 'uneven across regions' : 'fairly broad'}. Biggest attention gaps: ${missing}.`;
}

const items = parseScan(SCAN_PATH);
const { scan_date, scan_period } = inferMeta(SCAN_PATH);
const supabase = createAdminClient();

const scored = items.map((item) => {
  const found = normalizeRegionsFound(item);
  const absent = normalizeRegionsAbsent(item, found);
  const pgi = pgiDimensions(item, found);
  const gai = gaiDimensions(item, found, absent);
  const significance = SIGNIFICANCE_VALUE[String(item.significance || 'medium').toLowerCase()] || 2;
  const story_slug = slugify(item.headline);
  const scoring_rationale = rationale(item, pgi, gai, absent);
  return {
    story_slug,
    story_headline: item.headline,
    category: item.category,
    significance: significance,
    significance_label: item.significance,
    regions_found: found,
    regions_absent: absent,
    regions_covered: pgi.regions_covered,
    ...pgi,
    ...gai,
    scoring_rationale,
  };
});

const pgiRows = scored.map((s) => ({
  scan_date, scan_period, story_slug: s.story_slug, story_headline: s.story_headline, category: s.category,
  regions_covered: s.regions_covered, region_count: s.regions_covered.length,
  d1_factual: s.d1_factual, d2_causal: s.d2_causal, d3_framing: s.d3_framing, d4_emotional: s.d4_emotional,
  d5_actor_context: s.d5_actor_context, d6_cui_bono: s.d6_cui_bono,
  significance: s.significance, scoring_rationale: s.scoring_rationale, is_latest: true,
}));

const gaiRows = scored.map((s) => ({
  scan_date, scan_period, story_slug: s.story_slug, story_headline: s.story_headline, category: s.category,
  regions_found: s.regions_found, regions_absent: s.regions_absent, coverage_breadth: s.coverage_breadth,
  d1_coverage_breadth: s.d1_coverage_breadth, d2_prominence_disparity: s.d2_prominence_disparity,
  d3_population_exposure: s.d3_population_exposure, d4_significance_severity: s.d4_significance_severity,
  story_gai: s.story_gai, significance: s.significance, scoring_rationale: s.scoring_rationale, is_latest: true,
}));

const { error: pgiError } = await supabase.from('pgi_story_scores').upsert(pgiRows, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });
if (pgiError) throw pgiError;

const { data: insertedPgi, error: fetchError } = await supabase
  .from('pgi_story_scores')
  .select('id, story_slug, story_pgi, regions_covered')
  .eq('scan_date', scan_date)
  .eq('scan_period', scan_period)
  .in('story_slug', scored.map(s => s.story_slug));
if (fetchError) throw fetchError;

const pgiIdBySlug = new Map(insertedPgi.map(r => [r.story_slug, r]));
const pairRows = [];
for (const s of scored) {
  const row = pgiIdBySlug.get(s.story_slug);
  if (!row) continue;
  pairRows.push(...buildPairs(row.id, scan_date, Number(row.story_pgi || s.story_pgi), row.regions_covered || s.regions_covered));
}
if (pairRows.length) {
  const { error: pairError } = await supabase.from('pgi_region_pairs').upsert(pairRows, { onConflict: 'story_score_id,region_a,region_b', ignoreDuplicates: false });
  if (pairError) throw pairError;
}

const { error: gaiError } = await supabase.from('gai_story_scores').upsert(gaiRows, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });
if (gaiError) throw gaiError;

const output = { scanDate: scan_date, scanPeriod: scan_period, stories: scored.length, pgiCount: pgiRows.length, pairCount: pairRows.length, gaiCount: gaiRows.length, scored };
const outPath = SCAN_PATH.replace(/\.md$/, '-scores.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(JSON.stringify({ ok: true, outPath, stories: scored.length, pairs: pairRows.length }, null, 2));
