# Company scan cron — activation guide

Built in Package 6. Both options below exist in the codebase; **neither
is activated yet**. Pick one at activation time.

The full company-side cycle is three steps that must run in order:

1. `buildUnionWatchGraph` — refresh `retrieval_clusters` + `scan_targets`
   from the latest aggregated company demand.
2. `runCompanyScan` — Brave Search retrieval per scan_target → parsed
   `signals` rows.
3. `runCompanySignalPipeline` — score signals against each onboarded
   profile, write `company_signal_matches`, generate briefings, persist
   coverage summaries.

Cycle wall time at v1 (60 scan_targets, 3 onboarded profiles): ~10–20s.
Brave + Supabase round-trips dominate.

Schedule: 2x daily for v1 cost control, fired at fixed UTC hours that
align with US Eastern morning and evening business cycles. Year-round
drift between EDT and EST is one hour; this is acceptable for v1.

| UTC | EDT (summer) | EST (winter) | run_window |
|-----|--------------|--------------|------------|
| 11  | 07:00        | 06:00        | `07-00`    |
| 23  | 19:00        | 18:00        | `19-00`    |

## Option A — Cloudflare scheduled trigger (HTTP fan-in)

The HTTP entry point is already deployed at:

```
GET/POST https://www.albis.news/api/cron/company-scan
Authorization: Bearer <COMPANY_SCAN_CRON_KEY>
```

`run_window` is auto-derived from the current UTC hour. Optional
overrides: `?window=07-00|19-00`, `?date=YYYY-MM-DD`.

To activate via Cloudflare's native cron triggers, you need a thin
**companion Worker** that responds to `scheduled` events and fetches
the OpenNext-deployed endpoint. OpenNext's worker entry serves Next.js
HTTP traffic only — it does not handle scheduled events directly.

### Companion Worker (sketch)

```js
// cron-worker/src/index.js
export default {
  async scheduled(event, env, ctx) {
    const url = "https://www.albis.news/api/cron/company-scan";
    ctx.waitUntil(
      fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.COMPANY_SCAN_CRON_KEY}` },
      })
    );
  },
};
```

```jsonc
// cron-worker/wrangler.jsonc
{
  "name": "albis-cron",
  "main": "src/index.js",
  "compatibility_date": "2026-04-16",
  "triggers": {
    "crons": ["0 11 * * *", "0 23 * * *"]
  }
}
```

`COMPANY_SCAN_CRON_KEY` set via `wrangler secret put` against the
companion worker. Same key set on the main app's environment so the
route handler can verify it.

### Activation steps

1. Generate a random secret and set it on both the main app and the
   companion worker:
   ```sh
   # main app
   wrangler secret put COMPANY_SCAN_CRON_KEY
   # companion worker
   cd cron-worker && wrangler secret put COMPANY_SCAN_CRON_KEY
   ```
2. Deploy the companion worker:
   ```sh
   cd cron-worker && wrangler deploy
   ```
3. Optionally uncomment the `triggers` block in the main repo's
   `wrangler.jsonc` if you ever want the main worker to also handle
   scheduled events (no current benefit; documented for completeness).

### Pros

- All scheduling lives in Cloudflare. Survives openclaw being offline.
- Logs and execution stats are in the Cloudflare dashboard.
- No machine-local cron to maintain.

### Cons

- Adds a second worker to deploy and monitor.
- CF Workers wall-time limits apply (paid plans go to ~15 min, more
  than enough for the cycle, but watch as scan_targets grows).
- Brave key must live as a CF secret (already in Dashboard for the
  main app — the companion worker only needs the cron key).

## Option B — openclaw-side cron (shell script)

The shell script `scripts/run-company-scan-cycle.sh` runs all three
steps in the local shell. Logs to `logs/company-scan-cycle/<UTC>.log`.

### Activation steps

1. SSH to the openclaw machine.
2. Confirm the repo is at `/Users/treelight/.openclaw/workspace/albis-app`
   (or wherever it lives) and the `.env.local` has the four required
   keys: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `BRAVE_API_KEY`, `RESEND_API_KEY`.
3. Add two crontab entries (`crontab -e`):
   ```
   0 11 * * * cd /Users/treelight/.openclaw/workspace/albis-app && bash scripts/run-company-scan-cycle.sh
   0 23 * * * cd /Users/treelight/.openclaw/workspace/albis-app && bash scripts/run-company-scan-cycle.sh
   ```
   The script also `cd`s to its repo root, so the `cd` is belt-and-braces.
4. Tail logs to confirm:
   ```sh
   tail -f /Users/treelight/.openclaw/workspace/albis-app/logs/company-scan-cycle/*.log
   ```

### Pros

- Zero new infrastructure. Uses the existing openclaw cron we already
  rely on for the public scan pipeline.
- Easy to debug — full stack traces in shell logs.
- No Cloudflare deploy step to land changes; just push the script.

### Cons

- openclaw machine offline = scans skipped. No retry.
- Logs live on a single machine.

## Recommended: Option B for v1

Start with **Option B** only after the Package 8/v2 activation checklist is approved — same cron infrastructure as the public scan,
trivial to activate, easy to back out. Migrate to Option A after the
new pipeline has run reliably for a couple of weeks.

Legacy note: the old Phase 4 company cron prompts and public-scan-pool `what_changed` / `what_to_watch` pipeline are retired. Do not import or run them.

## Required env vars

Both paths read these:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BRAVE_API_KEY`
- `RESEND_API_KEY` (only for the Package 8/v2 delivery path once explicitly activated; not needed for dry-runs)

Option A additionally requires:

- `COMPANY_SCAN_CRON_KEY` (HTTP bearer for the cron route)

## Manual smoke

Both paths can be tested ad-hoc:

```sh
# Option A — local fetch (replace HOST + KEY)
curl -X POST 'https://www.albis.news/api/cron/company-scan?window=07-00' \
  -H "Authorization: Bearer $COMPANY_SCAN_CRON_KEY"

# Option B — local shell
bash scripts/run-company-scan-cycle.sh
```

Both should land:
- a `company_scan_runs` row with `status='completed'` and non-zero
  `signals_extracted`
- new `signals` rows for the run
- new `company_signal_matches` rows for each onboarded profile
- one `company_briefings` row per onboarded profile for today
- one `company_coverage_summaries` row per onboarded profile
