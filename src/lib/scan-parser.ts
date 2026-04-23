import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Re-export shared types and constants so existing imports still work
export {
  type ScanItem,
  type PatternOfDay,
  type ParsedScan,
  type BlindspotData,
  CATEGORY_META,
  REGION_LABELS,
  FRAMING_PATTERNS,
  hasFramingWatch,
  hasBlindspot,
  detectBlindspots,
  groupByCategory,
} from "./scan-types";

import type { ScanItem, PatternOfDay, ParsedScan } from "./scan-types";
import { detectBlindspots } from "./scan-types";
import {
  formatDisplayDate,
  extractSection,
  parsePatternOfDay,
  parseNotableItems,
  extractJsonItems,
  extractScanMeta,
} from "./scan-parser-core";

const SCANS_DIR =
  process.env.SCANS_DIR ||
  "/Users/treelight/.openclaw/workspace/memory/scans";

// Check if we're running on Vercel or in a production environment
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const isLocal = typeof window === 'undefined' && fs.existsSync && fs.existsSync(SCANS_DIR);

// Initialize Supabase client for server-side usage
let supabase: any = null;
if ((isVercel || !isLocal) && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ---------------------------------------------------------------------------
// Helpers — pure markdown/string helpers now live in ./scan-parser-core.ts
// and are imported above. The Supabase/filesystem orchestration stays here.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Supabase data fetching (for Vercel/production)
// ---------------------------------------------------------------------------

async function getSupabaseScan(date: string, scanTime?: string): Promise<ParsedScan | null> {
  if (!supabase) {
    console.warn('[scan-parser] No Supabase client available');
    return null;
  }

  try {
    let query = supabase
      .from('scans')
      .select('*')
      .eq('scan_date', date);

    if (scanTime) {
      query = query.eq('scan_time', scanTime);
    }

    const { data, error } = await query.order('scan_time', { ascending: false });

    if (error) {
      console.error('[scan-parser] Supabase query error:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`[scan-parser] No scan rows found for date=${date}`);
      return null;
    }

    console.log(`[scan-parser] Found ${data.length} scan row(s) for date=${date}`);

    // Use the latest scan's metadata but combine items from all scans for the day
    const latest = data[0];
    const allItems: any[] = [];
    for (const scan of data) {
      // Handle items stored as JSON string or as native array
      let items = scan.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch { items = null; }
      }
      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (item && item.headline && item.category) {
            allItems.push({
              headline: item.headline,
              category: item.category,
              regions: Array.isArray(item.regions) ? item.regions : [],
              tags: Array.isArray(item.tags) ? item.tags : [],
              patterns: Array.isArray(item.patterns) ? item.patterns : [],
              significance: item.significance || "medium",
              connection: item.connection || "",
              perception_gap: item.perception_gap ?? null,
              coverage_breadth: item.coverage_breadth ?? null,
              regions_found: item.regions_found || [],
              regions_absent: item.regions_absent || [],
              blindspot: item.blindspot || undefined,
            });
          }
        }
      } else {
        console.warn(`[scan-parser] Scan row id=${scan.id} has no parseable items in scans.items (type=${typeof scan.items})`);
      }
    }

    // Fallback: if scans.items is empty, try the scan_items table
    if (allItems.length === 0 && supabase) {
      console.log(`[scan-parser] Trying scan_items table for date=${date}`);
      const scanIds = data.map((s: any) => s.id);
      const { data: itemRows, error: itemErr } = await supabase
        .from('scan_items')
        .select('*')
        .in('scan_id', scanIds);
      if (!itemErr && itemRows && itemRows.length > 0) {
        console.log(`[scan-parser] Found ${itemRows.length} items in scan_items table`);
        for (const item of itemRows) {
          if (item && item.headline && item.category) {
            allItems.push({
              headline: item.headline,
              category: item.category?.replace(/_/g, '-') || 'analysis',
              regions: Array.isArray(item.regions) ? item.regions : [],
              tags: Array.isArray(item.tags) ? item.tags : [],
              patterns: Array.isArray(item.patterns) ? item.patterns : [],
              significance: item.significance || "medium",
              connection: item.connection || "",
              perception_gap: item.perception_gap ?? null,
              coverage_breadth: item.coverage_breadth ?? null,
              regions_found: item.regions_found || [],
              regions_absent: item.regions_absent || [],
              blindspot: item.blindspot || undefined,
            });
          }
        }
      }
    }

    console.log(`[scan-parser] Parsed ${allItems.length} items for date=${date}`);

    // If scan rows exist but have no items, return null so caller can try fallback dates
    if (allItems.length === 0) return null;

    // Extract framing note from framing_watch jsonb
    const framingWatch = latest.framing_watch;
    const framingNote = framingWatch?.note || null;

    // Combine raw markdown from all scans
    const rawMarkdown = data.map((s: any) => s.raw_markdown || '').filter(Boolean).join('\n\n---\n\n');

    return {
      date: latest.scan_date,
      displayDate: formatDisplayDate(latest.scan_date),
      topTheme: latest.top_theme,
      mood: latest.mood,
      patternOfDay: latest.pattern_of_day || null,
      weatherSummary: null,
      flowsSummary: null,
      framingNote,
      notableItems: [],
      items: detectBlindspots(allItems),
      scanMeta: null,
      rawMarkdown,
      framingWatchRaw: framingNote,
    };
  } catch (error) {
    console.error('[scan-parser] Error fetching scan from Supabase:', error);
    return null;
  }
}

