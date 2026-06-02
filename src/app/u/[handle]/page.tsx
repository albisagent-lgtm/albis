import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/app/components/follow-button";
import { authorProfileHandle, getSignalsByAuthorHandle, type Signal } from "@/lib/signals";

export const revalidate = 120;
export const dynamicParams = true;

interface Props { params: Promise<{ handle: string }>; }

function displayHandle(handle: string) {
  return `@${handle.replace(/^@+/, "")}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recent";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function aiReviewLabel(signal: Signal) {
  const status = typeof signal.metadata?.ai_review_status === "string" ? signal.metadata.ai_review_status : null;
  if (status === "generated") return "AI-reviewed";
  if (status === "queued") return "AI review queued";
  if (status === "processing") return "AI reviewing";
  if (status === "failed") return "AI review failed";
  return null;
}

function ProfileCard({ signal }: { signal: Signal }) {
  const label = signal.category?.replaceAll("-", " ") || "card";
  const review = aiReviewLabel(signal);
  return (
    <article className="rounded-3xl border border-black/[0.08] bg-white p-5 transition hover:border-[#c8922a]/35 dark:border-white/[0.08] dark:bg-white/[0.035]">
      <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">
        <span>{label}</span>
        {review ? <span>· {review}</span> : null}
        <span>· {formatDate(signal.published_at)}</span>
      </div>
      <Link href={`/signals/${signal.slug}`} className="group mt-3 block">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight group-hover:text-[#b58320]">
          {signal.title}
        </h2>
        {signal.summary ? <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{signal.summary}</p> : null}
      </Link>
      {signal.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {signal.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="rounded-full border border-black/[0.08] px-2 py-0.5 font-[family-name:var(--font-inter)] text-[10px] font-semibold text-zinc-400 dark:border-white/[0.08]">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/signals/${signal.slug}`} className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white dark:bg-white dark:text-black">
          Open
        </Link>
        {signal.article_url ? (
          <a href={signal.article_url} target="_blank" rel="noreferrer" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
            Source
          </a>
        ) : null}
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const clean = authorProfileHandle(handle);
  if (!clean) return {};
  return {
    title: `${displayHandle(clean)} — Albis`,
    description: `Cards and posts from ${displayHandle(clean)} on Albis.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const clean = authorProfileHandle(handle);
  if (!clean) notFound();

  const cards = await getSignalsByAuthorHandle(clean, 36);
  const name = displayHandle(clean);
  const aiReviewedCount = cards.filter((card) => typeof card.metadata?.ai_review_status === "string" && card.metadata.ai_review_status !== "not_requested").length;

  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-8 text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea] md:px-6">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Albis profile</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">{name}</h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                Cards, sources, AI-reviewed submissions, and conversations from this Albis contributor.
              </p>
            </div>
            <FollowButton type="person" label={name} className="rounded-full bg-[#c8922a] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2 font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{cards.length} card{cards.length === 1 ? "" : "s"}</span>
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{aiReviewedCount} AI-reviewed</span>
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">Public profile beta</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {cards.length ? cards.map((signal) => <ProfileCard key={signal.id} signal={signal} />) : (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white/50 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.025]">
              <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">No public cards yet.</p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">When {name} publishes cards, they’ll appear here.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
