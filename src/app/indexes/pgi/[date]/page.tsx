import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAnonClient } from "@/lib/supabase/anon";

export const revalidate = 86400;

export async function generateStaticParams() {
  try {
    const supabase = createAnonClient();
    const { data } = await supabase
      .from("pgi_signature_pieces")
      .select("date")
      .order("date", { ascending: false });
    return (data ?? []).map((row: { date: string }) => ({ date: row.date }));
  } catch {
    return [];
  }
}

interface SignaturePiece {
  date: string;
  daily_pgi: number;
  tier: string;
  emoji: string;
  author: string;
  content_md: string;
  word_count: number | null;
  avg_d1_factual: number | null;
  avg_d2_causal: number | null;
  avg_d3_framing: number | null;
  avg_d4_emotional: number | null;
  avg_d5_actor: number | null;
  avg_d6_cui_bono: number | null;
  story_count: number | null;
  region_count: number | null;
  top_stories: string[];
}

async function getReport(date: string): Promise<SignaturePiece | null> {
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("pgi_signature_pieces")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  return data;
}

async function getAdjacentDates(date: string) {
  const supabase = createAnonClient();
  const [prevRes, nextRes] = await Promise.all([
    supabase
      .from("pgi_signature_pieces")
      .select("date")
      .lt("date", date)
      .order("date", { ascending: false })
      .limit(1),
    supabase
      .from("pgi_signature_pieces")
      .select("date")
      .gt("date", date)
      .order("date", { ascending: true })
      .limit(1),
  ]);
  return {
    prev: prevRes.data?.[0]?.date ?? null,
    next: nextRes.data?.[0]?.date ?? null,
  };
}

function getTier(pgi: number) {
  if (pgi <= 3) return { name: "Shared Understanding", color: "#22c55e" };
  if (pgi <= 5) return { name: "Different Angles", color: "#71717a" };
  if (pgi <= 7) return { name: "Diverging Narratives", color: "#f59e0b" };
  return { name: "Competing Realities", color: "#ef4444" };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
}

// Strip YAML frontmatter
function stripFrontmatter(md: string): string {
  const trimmed = md.trim();
  if (trimmed.startsWith("---")) {
    const endIdx = trimmed.indexOf("---", 3);
    if (endIdx !== -1) return trimmed.slice(endIdx + 3).trim();
  }
  return trimmed;
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#0f0f0f] dark:text-[#f0efec] font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function renderMarkdown(md: string): string {
  const clean = stripFrontmatter(md);
  const sections: string[] = [];
  let currentSection: string[] = [];
  const blocks = clean.split("\n\n");

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (/^-{3,}$/.test(trimmed)) {
      if (currentSection.length > 0) {
        sections.push(
          `<div class="mb-10 pb-10 border-b border-black/[0.06] dark:border-white/[0.06]">${currentSection.join("")}</div>`
        );
        currentSection = [];
      }
      continue;
    }

    if (trimmed.startsWith("### ")) {
      currentSection.push(`<h4 class="text-base font-semibold mt-8 mb-3 text-[#0f0f0f] dark:text-[#f0efec]">${formatInline(trimmed.slice(4))}</h4>`);
    } else if (trimmed.startsWith("## ")) {
      currentSection.push(`<h3 class="text-xl font-bold mt-10 mb-4 font-[family-name:var(--font-playfair)] text-[#0f0f0f] dark:text-[#f0efec]">${formatInline(trimmed.slice(3))}</h3>`);
    } else if (trimmed.startsWith("# ")) {
      currentSection.push(`<h2 class="text-2xl font-bold mt-10 mb-4 font-[family-name:var(--font-playfair)] text-[#0f0f0f] dark:text-[#f0efec]">${formatInline(trimmed.slice(2))}</h2>`);
    } else if (trimmed.startsWith("> ")) {
      currentSection.push(`<blockquote class="border-l-3 border-[#c8922a] pl-5 my-6 italic text-zinc-500 dark:text-zinc-400 text-[15px] leading-relaxed">${formatInline(trimmed.slice(2))}</blockquote>`);
    } else if (/^(The key insight|The pattern|The bottom line|Together,)/.test(trimmed)) {
      currentSection.push(`<div class="my-6 rounded-xl border border-[#c8922a]/20 bg-[#c8922a]/[0.03] p-5"><p class="text-[15px] leading-[1.8] text-zinc-700 dark:text-zinc-300">${formatInline(trimmed)}</p></div>`);
    } else if (/^PGI-[A-Z]{2}/.test(trimmed)) {
      currentSection.push(`<div class="my-4 rounded-lg border border-black/[0.05] bg-[#f8f7f4] dark:bg-white/[0.02] dark:border-white/[0.05] p-4"><p class="text-sm leading-[1.8] text-zinc-700 dark:text-zinc-300">${formatInline(trimmed)}</p></div>`);
    } else if (/^(Most divergent|Sharpest bilateral|The .+ pair|The .+ consensus|The quietest pair|The attention desert|The climate desert|The global spotlight|Latin America:)/.test(trimmed)) {
      currentSection.push(`<div class="my-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700"><p class="text-[15px] leading-[1.8] text-zinc-700 dark:text-zinc-300">${formatInline(trimmed)}</p></div>`);
    } else if (/^The most invisible stories/.test(trimmed)) {
      currentSection.push(`<h4 class="text-base font-semibold mt-8 mb-3 text-[#0f0f0f] dark:text-[#f0efec]">${formatInline(trimmed)}</h4>`);
    } else if (/^(Pakistan|Cuba|US CFO|Palantir|South Sudan)/.test(trimmed) && trimmed.includes("GAI:")) {
      currentSection.push(`<div class="my-3 rounded-lg border border-black/[0.05] bg-[#f8f7f4] dark:bg-white/[0.02] dark:border-white/[0.05] p-4"><p class="text-sm leading-[1.8] text-zinc-700 dark:text-zinc-300">${formatInline(trimmed)}</p></div>`);
    } else {
      currentSection.push(`<p class="mb-5 text-[15px] leading-[1.85] text-zinc-600 dark:text-zinc-400">${formatInline(trimmed)}</p>`);
    }
  }

  if (currentSection.length > 0) {
    sections.push(`<div class="mb-8">${currentSection.join("")}</div>`);
  }

  return sections.join("");
}

