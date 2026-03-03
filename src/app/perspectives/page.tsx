"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { COUNTRIES, type Country } from "./countries";
import { EmailCapture } from "@/app/components/email-capture";
import { Search } from "lucide-react";
import { InTodaysNewsSection } from "./components/in-todays-news";

// Reorganize countries into the 6 major regions from the design spec
interface RegionalGroup {
  name: string;
  description: string;
  countries: Country[];
}

function getRegionalGroups(): RegionalGroup[] {
  // Asia: South Asia + East & Southeast Asia + Central Asia
  const asia = COUNTRIES.filter(
    (c) =>
      c.region === "South Asia" ||
      c.region === "East & Southeast Asia" ||
      c.region === "Central Asia"
  );

  // Europe: Eastern Europe + European countries from Western World
  const europeanCountriesInWesternWorld = [
    "uk", "germany", "france", "italy", "spain", "portugal", "switzerland",
    "netherlands", "belgium", "austria", "sweden", "norway", "denmark",
    "finland", "iceland", "ireland", "luxembourg", "malta", "monaco",
    "liechtenstein", "andorra", "san-marino", "vatican-city"
  ];
  const europe = COUNTRIES.filter(
    (c) =>
      c.region === "Eastern Europe" ||
      (c.region === "Western World" && europeanCountriesInWesternWorld.includes(c.slug))
  );

  // Americas: North America (from Western World) + Latin Americas + Caribbean
  const northAmericanCountries = ["usa", "canada"]; // Mexico is in Latin Americas
  const americas = COUNTRIES.filter(
    (c) =>
      c.region === "Latin Americas" ||
      c.region === "Caribbean" ||
      (c.region === "Western World" && northAmericanCountries.includes(c.slug))
  );

  // Africa: All African countries (excluding North African countries we'll move to MENA)
  const menaAfricanCountries = ["egypt", "libya", "tunisia", "algeria", "morocco", "mauritania", "sudan"];
  const africa = COUNTRIES.filter(
    (c) => c.region === "Africa" && !menaAfricanCountries.includes(c.slug)
  );

  // Middle East & North Africa: Middle East + North African countries
  const middleEastAndNorthAfrica = COUNTRIES.filter(
    (c) =>
      c.region === "Middle East" ||
      (c.region === "Africa" && menaAfricanCountries.includes(c.slug))
  );

  // Oceania: Australia/NZ + Pacific Islands
  const oceaniaCountries = ["australia", "new-zealand"];
  const oceania = COUNTRIES.filter(
    (c) =>
      c.region === "Pacific Islands" ||
      (c.region === "Western World" && oceaniaCountries.includes(c.slug))
  );

  return [
    {
      name: "Asia",
      description: "East Asia, South Asia, Southeast Asia, Central Asia",
      countries: asia.sort((a, b) => a.name.localeCompare(b.name)),
    },
    {
      name: "Europe",
      description: "Western, Eastern, Northern, Southern",
      countries: europe.sort((a, b) => a.name.localeCompare(b.name)),
    },
    {
      name: "Americas",
      description: "North America, Central America, South America, Caribbean",
      countries: americas.sort((a, b) => a.name.localeCompare(b.name)),
    },
    {
      name: "Africa",
      description: "North, West, East, Southern, Central",
      countries: africa.sort((a, b) => a.name.localeCompare(b.name)),
    },
    {
      name: "Middle East & North Africa",
      description: "Middle East, North Africa",
      countries: middleEastAndNorthAfrica.sort((a, b) => a.name.localeCompare(b.name)),
    },
    {
      name: "Oceania",
      description: "Australia/NZ, Pacific Islands",
      countries: oceania.sort((a, b) => a.name.localeCompare(b.name)),
    },
  ];
}

