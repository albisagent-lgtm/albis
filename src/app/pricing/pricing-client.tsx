"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TIERS,
  TIER_ORDER,
  PURCHASABLE_TIERS,
  type TierDefinition,
} from "@/lib/subscription-tiers";

export default function PricingClient() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="relative min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-transparent to-transparent dark:from-amber-950/10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/25 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
            Pricing
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f0efec] md:text-4xl">
            Know what moved before it becomes noise
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Albis scans the topics, entities, regions, and exposures your
            company cares about, then sends the useful findings only — organized
            by topic, linked to open sources, and backed by a dashboard source
            trail when you need to verify the wider picture.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
            Built for founders, analysts, operators, and teams who need global
            monitoring without spending every morning sorting through headlines.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <span
            className={`text-sm font-medium ${
              !annual
                ? "text-[#0f0f0f] dark:text-[#f0efec]"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              annual ? "bg-[#c8922a]" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                annual ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              annual
                ? "text-[#0f0f0f] dark:text-[#f0efec]"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            Annual
          </span>
          {annual && (
            <span className="ml-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Save 20%
            </span>
          )}
        </div>

        {/* Tier cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {TIER_ORDER.filter((id) => id !== "free").map((tierId) => {
            const tier = TIERS[tierId];
            return (
              <TierCard
                key={tierId}
                tier={tier}
                annual={annual}
                isPurchasable={(
                  PURCHASABLE_TIERS as readonly string[]
                ).includes(tierId)}
              />
            );
          })}
        </div>

        {/* Paid plan baseline */}
        <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-black/[0.07] bg-white/70 p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
            Every paid plan includes
          </p>
          <div className="mt-4 grid gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2 lg:grid-cols-4">
            <MiniFeature text="Daily topic-by-topic company scan" />
            <MiniFeature text="Open-web source link per finding" />
            <MiniFeature text="Dashboard archive and source trail" />
            <MiniFeature text="Perception Gap context where useful" />
          </div>
        </div>

        {/* Free tier note */}
        <div className="mt-10 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Already reading albis.news? Your free access to public global news
            intelligence continues.{" "}
            <Link
              href="/register"
              className="font-medium text-[#c8922a] hover:underline"
            >
              Create a free account
            </Link>
          </p>
        </div>

        {/* Value props */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <ValueProp
              title="Finds movement"
              text="The scan is built to surface concrete developments in your monitored areas, not summarize the whole news cycle."
            />
            <ValueProp
              title="Reduces repeat noise"
              text="The product direction is daily monitoring with deduplication, so the same old story does not keep coming back as new."
            />
            <ValueProp
              title="Shows the gap"
              text="Perception Gap notes highlight when regions or sources are seeing the same issue differently, without turning the scan into an essay."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniFeature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-[#f8f7f4] px-3 py-2 dark:bg-white/[0.04]">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8922a]" />
      <span>{text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier card
// ---------------------------------------------------------------------------

function TierCard({
  tier,
  annual,
  isPurchasable,
}: {
  tier: TierDefinition;
  annual: boolean;
  isPurchasable: boolean;
}) {
  const price = annual ? tier.annualPrice : tier.monthlyPrice;
  const isEnterprise = price === null;
  const isHighlighted = tier.highlighted;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
        isHighlighted
          ? "border-[#c8922a]/40 bg-white shadow-[0_4px_24px_rgb(200,146,42,0.1)] ring-1 ring-[#c8922a]/20 dark:border-[#c8922a]/30 dark:bg-white/[0.04] dark:shadow-none"
          : "border-black/[0.07] bg-white dark:border-white/[0.07] dark:bg-white/[0.03]"
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-[#c8922a] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Most popular
          </span>
        </div>
      )}

      <div>
        <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
          {tier.label}
        </h3>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {tier.description}
        </p>
      </div>

      {/* Price */}
      <div className="mt-5">
        {isEnterprise ? (
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            Custom
          </p>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
              ${price}
            </span>
            <span className="text-sm text-zinc-400 dark:text-zinc-500">
              /mo
            </span>
          </div>
        )}
        {annual && !isEnterprise && tier.monthlyPrice && (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Billed annually (${(price || 0) * 12}/year)
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="mt-5">
        {isPurchasable ? (
          <Link
            href={`/checkout/${tier.id}${annual ? "?billing=annual" : ""}`}
            className={`flex h-10 items-center justify-center rounded-full text-sm font-medium transition-all ${
              isHighlighted
                ? "bg-[#c8922a] text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] hover:bg-[#b17f24]"
                : "bg-[#0f0f0f] text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            }`}
          >
            Start 3-day trial
          </Link>
        ) : (
          <a
            href="mailto:harry@albis.news?subject=Enterprise%20enquiry"
            className="flex h-10 items-center justify-center rounded-full border border-black/[0.1] text-sm font-medium text-zinc-600 transition-colors hover:bg-black/[0.03] dark:border-white/[0.1] dark:text-zinc-300 dark:hover:bg-white/[0.03]"
          >
            Contact us
          </a>
        )}
      </div>

      {/* Features */}
      <ul className="mt-6 flex-1 space-y-2.5">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0 text-[#c8922a]"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-zinc-600 dark:text-zinc-400">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Value prop
// ---------------------------------------------------------------------------

function ValueProp({ title, text }: { title: string; text: string }) {
  return (
    <div className="text-center">
      <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0f0f0f] dark:text-[#f0efec]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {text}
      </p>
    </div>
  );
}
