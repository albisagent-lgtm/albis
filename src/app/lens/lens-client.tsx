"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { PILLARS, type PillarSlug } from "@/lib/pillars";

interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readingTime: number;
  category?: string;
  image?: string;
  pillars?: string[];
}

// ── Article Type Detection ─────────────────────────────────────

type ArticleType = "today" | "breaking" | "explainer" | "quick-take" | "deep-dive" | "all";
type TopicFilter = "geopolitics" | "climate-energy" | "ai-tech" | "health" | "human-rights" | "economics";
type PillarFilter = PillarSlug | "all";

const TYPE_FILTERS: { label: string; value: ArticleType }[] = [
  { label: "Today", value: "today" },
  { label: "All", value: "all" },
  { label: "Breaking", value: "breaking" },
  { label: "Explainers", value: "explainer" },
  { label: "Quick Takes", value: "quick-take" },
  { label: "Deep Dives", value: "deep-dive" },
];

const TOPIC_FILTERS: { label: string; value: TopicFilter }[] = [
  { label: "Geopolitics", value: "geopolitics" },
  { label: "Climate & Energy", value: "climate-energy" },
  { label: "AI & Tech", value: "ai-tech" },
  { label: "Health", value: "health" },
  { label: "Human Rights", value: "human-rights" },
  { label: "Economics", value: "economics" },
];

const PILLAR_FILTERS: { label: string; value: PillarFilter; emoji: string }[] = [
  { label: "All", value: "all", emoji: "" },
  { label: PILLARS["the-race"].name, value: "the-race", emoji: PILLARS["the-race"].emoji },
  { label: PILLARS["the-flow"].name, value: "the-flow", emoji: PILLARS["the-flow"].emoji },
  { label: PILLARS["the-signal"].name, value: "the-signal", emoji: PILLARS["the-signal"].emoji },
  { label: PILLARS["the-human-cost"].name, value: "the-human-cost", emoji: PILLARS["the-human-cost"].emoji },
];

function detectArticleType(post: Post): ArticleType[] {
  const types: ArticleType[] = [];
  const tagsLower = post.tags.map(t => t.toLowerCase());
  const titleLower = post.title.toLowerCase();
  const slugLower = post.slug.toLowerCase();

  // Breaking
  if (
    post.category === "breaking" ||
    tagsLower.includes("breaking") ||
    tagsLower.includes("reactive") ||
    titleLower.includes("breaking")
  ) {
    types.push("breaking");
  }

  // Quick Take
  if (
    tagsLower.includes("quick-take") ||
    tagsLower.includes("quick-takes") ||
    titleLower.includes("quick take") ||
    slugLower.includes("quick-take")
  ) {
    types.push("quick-take");
  }

  // Explainer
  if (
    tagsLower.includes("explainer") ||
    post.category === "media-literacy" ||
    titleLower.includes("explainer") ||
    titleLower.includes("explained") ||
    slugLower.includes("explainer")
  ) {
    types.push("explainer");
  }

  // Deep Dive (long-form: 8+ min read)
  if (post.readingTime >= 8) {
    types.push("deep-dive");
  }

  return types;
}

