-- 2026-05-02 — Researched Understanding Layer persistence
--
-- Durable research spine for company scans first, public products later.
-- Company rows are private to the owning company profile; public rows can be
-- added later with privacy_level='public_safe'. This keeps the researched
-- understanding layer reusable by dashboard, PGI, articles, and future scans
-- instead of hiding it inside one company_briefings JSON blob.

BEGIN;

CREATE TABLE IF NOT EXISTS public.research_clusters (
  id TEXT PRIMARY KEY,
  research_date DATE NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('company', 'public')),
  privacy_level TEXT NOT NULL DEFAULT 'company_private'
    CHECK (privacy_level IN ('company_private', 'aggregate_only', 'public_safe')),
  company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  briefing_id UUID REFERENCES public.company_briefings(id) ON DELETE SET NULL,
  scan_area_ids TEXT[] NOT NULL DEFAULT '{}',
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('researching', 'ready', 'weak', 'dashboard_only', 'held')),
  importance TEXT NOT NULL CHECK (importance IN ('critical', 'high', 'medium', 'low')),
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  layer_version TEXT NOT NULL DEFAULT 'researched_understanding_v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT research_clusters_company_privacy_guard CHECK (
    (scope = 'company' AND company_profile_id IS NOT NULL AND privacy_level IN ('company_private', 'aggregate_only'))
    OR
    (scope = 'public' AND company_profile_id IS NULL AND privacy_level IN ('public_safe', 'aggregate_only'))
  )
);

CREATE INDEX IF NOT EXISTS idx_research_clusters_company_date
  ON public.research_clusters (company_profile_id, research_date DESC)
  WHERE company_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_research_clusters_scope_privacy
  ON public.research_clusters (scope, privacy_level, research_date DESC);
CREATE INDEX IF NOT EXISTS idx_research_clusters_briefing
  ON public.research_clusters (briefing_id)
  WHERE briefing_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.research_sources (
  id TEXT PRIMARY KEY,
  cluster_id TEXT NOT NULL REFERENCES public.research_clusters(id) ON DELETE CASCADE,
  research_date DATE NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('company', 'public')),
  privacy_level TEXT NOT NULL DEFAULT 'company_private'
    CHECK (privacy_level IN ('company_private', 'aggregate_only', 'public_safe')),
  company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  briefing_id UUID REFERENCES public.company_briefings(id) ON DELETE SET NULL,
  url TEXT,
  source_domain TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  source_type TEXT,
  region TEXT,
  language TEXT,
  read_status TEXT NOT NULL CHECK (read_status IN ('unread', 'snippet_only', 'read', 'failed', 'blocked')),
  trail_role TEXT NOT NULL CHECK (trail_role IN ('research', 'evidence', 'email', 'background', 'excluded')),
  relevance_score NUMERIC,
  reliability_note TEXT,
  extracted_title TEXT,
  extracted_excerpt TEXT,
  extracted_word_count INTEGER,
  text_cache_status TEXT,
  text_cache_path TEXT,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT research_sources_privacy_guard CHECK (
    (scope = 'company' AND company_profile_id IS NOT NULL AND privacy_level IN ('company_private', 'aggregate_only'))
    OR
    (scope = 'public' AND company_profile_id IS NULL AND privacy_level IN ('public_safe', 'aggregate_only'))
  )
);

