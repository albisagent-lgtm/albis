# Automation Canonical Paths

This file records the current production automation paths for Albis after the April 2026 pipeline repair work.

## Canonical scheduled paths

### 1) Daily briefing email
- Script: `scripts/run-daily-briefing-pipeline.ts`
- Primary owner path: invoked by `scripts/run-post-scan-pipeline.ts` during the **AM** article cycle after DB verification + snapshot refresh
- Standalone cron: `a79cb02a-98ef-4e9a-85e6-f10e37a8deb9` is now backup/manual only and should stay disabled unless explicitly needed for recovery
- Purpose: build/load daily briefing, regenerate stale/missing Phase 5-8 package fields (`content_md`, `top_stories`, `edition_scorecard`), send subscriber emails, write `briefing_deliveries`, update `briefings.delivery_status`
- Notes:
  - supports `--dry-run` without creating/updating `briefings`, `briefing_deliveries`, or delivery status rows
  - supports `--force-deliver`
  - supports `--only-email` for safe single-recipient testing
  - `scripts/run-post-scan-pipeline.ts YYYY-MM-DD am` is now the canonical morning owner flow for public output + subscriber delivery
  - package-field regeneration happens before delivery checks, but does not resend if the briefing date is already marked sent unless `--force-deliver` is used

### 2) Article publication cycles
- Script: `scripts/run-post-scan-pipeline.ts`
- Cron jobs:
  - AM: `04067770-ffc1-4efc-aa9e-7f7b75f7a043` at 07:40 Pacific/Auckland
  - Midday: `3b04f416-054b-4536-a552-70b9f91d3886` at 13:40 Pacific/Auckland
  - PM: `483edec7-fa95-4f5c-976c-c802df8b8a77` at 19:40 Pacific/Auckland
- Purpose: read scan, run DB-truth PGI/GAI scoring (`scripts/score-verified-scan.ts`), build articles, write markdown backup, ingest into `articles`, aggregate daily indexes (`scripts/aggregate-index-dailies.ts`), refresh snapshot, verify publication
- Notes:
  - publication is script-owned, not prompt-owned
  - snapshot refresh is part of the same flow
  - article jobs deliberately run later than scans to reduce scan-file/write races

### 3) Company briefing delivery
- Script: `scripts/run-company-briefing-pipeline.ts`
- Cron job: `736be084-f4f2-4735-9ea2-745788ce654e`
- Purpose: score company relevance, generate company briefing, send company email, update `company_briefings`

### 4) Snapshot writer
- Script: `scripts/write-site-snapshot.ts`
- Purpose: refresh `site_snapshot` after successful article publication

## Disabled legacy public paths

These jobs are intentionally disabled because the canonical public owner path is now `scripts/run-post-scan-pipeline.ts`, which invokes `scripts/score-verified-scan.ts` and `scripts/aggregate-index-dailies.ts` against DB truth.

- `335abea6-2db7-46f6-be0d-c15c69bd13fb` — legacy prompt PGI/GAI scorer after AM scan
- `0c5481e3-d7da-4445-91fb-2c06290a8725` — legacy prompt PGI/GAI scorer after midday scan
- `98471731-8903-4056-ba40-58c24f0d51d2` — legacy prompt PGI/GAI scorer after PM scan
- `d3db388d-07a8-4f1c-a8ed-fbf474fae658` — legacy file-prompt PGI daily aggregation
- `e9093a89-0348-4132-b8d0-cf99f67b5b56` — legacy file-prompt PGI weekly aggregation
- `86ed1119-a9e1-4941-990f-9451ea8aa597` — legacy file-prompt GAI daily aggregation
- `3055ca37-a6aa-42a4-bc2b-29ee5a9eb335` — legacy file-prompt GAI weekly aggregation
- `527a92f4-948e-480c-a72f-8ba5d642ccdd` — Scan File Self-Heal Guard, disabled because it ran before scan completion and could create racey duplicate/partial scan state; delivery mode is also `none` if re-enabled deliberately

Do not delete the underlying scripts in this cleanup pass; keep them available for manual recovery/audit.

## Diagnostic tools worth keeping

### AM article diagnostic
- Script: `scripts/run-am-article-diagnostic.ts`
- Purpose: prove scan-read → item-selection → article-draft generation without ingesting to Supabase
- Output: `/tmp/am-test-articles.json`

## Current principle
- Prefer deterministic script-owned automation for scheduled publishing/delivery.
- Use agent-turn prompts for exploratory/editorial tasks, not as the sole owner of critical scheduled publication.
