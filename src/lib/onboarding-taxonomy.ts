// ---------------------------------------------------------------------------
// Onboarding taxonomy — the single source of truth for the company
// onboarding wizard and profile editor. Every option maps to one or more
// scan tags so the relevance engine (see src/lib/relevance-engine.ts) can
// score stories against user selections.
//
// Structure:
//   SECTORS              — 24 industry choices + "Other"
//   COMPANY_REGIONS      — 11 geographic regions
//   THEME_CATALOG        — all selectable themes, each mapping to scan tags
//   WATCHLIST_CATALOG    — countries, orgs, companies, people
//   SUPPLY_CHAIN_CATALOG — commodities, routes, inputs
//   SECTOR_BUNDLES       — per sector: which options are Recommended (bundle)
//                          vs Additional
//   LEGACY_SECTOR_MAP    — maps old 16-sector IDs → new 24-sector IDs for
//                          existing users
//
// Derived from SECTOR-TAXONOMY.md — see that doc for rationale, coverage
// heatmap, and open decisions.
// ---------------------------------------------------------------------------

// ============================================================
// SECTORS
// ============================================================

export interface SectorDefinition {
  id: string;
  label: string;
  color: string;
  defaultRisks: string[]; // 5 risk-priority IDs
  concernPlaceholder?: string; // only for "other"
}

export const SECTORS: SectorDefinition[] = [
  // Transport & logistics
  {
    id: "logistics-shipping",
    label: "Logistics / Shipping / Freight",
    color: "blue",
    defaultRisks: [
      "supply-chain-disruption",
      "geopolitical-conflict",
      "trade-tariff-sanctions",
      "energy-price",
      "commodity-price-volatility",
    ],
  },
  {
    id: "aviation-transport",
    label: "Aviation / Air Transport",
    color: "sky",
    defaultRisks: [
      "supply-chain-disruption",
      "energy-price",
      "regulatory-policy",
      "geopolitical-conflict",
      "labour-workforce",
    ],
  },

  // Primary industries
  {
    id: "food-agriculture",
    label: "Food / Agriculture / FMCG",
    color: "lime",
    defaultRisks: [
      "food-water-security",
      "climate-environmental",
      "commodity-price-volatility",
      "supply-chain-disruption",
      "geopolitical-conflict",
    ],
  },
  {
    id: "manufacturing",
    label: "Manufacturing / Industrial",
    color: "zinc",
    defaultRisks: [
      "supply-chain-disruption",
      "trade-tariff-sanctions",
      "commodity-price-volatility",
      "regulatory-policy",
      "labour-workforce",
    ],
  },
  {
    id: "energy-utilities",
    label: "Energy / Utilities",
    color: "amber",
    defaultRisks: [
      "energy-price",
      "commodity-price-volatility",
      "geopolitical-conflict",
      "climate-environmental",
      "regulatory-policy",
    ],
  },
  {
    id: "mining-resources",
    label: "Mining / Resources / Commodities",
    color: "orange",
    defaultRisks: [
      "commodity-price-volatility",
      "supply-chain-disruption",
      "regulatory-policy",
      "climate-environmental",
      "geopolitical-conflict",
    ],
  },

  // Financial services
  {
    id: "banking-financial",
    label: "Banking / Financial Services",
    color: "emerald",
    defaultRisks: [
      "currency-financial",
      "regulatory-policy",
      "geopolitical-conflict",
      "reputation-narrative",
      "cyber-technology",
    ],
  },
  {
    id: "investment-asset-management",
    label: "Investment / Asset Management",
    color: "emerald",
    defaultRisks: [
      "currency-financial",
      "geopolitical-conflict",
      "commodity-price-volatility",
      "regulatory-policy",
      "reputation-narrative",
    ],
  },
  {
    id: "insurance-reinsurance",
    label: "Insurance / Reinsurance",
    color: "teal",
    defaultRisks: [
      "climate-environmental",
      "reputation-narrative",
      "regulatory-policy",
      "cyber-technology",
      "currency-financial",
    ],
  },

  // Tech & communications
  {
    id: "technology-software",
    label: "Technology / Software",
    color: "violet",
    defaultRisks: [
      "cyber-technology",
      "regulatory-policy",
      "trade-tariff-sanctions",
      "reputation-narrative",
      "geopolitical-conflict",
    ],
  },
  {
    id: "telecommunications",
    label: "Telecommunications",
    color: "sky",
    defaultRisks: [
      "cyber-technology",
      "regulatory-policy",
      "geopolitical-conflict",
      "trade-tariff-sanctions",
      "labour-workforce",
    ],
  },

  // Health & life sciences
  {
    id: "pharma-biotech",
    label: "Pharmaceuticals / Biotech",
    color: "rose",
    defaultRisks: [
      "regulatory-policy",
      "supply-chain-disruption",
      "reputation-narrative",
      "cyber-technology",
      "labour-workforce",
    ],
  },
  {
    id: "healthcare-medical",
    label: "Healthcare / Medical Services",
    color: "rose",
    defaultRisks: [
      "regulatory-policy",
      "labour-workforce",
      "cyber-technology",
      "reputation-narrative",
      "climate-environmental",
    ],
  },

  // Built environment
  {
    id: "construction-infra",
    label: "Construction / Infrastructure",
    color: "cyan",
    defaultRisks: [
      "commodity-price-volatility",
      "regulatory-policy",
      "climate-environmental",
      "labour-workforce",
      "supply-chain-disruption",
    ],
  },
  {
    id: "real-estate",
    label: "Real Estate / Property",
    color: "cyan",
    defaultRisks: [
      "currency-financial",
      "regulatory-policy",
      "climate-environmental",
      "commodity-price-volatility",
      "reputation-narrative",
    ],
  },

  // Consumer
  {
    id: "retail-consumer",
    label: "Retail / Consumer Goods",
    color: "fuchsia",
    defaultRisks: [
      "commodity-price-volatility",
      "supply-chain-disruption",
      "currency-financial",
      "cyber-technology",
      "reputation-narrative",
    ],
  },
  {
    id: "hospitality-tourism",
    label: "Hospitality / Tourism / Leisure",
    color: "fuchsia",
    defaultRisks: [
      "geopolitical-conflict",
      "climate-environmental",
      "reputation-narrative",
      "currency-financial",
      "cyber-technology",
    ],
  },

  // Media & public sector
  {
    id: "media-publishing",
    label: "Media / Publishing / Advertising",
    color: "sky",
    defaultRisks: [
      "reputation-narrative",
      "cyber-technology",
      "regulatory-policy",
      "geopolitical-conflict",
      "labour-workforce",
    ],
  },
  {
    id: "government-public",
    label: "Government / Public Sector",
    color: "teal",
    defaultRisks: [
      "geopolitical-conflict",
      "regulatory-policy",
      "trade-tariff-sanctions",
      "cyber-technology",
      "reputation-narrative",
    ],
  },
  {
    id: "defence-aerospace",
    label: "Defence / Aerospace / Security",
    color: "zinc",
    defaultRisks: [
      "geopolitical-conflict",
      "trade-tariff-sanctions",
      "cyber-technology",
      "supply-chain-disruption",
      "regulatory-policy",
    ],
  },

  // Professional services
  {
    id: "consulting-advisory",
    label: "Consulting / Advisory",
    color: "blue",
    defaultRisks: [
      "geopolitical-conflict",
      "trade-tariff-sanctions",
      "regulatory-policy",
      "commodity-price-volatility",
      "cyber-technology",
    ],
  },
  {
    id: "legal-compliance",
    label: "Legal / Compliance",
    color: "zinc",
    defaultRisks: [
      "regulatory-policy",
      "trade-tariff-sanctions",
      "cyber-technology",
      "reputation-narrative",
      "geopolitical-conflict",
    ],
  },

  // Mission-driven
  {
    id: "education-research",
    label: "Education / Research / Academia",
    color: "violet",
    defaultRisks: [
      "regulatory-policy",
      "geopolitical-conflict",
      "cyber-technology",
      "labour-workforce",
      "reputation-narrative",
    ],
  },
  {
    id: "ngo-humanitarian",
    label: "NGO / Humanitarian / Development",
    color: "lime",
    defaultRisks: [
      "food-water-security",
      "climate-environmental",
      "geopolitical-conflict",
      "reputation-narrative",
      "regulatory-policy",
    ],
  },

  // Catch-all
  {
    id: "other",
    label: "Other",
    color: "zinc",
    defaultRisks: [
      "supply-chain-disruption",
      "commodity-price-volatility",
      "geopolitical-conflict",
      "regulatory-policy",
      "cyber-technology",
    ],
    concernPlaceholder:
      "e.g. supply chain disruption, Iran conflict exposure, fertiliser prices",
  },
];

