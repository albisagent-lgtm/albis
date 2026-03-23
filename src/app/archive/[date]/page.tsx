import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { markdownToHtml } from "@/lib/markdown";
import { EmailCapture } from "@/app/components/email-capture";

interface ScanItem {
  headline: string;
  connection?: string;
  significance?: string;
  category?: string;
  regions?: string[];
  tags?: string[];
  perception_gap?: number;
}

interface Scan {
  scan_time: string;
  top_theme: string | null;
  pattern_of_day: string | { body?: string; title?: string } | null;
  framing_watch: string | null;
  items: ScanItem[] | null;
  mood: string | null;
}

interface Briefing {
  id: string;
  date: string;
  title: string;
  summary: string | null;
  content_md: string;
  mood: string | null;
  pgi_score: number | null;
  story_count: number | null;
}

interface Neighbor {
  date: string;
  title: string | null;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getBriefing(date: string): Promise<Briefing | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("briefings")
    .select("*")
    .eq("date", date)
    .single();

  if (error || !data) return null;
  return data as Briefing;
}

function cleanTitle(title: string): string {
  return title.replace(/\s*—\s*\d{4}-\d{2}-\d{2}\s*$/, "");
}

function cleanMood(mood: string | null): string | null {
  if (!mood || mood.length <= 20) return mood;
  return mood.split(/[\s,;:—–-]/)[0] || mood;
}

function contentIsBroken(md: string): boolean {
  if (!md || md.length < 50) return true;
  if (md.includes("```json")) return true;
  if (md.includes("[Content as provided above]")) return true;
  if (md.includes("[object Object]")) return true;
  const jsonBlocks = md.match(/\{[\s\S]*?\}/g);
  if (jsonBlocks) {
    const jsonLen = jsonBlocks.reduce((s, b) => s + b.length, 0);
    if (jsonLen / md.length > 0.3) return true;
  }
  return false;
}

