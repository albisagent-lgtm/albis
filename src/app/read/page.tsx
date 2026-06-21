import type { Metadata } from "next";
import Link from "next/link";
import { getPostUrl, getRecentPosts, type BlogPost } from "@/lib/blog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Read — Albis",
  description: "Latest articles, briefings, and analysis from Albis and independent contributors.",
};

type Props = { searchParams?: Promise<{ section?: string }> };

function prettyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const sectionLabels: Record<string, string> = {
  "current-events": "World",
  "economic-flows": "Money",
  "tech-ai": "Tech",
  "climate-energy": "Climate",
  "science-space": "Science",
  "media-literacy": "Media",
  governance: "Governance",
  health: "Health",
  research: "Research",
  perspectives: "Perspectives",
  "life-systems": "Life Systems",
};

function sectionLabel(value: string) {
  return sectionLabels[value] || value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const preferredSections = ["current-events", "economic-flows", "tech-ai", "climate-energy", "life-systems", "perspectives", "science-space", "health", "governance", "research"];

function sortSections(sections: string[]) {
  return [...sections].sort((a, b) => {
    const aIndex = preferredSections.indexOf(a);
    const bIndex = preferredSections.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    return sectionLabel(a).localeCompare(sectionLabel(b));
  });
}

function safeImageUrl(value?: string | null) {
  if (!value) return "/og-image.png";
  return value.replace(/"/g, "%22");
}

function SectionChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap border-b-2 px-1 py-4 font-[family-name:var(--font-inter)] text-sm font-bold transition ${active ? "border-[#9b6b18] text-[#9b6b18] dark:border-[#f0c15e] dark:text-[#f0c15e]" : "border-transparent text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#9b6b18] dark:text-zinc-200"}`}
    >
      {label}
    </Link>
  );
}

function PublisherTag({ post }: { post: BlogPost }) {
  return (
    <p className="mt-2 inline-flex max-w-full items-center rounded-full bg-[#c8922a]/10 px-2.5 py-1 font-[family-name:var(--font-inter)] text-[11px] font-bold text-[#8a5f14] dark:text-[#f0c15e]">
      <span className="truncate">Published by {post.author || "Albis"}</span>
    </p>
  );
}

function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Link href={getPostUrl(post)} className="group block">
      <div
        className="aspect-[1.45/1] overflow-hidden rounded-md bg-zinc-200 bg-cover bg-center transition group-hover:opacity-90 dark:bg-zinc-900"
        style={{ backgroundImage: `url("${safeImageUrl(post.image)}")` }}
        aria-label="Article image"
      />
      <div className="pt-3">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold text-[#9b6b18] dark:text-[#f0c15e]">
          {sectionLabel(post.category)}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-[21px] font-bold leading-[1.08] tracking-tight group-hover:text-[#9b6a12]">
          {post.title}
        </h2>
        <PublisherTag post={post} />
        <p className="mt-2 font-[family-name:var(--font-inter)] text-xs text-zinc-400">
          {prettyDate(post.date)} · {post.readingTime} min read
        </p>
      </div>
    </Link>
  );
}

export default async function ReadPage({ searchParams }: Props) {
  const params = await searchParams;
  const allPosts = await getRecentPosts(120);
  const sections = sortSections([...new Set(allPosts.map((post) => post.category).filter(Boolean))]);
  const requestedSection = typeof params?.section === "string" ? params.section : undefined;
  const activeSection = requestedSection && sections.includes(requestedSection as BlogPost["category"]) ? requestedSection : undefined;
  const posts = activeSection ? allPosts.filter((post) => post.category === activeSection) : allPosts.slice(0, 48);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Read</p>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl">Published articles</h1>
          </div>
          <Link href="/" className="rounded-full bg-[#111] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black">
            Today
          </Link>
        </div>
        <p className="mx-auto mt-[-0.25rem] max-w-7xl px-4 pb-2 font-[family-name:var(--font-inter)] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 md:px-6">
          Article topics appear here automatically when published. The main feed keeps the day’s intelligence signals in one calm place.
        </p>
        <nav className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-4 md:px-6" aria-label="Read sections">
          <SectionChip label="All" href="/read" active={!activeSection} />
          {sections.map((section) => (
            <SectionChip key={section} label={sectionLabel(section)} href={`/read?section=${encodeURIComponent(section)}`} active={activeSection === section} />
          ))}
        </nav>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 md:px-6">
        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-black/10 bg-white/50 px-6 py-14 text-center text-zinc-500 dark:border-white/10 dark:bg-white/[0.025]">No articles in this section yet.</div>
        ) : (
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((post) => <ArticleCard key={post.slug} post={post} />)}
          </div>
        )}
      </section>
    </main>
  );
}
