import type { ArticleForm } from './public-story-selection';
import type { PublicDoctrineLane } from './public-editorial-doctrine';

export const PUBLIC_EDITION_SCORECARD_VERSION = 'phase7-public-edition-scorecard-v1';

export type PublicEditionMetricStatus = 'pass' | 'warn' | 'fail' | 'pending';

export interface PublicEditionScorecardMetric {
  key: 'lane-diversity' | 'non-clumping' | 'package-balance' | 'briefing-article-alignment';
  label: string;
  status: PublicEditionMetricStatus;
  summary: string;
  detail: string;
}

export interface PublicEditionBriefingEntry {
  slot: 'must-know' | 'underseen' | 'perception-gap' | 'watchpoint';
  headline: string;
  lane: PublicDoctrineLane;
}

export interface PublicEditionArticleEntry {
  headline: string;
  doctrineLane: PublicDoctrineLane | null;
  articleForm?: ArticleForm | null;
  duplicateKey?: string | null;
}

export interface PublicEditionScorecard {
  version: string;
  summary: string;
  score: number;
  maxScore: number;
  metrics: PublicEditionScorecardMetric[];
  warnings: string[];
  laneSequence: PublicDoctrineLane[];
  uniqueLaneCount: number;
  adjacentLaneRepeats: number;
  slotCoverage: {
    mustKnowCount: number;
    hasUnderseen: boolean;
    hasPerceptionGap: boolean;
    hasWatchpoint: boolean;
  };
  articleAlignment: {
    status: PublicEditionMetricStatus;
    sharedCount: number;
    articleCount: number;
    briefingCount: number;
    overlapRatio: number | null;
    briefingOnlyCount: number;
    articleOnlyCount: number;
  };
}

function toHeadlineKey(value: string | null | undefined): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 10)
    .join(' ');
}

function metricPoints(status: PublicEditionMetricStatus): number {
  switch (status) {
    case 'pass':
      return 2;
    case 'warn':
    case 'pending':
      return 1;
    case 'fail':
    default:
      return 0;
  }
}

function metricSummary(status: PublicEditionMetricStatus): string {
  switch (status) {
    case 'pass':
      return 'pass';
    case 'warn':
      return 'watch';
    case 'pending':
      return 'pending';
    case 'fail':
    default:
      return 'miss';
  }
}

