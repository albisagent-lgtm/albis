import type { Metadata } from "next";
import Link from "next/link";
import { getSignals } from "@/lib/signals";
import { SignalCard } from "@/app/components/signal-card";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Today on Albis — Live Signals",
  description: "Short verified reports from Albis, with space for readers to share what they are seeing locally.",
};

const CATEGORIES = ["world", "conflict", "governance", "health", "economic-flows", "energy", "climate", "technology", "life-systems", "perspectives"];

export default async function SignalsPage({ searchParams }: { searchParams?: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const category = params?.category && CATEGORIES.includes(params.category) ? params.category : undefined;
  const signals = await getSignals({ limit: 48, category });

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8 rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] md:p-8">
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Live on Albis</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">Today on Albis</h1>
              <p className="mt-4 max-w-2xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
                Verified signals from the global scan, with space for readers to add local context, sources, corrections, and questions — calm collaboration without clout mechanics.
              </p>
            </div>
            <div className="rounded-2xl border border-[#c8922a]/25 bg-[#fffaf0] p-4 dark:bg-[#c8922a]/[0.07]">
              <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">How to contribute</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">Open a signal and answer: <span className="font-semibold">What are you seeing from where you are?</span></p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/signals" className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${!category ? "border-[#c8922a] bg-[#c8922a]/10 text-[#9b6b18]" : "border-black/10 text-zinc-500 dark:border-white/10"}`}>
              All
            </Link>
            {CATEGORIES.map((cat) => (
              <Link key={cat} href={`/signals?category=${cat}`} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${category === cat ? "border-[#c8922a] bg-[#c8922a]/10 text-[#9b6b18]" : "border-black/10 text-zinc-500 hover:text-[#b58320] dark:border-white/10"}`}>
                {cat.replaceAll("-", " ")}
              </Link>
            ))}
          </div>
        </header>

        {signals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 px-6 py-14 text-center dark:border-white/10">
            <p className="text-zinc-500 dark:text-zinc-400">Signals are almost ready. New published reports will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {signals.map((signal) => <SignalCard key={signal.id} signal={signal} />)}
          </div>
        )}
      </div>
    </main>
  );
}
