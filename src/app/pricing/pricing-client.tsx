"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const CHECK = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PRICE_MONTHLY = "price_1T3plsBBaDpCgoIEzQaADPMx";
const PRICE_ANNUAL = "price_1T3ppVBBaDpCgoIEN4TExI9d";

export default function PricingClient() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [annual, setAnnual] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    setMounted(true);
  }, []);

  async function handleSubscribe() {
    if (!user) {
      router.push("/signup");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: annual ? PRICE_ANNUAL : PRICE_MONTHLY, userId: user.id }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <main>
      {/* ── Header ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/50 via-transparent to-transparent dark:from-amber-950/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/30 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            Go Pro
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-[#0f0f0f] md:text-5xl dark:text-[#f0efec]">
            Simple, <span className="text-gradient-amber">honest</span> pricing.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
            Subscribe — it's free.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm ${!annual ? "font-semibold text-[#0f0f0f] dark:text-[#f0efec]" : "text-zinc-400 dark:text-zinc-500"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-7 w-12 rounded-full transition-colors ${annual ? "bg-[#c8922a]" : "bg-zinc-300 dark:bg-zinc-600"}`}
              aria-label="Toggle annual billing"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${annual ? "translate-x-5" : ""}`}
              />
            </button>
            <span className={`text-sm ${annual ? "font-semibold text-[#0f0f0f] dark:text-[#f0efec]" : "text-zinc-400 dark:text-zinc-500"}`}>
              Annual
            </span>
            {annual && (
              <span className="ml-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Save 17%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Two Tiers ─────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-8 dark:bg-[#0f0f0f] md:py-12">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-400 dark:text-zinc-500">
              Free
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              The Basics
            </h3>
            <div className="mt-5">
              <span className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                Free
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Everything you need to stay informed. Genuinely useful — not a crippled trial.
            </p>

            <div className="mt-7">
              {user ? (
                <Link
                  href="/briefing"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-black/[0.1] text-sm font-medium text-zinc-600 hover:bg-zinc-100/80 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05]"
                >
                  Go to briefing
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-black/[0.1] text-sm font-medium text-zinc-600 hover:bg-zinc-100/80 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05]"
                >
                  Get started free
                </Link>
              )}
            </div>

            <div className="my-6 h-px bg-black/[0.06] dark:bg-white/[0.06]" />

            <ul className="space-y-3 flex-1">
              {[
                "Daily briefing on the site",
                "The Lens articles",
                "Pattern of the Day",
                "Light & dark mode",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex-shrink-0 text-emerald-500">{CHECK}</span>
                  <span className="text-zinc-600 dark:text-zinc-400">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-2xl bg-[#1a3a5c] p-7 shadow-[0_8px_40px_rgb(26,58,92,0.25)] dark:shadow-[0_8px_40px_rgb(26,58,92,0.4)]">
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c8922a] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-[0_2px_8px_rgb(200,146,42,0.5)]">
                <span className="h-1 w-1 rounded-full bg-white/60" />
                Recommended
              </span>
            </div>

            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-white/60">
              Pro
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white">
              The Full Picture
            </h3>
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-white">
                {annual ? "$7.42" : "$9"}
              </span>
              <span className="text-sm text-white/60">/mo</span>
            </div>
            <p className="mt-1 text-xs text-white/50">
              {annual ? "Billed annually at $89/year. Cancel anytime." : "Billed monthly. Cancel anytime."}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              The full intelligence layer. Everything in Free plus deeper analysis delivered to your inbox.
            </p>

            <div className="mt-7">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1a3a5c] shadow-sm transition-all hover:bg-[#f0efec] disabled:opacity-60"
              >
                {loading ? "Redirecting…" : "Subscribe"}
              </button>
            </div>

            <p className="mt-2.5 text-center text-xs text-white/40">
              Cancel anytime
            </p>

            <div className="my-6 h-px bg-white/10" />

            <ul className="space-y-3 flex-1">
              {[
                { text: "Everything in Free", highlight: false },
                { text: "Email digest to your inbox", highlight: true },
                { text: "Personalised topics & regions", highlight: true },
                { text: "Deeper analysis & perspectives", highlight: true },
                { text: "Full archive access", highlight: true },
                { text: "Priority support", highlight: false },
              ].map((f) => (
                <li key={f.text} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 flex-shrink-0 ${f.highlight ? "text-[#c8922a]" : "text-white/60"}`}>
                    {CHECK}
                  </span>
                  <span className={f.highlight ? "font-medium text-white" : "text-white/80"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-12 dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-black/[0.07] bg-white px-8 py-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
            {[
              "No data selling",
              "Cancel anytime",
              "Price lock for early subscribers",
            ].map((text) => (
              <div key={text} className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="text-[#c8922a]">{CHECK}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="bg-[#f2f0eb] py-20 dark:bg-[#111111] md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-center font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            Honest answers
          </h2>
          <div className="mt-10 space-y-7">
            {[
              {
                q: "What do I get for free?",
                a: "A daily briefing with the Pattern of the Day, top stories, and The Lens articles. It's genuinely useful on its own — not a crippled trial.",
              },
              {
                q: "Is there a commitment?",
                a: "No. Cancel anytime. No lock-in, no exit interview, no dark patterns. If Albis isn't worth it, you shouldn't pay.",
              },
              {
                q: "What does Pro actually add?",
                a: "Your briefing delivered to your inbox, personalised topics and regions, deeper analysis with perspective breakdowns, and full archive access.",
              },
              {
                q: "Do early subscribers keep their price?",
                a: "Yes. If pricing changes, existing subscribers keep their original rate.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-black/[0.06] bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <h3 className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  {faq.q}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────── */}
      <section className="relative bg-[#1a3a5c] py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-20" />
        <div className="relative mx-auto max-w-xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white md:text-3xl">
            Start for free today.
          </h2>
          <p className="mt-3 text-base text-white/60 font-[family-name:var(--font-source-serif)]">
            No credit card. No lock-in. Just clearer news.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-white px-9 py-3.5 text-sm font-semibold text-[#1a3a5c] shadow-[0_4px_16px_rgb(0,0,0,0.2)] hover:bg-[#f0efec]"
          >
            Create free account →
          </Link>
        </div>
      </section>
    </main>
  );
}
