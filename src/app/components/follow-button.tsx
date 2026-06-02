"use client";

import { useEffect, useState } from "react";
import { trackFeedEvent } from "./feed-event-tracking";
import { followTargetId, readFollowMap, writeFollowMap, type FollowTargetType } from "./follow-utils";

export function FollowButton({ type, label, className = "" }: { type: FollowTargetType; label: string; className?: string }) {
  const id = followTargetId(type, label);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const sync = () => setFollowing(Boolean(readFollowMap()[id]));
    sync();
    window.addEventListener("albis-following-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("albis-following-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={() => {
        const current = readFollowMap();
        const nextFollowing = !current[id];
        if (nextFollowing) current[id] = { id, type, label };
        else delete current[id];
        writeFollowMap(current);
        trackFeedEvent(id, nextFollowing ? "follow" : "unfollow", { type, label });
        setFollowing(nextFollowing);
      }}
      className={className || `rounded-full px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold ${following ? "border border-[#c8922a]/50 bg-[#c8922a]/10 text-[#9b6b18] dark:text-[#f0c15e]" : "bg-[#111] text-white hover:bg-[#b58320] dark:bg-white dark:text-black"}`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
