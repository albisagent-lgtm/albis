import fs from 'fs';
import path from 'path';
import { createAdminClient } from '../src/lib/supabase/admin';

function loadSimpleEnv(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadSimpleEnv(path.resolve(process.cwd(), '.env.local'));

const REGION_NAMES: Record<string, string> = {
  us: 'us',
  eu: 'eu',
  me: 'me',
  sa: 'sa',
  ap: 'ap',
  la: 'la',
  af: 'af',
  ru: 'ru',
};

const REGION_DISTANCE: Record<string, number> = {
  'me|us': 0.4,
  'me|eu': 0.1,
  'me|ap': 0.1,
  'me|la': 0.3,
  'me|af': 0.2,
  'me|sa': 0.3,
  'us|eu': -0.2,
  'us|ap': 0.2,
  'us|la': 0.25,
  'us|af': 0.35,
  'us|sa': 0.3,
  'eu|ap': 0.15,
  'eu|la': 0.05,
  'eu|af': 0.2,
  'eu|sa': 0.2,
  'ap|la': 0.15,
  'ap|af': 0.3,
  'ap|sa': 0.15,
  'la|af': 0.2,
  'la|sa': 0.15,
  'af|sa': 0.1,
  'eu|ru': 0.2,
  'me|ru': 0.25,
  'ru|us': 0.3,
};

function clamp(n: number, min = 1, max = 10) {
  return Math.max(min, Math.min(max, Number(n.toFixed(1))));
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function parseRegionsFound(line: string) {
  const match = line.match(/\[regions_found:\s*([^\]]+)\]/i);
  if (!match) return [] as string[];
  return match[1].split(',').map((s) => s.trim()).filter(Boolean);
}

function parseRegionsAbsent(line: string) {
  const match = line.match(/!\[([^\]]+)\]/);
  if (!match) return [] as string[];
  return match[1].split(',').map((s) => s.trim()).filter(Boolean);
}

function parseBasePgi(line: string) {
  const match = line.match(/\|\s*PGI:(\d+(?:\.\d+)?)\s*\|/i);
  return match ? Number(match[1]) : 5;
}

function parseSignificance(line: string) {
  const match = line.match(/\|\s*(critical|high|medium|low)\s*\|/i);
  return (match?.[1]?.toLowerCase() || 'medium') as 'critical'|'high'|'medium'|'low';
}

function significanceToNumeric(sig: string) {
  if (sig === 'critical') return 4;
  if (sig === 'high') return 3;
  if (sig === 'medium') return 2;
  return 1;
}

function parseHeadline(line: string) {
  return line.replace(/^[-*]\s*/, '').split('|')[0].trim();
}

function parseCategory(line: string) {
  const parts = line.split('|').map((s) => s.trim());
  return parts[1] || 'world';
}

function scorePgiDimensions(headline: string, basePgi: number, regionsFound: string[], significance: string) {
  const regionCount = regionsFound.length;
  const scarcityBoost = regionCount <= 2 ? 0.5 : regionCount === 3 ? 0.2 : 0;
  const sigBoost = significance === 'critical' ? 0.2 : significance === 'high' ? 0.1 : 0;
  const h = headline.toLowerCase();
  const techBoost = /(ai|chip|cloud|data-center|hbm|compute)/.test(h) ? 0.2 : 0;
  const humanBoost = /(hungry|malaria|hiv|drought|flood|heat|youth|inflation|food|farm|kitchens)/.test(h) ? 0.2 : 0;

  const d1 = clamp(basePgi - 0.4 + scarcityBoost * 0.2);
  const d2 = clamp(basePgi - 0.1 + scarcityBoost * 0.2 + sigBoost);
  const d3 = clamp(basePgi + 0.3 + techBoost * 0.3 + humanBoost * 0.2);
  const d4 = clamp(basePgi + 0.1 + humanBoost + (significance === 'critical' ? 0.3 : 0));
  const d5 = clamp(basePgi - 0.1 + techBoost * 0.2 + humanBoost * 0.1);
  const d6 = clamp(basePgi + 0.2 + sigBoost + humanBoost * 0.1);

  return { d1_factual: d1, d2_causal: d2, d3_framing: d3, d4_emotional: d4, d5_actor_context: d5, d6_cui_bono: d6 };
}

function average(values: number[]) {
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}

function scoreGai(regionsFound: string[], significance: string, headline: string) {
  const totalRegions = 7;
  const covered = regionsFound.length;
  const missing = totalRegions - covered;
  const breadth = clamp((missing / (totalRegions - 1)) * 9 + 1);
  const significanceSeverity = clamp(
    significance === 'critical' ? 9.2 : significance === 'high' ? 8.3 : significance === 'medium' ? 7.1 : 5.6
  );

  const h = headline.toLowerCase();
  let prominence = 4 + missing * 0.9;
  let population = 4 + missing * 0.8;

  if (covered <= 2) {
    prominence += 0.7;
    population += 0.7;
  }
  if (/(india|indian|south america|mexico|arab|sahel|uk youth|southwest us)/.test(h)) {
    population += 0.4;
  }
  if (/(malaria|hiv|hungry|drought|flood|heat|food|farm|inflation|kitchens)/.test(h)) {
    prominence += 0.2;
  }

  const d2 = clamp(prominence);
  const d3 = clamp(population);
  const story_gai = average([breadth, d2, d3, significanceSeverity]);

  return {
    coverage_breadth: breadth,
    d1_coverage_breadth: breadth,
    d2_prominence_disparity: d2,
    d3_population_exposure: d3,
    d4_significance_severity: significanceSeverity,
    story_gai,
  };
}

