"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveEventFeed, type LiveFeedEvent } from "./live-event-feed";
import { FollowDiscovery, type FollowSuggestion } from "./follow-discovery";
import { followTargetId, readFollowMap, slugifyFollow, type FollowTarget } from "./follow-utils";

function cardFollowIds(card: LiveFeedEvent) {
  const ids = new Set<string>();
  if (card.author && card.author !== "Albis") ids.add(followTargetId("person", card.author));
  if (card.label) ids.add(followTargetId("topic", card.label));
  for (const tag of card.tags || []) ids.add(followTargetId("topic", tag));
  if (card.source) ids.add(followTargetId("source", card.source));
  if (card.authorHref?.startsWith("/u/")) ids.add(`person:${slugifyFollow(card.authorHref.slice(3))}`);
  return ids;
}

export function FollowingFeed({ cards, suggestions }: { cards: LiveFeedEvent[]; suggestions: FollowSuggestion[] }) {
  const [follows, setFollows] = useState<Record<string, FollowTarget>>({});

  useEffect(() => {
    const sync = () => setFollows(readFollowMap());
    sync();
    window.addEventListener("albis-following-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("albis-following-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const followedCards = useMemo(() => {
    const followIds = new Set(Object.keys(follows));
    if (followIds.size === 0) return [];
    return cards.filter((card) => {
      const ids = cardFollowIds(card);
      for (const id of ids) if (followIds.has(id)) return true;
      return false;
    });
  }, [cards, follows]);

  const followedItems = Object.values(follows);

  return (
    <div className="space-y-4">
      {followedItems.length ? (
        <div className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#b58320]">Following</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">Your followed pulse</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            Showing cards that match people, topics, and sources you follow on this device.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {followedItems.map((item) => (
              <span key={item.id} className="rounded-full border border-black/[0.10] px-3 py-1 font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-500 dark:border-white/[0.10] dark:text-zinc-400">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {followedCards.length ? (
        <LiveEventFeed events={followedCards} />
      ) : (
        <FollowDiscovery suggestions={suggestions} />
      )}
    </div>
  );
}
