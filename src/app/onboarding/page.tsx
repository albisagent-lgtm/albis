"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TOPICS,
  REGIONS,
  FREE_TIER,
  type TopicId,
  type RegionId,
  savePreferences,
} from "@/lib/preferences";

// ---------------------------------------------------------------------------
// Color maps for topic chips
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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"topics" | "regions">("topics");
  const [selectedTopics, setSelectedTopics] = useState<TopicId[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<RegionId[]>([]);
  const [showUpgrade, setShowUpgrade] = useState<"topics" | "regions" | null>(null);

  function toggleTopic(id: TopicId) {
    setShowUpgrade(null);
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

  function handleContinue() {
    if (step === "topics") {
      setStep("regions");
      setShowUpgrade(null);
    } else {
      savePreferences({
        topics: selectedTopics,
        regions: selectedRegions,
        onboardingComplete: true,
      });
      router.push("/briefing");
    }
  }

  return (
    <main className="min-h-[80vh]">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className={`h-1 flex-1 rounded-full ${step === "topics" ? "bg-zinc-400 dark:bg-zinc-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
          <div className={`h-1 flex-1 rounded-full ${step === "regions" ? "bg-zinc-400 dark:bg-zinc-500" : "bg-zinc-200 dark:bg-zinc-800"}`} />
        </div>

        {/* Step: Topics */}
        {step === "topics" && (
          <div className="mt-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
              Step 1 of 2
            </p>
            <h1 className="mt-4 text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
              What do you want to track?
            </h1>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              Choose up to {FREE_TIER.maxTopics} topics on the free plan.
              We&apos;ll surface the patterns that matter to you.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
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

            {/* Upgrade prompt */}
            {showUpgrade === "topics" && (
              <UpgradePrompt
                message={`Free plan allows ${FREE_TIER.maxTopics} topics.`}
                onDismiss={() => setShowUpgrade(null)}
              />
            )}

            <div className="mt-12 flex items-center justify-between">
              <Link
                href="/"
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Skip for now
              </Link>
              <button
                onClick={handleContinue}
                disabled={selectedTopics.length === 0}
                className="inline-flex h-11 items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Regions */}
        {step === "regions" && (
          <div className="mt-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
              Step 2 of 2
            </p>
            <h1 className="mt-4 text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
              Where in the world?
            </h1>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              Choose {FREE_TIER.maxRegions} region on the free plan.
              Focus your intelligence feed.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
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

            {/* Upgrade prompt */}
            {showUpgrade === "regions" && (
              <UpgradePrompt
                message={`Free plan allows ${FREE_TIER.maxRegions} region.`}
                onDismiss={() => setShowUpgrade(null)}
              />
            )}

            <div className="mt-12 flex items-center justify-between">
              <button
                onClick={() => { setStep("topics"); setShowUpgrade(null); }}
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={selectedRegions.length === 0}
                className="inline-flex h-11 items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Start my briefing
              </button>
            </div>
          </div>
        )}
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
          className="inline-flex h-8 items-center rounded-full bg-amber-500/20 px-4 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/30"
        >
          Upgrade
        </Link>
        <button
          onClick={onDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-full text-amber-400/40 transition-colors hover:text-amber-400/80"
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
