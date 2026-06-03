"use client";

import { useEffect, useState } from "react";
import { trackFeedEvent } from "./feed-event-tracking";
import { followTargetId, readFollowMap, slugifyFollow, writeFollowMap, type FollowTargetType } from "./follow-utils";

type ApiFollow = {
  target_type: FollowTargetType;
  target_id: string;
  target_label: string;
};

export function FollowButton({ type, label, className = "" }: { type: FollowTargetType; label: string; className?: string }) {
  const id = followTargetId(type, label);
  const targetId = slugifyFollow(label);
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

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/follows", { cache: "no-store", signal: controller.signal })
      .then((res) => res.ok ? res.json() : null)
      .then((payload: { follows?: ApiFollow[] } | null) => {
        if (!payload?.follows?.length) return;
        const current = readFollowMap();
        for (const follow of payload.follows) {
          const followId = followTargetId(follow.target_type, follow.target_id || follow.target_label);
          current[followId] = { id: followId, type: follow.target_type, label: follow.target_label };
        }
        writeFollowMap(current);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function persistFollow(nextFollowing: boolean) {
    try {
      const res = await fetch("/api/follows", {
        method: nextFollowing ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: type, target_id: targetId, target_label: label }),
      });
      // Guests keep local-device follows; signed-in users get database persistence.
      if (res.status === 401) return;
      if (!res.ok) throw new Error("follow persistence failed");
    } catch (error) {
      console.warn("[follow-button] could not persist follow", error);
    }
  }

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
        void persistFollow(nextFollowing);
        trackFeedEvent(id, nextFollowing ? "follow" : "unfollow", { type, label });
        setFollowing(nextFollowing);
      }}
      className={className || `rounded-full px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold ${following ? "border border-[#c8922a]/50 bg-[#c8922a]/10 text-[#9b6b18] dark:text-[#f0c15e]" : "bg-[#111] text-white hover:bg-[#b58320] dark:bg-white dark:text-black"}`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
