# Automation Canonical Paths

This file records the current production automation paths for Albis after the April 2026 pipeline repair work.

## Canonical scheduled paths

### 1) Daily briefing email
- Script: `scripts/run-daily-briefing-pipeline.ts`
- Cron job: `a79cb02a-98ef-4e9a-85e6-f10e37a8deb9`
- Purpose: build/load daily briefing, send subscriber emails, write `briefing_deliveries`, update `briefings.delivery_status`
- Notes:
  - supports `--dry-run`
  - supports `--force-deliver`
  - supports `--only-email` for safe single-recipient testing

### 2) Article publication cycles
- Script: `scripts/run-post-scan-pipeline.ts`
- Cron jobs:
  - AM: `04067770-ffc1-4efc-aa9e-7f7b75f7a043`
  - Midday: `3b04f416-054b-4536-a552-70b9f91d3886`
  - PM: `483edec7-fa95-4f5c-976c-c802df8b8a77`
- Purpose: read scan, build articles, write markdown backup, ingest into `articles`, refresh snapshot, verify publication
- Notes:
  - publication is script-owned, not prompt-owned
  - snapshot refresh is part of the same flow

### 3) Company briefing delivery
- Script: `scripts/run-company-briefing-pipeline.ts`
- Cron job: `736be084-f4f2-4735-9ea2-745788ce654e`
- Purpose: score company relevance, generate company briefing, send company email, update `company_briefings`

### 4) Snapshot writer
- Script: `scripts/write-site-snapshot.ts`
- Purpose: refresh `site_snapshot` after successful article publication

## Diagnostic tools worth keeping

### AM article diagnostic
- Script: `scripts/run-am-article-diagnostic.ts`
- Purpose: prove scan-read → item-selection → article-draft generation without ingesting to Supabase
- Output: `/tmp/am-test-articles.json`

## Current principle
- Prefer deterministic script-owned automation for scheduled publishing/delivery.
- Use agent-turn prompts for exploratory/editorial tasks, not as the sole owner of critical scheduled publication.
