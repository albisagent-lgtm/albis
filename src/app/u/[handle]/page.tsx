import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/app/components/follow-button";
import { UserAvatar } from "@/app/components/user-avatar";
import { createClient } from "@/lib/supabase/server";
import { authorProfileHandle, getPublicProfileStats, getSignalsByAuthorHandle, type PublicProfileStats, type Signal } from "@/lib/signals";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface Props { params: Promise<{ handle: string }>; }

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

function profileFromCards(handle: string, cards: Signal[]) {
  if (handle === "albis") {
    return {
      displayName: "Albis",
      bio: "Truth, trust, and clarity — public cards, source-backed articles, and context from the Albis intelligence layer.",
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
        Meaningful active time other people spent with this profile’s cards, articles, and context.
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
  const label = signal.category?.replaceAll("-", " ") || "card";
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const clean = authorProfileHandle(handle);
  if (!clean) return {};
  return {
    title: `${displayHandle(clean)} — Albis`,
    description: `Cards and posts from ${displayHandle(clean)} on Albis.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const clean = authorProfileHandle(handle);
  if (!clean) notFound();

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
                  {profile.bio || "Cards, posts, sources, and context from this Albis contributor."}
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
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{stats.cards_count} card{stats.cards_count === 1 ? "" : "s"}</span>
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{stats.context_count} context item{stats.context_count === 1 ? "" : "s"}</span>
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{stats.sources_count} source{stats.sources_count === 1 ? "" : "s"}</span>
            {aiReviewedCount ? <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{aiReviewedCount} AI-reviewed</span> : null}
            <span className="rounded-full border border-black/[0.10] px-3 py-1 dark:border-white/[0.10]">{clean === "albis" ? "Albis account" : "Public account"}</span>
          </div>
          <TimeCard stats={stats} handle={clean} />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_280px]">
          <div className="grid gap-3">
          {cards.length ? cards.map((signal) => <ProfileCard key={signal.id} signal={signal} />) : (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white/50 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.025]">
              <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">No public cards yet.</p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">When {name} publishes cards, they’ll appear here.</p>
            </div>
          )}
          </div>
          <aside className="space-y-3">
            <div className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Topics</p>
              {topics.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {topics.map((topic) => <span key={topic} className="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">{topic}</span>)}
                </div>
              ) : <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Topics will appear as this account posts more cards.</p>}
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
              ) : <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Discussion and context from this account’s cards will collect here.</p>}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
