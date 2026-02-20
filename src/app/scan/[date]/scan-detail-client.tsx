"use client";

import { useState } from "react";
import Link from "next/link";
import { PremiumGate } from "@/app/components/premium-gate";
import { PerspectiveScore } from "@/app/components/perspective-score";
import {
  type ParsedScan,
  type ScanItem,
  CATEGORY_META,
  REGION_LABELS,
  hasFramingWatch,
  hasBlindspot,
  groupByCategory,
} from "@/lib/scan-types";

interface Props {
  scan: ParsedScan;
  availableDates: string[];
}

export function ScanDetailClient({ scan, availableDates }: Props) {
  return (
    <PremiumGate>
      <ScanDetailContent scan={scan} availableDates={availableDates} />
    </PremiumGate>
  );
}

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const colorDot: Record<string, string> = {
  blue: "bg-blue-500", violet: "bg-violet-500", cyan: "bg-cyan-500",
  emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500",
  lime: "bg-lime-500", fuchsia: "bg-fuchsia-500", orange: "bg-orange-500",
  sky: "bg-sky-500", teal: "bg-teal-500", zinc: "bg-zinc-500",
};

const sigColors: Record<string, string> = {
  high: "bg-amber-500",
  medium: "bg-blue-400 dark:bg-blue-500",
  low: "bg-zinc-300 dark:bg-zinc-600",
};