async function getSupabaseAvailableDates(): Promise<string[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('scans')
      .select('scan_date')
      .order('scan_date', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return [];
    }

    // Remove duplicates and return dates
    const dateSet = new Set<string>();
    for (const row of data) { dateSet.add(String((row as any).scan_date)); }
    return Array.from(dateSet);
  } catch (error) {
    console.error('Error fetching dates from Supabase:', error);
    return [];
  }
}

async function getSupabaseFramingItems(): Promise<any[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('scans')
      .select('scan_date, items')
      .order('scan_date', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return [];
    }

    const framingItems: any[] = [];
    
    for (const scan of data) {
      const items = scan.items || [];
      for (const item of items) {
        if (item.patterns?.includes('framing') || item.patterns?.includes('omission')) {
          framingItems.push({
            headline: item.headline,
            regions: item.regions,
            connection: item.connection,
            category: item.category,
            significance: item.significance,
            scanDate: scan.scan_date,
            displayDate: formatDisplayDate(scan.scan_date),
          });
        }
      }
    }

    return framingItems;
  } catch (error) {
    console.error('Error fetching framing items from Supabase:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

function parseScanFile(filePath: string): ParsedScan | null {
  const filename = path.basename(filePath, ".md");
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})(?:-(am|midday|pm))?$/i);
  if (!dateMatch) return null;

  const date = dateMatch[1];

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const patternRaw =
    extractSection(content, "Pattern") ||
    extractSection(content, "Patterns");

  return {
    date,
    displayDate: formatDisplayDate(date),
    topTheme:
      extractSection(content, "Top theme") ||
      extractSection(content, "Top Theme"),
    mood: extractSection(content, "Mood"),
    patternOfDay: parsePatternOfDay(patternRaw),
    weatherSummary: extractSection(content, "Weather"),
    flowsSummary: extractSection(content, "Flows"),
    framingNote: extractSection(content, "Framing"),
    notableItems: parseNotableItems(content),
    items: detectBlindspots(extractJsonItems(content)),
    scanMeta: extractScanMeta(content),
    rawMarkdown: content,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getTodayScan(): Promise<ParsedScan | null> {
  // Use NZST (UTC+13) date since scans are generated in NZ timezone
  const now = new Date();
  const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
  const today = nzDate.toISOString().split("T")[0];

  // Try Supabase first if we're on Vercel or local files don't exist
  if (supabase && (isVercel || !isLocal)) {
    // Try today and the last 2 days as fallback (timezone mismatches, empty items)
    for (let daysBack = 0; daysBack < 3; daysBack++) {
      const d = new Date(nzDate);
      d.setDate(d.getDate() - daysBack);
      const dateStr = d.toISOString().split("T")[0];
      console.log(`[scan-parser] getTodayScan trying date=${dateStr} (daysBack=${daysBack})`);
      const scan = await getSupabaseScan(dateStr);
      if (scan && scan.items.length > 0) return scan;
    }
    // Last resort: get the most recent scan from any date
    console.log('[scan-parser] getTodayScan falling back to getLatestScan');
    return await getLatestScan();
  }

  // Fallback to local filesystem
  if (isLocal) {
    const candidates = [
      path.join(SCANS_DIR, `${today}-pm.md`),
      path.join(SCANS_DIR, `${today}-midday.md`),
      path.join(SCANS_DIR, `${today}-am.md`),
      path.join(SCANS_DIR, `${today}.md`),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const parsed = parseScanFile(filePath);
        if (parsed && parsed.items.length > 0) return parsed;
      }
    }
  }

  return await getLatestScan();
}

export async function getLatestScan(): Promise<ParsedScan | null> {
  // Try Supabase first if available
  if (supabase && (isVercel || !isLocal)) {
    const dates = await getSupabaseAvailableDates();
    if (dates.length > 0) {
      return await getSupabaseScan(dates[0]);
    }
    return null;
  }

  // Fallback to local filesystem
  if (!isLocal || !fs.existsSync(SCANS_DIR)) return null;

  const periodRank: Record<string, number> = { am: 1, midday: 2, pm: 3 };
  const files = fs
    .readdirSync(SCANS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}(?:-(am|midday|pm))?\.md$/i.test(f))
    .sort((a, b) => {
      const ma = a.match(/^(\d{4}-\d{2}-\d{2})(?:-(am|midday|pm))?\.md$/i);
      const mb = b.match(/^(\d{4}-\d{2}-\d{2})(?:-(am|midday|pm))?\.md$/i);
      if (!ma || !mb) return b.localeCompare(a);
      if (ma[1] !== mb[1]) return mb[1].localeCompare(ma[1]);
      return (periodRank[(mb[2] || 'am').toLowerCase()] || 0) - (periodRank[(ma[2] || 'am').toLowerCase()] || 0);
    });

  if (files.length === 0) return null;

  return parseScanFile(path.join(SCANS_DIR, files[0]));
}

