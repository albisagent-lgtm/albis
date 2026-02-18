"use client";

import { useState } from "react";
import { PremiumGate } from "@/app/components/premium-gate";
import type { ScanSummary } from "./page";
import type { ScanItem } from "@/lib/scan-types";

interface Props {
  summaries: ScanSummary[];
  categoryMeta: Record<string, { label: string; color: string }>;
  regionLabels: Record<string, string>;
}

export function HistoryClient({ summaries, categoryMeta, regionLabels }: Props) {
  return (
    <PremiumGate>
      <HistoryContent
        summaries={summaries}
        categoryMeta={categoryMeta}
        regionLabels={regionLabels}
      />
    </PremiumGate>
  );
}

const moodColors: Record<string, string> = {
  urgent: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  critical: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  brittle: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  tense: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  fragment: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  unsettled: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  calm: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  stable: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
};

function getMoodColor(mood: string | null): string {
  if (!mood) return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  const lower = mood.toLowerCase();
  for (const [key, val] of Object.entries(moodColors)) {
    if (lower.includes(key)) return val;
  }
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
}

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

function HistoryContent({ summaries, categoryMeta, regionLabels }: Props) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  if (summaries.length === 0) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="px-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
            No scan history
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            Scan data will appear here as it becomes available.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Header */}
      <section className="border-b border-zinc-200 py-16 dark:border-zinc-800/50 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Archive
          </p>
          <h1 className="mt-4 text-3xl font-light leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
            Scan History
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            {summaries.length} scan{summaries.length !== 1 ? "s" : ""} available.
            Click any date to explore that day&apos;s intelligence.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="relative space-y-0">
            {/* Vertical timeline line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-zinc-200 dark:bg-zinc-800" />

            {summaries.map((s) => {
              const isExpanded = expandedDate === s.date;
              const dateObj = new Date(s.date + "T12:00:00");
              const day = dateObj.getDate();
              const month = dateObj.toLocaleDateString("en-US", { month: "short" });
              const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });

              return (
                <div key={s.date} className="relative">
                  {/* Timeline dot */}
                  <button
                    onClick={() => setExpandedDate(isExpanded ? null : s.date)}
                    className="group flex w-full cursor-pointer items-start gap-4 py-4 text-left"
                  >
                    <div
                      className={`relative z-10 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isExpanded
                          ? "border-amber-500 bg-amber-500"
                          : "border-zinc-300 bg-white group-hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:group-hover:border-zinc-500"
                      }`}
                    >
                      {isExpanded && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                          {weekday}, {month} {day}
                        </span>
                        {s.mood && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getMoodColor(s.mood)}`}
                          >
                            {s.mood}
                          </span>
                        )}
                        <span className="text-xs text-zinc-400 dark:text-zinc-600">
                          {s.itemCount} items
                        </span>
                        {s.highCount > 0 && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            {s.highCount} high
                          </span>
                        )}
                        {s.framingCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            <svg
                              width="8"
                              height="8"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            {s.framingCount}
                          </span>
                        )}
                      </div>

                      {s.patternTitle && (
                        <p className="mt-1 text-sm italic text-zinc-500 dark:text-zinc-400">
                          {s.patternTitle}
                        </p>
                      )}
                    </div>

                    {/* Expand arrow */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`mt-1 flex-shrink-0 text-zinc-300 transition-transform dark:text-zinc-600 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="ml-10 mb-4 space-y-6">
                      {/* Top theme */}
                      {s.topTheme && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                            Top Theme
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {s.topTheme}
                          </p>
                        </div>
                      )}

                      {/* Pattern */}
                      {s.patternBody && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
                            Pattern of the Day
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {s.patternBody}
                          </p>
                        </div>
                      )}

                      {/* Notable */}
                      {s.notableItems.length > 0 && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                            Notable
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {s.notableItems.map((item, i) => (
                              <li
                                key={i}
                                className="flex gap-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400"
                              >
                                <span className="mt-1.5 block h-1 w-1 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: item.replace(
                                      /\*\*([^*]+)\*\*/g,
                                      "<strong class='font-semibold text-zinc-700 dark:text-zinc-300'>$1</strong>"
                                    ),
                                  }}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Stories list */}
                      {s.items.length > 0 && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                            All Stories ({s.items.length})
                          </p>
                          <div className="mt-3 space-y-1">
                            {s.items
                              .sort((a, b) => {
                                const ord = { high: 0, medium: 1, low: 2 };
                                return (ord[a.significance] ?? 1) - (ord[b.significance] ?? 1);
                              })
                              .map((item, i) => (
                                <HistoryStoryCard
                                  key={i}
                                  item={item}
                                  categoryMeta={categoryMeta}
                                  regionLabels={regionLabels}
                                />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Summaries */}
                      {(s.weatherSummary || s.flowsSummary) && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {s.weatherSummary && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                Weather & Climate
                              </p>
                              <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                {s.weatherSummary}
                              </p>
                            </div>
                          )}
                          {s.flowsSummary && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                Economic Flows
                              </p>
                              <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                {s.flowsSummary}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function HistoryStoryCard({
  item,
  categoryMeta,
  regionLabels,
}: {
  item: ScanItem;
  categoryMeta: Record<string, { label: string; color: string }>;
  regionLabels: Record<string, string>;
}) {
  const meta = categoryMeta[item.category] || { label: item.category, color: "zinc" };
  const isFraming = item.patterns.includes("framing");

  return (
    <div className="rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
      <div className="flex gap-2.5">
        <span
          className={`mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full ${sigColors[item.significance] || sigColors.medium}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-zinc-700 dark:text-zinc-200">
            {item.headline}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
              <span
                className={`h-1.5 w-1.5 rounded-full ${colorDot[meta.color] || "bg-zinc-500"}`}
              />
              {meta.label}
            </span>
            {item.regions.map((r) => (
              <span
                key={r}
                className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              >
                {regionLabels[r] || r}
              </span>
            ))}
            {isFraming && (
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                framing
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
            {item.connection}
          </p>
        </div>
      </div>
    </div>
  );
}
