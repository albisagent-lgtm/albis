"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Admin gate — checks localStorage for admin tier
// ---------------------------------------------------------------------------

function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("albis-admin") === "true";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const USERS = {
  total: 1_247,
  free: 1_089,
  premium: 158,
  newThisWeek: 73,
  churnedThisMonth: 12,
};

const CONVERSION = {
  rate: 12.7,
  trialToPaid: 34.2,
  avgDaysToConvert: 4.8,
};

const API_COSTS = {
  today: 18.42,
  thisWeek: 127.63,
  thisMonth: 489.21,
  lastMonth: 412.87,
  budget: 600,
};

const COST_PER_FEATURE: { feature: string; calls: number; cost: number; avgPerUser: number; color: string }[] = [
  { feature: "Daily Briefings", calls: 3_841, cost: 214.30, avgPerUser: 0.17, color: "bg-blue-500" },
  { feature: "Deep Dives", calls: 612, cost: 156.80, avgPerUser: 0.99, color: "bg-violet-500" },
  { feature: "Ask Albis", calls: 1_203, cost: 89.44, avgPerUser: 0.57, color: "bg-amber-500" },
  { feature: "Framing Watch", calls: 987, cost: 28.67, avgPerUser: 0.18, color: "bg-emerald-500" },
];

const TOP_STORIES: { title: string; views: number; category: string }[] = [
  { title: "US-China semiconductor export controls tighten", views: 847, category: "Tech & AI" },
  { title: "ECB signals rate pause amid inflation data", views: 623, category: "Economic Flows" },
  { title: "Arctic permafrost methane readings spike", views: 581, category: "Climate & Energy" },
  { title: "India's UPI crosses 20B monthly transactions", views: 534, category: "Economic Flows" },
  { title: "WHO declares new mpox variant of concern", views: 491, category: "Health" },
];

const TOP_DEEP_DIVES: { title: string; requests: number }[] = [
  { title: "Global semiconductor supply chain vulnerabilities", requests: 89 },
  { title: "Central bank digital currencies — who's ahead?", requests: 67 },
  { title: "Rare earth mineral dependencies in green tech", requests: 54 },
  { title: "AI regulation approaches: EU vs US vs China", requests: 48 },
  { title: "Water stress and agriculture in South Asia", requests: 41 },
];

