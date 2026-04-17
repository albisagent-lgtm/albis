import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Serve prerendered pages (including /world, /tech, /life-systems and their
// [slug] children) from Workers static assets. Without an incremental-cache
// override, .open-next/cache/ never ships and the Worker re-renders every
// request — which fails for filesystem-backed pages because the 911 blog
// markdown files in content/blog/ are not bundled into handler.mjs.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
