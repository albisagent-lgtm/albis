import Link from "next/link";
import {
  getTodayScan,
  REGION_LABELS,
  type ScanItem,
} from "@/lib/scan-parser";
import { EmailCapture } from "./components/email-capture";

export const dynamic = "force-dynamic";

// ── Page ─────────────────────────────────────────────────────────
export default function Home() {
  const scan = getTodayScan();

  // Find the highest-significance story with multi-region coverage for the perspective demo
  const perspectiveStory = scan?.items
    .filter((i) => i.regions.length >= 2 && i.connection)
    .sort((a, b) => {
      const sigOrder = { high: 3, medium: 2, low: 1 };
      return (sigOrder[b.significance] || 0) - (sigOrder[a.significance] || 0);
    })[0] || null;

  return (
    <main className="overflow-hidden">

      {/* ── SECTION 1: HERO ──────────────────────────────────── */}
      <section className="relative min-h-[80vh] md:min-h-[75vh] flex items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-950/15 dark:via-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f8f7f4] to-transparent dark:from-[#0f0f0f]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/30 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 py-24 md:py-32 text-center">
          {/* Eyebrow */}
          <p className="animate-fade-in text-xs font-medium tracking-[0.18em] uppercase text-[#c8922a]/70 font-[family-name:var(--font-playfair)] italic">
            The app designed to let you go
          </p>

          {/* Headline */}
          <h1 className="animate-fade-in-up delay-100 mt-6 font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-tight tracking-tight text-[#0f0f0f] md:text-6xl lg:text-7xl dark:text-[#f0efec]">
            See the world clearly.
          </h1>

          {/* Subline */}
          <p className="animate-fade-in-up delay-200 mx-auto mt-6 max-w-lg text-lg leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] md:text-xl dark:text-zinc-400">
            Albis scans 7 regions daily and shows you how the same story is told differently around the world. One calm briefing. Zero spin.
          </p>

          {/* Single CTA */}
          <div className="animate-fade-in-up delay-300 mt-10">
            <Link
              href="/signup"
              className="group inline-flex h-14 min-w-[44px] items-center gap-2.5 rounded-full bg-[#1a3a5c] px-10 text-base font-medium text-white shadow-[0_4px_20px_rgb(26,58,92,0.35)] hover:bg-[#243f66] hover:shadow-[0_6px_28px_rgb(26,58,92,0.45)] dark:shadow-[0_4px_20px_rgb(26,58,92,0.5)]"
            >
              Start free
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: LIVE PERSPECTIVE EXAMPLE ──────────────── */}
      <section className="relative bg-[#f2f0eb] py-20 dark:bg-[#111111] md:py-28">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />

        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            Live from today&apos;s scan
          </p>

          <PerspectiveDemo story={perspectiveStory} scan={scan} />

          <p className="mt-10 text-center font-[family-name:var(--font-playfair)] text-lg italic text-zinc-400 dark:text-zinc-500">
            This is what Albis does. Every story. Every day.
          </p>
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS ──────────────────────────── */}
      <section className="bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              How it works
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#0f0f0f] md:text-4xl dark:text-[#f0efec]">
              Three steps to clarity.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a3a5c] dark:text-[#7ab0d8]">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                ),
                title: "We scan",
                body: "50,000+ sources across 7 regions, every day. News, analysis, and local reporting — all in one pass.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a3a5c] dark:text-[#7ab0d8]">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                ),
                title: "We compare",
                body: "Same story, different regions. We detect framing differences, coverage gaps, and what you're not being told.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a3a5c] dark:text-[#7ab0d8]">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                title: "You understand",
                body: "One calm briefing with every angle. No doomscrolling, no algorithm. Read it and move on with your day.",
              },
            ].map((s) => (
              <div key={s.title} className="text-center md:text-left">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a3a5c]/8 md:mx-0 dark:bg-[#1a3a5c]/20">
                  {s.icon}
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: FREE vs PREMIUM ───────────────────────── */}
      <section className="relative bg-[#f2f0eb] py-20 dark:bg-[#111111] md:py-28">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />

        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              Choose your lens
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#0f0f0f] md:text-4xl dark:text-[#f0efec]">
              Free vs Premium
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Free tier */}
            <div className="rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-400 dark:text-zinc-500">
                Free
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                The Window
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Your daily window into what matters.
              </p>
              <div className="my-6 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
              <ul className="space-y-3">
                {[
                  "Daily briefing",
                  "Top stories",
                  "Pattern of the Day",
                  "2 topics, 1 region",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <CheckIcon className="text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-full border border-black/[0.1] text-sm font-medium text-zinc-600 hover:bg-zinc-100/80 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05]"
              >
                Get started free
              </Link>
            </div>

            {/* Premium tier */}
            <div className="relative rounded-2xl bg-[#1a3a5c] p-7 shadow-[0_8px_40px_rgb(26,58,92,0.25)] dark:shadow-[0_8px_40px_rgb(26,58,92,0.4)]">
              <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c8922a] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-[0_2px_8px_rgb(200,146,42,0.5)]">
                  <span className="h-1 w-1 rounded-full bg-white/60" />
                  Full Picture
                </span>
              </div>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-white/60">
                Premium
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white">
                The Full Picture
              </h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-white">
                  $9
                </span>
                <span className="text-sm text-white/60">/mo</span>
              </div>
              <div className="my-6 h-px bg-white/10" />
              <ul className="space-y-3">
                {[
                  { text: "Everything in Free", highlight: false },
                  { text: "Perspective breakdowns", highlight: true },
                  { text: "Blindspot alerts", highlight: true },
                  { text: "What you're not being told", highlight: true },
                  { text: "All topics & regions", highlight: false },
                  { text: "Personalised email digest", highlight: false },
                ].map((f) => (
                  <li key={f.text} className={`flex items-center gap-3 text-sm ${f.highlight ? "font-medium text-white" : "text-white/80"}`}>
                    <CheckIcon className={f.highlight ? "text-[#c8922a]" : "text-white/60"} />
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-[#f0efec]"
              >
                Start 14-day trial
              </Link>
            </div>
          </div>

          {/* Blurred perspective teaser */}
          <div className="relative mt-8 overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <div className="select-none blur-[4px]">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
                Perspective Breakdown
              </p>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Western media frames this as a diplomatic victory, while Middle Eastern coverage emphasises the humanitarian costs still unresolved. African outlets focus on the economic implications for commodity markets...
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/30 dark:bg-[#111111]/30">
              <span className="rounded-full border border-zinc-200 bg-white/95 px-5 py-2 text-sm font-medium text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-400">
                <LockIcon /> Premium perspective breakdown
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: CTA + EMAIL CAPTURE ───────────────────── */}
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

// ── Perspective Demo ────────────────────────────────────────────
function PerspectiveDemo({ story, scan }: { story: ScanItem | null; scan: ReturnType<typeof getTodayScan> }) {
  // Static fallback if no real data
  const fallback = {
    headline: "Global trade negotiations stall as tariff tensions rise",
    regions: [
      { region: "West", framing: "Markets react nervously to diplomatic breakdown, with tech stocks leading the decline." },
      { region: "East & SE Asia", framing: "Regional leaders emphasise alternative trade partnerships and domestic demand resilience." },
      { region: "Middle East", framing: "Energy exporters see opportunity in shifting supply chains, focus on bilateral deals." },
      { region: "Africa", framing: "Commodity-dependent economies brace for price volatility, call for fairer trade terms." },
    ],
  };

  if (!story) {
    return (
      <div className="mt-6">
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-snug text-[#0f0f0f] md:text-3xl dark:text-[#f0efec]">
          {fallback.headline}
        </h3>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {fallback.regions.map((r) => (
            <PerspectiveCard key={r.region} region={r.region} text={r.framing} />
          ))}
        </div>
      </div>
    );
  }

  // Build perspective cards from real scan data
  const regionCards = story.regions
    .filter((r) => r !== "global")
    .slice(0, 4)
    .map((regionKey) => ({
      region: REGION_LABELS[regionKey] || regionKey,
      text: story.connection,
    }));

  // If the story has a connection text, we split it for different regions
  // or use framing patterns from the scan
  const connectionParts = story.connection ? splitConnectionByRegion(story.connection, story.regions) : [];

  return (
    <div className="mt-6">
      {scan && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
            Live
          </span>
          <time dateTime={scan.date} className="text-zinc-400 dark:text-zinc-500 text-sm">
            {scan.displayDate}
          </time>
        </div>
      )}

      <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-snug text-[#0f0f0f] md:text-3xl dark:text-[#f0efec]">
        {story.headline}
      </h3>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {connectionParts.length > 0
          ? connectionParts.map((card) => (
              <PerspectiveCard key={card.region} region={card.region} text={card.text} />
            ))
          : regionCards.map((card) => (
              <PerspectiveCard key={card.region} region={card.region} text={card.text} />
            ))
        }
      </div>
    </div>
  );
}

function splitConnectionByRegion(connection: string, regions: string[]): { region: string; text: string }[] {
  const filteredRegions = regions.filter((r) => r !== "global").slice(0, 4);
  if (filteredRegions.length === 0) return [];

  // Try to split the connection text into meaningful parts for each region
  const sentences = connection.split(/(?<=[.!?])\s+/).filter(Boolean);

  if (sentences.length >= filteredRegions.length) {
    // Distribute sentences across regions
    const perRegion = Math.ceil(sentences.length / filteredRegions.length);
    return filteredRegions.map((regionKey, i) => {
      const start = i * perRegion;
      const chunk = sentences.slice(start, start + perRegion).join(" ");
      return {
        region: REGION_LABELS[regionKey] || regionKey,
        text: chunk || connection,
      };
    });
  }

  // Fallback: show full connection for each region
  return filteredRegions.map((regionKey) => ({
    region: REGION_LABELS[regionKey] || regionKey,
    text: connection,
  }));
}

const REGION_CARD_COLORS: Record<string, string> = {
  "West": "border-l-blue-500",
  "South Asia": "border-l-violet-500",
  "Middle East": "border-l-amber-500",
  "E. Europe": "border-l-red-500",
  "Africa": "border-l-emerald-500",
  "East & SE Asia": "border-l-pink-500",
  "Latin America": "border-l-cyan-500",
  "Global": "border-l-zinc-400",
};

function PerspectiveCard({ region, text }: { region: string; text: string }) {
  const borderColor = REGION_CARD_COLORS[region] || "border-l-zinc-400";
  return (
    <div className={`rounded-xl border border-black/[0.07] border-l-[3px] ${borderColor} bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]`}>
      <p className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-400 dark:text-zinc-500">
        {region}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
        {text}
      </p>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────
function ArrowRight({ size = 16, stroke }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${className}`}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="mr-1.5 inline h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
