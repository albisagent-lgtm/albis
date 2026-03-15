import type { Metadata } from "next";
import Link from "next/link";
import { getAllClustersWithArticles } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Developing Stories — Albis",
  description: "Follow evolving stories as they develop. Albis groups related articles into timelines so you can track what matters.",
  alternates: { canonical: "https://www.albis.news/stories" },
};

const STATUS_BADGE: Record<string, { label: string; icon: string; classes: string }> = {
  active: { label: "Active", icon: "🔴", classes: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  developing: { label: "Developing", icon: "🟡", classes: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  resolved: { label: "Resolved", icon: "✅", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
};

export default function StoriesIndexPage() {
  const clusters = getAllClustersWithArticles();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <header className="mb-12">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
          Story Clusters
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
          Developing Stories
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Big stories don&apos;t happen in one article. We group related coverage into timelines so you can follow what matters as it unfolds.
        </p>
      </header>

      <div className="space-y-6">
        {clusters.map((cluster) => {
          const badge = STATUS_BADGE[cluster.status] || STATUS_BADGE.developing;
          const dateRange = cluster.latestArticleDate
            ? `${new Date(cluster.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${new Date(cluster.latestArticleDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            : new Date(cluster.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

          return (
            <Link
              key={cluster.slug}
              href={`/stories/${cluster.slug}`}
              className="group block rounded-xl border border-black/[0.07] p-6 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06] dark:hover:border-[#c8922a]/30"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.classes}`}>
                  {badge.icon} {badge.label}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {cluster.articleCount} article{cluster.articleCount !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {dateRange}
                </span>
              </div>
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] group-hover:text-[#c8922a] dark:text-[#f0efec] dark:group-hover:text-[#c8922a] transition-colors">
                {cluster.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {cluster.description}
              </p>
              {cluster.regions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cluster.regions.map((r) => (
                    <span key={r} className="text-xs text-zinc-400 dark:text-zinc-500 border border-black/[0.05] dark:border-white/[0.05] rounded-full px-2 py-0.5">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {clusters.length === 0 && (
        <p className="text-center text-zinc-400 dark:text-zinc-500 py-12">
          No story clusters yet. Check back soon.
        </p>
      )}
    </main>
  );
}
