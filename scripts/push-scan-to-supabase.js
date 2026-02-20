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

  const res = await fetch(`${SUPABASE_URL}/rest/v1/scans`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
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
  
  // Check if there's an AM/PM split
  const hasAMPM = md.includes('## AM Data') || md.includes('## AM Scan');
  const hasPM = md.includes('## PM Data') || md.includes('## PM Scan');
  
  if (hasAMPM && hasPM) {
    // Split items: items before PM section are AM, after are PM
    const pmStart = md.indexOf('## PM');
    const amMd = md.substring(0, pmStart);
    const pmMd = md.substring(pmStart);
    
    const amItems = extractJsonItems(amMd);
    const pmItems = extractJsonItems(pmMd);
    
    // PM has its own theme/mood/pattern
    const pmTopTheme = extractSection(pmMd, 'Top theme') || extractSection(pmMd, 'Top Theme');
    const pmMood = extractSection(pmMd, 'Mood');
    const pmPatternRaw = extractSection(pmMd, 'Pattern') || extractSection(pmMd, 'Patterns');
    const pmPatternOfDay = parsePatternOfDay(pmPatternRaw);
    const pmFramingNote = extractSection(pmMd, 'Framing');
    const pmFramingWatch = extractFramingWatch(pmMd);
    
    await upsertScan(dateArg, 'AM', {
      topTheme,
      mood,
      patternOfDay,
      framingWatch: framingNote,
      items: amItems,
      rawMarkdown: amMd,
    });
    
    await upsertScan(dateArg, 'PM', {
      topTheme: pmTopTheme || topTheme,
      mood: pmMood || mood,
      patternOfDay: pmPatternOfDay || patternOfDay,
      framingWatch: pmFramingWatch || pmFramingNote,
      items: pmItems,
      rawMarkdown: pmMd,
    });
  } else {
    // Single scan for the day
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
