import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { getTodayScan } from "@/lib/scan-parser";
import LensClient from "./lens-client";
import { LensTabs } from "./lens-tabs";
import { Breadcrumbs } from "@/app/components/breadcrumbs";
import { ExitIntentModal } from "@/app/components/exit-intent-modal";
import { PILLARS } from "@/lib/pillars";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Lens — Albis",
  description:
    "Today's headlines and in-depth articles from around the world. Perspectives, analysis, and insights from Albis.",
  openGraph: {
    title: "The Lens — Albis",
    description:
      "Today's headlines and in-depth articles from around the world.",
    url: "https://www.albis.news/lens",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://www.albis.news/lens" },
};

interface LensPageProps {
  searchParams: { pillar?: string };
}

export default async function LensPage({ searchParams }: LensPageProps) {
  const allPosts = getAllPosts().map(p => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    author: p.author,
    tags: p.tags,
    readingTime: p.readingTime,
    category: p.category || undefined,
    image: p.image || undefined,
    pillars: p.pillars || undefined,
  }));

  const scan = await getTodayScan();

  const scanData = scan && scan.items.length > 0 ? {
    items: scan.items,
    patternOfDay: scan.patternOfDay,
    framingNote: scan.framingNote,
    displayDate: scan.displayDate,
  } : null;

  // Article refs for headline matching
  const articleRefs = allPosts.map(p => ({
    slug: p.slug,
    title: p.title,
    tags: p.tags,
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "The Lens" },
        ]}
      />

      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-5xl">
          THE LENS
        </h1>
        <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Today&apos;s headlines and in-depth analysis from around the world.
        </p>
      </header>

      <LensTabs scanData={scanData} articles={articleRefs}>
        {allPosts.length === 0 ? (
          <p className="text-center text-zinc-400">No articles yet. Check back soon.</p>
        ) : (
          <LensClient posts={allPosts} initialPillar={searchParams.pillar} />
        )}
      </LensTabs>

      <ExitIntentModal
        articles={getAllPosts().slice(0, 10).map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.description || "",
          readingTime: p.readingTime,
          category: p.category || "analysis",
        }))}
      />
    </main>
  );
}
