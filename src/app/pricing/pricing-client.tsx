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

const DASH = (
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
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const tiers = [
  {
    id: "reader",
    name: "Free",
    tagline: "Free, forever.",
    priceMonthly: 0,
    priceAnnual: 0,
    description:
      "The essentials — a daily briefing that actually tells you what matters.",
    cta: "Start free",
    ctaHref: "/signup",
    featured: false,
    features: [
      { text: "Daily Pattern of the Day", included: true },
      { text: "Top headlines & stories", included: true },
      { text: "2 topics, 1 region", included: true },
      { text: "Personalised daily briefing", included: true },
      { text: "Light & dark mode", included: true },
      { text: "Framing Watch", included: false },
      { text: "Deep Dive analysis", included: false },
      { text: "Full scan history", included: false },
      { text: "Ask Albis (AI Q&A)", included: false },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Most popular.",
    priceMonthly: 9,
    priceAnnual: 72,
    description:
      "The full intelligence layer. Every angle, every pattern, every framing difference.",
    cta: "Start 14-day trial",
    ctaHref: "/signup",
    featured: true,
    features: [
      { text: "Everything in Free", included: true },
      { text: "Framing Watch", included: true, highlight: true },
      { text: "Deep Dive AI analysis", included: true, highlight: true },
      { text: "Full scan history & archive", included: true },
      { text: "All 12 topics, all 7 regions", included: true },
      { text: "Ask Albis — question any story", included: true, highlight: true, soon: true },
      { text: "Priority access to new features", included: true },
      { text: "Team features", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For serious readers.",
    priceMonthly: 19,
    priceAnnual: 152,
    description:
      "Everything in Standard, plus export, API access, and early features for power users.",
    cta: "Start 14-day trial",
    ctaHref: "/signup",
    featured: false,
    features: [
      { text: "Everything in Standard", included: true },
      { text: "Export & API access", included: true, highlight: true },
      { text: "Team sharing (up to 5)", included: true, highlight: true },
      { text: "Custom topic alerts", included: true },
      { text: "Earliest access to new features", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

const faqs = [
  {
    q: "What do I get with the free tier?",
    a: "A daily personalised briefing with the Pattern of the Day, top stories, and categorised intelligence across your chosen topics and region. It's genuinely useful on its own.",
  },
  {
    q: "What makes Standard worth it?",
    a: "Framing Watch shows you when the same story is told differently across regions. Deep Dive gives you AI-powered analysis of what's said, omitted, and why. History lets you browse past scans. Ask Albis lets you interrogate any story directly.",
  },
  {
    q: "Is there a commitment?",
    a: "No. Cancel anytime. No lock-in, no exit interview, no dark patterns. If Albis isn't worth it to you, you shouldn't pay.",
  },
  {
    q: "Do early subscribers keep their price?",
    a: "Yes. If pricing changes, existing subscribers keep their original rate. We believe in honest pricing.",
  },
  {
    q: "How does the annual plan work?",
    a: "Annual plans are billed once per year — like a Costco membership. You save roughly 33% compared to monthly billing, and you can still cancel for a prorated refund.",
  },
];

const comparisonFeatures = [
  { feature: "Daily briefing", albis: true, ground: true, fourteen40: true, traditional: true },
  { feature: "Multi-region coverage", albis: true, ground: true, fourteen40: false, traditional: false },
  { feature: "Framing analysis", albis: true, ground: true, fourteen40: false, traditional: false },
  { feature: "Coverage gap detection", albis: true, ground: false, fourteen40: false, traditional: false },
  { feature: "Pattern recognition", albis: true, ground: false, fourteen40: false, traditional: false },
  { feature: "AI deep dive analysis", albis: true, ground: false, fourteen40: false, traditional: false },
  { feature: "Calm, anti-doomscroll UX", albis: true, ground: false, fourteen40: true, traditional: false },
  { feature: "No algorithmic manipulation", albis: true, ground: true, fourteen40: true, traditional: false },
  { feature: "Free tier", albis: true, ground: true, fourteen40: true, traditional: false },
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
        {/* Amber gradient wash */}
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
            Start free. Upgrade when you want deeper intelligence.
            No dark patterns, no lock-in.
          </p>

          {/* Annual toggle — Costco-inspired commitment */}
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
        <div className="mx-auto grid max-w-5xl gap-5 px-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const price = annual
              ? tier.priceAnnual > 0
                ? Math.round(tier.priceAnnual / 12)
                : 0
              : tier.priceMonthly;
            const isCurrentPlan =
              premium &&
              tier.id === "standard";

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

                {/* Popular badge */}
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c8922a] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-[0_2px_8px_rgb(200,146,42,0.5)]">
                      <span className="h-1 w-1 rounded-full bg-white/60" />
                      Most Popular
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
                    {tier.name}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      tier.featured ? "text-[#c8922a]" : "text-[#c8922a]"
                    }`}
                  >
                    {tier.tagline}
                  </p>
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
                      className={`inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-medium ${
                        tier.featured
                          ? "bg-white/15 text-white"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                      }`}
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
                  ) : tier.id === "reader" ? (
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
                  ) : tier.id === "standard" ? (
                    <button
                      onClick={() => {
                        setPremium(true);
                        setIsPremium(true);
                      }}
                      className="inline-flex h-11 min-w-[44px] w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-[#f0efec]"
                    >
                      {tier.cta}
                    </button>
                  ) : (
                    <Link
                      href={tier.ctaHref}
                      className="inline-flex h-11 min-w-[44px] w-full items-center justify-center rounded-full border border-black/[0.1] text-sm font-medium text-zinc-600 hover:bg-zinc-100/80 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05]"
                    >
                      {tier.cta}
                    </Link>
                  )}
                </div>

                {/* Cancel note */}
                {tier.priceMonthly > 0 && (
                  <p
                    className={`mt-2.5 text-center text-xs ${
                      tier.featured ? "text-white/40" : "text-zinc-400 dark:text-zinc-600"
                    }`}
                  >
                    No credit card required · Cancel anytime
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
                          f.included
                            ? tier.featured
                              ? f.highlight
                                ? "text-[#c8922a]"
                                : "text-white/60"
                              : f.highlight
                              ? "text-[#c8922a]"
                              : "text-emerald-500"
                            : tier.featured
                            ? "text-white/20"
                            : "text-zinc-300 dark:text-zinc-700"
                        }`}
                      >
                        {f.included ? CHECK : DASH}
                      </span>
                      <span
                        className={
                          f.included
                            ? tier.featured
                              ? f.highlight
                                ? "font-medium text-white"
                                : "text-white/80"
                              : f.highlight
                              ? "font-medium text-[#0f0f0f] dark:text-[#f0efec]"
                              : "text-zinc-600 dark:text-zinc-400"
                            : tier.featured
                            ? "text-white/30"
                            : "text-zinc-300 dark:text-zinc-600"
                        }
                      >
                        {f.text}
                        {"soon" in f && f.soon && (
                          <span className="ml-2 inline-flex rounded-full bg-[#c8922a]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#c8922a]">
                            Soon
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Value Calculator ─────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-12 dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-2xl px-6">
          <div className="rounded-2xl border border-[#c8922a]/20 bg-[#c8922a]/5 p-8 text-center dark:border-[#c8922a]/15 dark:bg-[#c8922a]/5">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              Value Calculator
            </p>
            <p className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug text-[#0f0f0f] md:text-2xl dark:text-[#f0efec]">
              If you read news for 20 min/day, Albis Standard costs less than $0.20/day for complete perspective coverage.
            </p>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              That&apos;s less than a single article behind most paywalls — and you get every angle, every region, every day.
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] pb-16 dark:bg-[#0f0f0f]">
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

      {/* ── Comparison Table ─────────────────────────────────── */}
      <section className="bg-[#f2f0eb] py-20 dark:bg-[#111111] md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            How Albis compares
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            We built what we wished existed.
          </p>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.1] dark:border-white/[0.1]">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Feature</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-[#c8922a]">Albis</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Ground News</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">1440</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Traditional</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.feature} className="border-b border-black/[0.05] dark:border-white/[0.05]">
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">{row.feature}</td>
                    <td className="py-3 text-center">
                      {row.albis ? (
                        <span className="text-emerald-500">{CHECK}</span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">{DASH}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {row.ground ? (
                        <span className="text-zinc-400">{CHECK}</span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">{DASH}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {row.fourteen40 ? (
                        <span className="text-zinc-400">{CHECK}</span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">{DASH}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {row.traditional ? (
                        <span className="text-zinc-400">{CHECK}</span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">{DASH}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-center font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            Honest answers
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Questions you probably have. Answers that don&apos;t dodge them.
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
