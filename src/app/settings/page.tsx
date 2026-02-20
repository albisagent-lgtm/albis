"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReferralCard } from "@/app/components/referral-card";
import {
  TOPICS,
  REGIONS,
  FREE_TIER,
  getPreferences,
  savePreferences,
  getLocalUser,
  clearLocalUser,
  type TopicId,
  type RegionId,
  type UserPreferences,
} from "@/lib/preferences";

// ---------------------------------------------------------------------------
// Color maps (same as onboarding)
// ---------------------------------------------------------------------------

const COLOR_CLASSES: Record<string, { idle: string; active: string }> = {
  blue: {
    idle: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40",
    active: "border-blue-500 bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
  },
  violet: {
    idle: "border-violet-500/20 text-violet-400/60 hover:border-violet-500/40",
    active: "border-violet-500 bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
  },
  sky: {
    idle: "border-sky-500/20 text-sky-400/60 hover:border-sky-500/40",
    active: "border-sky-500 bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  },
  fuchsia: {
    idle: "border-fuchsia-500/20 text-fuchsia-400/60 hover:border-fuchsia-500/40",
    active: "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/30",
  },
  emerald: {
    idle: "border-emerald-500/20 text-emerald-400/60 hover:border-emerald-500/40",
    active: "border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  },
  cyan: {
    idle: "border-cyan-500/20 text-cyan-400/60 hover:border-cyan-500/40",
    active: "border-cyan-500 bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30",
  },
  zinc: {
    idle: "border-zinc-500/20 text-zinc-400/60 hover:border-zinc-500/40",
    active: "border-zinc-400 bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-400/30",
  },
  amber: {
    idle: "border-amber-500/20 text-amber-400/60 hover:border-amber-500/40",
    active: "border-amber-500 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  },
  lime: {
    idle: "border-lime-500/20 text-lime-400/60 hover:border-lime-500/40",
    active: "border-lime-500 bg-lime-500/15 text-lime-300 ring-1 ring-lime-500/30",
  },
  rose: {
    idle: "border-rose-500/20 text-rose-400/60 hover:border-rose-500/40",
    active: "border-rose-500 bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
  },
  teal: {
    idle: "border-teal-500/20 text-teal-400/60 hover:border-teal-500/40",
    active: "border-teal-500 bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/30",
  },
  orange: {
    idle: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40",
    active: "border-orange-500 bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30",
  },
};

const REGION_IDLE = "border-zinc-700/50 text-zinc-400 hover:border-zinc-600";
const REGION_ACTIVE = "border-zinc-400 bg-zinc-800 text-zinc-200 ring-1 ring-zinc-500/30";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<TopicId[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<RegionId[]>([]);
  const [showUpgrade, setShowUpgrade] = useState<"topics" | "regions" | null>(null);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const p = getPreferences();
    const user = getLocalUser();
    setPrefs(p);
    setSelectedTopics(p.topics);
    setSelectedRegions(p.regions);
    if (user) setEmail(user.email);
    setMounted(true);
  }, []);

  function toggleTopic(id: TopicId) {
    setShowUpgrade(null);
    setSaved(false);
    if (selectedTopics.includes(id)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== id));
    } else {
      if (selectedTopics.length >= FREE_TIER.maxTopics) {
        setShowUpgrade("topics");
        return;
      }
      setSelectedTopics([...selectedTopics, id]);
    }
  }

  function toggleRegion(id: RegionId) {
    setShowUpgrade(null);
    setSaved(false);
    if (selectedRegions.includes(id)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== id));
    } else {
      if (selectedRegions.length >= FREE_TIER.maxRegions) {
        setShowUpgrade("regions");
        return;
      }
      setSelectedRegions([...selectedRegions, id]);
    }
  }

  function handleSave() {
    savePreferences({
      topics: selectedTopics,
      regions: selectedRegions,
      onboardingComplete: true,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogout() {
    clearLocalUser();
    router.push("/");
    router.refresh();
  }

  if (!mounted) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-zinc-500">Loading&hellip;</div>
      </main>
    );
  }

  const hasChanges =
    JSON.stringify(selectedTopics) !== JSON.stringify(prefs?.topics) ||
    JSON.stringify(selectedRegions) !== JSON.stringify(prefs?.regions);

  return (
    <main className="min-h-[80vh]">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          Settings
        </p>
        <h1 className="mt-4 text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
          Your preferences
        </h1>

        {/* Account */}
        {email && (
          <div className="mt-10 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800/50">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Account
            </p>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{email}</p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
              Free tier &middot; 2 topics, 1 region
            </p>
          </div>
        )}

        {/* Topics */}
        <div className="mt-10">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Topics
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              {selectedTopics.length}/{FREE_TIER.maxTopics} selected
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {TOPICS.map((topic) => {
              const isActive = selectedTopics.includes(topic.id);
              const colors = COLOR_CLASSES[topic.color] || COLOR_CLASSES.zinc;
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                    isActive ? colors.active : colors.idle
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>

          {showUpgrade === "topics" && (
            <UpgradePrompt
              message={`Free plan allows ${FREE_TIER.maxTopics} topics.`}
              onDismiss={() => setShowUpgrade(null)}
            />
          )}
        </div>

        {/* Regions */}
        <div className="mt-10">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Regions
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              {selectedRegions.length}/{FREE_TIER.maxRegions} selected
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {REGIONS.map((region) => {
              const isActive = selectedRegions.includes(region.id);
              return (
                <button
                  key={region.id}
                  onClick={() => toggleRegion(region.id)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                    isActive ? REGION_ACTIVE : REGION_IDLE
                  }`}
                >
                  {region.label}
                </button>
              );
            })}
          </div>

          {showUpgrade === "regions" && (
            <UpgradePrompt
              message={`Free plan allows ${FREE_TIER.maxRegions} region.`}
              onDismiss={() => setShowUpgrade(null)}
            />
          )}
        </div>

        {/* Save */}
        <div className="mt-12 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={!hasChanges && !saved}
            className={`inline-flex h-11 items-center rounded-full px-8 text-sm font-medium transition-all ${
              saved
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                : "bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            }`}
          >
            {saved ? "Saved" : "Save changes"}
          </button>
          <Link
            href="/briefing"
            className="inline-flex min-h-[44px] items-center text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Back to briefing
          </Link>
        </div>

        {/* Referral Program */}
        {email && (
          <div className="mt-10">
            <ReferralCard email={email} />
          </div>
        )}

        {/* Danger zone */}
        <div className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800/50">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Account
          </p>
          <button
            onClick={handleLogout}
            className="mt-4 inline-flex min-h-[44px] items-center text-sm text-zinc-400 transition-colors hover:text-red-400"
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Upgrade Prompt
// ---------------------------------------------------------------------------

function UpgradePrompt({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="mt-6 flex items-center gap-4 rounded-lg border border-amber-500/20 bg-amber-950/20 px-5 py-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-300">{message}</p>
        <p className="mt-1 text-xs text-amber-400/60">
          Upgrade to Premium for unlimited topics and regions.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/pricing"
          className="inline-flex h-11 min-w-[44px] items-center rounded-full bg-amber-500/20 px-4 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/30"
        >
          Upgrade
        </Link>
        <button
          onClick={onDismiss}
          className="flex h-11 w-11 items-center justify-center rounded-full text-amber-400/40 transition-colors hover:text-amber-400/80"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
