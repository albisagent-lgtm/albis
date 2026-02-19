"use client";

import { type ScanItem, REGION_LABELS } from "@/lib/scan-types";

const REGION_COLORS: Record<string, string> = {
  "south-asia": "#8b5cf6",
  "western-world": "#3b82f6",
  "middle-east": "#f59e0b",
  "eastern-europe": "#ef4444",
  "africa": "#10b981",
  "east-se-asia": "#ec4899",
  "latin-americas": "#06b6d4",
  "global": "#a1a1aa",
};

export function PerspectiveBar({ item }: { item: ScanItem }) {
  const regions = item.regions.filter((r) => r !== "global");
  if (regions.length === 0) return null;

  const segmentWidth = 100 / regions.length;

  return (
    <div className="group/bar relative mt-2">
      <div className="flex h-[3px] w-full overflow-hidden rounded-full">
        {regions.map((region) => (
          <div
            key={region}
            className="transition-opacity"
            style={{
              width: `${segmentWidth}%`,
              backgroundColor: REGION_COLORS[region] || "#a1a1aa",
            }}
          />
        ))}
      </div>
      {/* Hover tooltip */}
      <div className="pointer-events-none absolute -top-8 left-0 right-0 flex justify-center opacity-0 transition-opacity group-hover/bar:opacity-100">
        <div className="flex gap-2 rounded-md bg-zinc-900 px-2 py-1 text-[9px] text-white shadow dark:bg-zinc-700">
          {regions.map((region) => (
            <span key={region} className="flex items-center gap-1">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: REGION_COLORS[region] || "#a1a1aa" }}
              />
              {REGION_LABELS[region] || region}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export { REGION_COLORS };
