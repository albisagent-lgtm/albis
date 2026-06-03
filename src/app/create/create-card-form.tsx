"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const CATEGORIES = [
  { value: "update", label: "Update" },
  { value: "life-systems", label: "Life Systems" },
  { value: "world", label: "World" },
  { value: "money", label: "Money" },
  { value: "tech", label: "Tech" },
  { value: "climate", label: "Climate" },
  { value: "health", label: "Health" },
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
          website,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Could not post card.");
      setPostedUrl(payload.url || "/");
      setTitle("");
      setSourceLinks("");
      setContext("");
      setArticleBody("");
      setCategory("update");
      setCustomSection("");
      setTagInput("");
      setMode("manual");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post card.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
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
      {postedUrl ? <p className="text-sm text-emerald-700 dark:text-emerald-300">Card posted. It should appear in the feed shortly.</p> : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </form>
  );
}
