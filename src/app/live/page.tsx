import { getTodayScan, getAvailableDates, getScanByDate } from "@/lib/scan-parser";
import { CATEGORY_META } from "@/lib/scan-types";
import type { ScanItem } from "@/lib/scan-types";
import { ScanPulse } from "@/app/components/scan-pulse";
import { RelativeTime } from "@/app/components/relative-time";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live Desk — Albis",
  description: "The Albis scan engine runs 3 times daily. See what it's finding right now.",
};

function getCategoryAccent(category: string): string {
  return CATEGORY_META[category]?.accent || "#c8922a";
}

export default async function LivePage() {
  const scan = await getTodayScan();

  // Get last 3 scan dates for summaries
  const allDates = await getAvailableDates();
  const recentDates = allDates.slice(0, 3);
  const recentScans = await Promise.all(
    recentDates.map((date) => getScanByDate(date))
  );

  const topStories = scan?.items
    ? [...scan.items].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.significance] ?? 1) - (order[b.significance] ?? 1);
      }).slice(0, 8)
    : [];

  return (
    <main className="min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <ScanPulse />

      <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            Live Desk
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-semibold leading-tight text-[#0f0f0f] dark:text-[#f0efec]">
            Live Desk
          </h1>
          <p className="mt-3 text-base text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
            The Albis scan engine runs 3 times daily. Here&apos;s what it&apos;s seeing right now.
          </p>
        </div>

        {/* Today's top stories */}
        {topStories.length > 0 ? (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                Today&apos;s Top Stories
              </h2>
              {scan?.date && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  <RelativeTime date={scan.date} prefix="Scanned " />
                </span>
              )}
            </div>

            <div className="space-y-3">
              {topStories.map((item: ScanItem, i: number) => (
                <div
                  key={i}
                  className="rounded-lg border border-black/[0.06] bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {item.category && (
                      <span
                        className="text-[11px] font-medium tracking-[0.15em] uppercase"
                        style={{ color: getCategoryAccent(item.category) }}
                      >
                        {CATEGORY_META[item.category]?.label || item.category}
                      </span>
                    )}
                    {item.significance === "high" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/30 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        High
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {item.regions.filter((r) => r !== "global").length || "—"} regions
                    </span>
                  </div>
                  <h3 className="font-[family-name:var(--font-playfair)] text-base md:text-lg font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                    {item.headline}
                  </h3>
                  {item.connection && (
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 line-clamp-2">
                      {item.connection}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/lens"
                className="inline-flex items-center gap-2 rounded-full bg-[#1a3a5c] px-6 py-2.5 text-sm font-medium text-white shadow-[0_2px_12px_rgb(26,58,92,0.3)] hover:bg-[#243f66] transition-colors"
              >
                See full briefing
              </Link>
            </div>
          </section>
        ) : (
          <section className="mb-12">
            <div className="rounded-xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03] text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-[family-name:var(--font-source-serif)]">
                No stories scanned yet today. The next scan runs shortly.
              </p>
            </div>
          </section>
        )}

        {/* Recent scan summaries */}
        {recentScans.filter(Boolean).length > 0 && (
          <section>
            <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
              Recent Scans
            </h2>

            <div className="space-y-4">
              {recentScans.map((s) => {
                if (!s) return null;
                const storyCount = s.items.length;
                const highCount = s.items.filter((i) => i.significance === "high").length;

                return (
                  <Link
                    key={s.date}
                    href={`/archive/${s.date}`}
                    className="group block rounded-lg border border-black/[0.06] bg-white p-4 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                        {s.displayDate}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {storyCount} stories{highCount > 0 && ` · ${highCount} high`}
                      </span>
                    </div>

                    {s.mood && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Mood: {s.mood}
                      </p>
                    )}

                    {s.topTheme && (
                      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 line-clamp-1">
                        {s.topTheme}
                      </p>
                    )}

                    {s.patternOfDay && s.patternOfDay.title && (
                      <p className="mt-1 text-xs italic text-zinc-400 dark:text-zinc-500 line-clamp-1">
                        Pattern: {s.patternOfDay.title}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/archive"
                className="text-sm font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors"
              >
                View all past scans &rarr;
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
