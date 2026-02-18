"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalUser, isPremium, setPremium } from "@/lib/preferences";

export default function PricingClient() {
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [premium, setIsPremium] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getLocalUser());
    setIsPremium(isPremium());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main>
      {/* Header */}
      <section className="border-b border-zinc-200 py-16 dark:border-zinc-800/50 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 md:text-4xl">
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
            Start free. Upgrade when you want deeper intelligence.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-12 md:py-16">
        <div className="mx-auto grid max-w-4xl gap-6 px-6 md:grid-cols-2">
          {/* Free Tier */}
          <div className="rounded-2xl border border-zinc-200 p-8 dark:border-zinc-800/50">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Free
            </p>
            <p className="mt-4 text-3xl font-semibold text-zinc-800 dark:text-zinc-100">
              $0
            </p>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              Forever free
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Daily Pattern of the Day",
                "Top stories & headlines",
                "2 topics, 1 region",
                "Personalised briefing",
                "Light & dark mode",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mt-0.5 flex-shrink-0 text-emerald-500"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-zinc-600 dark:text-zinc-400">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {loggedIn ? (
                <Link
                  href="/briefing"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-zinc-300 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                >
                  Go to briefing
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-zinc-300 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                >
                  Sign up free
                </Link>
              )}
            </div>
          </div>

          {/* Premium Tier */}
          <div className="relative rounded-2xl border-2 border-zinc-800 p-8 dark:border-zinc-200">
            {/* Badge */}
            <div className="absolute -top-3 left-6">
              <span className="inline-flex rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-200 dark:text-zinc-900">
                Premium
              </span>
            </div>

            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Premium
            </p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-zinc-800 dark:text-zinc-100">
                $9
              </span>
              <span className="text-sm text-zinc-400 dark:text-zinc-500">/month</span>
            </div>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              Cancel anytime
            </p>

            <ul className="mt-8 space-y-3">
              {[
                { text: "Everything in Free", highlight: false },
                { text: "Framing Watch — see regional coverage divergence", highlight: true },
                { text: "Deep Dive — AI-powered story analysis", highlight: true },
                { text: "Full scan history & archive", highlight: true },
                { text: "Ask Albis — question any story (coming soon)", highlight: true },
                { text: "All 12 topics, all 7 regions", highlight: false },
                { text: "Priority access to new features", highlight: false },
              ].map((f) => (
                <li key={f.text} className="flex items-start gap-3 text-sm">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`mt-0.5 flex-shrink-0 ${
                      f.highlight
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }`}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span
                    className={
                      f.highlight
                        ? "font-medium text-zinc-800 dark:text-zinc-200"
                        : "text-zinc-600 dark:text-zinc-400"
                    }
                  >
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {premium ? (
                <div className="inline-flex h-11 w-full items-center justify-center rounded-full bg-emerald-50 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mr-2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  You&apos;re subscribed
                </div>
              ) : (
                <button
                  onClick={() => {
                    // Placeholder — will wire to Stripe later
                    setPremium(true);
                    setIsPremium(true);
                  }}
                  className="inline-flex h-11 w-full items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Subscribe
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / honest notes */}
      <section className="border-t border-zinc-200 py-12 dark:border-zinc-800/50 md:py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-center text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            Honest answers
          </h2>
          <div className="mt-8 space-y-6">
            {[
              {
                q: "What do I get with the free tier?",
                a: "A daily personalised briefing with the Pattern of the Day, top stories, and categorised intelligence across your chosen topics and region. It is genuinely useful on its own.",
              },
              {
                q: "What does Premium add?",
                a: "Framing Watch shows you when the same story is told differently across regions. Deep Dive gives you AI-powered analysis of what is said, omitted, and why. History lets you browse past scans. Ask Albis (coming soon) lets you interrogate any story.",
              },
              {
                q: "Is there a commitment?",
                a: "No. Cancel anytime. No lock-in, no exit interview, no dark patterns. If Albis is not worth $9/month to you, you should not pay $9/month.",
              },
              {
                q: "Will prices change?",
                a: "Early subscribers lock in their rate. If pricing changes later, existing subscribers keep their original price.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {faq.q}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
