import type { Metadata } from "next";
import Link from "next/link";
import { LiveEventFeed } from "@/app/components/live-event-feed";
import { getSignals } from "@/lib/signals";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Events — Albis",
  description: "A live Albis feed of events with comments and reader context.",
};

const CATEGORIES = ["world", "conflict", "governance", "health", "economic-flows", "energy", "climate", "technology", "life-systems", "perspectives"];

function formatCategory(value: string) {
  return value.replaceAll("-", " ");
}

export default async function SignalsPage({ searchParams }: { searchParams?: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const category = params?.category && CATEGORIES.includes(params.category) ? params.category : undefined;
  const signals = await getSignals({ limit: 60, category });
  const events = signals.map((signal) => ({
    id: signal.id,
    href: `/signals/${signal.slug}`,
    label: signal.category?.replaceAll("-", " ") || "event",
    title: signal.title,
    summary: signal.summary,
    meta: signal.region || undefined,
    action: "Open",
    articleSlug: signal.article_slug,
    commentCount: signal.comment_count,
  }));

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-5xl">Events</h1>
            <div className="flex flex-wrap gap-2">
              <Link href="/signals" className={`rounded-full px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold ${!category ? "bg-[#111] text-white dark:bg-white dark:text-black" : "border border-black/[0.12] text-zinc-600 dark:border-white/[0.12] dark:text-zinc-300"}`}>All</Link>
              <Link href="/community-weather" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 dark:border-white/[0.12] dark:text-zinc-300">Weather</Link>
            </div>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <Link key={cat} href={`/signals?category=${cat}`} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${category === cat ? "border-[#c8922a] bg-[#c8922a]/10 text-[#9b6b18]" : "border-black/10 text-zinc-500 hover:text-[#b58320] dark:border-white/10"}`}>
                {formatCategory(cat)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-4 md:px-6">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white/50 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.025]">
            <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">No events yet.</p>
          </div>
        ) : (
          <LiveEventFeed events={events} />
        )}
      </section>
    </main>
  );
}
