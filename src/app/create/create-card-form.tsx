"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackLaunchAttributionEvent } from "@/app/components/analytics-events";

const CATEGORIES = [
  { value: "update", label: "Update" },
  { value: "question", label: "Question" },
  { value: "world", label: "World" },
  { value: "media", label: "Media" },
  { value: "life-systems", label: "Life Systems" },
  { value: "tech", label: "Tech" },
  { value: "climate", label: "Climate" },
  { value: "education", label: "Education" },
  { value: "other", label: "+ Other" },
];

const QUICK_STARTS = [
  {
    title: "What did your feed miss today?",
    context: "I found this after looking outside my usual sources. What I had not seen yet was:",
    category: "media",
    tags: "coverage gap, media literacy",
  },
  {
    title: "What food warning did your feed miss?",
    context: "My usual news feed did / did not show this food-system warning. The part I think needs more attention is:",
    category: "life-systems",
    tags: "food security, coverage gap",
  },
  {
    title: "What climate effect reaches people first?",
    context: "If this climate pattern strengthens, the first practical effect I would watch for is:",
    category: "climate",
    tags: "climate impact, life systems",
  },
  {
    title: "Who gets excluded by the access rules?",
    context: "The people who may be left out by this rule, cost, or border process are:",
    category: "media",
    tags: "access, mobility",
  },
  {
    title: "What energy dependency is being exposed?",
    context: "This story shows a dependency on fuel, power, shipping, finance, or infrastructure here:",
    category: "life-systems",
    tags: "energy, infrastructure",
  },
  {
    title: "What is being covered where you are?",
    context: "This local or regional story deserves wider attention because:",
    category: "update",
    tags: "local story, regional view",
  },
  {
    title: "Two headlines, same event",
    context: "These sources cover the same event differently. The difference I noticed is:",
    category: "media",
    tags: "framing, source comparison",
  },
  {
    title: "What changed on the ground?",
    context: "The practical effect I noticed is visible in food, water, power, transport, schools, health, work, or shelter:",
    category: "life-systems",
    tags: "life systems, practical impact",
  },
  {
    title: "Who is affected first?",
    context: "The first people likely to feel this are:",
    category: "life-systems",
    tags: "human impact, access",
  },
  {
    title: "What source helped most?",
    context: "This source helped me understand the story because:",
    category: "media",
    tags: "useful source, context",
  },
  {
    title: "What local system gets stressed?",
    context: "The local system that has to absorb this pressure is:",
    category: "life-systems",
    tags: "local impact, systems",
  },
  {
    title: "What claim needs a source before sharing?",
    context: "Before I share this, the claim I want a stronger source for is:",
    category: "question",
    tags: "source check, uncertainty",
  },
  {
    title: "What is missing from this story?",
    context: "This story feels important, but the source did not answer this question yet:",
    category: "question",
    tags: "question, uncertainty",
  },
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
  const [showAdvancedModes, setShowAdvancedModes] = useState(false);
  const activeSeconds = useRef(0);
  const createStartTracked = useRef(false);

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

    if (!createStartTracked.current) {
      createStartTracked.current = true;
      trackLaunchAttributionEvent("create_start", { mode, link_count: links.length, tag_count: tags.length });
    }

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
      trackLaunchAttributionEvent("create_success", {
        mode,
        link_count: links.length,
        tag_count: tags.length,
        active_seconds: activeSeconds.current,
      });
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

  function applyQuickStart(item: typeof QUICK_STARTS[number]) {
    setMode("manual");
    setTitle(item.title);
    setContext(item.context);
    setCategory(item.category);
    setTagInput(item.tags);
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="rounded-2xl border border-[#c8922a]/25 bg-[#fff8e7] p-4 dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10">
        <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">
          Make one useful card
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Add one source, question, missing region, or framing note that helps someone see what their normal feed may have missed.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_STARTS.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => applyQuickStart(item)}
              className="rounded-full border border-black/[0.12] px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/60 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"
            >
              {item.title}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          Pick a prompt to fill the form, then edit anything before posting.
        </p>
      </div>

      <div className="rounded-2xl border border-black/[0.08] bg-black/[0.02] p-3 dark:border-white/[0.08] dark:bg-white/[0.025]">
        <button
          type="button"
          onClick={() => setShowAdvancedModes((value) => !value)}
          className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]"
        >
          {showAdvancedModes ? "Hide advanced options" : "Need AI review or a full article?"}
        </button>
        {showAdvancedModes ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              ["manual", "Simple card", "Post a link, note, or question."],
              ["ai-review", "AI review links", "Let Albis review links into a card."],
              ["article", "Full article", "Publish a deeper piece plus a card."],
            ].map(([value, title, text]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value as CreateMode)}
                className={`rounded-2xl border p-3 text-left transition ${mode === value ? "border-[#c8922a]/60 bg-[#c8922a]/10" : "border-black/[0.08] hover:border-[#c8922a]/35 dark:border-white/[0.08]"}`}
              >
                <span className="block font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">{title}</span>
                <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">{text}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <label className="block">
        <span className="sr-only">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          required={mode === "manual" || mode === "article"}
          className="w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
          placeholder={mode === "ai-review" ? "Optional title for the review card" : mode === "article" ? "Article headline" : "What did you find?"}
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
          placeholder="Paste a link, source, image, video, or YouTube URL"
        />
        {links.length > 0 ? <p className="mt-1 text-xs text-zinc-400">{links.length} link{links.length === 1 ? "" : "s"} attached.</p> : null}
      </label>

      <details className="rounded-2xl border border-black/[0.08] bg-black/[0.02] p-3 dark:border-white/[0.08] dark:bg-white/[0.025]">
        <summary className="cursor-pointer font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">
          Add topic / section details
        </summary>
        <div className="mt-3 space-y-4">
          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-500 dark:text-zinc-400">Section</p>
                <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Optional — choose the closest area.</p>
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
            <span className="mb-1 block font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-500 dark:text-zinc-400">Tags</span>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              maxLength={220}
              className="w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
              placeholder="e.g. food security, cricket, ai, supply chains"
            />
            {tags.length > 0 ? <p className="mt-1 text-xs text-zinc-400">Signals attached: {tags.join(", ")}</p> : null}
          </label>
        </div>
      </details>

      <label className="block">
        <span className="sr-only">Context</span>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          maxLength={1400}
          className="min-h-32 w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
          placeholder={mode === "ai-review" ? "Optional: what should Albis look for?" : mode === "article" ? "Short summary for the feed" : "What happened? What source helped? What is still missing?"}
        />
      </label>

      <div className="rounded-2xl border border-black/[0.08] bg-white p-4 text-sm text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-300">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">Good Albis card checklist</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
          <li>Cite the source that helped most.</li>
          <li>Add context, not outrage.</li>
          <li>Say what is evidence and what is your read.</li>
          <li>Ask what region, voice, or practical effect is still missing.</li>
        </ul>
      </div>

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
          {loading ? "Posting…" : mode === "ai-review" ? "Submit for review" : mode === "article" ? "Publish article" : "Post my first card"}
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
