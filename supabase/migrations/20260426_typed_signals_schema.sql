-- 2026-04-26 — Package 5: Company scan pipeline separation.
--
-- Five new tables form the typed signals layer that replaces public-pool
-- cross-reads for the company-side briefing pipeline:
--
--   retrieval_clusters       — Package 6 union watch graph. Groups of
--                              canonical_topics with shared retrieval
--                              characteristics. Schema only at pkg 5.
--   scan_targets             — atomic units the scan engine reads.
--                              Generated from retrieval_clusters in pkg 6;
--                              created here so the engine has a table
--                              to query (graceful empty-state behavior).
--   company_scan_runs        — separate run-tracking for the company scan.
--                              Sits beside pipeline_runs; not a parallel
--                              mirror, distinct schema. 3x daily windows.
--   signals                  — the atomic data unit. One row per discrete
--                              business-relevant change. Replaces public
--                              scan_items for the company side. Includes
--                              canonical_*_ids columns so matching against
--                              the Package 4 registry is first-class.
--   company_signal_matches   — per-(company, signal) score with the same
--                              match_reasons jsonb shape as Package 2 on
--                              company_story_scores. Successor table.
--
-- Idempotent — safe to re-run. RLS:
--   retrieval_clusters / scan_targets / company_scan_runs / signals
--     — authenticated read-only, service role full access (shared infra).
--   company_signal_matches
--     — owner-only via the company_profiles chain.
--
-- The scan_items / company_story_scores tables remain in place: the legacy
-- run-company-briefing-pipeline.ts still reads them. The new pipeline
-- writes to the typed tables. Cutover happens once Package 6 wires real
-- retrieval and signals start flowing.

begin;

-- ---------------------------------------------------------------------------
-- 1) retrieval_clusters
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.retrieval_clusters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_label TEXT NOT NULL,
  cluster_type TEXT NOT NULL CHECK (
    cluster_type IN (
      'entity_cluster','theme_cluster','region_cluster',
      'sector_cluster','commodity_cluster','risk_cluster'
    )
  ),
  canonical_topic_ids UUID[] NOT NULL DEFAULT '{}',
  demand_company_count INTEGER NOT NULL DEFAULT 0,
  last_built_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retrieval_clusters_type
  ON public.retrieval_clusters (cluster_type);
CREATE INDEX IF NOT EXISTS idx_retrieval_clusters_active
  ON public.retrieval_clusters (is_active);
CREATE INDEX IF NOT EXISTS idx_retrieval_clusters_demand
  ON public.retrieval_clusters (demand_company_count DESC);
CREATE INDEX IF NOT EXISTS idx_retrieval_clusters_topics_gin
  ON public.retrieval_clusters USING gin (canonical_topic_ids);

-- ---------------------------------------------------------------------------
-- 2) scan_targets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scan_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  retrieval_cluster_id UUID REFERENCES public.retrieval_clusters(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (
    target_type IN ('canonical_topic','keyword_query','source_domain')
  ),
  target_value TEXT NOT NULL,
  expansion_terms TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_scan_target UNIQUE (target_type, target_value)
);

CREATE INDEX IF NOT EXISTS idx_scan_targets_cluster
  ON public.scan_targets (retrieval_cluster_id);
CREATE INDEX IF NOT EXISTS idx_scan_targets_type
  ON public.scan_targets (target_type);
CREATE INDEX IF NOT EXISTS idx_scan_targets_active
  ON public.scan_targets (is_active);

-- ---------------------------------------------------------------------------
-- 3) company_scan_runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_scan_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_date DATE NOT NULL,
  run_window TEXT NOT NULL CHECK (run_window IN ('07-00','13-00','19-00')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','completed','partial_failure','failed')),
  targets_inspected INTEGER NOT NULL DEFAULT 0,
  signals_extracted INTEGER NOT NULL DEFAULT 0,
  sources_consulted INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_scan_run UNIQUE (run_date, run_window)
);

CREATE INDEX IF NOT EXISTS idx_company_scan_runs_date
  ON public.company_scan_runs (run_date DESC);
CREATE INDEX IF NOT EXISTS idx_company_scan_runs_status
  ON public.company_scan_runs (status);

