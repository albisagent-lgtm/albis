"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type NotificationItem = {
  id: string;
  type: "comment" | "reply" | "follow" | "system" | "mention" | string;
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

type Filter = "all" | "unread" | "mentions" | "follows" | "system";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "mentions", label: "Mentions" },
  { key: "follows", label: "Follows" },
  { key: "system", label: "System" },
];

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function hrefFor(item: NotificationItem) {
  return item.entity_url && item.entity_url.startsWith("/") ? item.entity_url : "/signals";
}

function isMentionLike(item: NotificationItem) {
  return item.type === "reply" || item.type === "comment" || item.type === "mention";
}

function iconFor(type: string) {
  if (type === "follow") return "👤";
  if (type === "system") return "•";
  if (type === "reply") return "↩";
  if (type === "comment") return "✍";
  if (type === "mention") return "@";
  return "•";
}

function actionLabel(type: string) {
  if (type === "follow") return "Follow";
  if (type === "system") return "Update";
  if (type === "reply") return "Reply";
  if (type === "comment") return "Context";
  if (type === "mention") return "Mention";
  return "Activity";
}

export function NotificationsTab() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  async function loadNotifications(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(false), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === "unread") return items.filter((item) => !item.read_at);
    if (filter === "mentions") return items.filter(isMentionLike);
    if (filter === "follows") return items.filter((item) => item.type === "follow");
    if (filter === "system") return items.filter((item) => item.type === "system");
    return items;
  }, [filter, items]);

  function countFor(key: Filter) {
    if (key === "all") return items.length;
    if (key === "unread") return unreadCount;
    if (key === "mentions") return items.filter(isMentionLike).length;
    if (key === "follows") return items.filter((item) => item.type === "follow").length;
    if (key === "system") return items.filter((item) => item.type === "system").length;
    return 0;
  }

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
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-black/[0.07] bg-white/75 p-5 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">Notifications</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Sign in to see replies, follows, mentions, and account activity.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-full bg-[#c8922a] px-5 py-2 text-sm font-semibold text-[#0f0f0f] transition-colors hover:bg-[#b17f24]">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-0 pb-24 sm:px-6 sm:py-8">
      <header className="sticky top-0 z-10 border-b border-black/[0.06] bg-[#f7f4ee]/95 px-4 py-3 backdrop-blur dark:border-white/[0.07] dark:bg-[#0f0f0f]/90 sm:static sm:rounded-t-2xl sm:border sm:border-b-0 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">Notifications</h1>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => void loadNotifications(false)}
              aria-label="Refresh notifications"
              className="grid h-9 w-9 place-items-center rounded-full border border-black/[0.07] text-sm text-zinc-500 transition-colors hover:bg-black/[0.04] dark:border-white/[0.07] dark:text-zinc-300 dark:hover:bg-white/[0.05]"
            >
              ↻
            </button>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="rounded-full bg-[#0f0f0f] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/80 dark:bg-[#f0efec] dark:text-[#0f0f0f]"
              >
                Mark read
              </button>
            )}
          </div>
        </div>

        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            const count = countFor(item.key);
            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${active
                  ? "bg-[#0f0f0f] text-white dark:bg-[#f0efec] dark:text-[#0f0f0f]"
                  : "bg-white/65 text-zinc-600 hover:bg-white dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.09]"
                }`}
              >
                {item.label}
                {count > 0 ? <span className="ml-1 text-xs opacity-65">{count}</span> : null}
              </button>
            );
          })}
        </nav>
      </header>

      <section className="bg-white/75 dark:bg-white/[0.03] sm:overflow-hidden sm:rounded-b-2xl sm:border sm:border-t-0 sm:border-black/[0.07] sm:shadow-sm sm:dark:border-white/[0.07]">
        {loading ? (
          <div className="p-5 text-sm text-zinc-500 dark:text-zinc-400">Loading…</div>
        ) : unavailable ? (
          <div className="p-5 text-sm text-zinc-500 dark:text-zinc-400">Notifications are unavailable right now. Try refreshing in a moment.</div>
        ) : filteredItems.length ? (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {filteredItems.map((item) => {
              const unread = !item.read_at;
              return (
                <Link
                  key={item.id}
                  href={hrefFor(item)}
                  onClick={() => void markOneRead(item.id)}
                  className={`block px-4 py-3 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${unread ? "bg-[#c8922a]/7 dark:bg-[#c8922a]/10" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f0ece2] text-sm font-semibold text-[#8f6518] dark:bg-white/[0.08] dark:text-[#e0b75f]">
                      {iconFor(item.type)}
                      {unread ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#c8922a] ring-2 ring-white dark:ring-[#151515]" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm leading-snug ${unread ? "font-semibold text-[#0f0f0f] dark:text-[#f0efec]" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {item.title}
                        </p>
                        <span className="shrink-0 text-xs text-zinc-400">{timeAgo(item.created_at)}</span>
                      </div>
                      {item.body ? <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{item.body}</p> : null}
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">{actionLabel(item.type)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">No notifications</p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {filter === "all" ? "Replies, follows, mentions, and account activity will appear here." : "Try All or check back later."}
            </p>
          </div>
        )}
      </section>

      <div className="mx-4 mt-4 flex flex-wrap gap-2 text-sm sm:mx-0">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]">← Back</button>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <Link href="/" className="text-zinc-500 hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]">Feed</Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <Link href="/u/albis" className="text-zinc-500 hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]">Profile</Link>
      </div>
    </main>
  );
}
