-- 2026-05-01 — Shared PGI Evidence Layer
--
-- This table is the shared intelligence spine under public PGI and company
-- scans. It stores the evidence used for frame extraction, PGI/GAI scoring,
-- cui-bono reads, tributary mapping, and learning loops.
--
-- Hard boundary: company-specific evidence is isolated by company_profile_id
-- / company_scan_run_id / source_record_id. Public products may only use
-- public_safe rows or aggregate_only patterns. Private customer evidence must
-- never bleed into another company briefing or public output.

CREATE TABLE IF NOT EXISTS public.pgi_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  evidence_date DATE NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('public_scan', 'company_scan')),
  privacy_level TEXT NOT NULL CHECK (privacy_level IN ('public_safe', 'aggregate_only', 'private_customer')),
  allowed_audience TEXT NOT NULL DEFAULT 'public' CHECK (allowed_audience IN ('public', 'aggregate', 'company_private')),

  -- Isolation / provenance. Public rows leave company fields null.
  company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  company_scan_run_id UUID REFERENCES public.company_scan_runs(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE,
  -- Stored as text because production scan_items.id has changed shape across
  -- migrations/environments (bigint in prod, uuid in older local history).
  -- source_record_id remains the stable provenance key used by the app.
  scan_item_id TEXT,
  source_record_id TEXT NOT NULL,

  -- Source / stakeholder context.
  source_url TEXT,
  source_domain TEXT,
  source_language TEXT,
  source_region TEXT,
  stakeholder_type TEXT NOT NULL DEFAULT 'media',

  -- Event and frame evidence.
  event_topic TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT,
  factual_claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  causal_claim TEXT,
  frame TEXT,
  actor_portrayal TEXT,
  emotional_valence TEXT,
  emphasis JSONB NOT NULL DEFAULT '[]'::jsonb,
  omissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  cui_bono_signal TEXT,

  -- PGI/GAI metadata.
  tributary TEXT,
  pgi_dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  gai_visibility JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.70,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pgi_evidence_company_privacy_guard CHECK (
    (origin = 'public_scan' AND company_profile_id IS NULL AND company_scan_run_id IS NULL AND privacy_level IN ('public_safe', 'aggregate_only'))
    OR
    (origin = 'company_scan' AND company_profile_id IS NOT NULL AND privacy_level IN ('aggregate_only', 'private_customer'))
  ),
  CONSTRAINT pgi_evidence_audience_guard CHECK (
    (privacy_level = 'public_safe' AND allowed_audience = 'public')
    OR (privacy_level = 'aggregate_only' AND allowed_audience = 'aggregate')
    OR (privacy_level = 'private_customer' AND allowed_audience = 'company_private')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS pgi_evidence_source_record_unique
  ON public.pgi_evidence (source_record_id);

CREATE INDEX IF NOT EXISTS idx_pgi_evidence_date
  ON public.pgi_evidence (evidence_date DESC);
CREATE INDEX IF NOT EXISTS idx_pgi_evidence_origin_privacy
  ON public.pgi_evidence (origin, privacy_level);
CREATE INDEX IF NOT EXISTS idx_pgi_evidence_company
  ON public.pgi_evidence (company_profile_id, evidence_date DESC)
  WHERE company_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pgi_evidence_scan_run
  ON public.pgi_evidence (company_scan_run_id)
  WHERE company_scan_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pgi_evidence_signal
  ON public.pgi_evidence (signal_id)
  WHERE signal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pgi_evidence_tributary
  ON public.pgi_evidence (tributary);
CREATE INDEX IF NOT EXISTS idx_pgi_evidence_factual_claims_gin
  ON public.pgi_evidence USING gin (factual_claims);
CREATE INDEX IF NOT EXISTS idx_pgi_evidence_dimensions_gin
  ON public.pgi_evidence USING gin (pgi_dimensions);
CREATE INDEX IF NOT EXISTS idx_pgi_evidence_visibility_gin
  ON public.pgi_evidence USING gin (gai_visibility);

ALTER TABLE public.pgi_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read public-safe PGI evidence" ON public.pgi_evidence;
CREATE POLICY "Public can read public-safe PGI evidence"
  ON public.pgi_evidence FOR SELECT
  TO anon, authenticated
  USING (privacy_level = 'public_safe' AND allowed_audience = 'public');

DROP POLICY IF EXISTS "Company owners can read own private PGI evidence" ON public.pgi_evidence;
CREATE POLICY "Company owners can read own private PGI evidence"
  ON public.pgi_evidence FOR SELECT
  TO authenticated
  USING (
    company_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.company_profiles cp
      WHERE cp.id = pgi_evidence.company_profile_id
      AND cp.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages PGI evidence" ON public.pgi_evidence;
CREATE POLICY "Service role manages PGI evidence"
  ON public.pgi_evidence FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
