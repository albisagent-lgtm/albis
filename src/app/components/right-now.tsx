import Link from "next/link";
import type { ScanItem } from "@/lib/scan-types";
import { REGION_LABELS } from "@/lib/scan-types";

interface RightNowProps {
  items: ScanItem[];
  pgiScores?: Record<string, number>; // headline -> score
  scanDate?: string;
  articleSlugs?: Record<string, string>; // headline keyword -> slug
}

function PgiBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "bg-red-500"
      : score >= 6
        ? "bg-amber-500"
        : score >= 4
          ? "bg-yellow-500"
          : "bg-emerald-500";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-zinc-600 dark:text-zinc-400">
        PGI {score.toFixed(1)}
      </span>
    </span>
  );
}

function regionCount(regions: string[]): string {
  const filtered = regions.filter((r) => r !== "global");
  if (filtered.length === 0) return "Global coverage";
  if (filtered.length === 1)
    return REGION_LABELS[filtered[0]] || filtered[0];
  return `${filtered.length} regions covering`;
}

export function RightNow({
  items,
  pgiScores = {},
  scanDate,
  articleSlugs = {},
}: RightNowProps) {
  if (!items || items.length === 0) return null;

  // Sort by significance: high first
  const sorted = [...items].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.significance] ?? 1) - (order[b.significance] ?? 1);
  });

  const topStories = sorted.slice(0, 2);
  const moreStories = sorted.slice(2, 7);

  // Find matching article slug for a headline
  function findArticleSlug(item: ScanItem): string | null {
    const tags = item.tags || [];
    for (const tag of tags) {
      if (articleSlugs[tag.toLowerCase()]) {
        return articleSlugs[tag.toLowerCase()];
      }
    }
    // Check headline keywords
    const words = item.headline.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 4 && articleSlugs[word]) {
        return articleSlugs[word];
      }
    }
    return null;
  }

  // Calculate "updated X minutes ago" 
  const updatedText = scanDate
    ? (() => {
        const now = new Date();
        const scanTime = new Date(scanDate + "T12:00:00+13:00");
        const diffMs = now.getTime() - scanTime.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Updated just now";
        if (diffMin < 60) return `Updated ${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `Updated ${diffHr}h ago`;
        return `Updated ${Math.floor(diffHr / 24)}d ago`;
      })()
    : null;

  return (
    <section className="relative bg-[#f8f7f4] py-16 dark:bg-[#0f0f0f] md:py-20">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
      <div className="mx-auto max-w-3xl px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              Right Now
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[#0f0f0f] md:text-3xl dark:text-[#f0efec]">
              Top stories
            </h2>
          </div>
          {updatedText && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {updatedText}
            </span>
          )}
        </div>

        {/* Top 1-2 stories — large treatment */}
        <div className="mt-8 space-y-6">
          {topStories.map((item, i) => {
            const slug = findArticleSlug(item);
            const pgi = pgiScores[item.headline];

            return (
              <div
                key={i}
                className="rounded-xl border border-black/[0.06] bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {item.significance === "high" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      High significance
                    </span>
                  )}
                  {pgi !== undefined && <PgiBadge score={pgi} />}
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {regionCount(item.regions)}
                  </span>
                </div>

                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug text-[#0f0f0f] md:text-2xl dark:text-[#f0efec]">
                  {item.headline}
                </h3>

                {item.connection && (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                    {item.connection}
                  </p>
                )}

                {slug && (
                  <Link
                    href={`/lens/${slug}`}
                    className="mt-4 inline-block text-sm font-medium text-[#c8922a] hover:underline"
                  >
                    Read our analysis &rarr;
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* More stories — compact */}
        {moreStories.length > 0 && (
          <div className="mt-6 space-y-2">
            {moreStories.map((item, i) => (
              <div key={i} className="flex gap-3 py-2.5">
                <span className="mt-1.5 block h-2 w-2 flex-shrink-0 rounded-full bg-[#c8922a]" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                    {item.headline}
                  </h4>
                  {item.connection && (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500 line-clamp-1">
                      {item.connection}
                    </p>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {item.regions.filter((r) => r !== "global").length || "—"}{" "}
                  regions
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/lens"
            className="inline-flex items-center gap-2 rounded-full bg-[#c8922a] px-6 py-2.5 text-sm font-medium text-white shadow-[0_2px_12px_rgb(200,146,42,0.3)] hover:bg-[#b17f24] transition-colors"
          >
            See the full News Wall
          </Link>
        </div>
      </div>
    </section>
  );
}
