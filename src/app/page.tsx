import Link from "next/link";
import {
  getTodayScan,
  hasFramingWatch,
  hasBlindspot,
  REGION_LABELS,
  type ScanItem,
} from "@/lib/scan-parser";
import { estimateItemReadingTime } from "@/lib/reading-time";
import { AnimatedCounter } from "./components/animated-counter";
import { PerspectiveBar } from "./components/perspective-bar";

export const dynamic = "force-dynamic";

// ── Page ─────────────────────────────────────────────────────────
export default function Home() {
  const scan = getTodayScan();

  return (
    <main className="overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] md:min-h-[85vh] flex items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        {/* Stripe-inspired subtle grid background */}
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-60" />
        {/* Decorative amber gradient wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-950/15 dark:via-transparent" />
        {/* Decorative bottom fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f8f7f4] to-transparent dark:from-[#0f0f0f]" />
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/30 to-transparent" />

        <div className="relative mx-auto max-w-4xl px-6 py-24 md:py-36 text-center">

          {/* Eyebrow pill */}
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-[#c8922a]/25 bg-[#c8922a]/8 px-4 py-1.5 dark:border-[#c8922a]/20 dark:bg-[#c8922a]/10">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8922a] animate-pulse-dot" />
            <span className="text-xs font-medium tracking-[0.18em] uppercase text-[#c8922a]">
              Not news. Clarity.
            </span>
          </div>

          {/* Main headline — editorial serif with amber gradient */}
          <h1 className="animate-fade-in-up delay-100 mt-8 font-[family-name:var(--font-playfair)] leading-headline tracking-tight">
            <span className="block text-5xl font-light italic text-[#0f0f0f]/70 md:text-6xl lg:text-7xl dark:text-white/50">
              The news,
            </span>
            <span className="block text-5xl font-bold md:text-6xl lg:text-8xl text-gradient-amber">
              understood.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-in-up delay-200 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] md:text-xl dark:text-zinc-400">
            Albis gives you clarity on world events — every perspective, zero
            spin, one calm experience designed to let you go.
          </p>

          {/* CTA group */}
          <div className="animate-fade-in-up delay-300 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="group inline-flex h-14 min-w-[44px] items-center gap-2.5 rounded-full bg-[#1a3a5c] px-10 text-base font-medium text-white shadow-[0_4px_20px_rgb(26,58,92,0.35)] hover:bg-[#243f66] hover:shadow-[0_6px_28px_rgb(26,58,92,0.45)] dark:shadow-[0_4px_20px_rgb(26,58,92,0.5)]"
            >
              Start reading free
              <ArrowRight />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-14 min-w-[44px] items-center gap-2 rounded-full border border-zinc-300/80 px-8 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-100/50 dark:border-zinc-700/80 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/40"
            >
              View pricing
            </Link>
          </div>

          {/* Anxiety reducer */}
          <p className="animate-fade-in-up delay-400 mt-5 text-sm text-zinc-400 dark:text-zinc-500">
            Free forever · No credit card · Unsubscribe anytime
          </p>

          {/* Social proof avatars */}
          <div className="animate-fade-in-up delay-500 mt-10 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {[
                { bg: "#1a3a5c", initials: "AR" },
                { bg: "#c8922a", initials: "SK" },
                { bg: "#4a7b9d", initials: "LM" },
                { bg: "#2d5a8e", initials: "JT" },
                { bg: "#8a5a1c", initials: "PE" },
              ].map(({ bg, initials }) => (
                <div
                  key={initials}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f8f7f4] text-[10px] font-semibold text-white dark:border-[#0f0f0f]"
                  style={{ backgroundColor: bg }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Joined by curious readers worldwide
            </p>
          </div>
        </div>
      </section>

      {/* ── PROBLEM STATEMENT ─────────────────────────────────── */}
      <section className="relative bg-[#0f0f0f] py-24 md:py-32 dark:bg-[#080808]">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="animate-fade-in text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]/70">
            The problem
          </p>
          <h2 className="animate-fade-in-up delay-100 mt-5 font-[family-name:var(--font-playfair)] text-3xl font-light italic leading-snug text-white/90 md:text-4xl lg:text-5xl">
            News was designed to make you feel.
            <br />
            <span className="text-white font-semibold not-italic">
              Albis is designed to help you see.
            </span>
          </h2>
          <p className="animate-fade-in-up delay-200 mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 font-[family-name:var(--font-source-serif)] md:text-lg">
            Algorithms optimise for outrage. Headlines strip context.
            Regional coverage tells wildly different stories. You&apos;re left
            informed of nothing, anxious about everything.
          </p>

          {/* Problem trio */}
          <div className="animate-fade-in-up delay-300 mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "⚡",
                title: "Engineered for outrage",
                body: "Your feed is built to make you angry. That's what drives clicks. Albis is built differently.",
              },
              {
                icon: "🌐",
                title: "Filtered by region",
                body: "The BBC, Al Jazeera and Fox cover the same event differently. You only see one version.",
              },
              {
                icon: "📉",
                title: "More headlines, less understanding",
                body: "150 articles a day. You're busy, not informed. Volume isn't intelligence.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-6 text-left"
              >
                <span className="text-2xl">{p.icon}</span>
                <h3 className="mt-3 text-sm font-semibold text-white/90">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)]">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (Headspace-inspired) ─────────────────── */}
      <section className="bg-[#f2f0eb] py-24 dark:bg-[#111111] md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              How it works
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#0f0f0f] md:text-4xl dark:text-[#f0efec]">
              Three steps to clarity.
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Choose topics & regions",
                body: "Pick what matters to you — from geopolitics to climate science. Choose the regions you want to track.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a3a5c] dark:text-[#7ab0d8]">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Get your daily briefing",
                body: "Every morning, Albis scans sources across 7 regions and 12 categories. Your briefing surfaces only what matters.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a3a5c] dark:text-[#7ab0d8]">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "See every angle",
                body: "Spot how the same story is told differently around the world. Understand framing, gaps, and patterns others miss.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a3a5c] dark:text-[#7ab0d8]">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                ),
              },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#c8922a]">{s.step}</span>
                <div className="mt-4">{s.icon}</div>
                <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/onboarding"
              className="inline-flex h-12 min-w-[44px] items-center gap-2 rounded-full bg-[#1a3a5c] px-8 text-sm font-medium text-white shadow-[0_2px_12px_rgb(26,58,92,0.3)] hover:bg-[#243f66]"
            >
              Get started — it takes 30 seconds <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES / SOLUTION ───────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-24 dark:bg-[#0f0f0f] md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              How Albis is different
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#0f0f0f] md:text-4xl dark:text-[#f0efec]">
              Intelligence, not information overload.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-zinc-500 dark:text-zinc-400">
              Most news tells you what happened. Albis tells you what it
              means — and what you&apos;re not being told.
            </p>
          </div>

          {/* Feature bento grid */}
          <div className="mt-16 grid gap-5 md:grid-cols-3">

            {/* Card 1 — Every Angle */}
            <div className="feature-card group relative overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a3a5c]/10 dark:bg-[#1a3a5c]/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a3a5c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-[#4a7baa]">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <h3 className="mt-5 font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Every Angle
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                7 regions, 12 categories — scanned daily. See how the same
                story reads in Washington, Beijing, Lagos and London. Side by
                side, without the spin.
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {["Americas", "Europe", "East Asia", "Africa", "Middle East"].map((r) => (
                  <span key={r} className="rounded-full bg-[#1a3a5c]/8 px-2.5 py-0.5 text-[10px] font-medium text-[#1a3a5c] dark:bg-[#1a3a5c]/20 dark:text-[#7ab0d8]">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 2 — Intelligence Layer (featured) */}
            <div className="feature-card group relative overflow-hidden rounded-2xl bg-[#1a3a5c] p-7 shadow-[0_8px_32px_rgb(26,58,92,0.25)] dark:shadow-[0_8px_32px_rgb(26,58,92,0.4)]">
              {/* Subtle top shine */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div className="absolute -right-3 -top-3 rounded-full bg-[#c8922a] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg">
                Popular
              </div>
              <h3 className="mt-5 font-[family-name:var(--font-playfair)] text-xl font-semibold text-white">
                Intelligence Layer
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/70">
                Pattern detection across domains. Cross-story connections
                that single-source reporting misses. Summaries, context, and
                what you&apos;re <em className="text-white/90">not</em> being told.
              </p>
              <div className="mt-5 space-y-2">
                {[
                  "Cross-domain pattern detection",
                  "Coverage gap analysis",
                  "AI-powered story summaries",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c8922a] flex-shrink-0">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 — Calm by Design */}
            <div className="feature-card group relative overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-emerald-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className="mt-5 font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Calm by Design
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                No infinite scroll. No red alerts. No algorithmic feed.
                Designed to let you go — not keep you scrolling.
              </p>
              <div className="mt-5 space-y-2">
                {[
                  "No infinite scroll",
                  "No outrage-engineered feed",
                  "Designed to let you go",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 flex-shrink-0">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary features row */}
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="feature-card flex gap-5 rounded-2xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8922a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  Framing Watch
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  The same event, radically different stories. Framing Watch reveals what gets emphasized, what gets omitted, and why — across every region simultaneously.
                </p>
              </div>
            </div>
            <div className="feature-card flex gap-5 rounded-2xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-violet-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  Personalised Briefings
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Choose your topics and regions. Your briefing surfaces only what matters to you — not what the algorithm thinks will keep you scrolling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE SCAN (product showcase — bento grid) ─────────── */}
      {scan && (
        <section className="relative bg-[#f2f0eb] py-24 dark:bg-[#111111] md:py-28">
          {/* Decorative top border */}
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
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
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
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 line-clamp-3">
                    {scan.patternOfDay.body}
                  </p>
                </div>
              )}

              {/* Top stories — bento grid: first card spans 2 cols on desktop */}
              {scan.items.filter((i) => i.significance === "high").length > 0 && (
                <div className="p-5">
                  <p className="px-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500">
                    Top Stories Today
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {scan.items
                      .filter((i) => i.significance === "high")
                      .slice(0, 5)
                      .map((item, i) => (
                        <StoryCard key={i} item={item} isHero={i === 0} />
                      ))}
                  </div>
                </div>
              )}

              {/* Stats strip with animated counters */}
              <div className="flex flex-wrap gap-8 border-t border-black/[0.06] px-7 py-5 dark:border-white/[0.06]">
                <AnimatedCounter label="Stories scanned" value={scan.items.length} />
                <AnimatedCounter label="Categories" value={new Set(scan.items.map((i) => i.category)).size} />
                <AnimatedCounter label="Regions" value={new Set(scan.items.flatMap((i) => i.regions)).size} />
                {scan.items.some((i) => hasFramingWatch(i)) && (
                  <AnimatedCounter
                    label="Framing alerts"
                    value={scan.items.filter((i) => hasFramingWatch(i)).length}
                    accent
                  />
                )}
                {scan.items.some((i) => hasBlindspot(i)) && (
                  <AnimatedCounter
                    label="Blindspots"
                    value={scan.items.filter((i) => hasBlindspot(i)).length}
                    accent
                  />
                )}
              </div>
            </div>

            {/* "You're caught up" completion indicator */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-400 dark:text-zinc-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>You&apos;re up to date — that&apos;s today&apos;s scan preview</span>
            </div>

            {/* CTA within section */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                This is a live preview — sign up for the full intelligence layer.
              </p>
              <Link
                href="/signup"
                className="inline-flex h-10 min-w-[44px] items-center gap-2 rounded-full bg-[#1a3a5c] px-6 text-sm font-medium text-white shadow-[0_2px_12px_rgb(26,58,92,0.3)] hover:bg-[#243f66]"
              >
                Get full access <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── SOCIAL PROOF ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f8f7f4] py-24 dark:bg-[#0f0f0f] md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          {/* Quote mark */}
          <div className="font-[family-name:var(--font-playfair)] text-7xl font-bold leading-none text-[#c8922a]/20 dark:text-[#c8922a]/15">
            &ldquo;
          </div>
          <p className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-light italic leading-relaxed text-[#0f0f0f]/80 md:text-2xl lg:text-3xl dark:text-white/75">
            The anti-doomscroll. I finally understand what&apos;s actually
            happening in the world without feeling worse about it.
          </p>
          <p className="mt-5 text-sm font-medium text-[#c8922a]">
            — Early beta tester
          </p>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400 dark:text-zinc-500">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              No data selling
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              No algorithmic manipulation
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Cancel any time
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1a3a5c] py-28 md:py-36">
        {/* Background texture */}
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-30" />
        {/* Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-[#c8922a]/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]/70">
            Join the readers
          </p>
          <h2 className="mt-5 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
            Understand the world.
            <br />
            <span className="font-light italic text-white/75">Without the noise.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/60 font-[family-name:var(--font-source-serif)]">
            Start free. Get your personalised daily briefing — the patterns
            that matter, across every region, without the anxiety.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex h-14 min-w-[44px] items-center gap-2.5 rounded-full bg-white px-10 text-base font-semibold text-[#1a3a5c] shadow-[0_4px_20px_rgb(0,0,0,0.2)] hover:bg-[#f0efec] hover:shadow-[0_6px_28px_rgb(0,0,0,0.25)]"
            >
              Start reading free
              <ArrowRight stroke="#1a3a5c" />
            </Link>
            <Link
              href="/about"
              className="inline-flex h-14 min-w-[44px] items-center rounded-full border border-white/20 px-8 text-sm font-medium text-white/80 hover:border-white/40 hover:text-white"
            >
              Learn more
            </Link>
          </div>

          <p className="mt-5 text-sm text-white/40">
            Free tier · 2 topics · 1 region · No credit card
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

// ── Arrow icon ──────────────────────────────────────────────────
function ArrowRight({ size = 16, stroke }: { size?: number; stroke?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ── Mood badge ──────────────────────────────────────────────────
function MoodBadge({ mood }: { mood: string }) {
  const lower = mood.toLowerCase();
  let cls = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  if (lower.includes("urgent") || lower.includes("critical")) {
    cls = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  } else if (lower.includes("brittle") || lower.includes("tense") || lower.includes("fragment")) {
    cls = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  } else if (lower.includes("calm") || lower.includes("stable")) {
    cls = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {mood}
    </span>
  );
}

// ── Story card (bento grid) ─────────────────────────────────────
function StoryCard({ item, isHero }: { item: ScanItem; isHero?: boolean }) {
  const framing = hasFramingWatch(item);
  const blindspot = hasBlindspot(item);
  const readTime = estimateItemReadingTime(item.headline, item.connection);
  return (
    <article className={`group rounded-xl px-3 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03] ${
      isHero ? "md:col-span-2 md:bg-zinc-50/50 md:dark:bg-white/[0.02] md:p-5" : ""
    }`}>
      <div className="flex gap-3">
        <SignificanceDot significance={item.significance} />
        <div className="min-w-0 flex-1">
          <h3 className={`font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec] ${
            isHero ? "text-base md:text-lg" : "text-sm"
          }`}>
            {item.headline}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {item.regions.slice(0, 3).map((r) => (
              <RegionTag key={r} region={r} />
            ))}
            {item.patterns.slice(0, 2).map((p) => (
              <PatternTag key={p} pattern={p} />
            ))}
            {framing && <FramingBadge />}
            {blindspot && <BlindspotBadge />}
            <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500">
              {readTime}
            </span>
          </div>
          {/* Perspective coverage bar */}
          <PerspectiveBar item={item} />
          {/* Hover teaser */}
          {item.connection && !framing && !blindspot && (
            <div className="story-card-teaser">
              <p className="mt-2 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500 line-clamp-2">
                {item.connection}
              </p>
            </div>
          )}
          {(framing || blindspot) && (
            <div className="relative mt-2">
              <p className="select-none text-xs leading-relaxed text-zinc-400 blur-[3px] line-clamp-2">
                {item.connection}
              </p>
              <div className="absolute inset-0 flex items-center">
                <span className="rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-[10px] font-medium text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400">
                  {framing ? "🔒 Premium · Unlock Framing Watch" : "🔒 Premium · Unlock Blindspot Analysis"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function SignificanceDot({ significance }: { significance: string }) {
  const colors: Record<string, string> = {
    high: "bg-[#c8922a]",
    medium: "bg-[#1a3a5c] dark:bg-[#4a7baa]",
    low: "bg-zinc-300 dark:bg-zinc-600",
  };
  return (
    <span
      className={`mt-1.5 block h-2 w-2 flex-shrink-0 rounded-full ${colors[significance] || colors.medium}`}
      title={`${significance} significance`}
    />
  );
}

function RegionTag({ region }: { region: string }) {
  const label = REGION_LABELS[region] || region;
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
      {label}
    </span>
  );
}

function PatternTag({ pattern }: { pattern: string }) {
  return (
    <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:bg-violet-950/30 dark:text-violet-400/80">
      {pattern.replace(/-/g, " ")}
    </span>
  );
}

function FramingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#c8922a]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c8922a] dark:bg-[#c8922a]/15">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      Framing Watch
    </span>
  );
}

function BlindspotBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
      Blindspot
    </span>
  );
}
