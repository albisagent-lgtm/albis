"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
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

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

type NotificationsMenuProps = {
  placement?: "below" | "above";
  variant?: "icon" | "nav";
};

export function NotificationsMenu({ placement = "below", variant = "icon" }: NotificationsMenuProps = {}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=10", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as NotificationsResponse;
      if (!data.authenticated || data.unavailable) return;
      setItems(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    const id = window.setInterval(loadNotifications, 60_000);
    return () => window.clearInterval(id);
  }, []);

  async function markAllRead() {
    const previous = unreadCount;
    setUnreadCount(0);
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    if (!res.ok) {
      setUnreadCount(previous);
      await loadNotifications();
    }
  }

  async function markOneRead(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
        keepalive: true,
      });
    } catch {
      // Non-critical; the next load will reconcile state.
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((value) => !value);
          if (!open) loadNotifications();
        }}
        className={variant === "nav"
          ? "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          : "relative flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.07] bg-white/80 text-zinc-600 transition-colors hover:bg-black/[0.04] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.06]"
        }
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
      >
        <span className="relative">
          <svg width={variant === "nav" ? 20 : 16} height={variant === "nav" ? 20 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-[#c8922a] px-1 text-center text-[10px] font-bold leading-4 text-[#0f0f0f]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
        {variant === "nav" ? <span>Alerts</span> : null}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={placement === "above"
            ? "fixed bottom-[64px] left-3 right-3 z-50 rounded-xl border border-black/[0.07] bg-white p-2 shadow-lg dark:border-white/[0.07] dark:bg-[#1a1a1a]"
            : "absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-black/[0.07] bg-white p-2 shadow-lg dark:border-white/[0.07] dark:bg-[#1a1a1a]"
          }>
            <div className="flex items-center justify-between border-b border-black/[0.07] px-3 py-2 dark:border-white/[0.07]">
              <div>
                <p className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec]">Notifications</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Replies and useful activity</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs font-semibold text-[#b58320] hover:text-[#8f6518]">
                  View all
                </Link>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-semibold text-[#b58320] hover:text-[#8f6518]">
                    Mark read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto py-1">
              {loading && !items.length ? (
                <p className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
              ) : items.length ? (
                items.map((item) => {
                  const href = item.entity_url && item.entity_url.startsWith("/") ? item.entity_url : "/signals";
                  const unread = !item.read_at;
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      onClick={() => {
                        setOpen(false);
                        if (unread) void markOneRead(item.id);
                      }}
                      className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    >
                      <div className="flex gap-2">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-[#c8922a]" : "bg-transparent"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec]">{item.title}</p>
                            <span className="shrink-0 text-xs text-zinc-400">{timeAgo(item.created_at)}</span>
                          </div>
                          {item.body ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{item.body}</p> : null}
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">No notifications yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function NotificationsNavLink() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadUnreadCount() {
    try {
      const res = await fetch("/api/notifications?unread=1&limit=1", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as NotificationsResponse;
      if (!data.authenticated || data.unavailable) return;
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Non-critical: the full notifications page can still load directly.
    }
  }

  useEffect(() => {
    void loadUnreadCount();
    const id = window.setInterval(loadUnreadCount, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const active = pathname === "/notifications";

  return (
    <Link
      href="/notifications"
      className={`relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "text-[#c8922a] dark:text-[#c8922a]"
          : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      }`}
    >
      <span className="relative">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-[#c8922a] px-1 text-center text-[10px] font-bold leading-4 text-[#0f0f0f]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </span>
      <span>Alerts</span>
    </Link>
  );
}
