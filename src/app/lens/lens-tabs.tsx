"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type ScanItem,
  CATEGORY_META,
  hasFramingWatch,
} from "@/lib/scan-types";

// ── Keyword matching ──────────────────────────────────────────────

interface ArticleRef {
  slug: string;
  title: string;
  tags: string[];
}

// Stop words to ignore in matching
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "has", "have", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "its", "it", "this", "that", "as",
  "not", "no", "so", "if", "up", "out", "just", "about", "into", "over",
  "new", "how", "why", "what", "when", "who", "all", "more", "most",
  "than", "after", "before", "now", "says", "said",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function findMatchingArticle(headline: string, connection: string | undefined, articles: ArticleRef[]): ArticleRef | null {
  const headlineWords = extractKeywords(headline);
  const connectionWords = connection ? extractKeywords(connection) : [];
  const allWords = [...headlineWords, ...connectionWords];

  if (allWords.length === 0) return null;

  let bestMatch: ArticleRef | null = null;
  let bestScore = 0;

  for (const article of articles) {
    const titleWords = extractKeywords(article.title);
    const tagWords = article.tags.flatMap((t) => t.split("-"));

    let score = 0;

    // Title word overlap (weighted heavily)
    for (const w of allWords) {
      if (titleWords.some((tw) => tw === w || tw.includes(w) || w.includes(tw))) {
        score += 3;
      }
    }

    // Tag overlap
    for (const w of allWords) {
      if (tagWords.some((tw) => tw === w)) {
        score += 1;
      }
    }

    // Normalize by headline length to avoid bias toward long headlines
    const normalizedScore = score / Math.max(headlineWords.length, 1);

    if (normalizedScore > bestScore && normalizedScore >= 2) {
      bestScore = normalizedScore;
      bestMatch = article;
    }
  }

  return bestMatch;
}

// ── PGI Badge Component ───────────────────────────────────────────

