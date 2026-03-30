"use client";

import { useState } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog";
import { getPostUrl } from "@/lib/post-url";
import { CATEGORY_META } from "@/lib/scan-types";

const PER_PAGE = 18;

function getCategoryDisplay(category: string): { label: string; accent: string } {
  if (CATEGORY_META[category]) {
    return { label: CATEGORY_META[category].label, accent: CATEGORY_META[category].accent };
  }
  return { label: category, accent: "#c8922a" };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function CategoryGrid({ posts }: { posts: BlogPost[] }) {
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);

  const visible = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  if (visible.length === 0) {
    return (
      <p className="py-12 text-center font-[family-name:var(--font-source-serif)] text-sm text-zinc-400 dark:text-zinc-500">
        No articles in this section yet. Check back soon.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-x-0 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((post, i) => {
          const { label: catLabel, accent: catAccent } = getCategoryDisplay(post.category);
          const col = i % 3;
          const href = getPostUrl(post);

          return (
            <Link
              key={post.slug}
              href={href}
              className={`group block border-t border-black/[0.08] py-5 dark:border-white/[0.08] ${
                col === 1
                  ? "lg:border-l lg:border-r lg:px-6"
                  : col === 2
                    ? "lg:pl-6"
                    : "lg:pr-6"
              }`}
            >
              <article>
                {/* Image */}
                {post.image && post.image !== "/og-image.png" && (
                  <div className="mb-3 aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Category badge */}
                <span
                  className="inline-block font-[family-name:var(--font-inter)] text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: catAccent }}
                >
                  {catLabel}
                </span>

                {/* Headline */}
                <h3 className="mt-1.5 font-[family-name:var(--font-playfair)] text-sm font-bold leading-snug text-[#0f0f0f] dark:text-[#f0efec] md:text-[15px]">
                  <span className="transition-colors group-hover:text-[#c8922a]">
                    {post.title}
                  </span>
                </h3>

                {/* Description */}
                {post.description && (
                  <p className="mt-1.5 font-[family-name:var(--font-source-serif)] text-xs leading-relaxed text-zinc-500 line-clamp-2 dark:text-zinc-400">
                    {post.description}
                  </p>
                )}

                {/* Meta: date + reading time */}
                <p className="mt-2 font-[family-name:var(--font-inter)] text-[10px] text-zinc-400 dark:text-zinc-500">
                  {formatDate(post.date)} · {post.readingTime} min read
                </p>
              </article>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setVisibleCount((c) => c + PER_PAGE)}
            className="inline-flex items-center gap-2 rounded-full border border-[#c8922a]/30 px-6 py-2.5 font-[family-name:var(--font-inter)] text-sm font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/5 dark:border-[#c8922a]/40 dark:hover:bg-[#c8922a]/10"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
