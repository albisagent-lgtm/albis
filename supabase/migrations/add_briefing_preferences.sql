-- Add briefing_preferences column to profiles table
-- Run this in Supabase SQL Editor if not already applied

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_preferences JSONB DEFAULT '{}'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN profiles.briefing_preferences IS 'User preferences for briefing personalization (categories and regions)';
