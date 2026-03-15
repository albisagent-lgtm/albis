-- Add SEO and metadata fields to blog_posts table

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS seo_keyword TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS faqs JSONB,
  ADD COLUMN IF NOT EXISTS sources JSONB,
  ADD COLUMN IF NOT EXISTS confidence TEXT;

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON public.blog_posts(category);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON public.blog_posts(status);
