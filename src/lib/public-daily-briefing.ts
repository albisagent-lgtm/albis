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
  score?: number | null;
  tier?: string | null;
  analysis?: string | null;
}

export interface PublicPgiScoreInput {
  story_slug?: string | null;
  story_headline: string;
  category?: string | null;
  regions_covered?: string[] | null;
  region_count?: number | null;
  story_pgi?: number | null;
  d1_factual?: number | null;
  d2_causal?: number | null;
  d3_framing?: number | null;
  d4_emotional?: number | null;
  d5_actor_context?: number | null;
  d6_cui_bono?: number | null;
  significance?: number | null;
  scoring_rationale?: string | null;
}

export interface PublicGaiScoreInput {
  story_slug?: string | null;
  story_headline: string;
  category?: string | null;
  regions_found?: string[] | null;
  regions_absent?: string[] | null;
  story_gai?: number | null;
  coverage_breadth?: number | null;
  d1_coverage_breadth?: number | null;
  d2_prominence_disparity?: number | null;
  d3_population_exposure?: number | null;
  d4_significance_severity?: number | null;
  significance?: number | null;
  scoring_rationale?: string | null;
}

export interface PublicIndexScoreInputs {
  pgi?: PublicPgiScoreInput[];
  gai?: PublicGaiScoreInput[];
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
  perceptionGapReport: string | null;
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
  const key = clean(region || 'global').toLowerCase().replace(/_/g, '-').replace(/\s*&\s*/g, '-and-').replace(/\s+/g, '-');
  const labels: Record<string, string> = {
    us: 'US',
    usa: 'US',
    'united-states': 'US',
    eu: 'EU',
    europe: 'Europe',
    'middle-east': 'Middle East',
    'south-asia': 'South Asia',
    'east-se-asia': 'East & SE Asia',
    'east-and-se-asia': 'East & SE Asia',
    africa: 'Africa',
    'latin-america': 'Latin America',
    pacific: 'Pacific',
    caribbean: 'Caribbean',
    'central-asia': 'Central Asia',
    global: 'Global',
  };
  if (labels[key]) return labels[key];
  const text = key.replace(/[-_]+/g, ' ');
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


function slugify(input: string | null | undefined): string {
  return clean(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function pgiTier(score: number): string {
  if (score <= 3) return 'Shared Understanding';
  if (score <= 5) return 'Different Lenses';
  if (score <= 7) return 'Diverging Narratives';
  return 'Competing Realities';
}

function gaiTier(score: number): string {
  if (score <= 3) return 'Broad Awareness';
  if (score <= 5) return 'Selective Visibility';
  if (score <= 7) return 'Information Shadow';
  return 'Information Desert';
}

function formatScore(value: unknown): string {
  const n = scoreNumber(value);
  return n ? n.toFixed(1) : 'n/a';
}

function gaiScore(row: PublicGaiScoreInput): number {
  const stored = scoreNumber(row.story_gai);
  if (stored > 0) return stored;
  const dims = [row.d1_coverage_breadth, row.d2_prominence_disparity, row.d3_population_exposure, row.d4_significance_severity]
    .map(scoreNumber)
    .filter((value) => value > 0);
  if (!dims.length) return 0;
  return dims.reduce((sum, value) => sum + value, 0) / dims.length;
}

const TRIBUTARY_LABELS: Record<string, string> = {
  geopolitics: 'PGI-GP',
  conflict: 'PGI-GP',
  diplomacy: 'PGI-GP',
  governance: 'PGI-GP',
  'information-warfare': 'PGI-IW',
  'cyber-info-warfare': 'PGI-IW',
  'media-literacy': 'PGI-IW',
  'tech-ai': 'PGI-TE',
  technology: 'PGI-TE',
  economics: 'PGI-EC',
  markets: 'PGI-EC',
  'economic-flows': 'PGI-EC',
  health: 'PGI-HE',
  'life-systems': 'PGI-HE',
  climate: 'PGI-CL',
  'weather-climate': 'PGI-CL',
  'climate-energy': 'PGI-CL',
  'womens-rights': 'PGI-WR',
};

function tributaryForCategory(category: string | null | undefined): string {
  const key = normalisePublicCategory(String(category || 'current-events'));
  return TRIBUTARY_LABELS[key] || (key.includes('climate') ? 'PGI-CL' : key.includes('tech') ? 'PGI-TE' : key.includes('health') ? 'PGI-HE' : key.includes('war') || key.includes('cyber') ? 'PGI-IW' : 'PGI-GP');
}

function dimensionDriver(row: PublicPgiScoreInput): string {
  const dims: Array<[string, number]> = [
    ['factual completeness', scoreNumber(row.d1_factual)] as [string, number],
    ['causal attribution', scoreNumber(row.d2_causal)] as [string, number],
    ['narrative framing', scoreNumber(row.d3_framing)] as [string, number],
    ['emotional valence', scoreNumber(row.d4_emotional)] as [string, number],
    ['actor portrayal', scoreNumber(row.d5_actor_context)] as [string, number],
    ['cui bono', scoreNumber(row.d6_cui_bono)] as [string, number],
  ].filter(([, value]) => value > 0);
  return dims.sort((a, b) => b[1] - a[1])[0]?.[0] || 'framing';
}

function compressedRationale(value: string | null | undefined, fallback: string): string {
  const raw = clean(value || '');
  const usable = raw && !/DB-truth-first scorer|verified scan items/i.test(raw) ? raw : fallback;
  const text = sentence(usable);
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map(clean)
    .filter(Boolean)
    .filter((part) => !/PGI is scored|GAI reflects|Region count/i.test(part));
  return parts.slice(0, 2).join(' ');
}

function entryForScore(row: PublicPgiScoreInput, entries: PublicStorySelection[]): PublicStorySelection | undefined {
  const slug = slugify(row.story_slug || row.story_headline);
  return entries.find((entry) => slugify(entry.item.headline) === slug) ||
    entries.find((entry) => clean(entry.item.headline).toLowerCase() === clean(row.story_headline).toLowerCase());
}

function matchGai(row: PublicPgiScoreInput, gaiRows: PublicGaiScoreInput[]): PublicGaiScoreInput | undefined {
  const slug = slugify(row.story_slug || row.story_headline);
  return gaiRows.find((g) => slugify(g.story_slug || g.story_headline) === slug) ||
    gaiRows.find((g) => slugify(g.story_headline) === slugify(row.story_headline));
}

function buildPublicPerceptionGapReport(
  entries: PublicStorySelection[],
  scores: PublicIndexScoreInputs = {},
): { report: string | null; summary: string | null; lead: PublicPgiScoreInput | null } {
  const pgiRows = (scores.pgi || []).filter((row) => scoreNumber(row.story_pgi) > 0);
  const gaiRows = (scores.gai || []).filter((row) => gaiScore(row) > 0);
  const fallbackRows: PublicPgiScoreInput[] = entries
    .filter((entry) => scoreNumber(entry.item.perception_gap) >= 4)
    .map((entry) => ({
      story_headline: entry.item.headline,
      category: entry.categoryKey,
      regions_covered: entry.item.regions,
      story_pgi: scoreNumber(entry.item.perception_gap),
      scoring_rationale: entry.item.connection || entry.articleSignals?.framingTension || null,
    }));
  const rows = (pgiRows.length ? pgiRows : fallbackRows)
    .sort((a, b) => {
      const aRegions = Math.max(scoreNumber(a.region_count), (a.regions_covered || []).length);
      const bRegions = Math.max(scoreNumber(b.region_count), (b.regions_covered || []).length);
      const aMultiRegion = aRegions >= 2 ? 1 : 0;
      const bMultiRegion = bRegions >= 2 ? 1 : 0;
      return bMultiRegion - aMultiRegion || scoreNumber(b.story_pgi) - scoreNumber(a.story_pgi);
    })
    .slice(0, 12);
  if (!rows.length) return { report: null, summary: null, lead: null };

  const lead = rows[0];
  const leadScore = scoreNumber(lead.story_pgi);
  const leadGai = matchGai(lead, gaiRows);
  const topInvisible = [...gaiRows].sort((a, b) => gaiScore(b) - gaiScore(a))[0];
  const byTrib = new Map<string, PublicPgiScoreInput[]>();
  for (const row of rows) {
    const key = tributaryForCategory(row.category || 'geopolitics');
    byTrib.set(key, [...(byTrib.get(key) || []), row]);
  }
  const tributaries = [...byTrib.entries()]
    .map(([key, values]) => ({
      key,
      values,
      avg: values.reduce((sum, row) => sum + scoreNumber(row.story_pgi), 0) / values.length,
      top: values.sort((a, b) => scoreNumber(b.story_pgi) - scoreNumber(a.story_pgi))[0],
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 4);

  const leadDriver = dimensionDriver(lead);
  const leadEntry = entryForScore(lead, entries);
  const leadRegionsList = (lead.regions_covered || []).slice(0, 4).map(titleCaseRegion);
  const leadRegions = leadRegionsList.join(', ');
  const summary = leadRegionsList.length >= 2
    ? `${clean(lead.story_headline)} is the clearest perception-gap signal today: PGI ${formatScore(lead.story_pgi)} (${pgiTier(leadScore)}), driven mainly by ${leadDriver} across ${leadRegions}.`
    : `${clean(lead.story_headline)} is the strongest available perception-gap signal today: PGI ${formatScore(lead.story_pgi)} (${pgiTier(leadScore)}), driven mainly by ${leadDriver}; coverage is too narrow to treat it as a full regional rupture.`;

  const lines: string[] = [];
  lines.push(`- **Core fracture:** ${summary}`);
  lines.push(`  ${compressedRationale(lead.scoring_rationale, leadEntry?.item.connection || leadEntry?.articleSignals?.framingTension || 'The score is high because regions share the event but not the meaning of the event.')}`);
  if (leadGai) {
    const leadGaiScore = gaiScore(leadGai);
    lines.push(`- **PGI × GAI:** This story pairs PGI ${formatScore(lead.story_pgi)} with GAI ${leadGaiScore.toFixed(1)} (${gaiTier(leadGaiScore)}). The question is therefore not only how the story is framed, but who sees it at all.`);
  }
  if (tributaries.length) {
    lines.push('- **River system:** ' + tributaries.map((t) => `${t.key} ${t.avg.toFixed(1)} (${pgiTier(t.avg)})`).join('; ') + '.');
    const hottest = tributaries[0];
    lines.push(`  The hottest stream is ${hottest.key}, led by “${clean(hottest.top.story_headline)}” at PGI ${formatScore(hottest.top.story_pgi)}. That means the heat is ${hottest.values.length > 1 ? 'structural across several stories' : 'concentrated in one sharp rupture'}, not just a category label.`);
  }
  if (topInvisible) {
    const absent = (topInvisible.regions_absent || []).slice(0, 4).map(titleCaseRegion).join(', ');
    const invisibleScore = gaiScore(topInvisible);
    lines.push(`- **Attention shadow:** “${clean(topInvisible.story_headline)}” is the strongest invisibility signal: GAI ${invisibleScore.toFixed(1)} (${gaiTier(invisibleScore)})${absent ? `, weak or absent in ${absent}` : ''}. This is the symptom/cause test: what is widely felt may not be widely explained.`);
  }
  const cui = rows.find((row) => scoreNumber(row.d6_cui_bono) >= 6) || lead;
  lines.push(`- **Cui bono read:** The strongest interest-alignment signal is “${clean(cui.story_headline)}”. The useful test is which facts each region makes lead, which facts it buries, and whose institutional interests that ordering serves.`);
  lines.push(`- **Closing insight:** The perception gap today is not just disagreement. It is selective visibility plus selective meaning: some audiences see the symptom, others see the cause, and the hottest regions often cannot agree on what the same fact proves.`);

  return { report: lines.join('\n'), summary, lead };
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
  if (pkg.perceptionGapReport || pkg.perceptionGap) {
    lines.push('');
    lines.push('## Perception gap');
    if (pkg.perceptionGapReport) {
      lines.push(pkg.perceptionGapReport);
    } else if (pkg.perceptionGap) {
      lines.push(`- **${pkg.perceptionGap.headline}** (${categoryLabel(pkg.perceptionGap.category)} · ${titleCaseRegion(pkg.perceptionGap.region)}) — ${pkg.perceptionGap.summary}`);
    }
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
  indexScores: PublicIndexScoreInputs = {},
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

  const gapReport = buildPublicPerceptionGapReport(ranked, indexScores);

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
  const perceptionGap = gapReport.lead
    ? {
        ...(perceptionGapEntry ? toSectionItem(perceptionGapEntry, 'perception-gap') : toSectionItem(ranked[0], 'perception-gap')),
        headline: gapReport.lead.story_headline,
        category: normalisePublicCategory(gapReport.lead.category || perceptionGapEntry?.categoryKey || 'geopolitics'),
        region: (gapReport.lead.regions_covered || [perceptionGapEntry ? primaryRegion(perceptionGapEntry) : 'global'])[0] || 'global',
        summary: gapReport.summary || '',
        why: gapReport.report || undefined,
        score: scoreNumber(gapReport.lead.story_pgi),
        tier: pgiTier(scoreNumber(gapReport.lead.story_pgi)),
        analysis: gapReport.report,
      }
    : perceptionGapEntry ? toSectionItem(perceptionGapEntry, 'perception-gap') : null;
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
    perceptionGapReport: gapReport.report,
    watchpoint,
    topStories,
  };

  return {
    ...pkgBase,
    contentMd: buildMarkdown(pkgBase),
  };
}
