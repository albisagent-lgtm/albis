import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/app/components/follow-button";
import { UserAvatar } from "@/app/components/user-avatar";
import {
  buildProfileTabData,
  normaliseProfileTabView,
  profileTabHref,
  type ProfileTabData,
  type ProfileTabView,
} from "@/lib/profile-tab";
import { createClient } from "@/lib/supabase/server";
import { authorProfileHandle, getPublicProfileStats, getSignalsByAuthorHandle, type PublicProfileStats, type Signal } from "@/lib/signals";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface Props {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ tab?: string | string[] }>;
}

type Profile = { displayName: string; bio: string | null; avatarUrl: string | null };

function displayHandle(handle: string) {
  return `@${handle.replace(/^@+/, "")}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recent";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function aiReviewLabel(signal: Signal) {
  const status = typeof signal.metadata?.ai_review_status === "string" ? signal.metadata.ai_review_status : null;
  if (status === "generated") return "AI-reviewed";
  if (status === "queued") return "AI review queued";
  if (status === "processing") return "AI reviewing";
  if (status === "failed") return "AI review failed";
  return null;
}

function metaString(signal: Signal, key: string) {
  const value = signal.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function profileFromCards(handle: string, cards: Signal[]): Profile {
  if (handle === "albis") {
    return {
      displayName: "Albis",
      bio: "Truth, trust, and clarity — public posts, source-backed articles, and context from the Albis intelligence layer.",
      avatarUrl: null,
    };
  }
  const first = cards.find((card) => metaString(card, "author_name") || metaString(card, "author_display_name") || metaString(card, "author_bio") || metaString(card, "author_avatar_url"));
  const displayName = first ? metaString(first, "author_display_name") || metaString(first, "author_name") || displayHandle(handle) : displayHandle(handle);
  const bio = first ? metaString(first, "author_bio") : null;
  const avatarUrl = first ? metaString(first, "author_avatar_url") : null;
  return { displayName, bio, avatarUrl };
}

function TimeCard({ stats, handle }: { stats: PublicProfileStats; handle: string }) {
  return (
    <Link
      href={`/time?profile=${encodeURIComponent(handle)}`}
      className="mt-5 block rounded-3xl border border-black/[0.08] bg-[#f8f7f4] p-5 transition hover:border-[#c8922a]/45 hover:bg-[#fbfaf7] dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-[#c8922a]/45"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Time</p>
          <p className="mt-2 font-[family-name:var(--font-playfair)] text-5xl font-bold tracking-tight text-[#111] dark:text-[#f4f1ea]">{stats.time_label}</p>
        </div>
        <span className="rounded-full border border-black/[0.10] px-3 py-1.5 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-500 dark:border-white/[0.10] dark:text-zinc-300">
          See how it works →
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        Meaningful active time other people spent with this profile’s posts, articles, and context.
      </p>
    </Link>
  );
}

function topTopics(cards: Signal[]) {
  const counts = new Map<string, number>();
  for (const card of cards) {
    for (const tag of card.tags || []) {
      const clean = tag.replace(/^#+/, "").trim();
      if (clean && clean !== "people") counts.set(clean, (counts.get(clean) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([topic]) => topic);
}

function ProfileCard({ signal }: { signal: Signal }) {
  const label = signal.category?.replaceAll("-", " ") || "post";
  const review = aiReviewLabel(signal);
  return (
    <article className="rounded-3xl border border-black/[0.08] bg-white p-5 transition hover:border-[#c8922a]/35 dark:border-white/[0.08] dark:bg-white/[0.035]">
      <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">
        <span>{label}</span>
        {review ? <span>· {review}</span> : null}
        <span>· {formatDate(signal.published_at)}</span>
      </div>
      <Link href={`/signals/${signal.slug}`} className="group mt-3 block">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight group-hover:text-[#b58320]">
          {signal.title}
        </h2>
        {signal.summary ? <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{signal.summary}</p> : null}
      </Link>
      {signal.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {signal.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full border border-black/[0.08] px-2 py-0.5 font-[family-name:var(--font-inter)] text-[10px] font-semibold text-zinc-400 dark:border-white/[0.08]">
              {tag.replace(/^#+/, "")}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/signals/${signal.slug}`} className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white dark:bg-white dark:text-black">
          Open
        </Link>
        {signal.article_url ? (
          <a href={signal.article_url} target="_blank" rel="noreferrer" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
            Source
          </a>
        ) : null}
      </div>
    </article>
  );
}

