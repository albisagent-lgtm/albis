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
};

function CommentLabel({ count }: { count?: number | null }) {
  if (!count) return <>Comment</>;
  return <>{count} comment{count === 1 ? "" : "s"}</>;
}

function FeedRow({ event, feature = false, open, onToggle }: { event: LiveFeedEvent; feature?: boolean; open: boolean; onToggle: () => void }) {
  return (
    <article className={`border-b border-black/[0.08] bg-[#f8f7f4] transition dark:border-white/[0.08] dark:bg-[#101010] ${open ? "bg-white/70 dark:bg-white/[0.035]" : "hover:bg-white/70 dark:hover:bg-white/[0.035]"}`}>
      <div className={feature ? "py-6" : "py-5"}>
        <div className="grid gap-3 md:grid-cols-[88px_minmax(0,1fr)_auto] md:items-start">
          <div className="flex items-center gap-2 md:block">
            <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#b58320]">{event.label}</p>
            {event.meta ? <p className="mt-0 text-xs text-zinc-400 md:mt-2">{event.meta}</p> : null}
          </div>

          <Link href={event.href} className="group block">
            <h2 className={`font-[family-name:var(--font-playfair)] font-bold leading-tight tracking-tight group-hover:text-[#b58320] ${feature ? "text-3xl md:text-4xl" : "text-2xl"}`}>
              {event.title}
            </h2>
            {event.summary ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-[15px]">{event.summary}</p> : null}
          </Link>

          <div className="flex gap-2 md:justify-end">
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
          </div>
        </div>

        {open ? (
          <div className="mt-5 md:ml-[88px]">
            {event.articleSlug ? (
              <ArticleComments
                articleSlug={event.articleSlug}
                eyebrow=""
                title="Comments"
                helper=""
                placeholder="Add a comment…"
                emptyText="No comments yet."
                submitLabel="Post"
                compact
              />
            ) : (
              <div className="rounded-2xl border border-black/[0.08] bg-white p-4 text-sm text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400">
                Comments are opening for this item soon.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function LiveEventFeed({ events, leadId }: { events: LiveFeedEvent[]; leadId?: string }) {
  const initialOpen = useMemo(() => leadId || null, [leadId]);
  const [openId, setOpenId] = useState<string | null>(initialOpen);

  return (
    <div>
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
