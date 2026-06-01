import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getPostUrl } from "@/lib/blog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Read — Albis",
  description: "Articles and longer writing from Albis and independent contributors.",
};

function prettyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ReadPage() {
  const posts = (await getAllPosts()).slice(0, 40);

  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-10 text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea] md:px-6">
      <section className="mx-auto max-w-4xl">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Read</p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">Articles and longer writing.</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          Albis writing, briefings, and soon independent work from people publishing useful context.
        </p>

        <div className="mt-8 space-y-3">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white/50 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.025]">No writing yet.</div>
          ) : posts.map((post) => (
            <Link key={post.slug} href={getPostUrl(post)} className="block rounded-3xl border border-black/[0.08] bg-white p-5 transition hover:border-[#c8922a]/35 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <p className="font-[family-name:var(--font-inter)] text-xs text-zinc-400">{post.author || "Albis"} · {prettyDate(post.date)} · {post.readingTime} min read</p>
              <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight">{post.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{post.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
