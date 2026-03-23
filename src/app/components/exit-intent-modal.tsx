"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface ExitIntentArticle {
  slug: string;
  title: string;
  description: string;
  readingTime: number;
  category: string;
}

interface ExitIntentModalProps {
  articles: ExitIntentArticle[];
  currentSlug?: string;
  currentCategory?: string;
}

const SESSION_KEY = "albis-exit-shown";

export function ExitIntentModal({ articles, currentSlug, currentCategory }: ExitIntentModalProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "done">("idle");
  const previousFocus = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const mountTime = useRef(Date.now());

  // Pick 3 articles: prefer different category, exclude current
  const picked = (() => {
    const filtered = articles.filter((a) => a.slug !== currentSlug);
    const diffCat = filtered.filter((a) => a.category !== currentCategory);
    const sameCat = filtered.filter((a) => a.category === currentCategory);
    const pool = [...diffCat, ...sameCat];
    return pool.slice(0, 3);
  })();

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    }, 150);
  }, []);

  useEffect(() => {
    // Don't run on touch devices
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;
    // Already shown this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY >= 10) return;
      if (sessionStorage.getItem(SESSION_KEY)) return;

      // Check time on page (10s minimum)
      if (Date.now() - mountTime.current < 10000) return;

      // Check scroll position (50% minimum)
      const scrollable = document.body.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable < 0.5) return;

      sessionStorage.setItem(SESSION_KEY, "true");
      previousFocus.current = document.activeElement as HTMLElement;
      setVisible(true);
    };

    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Focus trap + Escape key
  useEffect(() => {
    if (!visible || closing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus the modal
    setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'a[href], button, input'
      );
      firstFocusable?.focus();
    }, 50);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, closing, close]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || subscribeStatus === "loading") return;
    setSubscribeStatus("loading");
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setSubscribeStatus("done");
    setTimeout(close, 1500);
  };

  if (!visible || picked.length === 0) return null;

  const animClass = closing
    ? "opacity-0 transition-opacity duration-150"
    : "opacity-100 transition-opacity duration-200";

  const cardAnim = closing
    ? "opacity-0 -translate-y-4 transition-all duration-150"
    : "opacity-100 translate-y-0 transition-all duration-300 ease-out";

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm ${animClass}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Before you go"
        className={`relative mx-4 w-full max-w-[500px] rounded-2xl bg-white shadow-2xl dark:bg-[#1a1a1a] ${cardAnim}`}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-6 pt-8">
          {/* Headline */}
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Before you go...
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Here are 3 stories you might have missed
          </p>

          {/* Article cards */}
          <div className="mt-5 space-y-3">
            {picked.map((article) => (
              <Link
                key={article.slug}
                href={`/lens/${article.slug}`}
                className="block rounded-xl border border-black/[0.07] p-4 transition-colors hover:border-[#c8922a]/30 dark:border-white/[0.07] dark:hover:border-[#c8922a]/30"
                onClick={close}
              >
                <div className="text-xs font-medium text-[#c8922a]">
                  {article.category} · {article.readingTime} min
                </div>
                <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-100 text-sm leading-snug">
                  {article.title}
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {article.description}
                </div>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-xs text-zinc-400">or</span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Email capture */}
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Get these delivered free
            </p>
            {subscribeStatus === "done" ? (
              <p className="mt-3 text-sm text-emerald-600">You&apos;re in! Check your inbox.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-3 flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-1 focus:ring-[#c8922a] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={subscribeStatus === "loading"}
                  className="rounded-lg bg-[#c8922a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#b17f24] disabled:opacity-50"
                >
                  Subscribe
                </button>
              </form>
            )}
            <p className="mt-2 text-xs text-zinc-400">
              Free · Daily · Unsubscribe anytime
            </p>
          </div>

          {/* Dismiss link */}
          <div className="mt-4 text-center">
            <button
              onClick={close}
              className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              No thanks, I&apos;ll keep browsing
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
