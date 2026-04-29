// ---------------------------------------------------------------------------
// Company profile constants and types
//
// Sectors, regions, and sector-bundle suggestions now live in
// `src/lib/onboarding-taxonomy.ts` (single source of truth). This file keeps
// the domain types and the non-sector constants (risk priorities, briefing
// depths, delivery times, tier-independent caps).
// ---------------------------------------------------------------------------

export interface CompanyProfile {
  id: string;
  owner_id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
  sector: string | null;
  sub_sector: string | null;
  countries: string[];
  regions: string[];
  supply_chain_exposure: string[];
  tracked_themes: string[];
  watchlist_entities: string[];
  risk_priorities: string[];
  preferred_briefing_depth: "executive_summary" | "standard" | "detailed";
  preferred_delivery_time: string;
  timezone: string;
  email_enabled: boolean;
  email_recipients: string[];
  dashboard_enabled: boolean;
}

// ---------------------------------------------------------------------------
// Re-exports from onboarding-taxonomy for backward compatibility.
// New code should import directly from "@/lib/onboarding-taxonomy".
// ---------------------------------------------------------------------------
export {
  SECTORS,
  COMPANY_REGIONS,
  SECTOR_BUNDLES,
  LEGACY_SECTOR_MAP,
  resolveSectorId,
  getBundleFor,
  getSectorDefinition,
  type SectorDefinition,
  type CompanyRegionId,
  type SectorId,
} from "./onboarding-taxonomy";

// ---------------------------------------------------------------------------
// Risk priorities (select up to 5)
// ---------------------------------------------------------------------------

export const RISK_PRIORITIES = [
  {
    id: "supply-chain-disruption",
    label: "Supply chain disruption",
    color: "amber",
  },
  {
    id: "commodity-price-volatility",
    label: "Commodity price volatility",
    color: "orange",
  },
  {
    id: "geopolitical-conflict",
    label: "Geopolitical / conflict risk",
    color: "rose",
  },
  {
    id: "regulatory-policy",
    label: "Regulatory / policy change",
    color: "blue",
  },
  {
    id: "trade-tariff-sanctions",
    label: "Trade / tariff / sanctions risk",
    color: "violet",
  },
  {
    id: "currency-financial",
    label: "Currency / financial market risk",
    color: "emerald",
  },
  {
    id: "climate-environmental",
    label: "Climate / weather / environmental risk",
    color: "teal",
  },
  { id: "cyber-technology", label: "Cyber / technology risk", color: "cyan" },
  {
    id: "reputation-narrative",
    label: "Reputation / narrative risk",
    color: "fuchsia",
  },
  {
    id: "energy-price",
    label: "Energy price / availability risk",
    color: "amber",
  },
  {
    id: "food-water-security",
    label: "Food / water security risk",
    color: "lime",
  },
  { id: "labour-workforce", label: "Labour / workforce risk", color: "sky" },
] as const;

export type RiskPriorityId = (typeof RISK_PRIORITIES)[number]["id"];

export const MAX_RISK_PRIORITIES = 5;

// ---------------------------------------------------------------------------
// Daily scan detail options
// ---------------------------------------------------------------------------

export const BRIEFING_DEPTHS = [
  {
    id: "executive_summary",
    label: "Compact",
    description: "Key findings only",
  },
  {
    id: "standard",
    label: "Standard",
    description: "Topic-by-topic daily scan",
  },
  {
    id: "detailed",
    label: "Detailed",
    description: "More findings and source-trail context",
  },
] as const;

// ---------------------------------------------------------------------------
// Delivery time options (common business hours)
// ---------------------------------------------------------------------------

export const DELIVERY_TIMES = [
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
] as const;
