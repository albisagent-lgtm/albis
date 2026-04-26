import type { ScanItemInput } from './relevance-engine';

export interface PublicStorySelection {
  item: ScanItemInput;
  score: number;
  clusterKey: string;
  topicKey: string;
  categoryKey: string;
  duplicateKey: string;
  specificity: number;
  why: string[];
  lane: string;
}

const GENERIC_TAGS = new Set([
  'global', 'world', 'breaking', 'analysis', 'policy', 'government', 'conflict', 'diplomacy', 'economy', 'economic',
  'markets', 'geopolitics', 'update', 'war', 'news', 'politics', 'international', 'trade', 'security', 'officials',
  'minister', 'ministry', 'state', 'states', 'talks', 'meeting', 'deal', 'response', 'tensions', 'latest', 'amid'
]);

const GENERIC_HEADLINE_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'after', 'amid', 'as', 'at', 'by', 'from',
  'is', 'are', 'be', 'into', 'over', 'under', 'new', 'latest', 'says', 'say', 'warns', 'report', 'reports', 'could',
  'may', 'more', 'less', 'still', 'again', 'deal', 'plan', 'move', 'moves', 'talks', 'policy', 'global', 'world',
  'officials', 'minister', 'ministers', 'government', 'governments', 'state', 'states', 'pressure', 'rises', 'rise',
  'news', 'update', 'battle', 'crisis', 'ceasefire'
]);

const CATEGORY_ALIASES: Record<string, string> = {
  economic: 'economic-flows',
  infrastructure: 'governance',
  legal: 'governance',
  social: 'life-systems',
  climate: 'climate-energy',
  migration: 'migration-demographics',
  security: 'conflict',
};

const HUMAN_CATEGORIES = new Set([
  'health', 'life-systems', 'food', 'food-agriculture', 'water', 'migration-demographics', 'natural-world', 'grassroots', 'culture'
]);

const OFFBEAT_CATEGORIES = new Set([
  'science-space', 'natural-world', 'culture', 'grassroots', 'life-systems'
]);

const SYSTEM_CATEGORIES = new Set([
  'economic-flows', 'climate-energy', 'energy', 'governance', 'logistics-shipping', 'manufacturing', 'construction-infra'
]);

const NARROW_SYSTEM_CATEGORIES = new Set([
  'conflict', 'sanctions', 'economic-flows', 'energy', 'logistics-shipping'
]);

const DIVERSITY_PRIORITY_CATEGORIES = new Set([
  'health', 'life-systems', 'food-agriculture', 'food', 'water', 'migration-demographics', 'science-space', 'tech-ai',
  'natural-world', 'grassroots', 'culture', 'governance', 'climate-energy'
]);

const HUMAN_TAGS = ['aid', 'refugee', 'vaccine', 'measles', 'meningitis', 'civilian', 'children', 'health', 'food', 'water', 'hospital', 'clinic', 'school', 'hunger', 'malnutrition', 'displacement', 'teacher', 'student', 'farmer', 'patient', 'worker', 'family'];
const OFFBEAT_TAGS = ['wildlife', 'satellite', 'coffee', 'solar', 'deforestation', 'garment', 'fisheries', 'bees', 'penguin', 'reef', 'orchard', 'volcano', 'battery', 'aging', 'fusion', 'robot', 'gene', 'tutor'];
const SYSTEM_TAGS = ['shipping', 'insurance', 'inflation', 'supply-chain', 'energy', 'sanctions', 'migration', 'ai', 'infrastructure', 'port', 'grid', 'pipeline', 'cable', 'corridor', 'rail'];
const NARROW_SYSTEM_TAGS = ['shipping', 'insurance', 'inflation', 'supply-chain', 'sanctions', 'tariff', 'freight', 'oil', 'lng', 'commodity', 'macro', 'market', 'crude', 'diesel'];
const CURIOSITY_TAGS = ['island', 'village', 'mosquito', 'grain', 'mine', 'dam', 'reef', 'clinic', 'prison', 'orchard', 'bridge', 'school', 'factory', 'battery', 'robot', 'teacher'];
const TOPIC_STOPWORDS = new Set(['global', 'energy', 'shipping', 'insurance', 'sanctions', 'migration', 'health', 'markets', 'conflict', 'diplomacy', 'economic']);
const BROAD_WAR_ECONOMY_WORDS = ['oil', 'shipping', 'insurance', 'sanctions', 'macro', 'market', 'markets', 'freight', 'lng', 'commodity', 'crude', 'diesel', 'corridor'];
const HUMAN_DETAIL_WORDS = ['hospital', 'clinic', 'school', 'teacher', 'student', 'farmer', 'patient', 'refugee', 'migrant', 'family', 'worker', 'village', 'children', 'women'];