function PGIBadge({ score }: { score: number }) {
  const getColorClasses = (score: number) => {
    if (score <= 3) {
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
    } else if (score <= 6) {
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
    } else {
      return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400";
    }
  };

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getColorClasses(score)}`}>
      PGI {score.toFixed(1)}
    </span>
  );
}

// ── Information Pulse Card ────────────────────────────────────────

interface InformationPulseProps {
  items: ScanItem[];
}

function InformationPulseCard({ items }: InformationPulseProps) {
  const itemsWithPGI = items.filter(item => item.perception_gap != null && item.perception_gap > 0);
  
  if (itemsWithPGI.length === 0) return null;

  const avgPGI = itemsWithPGI.reduce((sum, item) => sum + (item.perception_gap || 0), 0) / itemsWithPGI.length;
  const highestPGI = itemsWithPGI.reduce((highest, item) => 
    (item.perception_gap || 0) > (highest.perception_gap || 0) ? item : highest
  );
  
  const regionSet = new Set(items.flatMap(item => item.regions.filter(r => r !== "global")));
  const regionCount = regionSet.size;

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white/50 p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c8922a]">
        Today's Information Pulse
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Average PGI</p>
          <p className="text-2xl font-[family-name:var(--font-playfair)] font-semibold text-zinc-900 dark:text-zinc-100">
            {avgPGI.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Highest Gap</p>
          <p className="text-sm font-[family-name:var(--font-source-serif)] font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2">
            {highestPGI.headline}
          </p>
          <p className="text-xs text-[#c8922a] font-semibold">PGI {(highestPGI.perception_gap || 0).toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Coverage</p>
          <p className="text-lg font-[family-name:var(--font-playfair)] font-semibold text-zinc-900 dark:text-zinc-100">
            {items.length} stories
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{regionCount} regions</p>
        </div>
      </div>
    </div>
  );
}

// ── Headlines View ────────────────────────────────────────────────

interface HeadlinesViewProps {
  items: ScanItem[];
  articles: ArticleRef[];
  patternOfDay?: { title?: string; body: string } | null;
  framingNote?: string | null;
  displayDate?: string;
}

function HeadlinesView({ items, articles, patternOfDay, framingNote, displayDate }: HeadlinesViewProps) {
  if (!items || items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-zinc-400 dark:text-zinc-500">No headlines yet today. Check back after the morning scan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date + Live badge */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
        {displayDate && (
          <span className="text-sm text-zinc-400 dark:text-zinc-500">{displayDate}</span>
        )}
      </div>

      {/* Information Pulse Card */}
      <InformationPulseCard items={items} />

      {/* Pattern of the Day */}
      {patternOfDay && (
        <div className="rounded-2xl border border-[#c8922a]/20 bg-[#c8922a]/5 p-6 dark:bg-[#c8922a]/[0.06]">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c8922a]">
            Pattern of the Day
          </p>
          {patternOfDay.title && (
            <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-xl font-semibold italic leading-snug text-[#0f0f0f] md:text-2xl dark:text-[#f0efec]">
              {patternOfDay.title}
            </h3>
          )}
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
            {patternOfDay.body}
          </p>
        </div>
      )}

      {/* Framing Watch */}
      {framingNote && (
        <div className="rounded-2xl border border-rose-200/30 bg-rose-50/50 p-6 dark:border-rose-500/10 dark:bg-rose-950/10">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-rose-600 dark:text-rose-400">
            Framing Watch
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
            {framingNote}
          </p>
        </div>
      )}

      {/* Story Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item, i) => {
          const match = findMatchingArticle(item.headline, item.connection, articles);

          const card = (
            <div
              key={i}
              className={`rounded-xl border border-black/[0.06] bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] ${
                match
                  ? "cursor-pointer transition-all hover:border-[#c8922a]/30 hover:shadow-sm group"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  item.significance === "high"
                    ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                    : item.significance === "medium"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}>
                  {item.significance}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {CATEGORY_META[item.category]?.label || item.category}
                </span>
                {hasFramingWatch(item) && (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-500 dark:bg-rose-950/30 dark:text-rose-400">
                    Framing
                  </span>
                )}
                {item.perception_gap != null && item.perception_gap > 0 && (
                  <PGIBadge score={item.perception_gap} />
                )}
                {match && (
                  <span className="ml-auto text-xs text-zinc-300 group-hover:text-[#c8922a] dark:text-zinc-600 dark:group-hover:text-[#c8922a] transition-colors">
                    →
                  </span>
                )}
              </div>
              <h4 className={`mt-3 text-sm font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec] ${
                match ? "group-hover:text-[#c8922a]" : ""
              }`}>
                {item.headline}
              </h4>
              {item.connection && (
                <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {item.connection}
                </p>
              )}
              {match && (
                <p className="mt-2 text-xs text-zinc-300 group-hover:text-[#c8922a]/60 dark:text-zinc-600 transition-colors">
                  Read more →
                </p>
              )}
            </div>
          );

          if (match) {
            return (
              <Link key={i} href={`/lens/${match.slug}`} className="block">
                {card}
              </Link>
            );
          }
          return card;
        })}
      </div>
    </div>
  );
}

// ── Lens Tabs ─────────────────────────────────────────────────────

interface LensTabsProps {
  scanData: {
    items: ScanItem[];
    patternOfDay?: { title?: string; body: string } | null;
    framingNote?: string | null;
    displayDate?: string;
  } | null;
  articles: ArticleRef[];
  children: React.ReactNode;
}

export function LensTabs({ scanData, articles, children }: LensTabsProps) {
  const [tab, setTab] = useState<"headlines" | "articles">("articles");

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-10 flex justify-center gap-1 rounded-full border border-black/[0.07] bg-white/50 p-1 dark:border-white/[0.07] dark:bg-white/[0.03] w-fit mx-auto">
        <button
          onClick={() => setTab("headlines")}
          className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
            tab === "headlines"
              ? "bg-[#c8922a] text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Headlines
        </button>
        <button
          onClick={() => setTab("articles")}
          className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
            tab === "articles"
              ? "bg-[#c8922a] text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Articles
        </button>
      </div>

      {/* Content */}
      {tab === "headlines" ? (
        <HeadlinesView
          items={scanData?.items || []}
          articles={articles}
          patternOfDay={scanData?.patternOfDay}
          framingNote={scanData?.framingNote}
          displayDate={scanData?.displayDate}
        />
      ) : (
        children
      )}
    </div>
  );
}
