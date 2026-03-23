"use client";

import { useMemo } from "react";
import type { ScanItem, ParsedScan } from "@/lib/scan-types";
import { CATEGORY_META, REGION_LABELS } from "@/lib/scan-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScanItemWithDate extends ScanItem {
  scanDate: string;
  displayDate: string;
}

interface CountryData {
  name: string;
  flag: string;
  region: string;
  slug: string;
}

interface Props {
  country: CountryData;
  todayScan: ParsedScan | null;
  allItems: ScanItemWithDate[];
}

// ---------------------------------------------------------------------------
// Region mapping: country.region -> scan region keys
// ---------------------------------------------------------------------------

const REGION_TO_SCAN_KEYS: Record<string, string[]> = {
  "South Asia": ["south-asia"],
  "East & Southeast Asia": ["east-se-asia"],
  "Central Asia": ["south-asia", "east-se-asia"], // fallback
  "Middle East": ["middle-east"],
  "Africa": ["africa"],
  "Eastern Europe": ["eastern-europe"],
  "Western World": ["western-world"],
  "Latin Americas": ["latin-americas"],
  "Caribbean": ["latin-americas"],
  "Pacific Islands": ["western-world"], // AU/NZ region fallback
};

// Major countries that should match by name specifically
const MAJOR_COUNTRIES = new Set([
  "USA", "UK", "China", "India", "Russia", "Brazil", "Japan", "Germany",
  "France", "Australia", "Canada", "South Korea", "Mexico", "Indonesia",
  "Turkey", "Saudi Arabia", "Iran", "Israel", "Pakistan", "Nigeria",
  "Egypt", "South Africa", "Ukraine", "Poland", "Italy", "Spain",
  "Taiwan", "North Korea", "Palestine", "Syria", "Iraq", "Afghanistan",
  "Colombia", "Argentina", "Chile", "Venezuela", "Philippines", "Vietnam",
  "Thailand", "Kenya", "Ethiopia", "Morocco", "New Zealand",
]);

// Country name aliases for text matching
const COUNTRY_ALIASES: Record<string, string[]> = {
  "USA": ["United States", "US ", "U.S.", "America", "American"],
  "UK": ["United Kingdom", "Britain", "British", "England"],
  "South Korea": ["Seoul", "Korean"],
  "North Korea": ["Pyongyang", "DPRK"],
  "UAE": ["Emirates", "Dubai", "Abu Dhabi"],
  "DRC Congo": ["Democratic Republic of Congo", "DRC", "Kinshasa"],
  "Republic of the Congo": ["Congo-Brazzaville", "Brazzaville"],
  "Ivory Coast": ["Côte d'Ivoire"],
  "Czech Republic": ["Czechia"],
  "Timor-Leste": ["East Timor"],
};

// ---------------------------------------------------------------------------
// Filtering logic
// ---------------------------------------------------------------------------

function matchesCountry(item: ScanItemWithDate, country: CountryData): boolean {
  const name = country.name;
  const searchTerms = [name, ...(COUNTRY_ALIASES[name] || [])];
  const searchable = `${item.headline} ${item.tags.join(" ")} ${item.connection}`.toLowerCase();

  for (const term of searchTerms) {
    if (searchable.includes(term.toLowerCase())) return true;
  }
  return false;
}

