type Confidence = "confirmed" | "developing" | "disputed" | "unverifiable" | "needs_context";

export type TrustStackProps = {
  confidence?: Confidence | string | null;
  sourceCount?: number | null;
  regionCount?: number | null;
  languageCount?: number | null;
  pgiScore?: number | null;
  gaiScore?: number | null;
  correctionsCount?: number | null;
  readerReportCount?: number | null;
  lastUpdated?: string | null;
  missingLocalConfirmation?: boolean;
  size?: "compact" | "default" | "detail";
  className?: string;
};

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  confirmed: "Confirmed",
  developing: "Developing",
  disputed: "Disputed",
  unverifiable: "Unverifiable",
  needs_context: "Needs context",
};

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  confirmed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  developing: "border-[#c8922a]/30 bg-[#c8922a]/10 text-[#8a6417] dark:text-[#f0c15e]",
  disputed: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
  unverifiable: "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300",
  needs_context: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

function normaliseConfidence(value?: TrustStackProps["confidence"]): Confidence | null {
  if (!value) return null;
  const safe = String(value).toLowerCase().replace(/[-\s]/g, "_");
  if (safe === "needs_local_context") return "needs_context";
  if (["confirmed", "developing", "disputed", "unverifiable", "needs_context"].includes(safe)) return safe as Confidence;
  return null;
}

function formatUpdated(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins >= 0 && diffMins < 60) return diffMins <= 1 ? "Updated now" : `Updated ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours >= 0 && diffHours < 24) return `Updated ${diffHours}h ago`;
  return `Updated ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function countChip(value: number | null | undefined, singular: string, plural = `${singular}s`) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return null;
  return `${value} ${value === 1 ? singular : plural}`;
}

export function TrustStack({
  confidence,
  sourceCount,
  regionCount,
  languageCount,
  pgiScore,
  gaiScore,
  correctionsCount,
  readerReportCount,
  lastUpdated,
  missingLocalConfirmation,
  size = "default",
  className = "",
}: TrustStackProps) {
  const safeConfidence = normaliseConfidence(confidence);
  const updated = formatUpdated(lastUpdated);
  const chips = [
    countChip(sourceCount, "source"),
    countChip(regionCount, "region"),
    countChip(languageCount, "language"),
    typeof pgiScore === "number" && !Number.isNaN(pgiScore) ? `PGI ${pgiScore.toFixed(1)}` : null,
    typeof gaiScore === "number" && !Number.isNaN(gaiScore) ? `GAI ${gaiScore.toFixed(1)}` : null,
    typeof correctionsCount === "number" && correctionsCount > 0 ? `${correctionsCount} correction${correctionsCount === 1 ? "" : "s"}` : null,
    typeof readerReportCount === "number" && readerReportCount > 0 ? `${readerReportCount} reader report${readerReportCount === 1 ? "" : "s"}` : null,
    missingLocalConfirmation ? "Missing local confirmation" : null,
    updated,
  ].filter(Boolean) as string[];

  const textSize = size === "compact" ? "text-[10px]" : size === "detail" ? "text-xs" : "text-[11px]";
  const gap = size === "compact" ? "gap-1.5" : "gap-2";
  const padding = size === "compact" ? "px-2 py-0.5" : "px-2.5 py-1";

  if (!safeConfidence && chips.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center ${gap} font-[family-name:var(--font-inter)] ${textSize} ${className}`}>
      {safeConfidence ? (
        <span className={`rounded-full border ${padding} font-semibold ${CONFIDENCE_STYLES[safeConfidence]}`}>
          {CONFIDENCE_LABELS[safeConfidence]}
        </span>
      ) : null}
      {chips.map((chip) => (
        <span key={chip} className={`rounded-full border border-black/[0.08] bg-black/[0.025] ${padding} font-medium text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400`}>
          {chip}
        </span>
      ))}
    </div>
  );
}
