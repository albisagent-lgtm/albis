import { DISPLAY_REGIONS, REGION_LABELS, normalizeRegion } from "@/lib/scan-types";

const REGION_FLAGS: Record<string, string> = {
  "western-world": "\u{1F1FA}\u{1F1F8}",
  "europe": "\u{1F1EA}\u{1F1FA}",
  "middle-east": "\u{1F54C}",
  "south-asia": "\u{1F1EE}\u{1F1F3}",
  "east-se-asia": "\u{1F30F}",
  "africa": "\u{1F30D}",
  "latin-americas": "\u{1F30E}",
};

const REGION_SHORT: Record<string, string> = {
  "western-world": "US",
  "europe": "EU",
  "middle-east": "MENA",
  "south-asia": "S. Asia",
  "east-se-asia": "E. Asia",
  "africa": "Africa",
  "latin-americas": "LatAm",
};

export function RegionBar({
  regions,
  size = "default",
}: {
  regions: string[];
  size?: "default" | "compact";
}) {
  const normalised = [...new Set(
    regions.filter((r) => r !== "global").map((r) => normalizeRegion(r))
  )];

  return (
    <div className="flex flex-wrap items-center gap-1">
      {DISPLAY_REGIONS.map((region) => {
        const covered = normalised.includes(region);
        return (
          <span
            key={region}
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-[family-name:var(--font-inter)] ${
              size === "compact" ? "text-[9px]" : "text-[10px]"
            } font-medium uppercase tracking-wider transition-opacity ${
              covered
                ? "bg-black/[0.05] text-zinc-600 dark:bg-white/[0.08] dark:text-zinc-300"
                : "bg-black/[0.02] text-zinc-300 dark:bg-white/[0.02] dark:text-zinc-700"
            }`}
          >
            <span className={covered ? "" : "grayscale opacity-40"}>
              {REGION_FLAGS[region]}
            </span>
            {REGION_SHORT[region] || REGION_LABELS[region] || region}
          </span>
        );
      })}
    </div>
  );
}
