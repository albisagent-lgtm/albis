import { getSiteSnapshot } from "@/lib/site-snapshot";
import { getAllPosts } from "@/lib/blog";
import { normalizeRegion, detectBlindspots, CATEGORY_META, type ScanItem } from "@/lib/scan-types";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Trending",
  description: "The most covered stories across all 7 regions right now.",
};

export default async function TrendingPage() {
  const snapshot = await getSiteSnapshot();
  const allPosts = getAllPosts();

  const articleSlugs: Record<string, string> = {};
  for (const post of allPosts) {
    for (const tag of post.tags || []) {
      articleSlugs[tag.toLowerCase()] = post.slug;
    }
  }

  function findSlug(item: ScanItem): string | null {
    const headlineWords = (item.headline || "").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    let bestSlug: string | null = null;
    let bestScore = 0;
    for (const post of allPosts.slice(0, 30)) {
      const titleWords = post.title.toLowerCase().split(/\s+/);
      const overlap = headlineWords.filter((w) => titleWords.includes(w)).length;
      if (overlap > bestScore) { bestScore = overlap; bestSlug = post.slug; }
    }
    if (bestScore >= 2) return bestSlug;
    for (const tag of item.tags || []) {
      if (articleSlugs[tag.toLowerCase()]) return articleSlugs[tag.toLowerCase()];
    }
    return null;
  }

  const items = snapshot.hasScan && snapshot.items.length > 0
    ? detectBlindspots(
        [...snapshot.items].sort((a, b) => {
          // Sort by region count (most covered first), then significance
          const aRegions = [...new Set(a.regions.filter(r => r !== "global").map(r => normalizeRegion(r)))].length;
          const bRegions = [...new Set(b.regions.filter(r => r !== "global").map(r => normalizeRegion(r)))].length;
          if (bRegions !== aRegions) return bRegions - aRegions;
          const order = { high: 0, medium: 1, low: 2 };
          return (order[a.significance] ?? 1) - (order[b.significance] ?? 1);
        })
      ).slice(0, 10)
    : [];

  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        <div className="text-center">
          <p className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.25em] uppercase text-[#c8922a]">
            Trending
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
            Most covered stories
          </h1>
          <p className="mt-2 font-[family-name:var(--font-inter)] text-sm text-zinc-400 dark:text-zinc-500">
            Ranked by how many regions are covering each story
          </p>
        </div>

        {items.length > 0 ? (
          <div className="mt-12 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {items.map((item, i) => {
              const slug = findSlug(item);
              const regions = [...new Set(item.regions.filter(r => r !== "global").map(r => normalizeRegion(r)))];
              const catMeta = CATEGORY_META[item.category];

              const card = (
                <div className="group flex items-start gap-5 py-5">
                  <span className="flex-none font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#c8922a]/30">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {catMeta && (
                        <span
                          className="inline-block rounded-full px-1.5 py-0.5 font-[family-name:var(--font-inter)] text-[8px] font-semibold uppercase tracking-wider text-white"
                          style={{ backgroundColor: catMeta.accent }}
                        >
                          {catMeta.label}
                        </span>
                      )}
                      <span className="font-[family-name:var(--font-inter)] text-[10px] text-zinc-400 dark:text-zinc-500">
                        {regions.length} region{regions.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-base md:text-lg font-bold leading-snug text-[#0f0f0f] dark:text-[#f0efec] group-hover:text-[#c8922a] transition-colors">
                      {item.headline}
                    </h2>
                    {item.connection && (
                      <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {item.connection}
                      </p>
                    )}
                  </div>
                </div>
              );

              return slug ? (
                <Link key={i} href={`/lens/${slug}`} className="block">
                  {card}
                </Link>
              ) : (
                <div key={i}>{card}</div>
              );
            })}
          </div>
        ) : (
          <p className="mt-12 text-center font-[family-name:var(--font-source-serif)] text-sm text-zinc-400">
            No stories available yet today. Check back soon.
          </p>
        )}
      </div>
    </main>
  );
}
