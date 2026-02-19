"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalUser, isPremium, setPremium } from "@/lib/preferences";

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

const tiers = [
  {
    id: "free",
    name: "The Window",
    tagline: "Free, forever.",
    priceMonthly: 0,
    priceAnnual: 0,
    description:
      "Your daily window into what matters — a briefing that actually tells you what's going on.",
    cta: "Get started free",
    ctaHref: "/signup",
    featured: false,
    features: [
      { text: "Daily briefing", included: true },
      { text: "Top stories", included: true },
      { text: "Pattern of the Day", included: true },
      { text: "2 topics, 1 region", included: true },
      { text: "Light & dark mode", included: true },
    ],
  },
  {
    id: "premium",
    name: "The Full Picture",
    tagline: "See everything.",
    priceMonthly: 9,
    priceAnnual: 72,
    description:
      "Every angle, every pattern, every framing difference. The full intelligence layer.",
    cta: "Start 14-day trial",
    ctaHref: "/signup",
    featured: true,
    features: [
      { text: "Everything in Free", included: true, highlight: false },
      { text: "Perspective breakdowns", included: true, highlight: true },
      { text: "Blindspot alerts", included: true, highlight: true },
      { text: "What you're not being told", included: true, highlight: true },
      { text: "All 12 topics, all 7 regions", included: true, highlight: false },
      { text: "Personalised email digest", included: true, highlight: false },
    ],
  },
];

const faqs = [
  {
    q: "What do I get for free?",
    a: "A daily briefing with the Pattern of the Day, top stories, and intelligence across your chosen topics and region. It's genuinely useful on its own — not a crippled trial.",
  },
  {
    q: "Is there a commitment?",
    a: "No. Cancel anytime. No lock-in, no exit interview, no dark patterns. If Albis isn't worth it, you shouldn't pay.",
  },
  {
    q: "What does Premium actually add?",
    a: "Perspective breakdowns show how the same story reads differently across regions. Blindspot alerts flag what your media diet is missing. You also get all topics, all regions, and a personalised email digest.",
  },
  {
    q: "Do early subscribers keep their price?",
    a: "Yes. If pricing changes, existing subscribers keep their original rate.",
  },
];

