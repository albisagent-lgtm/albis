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
// Helpers
// ---------------------------------------------------------------------------

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function extractSection(md: string, label: string): string | null {
  const boldRegex = new RegExp(
    `\\*\\*${label}:?\\*\\*\\s*(.+?)(?=\\n\\*\\*[A-Z]|\\n---|\\n##|\\n\`\`\`|$)`,
    "is"
  );
  const boldMatch = md.match(boldRegex);
  if (boldMatch) return boldMatch[1].trim();

  const plainRegex = new RegExp(
    `^${label}:\\s*(.+?)(?=\\n[A-Z]\\w+:|\\n---|\\n##|\\n\`\`\`|$)`,
    "ims"
  );
  const plainMatch = md.match(plainRegex);
  return plainMatch ? plainMatch[1].trim() : null;
}

function parsePatternOfDay(raw: string | null): PatternOfDay | null {
  if (!raw) return null;

  const italicMatch = raw.match(/^\*([^*]+)\*\s*([\s\S]*)/);
  if (italicMatch) {
    return { title: italicMatch[1].trim(), body: italicMatch[2].trim() };
  }

  const boldMatch = raw.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)/);
  if (boldMatch) {
    return { title: boldMatch[1].trim(), body: boldMatch[2].trim() };
  }

  const sentenceMatch = raw.match(/^(.+?[.!?])\s+([\s\S]*)/);
  if (sentenceMatch) {
    return { title: sentenceMatch[1].trim(), body: sentenceMatch[2].trim() };
  }

  return { title: "", body: raw };
}

function parseNotableItems(md: string): string[] {
  const sectionRegex =
    /\*\*Notable(?:\s+headlines)?:?\*\*\s*\n([\s\S]+?)(?=\n\*\*[A-Z]|\n---|\n##|\n```|$)/i;
  const sectionMatch = md.match(sectionRegex);
  if (!sectionMatch) return [];

  return sectionMatch[1]
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.replace(/^[\s]*-\s*/, "").trim())
    .filter(Boolean);
}

function extractJsonItems(md: string): ScanItem[] {
  const items: ScanItem[] = [];
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
              significance: item.significance || "medium",
              connection: item.connection || "",
            });
          }
        }
      }
    } catch {
      // Skip malformed JSON blocks
    }
  }

  return items;
}

function extractScanMeta(md: string): string | null {
  const metaMatch = md.match(/_Scan complete:\s*(.+?)_/);
  return metaMatch ? metaMatch[1].trim() : null;
}

// ---------------------------------------------------------------------------
// Supabase data fetching (for Vercel/production)
// ---------------------------------------------------------------------------

async function getSupabaseScan(date: string, scanTime?: string): Promise<ParsedScan | null> {
  if (!supabase) return null;

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
      console.error('Supabase query error:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    // Use the latest scan's metadata but combine items from all scans for the day
    const latest = data[0];
    const allItems: any[] = [];
    for (const scan of data) {
      if (scan.items && Array.isArray(scan.items)) {
        allItems.push(...scan.items);
      }
    }

    // Extract framing note from framing_watch jsonb
    const framingWatch = latest.framing_watch;
    const framingNote = framingWatch?.note || null;
    
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
    };
  } catch (error) {
    console.error('Error fetching scan from Supabase:', error);
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
    const dates = Array.from(new Set(data.map((row: any) => String(row.scan_date))));
    return dates;
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
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})$/);
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
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getTodayScan(): Promise<ParsedScan | null> {
  const today = new Date().toISOString().split("T")[0];
  
  // Try Supabase first if we're on Vercel or local files don't exist
  if (supabase && (isVercel || !isLocal)) {
    return await getSupabaseScan(today);
  }
  
  // Fallback to local filesystem
  if (isLocal) {
    const filePath = path.join(SCANS_DIR, `${today}.md`);
    if (fs.existsSync(filePath)) {
      return parseScanFile(filePath);
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

  const files = fs
    .readdirSync(SCANS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  return parseScanFile(path.join(SCANS_DIR, files[0]));
}

export async function getScanByDate(date: string): Promise<ParsedScan | null> {
  // Try Supabase first if available
  if (supabase && (isVercel || !isLocal)) {
    return await getSupabaseScan(date);
  }

  // Fallback to local filesystem
  if (!isLocal) return null;
  
  const filePath = path.join(SCANS_DIR, `${date}.md`);
  if (!fs.existsSync(filePath)) return null;
  return parseScanFile(filePath);
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
