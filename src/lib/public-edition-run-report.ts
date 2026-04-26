import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getPublicDoctrineLaneSpec, type PublicDoctrineLane } from './public-editorial-doctrine';
import type { PublicEditionArticleEntry, PublicEditionMetricStatus, PublicEditionScorecard } from './public-edition-scorecard';

export const PUBLIC_EDITION_RUN_REPORT_VERSION = 'phase8-public-edition-run-report-v1';

export type PublicEditionRunReportSource = 'post-scan' | 'daily-briefing' | 'manual';
export type PublicEditionRunReportStatus = 'pass' | 'warn' | 'fail';

export interface PublicEditionRunReport {
  version: string;
  generatedAt: string;
  runId: string;
  date: string;
  source: PublicEditionRunReportSource;
  status: PublicEditionRunReportStatus;
  score: {
    value: number;
    max: number;
    ratio: number | null;
    summary: string;
  };
  metrics: Array<{
    key: string;
    label: string;
    status: PublicEditionMetricStatus;
    summary: string;
    detail: string;
  }>;
  laneMix: Array<{
    lane: PublicDoctrineLane;
    label: string;
    count: number;
  }>;
  laneSequence: PublicDoctrineLane[];
  articleAlignment: PublicEditionScorecard['articleAlignment'];
  articleSet: Array<{
    headline: string;
    doctrineLane: PublicDoctrineLane | null;
    articleForm?: string | null;
  }>;
  warnings: string[];
}

function overallStatus(scorecard: PublicEditionScorecard): PublicEditionRunReportStatus {
  if (scorecard.metrics.some((metric) => metric.status === 'fail')) return 'fail';
  if (scorecard.metrics.some((metric) => metric.status === 'warn' || metric.status === 'pending')) return 'warn';
  return 'pass';
}

function summarizeLaneMix(laneSequence: PublicDoctrineLane[]) {
  const counts = new Map<PublicDoctrineLane, number>();
  for (const lane of laneSequence) counts.set(lane, (counts.get(lane) || 0) + 1);
  return [...counts.entries()].map(([lane, count]) => ({
    lane,
    label: getPublicDoctrineLaneSpec(lane)?.label || lane,
    count,
  }));
}

function safeSlug(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'run';
}

export function buildPublicEditionRunReport(input: {
  date: string;
  source: PublicEditionRunReportSource;
  scorecard: PublicEditionScorecard;
  articleEntries?: PublicEditionArticleEntry[];
  runId?: string;
  generatedAt?: string;
}): PublicEditionRunReport {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const runId = input.runId || `${input.source}-${input.date}-${generatedAt.replace(/[:.]/g, '-')}`;
  const scoreRatio = input.scorecard.maxScore > 0 ? input.scorecard.score / input.scorecard.maxScore : null;

  return {
    version: PUBLIC_EDITION_RUN_REPORT_VERSION,
    generatedAt,
    runId,
    date: input.date,
    source: input.source,
    status: overallStatus(input.scorecard),
    score: {
      value: input.scorecard.score,
      max: input.scorecard.maxScore,
      ratio: scoreRatio,
      summary: input.scorecard.summary,
    },
    metrics: input.scorecard.metrics.map((metric) => ({
      key: metric.key,
      label: metric.label,
      status: metric.status,
      summary: metric.summary,
      detail: metric.detail,
    })),
    laneMix: summarizeLaneMix(input.scorecard.laneSequence),
    laneSequence: input.scorecard.laneSequence,
    articleAlignment: input.scorecard.articleAlignment,
    articleSet: (input.articleEntries || []).map((entry) => ({
      headline: entry.headline,
      doctrineLane: entry.doctrineLane,
      articleForm: entry.articleForm || null,
    })),
    warnings: input.scorecard.warnings,
  };
}

export function formatPublicEditionRunReportLine(report: PublicEditionRunReport): string {
  const warnings = report.warnings.length ? ` warnings=${report.warnings.length}` : ' warnings=0';
  const alignment = report.articleAlignment.overlapRatio == null
    ? 'alignment=pending'
    : `alignment=${report.articleAlignment.sharedCount}/${report.articleAlignment.articleCount}`;
  const lanes = report.laneMix.map((lane) => `${lane.label}:${lane.count}`).join(', ') || 'none';
  return `Public edition QA ${report.status.toUpperCase()} ${report.score.value}/${report.score.max} ${alignment}${warnings} lanes=[${lanes}]`;
}

export async function writePublicEditionRunReport(report: PublicEditionRunReport, options: { rootDir?: string } = {}) {
  const rootDir = options.rootDir || process.cwd();
  const reportDir = path.join(rootDir, 'public', 'edition-qa');
  await mkdir(reportDir, { recursive: true });

  const json = `${JSON.stringify(report, null, 2)}\n`;
  const runFile = path.join(reportDir, `${report.date}-${safeSlug(report.source)}-${safeSlug(report.runId)}.json`);
  const dateLatestFile = path.join(reportDir, `${report.date}-latest.json`);
  const latestFile = path.join(reportDir, 'latest.json');

  await Promise.all([
    writeFile(runFile, json, 'utf8'),
    writeFile(dateLatestFile, json, 'utf8'),
    writeFile(latestFile, json, 'utf8'),
  ]);

  return { runFile, dateLatestFile, latestFile };
}
