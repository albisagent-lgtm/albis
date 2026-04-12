# Albis — Decisions Log

Append-only log of architectural, product, and strategic decisions. Newest at top. Each entry: 2-3 lines max (what + why).

---

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
