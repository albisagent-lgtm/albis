import { buildMispricedAttention, type MispricedAttentionStory } from './mispriced-attention';
import type { ScanItem } from '@/lib/scan-types';

export type MarketVenue = 'Polymarket' | 'Kalshi' | 'Fallback sample';

export interface NormalizedMarket {
  id: string;
  venue: MarketVenue;
  title: string;
  url: string | null;
  category: string | null;
  price: number | null;
  volume: number | null;
  liquidity: number | null;
  movement: number | null;
  closeTime: string | null;
  rawSignalNote: string;
}

export interface MarketAttentionRow {
  market: NormalizedMarket;
  matchedStory: MispricedAttentionStory | null;
  attentionScore: number;
  marketSignal: number;
  albisSignal: number;
  gapSignal: number;
  label: string;
  plainEnglish: string;
  caveats: string[];
  evidence: string[];
}

export interface MarketAttentionBoard {
  rows: MarketAttentionRow[];
  sourceStatus: string[];
  updatedAt: string;
}

type UnknownRecord = Record<string, unknown>;

const FALLBACK_MARKETS: NormalizedMarket[] = [
  {
    id: 'fallback-geopolitics-1',
    venue: 'Fallback sample',
    title: 'Major ceasefire or de-escalation announced in a current conflict area',
    url: null,
    category: 'World',
    price: 0.38,
    volume: 82000,
    liquidity: 19000,
    movement: 0.07,
    closeTime: null,
    rawSignalNote: 'Local fallback used because live market listings were unavailable.',
  },
  {
    id: 'fallback-economy-1',
    venue: 'Fallback sample',
    title: 'Central bank signals an earlier-than-expected rate cut',
    url: null,
    category: 'Economy',
    price: 0.31,
    volume: 61000,
    liquidity: 15000,
    movement: -0.04,
    closeTime: null,
    rawSignalNote: 'Local fallback used because live market listings were unavailable.',
  },
  {
    id: 'fallback-tech-1',
    venue: 'Fallback sample',
    title: 'A major AI platform faces a new regulatory action',
    url: null,
    category: 'Technology',
    price: 0.44,
    volume: 54000,
    liquidity: 12000,
    movement: 0.05,
    closeTime: null,
    rawSignalNote: 'Local fallback used because live market listings were unavailable.',
  },
];

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function parsePolymarket(data: unknown): NormalizedMarket[] {
  const rows = Array.isArray(data) ? data : asArray(asRecord(data)?.markets);
  return rows.map((row, index): NormalizedMarket | null => {
    const market = asRecord(row);
    if (!market) return null;
    const id = firstString(market.id, market.conditionId, market.slug) || `polymarket-${index}`;
    const slug = firstString(market.slug);
    const title = firstString(market.question, market.title, market.description);
    if (!title) return null;
    const price = firstNumber(market.lastTradePrice, market.bestAsk, market.bestBid, market.outcomePrices);
    const oneDay = firstNumber(market.oneDayPriceChange, market.priceChange24hr, market.priceChange);
    return {
      id: `polymarket-${id}`,
      venue: 'Polymarket' as const,
      title,
      url: slug ? `https://polymarket.com/event/${slug}` : null,
      category: firstString(market.category, asRecord(market.category)?.label, asRecord(market.category)?.name),
      price,
      volume: firstNumber(market.volume, market.volumeNum, market.volume24hr, market.volume24hrClob),
      liquidity: firstNumber(market.liquidity, market.liquidityNum),
      movement: oneDay,
      closeTime: firstString(market.endDate, market.endDateIso, market.closedTime),
      rawSignalNote: 'Public Polymarket listing; no account or private data used.',
    };
  }).filter((market): market is NormalizedMarket => Boolean(market));
}

function parseKalshi(data: unknown): NormalizedMarket[] {
  const rows = asArray(asRecord(data)?.markets);
  return rows.map((row, index): NormalizedMarket | null => {
    const market = asRecord(row);
    if (!market) return null;
    const ticker = firstString(market.ticker, market.event_ticker) || `kalshi-${index}`;
    const title = firstString(market.title, market.subtitle, market.event_title);
    if (!title) return null;
    const yesBid = firstNumber(market.yes_bid);
    const yesAsk = firstNumber(market.yes_ask);
    const lastPrice = firstNumber(market.last_price);
    const midpointCents = yesBid !== null && yesAsk !== null ? (yesBid + yesAsk) / 2 : lastPrice;
    const previous = firstNumber(market.previous_price, market.open_price);
    const movement = midpointCents !== null && previous !== null ? (midpointCents - previous) / 100 : null;
    return {
      id: `kalshi-${ticker}`,
      venue: 'Kalshi' as const,
      title,
      url: `https://kalshi.com/markets/${ticker}`,
      category: firstString(market.category, market.event_ticker),
      price: midpointCents !== null ? midpointCents / 100 : null,
      volume: firstNumber(market.volume, market.volume_24h),
      liquidity: firstNumber(market.liquidity, market.open_interest),
      movement,
      closeTime: firstString(market.close_time, market.expiration_time),
      rawSignalNote: 'Public Kalshi listing; no account or private data used.',
    };
  }).filter((market): market is NormalizedMarket => Boolean(market));
}

