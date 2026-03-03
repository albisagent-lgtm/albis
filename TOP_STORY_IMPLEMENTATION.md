# Top Story Hero Implementation

**Deployed:** March 2, 2026  
**URL:** https://www.albis.news

## Overview

Replaced the manual "BREAKING NEWS" hero with an always-on "TOP STORY" hero that auto-updates from scan data. The hero now intelligently switches between breaking news (when urgent) and top story (always fresh).

## Changes Made

### 1. New API Endpoint: `/api/top-story`

**File:** `src/app/api/top-story/route.ts`

- **GET endpoint** that returns the highest-significance story from the most recent scan
- Queries Supabase `scans` table, ordered by scan_date and scan_time (descending)
- Finds the item with the highest significance score (high > medium > low)
- Returns: headline, summary, significance, category, regions, tags, scan_date, scan_time, url
- Links to `/lens` for full coverage (since there's not always a direct article)
- Cached for 5 minutes with stale-while-revalidate

### 2. Updated Hero Component: `crisis-hero.tsx`

**File:** `src/app/components/crisis-hero.tsx`

- Added `mode` prop: `"breaking"` or `"top-story"`
- **Breaking mode** (red, pulsing dot):
  - Dark background (#0f0f0f)
  - Red accent color
  - Animated pulsing red dot
  - "BREAKING NEWS" label
  - "Get breaking news alerts" CTA
- **Top story mode** (neutral, clean):
  - Light background (#f8f7f4) with dark mode support
  - Gold accent color (#c8922a)
  - "TOP STORY" label (no pulsing)
  - "Get the daily briefing" CTA
- Both modes show: headline, "Read full coverage →" link, email signup

### 3. Updated Homepage Logic: `page.tsx`

**File:** `src/app/page.tsx`

- Added `getTopStory()` function that queries Supabase for the most recent scan's top story
- Updated `getBreakingNews()` to only return items less than 6 hours old (via `created_at >= 6 hours ago`)
- Homepage now fetches both breaking news and top story
- **Priority logic:**
  - If breaking news exists AND is less than 6 hours old → show with "BREAKING" mode
  - Otherwise → show top story with "TOP STORY" mode
  - Fallback to default hero if neither exists (unlikely)

### 4. Updated Top Banner: `breaking-news-banner.tsx`

**File:** `src/app/components/breaking-news-banner.tsx`

- Fetches both `/api/breaking` and `/api/top-story`
- Shows breaking news with red background + pulsing dot if active and < 6 hours old
- Otherwise shows top story with blue background (#1a3a5c) + gold label
- Updates every 60 seconds
- User can dismiss

## Behavior

### Homepage Hero
- **Always shows something** (unless no scans exist in Supabase)
- Auto-updates 3x daily when scans run (no manual intervention needed)
- Breaking news takes priority for 6 hours, then auto-falls back to top story
- Professional, clean design — no emojis, Economist-meets-Apple aesthetic

### Top Banner
- Same logic as hero
- Persistent across site navigation
- User-dismissible
- Auto-refreshes every minute

## Database Schema

### Breaking News Table (existing)
- `id`, `headline`, `url`, `active`, `created_at`, `expires_at`
- Used only for genuine breaking events
- Now time-limited: only shows if `created_at < 6 hours ago`

### Scans Table (existing)
- `scan_date`, `scan_time`, `items` (JSONB array)
- Each item has: `headline`, `significance`, `category`, `regions`, `tags`, `connection`
- Populated by 3 daily scan crons (morning, afternoon, evening)

## Auto-Update Schedule

The scans table is populated by existing cron jobs:
1. **Morning scan** (~6am NZST)
2. **Afternoon scan** (~2pm NZST)
3. **Evening scan** (~10pm NZST)

The homepage reads from Supabase on every page load, so it's always fresh. No new crons needed.

## Deployment

```bash
cd /Users/treelight/.openclaw/workspace/albis-app
npx vercel --prod --token=$(grep VERCEL_TOKEN /Users/treelight/.openclaw/workspace/.env.credentials | cut -d= -f2)
```

**Production URL:** https://www.albis.news

## Testing

To verify:
1. Visit https://www.albis.news — should see "TOP STORY" hero with latest scan's top item
2. Check top banner — should show same or a different top story
3. Test breaking news override: Add a breaking news item to Supabase → should show "BREAKING" instead
4. Wait 6 hours → should auto-revert to top story

## Notes

- Breaking news table is still available for genuine urgent events
- Breaking news now has a 6-hour TTL (after that, system falls back to top story)
- Top story is **always** the highest-significance item from the most recent scan
- Design is clean, professional, no emojis anywhere
- Dark mode fully supported