type PageProps = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const report = await getReport(date);
  if (!report) return { title: "PGI Report Not Found | Albis" };

  const tier = getTier(report.daily_pgi);
  return {
    title: `PGI ${report.daily_pgi.toFixed(1)} — ${formatDate(date)} | Albis`,
    description: `Perception Gap Index: ${report.daily_pgi.toFixed(1)} (${tier.name}). ${report.story_count} stories scored across ${report.region_count} regions. Daily media analysis from Albis.`,
    openGraph: {
      title: `PGI ${report.daily_pgi.toFixed(1)} — ${tier.name} | Albis`,
      description: `${report.story_count} stories scored across ${report.region_count} regions. How differently did the world understand ${formatDateShort(date)}'s events?`,
      images: [{ url: "https://www.albis.news/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default async function PGIReportPage({ params }: PageProps) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const [report, adjacent] = await Promise.all([
    getReport(date),
    getAdjacentDates(date),
  ]);

  if (!report) notFound();

  const tier = getTier(report.daily_pgi);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 pb-28 md:pb-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/indexes" className="hover:text-[#c8922a] transition-colors">
          Indexes
        </Link>
        <span>→</span>
        <Link href="/indexes/pgi" className="hover:text-[#c8922a] transition-colors">
          PGI
        </Link>
        <span>→</span>
        <span className="text-zinc-600 dark:text-zinc-300">{formatDateShort(date)}</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-[#c8922a]">
          Daily PGI Report
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
          {formatDate(date)}
        </h1>

        {/* Score badge */}
        <div className="mt-6 flex items-center gap-4">
          <div
            className="font-[family-name:var(--font-geist-mono)] text-5xl font-bold tabular-nums"
            style={{ color: tier.color }}
          >
            {report.daily_pgi.toFixed(1)}
          </div>
          <div>
            <div className="text-base font-medium" style={{ color: tier.color }}>
              {tier.name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              {report.story_count && <span>{report.story_count} stories</span>}
              {report.region_count && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span>{report.region_count} regions</span>
                </>
              )}
              {report.word_count && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span>{Math.ceil(report.word_count / 250)} min read</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dimension averages */}
        {(report.avg_d1_factual || report.avg_d2_causal) && (
          <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              { label: "Factual", val: report.avg_d1_factual },
              { label: "Causal", val: report.avg_d2_causal },
              { label: "Framing", val: report.avg_d3_framing },
              { label: "Emotional", val: report.avg_d4_emotional },
              { label: "Actor", val: report.avg_d5_actor },
              { label: "Cui Bono", val: report.avg_d6_cui_bono },
            ].map(
              (d) =>
                d.val != null && (
                  <div
                    key={d.label}
                    className="rounded-lg border border-black/[0.05] bg-[#f8f7f4] p-2 text-center dark:bg-white/[0.02] dark:border-white/[0.05]"
                  >
                    <div className="text-xs text-zinc-400">{d.label}</div>
                    <div
                      className="text-lg font-bold tabular-nums"
                      style={{ color: getTier(d.val).color }}
                    >
                      {d.val.toFixed(1)}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </header>

      {/* Article body — server-rendered for SEO */}
      <article
        className="max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(report.content_md) }}
      />

      {/* Byline */}
      <div className="mt-10 flex items-center gap-3 border-t border-black/[0.07] pt-6 dark:border-white/[0.06]">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#c8922a] to-[#b17f24] flex items-center justify-center text-white text-sm font-bold">
          A
        </div>
        <div>
          <p className="text-sm font-semibold">Albis</p>
          <p className="text-xs text-zinc-400">
            Automated Media Analysis · Updated 3× daily
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-10 flex items-center justify-between border-t border-black/[0.07] pt-6 dark:border-white/[0.06]">
        {adjacent.prev ? (
          <Link
            href={`/indexes/pgi/${adjacent.prev}`}
            className="text-sm font-medium text-[#c8922a] hover:underline"
          >
            ← {formatDateShort(adjacent.prev)}
          </Link>
        ) : (
          <span />
        )}
        <Link
          href="/indexes/pgi"
          className="text-sm text-zinc-400 hover:text-[#c8922a] transition-colors"
        >
          All reports
        </Link>
        {adjacent.next ? (
          <Link
            href={`/indexes/pgi/${adjacent.next}`}
            className="text-sm font-medium text-[#c8922a] hover:underline"
          >
            {formatDateShort(adjacent.next)} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
