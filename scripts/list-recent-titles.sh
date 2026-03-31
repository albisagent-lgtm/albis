#!/bin/bash
# List recent article titles for dedup checking
cd /Users/treelight/.openclaw/workspace/albis-app
grep "^title:" content/blog/*.md 2>/dev/null | sed 's/.*title: *"\(.*\)"/\1/' | tail -50
