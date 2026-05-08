#!/usr/bin/env bash
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
cd /Users/treelight/.openclaw/workspace/albis-app
node scripts/run-outreach-drip.js
