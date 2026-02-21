"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PremiumGate } from "@/app/components/premium-gate";
import { PerspectiveScore } from "@/app/components/perspective-score";
import { ShareIcon } from "@/app/components/share-buttons";
import { SearchBar } from "@/app/components/search-bar";
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

const ITEMS_PER_PAGE = 24;

const EMPTY_MESSAGES: Record<string, string> = {
  all: "No stories match your current filters. Try adjusting your date range or region.",
  politics: "No political stories in this period. Try expanding your date range.",
  security: "No security & defence stories found. Try a different date range.",
  economy: "No economic stories in this scan period. Try expanding your date range.",
  technology: "No technology stories found. Try widening your filters.",
  health: "No health stories in this scan period. Try expanding your date range.",
  environment: "No environment & climate stories found. Try a broader date range.",
  society: "No society & culture stories in this period. Try adjusting your filters.",
  science: "No science stories found. Try expanding your date range.",
  energy: "No energy stories in this scan period. Try a different date range.",
  diplomacy: "No diplomacy stories found. Try widening your date range.",
  trade: "No trade & economics stories in this period. Try adjusting filters.",
  migration: "No migration stories found. Try expanding your date range.",
};

function ExploreContent({ items, availableDates, categoryMeta, regionLabels }: Props) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [blindspotsOnly, setBlindspotsOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Get all available categories from the metadata
  const categories = Object.keys(categoryMeta);
  const tabs = ["all", ...categories];

  // Compute date range from dateFilter
  const dateRange = useMemo(() => {
    if (dateFilter === "all" || availableDates.length === 0) return null;

    const sorted = [...availableDates].sort((a, b) => b.localeCompare(a));
    const latest = sorted[0];

    if (dateFilter === "today") {
      return { start: latest, end: latest };
    }
    if (dateFilter === "7days") {
      const d = new Date(latest);
      d.setDate(d.getDate() - 7);
      const start = d.toISOString().slice(0, 10);
      return { start, end: latest };
    }
    if (dateFilter === "30days") {
      const d = new Date(latest);
      d.setDate(d.getDate() - 30);
      const start = d.toISOString().slice(0, 10);
      return { start, end: latest };
    }
    // Individual date selected
    return { start: dateFilter, end: dateFilter };
  }, [dateFilter, availableDates]);

  // Filter items based on current selections
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (activeTab !== "all") {
      filtered = filtered.filter(item => item.category === activeTab);
    }

    if (selectedRegion !== "all") {
      filtered = filtered.filter(item => item.regions.includes(selectedRegion));
    }

    if (dateRange) {
      filtered = filtered.filter(item =>
        item.date >= dateRange.start && item.date <= dateRange.end
      );
    }

    if (blindspotsOnly) {
      filtered = filtered.filter(item => hasBlindspot(item));
    }

    return filtered;
  }, [items, activeTab, selectedRegion, dateRange, blindspotsOnly]);

  // Reset visible count when filters change
  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  // Get stats for the current filter
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const highCount = filteredItems.filter(item => item.significance === "high").length;
    const framingCount = filteredItems.filter(item => hasFramingWatch(item)).length;
    const blindspotCount = filteredItems.filter(item => hasBlindspot(item)).length;

    return { total, highCount, framingCount, blindspotCount };
  }, [filteredItems]);

  // Reset pagination when filters change
  useMemo(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedRegion, dateFilter, blindspotsOnly]);

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
    <main className="overflow-hidden">
      {/* Header */}
      <section className="relative bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-950/15 dark:via-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#c8922a]/70 font-[family-name:var(--font-playfair)] italic">
            Archive
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight tracking-tight text-[#0f0f0f] md:text-5xl dark:text-[#f0efec]">
            Explore Intelligence
          </h1>
          <p className="mt-4 mx-auto max-w-lg text-lg text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
            Browse {items.length.toLocaleString()} stories across {availableDates.length} scan{availableDates.length !== 1 ? "s" : ""}.
            Organize by topic, region, and time period.
          </p>

          {/* Current filter stats */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {stats.framingCount} framing
              </span>
            )}
            {stats.blindspotCount > 0 && (
              <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Gold divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />

      {/* Sticky Tabs + Filters */}
      <section className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm py-4 dark:border-zinc-800/50 dark:bg-[#0f0f0f]/95">
        <div className="mx-auto max-w-6xl px-6">
          {/* Search */}
          <div className="pb-4">
            <SearchBar autoFocus={typeof window !== "undefined" && new URLSearchParams(window.location.search).has("search")} />
          </div>
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
          <div className="flex flex-wrap gap-4 items-center">
            {/* Blindspots Toggle */}
            <button
              onClick={() => setBlindspotsOnly(prev => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                blindspotsOnly
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              Blindspots Only
              {stats.blindspotCount > 0 && (
                <span className="rounded-full bg-amber-200/60 px-1.5 text-xs dark:bg-amber-900/40">
                  {stats.blindspotCount}
                </span>
              )}
            </button>

            {/* Region Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Region:
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:border-zinc-400"
              >
                <option value="all">All Regions</option>
                {ALL_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {REGION_FILTER_LABELS[region]}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Date:
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:border-zinc-400"
              >
                <option value="all">All dates ({availableDates.length} scans)</option>
                <option value="today">Latest scan</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <optgroup label="Individual dates">
                  {[...availableDates].sort((a, b) => b.localeCompare(a)).map((date) => (
                    <option key={date} value={date}>
                      {new Date(date + "T12:00:00").toLocaleDateString("en-NZ", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </option>
                  ))}
                </optgroup>
              </select>
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
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200">
                  No stories found
                </h3>
                <p className="mt-2 max-w-sm mx-auto text-sm text-zinc-500 dark:text-zinc-400">
                  {EMPTY_MESSAGES[activeTab] || "No stories match your current filters. Try adjusting your date range or region."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleItems.map((item, index) => (
                  <ExploreItemCard
                    key={`${item.date}-${index}`}
                    item={item}
                    categoryMeta={categoryMeta}
                    regionLabels={regionLabels}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                    className="group inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-all hover:border-zinc-400 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                  >
                    Load more
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {filteredItems.length - visibleCount} remaining
                    </span>
                  </button>
                </div>
              )}

              {/* Shown count */}
              <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Showing {visibleItems.length} of {filteredItems.length.toLocaleString()}
              </p>
            </>
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
    <div className="group rounded-xl border border-black/[0.07] bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:border-zinc-700">
      <div className="space-y-4">
        {/* Header: Date, Share, and Significance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <time className="text-xs text-zinc-400 dark:text-zinc-500">
              {item.displayDate}
            </time>
            <ShareIcon headline={item.headline} />
          </div>
          <div className="flex items-center gap-2">
            {isBlindspot && (
              <div className="flex items-center gap-1 rounded bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
          <span className="inline-flex items-center gap-1.5 rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <span className={`h-2 w-2 rounded-full ${colorDot[meta.color] || "bg-zinc-500"}`} />
            {meta.label}
          </span>

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

          {item.patterns.map((pattern) => (
            <span
              key={pattern}
              className="rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-400"
            >
              {pattern}
            </span>
          ))}

          {isFraming && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Framing
            </span>
          )}
        </div>

        {/* Perspective Score */}
        <PerspectiveScore regions={item.regions} />

        {/* Connection/Context */}
        {item.connection && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {item.connection}
          </p>
        )}

        {/* View Full Scan link */}
        <Link
          href={`/scan/${item.date}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#c8922a] transition-colors hover:text-[#a87820]"
        >
          View Full Scan &rarr;
        </Link>
      </div>
    </div>
  );
}
