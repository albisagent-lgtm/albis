-- 2026-05-29 — Public article conversation threads
-- Owned/internal comments system for Albis article pages.

CREATE TABLE IF NOT EXISTS public.article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'pending', 'hidden')),
  ip_hash TEXT,
  user_agent_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_comments_article_slug_created
  ON public.article_comments(article_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_comments_parent_id
  ON public.article_comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_article_comments_status
  ON public.article_comments(status);

CREATE INDEX IF NOT EXISTS idx_article_comments_ip_hash_created
  ON public.article_comments(ip_hash, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_article_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_article_comments_updated_at ON public.article_comments;
CREATE TRIGGER update_article_comments_updated_at
  BEFORE UPDATE ON public.article_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_article_comments_updated_at();

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visible article comments are publicly readable" ON public.article_comments;
CREATE POLICY "Visible article comments are publicly readable"
  ON public.article_comments
  FOR SELECT
  USING (status = 'visible');

-- Inserts/updates are intentionally handled through internal API routes using
-- validation, rate limits, and the service role. No direct anonymous insert policy.
