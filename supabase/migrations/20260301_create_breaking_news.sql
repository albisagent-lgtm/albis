CREATE TABLE IF NOT EXISTS public.breaking_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  url text,
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "breaking_news_public_read" ON public.breaking_news;
CREATE POLICY "breaking_news_public_read" 
  ON public.breaking_news 
  FOR SELECT 
  USING (true);