-- ---------------------------------------------------------------------------
-- 4) signals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_scan_run_id UUID NOT NULL REFERENCES public.company_scan_runs(id) ON DELETE CASCADE,
  signal_date DATE NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (
    signal_type IN ('regulatory','market','statement','disruption','policy','announcement','other')
  ),
  entities TEXT[] NOT NULL DEFAULT '{}',
  canonical_entity_ids UUID[] NOT NULL DEFAULT '{}',
  themes TEXT[] NOT NULL DEFAULT '{}',
  canonical_theme_ids UUID[] NOT NULL DEFAULT '{}',
  regions TEXT[] NOT NULL DEFAULT '{}',
  canonical_region_ids UUID[] NOT NULL DEFAULT '{}',
  source_url TEXT,
  source_domain TEXT,
  source_language TEXT,
  source_region TEXT,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  urgency NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  significance NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signals_run
  ON public.signals (company_scan_run_id);
CREATE INDEX IF NOT EXISTS idx_signals_date
  ON public.signals (signal_date DESC);
CREATE INDEX IF NOT EXISTS idx_signals_type
  ON public.signals (signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_entities_gin
  ON public.signals USING gin (canonical_entity_ids);
CREATE INDEX IF NOT EXISTS idx_signals_themes_gin
  ON public.signals USING gin (canonical_theme_ids);
CREATE INDEX IF NOT EXISTS idx_signals_regions_gin
  ON public.signals USING gin (canonical_region_ids);
CREATE INDEX IF NOT EXISTS idx_signals_language
  ON public.signals (source_language);
CREATE INDEX IF NOT EXISTS idx_signals_source_region
  ON public.signals (source_region);

-- ---------------------------------------------------------------------------
-- 5) company_signal_matches
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_signal_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  relevance_score NUMERIC(4,3) NOT NULL,
  match_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_for_briefing BOOLEAN NOT NULL DEFAULT false,
  briefing_id UUID REFERENCES public.company_briefings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_signal_match UNIQUE (company_profile_id, signal_id)
);

CREATE INDEX IF NOT EXISTS idx_csm_company
  ON public.company_signal_matches (company_profile_id);
CREATE INDEX IF NOT EXISTS idx_csm_signal
  ON public.company_signal_matches (signal_id);
CREATE INDEX IF NOT EXISTS idx_csm_match_reasons_gin
  ON public.company_signal_matches USING gin (match_reasons);
CREATE INDEX IF NOT EXISTS idx_csm_selected
  ON public.company_signal_matches (selected_for_briefing)
  WHERE selected_for_briefing = true;
CREATE INDEX IF NOT EXISTS idx_csm_briefing
  ON public.company_signal_matches (briefing_id);

-- ---------------------------------------------------------------------------
-- 6) RLS policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.retrieval_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_signal_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read retrieval clusters"
  ON public.retrieval_clusters;
CREATE POLICY "Authenticated users can read retrieval clusters"
  ON public.retrieval_clusters FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service role manages retrieval clusters"
  ON public.retrieval_clusters;
CREATE POLICY "Service role manages retrieval clusters"
  ON public.retrieval_clusters FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read scan targets"
  ON public.scan_targets;
CREATE POLICY "Authenticated users can read scan targets"
  ON public.scan_targets FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service role manages scan targets"
  ON public.scan_targets;
CREATE POLICY "Service role manages scan targets"
  ON public.scan_targets FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read company scan runs"
  ON public.company_scan_runs;
CREATE POLICY "Authenticated users can read company scan runs"
  ON public.company_scan_runs FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service role manages company scan runs"
  ON public.company_scan_runs;
CREATE POLICY "Service role manages company scan runs"
  ON public.company_scan_runs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read signals"
  ON public.signals;
CREATE POLICY "Authenticated users can read signals"
  ON public.signals FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service role manages signals"
  ON public.signals;
CREATE POLICY "Service role manages signals"
  ON public.signals FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Users can view own company signal matches"
  ON public.company_signal_matches;
CREATE POLICY "Users can view own company signal matches"
  ON public.company_signal_matches FOR SELECT
  USING (
    company_profile_id IN (
      SELECT id FROM public.company_profiles WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages company signal matches"
  ON public.company_signal_matches;
CREATE POLICY "Service role manages company signal matches"
  ON public.company_signal_matches FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ---------------------------------------------------------------------------
-- 7) updated_at trigger on retrieval_clusters
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS retrieval_clusters_updated_at ON public.retrieval_clusters;
CREATE TRIGGER retrieval_clusters_updated_at
  BEFORE UPDATE ON public.retrieval_clusters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

commit;
