import type { Metadata } from "next";
import { CreateCardForm } from "./create-card-form";

export const metadata: Metadata = {
  title: "Create — Albis",
  description: "Create a card, AI-reviewed source card, or full article on Albis.",
};

const options = [
  ["1. Paste a link or ask a question", "Start with one useful thing you found."],
  ["2. Add a short note", "Say why it matters or what is missing."],
  ["3. Post your card", "It can appear in the feed and on your public profile."],
];

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-14">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Create</p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[0.98] tracking-tight md:text-6xl lg:text-7xl">
            Share one useful thing.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid gap-3 md:grid-cols-3">
          {options.map(([title, text]) => (
            <article key={title} className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035] md:p-6">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Create a card</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">Post your first card.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            A card can be a link, question, local note, or short context people should see.
          </p>
          <CreateCardForm />
        </div>
      </section>
    </main>
  );
}