function generateMarkdownFromScans(scans: Scan[]): string {
  const order: Record<string, number> = { AM: 0, Midday: 1, PM: 2 };
  scans.sort((a, b) => (order[a.scan_time] || 0) - (order[b.scan_time] || 0));

  const lines: string[] = [];
  const seen = new Set<string>();
  const allItems: ScanItem[] = [];
  let topTheme: string | null = null;
  let patternOfDay: string | null = null;
  let framingWatch: string | null = null;

  for (const scan of scans) {
    if (scan.top_theme && !topTheme) topTheme = scan.top_theme;
    if (scan.pattern_of_day && !patternOfDay) {
      if (typeof scan.pattern_of_day === 'object') {
        patternOfDay = (scan.pattern_of_day as any).body || (scan.pattern_of_day as any).title || null;
      } else {
        patternOfDay = scan.pattern_of_day;
      }
    }
    if (scan.framing_watch && !framingWatch) framingWatch = scan.framing_watch;
    if (scan.items && Array.isArray(scan.items)) {
      for (const item of scan.items) {
        if (item.headline && !seen.has(item.headline)) {
          seen.add(item.headline);
          allItems.push(item);
        }
      }
    }
  }

  if (allItems.length === 0 && !topTheme) return "";

  if (topTheme) lines.push(`*${topTheme}*\n`);
  if (patternOfDay) lines.push(`**Pattern of the Day:** ${patternOfDay}\n`);

  const categories: Record<string, ScanItem[]> = {};
  for (const item of allItems) {
    const cat = item.category || "Other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  }

  for (const [cat, items] of Object.entries(categories)) {
    lines.push(`## ${cat}\n`);
    for (const item of items) {
      lines.push(`### ${item.headline}\n`);
      if (item.connection) lines.push(`${item.connection}\n`);
      if (item.significance && !['high','medium','low'].includes(item.significance)) lines.push(`> ${item.significance}\n`);
      if (item.regions && item.regions.length > 0) lines.push(`*${item.regions.join(" · ")}*\n`);
    }
  }

  if (framingWatch) {
    lines.push(`---\n\n## Framing Watch\n\n${framingWatch}\n`);
  }

  return lines.join("\n");
}

async function getScansForDate(date: string): Promise<Scan[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("scans")
    .select("scan_time, top_theme, pattern_of_day, framing_watch, items, mood")
    .eq("scan_date", date);
  return (data as Scan[]) || [];
}

function countStoriesFromScans(scans: Scan[]): number {
  const seen = new Set<string>();
  for (const scan of scans) {
    if (scan.items && Array.isArray(scan.items)) {
      for (const item of scan.items) {
        if (item.headline) seen.add(item.headline);
      }
    }
  }
  return seen.size;
}

async function getNeighbors(
  date: string
): Promise<{ prev: Neighbor | null; next: Neighbor | null }> {
  const supabase = getSupabase();
  if (!supabase) return { prev: null, next: null };

  const [prevRes, nextRes] = await Promise.all([
    supabase
      .from("briefings")
      .select("date, title")
      .lt("date", date)
      .order("date", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("briefings")
      .select("date, title")
      .gt("date", date)
      .order("date", { ascending: true })
      .limit(1)
      .single(),
  ]);

  return {
    prev: (prevRes.data as Neighbor) || null,
    next: (nextRes.data as Neighbor) || null,
  };
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d
    .toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
    .toUpperCase();
}

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return {};

  const briefing = await getBriefing(date);
  if (!briefing) return {};

  const formattedDate = formatDateLong(date);
  const cleanedTitle = cleanTitle(briefing.title);
  return {
    title: `${cleanedTitle} — Albis Daily Briefing`,
    description:
      briefing.summary || `Daily briefing from Albis for ${formattedDate}`,
    openGraph: {
      title: `${cleanedTitle} — Albis Daily Briefing`,
      description:
        briefing.summary || `Daily briefing from Albis for ${formattedDate}`,
      url: `https://www.albis.news/archive/${date}`,
      type: "article",
    },
    alternates: { canonical: `https://www.albis.news/archive/${date}` },
  };
}

export const dynamic = "force-dynamic";

export default async function BriefingPage({ params }: Props) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const briefing = await getBriefing(date);
  if (!briefing) notFound();

  const { prev, next } = await getNeighbors(date);

  // Clean the title
  const title = cleanTitle(briefing.title);
  const mood = cleanMood(briefing.mood);

  // Get scans for accurate story count and fallback content
  const scans = await getScansForDate(date);
  const storyCount = scans.length > 0 ? countStoriesFromScans(scans) : briefing.story_count;

  // Use scan-generated content if briefing content is broken
  let contentMd = briefing.content_md;
  if (contentIsBroken(contentMd) && scans.length > 0) {
    const generated = generateMarkdownFromScans(scans);
    if (generated) contentMd = generated;
  }

  const html = markdownToHtml(contentMd);

  return (
    <main className="px-space-6 py-space-16 md:py-space-24">
      <div className="max-w-[680px] mx-auto">
        {/* Back link */}
        <Link
          href="/archive"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#c8922a] transition-colors"
        >
          ← All Briefings
        </Link>

        {/* Date */}
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mt-space-8">
          {formatDateLong(briefing.date)}
        </p>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold mt-space-4">
          {title}
        </h1>

        {/* Metadata */}
        <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-space-4 flex gap-space-4">
          {mood && <span>{mood}</span>}
          {storyCount != null && storyCount > 0 && (
            <span>{storyCount} stories</span>
          )}
          {briefing.pgi_score != null && (
            <span>PGI: {briefing.pgi_score}</span>
          )}
        </div>

        {/* Divider */}
        <hr className="my-space-8 border-black/5 dark:border-white/5" />

        {/* Content */}
        <div
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Divider */}
        <hr className="my-space-12 border-black/5 dark:border-white/5" />

        {/* Email capture */}
        <EmailCapture />

        {/* Prev/Next navigation */}
        <nav className="mt-space-12 flex justify-between text-sm">
          {prev ? (
            <Link
              href={`/archive/${prev.date}`}
              className="text-zinc-500 dark:text-zinc-400 hover:text-[#c8922a] transition-colors"
            >
              ← Previous Briefing
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/archive/${next.date}`}
              className="text-zinc-500 dark:text-zinc-400 hover:text-[#c8922a] transition-colors"
            >
              Next Briefing →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </main>
  );
}
