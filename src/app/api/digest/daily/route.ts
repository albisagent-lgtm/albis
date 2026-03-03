import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, getSubscriberEmailsByLocalHour } from "@/lib/email";
import { generateDailyDigestHtml } from "@/lib/email-templates/daily-digest";
import type {
  NewsletterData,
  NewsletterItem,
  PgiStory,
  BlogPost,
  PulseItem,
  BlindSpotItem,
} from "@/lib/email-templates/types";
import { CATEGORY_EMOJI, REGION_NAMES } from "@/lib/email-templates/types";
import type { ScanItem } from "@/lib/scan-types";
import { detectBlindspots } from "@/lib/scan-types";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

function authorize(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!auth || !expected) return false;
  return auth === `Bearer ${expected}`;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toNewsletterItem(item: ScanItem): NewsletterItem {
  return {
    headline: item.headline,
    category: item.category,
    connection: item.connection,
    significance: item.significance,
    regions: item.regions,
    tags: item.tags,
    patterns: item.patterns,
    perception_gap: item.perception_gap ?? null,
  };
}

/**
 * Generate a greeting based on scan mood/theme
 */
function generateGreeting(mood: string | null | undefined, topStory: ScanItem): string {
  const greetings = [
    "Good morning.",
    "Good morning, and welcome back.",
    "Morning.",
  ];
  const base = greetings[Math.floor(Date.now() / 86400000) % greetings.length];

  if (mood) {
    const moodLower = typeof mood === "string" ? mood.toLowerCase() : "";
    if (moodLower.includes("tense") || moodLower.includes("volatile")) {
      return `${base} The world woke up tense today — and the reasons are worth understanding.`;
    }
    if (moodLower.includes("hopeful") || moodLower.includes("optimis")) {
      return `${base} There's a rare thread of optimism running through today's headlines. Let's see if it holds.`;
    }
    if (moodLower.includes("uncertain") || moodLower.includes("mixed")) {
      return `${base} Today's news pulls in a few different directions. Here's what matters most.`;
    }
  }

  return `${base} Here's what the world looks like this morning — and what most people are missing.`;
}

/**
 * Build pulse items from economic/market scan items
 */
function buildPulseItems(items: ScanItem[]): PulseItem[] {
  const pulse: PulseItem[] = [];

  // Find economic/market/business items
  const econItems = items.filter(
    (i) =>
      i.category === "economic-flows" ||
      i.tags?.some((t) =>
        /market|economy|gdp|inflation|trade|stock|oil|crypto|dollar|rate/i.test(t)
      )
  );

  // Extract data points from headlines/connections
  for (const item of econItems.slice(0, 4)) {
    // Try to extract a number from the headline
    const numMatch = item.headline.match(/(\$[\d,.]+[BMT]?|[\d,.]+%|[\d,.]+\s*(billion|million|trillion))/i);
    if (numMatch) {
      // Use a short label from the headline
      const label = item.headline
        .replace(numMatch[0], "")
        .replace(/[:\-–—]/g, "")
        .trim()
        .slice(0, 30)
        .trim();
      pulse.push({ label: label || item.category, value: numMatch[0] });
    }
  }

  // If we couldn't extract real numbers, skip The Pulse entirely
  // (don't show internal tracking metrics to readers)

  return pulse.slice(0, 4);
}

/**
 * Build lead story analysis from the top scan item
 */
function buildBigStoryAnalysis(item: ScanItem): {
  whatHappened: string;
  perspectives: { region: string; view: string }[];
  whatEveryoneMisses: string;
  zoomOut: string;
} {
  const whatHappened = item.connection || item.headline;

  // Build regional perspectives from regions array
  const perspectives: { region: string; view: string }[] = [];
  const regions = item.regions || [];

  if (regions.length >= 2) {
    // Use the scan item's framing data if available, otherwise build from regions
    for (const region of regions.slice(0, 3)) {
      const name = REGION_NAMES[region] || region.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      perspectives.push({
        region: name,
        view: `Coverage in this region emphasizes local implications and frames the story through its own economic and political lens.`,
      });
    }
  } else {
    perspectives.push({
      region: "Global",
      view: "This story is generating attention worldwide, but coverage varies significantly by region.",
    });
  }

  // "What everyone misses" — from patterns or tags
  let whatEveryoneMisses =
    "The surface-level debate obscures deeper structural forces at play. Look past the headlines and you'll find the real story is about who benefits from how this narrative is being framed.";
  if (item.patterns && item.patterns.length > 0) {
    whatEveryoneMisses = `The pattern here — ${item.patterns[0]} — is the real story. Most coverage focuses on the immediate event, but this connects to a broader shift that's been building for months.`;
  }

  // "Zoom Out" — wider context
  let zoomOut =
    "Step back far enough and this is part of a larger global realignment. The decisions made now will echo for years.";
  if (item.tags && item.tags.length > 1) {
    zoomOut = `This sits at the intersection of ${item.tags.slice(0, 3).join(", ")}. The real question isn't what happened — it's what this signals about where things are heading next.`;
  }

  return { whatHappened, perspectives, whatEveryoneMisses, zoomOut };
}

