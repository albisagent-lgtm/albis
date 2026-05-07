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
if [[ -n "${COMPANY_DELIVERY_DATE:-}" ]]; then
  DELIVERY_DATES=("${COMPANY_DELIVERY_DATE}")
else
  # Company generation currently keys briefing_date by UTC scan date, while
  # user-facing delivery thinks in recipient local time. Try both UTC and NZ
  # dates so hourly delivery does not miss rows around the date boundary.
  UTC_DATE="$(date -u +%F)"
  UTC_YESTERDAY="$(date -u -v-1d +%F 2>/dev/null || date -u -d 'yesterday' +%F)"
  NZ_DATE="$(TZ=Pacific/Auckland date +%F)"
  DELIVERY_DATES=("${UTC_YESTERDAY}" "${UTC_DATE}")
  if [[ "${NZ_DATE}" != "${UTC_DATE}" && "${NZ_DATE}" != "${UTC_YESTERDAY}" ]]; then
    DELIVERY_DATES+=("${NZ_DATE}")
  fi
fi

if [[ -z "${SCAN_INGEST_KEY:-}" ]]; then
  echo "❌ SCAN_INGEST_KEY is required"
  exit 1
fi

echo "=== company delivery cycle ${TIMESTAMP} (UTC) ==="
echo "base_url: ${BASE_URL}"
echo "briefing_dates: ${DELIVERY_DATES[*]}"
echo "log: ${LOG_FILE}"

echo
echo "[1/2] deliver eligible company briefings"
for DATE in "${DELIVERY_DATES[@]}"; do
  echo "-- briefing_date=${DATE}"
  curl --fail --silent --show-error \
    -X POST "${BASE_URL%/}/api/company-briefings/deliver" \
    -H "Authorization: Bearer ${SCAN_INGEST_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"briefing_date\":\"${DATE}\"}"
  echo
done

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
