import Link from "next/link";
import type { Signal } from "@/lib/signals";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function QuickSignal({ signal, compact = false }: { signal: Signal; compact?: boolean }) {
  return (
    <section className="rounded-2xl border border-[#c8922a]/25 bg-[#fffaf0] p-5 shadow-sm dark:bg-[#c8922a]/[0.07]">
      <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b6b18] dark:text-[#f0c15e]">
        <span>Quick signal</span>
        {signal.category ? <span>· {signal.category.replaceAll("-", " ")}</span> : null}
        {signal.region ? <span>· {signal.region}</span> : null}
      </div>
      <h2 className={`mt-3 font-[family-name:var(--font-playfair)] font-bold leading-tight text-[#111] dark:text-[#f4f1ea] ${compact ? "text-xl" : "text-3xl"}`}>
        {compact ? <Link href={`/signals/${signal.slug}`} className="hover:text-[#b58320]">{signal.title}</Link> : signal.title}
      </h2>
      <p className="mt-2 font-[family-name:var(--font-inter)] text-xs text-zinc-500 dark:text-zinc-400">
        Last updated {formatDate(signal.updated_at || signal.published_at)}
      </p>
      {signal.summary && !compact ? <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{signal.summary}</p> : null}
      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {signal.bullets.slice(0, compact ? 3 : 6).map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8922a]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      {signal.still_unclear ? (
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <span className="font-semibold">Still unclear:</span> {signal.still_unclear}
        </p>
      ) : null}
      {signal.source_note && !compact ? <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">{signal.source_note}</p> : null}
      <div className="mt-5 flex flex-wrap gap-2">
        {compact ? (
          <Link href={`/signals/${signal.slug}`} className="text-sm font-semibold text-[#b58320] hover:underline">
            Join the conversation →
          </Link>
        ) : null}
        {signal.article_url ? (
          <Link href={signal.article_url} className="rounded-full bg-[#111] px-4 py-2 text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black dark:hover:bg-[#f0c15e]">
            Read the full report
          </Link>
        ) : null}
      </div>
    </section>
  );
}
