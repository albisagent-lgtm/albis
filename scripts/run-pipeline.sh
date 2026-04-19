#!/bin/bash
cd /Users/treelight/.openclaw/workspace/albis-app
export $(grep -v '^#' .env.local | xargs)
npx tsx scripts/run-post-scan-pipeline.ts $(TZ=Pacific/Auckland date +%F) "$1"
