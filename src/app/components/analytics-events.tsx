"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function sendEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
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

export { sendEvent as trackAlbisEvent };
