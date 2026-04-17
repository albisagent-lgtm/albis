# Cloudflare Migration Execution Plan — File-by-File

> Source of strategic decisions: `Cloudflare_Migration.md` (Desktop).
> This document translates those decisions into a concrete, file-by-file plan against the current Albis codebase at `/Users/harrywenham/albis` (commit `b4d3b82`, branch `main`).
> Audit status: **complete**. Implementation status: **not started**. Read-only investigation — no code has been modified.

---

## Section A — Findings summary

Albis today is a Next.js 16 App Router app deployed on Vercel. It's closer to Cloudflare-friendly than the migration report feared — there is no `@vercel/*` package, no `vercel.json`, and only two routes use the edge runtime (both `next/og` image generators). The intelligence engine already lives off-host: scan generation, PGI/GAI scoring, and company briefing LLM work run in an external agent system that POSTs precomputed data into thin ingest endpoints (`/api/scans/ingest`, `/api/pgi/ingest`, `/api/gai/ingest`, `/api/company-briefings/submit`). That boundary is clean.

What's actually going to hurt on Cloudflare:

1. **The homepage is render-time-dynamic.** `src/app/page.tsx:214` calls `getTodayScan()` (which hits Supabase *and* conditionally the filesystem via `src/lib/scan-parser.ts`), and `src/app/page.tsx:262-269` does a second Supabase admin read for `briefings`. `revalidate = 300` softens it, but the homepage still runs server logic every 5 minutes per region.
2. **Global client-side polling on every page.** `BreakingNewsBanner` is mounted in the root layout (`src/app/layout.tsx:206`) and polls `/api/breaking` + `/api/top-story` every 60 seconds (`src/app/components/breaking-news-banner.tsx:65`). Multiply by every visitor × every page view × all time = the single largest ongoing runtime cost on the public site.
3. **Heavy "force-dynamic" pages that shouldn't be.** `/archive`, `/archive/[date]`, `/lens`, `/trending`, and every `/indexes/pgi/*` route are `force-dynamic` (14 routes total) — they bypass every form of cache and compose data from Supabase at request time for every visitor. Several of them could be `revalidate = N` or snapshot-driven.
4. **The middleware runs on every request.** `src/middleware.ts:34` calls `supabase.auth.getUser()` on *every* non-static path — including anonymous requests to the homepage, article pages, and RSS feed. That's unnecessary work on the public site and on Cloudflare it's a per-request Supabase round-trip in front of the CDN.
5. **Image optimization is unconfigured for Cloudflare.** `next.config.ts` uses `remotePatterns` but no custom loader; the default Next.js Image Optimization won't exist on Cloudflare Pages and images will 404 or go un-optimized unless `images.unoptimized: true` or a loader is added.
6. **The daily email digest reads `content/blog/` from the filesystem.** `src/app/api/digest/daily/route.ts:212-243` uses `fs.readdirSync` inside a request handler. Filesystem works on Cloudflare Pages at build time, but this endpoint also does bulk email sending over many subscribers in a single request — it's a cron job masquerading as an HTTP route. It belongs off-host.
7. **`scan-pulse.tsx` is dead code.** The component at `src/app/components/scan-pulse.tsx` polls `/api/scan/pulse` every 60s — but grep confirms it is imported nowhere. The migration report spent time worrying about it. It can simply be deleted.

What's already in good shape:

- Three Supabase clients are properly separated (`browser`, `server-with-cookies`, `admin/service-role`) — no secret leaks via `NEXT_PUBLIC_*`.
- The Stripe webhook uses `req.text()` for raw body (`src/app/api/stripe/webhook/route.ts:34`) and does manual HMAC via Node's `crypto` — the signature verification is Cloudflare-compatible.
- `generateStaticParams` is wired up for all 14 category article pages — those are already statically generated from the filesystem blog content.
- Most heavy ingest endpoints are already thin upserts that accept precomputed data.

**Biggest single risk:** `supabase.auth.getUser()` in middleware on every request (`src/middleware.ts:34`) fights the CDN. If you migrate without fixing this, Cloudflare caches nothing on any path that isn't a static asset.

**Biggest single cost driver:** global 60-second polling of `BreakingNewsBanner`.

**The cleanest win:** replace `getTodayScan()` with a read from a `site_snapshot` table written by the scan pipeline — it kills the filesystem branch of `scan-parser.ts`, makes the homepage a single small query, and the same snapshot feeds `/api/scan/pulse`, `/api/top-story`, and `/api/scans/today`.

---

## Section B — Route-by-route classification

**Target mode legend:** `static` = prebuilt at deploy, no per-request work; `ISR` = `revalidate = N` on published snapshot; `dynamic` = remains request-time; `off-host` = endpoint should be removed from the web app and live in OpenClaw/cron.

**Priority legend:** P0 = do before cutover; P1 = do before opening public traffic; P2 = post-cutover cleanup.

### Public pages