export async function fetchPublicMarkets(): Promise<{ markets: NormalizedMarket[]; sourceStatus: string[] }> {
  const results = await Promise.allSettled([
    fetchJson('https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=80&order=volume&ascending=false'),
    fetchJson('https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=80'),
  ]);

  const markets: NormalizedMarket[] = [];
  const sourceStatus: string[] = [];

  if (results[0].status === 'fulfilled') {
    const parsed = parsePolymarket(results[0].value);
    markets.push(...parsed);
    sourceStatus.push(`Polymarket public listings loaded (${parsed.length}).`);
  } else {
    sourceStatus.push(`Polymarket public listings unavailable: ${results[0].reason instanceof Error ? results[0].reason.message : 'request failed'}.`);
  }

  if (results[1].status === 'fulfilled') {
    const parsed = parseKalshi(results[1].value);
    markets.push(...parsed);
    sourceStatus.push(`Kalshi public listings loaded (${parsed.length}).`);
  } else {
    sourceStatus.push(`Kalshi public listings unavailable: ${results[1].reason instanceof Error ? results[1].reason.message : 'request failed'}.`);
  }

  if (!markets.length) {
    return { markets: FALLBACK_MARKETS, sourceStatus: [...sourceStatus, 'Showing local sample markets until live public listings are reachable.'] };
  }

  return { markets: dedupeMarkets(markets).slice(0, 60), sourceStatus };
}

function dedupeMarkets(markets: NormalizedMarket[]) {
  const seen = new Set<string>();
  return markets.filter((market) => {
    const key = `${market.venue}:${market.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const STOPWORDS = new Set(['about', 'after', 'again', 'against', 'before', 'being', 'between', 'could', 'first', 'from', 'have', 'into', 'major', 'market', 'more', 'news', 'over', 'than', 'that', 'their', 'there', 'this', 'will', 'with', 'would']);

function tokens(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((token) => token.length > 3 && !STOPWORDS.has(token));
}

function overlap(a: string, b: string) {
  const aTokens = new Set(tokens(a));
  const bTokens = new Set(tokens(b));
  if (!aTokens.size || !bTokens.size) return 0;
  let hits = 0;
  for (const token of aTokens) if (bTokens.has(token)) hits += 1;
  return hits / Math.min(aTokens.size, bTokens.size);
}

function marketSignal(market: NormalizedMarket) {
  const volume = market.volume !== null ? Math.min(28, Math.log10(Math.max(10, market.volume)) * 5) : 8;
  const liquidity = market.liquidity !== null ? Math.min(20, Math.log10(Math.max(10, market.liquidity)) * 4) : 6;
  const movement = market.movement !== null ? Math.min(24, Math.abs(market.movement) * 240) : 5;
  const price = market.price !== null ? 8 + Math.min(16, Math.abs(market.price - 0.5) * 22) : 6;
  return Math.round(clamp(volume + liquidity + movement + price, 10, 92));
}

function findMatch(market: NormalizedMarket, stories: MispricedAttentionStory[]) {
  let best: { story: MispricedAttentionStory; score: number } | null = null;
  for (const story of stories) {
    const score = Math.max(
      overlap(market.title, story.headline),
      overlap(`${market.title} ${market.category || ''}`, `${story.headline} ${story.connection} ${story.categoryLabel}`),
    );
    if (!best || score > best.score) best = { story, score };
  }
  return best && best.score >= 0.12 ? best : null;
}

function labelFor(score: number, gap: number, matched: boolean) {
  if (matched && gap >= 24) return 'Market attention ahead of coverage';
  if (matched && score >= 70) return 'Shared market and coverage signal';
  if (!matched && score >= 64) return 'Market-only watch signal';
  return 'Low-confidence watch item';
}

export function scoreMarketAttention(markets: NormalizedMarket[], scanItems: ScanItem[]): MarketAttentionRow[] {
  const stories = buildMispricedAttention(scanItems);
  return markets.map((market) => {
    const matched = findMatch(market, stories);
    const marketSide = marketSignal(market);
    const albisSide = matched ? Math.round(clamp(matched.story.directionalGapSignal, 5, 95)) : 18;
    const matchBoost = matched ? Math.round(matched.score * 22) : 0;
    const gap = Math.round(clamp(marketSide - albisSide + (matched ? 6 : 14), 0, 80));
    const attentionScore = Math.round(clamp(marketSide * 0.52 + albisSide * 0.32 + matchBoost + gap * 0.18, 8, 95));
    const label = labelFor(attentionScore, gap, Boolean(matched));
    return {
      market,
      matchedStory: matched?.story || null,
      attentionScore,
      marketSignal: marketSide,
      albisSignal: albisSide,
      gapSignal: gap,
      label,
      plainEnglish: matched
        ? 'This market is drawing measurable public-market attention and has a nearby Albis coverage-gap signal. Treat it as a prompt to read more, not as a forecast to act on.'
        : 'This market is drawing measurable public-market attention, but there is not yet a close Albis story match in the latest scan.',
      caveats: [
        'Prediction-market listings are noisy and can reflect trader interest, platform mechanics, or entertainment value.',
        'Albis does not verify market pricing and does not provide trading, betting, financial, or legal advice.',
        matched ? 'The Albis match is lexical and directional, not a claim that the market and story are identical.' : 'No close Albis story match was found in the current public scan snapshot.',
      ],
      evidence: [
        `Market signal ${marketSide}/100 from available price, volume, liquidity, and movement fields.`,
        matched ? `Nearest Albis signal: “${matched.story.headline}”.` : 'No nearest Albis signal above the matching threshold.',
        market.rawSignalNote,
      ],
    };
  }).sort((a, b) => b.attentionScore - a.attentionScore).slice(0, 12);
}

export async function buildMarketAttentionBoard(scanItems: ScanItem[]): Promise<MarketAttentionBoard> {
  const { markets, sourceStatus } = await fetchPublicMarkets();
  return {
    rows: scoreMarketAttention(markets, scanItems),
    sourceStatus,
    updatedAt: new Date().toISOString(),
  };
}
