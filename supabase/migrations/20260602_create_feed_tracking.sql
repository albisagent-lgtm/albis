-- 2026-06-02 — Albis Interactive Feed V1 tracking/ranking foundation
-- Tracks card interactions and stores simple cached ranking counters.

CREATE TABLE IF NOT EXISTS public.feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_slug TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'feed_events_event_type_check'
      AND conrelid = 'public.feed_events'::regclass
  ) THEN
    ALTER TABLE public.feed_events
      ADD CONSTRAINT feed_events_event_type_check
      CHECK (event_type IN ('impression','open','comment','save','unsave','share','follow','unfollow','hide','report'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_feed_events_card_created
  ON public.feed_events(card_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_events_type_created
  ON public.feed_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_events_anon_created
  ON public.feed_events(anon_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.feed_scores (
  card_slug TEXT PRIMARY KEY,
  unique_opens INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  saves_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  follows_count INTEGER NOT NULL DEFAULT 0,
  hides_count INTEGER NOT NULL DEFAULT 0,
  reports_count INTEGER NOT NULL DEFAULT 0,
  score NUMERIC NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_scores_score
  ON public.feed_scores(score DESC);

CREATE INDEX IF NOT EXISTS idx_feed_scores_last_activity
  ON public.feed_scores(last_activity_at DESC);

ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed scores are publicly readable" ON public.feed_scores;
CREATE POLICY "Feed scores are publicly readable"
  ON public.feed_scores
  FOR SELECT
  USING (true);

-- Writes are handled through internal API routes using the service role.
