#!/usr/bin/env node
/**
 * Push scan data from markdown files to Supabase.
 * Usage: node scripts/push-scan-to-supabase.js [YYYY-MM-DD]
 * If no date specified, pushes today's scan.
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wguydvzpxwsgrhvojpnk.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const SCANS_DIR = process.env.SCANS_DIR || path.join(__dirname, '../../memory/scans');

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

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
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.headline && item.category) {
            items.push({
              headline: item.headline,
              category: item.category,
              regions: item.regions || [],
              tags: item.tags || [],
              patterns: item.patterns || [],
              significance: item.significance || 'medium',
              connection: item.connection || '',
            });
          }
        }
      }
    } catch { /* skip malformed */ }
  }
  return items;
}

function extractFramingWatch(md) {
  // Extract framing watch sections
  const framingMatch = md.match(/🔍\s*\*\*Framing Watch[^*]*\*\*\s*\n([\s\S]+?)(?=\n\*\*Mood|$)/i);
  if (!framingMatch) return null;
  return framingMatch[1].trim();
}

function parseScanSection(md, sectionName) {
  // Split into AM and PM sections
  const sections = [];
  
  // Extract AM data
  const amMatch = md.match(/## (?:AM Data|AM Scan[\s\S]*?)```json\s*\n([\s\S]*?)```/);
  if (amMatch) {
    const amSummarySection = md.substring(0, md.indexOf('## AM Data') !== -1 ? md.indexOf('## AM Data') : md.indexOf('## AM Scan'));
    sections.push({
      scanTime: 'AM',
      content: amSummarySection,
      items: extractJsonItems('```json\n' + amMatch[1] + '```')
    });
  }
  
  // Extract PM data
  const pmMatch = md.match(/## PM (?:Data|Scan)[\s\S]*?```json\s*\n([\s\S]*?)```/);
  if (pmMatch) {
    const pmStart = md.indexOf('## PM');
    const pmSummarySection = pmStart !== -1 ? md.substring(pmStart) : '';
    sections.push({
      scanTime: 'PM',
      content: pmSummarySection,
      items: extractJsonItems('```json\n' + pmMatch[1] + '```')
    });
  }
  
  return sections;
}

async function upsertScan(scanDate, scanTime, data) {
  const body = {
    scan_date: scanDate,
    scan_time: scanTime,
    human_summary: data.humanSummary || null,
    mood: data.mood || null,
    top_theme: data.topTheme || null,
    pattern_of_day: data.patternOfDay || null,
    framing_watch: data.framingWatch ? { note: data.framingWatch } : null,
    items: data.items || [],
    raw_markdown: data.rawMarkdown || null,
  };

  // First try DELETE if exists, then INSERT
  await fetch(`${SUPABASE_URL}/rest/v1/scans?scan_date=eq.${scanDate}&scan_time=eq.${scanTime}`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/scans`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upsert failed (${res.status}): ${text}`);
  }
  
  console.log(`✅ Upserted scan: ${scanDate} ${scanTime}`);
}

async function main() {
  const dateArg = process.argv[2] || new Date().toISOString().split('T')[0];
  const filePath = path.join(SCANS_DIR, `${dateArg}.md`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`Scan file not found: ${filePath}`);
    process.exit(1);
  }
  
  const md = fs.readFileSync(filePath, 'utf-8');
  
  // Parse top-level summary (applies to AM scan)
  const topTheme = extractSection(md, 'Top theme') || extractSection(md, 'Top Theme');
  const mood = extractSection(md, 'Mood');
  const patternRaw = extractSection(md, 'Pattern') || extractSection(md, 'Patterns');
  const patternOfDay = parsePatternOfDay(patternRaw);
  const framingNote = extractSection(md, 'Framing');
  const framingWatch = extractFramingWatch(md);
  
  // Get all items from all JSON blocks
  const allItems = extractJsonItems(md);
  
  // Split into AM / Midday / PM sections
  // Find section boundaries using ## headers
  const sectionRegex = /^## (AM|Midday|PM)\b[^\n]*/gm;
  const sectionStarts = [];
  let m;
  while ((m = sectionRegex.exec(md)) !== null) {
    sectionStarts.push({ time: m[1], index: m.index });
  }
  
  if (sectionStarts.length > 0) {
    for (let i = 0; i < sectionStarts.length; i++) {
      const start = sectionStarts[i].index;
      const end = i + 1 < sectionStarts.length ? sectionStarts[i + 1].index : md.length;
      const scanTime = sectionStarts[i].time === 'Midday' ? 'Midday' : sectionStarts[i].time;
      const sectionMd = md.substring(start, end);
      
      // Also grab any matching Data section that may be separate
      // e.g., "## AM Data", "## Midday Data", "## PM Data"
      const dataLabel = scanTime === 'Midday' ? 'Midday' : scanTime;
      const dataRegex = new RegExp(`## ${dataLabel} Data[\\s\\S]*?(?=\\n## |$)`);
      const dataMatch = md.match(dataRegex);
      const fullSection = dataMatch ? sectionMd + '\n' + dataMatch[0] : sectionMd;
      
      const sItems = extractJsonItems(fullSection);
      const sTopTheme = extractSection(sectionMd, 'Top theme') || extractSection(sectionMd, 'Top Theme');
      const sMood = extractSection(sectionMd, 'Mood');
      const sPatternRaw = extractSection(sectionMd, 'Pattern') || extractSection(sectionMd, 'Patterns');
      const sPatternOfDay = parsePatternOfDay(sPatternRaw);
      const sFramingNote = extractSection(sectionMd, 'Framing');
      const sFramingWatch = extractFramingWatch(sectionMd);
      
      await upsertScan(dateArg, scanTime, {
        topTheme: sTopTheme || topTheme,
        mood: sMood || mood,
        patternOfDay: sPatternOfDay || patternOfDay,
        framingWatch: sFramingWatch || sFramingNote || framingNote,
        items: sItems,
        rawMarkdown: fullSection,
      });
    }
  } else {
    // Single scan for the day (no AM/Midday/PM headers)
    await upsertScan(dateArg, 'AM', {
      topTheme,
      mood,
      patternOfDay,
      framingWatch: framingNote,
      items: allItems,
      rawMarkdown: md,
    });
  }
  
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
