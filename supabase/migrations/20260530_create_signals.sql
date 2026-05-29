-- 2026-05-30 — Albis Live Signals MVP
-- Public read surface for compact verified reports generated from published articles.
-- Uses a dedicated public.albis_live_signals table because public.signals already
-- belongs to the company/internal signal pipeline.
-- Idempotent/repair-safe: handles a partially-created public.albis_live_signals table.

-- Safety cleanup in case an earlier migration attempt added a public policy to
-- the existing company/internal signals table.
DROP POLICY IF EXISTS "Published signals are publicly readable" ON public.signals;

CREATE TABLE IF NOT EXISTS public.albis_live_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.albis_live_signals
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS article_slug TEXT,
  ADD COLUMN IF NOT EXISTS article_url TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS bullets TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS still_unclear TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_note TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.albis_live_signals
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN title SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'albis_live_signals_status_check'
      AND conrelid = 'public.albis_live_signals'::regclass
  ) THEN
    ALTER TABLE public.albis_live_signals
      ADD CONSTRAINT albis_live_signals_status_check CHECK (status IN ('draft','published','archived'));
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_albis_live_signals_slug_unique
  ON public.albis_live_signals(slug);

CREATE INDEX IF NOT EXISTS idx_albis_live_signals_status_published_at
  ON public.albis_live_signals(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_albis_live_signals_category_published_at
  ON public.albis_live_signals(category, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_albis_live_signals_article_slug
  ON public.albis_live_signals(article_slug);

CREATE INDEX IF NOT EXISTS idx_albis_live_signals_last_activity_at
  ON public.albis_live_signals(last_activity_at DESC);

CREATE OR REPLACE FUNCTION public.update_albis_live_signals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_albis_live_signals_updated_at ON public.albis_live_signals;
CREATE TRIGGER update_albis_live_signals_updated_at
  BEFORE UPDATE ON public.albis_live_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_albis_live_signals_updated_at();

ALTER TABLE public.albis_live_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published Albis live signals are publicly readable" ON public.albis_live_signals;
CREATE POLICY "Published Albis live signals are publicly readable"
  ON public.albis_live_signals
  FOR SELECT
  USING (status = 'published');

-- Writes are intentionally service-role only. No anonymous insert/update/delete policy.

-- Trust scaffolding for the human context layer. These fields are passive for MVP:
-- no likes/upvotes/ranking, just room for later calm verification badges.
ALTER TABLE public.article_comments
  ADD COLUMN IF NOT EXISTS context_type TEXT,
  ADD COLUMN IF NOT EXISTS trust_status TEXT NOT NULL DEFAULT 'reader_report',
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'article_comments_trust_status_check'
      AND conrelid = 'public.article_comments'::regclass
  ) THEN
    ALTER TABLE public.article_comments
      ADD CONSTRAINT article_comments_trust_status_check
      CHECK (trust_status IN ('reader_report','supported_by_source','corroborated','verified_by_albis','needs_checking','disputed'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_article_comments_trust_status
  ON public.article_comments(trust_status);
