"use client";

// ---------------------------------------------------------------------------
// Company onboarding wizard — bundle-first redesign (2026-04-16)
//
// Flow:
//   Step 1  Basics — sector grid (24 sectors + Other), company name, sub-sector
//            → picking a sector auto-applies its recommended bundle to
//              themes/watchlist/supply-chain/risks.
//            → "Other" reveals a "What's your #1 concern?" text field; tokens
//              become custom themes.
//            → After sector is picked, two actions are offered:
//                • "Continue" → standard 6-step wizard
//                • "Use recommended defaults" → fast path, jumps to Step 5
//   Step 2  Geography — regions + countries
//   Step 3  Tracking — themes, watchlist, supply chain (via TaxonomyCombobox)
//   Step 4  Risks — pre-selected from sector defaults, user can adjust
//   Step 5  Delivery — depth, time, timezone (auto-detected), email recipients
//            → BriefingPreview shown here for confidence
//   Step 6  Confirm — preview + review + Complete setup
//
// Sector change after bundle applied triggers a confirm prompt (see
// DECISIONS-LOG 2026-04-16). Options: Replace / Keep / Cancel.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, getCountriesByRegion } from "@/lib/countries";
import {
  RISK_PRIORITIES,
  BRIEFING_DEPTHS,
  DELIVERY_TIMES,
  MAX_RISK_PRIORITIES,
} from "@/lib/company-profile";
import {
  SECTORS,
  COMPANY_REGIONS,
  THEME_CATALOG,
  WATCHLIST_CATALOG,
  SUPPLY_CHAIN_CATALOG,
  getBundleFor,
  getSectorDefinition,
  type SectorId,
} from "@/lib/onboarding-taxonomy";
import {
  getOnboardingTier,
  isSubscriptionActive,
  isInGracePeriod,
  type ProfileSubscription,
} from "@/lib/tier-enforcement";
import { TaxonomyCombobox } from "@/app/components/taxonomy-combobox";
import { BriefingPreview } from "@/app/components/briefing-preview";

// ---------------------------------------------------------------------------
// Sector button colors (reused)
// ---------------------------------------------------------------------------

