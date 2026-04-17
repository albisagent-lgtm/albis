import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { SearchClient } from "./search-client";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Search — Albis",
  description: "Search across all Albis articles — global news scanned from 7 regions.",
  openGraph: {
    title: "Search — Albis",
    description: "Search across all Albis articles — global news scanned from 7 regions.",
    type: "website",
  },
};

export default async function SearchPage() {
  const posts = (await getAllPosts()).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    author: p.author,
    image: p.image,
    tags: p.tags,
    category: p.category,
    readingTime: p.readingTime,
    sources: p.sources,
    confidence: p.confidence,
    content: "",
  }));

  return <SearchClient posts={posts} />;
}
