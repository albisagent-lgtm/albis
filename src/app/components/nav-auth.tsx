"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalUser } from "@/lib/preferences";

export function NavAuth() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getLocalUser());
    setMounted(true);

    function onStorage() {
      setLoggedIn(!!getLocalUser());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!mounted) {
    return <div className="flex items-center gap-3 w-[100px]" />;
  }

  if (loggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-black/[0.06] hover:text-[#0f0f0f] dark:hover:bg-white/[0.06] dark:hover:text-[#f0efec]"
          aria-label="Settings"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm text-zinc-500 transition-colors hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-[#1a3a5c] px-4 py-1.5 text-sm font-medium text-white shadow-[0_2px_8px_rgb(26,58,92,0.3)] transition-all hover:bg-[#243f66] hover:shadow-[0_3px_10px_rgb(26,58,92,0.4)] dark:shadow-[0_2px_8px_rgb(26,58,92,0.4)]"
      >
        Start free
      </Link>
    </div>
  );
}

export function NavLinks() {
  return (
    <div className="hidden items-center gap-6 sm:flex">
      <Link
        href="/briefing"
        className="text-sm text-zinc-500 transition-colors hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]"
      >
        Briefing
      </Link>
      <Link
        href="/pricing"
        className="text-sm text-zinc-500 transition-colors hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]"
      >
        Pricing
      </Link>
    </div>
  );
}
