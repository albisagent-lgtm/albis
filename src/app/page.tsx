import Link from "next/link";
import {
  getTodayScan,
  hasFramingWatch,
  hasBlindspot,
  REGION_LABELS,
  type ScanItem,
} from "@/lib/scan-parser";
import { EmailCapture } from "./components/email-capture";

export const dynamic = "force-dynamic";

// ── Flag helpers ────────────────────────────────────────────────
const REGION_FLAGS: Record<string, string> = {
  "western-world": "🇺🇸",
  west: "🇺🇸",
  "east-se-asia": "🇨🇳",
  "south-asia": "🇮🇳",
  "middle-east": "🕌",
  africa: "🌍",
  "eastern-europe": "🇷🇺",
  "e-europe": "🇷🇺",
  "latin-america": "🌎",
  global: "🌐",
};

// ── Page ─────────────────────────────────────────────────────────
export default async function Home() {
  const scan = await getTodayScan();

  // Find the best story for the live comparison
  const perspectiveStory = scan?.items
    .filter((i) => i.regions.length >= 2 && i.connection)
    .sort((a, b) => {
      const sigOrder = { high: 3, medium: 2, low: 1 };
      return (sigOrder[b.significance] || 0) - (sigOrder[a.significance] || 0);
    })[0] || null;

  // Parse framing watch from raw markdown for richer perspective data
  const framingData = scan?.rawMarkdown ? parseFramingWatch(scan.rawMarkdown) : null;

  return (
    <main className="overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex flex-col justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-950/15 dark:via-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f8f7f4] to-transparent dark:from-[#0f0f0f]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/30 to-transparent" />

        <div className="relative mx-auto w-full max-w-4xl px-6 py-20 md:py-28">
          {/* Headline block */}
          <div className="text-center">
            <h1 className="animate-fade-in-up font-[family-name:var(--font-playfair)] text-6xl font-semibold leading-tight tracking-tight text-[#0f0f0f] md:text-7xl lg:text-8xl dark:text-[#f0efec]">
              Same story. Every perspective.
            </h1>

            <p className="animate-fade-in-up delay-100 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] md:text-xl dark:text-zinc-400">
              One story. Seven regions. Every perspective — side by side.
            </p>

            {/* Email capture */}
            <div className="animate-fade-in-up delay-200 mt-10">
              <EmailCapture variant="hero" />
            </div>

            {/* Trust signal */}
            <p className="animate-fade-in-up delay-250 mt-4 text-center text-xs text-zinc-500 opacity-70 dark:text-zinc-500">
              Tracking 50,000+ sources across 60 countries · Updated 3× daily
            </p>

            {/* Secondary CTA */}
            <div className="animate-fade-in-up delay-300 mt-4">
              <Link
                href="/compare"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 opacity-60 hover:text-[#c8922a] hover:opacity-100 transition-all"
              >
                See today&apos;s comparison
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* ── LIVE COMPARISON WIDGET ──────────────────────── */}
          <div className="animate-fade-in-up delay-300 mt-14">
            <LiveComparisonWidget
              story={perspectiveStory}
              framingData={framingData}
              scan={scan}
            />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ─────────────────────────────────── */}
      <section className="relative bg-[#0f0f0f] py-8 md:py-10">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-400">
            <span>
              <span className="font-semibold text-white">7</span> regions
            </span>
            <span className="hidden sm:inline text-zinc-700">·</span>
            <span>
              <span className="font-semibold text-white">60+</span> countries
            </span>
            <span className="hidden sm:inline text-zinc-700">·</span>
            <span>
              <span className="font-semibold text-white">12</span> categories
            </span>
            <span className="hidden sm:inline text-zinc-700">·</span>
            <span>
              Updated <span className="font-semibold text-white">3× daily</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── OUR MISSION ────────────────────────────────────── */}
      <section className="relative bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-28">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-[#c8922a]">
            Our Mission
          </p>
          <h2 className="mb-8 text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white md:text-4xl">
            What if you could see<br className="hidden sm:block" />{" "}
            what everyone else sees?
          </h2>
          <div className="mx-auto max-w-2xl space-y-5 text-base leading-relaxed text-[#555] dark:text-zinc-400 md:text-lg">
            <p>
              A farmer in Kenya reads about a trade deal and sees survival. A banker in London 
              reads the same story and sees opportunity. A mother in São Paulo reads it and sees 
              her children&apos;s future.
            </p>
            <p>
              Same event. Same day. Three completely different worlds.
            </p>
            <p>
              That&apos;s not a problem. That&apos;s just reality — one we rarely get to see. Because 
              the news you&apos;re shown has already been filtered. An algorithm chose it. An editor 
              framed it. And the perspectives that didn&apos;t match? They disappeared before they 
              reached you.
            </p>
            <p>
              Albis brings them back. We show you the same story from seven regions around the 
              world — not to overwhelm you, but to complete the picture. No judgement. No sides. 
              Just clarity.
            </p>
            <p>
              We believe the world makes more sense when you can see all of it. And that 
              understanding — real understanding — is where 
              <span className="font-semibold text-[#1a1a1a] dark:text-white"> peace begins</span>.
            </p>
          </div>

          {/* Values */}
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <div className="group">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#c8922a]/10 text-2xl transition-transform group-hover:scale-110">
                🪟
              </div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-white">
                Every Perspective
              </h3>
              <p className="text-sm leading-relaxed text-[#666] dark:text-zinc-500">
                One story, seven regions, the full picture.
              </p>
            </div>
            <div className="group">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#c8922a]/10 text-2xl transition-transform group-hover:scale-110">
                ✨
              </div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-white">
                No Agenda
              </h3>
              <p className="text-sm leading-relaxed text-[#666] dark:text-zinc-500">
                We observe, never judge, and trust you to think for yourself.
              </p>
            </div>
            <div className="group">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#c8922a]/10 text-2xl transition-transform group-hover:scale-110">
                🌍
              </div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-white">
                Clarity &amp; Light
              </h3>
              <p className="text-sm leading-relaxed text-[#666] dark:text-zinc-500">
                Not more outrage, not more fear — just a clearer view of the world we share.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="relative bg-[#f2f0eb] py-20 dark:bg-[#111111] md:py-28">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-center text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            How it works
          </p>
          <h2 className="mt-4 text-center font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#0f0f0f] md:text-4xl dark:text-[#f0efec]">
            The full picture in 2 minutes
          </h2>

          <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
            <HowItWorksStep
              icon="🔍"
              title="We scan"
              description="AI reads 50,000+ sources across 60 countries, every day."
            />
            <HowItWorksStep
              icon="📊"
              title="We compare"
              description="Same story, different countries — see how each region frames it."
            />
            <HowItWorksStep
              icon="💡"
              title="You decide"
              description="Read the full picture in 2 minutes. No spin. No filter bubble."
            />
          </div>
        </div>
      </section>

      {/* ── LIVE SCAN PREVIEW ────────────────────────────────── */}
      {scan && (
        <section className="relative bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-28">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />

          <div className="mx-auto max-w-4xl px-6">
            {/* Section label */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                Live intelligence
              </span>
              <time dateTime={scan.date} className="text-zinc-400 dark:text-zinc-500 text-sm">
                {scan.displayDate}
              </time>
              {scan.mood && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
                  <MoodBadge mood={scan.mood} />
                </>
              )}
            </div>

            {/* Scan card */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_4px_24px_rgb(0,0,0,0.06)] dark:border-white/[0.07] dark:bg-white/[0.03] dark:shadow-none">

              {/* Pattern of the day */}
              {scan.patternOfDay && (
                <div className="border-b border-black/[0.06] p-7 dark:border-white/[0.06]">
                  <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#c8922a]">
                    Pattern of the Day
                  </p>
                  {scan.patternOfDay.title && (
                    <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-xl font-semibold italic leading-snug text-[#0f0f0f] md:text-2xl dark:text-[#f0efec]">
                      {scan.patternOfDay.title}
                    </h2>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-3">
                    {scan.patternOfDay.body}
                  </p>
                </div>
              )}

              {/* Top stories */}
              <LiveStories items={scan.items} />

              {/* Stats strip */}
              <div className="flex flex-wrap gap-8 border-t border-black/[0.06] px-7 py-5 dark:border-white/[0.06]">
                <Stat label="Stories scanned" value={String(scan.items.length)} />
                <Stat label="Categories" value={String(new Set(scan.items.map((i) => i.category)).size)} />
                <Stat label="Regions" value={String(new Set(scan.items.flatMap((i) => i.regions)).size)} />
                {scan.items.some((i) => hasFramingWatch(i)) && (
                  <Stat
                    label="Framing alerts"
                    value={String(scan.items.filter((i) => hasFramingWatch(i)).length)}
                    accent
                  />
                )}
              </div>
            </div>

            {/* CTA within section */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                This is a live preview &mdash; sign up for the full intelligence layer.
              </p>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1a3a5c] px-6 text-sm font-medium text-white shadow-[0_2px_12px_rgb(26,58,92,0.3)] hover:bg-[#243f66]"
              >
                Get full access <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── TRUST STRIP ──────────────────────────────────────── */}
      <section className="relative bg-[#f2f0eb] py-10 dark:bg-[#111111] md:py-14">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-center sm:gap-10">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">50,000+</span> sources across <span className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">7 regions</span> scanned daily
            </p>
            <span className="hidden h-4 w-px bg-zinc-300 dark:bg-zinc-700 sm:block" />
            <a
              href="https://t.me/albisdaily"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-[#1a3a5c] dark:text-zinc-400 dark:hover:text-[#7ab0d8]"
            >
              Join curious readers on{" "}
              <span className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">@albisdaily</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 ml-0.5">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              No data selling
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              No algorithmic manipulation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Cancel anytime
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#c8922a]">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Built by a 2-person team
            </span>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1a3a5c] py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-30" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-[#c8922a]/10 blur-3xl" />

        <div className="relative mx-auto max-w-xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-white md:text-4xl">
            Start free.
            <br />
            <span className="font-light italic text-white/75">See what you&apos;ve been missing.</span>
          </h2>

          <div className="mt-10">
            <EmailCapture />
          </div>

          <p className="mt-5 text-sm text-white/40">
            Free forever. No credit card. Unsubscribe anytime.
          </p>
          <p className="mt-3 font-[family-name:var(--font-playfair)] text-sm italic text-white/30">
            The app designed to let you go.
          </p>
        </div>
      </section>

      {/* Scan metadata */}
      {scan?.scanMeta && (
        <div className="border-t border-zinc-200/50 bg-[#f8f7f4] py-3 dark:border-zinc-800/30 dark:bg-[#0f0f0f]">
          <p className="text-center font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-300 dark:text-zinc-700">
            {scan.scanMeta}
          </p>
        </div>
      )}
    </main>
  );
}

// ── Live Comparison Widget (Hero) ───────────────────────────────
interface FramingPerspective {
  region: string;
  flag: string;
  reported: string;
}

function LiveComparisonWidget({
  story,
  framingData,
  scan,
}: {
  story: ScanItem | null;
  framingData: { topic: string; perspectives: FramingPerspective[]; absent?: string; observation?: string } | null;
  scan: Awaited<ReturnType<typeof getTodayScan>>;
}) {
  // Priority 1: Use framing watch data (richest, has per-region perspectives)
  if (framingData && framingData.perspectives.length >= 2) {
    return (
      <div className="rounded-2xl border border-black/[0.07] bg-white/80 backdrop-blur-sm p-6 md:p-8 dark:border-white/[0.07] dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
            Live — updated today
          </span>
        </div>

        <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug text-[#0f0f0f] md:text-2xl dark:text-[#f0efec]">
          {framingData.topic}
        </h3>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {framingData.perspectives.slice(0, 4).map((p, i) => (
            <div
              key={i}
              className="rounded-xl border border-black/[0.06] bg-[#f8f7f4] p-4 dark:border-white/[0.06] dark:bg-[#0f0f0f]"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{p.flag}</span>
                <p className="text-xs font-bold tracking-[0.1em] uppercase text-zinc-500 dark:text-zinc-400">
                  {p.region}
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 line-clamp-3">
                {p.reported}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c8922a] hover:text-[#b07f22] transition-colors"
          >
            See all perspectives
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // Priority 2: Use story connection data split by region
  if (story) {
    const connectionParts = story.connection ? splitConnectionByRegion(story.connection, story.regions) : [];
    const cards = connectionParts.length > 0
      ? connectionParts
      : story.regions.filter((r) => r !== "global").slice(0, 4).map((regionKey) => ({
          region: REGION_LABELS[regionKey] || regionKey,
          text: story.connection || "",
        }));

    return (
      <div className="rounded-2xl border border-black/[0.07] bg-white/80 backdrop-blur-sm p-6 md:p-8 dark:border-white/[0.07] dark:bg-white/[0.03]">
        {scan && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
              Live — updated today
            </span>
          </div>
        )}

        <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug text-[#0f0f0f] md:text-2xl dark:text-[#f0efec]">
          {story.headline}
        </h3>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {cards.slice(0, 4).map((card, i) => (
            <div
              key={i}
              className="rounded-xl border border-black/[0.06] bg-[#f8f7f4] p-4 dark:border-white/[0.06] dark:bg-[#0f0f0f]"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{REGION_FLAGS[card.region.toLowerCase().replace(/\s+/g, "-")] || "🌐"}</span>
                <p className="text-xs font-bold tracking-[0.1em] uppercase text-zinc-500 dark:text-zinc-400">
                  {card.region}
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 line-clamp-3">
                {card.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c8922a] hover:text-[#b07f22] transition-colors"
          >
            See all perspectives
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // Priority 3: Static fallback
  const fallback = [
    { flag: "🇬🇧", region: "United Kingdom", text: "Coverage centres on the monarchy's reputation crisis and institutional legitimacy." },
    { flag: "🇪🇺", region: "Europe", text: "Intelligence sources frame it as systemic corruption being revealed across jurisdictions." },
    { flag: "🇺🇸", region: "United States", text: "Emerging framing centres on political vulnerability and which American names appear." },
    { flag: "🌍", region: "Africa", text: "Largely absent from coverage — a blindspot revealing geo-political media concentration." },
  ];

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white/80 backdrop-blur-sm p-6 md:p-8 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          Example comparison
        </span>
      </div>

      <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug text-[#0f0f0f] md:text-2xl dark:text-[#f0efec]">
        How different regions cover the same story
      </h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {fallback.map((p, i) => (
          <div
            key={i}
            className="rounded-xl border border-black/[0.06] bg-[#f8f7f4] p-4 dark:border-white/[0.06] dark:bg-[#0f0f0f]"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{p.flag}</span>
              <p className="text-xs font-bold tracking-[0.1em] uppercase text-zinc-500 dark:text-zinc-400">
                {p.region}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 line-clamp-3">
              {p.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 text-center">
        <Link
          href="/compare"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c8922a] hover:text-[#b07f22] transition-colors"
        >
          See today&apos;s real comparison
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// ── How It Works Step ───────────────────────────────────────────
function HowItWorksStep({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center md:text-left">
      <span className="text-4xl">{icon}</span>
      <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

// ── Parse framing watch from markdown ───────────────────────────
function parseFramingWatch(rawMarkdown: string): {
  topic: string;
  perspectives: FramingPerspective[];
  absent?: string;
  observation?: string;
} | null {
  const headerPatterns = [
    /##\s*🔍?\s*Framing Watch[:\s—–-]*([^\n]+)\n([\s\S]*?)(?=\n---|\n##[^#]|$)/i,
    /\*\*Framing Watch[^*]*\*\*\s*([\s\S]*?)(?=\n\*\*(?:Mood|Pattern)|$)/i,
  ];

  let block: string | null = null;
  let topic = "Today's Story";

  for (const pattern of headerPatterns) {
    const m = rawMarkdown.match(pattern);
    if (m) {
      if (pattern.source.startsWith('##')) {
        topic = m[1].trim();
        block = m[2];
      } else {
        const topicMatch = m[0].match(/Framing Watch[:\s—–-]*([^*\n]+)/i);
        if (topicMatch) topic = topicMatch[1].trim();
        block = m[0];
      }
      break;
    }
  }

  if (!block) return null;

  const perspectives: FramingPerspective[] = [];
  let absent: string | undefined;
  let observation: string | undefined;

  const lineRegex = /^-\s*\*?\*?([^*\n]+?)\*?\*?:\s*(.+)/gm;
  let match;

  while ((match = lineRegex.exec(block)) !== null) {
    const label = match[1].trim().replace(/\*+/g, '');
    const content = match[2].trim();

    if (label.toLowerCase().startsWith("absent")) { absent = content; continue; }
    if (label.toLowerCase().startsWith("mechanism")) { observation = content; continue; }

    let flag = "🌐";
    const ll = label.toLowerCase();
    if (ll.includes("uk") || ll.includes("brit")) flag = "🇬🇧";
    else if (ll.includes("us") || ll.includes("american")) flag = "🇺🇸";
    else if (ll.includes("europe") || ll.includes("eu ")) flag = "🇪🇺";
    else if (ll.includes("china") || ll.includes("chinese")) flag = "🇨🇳";
    else if (ll.includes("russia")) flag = "🇷🇺";
    else if (ll.includes("india")) flag = "🇮🇳";
    else if (ll.includes("middle east")) flag = "🕌";
    else if (ll.includes("africa")) flag = "🌍";
    else if (ll.includes("asia")) flag = "🌏";
    else if (ll.includes("latin")) flag = "🌎";
    else if (ll.includes("iran")) flag = "🇮🇷";
    else if (ll.includes("japan")) flag = "🇯🇵";

    const regionClean = label.replace(/\s*\(.*\)\s*$/, '').trim();
    perspectives.push({ region: regionClean, flag, reported: content });
  }

  if (!absent) {
    const absentMatch = block.match(/\*\*Absent from:?\*\*\s*(.+)/i);
    if (absentMatch) absent = absentMatch[1].trim();
  }
  if (!observation) {
    const mechMatch = block.match(/\*\*Mechanism:?\*\*\s*(.+)/i);
    if (mechMatch) observation = mechMatch[1].trim();
  }

  if (perspectives.length < 2) return null;
  return { topic, perspectives, absent, observation };
}

// ── Split connection text by region ─────────────────────────────
function splitConnectionByRegion(connection: string, regions: string[]): { region: string; text: string }[] {
  const filtered = regions.filter((r) => r !== "global").slice(0, 4);
  if (filtered.length === 0) return [];

  const sentences = connection.split(/(?<=[.!?])\s+/).filter(Boolean);

  if (sentences.length >= filtered.length) {
    const perRegion = Math.ceil(sentences.length / filtered.length);
    return filtered.map((regionKey, i) => {
      const start = i * perRegion;
      const chunk = sentences.slice(start, start + perRegion).join(" ");
      return { region: REGION_LABELS[regionKey] || regionKey, text: chunk || connection };
    });
  }

  return filtered.map((regionKey) => ({
    region: REGION_LABELS[regionKey] || regionKey,
    text: connection,
  }));
}

// ── Live Stories ─────────────────────────────────────────────────
function LiveStories({ items }: { items: ScanItem[] }) {
  const highSig = items.filter((i) => i.significance === "high");
  if (highSig.length === 0) return null;

  const premiumIndices = new Set<number>();
  highSig.forEach((item, idx) => {
    if (hasFramingWatch(item) || hasBlindspot(item)) premiumIndices.add(idx);
  });
  if (premiumIndices.size === 0 && highSig.length > 2) {
    premiumIndices.add(highSig.length - 1);
    if (highSig.length > 3) premiumIndices.add(highSig.length - 2);
  }

  return (
    <div className="p-5">
      <p className="px-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500">
        Top Stories Today
      </p>
      <div className="mt-3 space-y-1">
        {highSig.slice(0, 5).map((item, i) => (
          premiumIndices.has(i)
            ? <BlurredStoryCard key={i} item={item} />
            : <StoryCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

function BlurredStoryCard({ item }: { item: ScanItem }) {
  return (
    <article className="group relative overflow-hidden rounded-xl px-3 py-3">
      <div className="flex gap-3">
        <SignificanceDot significance={item.significance} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">{item.headline}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.regions.slice(0, 3).map((r) => <RegionTag key={r} region={r} />)}
            {item.patterns.slice(0, 2).map((p) => <PatternTag key={p} pattern={p} />)}
            {hasFramingWatch(item) && <FramingBadge />}
            {hasBlindspot(item) && <BlindspotBadge />}
          </div>
          {item.connection && (
            <div className="relative mt-2.5 overflow-hidden rounded-lg">
              <p className="select-none text-xs leading-relaxed text-zinc-500 blur-[4px] line-clamp-3">{item.connection}</p>
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-white/60 via-white/80 to-white/60 dark:from-[#0f0f0f]/60 dark:via-[#0f0f0f]/80 dark:to-[#0f0f0f]/60">
                <Link href="/pricing" className="inline-flex items-center gap-1.5 rounded-full border border-[#c8922a]/30 bg-white/95 px-4 py-1.5 text-[11px] font-semibold text-[#c8922a] shadow-[0_2px_8px_rgb(200,146,42,0.15)] transition-all hover:border-[#c8922a]/60 hover:shadow-[0_4px_16px_rgb(200,146,42,0.25)] dark:border-[#c8922a]/20 dark:bg-zinc-900/95 dark:hover:border-[#c8922a]/50">
                  <LockIcon />See all perspectives &mdash; Premium
                </Link>
              </div>
            </div>
          )}
          <p className="mt-1.5 text-[10px] text-zinc-300 dark:text-zinc-600">{estimateReadingTime(item)} min read</p>
        </div>
      </div>
    </article>
  );
}

function StoryCard({ item }: { item: ScanItem }) {
  return (
    <article className="group rounded-xl px-3 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
      <div className="flex gap-3">
        <SignificanceDot significance={item.significance} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">{item.headline}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.regions.slice(0, 3).map((r) => <RegionTag key={r} region={r} />)}
            {item.patterns.slice(0, 2).map((p) => <PatternTag key={p} pattern={p} />)}
            {hasFramingWatch(item) && <FramingBadge />}
          </div>
          {item.connection && (
            <p className="mt-2 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500 line-clamp-2">{item.connection}</p>
          )}
          <p className="mt-1.5 text-[10px] text-zinc-300 dark:text-zinc-600">{estimateReadingTime(item)} min read</p>
        </div>
      </div>
    </article>
  );
}

// ── Small components ────────────────────────────────────────────

function MoodBadge({ mood }: { mood: string }) {
  const lower = mood.toLowerCase();
  let cls = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  if (lower.includes("urgent") || lower.includes("critical") || lower.includes("brittle") || lower.includes("tense") || lower.includes("fragment")) {
    cls = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  } else if (lower.includes("calm") || lower.includes("stable")) {
    cls = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{mood}</span>;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className={`text-xl font-semibold tracking-tight ${accent ? "text-[#c8922a]" : "text-[#0f0f0f] dark:text-[#f0efec]"}`}>{value}</p>
      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{label}</p>
    </div>
  );
}

function SignificanceDot({ significance }: { significance: string }) {
  const colors: Record<string, string> = { high: "bg-[#c8922a]", medium: "bg-[#1a3a5c] dark:bg-[#4a7baa]", low: "bg-zinc-300 dark:bg-zinc-600" };
  return <span className={`mt-1.5 block h-2 w-2 flex-shrink-0 rounded-full ${colors[significance] || colors.medium}`} title={`${significance} significance`} />;
}

function RegionTag({ region }: { region: string }) {
  return <span className="inline-flex rounded-full border border-white/[0.1] bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-zinc-400">{REGION_LABELS[region] || region}</span>;
}

function PatternTag({ pattern }: { pattern: string }) {
  return <span className="inline-flex rounded-full border border-violet-200/30 bg-violet-50/50 px-2 py-0.5 text-[10px] font-medium text-violet-600/80 dark:border-violet-400/10 dark:bg-violet-950/20 dark:text-violet-400/60">{pattern.replace(/-/g, " ")}</span>;
}

function FramingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#c8922a]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c8922a] dark:bg-[#c8922a]/15">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      Framing Watch
    </span>
  );
}

function BlindspotBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
      Blindspot
    </span>
  );
}

function estimateReadingTime(item: ScanItem): number {
  const words = (item.headline + " " + item.connection).split(/\s+/).length;
  return Math.max(1, Math.ceil((words + item.regions.length * 30) / 200));
}

// ── Icons ────────────────────────────────────────────────────────
function ArrowRight({ size = 16, stroke }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="mr-1 inline h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
