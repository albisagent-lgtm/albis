#!/usr/bin/env tsx
// scripts/write-site-snapshot.ts
//
// Writes the singleton `site_snapshot` row (and logs to pipeline_runs).
//
// Runs as the FINAL step of the OpenClaw scan pipeline: after the scan,
// briefing, PGI/GAI ingests have all completed, this script pre-computes
// the view the public site needs and upserts it into Supabase.
//
// Philosophy: this writer is a thin "pre-compute what the homepage computes,
// store it in a row" layer. It uses the SAME data-fetching paths the live
// homepage uses:
//   - Scan: getTodayScan() from src/lib/scan-parser.ts (verbatim)
//   - Briefing: the same select the homepage runs in src/app/page.tsx
//   - Top PGI / GAI: pgi_daily and gai_daily tables (per § D of the plan)
//   - Breaking news: the same select /api/breaking runs
// If the homepage works, this writer works.
//
// See docs/Cloudflare_Execution_Plan.md § D for the contract and
// supabase/migrations/20260416_site_snapshot.sql for the schema.
//
// Usage:
//   npx tsx scripts/write-site-snapshot.ts            # writes for real
//   npx tsx scripts/write-site-snapshot.ts --dry-run  # prints what it would write, no DB mutation
//
// Required env vars (loaded from .env.local at repo root):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Exit codes:
//   0 — snapshot written successfully (status "success" or "partial")
//   1 — fatal failure (no scan, DB connectivity, etc.); pipeline_runs is
//       updated with snapshot_status = "failed" and snapshot_error set
//       before exit, so OpenClaw can see the failure.
//
// Contract:
//   - Idempotent. Running twice in a row produces the same result.
//   - Partial-safe per source. Scan, briefing, PGI, GAI, breaking are each
//     independent: missing one doesn't block the others. Whichever sources
//     return data get written; missing sources are recorded in
//     pipeline_runs.snapshot_summary.skipped and their fields stay null.
//   - Fails (exit 1) only if ALL sources are empty — scan null AND no briefing
//     row AND pgi_daily empty AND gai_daily empty. (Breaking is excluded from
//     the fail condition because "no active breaking news" is the normal state.)
//
// Note on scan-tolerance: the upstream scans ingest is a known-unreliable
// pipeline (see ~/Desktop/Albis_Post_Migration_ToFix.md — deferred to
// post-migration). Until that's fixed the writer must not block on scan
// being absent; we still want the briefing / PGI / GAI / breaking fields
// refreshed for whichever sources do have data.

// Standalone tsx scripts don't auto-load .env.local the way Next.js does,
// so we load it explicitly before anything else. This must happen BEFORE
// the dynamic import of scan-parser below — scan-parser reads env vars at
// module-load time to build its Supabase client, and ES-module static
// imports are hoisted above this call.
//
// dotenv is optional: on machines where it isn't installed (e.g. the
// OpenClaw host) the env vars are expected to already be present in the
// process environment, so we try to load it and silently skip if missing.
import { resolve } from "path";
import { createRequire } from "module";
try {
  const require = createRequire(import.meta.url);
  const { config } = require("dotenv");
  config({ path: resolve(process.cwd(), ".env.local") });
} catch {
  // dotenv not installed — assume env vars are already set in the environment.
}

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// CLI + env
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes("--dry-run");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "[write-site-snapshot] missing env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayInNZ(): string {
  const now = new Date();
  const nz = new Date(now.getTime() + 13 * 60 * 60 * 1000);
  return nz.toISOString().split("T")[0];
}

function parseExplicitDate(): string | null {
  const dateArg = process.argv.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg));
  return dateArg || null;
}

// ---------------------------------------------------------------------------
// Source fetchers — each returns null if its source is unavailable, never
// throws. The scan fetch is the hard dependency, handled in main() directly
// via getTodayScan().
// ---------------------------------------------------------------------------

interface BriefingSource {
  date: string;
  title: string | null;
  summary: string | null;
  top_stories: unknown[];
  story_count: number | null;
  pgi_score: number | null;
}

async function fetchLatestBriefing(targetDate?: string): Promise<BriefingSource | null> {
  let query = supabase
    .from("briefings")
    .select("date, title, summary, top_stories, story_count, pgi_score");
  if (targetDate) query = query.eq("date", targetDate);
  const { data, error } = await query
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    date: String(data.date),
    title: data.title ?? null,
    summary: data.summary ?? null,
    top_stories: Array.isArray(data.top_stories) ? data.top_stories : [],
    story_count: data.story_count ?? null,
    pgi_score: data.pgi_score ?? null,
  };
}

interface PgiSource {
  daily_pgi: number | null;
  top_story_headline: string | null;
  top_story_slug: string | null;
}

