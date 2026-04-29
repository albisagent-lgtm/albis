// ---------------------------------------------------------------------------
// Free-trial assignment — Package 7.
//
// Called from /api/onboarding/complete (and from scripts/backfill-trial-state.ts)
// to flip a brand-new user into the 3-day trial state. Stripe is NOT involved
// here — no Customer or Subscription is created. The user only enters Stripe
// when they upgrade via /api/stripe/checkout.
//
// Idempotent: only fires if subscription_status IS NULL. Re-running on an
// already-trialing or already-paying user is a no-op.
// ---------------------------------------------------------------------------
import type { SupabaseClient } from "@supabase/supabase-js";

export const TRIAL_DURATION_DAYS = 3;
export const TRIAL_DEFAULT_TIER = "pro";

export interface AssignTrialResult {
  /** True if this call actually assigned a trial. False if the user was
   * already in any subscription state (no-op). */
  assigned: boolean;
  /** ISO timestamp the trial ends at, regardless of whether we assigned it
   * just now or it was already in place. */
  trialEndAt: string | null;
  error: string | null;
}

/**
 * Assign a 3-day trial to a user if they have no subscription_status yet.
 *
 * `supabase` MUST be an admin (service-role) client — the RLS policy on
 * profiles only allows users to update their own row, but we don't want
 * users to be able to grant themselves trials by calling this from the
 * browser.
 */
export async function assignFreeTrial(
  supabase: SupabaseClient,
  userId: string,
): Promise<AssignTrialResult> {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
  const trialEndIso = trialEnd.toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      subscription_status: "trialing",
      subscription_tier: TRIAL_DEFAULT_TIER,
      trial_end_at: trialEndIso,
    })
    .eq("id", userId)
    .is("subscription_status", null)
    .select("trial_end_at");

  if (error) {
    return { assigned: false, trialEndAt: null, error: error.message };
  }

  if (data && data.length > 0) {
    return {
      assigned: true,
      trialEndAt: data[0].trial_end_at as string,
      error: null,
    };
  }

  // No row updated → user already had a subscription_status. Read back the
  // existing trial_end_at (if any) for caller convenience.
  const { data: existing } = await supabase
    .from("profiles")
    .select("trial_end_at")
    .eq("id", userId)
    .single();

  return {
    assigned: false,
    trialEndAt: (existing?.trial_end_at as string | null) ?? null,
    error: null,
  };
}
