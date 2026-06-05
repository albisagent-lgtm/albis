import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Albis",
  description: "Albis is a calm daily briefing and public intelligence layer built to help people see the world's news with more clarity, context, and perspective.",
};

const steps = [
  ["Scan wider", "We look across regions, languages, and sources — not just the loudest English-language headlines."],
  ["Make it clear", "We turn the noise into a short daily briefing: what happened, why it matters, and what to watch next."],
  ["Show the gaps", "We track what different places see differently — and what important stories are barely being seen at all."],
  ["Invite context", "Readers can add sources, local knowledge, questions, and lived experience so the picture gets better over time."],
];

const beliefs = [
  "Truth is bigger than one feed.",
  "Clarity should feel calm, not addictive.",
  "People closest to a story often know what headlines miss.",
  "AI should help humans understand more — not replace human judgment.",
  "The goal is light, unity, and useful understanding.",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-18">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">About Albis</p>
          <h1 className="mt-3 max-w-4xl font-[family-name:var(--font-playfair)] text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
            The world’s news, made clearer.
          </h1>
          <p className="mt-6 max-w-3xl font-[family-name:var(--font-source-serif)] text-xl leading-relaxed text-zinc-650 dark:text-zinc-300 md:text-2xl">
            Albis is a calm daily briefing and public intelligence layer for people who want to understand what is happening without getting pulled into noise, outrage, or one narrow view of the world.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full bg-[#c8922a] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]">
              Read today’s briefing
            </Link>
            <Link href="/create" className="rounded-full border border-black/[0.12] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
              Add a signal
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Why it started</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight">One simple question.</h2>
        </div>
        <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.75] text-zinc-650 dark:text-zinc-300">
          <p>
            Albis began from a feeling many people know: the news is everywhere, but understanding feels harder than ever.
          </p>
          <p>
            The same event can look completely different depending on the country, language, outlet, or platform you see it through. Some stories dominate the feed. Others matter deeply but barely appear.
          </p>
          <p>
            So we started building a different kind of news product: one that scans wider, explains simply, and helps people notice the gaps between attention, framing, and reality.
          </p>
        </div>
      </section>

      <section className="border-y border-black/[0.08] bg-white/55 dark:border-white/[0.08] dark:bg-white/[0.025]">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">The mission</p>
          <h2 className="mt-2 max-w-3xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight md:text-5xl">
            Help people see the bigger picture.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
            Albis is here to make the world feel less fragmented. Not by claiming one perfect view, but by showing more of the picture: what happened, how it is being framed, what is missing, and where people can add useful context.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">How it works</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {steps.map(([title, text]) => (
            <article key={title} className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 pb-14 md:px-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">What we are building</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">News intelligence, not noise.</h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            The daily briefing is the front door. Underneath it is a system for comparing global attention, finding perception gaps, surfacing undercovered stories, and letting people add useful signals of their own.
          </p>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">What we believe</p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {beliefs.map((belief) => <li key={belief}>• {belief}</li>)}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-black/[0.08] bg-[#101010] p-6 text-[#f4f1ea] dark:border-white/[0.08] dark:bg-white/[0.04]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#c8922a]">The direction</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">A better public understanding layer.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300">
            Albis is still early. The goal is to become a place where daily news, global perspective, human context, and useful AI work together — helping people understand more, trust more carefully, and see each other more clearly.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/read" className="rounded-full bg-[#c8922a] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]">Read more</Link>
            <Link href="/signals" className="rounded-full border border-white/15 px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white hover:border-[#c8922a]/70">Explore signals</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
