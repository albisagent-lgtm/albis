"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";

type CatKey = keyof typeof CATEGORIES;

interface PostSummary {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: CategorySlug;
  readingTime: number;
}

export default function BlogFilteredList({ posts }: { posts: PostSummary[] }) {
  const [active, setActive] = useState<CatKey>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: posts.length };
    for (const p of posts) c[p.category] = (c[p.category] || 0) + 1;
    return c;
  }, [posts]);

  const filtered = useMemo(
    () => (active === "all" ? posts : posts.filter((p) => p.category === active)),
    [posts, active]
  );

  const [featuredPost, ...remainingPosts] = filtered;

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-space-2 mt-space-8 mb-space-12">
        {(Object.entries(CATEGORIES) as [CatKey, string][]).map(([slug, label]) => (
          <button
            key={slug}
            onClick={() => setActive(slug)}
            className={`px-4 py-2 rounded-full text-sm transition-colors cursor-pointer font-[family-name:var(--font-inter)] ${
              active === slug
                ? "bg-[#c8922a]/10 text-[#c8922a] font-medium"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {label}
            <span className="text-zinc-400 ml-1">({counts[slug] || 0})</span>
          </button>
        ))}
      </div>

      {/* Articles */}
      {filtered.length === 0 ? (
        <p className="text-zinc-400">No articles in this category yet.</p>
      ) : (
        <div>
          {/* Featured Article */}
          {featuredPost && (
            <article className="group mb-space-12 pb-space-12 border-b border-black/5 dark:border-white/5">
              <Link href={`/blog/${featuredPost.slug}`} className="block">
                <time className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                  {new Date(featuredPost.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <h2 className="mt-space-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-tight group-hover:text-[#c8922a] dark:group-hover:text-[#c8922a] md:text-[2rem] leading-tight">
                  {featuredPost.title}
                </h2>
                <p className="mt-space-2 text-lg text-zinc-600 leading-relaxed dark:text-zinc-300">
                  {featuredPost.description}
                </p>
                <div className="mt-space-3 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>By {featuredPost.author || "Albis Intelligence Desk"}</span>
                  <span>&middot;</span>
                  <span>{featuredPost.readingTime} min read</span>
                </div>
              </Link>
            </article>
          )}

          {/* Remaining Articles */}
          {remainingPosts.length > 0 && (
            <div>
              {remainingPosts.map((post) => (
                <article key={post.slug} className="group py-space-6 border-b border-black/5 dark:border-white/5">
                  <Link href={`/blog/${post.slug}`} className="block">
                    <time className="text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <h2 className="mt-space-2 font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug group-hover:text-[#c8922a] dark:group-hover:text-[#c8922a] md:text-2xl">
                      {post.title}
                    </h2>
                    <p className="mt-space-2 text-sm text-zinc-500 leading-relaxed dark:text-zinc-400 line-clamp-2">
                      {post.description}
                    </p>
                    <span className="mt-space-2 inline-block text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      {post.readingTime} min read
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
