import type { Metadata } from "next";
import Link from "next/link";
import { getTodayScan, getRecentScanItems } from "@/lib/scan-parser";
import { REGION_LABELS, CATEGORY_META, normalizeRegion, detectBlindspots } from "@/lib/scan-types";
import type { ScanItem } from "@/lib/scan-types";
import { ShareButtons } from "../components/share-buttons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Under the Radar — Stories the World is Missing | Albis",
  description: "Stories dominating one region's media but invisible everywhere else. Powered by blindspot detection across 7 world regions.",
  openGraph: {
    title: "Under the Radar — Stories the World is Missing",
    description: "Stories dominating one region's media but invisible everywhere else.",
  },
};

const REGION_FLAGS: Record<string, string> = {
  "western-world": "🇺🇸",
  "europe": "🇪🇺",
  "middle-east": "🕌",
  "south-asia": "🇮🇳",
  "east-se-asia": "🌏",
  "africa": "🌍",
  "latin-americas": "🌎",
  // Scan data keys
  "us": "🇺🇸",
  "eu": "🇪🇺",
  "middle_east": "🕌",
  "south_asia": "🇮🇳",
  "asia_pacific": "🌏",
  "latam": "🌎",
};

function getRegionLabel(r: string): string {
  return REGION_LABELS[r] || REGION_LABELS[normalizeRegion(r)] || r;
}

function getRegionFlag(r: string): string {
  return REGION_FLAGS[r] || REGION_FLAGS[normalizeRegion(r)] || "🌐";
}

export default async function UnderTheRadarPage() {
  const scan = await getTodayScan();
  const recentData = await getRecentScanItems(7);

  // Get today's blindspots
  const todayItems = scan?.items ? detectBlindspots(scan.items) : [];
  const todayBlindspots = todayItems.filter(
    (item) => item.blindspot?.isBlindspot === true
  );

  // Get recent blindspots (past 7 days, excluding today)
  const todayDate = scan?.date || "";
  const recentBlindspots = detectBlindspots(
    recentData.items
      .filter((item) => item.scanDate !== todayDate)
      .map((item) => ({
        headline: item.headline,
        category: item.category,
        regions: item.regions,
        tags: item.tags,
        patterns: item.patterns,
        significance: item.significance,
        connection: item.connection,
      }))
  ).filter((item) => item.blindspot?.isBlindspot === true);

  // Sort by significance
  const sigOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  todayBlindspots.sort((a, b) => (sigOrder[a.significance] ?? 1) - (sigOrder[b.significance] ?? 1));
  recentBlindspots.sort((a, b) => (sigOrder[a.significance] ?? 1) - (sigOrder[b.significance] ?? 1));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 md:py-14 pb-28 md:pb-14">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
          Under the Radar
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
          Stories the world is missing
        </h1>
        <p className="mt-3 text-base text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 max-w-xl mx-auto">
          These stories dominate media in one region but are invisible almost everywhere else.
          What one part of the world sees as urgent, the rest doesn&apos;t see at all.
        </p>
      </div>

      {/* Share */}
      <div className="mb-8 flex justify-center">
        <ShareButtons
          url="https://www.albis.news/under-the-radar"
          title="Stories the world is missing — Under the Radar by Albis"
          compact
        />
      </div>

      {/* Today's blindspots */}
      <section className="mb-12">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-1">
          Today
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">
          {todayBlindspots.length > 0
            ? `${todayBlindspots.length} stories detected in only 1 region`
            : "No regional blindspots detected today — the world is relatively aligned."}
        </p>

        {todayBlindspots.length > 0 ? (
          <div className="space-y-3">
            {todayBlindspots.map((item, i) => (
              <BlindspotCard key={i} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-black/[0.06] p-6 text-center dark:border-white/[0.06]">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              All stories today are being covered across multiple regions. Check back later — scans run 3x daily.
            </p>
          </div>
        )}
      </section>

      {/* Recent blindspots */}
      {recentBlindspots.length > 0 && (
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-1">
            This week
          </h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">
            {recentBlindspots.length} regional blindspots from the past 7 days
          </p>

          <div className="space-y-3">
            {recentBlindspots.slice(0, 15).map((item, i) => (
              <BlindspotCard key={i} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Explanation */}
      <section className="rounded-xl border border-black/[0.06] bg-zinc-50/50 p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-2">How we detect blindspots</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
          Albis scans news from 7 world regions 3 times daily. When a story appears in only 1 region&apos;s media,
          it&apos;s flagged as a blindspot — something the rest of the world isn&apos;t seeing. Stories covered by 3+ regions
          from one area but missing from 3+ other areas are also flagged.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          These aren&apos;t necessarily the most important stories — they&apos;re the most <em>invisible</em> ones.
          Sometimes what a region <em>doesn&apos;t</em> cover tells you more than what it does.
        </p>
        <div className="mt-4">
          <Link href="/indexes" className="text-xs font-medium text-[#c8922a] hover:underline">
            Learn about our indexes →
          </Link>
        </div>
      </section>
    </main>
  );
}

function BlindspotCard({ item }: { item: ScanItem }) {
  const coveredBy = item.blindspot?.coveredBy || item.regions.filter((r) => r !== "global");
  const missingFrom = item.blindspot?.missingFrom || [];

  return (
    <div className="rounded-xl border border-black/[0.06] p-4 md:p-5 dark:border-white/[0.06]">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Category + significance */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {item.category && (
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-[#c8922a]">
                {CATEGORY_META[item.category]?.label || item.category}
              </span>
            )}
            {item.significance === "high" && (
              <span className="text-xs font-medium text-red-500">High significance</span>
            )}
          </div>

          <h3 className="text-sm font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
            {item.headline}
          </h3>

          {item.connection && (
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
              {item.connection}
            </p>
          )}

          {/* Region coverage map */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* Covered by */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Seen by:</span>
              {coveredBy.map((r) => (
                <span key={r} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <span>{getRegionFlag(r)}</span>
                  {getRegionLabel(r)}
                </span>
              ))}
            </div>

            {/* Missing from */}
            {missingFrom.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Missing from:</span>
                {missingFrom.slice(0, 4).map((r) => (
                  <span key={r} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                    <span>{getRegionFlag(r)}</span>
                    {getRegionLabel(r)}
                  </span>
                ))}
                {missingFrom.length > 4 && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    +{missingFrom.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
