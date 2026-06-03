"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PublicComment = {
  id: string;
  parent_id: string | null;
  author_name: string;
  is_anonymous: boolean;
  body: string;
  created_at: string;
  updated_at: string;
  context_type?: ReportType | null;
  location_text?: string | null;
  trust_status?: "reader_report" | "supported_by_source" | "corroborated" | "verified_by_albis" | "needs_checking" | "disputed";
  source_url?: string | null;
  media_url?: string | null;
  media_type?: "image" | "video" | "youtube" | "link" | null;
};

type ReportType = "local_update" | "source" | "correction" | "context" | "question";

type ArticleCommentsCopy = {
  eyebrow?: string;
  title?: string;
  prompt?: string;
  helper?: string;
  placeholder?: string;
  emptyText?: string;
  submitLabel?: string;
  structuredReports?: boolean;
  compact?: boolean;
  footerNote?: string | null;
  onCommentPosted?: () => void;
};

type SessionUser = {
  id: string;
  email?: string;
  user_metadata?: { name?: string; username?: string };
} | null;

const TRUST_LABELS: Record<NonNullable<PublicComment["trust_status"]>, string> = {
  reader_report: "Reader report",
  supported_by_source: "Supported by source",
  corroborated: "Corroborated",
  verified_by_albis: "Verified by Albis",
  needs_checking: "Needs checking",
  disputed: "Needs checking",
};

const REPORT_TYPES: Array<{ value: ReportType; label: string; helper: string }> = [
  { value: "local_update", label: "Local update", helper: "Something happening where you are" },
  { value: "source", label: "Source/link", helper: "A document, outlet, post, or data point" },
  { value: "correction", label: "Correction", helper: "Something Albis should check or fix" },
  { value: "context", label: "Context", helper: "Background that changes how this reads" },
  { value: "question", label: "Question", helper: "Something still unclear" },
];

const DEFAULT_HELPER = "Add local context, a source, a question, or a perspective we may have missed. You can comment as a guest or create a free account.";

const REPORT_LABELS: Record<ReportType, string> = Object.fromEntries(REPORT_TYPES.map((item) => [item.value, item.label])) as Record<ReportType, string>;

