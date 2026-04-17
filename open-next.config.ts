import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// KV-backed incremental cache. Writable, so `revalidate = N` actually refreshes
// instead of silently no-op'ing like the static-assets cache did. Without this,
// every page with `revalidate` was either (a) frozen at build time or (b) we'd
// forced it to `dynamic = "force-dynamic"`, re-querying Supabase on every hit.
//
// KV over R2: reads are globally-distributed and sub-ms (faster than R2's
// eventually-consistent object store), the values we cache are small (~100KB
// of HTML, well under KV's 25MB per-key cap), and no dashboard opt-in is
// required (R2 requires enabling billing even inside the free tier).
//
// Required binding in wrangler.jsonc:
//   "kv_namespaces": [{ "binding": "NEXT_INC_CACHE_KV", "id": "<namespace-id>" }]
//
// See @opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache.js
// for the BINDING_NAME constant.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
