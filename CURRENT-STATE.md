# Albis — Current State

**Last updated:** 2026-04-16 (onboarding redesign shipped)
**Owner:** Harry Wenham
**Purpose:** Snapshot of build state. Overwritten each session, never appended.

---

## What's Built

### Phase 1 — Auth & Accounts ✅
- Email+password signup/login/logout, password reset, email verification
- Profiles table with `role`, `subscription_tier`, `subscription_status`, `stripe_customer_id`, `last_login_at`
- Nav auth state (dropdown with Dashboard + Account + Sign out)
- Auth callback routes signup verification to `/onboarding/company` or `/dashboard`
- Login redirect routes to `/dashboard` or `/onboarding/company` based on company profile

### Phase 2 — Company Profile & Onboarding ✅
- `/onboarding/company` — bundle-first 6-step wizard (2026-04-16 redesign)
- `/dashboard/profile` — section editor using TaxonomyCombobox
- 24 sectors + Other (expanded from 16)
- `company_profiles` table with RLS
- Fast-path: sector → "Use recommended defaults" → Delivery → Complete
- Sector-change confirm prompt (Replace / Keep / Cancel)
- Other/Custom "What's your #1 concern?" prompt feeds custom themes
- BriefingPreview placeholder on delivery + confirm steps (localized timezone)
- Legacy sector ID mapping for existing users

### Phase 3 — Relevance Scoring ✅
- `src/lib/relevance-engine.ts` — deterministic 8-dimension scoring (no LLM)
- `src/lib/scan-loader.ts` — shared loader with JSONB + scan_items fallback
- API: `POST /api/company-briefings/score`, `/score-all`, `/submit`
- Subscription gate: inactive companies skipped, returned in `skipped[]` array

### Phase 4 — Cron Jobs & Email Delivery ✅
- `POST /api/company-briefings/deliver` — Resend batch send, timezone-aware
- Pipeline tracking tables + update/status routes
- Fixed scan push pipeline (2026-04-15): section dedupe + proper upsert

### Phase 5 — Dashboard & Briefing Archive ✅
- Dashboard layout with tab nav: Today, Archive, Company Profile, Subscription, Account
- Subscribe banner on dashboard home when subscription inactive
- `/dashboard/briefing/today`, `/dashboard/briefing/[date]`, `/dashboard/briefings`

### Phase 6 — Subscription & Billing ✅
- Tiers: Free, Pro ($49), Team ($99), Company Intelligence ($199)
- Tier enforcement wired into onboarding + profile editor (Option B — preview mode)
- `/pricing`, `/checkout/[tier]`, `/dashboard/subscription`
- "For Business" link in main site nav

---

## What's Broken / At Risk

### Critical
- **Stripe price IDs are placeholders** — no real purchase possible until swapped in Stripe Dashboard + code
- **OpenClaw pipeline not yet running end-to-end** — the full score→generate→submit→deliver loop has never executed with real data

### Outstanding
- **`/dashboard/briefing/today` shows most recent, not today** — silent fallback to yesterday's briefing
- **Scan prompt produces inconsistent JSON blocks** — some 2026-04-12 files are prose-only, producing 0 items. Generator-side fix needed on OpenClaw's machine.

---

## Deferred / Future (from 2026-04-16 planning)

Logged as post-redesign enhancements, not blockers:

- **Social proof** "Others in your sector track X" — post-MVP, requires aggregate user data
- **Company-name lookup auto-fill** — type "Maersk" or "Boeing" → auto-detect sector/geography/exposures. ~2,000 public companies to map. Pre-launch task.
- **Real-time relevance preview** — live story count as user adjusts themes ("Based on these selections, 12 stories in today's scan would have been relevant"). Post-MVP.
- **Scan prompt expansion for commodity/route/company tags** — OpenClaw task on slow laptop. Unlocks 5 gap sectors (Food/Ag, Manufacturing, Mining, Retail, Construction). Highest-leverage fix.
- **Briefing format redesign** — BriefingPreview placeholder stays in place until briefing format is reviewed and upgraded to premium quality standard.

---

## What's In Progress
_Nothing actively being built._

---

## Key Files

### Taxonomy + forms
- `src/lib/onboarding-taxonomy.ts` — **source of truth**: 24 sectors, catalogs, bundles, legacy mapping
- `src/lib/company-profile.ts` — CompanyProfile type, RISK_PRIORITIES, BRIEFING_DEPTHS, DELIVERY_TIMES (re-exports from taxonomy for backward compat)
- `src/app/components/taxonomy-combobox.tsx` — W3C combobox: Recommended + Additional + Custom
- `src/app/components/briefing-preview.tsx` — placeholder preview card, localized timezone

### Backend / data
- `src/lib/relevance-engine.ts` — 8-dim scoring
- `src/lib/scan-loader.ts` — JSONB + scan_items fallback
- `src/lib/subscription-tiers.ts` — tier definitions
- `src/lib/tier-enforcement.ts` — limit checking + getOnboardingTier (Pro limits for unsubscribed)
- `src/lib/stripe.ts` — PRICE_TO_TIER + TIER_TO_PRICE (placeholder IDs)
- `scripts/push-scan-to-supabase.js` — fixed 2026-04-15

### Migrations
- `20260411_add_profile_membership_columns.sql`
- `20260411_create_company_profiles.sql`
- `20260411_create_company_briefings.sql`
- `20260412_create_pipeline_runs.sql`

### API routes
- `/api/company-briefings/score`, `/score-all`, `/submit`, `/deliver`
- `/api/pipeline/update`, `/status`
- `/api/stripe/checkout`, `/portal`, `/webhook`

### Reference docs
- `MEMBERSHIP-BUILD-SPEC.md` — 7-phase spec
- `ALBIS-PRICING-RESEARCH.md` — competitor analysis
- `ONBOARDING-REDESIGN-RESEARCH.md` — UX research + scan tag mapping
- `SECTOR-TAXONOMY.md` — source of truth for onboarding taxonomy

---

## Blockers Before Launch

1. Run fixed `push-scan-to-supabase.js` on OpenClaw's machine across 2026-03-20..present to backfill items
2. Swap Stripe placeholder price IDs for real ones
3. Run OpenClaw pipeline end-to-end once to prove full score→generate→submit→deliver works
4. Verify scan generator is consistently producing ```json blocks (not just prose)

---

## Environment
- **Local:** `npm run dev` on localhost:3000
- **Supabase:** `https://wguydvzpxwsgrhvojpnk.supabase.co`
- **Auth key for cron/ingest endpoints:** `SCAN_INGEST_KEY` in `.env.local`
- **LLM generation:** OpenClaw on a separate machine (ChatGPT Pro)
- **Email:** Resend (`RESEND_API_KEY` configured)
- **Payments:** Stripe (keys configured, new tier products not yet created)

---

## Open Questions
- Is current $49/$99/$199 pricing staying, or moving to $199/$499/$1,499 per research doc?
- When will OpenClaw cron be scheduled — daily at what NZ time?
