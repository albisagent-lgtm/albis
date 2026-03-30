import type { Metadata } from "next";
import { getPostsBySection } from "@/lib/blog";
import { CategoryGrid } from "@/app/components/category-grid";

export const metadata: Metadata = {
  title: "Analysis — Albis",
  description:
    "Deep analysis, explainers, media literacy guides, and weekly reports — cutting through the noise with evidence.",
  openGraph: {
    title: "Analysis — Albis",
    description:
      "Deep analysis, explainers, media literacy guides, and weekly reports — cutting through the noise with evidence.",
    type: "website",
  },
};

export default function AnalysisPage() {
  const posts = getPostsBySection("analysis");

  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <header className="text-center">
          <p className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.25em] uppercase text-[#c8922a]">
            Category
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
            Analysis
          </h1>
          <p className="mx-auto mt-3 max-w-lg font-[family-name:var(--font-source-serif)] text-base text-zinc-500 dark:text-zinc-400">
            Deep analysis, explainers, media literacy guides, and weekly reports — cutting through the noise with evidence.
          </p>
          <p className="mt-2 font-[family-name:var(--font-inter)] text-sm text-zinc-400 dark:text-zinc-500">
            {posts.length} article{posts.length !== 1 ? "s" : ""}
          </p>
        </header>
        <div className="mt-12">
          <CategoryGrid posts={posts} />
        </div>
      </div>
    </main>
  );
}