export function buildPublicEditionScorecard(input: {
  briefingEntries: PublicEditionBriefingEntry[];
  articleEntries?: PublicEditionArticleEntry[];
}): PublicEditionScorecard {
  const briefingEntries = input.briefingEntries || [];
  const articleEntries = input.articleEntries || [];

  const laneSequence = briefingEntries.map((entry) => entry.lane);
  const uniqueLaneCount = new Set(laneSequence).size;
  const diversityTarget = briefingEntries.length >= 6 ? 4 : briefingEntries.length >= 4 ? 3 : Math.min(2, briefingEntries.length || 0);
  const laneDiversityStatus: PublicEditionMetricStatus =
    uniqueLaneCount >= diversityTarget ? 'pass' : uniqueLaneCount >= Math.max(1, diversityTarget - 1) ? 'warn' : 'fail';

  let adjacentLaneRepeats = 0;
  for (let i = 1; i < laneSequence.length; i += 1) {
    if (laneSequence[i] === laneSequence[i - 1]) adjacentLaneRepeats += 1;
  }
  const nonClumpingStatus: PublicEditionMetricStatus =
    adjacentLaneRepeats === 0 ? 'pass' : adjacentLaneRepeats === 1 && uniqueLaneCount >= 3 ? 'warn' : 'fail';

  const mustKnowCount = briefingEntries.filter((entry) => entry.slot === 'must-know').length;
  const hasUnderseen = briefingEntries.some((entry) => entry.slot === 'underseen');
  const hasPerceptionGap = briefingEntries.some((entry) => entry.slot === 'perception-gap');
  const hasWatchpoint = briefingEntries.some((entry) => entry.slot === 'watchpoint');
  const balanceHits = [mustKnowCount >= 3, hasUnderseen, hasPerceptionGap, hasWatchpoint].filter(Boolean).length;
  const packageBalanceStatus: PublicEditionMetricStatus = balanceHits === 4 ? 'pass' : balanceHits === 3 ? 'warn' : 'fail';

  const briefingKeys = new Set(briefingEntries.map((entry) => toHeadlineKey(entry.headline)).filter(Boolean));
  const articleKeys = new Set(articleEntries.map((entry) => entry.duplicateKey || toHeadlineKey(entry.headline)).filter(Boolean));
  const sharedCount = [...articleKeys].filter((key) => briefingKeys.has(key)).length;
  const overlapRatio = articleKeys.size ? sharedCount / articleKeys.size : null;
  const articleOnlyCount = [...articleKeys].filter((key) => !briefingKeys.has(key)).length;
  const briefingOnlyCount = [...briefingKeys].filter((key) => !articleKeys.has(key)).length;

  let alignmentStatus: PublicEditionMetricStatus = 'pending';
  if (articleKeys.size > 0) {
    alignmentStatus = overlapRatio === 1 ? 'pass' : (overlapRatio || 0) >= 0.66 ? 'warn' : 'fail';
  }

  const metrics: PublicEditionScorecardMetric[] = [
    {
      key: 'lane-diversity',
      label: 'Lane diversity',
      status: laneDiversityStatus,
      summary: `${uniqueLaneCount}/${Math.max(diversityTarget, 1)} unique lanes`,
      detail: `Edition surfaced ${uniqueLaneCount} doctrine lane(s) across ${briefingEntries.length} public slots.`,
    },
    {
      key: 'non-clumping',
      label: 'Non-clumping',
      status: nonClumpingStatus,
      summary: adjacentLaneRepeats === 0 ? 'No adjacent lane repeats' : `${adjacentLaneRepeats} adjacent lane repeat(s)`,
      detail: `Lane sequence: ${laneSequence.join(' → ') || 'none'}`,
    },
    {
      key: 'package-balance',
      label: 'Package balance',
      status: packageBalanceStatus,
      summary: `${balanceHits}/4 package checks hit`,
      detail: `Must-know ${mustKnowCount}, underseen ${hasUnderseen ? 'yes' : 'no'}, perception gap ${hasPerceptionGap ? 'yes' : 'no'}, watchpoint ${hasWatchpoint ? 'yes' : 'no'}.`,
    },
    {
      key: 'briefing-article-alignment',
      label: 'Briefing/article alignment',
      status: alignmentStatus,
      summary: articleKeys.size ? `${sharedCount}/${articleKeys.size} article picks reflected in the briefing` : 'No article set supplied yet',
      detail: articleKeys.size
        ? `Shared ${sharedCount}; briefing-only ${briefingOnlyCount}; article-only ${articleOnlyCount}.`
        : 'Run with article outputs to verify package alignment.',
    },
  ];

  const score = metrics.reduce((sum, metric) => sum + metricPoints(metric.status), 0);
  const maxScore = metrics.length * 2;
  const warnings = metrics
    .filter((metric) => metric.status !== 'pass')
    .map((metric) => `${metric.label}: ${metric.summary}`);

  return {
    version: PUBLIC_EDITION_SCORECARD_VERSION,
    summary: metrics.map((metric) => `${metric.label} ${metricSummary(metric.status)}`).join(' · '),
    score,
    maxScore,
    metrics,
    warnings,
    laneSequence,
    uniqueLaneCount,
    adjacentLaneRepeats,
    slotCoverage: {
      mustKnowCount,
      hasUnderseen,
      hasPerceptionGap,
      hasWatchpoint,
    },
    articleAlignment: {
      status: alignmentStatus,
      sharedCount,
      articleCount: articleKeys.size,
      briefingCount: briefingKeys.size,
      overlapRatio,
      briefingOnlyCount,
      articleOnlyCount,
    },
  };
}
