"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  referralCount: number;
  tier: string;
  nextTier: string | null;
  nextTierAt: number | null;
  progress: number;
}

const TIERS = [
  { name: "Reader", at: 0, description: "You're here" },
  { name: "Insider", at: 3, description: "Exclusive weekly PGI deep-dive email" },
  { name: "Ambassador", at: 10, description: "Name on the Albis supporters page" },
  { name: "Founding Member", at: 25, description: "Direct line to the editorial team" },
];

export default function ReferralsPage() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function lookupReferrals() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/referrals?email=${encodeURIComponent(email.trim())}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setError("Email not found. Make sure you're subscribed first.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  async function copyLink() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10 md:py-14 pb-28 md:pb-14">
      <nav className="mb-6 text-sm text-zinc-400 dark:text-zinc-500">
        <Link href="/account" className="hover:text-[#c8922a] transition-colors">Account</Link>
        <span className="mx-2">›</span>
        <span className="text-zinc-600 dark:text-zinc-300">Referrals</span>
      </nav>

      <h1 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
        Refer friends, earn rewards
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Share Albis with friends and unlock exclusive rewards.
      </p>

      {/* Email lookup */}
      {!data && (
        <div className="mt-8">
          <label className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
            Your subscriber email
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupReferrals()}
              placeholder="you@example.com"
              className="flex-1 h-11 rounded-lg border border-black/10 bg-white px-4 text-sm outline-none focus:border-[#c8922a]/40 focus:ring-1 focus:ring-[#c8922a]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            <button
              onClick={lookupReferrals}
              disabled={loading}
              className="h-11 rounded-lg bg-[#c8922a] px-5 text-sm font-medium text-white hover:bg-[#b17f24] disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : "Look up"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      )}

      {/* Referral dashboard */}
      {data && (
        <div className="mt-8 space-y-6">
          {/* Current tier */}
          <div className="rounded-xl border border-black/[0.06] p-5 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium tracking-[0.15em] uppercase text-[#c8922a]">Your tier</p>
                <p className="mt-1 text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">{data.tier}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">{data.referralCount}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">referrals</p>
              </div>
            </div>

            {/* Progress bar */}
            {data.nextTierAt && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
                  <span>{data.referralCount} of {data.nextTierAt}</span>
                  <span>Next: {data.nextTier}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#c8922a] transition-all"
                    style={{ width: `${Math.min(data.progress * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Referral link */}
          <div className="rounded-xl border border-black/[0.06] p-5 dark:border-white/[0.06]">
            <p className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec] mb-2">Your referral link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={data.referralUrl}
                className="flex-1 h-10 rounded-lg border border-black/10 bg-zinc-50 px-3 text-sm text-zinc-600 outline-none dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
              />
              <button
                onClick={copyLink}
                className="h-10 rounded-lg bg-[#c8922a] px-4 text-sm font-medium text-white hover:bg-[#b07f24] transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Share buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I get my daily news from Albis — 7 regions, zero bias. Try it free:")}&url=${encodeURIComponent(data.referralUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-black/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-[#c8922a] transition-colors dark:border-white/[0.06] dark:text-zinc-400"
              >
                Share on 𝕏
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent("I get my daily news from Albis — 7 regions, zero bias. Try it free: " + data.referralUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-black/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-[#c8922a] transition-colors dark:border-white/[0.06] dark:text-zinc-400"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Tier roadmap */}
          <div className="rounded-xl border border-black/[0.06] p-5 dark:border-white/[0.06]">
            <p className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec] mb-4">Reward tiers</p>
            <div className="space-y-3">
              {TIERS.map((tier, i) => {
                const reached = data.referralCount >= tier.at;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs ${reached ? "bg-[#c8922a] text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                      {reached ? "✓" : tier.at}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${reached ? "text-[#0f0f0f] dark:text-[#f0efec]" : "text-zinc-400 dark:text-zinc-500"}`}>
                        {tier.name}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{tier.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
