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
