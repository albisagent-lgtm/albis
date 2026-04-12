-- Phase 4: Pipeline runs tracking table
-- Tracks the daily briefing pipeline: scan -> tagging -> generation -> delivery

CREATE TABLE IF NOT EXISTS public.pipeline_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_date DATE NOT NULL UNIQUE,

  -- Scan phase
  scan_completed_at TIMESTAMPTZ,

  -- Tagging/scoring phase
  tagging_started_at TIMESTAMPTZ,
  tagging_completed_at TIMESTAMPTZ,
  tagging_stories_count INTEGER DEFAULT 0,

  -- Briefing generation phase
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  generation_companies_count INTEGER DEFAULT 0,
  generation_failures INTEGER DEFAULT 0,

  -- Email delivery phase
  delivery_started_at TIMESTAMPTZ,
  delivery_completed_at TIMESTAMPTZ,
  delivery_sent_count INTEGER DEFAULT 0,
  delivery_failures INTEGER DEFAULT 0,

  -- Overall status
  status TEXT DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'partial_failure', 'failed')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups by date
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_date ON public.pipeline_runs(run_date DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON public.pipeline_runs(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_pipeline_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pipeline_runs_updated_at ON public.pipeline_runs;
CREATE TRIGGER trigger_pipeline_runs_updated_at
  BEFORE UPDATE ON public.pipeline_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_runs_updated_at();

-- RLS: service_role only (pipeline is managed by backend cron jobs)
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on pipeline_runs"
  ON public.pipeline_runs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Also add delivery columns to company_briefings if not present
ALTER TABLE public.company_briefings
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_error TEXT;