const sigLabels: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function ScanDetailContent({ scan, availableDates }: Props) {
  const sorted = [...availableDates].sort((a, b) => a.localeCompare(b));
  const currentIdx = sorted.indexOf(scan.date);
  const prevDate = currentIdx > 0 ? sorted[currentIdx - 1] : null;
  const nextDate = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

  const categories = groupByCategory(scan.items);
  const blindspotItems = scan.items.filter((i) => hasBlindspot(i));
  const highCount = scan.items.filter((i) => i.significance === "high").length;
  const allRegions = new Set(scan.items.flatMap((i) => i.regions));
  const allCategories = new Set(scan.items.map((i) => i.category));

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <ScanNav prevDate={prevDate} nextDate={nextDate} />

      {/* Header */}
      <section className="border-b border-black/[0.07] py-16 dark:border-white/[0.06] md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <time dateTime={scan.date} className="text-zinc-500">
              {scan.displayDate}
            </time>
            {scan.mood && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
                <MoodBadge mood={scan.mood} />
              </>
            )}
            {scan.scanMeta && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                  {scan.scanMeta}
                </span>
              </>
            )}
          </div>

          <h1 className="mt-8 font-[family-name:var(--font-playfair)] text-3xl font-semibold italic leading-snug text-[#0f0f0f] dark:text-[#f0efec] md:text-4xl">
            Intelligence Scan
          </h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {scan.items.length} signals &middot; {allCategories.size} categories &middot; {allRegions.size} regions
          </p>
        </div>
      </section>

      {/* Top Theme */}
      {scan.topTheme && (
        <section className="border-b border-black/[0.07] dark:border-white/[0.06]">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
              Top Theme
            </p>
            <p className="mt-4 font-[family-name:var(--font-source-serif)] text-xl leading-relaxed text-zinc-700 dark:text-zinc-300 md:text-2xl">
              {scan.topTheme}
            </p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
        </section>
      )}

      {/* Pattern of the Day */}
      {scan.patternOfDay && (
        <section className="border-b border-black/[0.07] dark:border-white/[0.06]">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
              Pattern of the Day
            </p>
            {scan.patternOfDay.title && (
              <p className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-semibold italic leading-relaxed text-[#0f0f0f] dark:text-[#f0efec]">
                {scan.patternOfDay.title}
              </p>
            )}
            <p className="mt-3 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              {scan.patternOfDay.body}
            </p>
          </div>
        </section>
      )}

      {/* Framing Watch */}
      {scan.framingNote && (
        <section className="border-b border-black/[0.07] bg-amber-50/30 dark:border-white/[0.06] dark:bg-amber-950/10">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                Framing Watch
              </p>
            </div>
            <p className="mt-4 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              {scan.framingNote}
            </p>
          </div>
        </section>
      )}

      {/* Blindspot Alerts */}
      {blindspotItems.length > 0 && (
        <section className="border-b border-black/[0.07] dark:border-white/[0.06]">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-600 dark:text-amber-400">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                Blindspot Alerts
              </p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                {blindspotItems.length}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              Stories with limited regional coverage — perspectives you may be missing.
            </p>
            <div className="mt-6 space-y-3">
              {blindspotItems.slice(0, 8).map((item, i) => (
                <div key={i} className="rounded-lg border border-dashed border-amber-300/50 bg-amber-50/30 p-4 dark:border-amber-700/30 dark:bg-amber-950/10">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {item.headline}
                  </p>
                  {item.blindspot && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Covered by: </span>
                        {item.blindspot.coveredBy.map(r => REGION_LABELS[r] || r).join(", ")}
                      </span>
                      <span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">Missing from: </span>
                        {item.blindspot.missingFrom.map(r => REGION_LABELS[r] || r).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Stories by Category */}
      {categories.size > 0 && (
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              All Stories
            </p>
            <div className="mt-8 space-y-10">
              {Array.from(categories).map(([cat, items]) => (
                <CategorySection key={cat} category={cat} items={items} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gold divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />

      {/* Weather & Flows */}
      {(scan.weatherSummary || scan.flowsSummary) && (
        <section className="border-b border-black/[0.07] dark:border-white/[0.06]">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <div className="grid gap-8 sm:grid-cols-2">
              {scan.weatherSummary && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
                    Weather &amp; Climate
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {scan.weatherSummary}
                  </p>
                </div>
              )}
              {scan.flowsSummary && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                    Economic Flows
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {scan.flowsSummary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Notable Headlines */}
      {scan.notableItems.length > 0 && (
        <section className="border-b border-black/[0.07] dark:border-white/[0.06]">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Notable Headlines
            </p>
            <ul className="mt-6 space-y-3">
              {scan.notableItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  <span className="mt-2 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c8922a]/40" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: item.replace(
                        /\*\*([^*]+)\*\*/g,
                        "<strong class='font-semibold text-zinc-800 dark:text-zinc-200'>$1</strong>"
                      ),
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Scan Stats */}
      <section className="border-b border-black/[0.07] dark:border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Scan Statistics
          </p>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <StatCard label="Total Signals" value={scan.items.length} />
            <StatCard label="High Significance" value={highCount} accent />
            <StatCard label="Categories" value={allCategories.size} />
            <StatCard label="Regions" value={allRegions.size} />
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <ScanNav prevDate={prevDate} nextDate={nextDate} />

      {/* Back to explore */}
      <section className="border-t border-zinc-200 dark:border-zinc-800/50">
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <Link
            href="/explore"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            &larr; Back to Explore
          </Link>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScanNav({ prevDate, nextDate }: { prevDate: string | null; nextDate: string | null }) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800/50">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        {prevDate ? (
          <Link
            href={`/scan/${prevDate}`}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Previous Scan
          </Link>
        ) : (
          <span />
        )}
        {nextDate ? (
          <Link
            href={`/scan/${nextDate}`}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Next Scan
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function CategorySection({ category, items }: { category: string; items: ScanItem[] }) {
  const [expanded, setExpanded] = useState(true);
  const meta = CATEGORY_META[category] || { label: category, color: "zinc" };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${colorDot[meta.color] || "bg-zinc-500"}`} />
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {meta.label}
        </h3>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {items.length}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`ml-auto text-zinc-300 transition-transform dark:text-zinc-600 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-1">
          {items
            .sort((a, b) => {
              const ord: Record<string, number> = { high: 0, medium: 1, low: 2 };
              return (ord[a.significance] ?? 1) - (ord[b.significance] ?? 1);
            })
            .map((item, i) => (
              <StoryCard key={i} item={item} />
            ))}
        </div>
      )}
    </div>
  );
}

function StoryCard({ item }: { item: ScanItem }) {
  const isFraming = hasFramingWatch(item);
  const isBlindspot = hasBlindspot(item);

  return (
    <article className="rounded-lg px-4 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
      <div className="flex gap-3">
        <span
          className={`mt-2 block h-1.5 w-1.5 flex-shrink-0 rounded-full ${sigColors[item.significance] || sigColors.medium}`}
          title={`${item.significance} significance`}
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-medium leading-snug text-zinc-800 dark:text-zinc-100">
            {item.headline}
          </h4>

          {/* Tags */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {item.regions.map((r) => (
              <span key={r} className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
                {REGION_LABELS[r] || r}
              </span>
            ))}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              item.significance === "high"
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                : item.significance === "medium"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                : "bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
            }`}>
              <span className={`h-1 w-1 rounded-full ${sigColors[item.significance]}`} />
              {sigLabels[item.significance]}
            </span>
            {item.patterns.map((p) => (
              <span
                key={p}
                className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  p === "framing"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400/80"
                    : "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400/70"
                }`}
              >
                {p.replace(/-/g, " ")}
              </span>
            ))}
            {isFraming && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Framing
              </span>
            )}
            {isBlindspot && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                Blindspot
              </span>
            )}
          </div>

          {/* Perspective Score */}
          <div className="mt-2">
            <PerspectiveScore regions={item.regions} />
          </div>

          {/* Connection */}
          {item.connection && (
            <p className="mt-3 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
              {item.connection}
            </p>
          )}

          {/* Blindspot detail */}
          {isBlindspot && item.blindspot && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Covered by: </span>
                {item.blindspot.coveredBy.map(r => REGION_LABELS[r] || r).join(", ")}
              </span>
              <span>
                <span className="font-medium text-orange-600 dark:text-orange-400">Missing from: </span>
                {item.blindspot.missingFrom.map(r => REGION_LABELS[r] || r).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function MoodBadge({ mood }: { mood: string }) {
  const lower = mood.toLowerCase();
  let colorClasses = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  if (lower.includes("urgent") || lower.includes("critical")) {
    colorClasses = "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400";
  } else if (lower.includes("brittle") || lower.includes("tense") || lower.includes("fragment")) {
    colorClasses = "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
  } else if (lower.includes("calm") || lower.includes("stable")) {
    colorClasses = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses}`}>
      {mood}
    </span>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-black/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <p className={`text-2xl font-semibold ${accent ? "text-amber-600 dark:text-amber-400" : "text-zinc-800 dark:text-zinc-100"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{label}</p>
    </div>
  );
}
