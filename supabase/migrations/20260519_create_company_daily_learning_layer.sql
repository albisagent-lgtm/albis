-- 2026-05-19 — Company Daily Scan private intelligence wiki layer
-- Supersedes the local Pass 2 V1-only draft in this filename by expanding it
-- into the private compiled company wiki used for scan → learn → update → scan better.
-- Application reads/writes remain disabled unless explicit env gates are enabled.

begin;

CREATE TABLE IF NOT EXISTS public.company_intelligence_profiles (
  company_profile_id UUID PRIMARY KEY REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  profile_version TEXT NOT NULL DEFAULT 'company_intelligence_profile_v2',
  company_name TEXT NOT NULL,
  last_learning_date DATE,

  -- Denormalized retrieval hints for fast tomorrow-scan loading.
  useful_domains TEXT[] NOT NULL DEFAULT '{}',
  noisy_domains TEXT[] NOT NULL DEFAULT '{}',
  useful_languages TEXT[] NOT NULL DEFAULT '{}',
  promoted_entities TEXT[] NOT NULL DEFAULT '{}',
  promoted_regions TEXT[] NOT NULL DEFAULT '{}',
  promoted_topics TEXT[] NOT NULL DEFAULT '{}',
  exclusions TEXT[] NOT NULL DEFAULT '{}',
  deep_dive_query_seeds TEXT[] NOT NULL DEFAULT '{}',

  -- Explicit privacy split: safe customer-facing memory vs internal ops/reasoning.
  customer_safe_memory TEXT[] NOT NULL DEFAULT '{}',
  internal_notes TEXT[] NOT NULL DEFAULT '{}',
  source_cache_notes TEXT[] NOT NULL DEFAULT '{}',

  budgets JSONB NOT NULL DEFAULT '{"daily_query_budget":24,"deep_dive_query_budget":8}'::jsonb,
  profile_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_intelligence_profiles_last_learning
  ON public.company_intelligence_profiles (last_learning_date DESC);
CREATE INDEX IF NOT EXISTS idx_company_intelligence_profiles_domains_gin
  ON public.company_intelligence_profiles USING gin (useful_domains);
CREATE INDEX IF NOT EXISTS idx_company_intelligence_profiles_languages_gin
  ON public.company_intelligence_profiles USING gin (useful_languages);
CREATE INDEX IF NOT EXISTS idx_company_intelligence_profiles_entities_gin
  ON public.company_intelligence_profiles USING gin (promoted_entities);
CREATE INDEX IF NOT EXISTS idx_company_intelligence_profiles_topics_gin
  ON public.company_intelligence_profiles USING gin (promoted_topics);
CREATE INDEX IF NOT EXISTS idx_company_intelligence_profiles_payload_gin
  ON public.company_intelligence_profiles USING gin (profile_payload);

CREATE TABLE IF NOT EXISTS public.company_intelligence_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN (
    'overview',
    'regions_routes',
    'language_map',
    'source_map',
    'regulatory_bodies',
    'key_risks',
    'recurring_entities',
    'topic_clusters',
    'noise_exclusions',
    'open_questions',
    'source_performance',
    'language_performance',
    'deep_dive_query_seeds'
  )),
  title TEXT NOT NULL,
  page_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_safe_memory TEXT[] NOT NULL DEFAULT '{}',
  internal_notes TEXT[] NOT NULL DEFAULT '{}',
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low')),
  last_learning_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT company_intelligence_pages_unique_type UNIQUE (company_profile_id, page_type)
);

CREATE INDEX IF NOT EXISTS idx_company_intelligence_pages_company_type
  ON public.company_intelligence_pages (company_profile_id, page_type);
CREATE INDEX IF NOT EXISTS idx_company_intelligence_pages_payload_gin
  ON public.company_intelligence_pages USING gin (page_payload);

CREATE TABLE IF NOT EXISTS public.company_daily_learnings (
  id TEXT PRIMARY KEY,
  company_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  briefing_id UUID REFERENCES public.company_briefings(id) ON DELETE SET NULL,
  scan_date DATE NOT NULL,
  layer_version TEXT NOT NULL DEFAULT 'company_daily_learning_v2',

  what_was_learned_today TEXT[] NOT NULL DEFAULT '{}',
  useful_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  useful_languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  recurring_entities TEXT[] NOT NULL DEFAULT '{}',
  new_entities TEXT[] NOT NULL DEFAULT '{}',
  regions_to_promote TEXT[] NOT NULL DEFAULT '{}',
  topics_to_promote TEXT[] NOT NULL DEFAULT '{}',
  noise_or_exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggested_profile_updates JSONB NOT NULL DEFAULT '[]'::jsonb,
  deep_dive_query_seeds JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_safe_insights TEXT[] NOT NULL DEFAULT '{}',
  cost_controls JSONB NOT NULL DEFAULT '{}'::jsonb,
  internal_reasoning JSONB NOT NULL DEFAULT '{}'::jsonb,
  learning_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT company_daily_learnings_unique_company_date UNIQUE (company_profile_id, scan_date)
);

