// ---------------------------------------------------------------------------
// Company profile constants and types — Phase 2
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
// Sectors (predefined list from spec)
// ---------------------------------------------------------------------------

export const SECTORS = [
  { id: "logistics-shipping", label: "Logistics / Shipping / Freight", color: "blue" },
  { id: "food-agriculture", label: "Food / Agriculture / FMCG", color: "lime" },
  { id: "manufacturing", label: "Manufacturing / Industrial", color: "zinc" },
  { id: "energy-utilities", label: "Energy / Utilities", color: "amber" },
  { id: "mining-resources", label: "Mining / Resources", color: "orange" },
  { id: "finance-investment", label: "Investment / Finance / Macro", color: "emerald" },
  { id: "technology-software", label: "Technology / Software", color: "violet" },
  { id: "pharma-healthcare", label: "Pharmaceuticals / Healthcare", color: "rose" },
  { id: "construction-infra", label: "Construction / Infrastructure", color: "cyan" },
  { id: "retail-consumer", label: "Retail / Consumer", color: "fuchsia" },
  { id: "media-comms", label: "Media / Communications / PR", color: "sky" },
  { id: "government-public", label: "Government / Public Sector", color: "teal" },
  { id: "consulting-advisory", label: "Consulting / Advisory", color: "blue" },
  { id: "legal-compliance", label: "Legal / Compliance", color: "zinc" },
  { id: "education-research", label: "Education / Research", color: "violet" },
  { id: "other", label: "Other", color: "zinc" },
] as const;

export type SectorId = (typeof SECTORS)[number]["id"];

// ---------------------------------------------------------------------------
// Risk priorities (select up to 5)
// ---------------------------------------------------------------------------

export const RISK_PRIORITIES = [
  { id: "supply-chain-disruption", label: "Supply chain disruption", color: "amber" },
  { id: "commodity-price-volatility", label: "Commodity price volatility", color: "orange" },
  { id: "geopolitical-conflict", label: "Geopolitical / conflict risk", color: "rose" },
  { id: "regulatory-policy", label: "Regulatory / policy change", color: "blue" },
  { id: "trade-tariff-sanctions", label: "Trade / tariff / sanctions risk", color: "violet" },
  { id: "currency-financial", label: "Currency / financial market risk", color: "emerald" },
  { id: "climate-environmental", label: "Climate / weather / environmental risk", color: "teal" },
  { id: "cyber-technology", label: "Cyber / technology risk", color: "cyan" },
  { id: "reputation-narrative", label: "Reputation / narrative risk", color: "fuchsia" },
  { id: "energy-price", label: "Energy price / availability risk", color: "amber" },
  { id: "food-water-security", label: "Food / water security risk", color: "lime" },
  { id: "labour-workforce", label: "Labour / workforce risk", color: "sky" },
] as const;

export type RiskPriorityId = (typeof RISK_PRIORITIES)[number]["id"];

export const MAX_RISK_PRIORITIES = 5;
export const MAX_TRACKED_THEMES = 15;
export const MAX_WATCHLIST_ENTITIES = 15;

// ---------------------------------------------------------------------------
// Suggested tracked themes (per sector, for onboarding hints)
// ---------------------------------------------------------------------------

export const SUGGESTED_THEMES: Record<string, string[]> = {
  "logistics-shipping": ["shipping routes", "freight rates", "port disruption", "sanctions", "container shortages", "Suez Canal", "Hormuz Strait"],
  "food-agriculture": ["crop yields", "fertiliser prices", "food inflation", "export bans", "drought", "supply chain", "commodity markets"],
  "manufacturing": ["raw materials", "factory output", "automation", "trade policy", "supply chain", "labour costs", "reshoring"],
  "energy-utilities": ["oil prices", "gas supply", "renewables", "grid stability", "OPEC", "nuclear", "energy transition"],
  "mining-resources": ["mineral prices", "lithium", "rare earths", "mining regulation", "environmental compliance", "export controls"],
  "finance-investment": ["interest rates", "inflation", "bond markets", "currency movements", "central bank policy", "emerging markets", "sovereign debt"],
  "technology-software": ["AI regulation", "semiconductors", "data privacy", "cybersecurity", "cloud infrastructure", "tech policy", "chip supply"],
  "pharma-healthcare": ["drug approvals", "clinical trials", "pandemic preparedness", "healthcare policy", "supply chain", "pricing regulation"],
  "construction-infra": ["building materials", "infrastructure spending", "housing policy", "cement prices", "steel supply", "urban development"],
  "retail-consumer": ["consumer spending", "retail sales", "e-commerce", "supply chain", "inflation impact", "consumer confidence"],
  "media-comms": ["media regulation", "disinformation", "press freedom", "platform policy", "advertising markets", "narrative risk"],
  "government-public": ["policy change", "elections", "diplomatic relations", "defence spending", "public finance", "governance reform"],
  "consulting-advisory": ["market trends", "regulatory changes", "geopolitical risk", "economic outlook", "industry disruption"],
  "legal-compliance": ["sanctions", "regulatory enforcement", "compliance frameworks", "trade law", "data protection", "anti-corruption"],
  "education-research": ["education policy", "research funding", "academic freedom", "student mobility", "AI in education"],
  "other": ["geopolitical risk", "trade policy", "economic trends", "supply chain", "regulatory changes"],
};

// ---------------------------------------------------------------------------
// Briefing depth options
// ---------------------------------------------------------------------------

export const BRIEFING_DEPTHS = [
  { id: "executive_summary", label: "Executive Summary", description: "Key headlines only, under 200 words" },
  { id: "standard", label: "Standard", description: "Full briefing with context, ~500 words" },
  { id: "detailed", label: "Detailed", description: "In-depth analysis with regional framing, ~800 words" },
] as const;

// ---------------------------------------------------------------------------
// Delivery time options (common business hours)
// ---------------------------------------------------------------------------

export const DELIVERY_TIMES = [
  "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00",
] as const;

// ---------------------------------------------------------------------------
// Regions (reuse from preferences but extend for company context)
// ---------------------------------------------------------------------------

export const COMPANY_REGIONS = [
  { id: "south-asia", label: "South Asia" },
  { id: "east-se-asia", label: "East & SE Asia" },
  { id: "central-asia", label: "Central Asia" },
  { id: "middle-east", label: "Middle East" },
  { id: "africa", label: "Africa" },
  { id: "eastern-europe", label: "Eastern Europe" },
  { id: "western-europe", label: "Western Europe" },
  { id: "north-america", label: "North America" },
  { id: "latin-americas", label: "Latin America" },
  { id: "caribbean", label: "Caribbean" },
  { id: "pacific-islands", label: "Pacific Islands" },
] as const;

export type CompanyRegionId = (typeof COMPANY_REGIONS)[number]["id"];