| Path | File | Current mode | Target mode | Blockers | Effort | Priority |
|---|---|---|---|---|---|---|
| `/` | `src/app/page.tsx` | ISR (`revalidate=300`) + live Supabase reads | ISR (`revalidate=300`) reading from `site_snapshot` only | `getTodayScan()` filesystem branch; second Supabase `briefings` read | Medium | **P0** |
| `/about` | `src/app/about/page.tsx` | static (implicit) | static | — | Small | P2 |
| `/methodology` | `src/app/methodology/page.tsx` | static (implicit) | static | — | Small | P2 |
| `/editorial` | `src/app/editorial/page.tsx` | static (implicit) | static | — | Small | P2 |
| `/privacy` | `src/app/privacy/page.tsx` | static (implicit) | static | — | Small | P2 |
| `/terms` | `src/app/terms/page.tsx` | static (implicit) | static | — | Small | P2 |
| `/pricing` | `src/app/pricing/page.tsx` | static (client component) | static | — | Small | P2 |
| `/compare` | `src/app/compare/page.tsx` | static (implicit) | static | — | Small | P2 |
| `/compare/[slug]` | `src/app/compare/[slug]/page.tsx` | static (`generateStaticParams`) | static | — | Small | P2 |
| `/search` | `src/app/search/page.tsx` | static shell + client fetch to `/api/search` | static | — | Small | P2 |
| `/quiz` | `src/app/quiz/page.tsx` | static (client component) | static | — | Small | P2 |
| `/unsubscribe` | `src/app/unsubscribe/page.tsx` | static | static | — | Small | P2 |
| `/lens` | `src/app/lens/page.tsx` | **`force-dynamic`** + `getTodayScan()` | ISR `revalidate=300` reading snapshot | same as `/` | Medium | **P0** |
| `/lens/[slug]` | `src/app/lens/[slug]/page.tsx` | static (`generateStaticParams`) | static | — | Small | P1 (re-verify build) |
| `/lens/iran-war-2026` | `src/app/lens/iran-war-2026/page.tsx` | static | static | — | Small | P2 |
| `/archive` | `src/app/archive/page.tsx` | **`force-dynamic`** | ISR `revalidate=3600` | Supabase `briefings` paginated read at request | Medium | **P0** |
| `/archive/[date]` | `src/app/archive/[date]/page.tsx` | **`force-dynamic`** | ISR `revalidate=3600` + `generateStaticParams` over existing dates | Supabase `briefings` + `scans` reads | Medium | **P0** |
| `/trending` | `src/app/trending/page.tsx` | **`force-dynamic`** + `getTodayScan()` | ISR `revalidate=600` | Same scan-parser issue | Small | **P0** |
| `/indexes` | `src/app/indexes/page.tsx` | ISR `revalidate=3600` + 4-way Supabase read | ISR `revalidate=3600` — OK as-is, use snapshot if possible | Runtime composition across `pgi_daily`/`gai_daily`/`pgi_story_scores`/`gai_story_scores` | Medium | P1 |
| `/indexes/pgi` | `src/app/indexes/pgi/page.tsx` | **`force-dynamic`** | ISR `revalidate=3600` | Four separate Supabase reads for page render | Medium | **P0** |
| `/indexes/pgi/data` | `src/app/indexes/pgi/data/page.tsx` | **`force-dynamic`** | ISR `revalidate=3600` | Supabase 7-day window read | Small | P1 |
| `/indexes/pgi/[date]` | `src/app/indexes/pgi/[date]/page.tsx` | **`force-dynamic`** | ISR `revalidate=86400` + `generateStaticParams` over historical dates | Historical data is immutable — should be static | Medium | P1 |
| `/indexes/pgi/trends` | `src/app/indexes/pgi/trends/page.tsx` | **`force-dynamic`** | ISR `revalidate=3600` | 30-day trend read | Small | P1 |
| `/indexes/gai` | `src/app/indexes/gai/page.tsx` | dynamic (implicit) | ISR `revalidate=3600` | — | Small | P1 |
| `/indexes/gai/data` | `src/app/indexes/gai/data/page.tsx` | **`force-dynamic`** | ISR `revalidate=3600` | — | Small | P1 |
| `/world`, `/money`, `/climate`, `/tech`, `/science`, `/life-systems`, `/perspectives`, `/analysis`, `/business`, `/politics`, `/health`, `/technology` | `src/app/{section}/page.tsx` | static (implicit, reads filesystem blog) | static | — | Small | P1 (re-verify build) |
| `/{section}/[slug]` (×14) | various | static (`generateStaticParams`) | static | — | Small | P1 (re-verify build) |
| `/feed.xml` | `src/app/feed.xml/route.ts` | dynamic with `s-maxage=3600` | dynamic with same cache header | — | Small | P2 |
| `/news-sitemap.xml` | `src/app/news-sitemap.xml/route.ts` | dynamic | dynamic with cache header | — | Small | P2 |
| `/sitemap.ts` | `src/app/sitemap.ts` | dynamic | dynamic | — | Small | P2 |
| `/r/[code]` | `src/app/r/[code]/page.tsx` | dynamic (tracking) | dynamic | — | Small | P2 |

### Auth / account / dashboard (stay dynamic)

| Path | File | Current mode | Target mode | Blockers | Effort | Priority |
|---|---|---|---|---|---|---|
| `/login` | `src/app/login/page.tsx` | client-side auth | dynamic | none (client-side) | Small | P1 |
| `/register` | `src/app/register/page.tsx` | client-side auth | dynamic | none (client-side) | Small | P1 |
| `/reset-password` | `src/app/reset-password/page.tsx` | client-side | dynamic | none | Small | P1 |
| `/reset-password/confirm` | `src/app/reset-password/confirm/page.tsx` | client-side | dynamic | none | Small | P1 |
| `/auth/callback` | `src/app/auth/callback/route.ts` | server route, Supabase OTP/code exchange | dynamic | Test on Cloudflare — uses `cookies()` | Medium | **P0** |
| `/account` | `src/app/account/page.tsx` | client-side | dynamic | — | Small | P1 |
| `/account/referrals` | `src/app/account/referrals/page.tsx` | client-side | dynamic | — | Small | P2 |
| `/settings` | `src/app/settings/page.tsx` | client-side | dynamic | — | Small | P2 |
| `/signup` | `src/app/signup/page.tsx` | server component reading subscriber count | ISR `revalidate=600` | One `revalidatePath("/")` in actions.ts | Small | P1 |
| `/checkout/[tier]` | `src/app/checkout/[tier]/page.tsx` | client-side, calls `/api/stripe/checkout` | dynamic | — | Small | P1 |
| `/dashboard` | `src/app/dashboard/page.tsx` | client-side, layout enforces auth | dynamic | Dashboard layout is `"use client"` — uses browser Supabase. Fine. | Small | P1 |
| `/dashboard/briefing/today` | `.../dashboard/briefing/today/page.tsx` | client-side | dynamic | — | Small | P1 |
| `/dashboard/briefing/[date]` | `.../dashboard/briefing/[date]/page.tsx` | client-side | dynamic | — | Small | P1 |
| `/dashboard/briefings` | `.../dashboard/briefings/page.tsx` | server (dashboard layout auth) | dynamic | — | Small | P1 |
| `/dashboard/profile` | `.../dashboard/profile/page.tsx` | client-side | dynamic | — | Small | P1 |
| `/dashboard/subscription` | `.../dashboard/subscription/page.tsx` | client-side, calls `/api/stripe/portal` | dynamic | — | Small | P1 |
| `/onboarding/company` | `.../onboarding/company/page.tsx` | client-side | dynamic | No server-side tier validation on save — pre-existing bug, not a migration blocker | Small (migration) | P1 |
| `/admin` | `src/app/admin/page.tsx` | client-side (localStorage gate) | dynamic | Note: client-only auth is insecure, pre-existing issue | Small | P2 |

### API routes

