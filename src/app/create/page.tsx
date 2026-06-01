import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create — Albis",
  description: "Post a card or draft an article on Albis.",
};

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-10 text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea] md:px-6">
      <section className="mx-auto max-w-3xl">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Create</p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">Post something useful.</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          V1 is a simple prototype: post a card, share a link, or start a longer piece. Publishing will connect here next.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Post a card</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">Share a link, local update, question, weather note, event, or short thought.</p>
            <form className="mt-5 space-y-3">
              <input className="w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-white/[0.03]" placeholder="Paste a link or write a title" />
              <textarea className="min-h-32 w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-white/[0.03]" placeholder="What should people know?" />
              <button type="button" disabled className="cursor-not-allowed rounded-full bg-[#111]/40 px-5 py-2.5 text-sm font-bold text-white dark:bg-white/40 dark:text-black">Preview coming soon</button>
            </form>
          </section>

          <section className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Write an article</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">For deeper writing, reporting, essays, explainers, or expanded versions of cards.</p>
            <form className="mt-5 space-y-3">
              <input className="w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-white/[0.03]" placeholder="Article title" />
              <textarea className="min-h-32 w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none dark:border-white/[0.08] dark:bg-white/[0.03]" placeholder="Start writing…" />
              <button type="button" disabled className="cursor-not-allowed rounded-full border border-black/[0.12] px-5 py-2.5 text-sm font-bold text-zinc-400 dark:border-white/[0.12] dark:text-zinc-500">Drafts coming soon</button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
