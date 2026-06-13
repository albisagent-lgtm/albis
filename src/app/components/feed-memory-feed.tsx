"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveEventFeed, type LiveFeedEvent } from "./live-event-feed";
import { applyFeedMemorySignal, hasFeedMemory, readFeedMemory, scoreFeedCards, type FeedMemoryProfile, type FeedMemorySignalType } from "./feed-memory";
import { trackFeedEvent } from "./feed-event-tracking";
import { readFollowMap, type FollowTarget } from "./follow-utils";

type TuneSignal = Extract<FeedMemorySignalType, "more_like_this" | "less_like_this" | "hide">;

function cardSlug(card: LiveFeedEvent) {
  return card.cardSlug || card.articleSlug || card.id;
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
  const hasMemory = hasFeedMemory(memory);

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
      <div className="rounded-3xl border border-black/[0.08] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#b58320]">
          {mode === "undercovered" ? "Undercovered" : "For You"}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold">
          {mode === "undercovered" ? "Stories getting less attention." : "Start here."}
        </h2>
        {!hasMemory && mode === "for-you" ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Open or save a few stories and this feed will tune itself.
          </p>
        ) : null}
      </div>

      <LiveEventFeed events={recommendedCards} onTrackedEvent={refreshFromSignal} onTune={tune} />
    </div>
  );
}
