// ---------------------------------------------------------------------------
// Tier enforcement helpers — Phase 6
// Checks subscription status and enforces tier limits.
// ---------------------------------------------------------------------------

import { getTier, type TierDefinition } from "./subscription-tiers";

export interface ProfileSubscription {
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_period_end: string | null;
}

/**
 * Check if a user's subscription is currently active (active or trialing).
 */
export function isSubscriptionActive(profile: ProfileSubscription): boolean {
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
 */
export function getEffectiveTier(profile: ProfileSubscription): TierDefinition {
  if (isSubscriptionActive(profile) || isInGracePeriod(profile)) {
    return getTier(profile.subscription_tier);
  }
  return getTier("free");
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
