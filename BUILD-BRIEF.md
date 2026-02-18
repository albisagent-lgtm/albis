# Albis MVP Build Brief

## Quick Context
You are building the Albis web app — a global news intelligence platform. Read this entire brief before writing any code.

## Decisions Made
- **Stack:** Next.js + Tailwind CSS + Supabase (PostgreSQL + Auth)
- **Local first:** No domain yet. Build to run on localhost.
- **Stripe:** DEFER — create placeholder pricing page but don't wire up Stripe yet
- **Ask Albis:** DEFER — create placeholder page but don't build the chat feature yet
- **Data pipeline:** Sync script that runs after each scan to push JSON into Supabase

## What Already Exists
The scan engine runs 3x daily producing structured JSON + markdown at:
/Users/treelight/.openclaw/workspace/memory/scans/YYYY-MM-DD.md

Each file has human-readable summaries AND structured JSON blocks with tagged items (region, category, patterns, significance, headlines).

## Build Sequence (STRICT ORDER)
1. **Phase 1A — Infrastructure:** Next.js project, Supabase schema, data pipeline sync script, auth setup
2. **Phase 1B — Homepage:** Public page showing today's scan (Pattern of the Day, mood, categories, Framing Watch flags)
3. **Phase 1C — Accounts & Personalisation:** Sign-up, onboarding (pick topics + regions), personalised briefing, free tier limits
4. **Phase 1D — Premium Features:** Framing Watch page, Deep Dive (Sonnet analysis with caching), Pattern History archive. Stripe + Ask Albis = placeholder only.
5. **Phase 1E — Admin Dashboard:** Founder-only page with user stats, API costs, usage metrics
6. **Phase 1F — Polish:** Landing page, SEO, performance, cross-browser testing

## Design Principles
- Clean, calm, spacious — generous whitespace
- Dark/light mode (default to system preference)
- Typography-first — clean sans-serif
- Mobile-first responsive
- Fast — under 2 second page load
- Anti-doomscroll — no infinite scroll, no attention traps
- No dark patterns ever

## Tier Structure (MVP)
- **Free:** 2 topics, 1 region, surface summaries, Pattern of the Day
- **Premium ($9/mo):** Unlimited topics/regions, Framing Watch, Deep Dives, Pattern History

## Key Pages
- / (homepage — public, shows today's scan)
- /briefing (personalised, logged-in users)
- /framing-watch (premium only)
- /deep-dive/[id] (premium only, cached Sonnet analysis)
- /history (premium only, past scans archive)
- /ask (premium only — PLACEHOLDER for now)
- /settings (account + preferences)
- /pricing (tier comparison — PLACEHOLDER checkout)
- /admin (founder-only dashboard)

## Database Schema (Minimum)
- users, user_preferences, scans, scan_items, framing_watch, deep_dives, conversations

## Cost Controls (Build from Day 1)
- Free tier = cached data only, never trigger AI calls
- Deep Dives cached — one Sonnet call per story, serve cached to all users
- API cost logging on every AI call
- Admin dashboard shows spend breakdown

## Start with Phase 1A. Get the Next.js project running, Supabase schema designed, and a working sync script that can parse the scan markdown files and push structured data into the database.

When completely finished with Phase 1A, run: openclaw system event --text "Done: Phase 1A complete — Next.js project, Supabase schema, data pipeline sync script, auth setup" --mode now
