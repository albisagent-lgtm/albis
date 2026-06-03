import type { Metadata } from "next";
import Link from "next/link";
import { EmailCapture } from "../components/email-capture";

export const metadata: Metadata = {
  title: "About — Albis",
  description:
    "Albis helps everyday people understand the world’s news with a calm daily briefing, wider perspectives, and clear context about what might be missing.",
};

const flow = [
  {
    label: "01",
    title: "We look wider",
    text: "Most people only see the news closest to them. Albis looks across countries, languages, and sources so the world feels less narrow.",
  },
  {
    label: "02",
    title: "We make it simple",
    text: "We turn the noise into a clear daily briefing: what happened, why it matters, and what to watch next.",
  },
  {
    label: "03",
    title: "We show what’s missing",
    text: "Some stories are everywhere. Others are barely seen. Albis helps reveal the gaps, not just the biggest headlines.",
  },
  {
    label: "04",
    title: "We invite people in",
    text: "The people closest to a story often know what a headline misses. Albis is built for context, questions, and shared understanding.",
  },
];

const principles = [
  ["For everyday people", "You should not need to be a news expert to understand what is happening in the world."],
  ["Less noise", "No outrage machine. No endless scrolling. Just a calmer way to keep up."],
  ["More perspective", "A story can look different depending on where it is told from. We help you see more than one angle."],
  ["Built with people", "Albis is not here to replace journalists or communities. It is here to help connect the picture."],
];

const lenses = ["World", "Money", "Tech", "Climate", "Health", "Food", "Water", "Energy", "Migration", "Science", "Communities", "Daily life"];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-end">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">About Albis</p>
            <h1 className="mt-3 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[0.98] tracking-tight md:text-6xl lg:text-7xl">
              A calmer way to understand the world.
            </h1>
          </div>
          <div className="rounded-3xl border border-black/[0.08] bg-[#101010] p-6 text-[#f4f1ea] shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
            <p className="font-[family-name:var(--font-source-serif)] text-xl leading-relaxed md:text-2xl">
              Albis exists because the news can feel overwhelming, divided, and hard to trust. We help you see what happened, why it matters, and what other parts of the world may be seeing differently.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/" className="rounded-full bg-[#c8922a] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]">Read today’s briefing</Link>
              <Link href="/create" className="rounded-full border border-white/15 px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white hover:border-[#c8922a]/70">Share context</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-4 md:grid-cols-4">
          {flow.map((item) => (
            <article key={item.title} className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">{item.label}</p>
              <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Our mission</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight md:text-5xl">Help people see the bigger picture.</h2>
        </div>
        <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.75] text-zinc-650 dark:text-zinc-300">
          <p>
            The world is more connected than ever, but the news often makes it feel broken into separate realities. What you see depends on your country, language, platform, and the sources around you.
          </p>
          <p>
            Albis was created to make that picture easier to understand. We gather the important stories, compare how they are being covered, and explain them in plain language.
          </p>
          <p>
            The mission is simple: less noise, more clarity, and a better way for people to understand each other. Not one perfect version of the truth — but a wider, calmer view of what is happening.
          </p>
        </div>
      </section>

      <section className="border-y border-black/[0.08] bg-white/55 dark:border-white/[0.08] dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-4 md:px-6">
          {principles.map(([title, text]) => (
            <article key={title}>
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">How to use it</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">Start with the daily briefing.</h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p><strong className="text-zinc-900 dark:text-zinc-100">Read the briefing</strong> for a quick, calm summary of what matters today.</p>
            <p><strong className="text-zinc-900 dark:text-zinc-100">Open a story</strong> when you want more context, sources, or different perspectives.</p>
            <p><strong className="text-zinc-900 dark:text-zinc-100">Notice the gaps</strong> between what is being covered loudly and what is being missed.</p>
            <p><strong className="text-zinc-900 dark:text-zinc-100">Share context</strong> if you have useful knowledge, a source, or lived experience to add.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">What we follow</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">The headlines — and the things underneath them.</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Albis follows the big stories, but also the everyday systems that shape people’s lives: food, water, energy, health, climate, migration, technology, and community resilience.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {lenses.map((lens) => (
              <span key={lens} className="rounded-full border border-black/[0.08] px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-500 dark:border-white/[0.08] dark:text-zinc-300">{lens}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-black/[0.08] bg-[#101010] p-6 text-[#f4f1ea] dark:border-white/[0.08] dark:bg-white/[0.04]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#c8922a]">Daily briefing</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">Keep up without getting pulled under.</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Get a short, clear briefing each day — the main stories, the missing angles, and the wider context in plain language.
          </p>
          <div className="mt-5"><EmailCapture variant="hero" showSocialProof={true} showYesterdayLink={false} source="about" /></div>
        </div>
        <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Corrections, press, and partnerships: <a href="mailto:harry@albis.news" className="font-semibold text-[#b58320] hover:underline">harry@albis.news</a>
        </p>
      </section>
    </main>
  );
}
