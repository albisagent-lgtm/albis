"use client";

import Link from "next/link";

export interface TaggedArticle {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  excerpt: string;
}

interface SeriesArticleFeedProps {
  tag: string;
  title: string;
  subtitle: string;
  accentColor: string;
  articles: TaggedArticle[];
}

export function SeriesArticleFeed({
  tag,
  title,
  subtitle,
  accentColor,
  articles,
}: SeriesArticleFeedProps) {
  if (articles.length === 0) {
    return (
      <section id={tag} className="mt-12 scroll-mt-24">
        <div className="rounded-2xl border border-dashed border-black/[0.07] bg-white/30 p-8 text-center dark:border-white/[0.06] dark:bg-white/[0.01]">
          <p
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            {title}
          </p>
          <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
            Articles coming soon — published 3× daily from scan data.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id={tag} className="mt-12 scroll-mt-24">
      <div className="mb-6">
        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: accentColor }}
        >
          {title}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>

      <div className="space-y-4">
        {articles.map((article) => (
          <ArticleCard
            key={article.slug}
            article={article}
            accentColor={accentColor}
          />
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link
          href={`/blog?tag=${tag}`}
          className="text-sm font-medium transition-colors hover:underline"
          style={{ color: accentColor }}
        >
          See all {tag === "unseen" ? "Unseen" : "Divided"} articles →
        </Link>
      </div>
    </section>
  );
}

function ArticleCard({
  article,
  accentColor,
}: {
  article: TaggedArticle;
  accentColor: string;
}) {
  const dateStr = new Date(article.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block rounded-xl border border-black/[0.05] bg-white/40 p-5 transition-all hover:border-black/[0.12] hover:shadow-sm dark:border-white/[0.05] dark:bg-white/[0.02] dark:hover:border-white/[0.1]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-[family-name:var(--font-playfair)] text-base font-semibold leading-snug text-[#0f0f0f] group-hover:underline dark:text-[#f0efec]">
            {article.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {article.excerpt}
          </p>
          <div className="mt-2.5 flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
            <span>{dateStr}</span>
            <span>·</span>
            <span>{article.author}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
