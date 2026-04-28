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

echo "=== company scan cycle ${TIMESTAMP} (UTC) ==="
echo "repo: ${REPO_ROOT}"
echo "log:  ${LOG_FILE}"

# Pick npx vs explicit binary — fall back gracefully.
NPX="${NPX:-npx}"

echo
echo "[1/3] build-watch-graph"
${NPX} tsx scripts/build-watch-graph.ts

echo
echo "[2/3] run-company-scan"
${NPX} tsx scripts/run-company-scan.ts

echo
echo "[3/3] run-company-signal-pipeline"
${NPX} tsx scripts/run-company-signal-pipeline.ts

echo
echo "=== cycle complete ==="
