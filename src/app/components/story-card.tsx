import Link from "next/link";
import { CATEGORY_META, normalizeRegion, type ScanItem } from "@/lib/scan-types";
import type { BlogPost } from "@/lib/blog";
import { getPostUrl } from "@/lib/post-url";
import { RegionBar } from "./region-bar";

// ────────────────────────────────────────────────────────────────
// Props — accepts either a ScanItem or a BlogPost
// ────────────────────────────────────────────────────────────────

interface StoryCardProps {
  variant: "large" | "medium" | "small";
  item?: ScanItem;
  post?: BlogPost;
  slug?: string | null;
  /** Override the date shown in freshness line */
  date?: string;
  /** Override region count */
  regionCount?: number;
}

// ────────────────────────────────────────────────────────────────
// Category mapping — map our nav categories back to scan categories
// ────────────────────────────────────────────────────────────────

const NAV_CATEGORY_MAP: Record<string, string[]> = {
  world: ["current-events", "geopolitics", "conflict"],
  politics: ["governance"],
  business: ["economic-flows"],
  technology: ["tech-ai", "cyber-info-warfare"],
  health: ["health"],
  science: ["science-space"],
};

function getCategoryDisplay(category: string): { label: string; accent: string } {
  // Direct match from CATEGORY_META
  if (CATEGORY_META[category]) {
    return { label: CATEGORY_META[category].label, accent: CATEGORY_META[category].accent };
  }
  // Nav category fallback
  for (const [navCat, scanCats] of Object.entries(NAV_CATEGORY_MAP)) {
    if (scanCats.includes(category)) {
      return { label: navCat.charAt(0).toUpperCase() + navCat.slice(1), accent: CATEGORY_META[scanCats[0]]?.accent || "#c8922a" };
    }
  }
  return { label: category, accent: "#c8922a" };
}

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

export function StoryCard({ variant, item, post, slug, date, regionCount }: StoryCardProps) {
  // Derive display values from either source
  const headline = item?.headline || post?.title || "";
  const description = item?.connection || post?.description || "";
  const category = item?.category || (post?.category as string) || "";
  const regions = item
    ? [...new Set(item.regions.filter((r) => r !== "global").map((r) => normalizeRegion(r)))]
    : [];
  const isBlindspot = item?.blindspot?.isBlindspot === true;
  const missingFrom = item?.blindspot?.missingFrom || [];
  const displayDate = date || post?.date || "";
  const regionCt = regionCount ?? regions.length;

  const { label: catLabel, accent: catAccent } = getCategoryDisplay(category);

  const href = slug ? `/lens/${slug}` : post ? getPostUrl(post) : null;

  // ── Freshness line ──
  const freshnessText = regionCt > 0
    ? `Scanned from ${regionCt} region${regionCt !== 1 ? "s" : ""}`
    : null;

  // ── LARGE card ──
  if (variant === "large") {
    const content = (
      <article className="group relative rounded-2xl border border-black/[0.06] bg-white p-6 md:p-8 transition-shadow hover:shadow-lg dark:border-white/[0.06] dark:bg-[#1a1a1a]">
        {/* Category tag */}
        <div className="flex items-center justify-between">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 font-[family-name:var(--font-inter)] text-[10px] font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: catAccent }}
          >
            {catLabel}
          </span>
          {isBlindspot && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              Blindspot
            </span>
          )}
        </div>

        {/* Headline */}
        <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-xl md:text-2xl font-bold leading-tight text-[#0f0f0f] dark:text-[#f0efec]">
          {headline}
        </h3>

        {/* Description */}
        {description && (
          <p className="mt-2 font-[family-name:var(--font-source-serif)] text-sm md:text-base leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {description}
          </p>
        )}

        {/* Region bar */}
        {regions.length > 0 && (
          <div className="mt-4">
            <RegionBar regions={regions} />
          </div>
        )}

        {/* Blindspot warning */}
        {isBlindspot && missingFrom.length > 0 && (
          <p className="mt-2 font-[family-name:var(--font-inter)] text-[10px] font-medium text-amber-600 dark:text-amber-400">
            Missing from: {missingFrom.slice(0, 3).map((r) => CATEGORY_META[r]?.label || r.replace(/-/g, " ")).join(", ")}
          </p>
        )}

        {/* Trust signal */}
        {freshnessText && (
          <p className="mt-3 font-[family-name:var(--font-inter)] text-[11px] text-zinc-400 dark:text-zinc-500">
            {freshnessText}
          </p>
        )}
      </article>
    );

    return href ? (
      <Link href={href} className="block">
        {content}
      </Link>
    ) : content;
  }

  // ── MEDIUM card ──
  if (variant === "medium") {
    const content = (
      <article className="group relative rounded-xl border border-black/[0.06] bg-white p-5 transition-shadow hover:shadow-md dark:border-white/[0.06] dark:bg-[#1a1a1a]">
        {/* Category */}
        <span
          className="inline-block rounded-full px-2 py-0.5 font-[family-name:var(--font-inter)] text-[9px] font-semibold uppercase tracking-wider text-white"
          style={{ backgroundColor: catAccent }}
        >
          {catLabel}
        </span>

        {/* Headline */}
        <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-base md:text-lg font-bold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
          {headline}
        </h3>

        {/* Description — truncated single line */}
        {description && (
          <p className="mt-1.5 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-1">
            {description}
          </p>
        )}

        {/* Region bar */}
        {regions.length > 0 && (
          <div className="mt-3">
            <RegionBar regions={regions} size="compact" />
          </div>
        )}

        {/* Trust signal */}
        {freshnessText && (
          <p className="mt-2 font-[family-name:var(--font-inter)] text-[10px] text-zinc-400 dark:text-zinc-500">
            {freshnessText}
          </p>
        )}
      </article>
    );

    return href ? (
      <Link href={href} className="block">
        {content}
      </Link>
    ) : content;
  }

  // ── SMALL card (trending/sidebar) ──
  const content = (
    <article className="group flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        {/* Category + freshness */}
        <div className="flex items-center gap-2">
          <span
            className="inline-block rounded-full px-1.5 py-0.5 font-[family-name:var(--font-inter)] text-[8px] font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: catAccent }}
          >
            {catLabel}
          </span>
          {freshnessText && (
            <span className="font-[family-name:var(--font-inter)] text-[10px] text-zinc-400 dark:text-zinc-500">
              {freshnessText}
            </span>
          )}
        </div>

        {/* Headline */}
        <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-sm font-bold leading-snug text-[#0f0f0f] dark:text-[#f0efec] group-hover:text-[#c8922a] transition-colors">
          {headline}
        </h3>
      </div>
    </article>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : content;
}
