import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export const metadata = {
  title: "Dashboard — Albis",
  description: "Your personalised intelligence dashboard.",
};

// Auth-gated. Middleware refreshes the session; rendering pulls the current
// user's briefing + stats server-side. This collapses the old client-side
// waterfall (7 serial round-trips from the browser) into three parallel waves
// against the Worker, which Smart Placement co-locates with Supabase.
export const dynamic = "force-dynamic";

interface Briefing {
  id: string;
  briefing_date: string;
  status: string;
  briefing_content: BriefingContent | null;
  stories_considered: number;
  stories_selected: number;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Wave 1: the two queries that only need user.id run in parallel.
  const [profileRes, companyRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_status, subscription_tier, subscription_period_end, is_test_account, trial_end_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("company_profiles")
      .select("id, created_at")
      .eq("owner_id", user.id)
      .single(),
  ]);

  const subscription: ProfileSubscription = {
    subscription_status: profileRes.data?.subscription_status ?? null,
    subscription_tier: profileRes.data?.subscription_tier ?? null,
    subscription_period_end: profileRes.data?.subscription_period_end ?? null,
    is_test_account: profileRes.data?.is_test_account ?? null,
    trial_end_at: profileRes.data?.trial_end_at ?? null,
  };

  const profile = companyRes.data;

  // Without a company profile there's nothing briefing-shaped to render —
  // fall through to the empty state. Used to be an early `return` inside the
  // client effect, which left the spinner up forever.
  let briefing: Briefing | null = null;
  let briefingsReceived = 0;
  let topThemes: string[] = [];

  if (profile) {
    // Wave 2: latest briefing + combined count + recent story tags, parallel.
    // Two old queries (count where status=generated + count where status=delivered)
    // collapse into one using .in("status", [...]).
    const [latestRes, countRes, scoresRes] = await Promise.all([
      supabase
        .from("company_briefings")
        .select(
          "id, briefing_date, status, briefing_content, stories_considered, stories_selected"
        )
        .eq("company_profile_id", profile.id)
        .order("briefing_date", { ascending: false })
        .limit(1),
      supabase
        .from("company_briefings")
        .select("id", { count: "exact", head: true })
        .eq("company_profile_id", profile.id)
        .in("status", ["generated", "delivered"]),
      supabase
        .from("company_story_scores")
        .select("story_tags")
        .eq("company_profile_id", profile.id)
        .eq("selected_for_briefing", true)
        .order("scan_date", { ascending: false })
        .limit(30),
    ]);

    briefing = (latestRes.data?.[0] as Briefing | undefined) ?? null;
    briefingsReceived = countRes.count ?? 0;

    const tagCounts: Record<string, number> = {};
    for (const row of scoresRes.data ?? []) {
      for (const tag of (row.story_tags as string[] | null) ?? []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    topThemes = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  const daysSinceSignup = profile
    ? Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const showSubscribeBanner =
    !isSubscriptionActive(subscription) && !isInGracePeriod(subscription);
  const hasBriefingContent =
    briefing?.status === "generated" || briefing?.status === "delivered";

  const cardClass =
    "rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
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

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Days active" value={String(daysSinceSignup)} />
        <StatCard label="Briefings" value={String(briefingsReceived)} />
        <StatCard
          label="Stories scored"
          value={
            briefing?.stories_considered
              ? String(briefing.stories_considered)
              : "—"
          }
        />
        <StatCard
          label="Stories selected"
          value={
            briefing?.stories_selected
              ? String(briefing.stories_selected)
              : "—"
          }
        />
      </div>

      {topThemes.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Top themes this week
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {topThemes.map((theme) => (
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

      <div className={cardClass}>
        {hasBriefingContent && briefing?.briefing_content ? (
          <BriefingRenderer content={briefing.briefing_content} />
        ) : briefing && briefing.status !== "failed" ? (
          <BriefingPending />
        ) : (
          <BriefingEmpty />
        )}
      </div>

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
