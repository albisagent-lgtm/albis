import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Albis",
  description:
    "Albis is a global news service that shows how the same events are reported differently around the world. One founder, AI-powered, radically transparent.",
};

export default function AboutPage() {
  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-2xl px-space-6 py-space-16 md:py-space-24">
        {/* Header */}
        <h1 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400">
          About Albis
        </h1>

        {/* Opening — punch harder */}
        <div className="mt-space-12 space-y-space-6 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p className="text-xl">
            The same event. Reported in the US, Iran, and Europe. Three completely different stories. Most people only ever see one.
          </p>

          <p>
            Albis is a global news service that shows how the same events are reported differently around the world. We scan sources across seven regions three times daily and surface the patterns most outlets miss — not by telling you what to think, but by showing you how others already do.
          </p>
        </div>

        {/* Mission */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            The Mission
          </h2>
          <p className="font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            Understand how information patterns shape human perception — not just what stories reach you, but how they're framed, what's missing, and who's doing the shaping. Not to expose or criticise, but to help. When you can see the information architecture around you, you make better decisions about what to believe and how to act. The goal is light, unity, and love. We observe, never judge.
          </p>
        </div>

        {/* The Vision */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            The Vision
          </h2>
          <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              News is the entry point, but the real product is a living map of how information shapes global perception. We're building instruments — the Perception Gap Index, Global Awareness Index, Information Warfare tracking, the Connections Engine — that reveal the information architecture most people never see.
            </p>
            <p>
              Nobody else combines unbiased global news with information psychology, measuring not just <em>what happened</em>, but how it's framed, what's invisible, and who's shaping the narrative. This isn't just a news site — it's an awareness system.
            </p>
            <p>
              The goal is that anyone, anywhere can see the patterns that shape their worldview. To understand how the same event becomes completely different stories depending on where you read about it. To recognise when you're only seeing part of the picture. To develop a clearer sense of what's real beneath the noise.
            </p>
          </div>
        </div>

        {/* What makes Albis different */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            What Makes Albis Different
          </h2>
          <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">3 daily scans</strong> across <strong className="text-zinc-900 dark:text-zinc-100">7 world regions</strong> and <strong className="text-zinc-900 dark:text-zinc-100">19 categories</strong> — every major story, tracked in near real-time.
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">Perception Gap Index (PGI)</strong> — measures how differently regions frame the same story. A high PGI means the world is seeing two different realities.
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">Global Awareness Index (GAI)</strong> — measures what stories are invisible to most of the world. Important events that only one or two regions are covering.
            </p>
            <p>
              <Link href="/indexes" className="text-[#c8922a] hover:underline">
                Read the full methodology →
              </Link>
            </p>
          </div>
        </div>

        {/* Radical Transparency — how it's built */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            Radical Transparency
          </h2>
          <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              A product that exposes how information shapes perception should be completely honest about how it works. So here it is:
            </p>
            <p>
              Albis is built by <strong className="text-zinc-900 dark:text-zinc-100">one person</strong> and <strong className="text-zinc-900 dark:text-zinc-100">AI</strong>. Most of the articles you read here are AI-generated — researched, written, and published by AI agents that scan global news sources, detect framing patterns, and produce analysis. A human (Harry) sets the direction, reviews the systems, and writes select pieces. The AI does the heavy lifting.
            </p>
            <p>
              We think that&apos;s worth being upfront about. If Albis exists to help people see information clearly, the least we can do is be clear about our own.
            </p>
          </div>
        </div>

        {/* Editorial team — honest version */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            Who Writes What
          </h2>
          <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">Harry Wenham</strong> — Founder. Investigative pieces, opinion, editorial direction.
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">Albis Geopolitics Desk</strong> <span className="text-zinc-400 text-base">(AI)</span> — International affairs, conflict analysis, regional perspectives.
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">Albis Tech &amp; Media Desk</strong> <span className="text-zinc-400 text-base">(AI)</span> — Technology, media literacy, educational pieces.
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">Albis Analysis</strong> <span className="text-zinc-400 text-base">(AI)</span> — Pattern detection, PGI scoring, reactive news comparisons.
            </p>
          </div>
          <p className="mt-space-4 font-[family-name:var(--font-source-serif)] text-base text-zinc-500 dark:text-zinc-400 italic">
            Every article is labelled with its author. If it says AI, it&apos;s AI. No fake bylines, no pretending.
          </p>
        </div>

        {/* Founder section */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-4">
            The Founder
          </h2>
          
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Harry Wenham
          </p>
          <p className="mt-1 font-[family-name:var(--font-source-serif)] text-lg text-zinc-500 dark:text-zinc-400">
            New Zealand
          </p>

          <div className="mt-6 space-y-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              Harry spent years in community development and cricket coaching before building Albis. He believes that information shapes perception more than most people realise, and that understanding this changes how you see the world.
            </p>
            <p>
              Albis started as a personal question: how does the same event become completely different stories depending on where you read about it? That question became a tool. The tool became a daily practice. Now it scans the world three times a day, and anyone can see the patterns for themselves.
            </p>
          </div>
        </div>

        {/* Built in 3 weeks */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            Built in 3 Weeks
          </h2>
          <p className="mb-space-6 font-[family-name:var(--font-source-serif)] text-base text-zinc-500 dark:text-zinc-400">
            Albis launched on February 14, 2026. One person and AI. Here&apos;s what happened next.
          </p>
          <div className="space-y-3 font-[family-name:var(--font-source-serif)] text-base text-zinc-700 dark:text-zinc-300">
            {[
              ["Day 1", "Concept born"],
              ["Day 5", "MVP built in one evening"],
              ["Day 10", "SEO engine + 195 country pages"],
              ["Day 14", "Perception Gap Index conceived and launched"],
              ["Day 17", "Global Awareness Index + River System"],
              ["Day 22", "860+ pages, 3 daily scans, 15+ articles/day"],
            ].map(([day, milestone]) => (
              <div key={day} className="flex gap-4">
                <span className="text-[#c8922a] font-medium whitespace-nowrap w-16 shrink-0">{day}</span>
                <span>{milestone}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Everything is free */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            Everything Is Free
          </h2>
          <p className="font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            No paywall. No premium tier. No gated content. Every scan, every article, every index — free. Albis is audience-first. We believe understanding how the world frames information shouldn&apos;t cost anything.
          </p>
        </div>

        {/* Test Your Awareness */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
            Test Your Awareness
          </h2>
          <p className="font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            Think you see the full picture? Take the Albis Quiz — a short test that reveals how much of the world&apos;s news actually reaches you.
          </p>
          <div className="mt-space-6">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 rounded-lg border border-[#c8922a]/30 px-5 py-2.5 text-sm font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/5"
            >
              Take the Quiz &rarr;
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <p className="font-[family-name:var(--font-source-serif)] text-lg text-zinc-700 dark:text-zinc-300">
            Get in touch: <a href="mailto:harry@albis.news" className="text-[#c8922a] hover:underline">harry@albis.news</a>
          </p>
        </div>
      </div>
    </main>
  );
}
