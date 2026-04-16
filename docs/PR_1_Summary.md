# PR 1 — Introduce site_snapshot contract and switch homepage to snapshot read

First PR of the Cloudflare migration sequence. Foundation for every subsequent PR: establishes the singleton snapshot row that replaces live "today" computation on the public site. Safe to ship on Vercel before any Cloudflare work begins.

Adapter choice for later PRs: **`@opennextjs/cloudflare` (OpenNext)**, per Q2.

## What changed

**Created:**
- `supabase/migrations/20260416_site_snapshot.sql` — new `site_snapshot` singleton table + four `snapshot_*` columns added to existing `pipeline_runs` + RLS policies + seeded row.
- `scripts/write-site-snapshot.ts` — standalone writer for OpenClaw to invoke after each scan run. Idempotent, fail-loud, partial-safe, `--dry-run` supported. Reads `scans.raw_markdown` and parses it via scan-parser-core (see "Data-source reality check" below).
- `src/lib/site-snapshot.ts` — `getSiteSnapshot()` reader used by public pages. Never throws; returns empty-state sentinel if the row isn't populated.
- `src/lib/scan-parser-core.ts` — pure markdown-parsing helpers extracted from `scan-parser.ts` so the writer and the render path can share them.
- `docs/Post_Migration_Backlog.md` — captures deferred items from open questions Q3 (per-article OG), Q5 (drop `scan_pulse` after PR 3), Q7 (orphan scripts), Q10 (`/admin` localStorage gate), and now Q-added: fixing `scans.items` ingest.

**Modified:**
- `src/app/page.tsx` — single `getSiteSnapshot()` call replaces `getTodayScan()` and the second admin-client read for `briefings`. Empty-state renders a calm "Today's briefing is being prepared." in the briefing-taster slot. `revalidate = 300` preserved. No styling or component restructuring.
- `src/app/api/scans/today/route.ts` — reads from `getSiteSnapshot()`; response shape unchanged (`{ date, items: [{ headline, connection }] }`); removed `force-dynamic`; added `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`; empty snapshot returns `{ date: null, items: [] }` with HTTP 200.
- `src/lib/scan-parser.ts` — replaced six inline markdown-helper functions with imports from `scan-parser-core.ts`. No behaviour change. See "Data-source reality check" for rationale.

## Why

From `docs/Cloudflare_Execution_Plan.md` § H: the homepage today runs `getTodayScan()` (dual Supabase/filesystem code path, 600 lines of branching in `scan-parser.ts`) plus a second admin-client read for `briefings` on every 5-minute revalidate. Both are replaced by one small read of the `site_snapshot` singleton row, which OpenClaw populates at the end of each scan run. This is the architectural foundation every subsequent snapshot-consumer PR (PR 3 for `/lens`, `/trending`, `/api/scan/pulse`, `/api/top-story`, `/api/breaking`) is built on.

## SQL migration to run

**Plain-English summary** of what the SQL does (same content as the header of the .sql file, for easy review):

1. Creates the `site_snapshot` table — singleton row, always `id = 1`, holds pre-computed scan + briefing + top-PGI/GAI + breaking-news data.
2. Seeds the singleton row with null/empty values so consuming code always finds exactly one row. The reader treats an unpopulated row as "empty" and the homepage renders a calm empty-state message.
3. Enables RLS on `site_snapshot` with policies: `service_role` full access (for the writer script), `anon` + `authenticated` SELECT-only (for public site reads).
4. Adds four columns to the existing `pipeline_runs` table — `snapshot_written_at`, `snapshot_status` (success/partial/failed), `snapshot_summary` JSONB, `snapshot_error`. The snapshot writer upserts these on the `run_date = today` row alongside the existing daily pipeline tracking.

**Deviation from the execution plan § D.3:** `scan_date` and `items` are created WITHOUT `NOT NULL` constraints. The plan declared them NOT NULL, but that conflicted with the brief's instruction to seed a singleton row with empty values. The writer script's fail-loud contract enforces the invariant at write time — if a scan is missing it throws, rather than writing nulls. So in practice these fields are never null after the first real run. Accepted tradeoff; flagged here for review.

**The SQL to paste into Supabase Dashboard → SQL Editor → New query → Run:**

