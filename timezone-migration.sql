-- Add timezone column to subscribers and profiles
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
