"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LiveEventFeed, type LiveFeedEvent } from "./live-event-feed";
import { applyFeedMemorySignal, buildFeedMemorySuggestions, feedMemorySummary, formatMemoryLabel, hasFeedMemory, readFeedMemory, scoreFeedCards, type FeedMemoryProfile, type FeedMemorySignalType, type FeedMemorySuggestion } from "./feed-memory";
import { trackFeedEvent } from "./feed-event-tracking";
import { readFollowMap, type FollowTarget } from "./follow-utils";

type TuneSignal = Extract<FeedMemorySignalType, "more_like_this" | "less_like_this" | "hide">;

function cardSlug(card: LiveFeedEvent) {
  return card.cardSlug || card.articleSlug || card.id;
}

function MemoryPillList({ title, items }: { title: string; items: Array<[string, number]> }) {
  return (
    <div>
      <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length ? items.map(([label, score]) => (
          <span key={label} className="rounded-full border border-black/[0.10] px-3 py-1 font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-600 dark:border-white/[0.10] dark:text-zinc-300">
            {formatMemoryLabel(label)} <span className="text-zinc-400">{Math.round(score)}</span>
          </span>
        )) : <span className="text-sm text-zinc-500 dark:text-zinc-400">Not enough signal yet.</span>}
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: FeedMemorySuggestion }) {
  const eyebrow = {
    read: "Read next",
    tab: "Contributor Tab",
    contribute: "Build your Tab",
    follow: "Tune the feed",
    source: "Add evidence",
  }[suggestion.kind];

  return (
    <Link href={suggestion.href} className="group flex h-full flex-col rounded-3xl border border-black/[0.08] bg-white p-4 transition hover:border-[#c8922a]/45 hover:shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
      <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">{eyebrow}</p>
      <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight transition group-hover:text-[#b58320]">{suggestion.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{suggestion.body}</p>
      {suggestion.reason ? <p className="mt-3 line-clamp-2 text-xs text-zinc-400">{suggestion.reason}</p> : null}
      <span className="mt-4 inline-flex w-fit rounded-full bg-[#111] px-3.5 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white group-hover:bg-[#b58320] dark:bg-white dark:text-black">
        {suggestion.cta}
      </span>
    </Link>
  );
}

export function FeedMemoryFeed({ cards, mode = "for-you" }: { cards: LiveFeedEvent[]; mode?: "for-you" | "undercovered" }) {
  const [memory, setMemory] = useState<FeedMemoryProfile>(() => readFeedMemory());
  const [follows, setFollows] = useState<Record<string, FollowTarget>>({});

  useEffect(() => {
    const sync = () => {
      setMemory(readFeedMemory());
      setFollows(readFollowMap());
    };
    sync();
    window.addEventListener("albis-feed-memory-change", sync);
    window.addEventListener("albis-following-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("albis-feed-memory-change", sync);
      window.removeEventListener("albis-following-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const recommendedCards = useMemo(() => scoreFeedCards(cards, memory, follows, mode).slice(0, 48), [cards, follows, memory, mode]);
  const suggestions = useMemo(() => mode === "for-you" ? buildFeedMemorySuggestions(recommendedCards, memory, follows) : [], [follows, memory, mode, recommendedCards]);
  const summary = feedMemorySummary(memory);
  const hasMemory = hasFeedMemory(memory);
  const tabSuggestion = recommendedCards.find((card) => card.authorHref)?.authorHref;

  function refreshFromSignal() {
    setMemory(readFeedMemory());
  }

  function tune(card: LiveFeedEvent, signal: TuneSignal) {
    setMemory(applyFeedMemorySignal(card, signal));
    const slug = cardSlug(card);
    if (signal === "hide") trackFeedEvent(slug, "hide", { surface: "feed-memory", tuning: signal });
    else trackFeedEvent(slug, "open", { surface: "feed-memory", event_subtype: "tuning", tuning: signal });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#b58320]">Feed Memory</p>
        <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">
          {mode === "undercovered" ? "Undercovered context" : "For You, with Feed Memory"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {mode === "undercovered"
            ? "A deterministic local sort for weather, life-systems, source-backed, and low-discussion posts. It is a context heuristic, not an objective undercoverage claim."
            : "Recommendations based on what you open, save, follow, and tune on this device. Every recommended item explains why it appears."}
        </p>
        {!hasMemory && mode === "for-you" ? (
          <p className="mt-3 rounded-2xl bg-[#c8922a]/10 px-4 py-3 text-sm text-[#7b5a1b] dark:text-[#f0c15e]">
            Start by opening, saving, or following a few topics. Albis will begin shaping this feed around what you’re trying to understand.
          </p>
        ) : null}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MemoryPillList title="Top topics" items={summary.topics} />
          <MemoryPillList title="People" items={summary.people} />
          <MemoryPillList title="Sources" items={summary.sources} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 font-[family-name:var(--font-inter)] text-xs text-zinc-500 dark:text-zinc-400">
          <span>{Object.keys(follows).length} followed items on this device</span>
          {summary.hiddenCount ? <span>· {summary.hiddenCount} hidden posts</span> : null}
          {tabSuggestion ? <Link href={`${tabSuggestion}?tab=tab`} className="font-bold text-[#9b6b18] hover:text-[#b58320] dark:text-[#f0c15e]">· Open a suggested author Tab</Link> : null}
        </div>
      </div>

      {suggestions.length ? (
        <section className="rounded-3xl border border-black/[0.08] bg-[#fffaf0] p-5 dark:border-white/[0.08] dark:bg-[#c8922a]/[0.07]" aria-label="Continue this thread">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#b58320]">Continue this thread</p>
              <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold">Useful next steps, not just more posts.</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Deterministic suggestions from your local Feed Memory, follows, and the posts already in For You.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {suggestions.map((suggestion) => <SuggestionCard key={suggestion.id} suggestion={suggestion} />)}
          </div>
        </section>
      ) : null}

      <LiveEventFeed events={recommendedCards} onTrackedEvent={refreshFromSignal} onTune={tune} />
    </div>
  );
}
