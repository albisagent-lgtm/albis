"use client";

import { PremiumGate } from "@/app/components/premium-gate";
import type { FramingComparison } from "@/lib/scan-parser";

interface Props {
  items: FramingComparison[];
  notes: { date: string; displayDate: string; note: string }[];
  regionLabels: Record<string, string>;
  categoryMeta: Record<string, { label: string; color: string }>;
}

export function FramingWatchClient({ items, notes, regionLabels, categoryMeta }: Props) {
  return (
    <PremiumGate>
      <FramingWatchContent
        items={items}
        notes={notes}
        regionLabels={regionLabels}
        categoryMeta={categoryMeta}
      />
    </PremiumGate>
  );
}

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const regionColors: Record<string, string> = {
  "south-asia": "from-orange-500/20 to-orange-500/5 border-orange-500/30",
  "western-world": "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  "middle-east": "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  "eastern-europe": "from-rose-500/20 to-rose-500/5 border-rose-500/30",
  "africa": "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  "east-se-asia": "from-violet-500/20 to-violet-500/5 border-violet-500/30",
  "latin-americas": "from-lime-500/20 to-lime-500/5 border-lime-500/30",
  "global": "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
};

const regionDot: Record<string, string> = {
  "south-asia": "bg-orange-500",
  "western-world": "bg-blue-500",
  "middle-east": "bg-amber-500",
  "eastern-europe": "bg-rose-500",
  "africa": "bg-emerald-500",
  "east-se-asia": "bg-violet-500",
  "latin-americas": "bg-lime-500",
  "global": "bg-cyan-500",
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

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function FramingWatchContent({ items, notes, regionLabels, categoryMeta }: Props) {
  // Group items by headline similarity (using exact headline for now)
  const grouped = groupByStory(items);

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-zinc-200 py-16 dark:border-zinc-800/50 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-600 dark:text-amber-400"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
              Framing Watch
            </p>
          </div>

          <h1 className="mt-6 text-3xl font-light leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl lg:text-5xl">
            Same event. Different story.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
            When the same event is covered differently across regions, the gaps reveal
            more than the headlines. Framing Watch tracks stories where regional coverage
            diverges — what gets emphasized, what gets omitted, and what that tells us.
          </p>
        </div>
      </section>

      {/* Daily framing notes */}
      {notes.length > 0 && (
        <section className="border-b border-zinc-200 py-12 dark:border-zinc-800/50">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Recent Framing Signals
            </p>
            <div className="mt-6 space-y-4">
              {notes.map((n) => (
                <div
                  key={n.date}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800/50"
                >
                  <time className="text-xs text-zinc-400 dark:text-zinc-500">
                    {n.displayDate}
                  </time>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {n.note.replace(/^\*/, "").replace(/\*$/, "")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Framing comparisons */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Flagged Stories
          </p>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            Stories where framing or omission patterns were detected across coverage
          </p>

          {grouped.length === 0 ? (
            <div className="mt-12 text-center">
              <p className="text-zinc-400 dark:text-zinc-500">
                No framing divergences detected in recent scans.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {grouped.map((group, i) => (
                <FramingCard
                  key={i}
                  group={group}
                  regionLabels={regionLabels}
                  categoryMeta={categoryMeta}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-200 py-16 dark:border-zinc-800/50">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            How Framing Watch Works
          </p>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Detect",
                desc: "Each scan searches 7 regions for the same events. When coverage diverges, we flag it.",
              },
              {
                step: "2",
                title: "Compare",
                desc: "We analyze emphasis, omission, and emotional tone across regional coverage of the same story.",
              },
              {
                step: "3",
                title: "Reveal",
                desc: "The gaps between versions tell you more about power, priorities, and perspective than any single source.",
              },
            ].map((s) => (
              <div key={s.step}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-sm font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  {s.step}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Framing Card
// ---------------------------------------------------------------------------

interface StoryGroup {
  headline: string;
  items: FramingComparison[];
  allRegions: string[];
  category: string;
  significance: "high" | "medium" | "low";
}

function FramingCard({
  group,
  regionLabels,
  categoryMeta,
}: {
  group: StoryGroup;
  regionLabels: Record<string, string>;
  categoryMeta: Record<string, { label: string; color: string }>;
}) {
  const meta = categoryMeta[group.category] || { label: group.category, color: "zinc" };
  const sigColors: Record<string, string> = {
    high: "bg-amber-500",
    medium: "bg-blue-400 dark:bg-blue-500",
    low: "bg-zinc-300 dark:bg-zinc-600",
  };

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800/50">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800/50 dark:bg-zinc-900/50">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${sigColors[group.significance] || sigColors.medium}`}
          />
          <span className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <span
              className={`h-2 w-2 rounded-full ${colorDot[meta.color] || "bg-zinc-500"}`}
            />
            {meta.label}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Framing detected
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {group.items[0]?.scanDate}
          </span>
        </div>
        <h3 className="mt-2 text-base font-medium leading-snug text-zinc-800 dark:text-zinc-100">
          {group.headline}
        </h3>
      </div>

      {/* Regional comparison */}
      <div className="grid gap-px bg-zinc-200 dark:bg-zinc-800/50 sm:grid-cols-2 lg:grid-cols-3">
        {group.allRegions.map((region) => {
          const label = regionLabels[region] || region;
          const gradient = regionColors[region] || "from-zinc-500/20 to-zinc-500/5 border-zinc-500/30";
          const dot = regionDot[region] || "bg-zinc-500";

          // Find the item's connection for context
          const matchingItem = group.items.find((it) => it.regions.includes(region));

          return (
            <div
              key={region}
              className={`bg-gradient-to-b ${gradient} border-l-2 bg-white p-4 dark:bg-zinc-950`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  {label}
                </span>
              </div>
              {matchingItem ? (
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {matchingItem.connection}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-zinc-400 dark:text-zinc-500">
                  Limited or absent coverage in this region
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Analysis note */}
      <div className="border-t border-zinc-200 bg-amber-50/30 px-5 py-3 dark:border-zinc-800/50 dark:bg-amber-950/10">
        <p className="text-xs text-amber-700/80 dark:text-amber-400/60">
          {group.allRegions.length} region{group.allRegions.length !== 1 ? "s" : ""} covered this story.
          {" "}
          {group.items.some((it) => it.regions.length < 2)
            ? "Some regions received minimal or absent coverage — what is omitted shapes understanding as much as what is included."
            : "Compare what each region emphasized to see where the framing diverges."}
        </p>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Grouping helper
// ---------------------------------------------------------------------------

function groupByStory(items: FramingComparison[]): StoryGroup[] {
  // Group by exact headline + scanDate
  const map = new Map<string, FramingComparison[]>();
  for (const item of items) {
    const key = `${item.scanDate}::${item.headline}`;
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  }

  const groups: StoryGroup[] = [];
  for (const [, groupItems] of map) {
    const allRegions = [...new Set(groupItems.flatMap((it) => it.regions))];
    groups.push({
      headline: groupItems[0].headline,
      items: groupItems,
      allRegions,
      category: groupItems[0].category,
      significance: groupItems[0].significance,
    });
  }

  // Sort by date descending, then by significance
  const sigOrder = { high: 0, medium: 1, low: 2 };
  groups.sort((a, b) => {
    const dateA = a.items[0].scanDate;
    const dateB = b.items[0].scanDate;
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return (sigOrder[a.significance] || 1) - (sigOrder[b.significance] || 1);
  });

  return groups;
}
