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

function getPgiTier(pgi: number) {
  if (pgi <= 2.0) return { name: "Global Consensus", fill: "bg-emerald-500", border: "border-emerald-500" };
  if (pgi <= 4.0) return { name: "Different Lenses", fill: "bg-amber-400", border: "border-amber-400" };
  if (pgi <= 6.0) return { name: "Diverging Narratives", fill: "bg-orange-500", border: "border-orange-500" };
  if (pgi <= 8.0) return { name: "Competing Realities", fill: "bg-red-500", border: "border-red-500" };
  return { name: "Parallel Universes", fill: "bg-zinc-800 dark:bg-zinc-200", border: "border-zinc-800 dark:border-zinc-200" };
}

interface PerceptionGapVisualProps {
  pgi: number;
  regionsFound: string[];
  regionsAbsent: string[];
  regionSignificance?: Record<string, number>;
  compact?: boolean;
}

export function PerceptionGapVisual({
  pgi,
  regionsFound,
  regionsAbsent,
  regionSignificance,
  compact = false,
}: PerceptionGapVisualProps) {
  if (!regionsFound || regionsFound.length === 0) return null;

  const tier = getPgiTier(pgi);
  const allRegions = ALL_REGIONS.filter(
    (r) => regionsFound.includes(r) || regionsAbsent.includes(r)
  );
  // Fallback: if a region isn't in either list, skip it
  const totalRegions = allRegions.length || 7;
  const coveredCount = regionsFound.length;

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white/80 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
      {/* Gradient bar with circles */}
      <div className="relative">
        <div
          className="h-1.5 w-full rounded-full"
          style={{
            background: "linear-gradient(to right, #6ee7b7, #fcd34d, #fdba74, #fca5a5)",
          }}
          aria-hidden="true"
        />

        {/* Region circles */}
        <div className="absolute inset-0 flex items-center">
          {ALL_REGIONS.map((region) => {
            const sig = regionSignificance?.[region] ?? 3;
            // Position: sig 1 = 8%, sig 5 = 92%
            const position = 8 + ((sig - 1) / 4) * 84;
            const isFound = regionsFound.includes(region);
            const isRelevant = isFound || regionsAbsent.includes(region);

            if (!isRelevant) return null;

            return (
              <div
                key={region}
                className="absolute flex flex-col items-center"
                style={{ left: `${position}%`, transform: "translateX(-50%)" }}
              >
                <div
                  className={`h-3 w-3 rounded-full border-[1.5px] ${
                    isFound
                      ? `${tier.fill} ${tier.border}`
                      : `bg-transparent ${tier.border}`
                  } ring-2 ring-white dark:ring-[#0f0f0f] transition-all`}
                  title={`${REGION_LABELS[region] || region}${isFound ? "" : " (absent)"}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels and summary — hidden in compact mode */}
      {!compact && (
        <div className="mt-4">
          {/* Region labels row */}
          <div className="flex justify-between px-1">
            {ALL_REGIONS.map((region) => {
              const isRelevant = regionsFound.includes(region) || regionsAbsent.includes(region);
              const isFound = regionsFound.includes(region);
              return (
                <span
                  key={region}
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
              );
            })}
          </div>

          {/* Summary line */}
          <p className="mt-2.5 text-xs text-zinc-500 dark:text-zinc-400">
            {coveredCount} of {totalRegions} regions covered this story.{" "}
            <span className="font-[family-name:var(--font-playfair)] font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              PGI {pgi.toFixed(1)}
            </span>
            {" "}
            <span className="text-zinc-400 dark:text-zinc-500">
              — {tier.name}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
