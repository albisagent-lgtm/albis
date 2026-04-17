import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { CategoryGrid } from "@/app/components/category-grid";

export const dynamic = "force-dynamic";

const CATEGORY_FILTERS = ["current-events", "geopolitics", "conflict", "governance", "health", "breaking"];

export const metadata: Metadata = {
  title: "World News — Albis",
  description:
    "Global current events, geopolitics, and conflict — scanned across 7 regions every day.",
  openGraph: {
    title: "World News — Albis",
    description:
      "Global current events, geopolitics, and conflict — scanned across 7 regions every day.",
    type: "website",
  },
};

export default async function WorldPage() {
  const posts = (await getAllPosts()).filter((p) =>
    CATEGORY_FILTERS.includes(p.category)
  );

  return (
    <main className="min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-8 border-b border-black/[0.1] pb-4 dark:border-white/[0.1]">
          <div className="flex items-baseline justify-between">
            <h1 className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
              World
            </h1>
            <span className="font-[family-name:var(--font-inter)] text-[11px] text-zinc-400 dark:text-zinc-500">
              {posts.length} article{posts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-2 max-w-xl font-[family-name:var(--font-source-serif)] text-sm text-zinc-500 dark:text-zinc-400">
            Global current events, geopolitics, and conflict — scanned across 7 regions every day.
          </p>
        </header>
        <CategoryGrid posts={posts} />
      </div>
    </main>
  );
}
