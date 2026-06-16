"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readFollowMap, type FollowTarget } from "./follow-utils";

function readFollows() {
  return Object.values(readFollowMap());
}

function describeFollows(follows: FollowTarget[]) {
  const people = follows.filter((item) => item.type === "person").length;
  const topics = follows.filter((item) => item.type === "topic").length;
  const sources = follows.filter((item) => item.type === "source").length;
  const parts = [
    people ? `${people} people` : "",
    topics ? `${topics} topics` : "",
    sources ? `${sources} sources` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No follows yet";
}

export function PeopleFollowStarter() {
  const [follows, setFollows] = useState<FollowTarget[]>([]);

  useEffect(() => {
    const sync = () => setFollows(readFollows());
    sync();
    window.addEventListener("albis-following-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("albis-following-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const count = follows.length;
  const progress = Math.min(count, 3);
  const complete = progress >= 3;
  const summary = useMemo(() => describeFollows(follows), [follows]);

  return (
    <section className="mt-5 rounded-3xl border border-[#c8922a]/25 bg-[#fff8e7] p-5 dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">
            Start your Albis loop
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">
            {complete ? "Your feed has a starting signal." : "Follow 3 people, topics, or sources to shape what comes back."}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {complete
              ? "Now add one card or source so other people can discover your context too."
              : "Pick any mix of contributors, subjects, or source types. Albis saves those preferences on this device and, when signed in, to your account."}
          </p>
          <p className="mt-2 font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            {summary}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-1.5" aria-label={`${progress} of 3 starter follows complete`}>
            {[0, 1, 2].map((step) => (
              <span
                key={step}
                className={`h-3 w-10 rounded-full ${step < progress ? "bg-[#c8922a]" : "bg-black/[0.10] dark:bg-white/[0.12]"}`}
              />
            ))}
          </div>
          <Link
            href={complete ? "/create" : "#people-list"}
            className="rounded-full bg-[#111] px-4 py-2 text-center font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black"
          >
            {complete ? "Create a card" : "Follow 3 signals"}
          </Link>
        </div>
      </div>
    </section>
  );
}
