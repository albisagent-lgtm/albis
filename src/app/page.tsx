import Link from "next/link";
import { getTodayScan, type ScanItem } from "@/lib/scan-parser";
import { getAllPosts } from "@/lib/blog";
import { REGION_LABELS, normalizeRegion, DISPLAY_REGIONS } from "@/lib/scan-types";
import { EmailCapture } from "./components/email-capture";

export const dynamic = "force-dynamic";

const REGION_FLAGS: Record<string, string> = {
  "western-world": "\u{1F1FA}\u{1F1F8}",
  "europe": "\u{1F1EA}\u{1F1FA}",
  "middle-east": "\u{1F54C}",
  "south-asia": "\u{1F1EE}\u{1F1F3}",
  "east-se-asia": "\u{1F30F}",
  "africa": "\u{1F30D}",
  "latin-americas": "\u{1F30E}",
};

const REGION_SHORT: Record<string, string> = {
  "western-world": "US",
  "europe": "EU",
  "middle-east": "MENA",
  "south-asia": "South Asia",
  "east-se-asia": "East Asia",
  "africa": "Africa",
  "latin-americas": "Latin America",
};

export default async function Home() {
  const scan = await getTodayScan();
  const allPosts = getAllPosts();

  const articleSlugs: Record<string, string> = {};
  for (const post of allPosts) {
    for (const tag of post.tags || []) {
      articleSlugs[tag.toLowerCase()] = post.slug;
    }
  }

  const postBySlug: Record<string, (typeof allPosts)[0]> = {};
  for (const post of allPosts) {
    postBySlug[post.slug] = post;
  }

  const topStories = scan?.items
    ? [...scan.items].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.significance] ?? 1) - (order[b.significance] ?? 1);
      }).slice(0, 6)
    : [];

  function findArticleSlug(item: ScanItem): string | null {
    if ("slug" in item && (item as ScanItem & { slug?: string }).slug) return (item as ScanItem & { slug?: string }).slug!;
    const headlineWords = (item.headline || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    let bestSlug: string | null = null;
    let bestScore = 0;
    for (const post of allPosts.slice(0, 30)) {
      const titleWords = post.title.toLowerCase().split(/\s+/);
      const overlap = headlineWords.filter((w: string) => titleWords.includes(w)).length;
      if (overlap > bestScore) {
        bestScore = overlap;
        bestSlug = post.slug;
      }
    }
    if (bestScore >= 2) return bestSlug;
    for (const tag of item.tags || []) {
      if (articleSlugs[tag.toLowerCase()]) return articleSlugs[tag.toLowerCase()];
    }
    return null;
  }

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main>

      {/* ═══════════════════════════════════════════════
          HERO — Cinematic, bold, movie-poster energy
          ═══════════════════════════════════════════════ */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center bg-[#0f0f0f] px-6 py-20 text-center overflow-hidden">

        {/* Subtle gradient glow behind headline */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-[#c8922a]/[0.04] blur-[120px]" />
        </div>

        {/* Region strip — whisper of global coverage */}
        <div className="relative flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-white/25">
          <span>US</span>
          <span className="text-white/10">·</span>
          <span>Europe</span>
          <span className="text-white/10">·</span>
          <span>Middle East</span>
          <span className="text-white/10">·</span>
          <span>Asia</span>
          <span className="text-white/10">·</span>
          <span>Africa</span>
          <span className="text-white/10">·</span>
          <span>Americas</span>
        </div>

        {/* Headline */}
        <h1 className="relative mt-10 font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-[#f0efec]">
          The world&apos;s news<br />
          <span className="text-[#c8922a]">in 2&nbsp;minutes.</span>
        </h1>

        {/* Subline */}
        <p className="relative mt-6 max-w-md font-[family-name:var(--font-source-serif)] text-base sm:text-lg leading-relaxed text-white/50">
          We scan 60 countries every morning so you don&apos;t have to.
        </p>

        {/* Email capture */}
        <div className="relative mt-10 w-full max-w-lg">
          <EmailCapture variant="default" showSocialProof={true} showYesterdayLink={false} source="homepage-hero" />
        </div>

        {/* Scroll hint */}
        <div className="relative mt-16 animate-bounce text-white/20">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 8l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TODAY'S BRIEFING — What happened, right now
          ═══════════════════════════════════════════════ */}
      {topStories.length > 0 && (
        <section className="bg-[#f8f7f4] dark:bg-[#141414]">
          <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">

            {/* Date header */}
            <div className="text-center">
              <p className="text-xs font-medium tracking-[0.25em] uppercase text-[#c8922a]">
                Today&apos;s Briefing
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                {dateString}
              </h2>
              <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
                {topStories.length} stories · 7 regions · 2 min read
              </p>
            </div>

            {/* Stories */}
            <div className="mt-12 space-y-8">
              {topStories.map((item, i) => {
                const slug = findArticleSlug(item);
                const regions = item.regions
                  .map((r) => normalizeRegion(r))
                  .filter((r, idx, arr) => r !== "global" && arr.indexOf(r) === idx);

                const storyContent = (
                  <div className="group">
                    {/* Story */}
                    <p className="font-[family-name:var(--font-source-serif)] text-base sm:text-lg leading-relaxed text-[#0f0f0f] dark:text-[#f0efec]">
                      <span className="font-semibold">{item.headline}.</span>
                      {item.connection && (
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {" "}{item.connection}
                        </span>
                      )}
                    </p>

                    {/* Region tags */}
                    {regions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {regions.slice(0, 4).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-500"
                          >
                            {REGION_FLAGS[r]} {REGION_SHORT[r] || REGION_LABELS[r] || r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );

                return (
                  <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-[#c8922a]/60">
                    {slug ? (
                      <Link href={`/lens/${slug}`} className="block transition-opacity hover:opacity-70">
                        {storyContent}
                      </Link>
                    ) : (
                      storyContent
                    )}
                  </div>
                );
              })}
            </div>

            {/* Soft gate */}
            <div className="mt-14 rounded-2xl border border-black/[0.06] bg-white/60 p-8 text-center dark:border-white/[0.06] dark:bg-white/[0.03]">
              <p className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                That&apos;s today.
              </p>
              <p className="mt-2 font-[family-name:var(--font-source-serif)] text-sm text-zinc-500 dark:text-zinc-400">
                Get tomorrow&apos;s briefing in your inbox. Free.
              </p>
              <div className="mt-6 mx-auto max-w-md">
                <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="homepage-mid" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          WHY ALBIS — Not features. A feeling.
          ═══════════════════════════════════════════════ */}
      <section className="border-t border-black/[0.05] bg-[#f8f7f4] dark:border-white/[0.05] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-xl px-6 py-16 md:py-24 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold leading-tight text-[#0f0f0f] dark:text-[#f0efec]">
            Most news shows you<br />one country&apos;s view.
          </h2>
          <p className="mt-4 font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold leading-tight text-[#c8922a]">
            We show you all of them.
          </p>

          <div className="mt-12 space-y-8 text-left">
            <div className="flex gap-4">
              <span className="mt-1 text-lg text-[#c8922a]">→</span>
              <div>
                <p className="font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-[#0f0f0f] dark:text-[#f0efec]">
                  <span className="font-semibold">Every morning, we scan news across 7 regions and 16 languages.</span>
                  {" "}Not one country&apos;s headlines — the whole picture.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="mt-1 text-lg text-[#c8922a]">→</span>
              <div>
                <p className="font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-[#0f0f0f] dark:text-[#f0efec]">
                  <span className="font-semibold">We surface what&apos;s missing.</span>
                  {" "}The stories your feed isn&apos;t showing you and the angles nobody else is covering.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="mt-1 text-lg text-[#c8922a]">→</span>
              <div>
                <p className="font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-[#0f0f0f] dark:text-[#f0efec]">
                  <span className="font-semibold">Two minutes. Every morning.</span>
                  {" "}Start your day knowing what actually happened — everywhere.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA — Close it out with confidence
          ═══════════════════════════════════════════════ */}
      <section className="bg-[#0f0f0f] py-16 md:py-24">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold leading-tight text-[#f0efec]">
            Start your day informed,<br />not&nbsp;overwhelmed.
          </h2>
          <p className="mt-4 font-[family-name:var(--font-source-serif)] text-sm text-white/40">
            Your daily briefing. Every region. Every perspective. 2&nbsp;minutes. Free.
          </p>
          <div className="mt-10">
            <EmailCapture showSocialProof={true} showYesterdayLink={false} source="homepage-bottom" />
          </div>
          <p className="mt-10 font-[family-name:var(--font-source-serif)] text-xs italic tracking-wide text-white/20">
            News intelligence, not noise.
          </p>
        </div>
      </section>
    </main>
  );
}
