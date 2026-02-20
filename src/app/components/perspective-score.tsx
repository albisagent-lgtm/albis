"use client";

const ALL_REGIONS = [
  "western-world",
  "east-se-asia",
  "south-asia",
  "middle-east",
  "africa",
  "eastern-europe",
  "latin-americas",
] as const;

interface PerspectiveScoreProps {
  regions: string[];
}

export function PerspectiveScore({ regions }: PerspectiveScoreProps) {
  const covered = new Set(regions.filter((r) => r !== "global"));
  const count = covered.size;
  const total = ALL_REGIONS.length;

  return (
    <div className="flex items-center gap-2">
      {/* Dots */}
      <div className="flex gap-1">
        {ALL_REGIONS.map((region) => (
          <span
            key={region}
            className={`h-2 w-2 rounded-full ${
              covered.has(region)
                ? "bg-amber-500"
                : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
        {count}/{total}
      </span>

      {/* Badge */}
      {count >= 5 && (
        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
          🌐 Global
        </span>
      )}
      {count <= 2 && count > 0 && (
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
          Regional
        </span>
      )}
    </div>
  );
}
