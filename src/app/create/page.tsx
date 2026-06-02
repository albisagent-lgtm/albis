import type { Metadata } from "next";
import { CreateCardForm } from "./create-card-form";

export const metadata: Metadata = {
  title: "Create — Albis",
  description: "Create a card or article on Albis.",
};

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-10 text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea] md:px-6">
      <section className="mx-auto max-w-3xl">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Create</p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">Create a card.</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          Write your own card or article-style post, or submit one/multiple links for Albis AI to review into a context card.
        </p>

        <div className="mt-8 rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">What do you want to publish?</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Cards can be short notes, links, questions, events, research bundles, or early article submissions.
          </p>
          <CreateCardForm />
        </div>
      </section>
    </main>
  );
}
