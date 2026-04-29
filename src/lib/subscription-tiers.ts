// ---------------------------------------------------------------------------
// Subscription tier definitions — Phase 6
// ---------------------------------------------------------------------------

export interface TierDefinition {
  id: string;
  label: string;
  description: string;
  maxTrackedThemes: number;
  maxWatchlistEntities: number;
  maxEmailRecipients: number;
  features: string[];
  monthlyPrice: number | null; // null = not self-serve (enterprise)
  annualPrice: number | null; // null = not self-serve
  highlighted?: boolean;
}

export const TIERS: Record<string, TierDefinition> = {
  free: {
    id: "free",
    label: "Free",
    description: "Public news intelligence",
    maxTrackedThemes: 0,
    maxWatchlistEntities: 0,
    maxEmailRecipients: 0,
    features: [
      "Access to albis.news",
      "Free daily global newsletter",
      "Global Attention Index",
    ],
    monthlyPrice: 0,
    annualPrice: 0,
  },
  pro: {
    id: "pro",
    label: "Pro",
    description: "For one person monitoring a focused set of risks",
    maxTrackedThemes: 10,
    maxWatchlistEntities: 10,
    maxEmailRecipients: 1,
    features: [
      "1 company profile",
      "Daily Company Scan",
      "Email delivery to 1 recipient",
      "Dashboard + scan archive",
      "Open source link per finding",
      "Source trail for saved scans",
      "Up to 10 monitored topics",
      "Up to 10 watchlist entities",
    ],
    monthlyPrice: 49,
    annualPrice: 39,
    highlighted: true,
  },
  team: {
    id: "team",
    label: "Team",
    description: "For teams who need the same scan in front of everyone",
    maxTrackedThemes: 15,
    maxWatchlistEntities: 15,
    maxEmailRecipients: 5,
    features: [
      "Everything in Pro",
      "Email delivery to up to 5 recipients",
      "Shared dashboard + scan archive",
      "Source trail for verification",
      "More topic and entity capacity",
      "Up to 15 monitored topics",
      "Up to 15 watchlist entities",
      "Weekly scan summary",
    ],
    monthlyPrice: 99,
    annualPrice: 79,
  },
  company_intelligence: {
    id: "company_intelligence",
    label: "Company Intelligence",
    description: "For organisations with wider exposure and more moving parts",
    maxTrackedThemes: 25,
    maxWatchlistEntities: 25,
    maxEmailRecipients: 10,
    features: [
      "Everything in Team",
      "Expanded company profile",
      "Email delivery to up to 10 recipients",
      "Full source trail and coverage notes",
      "Perception Gap tracking",
      "Priority support",
      "Up to 25 monitored topics",
      "Up to 25 watchlist entities",
      "Weekly scan summary",
    ],
    monthlyPrice: 199,
    annualPrice: 159,
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    description: "For large organisations that need custom monitoring",
    maxTrackedThemes: 999,
    maxWatchlistEntities: 999,
    maxEmailRecipients: 999,
    features: [
      "Multiple daily scan streams",
      "Multiple profiles or business units",
      "Unlimited recipients",
      "Custom source and topic setup",
      "Custom integrations",
      "Dedicated onboarding",
      "Priority support",
    ],
    monthlyPrice: null,
    annualPrice: null,
  },
};

// Ordered list for pricing page display
export const TIER_ORDER = [
  "free",
  "pro",
  "team",
  "company_intelligence",
  "enterprise",
] as const;

// Tiers that can be purchased via Stripe checkout
export const PURCHASABLE_TIERS = [
  "pro",
  "team",
  "company_intelligence",
] as const;

/**
 * Get the tier definition for a given tier ID.
 * Falls back to "free" if not found.
 */
export function getTier(tierId: string | null | undefined): TierDefinition {
  if (!tierId) return TIERS.free;
  return TIERS[tierId] || TIERS.free;
}

/**
 * Check if a tier ID represents an active paid tier.
 */
export function isPaidTier(tierId: string | null | undefined): boolean {
  return !!tierId && tierId !== "free" && tierId in TIERS;
}
