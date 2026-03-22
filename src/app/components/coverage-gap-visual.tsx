"use client";

const ALL_REGIONS = ["us", "eu", "middle_east", "south_asia", "asia_pacific", "latam", "africa"] as const;

const REGION_LABELS: Record<string, string> = {
  us: "US",
  eu: "EU",
  middle_east: "MENA",
  south_asia: "SA",
  asia_pacific: "APAC",
  latam: "LAT",
  africa: "AFR",
};

const REGION_POPULATION: Record<string, number> = {
  us: 380_000_000,
  eu: 750_000_000,
  middle_east: 680_000_000,
  africa: 1_300_000_000,
  south_asia: 2_000_000_000,
  asia_pacific: 2_400_000_000,
  latam: 660_000_000,
};

function formatPopulation(pop: number): string {
  const billions = pop / 1_000_000_000;
  if (billions >= 1) {
    return `${billions.toFixed(1)} billion`;
  }
  const millions = pop / 1_000_000;
  return `${millions.toFixed(0)} million`;
}

interface CoverageGapVisualProps {
  regionsFound: string[];
  regionsAbsent: string[];
  compact?: boolean;
}

export function CoverageGapVisual({
  regionsFound,
  regionsAbsent,
  compact = false,
}: CoverageGapVisualProps) {
  if (!regionsFound || (regionsFound.length === 0 && regionsAbsent.length === 0)) return null;

  const absentPopulation = regionsAbsent.reduce(
    (sum, r) => sum + (REGION_POPULATION[r] || 0),
    0
  );
  const allCovered = regionsAbsent.length === 0;
  const highAbsence = regionsAbsent.length >= 3;

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white/80 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
      {/* Circles row */}
      <div className="flex items-center justify-center gap-2">
        {ALL_REGIONS.map((region) => {
          const isFound = regionsFound.includes(region);
          const isAbsent = regionsAbsent.includes(region);
          const isRelevant = isFound || isAbsent;

          return (
            <div key={region} className="flex flex-col items-center gap-1.5">
              <div
                className={`h-4 w-4 rounded-full border-[1.5px] transition-all ${
                  isFound
                    ? "bg-emerald-500 border-emerald-500"
                    : isAbsent
                    ? "bg-transparent border-zinc-400 dark:border-zinc-500"
                    : "bg-transparent border-zinc-200 dark:border-zinc-700"
                }`}
                title={`${REGION_LABELS[region]}${isFound ? " — covered" : isAbsent ? " — not covered" : ""}`}
              />
              {!compact && (
                <span
                  className={`text-[10px] leading-none ${
                    !isRelevant
                      ? "text-zinc-300 dark:text-zinc-700"
                      : isFound
                      ? "text-zinc-500 dark:text-zinc-400"
                      : "text-zinc-400/60 dark:text-zinc-600"
                  }`}
                >
                  {REGION_LABELS[region]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Population impact — hidden in compact mode */}
      {!compact && (
        <p
          className={`mt-3 text-center text-xs font-medium ${
            allCovered
              ? "text-emerald-600 dark:text-emerald-400"
              : highAbsence
              ? "text-red-500 dark:text-red-400"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {allCovered
            ? "Covered globally"
            : `Invisible to ${formatPopulation(absentPopulation)} people`}
        </p>
      )}
    </div>
  );
}
