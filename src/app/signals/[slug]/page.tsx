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
      <article className="mx-auto max-w-[760px] px-5 py-8 md:px-6 md:py-14">
        <QuickSignal signal={signal} />

        <section className="mt-8 rounded-2xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Human context</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold">People can help clarify the picture</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            The signal above is the verified Albis report. The notes below are reader reports: useful local observations, sources, corrections, and context that may need checking.
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
          />
        ) : null}
      </article>
    </main>
  );
}
