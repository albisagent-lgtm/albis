-- 2026-04-26 — Package 7: is_test_account flag + trial_end_at column
--
-- Replaces the hardcoded TEST_COMPANY_OWNER_ID bypass in
-- src/lib/tier-enforcement.ts with a proper per-profile flag, and adds
-- a stored end timestamp for the auto-assigned 7-day trial that fires
-- on onboarding completion (Package 7).
--
-- Idempotent. Safe to re-run against the live DB.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_test_account boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_test_account
  ON public.profiles (is_test_account) WHERE is_test_account = true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_end_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_at
  ON public.profiles (trial_end_at) WHERE trial_end_at IS NOT NULL;

-- Backfill: mark the existing TEST_COMPANY_OWNER_ID profile as a test
-- account so the bypass keeps working immediately after the column lands
-- (and before the manual backfill script runs).
UPDATE public.profiles
   SET is_test_account = true
 WHERE id = 'c60e8ee4-8a11-4e60-9844-bd0e07d5e4d2'
   AND is_test_account = false;
