import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import BlogFilteredList from "./BlogFilteredList";

export const metadata: Metadata = {
  title: "The Lens — Albis",
  description:
    "Insights on media literacy, news bias, and how to see the world more clearly. From the team behind Albis.",
  openGraph: {
    title: "The Lens — Albis",
    description:
      "Insights on media literacy, news bias, and how to see the world more clearly.",
    url: "https://albis.news/blog",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://albis.news/blog" },
};

export default function BlogIndex() {
  // Strip content to avoid sending full markdown to the client
  const posts = getAllPosts().map(({ content, ...rest }) => rest);

  return (
    <main className="mx-auto max-w-3xl px-space-6 py-space-16 md:py-space-24">
      <header>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-5xl">
          The Lens
        </h1>
        <p className="mt-space-2 text-lg font-[family-name:var(--font-source-serif)] text-zinc-500 dark:text-zinc-400">
          Exploring how the world tells its stories — and how to listen better.
        </p>
      </header>

      <BlogFilteredList posts={posts} />
    </main>
  );
}
