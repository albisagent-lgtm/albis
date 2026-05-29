import Link from "next/link";
import type { Signal } from "@/lib/signals";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function label(value: string | null) {
  return value ? value.replaceAll("-", " ") : "Albis";
}

export function SignalCard({ signal }: { signal: Signal }) {
  const bullets = signal.bullets.slice(0, 4);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8922a]/30 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em]">
        <span className="rounded-full bg-[#c8922a]/10 px-2.5 py-1 text-[#9b6b18] dark:text-[#f0c15e]">{label(signal.category)}</span>
        {signal.region ? <span className="text-zinc-400">{signal.region}</span> : null}
      </div>

      <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight text-[#111] dark:text-[#f4f1ea]">
        <Link href={`/signals/${signal.slug}`} className="hover:text-[#b58320]">
          {signal.title}
        </Link>
      </h2>

      {signal.summary ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{signal.summary}</p> : null}

      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8922a]" />
            <span className="line-clamp-2">{bullet}</span>
          </li>
        ))}
      </ul>

      {signal.still_unclear ? (
        <p className="mt-4 rounded-xl bg-black/[0.025] px-3 py-2 text-xs leading-relaxed text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Still unclear:</span> {signal.still_unclear}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5 font-[family-name:var(--font-inter)] text-xs text-zinc-400">
        <span>Updated {formatDate(signal.updated_at || signal.published_at)}</span>
        <span>{signal.comment_count || 0} context notes</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/signals/${signal.slug}`} className="rounded-full bg-[#111] px-4 py-2 text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black dark:hover:bg-[#f0c15e]">
          Open signal
        </Link>
        {signal.article_url ? (
          <Link href={signal.article_url} className="rounded-full border border-black/[0.1] px-4 py-2 text-xs font-bold text-zinc-600 hover:border-[#c8922a]/40 hover:text-[#b58320] dark:border-white/[0.1] dark:text-zinc-300">
            Read full report
          </Link>
        ) : null}
      </div>
    </article>
  );
}
