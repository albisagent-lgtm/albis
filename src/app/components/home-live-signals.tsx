import Link from "next/link";
import { getLatestSignals } from "@/lib/signals";
import { SignalCard } from "@/app/components/signal-card";

export async function HomeLiveSignals() {
  const signals = await getLatestSignals(3);
  if (signals.length === 0) return null;

  return (
    <section className="border-y border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-black/10 pb-3 dark:border-white/10">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Live on Albis</p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">Today on Albis</h2>
          </div>
          <Link href="/signals" className="shrink-0 text-sm font-medium text-[#b58320] hover:text-[#8a6417]">
            See all →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {signals.map((signal) => <SignalCard key={signal.id} signal={signal} />)}
        </div>
      </div>
    </section>
  );
}