function slugBits(input: string): string[] {
  return String(input || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function normalisePublicCategory(category: string): string {
  const key = String(category || '').toLowerCase().replace(/_/g, '-');
  return CATEGORY_ALIASES[key] || key || 'current-events';
}

function extractSpecificTokens(item: ScanItemInput): string[] {
  const fromTags = (item.tags || [])
    .map((tag) => String(tag || '').toLowerCase().replace(/_/g, '-'))
    .flatMap((tag) => tag.split(/[^a-z0-9]+/))
    .filter(Boolean);

  const fromHeadline = slugBits(item.headline);
  const fromConnection = slugBits(item.connection || '');

  return uniq([...fromTags, ...fromHeadline, ...fromConnection]).filter((token) => {
    if (!token || token.length < 4) return false;
    if (GENERIC_HEADLINE_WORDS.has(token)) return false;
    if (GENERIC_TAGS.has(token)) return false;
    if (TOPIC_STOPWORDS.has(token)) return false;
    return true;
  });
}

function deriveDuplicateKey(item: ScanItemInput): string {
  const tokens = slugBits(item.headline).filter((token) => !GENERIC_HEADLINE_WORDS.has(token));
  return uniq(tokens).slice(0, 8).join('|') || String(item.headline || '').trim().toLowerCase();
}

export function deriveTopicKey(item: ScanItemInput): string {
  const specific = extractSpecificTokens(item);
  return specific.slice(0, 3).join('|') || deriveDuplicateKey(item) || 'story';
}

export function deriveClusterKey(item: ScanItemInput): string {
  const category = normalisePublicCategory(item.category);
  const topic = deriveTopicKey(item).split('|').slice(0, 2).join('|') || 'story';
  return `${category}:${topic}`;
}

function significanceScore(value: string | undefined): number {
  const v = String(value || '').toLowerCase();
  if (v === 'critical') return 4.8;
  if (v === 'high') return 3.4;
  if (v === 'medium') return 2.2;
  if (v === 'low') return 1.3;
  return 1.9;
}

function countTagHits(item: ScanItemInput, tags: string[]): number {
  const haystack = `${item.headline} ${(item.tags || []).join(' ')} ${(item.connection || '')}`.toLowerCase();
  return tags.filter((tag) => haystack.includes(tag)).length;
}

function laneKey(category: string): string {
  if (NARROW_SYSTEM_CATEGORIES.has(category)) return 'war-system';
  if (HUMAN_CATEGORIES.has(category)) return 'human';
  if (OFFBEAT_CATEGORIES.has(category)) return 'offbeat';
  if (category === 'tech-ai' || category === 'science-space') return 'tech-science';
  if (category === 'governance') return 'governance';
  if (category === 'climate-energy' || category === 'natural-world') return 'climate';
  return 'general';
}

function specificityScore(item: ScanItemInput): number {
  const specific = extractSpecificTokens(item);
  const headline = String(item.headline || '');
  let score = Math.min(1.8, specific.length * 0.22);

  if (/\b\d+(?:\.\d+)?%|\b\d{2,}\b|\$\d/.test(headline)) score += 0.35;
  if (/[A-Z]{2,}/.test(headline)) score += 0.2;
  if (headline.includes(':') || headline.includes(';')) score += 0.1;
  if ((item.connection || '').length > 110) score += 0.2;
  if (/\b(?:in|at|near|outside|inside)\s+[A-Z][a-z]+/.test(String(item.connection || ''))) score += 0.15;

  return Math.min(2.6, score);
}

function concreteDetailScore(item: ScanItemInput): number {
  const text = `${item.headline} ${item.connection || ''}`;
  let score = 0;
  if (/\b\d+(?:\.\d+)?(?:%| million| billion|m|bn)?\b/i.test(text)) score += 0.45;
  if (/\b(?:port|clinic|hospital|school|camp|court|factory|mine|dam|bridge|airport|pipeline|district|province|town|village)\b/i.test(text)) score += 0.4;
  if (/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/.test(String(item.connection || ''))) score += 0.2;
  return Math.min(1.1, score);
}

function humanProximityScore(item: ScanItemInput): number {
  return Math.min(1, countTagHits(item, HUMAN_DETAIL_WORDS) * 0.32);
}

function broadWarEconomyPenalty(item: ScanItemInput, category: string): number {
  const text = `${item.headline} ${(item.tags || []).join(' ')} ${item.connection || ''}`.toLowerCase();
  const broadHits = BROAD_WAR_ECONOMY_WORDS.filter((word) => text.includes(word)).length;
  const humanHits = HUMAN_DETAIL_WORDS.filter((word) => text.includes(word)).length;
  const categoryPenalty = NARROW_SYSTEM_CATEGORIES.has(category) ? 0.45 : 0;
  if (broadHits < 2) return 0;
  return Math.max(0, Math.min(1.4, categoryPenalty + broadHits * 0.16 - humanHits * 0.18));
}

export function scorePublicInterest(item: ScanItemInput): { score: number; why: string[]; specificity: number; lane: string } {
  const why: string[] = [];
  let score = significanceScore(item.significance);

  const category = normalisePublicCategory(item.category);
  const lane = laneKey(category);
  if (HUMAN_CATEGORIES.has(category)) {
    score += 1.35;
    why.push('human-impact');
  }
  if (OFFBEAT_CATEGORIES.has(category)) {
    score += 0.95;
    why.push('offbeat-angle');
  }
  if (SYSTEM_CATEGORIES.has(category)) {
    score += 0.35;
    why.push('system-angle');
  }

  if (DIVERSITY_PRIORITY_CATEGORIES.has(category)) {
    score += 0.35;
    why.push('diversity-lane');
  }

  const humanHits = countTagHits(item, HUMAN_TAGS);
  if (humanHits > 0) {
    score += Math.min(1.25, humanHits * 0.34);
    why.push('humanitarian-signal');
  }

  const offbeatHits = countTagHits(item, OFFBEAT_TAGS);
  if (offbeatHits > 0) {
    score += Math.min(0.95, offbeatHits * 0.32);
    why.push('unexpected-specificity');
  }

  const systemsHits = countTagHits(item, SYSTEM_TAGS);
  if (systemsHits > 0) {
    score += Math.min(0.75, systemsHits * 0.18);
    why.push('system-flow');
  }

  const narrowSystemHits = countTagHits(item, NARROW_SYSTEM_TAGS);

  const curiosityHits = countTagHits(item, CURIOSITY_TAGS);
  if (curiosityHits > 0) {
    score += Math.min(0.8, curiosityHits * 0.25);
    why.push('curiosity-hook');
  }

  const humanProximity = humanProximityScore(item);
  if (humanProximity > 0) {
    score += humanProximity;
    why.push('human-detail');
  }

  const concreteDetail = concreteDetailScore(item);
  if (concreteDetail > 0) {
    score += concreteDetail;
    why.push('concrete-detail');
  }

  if (NARROW_SYSTEM_CATEGORIES.has(category) && narrowSystemHits >= 2 && humanHits === 0 && offbeatHits === 0 && curiosityHits === 0) {
    score -= 0.7;
    why.push('narrow-system-penalty');
  }

  const warPenalty = broadWarEconomyPenalty(item, category);
  if (warPenalty > 0) {
    score -= warPenalty;
    why.push('broad-war-economy-penalty');
  }

  const specificity = specificityScore(item);
  score += specificity;
  if (specificity >= 1.1) why.push('specific-detail');

  score += Math.min(1.2, (item.regions || []).length * 0.16);
  score += Math.min(0.7, (item.patterns || []).length * 0.12);
  score += Math.min(0.95, Math.max(0, Number(item.coverage_breadth || 0)) * 0.08);
  score += Math.min(0.75, Math.max(0, Number(item.perception_gap || 0)) * 0.05);

  if ((item.connection || '').length > 90) {
    score += 0.2;
    why.push('clear-consequence');
  }

  return { score, why, specificity, lane };
}

export function rankPublicStories(items: ScanItemInput[]): PublicStorySelection[] {
  return items
    .map((item) => {
      const { score, why, specificity, lane } = scorePublicInterest(item);
      return {
        item,
        score,
        clusterKey: deriveClusterKey(item),
        topicKey: deriveTopicKey(item),
        categoryKey: normalisePublicCategory(item.category),
        duplicateKey: deriveDuplicateKey(item),
        specificity,
        why: lane === 'war-system' && !why.includes('narrow-system-penalty') ? [...why, 'war-system'] : why,
        lane,
      } satisfies PublicStorySelection;
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.specificity !== a.specificity) return b.specificity - a.specificity;
      return String(a.item.headline || '').localeCompare(String(b.item.headline || ''));
    });
}

function isNearDuplicate(a: PublicStorySelection, b: PublicStorySelection): boolean {
  if (a.duplicateKey === b.duplicateKey) return true;
  if (a.topicKey === b.topicKey && a.categoryKey === b.categoryKey) return true;
  return false;
}

function categoryCap(target: number): number {
  return target >= 6 ? 2 : 1;
}

export function suggestPublicArticleCount(items: ScanItemInput[], minCount = 3, maxCount = 7): number {
  const ranked = rankPublicStories(items);
  const distinctClusters = new Set(ranked.map((entry) => entry.clusterKey)).size;
  const distinctCategories = new Set(ranked.map((entry) => entry.categoryKey)).size;
  const strongPool = ranked.filter((entry) => entry.score >= 4.6).length;

  if (distinctClusters >= 10 && distinctCategories >= 6 && strongPool >= 7) return Math.min(maxCount, 7);
  if (distinctClusters >= 8 && distinctCategories >= 5 && strongPool >= 6) return Math.min(maxCount, 6);
  if (distinctClusters >= 6 && distinctCategories >= 4 && strongPool >= 5) return Math.min(maxCount, 5);
  if (distinctClusters >= 4 && distinctCategories >= 3 && strongPool >= 4) return Math.min(maxCount, 4);
  return Math.min(maxCount, Math.max(minCount, Math.min(ranked.length, minCount)));
}

function choosePass(
  pool: PublicStorySelection[],
  selected: PublicStorySelection[],
  target: number,
  opts: {
    requireNewCategory?: boolean;
    requirePriorityLane?: boolean;
    relaxedDuplicates?: boolean;
    relaxedCategoryCap?: boolean;
    relaxedLaneCap?: boolean;
  }
) {
  const categories = new Map<string, number>();
  const lanes = new Map<string, number>();
  const clusters = new Set<string>();
  const topics = new Set<string>();
  const duplicates: PublicStorySelection[] = [];

  for (const entry of selected) {
    categories.set(entry.categoryKey, (categories.get(entry.categoryKey) || 0) + 1);
    lanes.set((entry as any).lane || laneKey(entry.categoryKey), (lanes.get((entry as any).lane || laneKey(entry.categoryKey)) || 0) + 1);
    clusters.add(entry.clusterKey);
    topics.add(entry.topicKey);
    duplicates.push(entry);
  }

  const cap = opts.relaxedCategoryCap ? Math.max(2, categoryCap(target)) : categoryCap(target);
  const warSystemCap = opts.relaxedLaneCap ? Math.max(2, Math.ceil(target / 3)) : 1;

  for (const entry of pool) {
    if (selected.length >= target) break;
    if (clusters.has(entry.clusterKey)) continue;
    if (topics.has(entry.topicKey)) continue;
    if (!opts.relaxedDuplicates && duplicates.some((picked) => isNearDuplicate(entry, picked))) continue;
    if (opts.requireNewCategory && categories.has(entry.categoryKey)) continue;
    if (opts.requirePriorityLane && !DIVERSITY_PRIORITY_CATEGORIES.has(entry.categoryKey) && !HUMAN_CATEGORIES.has(entry.categoryKey) && !OFFBEAT_CATEGORIES.has(entry.categoryKey)) continue;
    const lane = (entry as any).lane || laneKey(entry.categoryKey);
    if (lane === 'war-system' && (lanes.get(lane) || 0) >= warSystemCap) continue;
    if ((categories.get(entry.categoryKey) || 0) >= cap) continue;

    selected.push(entry);
    categories.set(entry.categoryKey, (categories.get(entry.categoryKey) || 0) + 1);
    lanes.set(lane, (lanes.get(lane) || 0) + 1);
    clusters.add(entry.clusterKey);
    topics.add(entry.topicKey);
    duplicates.push(entry);
  }
}

export function selectPublicStories(items: ScanItemInput[], target: number, maxCount = target): PublicStorySelection[] {
  const ranked = rankPublicStories(items);
  const shortlistCount = Math.max(1, Math.max(target, maxCount));
  const selected: PublicStorySelection[] = [];

  choosePass(ranked, selected, shortlistCount, { requireNewCategory: true, requirePriorityLane: true, relaxedDuplicates: false, relaxedCategoryCap: false, relaxedLaneCap: false });
  if (selected.length < shortlistCount) choosePass(ranked, selected, shortlistCount, { requireNewCategory: true, requirePriorityLane: false, relaxedDuplicates: false, relaxedCategoryCap: false, relaxedLaneCap: false });
  if (selected.length < shortlistCount) choosePass(ranked, selected, shortlistCount, { requireNewCategory: false, requirePriorityLane: false, relaxedDuplicates: false, relaxedCategoryCap: false, relaxedLaneCap: false });
  if (selected.length < shortlistCount) choosePass(ranked, selected, shortlistCount, { requireNewCategory: false, requirePriorityLane: false, relaxedDuplicates: true, relaxedCategoryCap: false, relaxedLaneCap: false });
  if (selected.length < shortlistCount) choosePass(ranked, selected, shortlistCount, { requireNewCategory: false, requirePriorityLane: false, relaxedDuplicates: true, relaxedCategoryCap: true, relaxedLaneCap: true });

  return selected.slice(0, shortlistCount);
}
