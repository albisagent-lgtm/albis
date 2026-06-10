import { followTargetId, type FollowTarget } from "./follow-utils";
import type { LiveFeedEvent } from "./live-event-feed";

export type FeedMemorySignalType =
  | "open"
  | "save"
  | "unsave"
  | "share"
  | "comment"
  | "follow"
  | "unfollow"
  | "hide"
  | "more_like_this"
  | "less_like_this";

export type FeedMemoryProfile = {
  topics: Record<string, number>;
  people: Record<string, number>;
  sources: Record<string, number>;
  openedCardSlugs: Record<string, number>;
  hiddenCardSlugs: Record<string, number>;
  updatedAt: string;
};

export type RecommendationReason = {
  label: string;
  detail: string;
  strength: number;
};

export type RecommendedFeedEvent = LiveFeedEvent & {
  recommendationScore?: number;
  recommendationReasons?: RecommendationReason[];
};

export type FeedMemorySuggestion = {
  id: string;
  kind: "read" | "tab" | "contribute" | "follow" | "source";
  title: string;
  body: string;
  href: string;
  cta: string;
  reason?: string;
};

const STORAGE_KEY = "albis.feedMemory.v1";
const UNDERCOVERED_TERMS = new Set(["life systems", "life-systems", "weather", "climate", "food", "water", "energy", "governance", "health", "community watch", "community-watch", "infrastructure", "resilience"]);

const SIGNAL_WEIGHTS: Record<FeedMemorySignalType, number> = {
  open: 1,
  save: 4,
  unsave: -3,
  share: 3,
  comment: 5,
  follow: 6,
  unfollow: -4,
  hide: -8,
  more_like_this: 5,
  less_like_this: -4,
};

function emptyFeedMemory(): FeedMemoryProfile {
  return { topics: {}, people: {}, sources: {}, openedCardSlugs: {}, hiddenCardSlugs: {}, updatedAt: new Date().toISOString() };
}

function normalize(value?: string | null) {
  return (value || "").toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function display(value: string) {
  return value.split(" ").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function addScore(map: Record<string, number>, key: string | null | undefined, amount: number) {
  const clean = normalize(key);
  if (!clean) return;
  const next = (map[clean] || 0) + amount;
  if (next <= 0) delete map[clean];
  else map[clean] = Math.round(next * 100) / 100;
}

function cardSlug(card: LiveFeedEvent) {
  return card.cardSlug || card.articleSlug || card.id;
}

function cardTopics(card: LiveFeedEvent) {
  return Array.from(new Set([card.label, ...(card.tags || [])].map(normalize).filter(Boolean)));
}

function isUndercoveredCard(card: LiveFeedEvent) {
  const terms = [card.label, card.source, ...(card.tags || [])].map(normalize);
  const hasTerm = terms.some((term) => UNDERCOVERED_TERMS.has(term));
  return hasTerm || card.label === "weather" || ((card.commentCount || 0) <= 1 && Boolean(card.sourceHref));
}

export function readFeedMemory(): FeedMemoryProfile {
  if (typeof window === "undefined") return emptyFeedMemory();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyFeedMemory();
    const parsed = JSON.parse(raw) as Partial<FeedMemoryProfile>;
    return {
      topics: parsed.topics && typeof parsed.topics === "object" ? parsed.topics : {},
      people: parsed.people && typeof parsed.people === "object" ? parsed.people : {},
      sources: parsed.sources && typeof parsed.sources === "object" ? parsed.sources : {},
      openedCardSlugs: parsed.openedCardSlugs && typeof parsed.openedCardSlugs === "object" ? parsed.openedCardSlugs : {},
      hiddenCardSlugs: parsed.hiddenCardSlugs && typeof parsed.hiddenCardSlugs === "object" ? parsed.hiddenCardSlugs : {},
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyFeedMemory();
  }
}

export function writeFeedMemory(memory: FeedMemoryProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...memory, updatedAt: new Date().toISOString() }));
  window.dispatchEvent(new CustomEvent("albis-feed-memory-change"));
}

