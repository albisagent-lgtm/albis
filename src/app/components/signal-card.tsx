import Link from "next/link";
import type { Signal } from "@/lib/signals";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours >= 0 && diffHours < 24) return diffHours <= 1 ? "1h ago" : `${diffHours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function label(value: string | null) {
  return value ? value.replaceAll("-", " ") : "Albis";
}

export function SignalCard({ signal }: { signal: Signal }) {
  const bullets = signal.bullets.slice(0, 3);
  const contextCount = signal.comment_count || 0;
  return (
    <article className="group flex h-full flex-col rounded-[1.35rem] border border-black/[0.08] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8922a]/35 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-2 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#c8922a]/10 px-2.5 py-1 text-[#9b6b18] dark:text-[#f0c15e]">{label(signal.category)}</span>
          {signal.region ? <span className="text-zinc-400">{signal.region}</span> : null}
        </div>
        <span className="text-zinc-400">{formatDate(signal.updated_at || signal.published_at)}</span>
      </div>

      <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight text-[#111] dark:text-[#f4f1ea]">
        <Link href={`/signals/${signal.slug}`} className="hover:text-[#b58320]">
          {signal.title}
        </Link>
      </h2>

      {signal.summary ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{signal.summary}</p> : null}

      <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8922a]" />
            <span className="line-clamp-2">{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 font-[family-name:var(--font-inter)] text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="rounded-full bg-black/[0.035] px-2.5 py-1 dark:bg-white/[0.06]">Albis verified</span>
        <span className={`rounded-full px-2.5 py-1 ${contextCount > 0 ? "bg-[#c8922a]/10 text-[#8a6417] dark:text-[#f0c15e]" : "bg-black/[0.035] dark:bg-white/[0.06]"}`}>{contextCount} reader report{contextCount === 1 ? "" : "s"}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/signals/${signal.slug}`} className="rounded-full bg-[#111] px-4 py-2 text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black dark:hover:bg-[#f0c15e]">
          Add context
        </Link>
        {signal.article_url ? (
          <Link href={signal.article_url} className="rounded-full border border-black/[0.1] px-4 py-2 text-xs font-bold text-zinc-600 hover:border-[#c8922a]/40 hover:text-[#b58320] dark:border-white/[0.1] dark:text-zinc-300">
            Full report
          </Link>
        ) : null}
      </div>
    </article>
  );
}