const DAILY_COSTS: { day: string; cost: number }[] = [
  { day: "Mon", cost: 22.10 },
  { day: "Tue", cost: 19.84 },
  { day: "Wed", cost: 24.31 },
  { day: "Thu", cost: 21.50 },
  { day: "Fri", cost: 18.42 },
  { day: "Sat", cost: 12.76 },
  { day: "Sun", cost: 8.70 },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800/50">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>
      )}
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={`h-2 rounded-full ${color} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CostChart() {
  const max = Math.max(...DAILY_COSTS.map((d) => d.cost));
  return (
    <div className="flex items-end gap-2 h-32">
      {DAILY_COSTS.map((d) => {
        const pct = (d.cost / max) * 100;
        return (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
              ${d.cost.toFixed(0)}
            </span>
            <div className="w-full flex items-end" style={{ height: "80px" }}>
              <div
                className="w-full rounded-t bg-amber-500/80 transition-all hover:bg-amber-500"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              {d.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/");
      return;
    }
    setAuthorized(true);
    setMounted(true);
  }, [router]);

  if (!mounted || !authorized) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-zinc-500">Loading&hellip;</div>
      </main>
    );
  }

  const maxFeatureCost = Math.max(...COST_PER_FEATURE.map((f) => f.cost));
  const budgetPct = (API_COSTS.thisMonth / API_COSTS.budget) * 100;
  const monthOverMonth = ((API_COSTS.thisMonth - API_COSTS.lastMonth) / API_COSTS.lastMonth) * 100;

  return (
    <main className="min-h-[80vh]">
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600">
              Admin
            </p>
            <h1 className="mt-3 text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
              Dashboard
            </h1>
          </div>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 sm:mt-0">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} &middot; Mock data
          </p>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Users */}
        {/* ----------------------------------------------------------------- */}
        <section className="mt-12">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Users
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total" value={USERS.total.toLocaleString()} sub={`+${USERS.newThisWeek} this week`} />
            <StatCard label="Free" value={USERS.free.toLocaleString()} sub={`${((USERS.free / USERS.total) * 100).toFixed(1)}% of total`} />
            <StatCard label="Premium" value={USERS.premium.toLocaleString()} sub={`${((USERS.premium / USERS.total) * 100).toFixed(1)}% of total`} />
            <StatCard label="Churned" value={USERS.churnedThisMonth.toString()} sub="This month" />
          </div>

          {/* User split bar */}
          <div className="mt-5">
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              <div
                className="bg-zinc-400 dark:bg-zinc-500 transition-all"
                style={{ width: `${(USERS.free / USERS.total) * 100}%` }}
              />
              <div
                className="bg-amber-500 transition-all"
                style={{ width: `${(USERS.premium / USERS.total) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                Free
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                Premium
              </span>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Conversion */}
        {/* ----------------------------------------------------------------- */}
        <section className="mt-14">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Conversion
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Free → Premium" value={`${CONVERSION.rate}%`} sub="Overall conversion" />
            <StatCard label="Trial → Paid" value={`${CONVERSION.trialToPaid}%`} sub="After first briefing" />
            <StatCard label="Avg. days" value={CONVERSION.avgDaysToConvert.toString()} sub="To first upgrade" />
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* API Costs */}
        {/* ----------------------------------------------------------------- */}
        <section className="mt-14">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            API Costs
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Today" value={`$${API_COSTS.today.toFixed(2)}`} />
            <StatCard label="This week" value={`$${API_COSTS.thisWeek.toFixed(2)}`} />
            <StatCard
              label="This month"
              value={`$${API_COSTS.thisMonth.toFixed(2)}`}
              sub={`${monthOverMonth > 0 ? "+" : ""}${monthOverMonth.toFixed(1)}% vs last month`}
            />
            <StatCard label="Budget" value={`$${API_COSTS.budget}`} sub={`${budgetPct.toFixed(0)}% used`} />
          </div>

          {/* Budget bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
              <span>Monthly budget usage</span>
              <span className="tabular-nums">${API_COSTS.thisMonth.toFixed(2)} / ${API_COSTS.budget}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-2.5 rounded-full transition-all ${budgetPct > 80 ? "bg-red-500" : budgetPct > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
          </div>

          {/* Daily cost chart */}
          <div className="mt-8 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800/50">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Daily costs — this week
            </p>
            <CostChart />
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Cost per Feature */}
        {/* ----------------------------------------------------------------- */}
        <section className="mt-14">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Cost per feature
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 dark:border-zinc-800/50 dark:text-zinc-500">
                  <th className="pb-3 pr-4">Feature</th>
                  <th className="pb-3 pr-4 text-right">API calls</th>
                  <th className="pb-3 pr-4 text-right">Cost</th>
                  <th className="pb-3 pr-4 text-right">$/user</th>
                  <th className="pb-3 w-36">Share</th>
                </tr>
              </thead>
              <tbody>
                {COST_PER_FEATURE.map((f) => (
                  <tr
                    key={f.feature}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/30"
                  >
                    <td className="py-3 pr-4 font-medium text-zinc-700 dark:text-zinc-300">
                      {f.feature}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      {f.calls.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      ${f.cost.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      ${f.avgPerUser.toFixed(2)}
                    </td>
                    <td className="py-3 w-36">
                      <Bar value={f.cost} max={maxFeatureCost} color={f.color} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200 dark:border-zinc-800/50">
                  <td className="pt-3 pr-4 font-medium text-zinc-700 dark:text-zinc-300">
                    Total
                  </td>
                  <td className="pt-3 pr-4 text-right tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                    {COST_PER_FEATURE.reduce((s, f) => s + f.calls, 0).toLocaleString()}
                  </td>
                  <td className="pt-3 pr-4 text-right tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                    ${COST_PER_FEATURE.reduce((s, f) => s + f.cost, 0).toFixed(2)}
                  </td>
                  <td className="pt-3 pr-4" />
                  <td className="pt-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Top Stories & Deep Dives */}
        {/* ----------------------------------------------------------------- */}
        <div className="mt-14 grid gap-10 md:grid-cols-2">
          {/* Top stories */}
          <section>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Most-viewed stories
            </p>
            <div className="mt-5 space-y-3">
              {TOP_STORIES.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800/50"
                >
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-zinc-700 dark:text-zinc-300">
                      {s.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                      {s.category} &middot; {s.views.toLocaleString()} views
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top deep dives */}
          <section>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Most-requested Deep Dives
            </p>
            <div className="mt-5 space-y-3">
              {TOP_DEEP_DIVES.map((d, i) => {
                const maxReq = TOP_DEEP_DIVES[0].requests;
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-snug text-zinc-700 dark:text-zinc-300">
                        {d.title}
                      </p>
                      <span className="flex-shrink-0 tabular-nums text-xs text-zinc-400 dark:text-zinc-500">
                        {d.requests} req
                      </span>
                    </div>
                    <div className="mt-2">
                      <Bar value={d.requests} max={maxReq} color="bg-violet-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer link */}
        <div className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800/50">
          <Link
            href="/briefing"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            &larr; Back to briefing
          </Link>
        </div>
      </div>
    </main>
  );
}
