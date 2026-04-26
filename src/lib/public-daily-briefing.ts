import type { ScanItemInput } from './relevance-engine';
import {
  normalisePublicCategory,
  rankPublicStories,
  selectPublicStories,
  type PublicStorySelection,
} from './public-story-selection';
import {
  PUBLIC_EDITORIAL_CONTRACT,
  describeDoctrineMix,
  getPublicDoctrineLaneSpec,
  summarizeDoctrineMix,
  type PublicDoctrineLane,
} from './public-editorial-doctrine';
import {
  buildPublicEditionScorecard,
  type PublicEditionArticleEntry,
  type PublicEditionScorecard,
} from './public-edition-scorecard';

export interface DailyBriefingSectionItem {
  slot: 'lead-thesis' | 'must-know' | 'underseen' | 'perception-gap' | 'watchpoint';
  headline: string;
  category: string;
  region: string;
  lane: PublicDoctrineLane;
  laneLabel: string;
  laneBehavior: string;
  summary: string;
  why?: string;
}

export interface DailyBriefingPackage {
  date: string;
  doctrineVersion: string;
  title: string;
  thesis: string;
  doctrineSummary: string;
  laneMix: Array<{ lane: PublicDoctrineLane; label: string; count: number; editorialRole: string }>;
  scorecard: PublicEditionScorecard;
  mustKnow: DailyBriefingSectionItem[];
  underseen: DailyBriefingSectionItem | null;
  perceptionGap: DailyBriefingSectionItem | null;
  watchpoint: DailyBriefingSectionItem | null;
  contentMd: string;
  topStories: DailyBriefingSectionItem[];
}

