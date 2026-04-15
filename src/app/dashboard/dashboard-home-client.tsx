"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  BriefingRenderer,
  BriefingPending,
  BriefingEmpty,
  type BriefingContent,
} from "@/app/components/briefing-renderer";
import {
  isSubscriptionActive,
  isInGracePeriod,
  type ProfileSubscription,
} from "@/lib/tier-enforcement";

interface DashboardData {
  briefing: {
    id: string;
    briefing_date: string;
    status: string;
    briefing_content: BriefingContent | null;
    stories_considered: number;
    stories_selected: number;
  } | null;
  stats: {
    daysSinceSignup: number;
    briefingsReceived: number;
    topThemes: string[];
  };
  subscription: ProfileSubscription;
}

export default function DashboardHomeClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      // Fetch subscription from profiles
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_tier, subscription_period_end")
        .eq("id", user.id)
        .single();

      const subscription: ProfileSubscription = {
        subscription_status: userProfile?.subscription_status ?? null,
        subscription_tier: userProfile?.subscription_tier ?? null,
        subscription_period_end: userProfile?.subscription_period_end ?? null,
      };

      // Get company profile
      const { data: profile } = await supabase
        .from("company_profiles")
        .select("id, created_at")
        .eq("owner_id", user.id)
        .single();

      if (!profile) return;

      // Get today's briefing (or most recent)
      const { data: briefings } = await supabase
        .from("company_briefings")
        .select(
          "id, briefing_date, status, briefing_content, stories_considered, stories_selected"
        )
        .eq("company_profile_id", profile.id)
        .order("briefing_date", { ascending: false })
        .limit(1);

      const briefing = briefings?.[0] || null;

      // Count total briefings received
      const { count: totalBriefings } = await supabase
        .from("company_briefings")
        .select("id", { count: "exact", head: true })
        .eq("company_profile_id", profile.id)
        .eq("status", "generated");

      // Count delivered too
      const { count: deliveredBriefings } = await supabase
        .from("company_briefings")
        .select("id", { count: "exact", head: true })
        .eq("company_profile_id", profile.id)
        .eq("status", "delivered");

      const briefingsReceived = (totalBriefings || 0) + (deliveredBriefings || 0);

      // Get top themes from recent story scores
      const { data: recentScores } = await supabase
        .from("company_story_scores")
        .select("story_tags")
        .eq("company_profile_id", profile.id)
        .eq("selected_for_briefing", true)
        .order("scan_date", { ascending: false })
        .limit(30);

      const tagCounts: Record<string, number> = {};
      for (const row of recentScores || []) {
        const tags: string[] = row.story_tags || [];
        for (const tag of tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
      const topThemes = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

      // Days since signup
      const daysSinceSignup = Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      setData({
        briefing,
        subscription,
        stats: {
          daysSinceSignup,
          briefingsReceived,
          topThemes,
        },
      });
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  if (!data) return null;

  const { briefing, stats, subscription } = data;
  const showSubscribeBanner =
    !isSubscriptionActive(subscription) && !isInGracePeriod(subscription);
  const hasBriefingContent =
    briefing?.status === "generated" || briefing?.status === "delivered";

  const cardClass =
    "rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* Subscribe banner for non-active users */}
      {showSubscribeBanner && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#c8922a]/30 bg-[#c8922a]/5 p-5 dark:bg-[#c8922a]/10">
          <div>
            <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              Subscribe to activate your daily briefing
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Your profile is saved in preview mode. Briefings start generating
              the day after you subscribe.
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 rounded-full bg-[#c8922a] px-5 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] hover:bg-[#b17f24]"
          >
            View plans
          </Link>
        </div>
      )}

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Days active" value={String(stats.daysSinceSignup)} />
        <StatCard label="Briefings" value={String(stats.briefingsReceived)} />
        <StatCard
          label="Stories scored"
          value={briefing?.stories_considered ? String(briefing.stories_considered) : "—"}
        />
        <StatCard
          label="Stories selected"
          value={briefing?.stories_selected ? String(briefing.stories_selected) : "—"}
        />
      </div>

      {/* Top themes */}
      {stats.topThemes.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Top themes this week
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stats.topThemes.map((theme) => (
              <span
                key={theme}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Today's briefing */}
      <div className={cardClass}>
        {hasBriefingContent && briefing?.briefing_content ? (
          <BriefingRenderer content={briefing.briefing_content} />
        ) : briefing && briefing.status !== "failed" ? (
          <BriefingPending />
        ) : (
          <BriefingEmpty />
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {hasBriefingContent && (
          <Link
            href={`/dashboard/briefing/${briefing?.briefing_date}`}
            className="text-sm text-zinc-400 transition-colors hover:text-[#0f0f0f] dark:text-zinc-500 dark:hover:text-[#f0efec]"
          >
            View full briefing
          </Link>
        )}
        <Link
          href="/dashboard/briefings"
          className="text-sm text-zinc-400 transition-colors hover:text-[#0f0f0f] dark:text-zinc-500 dark:hover:text-[#f0efec]"
        >
          Briefing archive
        </Link>
        <Link
          href="/dashboard/profile"
          className="text-sm text-zinc-400 transition-colors hover:text-[#0f0f0f] dark:text-zinc-500 dark:hover:text-[#f0efec]"
        >
          Edit profile
        </Link>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
        {value}
      </p>
    </div>
  );
}
