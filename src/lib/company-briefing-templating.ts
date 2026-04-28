// ---------------------------------------------------------------------------
// Company briefing templating — legacy compatibility helpers.
//
// Produces the retired `what_changed` / `what_to_watch` shape. Keep this
// only while old dashboard/history rows need a readable representation.
// New customer-facing generation must use the Package 8 evidence packet,
// QA gates, and v2 briefing output.
//
// Pure functions. No Supabase. No network.
// ---------------------------------------------------------------------------
import type { CompanyProfile } from "./company-profile";
import type { ScoredStory } from "./relevance-engine";
import { determineSignalLevel } from "./relevance-engine";
import type { BriefingContent } from "./email-templates/company-briefing";

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function buildScanFocus(stories: ScoredStory[]): string {
  if (!stories.length) return "No material change";
  const topTags = unique(stories.flatMap((s) => s.tags)).slice(0, 3);
  if (topTags.length > 0) return topTags.join(", ");
  const topCategories = unique(stories.map((s) => s.category)).slice(0, 2);
  return topCategories.join(", ") || "Global risk movement";
}

export function buildWhyItMatters(profile: CompanyProfile, stories: ScoredStory[]): string {
  const sector = profile.sector?.replace(/-/g, " ") || "operations";
  const regions = profile.regions.slice(0, 3).join(", ");
  const dominant = stories[0];
  if (!dominant) {
    return `Nothing in today's scan crossed Albis's relevance threshold strongly enough to justify a custom alert for ${profile.company_name}, but the system remains active and watching for changes that affect ${sector}.`;
  }
  return `${dominant.headline} is the clearest signal for ${profile.company_name} because it touches ${sector}${regions ? ` across ${regions}` : ""}. The main implication is not just the event itself, but the knock-on effect on supply continuity, cost pressure, and strategic planning over the next few days.`;
}

export function buildRegionalFraming(stories: ScoredStory[]): string | undefined {
  const story = stories.find((s) => s.regions.length > 1);
  if (!story) return undefined;
  return `Coverage is spread across ${story.regions.slice(0, 4).join(", ")}, which suggests this is being treated as a cross-regional systems story rather than a narrow local event.`;
}

export function buildWhatToWatch(profile: CompanyProfile, stories: ScoredStory[]) {
  const watch = stories.slice(0, 3).map((story) => ({
    monitor_point: `Watch whether ${story.headline.charAt(0).toLowerCase() + story.headline.slice(1)} produces a second-order move in pricing, routing, policy, or availability.`,
    timeframe: "next 24-72 hours",
  }));

  if (watch.length === 0) {
    watch.push({
      monitor_point: `Watch for fresh stories affecting ${profile.company_name}'s tracked themes: ${profile.tracked_themes.slice(0, 3).join(", ") || "core operations"}.`,
      timeframe: "this week",
    });
  }

  return watch;
}

export function buildBriefingContent(
  profile: CompanyProfile,
  scanDate: string,
  signalLevel: ReturnType<typeof determineSignalLevel>,
  stories: ScoredStory[]
): BriefingContent {
  return {
    header: {
      company_name: profile.company_name,
      date: scanDate,
      scan_focus: buildScanFocus(stories),
      signal_level: signalLevel,
    },
    what_changed: stories.slice(0, 8).map((story) => ({
      headline: story.headline,
      summary: story.connection,
      match_reasons: story.match_reasons,
    })),
    why_it_matters: buildWhyItMatters(profile, stories),
    what_to_watch: buildWhatToWatch(profile, stories),
    regional_framing: buildRegionalFraming(stories),
  };
}