CREATE INDEX IF NOT EXISTS idx_company_daily_learnings_company_date
  ON public.company_daily_learnings (company_profile_id, scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_company_daily_learnings_briefing
  ON public.company_daily_learnings (briefing_id) WHERE briefing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_daily_learnings_payload_gin
  ON public.company_daily_learnings USING gin (learning_payload);
CREATE INDEX IF NOT EXISTS idx_company_daily_learnings_new_entities_gin
  ON public.company_daily_learnings USING gin (new_entities);
CREATE INDEX IF NOT EXISTS idx_company_daily_learnings_regions_gin
  ON public.company_daily_learnings USING gin (regions_to_promote);
CREATE INDEX IF NOT EXISTS idx_company_daily_learnings_topics_gin
  ON public.company_daily_learnings USING gin (topics_to_promote);

CREATE TABLE IF NOT EXISTS public.company_profile_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  learning_id TEXT REFERENCES public.company_daily_learnings(id) ON DELETE SET NULL,
  scan_date DATE,
  change_type TEXT NOT NULL,
  page_type TEXT,
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low')),
  auto_applied BOOLEAN NOT NULL DEFAULT false,
  review_needed BOOLEAN NOT NULL DEFAULT false,
  customer_safe BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_profile_change_log_company_date
  ON public.company_profile_change_log (company_profile_id, scan_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_profile_change_log_review_needed
  ON public.company_profile_change_log (review_needed, created_at DESC) WHERE review_needed = true;

ALTER TABLE public.company_intelligence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_intelligence_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_daily_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profile_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company owners can read own intelligence profile" ON public.company_intelligence_profiles;
CREATE POLICY "Company owners can read own intelligence profile"
  ON public.company_intelligence_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.company_profiles cp WHERE cp.id = company_intelligence_profiles.company_profile_id AND cp.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Service role manages intelligence profiles" ON public.company_intelligence_profiles;
CREATE POLICY "Service role manages intelligence profiles"
  ON public.company_intelligence_profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Company owners can read own intelligence pages" ON public.company_intelligence_pages;
CREATE POLICY "Company owners can read own intelligence pages"
  ON public.company_intelligence_pages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.company_profiles cp WHERE cp.id = company_intelligence_pages.company_profile_id AND cp.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Service role manages intelligence pages" ON public.company_intelligence_pages;
CREATE POLICY "Service role manages intelligence pages"
  ON public.company_intelligence_pages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Company owners can read own daily learnings" ON public.company_daily_learnings;
CREATE POLICY "Company owners can read own daily learnings"
  ON public.company_daily_learnings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.company_profiles cp WHERE cp.id = company_daily_learnings.company_profile_id AND cp.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Service role manages daily learnings" ON public.company_daily_learnings;
CREATE POLICY "Service role manages daily learnings"
  ON public.company_daily_learnings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Company owners can read own profile change log" ON public.company_profile_change_log;
CREATE POLICY "Company owners can read own profile change log"
  ON public.company_profile_change_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.company_profiles cp WHERE cp.id = company_profile_change_log.company_profile_id AND cp.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Service role manages profile change log" ON public.company_profile_change_log;
CREATE POLICY "Service role manages profile change log"
  ON public.company_profile_change_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS company_intelligence_profiles_updated_at ON public.company_intelligence_profiles;
CREATE TRIGGER company_intelligence_profiles_updated_at
  BEFORE UPDATE ON public.company_intelligence_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS company_intelligence_pages_updated_at ON public.company_intelligence_pages;
CREATE TRIGGER company_intelligence_pages_updated_at
  BEFORE UPDATE ON public.company_intelligence_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS company_daily_learnings_updated_at ON public.company_daily_learnings;
CREATE TRIGGER company_daily_learnings_updated_at
  BEFORE UPDATE ON public.company_daily_learnings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

commit;