async function fetchTopPgi(targetDate?: string): Promise<PgiSource | null> {
  let dailyQuery = supabase.from("pgi_daily").select("daily_pgi");
  if (targetDate) dailyQuery = dailyQuery.eq("date", targetDate);
  const { data: daily } = await dailyQuery
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Headline/slug come from pgi_story_scores (pgi_daily has no per-story
  // fields). Best-effort: if this table is empty the headline stays null
  // and we still record the aggregate score.
  let storyQuery = supabase
    .from("pgi_story_scores")
    .select("story_headline, story_slug")
    .order("story_pgi", { ascending: false });
  if (targetDate) storyQuery = storyQuery.eq("scan_date", targetDate);
  else storyQuery = storyQuery.eq("is_latest", true);
  const { data: story } = await storyQuery.limit(1).maybeSingle();

  if (!daily && !story) return null;
  return {
    daily_pgi: daily?.daily_pgi ?? null,
    top_story_headline: story?.story_headline ?? null,
    top_story_slug: story?.story_slug ?? null,
  };
}

interface GaiSource {
  daily_gai: number | null;
  top_story_headline: string | null;
  top_story_gai: number | null;
}

async function fetchTopGai(targetDate?: string): Promise<GaiSource | null> {
  let query = supabase
    .from("gai_daily")
    .select("daily_gai, most_invisible_story, most_invisible_gai");
  if (targetDate) query = query.eq("date", targetDate);
  const { data } = await query
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    daily_gai: data.daily_gai ?? null,
    top_story_headline: data.most_invisible_story ?? null,
    top_story_gai: data.most_invisible_gai ?? null,
  };
}

interface BreakingSource {
  headline: string;
  url: string | null;
  expires_at: string | null;
}

