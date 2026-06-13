"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type LaunchAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  ref?: string;
  captured_at?: number;
};

const ATTRIBUTION_STORAGE_KEY = "albis_launch_attribution";
const ATTRIBUTION_SENT_KEY = "albis_launch_attribution_page_view_sent";
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sendEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}

function cleanParam(value: string | null) {
  if (!value) return undefined;
  return value.trim().slice(0, 120) || undefined;
}

function readStoredAttribution(): LaunchAttribution | null {
  try {
    const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as LaunchAttribution;
    if (!parsed.captured_at || Date.now() - parsed.captured_at > ATTRIBUTION_TTL_MS) {
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function captureLaunchAttribution() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const incoming: LaunchAttribution = {
    utm_source: cleanParam(params.get("utm_source")),
    utm_medium: cleanParam(params.get("utm_medium")),
    utm_campaign: cleanParam(params.get("utm_campaign")),
    utm_content: cleanParam(params.get("utm_content")),
    ref: cleanParam(params.get("ref")),
    captured_at: Date.now(),
  };

  const hasIncoming = Boolean(incoming.utm_source || incoming.utm_medium || incoming.utm_campaign || incoming.utm_content || incoming.ref);
  if (hasIncoming) {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(incoming));
    return incoming;
  }

  return readStoredAttribution();
}

function sendAttributionEvent(eventName: string, attribution: LaunchAttribution, metadata: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  void fetch("/api/attribution/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      event_name: eventName,
      page_path: window.location.pathname,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      referrer: document.referrer,
      metadata,
    }),
  }).catch(() => {});
}

function linkArea(href: string) {
  if (href.includes("/signals/weather-risk")) return "weather_risk";
  if (href.includes("/what-am-i-missing")) return "what_missing";
  if (href.includes("/indexes") || href.includes("/lens") || href.includes("/perspectives")) return "perspective_gap";
  if (href.includes("/archive") || href.includes("/search")) return "archive_search";
  if (href.includes("/editorial") || href.includes("/methodology") || href.includes("/corrections")) return "trust";
  if (href.includes("/company-daily-scan")) return "company_scan";
  return "internal";
}

export function AnalyticsEvents() {
  useEffect(() => {
    const firedScroll = new Set<number>();
    let secondPageSent = false;
    const startedAt = Date.now();
    const attribution = captureLaunchAttribution();

    if (attribution?.utm_source || attribution?.utm_campaign || attribution?.utm_content || attribution?.ref) {
      const sessionKey = [attribution.utm_source, attribution.utm_medium, attribution.utm_campaign, attribution.utm_content, window.location.pathname].filter(Boolean).join(":");
      if (sessionStorage.getItem(ATTRIBUTION_SENT_KEY) !== sessionKey) {
        sessionStorage.setItem(ATTRIBUTION_SENT_KEY, sessionKey);
        sendAttributionEvent("page_view_attributed", attribution);
      }
    }

    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = Math.round((window.scrollY / total) * 100);
      for (const threshold of [50, 75, 90]) {
        if (pct >= threshold && !firedScroll.has(threshold)) {
          firedScroll.add(threshold);
          sendEvent("albis_scroll_depth", { depth: threshold, page_path: window.location.pathname });
        }
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#")) return;
      if (attribution && (href.includes("/feedback") || href.includes("mailto:"))) {
        sendAttributionEvent("feedback_click", attribution, { href: href.slice(0, 160) });
      }
      if (attribution && href.includes("/register")) {
        sendAttributionEvent("register_start", attribution, { href: href.slice(0, 160) });
      }
      const area = linkArea(href);
      sendEvent("albis_link_click", {
        area,
        href,
        text: anchor.textContent?.trim().slice(0, 80) || "",
        page_path: window.location.pathname,
      });
      if (!secondPageSent && href.startsWith("/") && href !== window.location.pathname) {
        secondPageSent = true;
        sendEvent("albis_second_page_intent", {
          seconds_since_load: Math.round((Date.now() - startedAt) / 1000),
          from: window.location.pathname,
          to: href,
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}

function getLaunchAttribution() {
  if (typeof window === "undefined") return null;
  return readStoredAttribution();
}

function getLaunchAttributionSource(fallback = "unknown") {
  const attribution = getLaunchAttribution();
  const source = [attribution?.utm_source, attribution?.utm_content || attribution?.utm_campaign]
    .filter(Boolean)
    .join(":");
  return source.slice(0, 64) || fallback;
}

function trackLaunchAttributionEvent(eventName: string, metadata: Record<string, unknown> = {}) {
  const attribution = getLaunchAttribution();
  if (!attribution) return;
  sendAttributionEvent(eventName, attribution, metadata);
}

export { sendEvent as trackAlbisEvent, getLaunchAttribution, getLaunchAttributionSource, trackLaunchAttributionEvent };
