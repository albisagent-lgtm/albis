import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSignalBySlug } from "@/lib/signals";
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
    description: signal.summary || "An Albis event with reader comments.",
    openGraph: { title: signal.title, description: signal.summary || undefined, type: "article" },
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function SignalDetailPage({ params }: Props) {
  const { slug } = await params;
  const signal = await getSignalBySlug(slug);
  if (!signal) notFound();

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <article className="mx-auto max-w-3xl px-4 py-7 md:px-6 md:py-10">
        <div className="border-b border-black/[0.08] pb-6 dark:border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#b58320]">
            <span>Event</span>
            {signal.category ? <span>· {signal.category.replaceAll("-", " ")}</span> : null}
            {signal.region ? <span>· {signal.region}</span> : null}
          </div>
          <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {signal.title}
          </h1>
          <p className="mt-3 font-[family-name:var(--font-inter)] text-xs text-zinc-400">Updated {formatDate(signal.updated_at || signal.published_at)}</p>
          {signal.summary ? <p className="mt-5 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">{signal.summary}</p> : null}
          {signal.bullets.length ? (
            <ul className="mt-5 space-y-2 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
              {signal.bullets.slice(0, 4).map((bullet) => <li key={bullet}>• {bullet}</li>)}
            </ul>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2">
            {signal.article_url ? <Link href={signal.article_url} className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black">Read</Link> : null}
            <a href="#comments" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">Comment</a>
          </div>
        </div>

        {signal.article_slug ? (
          <div id="comments">
            <ArticleComments
              articleSlug={signal.article_slug}
              eyebrow="Comments"
              title="Comments"
              helper=""
              placeholder="Add a comment…"
              emptyText="No comments yet."
              submitLabel="Post"
            />
          </div>
        ) : null}
      </article>
    </main>
  );
}
