-- 2026-06-04 — Albis public feed-account social foundation
-- Adds DB-backed follows, in-app notifications, and a human time-clock event layer.
-- Idempotent and safe to stage locally; writes are performed by internal API routes.

CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_label TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_follows_target_type_check CHECK (target_type IN ('person', 'topic', 'source')),
  CONSTRAINT user_follows_target_id_length_check CHECK (char_length(target_id) BETWEEN 3 AND 120),
  CONSTRAINT user_follows_target_label_length_check CHECK (char_length(target_label) BETWEEN 1 AND 160),
  CONSTRAINT user_follows_unique_target UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_user_created
  ON public.user_follows(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_target
  ON public.user_follows(target_type, target_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_user_follows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_follows_updated_at ON public.user_follows;
CREATE TRIGGER update_user_follows_updated_at
  BEFORE UPDATE ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_follows_updated_at();

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own follows" ON public.user_follows;
CREATE POLICY "Users can read own follows"
  ON public.user_follows
  FOR SELECT
  USING (auth.uid() = user_id);

-- No public follower-count read policy: follows power personalisation, not clout displays.
-- Inserts/deletes go through /api/follows using service role validation.

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id TEXT,
  entity_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_type_check CHECK (type IN ('comment', 'reply', 'follow', 'system')),
  CONSTRAINT notifications_entity_url_check CHECK (entity_url IS NULL OR entity_url LIKE '/%')
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON public.notifications(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications(recipient_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_entity
  ON public.notifications(entity_type, entity_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Mutations are routed through /api/notifications so unread state stays bounded.

CREATE TABLE IF NOT EXISTS public.time_clock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  event_type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  seconds INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT time_clock_direction_check CHECK (direction IN ('spent', 'gained')),
  CONSTRAINT time_clock_event_type_check CHECK (event_type IN ('view', 'dwell', 'create_card', 'comment', 'reply', 'reaction', 'other')),
  CONSTRAINT time_clock_seconds_check CHECK (seconds >= 0 AND seconds <= 86400)
);

CREATE INDEX IF NOT EXISTS idx_time_clock_events_user_created
  ON public.time_clock_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_time_clock_events_target_created
  ON public.time_clock_events(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.time_clock_totals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  seconds_spent BIGINT NOT NULL DEFAULT 0,
  seconds_gained BIGINT NOT NULL DEFAULT 0,
  events_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.time_clock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_totals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own time events" ON public.time_clock_events;
CREATE POLICY "Users can read own time events"
  ON public.time_clock_events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own time totals" ON public.time_clock_totals;
CREATE POLICY "Users can read own time totals"
  ON public.time_clock_totals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Time-clock writes are auth-only via /api/time-clock/events.
