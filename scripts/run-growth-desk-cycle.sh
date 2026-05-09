#!/usr/bin/env bash
set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

APP_DIR="/Users/treelight/.openclaw/workspace/albis-app"
LOG_DIR="$APP_DIR/logs/growth-desk"
STATE_DIR="$APP_DIR/logs/growth-desk/state"
mkdir -p "$LOG_DIR" "$STATE_DIR"

NZ_DATE=$(TZ=Pacific/Auckland date +%F)
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
LOG_FILE="$LOG_DIR/cycle-$STAMP.log"
EMAIL_STAMP="$STATE_DIR/emailed-$NZ_DATE"

cd "$APP_DIR" || exit 1

if [ ! -f "$EMAIL_STAMP" ]; then
  echo "[$(date -u +%FT%TZ)] Growth Desk cycle: first run for $NZ_DATE, emailing internal pack" | tee -a "$LOG_FILE"
  if npm run growth:desk -- --date "$NZ_DATE" --email-ignatius --prepare-posts >> "$LOG_FILE" 2>&1; then
    touch "$EMAIL_STAMP"
  else
    echo "[$(date -u +%FT%TZ)] Growth Desk email run failed; will retry next cycle" | tee -a "$LOG_FILE"
    exit 1
  fi
else
  echo "[$(date -u +%FT%TZ)] Growth Desk cycle: refresh only for $NZ_DATE" | tee -a "$LOG_FILE"
  npm run growth:desk -- --date "$NZ_DATE" --dry-run --prepare-posts >> "$LOG_FILE" 2>&1
fi
