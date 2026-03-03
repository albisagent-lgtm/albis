-- GAI (Global Attention Index) Tables

CREATE TABLE IF NOT EXISTS gai_story_scores (
  id BIGSERIAL PRIMARY KEY,
  scan_date DATE NOT NULL,
  scan_period TEXT NOT NULL CHECK (scan_period IN ('am', 'midday', 'pm')),
  story_slug TEXT NOT NULL,
  story_headline TEXT,
  category TEXT,
  regions_found TEXT[] DEFAULT '{}',
  regions_absent TEXT[] DEFAULT '{}',
  coverage_breadth INTEGER DEFAULT 0,
  d1_coverage_breadth DECIMAL(4,2) DEFAULT 0,
  d2_prominence_disparity DECIMAL(4,2) DEFAULT 0,
  d3_population_exposure DECIMAL(4,2) DEFAULT 0,
  d4_significance_severity DECIMAL(4,2) DEFAULT 0,
  story_gai DECIMAL(4,2) DEFAULT 0,
  significance INTEGER DEFAULT 1,
  scoring_rationale TEXT,
  is_latest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scan_date, scan_period, story_slug)
);

CREATE INDEX IF NOT EXISTS idx_gai_story_date ON gai_story_scores(scan_date);
CREATE INDEX IF NOT EXISTS idx_gai_story_latest ON gai_story_scores(is_latest) WHERE is_latest = true;

CREATE TABLE IF NOT EXISTS gai_daily (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  daily_gai DECIMAL(4,2) DEFAULT 0,
  tier TEXT,
  story_count INTEGER DEFAULT 0,
  tributaries JSONB DEFAULT '{}',
  blind_region_ranking JSONB DEFAULT '{}',
  most_invisible_story TEXT,
  most_invisible_gai DECIMAL(4,2),
  most_visible_story TEXT,
  most_visible_gai DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gai_weekly (
  id BIGSERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  iso_week TEXT NOT NULL UNIQUE,
  weekly_gai DECIMAL(4,2) DEFAULT 0,
  tier TEXT,
  change_vs_prev DECIMAL(4,2),
  tributaries JSONB DEFAULT '{}',
  blind_region_ranking JSONB DEFAULT '{}',
  most_invisible_story TEXT,
  most_invisible_gai DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE gai_story_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE gai_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE gai_weekly ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "gai_story_scores_select" ON gai_story_scores FOR SELECT USING (true);
CREATE POLICY "gai_daily_select" ON gai_daily FOR SELECT USING (true);
CREATE POLICY "gai_weekly_select" ON gai_weekly FOR SELECT USING (true);

-- Service role write
CREATE POLICY "gai_story_scores_insert" ON gai_story_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "gai_story_scores_update" ON gai_story_scores FOR UPDATE USING (true);
CREATE POLICY "gai_daily_insert" ON gai_daily FOR INSERT WITH CHECK (true);
CREATE POLICY "gai_daily_update" ON gai_daily FOR UPDATE USING (true);
CREATE POLICY "gai_weekly_insert" ON gai_weekly FOR INSERT WITH CHECK (true);
CREATE POLICY "gai_weekly_update" ON gai_weekly FOR UPDATE USING (true);