const COLOR_CLASSES: Record<string, { idle: string; active: string }> = {
  blue: {
    idle: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40",
    active:
      "border-blue-500 bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
  },
  violet: {
    idle: "border-violet-500/20 text-violet-400/60 hover:border-violet-500/40",
    active:
      "border-violet-500 bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
  },
  sky: {
    idle: "border-sky-500/20 text-sky-400/60 hover:border-sky-500/40",
    active: "border-sky-500 bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  },
  fuchsia: {
    idle: "border-fuchsia-500/20 text-fuchsia-400/60 hover:border-fuchsia-500/40",
    active:
      "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/30",
  },
  emerald: {
    idle: "border-emerald-500/20 text-emerald-400/60 hover:border-emerald-500/40",
    active:
      "border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  },
  cyan: {
    idle: "border-cyan-500/20 text-cyan-400/60 hover:border-cyan-500/40",
    active:
      "border-cyan-500 bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30",
  },
  zinc: {
    idle: "border-zinc-500/20 text-zinc-400/60 hover:border-zinc-500/40",
    active:
      "border-zinc-400 bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-400/30",
  },
  amber: {
    idle: "border-amber-500/20 text-amber-400/60 hover:border-amber-500/40",
    active:
      "border-amber-500 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  },
  lime: {
    idle: "border-lime-500/20 text-lime-400/60 hover:border-lime-500/40",
    active:
      "border-lime-500 bg-lime-500/15 text-lime-300 ring-1 ring-lime-500/30",
  },
  rose: {
    idle: "border-rose-500/20 text-rose-400/60 hover:border-rose-500/40",
    active:
      "border-rose-500 bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
  },
  teal: {
    idle: "border-teal-500/20 text-teal-400/60 hover:border-teal-500/40",
    active:
      "border-teal-500 bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/30",
  },
  orange: {
    idle: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40",
    active:
      "border-orange-500 bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30",
  },
};

const REGION_IDLE = "border-zinc-700/50 text-zinc-400 hover:border-zinc-600";
const REGION_ACTIVE =
  "border-zinc-400 bg-zinc-800 text-zinc-200 ring-1 ring-zinc-500/30";

// Shared classes
const inputClass =
  "h-11 w-full rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15";
const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";
const sectionLabel =
  "text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500";
const errorMsg =
  "rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400";

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const STEPS = [
  { label: "Company", short: "Basics" },
  { label: "Geography", short: "Geography" },
  { label: "Tracking", short: "Tracking" },
  { label: "Risks", short: "Risks" },
  { label: "Delivery", short: "Delivery" },
  { label: "Confirm", short: "Confirm" },
];

const EARLY_ACCESS_PRESETS: Array<{
  id: string;
  label: string;
  sectorId: SectorId;
  tagline: string;
  description: string;
  subSector: string;
  chips: string[];
}> = [
  {
    id: "logistics-supply-chain",
    label: "Logistics / Supply Chain",
    sectorId: "logistics-shipping",
    tagline: "Routes, tariffs, ports, fuel, suppliers",
    description:
      "Best for freight, import/export, procurement, and operations teams exposed to global disruption.",
    subSector: "Import-export / freight / supply chain risk",
    chips: ["Route disruption", "Ports", "Tariffs", "Fuel costs"],
  },
  {
    id: "reputation-pr",
    label: "PR / Reputation",
    sectorId: "pr-reputation-public-affairs",
    tagline: "Narratives, deepfakes, scrutiny, public affairs",
    description:
      "Best for PR, crisis comms, public affairs, and reputation teams watching perception shifts.",
    subSector: "Crisis communications / reputation monitoring",
    chips: ["Narrative shifts", "Deepfakes", "Scrutiny", "Public affairs"],
  },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CompanyOnboardingClient() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Basics
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState<SectorId | "">("");
  const [subSector, setSubSector] = useState("");
  const [concernText, setConcernText] = useState(""); // Other-only
  const [sectorTouched, setSectorTouched] = useState(false); // whether bundle has been auto-applied
  const [pendingSector, setPendingSector] = useState<SectorId | "" | null>(
    null,
  ); // for confirm prompt

  // Step 2 — Geography
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");

  // Step 3 — Tracking
  const [trackedThemes, setTrackedThemes] = useState<string[]>([]);
  const [watchlistEntities, setWatchlistEntities] = useState<string[]>([]);
  const [supplyChainExposure, setSupplyChainExposure] = useState<string[]>([]);

  // Step 4 — Risks
  const [riskPriorities, setRiskPriorities] = useState<string[]>([]);

  // Step 5 — Delivery
  const [briefingDepth, setBriefingDepth] = useState("standard");
  const [deliveryTime, setDeliveryTime] = useState("07:00");
  const [timezone, setTimezone] = useState("UTC");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  // Subscription — drives tier limits + preview banner
  const [subscription, setSubscription] = useState<ProfileSubscription>({
    subscription_status: null,
    subscription_tier: null,
    subscription_period_end: null,
  });
  const onboardingTier = getOnboardingTier(subscription);
  const maxThemes = onboardingTier.maxTrackedThemes;
  const maxEntities = onboardingTier.maxWatchlistEntities;
  const maxRecipients = onboardingTier.maxEmailRecipients;
  const isPreview =
    !isSubscriptionActive(subscription) && !isInGracePeriod(subscription);

  // Auth + init
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirect=/onboarding/company");
        return;
      }
      setUserId(user.id);

      const { data: userProfile } = await supabase
        .from("profiles")
        .select(
          "subscription_status, subscription_tier, subscription_period_end, is_test_account, trial_end_at",
        )
        .eq("id", user.id)
        .single();
      if (userProfile) {
        setSubscription({
          subscription_status: userProfile.subscription_status,
          subscription_tier: userProfile.subscription_tier,
          subscription_period_end: userProfile.subscription_period_end,
          is_test_account: userProfile.is_test_account,
          trial_end_at: userProfile.trial_end_at,
        });
      }

      const { data: profile } = await supabase
        .from("company_profiles")
        .select("id, onboarding_completed")
        .eq("owner_id", user.id)
        .single();
      if (profile?.onboarding_completed) {
        router.push("/dashboard/profile");
        return;
      }

      if (user.email) setEmailRecipients([user.email]);
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) setTimezone(tz);
      } catch {}
      setCheckingAuth(false);
    });
  }, [router]);

  // ---------------------------------------------------------------------------
  // Bundle application
  // ---------------------------------------------------------------------------

  function applyBundle(sectorId: SectorId) {
    const bundle = getBundleFor(sectorId);
    const def = getSectorDefinition(sectorId);
    setTrackedThemes(bundle.themes.bundle.slice(0, maxThemes));
    setWatchlistEntities(bundle.watchlist.bundle.slice(0, maxEntities));
    setSupplyChainExposure(bundle.supplyChain.bundle);
    if (def) setRiskPriorities(def.defaultRisks.slice(0, MAX_RISK_PRIORITIES));
    setSectorTouched(true);
  }

  function applyEarlyAccessPreset(preset: (typeof EARLY_ACCESS_PRESETS)[number]) {
    setSector(preset.sectorId);
    if (!subSector.trim()) setSubSector(preset.subSector);
    applyBundle(preset.sectorId);
    setError("");
  }

  function handleSectorClick(sectorId: SectorId) {
    if (sectorId === sector) return;

    // First pick — just apply
    if (!sector || !sectorTouched) {
      setSector(sectorId);
      applyBundle(sectorId);
      return;
    }

    // Subsequent pick with existing selections — confirm
    setPendingSector(sectorId);
  }

  function confirmSectorReplace() {
    if (!pendingSector) return;
    setSector(pendingSector);
    applyBundle(pendingSector);
    setPendingSector(null);
  }

  function confirmSectorKeep() {
    if (!pendingSector) return;
    setSector(pendingSector);
    // Don't re-apply bundle — user's manual selections are preserved
    setPendingSector(null);
  }

  function cancelSectorChange() {
    setPendingSector(null);
  }

  // Other/Custom — split concern text into themes
  function applyOtherConcernToThemes() {
    if (!concernText.trim()) return;
    const tokens = concernText
      .split(/[,;]+/)
      .map((s) => s.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean);
    const merged = [...trackedThemes];
    for (const t of tokens) {
      if (!merged.includes(t) && merged.length < maxThemes) merged.push(t);
    }
    setTrackedThemes(merged);
  }

  // ---------------------------------------------------------------------------
  // Fast path
  // ---------------------------------------------------------------------------

  function startFastPath() {
    if (sector === "other") applyOtherConcernToThemes();
    setStep(4); // Step 5 (Delivery) — index 4
  }

  // ---------------------------------------------------------------------------
  // Helpers for geography step
  // ---------------------------------------------------------------------------

  const countriesByRegion = getCountriesByRegion();
  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()),
      )
    : null;

  function toggleCountry(slug: string) {
    setSelectedCountries((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug],
    );
  }
  function toggleRegion(id: string) {
    setSelectedRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  }
  function toggleRisk(id: string) {
    setRiskPriorities((prev) => {
      if (prev.includes(id)) return prev.filter((r) => r !== id);
      if (prev.length >= MAX_RISK_PRIORITIES) return prev;
      return [...prev, id];
    });
  }

  // Email tag helpers
  function addEmailTag(v: string) {
    const trimmed = v.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    if (
      emailRecipients.includes(trimmed) ||
      emailRecipients.length >= maxRecipients
    )
      return;
    setEmailRecipients([...emailRecipients, trimmed]);
    setEmailInput("");
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validateStep = useCallback((): string | null => {
    switch (step) {
      case 0:
        if (!companyName.trim()) return "Please enter your company name.";
        if (!sector) return "Please select a sector.";
        return null;
      case 1:
        if (selectedCountries.length === 0 && selectedRegions.length === 0)
          return "Please select at least one country or region.";
        return null;
      case 2:
        if (trackedThemes.length === 0)
          return "Please add at least one tracked theme.";
        return null;
      case 3:
        if (riskPriorities.length === 0)
          return "Please select at least one risk priority.";
        return null;
      default:
        return null;
    }
  }, [
    step,
    companyName,
    sector,
    selectedCountries,
    selectedRegions,
    trackedThemes,
    riskPriorities,
  ]);

  function handleNext() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function handleBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      const data = {
        owner_id: userId,
        company_name: companyName.trim(),
        sector: sector || null,
        sub_sector: subSector.trim() || null,
        countries: selectedCountries,
        regions: selectedRegions,
        supply_chain_exposure: supplyChainExposure,
        tracked_themes: trackedThemes,
        watchlist_entities: watchlistEntities,
        risk_priorities: riskPriorities,
        preferred_briefing_depth: briefingDepth,
        preferred_delivery_time: deliveryTime,
        timezone,
        email_enabled: emailEnabled,
        email_recipients: emailRecipients,
        dashboard_enabled: true,
        onboarding_completed: true,
      };
      const { error: upsertError } = await supabase
        .from("company_profiles")
        .upsert(data, { onConflict: "owner_id" });
      if (upsertError) {
        setError(upsertError.message);
        setSaving(false);
        return;
      }

      // Trial assignment + preview-briefing generation. Non-blocking — if
      // the server step fails the user still lands on the dashboard and the
      // trial can be back-filled later by support. We DO await this so the
      // briefing exists by the time the dashboard fetches it.
      try {
        await fetch("/api/onboarding/complete", { method: "POST" });
      } catch (err) {
        console.warn("onboarding/complete POST failed (non-fatal)", err);
      }

      // Land on the briefing dashboard so the user sees the preview
      // immediately. The profile editor lives one click away at
      // /dashboard/profile.
      router.push("/dashboard");
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (checkingAuth) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-transparent to-transparent dark:from-amber-950/10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/25 to-transparent" />

      <div className="relative mx-auto max-w-2xl px-6 py-12 md:py-20">
        {/* Header */}
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-playfair)] text-2xl italic font-semibold text-[#0f0f0f] dark:text-[#f0efec]"
          >
            Albis
          </Link>
          <h1 className="mt-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            Set up your company profile
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Pick your sector and we&apos;ll pre-fill sensible defaults. Edit
            anything, or use the fast path.
          </p>
        </div>

        {/* Preview banner for unsubscribed users */}
        {isPreview && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c8922a]/30 bg-[#c8922a]/5 px-5 py-3 dark:bg-[#c8922a]/10">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Preview mode.
              </span>{" "}
              Your profile will be saved, but daily scans don&apos;t run until
              you subscribe.
            </p>
            <Link
              href="/pricing"
              className="shrink-0 rounded-full bg-[#c8922a] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] hover:bg-[#b17f24]"
            >
              View plans
            </Link>
          </div>
        )}

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex flex-1 items-center">
                <button
                  onClick={() => {
                    if (i < step) {
                      setError("");
                      setStep(i);
                    }
                  }}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    i < step
                      ? "bg-[#c8922a] text-white cursor-pointer"
                      : i === step
                        ? "bg-[#c8922a]/15 text-[#c8922a] ring-2 ring-[#c8922a]/30"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                  }`}
                >
                  {i < step ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-px flex-1 transition-colors ${i < step ? "bg-[#c8922a]" : "bg-zinc-200 dark:bg-zinc-800"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between">
            {STEPS.map((s, i) => (
              <span
                key={s.label}
                className={`text-[10px] font-medium uppercase tracking-wider ${i === step ? "text-[#c8922a]" : "text-zinc-400 dark:text-zinc-600"}`}
              >
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.short}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="animate-step-fade-in rounded-2xl border border-black/[0.07] bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.06)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:shadow-none md:p-8">
          {/* STEP 1 — Basics */}
          {step === 0 && (
            <div className="space-y-6">
              <p className={sectionLabel}>Company basics</p>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Company name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Meridian Logistics"
                  className={inputClass}
                />
              </div>

              <div className="rounded-2xl border border-[#c8922a]/20 bg-[#c8922a]/5 p-4 dark:bg-[#c8922a]/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                      Start with a ready-made scan type
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Two early-access presets built for the first outreach
                      markets. Pick one, then edit anything.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#c8922a]/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#c8922a]">
                    Beta focus
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {EARLY_ACCESS_PRESETS.map((preset) => {
                    const isActive = sector === preset.sectorId;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => applyEarlyAccessPreset(preset)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          isActive
                            ? "border-[#c8922a]/60 bg-[#c8922a]/10 ring-1 ring-[#c8922a]/25"
                            : "border-black/[0.07] bg-white/70 hover:border-[#c8922a]/35 dark:border-white/[0.08] dark:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                              {preset.label}
                            </p>
                            <p className="mt-1 text-xs font-medium text-[#c8922a]">
                              {preset.tagline}
                            </p>
                          </div>
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              isActive
                                ? "border-[#c8922a] bg-[#c8922a]"
                                : "border-zinc-300 dark:border-zinc-600"
                            }`}
                          >
                            {isActive && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                          {preset.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {preset.chips.map((chip) => (
                            <span
                              key={chip}
                              className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Sector</label>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Or choose from the full sector list. Picking a sector
                  pre-fills themes, watchlist, and risks with sensible defaults.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SECTORS.map((s) => {
                    const isActive = sector === s.id;
                    const colors = COLOR_CLASSES[s.color] || COLOR_CLASSES.zinc;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSectorClick(s.id as SectorId)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${isActive ? colors.active : colors.idle}`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Other/Custom concern prompt */}
              {sector === "other" && (
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>
                    What&apos;s your #1 concern right now?
                  </label>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Tell us in plain English — we&apos;ll turn this into tracked
                    themes you can adjust on the next step.
                  </p>
                  <input
                    type="text"
                    value={concernText}
                    onChange={(e) => setConcernText(e.target.value)}
                    placeholder={
                      getSectorDefinition("other")?.concernPlaceholder ||
                      "e.g. supply chain disruption, Iran conflict exposure"
                    }
                    className={inputClass}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Sub-sector (optional)</label>
                <input
                  type="text"
                  value={subSector}
                  onChange={(e) => setSubSector(e.target.value)}
                  placeholder="e.g. Cold chain logistics, Dry bulk shipping"
                  className={inputClass}
                />
              </div>

              {/* Fast path CTA */}
              {sector && (
                <div className="rounded-xl border border-[#c8922a]/25 bg-[#c8922a]/5 p-4 dark:bg-[#c8922a]/10">
                  <p className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                    Use recommended defaults?
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Skip to delivery setup with the recommended bundle for{" "}
                    {getSectorDefinition(sector)?.label}. You can always
                    customise later.
                  </p>
                  <button
                    onClick={() => {
                      if (sector === "other") applyOtherConcernToThemes();
                      startFastPath();
                    }}
                    className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#c8922a] px-4 text-xs font-semibold text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] hover:bg-[#b17f24]"
                  >
                    Use recommended defaults
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Geography */}
          {step === 1 && (
            <div className="space-y-6">
              <p className={sectionLabel}>Geography</p>
              <div>
                <label className={labelClass}>Regions of interest</label>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {COMPANY_REGIONS.map((region) => {
                    const isActive = selectedRegions.includes(region.id);
                    return (
                      <button
                        key={region.id}
                        onClick={() => toggleRegion(region.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${isActive ? REGION_ACTIVE : REGION_IDLE}`}
                      >
                        {region.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label className={labelClass}>Countries of operation</label>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                    {selectedCountries.length} selected
                  </span>
                </div>
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search countries..."
                  className={`mt-3 ${inputClass}`}
                />
                {selectedCountries.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCountries.map((slug) => {
                      const c = COUNTRIES.find((x) => x.slug === slug);
                      if (!c) return null;
                      return (
                        <button
                          key={slug}
                          onClick={() => toggleCountry(slug)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#c8922a]/30 bg-[#c8922a]/10 px-3 py-1 text-xs font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/20"
                        >
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-black/[0.07] dark:border-white/[0.07]">
                  {filteredCountries ? (
                    filteredCountries.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-zinc-400">
                        No countries found.
                      </p>
                    ) : (
                      filteredCountries.map((c) => (
                        <CountryRow
                          key={c.slug}
                          country={c}
                          isSelected={selectedCountries.includes(c.slug)}
                          onToggle={() => toggleCountry(c.slug)}
                        />
                      ))
                    )
                  ) : (
                    Object.entries(countriesByRegion).map(
                      ([region, countries]) => (
                        <div key={region}>
                          <div className="sticky top-0 bg-[#f8f7f4] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:bg-[#0f0f0f] dark:text-zinc-600">
                            {region}
                          </div>
                          {countries.map((c) => (
                            <CountryRow
                              key={c.slug}
                              country={c}
                              isSelected={selectedCountries.includes(c.slug)}
                              onToggle={() => toggleCountry(c.slug)}
                            />
                          ))}
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Tracking */}
          {step === 2 && (
            <div className="space-y-6">
              <p className={sectionLabel}>What to track</p>

              <TaxonomyCombobox
                label="Tracked themes"
                helpText="Topics your daily scan should prioritise."
                value={trackedThemes}
                onChange={setTrackedThemes}
                catalog={THEME_CATALOG}
                bundleValues={getBundleFor(sector).themes.bundle}
                additionalValues={getBundleFor(sector).themes.additional}
                max={maxThemes}
                customPlaceholder="Add custom theme (e.g. hormuz-operations)"
              />

              <TaxonomyCombobox
                label="Watchlist entities"
                helpText="Competitors, organisations, people, countries to monitor."
                value={watchlistEntities}
                onChange={setWatchlistEntities}
                catalog={WATCHLIST_CATALOG}
                bundleValues={getBundleFor(sector).watchlist.bundle}
                additionalValues={getBundleFor(sector).watchlist.additional}
                max={maxEntities}
                customPlaceholder="Add custom entity"
              />

              <TaxonomyCombobox
                label="Supply chain exposure"
                helpText="Commodities, routes, dependencies relevant to your operations."
                value={supplyChainExposure}
                onChange={setSupplyChainExposure}
                catalog={SUPPLY_CHAIN_CATALOG}
                bundleValues={getBundleFor(sector).supplyChain.bundle}
                additionalValues={getBundleFor(sector).supplyChain.additional}
                max={maxThemes}
                customPlaceholder="Add custom exposure"
              />
            </div>
          )}

          {/* STEP 4 — Risks */}
          {step === 3 && (
            <div className="space-y-6">
              <p className={sectionLabel}>Risk priorities</p>
              <div className="flex items-baseline justify-between">
                <label className={labelClass}>
                  Select up to {MAX_RISK_PRIORITIES}
                </label>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {riskPriorities.length}/{MAX_RISK_PRIORITIES} selected
                </span>
              </div>
              <p className="-mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                Pre-selected based on your sector. Adjust to match your actual
                exposure.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {RISK_PRIORITIES.map((risk) => {
                  const isActive = riskPriorities.includes(risk.id);
                  const colors =
                    COLOR_CLASSES[risk.color] || COLOR_CLASSES.zinc;
                  const atLimit =
                    riskPriorities.length >= MAX_RISK_PRIORITIES && !isActive;
                  return (
                    <button
                      key={risk.id}
                      onClick={() => toggleRisk(risk.id)}
                      disabled={atLimit}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${isActive ? colors.active : atLimit ? "border-zinc-800/30 text-zinc-600/40 cursor-not-allowed" : colors.idle}`}
                    >
                      {risk.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5 — Delivery */}
          {step === 4 && (
            <div className="space-y-6">
              <p className={sectionLabel}>Delivery preferences</p>

              {/* Preview */}
              <BriefingPreview
                companyName={companyName}
                themes={trackedThemes}
                watchlist={watchlistEntities}
                deliveryTime={deliveryTime}
                timezone={timezone}
              />

              <div>
                <label className={labelClass}>Scan detail</label>
                <div className="mt-3 space-y-2">
                  {BRIEFING_DEPTHS.map((depth) => (
                    <button
                      key={depth.id}
                      onClick={() => setBriefingDepth(depth.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${briefingDepth === depth.id ? "border-[#c8922a]/50 bg-[#c8922a]/5 ring-1 ring-[#c8922a]/20" : "border-black/[0.07] hover:border-black/[0.15] dark:border-white/[0.07] dark:hover:border-white/[0.12]"}`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${briefingDepth === depth.id ? "border-[#c8922a] bg-[#c8922a]" : "border-zinc-300 dark:border-zinc-600"}`}
                      >
                        {briefingDepth === depth.id && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                          {depth.label}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                          {depth.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Preferred delivery time</label>
                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className={inputClass}
                  >
                    {DELIVERY_TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className={inputClass}
                  >
                    {Intl.supportedValuesOf("timeZone").map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Email delivery</label>
                  <button
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${emailEnabled ? "bg-[#c8922a]" : "bg-zinc-300 dark:bg-zinc-700"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${emailEnabled ? "left-[22px]" : "left-0.5"}`}
                    />
                  </button>
                </div>
                {emailEnabled && (
                  <div className="mt-3">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Daily scans will be sent to these addresses.{" "}
                      {maxRecipients} recipient{maxRecipients === 1 ? "" : "s"}{" "}
                      max on your plan.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3 py-2 dark:border-white/[0.1] dark:bg-white/[0.04]">
                      {emailRecipients.map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full bg-zinc-200/70 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300"
                        >
                          {r}
                          <button
                            onClick={() =>
                              setEmailRecipients(
                                emailRecipients.filter((x) => x !== r),
                              )
                            }
                            className="ml-0.5 text-zinc-400 hover:text-zinc-600"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </span>
                      ))}
                      {emailRecipients.length < maxRecipients && (
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              (e.key === "Enter" || e.key === ",") &&
                              emailInput.trim()
                            ) {
                              e.preventDefault();
                              addEmailTag(emailInput);
                            }
                            if (
                              e.key === "Backspace" &&
                              !emailInput &&
                              emailRecipients.length > 0
                            ) {
                              setEmailRecipients(emailRecipients.slice(0, -1));
                            }
                          }}
                          onBlur={() =>
                            emailInput.trim() && addEmailTag(emailInput)
                          }
                          placeholder={
                            emailRecipients.length === 0
                              ? "Add email address"
                              : ""
                          }
                          className="min-w-[140px] flex-1 border-0 bg-transparent py-1 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:outline-none dark:text-[#f0efec] dark:placeholder:text-zinc-600"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6 — Confirm */}
          {step === 5 && (
            <div className="space-y-6">
              <p className={sectionLabel}>Review your profile</p>

              <BriefingPreview
                companyName={companyName}
                themes={trackedThemes}
                watchlist={watchlistEntities}
                deliveryTime={deliveryTime}
                timezone={timezone}
              />

              <ConfirmSection label="Company">
                <ConfirmItem label="Name" value={companyName} />
                <ConfirmItem
                  label="Sector"
                  value={getSectorDefinition(sector)?.label || sector}
                />
                {subSector && (
                  <ConfirmItem label="Sub-sector" value={subSector} />
                )}
              </ConfirmSection>

              <ConfirmSection label="Geography">
                {selectedRegions.length > 0 && (
                  <ConfirmItem
                    label="Regions"
                    value={selectedRegions
                      .map(
                        (r) =>
                          COMPANY_REGIONS.find((cr) => cr.id === r)?.label || r,
                      )
                      .join(", ")}
                  />
                )}
                {selectedCountries.length > 0 && (
                  <ConfirmItem
                    label="Countries"
                    value={selectedCountries
                      .map(
                        (s) => COUNTRIES.find((c) => c.slug === s)?.name || s,
                      )
                      .join(", ")}
                  />
                )}
              </ConfirmSection>

              <ConfirmSection label="Tracking">
                <ConfirmItem
                  label="Themes"
                  value={`${trackedThemes.length} selected`}
                />
                {watchlistEntities.length > 0 && (
                  <ConfirmItem
                    label="Watchlist"
                    value={`${watchlistEntities.length} entities`}
                  />
                )}
                {supplyChainExposure.length > 0 && (
                  <ConfirmItem
                    label="Supply chain"
                    value={`${supplyChainExposure.length} items`}
                  />
                )}
              </ConfirmSection>

              <ConfirmSection label="Risk priorities">
                <ConfirmItem
                  label="Priorities"
                  value={riskPriorities
                    .map(
                      (r) =>
                        RISK_PRIORITIES.find((rp) => rp.id === r)?.label || r,
                    )
                    .join(", ")}
                />
              </ConfirmSection>
            </div>
          )}

          {/* Error */}
          {error && <div className={`mt-6 ${errorMsg}`}>{error}</div>}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium text-zinc-500 transition-colors hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#c8922a] px-6 text-sm font-medium text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] transition-all hover:bg-[#b17f24]"
              >
                Continue
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#c8922a] px-6 text-sm font-medium text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] transition-all hover:bg-[#b17f24] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Complete setup"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sector-change confirm prompt */}
      {pendingSector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-black/[0.07] bg-white p-6 shadow-xl dark:border-white/[0.07] dark:bg-[#1a1a1a]">
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              Change sector to {getSectorDefinition(pendingSector)?.label}?
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              You can replace your current themes, watchlist, and risks with the
              new sector&apos;s recommended defaults, or keep your current
              selections.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={cancelSectorChange}
                className="inline-flex h-9 items-center rounded-full px-4 text-sm text-zinc-500 hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]"
              >
                Cancel
              </button>
              <button
                onClick={confirmSectorKeep}
                className="inline-flex h-9 items-center rounded-full border border-black/[0.1] px-4 text-sm font-medium text-zinc-700 hover:bg-black/[0.03] dark:border-white/[0.1] dark:text-zinc-200 dark:hover:bg-white/[0.04]"
              >
                Keep my selections
              </button>
              <button
                onClick={confirmSectorReplace}
                className="inline-flex h-9 items-center rounded-full bg-[#c8922a] px-4 text-sm font-semibold text-white hover:bg-[#b17f24]"
              >
                Replace with defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function CountryRow({
  country,
  isSelected,
  onToggle,
}: {
  country: { name: string; slug: string; flag: string };
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${isSelected ? "text-[#0f0f0f] dark:text-[#f0efec]" : "text-zinc-500 dark:text-zinc-400"}`}
    >
      <span className="text-base">{country.flag}</span>
      <span className="flex-1">{country.name}</span>
      {isSelected && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#c8922a]"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

function ConfirmSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/[0.07] p-4 dark:border-white/[0.07]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
        {label}
      </p>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function ConfirmItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="shrink-0 text-zinc-400 dark:text-zinc-500">
        {label}:
      </span>
      <span className="text-[#0f0f0f] dark:text-[#f0efec]">{value}</span>
    </div>
  );
}
