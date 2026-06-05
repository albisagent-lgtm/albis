import type { Metadata } from "next";
import Link from "next/link";
import { UserAvatar } from "@/app/components/user-avatar";
import { authorProfileHandle, getPublicProfileStats, getSignalsByAuthorHandle, getTimeLeaderboard } from "@/lib/signals";

export const metadata: Metadata = {
  title: "Time — Albis",
  description: "How Albis Time measures useful attention created by cards, articles, and context.",
};

export const revalidate = 120;

type Props = { searchParams?: Promise<{ profile?: string }> };

function rankLabel(index: number) {
  if (index === 0) return "#1";
  if (index === 1) return "#2";
  if (index === 2) return "#3";
  return `#${index + 1}`;
}

export default async function TimePage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedHandle = authorProfileHandle(params?.profile || "");
  const [leaderboard, selectedCards] = await Promise.all([
    getTimeLeaderboard(30),
    selectedHandle ? getSignalsByAuthorHandle(selectedHandle, 36) : Promise.resolve([]),
  ]);
  const selectedStats = selectedHandle ? await getPublicProfileStats(selectedHandle, selectedCards) : null;

  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-8 text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea] md:px-6">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035] md:p-8">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Albis Time</p>
          <div className="mt-4 grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">Time</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-lg">
                Time measures useful attention created: meaningful active time other people spend with your cards, articles, sources, replies, and context.
              </p>
            </div>
            <div className="rounded-3xl border border-black/[0.08] bg-[#f8f7f4] p-5 dark:border-white/[0.08] dark:bg-white/[0.04]">
              <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">What counts</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                <li>• Active reading time on your articles and cards</li>
                <li>• Meaningful dwell time on your signals</li>
                <li>• Context and replies people spend time with</li>
                <li>• Capped and filtered so passive scrolling is not the goal</li>
              </ul>
            </div>
          </div>
        </div>

        {selectedHandle && selectedStats ? (
          <div className="mt-5 rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Selected profile</p>
                <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold">@{selectedHandle}</h2>
              </div>
              <p className="font-[family-name:var(--font-playfair)] text-5xl font-bold text-[#b58320]">{selectedStats.time_label}</p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-black/[0.035] p-4 dark:bg-white/[0.05]"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Cards</p><p className="mt-1 text-2xl font-bold">{selectedStats.cards_count}</p></div>
              <div className="rounded-2xl bg-black/[0.035] p-4 dark:bg-white/[0.05]"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Context</p><p className="mt-1 text-2xl font-bold">{selectedStats.context_count}</p></div>
              <div className="rounded-2xl bg-black/[0.035] p-4 dark:bg-white/[0.05]"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Sources</p><p className="mt-1 text-2xl font-bold">{selectedStats.sources_count}</p></div>
              <div className="rounded-2xl bg-black/[0.035] p-4 dark:bg-white/[0.05]"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Readers</p><p className="mt-1 text-2xl font-bold">{selectedStats.opened_count}</p></div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_320px]">
          <section className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035] md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Leaderboard</p>
                <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-bold">Who created useful time?</h2>
              </div>
            </div>
            <div className="mt-5 divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              {leaderboard.length ? leaderboard.map((entry, index) => (
                <Link key={entry.handle} href={`/u/${entry.handle}`} className="flex items-center gap-3 py-4 hover:text-[#b58320]">
                  <span className="w-9 shrink-0 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-400">{rankLabel(index)}</span>
                  <UserAvatar name={entry.display_name} imageUrl={entry.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-[family-name:var(--font-inter)] text-sm font-bold">{entry.display_name}</p>
                    <p className="text-xs text-zinc-400">{entry.cards_count} cards · {entry.context_count} context · {entry.opened_count} readers</p>
                  </div>
                  <span className="shrink-0 font-[family-name:var(--font-playfair)] text-2xl font-bold">{entry.time_label}</span>
                </Link>
              )) : (
                <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">Time will appear here once people spend meaningful active time with public contributions.</p>
              )}
            </div>
          </section>

          <aside className="space-y-3">
            <div className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Principle</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                Albis should not reward addiction. Time is meant to reward contribution: creating something other people genuinely use to understand the world better.
              </p>
            </div>
            <div className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Coming variations</p>
              <ul className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                <li>• Article Time</li>
                <li>• Signal Time</li>
                <li>• Context Time</li>
                <li>• Verified Time</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
