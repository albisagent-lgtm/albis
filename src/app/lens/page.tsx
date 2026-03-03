import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { getTodayScan } from "@/lib/scan-parser";
import LensClient from "./lens-client";
import { LensTabs } from "./lens-tabs";
import { Breadcrumbs } from "@/app/components/breadcrumbs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Lens — Albis",
  description:
    "Today's headlines and in-depth articles from around the world. Perspectives, analysis, and insights from Albis.",
  openGraph: {
    title: "The Lens — Albis",
    description:
      "Today's headlines and in-depth articles from around the world.",
    url: "https://albis.news/lens",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://albis.news/lens" },
};

export default async function LensPage() {
  const allPosts = getAllPosts().map(p => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    author: p.author,
    tags: p.tags,
    readingTime: p.readingTime,
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
    <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "The Lens" },
        ]}
      />

      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-bold tracking-tight md:text-6xl">
          THE LENS
        </h1>
        <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Today&apos;s headlines and in-depth analysis from around the world.
        </p>
      </header>

      <LensTabs scanData={scanData} articles={articleRefs}>
        {allPosts.length === 0 ? (
          <p className="text-center text-zinc-400">No articles yet. Check back soon.</p>
        ) : (
          <LensClient posts={allPosts} />
        )}
      </LensTabs>
    </main>
  );
}
