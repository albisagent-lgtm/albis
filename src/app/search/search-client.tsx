"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import type { BlogPost } from "@/lib/blog";
import { StoryCard } from "@/app/components/story-card";

const PER_PAGE = 20;

function SearchInner({ posts }: { posts: BlogPost[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [input, setInput] = useState(query);
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [query, posts]);

  const visible = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
    setVisibleCount(PER_PAGE);
  }

  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <header className="text-center">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
            Search
          </h1>
          <p className="mx-auto mt-3 max-w-lg font-[family-name:var(--font-source-serif)] text-base text-zinc-500 dark:text-zinc-400">
            Find stories across all regions and categories.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 rounded-full border border-black/[0.1] bg-white px-5 py-3 font-[family-name:var(--font-inter)] text-sm text-[#0f0f0f] placeholder-zinc-400 outline-none transition-colors focus:border-[#c8922a]/50 focus:ring-2 focus:ring-[#c8922a]/10 dark:border-white/[0.1] dark:bg-[#1a1a1a] dark:text-[#f0efec] dark:placeholder-zinc-500"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-full bg-[#c8922a] px-6 py-3 font-[family-name:var(--font-inter)] text-sm font-medium text-white transition-colors hover:bg-[#b17f24]"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-12">
          {query && (
            <p className="mb-6 font-[family-name:var(--font-inter)] text-sm text-zinc-400 dark:text-zinc-500">
              {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </p>
          )}

          {visible.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((post) => (
                <StoryCard key={post.slug} variant="medium" post={post} />
              ))}
            </div>
          ) : query ? (
            <p className="text-center font-[family-name:var(--font-source-serif)] text-sm text-zinc-400 dark:text-zinc-500">
              No articles found. Try a different search term.
            </p>
          ) : null}

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
        </div>
      </div>
    </main>
  );
}

export function SearchClient({ posts }: { posts: BlogPost[] }) {
  return (
    <Suspense
      fallback={
        <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-5xl px-6 py-16 md:py-24 text-center">
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
              Search
            </h1>
          </div>
        </main>
      }
    >
      <SearchInner posts={posts} />
    </Suspense>
  );
}
