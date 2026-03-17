import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Research — Cascade Economics | Albis",
  description:
    "Albis Cascade Economics Research: studying how economic shocks propagate through interconnected systems, identifying intervention points, and proposing evidence-based solutions.",
  openGraph: {
    title: "Research — Cascade Economics | Albis",
    description:
      "Studying how economic shocks cascade through interconnected systems — and what we can do about it.",
    url: "https://www.albis.news/research",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://www.albis.news/research" },
};

export default function ResearchPage() {
  const allPosts = getAllPosts();
  const researchPosts = allPosts.filter((p) => p.category === "research");
  const cascadePosts = allPosts.filter(
    (p) =>
      p.tags.some((t) =>
        ["cascade-economics", "cascade", "systemic-risk", "supply-chain"].includes(t)
      ) && p.category !== "research"
  );

  return (
    <main className="mx-auto max-w-3xl px-space-6 py-space-16 md:py-space-24">
      {/* Hero */}
      <header className="mb-space-16">
        <p className="text-sm font-medium uppercase tracking-widest text-[#c8922a]">
          Albis Research
        </p>
        <h1 className="mt-space-3 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-5xl">
          Cascade Economics
        </h1>
        <p className="mt-space-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 font-[family-name:var(--font-source-serif)]">
          When one shock breaks everything. We study how economic disruptions
          propagate through interconnected global systems — energy, food,
          finance, migration, information, climate — and what can be done to
          break the chain before it breaks us.
        </p>
      </header>

      {/* The Mission */}
      <section className="mb-space-16 rounded-2xl border border-[#c8922a]/20 bg-[#f8f7f4] p-space-8 dark:border-[#c8922a]/15 dark:bg-white/[0.02]">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          The Mission
        </h2>
        <div className="mt-space-4 space-y-4 text-zinc-600 dark:text-zinc-400 font-[family-name:var(--font-source-serif)] leading-relaxed">
          <p>
            In October 1973, an oil embargo cascaded into a decade of
            stagflation. In 2008, subprime mortgage defaults cascaded into a
            global recession — and then into the populist upheaval that
            reshaped Western politics. In 2022, a war in Ukraine cascaded
            through gas and fertilizer markets until Sri Lanka&apos;s economy
            collapsed entirely.
          </p>
          <p>
            These aren&apos;t isolated crises. They&apos;re cascades — shocks
            that propagate through interconnected systems, each link amplifying
            the damage. And they&apos;re accelerating. What took months in 1973
            took weeks in 2008 and days in 2022.
          </p>
          <p>
            This research project studies cascade economics: the mechanics of
            how shocks spread, the patterns they follow, and — critically — the
            intervention points where chains can be broken. We don&apos;t just
            describe the problem. We research solutions.
          </p>
        </div>
      </section>

      {/* What We're Studying */}
      <section className="mb-space-16">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          What We&apos;re Studying
        </h2>
        <div className="mt-space-6 grid gap-space-4 sm:grid-cols-2">
          {[
            {
              icon: "📜",
              title: "Historical Cascades",
              desc: "Deep case studies: 1973 Oil Embargo, 1997 Asian Crisis, 2008 GFC, Arab Spring, COVID, Ukraine/Sri Lanka",
            },
            {
              icon: "🔴",
              title: "Live Tracking",
              desc: "The 2026 Hormuz cascade documented in real time — every link, every threshold, every deadline",
            },
            {
              icon: "🔗",
              title: "Mechanics & Patterns",
              desc: "What makes cascades accelerate, amplify, or get contained? The structural rules underneath",
            },
            {
              icon: "💡",
              title: "Solutions & Intervention",
              desc: "Where chains can be broken, what's worked before, how to build systems that resist cascades",
            },
            {
              icon: "🌍",
              title: "Future Projections",
              desc: "Climate, AI, and demographic mega-cascades — mapped to 2100 with intervention points",
            },
            {
              icon: "📐",
              title: "The Framework",
              desc: "An open methodology for identifying and tracking cascades — published for anyone to use",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-black/[0.07] p-5 dark:border-white/[0.06]"
            >
              <div className="text-2xl">{item.icon}</div>
              <h3 className="mt-2 font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Research Papers */}
      {researchPosts.length > 0 && (
        <section className="mb-space-16">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Research Papers
          </h2>
          <div className="mt-space-6 space-y-space-4">
            {researchPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-black/[0.07] p-6 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06] dark:hover:border-[#c8922a]/30"
              >
                <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                  <span className="rounded-full bg-[#c8922a]/10 px-2.5 py-0.5 text-[#c8922a] font-medium">
                    Research
                  </span>
                  <time>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span>&middot;</span>
                  <span>{post.readingTime} min read</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-[#0f0f0f] group-hover:text-[#c8922a] dark:text-[#f0efec] dark:group-hover:text-[#c8922a]">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {post.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related Coverage */}
      {cascadePosts.length > 0 && (
        <section className="mb-space-16">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Related Coverage
          </h2>
          <p className="mt-space-2 text-sm text-zinc-500 dark:text-zinc-400">
            News articles that track active cascades in real time.
          </p>
          <div className="mt-space-6 space-y-space-3">
            {cascadePosts.slice(0, 10).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >
                <time className="mt-0.5 shrink-0 text-xs text-zinc-400 dark:text-zinc-500 w-16">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
                <div>
                  <h3 className="text-sm font-medium text-[#0f0f0f] group-hover:text-[#c8922a] dark:text-[#f0efec] dark:group-hover:text-[#c8922a]">
                    {post.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Systems Tracker Teaser */}
      <section className="mb-space-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-space-8 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          Live Systems Tracker
        </h2>
        <p className="mt-space-3 text-zinc-600 dark:text-zinc-400 font-[family-name:var(--font-source-serif)]">
          We monitor six global systems for cascade risk — updated three times
          daily from our intelligence scans across 60 countries.
        </p>
        <div className="mt-space-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { name: "Food System", status: "🔴", label: "Critical" },
            { name: "Energy", status: "🔴", label: "Critical" },
            { name: "Information", status: "🟠", label: "High Stress" },
            { name: "Migration", status: "🟡", label: "Elevated" },
            { name: "Financial", status: "🟠", label: "High Stress" },
            { name: "Health & Climate", status: "🟡", label: "Elevated" },
          ].map((sys) => (
            <div
              key={sys.name}
              className="rounded-lg border border-black/[0.05] bg-white p-3 dark:border-white/[0.05] dark:bg-zinc-800/50"
            >
              <div className="text-lg">{sys.status}</div>
              <div className="mt-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {sys.name}
              </div>
              <div className="text-xs text-zinc-400 dark:text-zinc-500">
                {sys.label}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-space-4 text-xs text-zinc-400 dark:text-zinc-500">
          Status as of March 17, 2026. Dynamic updates coming soon.
        </p>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-[#c8922a]/20 bg-[#f8f7f4] p-space-8 text-center dark:border-[#c8922a]/20 dark:bg-white/[0.03]">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#c8922a]">
          Follow the Research
        </h2>
        <p className="mx-auto mt-space-3 max-w-md text-zinc-600 dark:text-zinc-400">
          Get cascade economics research and analysis delivered to your inbox.
        </p>
        <div className="mt-space-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-[#c8922a] px-space-6 py-3 font-medium text-white transition-colors hover:bg-[#b17f24]"
          >
            Subscribe free
          </Link>
          <a
            href="https://t.me/albisdaily"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-[#c8922a]/30 px-space-6 py-3 font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/5"
          >
            Join the community →
          </a>
        </div>
      </section>
    </main>
  );
}