/**
 * Find the best blind spot story — high perception gap or limited regional coverage
 */
function findBlindSpot(items: ScanItem[], allRegions: Set<string>): BlindSpotItem | null {
  // First try: highest perception_gap score
  const withGap = items
    .filter((i) => i.perception_gap && i.perception_gap >= 5)
    .sort((a, b) => (b.perception_gap || 0) - (a.perception_gap || 0));

  if (withGap.length > 0) {
    const item = withGap[0];
    const covered = item.regions || [];
    const missing = [...allRegions].filter((r) => !covered.includes(r));
    if (missing.length > 0) {
      return {
        headline: item.headline,
        connection: item.connection,
        coveredIn: covered.slice(0, 3),
        missingFrom: missing.slice(0, 3),
        category: item.category,
      };
    }
  }

  // Fallback: story with fewest regions (limited coverage = blind spot)
  const limited = items
    .filter((i) => i.regions && i.regions.length >= 1 && i.regions.length <= 2)
    .sort((a, b) => a.regions.length - b.regions.length);

  if (limited.length > 0) {
    const item = limited[0];
    const covered = item.regions || [];
    const missing = [...allRegions].filter((r) => !covered.includes(r)).slice(0, 3);
    if (missing.length > 0) {
      return {
        headline: item.headline,
        connection: item.connection,
        coveredIn: covered,
        missingFrom: missing,
        category: item.category,
      };
    }
  }

  return null;
}

/**
 * Get recent blog posts from the content/blog directory.
 */
function getRecentBlogPosts(today: string, yesterday: string): BlogPost[] {
  try {
    const blogDir = path.join(process.cwd(), "content", "blog");
    if (!fs.existsSync(blogDir)) return [];

    const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
    const posts: BlogPost[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(blogDir, file), "utf-8");
        const { data } = matter(content);
        const postDate = typeof data.date === "string" ? data.date : data.date?.toISOString?.()?.split("T")[0];
        if (postDate && (postDate === today || postDate === yesterday)) {
          posts.push({
            slug: file.replace(/\.(md|mdx)$/, ""),
            title: data.title || file,
            description: data.description || "",
            date: postDate,
            tags: data.tags || [],
          });
        }
      } catch {
        // skip malformed files
      }
    }

    return posts.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  } catch {
    return [];
  }
}

/**
 * Assemble all newsletter data from Supabase + filesystem.
 */
