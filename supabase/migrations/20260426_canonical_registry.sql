-- 2026-04-26 — Package 4: Canonical topic / entity registry + alias system.
--
-- Three tables form the foundation of the canonical layer:
--   canonical_topics          — one row per distinct entity, theme, region,
--                               sector, commodity, policy, route, risk, or
--                               institution. The "preferred" label and metadata.
--   canonical_topic_aliases   — many-to-one synonyms / translations /
--                               abbreviations / related entities. Aliases
--                               are what the relevance engine matches against.
--   company_canonical_mappings — joins a company profile's tracked items to
--                               canonical topics, preserving the original
--                               source field + value for traceability.
--
-- Hierarchy is optional via canonical_topics.parent_id (e.g. "Pyongyang"
-- → parent "North Korea"). active_company_count is maintained by trigger.
--
-- pg_trgm is created if available; if the extension is not enabled on
-- this Supabase tier, the DO block silently falls through and we rely on
-- the lower(alias) btree index instead. Package 5/6 can revisit fuzzy.
--
-- Idempotent — safe to re-run. RLS:
--   canonical_topics + canonical_topic_aliases — readable by all
--     authenticated users, writable only by service role (shared reference).
--   company_canonical_mappings — owner-only via the company_profiles chain.

begin;

-- ---------------------------------------------------------------------------
-- Optional pg_trgm extension (best-effort).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_trgm not available — falling back to btree on lower(alias)';
  END;
END$$;

-- ---------------------------------------------------------------------------
-- 1) canonical_topics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.canonical_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_label TEXT NOT NULL,
  topic_type TEXT NOT NULL CHECK (
    topic_type IN ('entity','theme','region','sector','commodity','policy','route','risk','institution')
  ),
  short_description TEXT,
  parent_id UUID REFERENCES public.canonical_topics(id) ON DELETE SET NULL,
  active_company_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness on (label, type). Expression-based, so it
-- must be a unique index rather than a table constraint.
CREATE UNIQUE INDEX IF NOT EXISTS canonical_topics_label_type_unique
  ON public.canonical_topics (lower(canonical_label), topic_type);

CREATE INDEX IF NOT EXISTS idx_canonical_topics_type
  ON public.canonical_topics (topic_type);
CREATE INDEX IF NOT EXISTS idx_canonical_topics_active
  ON public.canonical_topics (is_active);
CREATE INDEX IF NOT EXISTS idx_canonical_topics_active_count
  ON public.canonical_topics (active_company_count DESC);

-- ---------------------------------------------------------------------------
-- 2) canonical_topic_aliases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.canonical_topic_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_topic_id UUID NOT NULL REFERENCES public.canonical_topics(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_language TEXT,
  alias_type TEXT NOT NULL DEFAULT 'synonym' CHECK (
    alias_type IN ('synonym','translation','abbreviation','related_entity')
  ),
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique on (topic, lowercased alias, language). language is nullable so
-- coalesce to '' for index purposes — otherwise NULLs would always be
-- distinct from each other and we'd get duplicate "DPRK" entries.
CREATE UNIQUE INDEX IF NOT EXISTS canonical_topic_aliases_unique
  ON public.canonical_topic_aliases (
    canonical_topic_id, lower(alias), coalesce(alias_language, '')
  );

CREATE INDEX IF NOT EXISTS idx_canonical_aliases_topic
  ON public.canonical_topic_aliases (canonical_topic_id);
CREATE INDEX IF NOT EXISTS idx_canonical_aliases_alias_lower
  ON public.canonical_topic_aliases (lower(alias));

-- pg_trgm GIN index for fuzzy lookups, only created if the extension is
-- enabled. Falls back silently if pg_trgm is not installed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_canonical_aliases_trgm '
         || 'ON public.canonical_topic_aliases USING gin (alias gin_trgm_ops)';
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- 3) company_canonical_mappings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_canonical_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  canonical_topic_id UUID NOT NULL REFERENCES public.canonical_topics(id) ON DELETE CASCADE,
  source_field TEXT NOT NULL CHECK (
    source_field IN ('tracked_themes','watchlist_entities','regions','sectors','risk_priorities','supply_chain_exposure')
  ),
  source_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_canonical_mapping
    UNIQUE (company_profile_id, canonical_topic_id, source_field)
);

CREATE INDEX IF NOT EXISTS idx_ccm_company
  ON public.company_canonical_mappings (company_profile_id);
CREATE INDEX IF NOT EXISTS idx_ccm_canonical
  ON public.company_canonical_mappings (canonical_topic_id);

-- ---------------------------------------------------------------------------
-- 4) RLS policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.canonical_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_topic_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_canonical_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read canonical topics"
  ON public.canonical_topics;
CREATE POLICY "Authenticated users can read canonical topics"
  ON public.canonical_topics FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service role manages canonical topics"
  ON public.canonical_topics;
CREATE POLICY "Service role manages canonical topics"
  ON public.canonical_topics FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read canonical aliases"
  ON public.canonical_topic_aliases;
CREATE POLICY "Authenticated users can read canonical aliases"
  ON public.canonical_topic_aliases FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service role manages canonical aliases"
  ON public.canonical_topic_aliases;
CREATE POLICY "Service role manages canonical aliases"
  ON public.canonical_topic_aliases FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Users can view own canonical mappings"
  ON public.company_canonical_mappings;
CREATE POLICY "Users can view own canonical mappings"
  ON public.company_canonical_mappings FOR SELECT
  USING (
    company_profile_id IN (
      SELECT id FROM public.company_profiles WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages canonical mappings"
  ON public.company_canonical_mappings;
CREATE POLICY "Service role manages canonical mappings"
  ON public.company_canonical_mappings FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ---------------------------------------------------------------------------
-- 5) Triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS canonical_topics_updated_at ON public.canonical_topics;
CREATE TRIGGER canonical_topics_updated_at
  BEFORE UPDATE ON public.canonical_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Maintain canonical_topics.active_company_count from
-- company_canonical_mappings INSERT/UPDATE/DELETE.
CREATE OR REPLACE FUNCTION public.recalc_canonical_topic_active_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE public.canonical_topics
       SET active_company_count = (
         SELECT COUNT(DISTINCT company_profile_id)
           FROM public.company_canonical_mappings
          WHERE canonical_topic_id = NEW.canonical_topic_id
       )
     WHERE id = NEW.canonical_topic_id;
  END IF;

  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.canonical_topic_id <> OLD.canonical_topic_id)) THEN
    UPDATE public.canonical_topics
       SET active_company_count = (
         SELECT COUNT(DISTINCT company_profile_id)
           FROM public.company_canonical_mappings
          WHERE canonical_topic_id = OLD.canonical_topic_id
       )
     WHERE id = OLD.canonical_topic_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS company_canonical_mappings_recalc
  ON public.company_canonical_mappings;
CREATE TRIGGER company_canonical_mappings_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.company_canonical_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.recalc_canonical_topic_active_count();

commit;
