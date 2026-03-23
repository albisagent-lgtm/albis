"use client";

import { useState, useCallback } from "react";
import { Share2, ChevronDown, Eye, EyeOff, Globe, ArrowLeft } from "lucide-react";

// ── Region definitions ────────────────────────────────────────────────

type RegionId =
  | "north-america"
  | "europe"
  | "middle-east"
  | "south-asia"
  | "east-asia"
  | "africa"
  | "latin-america";

interface Region {
  id: RegionId;
  name: string;
  shortName: string;
  color: string;
}

const REGIONS: Region[] = [
  { id: "north-america", name: "North America", shortName: "NA", color: "#4a90d9" },
  { id: "europe", name: "Europe", shortName: "EU", color: "#5b7bb5" },
  { id: "middle-east", name: "Middle East", shortName: "ME", color: "#d4915e" },
  { id: "south-asia", name: "South Asia", shortName: "SA", color: "#7bc4a8" },
  { id: "east-asia", name: "East Asia", shortName: "EA", color: "#c77dba" },
  { id: "africa", name: "Africa", shortName: "AF", color: "#e8b84d" },
  { id: "latin-america", name: "Latin America", shortName: "LA", color: "#66b5a3" },
];

const REGION_MAP = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<RegionId, Region>;

// ── Blind-spot data (3 weeks of hardcoded examples) ───────────────────

interface BlindSpot {
  id: string;
  headline: string;
  summary: string;
  whyItMatters: string;
  category: string;
  coveredBy: RegionId[];
  missedBy: RegionId[];
  intensity: number; // 1-5 scale of how significant the omission is
}

interface WeekData {
  weekLabel: string;
  weekStart: string;
  blindSpots: BlindSpot[];
}

