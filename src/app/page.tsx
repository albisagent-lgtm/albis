import Link from "next/link";
import { EmailCapture } from "./components/email-capture";
import { getAllPosts, getPostUrl, getPostsBySection, type BlogPost } from "@/lib/blog";
import { getSiteSnapshot } from "@/lib/site-snapshot";
import { buildTodayBriefing, type PublicSignalLevel } from "@/lib/todays-briefing";
import { HomeLiveSignals } from "./components/home-live-signals";

export const revalidate = 300;

const SECTION_COPY: Record<string, { label: string; href: string; blurb: string }> = {
  world: { label: "World", href: "/world", blurb: "Power, conflict, diplomacy, migration, public health." },
  money: { label: "Money", href: "/money", blurb: "Trade, markets, labour, inflation, supply chains." },
  tech: { label: "Tech", href: "/tech", blurb: "AI, cyber, platforms, digital rights, surveillance." },
  climate: { label: "Climate", href: "/climate", blurb: "Heat, water, biodiversity, energy transition, risk." },
  "life-systems": { label: "Life Systems", href: "/life-systems", blurb: "Food, water, energy, infrastructure, human resilience." },
  perspectives: { label: "Perspectives", href: "/perspectives", blurb: "Framing gaps, blind spots, media literacy, context." },
};

function SignalBadge({ label, level }: { label: string; level: PublicSignalLevel }) {
  const tone =
    level === "High"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200"
      : level === "Moderate" || level === "Medium"
        ? "border-[#c8922a]/35 bg-[#c8922a]/10 text-[#8a6417] dark:text-[#f0c15e]"
        : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {label}: {level}
    </span>
  );
}

function SectionHeading({ title, href, kicker }: { title: string; href?: string; kicker?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-black/10 pb-3 dark:border-white/10">
      <div>
        {kicker ? (
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">
            {kicker}
          </p>
        ) : null}
        <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h2>
      </div>
      {href ? (
        <Link href={href} className="shrink-0 text-sm font-medium text-[#b58320] hover:text-[#8a6417]">
          See all →
        </Link>
      ) : null}
    </div>
  );
}