export default function PerspectivesIndex() {
  const regions = getRegionalGroups();
  // All regions expanded by default
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
    new Set(regions.map((r) => r.name))
  );
  const [searchQuery, setSearchQuery] = useState("");

  const toggleRegion = (regionName: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(regionName)) {
        next.delete(regionName);
      } else {
        next.add(regionName);
      }
      return next;
    });
  };

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return null;
    
    const query = searchQuery.toLowerCase();
    return COUNTRIES.filter(country => 
      country.name.toLowerCase().includes(query)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className="mx-auto max-w-5xl px-space-6 py-space-16 md:py-space-24">
      {/* Page Header */}
      <header className="mb-space-16 max-w-2xl">
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400">
          PERSPECTIVES
        </p>
        <p className="mt-2 text-lg font-[family-name:var(--font-source-serif)] text-zinc-500 dark:text-zinc-400">
          See how 195 countries tell the world&apos;s stories.
        </p>
      </header>

      {/* In Today's News Section */}
      <InTodaysNewsSection />

      {/* Search Bar */}
      <div className="mb-space-12 w-full max-w-md mx-auto">
        <div className="relative">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" 
            size={18}
          />
          <input
            type="text"
            placeholder="🔍 Search countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-[15px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c8922a]/30"
          />
        </div>
      </div>

      {/* Results: Filtered list or Regional Grid */}
      {isSearching ? (
        // Flat list when searching
        <div>
          {filteredCountries && filteredCountries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-3">
              {filteredCountries.map((country) => (
                <Link
                  key={country.slug}
                  href={`/perspectives/${country.slug}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors group"
                >
                  <span className="text-xl" role="img" aria-label={`${country.name} flag`}>
                    {country.flag}
                  </span>
                  <span className="text-[15px] text-zinc-600 group-hover:text-[#c8922a] dark:text-zinc-400 dark:group-hover:text-[#c8922a] transition-colors">
                    {country.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400">No countries found</p>
            </div>
          )}
        </div>
      ) : (
        // Regional Grid when not searching
        <div className="space-y-0">
          {regions.map((region, index) => {
            const isExpanded = expandedRegions.has(region.name);
            const isFirst = index === 0;

            return (
              <section
                key={region.name}
                className={!isFirst ? "border-t border-black/5 dark:border-white/5 pt-space-8 mt-space-8" : ""}
              >
                {/* Region Header - Clickable */}
                <button
                  onClick={() => toggleRegion(region.name)}
                  className="w-full flex items-center justify-between mb-space-6 text-left group"
                >
                  <div className="flex items-center gap-space-3">
                    <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
                      {region.name}
                    </h2>
                    <span className="text-sm text-zinc-400 dark:text-zinc-500">
                      {region.countries.length} {region.countries.length === 1 ? "country" : "countries"}
                    </span>
                  </div>
                  {/* Chevron */}
                  <span className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors text-lg">
                    {isExpanded ? "▾" : "▸"}
                  </span>
                </button>

                {/* Country Grid - Collapsible */}
                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-3">
                    {region.countries.map((country) => (
                      <Link
                        key={country.slug}
                        href={`/perspectives/${country.slug}`}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors group"
                      >
                        <span className="text-xl" role="img" aria-label={`${country.name} flag`}>
                          {country.flag}
                        </span>
                        <span className="text-[15px] text-zinc-600 group-hover:text-[#c8922a] dark:text-zinc-400 dark:group-hover:text-[#c8922a] transition-colors">
                          {country.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-20 rounded-2xl border border-black/[0.07] bg-[#f8f7f4] p-space-8 text-center dark:border-white/[0.07] dark:bg-white/[0.03]">
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          See how the world tells its stories
        </h3>
        <p className="mx-auto mt-3 max-w-md text-zinc-500 dark:text-zinc-400">
          Albis scans thousands of sources across 195 countries daily. Get your first briefing free.
        </p>
        <div className="mt-6">
          <EmailCapture variant="hero" />
        </div>
      </div>
    </main>
  );
}
