import Link from "next/link";
import { EmailCapture } from "./components/email-capture";
import { getAllPosts } from "@/lib/blog";
import { getSiteSnapshot } from "@/lib/site-snapshot";
import { buildTodayBriefing, type PublicSignalLevel, type TodayBriefingStory } from "@/lib/todays-briefing";

export const revalidate = 300;

function SignalPill({ label, level }: { label: string; level: PublicSignalLevel }) {
  const tone = level === "High" ? "border-red-300/50 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200" :
    level === "Moderate" || level === "Medium" ? "border-[#c8922a]/40 bg-[#c8922a]/10 text-[#94660f] dark:text-[#f0c15e]" :
      "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone}`}>
      {label}: {level}
    </span>
  );
}

function StoryBriefingCard({ story, index }: { story: TodayBriefingStory; index: number }) {
  const content = (
    <article className="group h-full rounded-3xl border border-black/[0.07] bg-white p-5 shadow-sm transition hover:border-[#c8922a]/35 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
          {String(index + 1).padStart(2, "0")} / {story.label}
        </span>
        <span className="text-[11px] text-zinc-400">2 min</span>
      </div>
      <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight text-[#0f0f0f] transition group-hover:text-[#c8922a] dark:text-[#f0efec]">
        {story.headline}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2">
        <SignalPill label="Global Attention" level={story.globalAttention} />
        <SignalPill label="Perspective Gap" level={story.perspectiveGap} />
      </div>
      <dl className="mt-5 space-y-4 text-sm leading-relaxed">
        {[
          ["What happened", story.whatHappened],
          ["Why it matters", story.whyItMatters],
          ["How it is framed", story.howFramed],
          ["What is missing", story.whatIsMissing],
          ["Watch next", story.whatToWatch],
        ].map(([term, detail]) => (
          <div key={term}>
            <dt className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              {term}
            </dt>
            <dd className="mt-1 text-zinc-600 dark:text-zinc-300">{detail}</dd>
          </div>
        ))}
      </dl>
      {story.href ? (
        <p className="mt-5 text-sm font-semibold text-[#c8922a]">Read the source piece &rarr;</p>
      ) : null}
    </article>
  );

  return story.href ? <Link href={story.href}>{content}</Link> : content;
}

export default async function Home() {
  const [snapshot, posts] = await Promise.all([getSiteSnapshot(), getAllPosts()]);
  const briefing = buildTodayBriefing(snapshot, posts);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-14 md:px-6 md:pb-16 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.22em] text-[#c8922a]">
                Today&apos;s Briefing · {briefing.dateLabel}
              </p>
              <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                The world&apos;s news in 2 minutes.
              </h1>
              <p className="mt-5 max-w-2xl font-[family-name:var(--font-source-serif)] text-xl leading-relaxed text-zinc-600 dark:text-zinc-300">
                {briefing.summary}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Albis helps you see what happened, how it is being framed, what the world may be missing, and what signals matter next — before you react.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="#top-stories" className="inline-flex h-11 items-center rounded-full bg-[#0f0f0f] px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-[#f0efec] dark:text-[#0f0f0f]">
                  Start briefing
                </Link>
                <Link href="/archive" className="inline-flex h-11 items-center rounded-full border border-black/10 px-5 text-sm font-semibold text-zinc-700 transition hover:border-[#c8922a]/45 hover:text-[#c8922a] dark:border-white/15 dark:text-zinc-300">
                  Browse archive
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-[#c8922a]/25 bg-[#c8922a]/[0.055] p-5 dark:bg-[#c8922a]/[0.09]">
              <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
                Daily habit
              </p>
              <p className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight">
                Understand more. React less.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                Get the calm morning version by email, then use the site when you need to inspect the framing.
              </p>
              <div className="mt-5">
                <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="homepage-todays-briefing-hero" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Trust strip" className="border-b border-black/[0.06] bg-white/55 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400 md:grid-cols-4 md:px-6">
          <div><strong className="text-zinc-800 dark:text-zinc-100">Sources:</strong> {briefing.trust.sources}</div>
          <div><strong className="text-zinc-800 dark:text-zinc-100">Regions:</strong> {briefing.trust.regions}</div>
          <div><strong className="text-zinc-800 dark:text-zinc-100">Languages:</strong> {briefing.trust.languages}</div>
          <div><strong className="text-zinc-800 dark:text-zinc-100">Updated:</strong> {briefing.trust.lastUpdated}</div>
        </div>
      </section>

      <section id="top-stories" className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.2em] text-[#c8922a]">Top stories</p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">What to understand today</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Each card follows the same public-service structure: fact, importance, framing, missing context, next signal.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {briefing.stories.map((story, index) => (
            <StoryBriefingCard key={story.id} story={story} index={index} />
          ))}
        </div>
      </section>

      <section className="border-y border-black/[0.06] bg-[#101010] text-white dark:border-white/[0.08]">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-2 md:px-6 md:py-16">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.2em] text-[#f0c15e]">
              Perspective Gap of the Day
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight">
              {briefing.perspectiveGap.headline}
            </h2>
            <div className="mt-4"><SignalPill label="Perspective Gap" level={briefing.perspectiveGap.level} /></div>
            <p className="mt-4 text-sm leading-relaxed text-white/65">{briefing.perspectiveGap.explanation}</p>
            {briefing.perspectiveGap.href ? <Link href={briefing.perspectiveGap.href} className="mt-5 inline-block text-sm font-semibold text-[#f0c15e]">Inspect the gap &rarr;</Link> : null}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.2em] text-[#f0c15e]">
              What&apos;s Missing Today
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight">
              {briefing.attentionGap.headline}
            </h2>
            <div className="mt-4"><SignalPill label="Global Attention" level={briefing.attentionGap.level} /></div>
            <p className="mt-4 text-sm leading-relaxed text-white/65">{briefing.attentionGap.explanation}</p>
            <Link href="/what-am-i-missing" className="mt-5 inline-block text-sm font-semibold text-[#f0c15e]">See what&apos;s missing today &rarr;</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["How Albis works", "Trust through inspectability: what we scan, what we do not claim, and how corrections work.", "/methodology"],
            ["Public indexes", "Follow PGI, GAI, and attention signals without treating them as certainty claims.", "/indexes"],
            ["Company Daily Scan", "Translate the same global picture into private risks, sectors, regions, and watchlists.", "/company-daily-scan"],
          ].map(([title, text, href]) => (
            <Link key={href} href={href} className="rounded-3xl border border-black/[0.07] bg-white p-6 transition hover:border-[#c8922a]/35 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
              <p className="mt-5 text-sm font-semibold text-[#c8922a]">Open &rarr;</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#0f0f0f] text-white">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center md:py-24">
          <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0c15e]">Done for today</p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold">You&apos;re briefed.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/55">
            Share the briefing, subscribe for tomorrow, or inspect the archive when you want the evidence trail.
          </p>
          <div className="mx-auto mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
            <EmailCapture showSocialProof={false} showYesterdayLink={false} source="homepage-youre-briefed" />
            <Link href="/archive" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/75 hover:border-[#f0c15e]/60 hover:text-[#f0c15e]">Archive</Link>
            <Link href="/about" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/75 hover:border-[#f0c15e]/60 hover:text-[#f0c15e]">Share Albis</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
