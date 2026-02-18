"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isPremium, getLocalUser } from "@/lib/preferences";

/**
 * Wraps premium-only content. Shows an upgrade prompt if the user is not premium.
 */
export function PremiumGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setHasPremium(isPremium());
    setLoggedIn(!!getLocalUser());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
      </main>
    );
  }

  if (hasPremium) {
    return <>{children}</>;
  }

  return <UpgradePrompt loggedIn={loggedIn} />;
}

function UpgradePrompt({ loggedIn }: { loggedIn: boolean }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="mx-auto w-full max-w-lg text-center">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-600 dark:text-amber-400"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          Premium Feature
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          This feature is available with Albis Premium. Unlock deeper analysis,
          historical archives, framing comparisons, and more.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            View pricing
          </Link>
          {!loggedIn && (
            <Link
              href="/signup"
              className="inline-flex h-11 items-center rounded-full border border-zinc-300 px-8 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
            >
              Sign up free
            </Link>
          )}
        </div>

        {/* Feature preview */}
        <div className="mt-12 grid gap-4 text-left sm:grid-cols-2">
          {[
            {
              label: "Framing Watch",
              desc: "See how the same story is told differently across regions",
            },
            {
              label: "Deep Dive",
              desc: "AI-powered analysis of what is said, omitted, and why",
            },
            {
              label: "History",
              desc: "Browse past scans and track patterns over time",
            },
            {
              label: "Ask Albis",
              desc: "Ask questions about any story and get global perspective",
            },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800/50"
            >
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {f.label}
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
