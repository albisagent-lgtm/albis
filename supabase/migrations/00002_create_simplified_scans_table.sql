-- Create simplified scans table as per requirements
-- This replaces the need for separate scans + scan_items tables

CREATE TABLE IF NOT EXISTS public.scans_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date date NOT NULL,
  scan_time text NOT NULL CHECK (scan_time IN ('7am', '1pm', '7pm', 'am', 'pm')),
  human_summary text,
  mood text,
  top_theme text,
  pattern_of_day jsonb, -- {title, description}
  framing_watch jsonb, -- {topic, perspectives: [{region, frame}]}
  items jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of scan items
  raw_markdown text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scans_v2_date_time_unique UNIQUE (scan_date, scan_time)
);

-- Enable RLS
ALTER TABLE public.scans_v2 ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon key)
CREATE POLICY "scans_v2_public_read" ON public.scans_v2
  FOR SELECT USING (true);

-- Allow service role to insert/update
CREATE POLICY "scans_v2_service_write" ON public.scans_v2
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Index for performance
CREATE INDEX idx_scans_v2_date ON public.scans_v2(scan_date DESC);
CREATE INDEX idx_scans_v2_items ON public.scans_v2 USING gin(items);

-- Comment for clarity
COMMENT ON TABLE public.scans_v2 IS 'Simplified scans table with JSONB columns for items and metadata';