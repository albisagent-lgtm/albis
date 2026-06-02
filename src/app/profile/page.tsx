import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile — Albis",
  description: "Your Albis cards, articles, comments, saved items, and followed signals.",
};

const panels = [
  { label: "cards", title: "Your cards", text: "The posts, AI-reviewed links, weather notes, and article cards you publish into the feed." },
  { label: "conversation", title: "Comments", text: "The context, questions, corrections, and lived knowledge you add to other cards." },
  { label: "library", title: "Saved", text: "The events, reports, sources, and discussions you want to return to later." },
  { label: "network", title: "Following", text: "People, topics, sources, and Life Systems lenses you want Albis to keep close." },
];

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-6 md:py-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Profile</p>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[0.98] tracking-tight md:text-6xl lg:text-7xl">
              Your place in the feed.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Profiles make Albis collaborative: cards you publish, sources you save, conversations you join, and the people or topics you follow.
            </p>
          </div>
          <div className="rounded-3xl border border-black/[0.08] bg-[#101010] p-6 text-[#f4f1ea] dark:border-white/[0.08] dark:bg-white/[0.04]">
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#c8922a]">Public profile beta</p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">@zinfinite</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              Public contributor pages are live. Account-backed follows, saved cards, and activity depth come next.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/u/zinfinite" className="rounded-full bg-[#c8922a] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-black hover:bg-[#b58320]">View public profile</Link>
              <Link href="/create" className="rounded-full border border-white/15 px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:border-[#c8922a]/70">Create card</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {panels.map((card) => (
            <article key={card.title} className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <span className="rounded-full bg-[#c8922a]/10 px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">{card.label}</span>
              <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl font-bold">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Next up</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">From local beta to real social graph.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Today, following and saved interactions are V1. The next phase is account-backed persistence: follow counts, contributor bios, visible activity, saved libraries, and personalised feeds across devices.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/account" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">Account settings</Link>
            <Link href="/?filter=following" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">Following feed</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
