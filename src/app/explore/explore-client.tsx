"use client";

import { useState, useMemo } from "react";
import { PremiumGate } from "@/app/components/premium-gate";
import { hasFramingWatch, hasBlindspot } from "@/lib/scan-types";
import type { ExploreItem } from "./page";

interface Props {
  items: ExploreItem[];
  availableDates: string[];
  categoryMeta: Record<string, { label: string; color: string }>;
  regionLabels: Record<string, string>;
}

export function ExploreClient({ items, availableDates, categoryMeta, regionLabels }: Props) {
  return (
    <PremiumGate>
      <ExploreContent
        items={items}
        availableDates={availableDates}
        categoryMeta={categoryMeta}
        regionLabels={regionLabels}
      />
    </PremiumGate>
  );
}

// All available regions for filtering
const ALL_REGIONS = [
  "western-world",
  "east-se-asia",
  "south-asia",
  "middle-east",
  "africa",
  "eastern-europe",
  "latin-americas",
] as const;

const REGION_FILTER_LABELS: Record<string, string> = {
  "western-world": "Western",
  "east-se-asia": "East Asia", 
  "south-asia": "South Asia",
  "middle-east": "Middle East",
  "africa": "Africa",
  "eastern-europe": "Eastern Europe",
  "latin-americas": "Latin America",
};

const colorDot: Record<string, string> = {
  blue: "bg-blue-500",
  violet: "bg-violet-500", 
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  lime: "bg-lime-500",
  fuchsia: "bg-fuchsia-500",
  orange: "bg-orange-500",
  sky: "bg-sky-500",
  teal: "bg-teal-500",
  zinc: "bg-zinc-500",
};

const sigColors: Record<string, string> = {
  high: "bg-amber-500",
  medium: "bg-blue-400 dark:bg-blue-500",
  low: "bg-zinc-300 dark:bg-zinc-600",
};

const sigLabels: Record<string, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

function ExploreContent({ items, availableDates, categoryMeta, regionLabels }: Props) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  // Get all available categories from the metadata
  const categories = Object.keys(categoryMeta);
  const tabs = ["all", ...categories];

  // Filter items based on current selections
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by category/tab
    if (activeTab !== "all") {
      filtered = filtered.filter(item => item.category === activeTab);
    }

    // Filter by region
    if (selectedRegion !== "all") {
      filtered = filtered.filter(item => item.regions.includes(selectedRegion));
    }

    // Filter by date range
    if (dateRange) {
      filtered = filtered.filter(item => 
        item.date >= dateRange.start && item.date <= dateRange.end
      );
    }

    return filtered;
  }, [items, activeTab, selectedRegion, dateRange]);

  // Get stats for the current filter
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const highCount = filteredItems.filter(item => item.significance === "high").length;
    const framingCount = filteredItems.filter(item => hasFramingWatch(item)).length;
    const blindspotCount = filteredItems.filter(item => hasBlindspot(item)).length;
    
    return { total, highCount, framingCount, blindspotCount };
  }, [filteredItems]);

  if (items.length === 0) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="px-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
            No archive data
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            Archive data will appear here as scans are completed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Header */}
      <section className="border-b border-zinc-200 py-16 dark:border-zinc-800/50 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Archive
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-light leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
            Explore Intelligence
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            Browse {items.length.toLocaleString()} stories across {availableDates.length} scan{availableDates.length !== 1 ? "s" : ""}. 
            Organize by topic, region, and time period.
          </p>
          
          {/* Current filter stats */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {stats.total.toLocaleString()} item{stats.total !== 1 ? "s" : ""}
            </span>
            {stats.highCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {stats.highCount} high significance
              </span>
            )}
            {stats.framingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {stats.framingCount} framing
              </span>
            )}
            {stats.blindspotCount > 0 && (
              <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                {stats.blindspotCount} blindspot
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-zinc-200 py-8 dark:border-zinc-800/50">
        <div className="mx-auto max-w-6xl px-6">
          {/* Topic Tabs */}
          <div className="overflow-x-auto">
            <div className="flex gap-1 pb-4">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === "all" ? "All Topics" : (categoryMeta[tab]?.label || tab);
                const count = tab === "all" 
                  ? items.length 
                  : items.filter(item => item.category === tab).length;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    }`}
                  >
                    {label}
                    <span className="ml-2 text-xs opacity-60">
                      {count.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Region Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Region:
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:border-zinc-400"
              >
                <option value="all">All Regions</option>
                {ALL_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {REGION_FILTER_LABELS[region]}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Display */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Dates:
              </label>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {dateRange 
                  ? `${dateRange.start} to ${dateRange.end}` 
                  : `All dates (${availableDates.length} scans)`
                }
              </span>
              {dateRange && (
                <button
                  onClick={() => setDateRange(null)}
                  className="ml-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Items Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          {filteredItems.length === 0 ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200">
                  No items found
                </h3>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item, index) => (
                <ExploreItemCard
                  key={`${item.date}-${index}`}
                  item={item}
                  categoryMeta={categoryMeta}
                  regionLabels={regionLabels}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ExploreItemCard({
  item,
  categoryMeta,
  regionLabels,
}: {
  item: ExploreItem;
  categoryMeta: Record<string, { label: string; color: string }>;
  regionLabels: Record<string, string>;
}) {
  const meta = categoryMeta[item.category] || { label: item.category, color: "zinc" };
  const isFraming = hasFramingWatch(item);
  const isBlindspot = hasBlindspot(item);

  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
      <div className="space-y-4">
        {/* Header: Date and Significance */}
        <div className="flex items-center justify-between">
          <time className="text-xs text-zinc-400 dark:text-zinc-500">
            {item.displayDate}
          </time>
          <div className="flex items-center gap-2">
            {isBlindspot && (
              <div className="flex items-center gap-1 rounded bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Blindspot
              </div>
            )}
            <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              item.significance === "high" 
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" 
                : item.significance === "medium"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                : "bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sigColors[item.significance]}`} />
              {sigLabels[item.significance]}
            </div>
          </div>
        </div>

        {/* Headline */}
        <h3 className="font-[family-name:var(--font-source-serif)] text-lg leading-snug text-zinc-800 dark:text-zinc-100">
          {item.headline}
        </h3>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-2">
          {/* Category */}
          <span className="inline-flex items-center gap-1.5 rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <span className={`h-2 w-2 rounded-full ${colorDot[meta.color] || "bg-zinc-500"}`} />
            {meta.label}
          </span>

          {/* Regions */}
          {item.regions.slice(0, 2).map((region) => (
            <span
              key={region}
              className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {regionLabels[region] || region}
            </span>
          ))}
          
          {item.regions.length > 2 && (
            <span className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              +{item.regions.length - 2} more
            </span>
          )}

          {/* Pattern Tags */}
          {item.patterns.map((pattern) => (
            <span
              key={pattern}
              className="rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-400"
            >
              {pattern}
            </span>
          ))}

          {/* Framing Indicator */}
          {isFraming && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Framing
            </span>
          )}
        </div>

        {/* Connection/Context */}
        {item.connection && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {item.connection}
          </p>
        )}
      </div>
    </div>
  );
}