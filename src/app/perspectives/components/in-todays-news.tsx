"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COUNTRIES, type Country } from "../countries";

interface CountryMention {
  country: Country;
  count: number;
}

export function InTodaysNewsSection() {
  const [topCountries, setTopCountries] = useState<CountryMention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndAnalyze() {
      try {
        // Use relative API call to get today's scan
        const response = await fetch('/api/scans/today');
        
        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        // Check if we have scan items
        if (!data || !data.items || data.items.length === 0) {
          setLoading(false);
          return;
        }

        // Collect all text from headlines and connections
        const allText: string[] = [];
        for (const item of data.items) {
          if (item.headline) allText.push(item.headline.toLowerCase());
          if (item.connection) allText.push(item.connection.toLowerCase());
        }

        // Count country mentions
        const mentionCounts = new Map<string, number>();
        
        for (const country of COUNTRIES) {
          const searchTerms = [
            country.name.toLowerCase(),
            // Add common variations
            ...(country.name === "USA" ? ["united states", "america", "u.s.", "us "] : []),
            ...(country.name === "UK" ? ["united kingdom", "britain", "u.k."] : []),
            ...(country.name === "UAE" ? ["united arab emirates"] : []),
            ...(country.name === "DRC Congo" ? ["democratic republic of congo", "congo"] : []),
          ];

          let count = 0;
          for (const text of allText) {
            for (const term of searchTerms) {
              if (text.includes(term)) {
                count++;
                break; // Count once per text, not once per term
              }
            }
          }

          if (count > 0) {
            mentionCounts.set(country.slug, count);
          }
        }

        // Sort by count and take top 6-8
        const sorted = Array.from(mentionCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([slug, count]) => ({
            country: COUNTRIES.find(c => c.slug === slug)!,
            count,
          }));

        setTopCountries(sorted);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching scan data:", error);
        setLoading(false);
      }
    }

    fetchAndAnalyze();
  }, []);

  // Don't show section if no data
  if (!loading && topCountries.length === 0) {
    return null;
  }

  return (
    <section
      className={`mb-space-12 transition-opacity duration-500 ${
        loading ? "opacity-50" : "opacity-100"
      }`}
    >
      <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-4">
        In Today&apos;s News
      </h2>
      <div className="flex flex-wrap gap-space-2">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 h-8 w-32 animate-pulse"
            />
          ))
        ) : (
          topCountries.map(({ country }) => (
            <Link
              key={country.slug}
              href={`/perspectives/${country.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-[#c8922a]/10 hover:text-[#c8922a] transition-colors"
            >
              <span>{country.flag}</span>
              <span>{country.name}</span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