| Path | File | Current mode | Target mode | Blockers | Effort | Priority |
|---|---|---|---|---|---|---|
| `/api/scans/today` | `src/app/api/scans/today/route.ts` | **`force-dynamic`**, calls `getTodayScan()` | dynamic, reads `site_snapshot` row, `s-maxage=300` | filesystem branch in scan-parser | Small | **P0** |
| `/api/scan/pulse` | `src/app/api/scan/pulse/route.ts` | `force-dynamic`, reads `scan_pulse` table, `s-maxage=30` | dynamic reading `site_snapshot`, `s-maxage=300` | None — already thin | Small | P1 |
| `/api/breaking` | `src/app/api/breaking/route.ts` | dynamic, `s-maxage=30` | dynamic, `s-maxage=120` | Tighten polling; see SDK section | Small | **P0** |
| `/api/top-story` | `src/app/api/top-story/route.ts` | dynamic, `s-maxage=300` | dynamic reading `site_snapshot`, `s-maxage=300` | None — already cached | Small | P1 |
| `/api/subscriber-count` | `src/app/api/subscriber-count/route.ts` | dynamic (no Supabase read) | dynamic with cache header | Currently returns constant — verify intent | Small | P2 |
| `/api/subscribe` | `src/app/api/subscribe/route.ts` | dynamic, in-memory rate limiter via `setInterval` | dynamic, replace timer-based rate limit with a lazy cleanup on each request | `setInterval` at module scope (line 11) won't persist on Workers | Small | **P0** |
| `/api/unsubscribe` | `src/app/api/unsubscribe/route.ts` | dynamic | dynamic | — | Small | P1 |
| `/api/search` | `src/app/api/search/route.ts` | `force-dynamic` | dynamic with short cache | — | Small | P1 |
| `/api/referral`, `/api/referrals` | — | dynamic | dynamic | — | Small | P2 |
| `/api/quiz/submit` | — | dynamic | dynamic | — | Small | P2 |
| `/api/pexels` | `src/app/api/pexels/route.ts` | dynamic, `s-maxage=3600` | dynamic | — | Small | P2 |
| `/api/embed/pgi` | — | `revalidate=1800` | same | — | Small | P2 |
| `/api/pgi/current`, `/api/pgi/alert`, `/api/pgi/dataset`, `/api/gai/current` | — | dynamic | dynamic | — | Small | P2 |
| `/api/articles/tagged`, `/api/articles/by-tag` | — | `force-dynamic` | dynamic with short cache | — | Small | P2 |
| `/api/briefings` (GET) | `src/app/api/briefings/route.ts` | dynamic | dynamic | — | Small | P2 |
| `/api/briefings/[date]` | — | dynamic | dynamic | — | Small | P2 |
| `/api/og`, `/api/og/pgi` | `src/app/api/og/route.tsx`, `src/app/api/og/pgi/route.tsx` | `runtime="edge"`, `next/og` `ImageResponse` | dynamic **or** pre-rendered PNGs at build/ingest time | `next/og` on Cloudflare Pages requires the `@cloudflare/next-on-pages` adapter to support Satori; this is the single biggest unknown | Medium | **P0 (de-risk)** |
| `/api/stripe/checkout` | `src/app/api/stripe/checkout/route.ts` | dynamic | dynamic | — | Small | P1 |
| `/api/stripe/portal` | `src/app/api/stripe/portal/route.ts` | dynamic, uses `createServerClient` for session | dynamic | — | Small | P1 |
| `/api/stripe/webhook` | `src/app/api/stripe/webhook/route.ts` | dynamic, `req.text()` raw body, manual HMAC | dynamic | Test raw-body handling on Cloudflare | Medium | **P0 (de-risk)** |
| `/api/scans/ingest` | — | dynamic, ingest-key auth, single upsert | dynamic | — | Small | P2 |
| `/api/pgi/ingest` | `src/app/api/pgi/ingest/route.ts` | dynamic, ingest-key auth, sequential loop | dynamic — consider moving to off-host writer direct to DB | ~250 sequential Supabase ops — may approach Cloudflare 30s limit with large batches | Medium | P1 |
| `/api/gai/ingest` | — | dynamic, ingest-key auth | dynamic | — | Small | P2 |
| `/api/briefings` (POST) | — | dynamic, ingest-key auth | dynamic | — | Small | P2 |
| `/api/breaking` (POST) | — | dynamic, ingest-key auth | dynamic | — | Small | P2 |
| `/api/pipeline/status`, `/api/pipeline/update` | — | dynamic, ingest-key auth | dynamic | — | Small | P2 |
| `/api/company-briefings/submit` | `.../company-briefings/submit/route.ts` | dynamic, thin upsert | dynamic | — | Small | P1 |
| `/api/company-briefings/score` | `.../company-briefings/score/route.ts` | dynamic, scores one company | dynamic | — | Small | P1 |
| `/api/company-briefings/score-all` | `.../company-briefings/score-all/route.ts` | dynamic, sequential over ALL companies | **off-host** — move to OpenClaw/cron direct DB writer | Loop over all companies × 3 Supabase ops each will exceed Workers timeout at N>10 | Medium | **P0** |
| `/api/company-briefings/deliver` | `.../company-briefings/deliver/route.ts` | dynamic, bulk Resend email | **off-host** — or keep but cap batch size | Resend batch + many DB updates per run | Medium | **P0** |
| `/api/digest/daily` | `src/app/api/digest/daily/route.ts` | dynamic, reads `content/blog/` from filesystem, sends bulk email | **off-host** — move entirely | Filesystem read + bulk email in single HTTP request | Medium | **P0** |
| `/api/digest/weekly` | `src/app/api/digest/weekly/route.ts` | dynamic, bulk email | **off-host** | — | Medium | **P0** |

---

## Section C — File-by-file change list

### Phase 1 — Pre-migration refactor (still on Vercel; no hosting change)

Goal: reduce runtime behavior, introduce the snapshot contract, delete dead code, and tighten cache headers. At the end of Phase 1 the app still runs fine on Vercel, but with fewer moving parts per request.

#### C1.1 Snapshot contract — new infrastructure

**New file — write one:** `supabase/migrations/<date>_site_snapshot.sql`
- What: create `site_snapshot` table (see Section D for shape).
- Why: every subsequent homepage / top-story / pulse refactor depends on this row existing.

**New file — write one:** `scripts/write-site-snapshot.ts`
- What: a Node script that reads the latest scan + briefing + top PGI/GAI + breaking status and upserts a single row into `site_snapshot`.
- Why: called by the OpenClaw pipeline after each scan ingest, or via cron after the existing PGI/GAI ingest endpoints complete.

#### C1.2 Remove dead code