function ProfileNavTabs({ handle, active }: { handle: string; active: ProfileTabView }) {
  const views: Array<{ view: ProfileTabView; label: string }> = [
    { view: "posts", label: "Posts" },
    { view: "tab", label: "Tab" },
    { view: "about", label: "About" },
    { view: "sources", label: "Sources" },
  ];
  return (
    <nav className="mt-5 flex gap-2 overflow-x-auto rounded-full border border-black/[0.08] bg-[#f8f7f4] p-1 dark:border-white/[0.08] dark:bg-white/[0.035]" aria-label="Profile sections">
      {views.map(({ view, label }) => {
        const isActive = active === view;
        return (
          <Link
            key={view}
            href={profileTabHref(handle, view)}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold transition ${isActive ? "bg-[#111] text-white dark:bg-white dark:text-black" : "text-zinc-500 hover:bg-white hover:text-[#b58320] dark:text-zinc-300 dark:hover:bg-white/[0.08]"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function EmptyPosts({ name }: { name: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-black/10 bg-white/50 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.025]">
      <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">No public posts yet.</p>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">When {name} publishes posts, they’ll appear here.</p>
    </div>
  );
}

function ProfilePostsSection({ cards, name }: { cards: Signal[]; name: string }) {
  return <div className="grid gap-3">{cards.length ? cards.map((signal) => <ProfileCard key={signal.id} signal={signal} />) : <EmptyPosts name={name} />}</div>;
}

function EvidenceLinkList({ evidence }: { evidence: Array<{ title: string; href: string; date?: string }> }) {
  if (!evidence.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
      <span className="font-bold text-zinc-400">Evidence:</span>
      {evidence.map((item) => (
        <Link key={`${item.href}-${item.title}`} href={item.href} className="font-semibold text-[#9b6b18] hover:text-[#c8922a] dark:text-[#f0c15e]">
          {item.title}{item.date ? ` (${item.date})` : ""}
        </Link>
      ))}
    </div>
  );
}

function ProfileTabSection({ profile, tabData }: { profile: Profile; tabData: ProfileTabData }) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-[#b58320]">Tab</p>
        <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold">{profile.displayName}&apos;s Tab</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          A living map of this profile&apos;s public contributions, topics, sources, and evolving work.
        </p>
        <p className="mt-3 rounded-2xl bg-[#f8f7f4] p-4 text-sm leading-relaxed text-zinc-600 dark:bg-white/[0.045] dark:text-zinc-300">
          Every section is built from public posts and sources. The person owns their About section; Tab organises what they have contributed.
        </p>
      </section>

      {!tabData.enoughData ? (
        <section className="rounded-3xl border border-dashed border-black/10 bg-white/60 p-8 text-center dark:border-white/10 dark:bg-white/[0.025]">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Tab needs more public evidence.</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Once this profile has more public posts, linked sources, or topics, Tab will organise them into a source-backed knowledge profile.
          </p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Snapshot</p>
        <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold">{tabData.snapshot.headline}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{tabData.snapshot.description}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.045]"><p className="text-2xl font-bold">{tabData.snapshot.evidenceCount}</p><p className="text-xs text-zinc-500">public updates used</p></div>
          <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.045]"><p className="text-2xl font-bold">{tabData.topics.length}</p><p className="text-xs text-zinc-500">topics identified</p></div>
          <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.045]"><p className="text-2xl font-bold">{tabData.snapshot.lastUpdatedLabel}</p><p className="text-xs text-zinc-500">latest evidence</p></div>
        </div>
      </section>

      <section className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Topic map</p>
        {tabData.topics.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tabData.topics.map((topic) => (
              <div key={topic.name} className="rounded-2xl border border-black/[0.07] p-4 dark:border-white/[0.08]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold capitalize">{topic.name}</h3>
                  <span className="rounded-full bg-[#f8f7f4] px-2 py-1 text-xs font-bold text-zinc-500 dark:bg-white/[0.06]">{topic.count}</span>
                </div>
                <EvidenceLinkList evidence={topic.evidence} />
              </div>
            ))}
          </div>
        ) : <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Topics will appear once public posts include tags or sections.</p>}
      </section>

      <section className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Notable contributions</p>
        <div className="mt-4 space-y-3">
          {tabData.contributions.length ? tabData.contributions.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-2xl border border-black/[0.07] p-4 transition hover:border-[#c8922a]/40 dark:border-white/[0.08]">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9b6b18] dark:text-[#f0c15e]">{item.date}{item.sourceDomain ? ` · Source: ${item.sourceDomain}` : ""}</p>
              <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-bold">{item.title}</h3>
              {item.summary ? <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.summary}</p> : null}
              <p className="mt-2 text-xs text-zinc-500">Why shown: {item.reason}.</p>
            </Link>
          )) : <p className="text-sm text-zinc-500 dark:text-zinc-400">Notable contributions will appear when there are public posts to cite.</p>}
        </div>
      </section>

      <section className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Timeline of public thinking</p>
        <div className="mt-4 space-y-3">
          {tabData.timeline.length ? tabData.timeline.map((item) => (
            <Link key={`${item.href}-${item.date}`} href={item.href} className="grid gap-2 rounded-2xl border border-black/[0.07] p-4 hover:border-[#c8922a]/40 dark:border-white/[0.08] sm:grid-cols-[110px_1fr]">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">{item.label}</span>
              <span><strong>{item.title}</strong><span className="block text-xs text-zinc-500">Evidence date: {item.date}</span></span>
            </Link>
          )) : <p className="text-sm text-zinc-500 dark:text-zinc-400">The timeline will build from dated public contributions.</p>}
        </div>
      </section>

      <p className="rounded-3xl border border-black/[0.08] bg-[#f8f7f4] p-4 text-xs leading-relaxed text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-400">
        Tab is generated from public contributions only. It should not be treated as a full biography or endorsement.
      </p>
    </div>
  );
}

function ProfileAboutSection({ profile, name, clean, stats, isOwnProfile }: { profile: Profile; name: string; clean: string; stats: PublicProfileStats; isOwnProfile: boolean }) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-[#b58320]">About</p>
        <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">{profile.displayName}</h2>
        <p className="mt-1 text-sm font-semibold text-zinc-400">{name}</p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          {profile.bio || "This person has not added a public bio yet."}
        </p>
        <p className="mt-4 rounded-2xl bg-[#f8f7f4] p-4 text-sm leading-relaxed text-zinc-600 dark:bg-white/[0.045] dark:text-zinc-300">
          About is written or controlled by the person. Tab is the organised map of what they have publicly contributed.
        </p>
        {isOwnProfile ? (
          <Link href="/account" className="mt-5 inline-flex rounded-full bg-[#c8922a] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]">Edit profile</Link>
        ) : null}
      </section>
      <section className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Public profile stats</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.045]"><p className="text-2xl font-bold">{stats.cards_count}</p><p className="text-xs text-zinc-500">posts</p></div>
          <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.045]"><p className="text-2xl font-bold">{stats.context_count}</p><p className="text-xs text-zinc-500">context items</p></div>
          <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.045]"><p className="text-2xl font-bold">{stats.sources_count}</p><p className="text-xs text-zinc-500">sources</p></div>
        </div>
        <p className="mt-4 text-xs text-zinc-500">Account type: {clean === "albis" ? "Albis account" : "Public account"}.</p>
      </section>
    </div>
  );
}

