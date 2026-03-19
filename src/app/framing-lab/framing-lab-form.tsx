"use client";

import { useState } from "react";

export function FramingLabForm() {
  const [storyDescription, setStoryDescription] = useState("");
  const [regionNoticed, setRegionNoticed] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (storyDescription.trim().length < 20 || !regionNoticed.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/framing-lab/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_description: storyDescription.trim(),
          region_noticed: regionNoticed.trim(),
          source_url: sourceUrl.trim() || undefined,
          submitter_email: submitterEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Connection failed. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/5 px-space-6 py-space-8">
        <p className="text-lg font-medium text-[#0f0f0f] dark:text-white">
          Thank you.
        </p>
        <p className="mt-space-2 text-sm text-zinc-500 dark:text-white/60">
          {message}
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-black/10 bg-white px-space-4 py-3 text-sm text-[#0f0f0f] placeholder-zinc-400 outline-none focus:border-[#1a3a5c]/30 focus:ring-1 focus:ring-[#1a3a5c]/20 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder-white/40 dark:focus:border-white/30 dark:focus:ring-white/20";

  const labelClass =
    "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-space-6">
      <div>
        <label htmlFor="story_description" className={labelClass}>
          Describe the story <span className="text-red-500">*</span>
        </label>
        <textarea
          id="story_description"
          value={storyDescription}
          onChange={(e) => { setStoryDescription(e.target.value); setStatus("idle"); }}
          placeholder="e.g. The flooding in southern Brazil is front page news in Latin America but invisible in European coverage"
          required
          minLength={20}
          rows={4}
          className={`${inputClass} resize-y`}
        />
      </div>

      <div>
        <label htmlFor="region_noticed" className={labelClass}>
          Which region(s) are you noticing this in? <span className="text-red-500">*</span>
        </label>
        <input
          id="region_noticed"
          type="text"
          value={regionNoticed}
          onChange={(e) => { setRegionNoticed(e.target.value); setStatus("idle"); }}
          placeholder="e.g. Brazil, Western Europe"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="source_url" className={labelClass}>
          Link to a source <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
        </label>
        <input
          id="source_url"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="submitter_email" className={labelClass}>
          Your email <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional — only if you want us to follow up)</span>
        </label>
        <input
          id="submitter_email"
          type="email"
          value={submitterEmail}
          onChange={(e) => setSubmitterEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-500 dark:text-red-400">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="h-12 rounded-full bg-[#1a3a5c] px-8 text-sm font-semibold text-white shadow-[0_4px_16px_rgb(26,58,92,0.3)] hover:bg-[#243f66] disabled:opacity-70 transition-colors dark:shadow-[0_4px_16px_rgb(26,58,92,0.5)]"
      >
        {status === "loading" ? "Submitting..." : "Submit to the Framing Lab"}
      </button>
    </form>
  );
}
