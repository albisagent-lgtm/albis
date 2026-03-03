import type { Metadata } from "next";
import Link from "next/link";
import { TOPICS } from "@/lib/topics";

export const metadata: Metadata = {
  title: "Topics — How the World Reports on What Matters | Albis",
  description:
    "Explore how different regions cover the world's biggest topics. From climate to AI, Ukraine to trade — see the full picture with Albis.",
  openGraph: {
    title: "Topics — How the World Reports on What Matters | Albis",
    description:
      "Explore how different regions cover the world's biggest topics.",
    url: "https://albis.news/topics",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://albis.news/topics" },
};

export default function TopicsIndex() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <header className="mb-16 text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-5xl">
          Topics
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-500 dark:text-zinc-400">
          How the world reports on what matters. Pick a topic and see how coverage differs across regions.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            href={`/topics/${topic.slug}`}
            className="group rounded-xl border border-black/[0.07] bg-white p-5 transition-all hover:border-black/[0.15] hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{topic.emoji}</span>
              <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold group-hover:text-[#1a3a5c] dark:group-hover:text-[#7ab0d8]">
                {topic.name}
              </h2>
            </div>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {topic.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
