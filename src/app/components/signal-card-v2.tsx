import Link from "next/link";
import type { Signal } from "@/lib/signals";
import { TrustStack, type TrustStackProps } from "./trust-stack";

type SignalType = "most_covered" | "gap_widening" | "undercovered" | "needs_verification" | "attention_rising";

type SignalCardV2Props = {
  signal: Signal;
  signalType?: SignalType;
  variant?: "feature" | "feed" | "compact";
  rank?: number;
};

const SIGNAL_LABELS: Record<SignalType, { label: string; helper: string; tone: string }> = {
  most_covered: {
    label: "Most covered",
    helper: "Broad global attention",
    tone: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300",
  },
  gap_widening: {
    label: "Gap widening",
    helper: "Frames are diverging",
    tone: "border-[#c8922a]/35 bg-[#c8922a]/10 text-[#8a6417] dark:text-[#f0c15e]",
  },
  undercovered: {
    label: "Undercovered",
    helper: "Important but unevenly seen",
    tone: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  needs_verification: {
    label: "Needs verification",
    helper: "Context or sources needed",
    tone: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  attention_rising: {
    label: "Attention rising",
    helper: "Signal is moving",
    tone: "border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  },
};

function getNumber(meta: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function getStringArray(meta: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = meta[key];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
  }
  return [];
}

function getString(meta: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function humanise(value: string | null) {
  if (!value) return "Albis";
  return value.replaceAll("-", " ");
}

function inferSignalType(signal: Signal): SignalType {
  const meta = signal.metadata || {};
  const explicit = getString(meta, ["signal_type", "signalType", "type"]);
  if (explicit) {
    const safe = explicit.toLowerCase().replace(/[\s-]/g, "_");
    if (["most_covered", "gap_widening", "undercovered", "needs_verification", "attention_rising"].includes(safe)) return safe as SignalType;
  }
  const tags = signal.tags.map((tag) => tag.toLowerCase());
  const category = (signal.category || "").toLowerCase();
  if (signal.still_unclear || tags.some((tag) => tag.includes("verify") || tag.includes("developing"))) return "needs_verification";
  if (tags.some((tag) => tag.includes("blindspot") || tag.includes("missing") || tag.includes("undercovered")) || category.includes("perspectives")) return "undercovered";
  const pgi = getNumber(meta, ["pgi", "pgiScore", "perception_gap", "perceptionGap"]);
  if (typeof pgi === "number" && pgi >= 6.5) return "gap_widening";
  if ((signal.priority || 0) >= 80) return "most_covered";
  return "attention_rising";
}

function buildTrust(signal: Signal): TrustStackProps {
  const meta = signal.metadata || {};
  const sourceCount = getNumber(meta, ["source_count", "sourceCount", "sources", "sources_scanned"]);
  const regionCount = getNumber(meta, ["region_count", "regionCount", "regions", "regions_found"]);
  const languageCount = getNumber(meta, ["language_count", "languageCount", "languages"]);
  const pgiScore = getNumber(meta, ["pgi", "pgiScore", "perception_gap", "perceptionGap"]);
  const gaiScore = getNumber(meta, ["gai", "gaiScore", "coverage_gap", "coverageGap"]);
  const correctionsCount = getNumber(meta, ["corrections", "correctionsCount", "correction_count"]);
  const confidence = getString(meta, ["confidence", "verification_status", "verificationStatus"]) || (signal.still_unclear ? "needs_context" : "developing");
  return {
    confidence,
    sourceCount,
    regionCount: regionCount || (signal.region ? 1 : null),
    languageCount,
    pgiScore,
    gaiScore,
    correctionsCount,
    readerReportCount: signal.comment_count || null,
    lastUpdated: signal.updated_at || signal.published_at,
    missingLocalConfirmation: Boolean(signal.still_unclear),
  };
}

function getRegions(signal: Signal) {
  const meta = signal.metadata || {};
  const present = getStringArray(meta, ["regions_present", "regionsPresent", "regions_found", "regionsFound"]);
  const missing = getStringArray(meta, ["regions_missing", "regionsMissing", "missing_regions", "missingRegions"]);
  if (present.length === 0 && signal.region) present.push(signal.region);
  return { present, missing };
}

export function SignalCardV2({ signal, signalType, variant = "feed", rank }: SignalCardV2Props) {
  const type = signalType || inferSignalType(signal);
  const signalMeta = SIGNAL_LABELS[type];
  const trust = buildTrust(signal);
  const { present, missing } = getRegions(signal);
  const isFeature = variant === "feature";
  const href = `/signals/${signal.slug}`;
  const bullets = signal.bullets.slice(0, isFeature ? 3 : 2);

  return (
    <article className={`group flex h-full flex-col border border-black/[0.08] bg-white transition hover:border-[#c8922a]/35 dark:border-white/[0.08] dark:bg-white/[0.035] ${
      isFeature ? "rounded-[1.5rem] p-5 md:p-6" : "rounded-[1.25rem] p-4"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {typeof rank === "number" ? <span className="font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-400">#{rank}</span> : null}
          <span className={`rounded-full border px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] ${signalMeta.tone}`}>
            {signalMeta.label}
          </span>
          <span className="hidden font-[family-name:var(--font-inter)] text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400 sm:inline">
            {signalMeta.helper}
          </span>
        </div>
        <span className="shrink-0 font-[family-name:var(--font-inter)] text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {humanise(signal.category)}
        </span>
      </div>

      <Link href={href} className="mt-4 block">
        <h2 className={`font-[family-name:var(--font-playfair)] font-bold leading-tight tracking-tight text-[#111] transition group-hover:text-[#b58320] dark:text-[#f4f1ea] ${isFeature ? "text-2xl md:text-[1.7rem]" : "text-lg"}`}>
          {signal.title}
        </h2>
      </Link>

      {signal.summary ? (
        <p className={`mt-3 leading-relaxed text-zinc-600 dark:text-zinc-300 ${isFeature ? "text-[15px]" : "line-clamp-2 text-sm"}`}>
          {signal.summary}
        </p>
      ) : null}

      {bullets.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8922a]" />
              <span className={isFeature ? "" : "line-clamp-2"}>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        <TrustStack {...trust} size={isFeature ? "default" : "compact"} />
      </div>

      {(present.length > 0 || missing.length > 0) && isFeature ? (
        <div className="mt-4 grid gap-2 border-t border-black/[0.06] pt-4 text-xs dark:border-white/[0.06] sm:grid-cols-2">
          {present.length > 0 ? (
            <div>
              <p className="font-[family-name:var(--font-inter)] font-bold uppercase tracking-[0.14em] text-zinc-400">Seen in</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-300">{present.slice(0, 4).map(humanise).join(", ")}</p>
            </div>
          ) : null}
          {missing.length > 0 ? (
            <div>
              <p className="font-[family-name:var(--font-inter)] font-bold uppercase tracking-[0.14em] text-zinc-400">Missing from</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-300">{missing.slice(0, 4).map(humanise).join(", ")}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link href={href} className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black dark:hover:bg-[#f0c15e]">
          Open signal
        </Link>
        <Link href={`${href}#context`} className="rounded-full border border-black/[0.1] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 hover:border-[#c8922a]/40 hover:text-[#b58320] dark:border-white/[0.1] dark:text-zinc-300">
          Add context
        </Link>
      </div>
    </article>
  );
}

export { inferSignalType };
export type { SignalType };
