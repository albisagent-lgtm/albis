#!/usr/bin/env node
/**
 * Push scan data from markdown files to Supabase.
 *
 * Usage: node scripts/push-scan-to-supabase.js [YYYY-MM-DD[-am|-midday|-pm]]
 * If no date specified, pushes today's scan (NZST).
 *
 * Bug-fix version:
 *  - Supports period-specific filenames like 2026-04-17-pm.md
 *  - Correctly infers scan_time from filename when provided
 *  - Uses proper Supabase upsert (onConflict) so reruns are idempotent
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

function findScanTimeSpans(md) {
  const headerRegex = /^## (AM|Midday|PM)\b[^\n]*/gm;
  const hits = [];
  let m;
  while ((m = headerRegex.exec(md)) !== null) {
    hits.push({ scanTime: m[1].toLowerCase(), index: m.index });
  }
  if (hits.length === 0) return [];

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

  const byTime = new Map();
  for (const s of spans) {
    const existing = byTime.get(s.scanTime);
    if (!existing) byTime.set(s.scanTime, { ...s });
    else {
      existing.start = Math.min(existing.start, s.start);
      existing.end = Math.max(existing.end, s.end);
    }
  }
  return [...byTime.values()].sort((a, b) => a.start - b.start);
}

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

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);

  console.log(`✅ Upserted ${scanDate} ${scanTime} — ${body.items.length} items, mood=${body.mood || '—'}`);
}

function parseArg(arg) {
  if (!arg) {
    const now = new Date();
    const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
    return { scanDate: nzDate.toISOString().split('T')[0], period: null, fileName: `${nzDate.toISOString().split('T')[0]}.md` };
  }

  const fullMatch = arg.match(/^(\d{4}-\d{2}-\d{2})-(am|midday|pm)$/i);
  if (fullMatch) {
    return { scanDate: fullMatch[1], period: fullMatch[2].toLowerCase(), fileName: `${fullMatch[1]}-${fullMatch[2].toLowerCase()}.md` };
  }

  const dateMatch = arg.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateMatch) {
    return { scanDate: dateMatch[1], period: null, fileName: `${dateMatch[1]}.md` };
  }

  throw new Error(`Unsupported argument format: ${arg}`);
}

async function main() {
  const parsed = parseArg(process.argv[2]);
  const filePath = path.join(SCANS_DIR, parsed.fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`Scan file not found: ${filePath}`);
    process.exit(1);
  }

  const md = fs.readFileSync(filePath, 'utf-8');
  console.log(`📄 Reading ${filePath} (${md.length} chars)`);

  const topTheme = extractSection(md, 'Top theme') || extractSection(md, 'Top Theme');
  const mood = extractSection(md, 'Mood');
  const patternRaw = extractSection(md, 'Pattern') || extractSection(md, 'Patterns');
  const patternOfDay = parsePatternOfDay(patternRaw);
  const framingNote = extractSection(md, 'Framing');
  const framingWatch = extractFramingWatch(md);

  const spans = findScanTimeSpans(md);
  console.log(`🔍 Detected ${spans.length} scan-time span(s): ${spans.map(s => s.scanTime).join(', ') || '(none — single scan)'}`);

  if (spans.length === 0) {
    const inferredTime = parsed.period || 'am';
    const allItems = extractJsonItems(md);
    console.log(`   → extracted ${allItems.length} items from full markdown`);
    await upsertScan(parsed.scanDate, inferredTime, {
      topTheme,
      mood,
      patternOfDay,
      framingWatch: framingWatch || framingNote,
      items: allItems,
    }, md);
  } else if (parsed.period) {
    const target = spans.find((s) => s.scanTime === parsed.period);
    if (!target) throw new Error(`Could not find ${parsed.period} section in ${parsed.fileName}`);
    const sectionMd = md.substring(target.start, target.end);
    const sItems = extractJsonItems(sectionMd);
    const sTopTheme = extractSection(sectionMd, 'Top theme') || extractSection(sectionMd, 'Top Theme');
    const sMood = extractSection(sectionMd, 'Mood');
    const sPatternRaw = extractSection(sectionMd, 'Pattern') || extractSection(sectionMd, 'Patterns');
    const sPatternOfDay = parsePatternOfDay(sPatternRaw);
    const sFramingNote = extractSection(sectionMd, 'Framing');
    const sFramingWatch = extractFramingWatch(sectionMd);
    console.log(`   → ${target.scanTime}: ${sItems.length} items from chars ${target.start}-${target.end}`);
    await upsertScan(parsed.scanDate, target.scanTime, {
      topTheme: sTopTheme || topTheme,
      mood: sMood || mood,
      patternOfDay: sPatternOfDay || patternOfDay,
      framingWatch: sFramingWatch || sFramingNote || framingWatch || framingNote,
      items: sItems,
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
      await upsertScan(parsed.scanDate, span.scanTime, {
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
