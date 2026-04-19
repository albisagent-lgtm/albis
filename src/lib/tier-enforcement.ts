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
}

// Test-only bypass. Scoped to one immutable owner profile UUID.
// Remove this block when Test Company is moved to a real subscription
// or when a dedicated is_test_account flag is added to profiles.
const TEST_COMPANY_OWNER_ID = "c60e8ee4-8a11-4e60-9844-bd0e07d5e4d2";

/**
 * Check if a user's subscription is currently active (active or trialing).
 */
export function isSubscriptionActive(profile: ProfileSubscription): boolean {
  if (profile.id === TEST_COMPANY_OWNER_ID) return true;
  const status = profile.subscription_status;
  return status === "active" || status === "trialing";
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
export function getOnboardingTier(profile: ProfileSubscription): TierDefinition {
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
  currentCount: number
): boolean {
  const tier = getEffectiveTier(profile);
  return currentCount < tier.maxTrackedThemes;
}

/**
 * Check if a user can add another watchlist entity.
 */
export function canAddEntity(
  profile: ProfileSubscription,
  currentCount: number
): boolean {
  const tier = getEffectiveTier(profile);
  return currentCount < tier.maxWatchlistEntities;
}

/**
 * Check if a user can add another email recipient.
 */
export function canAddRecipient(
  profile: ProfileSubscription,
  currentCount: number
): boolean {
  const tier = getEffectiveTier(profile);
  return currentCount < tier.maxEmailRecipients;
}

/**
 * Get a human-readable description of what the user needs to upgrade for.
 */
export function getUpgradeReason(
  profile: ProfileSubscription,
  limitType: "themes" | "entities" | "recipients"
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
