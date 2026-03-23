import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoryClusters, getClusterWithArticles, getCluster } from "@/lib/stories";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getStoryClusters().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cluster = getCluster(slug);
  if (!cluster) return {};
  const url = `https://www.albis.news/stories/${slug}`;
  return {
    title: `${cluster.title} — Albis`,
    description: cluster.description,
    openGraph: {
      title: cluster.title,
      description: cluster.description,
      url,
      type: "website",
    },
    alternates: { canonical: url },
  };
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; classes: string }> = {
  active: { label: "Active", icon: "🔴", classes: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  developing: { label: "Developing", icon: "🟡", classes: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  resolved: { label: "Resolved", icon: "✅", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
};

export default async function StoryClusterPage({ params }: Props) {
  const { slug } = await params;
  const data = getClusterWithArticles(slug);
  if (!data) notFound();

  const status = STATUS_CONFIG[data.status] || STATUS_CONFIG.developing;

  // Related clusters
  const relatedClusters = data.relatedClusters
    .map((s) => getCluster(s))
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.title,
    description: data.description,
    url: `https://www.albis.news/stories/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "Albis",
      url: "https://www.albis.news",
    },
    hasPart: data.articles.slice(0, 20).map((a) => ({
      "@type": "NewsArticle",
      headline: a.title,
      url: `https://www.albis.news/blog/${a.slug}`,
      datePublished: a.date,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm text-zinc-400 dark:text-zinc-500">
          <Link href="/" className="hover:text-[#c8922a] transition-colors">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/stories" className="hover:text-[#c8922a] transition-colors">Stories</Link>
          <span className="mx-2">›</span>
          <span className="text-zinc-600 dark:text-zinc-300">{data.title}</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${status.classes}`}>
              {status.icon} {status.label}
            </span>
            <span className="text-sm text-zinc-400 dark:text-zinc-500">
              Since {new Date(data.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
            {data.title}
          </h1>
          <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {data.description}
          </p>
          {data.content && (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {data.content}
            </p>
          )}
          {data.regions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.regions.map((r) => (
                <span key={r} className="text-xs border border-black/[0.07] dark:border-white/[0.06] rounded-full px-2.5 py-1 text-zinc-500 dark:text-zinc-400">
                  {r}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
            {data.articleCount} article{data.articleCount !== 1 ? "s" : ""} in this story
          </div>
        </header>

        {/* Timeline */}
        <section>
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Timeline
          </h2>
          <div className="space-y-0">
            {data.articles.map((article, i) => (
              <div key={article.slug} className="relative pl-8 pb-8">
                {/* Timeline line */}
                {i < data.articles.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-px bg-black/[0.07] dark:bg-white/[0.07]" />
                )}
                {/* Timeline dot */}
                <div className="absolute left-1 top-2 h-3.5 w-3.5 rounded-full border-2 border-[#c8922a] bg-white dark:bg-[#0f0f0f]" />

                <Link
                  href={`/blog/${article.slug}`}
                  className="group block rounded-lg border border-transparent p-4 -ml-2 transition-all hover:border-black/[0.07] hover:bg-white/50 dark:hover:border-white/[0.06] dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mb-2">
                    <time>
                      {new Date(article.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                    <span>·</span>
                    <span>{article.readingTime} min read</span>
                    <span>·</span>
                    <span>{article.author}</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug text-[#0f0f0f] group-hover:text-[#c8922a] dark:text-[#f0efec] dark:group-hover:text-[#c8922a] transition-colors">
                    {article.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {article.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {article.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-xs text-zinc-400 dark:text-zinc-500 border border-black/[0.05] dark:border-white/[0.05] rounded-full px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {data.articles.length === 0 && (
            <p className="text-center text-zinc-400 dark:text-zinc-500 py-8">
              No articles matched this story cluster yet.
            </p>
          )}
        </section>

        {/* Related Clusters */}
        {relatedClusters.length > 0 && (
          <section className="mt-16 pt-8 border-t border-black/[0.07] dark:border-white/[0.07]">
            <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-4">
              Related Stories
            </h2>
            <div className="space-y-3">
              {relatedClusters.map((rc) => rc && (
                <Link
                  key={rc.slug}
                  href={`/stories/${rc.slug}`}
                  className="group block rounded-lg border border-black/[0.07] p-4 transition-all hover:border-[#c8922a]/30 dark:border-white/[0.06] dark:hover:border-[#c8922a]/30"
                >
                  <h3 className="font-semibold text-[#0f0f0f] group-hover:text-[#c8922a] dark:text-[#f0efec] dark:group-hover:text-[#c8922a] transition-colors">
                    {rc.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {rc.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back */}
        <div className="mt-12 text-center">
          <Link href="/stories" className="text-sm font-medium text-[#c8922a] hover:underline dark:text-[#c8922a]">
            ← All stories
          </Link>
        </div>
      </main>
    </>
  );
}