export type SectorId = (typeof SECTORS)[number]["id"];

// Legacy mapping — existing users with old sector IDs see the new label but
// their data is unchanged. See DECISIONS-LOG 2026-04-16 for details.
export const LEGACY_SECTOR_MAP: Record<string, string> = {
  "finance-investment": "investment-asset-management",
  "pharma-healthcare": "healthcare-medical",
  "media-comms": "media-publishing",
};

export function resolveSectorId(sectorId: string | null): string | null {
  if (!sectorId) return null;
  return LEGACY_SECTOR_MAP[sectorId] || sectorId;
}

// ============================================================
// COMPANY REGIONS (moved from company-profile.ts)
// ============================================================

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

// ============================================================
// TAXONOMY OPTIONS (catalog items)
// ============================================================

export interface TaxonomyOption {
  value: string; // canonical lowercase — the string stored in DB
  label: string; // display label
  scanTags: string[]; // tags this option matches in scan data
  category?: string; // grouping in the combobox (e.g. "Commodities")
  gap?: boolean; // true if no scan tags currently match (⚠ in docs)
}

// ------------------------------------------------------------
// THEMES — ~90 unique options covering all sectors
// ------------------------------------------------------------
export const THEME_CATALOG: TaxonomyOption[] = [
  // Trade & geopolitics
  { value: "geopolitics", label: "Geopolitics", scanTags: ["geopolitics", "geopolitical-tension"], category: "Geopolitics" },
  { value: "diplomacy", label: "Diplomacy", scanTags: ["diplomacy"], category: "Geopolitics" },
  { value: "sanctions", label: "Sanctions", scanTags: ["sanctions"], category: "Geopolitics" },
  { value: "tariffs", label: "Tariffs", scanTags: ["tariffs"], category: "Geopolitics" },
  { value: "trade-war", label: "Trade war", scanTags: ["trade-war", "trade"], category: "Geopolitics" },
  { value: "export-controls", label: "Export controls", scanTags: ["export-controls"], category: "Geopolitics" },
  { value: "us-china", label: "US–China tensions", scanTags: ["us-china"], category: "Geopolitics" },
  { value: "nato", label: "NATO", scanTags: ["nato"], category: "Geopolitics" },
  { value: "peace-talks", label: "Peace talks", scanTags: ["peace-talks"], category: "Geopolitics" },
  { value: "political-instability", label: "Political instability", scanTags: ["political-instability"], category: "Geopolitics" },
  { value: "transatlantic-split", label: "Transatlantic split", scanTags: ["transatlantic-split"], category: "Geopolitics" },
  { value: "soft-power", label: "Soft power", scanTags: ["soft-power"], category: "Geopolitics" },

  // Conflict & defence
  { value: "conflict", label: "Conflict", scanTags: ["conflict", "war"], category: "Conflict" },
  { value: "iran-war", label: "Iran war", scanTags: ["iran-war"], category: "Conflict" },
  { value: "military", label: "Military operations", scanTags: ["military", "us-military"], category: "Conflict" },
  { value: "defense", label: "Defence", scanTags: ["defense"], category: "Conflict" },
  { value: "missiles", label: "Missiles", scanTags: ["missiles"], category: "Conflict" },
  { value: "military-buildup", label: "Military buildup", scanTags: ["military-buildup", "military-escalation"], category: "Conflict" },
  { value: "escalation", label: "Escalation", scanTags: ["escalation"], category: "Conflict" },
  { value: "border-defense", label: "Border defence", scanTags: ["border-defense"], category: "Conflict" },
  { value: "terrorism", label: "Terrorism", scanTags: ["terrorism"], category: "Conflict" },
  { value: "hybrid-warfare", label: "Hybrid warfare", scanTags: ["hybrid-warfare"], category: "Conflict" },
  { value: "sabotage", label: "Sabotage", scanTags: ["sabotage"], category: "Conflict" },
  { value: "intelligence", label: "Intelligence", scanTags: ["intelligence"], category: "Conflict" },
  { value: "nuclear", label: "Nuclear", scanTags: ["nuclear", "nuclear-energy"], category: "Conflict" },

  // Supply chain & shipping
  { value: "supply-chain", label: "Supply chain disruption", scanTags: ["supply-chain", "supply-chain-vulnerability", "supply chain"], category: "Supply chain" },
  { value: "shipping", label: "Shipping routes", scanTags: ["shipping"], category: "Supply chain" },
  { value: "hormuz", label: "Strait of Hormuz", scanTags: ["hormuz"], category: "Supply chain" },
  { value: "logistics", label: "Logistics operations", scanTags: ["logistics"], category: "Supply chain" },
  { value: "airlines", label: "Airlines / air freight", scanTags: ["airlines"], category: "Supply chain" },
  { value: "infrastructure", label: "Infrastructure", scanTags: ["infrastructure", "infrastructure-risk", "infrastructure-disruption", "infrastructure-fragility"], category: "Supply chain" },
  { value: "strikes", label: "Strikes / labour action", scanTags: ["strikes"], category: "Supply chain" },
  { value: "red-sea", label: "Red Sea routes", scanTags: [], category: "Supply chain", gap: true },
  { value: "suez-canal", label: "Suez Canal", scanTags: [], category: "Supply chain", gap: true },
  { value: "panama-canal", label: "Panama Canal", scanTags: [], category: "Supply chain", gap: true },
  { value: "freight-rates", label: "Freight rates", scanTags: [], category: "Supply chain", gap: true },

  // Energy
  { value: "energy", label: "Energy markets", scanTags: ["energy"], category: "Energy" },
  { value: "oil", label: "Oil", scanTags: ["oil", "oil-prices"], category: "Energy" },
  { value: "fuel", label: "Fuel supply", scanTags: ["fuel"], category: "Energy" },
  { value: "energy-transition", label: "Energy transition", scanTags: ["energy-transition", "renewable-transition"], category: "Energy" },
  { value: "renewable-energy", label: "Renewable energy", scanTags: ["renewable-energy", "renewable"], category: "Energy" },
  { value: "solar", label: "Solar", scanTags: ["solar"], category: "Energy" },
  { value: "wind", label: "Wind", scanTags: ["wind"], category: "Energy" },
  { value: "clean-energy", label: "Clean energy", scanTags: ["clean-energy"], category: "Energy" },
  { value: "energy-crisis", label: "Energy crisis", scanTags: ["energy-crisis", "energy-security"], category: "Energy" },
  { value: "energy-storage", label: "Energy storage / batteries", scanTags: ["energy-storage", "batteries", "battery"], category: "Energy" },
  { value: "electric-vehicles", label: "Electric vehicles", scanTags: ["electric-vehicles", "evs"], category: "Energy" },
  { value: "energy-leverage", label: "Energy as leverage", scanTags: ["energy-leverage"], category: "Energy" },

  // Climate & environment
  { value: "climate", label: "Climate change", scanTags: ["climate", "climate-change", "climate-impact", "climate-policy", "climate-variability"], category: "Climate" },
  { value: "extreme-weather", label: "Extreme weather", scanTags: ["extreme-weather", "weather"], category: "Climate" },
  { value: "flooding", label: "Flooding", scanTags: ["flooding", "floods", "extreme-rainfall"], category: "Climate" },
  { value: "drought", label: "Drought", scanTags: ["drought"], category: "Climate" },
  { value: "heatwave", label: "Heatwave", scanTags: ["heatwave", "temperature-records"], category: "Climate" },
  { value: "el-nino", label: "El Niño / La Niña", scanTags: ["el-nino", "la-nina"], category: "Climate" },
  { value: "natural-disaster", label: "Natural disaster", scanTags: ["natural-disaster", "disaster", "cyclone", "storms", "earthquake", "volcano"], category: "Climate" },
  { value: "biodiversity", label: "Biodiversity", scanTags: ["biodiversity", "ecosystem-collapse", "conservation"], category: "Climate" },
  { value: "water-crisis", label: "Water crisis", scanTags: ["water-crisis"], category: "Climate" },

  // Technology & AI
  { value: "ai", label: "AI", scanTags: ["ai"], category: "Technology" },
  { value: "ai-governance", label: "AI governance", scanTags: ["ai-governance", "ai-safety"], category: "Technology" },
  { value: "ai-geopolitics", label: "AI geopolitics", scanTags: ["ai-geopolitics", "ai-competition", "ai-race"], category: "Technology" },
  { value: "ai-infrastructure", label: "AI infrastructure", scanTags: ["ai-infrastructure"], category: "Technology" },
  { value: "cybersecurity", label: "Cybersecurity", scanTags: ["cybersecurity"], category: "Technology" },
  { value: "ransomware", label: "Ransomware", scanTags: ["ransomware"], category: "Technology" },
  { value: "data-breach", label: "Data breach", scanTags: ["data-breach", "data breach"], category: "Technology" },
  { value: "deepfake", label: "Deepfake", scanTags: ["deepfake", "deepfakes"], category: "Technology" },
  { value: "semiconductors", label: "Semiconductors", scanTags: ["semiconductors"], category: "Technology" },
  { value: "robotics", label: "Robotics", scanTags: ["robotics"], category: "Technology" },
  { value: "quantum-computing", label: "Quantum computing", scanTags: ["quantum-computing"], category: "Technology" },

  // Finance
  { value: "inflation", label: "Inflation", scanTags: ["inflation"], category: "Finance" },
  { value: "economy", label: "Economy", scanTags: ["economy", "economic-impact"], category: "Finance" },
  { value: "markets", label: "Markets", scanTags: ["markets", "stock-market", "stocks"], category: "Finance" },
  { value: "earnings", label: "Earnings", scanTags: ["earnings"], category: "Finance" },
  { value: "currency-volatility", label: "Currency volatility", scanTags: ["currency-volatility"], category: "Finance" },
  { value: "market-volatility", label: "Market volatility", scanTags: ["market-volatility"], category: "Finance" },
  { value: "capital-flows", label: "Capital flows", scanTags: ["capital-flows"], category: "Finance" },
  { value: "cryptocurrency", label: "Cryptocurrency", scanTags: ["cryptocurrency", "bitcoin"], category: "Finance" },
  { value: "venture-capital", label: "Venture capital", scanTags: ["venture-capital"], category: "Finance" },
  { value: "investment", label: "Investment trends", scanTags: ["investment"], category: "Finance" },
  { value: "fraud", label: "Fraud", scanTags: ["fraud"], category: "Finance" },
  { value: "corruption", label: "Corruption", scanTags: ["corruption"], category: "Finance" },

  // Health
  { value: "healthcare", label: "Healthcare", scanTags: ["healthcare"], category: "Health" },
  { value: "public-health", label: "Public health", scanTags: ["public-health", "public-health-crisis"], category: "Health" },
  { value: "outbreak", label: "Disease outbreak", scanTags: ["outbreak", "disease-outbreak"], category: "Health" },
  { value: "vaccine", label: "Vaccines", scanTags: ["vaccine", "vaccines", "vaccination", "vaccination-decline"], category: "Health" },
  { value: "medical-breakthrough", label: "Medical breakthrough", scanTags: ["medical-breakthrough", "medical-innovation", "breakthrough"], category: "Health" },
  { value: "antibiotic-resistance", label: "Antibiotic resistance", scanTags: ["antibiotic-resistance"], category: "Health" },
  { value: "regenerative-medicine", label: "Regenerative medicine", scanTags: ["regenerative-medicine", "tissue-engineering", "crispr"], category: "Health" },
  { value: "mental-health", label: "Mental health", scanTags: ["mental-health", "mental health", "depression", "anxiety"], category: "Health" },
  { value: "aging", label: "Aging", scanTags: ["aging"], category: "Health" },
  { value: "respiratory", label: "Respiratory", scanTags: ["respiratory"], category: "Health" },
  { value: "healthcare-access", label: "Healthcare access", scanTags: ["healthcare-access"], category: "Health" },

  // Food & agriculture
  { value: "food-security", label: "Food security", scanTags: ["food-security"], category: "Food & Ag" },
  { value: "famine", label: "Famine", scanTags: ["famine", "hunger"], category: "Food & Ag" },
  { value: "fertilizer", label: "Fertilizer", scanTags: ["fertilizer"], category: "Food & Ag" },
  { value: "agriculture", label: "Agriculture", scanTags: ["agriculture"], category: "Food & Ag" },

  // Governance & society
  { value: "regulation", label: "Regulation", scanTags: ["regulation", "policy"], category: "Governance" },
  { value: "governance", label: "Governance", scanTags: ["governance"], category: "Governance" },
  { value: "election", label: "Elections", scanTags: ["election", "midterms"], category: "Governance" },
  { value: "democracy", label: "Democracy", scanTags: ["democracy"], category: "Governance" },
  { value: "immigration", label: "Immigration", scanTags: ["immigration", "migration", "refugees", "displacement"], category: "Governance" },
  { value: "humanitarian", label: "Humanitarian crisis", scanTags: ["humanitarian", "humanitarian-crisis"], category: "Governance" },
  { value: "global-south", label: "Global South", scanTags: ["global-south"], category: "Governance" },
  { value: "inequality", label: "Inequality", scanTags: ["inequality"], category: "Governance" },
  { value: "protests", label: "Protests", scanTags: ["protests", "protest", "protest-movement"], category: "Governance" },

  // Media & narrative
  { value: "disinformation", label: "Disinformation", scanTags: ["disinformation", "misinformation"], category: "Media" },
  { value: "censorship", label: "Censorship", scanTags: ["censorship"], category: "Media" },
  { value: "propaganda", label: "Propaganda", scanTags: ["propaganda"], category: "Media" },
  { value: "journalism", label: "Journalism", scanTags: ["journalism"], category: "Media" },
  { value: "ai-video", label: "AI-generated media", scanTags: ["ai-video"], category: "Media" },
  { value: "information-warfare", label: "Information warfare", scanTags: ["information-warfare"], category: "Media" },

  // Sector-specific (insurance, tourism, etc.)
  { value: "tourism", label: "Tourism demand", scanTags: ["tourism"], category: "Sector-specific" },
  { value: "space", label: "Space / SpaceX", scanTags: ["space", "spacex", "nasa", "jwst"], category: "Sector-specific" },
  { value: "education", label: "Education", scanTags: ["education"], category: "Sector-specific" },
  { value: "research", label: "Research & funding", scanTags: ["research", "funding"], category: "Sector-specific" },
  { value: "manufacturing", label: "Manufacturing trends", scanTags: ["manufacturing"], category: "Sector-specific" },
  { value: "demographics", label: "Demographics", scanTags: ["demographics"], category: "Sector-specific" },
  { value: "layoffs", label: "Layoffs / unemployment", scanTags: ["layoffs", "unemployment"], category: "Sector-specific" },
];

