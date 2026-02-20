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

      {/* ── SECTION 2: PROBLEM HOOK ──────────────────────────── */}
      <section className="relative bg-[#0f0f0f] py-16 md:py-20">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="font-[family-name:var(--font-playfair)] text-xl leading-relaxed text-white/80 md:text-2xl">
            Every source shows you one angle.
            <br className="hidden sm:block" />{" "}
            Algorithms choose what you see.
          </p>
          <p className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#c8922a] md:text-2xl">
            You deserve the full picture.
          </p>
        </div>
      </section>

      {/* ── SECTION 3: PERSPECTIVE DEMO ──────────────────────── */}
      <section className="relative bg-[#f2f0eb] py-20 dark:bg-[#111111] md:py-28">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />

        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            Live from today&apos;s scan &mdash; updated 3x daily
          </p>

          <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#0f0f0f] md:text-4xl dark:text-[#f0efec]">
            Same story. Different worlds.
          </h2>

          <PerspectiveDemo story={perspectiveStory} scan={scan} />

          <p className="mt-10 text-center font-[family-name:var(--font-playfair)] text-lg italic text-zinc-400 dark:text-zinc-500">
            This is what Albis does. Every story. Every day.
          </p>
        </div>
      </section>

      {/* ── SECTION 4: LIVE SCAN ─────────────────────────────── */}
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

      {/* ── SECTION 5: SOCIAL PROOF STRIP ────────────────────── */}
      <section className="relative bg-[#f2f0eb] py-10 dark:bg-[#111111] md:py-14">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
        <div className="mx-auto max-w-4xl px-6">
          {/* Stats line */}
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

          {/* Trust icons */}
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
          </div>
        </div>
      </section>

      {/* ── SECTION 6: CTA + EMAIL CAPTURE ───────────────────── */}
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

// ── Live Stories ─────────────────────────────────────────────────
function LiveStories({ items }: { items: ScanItem[] }) {
  const highSig = items.filter((i) => i.significance === "high");
  if (highSig.length === 0) return null;

  // Identify which stories get the blurred premium treatment:
  // stories with framing patterns or blindspot flags
  const premiumIndices = new Set<number>();
  highSig.forEach((item, idx) => {
    if (hasFramingWatch(item) || hasBlindspot(item)) {
      premiumIndices.add(idx);
    }
  });

  // If no natural premium candidates, blur the last 1-2 stories
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

// ── Blurred Premium Story Card ──────────────────────────────────
function BlurredStoryCard({ item }: { item: ScanItem }) {
  return (
    <article className="group relative overflow-hidden rounded-xl px-3 py-3">
      <div className="flex gap-3">
        <SignificanceDot significance={item.significance} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
            {item.headline}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.regions.slice(0, 3).map((r) => (
              <RegionTag key={r} region={r} />
            ))}
            {item.patterns.slice(0, 2).map((p) => (
              <PatternTag key={p} pattern={p} />
            ))}
            {hasFramingWatch(item) && <FramingBadge />}
            {hasBlindspot(item) && <BlindspotBadge />}
          </div>
          {/* Blurred connection — the premium teaser */}
          {item.connection && (
            <div className="relative mt-2.5 overflow-hidden rounded-lg">
              <p className="select-none text-xs leading-relaxed text-zinc-500 blur-[4px] line-clamp-3">
                {item.connection}
              </p>
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-white/60 via-white/80 to-white/60 dark:from-[#0f0f0f]/60 dark:via-[#0f0f0f]/80 dark:to-[#0f0f0f]/60">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#c8922a]/30 bg-white/95 px-4 py-1.5 text-[11px] font-semibold text-[#c8922a] shadow-[0_2px_8px_rgb(200,146,42,0.15)] transition-all hover:border-[#c8922a]/60 hover:shadow-[0_4px_16px_rgb(200,146,42,0.25)] dark:border-[#c8922a]/20 dark:bg-zinc-900/95 dark:hover:border-[#c8922a]/50"
                >
                  <LockIcon />
                  See all perspectives &mdash; Premium
                </Link>
              </div>
            </div>
          )}
          {/* Reading time estimate */}
          <p className="mt-1.5 text-[10px] text-zinc-300 dark:text-zinc-600">
            {estimateReadingTime(item)} min read
          </p>
        </div>
      </div>
    </article>
  );
}

// ── Story Card (free / visible) ─────────────────────────────────
function StoryCard({ item }: { item: ScanItem }) {
  return (
    <article className="group rounded-xl px-3 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
      <div className="flex gap-3">
        <SignificanceDot significance={item.significance} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
            {item.headline}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.regions.slice(0, 3).map((r) => (
              <RegionTag key={r} region={r} />
            ))}
            {item.patterns.slice(0, 2).map((p) => (
              <PatternTag key={p} pattern={p} />
            ))}
            {hasFramingWatch(item) && <FramingBadge />}
          </div>
          {item.connection && (
            <p className="mt-2 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500 line-clamp-2">
              {item.connection}
            </p>
          )}
          <p className="mt-1.5 text-[10px] text-zinc-300 dark:text-zinc-600">
            {estimateReadingTime(item)} min read
          </p>
        </div>
      </div>
    </article>
  );
}

