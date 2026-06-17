#!/usr/bin/env node

const baseUrl = process.env.ALBIS_BASE_URL || "https://www.albis.news";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

async function postJson(path, payload) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { parse_error: true, text: text.slice(0, 500) };
  }
  return { status: res.status, json };
}

const attribution = await postJson("/api/attribution/event", {
  event_name: "page_view_attributed",
  page_path: "/heartbeat-growth-metrics-check",
  utm_source: "heartbeat",
  utm_medium: "system",
  utm_campaign: "growth_metrics_check",
  metadata: { check_id: stamp },
});

const feed = await postJson("/api/feed/events", {
  event_type: "open",
  card_slug: `heartbeat-growth-metrics-check-${stamp}`,
  anon_id: "heartbeat-growth-metrics-check",
  metadata: { check_id: stamp },
});

const summary = {
  ok: attribution.json?.stored === true && feed.json?.ok === true,
  baseUrl,
  attribution,
  feed,
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.ok) {
  process.exitCode = 2;
}
