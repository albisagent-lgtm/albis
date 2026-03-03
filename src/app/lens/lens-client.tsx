"use client";

import { useState } from "react";
import Link from "next/link";

interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readingTime: number;
}

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Quick Takes", value: "quick-take" },
  { label: "Explainers", value: "explainer" },
  { label: "Breaking News", value: "reactive" },
  { label: "Deep Dives", value: "deep-dive" },
  { label: "Analysis", value: "analysis" },
  { label: "AI & Tech", value: "ai-intelligence" },
  { label: "Energy & Water", value: "clean-energy" },
  { label: "Health", value: "health-longevity" },
  { label: "Education", value: "education" },
  { label: "Information", value: "information-attention" },
];

function getContentDepthBadge(readingTime: number) {
  if (readingTime <= 3) return { label: "Quick Read", color: "text-emerald-500/80 dark:text-emerald-400/70" };
  if (readingTime >= 8) return { label: "Deep Dive", color: "text-purple-500/80 dark:text-purple-400/70" };
  return null;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getSectionTag(tags: string[]) {
  const tagMap: Record<string, string> = {
    "global-perspectives": "Global",
    "media-framing": "Analysis",
    "reactive": "Breaking News",
    "explainer": "Explainer",
    "analysis": "Analysis",
    "quick-take": "Quick Take",
    "quick-takes": "Quick Take",
    "seo": "Feature",
    "ai-intelligence": "AI & Tech",
    "clean-energy": "Energy & Water",
    "health-longevity": "Health",
    "education": "Education",
    "information-attention": "Information",
  };
  const firstTag = tags[0] || "article";
  return tagMap[firstTag] || firstTag.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function TagPills({ tags, maxTags = 3 }: { tags: string[]; maxTags?: number }) {
  const displayTags = tags.slice(0, maxTags);
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {displayTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full border border-black/[0.07] px-2 py-0.5 text-xs font-medium text-zinc-500 dark:border-white/[0.06] dark:text-zinc-400"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function matchesFilter(post: Post, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "deep-dive") return post.readingTime >= 8;
  if (filter === "quick-take") return post.tags.includes("quick-take") || post.tags.includes("quick-takes") || post.readingTime <= 3;
  if (filter === "explainer") return post.tags.includes("explainer");
  if (filter === "reactive") return post.tags.includes("reactive");
  if (filter === "analysis") return post.tags.includes("analysis") || post.tags.includes("media-framing");
  if (filter === "ai-intelligence") return post.tags.includes("ai-intelligence");
  if (filter === "clean-energy") return post.tags.includes("clean-energy");
  if (filter === "health-longevity") return post.tags.includes("health-longevity");
  if (filter === "education") return post.tags.includes("education");
  if (filter === "information-attention") return post.tags.includes("information-attention");
  return true;
}

function ArticleCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const depthBadge = getContentDepthBadge(post.readingTime);
  
  if (featured) {
    return (
      <section className="mb-20">
        <Link
          href={`/lens/${post.slug}`}
          className="group block rounded-2xl border border-black/[0.07] bg-white/30 p-8 transition-all hover:border-black/[0.12] hover:shadow-lg dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-white/[0.12] md:p-12"
        >
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full border border-[#c8922a]/30 bg-[#c8922a]/10 px-3 py-1 font-medium text-[#c8922a] dark:border-[#c8922a]/40 dark:bg-[#c8922a]/20">
              {getSectionTag(post.tags)}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">·</span>
            <span className="text-zinc-500 dark:text-zinc-400">{post.readingTime} min read</span>
            {depthBadge && (
              <>
                <span className="text-zinc-400 dark:text-zinc-500">·</span>
                <span className={`text-sm font-medium ${depthBadge.color}`}>{depthBadge.label}</span>
              </>
            )}
          </div>
          <h2 className="mt-6 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight tracking-tight group-hover:text-[#1a3a5c] dark:group-hover:text-[#7ab0d8] md:text-5xl">
            {post.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            {post.description}
          </p>
          <div className="mt-6 flex items-center gap-3 text-sm text-zinc-400 dark:text-zinc-500">
            <span>By {post.author}</span>
            <span>·</span>
            <time>{formatDate(post.date)}</time>
          </div>
          {post.tags.length > 0 && (
            <div className="mt-4">
              <TagPills tags={post.tags} maxTags={3} />
            </div>
          )}
        </Link>
      </section>
    );
  }

  return (
    <article>
      <Link
        href={`/lens/${post.slug}`}
        className="group block h-full rounded-xl border border-black/[0.07] bg-white/30 p-6 transition-all hover:border-black/[0.12] hover:shadow-md dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-white/[0.12]"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-[#c8922a]/30 bg-[#c8922a]/10 px-2.5 py-0.5 font-medium text-[#c8922a] dark:border-[#c8922a]/40 dark:bg-[#c8922a]/20">
            {getSectionTag(post.tags)}
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">{post.readingTime} min read</span>
          {depthBadge && (
            <>
              <span className="text-zinc-400 dark:text-zinc-500">·</span>
              <span className={`font-medium ${depthBadge.color}`}>{depthBadge.label}</span>
            </>
          )}
        </div>
        <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug tracking-tight group-hover:text-[#1a3a5c] dark:group-hover:text-[#7ab0d8] md:text-2xl">
          {post.title}
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {post.description}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <span>{post.author}</span>
          <span>·</span>
          <time>{formatDate(post.date)}</time>
        </div>
        {post.tags.length > 0 && (
          <div className="mt-3">
            <TagPills tags={post.tags} maxTags={3} />
          </div>
        )}
      </Link>
    </article>
  );
}

export default function LensClient({ posts }: { posts: Post[] }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredPosts = posts.filter(p => matchesFilter(p, activeFilter));
  const featuredPost = activeFilter === "all" ? filteredPosts[0] : null;
  const gridPosts = activeFilter === "all" ? filteredPosts.slice(1, 7) : filteredPosts.slice(0, 6);
  const olderPosts = activeFilter === "all" ? filteredPosts.slice(7) : filteredPosts.slice(6);

  return (
    <div>
      {/* Featured Story */}
      {featuredPost && <ArticleCard post={featuredPost} featured />}

      {/* Filter Bar */}
      <div className="mb-10 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={
              activeFilter === f.value
                ? "rounded-full bg-[#c8922a] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all"
                : "rounded-full border border-black/[0.07] bg-white/50 px-4 py-2 text-sm text-zinc-600 transition-all hover:border-[#c8922a]/30 hover:bg-[#c8922a]/10 dark:border-white/[0.07] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:text-[#c8922a]"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <p className="py-12 text-center text-zinc-400">No articles match this filter yet. More coming soon!</p>
      ) : (
        <>
          {/* Grid */}
          {gridPosts.length > 0 && (
            <section className="mb-20">
              <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
                {gridPosts.map(post => (
                  <ArticleCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* Older Stories */}
          {olderPosts.length > 0 && (
            <section>
              <h2 className="mb-8 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
                All Stories
              </h2>
              <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                {olderPosts.map(post => {
                  const depthBadge = getContentDepthBadge(post.readingTime);
                  return (
                    <article key={post.slug} className="py-5">
                      <Link href={`/lens/${post.slug}`} className="group block">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full border border-[#c8922a]/30 bg-[#c8922a]/10 px-2 py-0.5 font-medium text-[#c8922a] dark:border-[#c8922a]/40 dark:bg-[#c8922a]/20">
                            {getSectionTag(post.tags)}
                          </span>
                          <span className="text-zinc-400">·</span>
                          <span className="text-zinc-500">{post.readingTime} min read</span>
                          {depthBadge && (
                            <>
                              <span className="text-zinc-400">·</span>
                              <span className={`font-medium ${depthBadge.color}`}>{depthBadge.label}</span>
                            </>
                          )}
                          <span className="text-zinc-400">·</span>
                          <time className="text-zinc-500">{formatDate(post.date)}</time>
                        </div>
                        <h3 className="mt-2 text-lg font-semibold group-hover:text-[#1a3a5c] dark:group-hover:text-[#7ab0d8]">
                          {post.title}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{post.author}</p>
                        {post.tags.length > 0 && (
                          <div className="mt-2">
                            <TagPills tags={post.tags} maxTags={2} />
                          </div>
                        )}
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
