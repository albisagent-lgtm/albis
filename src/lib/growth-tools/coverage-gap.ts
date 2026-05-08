import { CATEGORY_META, DISPLAY_REGIONS, REGION_LABELS, detectBlindspots, normalizeRegion, type ScanItem } from '@/lib/scan-types';

export interface MissingStory {
  headline: string;
  category: string;
  categoryLabel: string;
  connection: string;
  coveredBy: string[];
  missingFrom: string[];
  coverageBreadth: number | null;
  perceptionGap: number | null;
  directionalGapSignal: number;
  evidenceBasis: string;
  evidenceWarnings: string[];
}

function significanceScore(value: ScanItem['significance']) {
  if (value === 'high') return 10;
  if (value === 'medium') return 6;
  return 3;
}

function labelRegion(region: string) {
  const normalized = normalizeRegion(region);
  return REGION_LABELS[normalized] || normalized.replace(/-/g, ' ');
}

function hasExplicitCoverageData(item: ScanItem) {
  return Boolean(item.regions_found?.length || item.regions_absent?.length || typeof item.coverage_breadth === 'number');
}

export function buildMissingStories(items: ScanItem[], targetRegion?: string): MissingStory[] {
  const withBlindspots = detectBlindspots(items);
  const normalizedTarget = targetRegion ? normalizeRegion(targetRegion) : undefined;

  return withBlindspots
    .map((item) => {
      const explicitFound = item.regions_found?.map(normalizeRegion) || [];
      const explicitAbsent = item.regions_absent?.map(normalizeRegion) || [];
      const inferredCoveredBy = item.blindspot?.coveredBy || item.regions.map(normalizeRegion);
      const coveredBy = explicitFound.length ? explicitFound : inferredCoveredBy;
      const missingFrom = explicitAbsent.length ? explicitAbsent : DISPLAY_REGIONS.filter((region) => !coveredBy.includes(region));
      const breadth = typeof item.coverage_breadth === 'number' ? item.coverage_breadth : coveredBy.length;
      const directionalGapSignal = Math.max(1, Math.min(100,
        significanceScore(item.significance) * 8 +
        missingFrom.length * 5 +
        (typeof item.perception_gap === 'number' ? item.perception_gap * 2 : 0) -
        breadth * 3
      ));
      const evidenceWarnings = [
        !explicitFound.length && !explicitAbsent.length ? 'Region presence/absence is inferred from today’s scan labels, not a proof of no coverage.' : '',
        typeof item.coverage_breadth !== 'number' ? 'Coverage breadth is estimated from detected regions.' : '',
      ].filter(Boolean);

      return {
        headline: item.headline,
        category: item.category,
        categoryLabel: CATEGORY_META[item.category]?.label || item.category.replace(/-/g, ' '),
        connection: item.connection,
        coveredBy: [...new Set(coveredBy)].map(labelRegion),
        missingFrom: [...new Set(missingFrom)].map(labelRegion),
        coverageBreadth: typeof item.coverage_breadth === 'number' ? item.coverage_breadth : null,
        perceptionGap: typeof item.perception_gap === 'number' ? item.perception_gap : null,
        directionalGapSignal,
        evidenceBasis: hasExplicitCoverageData(item)
          ? 'Uses explicit Albis coverage fields from today’s scan where available.'
          : 'Uses conservative inference from today’s regional scan labels.',
        evidenceWarnings,
        _rawMissing: missingFrom,
        _hasEnoughEvidence: Boolean(item.connection?.trim()) && coveredBy.length >= 1 && missingFrom.length >= 1,
      } as MissingStory & { _rawMissing: string[]; _hasEnoughEvidence: boolean };
    })
    .filter((story) => story._hasEnoughEvidence)
    .filter((story) => !normalizedTarget || story._rawMissing.includes(normalizedTarget))
    .sort((a, b) => b.directionalGapSignal - a.directionalGapSignal)
    .slice(0, 12)
    .map(({ _rawMissing, _hasEnoughEvidence, ...story }) => story);
}
