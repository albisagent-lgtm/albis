import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PgiTimeline } from "@/app/components/pgi-timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PGI Trend: Perception Gap Over Time — Albis",
  description:
    "Track how the Perception Gap Index has changed over the past 30 days. See narrative divergence trends across global media.",
  openGraph: {
    title: "PGI Trend: Perception Gap Over Time — Albis",
    description:
      "Track how the Perception Gap Index has changed over the past 30 days.",
  },
};

async function getLast30Days() {
  try {
    const supabase = createAdminClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data } = await supabase
      .from("pgi_daily")
      .select("date, daily_pgi")
      .gte("date", thirtyDaysAgo)
      .order("date", { ascending: true });

    if (!data) return [];
    return data.map((d: any) => ({ date: d.date, pgi: Number(d.daily_pgi) }));
  } catch {
    return [];
  }
}

export default async function PgiTrendsPage() {
  const timelineData = await getLast30Days();

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <header className="mb-8">
          <Link
            href="/indexes/pgi"
            className="text-sm text-zinc-400 hover:text-[#c8922a] transition-colors dark:text-zinc-500"
          >
            ← Perception Gap Index
          </Link>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-semibold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
            PGI Trend
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            How narrative divergence has shifted over the past 30 days.
          </p>
        </header>

        <PgiTimeline
          data={timelineData}
          title="Perception Gap: Last 30 Days"
          height={240}
        />

        <div className="mt-8 rounded-xl border border-black/[0.06] bg-white/80 p-5 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-[#c8922a] mb-3">
            How to read this chart
          </h2>
          <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <p>
              The Perception Gap Index measures how differently global media
              regions frame the same news stories. Scores range from 0
              (identical framing) to 10 (completely divergent narratives).
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                0-4: Consensus
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                4-6: Diverging
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                6-8: Competing
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                8-10: Parallel
              </span>
            </div>
          </div>
        </div>

        <footer className="mt-10 pt-6 border-t border-black/[0.05] dark:border-white/[0.05]">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Data updated three times daily. For methodology:{" "}
            <a
              href="mailto:harry@albis.news"
              className="text-zinc-500 underline dark:text-zinc-400"
            >
              harry@albis.news
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
