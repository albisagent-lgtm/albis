import * as fs from "fs";
import * as path from "path";

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

export function getTodayScan(): ParsedScan | null {
  const today = new Date().toISOString().split("T")[0];
  const filePath = path.join(SCANS_DIR, `${today}.md`);

  if (fs.existsSync(filePath)) {
    return parseScanFile(filePath);
  }

  return getLatestScan();
}

export function getLatestScan(): ParsedScan | null {
  if (!fs.existsSync(SCANS_DIR)) return null;

  const files = fs
    .readdirSync(SCANS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  return parseScanFile(path.join(SCANS_DIR, files[0]));
}

export function getScanByDate(date: string): ParsedScan | null {
  const filePath = path.join(SCANS_DIR, `${date}.md`);
  if (!fs.existsSync(filePath)) return null;
  return parseScanFile(filePath);
}

/**
 * Returns all available scan dates (YYYY-MM-DD), newest first.
 */
export function getAvailableDates(): string[] {
  if (!fs.existsSync(SCANS_DIR)) return [];

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
export function getFramingItems(): FramingComparison[] {
  const dates = getAvailableDates();
  const items: FramingComparison[] = [];

  for (const date of dates) {
    const scan = getScanByDate(date);
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
export function getFramingNotes(): { date: string; displayDate: string; note: string }[] {
  const dates = getAvailableDates();
  const notes: { date: string; displayDate: string; note: string }[] = [];

  for (const date of dates) {
    const scan = getScanByDate(date);
    if (!scan || !scan.framingNote) continue;
    notes.push({
      date: scan.date,
      displayDate: scan.displayDate,
      note: scan.framingNote,
    });
  }

  return notes;
}
