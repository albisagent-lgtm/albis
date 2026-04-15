# Albis — Current State

**Last updated:** 2026-04-15 (tier enforcement confirmed working; login redirect fixed)
**Owner:** Harry Wenham
**Purpose:** Snapshot of build state. Overwritten each session, never appended.

---

## What's Built

### Phase 1 — Auth & Accounts ✅
- Email+password signup/login/logout, password reset, email verification
- Profiles table with `role`, `subscription_tier`, `subscription_status`, `stripe_customer_id`, `last_login_at`
- Nav auth state (dropdown with Dashboard + Account + Sign out)
- Auth callback routes signup verification to `/onboarding/company` or `/dashboard` based on profile state

### Phase 2 — Company Profile & Onboarding ✅
- `/onboarding/company` — 6-step wizard (Basics, Geography, Tracking, Risks, Delivery, Confirm)
- `/dashboard/profile` — section-based editor with independent saves
- `company_profiles` table with RLS, sector/regions/themes/watchlist/risk fields
- 215-country list, 11-region taxonomy, 16 sectors, 12 risk types, sector-suggested themes

### Phase 3 — Relevance Scoring ✅
- `src/lib/relevance-engine.ts` — deterministic 8-dimension scoring (no LLM)
- `src/lib/scan-loader.ts` — shared loader with JSONB + scan_items fallback
- API: `POST /api/company-briefings/score`, `/score-all`, `/submit`
- `company_story_scores` and `company_briefings` tables

### Phase 4 — Cron Jobs & Email Delivery ✅
- `POST /api/company-briefings/deliver` — Resend batch send, timezone-aware delivery time check
- `src/lib/email-templates/company-briefing.ts` — branded HTML template
- `/api/pipeline/update` and `/api/pipeline/status` — pipeline_runs tracking
- `pipeline_runs` table with timing + failure counts per phase

### Phase 5 — Dashboard & Briefing Archive ✅
- Dashboard layout with tab nav: Today, Archive, Company Profile, Subscription, Account
- `/dashboard` home with stats, top themes, today's briefing or pending state
- `/dashboard/briefing/today`, `/dashboard/briefing/[date]`, `/dashboard/briefings` (archive list)
- `BriefingRenderer` component shared across all briefing views

### Phase 6 — Subscription & Billing ✅
- Tier definitions: Free, Pro ($49), Team ($99), Company Intelligence ($199), Enterprise (contact)
- Tier enforcement helpers (not yet wired into profile editor)
- `/pricing` public page with monthly/annual toggle
- `/checkout/[tier]` Stripe Checkout redirect
- `/dashboard/subscription` — current plan, usage bars, upgrade options, Stripe Portal
- "For Business" link in main site nav

---

## What's Broken / At Risk

### Critical
- **Stripe price IDs are placeholders** — no real purchase possible until swapped in Stripe Dashboard and `src/lib/stripe.ts` / `src/app/checkout/[tier]/checkout-client.tsx` are updated
- **OpenClaw pipeline not yet running end-to-end** — the full score→generate→submit→deliver loop has never been executed with real data. Test prompt documented.

### Fixed this session (2026-04-15)
- **`scripts/push-scan-to-supabase.js` section-clobbering bug.** Fixed. Proper upsert via supabase-js client, sections deduped by scan_time, full markdown stored. Needs re-running on OpenClaw's machine to backfill 2026-03-20 through 2026-04-15.
- **Tier enforcement wired into product and confirmed working.** Onboarding wizard + dashboard profile editor both use `getOnboardingTier()` (Pro limits for unsubscribed, actual tier otherwise). Dashboard home shows "Subscribe to activate" banner when not active/in-grace. `/api/company-briefings/score` and `/score-all` gate on `shouldGenerateBriefing(ownerProfile)` — inactive subscriptions are skipped (returned in `skipped[]` array).
- **Free-tier policy resolved.** Option B: free users can complete onboarding in preview mode, profile is saved, briefings never generate. Tier definitions unchanged.
- **Login redirect fixed.** `login-client.tsx` previously routed to `/archive` or `/` based on localStorage `albis-preferences`. Now queries `company_profiles.onboarding_completed` and routes to `/dashboard` if present, `/onboarding/company` if not. The `?redirect=` query param still takes precedence.

### Quality bugs (outstanding)
- **`/dashboard/briefing/today` shows most recent, not today** — if today's briefing doesn't exist it silently shows yesterday's.
- **Some 2026-04-12 scans have prose-only markdown** (no ```json blocks). Push script can't save them as items. Scan prompt needs verification that it's emitting JSON blocks consistently.

---

## What's In Progress
_Nothing actively being built. Session ended after push script fix + doc update._

---

## Key Files

### Backend / data
- `src/lib/relevance-engine.ts` — 8-dim scoring
- `src/lib/scan-loader.ts` — JSONB + scan_items fallback loader
- `src/lib/subscription-tiers.ts` — tier definitions with limits
- `src/lib/tier-enforcement.ts` — limit checking helpers (not wired in)
- `src/lib/stripe.ts` — PRICE_TO_TIER + TIER_TO_PRICE (placeholder IDs)
- `scripts/push-scan-to-supabase.js` — **fixed 2026-04-15** (section dedupe + proper upsert)

### Migrations (run via Supabase dashboard)
- `20260411_add_profile_membership_columns.sql`
- `20260411_create_company_profiles.sql`
- `20260411_create_company_briefings.sql`
- `20260412_create_pipeline_runs.sql`

### API routes
- `/api/company-briefings/score`, `/score-all`, `/submit`, `/deliver`
- `/api/pipeline/update`, `/status`
- `/api/scans/ingest` (still available, but push script now uses direct supabase client)
- `/api/stripe/checkout`, `/portal`, `/webhook`

### Reference docs in repo
- `MEMBERSHIP-BUILD-SPEC.md` — full 7-phase spec
- `ALBIS-PRICING-RESEARCH.md` — competitor analysis, recommends $199/$499/$1,499
- `ONBOARDING-REDESIGN-RESEARCH.md` — dropdown redesign plan + scan tag mapping

---

## Blockers Before Launch

1. **Run fixed `push-scan-to-supabase.js` on OpenClaw's machine** across 2026-03-20..present to backfill lost scan items
2. Swap Stripe placeholder price IDs for real ones
3. Run OpenClaw pipeline end-to-end once to prove full score→generate→submit→deliver works
4. Verify scan generator is consistently producing ```json blocks (not just prose like 2026-04-12)

---

## Environment
- **Local:** `npm run dev` on localhost:3000
- **Supabase:** `https://wguydvzpxwsgrhvojpnk.supabase.co`
- **Auth key for cron/ingest endpoints:** `SCAN_INGEST_KEY` in `.env.local`
- **LLM generation:** OpenClaw on a separate machine (ChatGPT Pro), no direct Anthropic/OpenAI keys in this repo
- **Email:** Resend (`RESEND_API_KEY` configured)
- **Payments:** Stripe (keys configured, products/prices not yet created for new tiers)

---

## Open Questions
- Is current $49/$99/$199 pricing staying, or moving to $199/$499/$1,499 per research doc?
- When will OpenClaw cron be scheduled — daily at what NZ time?
- Path A / B / hybrid for onboarding redesign (see ONBOARDING-REDESIGN-RESEARCH.md)?