```sql
-- 2026-04-16 — Introduce site_snapshot contract
--
-- WHAT THIS MIGRATION DOES (plain English):
--
-- 1. Creates a new table `site_snapshot` — a singleton row (always id = 1)
--    that holds a pre-computed snapshot of everything the public site needs
--    to render: today's scan items, today's briefing header, the top PGI/GAI
--    stories, global mood, and active breaking news.
--
--    The idea: the homepage and /api/scans/today currently rebuild this view
--    from 3-5 separate Supabase reads (plus a filesystem read in dev) on every
--    request. This table replaces all of that with ONE small read. The OpenClaw
--    pipeline populates it as the final step of each scan run.
--
-- 2. Adds four columns to the EXISTING `pipeline_runs` table (which today
--    tracks the daily briefing pipeline: scan → tagging → generation → delivery):
--      - snapshot_written_at   — when the snapshot writer last ran for this day
--      - snapshot_status       — success | partial | failed
--      - snapshot_summary      — JSONB: what fields were written / skipped
--      - snapshot_error        — free-text error message on failure
--
--    We reuse pipeline_runs rather than create a new log table because the
--    snapshot write is genuinely the final step of the daily pipeline.
--
-- 3. Seeds a single row in site_snapshot (id = 1) with null/empty values so
--    consuming code always finds exactly one row. The reader (getSiteSnapshot
--    in src/lib/site-snapshot.ts) treats an unpopulated row as "empty" and
--    the homepage renders a calm empty-state message.
--
-- 4. Adds RLS policies:
--      - service_role → full read/write (used by the snapshot writer script)
--      - anon + authenticated → SELECT only (used by the public site)
--
-- HOW TO RUN THIS:
--   Paste the contents into Supabase Dashboard → SQL Editor → New query → Run.
--
-- DEVIATIONS FROM Cloudflare_Execution_Plan.md § D.3:
--   - scan_date and items are created WITHOUT NOT NULL constraints. The plan
--     document declared them NOT NULL, but that conflicts with the requirement
--     to seed a singleton row with empty values on first deploy. The writer
--     script's fail-loud contract enforces the invariant at write time — if
--     a scan is missing it throws, rather than writing nulls. So in practice
--     these fields are never null after the first real run.

begin;

-- ============================================================
-- 1) CREATE site_snapshot (singleton)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.site_snapshot (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scan-derived fields (replaces getTodayScan() from src/lib/scan-parser.ts)
  scan_date DATE,
  scan_period TEXT,                 -- "am" | "midday" | "pm" (matches scan_pulse convention)
  scan_display_date TEXT,           -- e.g. "Wednesday, April 16, 2026"
  top_theme TEXT,
  mood TEXT,
  framing_note TEXT,
  pattern_of_day JSONB,             -- { title, body }
  items JSONB DEFAULT '[]'::jsonb,  -- array of ScanItem with headline/connection/regions/category/significance/perception_gap/tags/patterns
  blindspot_story_slugs TEXT[] DEFAULT ARRAY[]::TEXT[],  -- precomputed list of slugs for today's "media missed" section

  -- Briefing header (replaces the second admin read in src/app/page.tsx)
  briefing_date DATE,
  briefing_title TEXT,
  briefing_summary TEXT,
  briefing_top_stories JSONB,       -- array of { region, headline }
  briefing_story_count INTEGER,
  briefing_pgi_score NUMERIC,

  -- Top stories for public display (feeds /api/top-story and the PGI card on homepage)
  top_pgi_story TEXT,
  top_pgi_score NUMERIC,
  top_pgi_story_slug TEXT,
  top_gai_story TEXT,
  top_gai_score NUMERIC,

  -- Global mood + counts (feeds /api/scan/pulse in a later PR)
  global_mood TEXT,
  stories_found INTEGER,

  -- Breaking news (merges latest active row from breaking_news)
  breaking_active BOOLEAN DEFAULT false,
  breaking_headline TEXT,
  breaking_url TEXT,
  breaking_expires_at TIMESTAMPTZ
);

-- Seed the singleton row so consuming code always finds exactly one row.
INSERT INTO public.site_snapshot (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2) RLS for site_snapshot
--    Public SELECT (the homepage reads this on every ISR rebuild)
--    service_role full access (the snapshot writer script)
-- ============================================================

ALTER TABLE public.site_snapshot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read site_snapshot" ON public.site_snapshot;
CREATE POLICY "anon read site_snapshot"
  ON public.site_snapshot
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "service_role all site_snapshot" ON public.site_snapshot;
CREATE POLICY "service_role all site_snapshot"
  ON public.site_snapshot
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3) EXTEND pipeline_runs with snapshot tracking
--    (existing table from 20260412_create_pipeline_runs.sql)
-- ============================================================

ALTER TABLE public.pipeline_runs
  ADD COLUMN IF NOT EXISTS snapshot_written_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS snapshot_status TEXT,
  ADD COLUMN IF NOT EXISTS snapshot_summary JSONB,
  ADD COLUMN IF NOT EXISTS snapshot_error TEXT;

-- Constraint is added as a separate statement so the migration stays rerunnable
-- in the face of partial prior runs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pipeline_runs_snapshot_status_check'
  ) THEN
    ALTER TABLE public.pipeline_runs
      ADD CONSTRAINT pipeline_runs_snapshot_status_check
      CHECK (snapshot_status IS NULL OR snapshot_status IN ('success', 'partial', 'failed'));
  END IF;
END $$;

commit;
```

