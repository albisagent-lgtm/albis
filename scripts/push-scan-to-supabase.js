#!/usr/bin/env node
/**
 * Push scan data from markdown files to Supabase.
 *
 * Usage: node scripts/push-scan-to-supabase.js [YYYY-MM-DD]
 * If no date specified, pushes today's scan (NZST).
 *
 * Bug-fix version (2026-04-15):
 *  - Dedupe sections by scan_time prefix (previously "## AM Scan" / "## AM Data"
 *    / "## AM PGI Scores" each triggered a separate upsert with DELETE-then-INSERT,
 *    so later scoring sections clobbered the earlier items).
 *  - Use proper Supabase upsert (on_conflict) instead of DELETE+INSERT, so idempotent
 *    re-runs don't temporarily erase data.
 *  - Store the full markdown file in raw_markdown, not a section slice.
 *  - Normalise scan_time to lowercase ("am" | "midday" | "pm") to match recent
 *    rows and avoid casing-duplicate rows.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wguydvzpxwsgrhvojpnk.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const SCANS_DIR = process.env.SCANS_DIR || path.join(__dirname, '../../memory/scans');

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function extractSection(md, label) {
  const boldRegex = new RegExp(
    `\\*\\*${label}:?\\*\\*\\s*(.+?)(?=\\n\\*\\*[A-Z]|\\n---|\\n##|\\n\`\`\`|$)`,
    'is'
  );
  const boldMatch = md.match(boldRegex);
  if (boldMatch) return boldMatch[1].trim();

  const plainRegex = new RegExp(
    `^${label}:\\s*(.+?)(?=\\n[A-Z]\\w+:|\\n---|\\n##|\\n\`\`\`|$)`,
    'ims'
  );
  const plainMatch = md.match(plainRegex);
  return plainMatch ? plainMatch[1].trim() : null;
}

function parsePatternOfDay(raw) {
  if (!raw) return null;
  const italicMatch = raw.match(/^\*([^*]+)\*\s*([\s\S]*)/);
  if (italicMatch) return { title: italicMatch[1].trim(), body: italicMatch[2].trim() };
  const boldMatch = raw.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)/);
  if (boldMatch) return { title: boldMatch[1].trim(), body: boldMatch[2].trim() };
  const sentenceMatch = raw.match(/^(.+?[.!?])\s+([\s\S]*)/);
  if (sentenceMatch) return { title: sentenceMatch[1].trim(), body: sentenceMatch[2].trim() };
  return { title: '', body: raw };
}

/**
 * Extract all scan items from all ```json blocks in a markdown slice.
 * Accepts any block that parses as a JSON array of {headline, category, ...}.
 * Silently skips blocks that parse as objects (PGI/GAI scoring blocks) or
 * blocks that fail to parse.
 */
function extractJsonItems(md) {
  const items = [];
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = jsonBlockRegex.exec(md)) !== null) {
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) continue;
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      if (!item.headline || !item.category) continue;
      items.push({
        headline: item.headline,
        category: item.category,
        regions: Array.isArray(item.regions) ? item.regions : [],
        tags: Array.isArray(item.tags) ? item.tags : [],
        patterns: Array.isArray(item.patterns) ? item.patterns : [],
        significance: item.significance || 'medium',
        connection: item.connection || '',
        perception_gap: item.perception_gap ?? null,
        coverage_breadth: item.coverage_breadth ?? null,
        regions_found: Array.isArray(item.regions_found) ? item.regions_found : [],
        regions_absent: Array.isArray(item.regions_absent) ? item.regions_absent : [],
      });
    }
  }
  return items;
}

function extractFramingWatch(md) {
  const framingMatch = md.match(/🔍\s*\*\*Framing Watch[^*]*\*\*\s*\n([\s\S]+?)(?=\n\*\*Mood|$)/i);
  if (!framingMatch) return null;
  return framingMatch[1].trim();
}

// ---------------------------------------------------------------------------
// Section detection — dedupe by scan_time
// ---------------------------------------------------------------------------

/**
 * Find section spans in the markdown. Each span represents one scan_time
 * (am/midday/pm) and covers EVERY `## AM Xxx`, `## AM Yyy`, etc. heading up
 * until the first heading of the next scan_time.
 *
 * Returns: [{ scanTime: 'am', start: Number, end: Number }, ...]
 *   where `start` is the index of the first matching header, and `end` is
 *   the index where the next-scan-time's first header starts (or md.length).
 */
