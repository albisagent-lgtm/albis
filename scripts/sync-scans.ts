#!/usr/bin/env npx tsx
/**
 * Albis Scan Sync Script
 *
 * Parses scan markdown files from the scans directory,
 * extracts structured JSON blocks and metadata,
 * and upserts them into Supabase.
 *
 * Usage:
 *   npx tsx scripts/sync-scans.ts                    # sync all scan files
 *   npx tsx scripts/sync-scans.ts 2026-02-18         # sync a specific date
 *   npx tsx scripts/sync-scans.ts --today             # sync today only
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SCANS_DIR =
  process.env.SCANS_DIR ||
  "/Users/treelight/.openclaw/workspace/memory/scans";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Error: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ScanItem {
  headline: string;
  category: string;
  regions: string[];
  tags: string[];
  patterns: string[];
  significance: string;
  connection: string;
}

interface ParsedScan {
  date: string;
  scanTime: string;
  topTheme: string | null;
  mood: string | null;
  patternSummary: string | null;
  weatherSummary: string | null;
  flowsSummary: string | null;
  framingSummary: string | null;
  notableSummary: string | null;
  rawMarkdown: string;
  items: ScanItem[];
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------
function extractSection(md: string, label: string): string | null {
  // Try bold format first: "**Mood:** Urgent. Fragmented."
  const boldRegex = new RegExp(
    `\\*\\*${label}:?\\*\\*\\s*(.+?)(?=\\n\\*\\*|\\n---|\\n##|\\n\`\`\`|$)`,
    "is"
  );
  const boldMatch = md.match(boldRegex);
  if (boldMatch) return boldMatch[1].trim();

  // Fallback: plain text format "Mood: Tense." (line starts with label)
  const plainRegex = new RegExp(
    `^${label}:\\s*(.+?)(?=\\n[A-Z]\\w+:|\\n---|\\n##|\\n\`\`\`|$)`,
    "ims"
  );
  const plainMatch = md.match(plainRegex);
  return plainMatch ? plainMatch[1].trim() : null;
}

function extractNotable(md: string): string | null {
  // Bold format with bullet points
  const boldRegex =
    /\*\*Notable:?\*\*\s*\n([\s\S]+?)(?=\n\*\*[A-Z]|\n---|\n##|\n```|$)/i;
  const boldMatch = md.match(boldRegex);
  if (boldMatch) return boldMatch[1].trim();

  // Fallback: single-line bold or plain format
  return extractSection(md, "Notable");
}

function extractJsonBlocks(md: string): ScanItem[] {
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
    } catch (e) {
      console.warn("  Warning: Failed to parse JSON block:", (e as Error).message);
    }
  }

  return items;
}

function detectScanTime(md: string): string {
  // Look for AM/PM indicators in headers
  if (/##\s*AM\s+Scan/i.test(md)) return "am";
  return "pm"; // default to PM
}

function parseScanFile(filePath: string): ParsedScan | null {
  const filename = path.basename(filePath, ".md");

  // Only process YYYY-MM-DD format files
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (!dateMatch) {
    return null;
  }

  const date = dateMatch[1];
  const content = fs.readFileSync(filePath, "utf-8");

  const scanTime = detectScanTime(content);

  return {
    date,
    scanTime,
    topTheme:
      extractSection(content, "Top theme") ||
      extractSection(content, "Top Theme"),
    mood: extractSection(content, "Mood"),
    patternSummary: extractSection(content, "Pattern"),
    weatherSummary: extractSection(content, "Weather"),
    flowsSummary: extractSection(content, "Flows"),
    framingSummary: extractSection(content, "Framing"),
    notableSummary: extractNotable(content),
    rawMarkdown: content,
    items: extractJsonBlocks(content),
  };
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------
async function syncScan(parsed: ParsedScan): Promise<void> {
  console.log(
    `  Syncing ${parsed.date} (${parsed.scanTime}) — ${parsed.items.length} items`
  );

  // Upsert the scan record
  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .upsert(
      {
        scan_date: parsed.date,
        scan_time: parsed.scanTime,
        top_theme: parsed.topTheme,
        mood: parsed.mood,
        pattern_summary: parsed.patternSummary,
        weather_summary: parsed.weatherSummary,
        flows_summary: parsed.flowsSummary,
        framing_summary: parsed.framingSummary,
        notable_summary: parsed.notableSummary,
        raw_markdown: parsed.rawMarkdown,
        item_count: parsed.items.length,
      },
      { onConflict: "scan_date,scan_time" }
    )
    .select("id")
    .single();

  if (scanError) {
    console.error(`  Error upserting scan: ${scanError.message}`);
    return;
  }

  const scanId = scan.id;

  // Delete existing items for this scan (idempotent re-sync)
  const { error: deleteError } = await supabase
    .from("scan_items")
    .delete()
    .eq("scan_id", scanId);

  if (deleteError) {
    console.error(`  Error deleting old items: ${deleteError.message}`);
    return;
  }

  // Insert new items
  if (parsed.items.length > 0) {
    const rows = parsed.items.map((item) => ({
      scan_id: scanId,
      headline: item.headline,
      category: item.category,
      regions: item.regions,
      tags: item.tags,
      patterns: item.patterns,
      significance: item.significance,
      connection: item.connection,
    }));

    const { error: insertError } = await supabase
      .from("scan_items")
      .insert(rows);

    if (insertError) {
      console.error(`  Error inserting items: ${insertError.message}`);
      return;
    }
  }

  console.log(`  Done: ${parsed.date} synced (${parsed.items.length} items)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let files: string[];

  if (args.includes("--today")) {
    const today = new Date().toISOString().split("T")[0];
    const todayFile = path.join(SCANS_DIR, `${today}.md`);
    if (!fs.existsSync(todayFile)) {
      console.error(`No scan file found for today (${today})`);
      process.exit(1);
    }
    files = [todayFile];
  } else if (args.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(args[0])) {
    const dateFile = path.join(SCANS_DIR, `${args[0]}.md`);
    if (!fs.existsSync(dateFile)) {
      console.error(`No scan file found for ${args[0]}`);
      process.exit(1);
    }
    files = [dateFile];
  } else {
    // Sync all YYYY-MM-DD.md files
    files = fs
      .readdirSync(SCANS_DIR)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .map((f) => path.join(SCANS_DIR, f));
  }

  console.log(`Albis Scan Sync — ${files.length} file(s) to process\n`);

  let synced = 0;
  let skipped = 0;

  for (const file of files) {
    const parsed = parseScanFile(file);
    if (!parsed) {
      console.log(`  Skipping ${path.basename(file)} (not a date-format scan)`);
      skipped++;
      continue;
    }

    await syncScan(parsed);
    synced++;
  }

  console.log(`\nComplete: ${synced} synced, ${skipped} skipped`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