## How to validate before merging to main

1. **Review the SQL.** Read the block above. If anything looks off (column types, RLS, the pipeline_runs ALTER), flag it before running.
2. **Run the migration.** Paste the SQL into Supabase Dashboard → SQL Editor → New query → Run. Confirm the query returns `Success. No rows returned.` or similar.
3. **Confirm the schema.** In the Supabase table editor:
   - `site_snapshot` table exists, has one row with `id = 1` and all other columns null/empty.
   - `pipeline_runs` has the four new `snapshot_*` columns.
4. **Dry-run the writer.** From the repo root:
   ```
   npx tsx scripts/write-site-snapshot.ts --dry-run
   ```
   Expected: logs the snapshot that would be written. Status should be `success` or `partial`. If it says `no_scan`, there's no scan for today in Supabase yet — populate one first, then rerun.
5. **Real run.** Without the flag:
   ```
   npx tsx scripts/write-site-snapshot.ts
   ```
   Expected: exit 0, one row updated in `site_snapshot`, `pipeline_runs.snapshot_*` columns populated for today's `run_date`.
6. **Boot the app.** `npm run dev`. Load http://localhost:3000/. Confirm:
   - The homepage renders with today's scan data.
   - Visually identical to current production (same sections, same article cards, same briefing taster).
   - No console errors.
7. **Check the API route.** `curl http://localhost:3000/api/scans/today`. Expected shape: `{ "date": "YYYY-MM-DD", "items": [{ "headline": "...", "connection": "..." }, ...] }`. Confirm the response matches the current production response.
8. **Test the empty-state path.** In the Supabase table editor, temporarily null out `site_snapshot.scan_date` and set `items` to `[]`. Reload the homepage. Expected: the briefing-taster slot shows "Today's briefing is being prepared.", other sections degrade gracefully (article cards from the filesystem still render). Hit `/api/scans/today` again — expected: `{ "date": null, "items": [] }` with HTTP 200. Restore the data by rerunning `npx tsx scripts/write-site-snapshot.ts`.

## Rollback plan

Revert the six file changes — that's it. The migration can stay in place; `site_snapshot` has no consumers left after revert. Zero risk to production, no DB cleanup required.

Files to revert:
- `supabase/migrations/20260416_site_snapshot.sql` (delete)
- `scripts/write-site-snapshot.ts` (delete)
- `src/lib/site-snapshot.ts` (delete)
- `src/app/page.tsx` (revert)
- `src/app/api/scans/today/route.ts` (revert)
- `docs/Post_Migration_Backlog.md` (delete — optional)

## Data-source reality check

During implementation we discovered that `scans.items` (the JSONB column the execution plan assumed the snapshot writer would read from) has been empty in production for months. The real scan content lives in `scans.raw_markdown` — a markdown blob with a JSON fenced-code block of items plus bold-labelled sections for top theme, mood, pattern-of-day, and framing note. The homepage has always depended on the filesystem branch of `src/lib/scan-parser.ts` (`parseScanFile()`) to parse that markdown at render time.

