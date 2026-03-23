import type { Source, ConfidenceLevel } from "@/lib/blog";
import { REGION_LABELS } from "@/lib/scan-types";

interface SourceTransparencyProps {
  sources: Source[];
  confidence: ConfidenceLevel;
}

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { emoji: string; label: string; description: string; color: string; bg: string; border: string }> = {
  confirmed: {
    emoji: "🟢",
    label: "Confirmed",
    description: "Verified by 3+ independent sources across multiple regions",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800/40",
  },
  developing: {
    emoji: "🟡",
    label: "Developing",
    description: "Based on initial reports; verification ongoing",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  disputed: {
    emoji: "🔴",
    label: "Disputed",
    description: "Sources disagree on key facts — see details below",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800/40",
  },
  unverifiable: {
    emoji: "⚫",
    label: "Unverifiable",
    description: "Contains claims that cannot be independently verified",
    color: "text-zinc-700 dark:text-zinc-400",
    bg: "bg-zinc-50 dark:bg-zinc-900/30",
    border: "border-zinc-200 dark:border-zinc-700/40",
  },
};

const REGION_COLORS: Record<string, string> = {
  "south-asia": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "western-world": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "middle-east": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "eastern-europe": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "africa": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "east-se-asia": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  "latin-americas": "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  "global": "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-300",
};

function ExternalLinkIcon() {
  return (
    <svg className="inline-block ml-1 w-3 h-3 opacity-50" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 1.5H1.5v9h9v-3M7.5 1.5h3v3M6 6l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SourceTransparency({ sources, confidence }: SourceTransparencyProps) {
  if (sources.length === 0) {
    return (
      <div className="mt-space-12 py-6 border-t border-black/[0.05] dark:border-white/[0.05]">
        <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
          Sources for this article are being documented. Albis is building transparent source tracking for every story.
        </p>
      </div>
    );
  }

  const conf = CONFIDENCE_CONFIG[confidence];
  const uniqueRegions = [...new Set(sources.map((s) => s.region).filter(Boolean))] as string[];

  return (
    <section className="mt-space-12 rounded-2xl border border-black/[0.07] dark:border-white/[0.06] p-space-6 md:p-space-8">
      {/* Header */}
      <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#c8922a]">
        Sources &amp; Verification
      </h3>

      {/* Confidence Badge */}
      <div className={`mt-space-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${conf.bg} ${conf.border} border`}>
        <span>{conf.emoji}</span>
        <span className={conf.color}>{conf.label}</span>
        <span className="text-zinc-500 dark:text-zinc-400 font-normal">— {conf.description}</span>
      </div>

      {/* Source Count Summary */}
      <p className="mt-space-4 text-sm text-zinc-500 dark:text-zinc-400">
        Based on {sources.length} source{sources.length !== 1 ? "s" : ""} from {uniqueRegions.length} region{uniqueRegions.length !== 1 ? "s" : ""}
      </p>

      {/* Region Coverage Bar */}
      {uniqueRegions.length > 0 && (
        <div className="mt-space-3 flex flex-wrap gap-1.5">
          {uniqueRegions.map((region) => (
            <span
              key={region}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${REGION_COLORS[region] || REGION_COLORS.global}`}
            >
              {REGION_LABELS[region] || region}
            </span>
          ))}
        </div>
      )}

      {/* Source List */}
      <ul className="mt-space-4 space-y-2">
        {sources.map((source, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c8922a] hover:text-[#c8922a] dark:text-[#c8922a] dark:hover:text-[#c8922a] transition-colors"
              >
                {source.name}
                <ExternalLinkIcon />
              </a>
            ) : (
              <span className="text-zinc-700 dark:text-zinc-300">{source.name}</span>
            )}
            {source.region && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${REGION_COLORS[source.region] || REGION_COLORS.global}`}>
                {REGION_LABELS[source.region] || source.region}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
