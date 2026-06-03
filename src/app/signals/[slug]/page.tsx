import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authorProfileHandle, getSignalBySlug } from "@/lib/signals";
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

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] || null;
    if (!host.endsWith("youtube.com")) return null;
    if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
    const match = parsed.pathname.match(/^\/(shorts|embed)\/([^/?#]+)/);
    return match?.[2] || null;
  } catch {
    return null;
  }
}

function sourceInfo(url: string) {
  try {
    const parsed = url.startsWith("/") ? new URL(url, "https://www.albis.news") : new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const isAlbis = host === "albis.news" || host === "www.albis.news";
    const pathLabel = parsed.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-\d{4}$/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Source";
    return {
      href: url.startsWith("/") ? url : parsed.toString(),
      host,
      isAlbis,
      title: isAlbis ? "Read the full article" : "Open the original source",
      eyebrow: isAlbis ? "Article" : "Source",
      detail: isAlbis ? pathLabel : host,
      cta: isAlbis ? "Read article" : `Open ${host}`,
    };
  } catch {
    return {
      href: url,
      host: "source",
      isAlbis: false,
      title: "Open source",
      eyebrow: "Source",
      detail: "External link",
      cta: "Open link",
    };
  }
}

function SourcePreview({ url }: { url: string }) {
  const youtubeId = getYouTubeId(url);
  const info = sourceInfo(url);

  if (youtubeId) {
    return (
      <div className="mt-6 overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-sm dark:border-white/[0.10] dark:bg-white/[0.04]">
        <div className="aspect-video bg-zinc-200 dark:bg-zinc-900">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title="YouTube video player"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 font-[family-name:var(--font-inter)]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b58320]">Source video</p>
            <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Watch inside this card</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="max-w-full truncate rounded-full border border-black/[0.10] px-3 py-1 text-xs font-semibold text-zinc-500 hover:border-[#c8922a]/40 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"
          >
            Open on YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <a
      href={info.href}
      target={info.isAlbis ? undefined : "_blank"}
      rel={info.isAlbis ? undefined : "noreferrer"}
      className="group mt-6 block rounded-3xl border border-black/[0.08] bg-white p-4 font-[family-name:var(--font-inter)] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8922a]/45 hover:shadow-md dark:border-white/[0.10] dark:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b58320]">{info.eyebrow}</p>
          <p className="mt-2 text-base font-bold text-zinc-900 dark:text-zinc-100">{info.title}</p>
          <p className="mt-1 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">{info.detail}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#111] px-3 py-1.5 text-xs font-bold text-white transition group-hover:bg-[#b58320] dark:bg-white dark:text-black">
          {info.cta} →
        </span>
      </div>
    </a>
  );
}

export default async function SignalDetailPage({ params }: Props) {
  const { slug } = await params;
  const signal = await getSignalBySlug(slug);
  if (!signal) notFound();

  const commentSlug = signal.article_slug || `signal-${signal.id}`;
  const authorName = typeof signal.metadata?.author_name === "string" ? signal.metadata.author_name : "Albis";
  const authorHandle = authorProfileHandle(authorName);
  const aiReviewStatus = typeof signal.metadata?.ai_review_status === "string" ? signal.metadata.ai_review_status : null;
  const aiReviewLabel = aiReviewStatus === "generated"
    ? "AI-reviewed by Albis"
    : aiReviewStatus === "processing"
      ? "Albis AI review in progress"
      : aiReviewStatus === "queued"
        ? "Queued for Albis AI review"
        : aiReviewStatus === "failed"
          ? "AI review failed"
          : null;

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <article className="mx-auto max-w-3xl px-4 py-7 md:px-6 md:py-10">
        <div className="border-b border-black/[0.08] pb-6 dark:border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#b58320]">
            <span>{signal.category?.startsWith("people") ? "Card" : "Event"}</span>
            {signal.category ? <span>· {signal.category.replaceAll("-", " ")}</span> : null}
            {signal.region ? <span>· {signal.region}</span> : null}
          </div>
          <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {signal.title}
          </h1>
          <p className="mt-3 font-[family-name:var(--font-inter)] text-xs text-zinc-400">
            Published by {authorHandle && authorName !== "Albis" ? (
              <Link href={`/u/${authorHandle}`} className="font-semibold text-zinc-500 hover:text-[#b58320] dark:text-zinc-300">
                {authorName}
              </Link>
            ) : authorName}{aiReviewLabel ? ` · ${aiReviewLabel}` : ""} · {formatDate(signal.updated_at || signal.published_at)}
          </p>
          {signal.summary ? <p className="mt-5 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">{signal.summary}</p> : null}
          {signal.bullets.length ? (
            <ul className="mt-5 space-y-2 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
              {signal.bullets.slice(0, 4).map((bullet) => <li key={bullet}>• {bullet}</li>)}
            </ul>
          ) : null}
          {signal.article_url ? <SourcePreview url={signal.article_url} /> : null}
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="#comments" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">Comment</a>
          </div>
        </div>

        <div id="comments">
            <ArticleComments
              articleSlug={commentSlug}
              eyebrow="Comments"
              title="Comments"
              helper=""
              placeholder="Add a comment…"
              emptyText="No comments yet."
              submitLabel="Post"
            />
          </div>
      </article>
    </main>
  );
}
