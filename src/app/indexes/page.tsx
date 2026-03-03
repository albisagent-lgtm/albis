import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PgiChart, GaiChart, DivergenceChart } from "./charts";

export const metadata: Metadata = {
  title: "Indexes | Albis",
  description:
    "The Albis indexes measure how the world sees — and fails to see — the same stories. PGI measures perception divergence. GAI measures attention blindness.",
};

export const revalidate = 3600;

async function fetchIndexData() {
  const supabase = createAdminClient();

  const [pgiRes, gaiRes] = await Promise.all([
    supabase
      .from("pgi_daily")
      .select("date, daily_pgi")
      .order("date", { ascending: true }),
    supabase
      .from("gai_daily")
      .select("date, daily_gai")
      .order("date", { ascending: true }),
  ]);

  const pgiData = (pgiRes.data ?? []).map((r) => ({
    date: r.date,
    daily_pgi: Number(r.daily_pgi),
  }));

  const gaiData = (gaiRes.data ?? []).map((r) => ({
    date: r.date,
    daily_gai: Number(r.daily_gai),
  }));

  const dateMap = new Map<string, { pgi?: number; gai?: number }>();
  for (const p of pgiData) {
    dateMap.set(p.date, { ...dateMap.get(p.date), pgi: p.daily_pgi });
  }
  for (const g of gaiData) {
    dateMap.set(g.date, { ...dateMap.get(g.date), gai: g.daily_gai });
  }
  const combinedData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }));

  return { pgiData, gaiData, combinedData };
}

export default async function IndexesPage() {
  const { pgiData, gaiData, combinedData } = await fetchIndexData();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 md:pb-12">
      {/* Header */}
      <section className="mb-16 text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-5xl">
          Albis Indexes
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-500 dark:text-zinc-400">
          Two measurements. One question: how well does the world understand
          itself?
        </p>
      </section>

      {/* PGI Chart */}
      <Link href="/indexes/pgi" className="group mb-10 block rounded-2xl border border-black/[0.07] bg-white/50 p-6 transition-all hover:border-[#4f46e5]/30 hover:shadow-lg md:p-8 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-[#4f46e5]/40">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#4f46e5]">
              Perception Gap Index
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              How differently the world frames the same story
            </p>
          </div>
          <span className="text-sm font-medium text-[#4f46e5] group-hover:underline">
            Explore PGI &rarr;
          </span>
        </div>
        <PgiChart data={pgiData} />
      </Link>

      {/* GAI Chart */}
      <Link href="/indexes/gai" className="group mb-10 block rounded-2xl border border-black/[0.07] bg-white/50 p-6 transition-all hover:border-[#d97706]/30 hover:shadow-lg md:p-8 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-[#d97706]/40">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#d97706]">
              Global Attention Index
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Whether a story reaches you in the first place
            </p>
          </div>
          <span className="text-sm font-medium text-[#d97706] group-hover:underline">
            Explore GAI &rarr;
          </span>
        </div>
        <GaiChart data={gaiData} />
      </Link>

      {/* Divergence Chart */}
      <section className="mb-16 rounded-2xl border border-black/[0.07] bg-white/50 p-6 md:p-8 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <DivergenceChart
          data={combinedData}
          hasPgi={pgiData.length > 0}
          hasGai={gaiData.length > 0}
        />
        <p className="mt-6 border-t border-zinc-100 pt-6 text-sm leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          When lines diverge, information fails differently. High PGI + low GAI
          means the world sees the story but disagrees about what it means. High
          GAI + low PGI means the few who see it agree — but most of the world
          is blind to it entirely.
        </p>
      </section>

      {/* Chain explanation */}
      <section className="rounded-2xl border border-black/[0.07] bg-white/50 p-8 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
          The chain
        </h2>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Before you can disagree about a story, you have to see it. Before you
          form a belief, you need a narrative. Before you act, you need
          conviction. The Albis indexes measure the first two links in that
          chain.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-medium">
          <span className="rounded-full bg-[#d97706]/10 px-4 py-1.5 text-[#d97706]">
            Attention (GAI)
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <span className="rounded-full bg-[#4f46e5]/10 px-4 py-1.5 text-[#4f46e5]">
            Perception (PGI)
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-400 dark:bg-white/[0.04]">
            Belief
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-400 dark:bg-white/[0.04]">
            Action
          </span>
        </div>
      </section>
    </main>
  );
}
