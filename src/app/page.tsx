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

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{label}: {level}</span>;
}

function SectionHeading({ title, href, kicker, note }: { title: string; href?: string; kicker?: string; note?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.08] pb-3 dark:border-white/[0.08]">
      <div>
        {kicker ? <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">{kicker}</p> : null}
        <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        {note ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{note}</p> : null}
      </div>
      {href ? <Link href={href} className="shrink-0 text-sm font-bold text-[#b58320] hover:text-[#8a6417]">See all →</Link> : null}
    </div>
  );
}

function ScanPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-black/[0.08] bg-white/70 px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-300">
      {children}
    </span>
  );
}

function StoryLink({ post, rank, featured = false }: { post: BlogPost; rank?: number; featured?: boolean }) {
  return (
    <Link href={getPostUrl(post)} className={`group block rounded-[1.35rem] border border-black/[0.08] bg-white p-4 transition hover:border-[#c8922a]/40 dark:border-white/[0.08] dark:bg-white/[0.035] ${featured ? "md:p-6" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#b58320]">{post.category.replaceAll("-", " ")}</p>
        {rank ? <span className="font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-400">#{rank}</span> : null}
      </div>
      <h3 className={`mt-2 font-[family-name:var(--font-playfair)] font-bold leading-tight tracking-tight group-hover:text-[#b58320] ${featured ? "text-2xl md:text-4xl" : "text-lg"}`}>
        {post.title}
      </h3>
      {post.description ? <p className={`mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 ${featured ? "md:text-base" : "line-clamp-2"}`}>{post.description}</p> : null}
      <p className="mt-4 font-[family-name:var(--font-inter)] text-xs text-zinc-400">{post.readingTime} min read</p>
    </Link>
  );
}

function BriefingStory({ story, index }: { story: ReturnType<typeof buildTodayBriefing>["stories"][number]; index: number }) {
  const content = (
    <article className="rounded-[1.25rem] border border-black/[0.08] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
      <div className="flex items-start gap-3">
        <span className="mt-1 font-[family-name:var(--font-inter)] text-xs font-bold text-[#b58320]">{String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight">{story.headline}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{story.whatHappened}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SignalBadge label="Attention" level={story.globalAttention} />
            <SignalBadge label="Perspective" level={story.perspectiveGap} />
          </div>
        </div>
      </div>
    </article>
  );

  return story.href ? <Link href={story.href} className="block transition hover:-translate-y-0.5">{content}</Link> : content;
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
  const topStories = posts.slice(0, 8);
  const leadStory = topStories[0];
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
      <section className="border-b border-black/[0.08] bg-white/80 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="group">
            <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight group-hover:text-[#b58320]">Albis</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">News intelligence, not noise.</p>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-zinc-600 dark:text-zinc-300 md:flex">
            <Link href="/signals" className="hover:text-[#c8922a]">Signals</Link>
            <Link href="/community-weather" className="hover:text-[#c8922a]">Community Weather</Link>
            <Link href="/world" className="hover:text-[#c8922a]">World</Link>
            <Link href="/life-systems" className="hover:text-[#c8922a]">Life Systems</Link>
            <Link href="/perspectives" className="hover:text-[#c8922a]">Perspectives</Link>
            <Link href="/indexes" className="hover:text-[#c8922a]">Indexes</Link>
          </nav>
        </div>
      </section>

      <section className="border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 md:py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <ScanPill>{briefing.trust.sources} scanned</ScanPill>
              <ScanPill>{briefing.trust.regions}</ScanPill>
              <ScanPill>{briefing.trust.languages}</ScanPill>
              <ScanPill>Updated {briefing.trust.lastUpdated}</ScanPill>
            </div>
            <p className="mt-7 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.2em] text-[#b58320]">Truth, Clarity & Trust · {briefing.dateLabel}</p>
            <h1 className="mt-4 max-w-5xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
              The world&apos;s news, clarified.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 md:text-xl">
              Albis scans global coverage, shows what matters, reveals what is missing, and keeps the evidence close enough to check.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signals" className="rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black dark:hover:bg-[#f0c15e]">Open signal board</Link>
              <Link href="/community-weather" className="rounded-full border border-black/[0.12] px-5 py-3 text-sm font-bold hover:border-[#b58320] hover:text-[#b58320] dark:border-white/[0.15]">Community weather</Link>
              <Link href="#today" className="rounded-full border border-black/[0.12] px-5 py-3 text-sm font-bold hover:border-[#b58320] hover:text-[#b58320] dark:border-white/[0.15]">Read today&apos;s brief</Link>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-[#c8922a]/25 bg-[#fffaf0] p-5 dark:bg-[#c8922a]/[0.07]">
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">Daily habit</p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold">Two minutes. Less noise.</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">A free morning briefing from the same public scan system: clean global news, missing context, and calmer orientation.</p>
            <div className="mt-5"><EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="homepage-v2-hero" /></div>
          </aside>
        </div>
      </section>

      <HomeLiveSignals />

      <section id="today" className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <SectionHeading title="Today&apos;s brief" kicker="Start here" href="/archive" note="A simple reading order: the lead story, then the next signals worth knowing." />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          {leadStory ? <StoryLink post={leadStory} featured /> : <div className="rounded-[1.35rem] border border-dashed border-black/[0.12] p-8 text-zinc-500 dark:border-white/[0.12]">Stories loading…</div>}
          <div className="grid gap-3">
            {topStories.slice(1, 5).map((post, index) => <StoryLink key={post.slug} post={post} rank={index + 2} />)}
          </div>
        </div>
      </section>

      <section className="border-y border-black/[0.08] bg-white/65 dark:border-white/[0.08] dark:bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <SectionHeading title="What the scan sees" kicker="Coverage intelligence" href="/signals" note="Not just what is popular — what is widely covered, unevenly framed, missing, or still open for verification." />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {briefing.stories.slice(0, 6).map((story, index) => <BriefingStory key={story.id} story={story} index={index} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <SectionHeading title="Perspective and attention gaps" kicker="Why Albis exists" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Link href="/indexes/pgi" className="group rounded-[1.5rem] border border-black/[0.08] bg-white p-5 transition hover:border-[#c8922a]/40 dark:border-white/[0.08] dark:bg-white/[0.035] md:p-6">
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Perception Gap</p>
            <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold group-hover:text-[#b58320]">{briefing.perspectiveGap.headline}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{briefing.perspectiveGap.explanation}</p>
          </Link>
          <Link href="/indexes/gai" className="group rounded-[1.5rem] border border-black/[0.08] bg-white p-5 transition hover:border-[#c8922a]/40 dark:border-white/[0.08] dark:bg-white/[0.035] md:p-6">
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Attention Gap</p>
            <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold group-hover:text-[#b58320]">{briefing.attentionGap.headline}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{briefing.attentionGap.explanation}</p>
          </Link>
        </div>
      </section>

      <section className="border-y border-black/[0.08] bg-white/65 dark:border-white/[0.08] dark:bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <SectionHeading title="Choose your lens" kicker="Explore" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sectionGroups.map(([key, sectionPosts]) => {
              const meta = SECTION_COPY[key];
              const first = sectionPosts[0];
              return (
                <Link key={key} href={meta.href} className="group rounded-[1.35rem] border border-black/[0.08] bg-white p-5 transition hover:border-[#c8922a]/40 dark:border-white/[0.08] dark:bg-white/[0.035]">
                  <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">{meta.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{meta.blurb}</p>
                  {first ? <h3 className="mt-5 border-t border-black/[0.08] pt-4 font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight group-hover:text-[#b58320] dark:border-white/[0.08]">{first.title}</h3> : null}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#111] text-white">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6 md:py-24">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#f0c15e]">News intelligence, verified together</p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">A calmer way to follow the world.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/65">Daily briefings, live signals, source trails, perception gaps, and structured reader context — all pointed at clarity.</p>
          <div className="mx-auto mt-8 max-w-lg"><EmailCapture showSocialProof={false} showYesterdayLink={false} source="homepage-v2-footer" /></div>
        </div>
      </section>
    </main>
  );
}