export async function getScanByDate(date: string): Promise<ParsedScan | null> {
  if (supabase && (isVercel || !isLocal)) {
    return await getSupabaseScan(date);
  }

  if (!isLocal) return null;

  const candidates = [
    path.join(SCANS_DIR, `${date}-pm.md`),
    path.join(SCANS_DIR, `${date}-midday.md`),
    path.join(SCANS_DIR, `${date}-am.md`),
    path.join(SCANS_DIR, `${date}.md`),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const parsed = parseScanFile(filePath);
    if (parsed && parsed.items.length > 0) return parsed;
  }

  return null;
}

/**
 * Returns all available scan dates (YYYY-MM-DD), newest first.
 */
export async function getAvailableDates(): Promise<string[]> {
  // Try Supabase first if available
  if (supabase && (isVercel || !isLocal)) {
    return await getSupabaseAvailableDates();
  }

  // Fallback to local filesystem
  if (!isLocal || !fs.existsSync(SCANS_DIR)) return [];

  return fs
    .readdirSync(SCANS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .map((f) => f.replace(".md", ""))
    .sort()
    .reverse();
}

/**
 * Returns all scan items from recent scans (last 30 days), with scan dates attached.
 */
export async function getRecentScanItems(days: number = 30): Promise<{ items: (ScanItem & { scanDate: string; displayDate: string })[] }> {
  // Calculate cutoff date
  const now = new Date();
  const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
  const cutoff = new Date(nzDate);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  if (supabase && (isVercel || !isLocal)) {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('scan_date, items')
        .gte('scan_date', cutoffStr)
        .order('scan_date', { ascending: false });

      if (error || !data) return { items: [] };

      const allItems: (ScanItem & { scanDate: string; displayDate: string })[] = [];
      for (const scan of data) {
        const scanItems = scan.items || [];
        for (const item of scanItems) {
          if (item.headline && item.category) {
            allItems.push({
              headline: item.headline,
              category: item.category,
              regions: item.regions || [],
              tags: item.tags || [],
              patterns: item.patterns || [],
              significance: item.significance || "medium",
              connection: item.connection || "",
              scanDate: scan.scan_date,
              displayDate: formatDisplayDate(scan.scan_date),
            });
          }
        }
      }
      return { items: allItems };
    } catch {
      return { items: [] };
    }
  }

  // Fallback to local filesystem
  const dates = await getAvailableDates();
  const recentDates = dates.filter(d => d >= cutoffStr);
  const allItems: (ScanItem & { scanDate: string; displayDate: string })[] = [];

  for (const date of recentDates) {
    const scan = await getScanByDate(date);
    if (!scan) continue;
    for (const item of scan.items) {
      allItems.push({ ...item, scanDate: scan.date, displayDate: scan.displayDate });
    }
  }

  return { items: allItems };
}

export interface FramingComparison {
  headline: string;
  regions: string[];
  connection: string;
  category: string;
  significance: "high" | "medium" | "low";
  scanDate: string;
  displayDate: string;
}

/**
 * Collects items with a "framing" pattern across all scans.
 */
export async function getFramingItems(): Promise<FramingComparison[]> {
  // Try Supabase first if available
  if (supabase && (isVercel || !isLocal)) {
    return await getSupabaseFramingItems();
  }

  // Fallback to local filesystem
  const dates = await getAvailableDates();
  const items: FramingComparison[] = [];

  for (const date of dates) {
    const scan = await getScanByDate(date);
    if (!scan) continue;

    for (const item of scan.items) {
      if (item.patterns.includes("framing") || item.patterns.includes("omission")) {
        items.push({
          headline: item.headline,
          regions: item.regions,
          connection: item.connection,
          category: item.category,
          significance: item.significance,
          scanDate: scan.date,
          displayDate: scan.displayDate,
        });
      }
    }
  }

  return items;
}

/**
 * Returns framing notes from all scans, newest first.
 */
export async function getFramingNotes(): Promise<{ date: string; displayDate: string; note: string }[]> {
  const dates = await getAvailableDates();
  const notes: { date: string; displayDate: string; note: string }[] = [];

  for (const date of dates) {
    const scan = await getScanByDate(date);
    if (!scan || !scan.framingNote) continue;
    notes.push({
      date: scan.date,
      displayDate: scan.displayDate,
      note: scan.framingNote,
    });
  }

  return notes;
}
