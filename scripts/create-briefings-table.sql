-- Run this in Supabase SQL Editor for project wguydvzpxwsgrhvojpnk
-- Dashboard: https://supabase.com/dashboard/project/wguydvzpxwsgrhvojpnk/sql/new

CREATE TABLE IF NOT EXISTS public.briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  content_md TEXT NOT NULL,
  mood TEXT,
  pgi_score DECIMAL(4,2),
  story_count INTEGER,
  top_stories JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefings_date ON public.briefings(date DESC);

ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Briefings are publicly readable" ON public.briefings;
CREATE POLICY "Briefings are publicly readable" ON public.briefings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage briefings" ON public.briefings;
CREATE POLICY "Service role can manage briefings" ON public.briefings
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
