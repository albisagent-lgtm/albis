import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { CategoryGrid } from "@/app/components/category-grid";

const CATEGORY_FILTERS = ["science-space"];

export const metadata: Metadata = {
  title: "Science — Albis",
  description:
    "Science and space discoveries — breakthroughs the world is talking about, and the ones it isn't.",
  openGraph: {
    title: "Science — Albis",
    description:
      "Science and space discoveries — breakthroughs the world is talking about, and the ones it isn't.",
    type: "website",
  },
};

export default function SciencePage() {
  const posts = getAllPosts().filter((p) =>
    CATEGORY_FILTERS.includes(p.category)
  );

  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <header className="text-center">
          <p className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.25em] uppercase text-[#c8922a]">
            Category
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
            Science
          </h1>
          <p className="mx-auto mt-3 max-w-lg font-[family-name:var(--font-source-serif)] text-base text-zinc-500 dark:text-zinc-400">
            Science and space discoveries — breakthroughs the world is talking about, and the ones it isn&apos;t.
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