export default function PricingClient() {
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [premium, setIsPremium] = useState(false);
  const [annual, setAnnual] = useState(true);

  useEffect(() => {
    setLoggedIn(!!getLocalUser());
    setIsPremium(isPremium());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main>
      {/* ── Header ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/50 via-transparent to-transparent dark:from-amber-950/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/30 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            Pricing
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-[#0f0f0f] md:text-5xl dark:text-[#f0efec]">
            Simple, <span className="text-gradient-amber">honest</span> pricing.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
            Start free. Upgrade when you want the full picture.
          </p>

          {/* Annual toggle */}
          <div className="mt-8 inline-flex items-center gap-4 rounded-full border border-black/[0.08] bg-white p-1 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <button
              onClick={() => setAnnual(false)}
              className={`h-9 min-w-[44px] rounded-full px-5 text-sm font-medium transition-all ${
                !annual
                  ? "bg-[#1a3a5c] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex h-9 min-w-[44px] items-center gap-2 rounded-full px-5 text-sm font-medium transition-all ${
                annual
                  ? "bg-[#1a3a5c] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Annual
              <span className="rounded-full bg-[#c8922a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#c8922a] dark:bg-[#c8922a]/20">
                Save 33%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Tiers ─────────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-8 dark:bg-[#0f0f0f] md:py-12">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 md:grid-cols-2">
          {tiers.map((tier) => {
            const price = annual
              ? tier.priceAnnual > 0
                ? Math.round(tier.priceAnnual / 12)
                : 0
              : tier.priceMonthly;
            const isCurrentPlan =
              premium && tier.id === "premium";

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl p-7 transition-all ${
                  tier.featured
                    ? "bg-[#1a3a5c] shadow-[0_8px_40px_rgb(26,58,92,0.25)] dark:shadow-[0_8px_40px_rgb(26,58,92,0.4)]"
                    : "border border-black/[0.07] bg-white dark:border-white/[0.07] dark:bg-white/[0.03]"
                }`}
              >
                {/* Top shine for featured */}
                {tier.featured && (
                  <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}

                {/* Badge */}
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c8922a] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-[0_2px_8px_rgb(200,146,42,0.5)]">
                      <span className="h-1 w-1 rounded-full bg-white/60" />
                      Full Picture
                    </span>
                  </div>
                )}

                {/* Tier name */}
                <div>
                  <p
                    className={`text-xs font-semibold tracking-[0.15em] uppercase ${
                      tier.featured ? "text-white/60" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {tier.featured ? "Premium" : "Free"}
                  </p>
                  <h3
                    className={`mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold ${
                      tier.featured ? "text-white" : "text-[#0f0f0f] dark:text-[#f0efec]"
                    }`}
                  >
                    {tier.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span
                    className={`font-[family-name:var(--font-playfair)] text-4xl font-bold ${
                      tier.featured ? "text-white" : "text-[#0f0f0f] dark:text-[#f0efec]"
                    }`}
                  >
                    {price === 0 ? "Free" : `$${price}`}
                  </span>
                  {price > 0 && (
                    <span
                      className={`text-sm ${
                        tier.featured ? "text-white/60" : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      /mo
                    </span>
                  )}
                </div>
                {price > 0 && annual && (
                  <p
                    className={`mt-1 text-xs ${
                      tier.featured ? "text-white/50" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    ${tier.priceAnnual}/year billed annually
                  </p>
                )}
                {price > 0 && !annual && (
                  <p
                    className={`mt-1 text-xs ${
                      tier.featured ? "text-white/50" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    ${tier.priceMonthly}/month billed monthly
                  </p>
                )}

                {/* Description */}
                <p
                  className={`mt-3 text-sm leading-relaxed ${
                    tier.featured ? "text-white/65" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {tier.description}
                </p>

                {/* CTA */}
                <div className="mt-7">
                  {isCurrentPlan ? (
                    <div
                      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white/15 text-sm font-medium text-white"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="mr-2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Current plan
                    </div>
                  ) : tier.id === "free" ? (
                    loggedIn ? (
                      <Link
                        href="/briefing"
                        className="inline-flex h-11 min-w-[44px] w-full items-center justify-center rounded-full border border-black/[0.1] text-sm font-medium text-zinc-600 hover:bg-zinc-100/80 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05]"
                      >
                        Go to briefing
                      </Link>
                    ) : (
                      <Link
                        href="/signup"
                        className="inline-flex h-11 min-w-[44px] w-full items-center justify-center rounded-full border border-black/[0.1] text-sm font-medium text-zinc-600 hover:bg-zinc-100/80 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05]"
                      >
                        Get started free
                      </Link>
                    )
                  ) : (
                    <button
                      onClick={() => {
                        setPremium(true);
                        setIsPremium(true);
                      }}
                      className="inline-flex h-11 min-w-[44px] w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-[#f0efec]"
                    >
                      {tier.cta}
                    </button>
                  )}
                </div>

                {/* Cancel note */}
                {tier.priceMonthly > 0 && (
                  <p
                    className={`mt-2.5 text-center text-xs ${
                      tier.featured ? "text-white/40" : "text-zinc-400 dark:text-zinc-600"
                    }`}
                  >
                    No credit card required &middot; Cancel anytime
                  </p>
                )}

                {/* Divider */}
                <div
                  className={`my-6 h-px ${
                    tier.featured ? "bg-white/10" : "bg-black/[0.06] dark:bg-white/[0.06]"
                  }`}
                />

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-sm">
                      <span
                        className={`mt-0.5 flex-shrink-0 ${
                          tier.featured
                            ? "highlight" in f && f.highlight
                              ? "text-[#c8922a]"
                              : "text-white/60"
                            : "text-emerald-500"
                        }`}
                      >
                        {CHECK}
                      </span>
                      <span
                        className={
                          tier.featured
                            ? "highlight" in f && f.highlight
                              ? "font-medium text-white"
                              : "text-white/80"
                            : "text-zinc-600 dark:text-zinc-400"
                        }
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-12 dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-black/[0.07] bg-white px-8 py-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
            {[
              { icon: "🔒", text: "No data selling" },
              { icon: "✓", text: "Cancel anytime" },
              { icon: "💳", text: "14-day free trial" },
              { icon: "🔄", text: "Price lock for early subscribers" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="text-base">{icon}</span>
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
          <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Questions you probably have.
          </p>
          <div className="mt-10 space-y-7">
            {faqs.map((faq) => (
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
            className="mt-8 inline-flex h-13 min-w-[44px] items-center gap-2 rounded-full bg-white px-9 py-3.5 text-sm font-semibold text-[#1a3a5c] shadow-[0_4px_16px_rgb(0,0,0,0.2)] hover:bg-[#f0efec]"
          >
            Create free account →
          </Link>
        </div>
      </section>
    </main>
  );
}