function TrustBadge({ status }: { status?: PublicComment["trust_status"] }) {
  const safeStatus = status || "reader_report";
  if (safeStatus === "reader_report") return null;
  const tone = safeStatus === "verified_by_albis"
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : safeStatus === "corroborated" || safeStatus === "supported_by_source"
      ? "border-[#c8922a]/25 bg-[#c8922a]/10 text-[#8a6417] dark:text-[#f0c15e]"
      : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300";
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone}`}>{TRUST_LABELS[safeStatus]}</span>;
}

function ReportBadge({ type }: { type?: ReportType | null }) {
  if (!type) return null;
  return <span className="rounded-full border border-[#c8922a]/25 bg-[#c8922a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8a6417] dark:text-[#f0c15e]">{REPORT_LABELS[type]}</span>;
}


function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.replace("/", "").split(/[?&]/)[0] || null;
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v") || parsed.pathname.match(/\/shorts\/([^/?]+)/)?.[1] || null;
  } catch {
    return null;
  }
  return null;
}

function mediaKind(url?: string | null): PublicComment["media_type"] {
  if (!url) return null;
  if (getYouTubeId(url)) return "youtube";
  if (/\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i.test(url)) return "image";
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) return "video";
  return "link";
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

function MediaPreview({ url, type }: { url?: string | null; type?: PublicComment["media_type"] }) {
  if (!url) return null;
  const kind = type || mediaKind(url);
  if (kind === "youtube") {
    const id = getYouTubeId(url);
    if (id) {
      return (
        <div className="mt-3 overflow-hidden rounded-2xl border border-black/[0.08] bg-black dark:border-white/[0.08]">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="Attached video"
            className="aspect-video w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }
  }
  if (kind === "image") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 block overflow-hidden rounded-2xl border border-black/[0.08] bg-black/[0.02] dark:border-white/[0.08] dark:bg-white/[0.03]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Attached media" className="max-h-[420px] w-full object-cover" loading="lazy" />
      </a>
    );
  }
  if (kind === "video") {
    return (
      <video controls playsInline preload="metadata" className="mt-3 max-h-[420px] w-full rounded-2xl border border-black/[0.08] bg-black dark:border-white/[0.08]">
        <source src={url} />
      </video>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-black/[0.08] bg-black/[0.02] px-4 py-3 font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-600 hover:border-[#c8922a]/40 hover:text-[#9b6b18] dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:text-[#f0c15e]">
      <span>Attached source · {hostname(url)}</span>
      <span>Open</span>
    </a>
  );
}

function formatCommentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CommentForm({
  articleSlug,
  parentId = null,
  user,
  onPosted,
  onCancel,
  compact = false,
  placeholder,
  submitLabel,
  structuredReports = false,
  footerNote = null,
}: {
  articleSlug: string;
  parentId?: string | null;
  user: SessionUser;
  onPosted: (comment: PublicComment | null, message?: string) => void;
  onCancel?: () => void;
  compact?: boolean;
  placeholder?: string;
  submitLabel?: string;
  structuredReports?: boolean;
  footerNote?: string | null;
}) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [reportType, setReportType] = useState<ReportType>("local_update");
  const [location, setLocation] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayName = user?.user_metadata?.username ? `@${user.user_metadata.username}` : user?.user_metadata?.name || user?.email?.split("@")[0] || "your account";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_slug: articleSlug,
          parent_id: parentId,
          author_name: name,
          body,
          context_type: structuredReports && !parentId ? reportType : undefined,
          location_text: structuredReports && !parentId ? location : undefined,
          source_url: structuredReports && !parentId ? sourceUrl : undefined,
          media_url: mediaUrl,
          website,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Could not post comment.");
      setBody("");
      setName("");
      setLocation("");
      setSourceUrl("");
      setMediaUrl("");
      onPosted(payload.comment || null, payload.message);
      onCancel?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post comment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className={compact ? "space-y-3" : "space-y-4"}>
      {!user ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-[family-name:var(--font-inter)] text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Name <span className="font-normal text-zinc-400">optional</span>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Guest"
              className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 font-[family-name:var(--font-inter)] text-sm outline-none transition focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
            />
          </label>
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.015] px-3 py-2.5 font-[family-name:var(--font-inter)] text-xs leading-relaxed text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-400">
            Comment as a guest, or <Link href="/register" className="font-semibold text-[#c8922a] hover:underline">create a free account</Link> for a persistent identity.
          </div>
        </div>
      ) : (
        <p className="font-[family-name:var(--font-inter)] text-xs text-zinc-500 dark:text-zinc-400">
          Commenting as <span className="font-semibold text-zinc-700 dark:text-zinc-300">{displayName}</span>.
        </p>
      )}

      {structuredReports && !parentId ? (
        <div className="space-y-3 rounded-2xl border border-black/[0.06] bg-black/[0.015] p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <p className="font-[family-name:var(--font-inter)] text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">What kind of context is this?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {REPORT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setReportType(type.value)}
                className={`rounded-xl border px-3 py-2 text-left transition ${reportType === type.value ? "border-[#c8922a]/60 bg-[#c8922a]/10" : "border-black/[0.07] bg-white hover:border-[#c8922a]/30 dark:border-white/[0.07] dark:bg-white/[0.03]"}`}
              >
                <span className="block font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-800 dark:text-zinc-100">{type.label}</span>
                <span className="mt-0.5 block font-[family-name:var(--font-inter)] text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{type.helper}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-[family-name:var(--font-inter)] text-xs font-medium text-zinc-600 dark:text-zinc-400">Location <span className="font-normal text-zinc-400">optional</span></span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={80}
                placeholder="e.g. Turin, Italy"
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 font-[family-name:var(--font-inter)] text-sm outline-none transition focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-[family-name:var(--font-inter)] text-xs font-medium text-zinc-600 dark:text-zinc-400">Source URL <span className="font-normal text-zinc-400">optional</span></span>
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                maxLength={500}
                placeholder="https://…"
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 font-[family-name:var(--font-inter)] text-sm outline-none transition focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
              />
            </label>
          </div>
        </div>
      ) : null}

      <label className="sr-only" htmlFor={parentId ? `reply-${parentId}` : "comment-body"}>Comment</label>
      <textarea
        id={parentId ? `reply-${parentId}` : "comment-body"}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1800}
        rows={compact ? 3 : 5}
        placeholder={parentId ? "Write a reply…" : placeholder || "Add local context, a source, or a perspective we may have missed…"}
        className="w-full resize-y rounded-2xl border border-black/[0.08] bg-white px-4 py-3 font-[family-name:var(--font-source-serif)] text-[15px] leading-relaxed outline-none transition placeholder:text-zinc-400 focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03] dark:placeholder:text-zinc-600"
        required
      />

      <label className="block">
        <span className="mb-1 block font-[family-name:var(--font-inter)] text-xs font-medium text-zinc-600 dark:text-zinc-400">Attach photo, video, YouTube, or source link <span className="font-normal text-zinc-400">optional</span></span>
        <input
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          maxLength={500}
          placeholder="Paste a media or source URL"
          className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 font-[family-name:var(--font-inter)] text-sm outline-none transition focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
        />
        <span className="mt-1 block font-[family-name:var(--font-inter)] text-[11px] text-zinc-400 dark:text-zinc-500">Images, videos, and YouTube links preview inside the conversation.</span>
      </label>

      <input
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {footerNote ? (
          <p className="font-[family-name:var(--font-inter)] text-[11px] text-zinc-400 dark:text-zinc-500">
            {footerNote}
          </p>
        ) : <span />}
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || body.trim().length < 3}
            className="rounded-full bg-[#1a1a2e] px-5 py-2.5 font-[family-name:var(--font-inter)] text-xs font-bold text-white transition hover:bg-[#2a2a44] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#c8922a] dark:text-[#111] dark:hover:bg-[#d7a13a]"
          >
            {loading ? "Posting…" : parentId ? "Post reply" : submitLabel || "Post comment"}
          </button>
        </div>
      </div>

      {error && <p className="font-[family-name:var(--font-inter)] text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function CommentItem({
  comment,
  replies,
  articleSlug,
  user,
  onPosted,
}: {
  comment: PublicComment;
  replies: PublicComment[];
  articleSlug: string;
  user: SessionUser;
  onPosted: (comment: PublicComment | null, message?: string) => void;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="border-t border-black/[0.06] py-5 first:border-t-0 dark:border-white/[0.06]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c8922a]/10 font-[family-name:var(--font-inter)] text-xs font-bold text-[#9b6b18] dark:bg-[#c8922a]/15 dark:text-[#d7a13a]">
          {(comment.author_name || "G").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-[family-name:var(--font-inter)] text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{comment.author_name || "Guest"}</span>
            {comment.is_anonymous && <span className="text-zinc-400">Guest</span>}
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <time className="text-zinc-400 dark:text-zinc-500" dateTime={comment.created_at}>{formatCommentDate(comment.created_at)}</time>
            <ReportBadge type={comment.context_type} />
            <TrustBadge status={comment.trust_status} />
          </div>
          {(comment.location_text || comment.source_url) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 font-[family-name:var(--font-inter)] text-[11px] text-zinc-500 dark:text-zinc-400">
              {comment.location_text ? <span className="rounded-full bg-black/[0.04] px-2 py-1 dark:bg-white/[0.06]">From {comment.location_text}</span> : null}
              {comment.source_url ? <a href={comment.source_url} target="_blank" rel="noopener noreferrer nofollow" className="rounded-full bg-black/[0.04] px-2 py-1 font-semibold text-[#9b6b18] hover:underline dark:bg-white/[0.06] dark:text-[#f0c15e]">Source attached</a> : null}
            </div>
          )}
          <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-source-serif)] text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
            {comment.body}
          </p>
          <MediaPreview url={comment.media_url || comment.source_url} type={comment.media_type || undefined} />
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="mt-3 font-[family-name:var(--font-inter)] text-xs font-semibold text-[#c8922a] hover:underline"
          >
            Reply
          </button>

          {replying && (
            <div className="mt-4 rounded-2xl border border-black/[0.06] bg-black/[0.015] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <CommentForm articleSlug={articleSlug} parentId={comment.id} user={user} onPosted={onPosted} onCancel={() => setReplying(false)} compact />
            </div>
          )}

          {replies.length > 0 && (
            <div className="mt-4 space-y-4 border-l border-black/[0.08] pl-4 dark:border-white/[0.08]">
              {replies.map((reply) => (
                <div key={reply.id} className="pt-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-[family-name:var(--font-inter)] text-xs">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{reply.author_name || "Guest"}</span>
                    {reply.is_anonymous && <span className="text-zinc-400">Guest</span>}
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <time className="text-zinc-400 dark:text-zinc-500" dateTime={reply.created_at}>{formatCommentDate(reply.created_at)}</time>
                    <TrustBadge status={reply.trust_status} />
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap font-[family-name:var(--font-source-serif)] text-[14px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {reply.body}
                  </p>
                  <MediaPreview url={reply.media_url || reply.source_url} type={reply.media_type || undefined} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ArticleComments({
  articleSlug,
  eyebrow = "Conversation",
  title = "What are you seeing?",
  prompt,
  helper = DEFAULT_HELPER,
  placeholder,
  emptyText = "No comments yet. Be the first to add context.",
  submitLabel,
  structuredReports = false,
  compact = false,
  footerNote = null,
  onCommentPosted,
}: { articleSlug: string } & ArticleCommentsCopy) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [user, setUser] = useState<SessionUser>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user as SessionUser);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((session?.user || null) as SessionUser);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/comments?slug=${encodeURIComponent(articleSlug)}`, { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Could not load comments.");
        if (!cancelled) {
          setUnavailable(Boolean(payload.unavailable));
          setComments(payload.comments || []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load comments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [articleSlug]);

  const { topLevel, repliesByParent } = useMemo(() => {
    const top: PublicComment[] = [];
    const replies = new Map<string, PublicComment[]>();
    for (const comment of comments) {
      if (comment.parent_id) {
        const list = replies.get(comment.parent_id) || [];
        list.push(comment);
        replies.set(comment.parent_id, list);
      } else {
        top.push(comment);
      }
    }
    return { topLevel: top, repliesByParent: replies };
  }, [comments]);

  function handlePosted(comment: PublicComment | null, message?: string) {
    setNotice(message || "Thanks — your comment was posted.");
    if (comment) setComments((existing) => [...existing, comment]);
    onCommentPosted?.();
    window.setTimeout(() => setNotice(""), 5000);
  }

  return (
    <section className={`${compact ? "mt-0" : "mt-14"} rounded-2xl border border-black/[0.08] bg-white ${compact ? "p-4" : "p-5 shadow-sm md:p-7"} dark:border-white/[0.08] dark:bg-white/[0.02]`}>
      <div className="border-b border-black/[0.06] pb-5 dark:border-white/[0.06]">
        {eyebrow ? (
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.2em] text-[#c8922a]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className={`${eyebrow ? "mt-2" : ""} font-[family-name:var(--font-playfair)] ${compact ? "text-xl" : "text-2xl"} font-semibold text-[#0f0f0f] dark:text-[#f0efec]`}>
          {title}
        </h2>
        {prompt ? (
          <p className="mt-2 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-700 dark:text-zinc-300">{prompt}</p>
        ) : null}
        {helper ? (
          <p className="mt-2 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {helper}
          </p>
        ) : null}
        {!user ? (
          <div className="mt-4 flex flex-wrap gap-2 font-[family-name:var(--font-inter)] text-xs">
            <Link href="/register" className="rounded-full border border-[#c8922a]/30 px-3 py-1.5 font-semibold text-[#c8922a] hover:bg-[#c8922a]/10">
              Create account
            </Link>
            <Link href="/login" className="rounded-full border border-black/[0.08] px-3 py-1.5 font-semibold text-zinc-500 hover:text-zinc-800 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:text-zinc-200">
              Sign in
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        {unavailable ? (
          <div className="rounded-2xl border border-dashed border-black/[0.12] px-5 py-6 text-center dark:border-white/[0.12]">
            <p className="font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Conversation is opening soon. The reading room is built; we’re just connecting the database.
            </p>
          </div>
        ) : (
          <CommentForm articleSlug={articleSlug} user={user} onPosted={handlePosted} placeholder={placeholder} submitLabel={submitLabel} structuredReports={structuredReports} compact={compact} footerNote={footerNote} />
        )}
      </div>

      {notice && (
        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 font-[family-name:var(--font-inter)] text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      <div className="mt-7">
        {loading ? (
          <p className="font-[family-name:var(--font-inter)] text-sm text-zinc-400">Loading conversation…</p>
        ) : error ? (
          <p className="font-[family-name:var(--font-inter)] text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : topLevel.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/[0.12] px-5 py-8 text-center dark:border-white/[0.12]">
            <p className="font-[family-name:var(--font-source-serif)] text-sm text-zinc-500 dark:text-zinc-400">
              {emptyText}
            </p>
          </div>
        ) : (
          <div>
            {topLevel.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={repliesByParent.get(comment.id) || []}
                articleSlug={articleSlug}
                user={user}
                onPosted={handlePosted}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
