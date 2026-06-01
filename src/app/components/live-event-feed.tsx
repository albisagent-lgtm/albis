"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArticleComments } from "./article-comments";

export type LiveFeedEvent = {
  id: string;
  href: string;
  label: string;
  title: string;
  summary?: string | null;
  meta?: string;
  action?: string;
  articleSlug?: string | null;
  commentCount?: number | null;
  author?: string;
  source?: string;
  sourceHref?: string;
  timestamp?: string;
};

function CommentLabel({ count }: { count?: number | null }) {
  if (!count) return <>Comment</>;
  return <>{count} comment{count === 1 ? "" : "s"}</>;
}

function FeedRow({ event, feature = false, open, onToggle }: { event: LiveFeedEvent; feature?: boolean; open: boolean; onToggle: () => void }) {
  const byline = [event.author || event.source || "Albis", event.timestamp || event.meta].filter(Boolean).join(" · ");
  const commentSlug = event.articleSlug || event.id;

  async function shareCard() {
    const url = `${window.location.origin}${event.href}`;
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
            {byline ? <p className="font-[family-name:var(--font-inter)] text-xs text-zinc-400">{byline}</p> : null}
          </div>

          <Link href={event.href} className="group mt-3 block">
            <h2 className={`font-[family-name:var(--font-playfair)] font-bold leading-tight tracking-tight group-hover:text-[#b58320] ${feature ? "text-3xl md:text-4xl" : "text-2xl"}`}>
              {event.title}
            </h2>
            {event.summary ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-[15px]">{event.summary}</p> : null}
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"
          >
            <CommentLabel count={event.commentCount} />
          </button>
          <Link href={event.href} className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black">
            {event.action || "Open"}
          </Link>
          <button
            type="button"
            onClick={shareCard}
            className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"
          >
            Share
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