const WEEKS: WeekData[] = [
  {
    weekLabel: "Mar 10 – 16, 2026",
    weekStart: "2026-03-10",
    blindSpots: [
      {
        id: "w1-1",
        headline: "India's new Digital Personal Data Act triggers mass surveillance concerns",
        summary:
          "India's enforcement of its 2023 data protection law grants sweeping government access to citizens' data with minimal judicial oversight. Civil liberties groups across South Asia are mobilising.",
        whyItMatters:
          "Affects 1.4 billion people's digital rights. Sets a precedent for democracies normalising mass data access under 'national security' framing.",
        category: "Tech & Rights",
        coveredBy: ["south-asia", "europe", "east-asia"],
        missedBy: ["north-america", "latin-america", "africa", "middle-east"],
        intensity: 5,
      },
      {
        id: "w1-2",
        headline: "Sahel water crisis displaces 2.3 million — no Western coverage",
        summary:
          "A cascading drought across Mali, Niger, and Burkina Faso has triggered one of the fastest displacement events of 2026. UN agencies are calling it a 'silent emergency'.",
        whyItMatters:
          "Climate-driven displacement at this scale reshapes migration patterns globally. Western media's silence reflects a systemic blind spot around slow-onset African crises.",
        category: "Climate & Migration",
        coveredBy: ["africa", "middle-east", "europe"],
        missedBy: ["north-america", "east-asia", "south-asia", "latin-america"],
        intensity: 5,
      },
      {
        id: "w1-3",
        headline: "Brazil's Congress quietly passes bill allowing mining in Indigenous territories",
        summary:
          "In a late-night session, Brazil's lower house approved a controversial bill opening protected Indigenous lands to commercial mining operations, reversing decades of environmental protections.",
        whyItMatters:
          "Directly threatens the Amazon rainforest — Earth's largest carbon sink. Indigenous groups call it 'legislative genocide'.",
        category: "Environment & Rights",
        coveredBy: ["latin-america", "europe"],
        missedBy: ["north-america", "east-asia", "south-asia", "africa", "middle-east"],
        intensity: 4,
      },
      {
        id: "w1-4",
        headline: "South Korea's AI hiring tools found to systematically discriminate by gender",
        summary:
          "A government audit revealed that AI-powered recruitment platforms used by 70% of major Korean corporations show statistically significant bias against female applicants in STEM roles.",
        whyItMatters:
          "As AI hiring goes global, proven discrimination in a tech-forward economy should trigger worldwide regulatory attention.",
        category: "Tech & Rights",
        coveredBy: ["east-asia", "europe"],
        missedBy: ["north-america", "south-asia", "africa", "latin-america", "middle-east"],
        intensity: 3,
      },
      {
        id: "w1-5",
        headline: "Egyptian journalists detained under renewed media crackdown",
        summary:
          "At least 14 journalists have been detained across Egypt in a coordinated crackdown following critical coverage of economic conditions. Press freedom groups say it's the worst wave since 2019.",
        whyItMatters:
          "Press freedom is a leading indicator of democratic erosion. Egypt's media crackdown during economic crisis is a pattern seen worldwide but rarely covered outside the region.",
        category: "Press Freedom",
        coveredBy: ["middle-east", "africa", "europe"],
        missedBy: ["north-america", "east-asia", "south-asia", "latin-america"],
        intensity: 4,
      },
    ],
  },
  {
    weekLabel: "Mar 3 – 9, 2026",
    weekStart: "2026-03-03",
    blindSpots: [
      {
        id: "w2-1",
        headline: "Bangladesh garment workers strike over wage theft — 400 factories affected",
        summary:
          "Over 800,000 garment workers across Bangladesh walked off factory floors after systematic wage theft was documented across major Western brand suppliers.",
        whyItMatters:
          "These factories supply clothing to every major Western retailer. Consumer economies depend on this labour, yet strikes affecting supply chains get minimal attention.",
        category: "Labour & Trade",
        coveredBy: ["south-asia", "europe"],
        missedBy: ["north-america", "east-asia", "africa", "latin-america", "middle-east"],
        intensity: 5,
      },
      {
        id: "w2-2",
        headline: "Peru's lithium rush triggering water wars in Andean communities",
        summary:
          "Communities across Peru's highland regions report severe water contamination from new lithium extraction operations. The mineral is critical for EV batteries worldwide.",
        whyItMatters:
          "The clean energy transition has a hidden human cost. Lithium extraction communities bear the burden while consuming nations celebrate 'green' policies.",
        category: "Environment & Trade",
        coveredBy: ["latin-america", "south-asia"],
        missedBy: ["north-america", "europe", "east-asia", "africa", "middle-east"],
        intensity: 4,
      },
      {
        id: "w2-3",
        headline: "China's rural education gap widens as AI tutoring boom skips villages",
        summary:
          "While urban Chinese students gain access to sophisticated AI tutoring platforms, rural areas face a growing digital divide. Over 60 million children lack access to basic online learning.",
        whyItMatters:
          "The AI education divide mirrors and amplifies existing inequality. As AI reshapes learning globally, those left behind face compounding disadvantage.",
        category: "Tech & Inequality",
        coveredBy: ["east-asia", "south-asia"],
        missedBy: ["north-america", "europe", "africa", "latin-america", "middle-east"],
        intensity: 3,
      },
      {
        id: "w2-4",
        headline: "US veterans' healthcare data breach exposes 9 million records",
        summary:
          "A major cybersecurity incident at the Department of Veterans Affairs exposed personal health records of 9 million veterans. The breach went unreported for 6 weeks.",
        whyItMatters:
          "One of the largest healthcare data breaches in US history received minimal international coverage, despite implications for global cybersecurity standards.",
        category: "Cybersecurity",
        coveredBy: ["north-america"],
        missedBy: ["europe", "east-asia", "south-asia", "africa", "latin-america", "middle-east"],
        intensity: 4,
      },
      {
        id: "w2-5",
        headline: "Nigeria's new AI regulation framework becomes Africa's first",
        summary:
          "Nigeria passed comprehensive AI governance legislation, establishing Africa's first regulatory framework for artificial intelligence deployment in public services.",
        whyItMatters:
          "Africa's approach to AI regulation could shape governance for a billion people. Yet the Global North's AI discourse rarely includes African voices.",
        category: "Tech & Governance",
        coveredBy: ["africa", "europe"],
        missedBy: ["north-america", "east-asia", "south-asia", "latin-america", "middle-east"],
        intensity: 3,
      },
    ],
  },
  {
    weekLabel: "Feb 24 – Mar 2, 2026",
    weekStart: "2026-02-24",
    blindSpots: [
      {
        id: "w3-1",
        headline: "Indonesia bans nickel ore exports — global EV supply chain scrambles",
        summary:
          "Indonesia, controlling 50% of global nickel reserves, imposed an immediate export ban on raw nickel ore, forcing EV manufacturers worldwide to scramble for alternatives.",
        whyItMatters:
          "Resource nationalism from the Global South is reshaping supply chains. This story affects every EV buyer worldwide but was barely covered outside Asia.",
        category: "Trade & Resources",
        coveredBy: ["east-asia", "south-asia", "europe"],
        missedBy: ["north-america", "africa", "latin-america", "middle-east"],
        intensity: 5,
      },
      {
        id: "w3-2",
        headline: "Mexico's cartel violence in Sinaloa reaches record levels — 340 dead in February",
        summary:
          "Ongoing factional warfare within the Sinaloa Cartel has killed over 340 people in February alone. Entire towns have been abandoned as civilians flee.",
        whyItMatters:
          "The deadliest month of cartel violence in a decade received minimal coverage outside Latin America, reflecting normalisation of mass violence in the region.",
        category: "Conflict & Security",
        coveredBy: ["latin-america", "north-america"],
        missedBy: ["europe", "east-asia", "south-asia", "africa", "middle-east"],
        intensity: 5,
      },
      {
        id: "w3-3",
        headline: "UAE and Saudi Arabia launch joint space programme rivalling ESA",
        summary:
          "The Gulf states announced a joint $18 billion space programme aimed at Mars exploration, satellite manufacturing, and space tourism — the largest non-Western space investment in history.",
        whyItMatters:
          "The geopolitics of space exploration is shifting. Western media's framing of space remains US/EU-centric, missing a major rebalancing of technological power.",
        category: "Science & Geopolitics",
        coveredBy: ["middle-east", "east-asia"],
        missedBy: ["north-america", "europe", "south-asia", "africa", "latin-america"],
        intensity: 3,
      },
      {
        id: "w3-4",
        headline: "DRC cobalt miners' strike enters second month — tech companies silent",
        summary:
          "Artisanal cobalt miners in the DRC have been on strike for over a month demanding safety standards and fair wages. Major tech companies sourcing cobalt remain publicly silent.",
        whyItMatters:
          "Every smartphone and laptop contains DRC cobalt. The silence of companies whose supply chains depend on this labour is itself a story.",
        category: "Labour & Trade",
        coveredBy: ["africa", "europe"],
        missedBy: ["north-america", "east-asia", "south-asia", "latin-america", "middle-east"],
        intensity: 5,
      },
      {
        id: "w3-5",
        headline: "Antibiotic-resistant TB strain spreads across Central Asia",
        summary:
          "A new strain of extensively drug-resistant tuberculosis has been documented across Kazakhstan, Uzbekistan, and Tajikistan, with WHO warning of pandemic potential if containment fails.",
        whyItMatters:
          "Antimicrobial resistance is the next global health crisis. A potential pandemic emerging in Central Asia received almost zero Western press attention.",
        category: "Global Health",
        coveredBy: ["south-asia", "east-asia"],
        missedBy: ["north-america", "europe", "africa", "latin-america", "middle-east"],
        intensity: 4,
      },
    ],
  },
];