// ── Perspective Demo ────────────────────────────────────────────
function PerspectiveDemo({ story, scan }: { story: ScanItem | null; scan: ReturnType<typeof getTodayScan> }) {
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

  const connectionParts = story.connection ? splitConnectionByRegion(story.connection, story.regions) : [];
  const regionCards = story.regions
    .filter((r) => r !== "global")
    .slice(0, 4)
    .map((regionKey) => ({
      region: REGION_LABELS[regionKey] || regionKey,
      text: story.connection,
    }));

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

  const sentences = connection.split(/(?<=[.!?])\s+/).filter(Boolean);

  if (sentences.length >= filteredRegions.length) {
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

  return filteredRegions.map((regionKey) => ({
    region: REGION_LABELS[regionKey] || regionKey,
    text: connection,
  }));
}

const REGION_CARD_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  "West": { border: "border-l-blue-500", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" },
  "South Asia": { border: "border-l-violet-500", text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500" },
  "Middle East": { border: "border-l-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" },
  "E. Europe": { border: "border-l-red-500", text: "text-red-600 dark:text-red-400", bg: "bg-red-500" },
  "Africa": { border: "border-l-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" },
  "East & SE Asia": { border: "border-l-pink-500", text: "text-pink-600 dark:text-pink-400", bg: "bg-pink-500" },
  "Latin America": { border: "border-l-cyan-500", text: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500" },
  "Global": { border: "border-l-zinc-400", text: "text-zinc-500 dark:text-zinc-400", bg: "bg-zinc-400" },
};

function PerspectiveCard({ region, text }: { region: string; text: string }) {
  const colors = REGION_CARD_COLORS[region] || REGION_CARD_COLORS["Global"];
  return (
    <div className={`rounded-xl border border-black/[0.07] border-l-4 ${colors.border} bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]`}>
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${colors.bg}`} />
        <p className={`text-xs font-bold tracking-[0.12em] uppercase ${colors.text}`}>
          {region}
        </p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
        {text}
      </p>
    </div>
  );
}

// ── Small components ────────────────────────────────────────────

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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className={`text-xl font-semibold tracking-tight ${accent ? "text-[#c8922a]" : "text-[#0f0f0f] dark:text-[#f0efec]"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{label}</p>
    </div>
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
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M4.93 4.93l14.14 14.14"/>
      </svg>
      Blindspot
    </span>
  );
}

function estimateReadingTime(item: ScanItem): number {
  const words = (item.headline + " " + item.connection).split(/\s+/).length;
  const regions = item.regions.length;
  return Math.max(1, Math.ceil((words + regions * 30) / 200));
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
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
