"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, getCountriesByRegion } from "@/lib/countries";
import {
  RISK_PRIORITIES,
  BRIEFING_DEPTHS,
  DELIVERY_TIMES,
  MAX_RISK_PRIORITIES,
  type CompanyProfile,
} from "@/lib/company-profile";
import {
  SECTORS,
  COMPANY_REGIONS,
  THEME_CATALOG,
  WATCHLIST_CATALOG,
  SUPPLY_CHAIN_CATALOG,
  getBundleFor,
} from "@/lib/onboarding-taxonomy";
import {
  getOnboardingTier,
  isSubscriptionActive,
  isInGracePeriod,
  type ProfileSubscription,
} from "@/lib/tier-enforcement";
import { TaxonomyCombobox } from "@/app/components/taxonomy-combobox";

// ---------------------------------------------------------------------------
// Color classes (reused from settings page)
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

// ---------------------------------------------------------------------------
// Shared CSS
// ---------------------------------------------------------------------------

const cardClass =
  "rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]";
const sectionHeader =
  "text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500";
const inputClass =
  "h-11 w-full rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15";
const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";
const btnPrimary =
  "inline-flex h-10 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-medium text-white hover:bg-[#c8922a]/90 disabled:opacity-60";
const successMsg =
  "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400";
const errorMsgClass =
  "rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DashboardProfileClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  // Section save states
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [successSection, setSuccessSection] = useState<string | null>(null);
  const [errorSection, setErrorSection] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Editable fields
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [subSector, setSubSector] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [trackedThemes, setTrackedThemes] = useState<string[]>([]);
  const [themeInput, setThemeInput] = useState("");
  const [watchlistEntities, setWatchlistEntities] = useState<string[]>([]);
  const [entityInput, setEntityInput] = useState("");
  const [supplyChainExposure, setSupplyChainExposure] = useState<string[]>([]);
  const [supplyInput, setSupplyInput] = useState("");
  const [riskPriorities, setRiskPriorities] = useState<string[]>([]);
  const [briefingDepth, setBriefingDepth] = useState("standard");
  const [deliveryTime, setDeliveryTime] = useState("07:00");
  const [timezone, setTimezone] = useState("UTC");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  // Subscription state for tier limits
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

  // Load profile
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirect=/dashboard/profile");
        return;
      }
      setUserId(user.id);

      // Fetch subscription from profiles table
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

      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (!data || !data.onboarding_completed) {
        router.push("/onboarding/company");
        return;
      }

      setProfile(data);
      setCompanyName(data.company_name || "");
      setSector(data.sector || "");
      setSubSector(data.sub_sector || "");
      setSelectedCountries(data.countries || []);
      setSelectedRegions(data.regions || []);
      setTrackedThemes(data.tracked_themes || []);
      setWatchlistEntities(data.watchlist_entities || []);
      setSupplyChainExposure(data.supply_chain_exposure || []);
      setRiskPriorities(data.risk_priorities || []);
      setBriefingDepth(data.preferred_briefing_depth || "standard");
      setDeliveryTime(data.preferred_delivery_time || "07:00");
      setTimezone(data.timezone || "UTC");
      setEmailEnabled(data.email_enabled ?? true);
      setEmailRecipients(data.email_recipients || []);
      setLoading(false);
    });
  }, [router]);

  // ---------------------------------------------------------------------------
  // Tag helpers
  // ---------------------------------------------------------------------------

  function addTag(
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void,
    max: number,
  ) {
    const trimmed = value.trim();
    if (!trimmed || list.length >= max || list.includes(trimmed.toLowerCase()))
      return;
    setList([...list, trimmed.toLowerCase()]);
    setInput("");
  }

  function removeTag(
    value: string,
    list: string[],
    setList: (v: string[]) => void,
  ) {
    setList(list.filter((t) => t !== value));
  }

  function handleTagKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void,
    max: number,
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
  // Section save
  // ---------------------------------------------------------------------------

  async function saveSection(section: string, data: Partial<CompanyProfile>) {
    if (!userId || !profile) return;
    setSavingSection(section);
    setSuccessSection(null);
    setErrorSection(null);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("company_profiles")
        .update(data)
        .eq("owner_id", userId);

      if (error) {
        setErrorSection(section);
        setErrorMessage(error.message);
      } else {
        setSuccessSection(section);
        setTimeout(() => setSuccessSection(null), 3000);
        // Fire-and-forget canonical resolution. Failures here are silent —
        // the profile save itself succeeded, and resolution is idempotent
        // so the next save (or the daily pipeline) will retry.
        fetch("/api/company-canonical-mappings/resolve", {
          method: "POST",
        }).catch(() => {});
      }
    } catch {
      setErrorSection(section);
      setErrorMessage("Failed to save. Please try again.");
    } finally {
      setSavingSection(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Country helpers
  // ---------------------------------------------------------------------------

  const countriesByRegion = getCountriesByRegion();
  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()),
      )
    : null;

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f] min-h-screen">
      <section className="mx-auto max-w-2xl px-6 py-20">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              Company Profile
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Manage your profile and daily scan preferences. Changes take
              effect from the next daily scan.
            </p>
          </div>
          <Link
            href="/account"
            className="shrink-0 text-sm text-zinc-400 transition-colors hover:text-[#0f0f0f] dark:text-zinc-500 dark:hover:text-[#f0efec]"
          >
            Account settings
          </Link>
        </div>

        {isPreview && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c8922a]/30 bg-[#c8922a]/5 px-5 py-3 dark:bg-[#c8922a]/10">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Preview mode.
              </span>{" "}
              Your profile is saved, but daily scans don&apos;t run until you
              subscribe.
            </p>
            <Link
              href="/pricing"
              className="shrink-0 rounded-full bg-[#c8922a] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgb(200,146,42,0.3)] hover:bg-[#b17f24]"
            >
              View plans
            </Link>
          </div>
        )}

        <div className="mt-10 space-y-6">
          {/* ── Company basics ── */}
          <div className={cardClass}>
            <h2 className={sectionHeader}>Company basics</h2>
            <div className="mt-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Company name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Sector</label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((s) => {
                    const isActive = sector === s.id;
                    const colors = COLOR_CLASSES[s.color] || COLOR_CLASSES.zinc;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSector(isActive ? "" : s.id)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
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
                  className={inputClass}
                />
              </div>

              {successSection === "basics" && (
                <div className={successMsg}>Changes saved.</div>
              )}
              {errorSection === "basics" && (
                <div className={errorMsgClass}>{errorMessage}</div>
              )}
              <button
                onClick={() =>
                  saveSection("basics", {
                    company_name: companyName.trim(),
                    sector: sector || null,
                    sub_sector: subSector.trim() || null,
                  })
                }
                disabled={savingSection === "basics"}
                className={btnPrimary}
              >
                {savingSection === "basics" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* ── Geography ── */}
          <div className={cardClass}>
            <h2 className={sectionHeader}>Geography</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className={labelClass}>Regions of interest</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COMPANY_REGIONS.map((region) => {
                    const isActive = selectedRegions.includes(region.id);
                    return (
                      <button
                        key={region.id}
                        onClick={() =>
                          setSelectedRegions((prev) =>
                            prev.includes(region.id)
                              ? prev.filter((r) => r !== region.id)
                              : [...prev, region.id],
                          )
                        }
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                          isActive ? REGION_ACTIVE : REGION_IDLE
                        }`}
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
                  className={`mt-2 ${inputClass}`}
                />

                {selectedCountries.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedCountries.map((slug) => {
                      const country = COUNTRIES.find((c) => c.slug === slug);
                      if (!country) return null;
                      return (
                        <button
                          key={slug}
                          onClick={() =>
                            setSelectedCountries((prev) =>
                              prev.filter((c) => c !== slug),
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-[#c8922a]/30 bg-[#c8922a]/10 px-2.5 py-0.5 text-xs font-medium text-[#c8922a] hover:bg-[#c8922a]/20"
                        >
                          {country.flag} {country.name}
                          <svg
                            width="10"
                            height="10"
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

                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-black/[0.07] dark:border-white/[0.07]">
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
                          onToggle={() =>
                            setSelectedCountries((prev) =>
                              prev.includes(c.slug)
                                ? prev.filter((x) => x !== c.slug)
                                : [...prev, c.slug],
                            )
                          }
                        />
                      ))
                    )
                  ) : (
                    Object.entries(countriesByRegion).map(
                      ([region, countries]) => (
                        <div key={region}>
                          <div className="sticky top-0 bg-[#f8f7f4] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:bg-[#0f0f0f] dark:text-zinc-600">
                            {region}
                          </div>
                          {countries.map((c) => (
                            <CountryRow
                              key={c.slug}
                              country={c}
                              isSelected={selectedCountries.includes(c.slug)}
                              onToggle={() =>
                                setSelectedCountries((prev) =>
                                  prev.includes(c.slug)
                                    ? prev.filter((x) => x !== c.slug)
                                    : [...prev, c.slug],
                                )
                              }
                            />
                          ))}
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>

              {successSection === "geography" && (
                <div className={successMsg}>Changes saved.</div>
              )}
              {errorSection === "geography" && (
                <div className={errorMsgClass}>{errorMessage}</div>
              )}
              <button
                onClick={() =>
                  saveSection("geography", {
                    countries: selectedCountries,
                    regions: selectedRegions,
                  })
                }
                disabled={savingSection === "geography"}
                className={btnPrimary}
              >
                {savingSection === "geography" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* ── Tracking ── */}
          <div className={cardClass}>
            <h2 className={sectionHeader}>What to track</h2>
            <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
              We'll match related terms automatically.
            </p>
            <div className="mt-5 space-y-5">
              <TaxonomyCombobox
                label="Tracked themes"
                helpText="Topics your daily scan should prioritise."
                value={trackedThemes}
                onChange={setTrackedThemes}
                catalog={THEME_CATALOG}
                bundleValues={getBundleFor(sector).themes.bundle}
                additionalValues={getBundleFor(sector).themes.additional}
                max={maxThemes}
                customPlaceholder="Add custom theme"
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

              {successSection === "tracking" && (
                <div className={successMsg}>Changes saved.</div>
              )}
              {errorSection === "tracking" && (
                <div className={errorMsgClass}>{errorMessage}</div>
              )}
              <button
                onClick={() =>
                  saveSection("tracking", {
                    tracked_themes: trackedThemes,
                    watchlist_entities: watchlistEntities,
                    supply_chain_exposure: supplyChainExposure,
                  })
                }
                disabled={savingSection === "tracking"}
                className={btnPrimary}
              >
                {savingSection === "tracking" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* ── Risk priorities ── */}
          <div className={cardClass}>
            <h2 className={sectionHeader}>Risk priorities</h2>
            <div className="mt-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <label className={labelClass}>
                  Select up to {MAX_RISK_PRIORITIES}
                </label>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {riskPriorities.length}/{MAX_RISK_PRIORITIES}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {RISK_PRIORITIES.map((risk) => {
                  const isActive = riskPriorities.includes(risk.id);
                  const colors =
                    COLOR_CLASSES[risk.color] || COLOR_CLASSES.zinc;
                  const atLimit =
                    riskPriorities.length >= MAX_RISK_PRIORITIES && !isActive;
                  return (
                    <button
                      key={risk.id}
                      onClick={() =>
                        setRiskPriorities((prev) =>
                          prev.includes(risk.id)
                            ? prev.filter((r) => r !== risk.id)
                            : prev.length >= MAX_RISK_PRIORITIES
                              ? prev
                              : [...prev, risk.id],
                        )
                      }
                      disabled={atLimit}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
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

              {successSection === "risks" && (
                <div className={successMsg}>Changes saved.</div>
              )}
              {errorSection === "risks" && (
                <div className={errorMsgClass}>{errorMessage}</div>
              )}
              <button
                onClick={() =>
                  saveSection("risks", { risk_priorities: riskPriorities })
                }
                disabled={savingSection === "risks"}
                className={btnPrimary}
              >
                {savingSection === "risks" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* ── Delivery preferences ���─ */}
          <div className={cardClass}>
            <h2 className={sectionHeader}>Delivery preferences</h2>
            <div className="mt-5 space-y-5">
              {/* Depth */}
              <div>
                <label className={labelClass}>Scan detail</label>
                <div className="mt-2 space-y-2">
                  {BRIEFING_DEPTHS.map((depth) => (
                    <button
                      key={depth.id}
                      onClick={() => setBriefingDepth(depth.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        briefingDepth === depth.id
                          ? "border-[#c8922a]/50 bg-[#c8922a]/5 ring-1 ring-[#c8922a]/20"
                          : "border-black/[0.07] hover:border-black/[0.15] dark:border-white/[0.07] dark:hover:border-white/[0.12]"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          briefingDepth === depth.id
                            ? "border-[#c8922a] bg-[#c8922a]"
                            : "border-zinc-300 dark:border-zinc-600"
                        }`}
                      >
                        {briefingDepth === depth.id && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                          {depth.label}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {depth.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time and timezone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Delivery time</label>
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

              {/* Email toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Email delivery</label>
                  <button
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      emailEnabled
                        ? "bg-[#c8922a]"
                        : "bg-zinc-300 dark:bg-zinc-700"
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
                  <div className="mt-2">
                    <TagInput
                      tags={emailRecipients}
                      input={emailInput}
                      setInput={setEmailInput}
                      max={3}
                      placeholder="Add email address"
                      onAdd={(v) => {
                        if (v.includes("@"))
                          addTag(
                            v,
                            emailRecipients,
                            setEmailRecipients,
                            setEmailInput,
                            maxRecipients,
                          );
                      }}
                      onRemove={(v) =>
                        removeTag(v, emailRecipients, setEmailRecipients)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          if (emailInput.includes("@"))
                            addTag(
                              emailInput,
                              emailRecipients,
                              setEmailRecipients,
                              setEmailInput,
                              maxRecipients,
                            );
                        }
                        if (
                          e.key === "Backspace" &&
                          !emailInput &&
                          emailRecipients.length > 0
                        ) {
                          setEmailRecipients(emailRecipients.slice(0, -1));
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {successSection === "delivery" && (
                <div className={successMsg}>Changes saved.</div>
              )}
              {errorSection === "delivery" && (
                <div className={errorMsgClass}>{errorMessage}</div>
              )}
              <button
                onClick={() =>
                  saveSection("delivery", {
                    preferred_briefing_depth:
                      briefingDepth as CompanyProfile["preferred_briefing_depth"],
                    preferred_delivery_time: deliveryTime,
                    timezone,
                    email_enabled: emailEnabled,
                    email_recipients: emailRecipients,
                  })
                }
                disabled={savingSection === "delivery"}
                className={btnPrimary}
              >
                {savingSection === "delivery" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Tag input
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
        {tags.length < max && (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (input.trim()) onAdd(input);
            }}
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
      className={`flex w-full items-center gap-3 px-4 py-1.5 text-left text-sm transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
        isSelected
          ? "text-[#0f0f0f] dark:text-[#f0efec]"
          : "text-zinc-500 dark:text-zinc-400"
      }`}
    >
      <span className="text-base">{country.flag}</span>
      <span className="flex-1">{country.name}</span>
      {isSelected && (
        <svg
          width="14"
          height="14"
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