export function applyFeedMemorySignal(card: LiveFeedEvent, signalType: FeedMemorySignalType) {
  if (typeof window === "undefined") return emptyFeedMemory();
  const memory = readFeedMemory();
  const weight = SIGNAL_WEIGHTS[signalType];
  for (const topic of cardTopics(card)) addScore(memory.topics, topic, weight);
  addScore(memory.people, card.author && card.author !== "Albis" ? card.author : null, weight);
  addScore(memory.sources, card.source || card.sourceHref, weight);
  const slug = cardSlug(card);
  if (signalType === "open") memory.openedCardSlugs[slug] = Date.now();
  if (signalType === "hide") memory.hiddenCardSlugs[slug] = Date.now();
  if (signalType === "less_like_this") memory.openedCardSlugs[slug] = Date.now();
  writeFeedMemory(memory);
  return memory;
}

function scoreMapMatch(keys: string[], scores: Record<string, number>) {
  return keys.reduce((sum, key) => sum + (scores[key] || 0), 0);
}

function followedMatch(card: LiveFeedEvent, follows: Record<string, FollowTarget>) {
  const ids = new Set<string>();
  if (card.author && card.author !== "Albis") ids.add(followTargetId("person", card.author));
  if (card.label) ids.add(followTargetId("topic", card.label));
  for (const tag of card.tags || []) ids.add(followTargetId("topic", tag));
  if (card.source) ids.add(followTargetId("source", card.source));
  return [...ids].filter((id) => follows[id]).map((id) => follows[id]);
}