// ------------------------------------------------------------
// WATCHLIST — countries, orgs, companies, people
// ------------------------------------------------------------
export const WATCHLIST_CATALOG: TaxonomyOption[] = [
  // Countries (heavily covered in scan)
  { value: "iran", label: "Iran", scanTags: ["iran"], category: "Countries" },
  { value: "russia", label: "Russia", scanTags: ["russia"], category: "Countries" },
  { value: "china", label: "China", scanTags: ["china"], category: "Countries" },
  { value: "united-states", label: "United States", scanTags: ["us", "usa"], category: "Countries" },
  { value: "india", label: "India", scanTags: ["india"], category: "Countries" },
  { value: "european-union", label: "European Union", scanTags: ["eu", "europe"], category: "Countries" },
  { value: "united-kingdom", label: "United Kingdom", scanTags: ["uk"], category: "Countries" },
  { value: "ukraine", label: "Ukraine", scanTags: ["ukraine"], category: "Countries" },
  { value: "israel", label: "Israel", scanTags: ["israel"], category: "Countries" },
  { value: "saudi-arabia", label: "Saudi Arabia", scanTags: ["saudi-arabia"], category: "Countries" },
  { value: "uae", label: "UAE", scanTags: ["uae"], category: "Countries" },
  { value: "turkey", label: "Turkey", scanTags: ["turkey"], category: "Countries" },
  { value: "japan", label: "Japan", scanTags: ["japan"], category: "Countries" },
  { value: "south-korea", label: "South Korea", scanTags: ["south-korea"], category: "Countries" },
  { value: "brazil", label: "Brazil", scanTags: ["brazil"], category: "Countries" },
  { value: "mexico", label: "Mexico", scanTags: ["mexico"], category: "Countries" },
  { value: "pakistan", label: "Pakistan", scanTags: ["pakistan"], category: "Countries" },
  { value: "bangladesh", label: "Bangladesh", scanTags: ["bangladesh"], category: "Countries" },
  { value: "nigeria", label: "Nigeria", scanTags: ["nigeria"], category: "Countries" },
  { value: "australia", label: "Australia", scanTags: ["australia"], category: "Countries" },
  { value: "canada", label: "Canada", scanTags: ["canada"], category: "Countries" },
  { value: "germany", label: "Germany", scanTags: ["germany"], category: "Countries" },
  { value: "france", label: "France", scanTags: ["france"], category: "Countries" },
  { value: "venezuela", label: "Venezuela", scanTags: ["venezuela"], category: "Countries" },
  { value: "qatar", label: "Qatar", scanTags: ["qatar"], category: "Countries" },
  { value: "lebanon", label: "Lebanon", scanTags: ["lebanon"], category: "Countries" },
  { value: "sudan", label: "Sudan", scanTags: ["sudan"], category: "Countries" },
  { value: "afghanistan", label: "Afghanistan", scanTags: ["afghanistan"], category: "Countries" },
  { value: "philippines", label: "Philippines", scanTags: ["philippines"], category: "Countries" },
  { value: "new-zealand", label: "New Zealand", scanTags: ["new-zealand"], category: "Countries" },
  { value: "poland", label: "Poland", scanTags: ["poland"], category: "Countries" },
  { value: "hungary", label: "Hungary", scanTags: ["hungary"], category: "Countries" },
  { value: "niger", label: "Niger", scanTags: ["niger"], category: "Countries" },
  { value: "kenya", label: "Kenya", scanTags: ["kenya"], category: "Countries" },

  // Regions (from scan)
  { value: "sahel", label: "Sahel", scanTags: ["sahel"], category: "Regions" },
  { value: "gaza", label: "Gaza", scanTags: ["gaza"], category: "Regions" },

  // Organisations
  { value: "nato", label: "NATO", scanTags: ["nato"], category: "Organisations" },
  { value: "un", label: "United Nations", scanTags: ["un"], category: "Organisations" },
  { value: "g7", label: "G7", scanTags: ["g7"], category: "Organisations" },
  { value: "wfp", label: "World Food Programme", scanTags: ["wfp"], category: "Organisations" },
  { value: "who", label: "WHO", scanTags: ["who"], category: "Organisations" },
  { value: "opec", label: "OPEC", scanTags: ["oil"], category: "Organisations", gap: true },
  { value: "irgc", label: "IRGC", scanTags: ["irgc"], category: "Organisations" },
  { value: "hezbollah", label: "Hezbollah", scanTags: ["hezbollah"], category: "Organisations" },
  { value: "fed", label: "Federal Reserve", scanTags: [], category: "Organisations", gap: true },
  { value: "ecb", label: "ECB", scanTags: [], category: "Organisations", gap: true },
  { value: "fda", label: "FDA", scanTags: [], category: "Organisations", gap: true },
  { value: "sec", label: "SEC", scanTags: [], category: "Organisations", gap: true },

  // People
  { value: "trump", label: "Donald Trump", scanTags: ["trump"], category: "People" },
  { value: "musk", label: "Elon Musk", scanTags: ["musk"], category: "People" },

  // Companies
  { value: "nvidia", label: "NVIDIA", scanTags: ["nvidia"], category: "Companies" },
  { value: "amazon", label: "Amazon", scanTags: ["amazon"], category: "Companies" },
  { value: "spacex", label: "SpaceX", scanTags: ["spacex"], category: "Companies" },
  { value: "gemini", label: "Google Gemini", scanTags: ["gemini"], category: "Companies" },
  { value: "openai", label: "OpenAI", scanTags: [], category: "Companies", gap: true },
  { value: "anthropic", label: "Anthropic", scanTags: [], category: "Companies", gap: true },
  { value: "tsmc", label: "TSMC", scanTags: [], category: "Companies", gap: true },
  { value: "maersk", label: "Maersk", scanTags: [], category: "Companies", gap: true },
  { value: "aramco", label: "Saudi Aramco", scanTags: [], category: "Companies", gap: true },
  { value: "pfizer", label: "Pfizer", scanTags: [], category: "Companies", gap: true },
  { value: "moderna", label: "Moderna", scanTags: [], category: "Companies", gap: true },
  { value: "boeing", label: "Boeing", scanTags: [], category: "Companies", gap: true },
  { value: "airbus", label: "Airbus", scanTags: [], category: "Companies", gap: true },
  { value: "lockheed", label: "Lockheed Martin", scanTags: [], category: "Companies", gap: true },
];

