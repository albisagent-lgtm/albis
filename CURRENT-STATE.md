# Albis — Current State

**Last updated:** 2026-04-12
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
- API: `POST /api/company-briefings/score` (one company), `/score-all` (all active), `/submit` (OpenClaw submits generated briefing)
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
- Stripe webhook + portal routes existing pre-Phase 6
- "For Business" link added to main site nav

---

## What's Broken / At Risk

### Critical
- **Stripe price IDs are placeholders** — no real purchase possible until swapped in Stripe Dashboard and `src/lib/stripe.ts` / `src/app/checkout/[tier]/checkout-client.tsx` are updated
- **OpenClaw pipeline not yet running** — the full score→generate→submit→deliver loop has never run end-to-end. Test prompt documented but not yet executed
- **`scans.items` JSONB column empty since ~2026-03-23** — recent scan rows exist but items not pushed into JSONB. `scan-loader.ts` falls back to `scan_items` table, which itself only has data for one date (2026-03-20). Root cause of push script bug unknown.

### Quality bugs
- **Tier enforcement not wired in** — `canAddTheme/Entity/Recipient` functions exist in `tier-enforcement.ts` but profile editor and onboarding don't call them. A free user can set 15 themes.
- **Free users not gated** — a user who hasn't paid can complete company onboarding. Product story is ambiguous.
- **`/dashboard/briefing/today` shows most recent, not today** — if today's briefing doesn't exist it silently shows yesterday's.

---

## What's In Progress
_Nothing actively being built. Session ended at Phase 6 + reference docs._

---

## Key Files

### Backend / data
- `src/lib/relevance-engine.ts` — 8-dim scoring
- `src/lib/scan-loader.ts` — JSONB + scan_items fallback loader
- `src/lib/subscription-tiers.ts` — tier definitions with limits
- `src/lib/tier-enforcement.ts` — limit checking helpers (not wired in)
- `src/lib/stripe.ts` — PRICE_TO_TIER + TIER_TO_PRICE (placeholder IDs)

### Migrations (run via Supabase dashboard)
- `20260411_add_profile_membership_columns.sql`
- `20260411_create_company_profiles.sql`
- `20260411_create_company_briefings.sql`
- `20260412_create_pipeline_runs.sql`

### API routes
- `/api/company-briefings/score`, `/score-all`, `/submit`, `/deliver`
- `/api/pipeline/update`, `/status`
- `/api/stripe/checkout`, `/portal`, `/webhook`

### Reference docs in repo
- `MEMBERSHIP-BUILD-SPEC.md` — full 7-phase spec
- `ALBIS-PRICING-RESEARCH.md` — competitor analysis, recommends $199/$499/$1,499

---

## Blockers Before Launch

1. Swap Stripe placeholder price IDs for real ones
2. Run OpenClaw pipeline end-to-end once to prove it works
3. Fix scan data push — `scans.items` needs fresh data OR scan_items needs to be current
4. Wire tier enforcement into profile editor + onboarding wizard
5. Decide free-tier policy (gate onboarding behind subscription, or let free users have a dormant profile)

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
- How to handle existing "legacy" Stripe price IDs from pre-Phase 6 subscribers (if any)?
- Free-tier policy: dormant profile vs hard gate?