function topEntries(map: Record<string, number>, limit = 3) {
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function scoreFeedCards(cards: LiveFeedEvent[], memory: FeedMemoryProfile, follows: Record<string, FollowTarget> = {}, mode: "for-you" | "undercovered" = "for-you"): RecommendedFeedEvent[] {
  return cards
    .map((card, index) => {
      const slug = cardSlug(card);
      if (memory.hiddenCardSlugs[slug]) return null;
      const topics = cardTopics(card);
      const topicScore = scoreMapMatch(topics, memory.topics);
      const personKey = normalize(card.author && card.author !== "Albis" ? card.author : null);
      const personScore = personKey ? memory.people[personKey] || 0 : 0;
      const sourceKey = normalize(card.source || card.sourceHref);
      const sourceScore = sourceKey ? memory.sources[sourceKey] || 0 : 0;
      const matchedFollows = followedMatch(card, follows);
      const undercovered = isUndercoveredCard(card);
      const openedPenalty = memory.openedCardSlugs[slug] ? -1.5 : 0;
      const freshness = card.timestamp ? 0.8 : 0;
      const tabBonus = card.authorHref ? 0.7 : 0;
      const base = 3 + Math.max(0, 20 - index) * 0.04;
      const score = base + topicScore * 1.2 + personScore * 1.15 + sourceScore * 0.8 + matchedFollows.length * 5 + (undercovered ? 1.6 : 0) + freshness + tabBonus + openedPenalty;
      const reasons: RecommendationReason[] = [];
      const topicReasons = topics.filter((topic) => memory.topics[topic]).sort((a, b) => memory.topics[b] - memory.topics[a]);
      if (matchedFollows[0]) reasons.push({ label: "Because you follow", detail: matchedFollows[0].label, strength: 6 });
      if (topicReasons[0]) reasons.push({ label: "Because you return to", detail: display(topicReasons[0]), strength: memory.topics[topicReasons[0]] });
      if (personScore > 0 && card.author) reasons.push({ label: "Because this author overlaps", detail: card.author, strength: personScore });
      if (sourceScore > 0 && card.source) reasons.push({ label: "Because this source appears in your Feed Memory", detail: card.source, strength: sourceScore });
      if (undercovered) reasons.push({ label: "Because it adds", detail: "undercovered context", strength: 1.6 });
      if (card.authorHref) reasons.push({ label: "Because this author has", detail: "a public Tab to explore", strength: 0.7 });
      if (!reasons.length) reasons.push({ label: "Because it may broaden", detail: "your Albis context", strength: 0.5 });
      return { ...card, recommendationScore: score, recommendationReasons: reasons.sort((a, b) => b.strength - a.strength).slice(0, 3) };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (mode === "undercovered") {
        const aUnder = isUndercoveredCard(a as LiveFeedEvent) ? 1 : 0;
        const bUnder = isUndercoveredCard(b as LiveFeedEvent) ? 1 : 0;
        if (aUnder !== bUnder) return bUnder - aUnder;
      }
      return ((b as RecommendedFeedEvent).recommendationScore || 0) - ((a as RecommendedFeedEvent).recommendationScore || 0);
    }) as RecommendedFeedEvent[];
}

export function feedMemorySummary(memory: FeedMemoryProfile) {
  return {
    topics: topEntries(memory.topics),
    people: topEntries(memory.people),
    sources: topEntries(memory.sources),
    hiddenCount: Object.keys(memory.hiddenCardSlugs).length,
  };
}

export function hasFeedMemory(memory: FeedMemoryProfile) {
  return Object.keys(memory.topics).length + Object.keys(memory.people).length + Object.keys(memory.sources).length > 0;
}

export function formatMemoryLabel(value: string) {
  return display(value);
}

function firstMeaningfulTopic(card?: LiveFeedEvent, memory?: FeedMemoryProfile) {
  const memoryTopic = memory ? topEntries(memory.topics, 1)[0]?.[0] : null;
  if (memoryTopic) return display(memoryTopic);
  const cardTopic = cardTopics(card || ({} as LiveFeedEvent))[0];
  return cardTopic ? display(cardTopic) : "this thread";
}

function contributionNoun(card?: LiveFeedEvent) {
  const topic = firstMeaningfulTopic(card).toLowerCase();
  return topic === "this thread" ? "this thread" : topic;
}

export function buildFeedMemorySuggestions(cards: RecommendedFeedEvent[], memory: FeedMemoryProfile, follows: Record<string, FollowTarget> = {}): FeedMemorySuggestion[] {
  const suggestions: FeedMemorySuggestion[] = [];
  const memoryReady = hasFeedMemory(memory) || Object.keys(follows).length > 0;
  const readCard = cards.find((card) => !memory.hiddenCardSlugs[cardSlug(card)] && card.href !== "/create");
  const tabCard = cards.find((card) => card.authorHref && card.author && card.author !== "Albis");
  const topic = firstMeaningfulTopic(readCard, memory);

  if (!memoryReady) {
    if (readCard) {
      suggestions.push({
        id: `start-read-${cardSlug(readCard)}`,
        kind: "read",
        title: "Start with one useful post",
        body: "Open or save a post that feels useful. Feed Memory will begin shaping For You around what you’re trying to understand.",
        href: readCard.href,
        cta: "Open post",
        reason: readCard.label ? display(normalize(readCard.label)) : undefined,
      });
    }
    suggestions.push(
      {
        id: "start-follow",
        kind: "follow",
        title: "Follow a topic or person",
        body: "Following gives Albis a clear signal without guessing. Your For You feed will stay easy to tune.",
        href: "/?filter=following",
        cta: "Find follows",
      },
      {
        id: "start-create",
        kind: "contribute",
        title: "Add a note of your own",
        body: "A source, question, or short observation can become part of your public Tab over time.",
        href: "/create",
        cta: "Create post",
      },
    );
    return suggestions.slice(0, 3);
  }

  if (readCard) {
    suggestions.push({
      id: `read-${cardSlug(readCard)}`,
      kind: "read",
      title: `Continue with ${topic}`,
      body: `You’ve been spending time around ${topic.toLowerCase()}. This post adds a useful next layer.`,
      href: readCard.href,
      cta: readCard.action === "Read" ? "Read story" : "Open post",
      reason: readCard.recommendationReasons?.[0] ? `${readCard.recommendationReasons[0].label} ${readCard.recommendationReasons[0].detail}` : undefined,
    });
  }

  if (tabCard?.authorHref) {
    suggestions.push({
      id: `tab-${cardSlug(tabCard)}`,
      kind: "tab",
      title: "Explore this contributor’s Tab",
      body: `${tabCard.author} is connected to this thread. Their Tab gathers posts, topics, and sources in one place.`,
      href: `${tabCard.authorHref}?tab=tab`,
      cta: "Open Tab",
      reason: tabCard.title,
    });
  }

  suggestions.push({
    id: `source-${normalize(topic) || "thread"}`,
    kind: "source",
    title: "Add a source to this thread",
    body: `If you have a useful source, question, or note on ${contributionNoun(readCard)}, add it to the feed and strengthen your Tab.`,
    href: "/create",
    cta: "Add source",
    reason: "Source-backed posts keep Albis traceable.",
  });

  if (suggestions.length < 3) {
    suggestions.push({
      id: "post-note",
      kind: "contribute",
      title: "Post a short note",
      body: "Even a brief observation can help the next reader understand what matters and what is still unclear.",
      href: "/create",
      cta: "Create post",
    });
  }

  return suggestions.slice(0, 3);
}
