"use client";

import { useState } from "react";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "You're on the list!");
        setEmail("");
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
      <div className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/5 px-6 py-8">
        <p className="text-lg font-medium text-white">You&apos;re on the list.</p>
        <p className="mt-2 text-sm text-white/60">
          We&apos;ll send you your first briefing soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
        placeholder="you@example.com"
        required
        className="h-13 flex-1 rounded-full border border-white/15 bg-white/10 px-5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm focus:border-white/30 focus:ring-1 focus:ring-white/20"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-13 min-w-[44px] rounded-full bg-white px-8 text-sm font-semibold text-[#1a3a5c] shadow-[0_4px_16px_rgb(0,0,0,0.2)] hover:bg-[#f0efec] disabled:opacity-70"
      >
        {status === "loading" ? "..." : "Start free"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-300 sm:absolute sm:mt-16">{message}</p>
      )}
    </form>
  );
}
