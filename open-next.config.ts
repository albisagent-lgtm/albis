import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Bare configuration — no R2 incremental-cache override, no KV bindings.
// ISR cache stays in-memory per worker isolate for PR 7 Phase 1.
// Revisit if production ISR behaviour is poor under real traffic.
export default defineCloudflareConfig({});
