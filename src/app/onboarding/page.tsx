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

type Step = "intent" | "topics" | "regions" | "preview";
const STEPS: Step[] = ["intent", "topics", "regions", "preview"];

const INTENTS = [
  { id: "informed", label: "Stay informed daily", icon: "📰", description: "A calm daily briefing, no noise" },
  { id: "multiple-sides", label: "Understand multiple sides", icon: "🔄", description: "See how stories differ across regions" },
  { id: "filter-bubble", label: "Fight my filter bubble", icon: "🫧", description: "Break out of algorithmic echo chambers" },
  { id: "track-topics", label: "Track specific topics", icon: "🎯", description: "Follow what matters to you deeply" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intent");
  const [intent, setIntent] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<TopicId[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<RegionId[]>([]);
  const [showUpgrade, setShowUpgrade] = useState<"topics" | "regions" | null>(null);

  const currentStepIndex = STEPS.indexOf(step);

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
    setShowUpgrade(null);
    if (step === "intent") {
      setStep("topics");
    } else if (step === "topics") {
      setStep("regions");
    } else if (step === "regions") {
      setStep("preview");
    } else {
      savePreferences({
        topics: selectedTopics,
        regions: selectedRegions,
        onboardingComplete: true,
      });
      router.push("/briefing");
    }
  }

  function handleBack() {
    setShowUpgrade(null);
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex]);
    }
  }

  return (
    <main className="min-h-[80vh]">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                i === currentStepIndex
                  ? "w-6 bg-[#c8922a]"
                  : i < currentStepIndex
                  ? "bg-[#c8922a]/50"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Step: Intent */}
        {step === "intent" && (
          <div className="animate-step-fade-in mt-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
              Step 1 of 4
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
              What do you want from Albis?
            </h1>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              This helps us personalise your experience.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {INTENTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setIntent(item.id)}
                  className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all min-h-[44px] ${
                    intent === item.id
                      ? "border-[#c8922a] bg-[#c8922a]/10 ring-1 ring-[#c8922a]/30 dark:bg-[#c8922a]/10"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700/50 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${intent === item.id ? "text-[#c8922a]" : "text-zinc-800 dark:text-zinc-200"}`}>
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-12 flex items-center justify-between">
              <Link
                href="/"
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 min-h-[44px] inline-flex items-center"
              >
                Skip for now
              </Link>
              <button
                onClick={handleContinue}
                disabled={!intent}
                className="inline-flex h-11 min-w-[44px] items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Topics */}
        {step === "topics" && (
          <div className="animate-step-fade-in mt-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
              Step 2 of 4
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
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
                    className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all min-h-[44px] ${
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
              <button
                onClick={handleBack}
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 min-h-[44px] inline-flex items-center"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={selectedTopics.length === 0}
                className="inline-flex h-11 min-w-[44px] items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Regions */}
        {step === "regions" && (
          <div className="animate-step-fade-in mt-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
              Step 3 of 4
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
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
                    className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all min-h-[44px] ${
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
                onClick={handleBack}
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 min-h-[44px] inline-flex items-center"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={selectedRegions.length === 0}
                className="inline-flex h-11 min-w-[44px] items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Preview my briefing
              </button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="animate-step-fade-in mt-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
              Step 4 of 4
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
              Here&apos;s a taste of your briefing
            </h1>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              Based on your selections, here&apos;s what a daily briefing looks like.
            </p>

            {/* Mock briefing preview */}
            <div className="mt-8 rounded-2xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#c8922a]">
                Pattern of the Day
              </p>
              <p className="mt-3 font-[family-name:var(--font-playfair)] text-lg font-semibold italic leading-relaxed text-[#0f0f0f] dark:text-[#f0efec]">
                {getMockPattern(selectedTopics)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                {getMockPatternBody(selectedTopics)}
              </p>
            </div>

            {/* Mock stories */}
            <div className="mt-4 space-y-2">
              {getMockStories(selectedTopics, selectedRegions).map((story, i) => (
                <div key={i} className="rounded-xl border border-black/[0.05] bg-white/60 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
                  <div className="flex gap-2">
                    <span className="mt-1.5 block h-2 w-2 flex-shrink-0 rounded-full bg-[#c8922a]" />
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{story.headline}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                          {story.region}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {story.readTime} min read
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
              Your real briefing updates daily with live intelligence.
            </div>

            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 min-h-[44px] inline-flex items-center"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                className="inline-flex h-11 min-w-[44px] items-center rounded-full bg-[#1a3a5c] px-8 text-sm font-medium text-white transition-colors hover:bg-[#243f66] shadow-[0_2px_12px_rgb(26,58,92,0.3)]"
              >
                Start my briefing →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Mock data generators for preview
// ---------------------------------------------------------------------------

function getMockPattern(topics: TopicId[]): string {
  const patterns: Record<string, string> = {
    world: "Global diplomatic realignment accelerates across three continents",
    "tech-ai": "AI governance frameworks diverge sharply between East and West",
    people: "Migration patterns reshape political coalitions worldwide",
    "psych-persuasion": "Persuasion techniques in election coverage reach new sophistication",
    "natural-world": "Biodiversity indicators show divergent trends across hemispheres",
    "weather-climate": "Extreme weather events cluster in unexpected geographic patterns",
    "wild-card": "Unexpected connection emerges between tech regulation and food security",
    "economic-flows": "Capital flows shift as traditional safe havens show new volatility",
    grassroots: "Community-led movements gain political leverage across multiple regions",
    health: "Healthcare access disparities widen despite technological advances",
    "climate-energy": "Renewable energy adoption creates new geopolitical pressure points",
    culture: "Cultural exchange accelerates through unexpected digital channels",
  };
  const firstTopic = topics[0];
  return patterns[firstTopic] || "Cross-domain patterns emerge across your selected topics";
}

function getMockPatternBody(topics: TopicId[]): string {
  return "Multiple signals from your tracked topics converge around a common theme this week. Coverage varies dramatically by region — what's leading news in one part of the world barely registers elsewhere.";
}

function getMockStories(topics: TopicId[], regions: RegionId[]): Array<{ headline: string; region: string; readTime: number }> {
  const regionLabel = REGIONS.find(r => r.id === regions[0])?.label || "Global";
  const topicLabel = TOPICS.find(t => t.id === topics[0])?.label || "World";
  return [
    { headline: `${topicLabel}: Key development shifts regional dynamics`, region: regionLabel, readTime: 3 },
    { headline: `Coverage gap detected in ${regionLabel} reporting on emerging trend`, region: regionLabel, readTime: 2 },
    { headline: `Pattern link: How ${topicLabel.toLowerCase()} connects to economic policy changes`, region: "Global", readTime: 4 },
  ];
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
          className="inline-flex h-8 min-w-[44px] items-center rounded-full bg-amber-500/20 px-4 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/30"
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