Two implications for this PR:

1. The writer reads `scans.raw_markdown` (not `items`) and parses it in-process. The scan-fetch query filters on `raw_markdown IS NOT NULL AND raw_markdown != ''`. Empty `items` is no longer a failure condition; "no row with non-empty `raw_markdown` in the 3-day window" is.

2. To share the parse logic cleanly between the existing render path and the new writer, the pure markdown-parsing helpers (`formatDisplayDate`, `extractSection`, `parsePatternOfDay`, `parseNotableItems`, `extractJsonItems`, `extractScanMeta`) were extracted verbatim from `src/lib/scan-parser.ts` into a new `src/lib/scan-parser-core.ts`. The writer imports from `scan-parser-core`. `scan-parser.ts` was modified only to replace the inline helper declarations with imports from `scan-parser-core` — no behaviour change.

Fixing the `items` ingest is deferred to post-migration — see `docs/Post_Migration_Backlog.md`.

## Deliberate non-decisions

- **No `unstable_cache` wrapping.** The brief asked me to add it "if supported in Next.js 16 App Router — check docs, don't guess." I don't have live docs access in this session and the Next.js caching API has had churn across 14 → 15 → 16 (`'use cache'` directive etc.). The consuming page already has `revalidate = 300`; the API route has a `Cache-Control` header with `s-maxage=300`. A third in-process cache layer is not required for correctness and adds risk. Revisit if profiling shows the Supabase round-trip is hot.
- **`scan-parser.ts` untouched.** The file is 600 lines of dual Supabase/filesystem branching. Deprecating it is a separate (later) PR per the execution plan.

## Open question unresolved by this PR

None. The pipeline_runs shape conflict was resolved before writing code (human chose Option 1: extend the existing table with `snapshot_*` columns). All other open questions were deferred to `docs/Post_Migration_Backlog.md` or belong to later PRs.

## What's NOT in this PR — explicit list

Deferred to follow-up PRs, in sequence:

- **PR 2** — Delete dead components: `src/app/components/scan-pulse.tsx`, `src/app/components/next-briefing-countdown.tsx`, `src/app/components/testimonials.tsx` (all unused per audit).
- **PR 3** — Switch `/lens`, `/trending`, `/api/scan/pulse`, `/api/top-story`, `/api/breaking` (GET) to read from `site_snapshot`. Drop the `scan_pulse` table. Optionally wire ingest endpoints to also update snapshot fields they touch (the safety-net the brief mentions).
- **PR 4** — Narrow the `src/middleware.ts` matcher to auth-protected paths only (`/dashboard/*`, `/account/*`, `/settings/*`, `/onboarding/*`, `/api/stripe/portal`, `/api/company-briefings/submit`, `/auth/callback`).
- **PR 5** — Remove `force-dynamic` from `/archive`, `/archive/[date]`, `/indexes/pgi/*`, `/indexes/gai/data`. Add `generateStaticParams` + `revalidate` where appropriate.
- **PR 6** — Kill `BreakingNewsBanner`: remove the component, remove the polling loop from the root layout, remove `/api/breaking` GET if no other consumer remains. Move banner state into the snapshot (if decided to keep a banner at all).
- **PR 7+** — Cloudflare adapter setup with `@opennextjs/cloudflare`, `wrangler.toml`, image optimizer, off-host moves for `digest/daily`, `digest/weekly`, `company-briefings/score-all`, `company-briefings/deliver`. Drop `/api/og` and `/api/og/pgi` routes. Attach `www.albis.news` to the Cloudflare Pages deployment.

Also explicitly NOT touched in this PR (see Post_Migration_Backlog.md for deferred items):
- `src/lib/scan-parser.ts`
- `src/middleware.ts`
- `src/app/components/breaking-news-banner.tsx`, `scan-pulse.tsx`
- `src/app/lens/page.tsx`, `src/app/trending/page.tsx`
- Any `/archive/*`, `/indexes/*`, `/admin` route
- `src/app/api/scan/pulse/route.ts`, `/api/top-story/route.ts`, `/api/breaking/route.ts`
- `next.config.ts`, `package.json`, anything Stripe, anything auth
