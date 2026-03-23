"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  stripe_customer_id: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_period_end: string | null;
}

export default function AccountClient() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/signup");
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from("profiles")
        .select("stripe_customer_id, subscription_status, subscription_tier, subscription_period_end")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    });
  }, [router]);

  async function handleManage() {
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
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  const hasSubscription = profile?.subscription_status === "active" || profile?.subscription_status === "trialing";
  const tierLabel = profile?.subscription_tier
    ? profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)
    : null;
  const periodEnd = profile?.subscription_period_end
    ? new Date(profile.subscription_period_end).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f] min-h-screen">
      <section className="mx-auto max-w-xl px-6 py-20">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
          Account
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {user?.email}
        </p>

        <div className="mt-10 rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
            Subscription
          </h2>

          {hasSubscription ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {profile?.subscription_status === "trialing" ? "Trial" : "Active"}
                </span>
                <span className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                  {tierLabel} plan
                </span>
              </div>

              {periodEnd && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {profile?.subscription_status === "trialing"
                    ? `Trial ends ${periodEnd}`
                    : `Renews ${periodEnd}`}
                </p>
              )}

              <button
                onClick={handleManage}
                disabled={portalLoading}
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-medium text-white hover:bg-[#c8922a]/90 disabled:opacity-60"
              >
                {portalLoading ? "Loading…" : "Manage subscription"}
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Free plan
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                More features coming soon. For now, enjoy Albis completely free.
              </p>
              <Link
                href="/archive"
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-medium text-white hover:bg-[#c8922a]/90"
              >
                View today's briefing
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
