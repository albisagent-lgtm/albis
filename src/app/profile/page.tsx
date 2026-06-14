import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile — Albis",
  description: "Manage your Albis profile, cards, saved items, and account settings.",
};

const actions = [
  {
    title: "Time scorecards",
    text: "Open the public profile view with Time given and Time helped.",
    href: "/u/albis",
    cta: "View scorecards",
  },
  {
    title: "Find people",
    text: "Discover public profiles from people adding cards, sources, and useful context.",
    href: "/people",
    cta: "Explore people",
  },
  {
    title: "Create a card",
    text: "Share a useful article, source, question, correction, or piece of local context.",
    href: "/create",
    cta: "Create",
  },
  {
    title: "Account settings",
    text: "Update your name, handle, bio, and profile picture.",
    href: "/account",
    cta: "Edit profile",
  },
  {
    title: "Read the feed",
    text: "Find stories where your context, source, or lived knowledge can help others.",
    href: "/",
    cta: "Open feed",
  },
];

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] bg-white/75 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">
            Profile
          </p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[0.98] tracking-tight md:text-6xl">
            Your Albis profile.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
            A simple home for what you add to Albis: the cards you publish, the context you share, and the sources that help make a story clearer.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/u/albis"
              className="rounded-full bg-[#111] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white hover:bg-[#c8922a] hover:text-black dark:bg-[#f4f1ea] dark:text-black dark:hover:bg-[#c8922a]"
            >
              View time scorecards
            </Link>
            <Link
              href="/account"
              className="rounded-full border border-black/[0.12] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-800 hover:border-[#c8922a]/60 hover:text-[#b58320] dark:border-white/[0.14] dark:text-zinc-200"
            >
              Edit profile
            </Link>
            <Link
              href="/people"
              className="rounded-full border border-black/[0.12] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-800 hover:border-[#c8922a]/60 hover:text-[#b58320] dark:border-white/[0.14] dark:text-zinc-200"
            >
              Find people
            </Link>
            <Link
              href="/create"
              className="rounded-full border border-black/[0.12] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-800 hover:border-[#c8922a]/60 hover:text-[#b58320] dark:border-white/[0.14] dark:text-zinc-200"
            >
              Create card
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-black/[0.08] bg-white p-5 shadow-sm shadow-black/[0.02] dark:border-white/[0.08] dark:bg-white/[0.035]"
            >
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">{item.title}</h2>
              <p className="mt-2 min-h-16 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{item.text}</p>
              <Link
                href={item.href}
                className="mt-5 inline-flex rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/60 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"
              >
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-[#c8922a]/25 bg-[#fff8e7] p-6 dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#9b6b18] dark:text-[#f0c15e]">
            What counts here
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            Useful context beats noise: local knowledge, source links, corrections, eyewitness details, professional insight, thoughtful questions, and clear summaries that help others understand what is happening.
          </p>
        </div>
      </section>
    </main>
  );
}
