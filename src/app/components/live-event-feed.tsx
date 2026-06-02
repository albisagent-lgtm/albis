"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArticleComments } from "./article-comments";
import { trackFeedEvent } from "./feed-event-tracking";

export type LiveFeedEvent = {
  id: string;
  href: string;
  label: string;
  title: string;
  summary?: string | null;
  meta?: string;
  action?: string;
  articleSlug?: string | null;
  cardSlug?: string;
  commentCount?: number | null;
  author?: string;
  source?: string;
  sourceHref?: string;
  authorHref?: string | null;
  timestamp?: string;
  tags?: string[];
  aiReviewStatus?: string | null;
};

function aiReviewLabel(status?: string | null) {
  if (!status || status === "not_requested") return null;
  if (status === "generated") return "AI-reviewed by Albis";
  if (status === "processing") return "Albis AI review in progress";
  if (status === "queued") return "Queued for Albis AI review";
  if (status === "failed") return "AI review failed";
  return "Albis AI review";
}

function CommentLabel({ count }: { count?: number | null }) {
  if (!count) return <>Comment</>;
  return <>{count} comment{count === 1 ? "" : "s"}</>;
}

function FeedRow({ event, feature = false, open, onToggle }: { event: LiveFeedEvent; feature?: boolean; open: boolean; onToggle: () => void }) {
  const [saved, setSaved] = useState(false);
  const reviewLabel = aiReviewLabel(event.aiReviewStatus);
  const bylineTail = [reviewLabel, event.timestamp || event.meta].filter(Boolean).join(" · ");
  const commentSlug = event.cardSlug || event.articleSlug || event.id;

  async function shareCard() {
    const url = `${window.location.origin}${event.href}`;
    trackFeedEvent(commentSlug, "share", { href: event.href });
    if (navigator.share) {
      await navigator.share({ title: event.title, text: event.summary || undefined, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => undefined);
  }

  return (
    <article className={`rounded-3xl border border-black/[0.08] bg-white p-4 transition dark:border-white/[0.08] dark:bg-white/[0.035] ${open ? "shadow-sm" : "hover:border-[#c8922a]/35"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#c8922a]/10 px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">
              {event.label}
            </span>
            <p className="font-[family-name:var(--font-inter)] text-xs text-zinc-400">
              {event.authorHref ? (
                <Link href={event.authorHref} className="font-semibold hover:text-[#b58320]">
                  {event.author || event.source || "Albis"}
                </Link>
              ) : event.author || event.source || "Albis"}
              {bylineTail ? ` · ${bylineTail}` : ""}
            </p>
          </div>

          <Link href={event.href} onClick={() => trackFeedEvent(commentSlug, "open", { href: event.href })} className="group mt-3 block">
            <h2 className={`font-[family-name:var(--font-playfair)] font-bold leading-tight tracking-tight group-hover:text-[#b58320] ${feature ? "text-3xl md:text-4xl" : "text-2xl"}`}>
              {event.title}
            </h2>
            {event.summary ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-[15px]">{event.summary}</p> : null}
          </Link>
          {event.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {event.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="rounded-full border border-black/[0.08] px-2 py-0.5 font-[family-name:var(--font-inter)] text-[10px] font-semibold text-zinc-400 dark:border-white/[0.08]">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              trackFeedEvent(commentSlug, "open", { surface: "comments" });
              onToggle();
            }}
            className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"
          >
            <CommentLabel count={event.commentCount} />
          </button>
          <Link href={event.href} onClick={() => trackFeedEvent(commentSlug, "open", { href: event.href, surface: "button" })} className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black">
            {event.action || "Open"}
          </Link>
          <button
            type="button"
            onClick={shareCard}
            className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"
          >
            Share
          </button>
          <button
            type="button"
            aria-pressed={saved}
            onClick={() => setSaved((current) => {
              trackFeedEvent(commentSlug, current ? "unsave" : "save");
              return !current;
            })}
            className={`rounded-full border px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold ${saved ? "border-[#c8922a]/60 bg-[#c8922a]/10 text-[#9b6b18] dark:text-[#f0c15e]" : "border-black/[0.12] text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"}`}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
        {event.sourceHref ? (
          <Link href={event.sourceHref} className="font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-400 hover:text-[#b58320]">
            Source
          </Link>
        ) : null}
      </div>

      {open ? (
        <div className="mt-5">
          <ArticleComments
            articleSlug={commentSlug}
            eyebrow=""
            title="Comments"
            helper=""
            placeholder="Add a comment…"
            emptyText="No comments yet."
            submitLabel="Post"
            compact
            onCommentPosted={() => trackFeedEvent(commentSlug, "comment")}
          />
        </div>
      ) : null}
    </article>
  );
}

export function LiveEventFeed({ events, leadId }: { events: LiveFeedEvent[]; leadId?: string }) {
  const initialOpen = useMemo(() => leadId || null, [leadId]);
  const [openId, setOpenId] = useState<string | null>(initialOpen);

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <FeedRow
          key={event.id}
          event={event}
          feature={index === 0}
          open={openId === event.id}
          onToggle={() => setOpenId((current) => current === event.id ? null : event.id)}
        />
      ))}
    </div>
  );
}
