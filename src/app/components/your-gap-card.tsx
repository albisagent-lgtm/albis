"use client";

import { useMemo } from "react";
import Link from "next/link";

const REGION_DISPLAY: Record<string, string> = {
  us: "North America",
  eu: "Europe",
  middle_east: "Middle East & North Africa",
  south_asia: "South Asia",
  asia_pacific: "East Asia & Pacific",
  latam: "Latin America",
  africa: "Sub-Saharan Africa",
};

const REGION_POPULATION: Record<string, number> = {
  us: 380_000_000,
  eu: 750_000_000,
  middle_east: 680_000_000,
  south_asia: 2_000_000_000,
  asia_pacific: 2_400_000_000,
  latam: 660_000_000,
  africa: 1_300_000_000,
};

// Map timezone prefixes/names → Albis region keys
const LATAM_TIMEZONES = new Set([
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "America/Argentina/Buenos_Aires",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Caracas",
  "America/Guayaquil",
  "America/Montevideo",
  "America/Asuncion",
  "America/La_Paz",
]);

const MIDDLE_EAST_TIMEZONES = new Set([
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Tehran",
  "Asia/Baghdad",
  "Asia/Istanbul",
  "Africa/Cairo",
  "Asia/Beirut",
  "Asia/Jerusalem",
  "Asia/Amman",
  "Asia/Kuwait",
  "Asia/Qatar",
  "Asia/Bahrain",
  "Asia/Muscat",
]);

const SOUTH_ASIA_TIMEZONES = new Set([
  "Asia/Kolkata",
  "Asia/Calcutta",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Asia/Colombo",
  "Asia/Kathmandu",
]);

function detectRegion(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;

    // Check specific timezone sets first (before prefix matching)
    if (LATAM_TIMEZONES.has(tz)) return "latam";
    if (MIDDLE_EAST_TIMEZONES.has(tz)) return "middle_east";
    if (SOUTH_ASIA_TIMEZONES.has(tz)) return "south_asia";

    // Prefix-based matching
    if (tz.startsWith("America/")) return "us";
    if (tz.startsWith("Europe/")) return "eu";
    if (tz.startsWith("Africa/")) return "africa";
    if (tz.startsWith("Australia/") || tz.startsWith("Pacific/")) return "asia_pacific";
    if (
      tz.startsWith("Asia/Shanghai") ||
      tz.startsWith("Asia/Tokyo") ||
      tz.startsWith("Asia/Seoul") ||
      tz.startsWith("Asia/Singapore") ||
      tz.startsWith("Asia/Hong_Kong") ||
      tz.startsWith("Asia/Taipei") ||
      tz.startsWith("Asia/Jakarta") ||
      tz.startsWith("Asia/Manila") ||
      tz.startsWith("Asia/Ho_Chi_Minh") ||
      tz.startsWith("Asia/Bangkok")
    ) {
      return "asia_pacific";
    }

    return null;
  } catch {
    return null;
  }
}

function formatPopulation(pop: number): string {
  const billions = pop / 1_000_000_000;
  if (billions >= 1) return `${billions.toFixed(1)} billion`;
  const millions = pop / 1_000_000;
  return `${millions.toFixed(0)} million`;
}

interface YourGapCardProps {
  regionsFound: string[];
  regionsAbsent: string[];
  pgi: number;
  regionFrames?: Record<string, string>;
}

export function YourGapCard({
  regionsFound,
  regionsAbsent,
  pgi,
  regionFrames,
}: YourGapCardProps) {
  const readerRegion = useMemo(() => detectRegion(), []);

  if (!readerRegion) return null;

  const regionLabel = REGION_DISPLAY[readerRegion] || readerRegion;
  const inFound = regionsFound.includes(readerRegion);
  const inAbsent = regionsAbsent.includes(readerRegion);

  // If the reader's region isn't in either list, don't show
  if (!inFound && !inAbsent) return null;

  const otherRegionsCount = regionsFound.filter((r) => r !== readerRegion).length;

  // Pick 2-3 OTHER region frames the reader missed
  const otherFrames = regionFrames
    ? Object.entries(regionFrames)
        .filter(([r]) => r !== readerRegion)
        .slice(0, 3)
    : [];

  return (
    <div className="mt-12 rounded-lg border-l-[3px] border-l-[#c8922a] bg-zinc-50 px-5 py-5 dark:bg-white/[0.05]">
      <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Your perspective
      </p>

      <p className="mt-3 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-[#1a1a1a] dark:text-[#d4d3d0]">
        {inFound ? (
          <>
            Based on your location, you likely saw the{" "}
            <strong className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              {regionLabel}
            </strong>{" "}
            frame
            {regionFrames?.[readerRegion] ? (
              <>: {regionFrames[readerRegion]}</>
            ) : null}
            .{" "}
            {otherRegionsCount > 0 && (
              <>
                Here&apos;s what {otherRegionsCount} other region
                {otherRegionsCount !== 1 ? "s" : ""} reported differently.
              </>
            )}
          </>
        ) : (
          <>
            This story wasn&apos;t widely covered in your region.{" "}
            <strong className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              {formatPopulation(REGION_POPULATION[readerRegion] || 0)} people
            </strong>{" "}
            in {regionLabel} likely never saw it.
          </>
        )}
      </p>

      {otherFrames.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {otherFrames.map(([region, frame]) => (
            <li
              key={region}
              className="font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
            >
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                In {REGION_DISPLAY[region] || region}:
              </span>{" "}
              {frame}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Link
          href="/perspectives"
          className="text-sm font-medium text-[#c8922a] transition-colors hover:text-[#b17f24]"
        >
          See all regional perspectives &rarr;
        </Link>
      </div>
    </div>
  );
}
