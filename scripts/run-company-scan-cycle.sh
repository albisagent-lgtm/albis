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

if [[ -f ".env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

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
export COMPANY_SCAN_DELIVER_AFTER_GENERATE="${COMPANY_SCAN_DELIVER_AFTER_GENERATE:-1}"
export ALBIS_BASE_URL="${ALBIS_BASE_URL:-https://www.albis.news}"

if [[ -n "${COMPANY_SCAN_WINDOW:-}" ]]; then
  WINDOW_ARG="--window=${COMPANY_SCAN_WINDOW}"
else
  # Launchd/cron fires at fixed UTC hours. The scanner itself expects the
  # product window label, so map the scheduled UTC hour explicitly instead of
  # relying on local clock inference that can drift with DST/host timezone.
  case "$(date -u +%H)" in
    # UK/BST customer delivery target: 07:00 Europe/London = 06:00 UTC
    # during summer time. Keep 11/23 UTC for older scheduled runners too.
    06|11) WINDOW_ARG="--window=07-00" ;;
    18|23) WINDOW_ARG="--window=19-00" ;;
    *) WINDOW_ARG="" ;;
  esac
fi

echo "=== company scan cycle ${TIMESTAMP} (UTC) ==="
echo "repo: ${REPO_ROOT}"
echo "log:  ${LOG_FILE}"
echo "scan_date: ${SCAN_DATE}"

# Pick npx vs explicit binary — fall back gracefully.
NPX="${NPX:-npx}"

echo
echo "[0/4] check active company scan demand"
set +e
${NPX} tsx scripts/check-company-scan-demand.ts
DEMAND_RC=$?
set -e
if [[ "${DEMAND_RC}" -eq 78 ]]; then
  echo "✅ No real paid/trialing company profiles need scanning; skipping watch graph, live retrieval, briefing generation, and delivery."
  echo
  echo "=== cycle complete (skipped: no active company scan demand) ==="
  exit 0
fi
if [[ "${DEMAND_RC}" -ne 0 ]]; then
  echo "❌ active company scan demand check failed (rc=${DEMAND_RC})"
  exit "${DEMAND_RC}"
fi

echo
echo "[1/4] build-watch-graph"
${NPX} tsx scripts/build-watch-graph.ts

echo
echo "[2/4] run-company-scan"
${NPX} tsx scripts/run-company-scan.ts --date="${SCAN_DATE}" ${WINDOW_ARG}

echo
echo "[3/4] run-company-signal-pipeline"
COMPANY_BRIEFINGS_WRITE_ENABLED="${COMPANY_BRIEFINGS_WRITE_ENABLED:-1}" \
  ${NPX} tsx scripts/run-company-signal-pipeline.ts "${SCAN_DATE}" \
    --write-briefing-rows \
    --company-specific-retrieval \
    --deep-dive-retrieval

if [[ "${COMPANY_SCAN_DELIVER_AFTER_GENERATE:-1}" == "1" ]]; then
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
