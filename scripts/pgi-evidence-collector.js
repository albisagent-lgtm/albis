#!/usr/bin/env node

/**
 * PGI Evidence Collector
 * 
 * Reads today's scan file, extracts the top 5 stories by PGI score,
 * then searches for and collects actual regional news articles as evidence.
 * 
 * Usage:
 *   node scripts/pgi-evidence-collector.js [YYYY-MM-DD]
 * 
 * Output:
 *   memory/pgi/YYYY-MM-DD-evidence.json
 * 
 * This script is designed to be run by an AI agent (via cron) that can
 * use web_fetch to actually retrieve articles. When run standalone, it
 * extracts stories and produces a template evidence file that needs
 * web evidence filled in.
 * 
 * For full pipeline: run via cron agent that calls web_fetch for each story.
 */

const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────

const WORKSPACE = '/Users/treelight/.openclaw/workspace';
const SCANS_DIR = path.join(WORKSPACE, 'memory/scans');
const PGI_DIR = path.join(WORKSPACE, 'memory/pgi');
const SOURCES_FILE = path.join(WORKSPACE, 'albis-app/scripts/pgi-sources.json');

const TOP_N_STORIES = 5;

// Region display names
const REGION_NAMES = {
  us: 'North America',
  eu: 'Western Europe',
  china: 'China',
  india: 'South Asia (India)',
  middle_east: 'Middle East',
  africa: 'Sub-Saharan Africa',
  latam: 'Latin America',
  south_asia: 'South Asia',
  'south-asia': 'South Asia',
  east_se_asia: 'East & Southeast Asia',
  eastern_europe: 'Eastern Europe',
};

// ── Helpers ──────────────────────────────────────────────────────────

function getTodayNZ() {
  const now = new Date();
  const nzFormatter = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = nzFormatter.formatToParts(now);
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// ── Parse PGI scores from scan file ─────────────────────────────────

function parseScanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Scan file not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const allStories = [];

  // Extract PGI score blocks from AM, Midday, PM sections
  const sectionRegex = /## (AM|Midday|PM) PGI Scores\s*```json\s*(\{[\s\S]*?\})\s*```/gi;
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    const period = match[1].toLowerCase();
    try {
      const parsed = JSON.parse(match[2]);
      if (parsed.pgi_scores && Array.isArray(parsed.pgi_scores)) {
        for (const score of parsed.pgi_scores) {
          allStories.push({
            ...score,
            scan_period: period,
            // Compute composite PGI if not present
            computed_pgi: score.story_pgi || computePGI(score.dimensions),
          });
        }
      }
    } catch (err) {
      console.error(`⚠️  Failed to parse ${match[1]} PGI JSON:`, err.message);
    }
  }

  return allStories;
}

function computePGI(dims) {
  if (!dims) return 0;
  return (
    dims.d1_factual * 0.25 +
    dims.d2_causal * 0.20 +
    dims.d3_framing * 0.25 +
    dims.d4_emotional * 0.15 +
    dims.d5_actor_context * 0.15
  );
}

// ── Select top stories (deduplicated by slug, highest score wins) ────

function selectTopStories(allStories, n) {
  // Deduplicate: keep highest-scoring version of each slug
  const bySlug = new Map();
  for (const s of allStories) {
    const existing = bySlug.get(s.story_slug);
    if (!existing || s.computed_pgi > existing.computed_pgi) {
      bySlug.set(s.story_slug, s);
    }
  }

  // Sort by PGI descending, take top N
  return Array.from(bySlug.values())
    .sort((a, b) => b.computed_pgi - a.computed_pgi)
    .slice(0, n);
}

// ── Build search queries for each story × region ────────────────────

function buildSearchQueries(story, sources) {
  const queries = [];

  for (const regionKey of story.regions_covered) {
    const regionSources = sources[regionKey] || sources[regionKey.replace(/-/g, '_')] || [];
    const regionName = REGION_NAMES[regionKey] || REGION_NAMES[regionKey.replace(/-/g, '_')] || regionKey;

    queries.push({
      region: regionName,
      region_key: regionKey,
      sources: regionSources,
      // Search query: story headline + site-specific searches
      search_query: story.story_headline,
      site_queries: regionSources.slice(0, 3).map(s => `site:${s} ${story.story_headline.split(' ').slice(0, 5).join(' ')}`),
    });
  }

  return queries;
}

// ── Build evidence template ─────────────────────────────────────────

function buildEvidenceTemplate(date, topStories, sources) {
  const evidence = {
    date,
    generated_at: new Date().toISOString(),
    methodology_version: '1.0',
    stories: [],
  };

  for (const story of topStories) {
    const queries = buildSearchQueries(story, sources);

    evidence.stories.push({
      slug: story.story_slug,
      headline: story.story_headline,
      category: story.category,
      pgi_score: story.computed_pgi,
      scan_period: story.scan_period,
      dimensions: story.dimensions,
      scoring_rationale: story.scoring_rationale,
      regions_covered: story.regions_covered.map(r => REGION_NAMES[r] || REGION_NAMES[r.replace(/-/g, '_')] || r),
      region_pairs: story.region_pairs || {},
      search_queries: queries,
      // This gets filled in by the cron agent with actual article data
      regional_evidence: queries.map(q => ({
        region: q.region,
        region_key: q.region_key,
        sources_searched: q.sources,
        articles: [],
        // Each article should have:
        // { source, url, headline, key_quotes: [], framing_angle, emotional_tone }
      })),
    });
  }

  return evidence;
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
  const dateArg = process.argv[2];
  const scanDate = dateArg || getTodayNZ();

  console.log(`📰 PGI Evidence Collector — ${scanDate}\n`);

  // Load sources
  let sources = {};
  if (fs.existsSync(SOURCES_FILE)) {
    sources = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf8'));
  } else {
    console.warn('⚠️  No sources file found. Evidence will lack source suggestions.');
  }

  // Parse scan file
  const scanPath = path.join(SCANS_DIR, `${scanDate}.md`);
  const allStories = parseScanFile(scanPath);
  console.log(`📊 Found ${allStories.length} total scored stories across all periods`);

  // Select top stories
  const topStories = selectTopStories(allStories, TOP_N_STORIES);
  console.log(`🏆 Top ${topStories.length} stories by PGI score:`);
  for (const s of topStories) {
    console.log(`   ${s.computed_pgi.toFixed(1)} — ${s.story_headline}`);
  }

  // Build evidence template
  const evidence = buildEvidenceTemplate(scanDate, topStories, sources);

  // Write output
  if (!fs.existsSync(PGI_DIR)) fs.mkdirSync(PGI_DIR, { recursive: true });
  const outPath = path.join(PGI_DIR, `${scanDate}-evidence.json`);
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2));
  console.log(`\n✅ Evidence template saved to: ${outPath}`);
  console.log(`\n⚠️  This is a TEMPLATE. The cron agent must fill in regional_evidence.articles`);
  console.log(`   by using web_fetch to read actual articles from each region's sources.`);
}

main();
