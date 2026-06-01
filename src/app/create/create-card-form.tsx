"use client";

import Link from "next/link";
import { useState } from "react";

const CATEGORIES = [
  { value: "update", label: "Update" },
  { value: "link", label: "Link" },
  { value: "question", label: "Question" },
  { value: "event", label: "Event" },
  { value: "research", label: "Research" },
  { value: "weather", label: "Weather" },
];

export function CreateCardForm() {
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState("update");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [postedUrl, setPostedUrl] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPostedUrl("");
    setLoading(true);

    try {
      const res = await fetch("/api/feed/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, source_url: sourceUrl, context, category, website }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Could not post card.");
      setPostedUrl(payload.url || "/");
      setTitle("");
      setSourceUrl("");
      setContext("");
      setCategory("update");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post card.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-3">
      <label className="block">
        <span className="sr-only">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          required
          className="w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
          placeholder="Title"
        />
      </label>

      <label className="block">
        <span className="sr-only">Link</span>
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          maxLength={500}
          className="w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
          placeholder="Link optional"
        />
      </label>

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

      <label className="block">
        <span className="sr-only">Context</span>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          maxLength={900}
          className="min-h-32 w-full rounded-2xl border border-black/[0.08] bg-[#f8f7f4] px-4 py-3 text-sm outline-none focus:border-[#c8922a] dark:border-white/[0.08] dark:bg-white/[0.03]"
          placeholder="Add context"
        />
      </label>

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
          disabled={loading || title.trim().length < 3 || (!context.trim() && !sourceUrl.trim())}
          className="rounded-full bg-[#111] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#b58320] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-black"
        >
          {loading ? "Posting…" : "Post card"}
        </button>
        {postedUrl ? (
          <Link href={postedUrl} className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#b58320] hover:underline">
            View card
          </Link>
        ) : null}
      </div>

      {postedUrl ? <p className="text-sm text-emerald-700 dark:text-emerald-300">Card posted. It should appear in the feed shortly.</p> : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </form>
  );
}
