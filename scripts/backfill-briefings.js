#!/usr/bin/env node
/**
 * Backfill briefings: clean titles, generate proper markdown from scan data,
 * populate PGI scores and story counts.
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://wguydvzpxwsgrhvojpnk.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndXlkdnpweHdzZ3Jodm9qcG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzg1MiwiZXhwIjoyMDg3MDk5ODUyfQ.KuAP49LLd77I3dfM6PIwQ8u0qErrURYMvbq-Snw3gDU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function cleanTitle(title, date) {
  // Strip " — YYYY-MM-DD" suffix
  let t = title.replace(/\s*—\s*\d{4}-\d{2}-\d{2}\s*$/, "");
  // Truncate to ~80 chars at word boundary
  if (t.length > 80) {
    t = t.substring(0, 77).replace(/\s+\S*$/, "") + "…";
  }
  return t;
}

function cleanMood(mood) {
  if (!mood) return null;
  // Just keep the first word/short phrase
  const m = mood.trim();
  if (m.length <= 20) return m;
  // Take first word
  return m.split(/[\s,;:—–-]/)[0];
}

function contentIsBroken(content_md) {
  if (!content_md || content_md.length < 50) return true;
  // Check for raw JSON dumps
  if (content_md.includes("```json")) return true;
  if (content_md.includes("[Content as provided above]")) return true;
  if (content_md.includes("[object Object]")) return true;
  // If more than 30% is JSON-like
  const jsonBlocks = content_md.match(/\{[\s\S]*?\}/g);
  if (jsonBlocks) {
    const jsonLen = jsonBlocks.reduce((s, b) => s + b.length, 0);
    if (jsonLen / content_md.length > 0.3) return true;
  }
  return false;
}

function generateMarkdown(scans, date) {
  if (!scans || scans.length === 0) return null;

  const lines = [];

  // Collect all items across scans for the day, deduplicate by headline
  const seen = new Set();
  const allItems = [];
  let topTheme = null;
  let patternOfDay = null;
  let framingWatch = null;

  // Process scans in order: AM, Midday, PM
  const order = { AM: 0, Midday: 1, PM: 2 };
  scans.sort((a, b) => (order[a.scan_time] || 0) - (order[b.scan_time] || 0));

  for (const scan of scans) {
    if (scan.top_theme && !topTheme) topTheme = scan.top_theme;
    if (scan.pattern_of_day && !patternOfDay) {
      if (typeof scan.pattern_of_day === 'object') {
        patternOfDay = scan.pattern_of_day.body || scan.pattern_of_day.title || null;
      } else {
        patternOfDay = scan.pattern_of_day;
      }
    }
    if (scan.framing_watch && !framingWatch) framingWatch = scan.framing_watch;
    if (scan.items && Array.isArray(scan.items)) {
      for (const item of scan.items) {
        if (item.headline && !seen.has(item.headline)) {
          seen.add(item.headline);
          allItems.push(item);
        }
      }
    }
  }

  if (allItems.length === 0 && !topTheme) return null;

  // Theme intro
  if (topTheme) {
    lines.push(`*${topTheme}*\n`);
  }

  // Pattern of the day
  if (patternOfDay) {
    lines.push(`**Pattern of the Day:** ${patternOfDay}\n`);
  }

  // Group items by category
  const categories = {};
  for (const item of allItems) {
    const cat = item.category || "Other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  }

  for (const [cat, items] of Object.entries(categories)) {
    lines.push(`## ${cat}\n`);
    for (const item of items) {
      lines.push(`### ${item.headline}\n`);
      if (item.connection) {
        lines.push(`${item.connection}\n`);
      }
      if (item.significance && !['high','medium','low'].includes(item.significance)) {
        lines.push(`> ${item.significance}\n`);
      }
      // Tags as subtle metadata
      if (item.regions && item.regions.length > 0) {
        lines.push(`*${item.regions.join(" · ")}*\n`);
      }
    }
  }

  // Framing watch
  if (framingWatch) {
    lines.push(`---\n`);
    lines.push(`## Framing Watch\n`);
    lines.push(`${framingWatch}\n`);
  }

  return lines.join("\n");
}

async function main() {
  // Fetch all briefings
  const { data: briefings, error: bErr } = await supabase
    .from("briefings")
    .select("*")
    .order("date", { ascending: true });

  if (bErr) {
    console.error("Failed to fetch briefings:", bErr);
    process.exit(1);
  }

  console.log(`Found ${briefings.length} briefings to process\n`);

  // Fetch all PGI data
  const { data: pgis } = await supabase.from("pgi_daily").select("date, daily_pgi");
  const pgiMap = {};
  if (pgis) pgis.forEach((p) => (pgiMap[p.date] = p.daily_pgi));

  for (const b of briefings) {
    const updates = {};
    let changed = false;

    // Clean title
    const newTitle = cleanTitle(b.title, b.date);
    if (newTitle !== b.title) {
      updates.title = newTitle;
      changed = true;
    }

    // Clean mood
    const newMood = cleanMood(b.mood);
    if (newMood !== b.mood) {
      updates.mood = newMood;
      changed = true;
    }

    // PGI score
    if (b.pgi_score == null && pgiMap[b.date]) {
      updates.pgi_score = pgiMap[b.date];
      changed = true;
    }

    // Fetch scans for this date
    const { data: scans } = await supabase
      .from("scans")
      .select("scan_time, top_theme, pattern_of_day, framing_watch, items, mood")
      .eq("scan_date", b.date);

    // Update story count from actual scan items
    if (scans && scans.length > 0) {
      const seen = new Set();
      let count = 0;
      for (const scan of scans) {
        if (scan.items && Array.isArray(scan.items)) {
          for (const item of scan.items) {
            if (item.headline && !seen.has(item.headline)) {
              seen.add(item.headline);
              count++;
            }
          }
        }
      }
      if (count > 0 && count !== b.story_count) {
        updates.story_count = count;
        changed = true;
      }
    }

    // Fix broken content
    if (contentIsBroken(b.content_md) && scans && scans.length > 0) {
      const md = generateMarkdown(scans, b.date);
      if (md) {
        updates.content_md = md;
        changed = true;
      }
    }

    if (changed) {
      updates.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("briefings")
        .update(updates)
        .eq("date", b.date);

      if (error) {
        console.error(`  ✗ ${b.date}: ${error.message}`);
      } else {
        const fields = Object.keys(updates).filter((k) => k !== "updated_at");
        console.log(`  ✓ ${b.date}: updated ${fields.join(", ")}`);
      }
    } else {
      console.log(`  - ${b.date}: no changes needed`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
