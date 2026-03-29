CREATE TABLE IF NOT EXISTS scan_pulse (
  id BIGSERIAL PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  scan_period TEXT CHECK (scan_period IN ('am', 'midday', 'pm')),
  global_mood TEXT,
  top_pgi_story TEXT,
  top_pgi_score DECIMAL(4,2),
  top_gai_story TEXT,
  top_gai_score DECIMAL(4,2),
  stories_found INTEGER DEFAULT 0
);

-- Only ever keep one row (always upsert with id=1)
INSERT INTO scan_pulse (id, global_mood, stories_found) VALUES (1, 'Initialising', 0) ON CONFLICT (id) DO NOTHING;
