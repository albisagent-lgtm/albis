"use client";

import { FollowButton } from "./follow-button";

export type FollowSuggestion = {
  id: string;
  label: string;
  title: string;
  description: string;
  type: "person" | "topic" | "source";
};

function typeLabel(type: FollowSuggestion["type"]) {
  if (type === "person") return "person";
  if (type === "topic") return "topic";
  return "source";
}

export function FollowDiscovery({ suggestions }: { suggestions: FollowSuggestion[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#b58320]">Following</p>
        <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">Find people, topics, and sources</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Start by following the voices and subjects you want in your feed. These follows are being recorded as preference signals while the personalised feed is connected.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {suggestions.map((item) => (
            <article key={item.id} className="rounded-3xl border border-black/[0.08] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">{typeLabel(item.type)}</p>
                  <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{item.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <FollowButton type={item.type} label={item.label} />
              </div>
            </article>
        ))}
      </div>
    </div>
  );
}