function scorePairs(storyPgi: number, regionsFound: string[]) {
  const pairs: Record<string, number> = {};
  for (let i = 0; i < regionsFound.length; i++) {
    for (let j = i + 1; j < regionsFound.length; j++) {
      const [a, b] = [regionsFound[i], regionsFound[j]].sort();
      const key = `${a}|${b}`;
      const distance = REGION_DISTANCE[key] ?? 0.15;
      pairs[key] = clamp(storyPgi + distance);
    }
  }
  return pairs;
}

function parseScan(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const storyLines = lines.filter((line) => line.startsWith('- '));

  return storyLines.map((line) => {
    const story_headline = parseHeadline(line);
    const category = parseCategory(line);
    const regions_found = parseRegionsFound(line);
    const regions_absent = parseRegionsAbsent(line);
    const basePgi = parseBasePgi(line);
    const significance = parseSignificance(line);
    const dims = scorePgiDimensions(story_headline, basePgi, regions_found, significance);
    const story_pgi = average(Object.values(dims));
    const gai = scoreGai(regions_found, significance, story_headline);
    const pair_pgi = scorePairs(story_pgi, regions_found);

    return {
      story_slug: slugify(story_headline),
      story_headline,
      category,
      regions_found,
      regions_absent,
      significance: significanceToNumeric(significance),
      significance_label: significance,
      story_pgi,
      dimensions: dims,
      story_gai: gai.story_gai,
      gai_dimensions: gai,
      pair_pgi,
      scoring_rationale: `${significance.toUpperCase()} significance; ${regions_found.length}/7 regions covered. PGI anchored to scan base ${basePgi} then adjusted for framing divergence, human-impact localisation, and regional spread. GAI weighted toward missed-region breadth, prominence disparity, population exposure, and real-world severity.`,
    };
  });
}

async function main() {
  const scanPath = process.argv[2] || path.resolve(process.cwd(), '../memory/scans/2026-04-08-am.md');
  const filename = path.basename(scanPath);
  const match = filename.match(/(\d{4}-\d{2}-\d{2})-(am|midday|pm)\.md$/);
  if (!match) throw new Error(`Could not parse scan date/period from ${filename}`);
  const [, scan_date, scan_period] = match;

  const stories = parseScan(scanPath);
  const supabase = createAdminClient();

  const pgiRows = stories.map((story) => ({
    story_slug: story.story_slug,
    story_headline: story.story_headline,
    category: story.category,
    regions_covered: story.regions_found,
    region_count: story.regions_found.length,
    d1_factual: story.dimensions.d1_factual,
    d2_causal: story.dimensions.d2_causal,
    d3_framing: story.dimensions.d3_framing,
    d4_emotional: story.dimensions.d4_emotional,
    d5_actor_context: story.dimensions.d5_actor_context,
    d6_cui_bono: story.dimensions.d6_cui_bono,
    significance: story.significance,
    scoring_rationale: story.scoring_rationale,
    scan_date,
    scan_period,
    is_latest: true,
  }));

  const gaiRows = stories.map((story) => ({
    scan_date,
    scan_period,
    story_slug: story.story_slug,
    story_headline: story.story_headline,
    category: story.category,
    regions_found: story.regions_found,
    regions_absent: story.regions_absent,
    region_count: story.regions_found.length,
    total_regions: 7,
    coverage_breadth: story.gai_dimensions.coverage_breadth,
    d1_coverage_breadth: story.gai_dimensions.d1_coverage_breadth,
    d2_prominence_disparity: story.gai_dimensions.d2_prominence_disparity,
    d3_population_exposure: story.gai_dimensions.d3_population_exposure,
    d4_significance_severity: story.gai_dimensions.d4_significance_severity,
    significance: story.significance,
    scoring_rationale: story.scoring_rationale,
    is_latest: true,
  }));

  const { data: insertedPgi, error: pgiError } = await supabase
    .from('pgi_story_scores')
    .upsert(pgiRows, { onConflict: 'story_slug,scan_date,scan_period', ignoreDuplicates: false })
    .select('id, story_slug');

  if (pgiError) throw pgiError;

  const pgiIdBySlug = new Map((insertedPgi || []).map((row: any) => [row.story_slug, row.id]));
  const pairRows = stories.flatMap((story) => {
    const story_score_id = pgiIdBySlug.get(story.story_slug);
    if (!story_score_id) return [];
    return Object.entries(story.pair_pgi).map(([pairKey, pair_pgi]) => {
      const [region_a, region_b] = pairKey.split('|').sort();
      return { story_score_id, region_a, region_b, pair_pgi, scan_date };
    });
  });

  const { error: deletePairError } = await supabase
    .from('pgi_region_pairs')
    .delete()
    .eq('scan_date', scan_date)
    .in('story_score_id', Array.from(pgiIdBySlug.values()));
  if (deletePairError) throw deletePairError;

  if (pairRows.length) {
    const { error: pairError } = await supabase
      .from('pgi_region_pairs')
      .upsert(pairRows, { onConflict: 'story_score_id,region_a,region_b', ignoreDuplicates: false });
    if (pairError) throw pairError;
  }

  const { error: gaiError } = await supabase
    .from('gai_story_scores')
    .upsert(gaiRows, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });

  if (gaiError) throw gaiError;

  const output = {
    scanDate: scan_date,
    scanPeriod: scan_period,
    stories: stories.length,
    pgiCount: pgiRows.length,
    pairCount: pairRows.length,
    gaiCount: gaiRows.length,
    scored: stories,
  };

  const outPath = scanPath.replace(/\.md$/, '-scores.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({ ok: true, outPath, stories: stories.length, pairCount: pairRows.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
