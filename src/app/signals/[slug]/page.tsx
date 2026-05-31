import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSignalBySlug } from "@/lib/signals";
import { QuickSignal } from "@/app/components/quick-signal";
import { ArticleComments } from "@/app/components/article-comments";

export const revalidate = 300;
export const dynamicParams = true;

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const signal = await getSignalBySlug(slug);
  if (!signal) return {};
  return {
    title: `${signal.title} — Albis`,
    description: signal.summary || "A short verified Albis report with reader context.",
    openGraph: {
      title: signal.title,
      description: signal.summary || undefined,
      type: "article",
    },
  };
}

export default async function SignalDetailPage({ params }: Props) {
  const { slug } = await params;
  const signal = await getSignalBySlug(slug);
  if (!signal) notFound();

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <article className="mx-auto max-w-[920px] px-5 py-8 md:px-6 md:py-14">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <QuickSignal signal={signal} />

          <aside className="rounded-2xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">How this works</p>
            <div className="mt-4 space-y-4 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">1. Albis verifies the signal</p>
                <p className="mt-1 text-xs">The top card is generated from a published Albis report and global scan.</p>
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">2. Readers add context</p>
                <p className="mt-1 text-xs">Local updates, sources, corrections, questions, and background sit underneath.</p>
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">3. No clout mechanics</p>
                <p className="mt-1 text-xs">No likes or follower games. Useful context may help improve the report.</p>
              </div>
            </div>
          </aside>
        </div>

        <section id="context" className="mt-8 rounded-2xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Collaborative context</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold">Help clarify the picture</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            The signal above is the verified Albis report. Reader reports below are separated clearly: local observations, sources, corrections, questions, and context that may need checking before Albis incorporates them.
          </p>
        </section>

        {signal.article_slug ? (
          <ArticleComments
            articleSlug={signal.article_slug}
            eyebrow="Reader context"
            title="What people are seeing"
            prompt="What are you seeing from where you are?"
            helper="Share a local update, source, correction, or context. Reader reports are not verified by Albis unless marked otherwise."
            placeholder="What are you seeing from where you are? Add a local update, source, correction, or context…"
            emptyText="No reader reports yet. Be the first to add local context."
            submitLabel="Share context"
            structuredReports
          />
        ) : null}
      </article>
    </main>
  );
}