async function getNewsletterData(): Promise<NewsletterData | null> {
  const supabase = createAdminClient();
  const now = new Date();
  const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
  const today = nzDate.toISOString().split("T")[0];
  const yesterday = new Date(nzDate.getTime() - 86400000).toISOString().split("T")[0];

  // Fetch scans + PGI scores in parallel
  const [scansResult, pgiResult] = await Promise.all([
    supabase
      .from("scans")
      .select("*")
      .in("scan_date", [today, yesterday])
      .order("scan_date", { ascending: false })
      .order("scan_time", { ascending: false }),
    supabase
      .from("pgi_story_scores")
      .select("*")
      .in("scan_date", [today, yesterday])
      .eq("is_latest", true)
      .order("story_pgi", { ascending: false })
      .limit(5),
  ]);

  if (scansResult.error) throw new Error(`Scans error: ${scansResult.error.message}`);
  if (!scansResult.data?.length) return null;

  const latest = scansResult.data[0];

  // Deduplicate scan items
  const allItems: ScanItem[] = [];
  for (const scan of scansResult.data) {
    if (scan.items && Array.isArray(scan.items)) {
      allItems.push(...scan.items);
    }
  }
  const seen = new Map<string, ScanItem>();
  const sigOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  for (const item of allItems) {
    const key = item.headline.toLowerCase();
    const existing = seen.get(key);
    if (!existing || (sigOrder[item.significance] || 0) > (sigOrder[existing.significance] || 0)) {
      seen.set(key, item);
    }
  }
  const items = detectBlindspots(Array.from(seen.values()));

  // Collect all regions for blind spot detection
  const allRegions = new Set<string>();
  for (const item of items) {
    if (item.regions) {
      for (const r of item.regions) allRegions.add(r);
    }
  }

  // Sort by significance
  const sorted = [...items].sort((a, b) => (sigOrder[b.significance] || 0) - (sigOrder[a.significance] || 0));

  // If no items, return null (no newsletter to send)
  if (sorted.length === 0) return null;

  // Good Morning
  const greeting = generateGreeting(latest.mood, sorted[0]);

  // The Pulse
  const pulseItems = buildPulseItems(items);

  // The Full Picture — lead story
  const bigStory = toNewsletterItem(sorted[0]);
  const bigStoryAnalysis = buildBigStoryAnalysis(sorted[0]);

  // World at a Glance — next 4 items
  const glanceItems = sorted.slice(1, 5).map(toNewsletterItem);

  // The Blind Spot
  // Skip items already used in big story + glance
  const usedHeadlines = new Set([bigStory.headline, ...glanceItems.map((g) => g.headline)]);
  const remainingItems = items.filter((i) => !usedHeadlines.has(i.headline));
  const blindSpot = findBlindSpot(remainingItems.length > 0 ? remainingItems : items, allRegions);

  // PGI — highest scoring story for potential use
  let perceptionGap: PgiStory | null = null;
  if (!pgiResult.error && pgiResult.data?.length) {
    const top = pgiResult.data[0];
    perceptionGap = {
      story_headline: top.story_headline,
      story_slug: top.story_slug,
      story_pgi: top.story_pgi,
      category: top.category,
      regions_covered: top.regions_covered || [],
      scoring_rationale: top.scoring_rationale || "",
      d3_framing: top.d3_framing,
      d4_emotional: top.d4_emotional,
    };
  }

  // Worth Reading
  const blogPosts = getRecentBlogPosts(today, yesterday);

  // One Thing
  const pattern = latest.pattern_of_day;
  let closingThought = "The stories that shape the world aren't always the ones that make the loudest noise.";
  if (pattern) {
    if (typeof pattern === "string") {
      closingThought = pattern;
    } else if (pattern.body) {
      closingThought = pattern.body;
    } else if (pattern.title) {
      closingThought = pattern.title;
    }
  }

  return {
    date: latest.scan_date,
    displayDate: formatDisplayDate(latest.scan_date),
    greeting,
    pulseItems,
    bigStory,
    bigStoryAnalysis,
    glanceItems,
    blindSpot,
    perceptionGap,
    blogPosts,
    closingThought,
    mood: latest.mood,
    patternOfDay: pattern || null,
  };
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "timezone";

    const data = await getNewsletterData();
    if (!data) {
      return NextResponse.json({ error: "No scan data available" }, { status: 404 });
    }

    const html = generateDailyDigestHtml(data);
    const subject = `Albis Daily — ${data.bigStory.headline}`;

    let emails: string[];
    // TEST MODE: only send to Ignatius while we're building the newsletter
    const TEST_ONLY_EMAIL = "hazzagazza6743@gmail.com";
    if (mode === "all") {
      emails = [TEST_ONLY_EMAIL];
    } else {
      const allEmails = await getSubscriberEmailsByLocalHour(7);
      emails = allEmails.filter((e) => e === TEST_ONLY_EMAIL);
    }

    if (emails.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        mode,
        note: "No subscribers in this timezone window",
      });
    }

    let sent = 0;
    for (const to of emails) {
      try {
        await sendEmail({ to, subject, html });
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${to}:`, err);
      }
    }

    return NextResponse.json({ success: true, sent, total: emails.length, mode, date: data.date });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Daily digest error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
