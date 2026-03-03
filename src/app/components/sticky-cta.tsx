"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("albis-sticky-dismissed")) {
      setDismissed(true);
      return;
    }

    const handleScroll = () => {
      // Show after scrolling 40% of the page
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      setVisible(scrollPercent > 0.4);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.07] bg-[#f8f7f4]/95 backdrop-blur-lg dark:border-white/[0.06] dark:bg-[#0f0f0f]/95 md:bottom-0">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 md:px-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="hidden sm:inline">Get the daily briefing — 7 regions, zero spin, free.</span>
          <span className="sm:hidden">Daily briefing — free.</span>
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-[#c8922a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#b17f24]"
          >
            Subscribe free
          </Link>
          <button
            onClick={() => {
              setDismissed(true);
              sessionStorage.setItem("albis-sticky-dismissed", "1");
            }}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Dismiss"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