function ArticleCard({ post, size = "default" }: { post: BlogPost; size?: "lead" | "default" | "compact" }) {
  const isLead = size === "lead";
  const isCompact = size === "compact";

  return (
    <Link href={getPostUrl(post)} className="group block">
      <div className={`overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${isLead ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
        {post.image && post.image !== "/og-image.png" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading={isLead ? "eager" : "lazy"}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#c8922a]/15 to-black/[0.03] dark:to-white/[0.04]">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Albis scan</span>
          </div>
        )}
      </div>
      <p className="mt-3 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#b58320]">
        {post.category.replaceAll("-", " ")}
      </p>
      <h3
        className={`mt-1 font-[family-name:var(--font-playfair)] font-bold leading-tight transition-colors group-hover:text-[#b58320] ${
          isLead ? "text-3xl md:text-4xl" : isCompact ? "text-base" : "text-xl"
        }`}
      >
        {post.title}
      </h3>
      {!isCompact && post.description ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-[15px]">
          {post.description}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-zinc-400">{post.readingTime} min read</p>
    </Link>
  );
}

function MiniArticle({ post }: { post: BlogPost }) {
  return (
    <Link href={getPostUrl(post)} className="group grid grid-cols-[72px_1fr] gap-3 border-t border-black/10 py-4 dark:border-white/10">
      <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {post.image && post.image !== "/og-image.png" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.04]" loading="lazy" />
        ) : null}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b58320]">{post.category.replaceAll("-", " ")}</p>
        <h3 className="mt-1 line-clamp-3 font-[family-name:var(--font-playfair)] text-base font-bold leading-tight group-hover:text-[#b58320]">
          {post.title}
        </h3>
      </div>
    </Link>
  );
}

function ScanPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-300">
      {children}
    </span>
  );
}

export default async function Home() {
  const [snapshot, posts, worldPosts, moneyPosts, techPosts, climatePosts, lifePosts, perspectivesPosts] = await Promise.all([
    getSiteSnapshot(),
    getAllPosts(),
    getPostsBySection("world"),
    getPostsBySection("money"),
    getPostsBySection("tech"),
    getPostsBySection("climate"),
    getPostsBySection("life-systems"),
    getPostsBySection("perspectives"),
  ]);

  const briefing = buildTodayBriefing(snapshot, posts);
  const topStories = posts.slice(0, 9);
  const leadStory = topStories[0];
  const secondaryStories = topStories.slice(1, 5);
  const scanStories = briefing.stories.slice(0, 6);
  const sectionGroups = [
    ["world", worldPosts],
    ["money", moneyPosts],
    ["tech", techPosts],
    ["climate", climatePosts],
    ["life-systems", lifePosts],
    ["perspectives", perspectivesPosts],
  ] as const;

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/10 bg-white/75 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="group">
            <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight group-hover:text-[#b58320]">Albis</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Public scans for a clearer world.</p>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-zinc-600 dark:text-zinc-300 md:flex">
            <Link href="/world" className="hover:text-[#c8922a]">World</Link>
            <Link href="/life-systems" className="hover:text-[#c8922a]">Life Systems</Link>
            <Link href="/perspectives" className="hover:text-[#c8922a]">Perspectives</Link>
            <Link href="/indexes" className="hover:text-[#c8922a]">Indexes</Link>
            <Link href="/archive" className="hover:text-[#c8922a]">Archive</Link>
          </nav>
        </div>
      </section>

      <section className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <ScanPill>{briefing.trust.sources} scanned</ScanPill>
              <ScanPill>{briefing.trust.regions}</ScanPill>
              <ScanPill>{briefing.trust.languages}</ScanPill>
              <ScanPill>Updated {briefing.trust.lastUpdated}</ScanPill>
            </div>
            <p className="mt-7 font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">
              Today&apos;s public scan · {briefing.dateLabel}
            </p>
            <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl">
              The world&apos;s news in 2 minutes — then go deeper where it matters.
            </h1>
            <p className="mt-5 max-w-2xl font-[family-name:var(--font-source-serif)] text-xl leading-relaxed text-zinc-700 dark:text-zinc-300">
              Albis scans global coverage, surfaces the stories moving underneath the noise, and shows where attention or framing is uneven.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#news-wall" className="rounded-full bg-[#111] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b58320] dark:bg-white dark:text-black dark:hover:bg-[#f0c15e]">
                Explore the news wall
              </Link>
              <Link href="/what-am-i-missing" className="rounded-full border border-black/15 px-5 py-3 text-sm font-semibold hover:border-[#b58320] hover:text-[#b58320] dark:border-white/15">
                What am I missing?
              </Link>
            </div>
          </div>

          <aside className="h-fit border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#b58320]">Daily habit</p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold">The scan in your inbox.</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Free morning briefing. Built from the same public scan system: clean news, missing context, less noise.
            </p>
            <div className="mt-5">
              <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="homepage-public-scan-hero" />
            </div>
          </aside>
        </div>
      </section>

      <HomeLiveSignals />

      <section id="news-wall" className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <SectionHeading title="News wall" kicker="Latest from the scan" href="/archive" />
        {leadStory ? (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ArticleCard post={leadStory} size="lead" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:col-span-5">
              {secondaryStories.map((post) => (
                <ArticleCard key={post.slug} post={post} size="compact" />
              ))}
            </div>
          </div>
        ) : (
          <p className="py-12 text-center text-zinc-500">Stories loading…</p>
        )}
      </section>

      <section className="border-y border-black/10 bg-[#111] text-white dark:border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[330px_1fr]">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#f0c15e]">Interactive scan layer</p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold">What the scan sees today</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Not a business landing page — a public radar. These are the stories and gaps the system is watching right now.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {scanStories.map((story, index) => (
              <article key={story.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-bold text-[#f0c15e]">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight">
                  {story.href ? <Link href={story.href} className="hover:text-[#f0c15e]">{story.headline}</Link> : story.headline}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/65">{story.whatHappened}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SignalBadge label="Attention" level={story.globalAttention} />
                  <SignalBadge label="Perspective" level={story.perspectiveGap} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <SectionHeading title="Explore by signal" kicker="Choose your lens" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sectionGroups.map(([key, sectionPosts]) => {
            const meta = SECTION_COPY[key];
            const first = sectionPosts[0];
            return (
              <Link key={key} href={meta.href} className="group rounded-2xl border border-black/10 bg-white p-5 transition hover:border-[#b58320]/50 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">{meta.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{meta.blurb}</p>
                {first ? (
                  <h3 className="mt-5 border-t border-black/10 pt-4 font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight group-hover:text-[#b58320] dark:border-white/10">
                    {first.title}
                  </h3>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-black/10 bg-white/65 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-2">
          <div>
            <SectionHeading title="Perspective gap" kicker="Same event, different worlds" href="/indexes/pgi" />
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">{briefing.perspectiveGap.headline}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{briefing.perspectiveGap.explanation}</p>
          </div>
          <div>
            <SectionHeading title="Attention gap" kicker="What coverage leaves out" href="/indexes/gai" />
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">{briefing.attentionGap.headline}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{briefing.attentionGap.explanation}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <SectionHeading title="More from today" kicker="Keep scrolling" href="/archive" />
        <div className="grid gap-x-8 lg:grid-cols-3">
          {topStories.slice(5, 9).map((post) => (
            <MiniArticle key={post.slug} post={post} />
          ))}
          {perspectivesPosts.slice(0, 2).map((post) => (
            <MiniArticle key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section className="bg-[#111] text-white">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6 md:py-24">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#f0c15e]">News intelligence, not noise</p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold">A social-scale scan system for everyone.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/60">
            Follow the world through public scans, daily briefings, gap indexes, and shareable stories — not corporate dashboards first.
          </p>
          <div className="mx-auto mt-8 max-w-lg">
            <EmailCapture showSocialProof={false} showYesterdayLink={false} source="homepage-public-scan-footer" />
          </div>
        </div>
      </section>
    </main>
  );
}
