"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type NotificationItem = {
  id: string;
  type: "comment" | "reply" | "follow" | "system" | string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  entity_url: string | null;
  read_at: string | null;
  created_at: string;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  unread_count: number;
  authenticated: boolean;
  unavailable?: boolean;
};

type Filter = "all" | "unread" | "replies" | "comments" | "follows" | "system";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "replies", label: "Replies" },
  { key: "comments", label: "Comments" },
  { key: "follows", label: "Follows" },
  { key: "system", label: "System" },
];

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function hrefFor(item: NotificationItem) {
  return item.entity_url && item.entity_url.startsWith("/") ? item.entity_url : "/signals";
}

function typeLabel(type: string) {
  if (type === "reply") return "Reply";
  if (type === "comment") return "Comment";
  if (type === "follow") return "Follow";
  if (type === "system") return "System";
  return "Activity";
}

function typeTone(type: string) {
  if (type === "reply") return "bg-[#c8922a]/15 text-[#8f6518] dark:text-[#e0b75f]";
  if (type === "comment") return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
  if (type === "follow") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
}

export function NotificationsTab() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=100", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load notifications");
      const data = (await res.json()) as NotificationsResponse;
      setAuthenticated(data.authenticated);
      setUnavailable(data.unavailable === true);
      setItems(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === "unread") return items.filter((item) => !item.read_at);
    if (filter === "replies") return items.filter((item) => item.type === "reply");
    if (filter === "comments") return items.filter((item) => item.type === "comment");
    if (filter === "follows") return items.filter((item) => item.type === "follow");
    if (filter === "system") return items.filter((item) => item.type === "system");
    return items;
  }, [filter, items]);

  async function markAllRead() {
    const now = new Date().toISOString();
    const previousItems = items;
    const previousUnread = unreadCount;
    setUnreadCount(0);
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || now })));

    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    if (!res.ok) {
      setItems(previousItems);
      setUnreadCount(previousUnread);
      await loadNotifications();
    }
  }

  async function markOneRead(id: string) {
    const item = items.find((candidate) => candidate.id === id);
    if (!item || item.read_at) return;
    setItems((current) => current.map((candidate) => candidate.id === id ? { ...candidate, read_at: candidate.read_at || new Date().toISOString() } : candidate));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
        keepalive: true,
      });
    } catch {
      // The next refresh will reconcile state.
    }
  }

  if (!authenticated && !loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl border border-black/[0.07] bg-white/70 p-6 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">Account</p>
          <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl italic text-[#0f0f0f] dark:text-[#f0efec]">Notifications</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Sign in to see replies, follows, and useful activity on your Albis account.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-full bg-[#c8922a] px-5 py-2 text-sm font-semibold text-[#0f0f0f] transition-colors hover:bg-[#b17f24]">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">Account</p>
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl italic tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Replies, comments, follows, and useful account activity in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadNotifications()}
            className="rounded-full border border-black/[0.07] px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/[0.04] dark:border-white/[0.07] dark:text-zinc-300 dark:hover:bg-white/[0.05]"
          >
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllRead()}
              className="rounded-full bg-[#c8922a] px-4 py-2 text-sm font-semibold text-[#0f0f0f] transition-colors hover:bg-[#b17f24]"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((item) => {
          const active = filter === item.key;
          const count = item.key === "unread"
            ? unreadCount
            : item.key === "all"
              ? items.length
              : items.filter((notification) => notification.type === (item.key === "replies" ? "reply" : item.key === "comments" ? "comment" : item.key === "follows" ? "follow" : item.key)).length;
          return (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${active
                ? "border-[#c8922a] bg-[#c8922a]/12 text-[#8f6518] dark:text-[#e0b75f]"
                : "border-black/[0.07] text-zinc-500 hover:bg-black/[0.04] dark:border-white/[0.07] dark:text-zinc-400 dark:hover:bg-white/[0.05]"
              }`}
            >
              {item.label}
              {count > 0 ? <span className="ml-1 text-xs opacity-70">{count}</span> : null}
            </button>
          );
        })}
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-black/[0.07] bg-white/70 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
        {loading ? (
          <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">Loading notifications…</div>
        ) : unavailable ? (
          <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">Notifications are unavailable right now. Try refreshing in a moment.</div>
        ) : filteredItems.length ? (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {filteredItems.map((item) => {
              const unread = !item.read_at;
              return (
                <Link
                  key={item.id}
                  href={hrefFor(item)}
                  onClick={() => void markOneRead(item.id)}
                  className="block p-4 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] sm:p-5"
                >
                  <div className="flex gap-3">
                    <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "bg-[#c8922a]" : "bg-transparent"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeTone(item.type)}`}>{typeLabel(item.type)}</span>
                        <span className="text-xs text-zinc-400">{timeAgo(item.created_at)}</span>
                      </div>
                      <h2 className="mt-2 text-base font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">{item.title}</h2>
                      {item.body ? <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{item.body}</p> : null}
                      {item.entity_url ? <p className="mt-2 truncate text-xs text-zinc-400">Open related context →</p> : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">No notifications here yet.</p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {filter === "all" ? "Replies, follows, and account activity will appear here." : "Try the All tab or check back later."}
            </p>
          </div>
        )}
      </section>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]">← Back</button>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <Link href="/" className="text-zinc-500 hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]">Feed</Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <Link href="/u/albis" className="text-zinc-500 hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]">Profile</Link>
      </div>
    </main>
  );
}
