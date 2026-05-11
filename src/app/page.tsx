import Link from "next/link";
import { EmailCapture } from "./components/email-capture";
import { getAllPosts } from "@/lib/blog";
import { getSiteSnapshot } from "@/lib/site-snapshot";
import { buildTodayBriefing, type PublicSignalLevel } from "@/lib/todays-briefing";

export const revalidate = 300;

function SignalBadge({ label, level }: { label: string; level: PublicSignalLevel }) {
  const tone =
    level === "High"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200"
      : level === "Moderate" || level === "Medium"
        ? "border-[#c8922a]/35 bg-[#c8922a]/10 text-[#8a6417] dark:text-[#f0c15e]"
        : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {label}: {level}
    </span>
  );
}

export default async function Home() {
  const [snapshot, posts] = await Promise.all([getSiteSnapshot(), getAllPosts()]);
  const briefing = buildTodayBriefing(snapshot, posts);
  const leadStory = briefing.stories[0];
  const briefingItems = briefing.stories.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight">Albis</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">The daily public-service briefing.</p>
          </div>
          <nav className="hidden items-center gap-5 text-sm text-zinc-600 dark:text-zinc-300 sm:flex">
            <Link href="/archive" className="hover:text-[#c8922a]">Archive</Link>
            <Link href="/methodology" className="hover:text-[#c8922a]">Methodology</Link>
            <Link href="/corrections" className="hover:text-[#c8922a]">Corrections</Link>
          </nav>
        </div>
      </section>

      <section className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">
              Today&apos;s Briefing · {briefing.dateLabel}
            </p>
            <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.04] tracking-tight md:text-6xl">
              The world&apos;s news in 2 minutes — with the missing context included.
            </h1>
            <p className="mt-5 max-w-2xl font-[family-name:var(--font-source-serif)] text-xl leading-relaxed text-zinc-700 dark:text-zinc-300">
              {briefing.summary}
            </p>

            {leadStory ? (
              <div className="mt-8 border-l-4 border-[#c8922a] bg-white px-5 py-4 shadow-sm dark:bg-white/[0.04]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Lead story</p>
                <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight">
                  {leadStory.headline}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {leadStory.whyItMatters}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SignalBadge label="Attention" level={leadStory.globalAttention} />
                  <SignalBadge label="Perspective gap" level={leadStory.perspectiveGap} />
                </div>
              </div>
            ) : null}
          </div>

          <aside className="h-fit border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Daily habit</p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold">Understand more. React less.</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Get the calm morning briefing by email. Free, daily, unsubscribe anytime.
            </p>
            <div className="mt-5">
              <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="homepage-bbc-hero" />
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400 md:grid-cols-4 md:px-6">
          <div><strong className="text-zinc-900 dark:text-zinc-100">Sources</strong><br />{briefing.trust.sources}</div>
          <div><strong className="text-zinc-900 dark:text-zinc-100">Regions</strong><br />{briefing.trust.regions}</div>
          <div><strong className="text-zinc-900 dark:text-zinc-100">Languages</strong><br />{briefing.trust.languages}</div>
          <div><strong className="text-zinc-900 dark:text-zinc-100">Updated</strong><br />{briefing.trust.lastUpdated}</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">The briefing</p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">Today’s world, made clearer</h2>
          </div>
          <div className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
            {briefingItems.map((story, index) => (
              <article key={story.id} className="grid gap-3 py-5 md:grid-cols-[48px_1fr]">
                <p className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#b58320]">{String(index + 1).padStart(2, "0")}</p>
                <div>
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight">
                    {story.href ? <Link href={story.href} className="hover:text-[#b58320]">{story.headline}</Link> : story.headline}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{story.whatHappened}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400"><strong>Missing:</strong> {story.whatIsMissing}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-[#111] text-white dark:border-white/10">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3 md:px-6 md:py-14">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#f0c15e]">How Albis works</p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold">Clarify. Compare. Reveal.</h2>
          </div>
          <div className="text-sm leading-relaxed text-white/70">
            <h3 className="font-semibold text-white">Clarify what happened</h3>
            <p className="mt-2">A short briefing from a wide scan, written to reduce noise rather than amplify it.</p>
          </div>
          <div className="text-sm leading-relaxed text-white/70">
            <h3 className="font-semibold text-white">Reveal what is missing</h3>
            <p className="mt-2">Albis compares regional attention and framing so blind spots are visible before you react.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Today&apos;s signal</p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold">{briefing.perspectiveGap.headline}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{briefing.perspectiveGap.explanation}</p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">What may be missing</p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold">{briefing.attentionGap.headline}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{briefing.attentionGap.explanation}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
