CREATE TABLE IF NOT EXISTS framing_lab_submissions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  story_description TEXT NOT NULL,
  region_noticed TEXT NOT NULL,
  source_url TEXT,
  submitter_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'published', 'declined')),
  notes TEXT
);
