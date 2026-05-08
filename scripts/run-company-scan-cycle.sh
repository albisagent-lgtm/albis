#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Full company scan cycle — openclaw cron path (Package 6 Option B).
#
# Runs the three steps in order:
#   1. build-watch-graph.ts        → refresh retrieval_clusters + scan_targets
#   2. run-company-scan.ts         → Brave retrieval → signals
#   3. run-company-signal-pipeline → score + write briefings + coverage
#
# Logs each run to logs/company-scan-cycle/<UTC-timestamp>.log. Exit
# status reflects the worst step (any failure → non-zero).
#
# Designed to be called from cron on the openclaw machine. NOT activated
# anywhere yet — see docs/company-scan-cron-setup.md to wire up.
#
# Cron entries (3x daily at US Eastern times that stay sensible
# year-round; UTC fixed):
#   0 11 * * * /path/to/repo/scripts/run-company-scan-cycle.sh   # 07:00 EDT
#   0 17 * * * /path/to/repo/scripts/run-company-scan-cycle.sh   # 13:00 EDT
#   0 23 * * * /path/to/repo/scripts/run-company-scan-cycle.sh   # 19:00 EDT
# ---------------------------------------------------------------------------
set -euo pipefail

# Always operate from the repo root (the directory above this script).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

LOG_DIR="${REPO_ROOT}/logs/company-scan-cycle"
mkdir -p "${LOG_DIR}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_FILE="${LOG_DIR}/${TIMESTAMP}.log"

exec > >(tee -a "${LOG_FILE}") 2>&1

SCAN_DATE="${COMPANY_SCAN_DATE:-$(date -u +%F)}"

# Paid Company Daily Scan reliability defaults. Search spend should be
# controlled by dedupe/cache and outreach discipline, not by aborting customer
# daily briefings mid-run. Non-safety QA issues should be logged/escalated, but
# should not leave active companies without a daily email.
export COMPANY_RETRIEVAL_LIVE_SEARCH_BUDGET_PER_RUN="${COMPANY_RETRIEVAL_LIVE_SEARCH_BUDGET_PER_RUN:-260}"
export COMPANY_DAILY_SEND_GUARANTEE="${COMPANY_DAILY_SEND_GUARANTEE:-1}"

if [[ -n "${COMPANY_SCAN_WINDOW:-}" ]]; then
  WINDOW_ARG="--window=${COMPANY_SCAN_WINDOW}"
else
  WINDOW_ARG=""
fi

echo "=== company scan cycle ${TIMESTAMP} (UTC) ==="
echo "repo: ${REPO_ROOT}"
echo "log:  ${LOG_FILE}"
echo "scan_date: ${SCAN_DATE}"

# Pick npx vs explicit binary — fall back gracefully.
NPX="${NPX:-npx}"

echo
echo "[1/3] build-watch-graph"
${NPX} tsx scripts/build-watch-graph.ts

echo
echo "[2/3] run-company-scan"
${NPX} tsx scripts/run-company-scan.ts --date="${SCAN_DATE}" ${WINDOW_ARG}

echo
echo "[3/3] run-company-signal-pipeline"
COMPANY_BRIEFINGS_WRITE_ENABLED="${COMPANY_BRIEFINGS_WRITE_ENABLED:-1}" \
  ${NPX} tsx scripts/run-company-signal-pipeline.ts "${SCAN_DATE}" \
    --write-briefing-rows \
    --company-specific-retrieval \
    --deep-dive-retrieval

if [[ "${COMPANY_SCAN_DELIVER_AFTER_GENERATE:-0}" == "1" ]]; then
  echo
  echo "[4/4] deliver generated company briefings"
  if [[ -z "${ALBIS_BASE_URL:-}" || -z "${SCAN_INGEST_KEY:-}" ]]; then
    echo "❌ COMPANY_SCAN_DELIVER_AFTER_GENERATE=1 requires ALBIS_BASE_URL and SCAN_INGEST_KEY"
    exit 1
  fi
  curl --fail --silent --show-error \
    -X POST "${ALBIS_BASE_URL%/}/api/company-briefings/deliver" \
    -H "Authorization: Bearer ${SCAN_INGEST_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"briefing_date\":\"${SCAN_DATE}\"}"
  echo
else
  echo
  echo "[4/4] delivery skipped (set COMPANY_SCAN_DELIVER_AFTER_GENERATE=1 to send after QA-approved generation)"
fi

echo
echo "=== cycle complete ==="
