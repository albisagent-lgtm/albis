/**
 * Backfill briefings table from existing scan data in Supabase.
 * Run: npx tsx scripts/backfill-briefings.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually without dotenv
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface ScanRow {
  scan_date: string;
  scan_time: string;
  mood: string | null;
  top_theme: string | null;
  items: any[];
  raw_markdown: string | null;
  human_summary: string | null;
}

async function main() {
  console.log("Fetching scans...");

  const { data: scans, error } = await supabase
    .from("scans")
    .select("scan_date, scan_time, mood, top_theme, items, raw_markdown, human_summary")
    .order("scan_date", { ascending: true });

  if (error) {
    console.error("Error fetching scans:", error.message);
    process.exit(1);
  }

  if (!scans || scans.length === 0) {
    console.log("No scans found. Nothing to backfill.");
    return;
  }

  // Group scans by date
  const byDate = new Map<string, ScanRow[]>();
  for (const scan of scans) {
    const existing = byDate.get(scan.scan_date) || [];
    existing.push(scan);
    byDate.set(scan.scan_date, existing);
  }

  console.log(`Found ${byDate.size} unique dates with scan data.`);

  let created = 0;
  let failed = 0;

  for (const [date, dayScans] of byDate) {
    // Aggregate data from all scans of the day
    const allItems = dayScans.flatMap((s) => s.items || []);
    const mood = dayScans.find((s) => s.mood)?.mood || null;
    const topTheme = dayScans.find((s) => s.top_theme)?.top_theme || null;
    const summary = dayScans.find((s) => s.human_summary)?.human_summary || null;

    // Build top stories from items
    const topStories = allItems
      .slice(0, 5)
      .map((item: any) => ({
        headline: item.headline || item.title || "Unknown",
        region: item.region || null,
        category: item.category || null,
      }));

    // Build content from raw markdown or items
    const rawMd = dayScans
      .map((s) => s.raw_markdown)
      .filter(Boolean)
      .join("\n\n---\n\n");

    const contentMd =
      rawMd ||
      allItems
        .map(
          (item: any) =>
            `### ${item.headline || item.title || "Story"}\n${item.summary || item.description || ""}`
        )
        .join("\n\n");

    if (!contentMd) {
      console.log(`  Skipping ${date} — no content`);
      continue;
    }

    const title = topTheme
      ? `${topTheme} — ${date}`
      : `Albis Daily Briefing — ${date}`;

    const { error: upsertError } = await supabase.from("briefings").upsert(
      {
        date,
        title,
        summary,
        content_md: contentMd,
        mood,
        story_count: allItems.length,
        top_stories: topStories,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "date" }
    );

    if (upsertError) {
      console.error(`  Failed ${date}:`, upsertError.message);
      failed++;
    } else {
      console.log(`  ✓ ${date} (${allItems.length} stories)`);
      created++;
    }
  }

  console.log(`\nDone. Created/updated: ${created}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
