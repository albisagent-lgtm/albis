"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPreferences,
  type UserPreferences,
  TOPICS,
  REGIONS,
} from "@/lib/preferences";
import {
  type ScanItem,
  type ParsedScan,
  CATEGORY_META,
  REGION_LABELS,
  hasFramingWatch,
  hasBlindspot,
} from "@/lib/scan-types";
import { estimateItemReadingTime } from "@/lib/reading-time";
import { PerspectiveBar } from "@/app/components/perspective-bar";
import { PerspectiveScore } from "@/app/components/perspective-score";

// ---------------------------------------------------------------------------
// Client wrapper — reads preferences from localStorage, filters scan
// ---------------------------------------------------------------------------

export function BriefingClient({ scan }: { scan: ParsedScan | null }) {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPrefs(getPreferences());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-zinc-500">Loading&hellip;</div>
      </main>
    );
  }

  // Not onboarded yet
  if (!prefs?.onboardingComplete) {
    return <NeedsOnboarding />;
  }

  // No scan data
  if (!scan) {
    return <NoScanData />;
  }

  // Filter items by user preferences
  const filtered = scan.items.filter((item) => {
    const topicMatch =
      prefs.topics.length === 0 || prefs.topics.includes(item.category as never);
    const regionMatch =
      prefs.regions.length === 0 ||
      item.regions.some((r) => prefs.regions.includes(r as never));
    return topicMatch && regionMatch;
  });

  const topicLabels = prefs.topics
    .map((t) => TOPICS.find((x) => x.id === t)?.label || t)
    .join(", ");
  const regionLabels = prefs.regions
    .map((r) => REGIONS.find((x) => x.id === r)?.label || r)
    .join(", ");

  const highItems = filtered.filter((i) => i.significance === "high");
  const framingItems = filtered.filter((i) => i.patterns.includes("framing")).slice(0, 3);
  const categories = groupByCategory(filtered);

  // Build narrative data
  const topStories = [...filtered]
    .sort((a, b) => {
      const sigOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (sigOrder[a.significance] ?? 1) - (sigOrder[b.significance] ?? 1);
    })
    .slice(0, 5);

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-black/[0.07] py-16 dark:border-white/[0.06] md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <time dateTime={scan.date} className="text-zinc-500">
              {scan.displayDate}
            </time>
            {scan.mood && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
                <MoodBadge mood={scan.mood} />
              </>
            )}
          </div>

          <div className="mt-10">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
              Your Briefing
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-light italic leading-snug text-[#0f0f0f] dark:text-[#f0efec] md:text-4xl">
              {filtered.length} signal{filtered.length !== 1 ? "s" : ""} today
            </h1>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
              Tracking {topicLabels} &middot; {regionLabels}
            </p>
          </div>

          {/* Pattern of the Day — always shown */}
          {scan.patternOfDay && (
            <div className="mt-10 rounded-2xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
                Pattern of the Day
              </p>
              {scan.patternOfDay.title && (
                <p className="mt-3 font-[family-name:var(--font-playfair)] text-lg font-semibold italic leading-relaxed text-[#0f0f0f] dark:text-[#f0efec]">
                  {scan.patternOfDay.title}
                </p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                {scan.patternOfDay.body}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Narrative Briefing — "Your Morning Brief" */}
      {filtered.length > 0 && (
        <section className="border-b border-[#c8922a]/20 bg-[#faf8f4] dark:bg-[#141210]">
          <div className="mx-auto max-w-3xl px-6 py-14 md:py-20">
            <p className="font-[family-name:var(--font-playfair)] text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
              Your Morning Brief
            </p>

            <div className="mt-8 space-y-5 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-700 dark:text-zinc-300 md:text-lg md:leading-relaxed">
              {/* Opening — mood + top theme */}
              <p>
                {scan.mood ? (
                  <>The world feels <em className="text-zinc-900 dark:text-zinc-100">{scan.mood.toLowerCase()}</em> this morning. </>
                ) : (
                  <>Good morning. </>
                )}
                {scan.topTheme ? (
                  <>The dominant thread today is <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{scan.topTheme}</strong>.</>
                ) : (
                  <>Here&rsquo;s what matters from your world today.</>
                )}
              </p>

              {/* Top story highlights */}
              {topStories.length > 0 && (
                <ul className="space-y-2.5 pl-0">
                  {topStories.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-1 flex-shrink-0 text-[#c8922a]/60">▸</span>
                      <span>
                        <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{item.headline}</strong>
                        {item.connection && (
                          <span className="text-zinc-500 dark:text-zinc-400"> — {item.connection.length > 120 ? item.connection.slice(0, 120) + "…" : item.connection}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Pattern of the day */}
              {scan.patternOfDay && (
                <p>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Pattern to watch:</span>{" "}
                  {scan.patternOfDay.title ? <>{scan.patternOfDay.title} — </> : null}
                  {scan.patternOfDay.body}
                </p>
              )}

              {/* Framing highlight */}
              {scan.framingNote && (
                <p className="border-l-2 border-[#c8922a]/30 pl-4 italic text-zinc-600 dark:text-zinc-400">
                  {scan.framingNote}
                </p>
              )}

              {/* Closing */}
              <p className="text-zinc-500 dark:text-zinc-500">
                That&rsquo;s your world this morning. Go live it.
              </p>
            </div>
          </div>

          {/* Gold accent divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#c8922a]/30 to-transparent" />
        </section>
      )}

      {/* How It Was Framed — framing breakdown cards */}
      {framingItems.length > 0 && (
        <section className="border-b border-zinc-200 py-12 dark:border-zinc-800/50 md:py-16">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
              How It Was Framed
            </p>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              Same story, different lenses — see how regions reported it differently.
            </p>

            <div className="mt-8 space-y-6">
              {framingItems.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
                  <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                    {item.headline}
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {item.regions.map((region) => (
                      <div key={region} className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                          {REGION_LABELS[region] || region}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                          {item.connection}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No matching items */}
      {filtered.length === 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              No signals match your current filters today.
            </p>
            <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
              Try adjusting your{" "}
              <Link href="/settings" className="underline underline-offset-4 hover:text-zinc-300">
                topics and regions
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      {/* Top Stories */}
      {highItems.length > 0 && (
        <section className="border-b border-zinc-200 py-12 dark:border-zinc-800/50 md:py-16">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Top Stories
            </p>
            <div className="mt-6 space-y-1">
              {highItems.map((item, i) => (
                <StoryCard key={i} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blindspots */}
      {filtered.filter((i) => hasBlindspot(i)).length > 0 && (
        <section className="border-b border-zinc-200 py-12 dark:border-zinc-800/50 md:py-16">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-600 dark:text-amber-400">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                Blindspots
              </p>
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                {filtered.filter((i) => hasBlindspot(i)).length}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              Stories with limited regional coverage — perspectives you may be missing.
            </p>
            <div className="mt-6 space-y-3">
              {filtered
                .filter((i) => hasBlindspot(i))
                .slice(0, 5)
                .map((item, i) => (
                  <div key={`bs-${i}`} className="rounded-lg border border-dashed border-amber-300/50 bg-amber-50/30 dark:border-amber-700/30 dark:bg-amber-950/10">
                    <StoryCard item={item} />
                    {item.blindspot && (
                      <div className="px-4 pb-4 pl-[2.25rem] flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">Covered by: </span>
                          {item.blindspot.coveredBy.map(r => REGION_LABELS[r] || r).join(", ")}
                        </span>
                        <span>
                          <span className="font-medium text-orange-600 dark:text-orange-400">Missing from: </span>
                          {item.blindspot.missingFrom.map(r => REGION_LABELS[r] || r).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* By Category */}
      {categories.size > 0 && (
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Your Intelligence
            </p>
            <div className="mt-8 space-y-12">
              {Array.from(categories).map(([cat, items]) => (
                <CategorySection key={cat} category={cat} items={items} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* "You're all caught up" completion state */}
      {filtered.length > 0 && (
        <section className="border-t border-zinc-200 dark:border-zinc-800/50">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <CaughtUpState
              date={scan.displayDate}
              storyCount={filtered.length}
              perspectiveCount={new Set(filtered.flatMap((i) => i.regions)).size}
            />
          </div>
        </section>
      )}

      {/* Settings link */}
      <section className="border-t border-zinc-200 dark:border-zinc-800/50">
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <Link
            href="/settings"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 min-h-[44px] inline-flex items-center"
          >
            Edit your topics and regions &rarr;
          </Link>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// "You're all caught up" with sparkle animation
// ---------------------------------------------------------------------------

function CaughtUpState({
  date,
  storyCount,
  perspectiveCount,
}: {
  date: string;
  storyCount: number;
  perspectiveCount: number;
}) {
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSparkles(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative rounded-2xl border border-black/[0.06] bg-white/50 p-10 dark:border-white/[0.06] dark:bg-white/[0.02]">
      {/* Sparkle particles */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="absolute animate-sparkle text-[#c8922a]"
              style={{
                left: `${20 + (i * 37) % 60}%`,
                top: `${10 + (i * 23) % 60}%`,
                animationDelay: `${i * 0.2}s`,
                fontSize: `${8 + (i % 3) * 4}px`,
              }}
            >
              ✦
            </span>
          ))}
        </div>
      )}

      <div className="animate-fade-in-up">
        <p className="text-3xl">✨</p>
        <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl font-semibold italic text-[#0f0f0f] dark:text-[#f0efec]">
          You are all caught up
        </h3>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          You have covered {storyCount} {storyCount === 1 ? "story" : "stories"} across {perspectiveCount} perspectives today.
        </p>
        <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
          {date}
        </p>
        <p className="mt-4 text-xs text-zinc-300 dark:text-zinc-600">
          Next briefing at 7:00 AM tomorrow
        </p>
        <Link
          href="/pricing"
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-full border border-[#c8922a]/30 bg-[#c8922a]/5 px-5 text-xs font-medium text-[#c8922a] hover:bg-[#c8922a]/10 dark:border-[#c8922a]/20"
        >
          Share your perspective score
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline components (matching homepage design exactly)
// ---------------------------------------------------------------------------

function MoodBadge({ mood }: { mood: string }) {
  const lower = mood.toLowerCase();
  let colorClasses =
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  if (lower.includes("urgent") || lower.includes("critical")) {
    colorClasses = "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400";
  } else if (lower.includes("brittle") || lower.includes("tense") || lower.includes("fragment")) {
    colorClasses = "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
  } else if (lower.includes("calm") || lower.includes("stable")) {
    colorClasses = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses}`}>
      {mood}
    </span>
  );
}

function SignificanceDot({ significance }: { significance: string }) {
  const colors: Record<string, string> = {
    high: "bg-amber-500",
    medium: "bg-blue-400 dark:bg-blue-500",
    low: "bg-zinc-300 dark:bg-zinc-600",
  };
  return (
    <span
      className={`mt-2 block h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors[significance] || colors.medium}`}
      title={`${significance} significance`}
    />
  );
}

function RegionTag({ region }: { region: string }) {
  const label = REGION_LABELS[region] || region;
  return (
    <span className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
      {label}
    </span>
  );
}

function PatternTag({ pattern }: { pattern: string }) {
  const isFraming = pattern === "framing";
  const label = pattern.replace(/-/g, " ");
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${
        isFraming
          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400/80"
          : "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400/70"
      }`}
    >
      {label}
    </span>
  );
}

function FramingWatchBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      Framing Watch
    </span>
  );
}

function StoryCard({ item }: { item: ScanItem }) {
  const framing = hasFramingWatch(item);
  const blindspot = hasBlindspot(item);
  const readTime = estimateItemReadingTime(item.headline, item.connection);
  const isPremiumContent = framing || blindspot;
  return (
    <article className="group rounded-lg px-4 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
      <div className="flex gap-3">
        <SignificanceDot significance={item.significance} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium leading-snug text-zinc-800 dark:text-zinc-100">
            {item.headline}
          </h3>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {item.regions.map((r) => (
              <RegionTag key={r} region={r} />
            ))}
            {item.patterns.map((p) => (
              <PatternTag key={p} pattern={p} />
            ))}
            {framing && <FramingWatchBadge />}
            {blindspot && <BlindspotBadge />}
            <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500">
              {readTime}
            </span>
          </div>
          <PerspectiveBar item={item} />
          <div className="mt-1.5">
            <PerspectiveScore regions={item.regions} />
          </div>
          <div className="mt-3">
            {isPremiumContent ? (
              <div className="relative">
                <p className="select-none text-sm leading-relaxed text-zinc-500 blur-[3px]">
                  {item.connection}
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full border border-zinc-200 bg-white/90 px-4 py-1.5 text-xs font-medium text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400">
                    <svg className="mr-1.5 inline h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    🔒 Unlock with Premium
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-500">
                {item.connection}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function BlindspotBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
      Blindspot
    </span>
  );
}

function CategorySection({ category, items }: { category: string; items: ScanItem[] }) {
  const meta = CATEGORY_META[category] || { label: category, color: "zinc" };
  const colorDot: Record<string, string> = {
    blue: "bg-blue-500", violet: "bg-violet-500", cyan: "bg-cyan-500",
    emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500",
    lime: "bg-lime-500", fuchsia: "bg-fuchsia-500", orange: "bg-orange-500",
    sky: "bg-sky-500", teal: "bg-teal-500", zinc: "bg-zinc-500",
  };
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${colorDot[meta.color] || "bg-zinc-500"}`} />
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{meta.label}</h3>
        <span className="text-xs text-zinc-400 dark:text-zinc-600">{items.length}</span>
      </div>
      <div className="mt-3 space-y-1">
        {items.map((item, i) => (
          <StoryCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fallback states
// ---------------------------------------------------------------------------

function NeedsOnboarding() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
          Welcome to Albis
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100">
          Set up your briefing
        </h1>
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">
          Choose the topics and regions you want to track. Takes 30 seconds.
        </p>
        <Link
          href="/onboarding"
          className="mt-8 inline-flex h-11 min-w-[44px] items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}

function NoScanData() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          Your Briefing
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          No scan data available yet. Your next briefing will appear here automatically.
        </p>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function groupByCategory(items: ScanItem[]): Map<string, ScanItem[]> {
  const groups = new Map<string, ScanItem[]>();
  const order = Object.keys(CATEGORY_META);
  for (const item of items) {
    const existing = groups.get(item.category) || [];
    existing.push(item);
    groups.set(item.category, existing);
  }
  const sorted = new Map<string, ScanItem[]>();
  for (const cat of order) {
    if (groups.has(cat)) sorted.set(cat, groups.get(cat)!);
  }
  for (const [cat, catItems] of groups) {
    if (!sorted.has(cat)) sorted.set(cat, catItems);
  }
  return sorted;
}
