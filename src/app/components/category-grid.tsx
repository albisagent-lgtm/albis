"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/blog";
import { StoryCard } from "./story-card";

const PER_PAGE = 20;

export function CategoryGrid({ posts }: { posts: BlogPost[] }) {
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);

  const visible = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <>
      {visible.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((post) => (
            <StoryCard key={post.slug} variant="medium" post={post} />
          ))}
        </div>
      ) : (
        <p className="text-center font-[family-name:var(--font-source-serif)] text-sm text-zinc-400 dark:text-zinc-500">
          No articles in this category yet. Check back soon.
        </p>
      )}

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
