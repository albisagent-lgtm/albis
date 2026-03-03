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

CREATE POLICY "Briefings are publicly readable" ON public.briefings
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage briefings" ON public.briefings
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
