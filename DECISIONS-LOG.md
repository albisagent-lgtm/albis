# Albis — Decisions Log

Append-only log of architectural, product, and strategic decisions. Newest at top. Each entry: 2-3 lines max (what + why).

---

## [2026-04-16] Onboarding redesign shipped — bundle-first, 24 sectors, Taxonomy combobox
Expanded from 16 to 24 sectors (added Aviation, Banking split from Investment, Insurance, Telecom, Healthcare split from Pharma, Real Estate, Hospitality, Defence, NGO). Sector pick auto-applies recommended bundle to themes/watchlist/supply-chain/risks. Every option maps to canonical scan tags via new `onboarding-taxonomy.ts`. Three visual zones in the combobox: Recommended / Additional / Custom. Gap options (no scan tag match) flagged with ⚠ but still selectable.

## [2026-04-16] Sector change after bundle applied uses confirm prompt (Option B)
Changing sector mid-wizard shows modal: Replace (apply new bundle, clobber current selections) / Keep (just update the sector label, keep selections) / Cancel. Rejected silent-replace (destructive) and additive-only (clutter) in favour of explicit user choice. First-time sector pick applies bundle without prompting — only subsequent changes trigger it.

## [2026-04-16] Fast-path three-click onboarding flow added
After picking sector on Step 1, two CTAs appear: "Continue" (full 6-step wizard) and "Use recommended defaults" (jumps to Step 5 Delivery with bundle pre-applied). Target: 30-second onboarding for sector-typical users. Full wizard stays available for customisers.

## [2026-04-16] "Other / Custom" sector asks "What's your #1 concern?"
Softer landing than blank-slate. Free-text input splits on commas into lowercase-hyphenated tokens and adds them as custom themes. No LLM processing — pure tokenisation for MVP.

## [2026-04-16] BriefingPreview card is placeholder quality — format redesign deferred
Preview shown on Steps 5 and 6 of onboarding uses mock content and labelled "Format may evolve". Will be replaced when the briefing output format is reviewed and upgraded to premium quality standard. Present implementation uses browser-detected timezone (Intl.DateTimeFormat) so a London user sees "London time" not NZST.

## [2026-04-16] Deferred post-redesign items logged
Four items deferred until the onboarding redesign has real user feedback: social proof ("others in your sector track X"), company-name lookup auto-fill (2000-company map), real-time relevance preview (live story count), and the scan prompt commodity tag expansion. Tracked in CURRENT-STATE.md under Deferred/Future.

## [2026-04-15] Login redirect now checks company_profiles, not localStorage
`login-client.tsx` previously used the localStorage-backed `getPreferences()` to decide post-login destination and routed paid users to `/archive` or `/` — wrong for the company-intelligence funnel. Now queries `company_profiles.onboarding_completed` and routes to `/dashboard` (if complete) or `/onboarding/company` (if not). The `?redirect=` URL param still wins when present.

## [2026-04-15] Tier enforcement wired in with Option B — free users can complete onboarding in preview mode
Added `getOnboardingTier()` helper returning Pro limits for unsubscribed users and actual tier for subscribed. UI (onboarding wizard + profile editor) uses this so anyone can fill out a profile. Hard paywall lives in `shouldGenerateBriefing(ownerProfile)` which is called in `/score` and `/score-all`, skipping inactive subscriptions. Dashboard home shows a persistent "Subscribe to activate" banner when not active/in-grace. Tier definitions untouched; free tier remains 0/0/0 for the hard paywall.

## [2026-04-15] Fixed scan push pipeline — section-clobbering bug was silently dropping all items
`scripts/push-scan-to-supabase.js` was iterating every `## AM/Midday/PM Xxx` header as a separate upsert with DELETE-then-INSERT, so later scoring-object sections (PGI/GAI) wiped the items array written by earlier data sections. Fix: dedupe section spans by scan_time, use proper `supabase.upsert({onConflict:'scan_date,scan_time'})`, store full markdown not a slice, normalise scan_time to lowercase. Verified against 2026-03-20 markdown: old logic produced 0/0/0 items, new logic produces 38/0/25.