function ProfileSourcesSection({ tabData }: { tabData: ProfileTabData }) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-[#b58320]">Sources</p>
        <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">Source evidence</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Sources are the references attached to this profile&apos;s public updates. They help make Tab traceable.
        </p>
      </section>
      <section className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Linked domains</p>
            <p className="mt-2 text-sm text-zinc-500">{tabData.sources.length} source domain{tabData.sources.length === 1 ? "" : "s"} found in public posts.</p>
          </div>
          <span className="rounded-full bg-[#f8f7f4] px-3 py-1 text-xs font-bold text-zinc-500 dark:bg-white/[0.06]">Based on {tabData.snapshot.evidenceCount} public updates</span>
        </div>
        <div className="mt-5 space-y-3">
          {tabData.sources.length ? tabData.sources.map((source) => (
            <div key={source.domain} className="rounded-2xl border border-black/[0.07] p-4 dark:border-white/[0.08]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">{source.domain}</h3>
                <span className="rounded-full bg-[#f8f7f4] px-2 py-1 text-xs font-bold text-zinc-500 dark:bg-white/[0.06]">{source.count} link{source.count === 1 ? "" : "s"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="font-bold text-zinc-400">Examples:</span>
                {source.examples.map((example) => (
                  <a key={example.href} href={example.href} target="_blank" rel="noreferrer" className="font-semibold text-[#9b6b18] hover:text-[#c8922a] dark:text-[#f0c15e]">{example.title}</a>
                ))}
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center dark:border-white/10">
              <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">No linked sources yet.</p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">When public updates include source links, they will appear here as evidence for Tab.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProfileSidebar({ topics, stats, activeContext }: { topics: string[]; stats: PublicProfileStats; activeContext: Signal[] }) {
  return (
    <aside className="space-y-3">
      <div className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Topics</p>
        {topics.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map((topic) => <span key={topic} className="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">{topic}</span>)}
          </div>
        ) : <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Topics will appear as this account posts more updates.</p>}
      </div>
      <div className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
        <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Context trail</p>
        {stats.latest_context.length ? (
          <div className="mt-3 space-y-3">
            {stats.latest_context.map((item) => (
              <Link key={item.id} href={item.href} className="block rounded-2xl border border-black/[0.06] p-3 text-sm font-semibold hover:border-[#c8922a]/40 dark:border-white/[0.08]">
                {item.title}
                <span className="mt-1 block text-xs font-normal text-zinc-400">{item.type} added · {formatDate(item.created_at)}</span>
              </Link>
            ))}
          </div>
        ) : activeContext.length ? (
          <div className="mt-3 space-y-3">
            {activeContext.map((card) => (
              <Link key={card.id} href={`/signals/${card.slug}`} className="block rounded-2xl border border-black/[0.06] p-3 text-sm font-semibold hover:border-[#c8922a]/40 dark:border-white/[0.08]">
                {card.title}
                <span className="mt-1 block text-xs font-normal text-zinc-400">Active discussion</span>
              </Link>
            ))}
          </div>
        ) : <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Discussion and context from this account’s posts will collect here.</p>}
      </div>
    </aside>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const clean = authorProfileHandle(handle);
  if (!clean) return {};
  return {
    title: `${displayHandle(clean)} — Albis`,
    description: `Posts, sources, and Tab from ${displayHandle(clean)} on Albis.`,
  };
}

export default async function PublicProfilePage({ params, searchParams }: Props) {
  const { handle } = await params;
  const clean = authorProfileHandle(handle);
  if (!clean) notFound();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeView = normaliseProfileTabView(resolvedSearchParams?.tab);

  const cards = await getSignalsByAuthorHandle(clean, 36);
  const name = displayHandle(clean);
  const profile = profileFromCards(clean, cards);
  const topics = topTopics(cards);
  const stats = await getPublicProfileStats(clean, cards);
  const aiReviewedCount = cards.filter((card) => typeof card.metadata?.ai_review_status === "string" && card.metadata.ai_review_status !== "not_requested").length;
  const activeContext = cards.filter((card) => (card.comment_count || 0) > 0).slice(0, 5);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userMetadata = user?.user_metadata || {};
  const currentHandle = authorProfileHandle(userMetadata.username || user?.email?.split("@")[0]);
  const isOwnProfile = Boolean(currentHandle && currentHandle === clean);

  if (isOwnProfile) {
    profile.displayName = String(userMetadata.name || profile.displayName || name).trim();
    profile.bio = typeof userMetadata.bio === "string" && userMetadata.bio.trim() ? userMetadata.bio.trim() : profile.bio;
    profile.avatarUrl = typeof userMetadata.avatar_url === "string" && userMetadata.avatar_url.trim() ? userMetadata.avatar_url.trim() : profile.avatarUrl;
  }

  const tabData = buildProfileTabData(clean, profile, cards, stats);

  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-8 text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea] md:px-6">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Albis public profile</p>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 gap-4">
              <UserAvatar name={profile.displayName} imageUrl={profile.avatarUrl} size="lg" />
              <div className="min-w-0">
                <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">{profile.displayName}</h1>
                <p className="mt-1 font-[family-name:var(--font-inter)] text-sm font-semibold text-zinc-400">{name}</p>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {profile.bio || "Posts, sources, and context from this Albis contributor."}
                </p>
              </div>
            </div>
            {isOwnProfile ? (
              <Link href="/account" className="rounded-full bg-[#c8922a] px-5 py-3 text-center font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]">
                Edit profile
              </Link>
            ) : (
              <FollowButton type="person" label={name} className="rounded-full bg-[#c8922a] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]" />
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{stats.cards_count} post{stats.cards_count === 1 ? "" : "s"}</span>
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{stats.context_count} context item{stats.context_count === 1 ? "" : "s"}</span>
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{stats.sources_count} source{stats.sources_count === 1 ? "" : "s"}</span>
            {aiReviewedCount ? <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{aiReviewedCount} AI-reviewed</span> : null}
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{clean === "albis" ? "Albis account" : "Public account"}</span>
          </div>
          <TimeCard stats={stats} handle={clean} />
          <ProfileNavTabs handle={clean} active={activeView} />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_280px]">
          <div>
            {activeView === "posts" ? <ProfilePostsSection cards={cards} name={name} /> : null}
            {activeView === "tab" ? <ProfileTabSection profile={profile} tabData={tabData} /> : null}
            {activeView === "about" ? <ProfileAboutSection profile={profile} name={name} clean={clean} stats={stats} isOwnProfile={isOwnProfile} /> : null}
            {activeView === "sources" ? <ProfileSourcesSection tabData={tabData} /> : null}
          </div>
          <ProfileSidebar topics={topics} stats={stats} activeContext={activeContext} />
        </div>
      </section>
    </main>
  );
}
