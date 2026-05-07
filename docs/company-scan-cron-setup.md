# Company scan cron — canonical pipeline activation guide

## Architecture boundary

Company Daily Scan generation is a pipeline/job responsibility, not a Cloudflare
Workers request-path responsibility.

Canonical flow:

1. Pipeline job runs company scan/retrieval.
2. Pipeline builds the evidence packet and deterministic draft.
3. Pipeline runs the gold-standard editorial writer.
4. Pipeline runs QA/safety gates.
5. Pipeline writes the completed row to Supabase (`company_briefings` plus
   evidence/provenance tables).
6. Cloudflare/OpenNext app reads, displays, and optionally gated-delivers the
   completed Supabase briefing.

Cloudflare is the app surface. Supabase is the handoff/source of truth. Heavy
scan/retrieval/editorial generation should stay in the job layer unless Ignatius
explicitly approves an architecture change.

## Canonical path — OpenClaw-side pipeline cron

The shell script `scripts/run-company-scan-cycle.sh` runs the ordered cycle:

1. `scripts/build-watch-graph.ts` — refresh retrieval clusters + scan targets.
2. `scripts/run-company-scan.ts` — Brave retrieval → parsed `signals` rows.
3. `scripts/run-company-signal-pipeline.ts` — company scoring, briefing writing,
   gold-standard editorial writer, QA, and coverage persistence.
4. Optional delivery — only after QA-approved generation and explicit env gates.

Logs are written to:

```text
logs/company-scan-cycle/<UTC-timestamp>.log
```

Recommended schedule for v1 cost control:

| UTC | EDT (summer) | EST (winter) | run_window |
|-----|--------------|--------------|------------|
| 11  | 07:00        | 06:00        | `07-00`    |
| 23  | 19:00        | 18:00        | `19-00`    |

Cron entries, if using traditional cron:

```cron
0 11 * * * cd /Users/treelight/.openclaw/workspace/albis-app && bash scripts/run-company-scan-cycle.sh
0 23 * * * cd /Users/treelight/.openclaw/workspace/albis-app && bash scripts/run-company-scan-cycle.sh
```

Current Mac activation uses a LaunchAgent instead of crontab because local
`crontab` installation was not available from the agent runtime:

```text
~/Library/LaunchAgents/ai.openclaw.albis-company-scan.plist
```

It runs at 11:00 and 23:00 local time with:

```env
COMPANY_BRIEFINGS_WRITE_ENABLED=1
ALBIS_ENABLE_COMPANY_EDITORIAL_WRITER=true
ALBIS_EDITORIAL_MODEL_PROVIDER=openclaw-system
COMPANY_SCAN_DELIVER_AFTER_GENERATE=0
COMPANY_EMAIL_DELIVERY_ENABLED=0
```

That means scheduled generation writes dashboard-ready Supabase rows, while
customer email delivery remains disabled.

## Required env for generation

The pipeline reads `.env.local` by default. Required for generation:

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
BRAVE_API_KEY=...
COMPANY_BRIEFINGS_WRITE_ENABLED=1
ALBIS_ENABLE_COMPANY_EDITORIAL_WRITER=true
```

The gold-standard editorial writer should use the local OpenClaw/system model
path by default — the same model route used by local agent/membership work. Do
not require a separate Cloudflare Workers AI setup for the normal Company Daily
Scan pipeline.

Optional explicit override, only if a future environment deliberately chooses a
separate provider:

```env
ALBIS_EDITORIAL_MODEL_PROVIDER=openclaw-system   # default local/system path
# or an explicitly approved fallback such as openrouter/openai/cloudflare-workers-ai
```

## Required env for optional delivery

Delivery is separate and must remain explicitly gated:

```env
COMPANY_SCAN_DELIVER_AFTER_GENERATE=1
ALBIS_BASE_URL=https://www.albis.news
SCAN_INGEST_KEY=...
COMPANY_EMAIL_DELIVERY_ENABLED=1
COMPANY_EMAIL_DELIVERY_APPROVED_PROFILE_IDS=profile_id_1,profile_id_2
```

Delivery now has two required approval layers:

1. Global gate: `COMPANY_EMAIL_DELIVERY_ENABLED=1`.
2. Per-profile gate: add the company profile id to
   `COMPANY_EMAIL_DELIVERY_APPROVED_PROFILE_IDS`.

Only after full launch approval, `COMPANY_EMAIL_DELIVERY_APPROVE_ALL=1` may be
used to bypass the per-profile allow-list. Do not enable delivery for real
company recipients during validation without explicit approval. Lindell Media
has a real configured recipient, so validation runs must omit delivery unless
Ignatius approves.

## Manual safe Lindell test from pipeline

Use the pipeline path, not the Cloudflare Worker cron route:

```sh
cd /Users/treelight/.openclaw/workspace/albis-app
set -a; source .env.local; set +a
COMPANY_BRIEFINGS_WRITE_ENABLED=1 \
ALBIS_ENABLE_COMPANY_EDITORIAL_WRITER=true \
npx tsx scripts/run-company-signal-pipeline.ts "$(date -u +%F)" \
  --write-briefing-rows \
  --company-specific-retrieval \
  --deep-dive-retrieval \
  --company-profile-id=2fcda41e-dbb9-40be-9c86-4ba4659d2e77
```

This writes/updates the Supabase briefing row but does not deliver email.
Inspect QA/status before any delivery test.

## Cloudflare route status

`/api/cron/company-scan` is now a legacy/emergency compatibility route. It is
fail-closed unless this explicit override is set in the Cloudflare environment:

```env
ALBIS_ALLOW_WORKER_COMPANY_SCAN_GENERATION=1
```

Do not set that for normal operation. Do not create Cloudflare scheduled triggers
for the heavy company scan path by default.

Cloudflare/OpenNext should normally handle:

- dashboard display
- customer app/API reads
- delivery endpoint for already completed, QA-safe Supabase rows
- health/status/admin surfaces

It should not normally handle:

- Brave retrieval
- full scan target processing
- gold-standard editorial generation
- heavy QA/generation loops

## Smoke checks

After a pipeline run, verify:

- `company_scan_runs.status = completed`
- non-zero new `signals` rows for the scan
- new `company_signal_matches` rows
- one `company_briefings` row per active onboarded profile, or a documented hold
- `company_briefings.status` / QA fields show `ready` only if all delivery gates pass
- `delivery_status` remains pending/skipped during validation

Legacy note: old public-scan-pool `what_changed` / `what_to_watch` company
pipeline paths are retired. Do not import or run them.
