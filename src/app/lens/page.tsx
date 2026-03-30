import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { getTodayScan } from "@/lib/scan-parser";
import LensClient from "./lens-client";
import { LensTabs } from "./lens-tabs";
import { Breadcrumbs } from "@/app/components/breadcrumbs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stories — Albis News",
  description:
    "Today's headlines and in-depth articles from around the world. Perspectives, analysis, and insights from Albis.",
  openGraph: {
    title: "Stories — Albis News",
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

  const articleRefs = allPosts.map(p => ({
    slug: p.slug,
    title: p.title,
    tags: p.tags,
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Latest" },
        ]}
      />

      <header className="mb-10 text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          Latest Stories
        </h1>
        <p className="mx-auto mt-3 max-w-lg font-[family-name:var(--font-source-serif)] text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Headlines, analysis, and in-depth reporting from around the world.
        </p>
      </header>

      <LensTabs scanData={scanData} articles={articleRefs}>
        {allPosts.length === 0 ? (
          <p className="py-16 text-center text-zinc-400">No articles yet. Check back soon.</p>
        ) : (
          <LensClient posts={allPosts} initialPillar={searchParams.pillar} />
        )}
      </LensTabs>
    </main>
  );
}
