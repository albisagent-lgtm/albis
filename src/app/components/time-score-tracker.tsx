"use client";

import { useEffect, useRef } from "react";
import { trackFeedEvent } from "./feed-event-tracking";

const CHUNK_SECONDS = 30;
const MAX_SECONDS_PER_PAGE = 20 * 60;

function isActiveDocument() {
  return typeof document !== "undefined" && document.visibilityState === "visible";
}

export function TimeScoreTracker({
  targetType,
  targetId,
  cardSlug,
}: {
  targetType: "signal" | "article" | "profile";
  targetId: string;
  cardSlug?: string | null;
}) {
  const activeSeconds = useRef(0);
  const pendingSeconds = useRef(0);
  const lastTickAt = useRef<number | null>(null);

  useEffect(() => {
    if (!targetId) return;
    let stopped = false;

    async function flush(reason: string) {
      const seconds = Math.min(Math.floor(pendingSeconds.current), CHUNK_SECONDS);
      if (seconds < 10 || stopped) return;
      pendingSeconds.current = 0;

      const body = JSON.stringify({
        direction: "spent",
        event_type: "dwell",
        target_type: targetType,
        target_id: targetId,
        seconds,
        metadata: { reason, source: "active-time-tracker" },
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/time-clock/events", blob);
      } else {
        fetch("/api/time-clock/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => undefined);
      }

      if (cardSlug) {
        trackFeedEvent(cardSlug, "open", {
          event_subtype: "active_dwell",
          seconds,
          target_type: targetType,
          target_id: targetId,
        });
      }
    }

    function tick() {
      const now = Date.now();
      if (lastTickAt.current === null) {
        lastTickAt.current = now;
        return;
      }
      const delta = Math.min(5, Math.max(0, Math.round((now - lastTickAt.current) / 1000)));
      lastTickAt.current = now;
      if (!isActiveDocument()) return;
      if (activeSeconds.current >= MAX_SECONDS_PER_PAGE) return;
      activeSeconds.current += delta;
      pendingSeconds.current += delta;
      if (pendingSeconds.current >= CHUNK_SECONDS) void flush("interval");
    }

    trackFeedEvent(cardSlug || "", "open", { target_type: targetType, target_id: targetId, event_subtype: "page_open" });
    const timer = window.setInterval(tick, 1000);

    const onHide = () => {
      if (document.visibilityState === "hidden") void flush("hidden");
      lastTickAt.current = Date.now();
    };
    const onPageHide = () => void flush("pagehide");
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      void flush("unmount");
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [targetType, targetId, cardSlug]);

  return null;
}
