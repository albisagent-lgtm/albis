// ---------------------------------------------------------------------------
// Tier enforcement helpers — Phase 6
// Checks subscription status and enforces tier limits.
// ---------------------------------------------------------------------------

import { getTier, type TierDefinition } from "./subscription-tiers";

export interface ProfileSubscription {
  id?: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_period_end: string | null;
  is_test_account?: boolean | null;
  trial_end_at?: string | null;
}

/**
 * Check if a user's subscription is currently active (active or trialing).
 * is_test_account profiles always return true (replaces the legacy
 * hardcoded TEST_COMPANY_OWNER_ID bypass — Package 7 migration).
 */
export function isSubscriptionActive(profile: ProfileSubscription): boolean {
  if (profile.is_test_account === true) return true;
  const status = profile.subscription_status;
  if (status === "active") return true;
  if (status === "trialing") return isTrialing(profile);
  return false;
}

/**
 * True iff the profile is currently in its 3-day free trial window.
 * Read-only helper for dashboard display — the gate for briefing
 * generation is `isSubscriptionActive` (which already returns true for
 * status='trialing').
 */
export function isTrialing(profile: ProfileSubscription): boolean {
  if (profile.subscription_status !== "trialing") return false;
  if (!profile.trial_end_at) return false;
  return new Date(profile.trial_end_at).getTime() > Date.now();
}

/**
 * Whole days remaining until trial_end_at, or null if not in a trial.
 * Rounded up so a trial expiring in 30 minutes still reads as "1 day left."
 */
export function daysRemainingInTrial(
  profile: ProfileSubscription,
): number | null {
  if (!isTrialing(profile)) return null;
  const ms = new Date(profile.trial_end_at!).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/**
 * Check if a subscription has expired but is within the 30-day grace period
 * (profile + archive accessible, but no new briefings generated).
 */
export function isInGracePeriod(profile: ProfileSubscription): boolean {
  if (isSubscriptionActive(profile)) return false;
  if (!profile.subscription_period_end) return false;

  const endDate = new Date(profile.subscription_period_end);
  const gracePeriodEnd = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  return new Date() < gracePeriodEnd;
}

/**
 * Get the effective tier definition for a user.
 * Returns free tier if subscription is not active and not in grace period.
 * Used for the HARD paywall — briefing generation, feature gating, etc.
 */
export function getEffectiveTier(profile: ProfileSubscription): TierDefinition {
  if (isSubscriptionActive(profile) || isInGracePeriod(profile)) {
    return getTier(profile.subscription_tier);
  }
  return getTier("free");
}

/**
 * Get the tier definition to use for onboarding/profile-editing UI.
 * Non-subscribed users get Pro-tier limits so they can complete onboarding
 * in "preview mode" — their profile is saved but briefings don't generate
 * until they subscribe (shouldGenerateBriefing is the real gate).
 */
export function getOnboardingTier(
  profile: ProfileSubscription,
): TierDefinition {
  if (isSubscriptionActive(profile) || isInGracePeriod(profile)) {
    return getTier(profile.subscription_tier);
  }
  return getTier("pro");
}

/**
 * Check if a user can add another tracked theme.
 */
export function canAddTheme(
  profile: ProfileSubscription,
  currentCount: number,
): boolean {
  const tier = getEffectiveTier(profile);
  return currentCount < tier.maxTrackedThemes;
}

/**
 * Check if a user can add another watchlist entity.
 */
export function canAddEntity(
  profile: ProfileSubscription,
  currentCount: number,
): boolean {
  const tier = getEffectiveTier(profile);
  return currentCount < tier.maxWatchlistEntities;
}

/**
 * Check if a user can add another email recipient.
 */
export function canAddRecipient(
  profile: ProfileSubscription,
  currentCount: number,
): boolean {
  const tier = getEffectiveTier(profile);
  return currentCount < tier.maxEmailRecipients;
}

/**
 * Get a human-readable description of what the user needs to upgrade for.
 */
export function getUpgradeReason(
  profile: ProfileSubscription,
  limitType: "themes" | "entities" | "recipients",
): string {
  const tier = getEffectiveTier(profile);
  switch (limitType) {
    case "themes":
      return `Your ${tier.label} plan allows up to ${tier.maxTrackedThemes} tracked themes.`;
    case "entities":
      return `Your ${tier.label} plan allows up to ${tier.maxWatchlistEntities} watchlist entities.`;
    case "recipients":
      return `Your ${tier.label} plan allows up to ${tier.maxEmailRecipients} email recipient${tier.maxEmailRecipients === 1 ? "" : "s"}.`;
  }
}

/**
 * Check if briefing generation should run for this profile.
 * Briefings only run for active subscriptions, not for free tier or expired.
 */
export function shouldGenerateBriefing(profile: ProfileSubscription): boolean {
  return isSubscriptionActive(profile);
}