// ── Compute heat-map intensity per region ─────────────────────────────

function computeHeatMap(week: WeekData): Record<RegionId, number> {
  const counts: Record<RegionId, number> = {
    "north-america": 0,
    europe: 0,
    "middle-east": 0,
    "south-asia": 0,
    "east-asia": 0,
    africa: 0,
    "latin-america": 0,
  };
  for (const spot of week.blindSpots) {
    for (const r of spot.missedBy) {
      counts[r] += spot.intensity;
    }
  }
  const max = Math.max(...Object.values(counts), 1);
  const normalized: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    normalized[k] = v / max;
  }
  return normalized as Record<RegionId, number>;
}

// ── SVG World Map ─────────────────────────────────────────────────────

function WorldMap({
  heatMap,
  selectedRegion,
  onSelectRegion,
  hoveredRegion,
  onHoverRegion,
}: {
  heatMap: Record<RegionId, number>;
  selectedRegion: RegionId | null;
  onSelectRegion: (r: RegionId) => void;
  hoveredRegion: RegionId | null;
  onHoverRegion: (r: RegionId | null) => void;
}) {
  // Simplified but recognisable SVG paths for each region
  const regionPaths: Record<RegionId, { d: string; labelX: number; labelY: number }> = {
    "north-america": {
      d: "M50,50 L55,35 L80,25 L120,25 L150,30 L170,50 L175,75 L165,100 L150,115 L130,120 L105,118 L85,115 L65,100 L50,80 Z",
      labelX: 110,
      labelY: 72,
    },
    "latin-america": {
      d: "M105,120 L130,122 L145,135 L155,160 L150,190 L140,220 L125,250 L115,265 L105,260 L95,240 L85,210 L80,180 L85,150 L95,130 Z",
      labelX: 118,
      labelY: 190,
    },
    europe: {
      d: "M230,30 L260,25 L290,28 L310,35 L315,55 L310,75 L295,90 L270,95 L250,92 L235,80 L225,60 L225,45 Z",
      labelX: 270,
      labelY: 60,
    },
    africa: {
      d: "M235,100 L270,97 L300,100 L315,115 L320,145 L315,180 L300,210 L280,230 L260,235 L240,225 L225,200 L220,170 L222,140 L228,115 Z",
      labelX: 270,
      labelY: 165,
    },
    "middle-east": {
      d: "M310,60 L340,55 L365,60 L375,75 L375,100 L365,115 L345,120 L325,115 L315,100 L312,80 Z",
      labelX: 343,
      labelY: 88,
    },
    "south-asia": {
      d: "M370,80 L400,75 L425,85 L435,105 L430,130 L415,145 L395,148 L375,140 L365,120 L365,100 Z",
      labelX: 400,
      labelY: 112,
    },
    "east-asia": {
      d: "M420,30 L450,25 L480,28 L500,40 L505,65 L500,90 L485,105 L460,110 L440,105 L425,90 L418,65 L418,45 Z",
      labelX: 460,
      labelY: 65,
    },
  };

  function getRegionFill(regionId: RegionId): string {
    const intensity = heatMap[regionId] ?? 0;
    if (selectedRegion === regionId) return "rgba(200, 146, 42, 0.6)";
    if (hoveredRegion === regionId) return "rgba(200, 146, 42, 0.35)";
    // Heat map: more blind spots = more red
    const r = Math.round(180 + intensity * 75);
    const g = Math.round(180 - intensity * 120);
    const b = Math.round(180 - intensity * 120);
    return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.5})`;
  }

  function getStrokeColor(regionId: RegionId): string {
    if (selectedRegion === regionId) return "#c8922a";
    if (hoveredRegion === regionId) return "#c8922a";
    return "currentColor";
  }

  return (
    <svg
      viewBox="0 0 540 280"
      className="w-full h-auto"
      role="img"
      aria-label="World map showing news blind spot intensity by region"
    >
      {/* Grid dots for texture */}
      <defs>
        <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.5" className="fill-black/10 dark:fill-white/10" />
        </pattern>
      </defs>
      <rect width="540" height="280" fill="url(#grid-dots)" rx="8" />

      {/* Ocean hint */}
      <rect
        width="540"
        height="280"
        rx="8"
        className="fill-black/[0.02] dark:fill-white/[0.02]"
      />

      {/* Region shapes */}
      {REGIONS.map((region) => {
        const path = regionPaths[region.id];
        const blindSpotCount = WEEKS[0].blindSpots.filter((s) =>
          s.missedBy.includes(region.id)
        ).length;

        return (
          <g
            key={region.id}
            onClick={() => onSelectRegion(region.id)}
            onMouseEnter={() => onHoverRegion(region.id)}
            onMouseLeave={() => onHoverRegion(null)}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`${region.name}: ${blindSpotCount} blind spots this week`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectRegion(region.id);
              }
            }}
          >
            <path
              d={path.d}
              fill={getRegionFill(region.id)}
              stroke={getStrokeColor(region.id)}
              strokeWidth={selectedRegion === region.id ? 2 : 1}
              strokeOpacity={0.3}
              className="transition-all duration-300"
            />
            {/* Region label */}
            <text
              x={path.labelX}
              y={path.labelY - 6}
              textAnchor="middle"
              className="fill-[#0f0f0f] dark:fill-[#f0efec] text-[8px] font-medium pointer-events-none select-none"
              style={{ fontSize: "8px" }}
            >
              {region.shortName}
            </text>
            {/* Blind spot count badge */}
            {blindSpotCount > 0 && (
              <>
                <circle
                  cx={path.labelX}
                  cy={path.labelY + 8}
                  r="8"
                  className="fill-red-500/80 dark:fill-red-400/80"
                />
                <text
                  x={path.labelX}
                  y={path.labelY + 11.5}
                  textAnchor="middle"
                  className="fill-white text-[7px] font-bold pointer-events-none select-none"
                  style={{ fontSize: "7px" }}
                >
                  {blindSpotCount}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(10, 255)">
        <text
          className="fill-[#0f0f0f]/50 dark:fill-[#f0efec]/50 text-[7px]"
          style={{ fontSize: "7px" }}
        >
          Blind spot intensity:
        </text>
        <rect x="100" y="-7" width="12" height="8" rx="1" fill="rgba(180,180,180,0.3)" />
        <text
          x="115"
          className="fill-[#0f0f0f]/40 dark:fill-[#f0efec]/40 text-[6px]"
          style={{ fontSize: "6px" }}
        >
          Low
        </text>
        <rect x="135" y="-7" width="12" height="8" rx="1" fill="rgba(255,60,60,0.7)" />
        <text
          x="150"
          className="fill-[#0f0f0f]/40 dark:fill-[#f0efec]/40 text-[6px]"
          style={{ fontSize: "6px" }}
        >
          High
        </text>
      </g>
    </svg>
  );
}

// ── Blind Spot Card ───────────────────────────────────────────────────

function BlindSpotCard({ spot }: { spot: BlindSpot }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="rounded-xl border border-black/[0.07] bg-white/60 p-5 dark:border-white/[0.06] dark:bg-white/[0.03] transition-all duration-300 hover:border-[#c8922a]/30"
    >
      {/* Category tag */}
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-[#c8922a]/10 px-2.5 py-0.5 text-xs font-medium text-[#c8922a]">
          {spot.category}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Intensity {spot.intensity}/5
        </span>
      </div>

      {/* Headline */}
      <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug mb-3">
        {spot.headline}
      </h3>

      {/* Summary */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
        {spot.summary}
      </p>

      {/* Coverage pills */}
      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">Covered by</span>
          {spot.coveredBy.map((r) => (
            <span
              key={r}
              className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
            >
              {REGION_MAP[r].name}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <EyeOff className="h-3.5 w-3.5 text-red-500 dark:text-red-400 shrink-0" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">Missed by</span>
          {spot.missedBy.map((r) => (
            <span
              key={r}
              className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400"
            >
              {REGION_MAP[r].name}
            </span>
          ))}
        </div>
      </div>

      {/* Visual coverage bar */}
      <div className="mb-3">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="bg-emerald-500/70 transition-all duration-500"
            style={{
              width: `${(spot.coveredBy.length / REGIONS.length) * 100}%`,
            }}
          />
          <div
            className="bg-red-400/70 transition-all duration-500"
            style={{
              width: `${(spot.missedBy.length / REGIONS.length) * 100}%`,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
          <span>
            {spot.coveredBy.length}/{REGIONS.length} regions covered
          </span>
          <span>
            {spot.missedBy.length}/{REGIONS.length} missed
          </span>
        </div>
      </div>

      {/* Why it matters — expandable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 text-xs font-medium text-[#c8922a] hover:text-[#b07e1f]"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
        Why it matters
      </button>
      {expanded && (
        <p className="mt-2 rounded-lg bg-[#c8922a]/5 p-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed animate-fade-in">
          {spot.whyItMatters}
        </p>
      )}
    </article>
  );
}

// ── Share functionality ───────────────────────────────────────────────

function ShareButton({ region, weekLabel }: { region: Region | null; weekLabel: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const text = region
      ? `See what stories ${region.name}'s media missed this week on Albis Blind Spot Map`
      : `Discover global news blind spots — stories your media isn't covering — on Albis`;

    const url = typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      try {
        await navigator.share({ title: "Albis Blind Spot Map", text, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [region]);

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-full border border-black/[0.07] px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.06] dark:text-zinc-400 dark:hover:border-[#c8922a]/40 dark:hover:text-[#c8922a] transition-colors"
    >
      <Share2 className="h-3.5 w-3.5" />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export function BlindSpotsClient() {
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);

  const currentWeek = WEEKS[selectedWeek];
  const heatMap = computeHeatMap(currentWeek);

  const filteredSpots = selectedRegion
    ? currentWeek.blindSpots.filter((s) => s.missedBy.includes(selectedRegion))
    : currentWeek.blindSpots;

  const selectedRegionData = selectedRegion ? REGION_MAP[selectedRegion] : null;

  return (
    <main className="min-h-screen bg-[#faf9f6] dark:bg-[#0f0f0f]">
      {/* ── Hero section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle background texture */}
        <div className="bg-subtle-grid absolute inset-0 pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-6 pt-12 pb-4 md:pt-16 md:pb-6">
          {/* Header text */}
          <div className="mb-8 max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#c8922a]" />
              <span className="text-xs font-medium uppercase tracking-widest text-[#c8922a]">
                Blind Spot Map
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              What your media{" "}
              <span className="text-gradient-amber italic">isn&apos;t</span> telling you
            </h1>
            <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed md:text-lg">
              Every region has stories it doesn&apos;t cover. Click a region to see what&apos;s
              invisible in your news diet — and why it matters.
            </p>
          </div>

          {/* Week selector + share */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {WEEKS.map((w, i) => (
                <button
                  key={w.weekStart}
                  onClick={() => {
                    setSelectedWeek(i);
                    setSelectedRegion(null);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedWeek === i
                      ? "bg-[#0f0f0f] text-white dark:bg-[#f0efec] dark:text-[#0f0f0f]"
                      : "bg-black/[0.04] text-zinc-600 hover:bg-black/[0.08] dark:bg-white/[0.05] dark:text-zinc-400 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  {w.weekLabel}
                </button>
              ))}
            </div>
            <ShareButton region={selectedRegionData} weekLabel={currentWeek.weekLabel} />
          </div>

          {/* ── The Map (hero element) ──────────────────────────── */}
          <div className="relative rounded-2xl border border-black/[0.07] bg-white/50 p-4 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] md:p-6">
            <WorldMap
              heatMap={heatMap}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              hoveredRegion={hoveredRegion}
              onHoverRegion={setHoveredRegion}
            />

            {/* Hover tooltip */}
            {hoveredRegion && !selectedRegion && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#0f0f0f]/90 px-4 py-2 text-xs text-white shadow-lg dark:bg-[#f0efec]/90 dark:text-[#0f0f0f] pointer-events-none animate-fade-in">
                Click to see stories{" "}
                <span className="font-semibold">{REGION_MAP[hoveredRegion].name}</span> missed
              </div>
            )}
          </div>

          {/* Region quick-select (mobile-friendly) */}
          <div className="mt-4 flex flex-wrap gap-2 md:hidden">
            {REGIONS.map((r) => {
              const count = currentWeek.blindSpots.filter((s) =>
                s.missedBy.includes(r.id)
              ).length;
              return (
                <button
                  key={r.id}
                  onClick={() =>
                    setSelectedRegion(selectedRegion === r.id ? null : r.id)
                  }
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedRegion === r.id
                      ? "bg-[#c8922a] text-white"
                      : "bg-black/[0.04] text-zinc-600 dark:bg-white/[0.05] dark:text-zinc-400"
                  }`}
                >
                  {r.shortName}
                  {count > 0 && (
                    <span className="rounded-full bg-red-500/20 px-1.5 text-[10px] text-red-600 dark:text-red-400">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stories section ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-8 md:py-12">
        {/* Section header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            {selectedRegion ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-[#c8922a] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  All regions
                </button>
                <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold md:text-2xl">
                  Stories{" "}
                  <span className="text-[#c8922a]">
                    {selectedRegionData?.name}
                  </span>{" "}
                  missed
                </h2>
              </div>
            ) : (
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold md:text-2xl">
                All blind spots this week
              </h2>
            )}
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {filteredSpots.length} stor{filteredSpots.length === 1 ? "y" : "ies"} ·{" "}
              {currentWeek.weekLabel}
            </p>
          </div>
        </div>

        {/* Cards grid */}
        {filteredSpots.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpots.map((spot, i) => (
              <div
                key={spot.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <BlindSpotCard spot={spot} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-black/[0.1] p-12 text-center dark:border-white/[0.08]">
            <EyeOff className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No blind spots found for this selection. Try a different region or week.
            </p>
          </div>
        )}

        {/* Bottom context */}
        <div className="mt-12 rounded-xl border border-black/[0.07] bg-[#c8922a]/[0.04] p-6 dark:border-white/[0.06]">
          <h3 className="font-[family-name:var(--font-playfair)] text-base font-semibold mb-2">
            How blind spots are detected
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Albis scans thousands of sources across 7 world regions three times daily. When a
            significant story appears in some regions but not others, it surfaces here as a blind
            spot. Intensity reflects the story&apos;s global significance relative to how many
            regions missed it. Data is powered by the{" "}
            <span className="font-medium text-[#c8922a]">Global Attention Index (GAI)</span>.
          </p>
        </div>
      </section>
    </main>
  );
}
