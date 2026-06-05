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

type Filter = "all" | "unread";

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

function iconFor(type: string) {
  if (type === "follow") return "👤";
  if (type === "system") return "•";
  if (type === "reply") return "↩";
  if (type === "comment") return "✍";
  if (type === "mention") return "@";
  return "•";
}

function typeLabel(type: string) {
  if (type === "follow") return "Follow";
  if (type === "system") return "Update";
  if (type === "reply") return "Reply";
  if (type === "comment") return "Context";
  if (type === "mention") return "Mention";
  return "Activity";
}

function sectionLabel(section: "new" | "earlier") {
  return section === "new" ? "New" : "Earlier";
}

function NotificationRow({ item, onRead }: { item: NotificationItem; onRead: (id: string) => void }) {
  const unread = !item.read_at;
  return (
    <Link
      href={hrefFor(item)}
      onClick={() => onRead(item.id)}
      className={`block px-4 py-3 transition-colors hover:bg-black/[0.035] dark:hover:bg-white/[0.045] sm:px-5 ${unread ? "bg-[#c8922a]/8 dark:bg-[#c8922a]/10" : ""}`}
    >
      <div className="flex gap-3">
        <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f0ece2] text-base font-semibold text-[#8f6518] dark:bg-white/[0.08] dark:text-[#e0b75f]">
          {iconFor(item.type)}
          {unread ? <span className="absolute -right-0.5 top-0 h-3 w-3 rounded-full bg-[#c8922a] ring-2 ring-white dark:ring-[#151515]" /> : null}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-3">
            <p className={`text-[15px] leading-snug ${unread ? "font-semibold text-[#0f0f0f] dark:text-[#f0efec]" : "font-medium text-zinc-700 dark:text-zinc-300"}`}>
              {item.title}
            </p>
            <span className={`shrink-0 text-xs ${unread ? "font-semibold text-[#8f6518] dark:text-[#e0b75f]" : "text-zinc-400"}`}>{timeAgo(item.created_at)}</span>
          </div>
          {item.body ? <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{item.body}</p> : null}
          <p className="mt-1 text-xs text-zinc-400">{typeLabel(item.type)}</p>
        </div>
      </div>
    </Link>
  );
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
    return items;
  }, [filter, items]);

  const sections = useMemo(() => {
    if (filter === "unread") return [{ key: "new" as const, items: filteredItems }].filter((section) => section.items.length > 0);
    const unread = filteredItems.filter((item) => !item.read_at);
    const read = filteredItems.filter((item) => item.read_at);
    return [
      { key: "new" as const, items: unread },
      { key: "earlier" as const, items: read },
    ].filter((section) => section.items.length > 0);
  }, [filter, filteredItems]);

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
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Sign in to see replies, follows, and account activity.</p>
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
          <h1 className="text-2xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">Notifications</h1>
          <div className="flex shrink-0 items-center gap-3">
            {unreadCount > 0 ? (
              <button onClick={() => void markAllRead()} className="text-sm font-semibold text-[#8f6518] hover:text-[#0f0f0f] dark:text-[#e0b75f] dark:hover:text-[#f0efec]">
                Mark all read
              </button>
            ) : null}
            <button
              onClick={() => void loadNotifications(false)}
              aria-label="Refresh notifications"
              className="grid h-8 w-8 place-items-center rounded-full text-lg text-zinc-500 transition-colors hover:bg-black/[0.05] dark:text-zinc-300 dark:hover:bg-white/[0.06]"
            >
              ⋯
            </button>
          </div>
        </div>

        <nav className="mt-3 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${filter === "all" ? "bg-[#0f0f0f] text-white dark:bg-[#f0efec] dark:text-[#0f0f0f]" : "bg-white/70 text-zinc-700 hover:bg-white dark:bg-white/[0.06] dark:text-zinc-300"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${filter === "unread" ? "bg-[#0f0f0f] text-white dark:bg-[#f0efec] dark:text-[#0f0f0f]" : "bg-white/70 text-zinc-700 hover:bg-white dark:bg-white/[0.06] dark:text-zinc-300"}`}
          >
            Unread{unreadCount > 0 ? <span className="ml-1 opacity-65">{unreadCount}</span> : null}
          </button>
        </nav>
      </header>

      <section className="bg-white/75 dark:bg-white/[0.03] sm:overflow-hidden sm:rounded-b-2xl sm:border sm:border-t-0 sm:border-black/[0.07] sm:shadow-sm sm:dark:border-white/[0.07]">
        {loading ? (
          <div className="p-5 text-sm text-zinc-500 dark:text-zinc-400">Loading…</div>
        ) : unavailable ? (
          <div className="p-5 text-sm text-zinc-500 dark:text-zinc-400">Notifications are unavailable right now. Try again in a moment.</div>
        ) : sections.length ? (
          <div>
            {sections.map((section) => (
              <div key={section.key}>
                <div className="border-b border-black/[0.06] px-4 pb-2 pt-4 text-base font-bold text-[#0f0f0f] dark:border-white/[0.06] dark:text-[#f0efec] sm:px-5">
                  {sectionLabel(section.key)}
                </div>
                <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                  {section.items.map((item) => <NotificationRow key={item.id} item={item} onRead={(id) => void markOneRead(id)} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">No notifications</p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {filter === "all" ? "Replies, follows, and account activity will appear here." : "You have no unread notifications."}
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