- `src/app/components/scan-pulse.tsx` — **delete**. Grep confirms it's imported nowhere. It polls every 60s and exists in the migration report's risk section; the cleanest fix is to delete it.
- `src/app/components/next-briefing-countdown.tsx` — **delete**. Unused. Pure client timer, no API calls, but still code to maintain.
- `src/app/components/testimonials.tsx` — **delete**. Unused. 6-second auto-rotate carousel with hardcoded testimonials.
- Why: removing unused polling components reduces surface area and removes a confusion about whether `/api/scan/pulse` is "live" from the frontend (it isn't — nothing reads it).

#### C1.3 Homepage

- `src/app/page.tsx` — **change**.
  - What's wrong today (line 2, 214): imports and calls `getTodayScan()`, which has a dual Supabase/filesystem fallback (`src/lib/scan-parser.ts:383`). On Vercel it fetches from Supabase. On Cloudflare the filesystem branch won't apply but the dual-mode code is brittle.
  - What's wrong today (line 262-269): separate Supabase admin read for `briefings`.
  - Change: replace both reads with a single `site_snapshot` read. Keep `revalidate = 300`. Derive `allItems`, `blindspotStories`, `pgiItem` from the snapshot JSON rather than recomputing.
  - Why: one small cached DB read instead of a complex code path. Kills the filesystem branch. Eliminates the `briefings` round-trip.

- `src/lib/scan-parser.ts` — **change**.
  - What's wrong today: 600-line dual-mode parser with `VERCEL`/`isLocal` branching, regex markdown extraction, and JSONB fallbacks. Used by the homepage, `/lens`, `/trending`, `/api/scans/today`, and `/indexes/page.tsx`.
  - Change: **narrow it to Supabase-only**. Delete `parseScanFile`, `getFramingNotes` markdown extraction, the `SCANS_DIR`/`VERCEL` branching, and `extractJsonItems` if it's not also used by ingest. Keep the Supabase fetchers (`getSupabaseScan`, `getSupabaseAvailableDates`). Rewrite `getTodayScan()` to read `site_snapshot` first, fall back to `getLatestScan()`.
  - Why: filesystem access is a no-go on Cloudflare Pages request handlers, the branching makes testing hard, and the snapshot contract replaces the "today" computation.

#### C1.4 Lens / Trending / Archive / Indexes

- `src/app/lens/page.tsx` — **change**. Remove `export const dynamic = "force-dynamic"` (line 8). Add `export const revalidate = 300`. Switch `getTodayScan()` to snapshot read. Effort: Small.
- `src/app/trending/page.tsx` — **change**. Remove `export const dynamic = "force-dynamic"` (line 7). Add `export const revalidate = 600`. Switch to snapshot. Effort: Small.
- `src/app/archive/page.tsx` — **change**. Remove `force-dynamic` (line 70). Add `revalidate = 3600`. The `briefings` list only changes once a day. Effort: Small.
- `src/app/archive/[date]/page.tsx` — **change**. Remove `force-dynamic` (line 242). Add `generateStaticParams` returning known briefing dates + `revalidate = 86400`. Each date's content is immutable once published. Effort: Medium.
- `src/app/indexes/pgi/page.tsx` — **change**. Remove `force-dynamic` (line 10). Add `revalidate = 3600`. Effort: Small.
- `src/app/indexes/pgi/data/page.tsx` — **change**. Remove `force-dynamic` (line 14). Add `revalidate = 3600`. Effort: Small.
- `src/app/indexes/pgi/trends/page.tsx` — **change**. Remove `force-dynamic` (line 6). Add `revalidate = 3600`. Effort: Small.
- `src/app/indexes/pgi/[date]/page.tsx` — **change**. Remove `force-dynamic` (line 6). Historical dates are immutable — add `generateStaticParams` with known dates from `pgi_story_scores` + `revalidate = 86400`. Effort: Medium.
- `src/app/indexes/gai/data/page.tsx` — **change**. Remove `force-dynamic` (line 14). Add `revalidate = 3600`. Effort: Small.
- `src/app/api/scans/today/route.ts` — **change**. Remove `force-dynamic` (line 4). Change to read `site_snapshot` and return the `items` array slice. Add `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`. Effort: Small.
- `src/app/api/search/route.ts` — **change**. Remove `force-dynamic` (line 4); add short cache header (`s-maxage=60`). Effort: Small.
- `src/app/api/articles/tagged/route.ts` — **change**. Remove `force-dynamic` (line 4). Effort: Small.
- `src/app/api/articles/by-tag/route.ts` — **change**. Remove `force-dynamic` (line 4). Effort: Small.
- Why (all): `force-dynamic` disables all caching. Moving these to ISR/cached responses is the single largest cost reduction for the migration.

#### C1.5 Polling / live widgets

- `src/app/components/breaking-news-banner.tsx` — **change**.
  - What's wrong today (line 65): polls `/api/breaking` + `/api/top-story` every 60 seconds, on every page, for every visitor.
  - Change (recommended): move banner state into the `site_snapshot` row (fields `breaking_active`, `breaking_headline`, `breaking_url`, `breaking_expires_at`). Render the banner server-side in the root layout from the snapshot. Remove the polling loop entirely.
  - Change (minimal alternative if real-time-ish is required): extend the interval to 300 seconds (5 min), and add `Cache-Control: public, s-maxage=120, stale-while-revalidate=240` on `/api/breaking`.
  - Why: 60-second polling on every page is the single largest ongoing egress/request cost on the public site.

- `src/app/api/breaking/route.ts` — **change**. Increase `s-maxage` from 30 to 120 regardless of which banner path is chosen. Effort: Small.

- `src/app/components/relative-time.tsx` — **keep**. No API calls; pure client-side `setInterval` that refreshes "X minutes ago" text. Harmless for hosting cost. Optionally swap for `Intl.RelativeTimeFormat` computed once on mount — out of scope for the migration.

#### C1.6 Subscribe rate limiter

- `src/app/api/subscribe/route.ts` — **change**.
  - What's wrong today (line 11-16): `setInterval(...)` at module scope cleans up an in-memory rate-limit Map every 60 seconds. On Cloudflare Workers, module scope doesn't persist like it does on Node.js — the Map won't survive requests reliably anyway, and the interval won't fire.
  - Change: replace with an on-request lazy cleanup (`Map` scan when inserting, dropping expired entries). Or replace with Cloudflare KV / Upstash / a Supabase table. Simpler: keep it in-memory per-isolate and accept the weaker guarantee.
  - Why: `setInterval` at module scope is a Cloudflare portability bug waiting to happen.

#### C1.7 Middleware

- `src/middleware.ts` — **change**.
  - What's wrong today (line 48): matcher runs on **every non-static path**, and line 34 calls `supabase.auth.getUser()` unconditionally — including for anonymous requests to `/`, `/lens/*`, `/archive`, `/feed.xml`, etc.
  - Change: narrow the matcher to only auth-protected paths: `/dashboard/:path*`, `/account/:path*`, `/settings/:path*`, `/onboarding/:path*`, `/api/stripe/portal`, `/api/company-briefings/submit`, `/auth/callback`. Public article pages don't need session refresh.
  - Why: eliminates a Supabase round-trip per public request. Also protects the CDN — requests going through middleware cannot be served from the edge cache in the same way.

#### C1.8 Off-host moves (still Phase 1, still on Vercel — but stop calling these endpoints from anywhere)

These endpoints don't get removed yet (to avoid breakage), but their invocations should be moved to OpenClaw/cron agents making direct DB writes:

- `src/app/api/digest/daily/route.ts` — **plan to remove**. Whoever triggers this today should be switched to a background Node script that reads blog filesystem + Supabase and calls Resend. Filesystem access + bulk email = cron job, not HTTP handler.
- `src/app/api/digest/weekly/route.ts` — **plan to remove**. Same argument, smaller scope.
- `src/app/api/company-briefings/score-all/route.ts` — **plan to remove**. Sequential loop over all companies × 3 Supabase ops each exceeds the 30-second Cloudflare Worker cap at scale. Move to an OpenClaw job that iterates companies directly against Supabase.
- `src/app/api/company-briefings/deliver/route.ts` — **plan to remove** or cap. Bulk email sending in an HTTP handler is the same antipattern.
- Why: per the migration report, heavy jobs stay off-host. These four endpoints are the ones that currently violate that.

#### C1.9 OG images — de-risk

- `src/app/api/og/route.tsx`, `src/app/api/og/pgi/route.tsx` — **decide**.
  - Option A: keep `runtime = "edge"` and verify on staging that `@cloudflare/next-on-pages` (or OpenNext-Cloudflare) supports Satori / `next/og`. As of mid-2026 this is the single most fragile Cloudflare compatibility point for Next.js.
  - Option B: replace with pre-rendered PNG generation at ingest time (when a new scan lands, generate the OG image and upload to Supabase Storage or R2).
  - Recommendation: **Option B** is safer. Option A is fine if staging tests pass.
  - Why: OG images are not on any critical path — social previews degrade gracefully.

### Phase 2 — Cloudflare cutover work

Goal: stand up Pages deployment, attach domain in preview, validate, then cut over traffic.

#### C2.1 Add Cloudflare adapter

- `package.json` — **change**. Add dev dependency on `@cloudflare/next-on-pages` (or `@opennextjs/cloudflare`). Decide between the two — as of 2026, OpenNext's Cloudflare adapter has better App Router / middleware / ISR support. Add a `build:cf` or `pages:build` script.
- `wrangler.toml` (new file at repo root) — **create**. Contents:
  - `name = "albis"`
  - `compatibility_date = "2026-04-01"` (or current)
  - `compatibility_flags = ["nodejs_compat"]` — needed because `src/app/api/digest/daily/route.ts` and lib/blog imports `fs`.
  - `pages_build_output_dir = ".vercel/output/static"` (next-on-pages) or `.open-next/assets` (OpenNext).
  - KV/R2 bindings if we choose to use them for rate limiting / OG storage.
- Why: the adapter is what translates Next.js output into a Cloudflare Pages deployment.

#### C2.2 Image optimization

- `next.config.ts` — **change**.
  - What's wrong today (line 5-24): no `images.loader` and no `images.unoptimized`. Default Next.js Image Optimization won't exist on Cloudflare Pages.
  - Change: pick one:
    - `images: { unoptimized: true, remotePatterns: [...] }` — simplest; images ship as-is.
    - Configure a Cloudflare Images loader (custom loader function; Cloudflare Images is a paid product).
    - Use `next/image` `loader` prop pointing at an external optimizer.
  - Recommendation: start with `unoptimized: true`, measure, iterate.
  - Why: without this, every `<Image>` in the app returns a 500 on Cloudflare.

#### C2.3 Cloudflare project setup (infrastructure, not code)

- Create Cloudflare account / Pages project; connect the GitHub repo; configure build command (`npm run build:cf`) and output directory per adapter.
- Configure **environment variables** per Section E — note that `NEXT_PUBLIC_*` must be set at build time in the Pages build environment, not just as runtime bindings.
- Configure **production + preview** environments with different Stripe + Supabase keys if desired (test-mode Stripe on preview).
- Attach `www.albis.news` as a custom domain; confirm TLS. Optionally attach apex and redirect.

#### C2.4 Stripe webhook retest

- `src/app/api/stripe/webhook/route.ts` — **verify, don't change**. On staging, point a Stripe test-mode webhook at the Cloudflare preview URL. Confirm signature verification passes. If it fails, the most likely cause is body handling — `req.text()` is supported, but some adapters intermediate the body. Document the result.

#### C2.5 Middleware / auth validation on Cloudflare

- `src/middleware.ts` (already narrowed in C1.7) — **verify**. Supabase SSR cookies should round-trip through Pages Functions. If the auth flow breaks on Cloudflare, the fallback is to drop middleware entirely and do auth refresh client-side.
- `src/app/auth/callback/route.ts` — **verify**. Uses `cookies()` from `next/headers`. Should work with the adapter. Test the full OAuth/magic-link flow on staging.

#### C2.6 DNS / domain

- Move `albis.news` DNS to Cloudflare (probably already there — verify).
- Attach Pages project to `www.albis.news`.
- Confirm `/feed.xml`, `/news-sitemap.xml`, `/sitemap.ts` resolve correctly — these are SEO-critical.
- Configure Cloudflare Cache Rules if needed; at minimum respect `s-maxage` from the `Cache-Control` headers already on API routes.

### Phase 3 — Post-cutover cleanup

Goal: remove the last Vercel-specific code, measure, and decide what to do next.

#### C3.1 Vercel-specific code

- `src/lib/scan-parser.ts` — **change** (second pass). Delete the `process.env.VERCEL === '1'` check (line 28) and the filesystem branch entirely — by this point Phase 1 work has already reduced reliance on it.
- Repo root: delete any `.vercel/` directory left from local dev; add `.vercel/` to `.gitignore` if not already.

#### C3.2 Remove the off-hosted endpoints

Once the external cron/OpenClaw agents are writing directly to Supabase (or to small dedicated ingest endpoints), **delete** these files:
- `src/app/api/digest/daily/route.ts`
- `src/app/api/digest/weekly/route.ts`
- `src/app/api/company-briefings/score-all/route.ts`
- `src/app/api/company-briefings/deliver/route.ts`
- Why: anything left in the web app is either a thin upsert or a user-facing endpoint.

#### C3.3 Measurements to take

- Page speed (Lighthouse, LCP/FID/CLS) — homepage, article page, archive.
- CDN cache hit rate (Cloudflare analytics) — target >80% on public pages.
- Hosting cost month-over-month.
- Error rates on `/api/stripe/webhook`, `/api/auth/callback`, `/api/subscribe`.
- Request volume on `/api/breaking` (will drop sharply if C1.5 is done).

---

## Section D — The snapshot contract

This is the single most important architectural change in the migration. Today the homepage and several APIs rebuild "what does the site look like right now?" from 3-5 separate Supabase tables on every request. Replacing that with a single pre-built row removes most of the runtime reason to exist.

### D.1 Who writes it

**Writer:** the OpenClaw pipeline, at the end of each scan run. Concretely: after `/api/scans/ingest`, `/api/pgi/ingest`, `/api/gai/ingest`, and `/api/briefings` (POST) have all completed, the pipeline runs a final step (either a Node script like `scripts/write-site-snapshot.ts` or a direct SQL function) that assembles the snapshot and upserts it.

**Optional secondary writer:** `/api/breaking` POST (an editor ingest) can update just the breaking-news fields of the same row without touching the rest.

**Trigger:** post-ingest in the OpenClaw workflow. Not Vercel cron; not a web-app cron. This keeps intelligence work off-host.

### D.2 Where it's stored

**Table:** `site_snapshot` in Supabase.

**Primary key:** singleton — `id INTEGER PRIMARY KEY` fixed to `1`, same pattern as the existing `scan_pulse` table (`src/app/api/scan/pulse/route.ts:8-19` already uses this pattern).

**Why not JSON on object storage:** because Supabase is already the data layer, and reads stay under one Supabase round-trip. A JSON-on-R2 approach is possible later if we want to cut Supabase reads on the CDN path, but it adds a write step and a staleness decision. Start with Supabase.

### D.3 Shape

```sql
CREATE TABLE site_snapshot (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scan-derived fields (replaces getTodayScan)
  scan_date DATE NOT NULL,
  scan_period TEXT,                  -- "morning" | "midday" | "evening"
  scan_display_date TEXT,
  top_theme TEXT,
  mood TEXT,
  framing_note TEXT,
  pattern_of_day JSONB,              -- full PatternOfDay object
  items JSONB NOT NULL,              -- full array of ScanItem with headline/connection/regions/category/significance/perception_gap etc.
  blindspot_story_slugs TEXT[],      -- precomputed — what's in today's "missed" list

  -- Briefing header
  briefing_date DATE,
  briefing_title TEXT,
  briefing_summary TEXT,
  briefing_top_stories JSONB,
  briefing_story_count INTEGER,
  briefing_pgi_score NUMERIC,

  -- Top stories for public display
  top_pgi_story TEXT,
  top_pgi_score NUMERIC,
  top_pgi_story_slug TEXT,
  top_gai_story TEXT,
  top_gai_score NUMERIC,

  -- Global mood + counts for pulse widget
  global_mood TEXT,
  stories_found INTEGER,

  -- Breaking news (merges the existing breaking_news table's latest-active row)
  breaking_active BOOLEAN DEFAULT false,
  breaking_headline TEXT,
  breaking_url TEXT,
  breaking_expires_at TIMESTAMPTZ
);
```

### D.4 Which routes consume it

**Must switch to reading the snapshot (Phase 1):**
- `src/app/page.tsx` (homepage) — replace `getTodayScan()` + `briefings` read.
- `src/app/lens/page.tsx` — replace `getTodayScan()`.
- `src/app/trending/page.tsx` — replace `getTodayScan()`.
- `src/app/api/scans/today/route.ts` — return `items` from snapshot.
- `src/app/api/scan/pulse/route.ts` — return the mood/top-pgi/top-gai fields from snapshot (replaces the current `scan_pulse` table read; `scan_pulse` can be dropped later).
- `src/app/api/top-story/route.ts` — return `top_pgi_story` / `top_gai_story` from snapshot.
- `src/app/api/breaking/route.ts` (GET) — return breaking_* fields from snapshot.

**Should switch if C1.5 recommendation is taken:**
- `src/app/layout.tsx` / `BreakingNewsBanner` — render from snapshot at request time in the root layout, kill the polling.

**No change needed:**
- `/indexes/pgi/*` and `/indexes/gai/*` — these are analytical views over historical data, not "today" views. ISR with `revalidate = 3600` is enough.

### D.5 Fallback if snapshot is missing

If `site_snapshot` returns no row (first boot, brief race between scan completion and writer step, or manual DB corruption):
- Every consuming route must render a sensible empty state (banner hidden, empty story list, "Today's briefing is being prepared" text on the homepage).
- Do **not** fall back to the old live-computation path — that reintroduces the exact problem the snapshot solves.
- Log the miss to Supabase (e.g., `pipeline_runs` table) so it's visible to ops.

### D.6 Staleness handling

- `revalidate = 300` on consuming pages means up to 5-minute lag between snapshot write and user visibility. For the public site, this is fine.
- For the admin/dashboard surfaces that want fresher data, they can read the underlying tables directly (they're dynamic routes anyway).

---

## Section E — Environment variable migration map

**All env vars** discovered in the codebase. "Build-time" means read during `next build` (i.e., inlined into the bundle); "Request-time" means read by the running worker/function per request.

| Env var | Classification | Reads at | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Both (inlined into browser bundle; also read server-side in many routes) | Must be set in **both** Cloudflare Pages build environment *and* as a runtime variable. The `NEXT_PUBLIC_` prefix only inlines it client-side. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Both | Same dual-setting as above. Safe to expose. |
| `NEXT_PUBLIC_SITE_URL` | Public | Request-time | Used in `src/app/layout.tsx:49`, unsubscribe URL generation, email templates. Defaults to `https://www.albis.news`. Set to preview URL in staging. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** | Request-time | Used by `src/lib/supabase/admin.ts:6` and 15+ API routes. Cloudflare Pages: set as production variable only. **Do not set in preview unless preview Supabase is a separate project.** |
| `STRIPE_SECRET_KEY` | **Server-only** | Request-time | `src/lib/stripe.ts:3`, `src/app/api/stripe/checkout/route.ts:11`, portal, webhook. Use test key on preview. |
| `STRIPE_WEBHOOK_SECRET` | **Server-only** | Request-time | `src/app/api/stripe/webhook/route.ts:37,41`. Set per-environment; Stripe webhooks are environment-specific. |
| `RESEND_API_KEY` | **Server-only** | Request-time | `src/lib/email.ts:4`, `src/app/api/company-briefings/deliver/route.ts:11`. If the daily/weekly digest endpoints are moved off-host (C1.8), this can eventually be dropped from the Cloudflare env. |
| `SCAN_INGEST_KEY` | **Server-only** | Request-time | Bearer-token auth on 10+ ingest endpoints. Set once; share with OpenClaw pipeline. |
| `PEXELS_API_KEY` | **Server-only** | Request-time | `src/app/api/pexels/route.ts:18`. Proxies image search. |
| `SCANS_DIR` | Server (legacy) | Build/request | `src/lib/scan-parser.ts:24`. Points at local OpenClaw workspace. **Do not set on Cloudflare.** After Phase 1 scan-parser refactor (C1.3), this can be deleted entirely. |
| `VERCEL` | Server (legacy) | Request-time | Read in `src/lib/scan-parser.ts:28` as a platform flag. On Cloudflare this is never `"1"`, which is fine. **Delete the reference in Phase 3.** |
| `NODE_ENV` | Server (standard) | Build/request | Standard. Set automatically by adapter. |

### E.1 Classification audit results

- **No secrets found leaking via `NEXT_PUBLIC_`.** All `NEXT_PUBLIC_*` vars are genuinely public.
- **No env var is missing from `.env.local.example`** beyond what's expected — Stripe/Resend/SCAN_INGEST keys aren't in the example file, which is fine for secrets.

### E.2 Cloudflare-specific env var considerations

- Cloudflare Pages uses **two separate places** for variables: "Environment variables" (available at build time) and "Secrets" (runtime bindings). `NEXT_PUBLIC_*` vars must go in build-time; everything else can be runtime-only.
- Stripe webhook signing secrets are **per-endpoint**. When the webhook URL changes from `*.vercel.app` to `*.pages.dev` or `www.albis.news`, you must **regenerate or re-point** the Stripe webhook endpoint and copy the new signing secret. Easy to forget; guaranteed outage if missed.
- Supabase auth redirects include the site URL. Add the Cloudflare preview URL and the production URL to the Supabase auth allowlist **before** cutover. Otherwise magic-link / OAuth callbacks will fail silently.

---

## Section F — Risk register

Specific to this codebase. Generic "migrations are hard" risks are in the migration report and not repeated here.

### F.1 `next/og` OG image generation on Cloudflare

- **What breaks:** `src/app/api/og/route.tsx` and `src/app/api/og/pgi/route.tsx` use `ImageResponse` from `next/og` (Satori). Cloudflare Workers have tighter memory limits and the adapter support for Satori has been historically flaky.
- **Likelihood:** Medium. May work, may not. Single point of failure.
- **Mitigation:** Phase 1.9 — pre-render OG PNGs at ingest time and store in Supabase Storage or R2. Remove the runtime generator.
- **How to verify:** Hit `/api/og?slug=<existing-slug>` on the Cloudflare preview deployment. If it returns a valid PNG of reasonable size (~50-150 KB), it works. If it returns 500 or 0-byte, switch to pre-rendered.

### F.2 Stripe webhook raw-body handling

- **What breaks:** If the Cloudflare adapter pre-parses the request body, `req.text()` returns empty/parsed JSON and HMAC verification fails silently. All Stripe events then return 400 and subscription state drifts from Stripe.
- **Likelihood:** Low-Medium. The adapters generally do this correctly, but it's the highest-blast-radius bug — it breaks revenue.
- **Mitigation:** Point Stripe test webhooks at the preview URL **before** cutover. Verify `checkout.session.completed` round-trips end-to-end (including the Supabase `profiles` upsert at `src/app/api/stripe/webhook/route.ts:46`).
- **How to verify:** Run `stripe trigger checkout.session.completed --forward-to <preview-url>/api/stripe/webhook` and confirm the `profiles` row updates.

### F.3 Supabase session/middleware on the edge

- **What breaks:** `src/middleware.ts` uses `@supabase/ssr`'s `createServerClient` with cookie handlers. The adapter must run middleware as a Pages Function; if it downgrades it to a static deployment, auth refresh stops working.
- **Likelihood:** Low. All major Cloudflare Next.js adapters support middleware by now (2026).
- **Mitigation:** Phase 1.7 (narrow the matcher) reduces the blast radius — public pages don't depend on the middleware. If auth breaks, only `/dashboard/*` and `/account/*` fail, not the public site. Test login/logout/dashboard on staging before cutover.
- **How to verify:** Log in on the Cloudflare preview URL, close and reopen the tab, confirm session persists. Then let a session expire (>1h) and confirm it refreshes silently on the next request.

### F.4 Filesystem reads in `/api/digest/daily`

- **What breaks:** `src/app/api/digest/daily/route.ts:212-243` reads `content/blog/` via `fs.readdirSync`. With `nodejs_compat`, `fs` works against the deployment assets, but the bulk-email loop inside the same handler will exceed the Worker CPU/time budget when subscriber count grows.
- **Likelihood:** High. The endpoint is already flirting with timeouts today.
- **Mitigation:** Phase 1.8 — move off-host. The endpoint stays in the repo until then but shouldn't be called from the Cloudflare environment.
- **How to verify:** Before cutover, confirm nothing is calling `/api/digest/daily` or `/api/digest/weekly` — check `phase4-cron-jobs.json` and any external triggers.

### F.5 `setInterval` at module scope in `/api/subscribe`

- **What breaks:** `src/app/api/subscribe/route.ts:11-16` calls `setInterval` at module scope to prune a rate-limit Map. On Cloudflare Workers, module scope runs in every isolate and timers don't persist the same way. The rate limit becomes unreliable and the map leaks per-isolate.
- **Likelihood:** High. Will function incorrectly from day 1 on Cloudflare.
- **Mitigation:** Phase 1.6 — convert to on-request lazy cleanup, or move rate limiting to Cloudflare's built-in rate-limiting rules (simpler). Either way, **delete the setInterval**.
- **How to verify:** Fire 20 subscribe requests in 10 seconds from the same IP against the Cloudflare preview. Confirm request 6+ is rejected (matches the existing policy).

### F.6 Image `<Image>` components on unconfigured optimizer

- **What breaks:** The app uses `<Image>` from `next/image` in multiple places (category pages, article cards). Cloudflare Pages has no default image optimizer; without config, images return 500.
- **Likelihood:** High if `next.config.ts` is not updated.
- **Mitigation:** Phase 2.2 — set `images.unoptimized: true` at minimum.
- **How to verify:** Load any article page with a hero image on the Cloudflare preview. Confirm the image renders.

### F.7 Homepage briefings query returns `{}` when `revalidate = 300` serves a stale build

- **What breaks:** `src/app/page.tsx:260-269` swallows errors (`catch { /* silently fail */ }`). If the Supabase admin client fails to initialize at render (e.g. env var missing at build or deploy), the homepage renders with `briefing = null` and no signal that anything's wrong.
- **Likelihood:** Medium — easy to miss an env var.
- **Mitigation:** Phase 1.3 — the snapshot refactor removes the second Supabase read, and the page gets one clear failure mode (empty snapshot → empty state). Also add a log when snapshot is missing.
- **How to verify:** Deploy to staging without `SUPABASE_SERVICE_ROLE_KEY`; confirm the homepage throws a visible 500 in Cloudflare logs, not a silent empty state.

### F.8 Stripe success URL hardcoded to production domain

- **What breaks:** `src/app/api/stripe/checkout/route.ts:18-19` hardcodes `https://www.albis.news/account?session_id=...` and `https://www.albis.news/pricing`. On Cloudflare preview, checkout completion redirects back to production, not the preview.
- **Likelihood:** High — will misbehave during preview testing.
- **Mitigation:** Change to use `NEXT_PUBLIC_SITE_URL` env var. Small, safe, fits in Phase 1 or Phase 2.
- **How to verify:** Run a Stripe checkout on preview; confirm it returns to the preview URL, not production.

### F.9 No server-side tier validation on company onboarding save

- **Pre-existing bug, not a migration blocker.** `src/app/onboarding/company/company-onboarding-client.tsx:329-364` enforces tier limits (max themes, max entities, max recipients) in the UI only. A motivated attacker could POST raw JSON with arbitrary limits.
- **Mitigation:** add a server-side API route that validates and upserts, during the migration is a convenient time. But it's not required for cutover.

---

## Section G — Open questions (need human decision)

These are things the audit could not resolve. Answer them before opening a PR.

1. **Should the `BreakingNewsBanner` poll at all, or render from the snapshot?**
   The banner is the single biggest cost-driver per the runtime audit. If we accept 5-minute lag on breaking-news rollouts, we can kill polling entirely and render server-side from `site_snapshot.breaking_*`. If editorial needs faster-than-5-minute visibility, polling stays (with a longer interval and a proper cache header). **Which is it?**

2. **Adapter choice: `@cloudflare/next-on-pages` vs. `@opennextjs/cloudflare`?**
   Both can deploy a Next.js 16 App Router app to Cloudflare Pages. `@opennextjs/cloudflare` (OpenNext) has generally better ISR and middleware fidelity; `@cloudflare/next-on-pages` is the official Cloudflare project. Needs a call based on current maturity. Recommend trying OpenNext first on a scratch preview.

3. **Do we want an OG image at all, or just use a static `og-image.png`?**
   `src/app/layout.tsx:82` already points at a static `/og-image.png` for the site-level Open Graph. The dynamic routes at `/api/og` and `/api/og/pgi` are for per-article / per-story social cards. If social traffic isn't material, dropping them entirely avoids the Cloudflare `next/og` unknown.

4. **Who writes `site_snapshot`?**
   OpenClaw pipeline runner? A new cron? A trigger on `/api/briefings` POST? The audit can't tell — this is a product/pipeline decision. Needs to be owned before Phase 1 can start.

5. **What happens to the `scan_pulse` table once `site_snapshot` exists?**
   Straight migration — copy its fields into `site_snapshot`, update `/api/scan/pulse` to read from the snapshot, drop the table. Any external dashboards or agent tools still reading `scan_pulse` directly? Confirm before dropping.

6. **Is `/api/scans/today`'s minimal response (headline + connection only) still used?**
   It's called by something — can't tell what from the repo alone. If it's something outside the app (analytics, embed, third-party integration) that we don't own, we need to keep it. If it's just the country-mention logic that nothing currently renders, it might be safe to delete entirely.

7. **Are the `publish-*.js` / `push-*.js` scripts at repo root still used, or historical?**
   `publish-article.js`, `push-article.js`, `push-blog-article.js`, etc. If they're ad-hoc ops tools, leave them. If they're in CI somewhere, check. Not a migration blocker but worth knowing for the Phase 3 cleanup.

8. **Preview/staging Supabase: same project as production, or separate?**
   Affects how env vars get split between Cloudflare preview and production environments. If same project, preview can accidentally write to production tables via the service role key — which has happened before on other projects.

9. **Cron schedule for `site_snapshot` writer if no post-ingest hook is wired.**
   If we can't hook into OpenClaw post-ingest cleanly, a fallback cron every 5 minutes that rebuilds the snapshot is workable — but it needs a host. Which?

10. **The `/admin` page gates on `localStorage` only.** Pre-existing concern, not migration-specific. Worth flagging since Cloudflare is a good time to decide if that's acceptable or needs a real auth gate.

---

## Section H — Recommended first PR

**Title:** `Introduce site_snapshot contract and switch homepage to snapshot read`

**Why this first:** It's the change that unblocks the most subsequent work (every other snapshot consumer depends on this shape), has the smallest surface area (one new table, one new script, one page refactor), and is safe to ship on Vercel before any Cloudflare work begins. It provides the "before" measurement point: if the homepage still works on Vercel with the snapshot in place, we know the contract is sound.

**Scope (files to change):**

1. **New:** `supabase/migrations/20260416_site_snapshot.sql` — create the `site_snapshot` table per Section D.3.

2. **New:** `scripts/write-site-snapshot.ts` — read the latest scan + briefing + top PGI/GAI + active breaking news, upsert one row into `site_snapshot`. Runnable locally or from OpenClaw. First version can wrap existing helpers from `src/lib/scan-parser.ts` and the admin Supabase client.

3. **New:** `src/lib/site-snapshot.ts` — a small `getSiteSnapshot()` helper that reads the singleton row. Returns the typed shape; returns a `null` object with an explicit `isEmpty: true` sentinel if the row is missing.

4. **Changed:** `src/app/page.tsx` — replace the `getTodayScan()` call (line 214) and the `briefings` admin read (lines 260-269) with a single `await getSiteSnapshot()` call. Derive `allItems`, `blindspotStories`, `pgiItem`, `briefing` from the snapshot. Keep `revalidate = 300`.

5. **Changed:** `src/app/api/scans/today/route.ts` — switch from `getTodayScan()` (which hits filesystem/Supabase) to `getSiteSnapshot()`. Keep response shape identical so no client changes. Remove `export const dynamic = "force-dynamic"`; add `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.

6. **Unchanged but verified:** `src/lib/scan-parser.ts` — does **not** get touched in this PR. That's a separate, larger refactor.

**Out of scope for this PR (explicitly):**
- Cloudflare adapter, `wrangler.toml`, any deploy-target changes.
- Touching middleware, Stripe, auth, or any other route.
- Deleting `scan-pulse.tsx` or other dead code.
- Changing `/lens`, `/trending`, `/archive`, `/indexes/*`.

**How to validate before merge:**
1. Run `scripts/write-site-snapshot.ts` locally against staging Supabase. Confirm the row exists.
2. Boot `npm run dev` against staging. Confirm the homepage renders with the snapshot data, matches the current production homepage visually.
3. Hit `/api/scans/today` and confirm the response shape is unchanged (`{ date, items: [...] }`).
4. Deploy to Vercel preview. Run the homepage through Lighthouse; confirm no regression.
5. Write a one-paragraph note in the PR description about where `scripts/write-site-snapshot.ts` will eventually be invoked from (answer to Open Question 4).

**Rollback plan:**
Revert the three file changes; the migration can stay (no consumers left). Zero risk to production.

**After this ships:**
Next PRs in suggested order — each one small, each one reduces runtime load:
- PR 2: Delete `scan-pulse.tsx`, `next-briefing-countdown.tsx`, `testimonials.tsx`. Trivial cleanup.
- PR 3: Switch `/lens`, `/trending`, `/api/scan/pulse`, `/api/top-story` to the snapshot.
- PR 4: Narrow the middleware matcher to auth-protected paths only.
- PR 5: Remove `force-dynamic` from `/archive`, `/archive/[date]`, `/indexes/pgi/*`, `/indexes/gai/data`.
- PR 6: Move `BreakingNewsBanner` to server-rendered-from-snapshot (or tighten polling). This is the single largest cost win.
- PR 7+: Cloudflare adapter config, `wrangler.toml`, image optimizer, off-host moves.

---

## Appendix — Files cited in this plan

Routes/pages:
- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/lens/page.tsx`, `src/app/trending/page.tsx`, `src/app/archive/page.tsx`, `src/app/archive/[date]/page.tsx`, `src/app/indexes/page.tsx`, `src/app/indexes/pgi/page.tsx`, `src/app/indexes/pgi/data/page.tsx`, `src/app/indexes/pgi/[date]/page.tsx`, `src/app/indexes/pgi/trends/page.tsx`, `src/app/indexes/gai/page.tsx`, `src/app/indexes/gai/data/page.tsx`, `src/app/signup/page.tsx`, `src/app/login/page.tsx`, `src/app/dashboard/layout.tsx`, `src/app/auth/callback/route.ts`, `src/app/onboarding/company/page.tsx`.

API routes:
- `src/app/api/scans/today/route.ts`, `src/app/api/scan/pulse/route.ts`, `src/app/api/breaking/route.ts`, `src/app/api/top-story/route.ts`, `src/app/api/subscribe/route.ts`, `src/app/api/search/route.ts`, `src/app/api/digest/daily/route.ts`, `src/app/api/digest/weekly/route.ts`, `src/app/api/company-briefings/{submit,score,score-all,deliver}/route.ts`, `src/app/api/stripe/{checkout,portal,webhook}/route.ts`, `src/app/api/og/route.tsx`, `src/app/api/og/pgi/route.tsx`, `src/app/api/pgi/ingest/route.ts`, `src/app/api/gai/ingest/route.ts`, `src/app/api/scans/ingest/route.ts`.

Lib / components:
- `src/lib/scan-parser.ts`, `src/lib/supabase/{client,server,admin}.ts`, `src/lib/stripe.ts`, `src/lib/email.ts`, `src/lib/tier-enforcement.ts`, `src/lib/blog/*`, `src/middleware.ts`, `src/app/components/breaking-news-banner.tsx`, `src/app/components/scan-pulse.tsx`, `src/app/components/next-briefing-countdown.tsx`, `src/app/components/testimonials.tsx`, `src/app/components/relative-time.tsx`, `src/app/onboarding/company/company-onboarding-client.tsx`.

Config:
- `next.config.ts`, `package.json`, `phase4-cron-jobs.json`, `.env.local.example`.