function clean(value: string | null | undefined): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sentence(value: string | null | undefined): string {
  const text = clean(value);
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function titleCaseRegion(region: string | null | undefined): string {
  const text = clean(region || 'global').replace(/[-_]+/g, ' ');
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

function categoryLabel(category: string | null | undefined): string {
  return normalisePublicCategory(String(category || 'current-events')).replace(/-/g, ' ');
}

function primaryRegion(entry: PublicStorySelection): string {
  return clean(entry.item.regions?.[0]) || 'global';
}

function itemSummary(entry: PublicStorySelection): string {
  const base = sentence(entry.item.connection || entry.articleSignals?.coreFact || entry.item.headline);
  const mechanism = clean(entry.articleSignals?.mechanism);
  if (!mechanism) return base;
  if (base.toLowerCase().includes(mechanism.toLowerCase())) return base;
  return `${base} Mechanism: ${mechanism}.`;
}

function itemWhy(entry: PublicStorySelection): string {
  const walkaway = clean(entry.articleSignals?.framingTension || entry.articleSignals?.novelty || entry.articleOpportunity);
  return sentence(walkaway || 'Worth tracking for what it changes next');
}

function toSectionItem(entry: PublicStorySelection, slot: DailyBriefingSectionItem['slot']): DailyBriefingSectionItem {
  const laneSpec = getPublicDoctrineLaneSpec(entry.doctrineLane);
  return {
    slot,
    headline: clean(entry.item.headline),
    category: normalisePublicCategory(entry.categoryKey),
    region: primaryRegion(entry),
    lane: entry.doctrineLane,
    laneLabel: laneSpec.label,
    laneBehavior: laneSpec.briefingBehavior,
    summary: itemSummary(entry),
    why: itemWhy(entry),
  };
}

function scoreNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function thesisFromEntries(entries: PublicStorySelection[]): string {
  if (!entries.length) return 'The day is being shaped by several unrelated signals rather than one clean dominant story.';

  const laneCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  for (const entry of entries) {
    laneCounts.set(entry.lane, (laneCounts.get(entry.lane) || 0) + 1);
    categoryCounts.set(entry.categoryKey, (categoryCounts.get(entry.categoryKey) || 0) + 1);
  }

  const topLane = [...laneCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';
  const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'current-events';

  if (topLane === 'war-system') {
    return 'The shape of the day is not just conflict at the surface but the downstream systems it is bending: logistics, prices, access, and political room to manoeuvre.';
  }
  if (topLane === 'human') {
    return 'The day resolves into lived pressure points: policy and headline shifts matter chiefly because they are landing in homes, clinics, schools, and local supply lines.';
  }
  if (topLane === 'climate') {
    return 'The day is being shaped by infrastructure and environmental strain that now reads less like backdrop and more like operating reality.';
  }
  if (topLane === 'tech-science') {
    return 'The shape of the day is a quiet capability shift: technical and scientific signals are starting to change the practical baseline faster than the headlines suggest.';
  }

  return `The day is cohering around ${categoryLabel(topCategory)} pressures that are crossing regions and showing up in several different forms at once.`;
}

function buildTitle(thesis: string, lead: PublicStorySelection | undefined, date: string): string {
  const trimmed = thesis.replace(/^The shape of the day is\s*/i, '').trim();
  if (trimmed && trimmed.length <= 120) {
    const title = trimmed[0].toUpperCase() + trimmed.slice(1);
    return title.endsWith('.') ? title.slice(0, -1) : title;
  }
  return clean(lead?.item.headline) || `Albis Daily — ${date}`;
}

function pickFirst(pool: PublicStorySelection[], used: Set<string>, predicate: (entry: PublicStorySelection) => boolean): PublicStorySelection | null {
  for (const entry of pool) {
    if (used.has(entry.duplicateKey)) continue;
    if (!predicate(entry)) continue;
    used.add(entry.duplicateKey);
    return entry;
  }
  return null;
}

function buildMarkdown(pkg: Omit<DailyBriefingPackage, 'contentMd'>): string {
  const lines: string[] = [];
  lines.push('## Lead thesis');
  lines.push(pkg.thesis);
  lines.push('');
  lines.push('## Must-know signals');
  for (const item of pkg.mustKnow) {
    lines.push(`- **${item.headline}** (${categoryLabel(item.category)} · ${titleCaseRegion(item.region)}) — ${item.summary}`);
  }
  if (pkg.underseen) {
    lines.push('');
    lines.push('## Underseen signal');
    lines.push(`- **${pkg.underseen.headline}** (${categoryLabel(pkg.underseen.category)} · ${titleCaseRegion(pkg.underseen.region)}) — ${pkg.underseen.summary}`);
  }
  if (pkg.perceptionGap) {
    lines.push('');
    lines.push('## Perception gap');
    lines.push(`- **${pkg.perceptionGap.headline}** (${categoryLabel(pkg.perceptionGap.category)} · ${titleCaseRegion(pkg.perceptionGap.region)}) — ${pkg.perceptionGap.summary}`);
  }
  if (pkg.watchpoint) {
    lines.push('');
    lines.push('## Watchpoint');
    lines.push(`- **${pkg.watchpoint.headline}** (${categoryLabel(pkg.watchpoint.category)} · ${titleCaseRegion(pkg.watchpoint.region)}) — ${pkg.watchpoint.why || pkg.watchpoint.summary}`);
  }
  lines.push('');
  lines.push('## Public doctrine');
  lines.push(`- Contract: ${PUBLIC_EDITORIAL_CONTRACT.name} (${pkg.doctrineVersion})`);
  lines.push(`- Lane mix: ${pkg.doctrineSummary}`);
  lines.push('');
  lines.push('## Edition scorecard');
  lines.push(`- Summary: ${pkg.scorecard.summary}`);
  for (const metric of pkg.scorecard.metrics) {
    lines.push(`- ${metric.label}: ${metric.summary} (${metric.status})`);
  }
  return lines.join('\n');
}

export function buildDailyBriefingPackage(
  briefingDate: string,
  items: ScanItemInput[],
  articleEntries: PublicEditionArticleEntry[] = [],
): DailyBriefingPackage {
  const ranked = rankPublicStories(items);
  const mustKnowCount = Math.max(3, Math.min(5, items.length >= 14 ? 5 : items.length >= 9 ? 4 : 3));
  const mustKnowEntries = selectPublicStories(items, mustKnowCount, mustKnowCount);
  const used = new Set(mustKnowEntries.map((entry) => entry.duplicateKey));

  const underseenEntry = pickFirst(
    [...ranked].sort((a, b) => scoreNumber(a.item.coverage_breadth) - scoreNumber(b.item.coverage_breadth) || b.score - a.score),
    used,
    (entry) => entry.writeabilityScore >= 2.4 && entry.specificity >= 0.8,
  );

  const perceptionGapEntry = pickFirst(
    [...ranked].sort((a, b) => scoreNumber(b.item.perception_gap) - scoreNumber(a.item.perception_gap) || b.score - a.score),
    used,
    (entry) => scoreNumber(entry.item.perception_gap) >= 4,
  );

  const watchpointEntry = pickFirst(
    ranked,
    used,
    (entry) => ['system-shift', 'turning-point', 'numbers-watch'].includes(entry.articleForm),
  ) || ranked.find((entry) => !mustKnowEntries.some((picked) => picked.duplicateKey === entry.duplicateKey)) || null;

  const thesisPool = [mustKnowEntries[0], ...mustKnowEntries.slice(1, 3), underseenEntry, perceptionGapEntry].filter(Boolean) as PublicStorySelection[];
  const thesis = thesisFromEntries(thesisPool);
  const title = buildTitle(thesis, mustKnowEntries[0], briefingDate);
  const doctrineEntries = [
    ...mustKnowEntries,
    ...(underseenEntry ? [underseenEntry] : []),
    ...(perceptionGapEntry ? [perceptionGapEntry] : []),
    ...(watchpointEntry ? [watchpointEntry] : []),
  ];
  const laneMix = summarizeDoctrineMix(doctrineEntries);
  const doctrineSummary = describeDoctrineMix(doctrineEntries);

  const mustKnow = mustKnowEntries.map((entry) => toSectionItem(entry, 'must-know'));
  const underseen = underseenEntry ? toSectionItem(underseenEntry, 'underseen') : null;
  const perceptionGap = perceptionGapEntry ? toSectionItem(perceptionGapEntry, 'perception-gap') : null;
  const watchpoint = watchpointEntry ? toSectionItem(watchpointEntry, 'watchpoint') : null;

  const topStories = [
    ...mustKnow,
    ...(underseen ? [underseen] : []),
    ...(perceptionGap ? [perceptionGap] : []),
    ...(watchpoint ? [watchpoint] : []),
  ];
  const scorecard = buildPublicEditionScorecard({
    briefingEntries: topStories.map((item) => ({
      slot: item.slot === 'lead-thesis' ? 'must-know' : item.slot,
      headline: item.headline,
      lane: item.lane,
    })),
    articleEntries,
  });

  const pkgBase = {
    date: briefingDate,
    doctrineVersion: PUBLIC_EDITORIAL_CONTRACT.version,
    title,
    thesis,
    doctrineSummary,
    laneMix,
    scorecard,
    mustKnow,
    underseen,
    perceptionGap,
    watchpoint,
    topStories,
  };

  return {
    ...pkgBase,
    contentMd: buildMarkdown(pkgBase),
  };
}
