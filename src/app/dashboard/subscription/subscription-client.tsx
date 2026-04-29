"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTier, TIERS, PURCHASABLE_TIERS } from "@/lib/subscription-tiers";
import {
  isSubscriptionActive,
  isInGracePeriod,
  getEffectiveTier,
} from "@/lib/tier-enforcement";

interface ProfileData {
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_period_end: string | null;
  stripe_customer_id: string | null;
}

interface CompanyData {
  tracked_themes: string[];
  watchlist_entities: string[];
  email_recipients: string[];
}

export default function SubscriptionClient() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "subscription_status, subscription_tier, subscription_period_end, stripe_customer_id, is_test_account, trial_end_at",
        )
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      const { data: companyData } = await supabase
        .from("company_profiles")
        .select("tracked_themes, watchlist_entities, email_recipients")
        .eq("owner_id", user.id)
        .single();

      setCompany(companyData);
      setLoading(false);
    });
  }, []);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // ignore
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  const sub: ProfileData = profile || {
    subscription_status: null,
    subscription_tier: null,
    subscription_period_end: null,
    stripe_customer_id: null,
  };

  const active = isSubscriptionActive(sub);
  const grace = isInGracePeriod(sub);
  const effectiveTier = getEffectiveTier(sub);
  const tierDef = getTier(sub.subscription_tier);

  const periodEnd = sub.subscription_period_end
    ? new Date(sub.subscription_period_end).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const themes = company?.tracked_themes?.length || 0;
  const entities = company?.watchlist_entities?.length || 0;
  const recipients = company?.email_recipients?.length || 0;

  const cardClass =
    "rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]";
  const sectionHeader =
    "text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500";
  const btnPrimary =
    "inline-flex h-10 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-medium text-white hover:bg-[#c8922a]/90 disabled:opacity-60";

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
        Subscription
      </h2>

      <div className="mt-8 space-y-6">
        {/* Current plan */}
        <div className={cardClass}>
          <h3 className={sectionHeader}>Current plan</h3>
          <div className="mt-4 flex items-center gap-3">
            {active ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {sub.subscription_status === "trialing" ? "Trial" : "Active"}
              </span>
            ) : grace ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Grace period
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Free
              </span>
            )}
            <span className="text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              {tierDef.label}
            </span>
          </div>

          {periodEnd && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {sub.subscription_status === "trialing"
                ? `Trial ends ${periodEnd}`
                : active
                  ? `Renews ${periodEnd}`
                  : `Access until ${periodEnd}`}
            </p>
          )}

          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            {tierDef.description}
          </p>

          {/* Manage billing or upgrade */}
          <div className="mt-5 flex flex-wrap gap-3">
            {sub.stripe_customer_id && (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className={btnPrimary}
              >
                {portalLoading ? "Loading..." : "Manage billing"}
              </button>
            )}
            {!active && !grace && (
              <Link href="/pricing" className={btnPrimary}>
                View plans
              </Link>
            )}
          </div>
        </div>

        {/* Usage */}
        {(active || grace) && (
          <div className={cardClass}>
            <h3 className={sectionHeader}>Usage</h3>
            <div className="mt-4 space-y-3">
              <UsageRow
                label="Tracked themes"
                current={themes}
                max={effectiveTier.maxTrackedThemes}
              />
              <UsageRow
                label="Watchlist entities"
                current={entities}
                max={effectiveTier.maxWatchlistEntities}
              />
              <UsageRow
                label="Email recipients"
                current={recipients}
                max={effectiveTier.maxEmailRecipients}
              />
            </div>
          </div>
        )}

        {/* Upgrade options */}
        {active &&
          sub.subscription_tier &&
          sub.subscription_tier !== "company_intelligence" && (
            <div className={cardClass}>
              <h3 className={sectionHeader}>Upgrade</h3>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                Need more capacity? Upgrade to unlock higher limits and
                additional features.
              </p>
              <div className="mt-4 space-y-2">
                {(PURCHASABLE_TIERS as readonly string[])
                  .filter((t) => {
                    const order = ["pro", "team", "company_intelligence"];
                    return (
                      order.indexOf(t) > order.indexOf(sub.subscription_tier!)
                    );
                  })
                  .map((tierId) => {
                    const t = TIERS[tierId];
                    return (
                      <Link
                        key={tierId}
                        href={`/checkout/${tierId}`}
                        className="flex items-center justify-between rounded-xl border border-black/[0.07] px-4 py-3 transition-colors hover:bg-black/[0.02] dark:border-white/[0.07] dark:hover:bg-white/[0.03]"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                            {t.label}
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            {t.description}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-[#c8922a]">
                          ${t.monthlyPrice}/mo
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}

        {/* Not subscribed prompt */}
        {!active && !grace && (
          <div className="rounded-2xl border border-[#c8922a]/20 bg-[#c8922a]/5 p-7 dark:bg-[#c8922a]/10">
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              Start your company daily scan
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Monitor the topics, entities, and regions that matter to your
              business. Start with a free trial.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex h-10 items-center rounded-full bg-[#c8922a] px-6 text-sm font-medium text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] hover:bg-[#b17f24]"
            >
              View plans
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Usage row
// ---------------------------------------------------------------------------

function UsageRow({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const atLimit = current >= max;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {label}
        </span>
        <span
          className={`text-sm font-medium ${
            atLimit
              ? "text-amber-600 dark:text-amber-400"
              : "text-[#0f0f0f] dark:text-[#f0efec]"
          }`}
        >
          {current}/{max}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${
            atLimit ? "bg-amber-500" : "bg-[#c8922a]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
