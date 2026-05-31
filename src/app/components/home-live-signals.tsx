import Link from "next/link";
import { getLatestSignals } from "@/lib/signals";
import { SignalCardV2 } from "@/app/components/signal-card-v2";

export async function HomeLiveSignals() {
  const signals = await getLatestSignals(4);
  if (signals.length === 0) return null;

  return (
    <section className="border-y border-black/[0.08] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.08] pb-3 dark:border-white/[0.08]">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Live signal board</p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">What Albis is watching now</h2>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 md:block">
              A calmer feed of what is broadly covered, undercovered, diverging, or still needs context.
            </p>
            <Link href="/signals" className="shrink-0 rounded-full bg-[#111] px-4 py-2 text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black dark:hover:bg-[#f0c15e]">
              Open signals
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {signals.map((signal, index) => <SignalCardV2 key={signal.id} signal={signal} rank={index + 1} />)}
        </div>
      </div>
    </section>
  );
}
