"use client";

import { useState, useEffect, useRef } from "react";
import { SubscriberCount } from "./subscriber-count";

interface EmailCaptureProps {
  variant?: "default" | "hero";
  showSocialProof?: boolean;
  showYesterdayLink?: boolean;
  heading?: string;
  source?: string;
}

export function EmailCapture({ variant = "default", showSocialProof = false, showYesterdayLink = false, heading, source }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    mountTimeRef.current = Date.now();
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
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: source || "unknown",
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
      <div className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/5 px-space-6 py-space-8">
        <p className={`text-lg font-medium ${variant === "hero" ? "text-[#0f0f0f] dark:text-white" : "text-white"}`}>You&apos;re on the list.</p>
        <p className={`mt-space-2 text-sm ${variant === "hero" ? "text-zinc-500 dark:text-white/60" : "text-white/60"}`}>
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

  const reassuranceClass = variant === "hero"
    ? "text-xs text-zinc-400 dark:text-zinc-500"
    : "text-xs text-white/40";

  if (variant === "hero") {
    return (
      <div className="mx-auto max-w-lg">
        {heading && (
          <p className="mb-space-4 text-base text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
            {heading}
          </p>
        )}
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-space-3 sm:flex-row">
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
            className="h-14 flex-1 rounded-full border border-black/10 bg-white px-space-6 text-sm text-[#0f0f0f] placeholder-zinc-400 outline-none focus:border-[#c8922a]/30 focus:ring-1 focus:ring-[#c8922a]/20 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder-white/40 dark:focus:border-white/30 dark:focus:ring-white/20"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="h-14 min-w-[44px] rounded-full bg-[#c8922a] px-10 text-sm font-semibold text-white shadow-[0_4px_16px_rgb(200,146,42,0.3)] hover:bg-[#b17f24] disabled:opacity-70 dark:shadow-[0_4px_16px_rgb(200,146,42,0.5)]"
          >
            {status === "loading" ? "..." : "Get the free briefing"}
          </button>
        </form>
        {status === "error" && (
          <p className="mt-space-2 text-xs text-red-500 dark:text-red-400">{message}</p>
        )}
        {showYesterdayLink && (
          <p className="mt-space-3 text-sm">
            <a href="/archive" className="font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors">
              See yesterday&apos;s briefing first →
            </a>
          </p>
        )}
        <div className="mt-space-3 space-y-1">
          {showSocialProof && <SubscriberCount />}
          <p className={reassuranceClass}>
            Free · Daily · Unsubscribe anytime
          </p>
          <p className={reassuranceClass}>
            🔒 We never share your email
          </p>
        </div>
        <p className="mt-space-2 text-sm text-zinc-400 dark:text-zinc-500">
          Or{" "}
          <a
            href="https://t.me/albisdaily"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-[#c8922a] hover:underline dark:text-[#c8922a]"
          >
            join on Telegram →
          </a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative mx-auto flex max-w-md flex-col gap-space-3 sm:flex-row">
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
          className="h-13 min-w-[44px] rounded-full bg-white px-8 text-sm font-semibold text-[#c8922a] shadow-[0_4px_16px_rgb(0,0,0,0.2)] hover:bg-[#f0efec] disabled:opacity-70"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
        {status === "error" && (
          <p className="text-xs text-red-300 sm:absolute sm:mt-16">{message}</p>
        )}
      </form>
      {showYesterdayLink && (
        <p className="mt-space-3 text-center text-sm">
          <a href="/archive" className="font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors">
            See yesterday&apos;s briefing first →
          </a>
        </p>
      )}
      <div className="mt-space-3 text-center space-y-1">
        {showSocialProof && <SubscriberCount />}
        <p className={reassuranceClass}>
          Free · Daily · Unsubscribe anytime
        </p>
        <p className={reassuranceClass}>
          🔒 We never share your email
        </p>
      </div>
    </div>
  );
}
