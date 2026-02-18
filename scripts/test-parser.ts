#!/usr/bin/env npx tsx
/**
 * Quick test for the scan parser — runs locally without Supabase.
 * Usage: npx tsx scripts/test-parser.ts
 */

import * as fs from "fs";
import * as path from "path";

const SCANS_DIR = "/Users/treelight/.openclaw/workspace/memory/scans";

// Inline the parser functions so we can test without Supabase deps
function extractSection(md: string, label: string): string | null {
  const boldRegex = new RegExp(
    `\\*\\*${label}:?\\*\\*\\s*(.+?)(?=\\n\\*\\*|\\n---|\\n##|\\n\`\`\`|$)`,
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

function extractJsonBlocks(md: string): unknown[] {
  const items: unknown[] = [];
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)```/g;

  let match;
  while ((match = jsonBlockRegex.exec(md)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) items.push(...parsed);
    } catch (e) {
      console.warn("  Parse error:", (e as Error).message);
    }
  }
  return items;
}

// Test all scan files
const files = fs
  .readdirSync(SCANS_DIR)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
  .sort();

console.log(`Testing parser on ${files.length} scan files\n`);

for (const file of files) {
  const content = fs.readFileSync(path.join(SCANS_DIR, file), "utf-8");
  const items = extractJsonBlocks(content);
  const mood = extractSection(content, "Mood");
  const theme = extractSection(content, "Top theme") || extractSection(content, "Top Theme");

  console.log(`${file}:`);
  console.log(`  Theme: ${theme ? theme.substring(0, 80) + "..." : "(none)"}`);
  console.log(`  Mood:  ${mood || "(none)"}`);
  console.log(`  Items: ${items.length}`);
  if (items.length > 0) {
    const first = items[0] as { headline?: string };
    console.log(`  First: ${first.headline?.substring(0, 70)}...`);
  }
  console.log();
}

console.log("Parser test complete.");
