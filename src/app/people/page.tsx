import type { Metadata } from "next";
import Link from "next/link";
import { FollowButton } from "@/app/components/follow-button";
import { PeopleFollowStarter } from "@/app/components/people-follow-starter";
import { UserAvatar } from "@/app/components/user-avatar";
import { authorProfileHandle, getTimeLeaderboard } from "@/lib/signals";

export const metadata: Metadata = {
  title: "People — Albis",
  description: "Find public Albis profiles from people and teams contributing useful news context, sources, and media-literacy signals.",
};

export const revalidate = 120;

type Props = { searchParams?: Promise<{ q?: string }> };

function cleanQuery(value: unknown) {
  return String(value || "").trim().replace(/^@+/, "").toLowerCase().slice(0, 80);
}

export default async function PeoplePage({ searchParams }: Props) {
  const params = await searchParams;
  const q = cleanQuery(params?.q);
  const people = await getTimeLeaderboard(80);
  const filtered = q
    ? people.filter((person) => {
        const haystack = [person.handle, person.display_name].join(" ").toLowerCase();
        return haystack.includes(q);
      })
    : people;

  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-8 text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea] md:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035] md:p-8">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">People</p>
          <div className="mt-4 grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
                Find people exploring the news.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-lg">
                Discover public Albis profiles built from public cards, sources, replies, and context. Emails and private account data are never shown here.
              </p>
            </div>
            <div className="rounded-3xl border border-[#c8922a]/25 bg-[#fff8e7] p-5 dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10">
              <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">Public by contribution</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                V1 lists profiles with public contributions or public Albis activity. A fuller opt-in member directory can come next.
              </p>
            </div>
          </div>

          <form action="/people" className="mt-7 flex max-w-xl gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search people or handles…"
              className="min-w-0 flex-1 rounded-full border border-black/[0.10] bg-white px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.12] dark:bg-white/[0.06]"
            />
            <button className="rounded-full bg-[#111] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white hover:bg-[#c8922a] hover:text-black dark:bg-[#f4f1ea] dark:text-black dark:hover:bg-[#c8922a]">
              Search
            </button>
          </form>
        </div>

        <PeopleFollowStarter />

        <div id="people-list" className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length ? filtered.map((person) => {
            const handle = authorProfileHandle(person.handle) || person.handle;
            return (
              <article
                key={person.handle}
                className="group rounded-3xl border border-black/[0.08] bg-white p-5 shadow-sm shadow-black/[0.02] transition hover:border-[#c8922a]/45 hover:bg-[#fbfaf7] dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-[#c8922a]/45"
              >
                <Link href={`/u/${encodeURIComponent(handle)}`} className="block">
                  <div className="flex items-start gap-3">
                    <UserAvatar name={person.display_name} imageUrl={person.avatar_url} size="md" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-[family-name:var(--font-playfair)] text-2xl font-bold group-hover:text-[#b58320]">{person.display_name}</h2>
                      <p className="mt-0.5 truncate font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">@{handle}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-black/[0.035] p-3 dark:bg-white/[0.05]"><p className="text-lg font-bold">{person.cards_count}</p><p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">Cards</p></div>
                    <div className="rounded-2xl bg-black/[0.035] p-3 dark:bg-white/[0.05]"><p className="text-lg font-bold">{person.context_count}</p><p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">Context</p></div>
                    <div className="rounded-2xl bg-black/[0.035] p-3 dark:bg-white/[0.05]"><p className="text-lg font-bold">{person.opened_count}</p><p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">Readers</p></div>
                  </div>
                </Link>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#b58320]">{person.time_label}</span>
                  <div className="flex items-center gap-2">
                    <FollowButton type="person" label={handle} className="rounded-full bg-[#111] px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black" />
                    <Link href={`/u/${encodeURIComponent(handle)}`} className="rounded-full border border-black/[0.10] px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-500 dark:border-white/[0.10] dark:text-zinc-300">View →</Link>
                  </div>
                </div>
              </article>
            );
          }) : (
            <div className="rounded-3xl border border-black/[0.08] bg-white p-8 text-sm text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-400 md:col-span-2 lg:col-span-3">
              No public profiles matched that search yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
