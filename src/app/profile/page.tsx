import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile — Albis",
  description: "Your Albis cards, articles, comments, and saved items.",
};

const cards = [
  { label: "cards", title: "Posts", text: "Cards and articles you create." },
  { label: "comments", title: "Comments", text: "Conversations you join." },
  { label: "saved", title: "Saved", text: "Cards you want to keep." },
];

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-10 text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea] md:px-6">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Profile</p>
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-5xl">Your profile</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
            Posts, comments, saved cards, and followed topics will live here.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/create" className="rounded-full bg-[#111] px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">Create</Link>
            <Link href="/account" className="rounded-full border border-black/[0.12] px-4 py-2 text-sm font-bold text-zinc-700 dark:border-white/[0.12] dark:text-zinc-300">Account settings</Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <span className="rounded-full bg-[#c8922a]/10 px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">{card.label}</span>
              <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{card.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
