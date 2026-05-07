#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Company email delivery + trial lifecycle cycle.
#
# Intended to run hourly. The delivery endpoint performs timezone/preferred-hour
# checks internally, so most hours will return waiting/no-op. Trial follow-up
# sends once for expired, non-test trial users and flips them to trial_ended.
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

LOG_DIR="${REPO_ROOT}/logs/company-delivery-cycle"
mkdir -p "${LOG_DIR}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_FILE="${LOG_DIR}/${TIMESTAMP}.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

if [[ -f ".env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

BASE_URL="${ALBIS_BASE_URL:-https://www.albis.news}"
DATE="${COMPANY_DELIVERY_DATE:-$(TZ=Pacific/Auckland date +%F)}"

if [[ -z "${SCAN_INGEST_KEY:-}" ]]; then
  echo "❌ SCAN_INGEST_KEY is required"
  exit 1
fi

echo "=== company delivery cycle ${TIMESTAMP} (UTC) ==="
echo "base_url: ${BASE_URL}"
echo "briefing_date: ${DATE}"
echo "log: ${LOG_FILE}"

echo
echo "[1/2] deliver eligible company briefings"
curl --fail --silent --show-error \
  -X POST "${BASE_URL%/}/api/company-briefings/deliver" \
  -H "Authorization: Bearer ${SCAN_INGEST_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"briefing_date\":\"${DATE}\"}"
echo

echo
echo "[2/2] send expired-trial followups"
curl --fail --silent --show-error \
  -X POST "${BASE_URL%/}/api/trials/send-ended-followups" \
  -H "Authorization: Bearer ${SCAN_INGEST_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'
echo

echo
echo "=== delivery cycle complete ==="
