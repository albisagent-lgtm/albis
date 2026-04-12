-- 2026-04-11 — Create company_profiles table (Phase 2: Company Profile & Onboarding)
-- Stores company profile data for personalised briefing generation.
-- One profile per user for MVP.

begin;

-- ============================================================
-- 1) Create company_profiles table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  onboarding_completed BOOLEAN DEFAULT false,

  -- Sector
  sector TEXT,
  sub_sector TEXT,

  -- Geography
  countries TEXT[] DEFAULT '{}',
  regions TEXT[] DEFAULT '{}',

  -- Tracking
  supply_chain_exposure TEXT[] DEFAULT '{}',
  tracked_themes TEXT[] DEFAULT '{}',
  watchlist_entities TEXT[] DEFAULT '{}',

  -- Risk
  risk_priorities TEXT[] DEFAULT '{}',

  -- Delivery preferences
  preferred_briefing_depth TEXT DEFAULT 'standard'
    CHECK (preferred_briefing_depth IN ('executive_summary', 'standard', 'detailed')),
  preferred_delivery_time TEXT DEFAULT '07:00',
  timezone TEXT DEFAULT 'UTC',

  -- Email delivery
  email_enabled BOOLEAN DEFAULT true,
  email_recipients TEXT[] DEFAULT '{}',
  dashboard_enabled BOOLEAN DEFAULT true,

  -- One profile per user for MVP
  CONSTRAINT unique_owner UNIQUE (owner_id)
);

-- ============================================================
-- 2) Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_company_profiles_owner ON public.company_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_sector ON public.company_profiles(sector);
CREATE INDEX IF NOT EXISTS idx_company_profiles_countries ON public.company_profiles USING GIN(countries);
CREATE INDEX IF NOT EXISTS idx_company_profiles_regions ON public.company_profiles USING GIN(regions);
CREATE INDEX IF NOT EXISTS idx_company_profiles_tracked_themes ON public.company_profiles USING GIN(tracked_themes);

-- ============================================================
-- 3) RLS policies
-- ============================================================
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own company profile
CREATE POLICY "Users can view own company profile"
  ON public.company_profiles FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can insert their own company profile
CREATE POLICY "Users can create own company profile"
  ON public.company_profiles FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own company profile
CREATE POLICY "Users can update own company profile"
  ON public.company_profiles FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can delete their own company profile
CREATE POLICY "Users can delete own company profile"
  ON public.company_profiles FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================
-- 4) Auto-update updated_at trigger (reuses existing function)
-- ============================================================
DROP TRIGGER IF EXISTS company_profiles_updated_at ON public.company_profiles;
CREATE TRIGGER company_profiles_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

commit;
