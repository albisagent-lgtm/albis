#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="ai.albis.intelligence-wiki"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="$APP_ROOT/logs/albis-intelligence"
NODE_BIN="$(command -v node || true)"
NPM_BIN="$(command -v npm || true)"

if [ -z "$NPM_BIN" ]; then
  echo "npm not found on PATH" >&2
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NPM_BIN</string>
    <string>run</string>
    <string>intelligence:wiki:ingest-latest</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$APP_ROOT</string>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>7</integer><key>Minute</key><integer>25</integer></dict>
    <dict><key>Hour</key><integer>13</integer><key>Minute</key><integer>25</integer></dict>
    <dict><key>Hour</key><integer>19</integer><key>Minute</key><integer>25</integer></dict>
  </array>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/launchd.err.log</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
PLIST

launchctl bootout "gui/$(id -u)" "$PLIST" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl enable "gui/$(id -u)/$LABEL"

echo "Installed $LABEL"
echo "Plist: $PLIST"
echo "Logs: $LOG_DIR"
launchctl print "gui/$(id -u)/$LABEL" | sed -n '1,80p'
