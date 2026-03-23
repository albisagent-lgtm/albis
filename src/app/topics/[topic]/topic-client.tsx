"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { REGION_LABELS } from "@/lib/scan-types";
import { EmailCapture } from "@/app/components/email-capture";

interface ScanRow {
  date: string;
  items: Array<{
    headline: string;
    category: string;
    regions: string[];
    tags: string[];
    significance: string;
  }>;
}

interface MatchedItem {
  headline: string;
  regions: string[];
  date: string;
  significance: string;
}

function matchKeywords(
  tags: string[],
  category: string,
  keywords: string[]
): boolean {
  const lowerTags = tags.map((t) => t.toLowerCase());
  const lowerCat = category.toLowerCase();
  return keywords.some(
    (kw) =>
      lowerTags.some((t) => t.includes(kw)) || lowerCat.includes(kw)
  );
}

export function TopicDataSection({
  topicSlug,
  topicName,
  keywords,
}: {
  topicSlug: string;
  topicName: string;
  keywords: string[];
}) {
  const [items, setItems] = useState<MatchedItem[]>([]);
  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        // Fetch recent scans (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

        const { data: scans } = await supabase
          .from("scans")
          .select("date, items")
          .gte("date", dateStr)
          .order("date", { ascending: false })
          .limit(30);

        if (!scans || scans.length === 0) {
          setLoading(false);
          return;
        }

        const matched: MatchedItem[] = [];
        const regions: Record<string, number> = {};

        for (const scan of scans) {
          const scanItems = scan.items as ScanRow["items"];
          if (!Array.isArray(scanItems)) continue;

          for (const item of scanItems) {
            if (matchKeywords(item.tags || [], item.category || "", keywords)) {
              matched.push({
                headline: item.headline,
                regions: item.regions || [],
                date: scan.date,
                significance: item.significance || "medium",
              });

              for (const r of item.regions || []) {
                regions[r] = (regions[r] || 0) + 1;
              }
            }
          }
        }

        setItems(matched);
        setRegionCounts(regions);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [keywords]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-black/[0.07] bg-black/[0.02] dark:border-white/[0.06] dark:bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    // Redirect to topics index when no data available
    if (typeof window !== "undefined") {
      window.location.href = "/topics";
    }
    return (
      <section className="py-8 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Redirecting to topics…
        </p>
      </section>
    );
  }

  // Sort regions by count
  const sortedRegions = Object.entries(regionCounts)
    .filter(([r]) => r !== "global")
    .sort((a, b) => b[1] - a[1]);

  const maxCount = sortedRegions.length > 0 ? sortedRegions[0][1] : 1;

  // Group items by date for timeline
  const byDate = new Map<string, MatchedItem[]>();
  for (const item of items) {
    const existing = byDate.get(item.date) || [];
    existing.push(item);
    byDate.set(item.date, existing);
  }
  const timelineDates = Array.from(byDate.keys()).sort().reverse().slice(0, 10);

  return (
    <div className="space-y-12">
      {/* Region Coverage */}
      <section>
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          Regional Coverage
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Which regions cover {topicName} most — based on the last 30 days of scans.
        </p>
        <div className="mt-4 space-y-3">
          {sortedRegions.map(([region, count]) => (
            <div key={region} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-sm text-zinc-600 dark:text-zinc-300">
                {REGION_LABELS[region] || region}
              </span>
              <div className="flex-1">
                <div className="h-6 overflow-hidden rounded-full bg-black/[0.04] dark:bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-[#c8922a] dark:bg-[#c8922a] transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-8 text-right text-sm text-zinc-400">{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section>
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          Recent Coverage Timeline
        </h2>
        <div className="mt-4 space-y-6">
          {timelineDates.map((date) => {
            const dateItems = byDate.get(date) || [];
            return (
              <div key={date}>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-[#c8922a] dark:bg-[#c8922a]" />
                  <time className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  <span className="text-xs text-zinc-400">
                    {dateItems.length} {dateItems.length === 1 ? "story" : "stories"}
                  </span>
                </div>
                <div className="ml-6 mt-2 space-y-2 border-l border-black/[0.07] pl-4 dark:border-white/[0.06]">
                  {dateItems.slice(0, 3).map((item, i) => (
                    <div key={i} className="text-sm">
                      <p className="text-[#0f0f0f] dark:text-[#f0efec]">{item.headline}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {item.regions
                          .filter((r) => r !== "global")
                          .map((r) => REGION_LABELS[r] || r)
                          .join(", ")}
                      </p>
                    </div>
                  ))}
                  {dateItems.length > 3 && (
                    <p className="text-xs text-zinc-400">
                      +{dateItems.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats summary */}
      <section className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-black/[0.07] p-4 text-center dark:border-white/[0.06]">
          <p className="text-2xl font-bold text-[#c8922a] dark:text-[#c8922a]">{items.length}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Stories tracked</p>
        </div>
        <div className="rounded-xl border border-black/[0.07] p-4 text-center dark:border-white/[0.06]">
          <p className="text-2xl font-bold text-[#c8922a] dark:text-[#c8922a]">{sortedRegions.length}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Regions covering</p>
        </div>
        <div className="rounded-xl border border-black/[0.07] p-4 text-center dark:border-white/[0.06]">
          <p className="text-2xl font-bold text-[#c8922a] dark:text-[#c8922a]">{timelineDates.length}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Days of data</p>
        </div>
      </section>
    </div>
  );
}
