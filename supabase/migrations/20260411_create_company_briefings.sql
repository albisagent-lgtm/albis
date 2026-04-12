-- 2026-04-11 — Create company_story_scores and company_briefings tables
-- Phase 3: Relevance Scoring & Briefing Generation
--
-- company_story_scores: stores per-story relevance scores for each company profile
-- company_briefings: stores generated briefings (one per company per day)

begin;

-- ============================================================
-- 1) company_story_scores — relevance scoring results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_story_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  scan_date DATE NOT NULL,
  story_headline TEXT NOT NULL,
  story_category TEXT,
  story_regions TEXT[] DEFAULT '{}',
  story_tags TEXT[] DEFAULT '{}',
  story_significance TEXT,
  story_connection TEXT,

  -- Sub-scores (0.0 to 1.0 each)
  geography_score NUMERIC(4,3) DEFAULT 0,
  sector_score NUMERIC(4,3) DEFAULT 0,
  theme_score NUMERIC(4,3) DEFAULT 0,
  entity_score NUMERIC(4,3) DEFAULT 0,
  supply_chain_score NUMERIC(4,3) DEFAULT 0,
  risk_score NUMERIC(4,3) DEFAULT 0,
  urgency_score NUMERIC(4,3) DEFAULT 0,
  significance_score NUMERIC(4,3) DEFAULT 0,

  -- Final weighted score
  relevance_score NUMERIC(5,4) DEFAULT 0,

  -- Whether this story was selected for the briefing
  selected_for_briefing BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- One score per story per company per day
  CONSTRAINT unique_company_story_score UNIQUE (company_profile_id, scan_date, story_headline)
);

CREATE INDEX IF NOT EXISTS idx_css_company ON public.company_story_scores(company_profile_id);
CREATE INDEX IF NOT EXISTS idx_css_date ON public.company_story_scores(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_css_relevance ON public.company_story_scores(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_css_selected ON public.company_story_scores(selected_for_briefing) WHERE selected_for_briefing = true;

-- ============================================================
-- 2) company_briefings — generated briefings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  briefing_date DATE NOT NULL,
  generated_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'scoring_complete', 'generating', 'generated', 'delivered', 'failed')),

  -- Structured briefing content (JSONB)
  -- Expected shape:
  -- {
  --   header: { company_name, date, scan_focus, signal_level },
  --   what_changed: [{ headline, summary, relevance_tags }],
  --   why_it_matters: "text",
  --   what_to_watch: [{ monitor_point, timeframe }],
  --   regional_framing: "text" (optional)
  -- }
  briefing_content JSONB,

  -- Metadata
  stories_considered INTEGER DEFAULT 0,
  stories_selected INTEGER DEFAULT 0,
  delivery_status TEXT DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'failed')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One briefing per company per day
  CONSTRAINT unique_company_briefing UNIQUE (company_profile_id, briefing_date)
);

CREATE INDEX IF NOT EXISTS idx_cb_company ON public.company_briefings(company_profile_id);
CREATE INDEX IF NOT EXISTS idx_cb_date ON public.company_briefings(briefing_date DESC);
CREATE INDEX IF NOT EXISTS idx_cb_status ON public.company_briefings(status);
CREATE INDEX IF NOT EXISTS idx_cb_delivery ON public.company_briefings(delivery_status);

-- ============================================================
-- 3) RLS policies
-- ============================================================

-- company_story_scores: users see own, service role writes
ALTER TABLE public.company_story_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own story scores"
  ON public.company_story_scores FOR SELECT
  USING (
    company_profile_id IN (
      SELECT id FROM public.company_profiles WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage story scores"
  ON public.company_story_scores FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- company_briefings: users see own, service role writes
ALTER TABLE public.company_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own briefings"
  ON public.company_briefings FOR SELECT
  USING (
    company_profile_id IN (
      SELECT id FROM public.company_profiles WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage briefings"
  ON public.company_briefings FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- 4) Auto-update trigger for company_briefings
-- ============================================================
DROP TRIGGER IF EXISTS company_briefings_updated_at ON public.company_briefings;
CREATE TRIGGER company_briefings_updated_at
  BEFORE UPDATE ON public.company_briefings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

commit;