CREATE INDEX IF NOT EXISTS idx_research_sources_cluster
  ON public.research_sources (cluster_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_company_date
  ON public.research_sources (company_profile_id, research_date DESC)
  WHERE company_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_research_sources_domain
  ON public.research_sources (source_domain);
CREATE INDEX IF NOT EXISTS idx_research_sources_read_status
  ON public.research_sources (read_status);
CREATE INDEX IF NOT EXISTS idx_research_sources_trail_role
  ON public.research_sources (trail_role);

CREATE TABLE IF NOT EXISTS public.research_notes (
  id TEXT PRIMARY KEY,
  cluster_id TEXT NOT NULL REFERENCES public.research_clusters(id) ON DELETE CASCADE,
  research_date DATE NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('company', 'public')),
  privacy_level TEXT NOT NULL DEFAULT 'company_private'
    CHECK (privacy_level IN ('company_private', 'aggregate_only', 'public_safe')),
  company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  briefing_id UUID REFERENCES public.company_briefings(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  what_happened TEXT NOT NULL,
  what_changed_today TEXT NOT NULL,
  key_actors TEXT[] NOT NULL DEFAULT '{}',
  key_facts TEXT[] NOT NULL DEFAULT '{}',
  key_numbers TEXT[] NOT NULL DEFAULT '{}',
  named_places TEXT[] NOT NULL DEFAULT '{}',
  causes_or_drivers TEXT[] NOT NULL DEFAULT '{}',
  consequences TEXT[] NOT NULL DEFAULT '{}',
  source_observations JSONB NOT NULL DEFAULT '[]'::jsonb,
  differences_in_reporting JSONB NOT NULL DEFAULT '[]'::jsonb,
  what_is_unclear TEXT[] NOT NULL DEFAULT '{}',
  possible_perception_gap JSONB,
  company_relevance TEXT,
  albis_learning TEXT NOT NULL DEFAULT '',
  note_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT research_notes_privacy_guard CHECK (
    (scope = 'company' AND company_profile_id IS NOT NULL AND privacy_level IN ('company_private', 'aggregate_only'))
    OR
    (scope = 'public' AND company_profile_id IS NULL AND privacy_level IN ('public_safe', 'aggregate_only'))
  )
);

CREATE INDEX IF NOT EXISTS idx_research_notes_cluster
  ON public.research_notes (cluster_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_company_date
  ON public.research_notes (company_profile_id, research_date DESC)
  WHERE company_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_research_notes_pgi_gin
  ON public.research_notes USING gin (possible_perception_gap);

CREATE TABLE IF NOT EXISTS public.albis_findings (
  id TEXT PRIMARY KEY,
  cluster_id TEXT NOT NULL REFERENCES public.research_clusters(id) ON DELETE CASCADE,
  research_date DATE NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('company', 'public')),
  privacy_level TEXT NOT NULL DEFAULT 'company_private'
    CHECK (privacy_level IN ('company_private', 'aggregate_only', 'public_safe')),
  company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  briefing_id UUID REFERENCES public.company_briefings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  why_it_matters TEXT,
  uncertainty TEXT,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  email_source_ids TEXT[] NOT NULL DEFAULT '{}',
  evidence_source_ids TEXT[] NOT NULL DEFAULT '{}',
  dashboard_source_ids TEXT[] NOT NULL DEFAULT '{}',
  placement TEXT NOT NULL CHECK (placement IN ('email_main', 'email_secondary', 'dashboard', 'article_candidate', 'hold')),
  finding_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT albis_findings_privacy_guard CHECK (
    (scope = 'company' AND company_profile_id IS NOT NULL AND privacy_level IN ('company_private', 'aggregate_only'))
    OR
    (scope = 'public' AND company_profile_id IS NULL AND privacy_level IN ('public_safe', 'aggregate_only'))
  )
);

CREATE INDEX IF NOT EXISTS idx_albis_findings_cluster
  ON public.albis_findings (cluster_id);
CREATE INDEX IF NOT EXISTS idx_albis_findings_company_date
  ON public.albis_findings (company_profile_id, research_date DESC)
  WHERE company_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_albis_findings_placement
  ON public.albis_findings (placement);
CREATE INDEX IF NOT EXISTS idx_albis_findings_evidence_sources_gin
  ON public.albis_findings USING gin (evidence_source_ids);

ALTER TABLE public.research_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albis_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read public-safe research clusters" ON public.research_clusters;
CREATE POLICY "Public can read public-safe research clusters"
  ON public.research_clusters FOR SELECT
  TO anon, authenticated
  USING (privacy_level = 'public_safe');

DROP POLICY IF EXISTS "Company owners can read own research clusters" ON public.research_clusters;
CREATE POLICY "Company owners can read own research clusters"
  ON public.research_clusters FOR SELECT
  TO authenticated
  USING (
    company_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.company_profiles cp
      WHERE cp.id = research_clusters.company_profile_id
      AND cp.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages research clusters" ON public.research_clusters;
CREATE POLICY "Service role manages research clusters"
  ON public.research_clusters FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read public-safe research sources" ON public.research_sources;
CREATE POLICY "Public can read public-safe research sources"
  ON public.research_sources FOR SELECT
  TO anon, authenticated
  USING (privacy_level = 'public_safe');

DROP POLICY IF EXISTS "Company owners can read own research sources" ON public.research_sources;
CREATE POLICY "Company owners can read own research sources"
  ON public.research_sources FOR SELECT
  TO authenticated
  USING (
    company_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.company_profiles cp
      WHERE cp.id = research_sources.company_profile_id
      AND cp.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages research sources" ON public.research_sources;
CREATE POLICY "Service role manages research sources"
  ON public.research_sources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read public-safe research notes" ON public.research_notes;
CREATE POLICY "Public can read public-safe research notes"
  ON public.research_notes FOR SELECT
  TO anon, authenticated
  USING (privacy_level = 'public_safe');

DROP POLICY IF EXISTS "Company owners can read own research notes" ON public.research_notes;
CREATE POLICY "Company owners can read own research notes"
  ON public.research_notes FOR SELECT
  TO authenticated
  USING (
    company_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.company_profiles cp
      WHERE cp.id = research_notes.company_profile_id
      AND cp.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages research notes" ON public.research_notes;
CREATE POLICY "Service role manages research notes"
  ON public.research_notes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read public-safe Albis findings" ON public.albis_findings;
CREATE POLICY "Public can read public-safe Albis findings"
  ON public.albis_findings FOR SELECT
  TO anon, authenticated
  USING (privacy_level = 'public_safe');

DROP POLICY IF EXISTS "Company owners can read own Albis findings" ON public.albis_findings;
CREATE POLICY "Company owners can read own Albis findings"
  ON public.albis_findings FOR SELECT
  TO authenticated
  USING (
    company_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.company_profiles cp
      WHERE cp.id = albis_findings.company_profile_id
      AND cp.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages Albis findings" ON public.albis_findings;
CREATE POLICY "Service role manages Albis findings"
  ON public.albis_findings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
