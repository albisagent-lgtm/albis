import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getPostUrl } from "@/lib/blog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Read — Albis",
  description: "Latest articles, briefings, and analysis from Albis.",
};

function prettyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ReadPage() {
  const posts = (await getAllPosts()).slice(0, 48);
  const lead = posts[0];
  const rest = posts.slice(1);

  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-8 text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea] md:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="border-b border-black/[0.08] pb-5 dark:border-white/[0.08]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Read</p>
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">Latest</h1>
        </div>

        {lead ? (
          <Link href={getPostUrl(lead)} className="mt-6 grid gap-5 border-b border-black/[0.08] pb-6 transition hover:text-[#9b6a12] dark:border-white/[0.08] md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                {lead.category.replaceAll("-", " ")} · {prettyDate(lead.date)}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight md:text-5xl">{lead.title}</h2>
            </div>
            <div className="self-end">
              <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">{lead.description}</p>
              <p className="mt-4 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-400">
                {lead.author || "Albis"} · {lead.readingTime} min read
              </p>
            </div>
          </Link>
        ) : null}

        <div className="mt-3 divide-y divide-black/[0.08] dark:divide-white/[0.08]">
          {rest.length === 0 && !lead ? (
            <div className="py-14 text-center text-zinc-500">No articles yet.</div>
          ) : rest.map((post) => (
            <Link key={post.slug} href={getPostUrl(post)} className="grid gap-3 py-5 transition hover:text-[#9b6a12] md:grid-cols-[160px_minmax(0,1fr)_140px]">
              <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">{post.category.replaceAll("-", " ")}</p>
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight">{post.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{post.description}</p>
              </div>
              <p className="font-[family-name:var(--font-inter)] text-xs text-zinc-400 md:text-right">{prettyDate(post.date)}<br />{post.readingTime} min</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