function matchesRegion(item: ScanItemWithDate, country: CountryData): boolean {
  const scanKeys = REGION_TO_SCAN_KEYS[country.region] || [];
  return item.regions.some(r => scanKeys.includes(r));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CountryPerspectiveClient({ country, todayScan, allItems }: Props) {
  const isMajor = MAJOR_COUNTRIES.has(country.name);

  // Today's Stories - filter today's scan for mentions of this country
  const todayStories = useMemo(() => {
    if (!todayScan || !todayScan.items) return [];
    
    const searchTerms = [country.name, ...(COUNTRY_ALIASES[country.name] || [])];
    
    return todayScan.items.filter(item => {
      const searchable = `${item.headline} ${item.tags.join(" ")} ${item.connection}`.toLowerCase();
      return searchTerms.some(term => searchable.includes(term.toLowerCase()));
    });
  }, [todayScan, country.name]);

  const { countryItems, regionItems, hasDirectData } = useMemo(() => {
    // Deduplicate
    const seen = new Set<string>();
    const deduped = allItems.filter(item => {
      const key = item.headline.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const direct = deduped.filter(item => matchesCountry(item, country));
    const regional = deduped.filter(item => matchesRegion(item, country) && !matchesCountry(item, country));

    return {
      countryItems: direct,
      regionItems: regional,
      hasDirectData: direct.length > 0,
    };
  }, [allItems, country]);

  // Stories to display: country-specific first, then regional
  const displayItems = hasDirectData
    ? countryItems
    : regionItems;

  const recentStories = displayItems.slice(0, 20);

  // Top categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of displayItems) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [displayItems]);

  // Framing items
  const framingItems = useMemo(() => {
    const scanKeys = REGION_TO_SCAN_KEYS[country.region] || [];
    return allItems
      .filter(item =>
        item.patterns.includes("framing") &&
        (matchesCountry(item, country) || item.regions.some(r => scanKeys.includes(r)))
      )
      .slice(0, 5);
  }, [allItems, country]);

  // Coverage frequency
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }, []);

  const weekCount = useMemo(
    () => displayItems.filter(item => item.scanDate >= weekAgo).length,
    [displayItems, weekAgo]
  );

  const maxCat = categoryCounts.length > 0 ? categoryCounts[0][1] : 1;

  return (
    <div className="space-y-space-12">
      {/* Today's Stories Section */}
      <section>
        <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-4">
          TODAY&apos;S STORIES
        </h2>
        
        {todayStories.length > 0 ? (
          <div className="space-y-3">
            {todayStories.map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-zinc-400 dark:text-zinc-500 text-sm">•</span>
                <div className="flex-1">
                  <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
                    {item.headline}
                  </h3>
                  {item.connection && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {item.connection}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-400 italic dark:text-zinc-500">
            No stories mentioning {country.name} in today&apos;s scans.
          </p>
        )}
      </section>

      {/* Divider */}
      {displayItems.length > 0 && (
        <div className="border-t border-black/5 dark:border-white/5"></div>
      )}

      {/* Fallback message for region-only data */}
      {displayItems.length > 0 && !hasDirectData && (
        <div className="rounded-xl border border-amber-200/50 bg-amber-50/30 p-space-6 dark:border-amber-800/30 dark:bg-amber-950/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            While we build dedicated <strong>{country.name}</strong> coverage, here&apos;s what&apos;s happening in <strong>{country.region}</strong>.
          </p>
        </div>
      )}

      {/* Coverage Frequency - only show if we have historical data */}
      {displayItems.length > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-black/[0.07] bg-white p-space-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c8922a]/10 text-xl">
            <span className="text-[#c8922a] font-bold">CF</span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Coverage Frequency</p>
            <p className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              {weekCount} <span className="text-base font-normal text-zinc-400">stories this week</span>
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {displayItems.length} total stories in the last 30 days
            </p>
          </div>
        </div>
      )}

      {/* Top Categories - only show if we have historical data */}
      {displayItems.length > 0 && categoryCounts.length > 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Top Categories (Last 30 Days)
          </h2>
          <div className="mt-space-4 space-y-space-3">
            {categoryCounts.map(([cat, count]) => {
              const meta = CATEGORY_META[cat] || { label: cat, color: "zinc" };
              const pct = Math.round((count / maxCat) * 100);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium text-zinc-600 dark:text-zinc-400 truncate">
                    {meta.label}
                  </span>
                  <div className="flex-1 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#c8922a]/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Stories - only show if we have historical data */}
      {displayItems.length > 0 && recentStories.length > 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Recent Stories (Last 30 Days)
          </h2>
          <div className="mt-space-4 space-y-space-1">
            {recentStories.map((item, i) => (
              <StoryRow key={i} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Regional Framing - only show if we have framing data */}
      {displayItems.length > 0 && framingItems.length > 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Regional Framing (Last 30 Days)
          </h2>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Stories where different regions framed the narrative differently.
          </p>
          <div className="mt-space-4 space-y-space-4">
            {framingItems.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-amber-200/50 bg-white p-space-6 dark:border-amber-800/30 dark:bg-white/[0.02]"
              >
                <h3 className="font-medium text-[#0f0f0f] dark:text-[#f0efec] leading-snug">
                  {item.headline}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.regions.map(r => (
                    <span
                      key={r}
                      className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                    >
                      {REGION_LABELS[r] || r}
                    </span>
                  ))}
                  <span className="inline-flex rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                    Framing
                  </span>
                </div>
                {item.connection && (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                    {item.connection}
                  </p>
                )}
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                  {item.displayDate}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story Row
// ---------------------------------------------------------------------------

function StoryRow({ item }: { item: ScanItemWithDate }) {
  const sigColors: Record<string, string> = {
    high: "bg-amber-500",
    medium: "bg-blue-400 dark:bg-blue-500",
    low: "bg-zinc-300 dark:bg-zinc-600",
  };
  const meta = CATEGORY_META[item.category] || { label: item.category, color: "zinc" };

  return (
    <article className="group rounded-lg px-4 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
      <div className="flex gap-3">
        <span
          className={`mt-2 block h-1.5 w-1.5 flex-shrink-0 rounded-full ${sigColors[item.significance] || sigColors.medium}`}
          title={`${item.significance} significance`}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium leading-snug text-zinc-800 dark:text-zinc-100">
            {item.headline}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {item.displayDate}
            </span>
            <span className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
              {meta.label}
            </span>
            {item.patterns.map(p => (
              <span
                key={p}
                className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                  p === "framing"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400/80"
                    : "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400/70"
                }`}
              >
                {p.replace(/-/g, " ")}
              </span>
            ))}
          </div>
          {item.connection && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-500">
              {item.connection.length > 200 ? item.connection.slice(0, 200) + "…" : item.connection}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