function detectTopics(post: Post): TopicFilter[] {
  const topics: TopicFilter[] = [];
  const tagsLower = post.tags.map(t => t.toLowerCase());
  const catLower = (post.category || "").toLowerCase();

  // Geopolitics
  const geoKeywords = ["geopolitics", "iran", "pakistan", "china", "russia", "ukraine", "israel", "middle-east", "military", "war", "conflict", "nato", "diplomacy", "sanctions"];
  if (catLower.includes("geopolit") || geoKeywords.some(k => tagsLower.includes(k))) {
    topics.push("geopolitics");
  }

  // Climate & Energy
  const climateKeywords = ["climate", "clean-energy", "energy", "oil", "emissions", "renewable", "solar", "wind", "water", "environment", "carbon"];
  if (catLower.includes("climate") || catLower.includes("energy") || climateKeywords.some(k => tagsLower.includes(k))) {
    topics.push("climate-energy");
  }

  // AI & Tech
  const aiKeywords = ["ai", "ai-intelligence", "tech", "cybersecurity", "deepfakes", "artificial-intelligence", "machine-learning", "automation", "surveillance", "edtech"];
  if (catLower.includes("tech") || aiKeywords.some(k => tagsLower.includes(k))) {
    topics.push("ai-tech");
  }

  // Health
  const healthKeywords = ["health", "health-longevity", "pandemic", "disease", "aging", "mental-health", "public-health", "vaccine", "bird-flu", "h5n1", "mpox"];
  if (catLower.includes("health") || healthKeywords.some(k => tagsLower.includes(k))) {
    topics.push("health");
  }

  // Human Rights
  const rightsKeywords = ["human-rights", "womens-rights", "gender-equality", "refugees", "migration", "education", "democracy", "protests", "femicide", "reproductive-rights"];
  if (catLower.includes("migration") || catLower.includes("women") || rightsKeywords.some(k => tagsLower.includes(k))) {
    topics.push("human-rights");
  }

  // Economics
  const econKeywords = ["economics", "economy", "trade", "debt", "inflation", "markets", "stock-market", "food-security", "supply-chain", "labor", "layoffs", "austerity"];
  if (econKeywords.some(k => tagsLower.includes(k))) {
    topics.push("economics");
  }

  return topics;
}

function isWithin24h(dateString: string): boolean {
  const d = new Date(dateString);
  const now = new Date();
  return now.getTime() - d.getTime() < 24 * 3600000;
}

function isRecent(dateString: string, hours: number = 36): boolean {
  const d = new Date(dateString);
  const now = new Date();
  return now.getTime() - d.getTime() < hours * 3600000;
}

const ITEMS_PER_PAGE = 12;