// ------------------------------------------------------------
// SUPPLY CHAIN — commodities, routes, inputs
// ------------------------------------------------------------
export const SUPPLY_CHAIN_CATALOG: TaxonomyOption[] = [
  // Commodities (existing in scan)
  { value: "oil", label: "Oil", scanTags: ["oil", "oil-prices"], category: "Commodities" },
  { value: "fuel", label: "Fuel", scanTags: ["fuel"], category: "Commodities" },
  { value: "fertilizer", label: "Fertilizer", scanTags: ["fertilizer"], category: "Commodities" },
  { value: "semiconductors", label: "Semiconductors", scanTags: ["semiconductors"], category: "Commodities" },

  // Commodities (gap — scan prompt expansion would unlock)
  { value: "wheat", label: "Wheat", scanTags: [], category: "Commodities", gap: true },
  { value: "corn", label: "Corn", scanTags: [], category: "Commodities", gap: true },
  { value: "rice", label: "Rice", scanTags: [], category: "Commodities", gap: true },
  { value: "soy", label: "Soy", scanTags: [], category: "Commodities", gap: true },
  { value: "coffee", label: "Coffee", scanTags: [], category: "Commodities", gap: true },
  { value: "cocoa", label: "Cocoa", scanTags: [], category: "Commodities", gap: true },
  { value: "palm-oil", label: "Palm oil", scanTags: [], category: "Commodities", gap: true },
  { value: "sugar", label: "Sugar", scanTags: [], category: "Commodities", gap: true },
  { value: "steel", label: "Steel", scanTags: [], category: "Commodities", gap: true },
  { value: "aluminium", label: "Aluminium", scanTags: [], category: "Commodities", gap: true },
  { value: "copper", label: "Copper", scanTags: [], category: "Commodities", gap: true },
  { value: "nickel", label: "Nickel", scanTags: [], category: "Commodities", gap: true },
  { value: "lithium", label: "Lithium", scanTags: [], category: "Commodities", gap: true },
  { value: "cobalt", label: "Cobalt", scanTags: [], category: "Commodities", gap: true },
  { value: "rare-earths", label: "Rare earths", scanTags: [], category: "Commodities", gap: true },
  { value: "uranium", label: "Uranium", scanTags: [], category: "Commodities", gap: true },
  { value: "gold", label: "Gold", scanTags: [], category: "Commodities", gap: true },
  { value: "lng", label: "LNG", scanTags: [], category: "Commodities", gap: true },
  { value: "titanium", label: "Titanium", scanTags: [], category: "Commodities", gap: true },

  // Routes (mostly gap)
  { value: "hormuz-route", label: "Strait of Hormuz", scanTags: ["hormuz"], category: "Routes" },
  { value: "red-sea-route", label: "Red Sea", scanTags: [], category: "Routes", gap: true },
  { value: "suez-route", label: "Suez Canal", scanTags: [], category: "Routes", gap: true },
  { value: "panama-route", label: "Panama Canal", scanTags: [], category: "Routes", gap: true },
  { value: "malacca-route", label: "Strait of Malacca", scanTags: [], category: "Routes", gap: true },
  { value: "pipelines", label: "Pipelines", scanTags: [], category: "Routes", gap: true },
  { value: "undersea-cables", label: "Undersea cables", scanTags: [], category: "Routes", gap: true },
  { value: "black-sea-route", label: "Black Sea", scanTags: [], category: "Routes", gap: true },

  // Inputs / dependencies
  { value: "supply-chain-dep", label: "Supply chain vulnerability", scanTags: ["supply-chain", "supply-chain-vulnerability"], category: "Dependencies" },
  { value: "energy-dep", label: "Energy supply", scanTags: ["energy", "energy-security"], category: "Dependencies" },
  { value: "climate-dep", label: "Climate exposure", scanTags: ["extreme-weather", "climate", "flooding", "drought"], category: "Dependencies" },
  { value: "cyber-dep", label: "Cybersecurity exposure", scanTags: ["cybersecurity"], category: "Dependencies" },
  { value: "labour-dep", label: "Labour availability", scanTags: ["strikes", "layoffs", "unemployment"], category: "Dependencies" },
  { value: "gpus", label: "GPUs", scanTags: [], category: "Dependencies", gap: true },
  { value: "apis-pharma", label: "Pharmaceutical APIs", scanTags: [], category: "Dependencies", gap: true },
  { value: "cold-chain", label: "Cold chain", scanTags: [], category: "Dependencies", gap: true },
  { value: "cement", label: "Cement", scanTags: [], category: "Dependencies", gap: true },
];

