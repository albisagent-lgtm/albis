#!/usr/bin/env node
/**
 * Push scan + PGI data to Albis API endpoints via HTTP.
 * Fallback script for when crons can't use local Supabase scripts.
 *
 * Usage:
 *   SCAN_INGEST_KEY=<key> node scripts/push-via-api.js [YYYY-MM-DD]
 *
 * Env vars:
 *   SCAN_INGEST_KEY  - Bearer token for API auth
 *   ALBIS_BASE_URL   - defaults to https://www.albis.news
 *   SCANS_DIR        - defaults to ../memory/scans
 */

const fs = require('fs');
const path = require('path');

const INGEST_KEY = process.env.SCAN_INGEST_KEY;
const BASE_URL = process.env.ALBIS_BASE_URL || 'https://www.albis.news';
const SCANS_DIR = process.env.SCANS_DIR || path.join(__dirname, '../../memory/scans');

if (!INGEST_KEY) {
  console.error('❌ SCAN_INGEST_KEY not set');
  process.exit(1);
}

function getTodayNZ() {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

// ── Scan parsing (mirrors push-scan-to-supabase.js) ──

function extractSection(md, label) {
  const bold = md.match(new RegExp(`\\*\\*${label}:?\\*\\*\\s*(.+?)(?=\\n\\*\\*[A-Z]|\\n---|\\n##|\\n\`\`\`|$)`, 'is'));
  if (bold) return bold[1].trim();
  const plain = md.match(new RegExp(`^${label}:\\s*(.+?)(?=\\n[A-Z]\\w+:|\\n---|\\n##|\\n\`\`\`|$)`, 'ims'));
  return plain ? plain[1].trim() : null;
}

function parsePatternOfDay(raw) {
  if (!raw) return null;
  const m = raw.match(/^\*([^*]+)\*\s*([\s\S]*)/) || raw.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)/);
  if (m) return { title: m[1].trim(), body: m[2].trim() };
  return { title: '', body: raw };
}

function extractJsonItems(md) {
  const items = [];
  const re = /```json\s*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed)) {
        for (const it of parsed) {
          if (it.headline && it.category) items.push(it);
        }
      }
    } catch {}
  }
  return items;
}

function extractFramingWatch(md) {
  const m = md.match(/🔍\s*\*\*Framing Watch[^*]*\*\*\s*\n([\s\S]+?)(?=\n\*\*Mood|$)/i);
  return m ? m[1].trim() : null;
}

// ── PGI parsing (mirrors push-pgi-to-supabase.js) ──

function parsePGIScores(md) {
  const results = [];
  const re = /## (AM|Midday|PM) PGI Scores\s*```json\s*(\{[\s\S]*?\})\s*```/gi;
  let m;
  while ((m = re.exec(md)) !== null) {
    try {
      const parsed = JSON.parse(m[2]);
      if (parsed.pgi_scores && Array.isArray(parsed.pgi_scores)) {
        results.push({ period: m[1].toLowerCase(), scores: parsed.pgi_scores });
      }
    } catch {}
  }
  return results;
}

function flattenStory(score) {
  return {
    story_slug: score.story_slug,
    story_headline: score.story_headline,
    category: score.category,
    regions_covered: score.regions_covered,
    d1_factual: score.dimensions?.d1_factual,
    d2_causal: score.dimensions?.d2_causal,
    d3_framing: score.dimensions?.d3_framing ?? score.dimensions?.d3_narrative_market,
    d4_emotional: score.dimensions?.d4_emotional,
    d5_actor_context: score.dimensions?.d5_actor_context ?? score.dimensions?.d5_actor_portrayal,
    d6_cui_bono: score.dimensions?.d6_cui_bono ?? null,
    significance: score.significance,
    scoring_rationale: score.scoring_rationale,
    region_pairs: score.region_pairs || {},
  };
}

async function post(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${INGEST_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${endpoint} ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function main() {
  const scanDate = process.argv[2] || getTodayNZ();
  const filePath = path.join(SCANS_DIR, `${scanDate}.md`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Scan file not found: ${filePath}`);
    process.exit(1);
  }

  const md = fs.readFileSync(filePath, 'utf8');
  console.log(`📄 Processing ${scanDate}`);

  // ── Push scan data ──
  const sectionRegex = /^## (AM|Midday|PM)\b[^\n]*/gm;
  const sectionStarts = [];
  let sm;
  while ((sm = sectionRegex.exec(md)) !== null) {
    sectionStarts.push({ time: sm[1], index: sm.index });
  }

  const topTheme = extractSection(md, 'Top theme') || extractSection(md, 'Top Theme');
  const mood = extractSection(md, 'Mood');
  const patternOfDay = parsePatternOfDay(extractSection(md, 'Pattern') || extractSection(md, 'Patterns'));
  const framingWatch = extractFramingWatch(md);

  if (sectionStarts.length > 0) {
    for (let i = 0; i < sectionStarts.length; i++) {
      const start = sectionStarts[i].index;
      const end = i + 1 < sectionStarts.length ? sectionStarts[i + 1].index : md.length;
      const scanTime = sectionStarts[i].time;
      const sectionMd = md.substring(start, end);
      const sItems = extractJsonItems(sectionMd);
      const sTopTheme = extractSection(sectionMd, 'Top theme') || extractSection(sectionMd, 'Top Theme');
      const sMood = extractSection(sectionMd, 'Mood');

      try {
        const r = await post('/api/scans/ingest', {
          scan_date: scanDate,
          scan_time: scanTime,
          top_theme: sTopTheme || topTheme,
          mood: sMood || mood,
          pattern_of_day: patternOfDay,
          framing_watch: framingWatch,
          items: sItems,
          raw_markdown: sectionMd,
        });
        console.log(`  ✅ Scan ${scanTime}:`, r);
      } catch (err) {
        console.error(`  ❌ Scan ${scanTime}:`, err.message);
      }
    }
  }

  // ── Push PGI data ──
  const pgiData = parsePGIScores(md);
  for (const { period, scores } of pgiData) {
    try {
      const r = await post('/api/pgi/ingest', {
        scan_date: scanDate,
        scan_period: period,
        stories: scores.map(flattenStory),
      });
      console.log(`  ✅ PGI ${period}:`, r);
    } catch (err) {
      console.error(`  ❌ PGI ${period}:`, err.message);
    }
  }

  console.log('✨ Done');
}

main().catch(err => { console.error('💥', err); process.exit(1); });
