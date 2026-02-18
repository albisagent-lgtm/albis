import Link from "next/link";
import {
  getTodayScan,
  hasFramingWatch,
  REGION_LABELS,
  type ScanItem,
} from "@/lib/scan-parser";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const scan = getTodayScan();

  return (
    <main>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800/50">
        {/* Subtle gradient accent */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-transparent to-transparent dark:from-amber-950/10 dark:via-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 py-24 md:py-36">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
            News intelligence, not noise
          </p>
          <h1 className="mt-6 text-4xl font-light leading-[1.15] tracking-tight text-zinc-800 dark:text-zinc-100 md:text-5xl lg:text-6xl">
            Your own personal
            <br />
            <span className="italic">news agent</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
            Albis scans the globe every day and surfaces the patterns that
            matter to you — without the doom-scrolling, outrage bait, or
            algorithmic spin.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-8 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
            Free tier &middot; 2 topics, 1 region &middot; No credit card
          </p>
        </div>
      </section>

      {/* ── Live Demo — Today's Scan ────────────────────────────────── */}
      {scan && (
        <section className="border-b border-zinc-200 py-16 dark:border-zinc-800/50 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
              <time
                dateTime={scan.date}
                className="text-zinc-500 dark:text-zinc-500"
              >
                {scan.displayDate}
              </time>
              {scan.mood && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-700">
                    &middot;
                  </span>
                  <MoodBadge mood={scan.mood} />
                </>
              )}
            </div>

            {/* Pattern of the Day */}
            {scan.patternOfDay && (
              <div className="mt-8">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
                  Pattern of the Day
                </p>
                {scan.patternOfDay.title && (
                  <h2 className="mt-4 text-2xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-3xl">
                    {scan.patternOfDay.title}
                  </h2>
                )}
                <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {scan.patternOfDay.body}
                </p>
              </div>
            )}

            {/* Top Stories Preview */}
            {scan.items.filter((i) => i.significance === "high").length > 0 && (
              <div className="mt-10">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                  Top Stories
                </p>
                <div className="mt-4 space-y-1">
                  {scan.items
                    .filter((i) => i.significance === "high")
                    .slice(0, 5)
                    .map((item, i) => (
                      <StoryCard key={i} item={item} />
                    ))}
                </div>
                {scan.items.filter((i) => i.significance === "high").length >
                  5 && (
                  <p className="mt-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
                    +{" "}
                    {scan.items.filter((i) => i.significance === "high")
                      .length - 5}{" "}
                    more high-significance stories today
                  </p>
                )}
              </div>
            )}

            {/* Scan stats */}
            <div className="mt-8 flex flex-wrap gap-6 border-t border-zinc-200 pt-6 dark:border-zinc-800/50">
              <Stat
                label="Stories scanned"
                value={String(scan.items.length)}
              />
              <Stat
                label="Categories"
                value={String(
                  new Set(scan.items.map((i) => i.category)).size
                )}
              />
              <Stat
                label="Regions"
                value={String(
                  new Set(scan.items.flatMap((i) => i.regions)).size
                )}
              />
              {scan.items.some((i) => hasFramingWatch(i)) && (
                <Stat
                  label="Framing alerts"
                  value={String(
                    scan.items.filter((i) => hasFramingWatch(i)).length
                  )}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Value Propositions ──────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            How it works
          </p>
          <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 md:text-4xl">
            Intelligence, not information overload
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-zinc-500 dark:text-zinc-400">
            Most news tells you what happened. Albis tells you what it means —
            and what you are not being told.
          </p>

          <div className="mt-16 grid gap-10 md:grid-cols-2">
            <ValueProp
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              }
              title="Global scanning"
              description="Every day, Albis scans 7 regions across 12 topic categories. South Asia, East Asia, the Middle East, Africa, Europe, the Americas, and the West — all in one place."
            />
            <ValueProp
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              title="Pattern detection"
              description="We do not just list headlines. Albis identifies cross-domain patterns, recurring themes, and structural connections that single-source reporting misses."
            />
            <ValueProp
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              }
              title="Framing analysis"
              description="Same event, different story. Framing Watch compares how regions cover the same event — revealing what gets emphasised, what gets omitted, and why."
            />
            <ValueProp
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
              title="Personalised briefings"
              description="Choose your topics and regions. Your daily briefing surfaces only the patterns that matter to you — no noise, no endless scroll, no outrage engine."
            />
          </div>
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────────── */}
      <section className="border-y border-zinc-200 py-16 dark:border-zinc-800/50 md:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Early access
          </p>
          <p className="mt-6 text-xl font-light italic leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-2xl">
            &ldquo;The anti-doomscroll. I finally understand what is actually
            happening in the world without feeling worse about it.&rdquo;
          </p>
          <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
            — Early beta tester
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 md:text-4xl">
            Get your personalised briefing
          </h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-500 dark:text-zinc-400">
            Choose your topics and regions. We&apos;ll surface the patterns that
            matter to you — daily, without the noise.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Sign up free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center rounded-full border border-zinc-300 px-8 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
            Free tier: 2 topics, 1 region, daily Pattern of the Day
          </p>
        </div>
      </section>

      {/* Scan metadata */}
      {scan?.scanMeta && (
        <div className="border-t border-zinc-200 py-4 dark:border-zinc-800/50">
          <p className="text-center font-[family-name:var(--font-geist-mono)] text-xs text-zinc-300 dark:text-zinc-700">
            {scan.scanMeta}
          </p>
        </div>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function MoodBadge({ mood }: { mood: string }) {
  const lower = mood.toLowerCase();
  let colorClasses =
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";

  if (lower.includes("urgent") || lower.includes("critical")) {
    colorClasses =
      "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400";
  } else if (
    lower.includes("brittle") ||
    lower.includes("tense") ||
    lower.includes("fragment")
  ) {
    colorClasses =
      "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
  } else if (lower.includes("calm") || lower.includes("stable")) {
    colorClasses =
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses}`}
    >
      {mood}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function StoryCard({ item }: { item: ScanItem }) {
  const framing = hasFramingWatch(item);

  return (
    <article className="group rounded-lg px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
      <div className="flex gap-3">
        <SignificanceDot significance={item.significance} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium leading-snug text-zinc-800 dark:text-zinc-100">
            {item.headline}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.regions.map((r) => (
              <RegionTag key={r} region={r} />
            ))}
            {item.patterns.map((p) => (
              <PatternTag key={p} pattern={p} />
            ))}
            {framing && <FramingWatchBadge />}
          </div>
          <div className="mt-2">
            {framing ? (
              <div className="relative">
                <p className="select-none text-sm leading-relaxed text-zinc-500 blur-[3px]">
                  {item.connection}
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full border border-zinc-200 bg-white/90 px-4 py-1.5 text-xs font-medium text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400">
                    <svg
                      className="mr-1.5 inline h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Unlock with Premium
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
                {item.connection}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
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
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      Framing Watch
    </span>
  );
}

function ValueProp({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </div>
  );
}
