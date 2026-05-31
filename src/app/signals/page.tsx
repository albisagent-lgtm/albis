import type { Metadata } from "next";
import Link from "next/link";
import { getSignals } from "@/lib/signals";
import { SignalBoardTopFour } from "@/app/components/signal-board-top-four";
import { SignalCardV2 } from "@/app/components/signal-card-v2";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Albis Signals — Truth, Clarity & Trust",
  description: "A clean global signal board from Albis: what happened, what is unclear, what is missing, and how readers can add context.",
};

const CATEGORIES = ["world", "conflict", "governance", "health", "economic-flows", "energy", "climate", "technology", "life-systems", "perspectives"];

function formatCategory(value: string) {
  return value.replaceAll("-", " ");
}

function getMetaNumber(signal: { metadata: Record<string, unknown> }, keys: string[]) {
  for (const key of keys) {
    const value = signal.metadata[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function buildScanStats(signals: Awaited<ReturnType<typeof getSignals>>) {
  const sourceTotal = signals.reduce((sum, signal) => sum + getMetaNumber(signal, ["source_count", "sourceCount", "sources", "sources_scanned"]), 0);
  const regions = new Set<string>();
  const languages = new Set<string>();

  for (const signal of signals) {
    if (signal.region) regions.add(signal.region);
    const present = signal.metadata.regions_present || signal.metadata.regionsPresent || signal.metadata.regions_found || signal.metadata.regionsFound;
    if (Array.isArray(present)) present.forEach((region) => regions.add(String(region)));
    const langs = signal.metadata.languages || signal.metadata.language_codes || signal.metadata.languageCodes;
    if (Array.isArray(langs)) langs.forEach((language) => languages.add(String(language)));
  }

  const readerReports = signals.reduce((sum, signal) => sum + (signal.comment_count || 0), 0);
  const latest = signals
    .map((signal) => new Date(signal.updated_at || signal.published_at).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => b - a)[0];

  return {
    sourceTotal,
    regionCount: regions.size,
    languageCount: languages.size,
    readerReports,
    latest: latest ? new Date(latest) : null,
  };
}

function formatUpdated(date: Date | null) {
  if (!date) return "Updated recently";
  return `Updated ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function StatusChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-black/[0.08] bg-white/70 px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
      {children}
    </span>
  );
}

export default async function SignalsPage({ searchParams }: { searchParams?: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const category = params?.category && CATEGORIES.includes(params.category) ? params.category : undefined;
  const signals = await getSignals({ limit: 48, category });
  const stats = buildScanStats(signals);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-10 overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
          <div className="grid gap-8 p-5 md:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.2em] text-[#b58320]">Albis Signals</p>
              <h1 className="mt-3 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl">
                Truth, Clarity &amp; Trust.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 md:text-xl">
                A clean global signal board: what happened, what is unclear, what is missing, and how readers can help verify the picture.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <StatusChip>{formatUpdated(stats.latest)}</StatusChip>
                <StatusChip>{stats.sourceTotal > 0 ? `${stats.sourceTotal} sources seen` : `${signals.length} signals`}</StatusChip>
                <StatusChip>{stats.regionCount > 0 ? `${stats.regionCount} regions` : "Global scan"}</StatusChip>
                {stats.languageCount > 0 ? <StatusChip>{stats.languageCount} languages</StatusChip> : null}
                <StatusChip>{stats.readerReports} reader report{stats.readerReports === 1 ? "" : "s"}</StatusChip>
              </div>
            </div>

            <aside className="rounded-2xl border border-[#c8922a]/25 bg-[#fffaf0] p-4 dark:bg-[#c8922a]/[0.07]">
              <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">How this works</p>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <p><span className="font-semibold">AI scans</span> global coverage and clusters signals.</p>
                <p><span className="font-semibold">Albis clarifies</span> what is known, unclear, missing, or differently framed.</p>
                <p><span className="font-semibold">Readers add</span> sources, corrections, questions, and local context — without clout mechanics.</p>
              </div>
            </aside>
          </div>

          <div className="border-t border-black/[0.06] px-5 py-4 dark:border-white/[0.06] md:px-8">
            <div className="flex flex-wrap gap-2">
              <Link href="/signals" className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${!category ? "border-[#c8922a] bg-[#c8922a]/10 text-[#9b6b18]" : "border-black/10 text-zinc-500 dark:border-white/10"}`}>
                All
              </Link>
              {CATEGORIES.map((cat) => (
                <Link key={cat} href={`/signals?category=${cat}`} className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${category === cat ? "border-[#c8922a] bg-[#c8922a]/10 text-[#9b6b18]" : "border-black/10 text-zinc-500 hover:text-[#b58320] dark:border-white/10"}`}>
                  {formatCategory(cat)}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {signals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white/50 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.025]">
            <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Signals are almost ready.</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              New published reports will appear here automatically with source trails, context prompts, and verification status.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            <SignalBoardTopFour signals={signals} />

            <section aria-labelledby="ranked-signals-heading">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.08] pb-3 dark:border-white/[0.08]">
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Ranked feed</p>
                  <h2 id="ranked-signals-heading" className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
                    Latest signals from the scan
                  </h2>
                </div>
                <p className="max-w-lg text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Each signal keeps the evidence layer close: source spread, uncertainty, reader context, and what can be checked next.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {signals.map((signal, index) => <SignalCardV2 key={signal.id} signal={signal} rank={index + 1} />)}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035] md:p-6">
              <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Albis method</p>
              <div className="mt-3 grid gap-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 md:grid-cols-3">
                <p><span className="font-semibold text-zinc-900 dark:text-zinc-100">Popularity is not truth.</span> Signals are organised by coverage spread, regional difference, uncertainty, source trails, and editorial usefulness.</p>
                <p><span className="font-semibold text-zinc-900 dark:text-zinc-100">User context is labelled.</span> Reader reports stay separate from verified Albis reporting until checked or incorporated.</p>
                <p><span className="font-semibold text-zinc-900 dark:text-zinc-100">Corrections are part of trust.</span> If something is wrong or incomplete, the product should make it easy to improve the record.</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
