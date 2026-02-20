"use client";

import Link from "next/link";
import { REGIONS, type RegionId } from "@/lib/preferences";
import { type ScanItem, REGION_LABELS } from "@/lib/scan-types";

interface BubbleReportProps {
  selectedRegions: RegionId[];
  recentItems: ScanItem[];
  /** Compact mode for settings page (no CTA) */
  compact?: boolean;
}

export function BubbleReport({
  selectedRegions,
  recentItems,
  compact = false,
}: BubbleReportProps) {
  const allRegionIds = REGIONS.map((r) => r.id);
  const coveredSet = new Set(selectedRegions);
  const blindSpots = allRegionIds.filter((r) => !coveredSet.has(r));
  const coveragePercent = Math.round(
    (selectedRegions.length / allRegionIds.length) * 100
  );

  // Find example headlines from blind spot regions
  const blindSpotHeadlines: { region: string; headline: string }[] = [];
  for (const regionId of blindSpots) {
    if (blindSpotHeadlines.length >= 3) break;
    const item = recentItems.find((it) =>
      it.regions.some((r) => r === regionId)
    );
    if (item) {
      blindSpotHeadlines.push({
        region: REGION_LABELS[regionId] || regionId,
        headline: item.headline,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      {!compact && (
        <>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
            Your Perspective Coverage
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-3xl">
            Based on your selections, here&apos;s your coverage
          </h2>
        </>
      )}

      {/* Percentage */}
      <div className="text-center">
        <span className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-zinc-800 dark:text-zinc-100">
          {coveragePercent}%
        </span>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          of global perspectives
        </p>
      </div>

      {/* Region dot row */}
      <div className="rounded-xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
        <div className="space-y-3">
          {REGIONS.map((region) => {
            const isCovered = coveredSet.has(region.id);
            return (
              <div key={region.id} className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 flex-shrink-0 rounded-full transition-all ${
                    isCovered
                      ? "bg-amber-500 shadow-[0_0_6px_rgba(200,146,42,0.4)]"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isCovered
                      ? "font-medium text-zinc-800 dark:text-zinc-200"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {region.label}
                </span>
                {!isCovered && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-300 dark:text-zinc-600">
                    blind spot
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blind spot headlines */}
      {blindSpotHeadlines.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            What you&apos;re missing
          </p>
          {blindSpotHeadlines.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-black/[0.05] bg-white/60 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]"
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-amber-600/70 dark:text-amber-400/50">
                From {item.region}
              </p>
              <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {item.headline}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {!compact && blindSpots.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-5 text-center dark:bg-amber-950/20">
          <p className="font-[family-name:var(--font-playfair)] text-lg italic text-zinc-800 dark:text-zinc-200">
            Want the full picture?
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Albis Premium covers all 7 regions — no blind spots.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex h-11 items-center rounded-full bg-[#1a3a5c] px-8 text-sm font-medium text-white transition-colors hover:bg-[#243f66] shadow-[0_2px_12px_rgb(26,58,92,0.3)]"
          >
            Explore Premium
          </Link>
        </div>
      )}
    </div>
  );
}
