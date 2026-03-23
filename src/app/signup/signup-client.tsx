"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function SignupClient({
  subscriberCount,
}: {
  subscriberCount: number;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
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
          website:
            (
              document.querySelector(
                'input[name="website"]'
              ) as HTMLInputElement
            )?.value || "",
          _t: mountTimeRef.current,
          ref:
            typeof window !== "undefined"
              ? localStorage.getItem("albis_ref") || ""
              : "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

  const honeypotStyle: React.CSSProperties = {
    position: "absolute",
    left: "-9999px",
    opacity: 0,
    height: 0,
  };

  const readerText =
    subscriberCount > 0
      ? `Join ${subscriberCount.toLocaleString()} readers`
      : "Join our readers";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f7f4] px-space-6 py-space-16 dark:bg-[#0f0f0f]">
      <div className="w-full max-w-lg">
        {/* Back link */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ← Back to Albis
          </Link>
        </div>

        {/* Logo */}
        <h1 className="text-center font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
          ALBIS
        </h1>

        {status === "success" ? (
          /* Success state */
          <div className="mt-12 text-center">
            <p className="font-[family-name:var(--font-source-serif)] text-3xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              You&apos;re in. ✓
            </p>
            <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
              Check your inbox for tomorrow&apos;s briefing.
            </p>
            <Link
              href="/"
              className="mt-space-8 inline-block text-sm font-medium text-[#c8922a] hover:underline dark:text-[#c8922a]"
            >
              ← Explore Albis
            </Link>
          </div>
        ) : (
          /* Form state */
          <>
            {/* Headline */}
            <p className="mt-space-8 text-center font-[family-name:var(--font-source-serif)] text-2xl leading-snug text-[#0f0f0f] md:text-3xl dark:text-[#f0efec]">
              The daily briefing that shows you how the world tells its stories.
            </p>

            {/* Subline */}
            <p className="mt-3 text-center text-lg text-zinc-500 dark:text-zinc-400">
              Free. Every morning. No spin.
            </p>

            {/* Email form */}
            <form
              onSubmit={handleSubmit}
              className="relative mt-space-8 flex flex-col gap-space-3 sm:flex-row"
            >
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setStatus("idle");
                }}
                placeholder="your@email.com"
                required
                className="w-full flex-1 rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] text-[#0f0f0f] placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#c8922a]/30 dark:border-white/10 dark:bg-zinc-900 dark:text-[#f0efec] dark:placeholder-zinc-500"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-lg bg-[#c8922a] px-6 py-3 font-medium text-white transition-colors hover:bg-[#c8922a]/90 disabled:opacity-60"
              >
                {status === "loading" ? "..." : "Subscribe →"}
              </button>
            </form>

            {/* Error */}
            {status === "error" && (
              <p className="mt-2 text-center text-sm text-red-500 dark:text-red-400">
                {message}
              </p>
            )}

            {/* Social proof */}
            <p className="mt-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
              {readerText} · No spam · Unsubscribe anytime
            </p>
          </>
        )}
      </div>

      {/* Minimal footer */}
      <p className="mt-16 text-center text-xs text-zinc-400 dark:text-zinc-500">
        © 2026 Albis ·{" "}
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
      </p>
    </div>
  );
}
