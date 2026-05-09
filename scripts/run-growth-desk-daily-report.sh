#!/usr/bin/env bash
set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
APP_DIR="/Users/treelight/.openclaw/workspace/albis-app"
LOG_DIR="$APP_DIR/logs/growth-desk"
mkdir -p "$LOG_DIR"
NZ_DATE=$(TZ=Pacific/Auckland date +%F)
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
cd "$APP_DIR" || exit 1
npm run growth:report -- --date "$NZ_DATE" --email-ignatius >> "$LOG_DIR/daily-report-$STAMP.log" 2>&1
