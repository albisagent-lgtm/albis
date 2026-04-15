"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, getCountriesByRegion } from "@/lib/countries";
import {
  SECTORS,
  RISK_PRIORITIES,
  COMPANY_REGIONS,
  BRIEFING_DEPTHS,
  DELIVERY_TIMES,
  SUGGESTED_THEMES,
  MAX_RISK_PRIORITIES,
  MAX_TRACKED_THEMES,
  type SectorId,
} from "@/lib/company-profile";
import {
  getOnboardingTier,
  isSubscriptionActive,
  isInGracePeriod,
  type ProfileSubscription,
} from "@/lib/tier-enforcement";

// ---------------------------------------------------------------------------
// Color classes (reused from settings page)
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
// Shared CSS classes (from account page pattern)
// ---------------------------------------------------------------------------

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

  // Step 1 — Company basics
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState<SectorId | "">("");
  const [subSector, setSubSector] = useState("");

  // Step 2 — Geography
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");

  // Step 3 — Tracking
  const [trackedThemes, setTrackedThemes] = useState<string[]>([]);
  const [themeInput, setThemeInput] = useState("");
  const [watchlistEntities, setWatchlistEntities] = useState<string[]>([]);
  const [entityInput, setEntityInput] = useState("");
  const [supplyChainExposure, setSupplyChainExposure] = useState<string[]>([]);
  const [supplyInput, setSupplyInput] = useState("");

  // Step 4 — Risk priorities
  const [riskPriorities, setRiskPriorities] = useState<string[]>([]);

  // Step 5 — Delivery
  const [briefingDepth, setBriefingDepth] = useState("standard");
  const [deliveryTime, setDeliveryTime] = useState("07:00");
  const [timezone, setTimezone] = useState("UTC");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  // Subscription state (used for tier limits + preview banner)
  const [subscription, setSubscription] = useState<ProfileSubscription>({
    subscription_status: null,
    subscription_tier: null,
    subscription_period_end: null,
  });

  // Effective tier limits for onboarding (Pro limits if unsubscribed)
  const onboardingTier = getOnboardingTier(subscription);
  const maxThemes = onboardingTier.maxTrackedThemes;
  const maxEntities = onboardingTier.maxWatchlistEntities;
  const maxRecipients = onboardingTier.maxEmailRecipients;
  const isPreview =
    !isSubscriptionActive(subscription) && !isInGracePeriod(subscription);

  // Check auth and redirect if profile already exists
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirect=/onboarding/company");
        return;
      }
      setUserId(user.id);

      // Fetch subscription state from profiles (drives tier limits)
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_tier, subscription_period_end")
        .eq("id", user.id)
        .single();

      if (userProfile) {
        setSubscription({
          subscription_status: userProfile.subscription_status,
          subscription_tier: userProfile.subscription_tier,
          subscription_period_end: userProfile.subscription_period_end,
        });
      }

      // Check if company profile already exists
      const { data: profile } = await supabase
        .from("company_profiles")
        .select("id, onboarding_completed")
        .eq("owner_id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push("/dashboard/profile");
        return;
      }

      // Pre-fill email recipient with user email
      if (user.email) {
        setEmailRecipients([user.email]);
      }

      // Detect browser timezone
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) setTimezone(tz);
      } catch {
        // fallback to UTC
      }

      setCheckingAuth(false);
    });
  }, [router]);

  // Auto-suggest themes when sector changes
  useEffect(() => {
    if (sector && trackedThemes.length === 0) {
      const suggestions = SUGGESTED_THEMES[sector];
      if (suggestions) {
        setTrackedThemes(suggestions.slice(0, 5));
      }
    }
    // Only run when sector changes, not when themes change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector]);

  // ---------------------------------------------------------------------------
  // Tag input helpers
  // ---------------------------------------------------------------------------

  function addTag(
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void,
    max: number
  ) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (list.length >= max) return;
    if (list.includes(trimmed.toLowerCase())) return;
    setList([...list, trimmed.toLowerCase()]);
    setInput("");
  }

  function removeTag(value: string, list: string[], setList: (v: string[]) => void) {
    setList(list.filter((t) => t !== value));
  }

  function handleTagKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void,
    max: number
  ) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(value, list, setList, setInput, max);
    }
    if (e.key === "Backspace" && !value && list.length > 0) {
      setList(list.slice(0, -1));
    }
  }

  // ---------------------------------------------------------------------------
  // Country filtering
  // ---------------------------------------------------------------------------

  const countriesByRegion = getCountriesByRegion();
  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : null;

  function toggleCountry(slug: string) {
    setSelectedCountries((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }

  function toggleRegion(id: string) {
    setSelectedRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  function toggleRisk(id: string) {
    setRiskPriorities((prev) => {
      if (prev.includes(id)) return prev.filter((r) => r !== id);
      if (prev.length >= MAX_RISK_PRIORITIES) return prev;
      return [...prev, id];
    });
  }

  // ---------------------------------------------------------------------------
  // Validation per step
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
      case 4:
        return null; // Delivery prefs all have defaults
      default:
        return null;
    }
  }, [step, companyName, sector, selectedCountries, selectedRegions, trackedThemes, riskPriorities]);

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
  // Save profile
  // ---------------------------------------------------------------------------

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const profileData = {
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
        .upsert(profileData, { onConflict: "owner_id" });

      if (upsertError) {
        setError(upsertError.message);
        setSaving(false);
        return;
      }

      router.push("/dashboard/profile");
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (checkingAuth) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      {/* Background */}
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
            Tell us about your business so we can deliver intelligence that matters to you.
          </p>
        </div>

        {/* Preview banner for unsubscribed users */}
        {isPreview && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c8922a]/30 bg-[#c8922a]/5 px-5 py-3 dark:bg-[#c8922a]/10">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">Preview mode.</span>{" "}
              Your profile will be saved, but briefings don&apos;t generate until you subscribe.
            </p>
            <Link
              href="/pricing"
              className="shrink-0 rounded-full bg-[#c8922a] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] hover:bg-[#b17f24]"
            >
              View plans
            </Link>
          </div>
        )}

        {/* Progress bar */}
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-px flex-1 transition-colors ${
                      i < step ? "bg-[#c8922a]" : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between">
            {STEPS.map((s, i) => (
              <span
                key={s.label}
                className={`text-[10px] font-medium uppercase tracking-wider ${
                  i === step
                    ? "text-[#c8922a]"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.short}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Step content card */}
        <div className="animate-step-fade-in rounded-2xl border border-black/[0.07] bg-white p-7 shadow-[0_4px_24px_rgb(0,0,0,0.06)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:shadow-none md:p-8">
          {/* Step 1: Company basics */}
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

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Sector</label>
                <div className="flex flex-wrap gap-2.5">
                  {SECTORS.map((s) => {
                    const isActive = sector === s.id;
                    const colors = COLOR_CLASSES[s.color] || COLOR_CLASSES.zinc;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSector(isActive ? "" : s.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          isActive ? colors.active : colors.idle
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

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
            </div>
          )}

          {/* Step 2: Geography */}
          {step === 1 && (
            <div className="space-y-6">
              <p className={sectionLabel}>Geography</p>

              {/* Regions */}
              <div>
                <label className={labelClass}>Regions of interest</label>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {COMPANY_REGIONS.map((region) => {
                    const isActive = selectedRegions.includes(region.id);
                    return (
                      <button
                        key={region.id}
                        onClick={() => toggleRegion(region.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          isActive ? REGION_ACTIVE : REGION_IDLE
                        }`}
                      >
                        {region.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Countries */}
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

                {/* Selected countries chips */}
                {selectedCountries.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCountries.map((slug) => {
                      const country = COUNTRIES.find((c) => c.slug === slug);
                      if (!country) return null;
                      return (
                        <button
                          key={slug}
                          onClick={() => toggleCountry(slug)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#c8922a]/30 bg-[#c8922a]/10 px-3 py-1 text-xs font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/20"
                        >
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Country list */}
                <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-black/[0.07] dark:border-white/[0.07]">
                  {filteredCountries ? (
                    filteredCountries.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-zinc-400">No countries found.</p>
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
                    Object.entries(countriesByRegion).map(([region, countries]) => (
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
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tracking */}
          {step === 2 && (
            <div className="space-y-6">
              <p className={sectionLabel}>What to track</p>

              {/* Tracked themes */}
              <div>
                <div className="flex items-baseline justify-between">
                  <label className={labelClass}>Tracked themes</label>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                    {trackedThemes.length}/{maxThemes}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Topics you want your briefing to prioritise. Type and press Enter.
                </p>
                <TagInput
                  tags={trackedThemes}
                  input={themeInput}
                  setInput={setThemeInput}
                  max={maxThemes}
                  placeholder="e.g. sanctions, shipping routes, oil prices"
                  onAdd={(v) => addTag(v, trackedThemes, setTrackedThemes, setThemeInput, maxThemes)}
                  onRemove={(v) => removeTag(v, trackedThemes, setTrackedThemes)}
                  onKeyDown={(e) => handleTagKeyDown(e, themeInput, trackedThemes, setTrackedThemes, setThemeInput, maxThemes)}
                />
                {sector && SUGGESTED_THEMES[sector] && (
                  <div className="mt-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                      Suggestions for your sector
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {SUGGESTED_THEMES[sector]
                        .filter((t) => !trackedThemes.includes(t))
                        .map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              if (trackedThemes.length < maxThemes) {
                                setTrackedThemes([...trackedThemes, t]);
                              }
                            }}
                            className="rounded-full border border-dashed border-zinc-600/30 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-zinc-700 dark:text-zinc-500"
                          >
                            + {t}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Watchlist entities */}
              <div>
                <div className="flex items-baseline justify-between">
                  <label className={labelClass}>Watchlist entities</label>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                    {watchlistEntities.length}/{maxEntities}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Competitors, organisations, or people to monitor.
                </p>
                <TagInput
                  tags={watchlistEntities}
                  input={entityInput}
                  setInput={setEntityInput}
                  max={maxEntities}
                  placeholder="e.g. Maersk, OPEC, Xi Jinping"
                  onAdd={(v) => addTag(v, watchlistEntities, setWatchlistEntities, setEntityInput, maxEntities)}
                  onRemove={(v) => removeTag(v, watchlistEntities, setWatchlistEntities)}
                  onKeyDown={(e) => handleTagKeyDown(e, entityInput, watchlistEntities, setWatchlistEntities, setEntityInput, maxEntities)}
                />
              </div>

              {/* Supply chain exposure */}
              <div>
                <label className={labelClass}>Supply chain exposure</label>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Commodities, routes, or dependencies relevant to your supply chain.
                </p>
                <TagInput
                  tags={supplyChainExposure}
                  input={supplyInput}
                  setInput={setSupplyInput}
                  max={MAX_TRACKED_THEMES}
                  placeholder="e.g. fertiliser, Hormuz Strait, semiconductors"
                  onAdd={(v) => addTag(v, supplyChainExposure, setSupplyChainExposure, setSupplyInput, MAX_TRACKED_THEMES)}
                  onRemove={(v) => removeTag(v, supplyChainExposure, setSupplyChainExposure)}
                  onKeyDown={(e) => handleTagKeyDown(e, supplyInput, supplyChainExposure, setSupplyChainExposure, setSupplyInput, MAX_TRACKED_THEMES)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Risk priorities */}
          {step === 3 && (
            <div className="space-y-6">
              <p className={sectionLabel}>Risk priorities</p>
              <div>
                <div className="flex items-baseline justify-between">
                  <label className={labelClass}>Select up to {MAX_RISK_PRIORITIES} risk types</label>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                    {riskPriorities.length}/{MAX_RISK_PRIORITIES} selected
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {RISK_PRIORITIES.map((risk) => {
                    const isActive = riskPriorities.includes(risk.id);
                    const colors = COLOR_CLASSES[risk.color] || COLOR_CLASSES.zinc;
                    const atLimit = riskPriorities.length >= MAX_RISK_PRIORITIES && !isActive;
                    return (
                      <button
                        key={risk.id}
                        onClick={() => toggleRisk(risk.id)}
                        disabled={atLimit}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? colors.active
                            : atLimit
                            ? "border-zinc-800/30 text-zinc-600/40 cursor-not-allowed"
                            : colors.idle
                        }`}
                      >
                        {risk.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Delivery preferences */}
          {step === 4 && (
            <div className="space-y-6">
              <p className={sectionLabel}>Delivery preferences</p>

              {/* Briefing depth */}
              <div>
                <label className={labelClass}>Briefing depth</label>
                <div className="mt-3 space-y-2">
                  {BRIEFING_DEPTHS.map((depth) => (
                    <button
                      key={depth.id}
                      onClick={() => setBriefingDepth(depth.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        briefingDepth === depth.id
                          ? "border-[#c8922a]/50 bg-[#c8922a]/5 ring-1 ring-[#c8922a]/20"
                          : "border-black/[0.07] hover:border-black/[0.15] dark:border-white/[0.07] dark:hover:border-white/[0.12]"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          briefingDepth === depth.id
                            ? "border-[#c8922a] bg-[#c8922a]"
                            : "border-zinc-300 dark:border-zinc-600"
                        }`}
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

              {/* Delivery time and timezone */}
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

              {/* Email delivery */}
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Email delivery</label>
                  <button
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      emailEnabled ? "bg-[#c8922a]" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        emailEnabled ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                {emailEnabled && (
                  <div className="mt-3">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Briefings will be sent to these addresses.
                    </p>
                    <TagInput
                      tags={emailRecipients}
                      input={emailInput}
                      setInput={setEmailInput}
                      max={3}
                      placeholder="Add email address"
                      onAdd={(v) => {
                        if (v.includes("@")) {
                          addTag(v, emailRecipients, setEmailRecipients, setEmailInput, maxRecipients);
                        }
                      }}
                      onRemove={(v) => removeTag(v, emailRecipients, setEmailRecipients)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          if (emailInput.includes("@")) {
                            addTag(emailInput, emailRecipients, setEmailRecipients, setEmailInput, maxRecipients);
                          }
                        }
                        if (e.key === "Backspace" && !emailInput && emailRecipients.length > 0) {
                          setEmailRecipients(emailRecipients.slice(0, -1));
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Confirmation */}
          {step === 5 && (
            <div className="space-y-6">
              <p className={sectionLabel}>Review your profile</p>

              <ConfirmSection label="Company">
                <ConfirmItem label="Name" value={companyName} />
                <ConfirmItem
                  label="Sector"
                  value={SECTORS.find((s) => s.id === sector)?.label || sector}
                />
                {subSector && <ConfirmItem label="Sub-sector" value={subSector} />}
              </ConfirmSection>

              <ConfirmSection label="Geography">
                {selectedRegions.length > 0 && (
                  <ConfirmItem
                    label="Regions"
                    value={selectedRegions
                      .map((r) => COMPANY_REGIONS.find((cr) => cr.id === r)?.label || r)
                      .join(", ")}
                  />
                )}
                {selectedCountries.length > 0 && (
                  <ConfirmItem
                    label="Countries"
                    value={selectedCountries
                      .map((s) => COUNTRIES.find((c) => c.slug === s)?.name || s)
                      .join(", ")}
                  />
                )}
              </ConfirmSection>

              <ConfirmSection label="Tracking">
                <ConfirmItem label="Themes" value={trackedThemes.join(", ")} />
                {watchlistEntities.length > 0 && (
                  <ConfirmItem label="Watchlist" value={watchlistEntities.join(", ")} />
                )}
                {supplyChainExposure.length > 0 && (
                  <ConfirmItem label="Supply chain" value={supplyChainExposure.join(", ")} />
                )}
              </ConfirmSection>

              <ConfirmSection label="Risk priorities">
                <ConfirmItem
                  label="Priorities"
                  value={riskPriorities
                    .map((r) => RISK_PRIORITIES.find((rp) => rp.id === r)?.label || r)
                    .join(", ")}
                />
              </ConfirmSection>

              <ConfirmSection label="Delivery">
                <ConfirmItem
                  label="Depth"
                  value={BRIEFING_DEPTHS.find((d) => d.id === briefingDepth)?.label || briefingDepth}
                />
                <ConfirmItem label="Time" value={`${deliveryTime} (${timezone.replace(/_/g, " ")})`} />
                <ConfirmItem
                  label="Email"
                  value={emailEnabled ? emailRecipients.join(", ") || "Enabled (no recipients)" : "Disabled"}
                />
              </ConfirmSection>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Your first briefing will arrive tomorrow at {deliveryTime} ({timezone.replace(/_/g, " ")}).
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div className={`mt-6 ${errorMsg}`}>{error}</div>}

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium text-zinc-500 transition-colors hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#c8922a] px-6 text-sm font-medium text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] transition-all hover:bg-[#b17f24] hover:shadow-[0_3px_10px_rgb(200,146,42,0.4)]"
              >
                Continue
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#c8922a] px-6 text-sm font-medium text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] transition-all hover:bg-[#b17f24] hover:shadow-[0_3px_10px_rgb(200,146,42,0.4)] disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Complete setup"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag input component
// ---------------------------------------------------------------------------

function TagInput({
  tags,
  input,
  setInput,
  max,
  placeholder,
  onAdd,
  onRemove,
  onKeyDown,
}: {
  tags: string[];
  input: string;
  setInput: (v: string) => void;
  max: number;
  placeholder: string;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3 py-2 focus-within:border-[#c8922a] focus-within:ring-2 focus-within:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:focus-within:border-[#c8922a] dark:focus-within:ring-[#c8922a]/15">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-200/70 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300"
          >
            {tag}
            <button
              onClick={() => onRemove(tag)}
              className="ml-0.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        ))}
        {tags.length < max && (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => { if (input.trim()) onAdd(input); }}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:outline-none dark:text-[#f0efec] dark:placeholder:text-zinc-600"
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Country row
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
      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
        isSelected
          ? "text-[#0f0f0f] dark:text-[#f0efec]"
          : "text-zinc-500 dark:text-zinc-400"
      }`}
    >
      <span className="text-base">{country.flag}</span>
      <span className="flex-1">{country.name}</span>
      {isSelected && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c8922a]">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Confirmation helpers
// ---------------------------------------------------------------------------

function ConfirmSection({ label, children }: { label: string; children: React.ReactNode }) {
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
      <span className="shrink-0 text-zinc-400 dark:text-zinc-500">{label}:</span>
      <span className="text-[#0f0f0f] dark:text-[#f0efec]">{value}</span>
    </div>
  );
}
