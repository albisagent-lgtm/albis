export type FeedEventType = "impression" | "open" | "comment" | "save" | "unsave" | "share" | "follow" | "unfollow" | "hide" | "report";

function getAnonId() {
  if (typeof window === "undefined") return null;
  const key = "albis_feed_anon_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

export function trackFeedEvent(cardSlug: string, eventType: FeedEventType, metadata?: Record<string, unknown>) {
  if (typeof window === "undefined" || !cardSlug) return;
  const payload = JSON.stringify({
    card_slug: cardSlug,
    event_type: eventType,
    anon_id: getAnonId(),
    metadata: metadata || {},
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon("/api/feed/events", blob)) return;
  }

  fetch("/api/feed/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
