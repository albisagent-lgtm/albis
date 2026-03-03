"use client";

import { useState } from "react";
import Link from "next/link";

interface ArticlePreview {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

const TABS = [
  { key: "all", label: "All" },
  { key: "ai", label: "AI", match: ["ai-intelligence", "ai", "tech-ai"] },
  { key: "energy", label: "Energy", match: ["clean-energy", "climate-energy"] },
  { key: "health", label: "Health", match: ["health-longevity", "health"] },
  { key: "education", label: "Education", match: ["education"] },
  { key: "information", label: "Information", match: ["information-attention", "information-awareness"] },
];

export function TabbedArticles({ articles }: { articles: ArticlePreview[] }) {
  const [active, setActive] = useState("all");

  const filtered = active === "all"
    ? articles.slice(0, 6)
    : articles
        .filter((a) => {
          const tab = TABS.find((t) => t.key === active);
          return tab?.match?.some((m) => a.tags.includes(m));
        })
        .slice(0, 6);

  return (
    <div>
      {/* Tabs */}
      <div className="mt-space-8 flex flex-wrap justify-center gap-space-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === tab.key
                ? "bg-[#c8922a] text-white"
                : "bg-black/[0.04] text-zinc-500 hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.1]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="mt-space-12 grid gap-space-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length > 0 ? (
          filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/lens/${post.slug}`}
              className="group rounded-2xl border border-black/[0.06] bg-white p-space-6 transition-all hover:border-[#c8922a]/30 hover:shadow-lg dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-[#c8922a]/30"
            >
              <time className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              <h3 className="mt-space-2 font-[family-name:var(--font-playfair)] text-base font-semibold leading-snug text-[#0f0f0f] group-hover:text-[#c8922a] dark:text-[#f0efec]">
                {post.title}
              </h3>
              <p className="mt-space-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-3">
                {post.description?.slice(0, 120)}
                {post.description && post.description.length > 120 ? "…" : ""}
              </p>
              <span className="mt-space-3 inline-block text-xs font-medium text-[#c8922a]">
                Read &rarr;
              </span>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center text-sm text-zinc-400 dark:text-zinc-500 py-space-8">
            No articles in this category yet — check back soon.
          </p>
        )}
      </div>

      {/* View all */}
      <div className="mt-space-8 text-center">
        <Link
          href="/lens"
          className="inline-flex items-center gap-space-2 rounded-full border border-[#c8922a]/30 px-space-6 py-2.5 text-sm font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/10"
        >
          View all articles &rarr;
        </Link>
      </div>
    </div>
  );
}
