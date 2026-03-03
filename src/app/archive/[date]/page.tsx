import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { markdownToHtml } from "@/lib/markdown";
import { EmailCapture } from "@/app/components/email-capture";

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
  return {
    title: `${briefing.title} — Albis Daily Briefing`,
    description:
      briefing.summary || `Daily briefing from Albis for ${formattedDate}`,
    openGraph: {
      title: `${briefing.title} — Albis Daily Briefing`,
      description:
        briefing.summary || `Daily briefing from Albis for ${formattedDate}`,
      url: `https://albis.news/archive/${date}`,
      type: "article",
    },
    alternates: { canonical: `https://albis.news/archive/${date}` },
  };
}

export const dynamic = "force-dynamic";

export default async function BriefingPage({ params }: Props) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const briefing = await getBriefing(date);
  if (!briefing) notFound();

  const { prev, next } = await getNeighbors(date);
  const html = markdownToHtml(briefing.content_md);

  return (
    <main className="px-space-6 py-space-16 md:py-space-24">
      <div className="max-w-[680px] mx-auto">
        {/* Back link */}
        <Link
          href="/archive"
          className="text-sm text-zinc-500 hover:text-[#c8922a] transition-colors"
        >
          ← All Briefings
        </Link>

        {/* Date */}
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mt-space-8">
          {formatDateLong(briefing.date)}
        </p>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold mt-space-4">
          {briefing.title}
        </h1>

        {/* Metadata */}
        <div className="text-sm text-zinc-500 mt-space-4 flex gap-space-4">
          {briefing.mood && <span>{briefing.mood}</span>}
          {briefing.story_count != null && (
            <span>{briefing.story_count} stories</span>
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
              className="text-zinc-500 hover:text-[#c8922a] transition-colors"
            >
              ← Previous Briefing
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/archive/${next.date}`}
              className="text-zinc-500 hover:text-[#c8922a] transition-colors"
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
