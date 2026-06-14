"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const CATEGORIES = [
  { value: "update", label: "Update" },
  { value: "life-systems", label: "Life Systems" },
  { value: "world", label: "World" },
  { value: "money", label: "Money" },
  { value: "tech", label: "Tech" },
  { value: "climate", label: "Climate" },
  { value: "perspectives", label: "Perspectives" },
  { value: "science", label: "Science" },
  { value: "health", label: "Health" },
  { value: "trade", label: "Trade" },
  { value: "media", label: "Media" },
  { value: "culture", label: "Culture" },
  { value: "education", label: "Education" },
  { value: "governance", label: "Governance" },
  { value: "research", label: "Research" },
  { value: "question", label: "Question" },
  { value: "event", label: "Event" },
  { value: "article", label: "Article" },
  { value: "weather", label: "Weather" },
  { value: "other", label: "+ Other" },
];

type CreateMode = "manual" | "ai-review" | "article";

function parseLinks(value: string) {
  return value
    .split(/\n|,/)
    .map((link) => link.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function parseTags(value: string) {
  return value
    .split(/,|\n|#/)
    .map((tag) => tag.trim().toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-"))
    .filter(Boolean)
    .slice(0, 8);
}

export function CreateCardForm() {
  const [mode, setMode] = useState<CreateMode>("manual");
  const [title, setTitle] = useState("");
  const [sourceLinks, setSourceLinks] = useState("");
  const [context, setContext] = useState("");
  const [articleBody, setArticleBody] = useState("");
  const [category, setCategory] = useState("update");
  const [customSection, setCustomSection] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [postedUrl, setPostedUrl] = useState("");
  const [postedArticleUrl, setPostedArticleUrl] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const activeSeconds = useRef(0);

  useEffect(() => {
    let last = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      const delta = Math.min(5, Math.max(0, Math.round((now - last) / 1000)));
      last = now;
      if (document.visibilityState !== "visible") return;
      if (title || sourceLinks || context || articleBody || tagInput || customSection) {
        activeSeconds.current = Math.min(activeSeconds.current + delta, 30 * 60);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [title, sourceLinks, context, articleBody, tagInput, customSection]);

  const links = useMemo(() => parseLinks(sourceLinks), [sourceLinks]);
  const tags = useMemo(() => parseTags(tagInput), [tagInput]);
  const canSubmit = mode === "ai-review"
    ? links.length > 0 || title.trim().length >= 3 || context.trim().length > 0
    : mode === "article"
      ? title.trim().length >= 3 && articleBody.trim().length >= 80
      : title.trim().length >= 3 && (context.trim().length > 0 || links.length > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPostedUrl("");
    setPostedArticleUrl("");
    setShareStatus("");
    setLoading(true);

    try {
      const res = await fetch("/api/feed/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          source_url: links[0] || "",
          source_urls: links,
          context,
          article_body: articleBody,
          full_article_requested: mode === "article",
          category: mode === "ai-review" && category === "update" ? "research" : category,
          custom_section: customSection,
          user_tags: tags,
          ai_review_requested: mode === "ai-review",
          active_seconds: activeSeconds.current,
          website,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Could not post card.");
      setPostedUrl(payload.url || "/");
      setPostedArticleUrl(payload.article_url && payload.article_url !== payload.url ? payload.article_url : "");
      setTitle("");
      setSourceLinks("");
      setContext("");
      setArticleBody("");
      setCategory("update");
      setCustomSection("");
      setTagInput("");
      setMode("manual");
      activeSeconds.current = 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post card.");
    } finally {
      setLoading(false);
    }
  }

  async function sharePostedCard() {
    if (!postedUrl) return;
    const url = new URL(postedArticleUrl || postedUrl, window.location.origin).toString();
    const text = postedArticleUrl ? "I published this on Albis." : "I added this card to Albis.";
    setShareStatus("");

    try {
      if (navigator.share) {
        await navigator.share({ title: "Albis", text, url });
        setShareStatus("Share sheet opened.");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareStatus("Public link copied.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus("Public link copied.");
      } catch {
        setShareStatus("Could not copy yet — use View card to open it.");
      }
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="rounded-2xl border border-[#c8922a]/25 bg-[#fff8e7] p-4 dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10">
        <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">
          First card?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Add one useful source or question, then make your profile easy to recognise so people can follow what you contribute next.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/account" className="rounded-full border border-black/[0.12] px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/60 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
            Check profile
          </Link>
          <Link href="/people" className="rounded-full border border-black/[0.12] px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/60 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
            Follow people
          </Link>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`rounded-2xl border p-3 text-left transition ${mode === "manual" ? "border-[#c8922a]/60 bg-[#c8922a]/10" : "border-black/[0.08] hover:border-[#c8922a]/35 dark:border-white/[0.08]"}`}
        >
          <span className="block font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">Write it myself</span>
          <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">Post a story card, source, direct media link, note, or update in your own words.</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("ai-review")}
          className={`rounded-2xl border p-3 text-left transition ${mode === "ai-review" ? "border-[#c8922a]/60 bg-[#c8922a]/10" : "border-black/[0.08] hover:border-[#c8922a]/35 dark:border-white/[0.08]"}`}
        >
          <span className="block font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">AI review my links</span>
          <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">Submit one or more links for an Albis review/context card.</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("article")}
          className={`rounded-2xl border p-3 text-left transition sm:col-span-2 ${mode === "article" ? "border-[#c8922a]/60 bg-[#c8922a]/10" : "border-black/[0.08] hover:border-[#c8922a]/35 dark:border-white/[0.08]"}`}
        >
          <span className="block font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">Full article + card</span>
          <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">Publish a deeper article and automatically create a feed card that links into it.</span>
        </button>
      </div>

      <label className="block">
        <span className="sr-only">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          required={mode === "manual" || mode === "article"}
          className="w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
          placeholder={mode === "ai-review" ? "Optional title for the review card" : mode === "article" ? "Article headline" : "Title"}
        />
      </label>

      <label className="block">
        <span className="mb-1 block font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-500 dark:text-zinc-400">
          {mode === "ai-review" ? "Links to review" : "Source/media links"}
        </span>
        <textarea
          value={sourceLinks}
          onChange={(e) => setSourceLinks(e.target.value)}
          maxLength={2200}
          className="min-h-24 w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
          placeholder="Paste one source, image, video, or YouTube link per line"
        />
        {links.length > 0 ? <p className="mt-1 text-xs text-zinc-400">{links.length} link{links.length === 1 ? "" : "s"} attached.</p> : null}
      </label>

      <div>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-500 dark:text-zinc-400">Section</p>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Choose the closest area, or add your own. Albis will still classify it for discovery.</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold ${category === item.value ? "bg-[#111] text-white dark:bg-white dark:text-black" : "border border-black/[0.12] text-zinc-500 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-400"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {category === "other" ? (
          <label className="mt-3 block">
            <span className="sr-only">Custom section</span>
            <input
              value={customSection}
              onChange={(e) => setCustomSection(e.target.value)}
              maxLength={60}
              className="w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
              placeholder="Add your section, e.g. Cricket, Local, Education, Faith"
            />
          </label>
        ) : null}
      </div>

      <label className="block">
        <span className="mb-1 block font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-500 dark:text-zinc-400">Story signals</span>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          maxLength={220}
          className="w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
          placeholder="e.g. food security, cricket, ai, supply chains"
        />
        {tags.length > 0 ? <p className="mt-1 text-xs text-zinc-400">Signals attached: {tags.join(", ")}</p> : null}
      </label>

      <label className="block">
        <span className="sr-only">Context</span>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          maxLength={1400}
          className="min-h-32 w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
          placeholder={mode === "ai-review" ? "Optional: what should Albis look for? What's your angle or question?" : mode === "article" ? "Short card summary / intro for the feed" : "Write your card, note, article summary, or context"}
        />
      </label>

      {mode === "article" ? (
        <label className="block">
          <span className="mb-1 block font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-500 dark:text-zinc-400">Article body</span>
          <textarea
            value={articleBody}
            onChange={(e) => setArticleBody(e.target.value)}
            maxLength={30000}
            className="min-h-[360px] w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
            placeholder="Write the full article here. Use short paragraphs; markdown-style headings and bullet points are okay. The feed card will be created automatically."
          />
          <p className="mt-1 text-xs text-zinc-400">{articleBody.trim().split(/\s+/).filter(Boolean).length} words. Minimum 80 characters for now.</p>
        </label>
      ) : null}

      <input
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="rounded-full bg-[#111] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#b58320] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-black"
        >
          {loading ? "Posting…" : mode === "ai-review" ? "Submit for AI review" : mode === "article" ? "Publish article + card" : "Post card"}
        </button>
        {postedArticleUrl ? (
          <Link href={postedArticleUrl} className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#b58320] hover:underline">
            View article
          </Link>
        ) : null}
        {postedUrl ? (
          <Link href={postedUrl} className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#b58320] hover:underline">
            View card
          </Link>
        ) : null}
      </div>

      {mode === "ai-review" ? (
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Albis will automatically read what it can from the links and publish an AI review card. If a source cannot be read, the card will say what remains unclear rather than inventing details.
        </p>
      ) : null}
      {mode === "article" ? (
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Articles are the deeper layer. Albis will publish the full piece in Read and create a card for the feed so discussion, source links, and discovery still start from the card.
        </p>
      ) : null}
      {postedUrl ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200">
          <p>{postedArticleUrl ? "Article published in Read and card posted to the feed." : "Card posted. It should appear in the feed shortly."}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/account" className="rounded-full bg-emerald-700 px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:bg-emerald-800 dark:bg-emerald-300 dark:text-emerald-950">
              Complete profile
            </Link>
            <button
              type="button"
              onClick={sharePostedCard}
              className="rounded-full border border-emerald-700/25 px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold text-emerald-800 hover:border-emerald-700/50 dark:border-emerald-200/25 dark:text-emerald-100"
            >
              Share public link
            </button>
            <Link href="/people" className="rounded-full border border-emerald-700/25 px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold text-emerald-800 hover:border-emerald-700/50 dark:border-emerald-200/25 dark:text-emerald-100">
              Find people to follow
            </Link>
          </div>
          {shareStatus ? <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-200">{shareStatus}</p> : null}
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </form>
  );
}