function getContentDepthBadge(readingTime: number) {
  if (readingTime <= 3) return { label: "Quick Read", color: "text-emerald-500/80 dark:text-emerald-400/70" };
  if (readingTime >= 8) return { label: "Deep Dive", color: "text-purple-500/80 dark:text-purple-400/70" };
  return null;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getRelativeDate(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0 && diffHrs < 24) {
    if (diffHrs < 1) {
      const mins = Math.floor(diffMs / 60000);
      return `${mins}m ago`;
    }
    return `${diffHrs}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  return formatDate(dateString);
}

// ── Intelligence Deep Dive Cards ─────────────────────────────────────

function getFeaturedIntelligence(pillar: PillarFilter) {
  switch (pillar) {
    case "the-signal":
      return {
        title: "Information Warfare Tracker",
        description: "24 active campaigns, 10 state actors — tracking how information is weaponized across the globe",
        icon: "⚔️",
        href: "/intelligence/information-warfare",
        color: "border-red-500/20 bg-red-50/50 dark:border-red-500/10 dark:bg-red-950/10",
        badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400",
      };
    case "the-flow":
      return {
        title: "Energy Geopolitics Dashboard",
        description: "5 pillars of energy power — who controls fossil, leads renewables, and wins the nuclear race",
        icon: "⚡",
        href: "/intelligence/energy",
        color: "border-emerald-500/20 bg-emerald-50/50 dark:border-emerald-500/10 dark:bg-emerald-950/10",
        badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      };
    case "the-race":
      return {
        title: "The AI Race",
        description: "Who controls AI infrastructure and how it reshapes the global information order — coming soon",
        icon: "🧠",
        href: null,
        color: "border-blue-500/20 bg-blue-50/50 dark:border-blue-500/10 dark:bg-blue-950/10",
        badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      };
    default:
      return null;
  }
}

function IntelligenceCard({ pillar }: { pillar: PillarFilter }) {
  const featured = getFeaturedIntelligence(pillar);
  
  if (!featured) return null;

  const content = (
    <div className={`mb-8 rounded-2xl border p-6 transition-all ${featured.color} ${
      featured.href ? "cursor-pointer hover:shadow-lg group" : ""
    }`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">{featured.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              {featured.title}
            </h3>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${featured.badgeColor}`}>
              {featured.href ? "Intelligence Deep Dive" : "Coming Soon"}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {featured.description}
          </p>
          {featured.href && (
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100">
              Explore Intelligence →
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (featured.href) {
    return (
      <Link href={featured.href}>
        {content}
      </Link>
    );
  }

  return content;
}

function FreshDate({ dateString }: { dateString: string }) {
  const [label] = useState(() => getRelativeDate(dateString));
  return <>{label}</>;
}

function getTypeLabel(post: Post): string {
  const types = detectArticleType(post);
  if (types.includes("breaking")) return "Breaking";
  if (types.includes("quick-take")) return "Quick Take";
  if (types.includes("explainer")) return "Explainer";
  if (types.includes("deep-dive")) return "Deep Dive";
  // Fall back to topic
  const topics = detectTopics(post);
  const topicLabels: Record<TopicFilter, string> = {
    "geopolitics": "Geopolitics",
    "climate-energy": "Climate & Energy",
    "ai-tech": "AI & Tech",
    "health": "Health",
    "human-rights": "Human Rights",
    "economics": "Economics",
  };
  if (topics.length > 0) return topicLabels[topics[0]];
  return "Analysis";
}

// ── Today's Picks Card ─────────────────────────────────────────

function PickCard({ post, size = "normal" }: { post: Post; size?: "large" | "normal" }) {
  const depthBadge = getContentDepthBadge(post.readingTime);
  const isLarge = size === "large";
  const hasImage = post.image && post.image !== "/og-image.png";

  return (
    <Link
      href={`/lens/${post.slug}`}
      className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-800/80 to-zinc-900/95 p-5 transition-all hover:border-[#c8922a]/30 hover:shadow-lg hover:shadow-[#c8922a]/5 ${
        isLarge ? "md:row-span-2 min-h-[320px]" : "min-h-[180px]"
      }`}
    >
      {hasImage && (
        <Image
          src={post.image!}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={isLarge ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-[#c8922a]/40 bg-[#c8922a]/20 px-2.5 py-0.5 font-semibold text-[#c8922a]">
            {getTypeLabel(post)}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">{post.readingTime} min</span>
          {depthBadge && <span className={`font-medium ${depthBadge.color}`}>{depthBadge.label}</span>}
        </div>
        <h3 className={`mt-3 font-[family-name:var(--font-playfair)] font-bold leading-tight tracking-tight text-white group-hover:text-[#e8b84a] transition-colors ${
          isLarge ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
        }`}>
          {post.title}
        </h3>
        {isLarge && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {post.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{post.author}</span>
          <span>·</span>
          <time><FreshDate dateString={post.date} /></time>
        </div>
      </div>
    </Link>
  );
}

// ── Standard Article Card ──────────────────────────────────────

function ArticleCard({ post }: { post: Post }) {
  const depthBadge = getContentDepthBadge(post.readingTime);
  const hasImage = post.image && post.image !== "/og-image.png";

  return (
    <article>
      <Link
        href={`/lens/${post.slug}`}
        className="group block h-full overflow-hidden rounded-xl border border-black/[0.07] bg-white/30 transition-all hover:border-black/[0.12] hover:shadow-md dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-white/[0.12]"
      >
        {hasImage && (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={post.image!}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        )}
        <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-[#c8922a]/30 bg-[#c8922a]/10 px-2.5 py-0.5 font-medium text-[#c8922a] dark:border-[#c8922a]/40 dark:bg-[#c8922a]/20">
            {getTypeLabel(post)}
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">{post.readingTime} min read</span>
          {depthBadge && (
            <>
              <span className="text-zinc-400 dark:text-zinc-500">·</span>
              <span className={`font-medium ${depthBadge.color}`}>{depthBadge.label}</span>
            </>
          )}
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug tracking-tight group-hover:text-[#c8922a] dark:group-hover:text-[#c8922a] md:text-xl">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {post.description}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <span>{post.author}</span>
          <span>·</span>
          <time><FreshDate dateString={post.date} /></time>
        </div>
        </div>
      </Link>
    </article>
  );
}

// ── Compact List Row ───────────────────────────────────────────

function ArticleRow({ post }: { post: Post }) {
  const depthBadge = getContentDepthBadge(post.readingTime);
  const hasImage = post.image && post.image !== "/og-image.png";

  return (
    <article className="py-4">
      <Link href={`/lens/${post.slug}`} className="group flex gap-4">
        {hasImage && (
          <div className="relative hidden sm:block h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={post.image!}
              alt={post.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-[#c8922a]/30 bg-[#c8922a]/10 px-2 py-0.5 font-medium text-[#c8922a] dark:border-[#c8922a]/40 dark:bg-[#c8922a]/20">
            {getTypeLabel(post)}
          </span>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">{post.readingTime} min read</span>
          {depthBadge && (
            <>
              <span className="text-zinc-400">·</span>
              <span className={`font-medium ${depthBadge.color}`}>{depthBadge.label}</span>
            </>
          )}
          <span className="text-zinc-400">·</span>
          <time className="text-zinc-500 dark:text-zinc-400"><FreshDate dateString={post.date} /></time>
        </div>
        <h3 className="mt-2 text-base font-semibold leading-snug group-hover:text-[#c8922a] dark:group-hover:text-[#c8922a]">
          {post.title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">{post.description}</p>
        </div>
      </Link>
    </article>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function LensClient({ posts, initialPillar }: { posts: Post[]; initialPillar?: string }) {
  const validInitialPillar = initialPillar && Object.keys(PILLARS).includes(initialPillar) && initialPillar !== "the-lens" ? initialPillar as PillarSlug : "all";
  const [activePillar, setActivePillar] = useState<PillarFilter>(validInitialPillar);
  const [activeType, setActiveType] = useState<ArticleType>("all");
  const [activeTopic, setActiveTopic] = useState<TopicFilter | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState("");

  // Today's picks for the hero section (shown only on "today" tab)
  const todaysPicks = useMemo(() => {
    return posts.filter(p => isRecent(p.date, 36)).slice(0, 7);
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Pillar filter (first priority)
    if (activePillar !== "all") {
      result = result.filter(p => p.pillars?.includes(activePillar));
    }

    // Type filter
    if (activeType === "today") {
      result = result.filter(p => isWithin24h(p.date));
    } else if (activeType !== "all") {
      result = result.filter(p => detectArticleType(p).includes(activeType));
    }

    // Topic filter
    if (activeTopic) {
      result = result.filter(p => detectTopics(p).includes(activeTopic));
    }

    // On "today" tab with no results in 24h, show picks from 36h (but only when no pillar filter)
    if (activeType === "today" && result.length === 0 && !activeTopic && activePillar === "all") {
      result = posts.filter(p => isRecent(p.date, 36));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [posts, activePillar, activeType, activeTopic, searchQuery]);

  // For "today" tab, separate hero picks from the rest
  const heroPicks = activeType === "today" && !activeTopic ? todaysPicks : [];
  const heroSlugs = new Set(heroPicks.map(p => p.slug));
  const listPosts = activeType === "today" && !activeTopic
    ? filteredPosts.filter(p => !heroSlugs.has(p.slug))
    : filteredPosts;

  const visiblePosts = listPosts.slice(0, visibleCount);
  const hasMore = visibleCount < listPosts.length;

  const handlePillarChange = (pillar: PillarFilter) => {
    setActivePillar(pillar);
    setActiveType("all"); // Reset type filter when changing pillars
    setActiveTopic(null); // Reset topic filter when changing pillars
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const handleTypeChange = (type: ArticleType) => {
    setActiveType(type);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const handleTopicChange = (topic: TopicFilter) => {
    setActiveTopic(activeTopic === topic ? null : topic);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // Counts for type filters
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts["today"] = posts.filter(p => isWithin24h(p.date)).length;
    counts["all"] = posts.length;
    counts["breaking"] = posts.filter(p => detectArticleType(p).includes("breaking")).length;
    counts["explainer"] = posts.filter(p => detectArticleType(p).includes("explainer")).length;
    counts["quick-take"] = posts.filter(p => detectArticleType(p).includes("quick-take")).length;
    counts["deep-dive"] = posts.filter(p => detectArticleType(p).includes("deep-dive")).length;
    return counts;
  }, [posts]);

  return (
    <div>
      {/* ── Search ──────────────────────────── */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
          className="w-full max-w-md rounded-lg border border-black/10 bg-white px-4 py-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c8922a]/30 dark:border-white/10 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:text-white"
        />
      </div>

      {/* ── Type Filter Tabs ──────────────────────────── */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleTypeChange(f.value)}
              className={
                activeType === f.value
                  ? "rounded-full bg-[#c8922a] px-4 py-2 text-sm font-medium text-[#0f0f0f] shadow-sm transition-all"
                  : "rounded-full border border-black/[0.07] bg-white/50 px-4 py-2 text-sm text-zinc-600 transition-all hover:border-[#c8922a]/30 hover:bg-[#c8922a]/10 dark:border-white/[0.07] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:text-[#c8922a]"
              }
            >
              {f.label}
              {f.value === "today" && typeCounts["today"] > 0 && (
                <span className="ml-1.5 text-xs opacity-60">{typeCounts["today"]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Topic Filter Row ──────────────────────────── */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {TOPIC_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleTopicChange(f.value)}
              className={
                activeTopic === f.value
                  ? "rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all dark:bg-zinc-200 dark:text-zinc-900"
                  : "rounded-full border border-black/[0.05] bg-white/30 px-3 py-1.5 text-xs text-zinc-500 transition-all hover:border-black/[0.1] hover:text-zinc-700 dark:border-white/[0.05] dark:bg-white/[0.01] dark:text-zinc-500 dark:hover:text-zinc-300"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Today's Hero Picks ────────────────────────── */}
      {heroPicks.length > 0 && (
        <section className="mb-12">
          <div className="mb-5">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight">
              Today&apos;s Picks
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 auto-rows-auto">
            {heroPicks[0] && (
              <div className="md:col-span-1 lg:col-span-2 lg:row-span-2">
                <PickCard post={heroPicks[0]} size="large" />
              </div>
            )}
            {heroPicks.slice(1, 5).map(post => (
              <PickCard key={post.slug} post={post} size="normal" />
            ))}
          </div>

          {heroPicks.length > 5 && (
            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {heroPicks.slice(5).map(post => (
                <PickCard key={post.slug} post={post} size="normal" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Article Grid ──────────────────────────────── */}
      {filteredPosts.length === 0 ? (
        <p className="py-12 text-center text-zinc-400">
          {activeType === "today"
            ? "No articles from the last 24 hours. Check back soon or browse All."
            : "No articles match this filter yet."}
        </p>
      ) : visiblePosts.length === 0 && heroPicks.length > 0 ? null : (
        <>
          <section className="mb-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visiblePosts.slice(0, 6).map(post => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          </section>

          {visiblePosts.length > 6 && (
            <section className="mb-8">
              <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                {visiblePosts.slice(6).map(post => (
                  <ArticleRow key={post.slug} post={post} />
                ))}
              </div>
            </section>
          )}

          {hasMore && (
            <div className="flex justify-center py-8">
              <button
                onClick={() => setVisibleCount(c => c + ITEMS_PER_PAGE)}
                className="rounded-full border border-[#c8922a]/30 bg-[#c8922a]/10 px-8 py-3 text-sm font-medium text-[#c8922a] transition-all hover:bg-[#c8922a]/20 hover:border-[#c8922a]/50"
              >
                Load more articles
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Archive Link ──────────────────────────────── */}
      <div className="mt-8 flex justify-center border-t border-black/[0.05] pt-8 dark:border-white/[0.05]">
        <Link
          href="/lens?view=archive"
          className="text-sm text-zinc-400 hover:text-[#c8922a] transition-colors"
        >
          View full archive →
        </Link>
      </div>
    </div>
  );
}
