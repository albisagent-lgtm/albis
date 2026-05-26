import type { ScanItemInput } from './relevance-engine';
import { derivePublicDoctrineLane, type PublicDoctrineLane } from './public-editorial-doctrine';

export interface ArticleSignals {
  coreFact: string;
  keyNumber: string | null;
  mainActors: string[];
  primaryLocation: string | null;
  humanStake: string | null;
  mechanism: string;
  novelty: string;
  framingTension: string;
  articleFormHint: string;
  pairWith: string[];
  sourceTexture: string[];
}

export interface PublicStorySelection {
  item: ScanItemInput;
  score: number;
  writeabilityScore: number;
  clusterKey: string;
  topicKey: string;
  categoryKey: string;
  duplicateKey: string;
  specificity: number;
  why: string[];
  lane: string;
  doctrineLane: PublicDoctrineLane;
  articleForm: ArticleForm;
  articleOpportunity: string;
  articleSignals: ArticleSignals;
}

export type ArticleForm =
  | 'turning-point'
  | 'framing-map'
  | 'system-shift'
  | 'human-ground'
  | 'numbers-watch'
  | 'offbeat-signal';

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
const LIFE_SYSTEMS_FOUNDATION_TAGS = [
  'food', 'grain', 'wheat', 'rice', 'maize', 'fertilizer', 'farmer', 'harvest', 'irrigation', 'famine', 'hunger', 'malnutrition',
  'water', 'drought', 'flood', 'reservoir', 'desalination', 'sanitation', 'sewage',
  'energy', 'fuel', 'diesel', 'oil', 'gas', 'electricity', 'blackout', 'grid', 'power', 'solar', 'battery',
  'health', 'hospital', 'clinic', 'medicine', 'vaccine', 'outbreak', 'disease', 'heatwave',
  'housing', 'shelter', 'migration', 'refugee', 'displacement',
  'port', 'rail', 'road', 'bridge', 'shipping', 'supply-chain', 'logistics', 'infrastructure',
];
const NARROW_SYSTEM_TAGS = ['shipping', 'insurance', 'inflation', 'supply-chain', 'sanctions', 'tariff', 'freight', 'oil', 'lng', 'commodity', 'macro', 'market', 'crude', 'diesel'];
const CURIOSITY_TAGS = ['island', 'village', 'mosquito', 'grain', 'mine', 'dam', 'reef', 'clinic', 'prison', 'orchard', 'bridge', 'school', 'factory', 'battery', 'robot', 'teacher'];
const TOPIC_STOPWORDS = new Set(['global', 'energy', 'shipping', 'insurance', 'sanctions', 'migration', 'health', 'markets', 'conflict', 'diplomacy', 'economic']);
const BROAD_WAR_ECONOMY_WORDS = ['oil', 'shipping', 'insurance', 'sanctions', 'macro', 'market', 'markets', 'freight', 'lng', 'commodity', 'crude', 'diesel', 'corridor'];
const HUMAN_DETAIL_WORDS = ['hospital', 'clinic', 'school', 'teacher', 'student', 'farmer', 'patient', 'refugee', 'migrant', 'family', 'worker', 'village', 'children', 'women'];
const TURNING_POINT_WORDS = ['reopens', 'reopen', 'halts', 'halt', 'approves', 'approved', 'cuts', 'cut', 'launches', 'launch', 'extends', 'extend', 'reverses', 'reverse', 'seizes', 'seize', 'bans', 'ban', 'orders', 'order', 'resumes', 'resume', 'strike', 'strikes', 'deal', 'ceasefire'];
const SYSTEM_SHIFT_WORDS = ['supply-chain', 'shipping', 'port', 'grid', 'pipeline', 'corridor', 'tariff', 'sanctions', 'rare-earth', 'export', 'freight', 'insurance', 'manufacturing', 'semiconductor', 'chip', 'logistics'];
const NUMBERS_WATCH_WORDS = ['percent', '%', 'million', 'billion', 'rate', 'inflation', 'fertility', 'deficit', 'surplus', 'debt', 'gdp', 'tariff', 'cost', 'price', 'funding', 'aid', 'shipments', 'exports', 'imports', 'production'];
const FRAMING_WORDS = ['framing', 'narrative', 'propaganda', 'disinformation', 'media', 'coverage'];
const INCIDENTAL_NUMBER_CONTEXT = ['year', 'years', 'month', 'months', 'day', 'days', 'week', 'weeks', 'hour', 'hours', 'anniversary', 'since'];
const OPERATIVE_NUMBER_CONTEXT = [
  'price', 'prices', 'cost', 'costs', 'tariff', 'tariffs', 'inflation', 'rate', 'rates', 'funding', 'loan', 'loans', 'aid', 'shipments', 'shipment',
  'exports', 'export', 'imports', 'import', 'production', 'output', 'cases', 'deaths', 'beds', 'patients', 'barrels', 'tons', 'tonnes', 'mw', 'gw',
  'gdp', 'debt', 'deficit', 'surplus', 'fuel', 'oil', 'gas', 'freight', 'insurance', 'vessels', 'displaced', 'refugees', 'workers', 'families'
];
const ACTOR_STOPWORDS = new Set(['The', 'A', 'An', 'After', 'Amid', 'As', 'At', 'In', 'On', 'For', 'With', 'From']);
const ACTOR_GENERIC_WORDS = new Set([
  'woman', 'women', 'man', 'men', 'public', 'only', 'official', 'officials', 'authority', 'authorities',
  'government', 'governments', 'state', 'states', 'ministry', 'ministries', 'minister', 'ministers',
  'military', 'rebels', 'rebel', 'protesters', 'protester', 'residents', 'families', 'family', 'workers', 'worker',
  'traders', 'trader', 'markets', 'market', 'analysts', 'analyst', 'forces', 'troops', 'people',
  'freedom', 'life', 'new', 'latest', 'red', 'sea'
]);
const ACTOR_BAD_SUFFIXES = /\b(?:says|say|warns|warning|urges|urge|announces?|announced|report(?:s|ed)?|according|amid|after|before|as|over|on|in|at|from)$/i;
const ACTOR_EXCLUDED_PHRASES = /^(?:World|Global|Breaking|Latest|Analysis|Update|News)$/i;
const HUMAN_STAKE_TERMS = ['civilian', 'children', 'families', 'family', 'patients', 'patient', 'refugees', 'refugee', 'migrants', 'migrant', 'workers', 'worker', 'farmers', 'farmer', 'students', 'student', 'teachers', 'teacher', 'households', 'residents'];
const HUMAN_STAKE_PHRASES: Array<{ match: RegExp; label: string }> = [
  { match: /\b(?:food insecurity|hunger|malnutrition|famine)\b/i, label: 'food insecurity pressure' },
  { match: /\b(?:water shortage|water access|drinking water|desalination|drought)\b/i, label: 'water access pressure' },
  { match: /\b(?:fuel prices?|fuel shortage|energy emergency|blackouts?|power cuts?)\b/i, label: 'household energy pressure' },
  { match: /\b(?:school closures?|school disruption|teacher shortage|students? out of school)\b/i, label: 'school access pressure' },
  { match: /\b(?:hospital overload|clinic strain|medicine shortage|vaccine gap|outbreak)\b/i, label: 'health access pressure' },
  { match: /\b(?:displacement|refugee|asylum|detention|shelter capacity)\b/i, label: 'displacement and shelter pressure' },
  { match: /\b(?:inflation|cost of living|price shock|grocery bills?|rent)\b/i, label: 'cost-of-living pressure' },
];
const MECHANISM_HINTS: Array<{ match: RegExp; label: string }> = [
  { match: /\b(ship|shipping|port|corridor|freight|insur|route|pipeline|canal|vessel|tanker|transit|rerout)\b/i, label: 'logistics chokepoint' },
  { match: /\b(sanction|tariff|waiver|ban|export|license|rule|regulat|court|legal|mandate|restriction)\b/i, label: 'policy and rules shift' },
  { match: /\b(vaccine|outbreak|measles|meningitis|hospital|clinic|health|medicine|medical|disease)\b/i, label: 'public-health transmission chain' },
  { match: /\b(bank|imf|debt|inflation|price|fuel|oil|gas|market|gdp|loan|subsid|currency|cost)\b/i, label: 'price and financing pressure' },
  { match: /\b(ai|chip|semiconductor|data|server|grid|battery|solar|energy|compute|power|electricity)\b/i, label: 'capacity and infrastructure bottleneck' },
  { match: /\b(aid|refugee|camp|school|food|water|displacement|shelter|migration|asylum)\b/i, label: 'human access squeeze' },
];
const DEFAULT_MECHANISM_BY_CATEGORY: Record<string, string> = {
  'health': 'public-health transmission chain',
  'life-systems': 'human access squeeze',
  'food': 'human access squeeze',
  'food-agriculture': 'human access squeeze',
  'water': 'human access squeeze',
  'migration-demographics': 'human access squeeze',
  'economic-flows': 'price and financing pressure',
  'energy': 'price and financing pressure',
  'climate-energy': 'capacity and infrastructure bottleneck',
  'logistics-shipping': 'logistics chokepoint',
  'manufacturing': 'capacity and infrastructure bottleneck',
  'construction-infra': 'capacity and infrastructure bottleneck',
  'governance': 'policy and rules shift',
  'conflict': 'logistics chokepoint',
  'sanctions': 'policy and rules shift',
  'tech-ai': 'capacity and infrastructure bottleneck',
};

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
    score += 1.85;
    why.push('human-impact');
    why.push('life-systems-priority');
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
    score += 0.6;
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

  const lifeFoundationHits = countTagHits(item, LIFE_SYSTEMS_FOUNDATION_TAGS);
  if (lifeFoundationHits > 0) {
    score += Math.min(1.35, lifeFoundationHits * 0.24);
    why.push('life-foundation');
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

function articleFormFromItem(item: ScanItemInput, category: string, lane: string): ArticleForm {
  const text = `${item.headline} ${(item.tags || []).join(' ')} ${item.connection || ''}`.toLowerCase();
  const patternSet = new Set((item.patterns || []).map((pattern) => String(pattern || '').toLowerCase()));
  const humanHits = countTagHits(item, HUMAN_DETAIL_WORDS);
  const offbeatHits = countTagHits(item, OFFBEAT_TAGS) + countTagHits(item, CURIOSITY_TAGS);
  const systemHits = countTagHits(item, SYSTEM_SHIFT_WORDS);
  const hasOperativeNumber = !!extractKeyNumber(item);

  if (patternSet.has('framing') || FRAMING_WORDS.some((term) => text.includes(term))) return 'framing-map';
  if (humanHits >= 2 || HUMAN_CATEGORIES.has(category) || lane === 'human') {
    if ((OFFBEAT_CATEGORIES.has(category) || lane === 'offbeat' || offbeatHits >= 3) && humanHits === 0 && !/\b(?:clinic|hospital|school|camp|patient|refugee|children|family|worker)\b/.test(text)) return 'offbeat-signal';
    return 'human-ground';
  }
  if (offbeatHits >= 2 || ((OFFBEAT_CATEGORIES.has(category) || lane === 'offbeat') && !patternSet.has('framing'))) return 'offbeat-signal';
  if (hasOperativeNumber && (NUMBERS_WATCH_WORDS.some((term) => text.includes(term)) || systemHits === 0 || humanHits === 0)) return 'numbers-watch';
  if (SYSTEM_CATEGORIES.has(category) || SYSTEM_SHIFT_WORDS.some((term) => text.includes(term))) return 'system-shift';
  if (TURNING_POINT_WORDS.some((term) => text.includes(term)) || patternSet.has('escalation') || patternSet.has('breaking')) return 'turning-point';
  return 'turning-point';
}

function sentenceCaseText(value: string): string {
  const text = String(value || '').trim();
  if (!text) return '';
  return text[0].toUpperCase() + text.slice(1);
}

function normaliseKeyNumber(value: string): string {
  return String(value || '')
    .replace(/\bmn\b/gi, 'm')
    .replace(/\bbn\b/gi, 'bn')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKeyNumber(item: ScanItemInput): string | null {
  const text = `${item.headline} ${item.connection || ''}`.replace(/\s+/g, ' ').trim();
  const regex = /(?<![A-Za-z0-9])\$?\d+(?:\.\d+)?(?:\s?(?:%|m|mn|bn|million|billion|trillion|cases|deaths|beds|patients|barrels|ships|vessels|families|workers|children|refugees|students|households|days|weeks|months|years))?(?![A-Za-z0-9])/gi;
  const matches = Array.from(text.matchAll(regex));
  if (!matches.length) return null;

  let best: { value: string; score: number } | null = null;
  for (const match of matches) {
    const rawValue = match[0].trim();
    const value = normaliseKeyNumber(rawValue);
    const start = Math.max(0, (match.index || 0) - 48);
    const end = Math.min(text.length, (match.index || 0) + rawValue.length + 48);
    const window = text.slice(start, end).toLowerCase();
    let score = 0;

    if (/%|million|billion|trillion|bn|mn|m|\$/.test(value.toLowerCase())) score += 3;
    if (/^20\d{2}$/.test(value)) score -= 4;
    if (/^(?:24|48|72)\s*(?:hours?|days?)$/i.test(value)) score -= 1.5;
    if (OPERATIVE_NUMBER_CONTEXT.some((term) => window.includes(term))) score += 2.5;
    if (INCIDENTAL_NUMBER_CONTEXT.some((term) => window.includes(term))) score -= 1.5;
    if (/\b(?:up|down|rise|fall|cut|increase|drop|jump|surge|record|worth|valued|priced)\b/.test(window)) score += 1.4;
    if (/\b(?:from|since)\s+20\d{2}\b/.test(window)) score -= 2;
    if (/\b\d+(?:\.\d+)?\s*(?:cases|deaths|beds|patients|barrels|ships|vessels|families|workers|children|refugees|students|households)\b/i.test(window)) score += 2.2;
    if (/\b(?:killed|dead|displaced|evacuated|shortage|price|inflation|funding|aid|shipments|production|exports|imports)\b/.test(window)) score += 1.2;

    if (!best || score > best.score) best = { value, score };
  }

  if (!best || best.score < 1) return null;
  return best.value;
}

function cleanActorCandidate(actor: string): string {
  return String(actor || '')
    .replace(/^['"“”‘’]+|['"“”‘’]+$/g, '')
    .replace(/^[,.;:()\[\]{}\-–—]+|[,.;:()\[\]{}\-–—]+$/g, '')
    .replace(/^(?:The|A|An)\s+/, '')
    .replace(/\b(?:said|says|warns|warning|announced|announces|report(?:s|ed)?|according to)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidActorCandidate(actor: string): boolean {
  const cleaned = cleanActorCandidate(actor);
  if (!cleaned || cleaned.length < 2) return false;
  if (ACTOR_STOPWORDS.has(cleaned)) return false;
  if (ACTOR_BAD_SUFFIXES.test(cleaned)) return false;
  if (ACTOR_EXCLUDED_PHRASES.test(cleaned)) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  const lowerWords = words.map((word) => word.toLowerCase());

  if (words.length === 1 && ACTOR_GENERIC_WORDS.has(lowerWords[0])) return false;
  if (lowerWords.every((word) => ACTOR_GENERIC_WORDS.has(word))) return false;
  if (/^(?:only|public|woman|women|man|men)$/i.test(cleaned)) return false;
  if (/^(?:one|two|three|four|five|six|seven|eight|nine|ten)$/i.test(cleaned)) return false;
  if (/^[A-Z][a-z]+$/.test(cleaned) && cleaned.length <= 4 && ACTOR_GENERIC_WORDS.has(cleaned.toLowerCase())) return false;
  if (/\d/.test(cleaned)) return false;

  return true;
}

function actorCandidateScore(actor: string): number {
  const cleaned = cleanActorCandidate(actor);
  const words = cleaned.split(/\s+/).filter(Boolean);
  let score = 0;
  if (words.length >= 2) score += 2;
  if (/^[A-Z]{2,}$/.test(cleaned)) score += 1.5;
  if (/\b(?:US|UAE|EU|IMF|WHO|UN|NATO|China|India|Iran|Israel|Ukraine|Russia|Bangladesh|Kenya|Saudi|Treasury|World Bank)\b/.test(cleaned)) score += 1.5;
  if (/\b(?:Ministry|Treasury|Bank|Court|Commission|Agency|Forces|Guard|Army|Government|Union)\b/.test(cleaned)) score += 1;
  return score;
}

function extractMainActors(item: ScanItemInput): string[] {
  const actorRegex = /\b(?:[A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){1,3}|[A-Z][A-Za-z0-9]+(?:\s+(?:of|and|the|for|to)\s+[A-Z][A-Za-z0-9]+){1,2}|[A-Z][A-Z0-9]{1,})\b/g;
  const connectionActors = String(item.connection || '').match(actorRegex) || [];
  const headlineActors = String(item.headline || '').match(actorRegex) || [];
  const regionActors = (item.regions || [])
    .map((region) => String(region || '').replace(/[-_]+/g, ' '))
    .map((region) => region.replace(/\b(\w)/g, (_, ch) => String(ch).toUpperCase()).trim())
    .filter(Boolean);

  const deduped = uniq([...headlineActors, ...connectionActors, ...regionActors].map((actor) => cleanActorCandidate(actor)))
    .filter(isValidActorCandidate)
    .filter((actor, index, actors) => !actors.some((other, otherIndex) => otherIndex !== index && other.includes(actor) && other.length > actor.length));

  return deduped
    .sort((a, b) => actorCandidateScore(b) - actorCandidateScore(a) || b.length - a.length)
    .slice(0, 4);
}

function extractPrimaryLocation(item: ScanItemInput): string | null {
  const explicit = Array.isArray(item.regions) ? item.regions.find(Boolean) : '';
  if (explicit) return explicit;
  const text = `${item.headline} ${item.connection || ''}`;
  const match = text.match(/\b(?:in|at|near|across|from|inside|outside)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/);
  return match?.[1] || null;
}

function deriveHumanStake(item: ScanItemInput, category: string): string | null {
  const text = `${item.headline} ${(item.tags || []).join(' ')} ${item.connection || ''}`.toLowerCase();
  const phraseMatch = HUMAN_STAKE_PHRASES.find(({ match }) => match.test(text));
  if (phraseMatch) return phraseMatch.label;

  const humanTerm = HUMAN_STAKE_TERMS.find((term) => text.includes(term));
  if (humanTerm) return `${humanTerm.replace(/s$/, '')} impact`;
  if (HUMAN_CATEGORIES.has(category)) return 'direct lived consequences';
  if (/\b(food|fuel|price|inflation|transport|school|hospital|water|housing|medicine|shelter)\b/i.test(text)) return 'everyday cost or access pressure';
  return null;
}

function deriveMechanism(item: ScanItemInput): string {
  const category = normalisePublicCategory(item.category);
  const text = `${item.headline} ${(item.tags || []).join(' ')} ${item.connection || ''}`;
  return MECHANISM_HINTS.find(({ match }) => match.test(text))?.label || DEFAULT_MECHANISM_BY_CATEGORY[category] || 'state change with second-order effects';
}

function distinctivenessScore(item: ScanItemInput, category: string, form: ArticleForm, specificity: number): number {
  const specificTokens = extractSpecificTokens(item);
  const text = `${item.headline} ${(item.tags || []).join(' ')} ${item.connection || ''}`.toLowerCase();
  const actorCount = extractMainActors(item).length;
  const hasKeyNumber = !!extractKeyNumber(item);
  const hasLocation = !!extractPrimaryLocation(item);
  const topicalDensity = specificTokens.length >= 4 ? 0.45 : specificTokens.length >= 2 ? 0.26 : 0;
  const uncommonAngleBoost = (OFFBEAT_CATEGORIES.has(category) || HUMAN_CATEGORIES.has(category) || form === 'offbeat-signal' || form === 'human-ground') ? 0.28 : 0;
  const genericPenalty = broadWarEconomyPenalty(item, category) > 0.75 && specificity < 1.1 ? 0.4 : 0;

  let score = 0;
  score += topicalDensity;
  score += Math.min(0.35, actorCount * 0.1);
  if (hasKeyNumber) score += 0.2;
  if (hasLocation) score += 0.18;
  score += uncommonAngleBoost;
  if (/\b(?:first|only|rare|smallest|largest|record|surprise|unexpected|quietly)\b/.test(text)) score += 0.18;
  score += Math.min(0.28, specificity * 0.12);
  score -= genericPenalty;

  return Math.max(0, Math.min(1.6, score));
}

function clarityScore(item: ScanItemInput, specificity: number): number {
  const connection = String(item.connection || '').trim();
  const mainActors = extractMainActors(item);
  const primaryLocation = extractPrimaryLocation(item);
  const keyNumber = extractKeyNumber(item);
  const hasMechanism = deriveMechanism(item) !== 'state change with second-order effects';

  let score = 0.1;
  if (connection.length >= 70 && connection.length <= 220) score += 0.42;
  else if (connection.length >= 35) score += 0.2;
  if (mainActors.length > 0) score += 0.18;
  if (primaryLocation) score += 0.16;
  if (keyNumber) score += 0.14;
  if (hasMechanism) score += 0.14;
  score += Math.min(0.22, specificity * 0.08);

  return Math.max(0, Math.min(1.2, score));
}

function structureFitScore(item: ScanItemInput, form: ArticleForm, category: string): number {
  const text = `${item.headline} ${(item.tags || []).join(' ')} ${item.connection || ''}`.toLowerCase();
  const hasNumber = !!extractKeyNumber(item);
  const human = humanProximityScore(item);
  const concrete = concreteDetailScore(item);
  const systemHits = countTagHits(item, SYSTEM_SHIFT_WORDS);
  const framingHits = countTagHits(item, FRAMING_WORDS);
  const stateChange = TURNING_POINT_WORDS.some((term) => text.includes(term));

  let score = 0;
  if (form === 'numbers-watch') score += hasNumber ? 0.9 : -0.55;
  if (form === 'human-ground') score += human >= 0.32 || HUMAN_CATEGORIES.has(category) ? 0.8 : -0.45;
  if (form === 'system-shift') score += systemHits > 0 ? Math.min(0.85, 0.38 + systemHits * 0.12) : -0.4;
  if (form === 'framing-map') score += framingHits > 0 || (item.patterns || []).some((pattern) => String(pattern || '').toLowerCase() === 'framing') ? 0.85 : -0.5;
  if (form === 'turning-point') score += stateChange ? 0.7 : concrete >= 0.4 ? 0.2 : -0.35;
  if (form === 'offbeat-signal') score += (countTagHits(item, OFFBEAT_TAGS) + countTagHits(item, CURIOSITY_TAGS)) >= 2 ? 0.8 : -0.4;

  return Math.max(0, Math.min(1.1, score));
}

function deriveNovelty(item: ScanItemInput, form: ArticleForm, specificity: number): string {
  const text = `${item.headline} ${(item.tags || []).join(' ')} ${item.connection || ''}`.toLowerCase();
  if (form === 'offbeat-signal') return 'reveals a surprising edge-case with broader meaning';
  if (form === 'numbers-watch') return 'turns a raw number into a trackable shift';
  if (specificity >= 1.6) return 'offers unusually concrete detail for a scan item';
  if (/\bresume|reopen|renew|waiver|first|new|fresh|restart|returns?\b/.test(text)) return 'marks a new operating condition rather than a generic update';
  return 'gives a cleaner angle than the broad headline cycle';
}

function deriveFramingTension(item: ScanItemInput, category: string, lane: string): string {
  const text = `${item.headline} ${(item.tags || []).join(' ')} ${item.connection || ''}`.toLowerCase();
  if (text.includes('disinformation') || text.includes('propaganda')) return 'security language on the surface, influence operations underneath';
  if (text.includes('sanctions') || text.includes('tariff')) return 'punishment in the headline, price transmission in the background';
  if (text.includes('ceasefire') || text.includes('talks')) return 'diplomatic progress in the lead, enforcement risk underneath';
  if (lane === 'war-system') return 'geopolitical theatre in the lead, bottlenecks and second-order strain underneath';
  if (lane === 'human') return 'official reassurance in the lead, household or clinic pressure underneath';
  if (category === 'governance') return 'formal decision in the lead, patchy enforcement underneath';
  if (FRAMING_WORDS.some((term) => text.includes(term))) return 'the loud frame and the material consequences are not pointing to the same story';
  return 'the visible event and the practical fallout are pulling attention in different directions';
}

function deriveArticleFormHint(form: ArticleForm): string {
  switch (form) {
    case 'framing-map': return 'lead with competing frames, then show what each frame obscures';
    case 'human-ground': return 'lead with the people/place detail before widening to system consequences';
    case 'numbers-watch': return 'lead with the number, then explain the trend and why it matters';
    case 'system-shift': return 'lead with the chokepoint, reroute, or rule change driving the story';
    case 'offbeat-signal': return 'lead with the surprising concrete detail and connect it to a larger pattern';
    case 'turning-point':
    default: return 'lead with the state change, then explain what became newly possible or risky';
  }
}

function derivePairWith(item: ScanItemInput, category: string, lane: string): string[] {
  const suggestions: string[] = [];
  if (lane === 'war-system') suggestions.push('human-ground', 'numbers-watch');
  if (lane === 'human') suggestions.push('system-shift');
  if (category === 'climate-energy' || category === 'energy') suggestions.push('economic-flows', 'governance');
  if (category === 'governance') suggestions.push('human-ground', 'economic-flows');
  if ((item.patterns || []).some((pattern) => String(pattern).toLowerCase() === 'framing')) suggestions.push('framing-map');
  return uniq(suggestions).slice(0, 3);
}

function deriveSourceTexture(item: ScanItemInput): string[] {
  const texture: string[] = [];
  if ((item.connection || '').length > 110) texture.push('clear consequence line');
  if ((item.patterns || []).length >= 2) texture.push('multi-pattern signal');
  if ((item.regions || []).length >= 2) texture.push('cross-region footprint');
  if (extractKeyNumber(item)) texture.push('numeric anchor');
  if (extractMainActors(item).length >= 2) texture.push('named actors');
  if (!texture.length) texture.push('headline-plus-consequence');
  return texture;
}

function deriveCoreFact(item: ScanItemInput): string {
  const connection = sentenceCaseText(item.connection || '');
  if (connection) return connection;
  return sentenceCaseText(item.headline || '');
}

function buildArticleSignals(item: ScanItemInput, category: string, lane: string, form: ArticleForm, specificity: number): ArticleSignals {
  return {
    coreFact: deriveCoreFact(item),
    keyNumber: extractKeyNumber(item),
    mainActors: extractMainActors(item),
    primaryLocation: extractPrimaryLocation(item),
    humanStake: deriveHumanStake(item, category),
    mechanism: deriveMechanism(item),
    novelty: deriveNovelty(item, form, specificity),
    framingTension: deriveFramingTension(item, category, lane),
    articleFormHint: deriveArticleFormHint(form),
    pairWith: derivePairWith(item, category, lane),
    sourceTexture: deriveSourceTexture(item),
  };
}

function describeArticleOpportunity(form: ArticleForm): string {
  switch (form) {
    case 'framing-map': return 'compare how the story is being told and what each frame reveals';
    case 'human-ground': return 'anchor the shift in people, places, and lived consequences';
    case 'numbers-watch': return 'turn the statistic into a clear trend and what it changes';
    case 'system-shift': return 'show the operational bottleneck, reroute, or structural pressure';
    case 'offbeat-signal': return 'surface the surprising edge-case that reveals a larger pattern';
    case 'turning-point':
    default: return 'explain the state change, why it matters now, and what could happen next';
  }
}

function scoreWriteability(item: ScanItemInput, category: string, form: ArticleForm, specificity: number): { score: number; why: string[] } {
  const why: string[] = [];
  const text = `${item.headline} ${(item.tags || []).join(' ')} ${item.connection || ''}`.toLowerCase();
  const concrete = concreteDetailScore(item);
  const human = humanProximityScore(item);
  const consequence = (item.connection || '').length > 90 ? 1 : Math.min(1, (item.connection || '').length / 120);
  const breadth = Math.min(1, Math.max(0, Number(item.coverage_breadth || 0)) / 8);
  const gap = Math.min(1, Math.max(0, Number(item.perception_gap || 0)) / 8);
  const patterns = Math.min(1, (item.patterns || []).length / 4);
  const hasStateChange = TURNING_POINT_WORDS.some((term) => text.includes(term)) ? 1 : 0;
  const numbersSignal = /\b\d+(?:\.\d+)?(?:%| million| billion|m|bn)?\b/i.test(text) ? 1 : 0;
  const warPenalty = broadWarEconomyPenalty(item, category);
  const distinctiveness = distinctivenessScore(item, category, form, specificity);
  const clarity = clarityScore(item, specificity);
  const structureFit = structureFitScore(item, form, category);

  let score = 0;
  score += concrete * 2.2;
  score += human * 1.4;
  score += consequence * 1.2;
  score += Math.min(1, specificity / 2.2) * 1.3;
  score += breadth * 0.8;
  score += patterns * 0.45;
  score += hasStateChange * 0.55;
  score += distinctiveness * 1.45;
  score += clarity * 1.15;
  score += structureFit * 1.2;

  if (form === 'framing-map') score += gap * 1.5;
  if (form === 'numbers-watch') score += numbersSignal * 1.1;
  if (form === 'human-ground') score += human * 0.9;
  if (form === 'system-shift') score += countTagHits(item, SYSTEM_SHIFT_WORDS) * 0.18;
  if (form === 'offbeat-signal') score += countTagHits(item, OFFBEAT_TAGS) * 0.22;

  if (concrete >= 0.45) why.push('concrete lede available');
  if (consequence >= 0.75) why.push('clear consequence');
  if (breadth >= 0.5) why.push('enough reporting texture');
  if (gap >= 0.45 && form === 'framing-map') why.push('strong framing contrast');
  if (human >= 0.45 && form === 'human-ground') why.push('human detail present');
  if (numbersSignal && form === 'numbers-watch') why.push('numbers can carry the angle');
  if (hasStateChange && form === 'turning-point') why.push('obvious state change');
  if (distinctiveness >= 0.85) why.push('distinctive angle');
  if (clarity >= 0.7) why.push('clear editorial spine');
  if (structureFit >= 0.7) why.push('right-sized form');

  if (warPenalty > 0.8 && concrete < 0.45 && human < 0.3 && distinctiveness < 0.5 && clarity < 0.45) {
    score -= 1.35;
    why.push('generic pressure without enough texture');
  }

  if (clarity < 0.32) {
    score -= 0.7;
    why.push('weak editorial spine');
  }

  if (structureFit < 0.22) {
    score -= 0.8;
    why.push('form-story mismatch');
  }

  return { score: Math.max(0, Math.min(6, score)), why };
}

export function rankPublicStories(items: ScanItemInput[]): PublicStorySelection[] {
  return items
    .map((item) => {
      const { score, why, specificity, lane } = scorePublicInterest(item);
      const categoryKey = normalisePublicCategory(item.category);
      const articleForm = articleFormFromItem(item, categoryKey, lane);
      const doctrineLane = derivePublicDoctrineLane({ articleForm, lane, category: categoryKey });
      const writeability = scoreWriteability(item, categoryKey, articleForm, specificity);
      return {
        item,
        score: score + writeability.score * 0.55,
        writeabilityScore: writeability.score,
        clusterKey: deriveClusterKey(item),
        topicKey: deriveTopicKey(item),
        categoryKey,
        duplicateKey: deriveDuplicateKey(item),
        specificity,
        why: lane === 'war-system' && !why.includes('narrow-system-penalty')
          ? [...why, ...writeability.why, 'war-system']
          : [...why, ...writeability.why],
        lane,
        doctrineLane,
        articleForm,
        articleOpportunity: describeArticleOpportunity(articleForm),
        articleSignals: buildArticleSignals(item, categoryKey, lane, articleForm, specificity),
      } satisfies PublicStorySelection;
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.writeabilityScore !== a.writeabilityScore) return b.writeabilityScore - a.writeabilityScore;
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
  return target >= 7 ? 2 : target >= 6 ? 2 : 1;
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
  const doctrineLanes = new Map<PublicDoctrineLane, number>();
  const clusters = new Set<string>();
  const topics = new Set<string>();
  const duplicates: PublicStorySelection[] = [];
  const forms = new Map<ArticleForm, number>();

  for (const entry of selected) {
    categories.set(entry.categoryKey, (categories.get(entry.categoryKey) || 0) + 1);
    lanes.set((entry as any).lane || laneKey(entry.categoryKey), (lanes.get((entry as any).lane || laneKey(entry.categoryKey)) || 0) + 1);
    clusters.add(entry.clusterKey);
    topics.add(entry.topicKey);
    duplicates.push(entry);
    forms.set(entry.articleForm, (forms.get(entry.articleForm) || 0) + 1);
    doctrineLanes.set(entry.doctrineLane, (doctrineLanes.get(entry.doctrineLane) || 0) + 1);
  }

  const cap = opts.relaxedCategoryCap ? Math.max(2, categoryCap(target)) : categoryCap(target);
  const warSystemCap = opts.relaxedLaneCap ? Math.max(2, Math.ceil(target / 3)) : 1;
  const formCap = opts.relaxedCategoryCap ? 2 : 1;
  const doctrineCap = opts.relaxedCategoryCap ? 2 : 1;

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
    if ((forms.get(entry.articleForm) || 0) >= formCap) continue;
    if ((doctrineLanes.get(entry.doctrineLane) || 0) >= doctrineCap) continue;

    selected.push(entry);
    categories.set(entry.categoryKey, (categories.get(entry.categoryKey) || 0) + 1);
    lanes.set(lane, (lanes.get(lane) || 0) + 1);
    clusters.add(entry.clusterKey);
    topics.add(entry.topicKey);
    duplicates.push(entry);
    forms.set(entry.articleForm, (forms.get(entry.articleForm) || 0) + 1);
    doctrineLanes.set(entry.doctrineLane, (doctrineLanes.get(entry.doctrineLane) || 0) + 1);
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