## [2026-04-12] Pricing research concluded — current $49/$99/$199 is 80-95% below serious competitors
Competitor analysis (Meltwater, Dataminr, Stratfor, Politico Pro, Oxford Analytica) places Albis's business intelligence product in the wrong category at $49/mo — that's SMB-SaaS territory. Research recommends $199/$499/$1,499 annual-only, but no code changes made until validated with 5-10 target customers. Reference doc in `ALBIS-PRICING-RESEARCH.md`.

## [2026-04-12] Dashboard link in nav is unconditional, not gated on company profile
Originally the nav dropdown hid the Dashboard link unless a completed company profile existed. Removed the gate — layout handles the redirect to onboarding for users without a profile, so nav stays simple and always shows Dashboard for logged-in users.

## [2026-04-12] Added "For Business" link to main site nav pointing to /pricing
Public site had no discovery path to the membership product. Added a subtle nav item alongside existing section links so casual readers can find the business offering.

## [2026-04-12] Auth callback routes signup verification to /onboarding/company, not /archive
After email verification (`type=signup` or `type=email`), callback checks for a completed company profile and redirects to `/dashboard` if present, otherwise `/onboarding/company`. Gets new users to the funnel immediately instead of dropping them on the public archive.

## [2026-04-12] Removed /pricing → / redirect from next.config.ts
A placeholder redirect predated the pricing page and was silently intercepting navigation. Deleted once the real pricing page existed.

## [2026-04-12] Scan item loading falls back from scans.items JSONB to scan_items table
Discovered recent scan rows have empty `items` JSONB (broken push script). Created `src/lib/scan-loader.ts` to try JSONB first, fall back to normalised `scan_items` table, with category/significance normalisation. Matches how `scan-parser.ts` already handles both stores.

## [2026-04-12] OpenClaw handles all LLM generation; no direct API keys in this repo
LLM calls route through OpenClaw running on a separate machine with ChatGPT Pro. Albis provides `/score-all` (fetches scored stories + profile context) and `/submit` (receives generated briefing JSON) endpoints. Keeps costs predictable and removes per-call API key management.

## [2026-04-12] Pipeline structured as score-all → OpenClaw-generates → submit → deliver
Decomposes the daily cron into four idempotent steps with clear boundaries. Albis owns deterministic scoring and delivery; OpenClaw owns the variable LLM step. Each endpoint is independently testable.

## [2026-04-12] Relevance scoring is deterministic, 8-dimensional, with fixed weights
Scoring uses geography (0.20) + sector (0.20) + theme (0.15) + entity (0.15) + supply chain (0.10) + risk (0.10) + urgency (0.05) + significance (0.05). Deterministic (no LLM) so scoring is free, fast, and explainable. Weights will be tuned later via feedback data.

## [2026-04-12] Company profiles are one-per-user for MVP; no teams, no multi-stream
Unique constraint on `company_profiles.owner_id`. Keeps the MVP simple and aligns with Pro/Team tier assumptions (1 profile, multiple recipients). Team features and multi-stream deferred to future phases.

## [2026-04-12] Company onboarding lives at /onboarding/company, separate from existing /onboarding
Existing `/onboarding` is the free news topic/region selection (localStorage-backed) for public subscribers. `/onboarding/company` is the paid membership profile flow. Two distinct funnels for two distinct products.

## [2026-04-12] Once company profile exists, redirect from /onboarding/company to /dashboard/profile
Onboarding is a one-time setup flow. Returning users go to the section-based editor, not the wizard. Prevents profile overwrites and matches standard SaaS UX.

## [2026-04-12] Scan prompt updated to emit structured JSON blocks
Scan output format fixed to machine-readable JSON (`headline`, `category`, `regions`, `tags`, `patterns`, `significance`, `connection`) inside fenced code blocks in the daily markdown. Enables downstream ingestion without bespoke NLP and is what `scan-loader.ts` now reads.

## [pre-session] Five-pillar content framework: The Race, The Flow, The Signal, The Human Cost, The Lens
Public site content is organised under five editorial pillars (AI/tech, supply chains, information warfare, humanitarian, analysis). Pillars drive section navigation and sector-theme suggestions in company onboarding.

## [pre-session] /register is the auth signup route; /signup is newsletter email capture
Two routes serving two different purposes — account creation vs free newsletter subscription. Kept separate so the newsletter growth funnel doesn't confuse users trying to create a paid account, and vice versa.
