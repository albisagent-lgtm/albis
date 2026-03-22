import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PGIClient } from "../../perception-gap/pgi-client";
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
      <div className="mx-auto max-w-6xl px-6">
        <SeriesArticleFeed
          tag="divided"
          title="Divided: Same Story, Different Realities"
          subtitle="Full articles showing how the same event looks completely different depending on where you live. Published 3× daily."
          accentColor="#4f46e5"
          articles={dividedArticles}
        />
      </div>
    </>
  );
}