async function fetchActiveBreaking(): Promise<BreakingSource | null> {
  // Same select as src/app/api/breaking/route.ts:37-43.
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("breaking_news")
    .select("headline, url, expires_at")
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    headline: String(data.headline),
    url: data.url ?? null,
    expires_at: data.expires_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// pipeline_runs logging (writes to the existing table; snapshot_* columns
// are added by supabase/migrations/20260416_site_snapshot.sql)
// ---------------------------------------------------------------------------

async function logToPipelineRuns(
  runDate: string,
  status: "success" | "partial" | "failed",
  summary: Record<string, unknown>,
  error?: string
): Promise<void> {
  const payload = {
    run_date: runDate,
    snapshot_written_at: new Date().toISOString(),
    snapshot_status: status,
    snapshot_summary: summary,
    snapshot_error: error ?? null,
  };
  const { error: upsertErr } = await supabase
    .from("pipeline_runs")
    .upsert(payload, { onConflict: "run_date" });
  if (upsertErr) {
    // Best-effort — surface to stderr so OpenClaw can see it, but the
    // snapshot write itself is what matters.
    console.warn("[write-site-snapshot] pipeline_runs log failed:", upsertErr.message);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const today = parseExplicitDate() || todayInNZ();
  const skipped: string[] = [];

  console.log(`[write-site-snapshot] starting (today=${today}, dryRun=${DRY_RUN})`);

  const { getTodayScan, getScanByDate } = await import("../src/lib/scan-parser");

  const hasScanItems = (s: Awaited<ReturnType<typeof getTodayScan>>) =>
    !!s && Array.isArray(s.items) && s.items.length > 0;

  const loadRequestedScan = async () => {
    const explicitDate = parseExplicitDate();
    if (explicitDate) {
      return await getScanByDate(explicitDate).catch((err) => {
        console.warn("[write-site-snapshot] getScanByDate threw:", err);
        return null;
      });
    }
    return await getTodayScan().catch((err) => {
      console.warn("[write-site-snapshot] getTodayScan threw:", err);
      return null;
    });
  };

  const [scanRaw, briefing, pgi, gai, breaking] = await Promise.all([
    loadRequestedScan(),
    fetchLatestBriefing(today),
    fetchTopPgi(today),
    fetchTopGai(today),
    fetchActiveBreaking(),
  ]);

  // Treat an empty-items scan the same as a missing scan — we have no content
  // to write into scan_* fields either way.
  const scan = hasScanItems(scanRaw) ? scanRaw : null;

  if (!scan) skipped.push("scan");
  if (!briefing) skipped.push("briefing");
  if (!pgi) skipped.push("pgi_daily");
  if (!gai) skipped.push("gai_daily");
  if (!breaking) skipped.push("breaking");

  // Step 2: all-sources-empty guard. Fail only if every primary source is
  // empty. Breaking news is excluded because "no active breaking" is normal.
  if (!scan && !briefing && !pgi && !gai) {
    const msg =
      `All primary sources empty (scan, briefings, pgi_daily, gai_daily) for ${today}. ` +
      `Snapshot not written.`;
    console.error(`[write-site-snapshot] FATAL: ${msg}`);
    if (!DRY_RUN) {
      await logToPipelineRuns(today, "failed", { reason: "all_sources_empty", skipped }, msg);
    }
    process.exit(1);
  }

  if (!scan) {
    console.warn(
      "[write-site-snapshot] scan source missing/empty — scan_* fields will be written as null/[]. " +
        "Proceeding with briefing/PGI/GAI/breaking."
    );
  }

  // Step 3: compose the snapshot row from ParsedScan + best-effort sources.
  // Every scan-derived field is null-safe — if `scan` is null we leave those
  // columns null / items = [] and rely on the reader's isEmpty sentinel.
  const snapshotRow = {
    id: 1,
    updated_at: new Date().toISOString(),

    // From ParsedScan (null-safe — scan may be missing)
    scan_date: scan?.date ?? null,
    scan_period: null, // ParsedScan doesn't surface scan_time
    scan_display_date: scan?.displayDate ?? null,
    top_theme: scan?.topTheme ?? null,
    mood: scan?.mood ?? null,
    framing_note: scan?.framingNote ?? null,
    pattern_of_day: scan?.patternOfDay ?? null,
    items: scan?.items ?? [],
    // Blindspot precomputation is left to the homepage for now — a later PR
    // can move detectBlindspots() output into this column.
    blindspot_story_slugs: [] as string[],

    // From briefings (matches the select in src/app/page.tsx:262-269)
    briefing_date: briefing?.date ?? null,
    briefing_title: briefing?.title ?? null,
    briefing_summary: briefing?.summary ?? null,
    briefing_top_stories: briefing?.top_stories ?? null,
    briefing_story_count: briefing?.story_count ?? null,
    briefing_pgi_score: briefing?.pgi_score ?? null,

    // From pgi_daily + pgi_story_scores
    top_pgi_story: pgi?.top_story_headline ?? null,
    top_pgi_score: pgi?.daily_pgi ?? null,
    top_pgi_story_slug: pgi?.top_story_slug ?? null,

    // From gai_daily (natively has most_invisible_story + most_invisible_gai)
    top_gai_story: gai?.top_story_headline ?? null,
    top_gai_score: gai?.top_story_gai ?? gai?.daily_gai ?? null,

    // Global mood + counts (scan-derived — null-safe)
    global_mood: scan?.mood ?? null,
    stories_found: scan?.items.length ?? null,

    // Breaking news
    breaking_active: breaking !== null,
    breaking_headline: breaking?.headline ?? null,
    breaking_url: breaking?.url ?? null,
    breaking_expires_at: breaking?.expires_at ?? null,
  };

  const summary = {
    scan_date: scan?.date ?? null,
    items_count: scan?.items.length ?? 0,
    briefing_date: briefing?.date ?? null,
    daily_pgi: pgi?.daily_pgi ?? null,
    daily_gai: gai?.daily_gai ?? null,
    breaking_active: breaking !== null,
    skipped,
  };

  // Status: success only if every primary source populated; partial if any
  // are missing but at least one has data; failed is handled above via exit 1.
  const status: "success" | "partial" = skipped.length === 0 ? "success" : "partial";

  const written = [
    scan ? "scan" : null,
    briefing ? "briefing" : null,
    pgi ? "pgi_daily" : null,
    gai ? "gai_daily" : null,
    breaking ? "breaking" : null,
  ].filter(Boolean) as string[];

  console.log(
    `[write-site-snapshot] sources: written=[${written.join(",") || "(none)"}] ` +
      `skipped=[${skipped.join(",") || "(none)"}]`
  );

  if (DRY_RUN) {
    console.log(
      "[write-site-snapshot] DRY RUN — would upsert site_snapshot with:\n" +
        JSON.stringify(snapshotRow, null, 2)
    );
    console.log(
      "[write-site-snapshot] DRY RUN — would log to pipeline_runs:\n" +
        JSON.stringify({ run_date: today, status, summary }, null, 2)
    );
    console.log(
      `[write-site-snapshot] DRY RUN complete. status=${status} skipped=${skipped.join(",") || "(none)"}`
    );
    process.exit(0);
  }

  const { error: snapErr } = await supabase
    .from("site_snapshot")
    .upsert(snapshotRow, { onConflict: "id" });
  if (snapErr) {
    console.error("[write-site-snapshot] FATAL: site_snapshot upsert failed:", snapErr.message);
    await logToPipelineRuns(today, "failed", { reason: "upsert_error", ...summary }, snapErr.message);
    process.exit(1);
  }

  await logToPipelineRuns(today, status, summary);

  console.log(
    `[write-site-snapshot] done. status=${status} items=${scan?.items.length ?? 0} skipped=${skipped.join(",") || "(none)"}`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[write-site-snapshot] unexpected error:", err);
  const today = todayInNZ();
  logToPipelineRuns(today, "failed", { reason: "unexpected_error" }, String(err?.message ?? err))
    .catch(() => {})
    .finally(() => process.exit(1));
});
