import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PGIClient } from "../../perception-gap/pgi-client";
import { PgiShareBar } from "./share-bar";
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

export default async function PGIPage() {
  const latest = await getLatestPgi();
  const dividedArticles = getArticlesByTag("divided", 5);

  // Fetch available dates for archive
  const supabase = createAdminClient();
  const { data: dates } = await supabase
    .from("pgi_daily")
    .select("date, daily_pgi")
    .order("date", { ascending: false })
    .limit(30);

  return (
    <>
      <PgiShareBar
        latestDate={latest?.date}
        latestPgi={latest?.pgi}
        dates={(dates || []).map((d: any) => ({ date: d.date, pgi: Number(d.daily_pgi) }))}
      />
      <PGIClient />
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
