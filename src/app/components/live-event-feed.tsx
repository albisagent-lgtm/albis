"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArticleComments } from "./article-comments";
import { trackFeedEvent } from "./feed-event-tracking";
import { UserAvatar } from "./user-avatar";

export type MediaPreview = {
  type: "image" | "video" | "youtube" | "source";
  url: string;
  alt?: string;
  badge?: string;
};

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
  authorAvatarUrl?: string | null;
  source?: string;
  sourceHref?: string;
  authorHref?: string | null;
  timestamp?: string;
  tags?: string[];
  aiReviewStatus?: string | null;
  mediaPreview?: MediaPreview;
  bullets?: string[];
  stillUnclear?: string | null;
  sourceNote?: string | null;
};

function cleanLabel(value: string) {
  const label = value.replace(/^#+/, "").replaceAll("-", " ").trim();
  if (!label) return "Event";
  return label.length > 18 ? label.slice(0, 18) : label;
}

function aiReviewLabel(status?: string | null) {
  if (!status || status === "not_requested") return null;
  if (status === "generated") return "AI reviewed";
  if (status === "processing") return "Review in progress";
  if (status === "queued") return "Queued for review";
  if (status === "failed") return "Review failed";
  return "AI reviewed";
}

function discussionLabel(count?: number | null) {
  if (!count) return "Discussion";
  return count > 0 ? "Active discussion" : "Discussion";
}

function matchesSearch(event: LiveFeedEvent, query: string) {
  if (!query.trim()) return true;
  const haystack = [
    event.title,
    event.summary,
    event.label,
    event.author,
    event.source,
    event.timestamp,
    ...(event.tags || []),
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function MediaPreviewBlock({ media, feature }: { media?: MediaPreview; feature?: boolean }) {
  if (!media?.url) return null;
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-black/[0.06] bg-zinc-100 dark:border-white/[0.08] dark:bg-white/[0.04] ${feature ? "mb-4 aspect-[16/8]" : "mb-3 aspect-[16/7]"}`}>
      {media.type === "video" ? (
        <video src={media.url} className="h-full w-full object-cover" muted playsInline preload="metadata" aria-label={media.alt || "Card video preview"} />
      ) : (
        <div className="h-full w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.015]" style={{ backgroundImage: `url(${media.url})` }} role="img" aria-label={media.alt || "Card media preview"} />
      )}
      <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
        {media.type === "youtube" ? "Video" : media.badge || (media.type === "video" ? "Video" : "Photo")}
      </span>
    </div>
  );
}

function CardDetailModal({ event, onClose, onShare, saved, onSave }: { event: LiveFeedEvent; onClose: () => void; onShare: () => void; saved: boolean; onSave: () => void }) {
  const commentSlug = event.cardSlug || event.articleSlug || event.id;
  const reviewLabel = aiReviewLabel(event.aiReviewStatus);
  const usefulBullets = (event.bullets || []).map((bullet) => bullet.trim()).filter(Boolean);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") onClose();
      if (keyboardEvent.key !== "Tab") return;
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || []).filter((node) => !node.hasAttribute("disabled") && node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 md:items-center md:px-6 md:py-8" role="dialog" aria-modal="true" aria-label={event.title}>
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-label="Close card" onClick={onClose} />
      <section ref={panelRef} className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[2rem] border border-black/10 bg-[#f8f7f4] p-4 shadow-2xl dark:border-white/10 dark:bg-[#101010] md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <UserAvatar name={event.author || event.source || "Albis"} imageUrl={event.authorAvatarUrl} size="sm" />
            <span className="rounded-full bg-[#c8922a]/10 px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">{cleanLabel(event.label)}</span>
            {reviewLabel ? <span className="rounded-full border border-black/[0.08] px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:border-white/[0.08] dark:text-zinc-300">{reviewLabel}</span> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-black/[0.12] px-3 py-1.5 text-sm font-bold text-zinc-600 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">Close</button>
        </div>

        <MediaPreviewBlock media={event.mediaPreview} feature />

        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight tracking-tight md:text-4xl">{event.title}</h2>
        {event.summary ? <p className="mt-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-200">{event.summary}</p> : null}
        <p className="mt-3 flex items-center gap-2 font-[family-name:var(--font-inter)] text-xs text-zinc-500 dark:text-zinc-400">
          <UserAvatar name={event.author || event.source || "Albis"} imageUrl={event.authorAvatarUrl} size="sm" />
          <span>{[event.author || event.source || "Albis", event.timestamp || event.meta].filter(Boolean).join(" · ")}</span>
        </p>

        {usefulBullets.length ? (
          <div className="mt-5 rounded-3xl border border-black/[0.08] bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">What to know</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              {usefulBullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8922a]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {event.stillUnclear || event.sourceNote ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {event.stillUnclear ? (
              <div className="rounded-3xl border border-black/[0.08] bg-white/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
                <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Still unclear</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{event.stillUnclear}</p>
              </div>
            ) : null}
            {event.sourceNote ? (
              <div className="rounded-3xl border border-black/[0.08] bg-white/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
                <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Source note</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{event.sourceNote}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2 border-y border-black/[0.08] py-4 dark:border-white/[0.08]">
          <Link href={event.sourceHref || event.href} target={event.sourceHref ? "_blank" : undefined} rel={event.sourceHref ? "noopener noreferrer" : undefined} onClick={() => trackFeedEvent(commentSlug, "open", { href: event.sourceHref || event.href, surface: "modal-article-link" })} className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black">
            Read Article
          </Link>
          <Link href={event.href} onClick={() => trackFeedEvent(commentSlug, "open", { href: event.href, surface: "modal-card-link" })} className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
            Open Card
          </Link>
          <button type="button" onClick={onSave} className={`rounded-full border px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold ${saved ? "border-[#c8922a]/60 bg-[#c8922a]/10 text-[#9b6b18] dark:text-[#f0c15e]" : "border-black/[0.12] text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"}`}>{saved ? "Saved" : "Save"}</button>
          <button type="button" onClick={onShare} className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">Share</button>
        </div>

        <div className="mt-5">
          <ArticleComments
            articleSlug={commentSlug}
            eyebrow=""
            title="Add what you know"
            helper="Add local context, a source, a direct media link, or a question. Upload can come later; for now, paste a link and Albis will preview it when possible."
            placeholder="Add context, a source URL, photo/video link, or question…"
            emptyText="No context yet. Add the first source, observation, or question."
            submitLabel="Add context"
            compact
            onCommentPosted={() => trackFeedEvent(commentSlug, "comment")}
          />
        </div>
      </section>
    </div>
  );
}

function FeedRow({ event, feature = false, selected, onOpen, onClose }: { event: LiveFeedEvent; feature?: boolean; selected: boolean; onOpen: () => void; onClose: () => void }) {
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

  function toggleSave() {
    setSaved((current) => {
      trackFeedEvent(commentSlug, current ? "unsave" : "save");
      return !current;
    });
  }

  return (
    <>
      <article className={`group rounded-3xl border border-black/[0.08] bg-white p-4 transition dark:border-white/[0.08] dark:bg-white/[0.035] ${selected ? "shadow-sm" : "hover:border-[#c8922a]/35"}`}>
        <MediaPreviewBlock media={event.mediaPreview} feature={feature} />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <UserAvatar name={event.author || event.source || "Albis"} imageUrl={event.authorAvatarUrl} size="sm" />
              <span className="rounded-full bg-[#c8922a]/10 px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">
                {cleanLabel(event.label)}
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

            <button type="button" onClick={() => { trackFeedEvent(commentSlug, "open", { surface: "card" }); onOpen(); }} className="mt-3 block w-full text-left" aria-label={`Open ${event.title}`}>
              <h2 className={`font-[family-name:var(--font-playfair)] font-bold leading-tight tracking-tight transition group-hover:text-[#b58320] ${feature ? "text-3xl md:text-4xl" : "text-2xl"}`}>
                {event.title}
              </h2>
              {event.summary ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-[15px]">{event.summary}</p> : null}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { trackFeedEvent(commentSlug, "open", { surface: "button" }); onOpen(); }} className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black">
              {event.action === "Read" ? "Read story" : "Open story"}
            </button>
            <button type="button" onClick={() => { trackFeedEvent(commentSlug, "open", { surface: "discussion" }); onOpen(); }} className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
              {event.commentCount ? discussionLabel(event.commentCount) : "Add context"}
            </button>
            <button type="button" aria-pressed={saved} onClick={toggleSave} className={`rounded-full border px-3 py-2 font-[family-name:var(--font-inter)] text-xs font-bold ${saved ? "border-[#c8922a]/60 bg-[#c8922a]/10 text-[#9b6b18] dark:text-[#f0c15e]" : "border-black/[0.12] text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"}`}>
              {saved ? "Saved" : "Save"}
            </button>
            <button type="button" onClick={shareCard} className="rounded-full border border-black/[0.12] px-3 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300" aria-label={`Share ${event.title}`}>
              Share
            </button>
          </div>
          <Link href={event.href} onClick={() => trackFeedEvent(commentSlug, "open", { href: event.href, surface: "direct-link" })} className="font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-400 hover:text-[#b58320]">
            Permalink
          </Link>
        </div>
      </article>

      {selected ? <CardDetailModal event={event} onClose={onClose} onShare={shareCard} saved={saved} onSave={toggleSave} /> : null}
    </>
  );
}

export function LiveEventFeed({ events, leadId }: { events: LiveFeedEvent[]; leadId?: string }) {
  const [openId, setOpenId] = useState<string | null>(leadId || null);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filteredEvents = useMemo(() => events.filter((event) => matchesSearch(event, query)), [events, query]);
  const visibleEvents = filteredEvents.slice(0, visibleCount);

  useEffect(() => setOpenId(leadId || null), [leadId]);
  useEffect(() => setVisibleCount(12), [query, events]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || visibleCount >= filteredEvents.length) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleCount((current) => Math.min(current + 8, filteredEvents.length));
      }
    }, { rootMargin: "500px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [filteredEvents.length, visibleCount]);

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-black/[0.08] bg-white p-3 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <label className="sr-only" htmlFor="feed-search">Search cards</label>
        <input
          id="feed-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search topics, places, people, sources, or story terms…"
          className="w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 font-[family-name:var(--font-inter)] text-sm outline-none transition placeholder:text-zinc-400 focus:border-[#c8922a]/60 dark:border-white/[0.08] dark:bg-black/20"
        />
      </div>

      {visibleEvents.length ? visibleEvents.map((event, index) => (
        <FeedRow
          key={event.id}
          event={event}
          feature={index === 0}
          selected={openId === event.id}
          onOpen={() => setOpenId((current) => current === event.id ? null : event.id)}
          onClose={() => setOpenId(null)}
        />
      )) : (
        <div className="rounded-3xl border border-dashed border-black/10 bg-white/50 px-6 py-12 text-center dark:border-white/10 dark:bg-white/[0.025]">
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">No matching cards.</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Try a place, source, topic, or person.</p>
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
      {visibleCount < filteredEvents.length ? (
        <button type="button" onClick={() => setVisibleCount((current) => Math.min(current + 8, filteredEvents.length))} className="mx-auto flex rounded-full border border-black/[0.12] bg-white px-5 py-3 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:bg-white/[0.035] dark:text-zinc-300">
          Load next source set
        </button>
      ) : filteredEvents.length > 12 ? (
        <p className="py-3 text-center font-[family-name:var(--font-inter)] text-xs text-zinc-400">You’re caught up for now. New source sets will appear as the feed refreshes.</p>
      ) : null}
    </div>
  );
}