function findScanTimeSpans(md) {
  const headerRegex = /^## (AM|Midday|PM)\b[^\n]*/gm;
  const hits = [];
  let m;
  while ((m = headerRegex.exec(md)) !== null) {
    hits.push({ scanTime: m[1].toLowerCase(), index: m.index });
  }
  if (hits.length === 0) return [];

  // Collapse consecutive headers with the same scan_time into one span.
  // The span for scan_time X starts at its first header and ends at the
  // first header of a DIFFERENT scan_time (or EOF).
  const spans = [];
  let cur = { scanTime: hits[0].scanTime, start: hits[0].index, end: md.length };
  for (let i = 1; i < hits.length; i++) {
    if (hits[i].scanTime !== cur.scanTime) {
      cur.end = hits[i].index;
      spans.push(cur);
      cur = { scanTime: hits[i].scanTime, start: hits[i].index, end: md.length };
    }
  }
  spans.push(cur);

  // If a scan_time appears multiple times non-contiguously (unusual), merge by
  // taking the FIRST start and LAST end. We also need to deduplicate the spans
  // so we upsert each scan_time once.
  const byTime = new Map();
  for (const s of spans) {
    const existing = byTime.get(s.scanTime);
    if (!existing) {
      byTime.set(s.scanTime, { ...s });
    } else {
      existing.start = Math.min(existing.start, s.start);
      existing.end = Math.max(existing.end, s.end);
    }
  }
  return [...byTime.values()].sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------------------
// Upsert via Supabase client (proper on_conflict, no DELETE+INSERT)
// ---------------------------------------------------------------------------

async function upsertScan(scanDate, scanTime, data, fullMarkdown) {
  const body = {
    scan_date: scanDate,
    scan_time: scanTime,
    human_summary: data.humanSummary || null,
    mood: data.mood || null,
    top_theme: data.topTheme || null,
    pattern_of_day: data.patternOfDay || null,
    framing_watch: data.framingWatch ? { note: data.framingWatch } : null,
    items: data.items || [],
    raw_markdown: fullMarkdown || null,
  };

  const { error } = await supabase
    .from('scans')
    .upsert(body, { onConflict: 'scan_date,scan_time' });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  console.log(`✅ Upserted ${scanDate} ${scanTime} — ${body.items.length} items, mood=${body.mood || '—'}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Default to NZST date (UTC+13)
  const now = new Date();
  const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
  const dateArg = process.argv[2] || nzDate.toISOString().split('T')[0];
  const filePath = path.join(SCANS_DIR, `${dateArg}.md`);

  if (!fs.existsSync(filePath)) {
    console.error(`Scan file not found: ${filePath}`);
    process.exit(1);
  }

  const md = fs.readFileSync(filePath, 'utf-8');
  console.log(`📄 Reading ${filePath} (${md.length} chars)`);

  // Top-level fallbacks (used if a section doesn't define its own)
  const topTheme = extractSection(md, 'Top theme') || extractSection(md, 'Top Theme');
  const mood = extractSection(md, 'Mood');
  const patternRaw = extractSection(md, 'Pattern') || extractSection(md, 'Patterns');
  const patternOfDay = parsePatternOfDay(patternRaw);
  const framingNote = extractSection(md, 'Framing');
  const framingWatch = extractFramingWatch(md);

  const spans = findScanTimeSpans(md);
  console.log(`🔍 Detected ${spans.length} scan-time span(s): ${spans.map(s => s.scanTime).join(', ') || '(none — single scan)'}`);

  if (spans.length === 0) {
    // No AM/Midday/PM headers — treat whole file as one "am" scan
    const allItems = extractJsonItems(md);
    console.log(`   → extracted ${allItems.length} items from full markdown`);
    await upsertScan(dateArg, 'am', {
      topTheme,
      mood,
      patternOfDay,
      framingWatch: framingWatch || framingNote,
      items: allItems,
    }, md);
  } else {
    for (const span of spans) {
      const sectionMd = md.substring(span.start, span.end);
      const sItems = extractJsonItems(sectionMd);
      const sTopTheme = extractSection(sectionMd, 'Top theme') || extractSection(sectionMd, 'Top Theme');
      const sMood = extractSection(sectionMd, 'Mood');
      const sPatternRaw = extractSection(sectionMd, 'Pattern') || extractSection(sectionMd, 'Patterns');
      const sPatternOfDay = parsePatternOfDay(sPatternRaw);
      const sFramingNote = extractSection(sectionMd, 'Framing');
      const sFramingWatch = extractFramingWatch(sectionMd);

      console.log(`   → ${span.scanTime}: ${sItems.length} items from chars ${span.start}-${span.end}`);

      await upsertScan(dateArg, span.scanTime, {
        topTheme: sTopTheme || topTheme,
        mood: sMood || mood,
        patternOfDay: sPatternOfDay || patternOfDay,
        framingWatch: sFramingWatch || sFramingNote || framingWatch || framingNote,
        items: sItems,
      }, md);
    }
  }

  console.log('✨ Done.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
