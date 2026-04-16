// src/lib/scan-parser-core.ts
//
// Pure markdown-parsing helpers extracted from scan-parser.ts so they can be
// shared between the homepage-render path (src/lib/scan-parser.ts) and the
// snapshot writer (scripts/write-site-snapshot.ts).
//
// No side effects. No filesystem. No Supabase. Just strings in → structure out.
//
// The writer script relies on these because the live `scans` table has had
// its `items` JSONB column empty for months — the real content lives in
// `raw_markdown` and the homepage parses it at render time via
// scan-parser.ts's filesystem path. The snapshot writer mirrors that parse
// logic so the snapshot reflects what the live site has always shown.

import type { ScanItem, PatternOfDay } from "./scan-types";

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function extractSection(md: string, label: string): string | null {
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

export function parsePatternOfDay(raw: string | null): PatternOfDay | null {
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

export function parseNotableItems(md: string): string[] {
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

export function extractJsonItems(md: string): ScanItem[] {
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
              perception_gap: item.perception_gap ?? null,
              coverage_breadth: item.coverage_breadth ?? null,
              regions_found: item.regions_found || [],
              regions_absent: item.regions_absent || [],
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

export function extractScanMeta(md: string): string | null {
  const metaMatch = md.match(/_Scan complete:\s*(.+?)_/);
  return metaMatch ? metaMatch[1].trim() : null;
}
