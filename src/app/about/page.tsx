import type { Metadata } from "next";
import Link from "next/link";
import { EmailCapture } from "../components/email-capture";

export const metadata: Metadata = {
  title: "About — Albis",
  description:
    "Albis is a card-first news intelligence and community context platform for truth, trust, and clarity across information cycles.",
};

const flow = [
  {
    label: "01",
    title: "Scan the cycle",
    text: "Albis reads across regions, languages, outlets, and source types so one country’s feed is not mistaken for the whole world.",
  },
  {
    label: "02",
    title: "Publish the card",
    text: "Events become clear cards and deeper reports: what happened, who is saying what, where the gaps are, and what still needs verifying.",
  },
  {
    label: "03",
    title: "Invite the people in",
    text: "Readers, contributors, local observers, journalists, researchers, and communities can add context, questions, sources, and lived knowledge.",
  },
  {
    label: "04",
    title: "Clarify together",
    text: "The goal is not outrage or one loud narrative. It is shared understanding: what is known, what is contested, and what the world is missing.",
  },
];

const principles = [
  ["Truth", "Show the event as clearly as possible, with sources, uncertainty, and competing frames visible."],
  ["Trust", "Separate human publishing, Albis scanning, AI review, source material, and community feedback so people know what they are seeing."],
  ["Clarity", "Turn noisy information cycles into calm cards, readable reports, and useful public context."],
  ["Power to the people", "Traditional media starts many cycles. People on the ground, readers, and communities help complete the picture."],
];

const lenses = ["World", "Money", "Tech", "Climate", "Health", "Governance", "Life Systems", "Weather", "Media", "Trade", "Science", "Migration"];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-end">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">About Albis</p>
            <h1 className="mt-3 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[0.98] tracking-tight md:text-6xl lg:text-7xl">
              Truth, trust, and clarity for the world’s information cycles.
            </h1>
          </div>
          <div className="rounded-3xl border border-black/[0.08] bg-[#101010] p-6 text-[#f4f1ea] shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
            <p className="font-[family-name:var(--font-source-serif)] text-xl leading-relaxed md:text-2xl">
              Albis is a card-first news intelligence platform: scanned media, sourced reports, AI-assisted review, and community context in one calm public feed.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/" className="rounded-full bg-[#c8922a] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]">Open the feed</Link>
              <Link href="/create" className="rounded-full border border-white/15 px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white hover:border-[#c8922a]/70">Add context</Link>
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
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">The idea</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight md:text-5xl">A hub where media cycles meet human knowledge.</h2>
        </div>
        <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.75] text-zinc-650 dark:text-zinc-300">
          <p>
            Traditional outlets, wire services, local media, official statements, social reports, and regional narratives all carry part of the picture. But most people only see fragments: the version surfaced by their language, location, platform, and politics.
          </p>
          <p>
            Albis starts by scanning that wider information field. Then it turns events into cards people can understand, discuss, challenge, save, share, and expand. A card can lead to a full Albis report, an external source, a community note, a weather watch, or a contributor’s article — but the card remains the shared public object.
          </p>
          <p>
            That is the heart of the project: not replacing journalism, and not pretending one feed has all truth. Albis helps people see more of the world, then lets the people closest to an event add what the cycle is missing.
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
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">Read. Open. Question. Add.</h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p><strong className="text-zinc-900 dark:text-zinc-100">Top</strong> shows what is rising through attention, opens, comments, source clicks, saves, and freshness.</p>
            <p><strong className="text-zinc-900 dark:text-zinc-100">Latest</strong> keeps the raw chronological pulse visible.</p>
            <p><strong className="text-zinc-900 dark:text-zinc-100">Following</strong> will become your chosen people, topics, sources, regions, and lenses.</p>
            <p><strong className="text-zinc-900 dark:text-zinc-100">Create</strong> lets people post a note, submit links for Albis AI review, or publish a deeper article with an automatic feed card.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Lenses</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">From headlines to life systems.</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Albis follows the normal news cycle, but also watches the systems underneath it: food, water, energy, climate, infrastructure, health, supply chains, governance, migration, and resilience.
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
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">A calmer way to keep up.</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Get the most important cards and reports without letting the homepage become an email capture page. The feed stays first; the briefing is the quiet summary.
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
