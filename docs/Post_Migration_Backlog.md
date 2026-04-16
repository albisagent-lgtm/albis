# Post-Migration Backlog

Items deliberately deferred from the Cloudflare migration. These are not migration blockers; address them after the public site is stable on Cloudflare and baseline cost/performance measurements are in.

Source: answers to the 10 open questions in `docs/Cloudflare_Execution_Plan.md` § G, captured during PR 1 planning.

## Deferred items

- **Restore dynamic per-article OG images.** Migration Q3 decided to drop `/api/og` and `/api/og/pgi` and rely on the static site-wide `/og-image.png`. Per-article social cards are a nice-to-have, not critical-path. Revisit if social referral traffic becomes material. Options: pre-render PNGs at scan-ingest time and upload to Supabase Storage or R2, or run the `next/og` edge runtime behind a feature flag once Cloudflare adapter support is proven.

- **Replace `/admin` localStorage auth gate with proper server-side auth.** Migration Q10 flagged this as a pre-existing security concern. `src/app/admin/page.tsx` currently gates on a localStorage value, which any user can set in devtools. Route should be protected by a Supabase-authenticated middleware check against an `is_admin` column on `profiles` (or similar).

- **Drop `scan_pulse` table.** Migration Q5: the singleton `scan_pulse` row is superseded by the `site_snapshot` row introduced in PR 1. The drop happens AFTER PR 3 ships — PR 3 switches `/api/scan/pulse` to read from `site_snapshot`. Once no reader remains, run `DROP TABLE public.scan_pulse;` via the Supabase SQL editor.

- **Fix `scans.items` ingest.** The `scans.items` JSONB column has been empty in production for months; the real scan content lives in `scans.raw_markdown`, which the homepage parses at render time via `src/lib/scan-parser.ts`'s filesystem path. The snapshot writer at `scripts/write-site-snapshot.ts` reads `raw_markdown` and parses it via shared helpers in `src/lib/scan-parser-core.ts`, matching live-site behaviour. Populating `scans.items` during ingest would let the writer (and the Supabase-render path in scan-parser.ts) read a structured column instead of re-parsing markdown on every call. Non-trivial — the ingest script at `src/app/api/scans/ingest/route.ts` and the OpenClaw pipeline both need to know the exact `ScanItem` shape. Deferred until after the migration is stable.

- **Remove orphan root-level publish/push scripts.** Migration Q7 confirmed the following are unreferenced by any CI, cron, or `package.json` script: `publish-article.js`, `publish-infowar.js`, `publish-iw-article.js`, `publish-nato-flip.js`, `push-article.js`, `push-article-temp.js`, `push-blog-article.js`, `push-info-warfare.js`, `check-tables.js`, `test-supabase-connection.js`, `tmp_insert_pgi_signature_2026_04_08.js`, `tmp_pgi_signature_analysis.js`. These are ad-hoc ops tools. Delete during Phase 3 cleanup (after the Cloudflare cutover is stable), or move to a `scripts/ops/` subdirectory if any are still occasionally useful.
