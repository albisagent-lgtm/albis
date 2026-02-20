"use client";

import { useState, useEffect, useRef } from "react";

export function EmailCapture({ variant = "default" }: { variant?: "default" | "hero" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    // Persist referral code from URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        localStorage.setItem("albis_ref", ref);
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          website: (document.querySelector('input[name="website"]') as HTMLInputElement)?.value || "",
          _t: mountTimeRef.current,
          ref: typeof window !== "undefined" ? localStorage.getItem("albis_ref") || "" : "",
        }),
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
        <p className={`text-lg font-medium ${variant === "hero" ? "text-[#0f0f0f] dark:text-white" : "text-white"}`}>You&apos;re on the list.</p>
        <p className={`mt-2 text-sm ${variant === "hero" ? "text-zinc-500 dark:text-white/60" : "text-white/60"}`}>
          We&apos;ll send you your first briefing soon.
        </p>
      </div>
    );
  }

  const honeypotStyle: React.CSSProperties = {
    position: "absolute",
    left: "-9999px",
    opacity: 0,
    height: 0,
  };

  if (variant === "hero") {
    return (
      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="website"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            style={honeypotStyle}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
            placeholder="you@example.com"
            required
            className="h-13 flex-1 rounded-full border border-black/10 bg-white px-5 text-sm text-[#0f0f0f] placeholder-zinc-400 outline-none focus:border-[#1a3a5c]/30 focus:ring-1 focus:ring-[#1a3a5c]/20 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder-white/40 dark:focus:border-white/30 dark:focus:ring-white/20"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="h-13 min-w-[44px] rounded-full bg-[#1a3a5c] px-8 text-sm font-semibold text-white shadow-[0_4px_16px_rgb(26,58,92,0.3)] hover:bg-[#243f66] disabled:opacity-70 dark:shadow-[0_4px_16px_rgb(26,58,92,0.5)]"
          >
            {status === "loading" ? "..." : "Get the free briefing"}
          </button>
        </form>
        {status === "error" && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">{message}</p>
        )}
        <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
          Or{" "}
          <a
            href="https://t.me/albisdaily"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-[#1a3a5c] hover:underline dark:text-[#7ab0d8]"
          >
            join on Telegram →
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={honeypotStyle}
      />
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
