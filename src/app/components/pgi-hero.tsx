import Link from "next/link";

interface PgiHeroProps {
  pgi: number | null;
  delta: number | null;
  date: string | null;
}

function getScoreColor(pgi: number): string {
  if (pgi >= 8) return "text-red-500";
  if (pgi >= 6) return "text-amber-500";
  if (pgi >= 4) return "text-yellow-500";
  return "text-emerald-500";
}

function getScoreLabel(pgi: number): string {
  if (pgi >= 8) return "Critical — opposing narratives on the same events";
  if (pgi >= 6) return "High — significant framing gaps across regions";
  if (pgi >= 4) return "Moderate — noticeable differences in coverage";
  return "Low — broad global consensus";
}

export function PgiHero({ pgi, delta }: PgiHeroProps) {
  if (pgi === null) {
    return (
      <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f] border-t border-black/5 dark:border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-8 md:py-10 text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 mb-4">
            Today&apos;s Global Perception Gap
          </p>
          <div className="h-14 w-28 mx-auto rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 animate-pulse" />
          <div className="h-4 w-64 mx-auto mt-3 rounded bg-zinc-200/40 dark:bg-zinc-800/40 animate-pulse" />
        </div>
      </section>
    );
  }

  const colorClass = getScoreColor(pgi);
  const label = getScoreLabel(pgi);

  return (
    <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f] border-t border-black/5 dark:border-white/5">
      <div className="mx-auto max-w-3xl px-6 py-8 md:py-10 text-center">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
          Today&apos;s Global Perception Gap
        </p>

        <p className={`mt-3 font-[family-name:var(--font-playfair)] text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight ${colorClass}`}>
          {pgi.toFixed(1)}
        </p>

        <p className="mt-2 text-sm sm:text-base font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </p>

        {delta !== null && (
          <p className={`mt-2 text-sm font-medium font-[family-name:var(--font-geist-mono)] ${delta > 0 ? "text-red-500" : delta < 0 ? "text-emerald-500" : "text-zinc-400"}`}>
            {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"}{" "}
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} from yesterday
          </p>
        )}

        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500 max-w-md mx-auto leading-relaxed">
          The PGI measures how differently the same events are reported across 7 world regions. 1&nbsp;=&nbsp;global consensus. 10&nbsp;=&nbsp;opposing realities.
        </p>

        <Link
          href="/indexes/pgi"
          className="mt-3 inline-block text-sm font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors"
        >
          See full breakdown →
        </Link>
      </div>
    </section>
  );
}