// ============================================================
// SECTOR BUNDLES — which catalog values are Recommended / Additional
// ============================================================

export interface SectorBundle {
  themes: { bundle: string[]; additional: string[] };
  watchlist: { bundle: string[]; additional: string[] };
  supplyChain: { bundle: string[]; additional: string[] };
}

export const SECTOR_BUNDLES: Record<string, SectorBundle> = {
  "logistics-shipping": {
    themes: {
      bundle: ["shipping", "supply-chain", "hormuz", "sanctions", "tariffs", "oil"],
      additional: ["geopolitics", "infrastructure", "strikes", "logistics", "airlines", "conflict", "sabotage", "trade-war", "export-controls", "red-sea", "suez-canal", "panama-canal", "freight-rates"],
    },
    watchlist: {
      bundle: ["iran", "russia", "china", "united-states"],
      additional: ["ukraine", "european-union", "united-kingdom", "turkey", "saudi-arabia", "uae", "mexico", "opec", "maersk"],
    },
    supplyChain: {
      bundle: ["oil", "fuel", "hormuz-route", "supply-chain-dep"],
      additional: ["fertilizer", "semiconductors", "red-sea-route", "suez-route", "panama-route", "malacca-route"],
    },
  },
  "aviation-transport": {
    themes: {
      bundle: ["airlines", "fuel", "geopolitics", "regulation", "sanctions", "supply-chain"],
      additional: ["extreme-weather", "cybersecurity", "tourism", "hormuz", "strikes", "conflict"],
    },
    watchlist: {
      bundle: ["iran", "russia", "united-states", "european-union", "china"],
      additional: ["saudi-arabia", "uae", "turkey", "india", "japan", "boeing", "airbus"],
    },
    supplyChain: {
      bundle: ["fuel", "oil", "semiconductors"],
      additional: ["supply-chain-dep", "titanium", "rare-earths"],
    },
  },
  "food-agriculture": {
    themes: {
      bundle: ["food-security", "climate", "extreme-weather", "drought", "flooding", "fertilizer"],
      additional: ["famine", "agriculture", "el-nino", "heatwave", "export-controls", "tariffs", "natural-disaster", "biodiversity", "water-crisis"],
    },
    watchlist: {
      bundle: ["india", "brazil", "china", "wfp", "russia"],
      additional: ["ukraine", "sahel", "nigeria", "sudan", "bangladesh", "pakistan"],
    },
    supplyChain: {
      bundle: ["fertilizer", "climate-dep"],
      additional: ["wheat", "corn", "rice", "soy", "coffee", "cocoa", "palm-oil", "sugar", "hormuz-route"],
    },
  },
  "manufacturing": {
    themes: {
      bundle: ["tariffs", "trade-war", "supply-chain", "export-controls", "us-china", "manufacturing"],
      additional: ["energy", "regulation", "robotics", "electric-vehicles", "ai", "semiconductors", "layoffs", "inflation"],
    },
    watchlist: {
      bundle: ["china", "united-states", "germany", "japan", "nvidia"],
      additional: ["mexico", "india", "south-korea", "european-union", "tsmc"],
    },
    supplyChain: {
      bundle: ["semiconductors", "supply-chain-dep", "energy-dep"],
      additional: ["steel", "aluminium", "copper", "nickel", "lithium", "rare-earths"],
    },
  },
  "energy-utilities": {
    themes: {
      bundle: ["oil", "energy-transition", "renewable-energy", "hormuz", "energy-crisis", "nuclear"],
      additional: ["solar", "wind", "clean-energy", "energy-storage", "electric-vehicles", "energy-leverage", "sanctions", "climate"],
    },
    watchlist: {
      bundle: ["saudi-arabia", "iran", "russia", "opec", "uae"],
      additional: ["qatar", "venezuela", "nigeria", "australia", "aramco"],
    },
    supplyChain: {
      bundle: ["oil", "fuel", "hormuz-route", "energy-dep"],
      additional: ["lng", "uranium", "lithium", "rare-earths", "pipelines"],
    },
  },
  "mining-resources": {
    themes: {
      bundle: ["export-controls", "supply-chain", "energy", "tariffs", "sanctions", "us-china"],
      additional: ["climate", "extreme-weather", "regulation", "infrastructure", "renewable-energy", "electric-vehicles"],
    },
    watchlist: {
      bundle: ["china", "australia", "united-states"],
      additional: ["russia", "brazil", "canada"],
    },
    supplyChain: {
      bundle: ["supply-chain-dep", "energy-dep"],
      additional: ["lithium", "copper", "nickel", "cobalt", "rare-earths", "uranium", "gold"],
    },
  },
  "banking-financial": {
    themes: {
      bundle: ["inflation", "economy", "markets", "currency-volatility", "market-volatility", "regulation"],
      additional: ["sanctions", "trade-war", "political-instability", "capital-flows", "cybersecurity", "ransomware", "data-breach", "cryptocurrency", "fraud", "earnings"],
    },
    watchlist: {
      bundle: ["united-states", "european-union", "china", "united-kingdom", "trump"],
      additional: ["japan", "india", "brazil", "fed", "ecb"],
    },
    supplyChain: {
      bundle: ["cyber-dep"],
      additional: [],
    },
  },
  "investment-asset-management": {
    themes: {
      bundle: ["markets", "earnings", "geopolitics", "inflation", "trade-war", "ai"],
      additional: ["venture-capital", "investment", "cryptocurrency", "currency-volatility", "market-volatility", "capital-flows", "nvidia", "energy", "ai-geopolitics"],
    },
    watchlist: {
      bundle: ["united-states", "china", "european-union", "nvidia", "trump"],
      additional: ["musk", "india", "japan", "united-kingdom", "brazil"],
    },
    supplyChain: {
      bundle: [],
      additional: ["semiconductors", "oil", "energy-dep"],
    },
  },
  "insurance-reinsurance": {
    themes: {
      bundle: ["extreme-weather", "climate", "flooding", "natural-disaster", "cybersecurity"],
      additional: ["drought", "heatwave", "ransomware", "data-breach", "regulation", "political-instability"],
    },
    watchlist: {
      bundle: ["united-states", "european-union", "united-kingdom"],
      additional: ["australia", "japan", "philippines", "bangladesh"],
    },
    supplyChain: {
      bundle: ["climate-dep", "cyber-dep"],
      additional: [],
    },
  },
  "technology-software": {
    themes: {
      bundle: ["ai", "ai-governance", "ai-geopolitics", "cybersecurity", "ransomware", "deepfake"],
      additional: ["ai-infrastructure", "semiconductors", "export-controls", "us-china", "quantum-computing", "robotics", "ai-video", "data-breach", "regulation"],
    },
    watchlist: {
      bundle: ["nvidia", "china", "united-states"],
      additional: ["european-union", "united-kingdom", "israel", "south-korea", "musk", "openai", "anthropic", "tsmc", "gemini"],
    },
    supplyChain: {
      bundle: ["semiconductors", "cyber-dep"],
      additional: ["gpus"],
    },
  },
  "telecommunications": {
    themes: {
      bundle: ["cybersecurity", "ransomware", "regulation", "infrastructure", "data-breach", "us-china"],
      additional: ["ai", "ai-infrastructure", "disinformation", "censorship", "semiconductors", "sabotage", "space"],
    },
    watchlist: {
      bundle: ["china", "united-states", "european-union"],
      additional: ["india", "united-kingdom", "russia", "south-korea", "spacex"],
    },
    supplyChain: {
      bundle: ["semiconductors"],
      additional: ["undersea-cables"],
    },
  },
  "pharma-biotech": {
    themes: {
      bundle: ["regulation", "medical-breakthrough", "vaccine", "antibiotic-resistance", "supply-chain"],
      additional: ["regenerative-medicine", "public-health", "outbreak", "research", "respiratory", "mental-health"],
    },
    watchlist: {
      bundle: ["united-states", "european-union", "who", "india", "china"],
      additional: ["united-kingdom", "japan", "pfizer", "moderna", "fda"],
    },
    supplyChain: {
      bundle: ["supply-chain-dep"],
      additional: ["apis-pharma", "cold-chain"],
    },
  },
  "healthcare-medical": {
    themes: {
      bundle: ["healthcare", "public-health", "outbreak", "regulation", "healthcare-access"],
      additional: ["aging", "mental-health", "vaccine", "medical-breakthrough", "cybersecurity", "data-breach", "respiratory"],
    },
    watchlist: {
      bundle: ["who", "united-states", "united-kingdom", "european-union"],
      additional: ["india", "china", "nigeria", "fda"],
    },
    supplyChain: {
      bundle: ["supply-chain-dep"],
      additional: ["cold-chain"],
    },
  },
  "construction-infra": {
    themes: {
      bundle: ["infrastructure", "extreme-weather", "flooding", "energy", "supply-chain", "regulation"],
      additional: ["climate", "manufacturing", "inflation", "investment", "tariffs", "natural-disaster", "strikes"],
    },
    watchlist: {
      bundle: ["united-states", "china", "european-union", "saudi-arabia"],
      additional: ["uae", "india", "bangladesh"],
    },
    supplyChain: {
      bundle: ["energy-dep", "supply-chain-dep"],
      additional: ["steel", "cement", "copper", "aluminium", "labour-dep"],
    },
  },
  "real-estate": {
    themes: {
      bundle: ["inflation", "regulation", "climate", "extreme-weather", "economy", "investment"],
      additional: ["flooding", "natural-disaster", "demographics", "immigration", "capital-flows", "markets"],
    },
    watchlist: {
      bundle: ["united-states", "united-kingdom", "china", "european-union"],
      additional: ["india", "australia", "canada"],
    },
    supplyChain: {
      bundle: ["energy-dep"],
      additional: ["cement", "steel", "labour-dep"],
    },
  },
  "retail-consumer": {
    themes: {
      bundle: ["economy", "inflation", "tariffs", "trade-war", "supply-chain", "cybersecurity"],
      additional: ["ai", "regulation", "markets", "earnings", "deepfake", "disinformation"],
    },
    watchlist: {
      bundle: ["united-states", "china", "european-union", "amazon"],
      additional: ["india", "united-kingdom", "japan", "brazil"],
    },
    supplyChain: {
      bundle: ["supply-chain-dep", "energy-dep"],
      additional: ["hormuz-route", "palm-oil", "cocoa"],
    },
  },
  "hospitality-tourism": {
    themes: {
      bundle: ["tourism", "extreme-weather", "conflict", "airlines", "fuel", "economy"],
      additional: ["climate", "heatwave", "natural-disaster", "terrorism", "outbreak", "data-breach", "immigration"],
    },
    watchlist: {
      bundle: ["iran", "israel", "european-union", "united-states", "united-kingdom"],
      additional: ["saudi-arabia", "uae", "turkey", "japan", "mexico"],
    },
    supplyChain: {
      bundle: ["fuel"],
      additional: ["climate-dep"],
    },
  },
  "media-publishing": {
    themes: {
      bundle: ["disinformation", "deepfake", "censorship", "ai-video", "ai", "journalism"],
      additional: ["propaganda", "information-warfare", "cybersecurity", "data-breach", "regulation", "election"],
    },
    watchlist: {
      bundle: ["united-states", "european-union", "china", "trump"],
      additional: ["united-kingdom", "russia", "india", "musk"],
    },
    supplyChain: {
      bundle: [],
      additional: ["cyber-dep"],
    },
  },
  "government-public": {
    themes: {
      bundle: ["diplomacy", "geopolitics", "regulation", "military", "defense", "conflict"],
      additional: ["sanctions", "nato", "peace-talks", "immigration", "election", "humanitarian", "disinformation", "hybrid-warfare", "cybersecurity", "escalation", "transatlantic-split"],
    },
    watchlist: {
      bundle: ["nato", "european-union", "g7", "china", "russia"],
      additional: ["united-states", "iran", "un", "ukraine", "israel", "trump"],
    },
    supplyChain: {
      bundle: [],
      additional: [],
    },
  },
  "defence-aerospace": {
    themes: {
      bundle: ["military", "defense", "military-buildup", "missiles", "nato", "conflict"],
      additional: ["iran-war", "cybersecurity", "hybrid-warfare", "sabotage", "ai-governance", "space", "intelligence", "semiconductors", "nuclear", "border-defense"],
    },
    watchlist: {
      bundle: ["nato", "russia", "china", "iran", "irgc"],
      additional: ["united-states", "ukraine", "israel", "pakistan", "hezbollah", "lockheed", "boeing"],
    },
    supplyChain: {
      bundle: ["semiconductors", "supply-chain-dep"],
      additional: ["rare-earths", "titanium"],
    },
  },
  "consulting-advisory": {
    themes: {
      bundle: ["geopolitics", "regulation", "economy", "ai", "supply-chain", "tariffs"],
      additional: ["climate", "energy-transition", "sanctions", "cybersecurity", "markets", "healthcare", "inflation"],
    },
    watchlist: {
      bundle: ["united-states", "china", "european-union", "trump"],
      additional: ["russia", "iran", "india", "japan", "g7"],
    },
    supplyChain: {
      bundle: ["supply-chain-dep", "energy-dep"],
      additional: [],
    },
  },
  "legal-compliance": {
    themes: {
      bundle: ["sanctions", "regulation", "export-controls", "tariffs", "trade-war", "ai-governance"],
      additional: ["cybersecurity", "data-breach", "ransomware", "political-instability", "fraud", "corruption"],
    },
    watchlist: {
      bundle: ["united-states", "european-union", "united-kingdom", "china", "trump"],
      additional: ["russia", "iran", "sec", "fda"],
    },
    supplyChain: {
      bundle: [],
      additional: [],
    },
  },
  "education-research": {
    themes: {
      bundle: ["education", "research", "ai", "ai-governance", "regulation"],
      additional: ["immigration", "censorship", "medical-breakthrough", "innovation", "us-china"],
    },
    watchlist: {
      bundle: ["united-states", "china", "european-union", "united-kingdom"],
      additional: ["india", "japan", "australia", "trump"],
    },
    supplyChain: {
      bundle: ["cyber-dep"],
      additional: [],
    },
  },
  "ngo-humanitarian": {
    themes: {
      bundle: ["humanitarian", "food-security", "famine", "immigration"],
      additional: ["climate", "extreme-weather", "drought", "flooding", "public-health", "outbreak", "conflict", "global-south", "inequality", "healthcare-access"],
    },
    watchlist: {
      bundle: ["wfp", "who", "sahel", "sudan", "gaza"],
      additional: ["afghanistan", "lebanon", "nigeria", "niger", "un"],
    },
    supplyChain: {
      bundle: [],
      additional: [],
    },
  },
  "other": {
    themes: {
      bundle: [],
      additional: [
        // All non-sector-specific themes a generic user might want
        "geopolitics", "supply-chain", "regulation", "economy", "trade-war", "ai",
        "climate", "cybersecurity", "sanctions", "energy", "inflation", "conflict",
      ],
    },
    watchlist: {
      bundle: [],
      additional: ["united-states", "china", "russia", "iran", "european-union", "india", "trump"],
    },
    supplyChain: {
      bundle: [],
      additional: ["supply-chain-dep", "energy-dep", "cyber-dep"],
    },
  },
};

// ============================================================
// Lookup helpers
// ============================================================

export function findThemeOption(value: string): TaxonomyOption | undefined {
  return THEME_CATALOG.find((o) => o.value === value);
}

export function findWatchlistOption(value: string): TaxonomyOption | undefined {
  return WATCHLIST_CATALOG.find((o) => o.value === value);
}

export function findSupplyChainOption(value: string): TaxonomyOption | undefined {
  return SUPPLY_CHAIN_CATALOG.find((o) => o.value === value);
}

export function getBundleFor(sectorId: string | null): SectorBundle {
  const resolved = resolveSectorId(sectorId);
  return SECTOR_BUNDLES[resolved || ""] || SECTOR_BUNDLES["other"];
}

export function getSectorDefinition(sectorId: string | null): SectorDefinition | undefined {
  const resolved = resolveSectorId(sectorId);
  return SECTORS.find((s) => s.id === resolved);
}
