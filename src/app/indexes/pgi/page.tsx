import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PGIClient } from "./pgi-client";
import { PgiShareBar } from "./share-bar";
import { PgiTimeline } from "@/app/components/pgi-timeline";
import { SeriesArticleFeed } from "@/components/SeriesArticleFeed";
import { getArticlesByTag } from "@/lib/blog/tagged";

export const dynamic = "force-dynamic";

async function getLatestPgi() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("pgi_daily")
      .select("date, daily_pgi")
      .order("date", { ascending: false })
      .limit(1);
    if (!data?.[0]) return null;
    return { date: data[0].date, pgi: Number(data[0].daily_pgi) };
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const latest = await getLatestPgi();
  const pgi = latest?.pgi ?? 5.0;
  const date = latest?.date ?? new Date().toISOString().split("T")[0];

  return {
    title: "Perception Gap Index | Albis",
    description: `Today's PGI: ${pgi.toFixed(1)}. How differently does the world understand the same events? Updated 3x daily.`,
    openGraph: {
      title: `PGI ${pgi.toFixed(1)} — Perception Gap Index | Albis`,
      description: "How differently does the world see the same stories? The PGI measures narrative distance across 7 regions.",
      images: [{ url: `/api/og/pgi?pgi=${pgi}&date=${date}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `PGI ${pgi.toFixed(1)} | Albis`,
      description: "How differently does the world see the same stories?",
      images: [`/api/og/pgi?pgi=${pgi}&date=${date}`],
    },
  };
}

async function getAllReports() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("pgi_signature_pieces")
      .select("date, daily_pgi, tier, word_count, story_count, region_count")
      .order("date", { ascending: false });
    if (!data) return [];
    return data.map((d: any) => ({
      date: d.date,
      pgi: Number(d.daily_pgi),
      tier: d.tier,
      wordCount: d.word_count,
      storyCount: d.story_count,
      regionCount: d.region_count,
    }));
  } catch {
    return [];
  }
}

function getTierColor(pgi: number) {
  if (pgi <= 3) return "#22c55e";
  if (pgi <= 5) return "#71717a";
  if (pgi <= 7) return "#f59e0b";
  return "#ef4444";
}

async function getLast14Days() {
  try {
    const supabase = createAdminClient();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const { data } = await supabase
      .from("pgi_daily")
      .select("date, daily_pgi")
      .gte("date", fourteenDaysAgo)
      .order("date", { ascending: true });
    if (!data) return [];
    return data.map((d: any) => ({ date: d.date, pgi: Number(d.daily_pgi) }));
  } catch {
    return [];
  }
}

export default async function PGIPage() {
  const latest = await getLatestPgi();
  const timelineData = await getLast14Days();
  const dividedArticles = getArticlesByTag("divided", 5);
  const allReports = await getAllReports();

  // Fetch available dates for archive
  const supabase = createAdminClient();
  const { data: dates } = await supabase
    .from("pgi_daily")
    .select("date, daily_pgi")
    .order("date", { ascending: false })
    .limit(30);

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": "https://www.albis.news/indexes/pgi",
    name: "Perception Gap Index (PGI)",
    alternateName: "PGI",
    description:
      "The Perception Gap Index measures narrative divergence in media coverage across global regions. Updated three times daily by scanning media in 9 languages across 60+ countries.",
    url: "https://www.albis.news/indexes/pgi",
    creator: { "@type": "Organization", name: "Albis", url: "https://www.albis.news" },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    updateFrequency: "Three times daily",
    measurementTechnique:
      "Computational analysis of media framing across global news sources in 9 languages",
    variableMeasured: "Narrative divergence between global media ecosystems",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <PgiShareBar
        latestDate={latest?.date}
        latestPgi={latest?.pgi}
        dates={(dates || []).map((d: any) => ({ date: d.date, pgi: Number(d.daily_pgi) }))}
      />
      <PGIClient />
      {timelineData.length > 0 && (
        <div className="mx-auto max-w-3xl px-6 py-8">
          <PgiTimeline
            data={timelineData}
            title="PGI: Last 14 Days"
            height={150}
          />
          <div className="mt-3 text-right">
            <Link
              href="/indexes/pgi/trends"
              className="text-xs font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors"
            >
              View full 30-day trend →
            </Link>
          </div>
        </div>
      )}
      {/* ── Daily Reports Archive ── */}
      {allReports.length > 0 && (
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="mb-6">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-[#c8922a]">
              Archive
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold">
              Daily PGI Reports
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Every day&apos;s full analysis — how differently the world understood the same events.
            </p>
          </div>
          <div className="space-y-3">
            {allReports.map((report) => {
              const d = new Date(report.date + "T00:00:00");
              const dateLabel = d.toLocaleDateString("en-NZ", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              return (
                <Link
                  key={report.date}
                  href={`/indexes/pgi/${report.date}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-black/[0.06] bg-white/50 p-4 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {dateLabel}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                      <span
                        className="font-medium"
                        style={{ color: getTierColor(report.pgi) }}
                      >
                        {report.tier}
                      </span>
                      {report.storyCount && (
                        <>
                          <span>·</span>
                          <span>{report.storyCount} stories</span>
                        </>
                      )}
                      {report.wordCount && (
                        <>
                          <span>·</span>
                          <span>{Math.ceil(report.wordCount / 250)} min read</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className="text-2xl font-bold tabular-nums font-[family-name:var(--font-geist-mono)]"
                      style={{ color: getTierColor(report.pgi) }}
                    >
                      {report.pgi.toFixed(1)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6">
        <SeriesArticleFeed
          tag="divided"
          title="Divided: Same Story, Different Realities"
          subtitle="Full articles showing how the same event looks completely different depending on where you live. Published 3× daily."
          accentColor="#c8922a"
          articles={dividedArticles}
        />
      </div>
    </>
  );
}
