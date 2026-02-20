"use client";

import { useState, useEffect } from "react";

const REWARD_TIERS = [
  { count: 3, label: "1 month Premium free", emoji: "🥉" },
  { count: 10, label: "3 months Premium free", emoji: "🥈" },
  { count: 25, label: "Lifetime Premium", emoji: "🥇" },
];

export function ReferralCard({ email }: { email: string }) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!email) return;
    fetch(`/api/referral?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setReferralCode(data.referralCode);
          setReferralCount(data.referralCount);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800/50">
        <p className="text-sm text-zinc-500">Loading referral info…</p>
      </div>
    );
  }

  if (!referralCode) return null;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${referralCode}`
      : `albis.news/?ref=${referralCode}`;

  // Determine next tier
  let nextTier = REWARD_TIERS[0];
  for (const tier of REWARD_TIERS) {
    if (referralCount < tier.count) {
      nextTier = tier;
      break;
    }
  }
  const maxReached = referralCount >= REWARD_TIERS[REWARD_TIERS.length - 1].count;
  const progressPercent = maxReached
    ? 100
    : Math.min(100, (referralCount / nextTier.count) * 100);

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-6 dark:border-amber-500/20 dark:bg-amber-950/20">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/70">
        Referral Program
      </p>
      <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-xl font-semibold text-zinc-800 dark:text-zinc-100">
        Share Albis, earn Premium
      </h3>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-[family-name:var(--font-source-serif)]">
        Share your unique link with friends. When they sign up, you earn rewards.
      </p>

      {/* Share link */}
      <div className="mt-5 flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <span className="block truncate">{shareUrl}</span>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex h-10 min-w-[44px] items-center justify-center rounded-lg bg-amber-500/20 px-4 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-500/30 dark:text-amber-300"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Count */}
      <p className="mt-5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        You&apos;ve referred{" "}
        <span className="text-amber-600 dark:text-amber-400">{referralCount}</span>{" "}
        {referralCount === 1 ? "friend" : "friends"}
      </p>

      {/* Progress bar */}
      {!maxReached && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <span>{referralCount} referrals</span>
            <span>{nextTier.count} for {nextTier.label}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {maxReached && (
        <p className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400">
          🎉 You&apos;ve unlocked Lifetime Premium!
        </p>
      )}

      {/* Reward tiers */}
      <div className="mt-5 space-y-2">
        {REWARD_TIERS.map((tier) => {
          const achieved = referralCount >= tier.count;
          return (
            <div
              key={tier.count}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                achieved
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              <span>{tier.emoji}</span>
              <span className="flex-1">
                {tier.count} referrals → {tier.label}
              </span>
              {achieved && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
