-- Articles table — migrates daily-generated content/blog/*.md files into Supabase
-- so new articles appear via ISR without a full site rebuild.
-- Separate from the existing `blog_posts` table, which holds long-form
-- hand-authored Perspectives posts.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  keywords TEXT[] DEFAULT '{}'::TEXT[],
  image TEXT,
  excerpt TEXT,
  author TEXT,
  content TEXT NOT NULL,
  reading_time INTEGER,
  published_at TIMESTAMPTZ NOT NULL,
  frontmatter JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS articles_published_at_idx ON public.articles (published_at DESC);
CREATE INDEX IF NOT EXISTS articles_category_idx     ON public.articles (category);
CREATE INDEX IF NOT EXISTS articles_tags_gin         ON public.articles USING GIN (tags);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read published articles" ON public.articles;
CREATE POLICY "anon read published articles" ON public.articles
  FOR SELECT
  TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= NOW());

DROP POLICY IF EXISTS "service role full access articles" ON public.articles;
CREATE POLICY "service role full access articles" ON public.articles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS articles_set_updated_at ON public.articles;
CREATE TRIGGER articles_set_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
