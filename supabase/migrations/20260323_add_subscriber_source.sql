-- Add source tracking to subscribers
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS source text;

-- Comment for clarity
COMMENT ON COLUMN subscribers.source IS 'Where the subscriber signed up from: homepage-hero, homepage-gate, article-bottom, archive, etc.';
