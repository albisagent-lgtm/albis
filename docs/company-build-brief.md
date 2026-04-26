# Company Build Brief — Albis for Companies

**Read this doc at the start of every Claude Code session for this build. It is the source of truth for what we're building, why, and how. If something here conflicts with an earlier instruction, this doc wins.**

---

## What we're building

The company intelligence product (paid tier) for Albis. Businesses sign up, configure a profile (sector, regions, tracked themes, watchlist entities, risk priorities), and receive a personalised daily briefing of news matching their interests. Delivered by email, viewable on a logged-in dashboard.

The public albis.news site stays **completely separate** — different scan engine, different intelligence pool, zero cross-reads in either direction. The only shared thing is code (libraries, scan parser, scoring logic). Never data.

---

## Non-negotiable principles

- **Shared discovery, isolated output.** Aggregate company demand shapes the company scan. Each company only sees its own matched output. No cross-contamination between companies.
- **Relevant-first, ranked-second, compressed-third.** Retrieve broadly, rank intelligently, compress cleanly. Don't over-filter at intake.
- **Query graph, not brute-force.** 10,000 topics must collapse into shared retrieval clusters. NEVER one scan per company.
- **Typed targets.** Entity vs region vs sector vs commodity vs policy vs risk vs theme — retrieval expands differently by type.
- **Why-matched as first-class.** Every briefing item must explain why it matched, stored as structured data, surfaced on the dashboard.
- **Low guard at intake, smarter cleanup downstream.** Accept company requests broadly, normalize behind the scenes.
- **Trustworthy coverage beats editorial selectiveness.** The company product is NOT a newsroom. It's a monitoring product. Under-supplying is riskier than over-collecting.
- **Public vs company are different products.** Public is lively, curiosity-driven, editorial. Company is relevant, scoped, dependable, low-emotion, operationally useful. Never let public editorial personality bleed into company outputs.
- **Full separation between public and company pipelines.** Two independent scans, two independent pools, zero cross-reads. Only shared code.
- **Watchlist entities = mentions to match on, not sites to crawl.** "Meta" on a watchlist means "find news mentioning Meta," not "scan Meta.com." We only scan public news sources, never closed platforms requiring paid APIs.
- **Signals, not stories.** Each unit of retrieval is a discrete business-relevant change (regulatory filing, market move, statement, disruption, policy shift, announcement). Short, factual, tagged with who/what/where/when. Briefings stitch 4–6 signals per customer per day into clean short outputs — not editorial stories.

---

## Locked-in decisions for V1

- **LLM provider: OpenAI** for all company-build LLM calls (signal tagging, briefing generation, any classification). Don't change existing Claude calls in the public side. All new company-build code uses OpenAI.
- **Scan cadence: 3x daily at 7am / 1pm / 7pm US Eastern** for the company scan. Globally optimal — catches US, EU, and Asia business cycles at sensible points. Public scan cadence (also 3x daily) is independent and unchanged.
- **Briefing cadence: once per customer per day** at their preferred local delivery time (stored with timezone in `company_profiles.timezone` + `preferred_delivery_time`). System does timezone maths; briefing drawn from most recent scan(s) before their delivery time.
- **Free trial: 7 days**, auto-assigned on onboarding completion. No hard signup cap — cost-monitored instead.
- **First-briefing experience: preview-on-signup.** Generate a briefing immediately at end of onboarding using existing pool data (not a fresh scan). Costs roughly $0.03 per signup. Crucial for conversion — customer sees value before the wait-until-tomorrow pattern sets in.
- **Profile removal: clean removal.** If a company removes "DPRK" from their watchlist and no other company tracks it, it drops from scan targets automatically on the next union watch graph rebuild. Past briefings remain as historical record.
- **Signal unit: one row per discrete signal**, clustered from source articles at scan time. Richer metadata than public `scan_items` — more entity tagging, theme tagging, regional tagging, confidence scores.
- **Architecture shape: typed schema, NOT parallel tables.** Package 5 implements `canonical_topics`, `retrieval_clusters`, `scan_targets`, `company_scan_runs`, `signals`, `company_signal_matches`. Not `company_scans` + `company_scan_items` as parallel mirrors of the public schema.
- **Briefing generation: LLM-only.** Package 8 retires the templated `buildBriefingContent` / `buildWhyItMatters` / `buildWhatToWatch` helpers in favor of a single OpenAI call per company per day. The existing `/api/company-briefings/submit` endpoint stays for potential future external generator use but is not the primary path.
- **Test bypass: retired in Package 7.** `TEST_COMPANY_OWNER_ID` hardcoded in `tier-enforcement.ts` stays until Package 7 (entitlement work). Don't touch tier-enforcement in earlier packages unless strictly necessary.

---

## Email + dashboard design rules

- **Email = clean signals only.** Headline + 2-sentence summary per signal. Nothing else. NO match tags inline. NO why-matched text in the email body.
- **Email footer can include:** one subtle "View reasoning on dashboard →" link. One link total, not per-item.
- **Dashboard = where detail lives.** Each signal expands to show why-matched breakdown, source URLs, alias matches, region/theme/entity overlaps.
- **Dashboard transparency tab:** separate section showing "what was checked today" across languages and regions. Highlights early/obscure finds that didn't appear in mainstream English-language coverage.
- **Briefing length: 2–5 minute read.** 4–6 signals per customer per day typical. Quality over volume.
- **Regional framing (2–3 per briefing when interesting):** optional bottom section showing how different regions framed the same story. "Washington calls X a pause. Beijing calls it a delay." Not every briefing needs it.
- **Multi-language scanning is a core moat.** The company scan MUST support non-English sources. Package 3 surfaces language diversity in the coverage layer.

---

## Build plan (8 packages, sequential)

Each package is a separate Claude Code session. Each commits to the `company-build` feature branch on its own. `main` stays untouched until final merge at end.

**Package 1 — Pipeline run tracking fix + schema hygiene.** Small cleanup. Fix the existing `pipeline_runs` table that's stuck at `status='running'` for all historical rows. Move `stripe-migration.sql` and `supabase-setup.sql` from repo root into `supabase/migrations/` with proper timestamps. Existing pipeline tracking gets fixed; company-pipeline tracking will be added in Package 5.

**Package 2 — Why-matched explainability.** Add match reasons as first-class stored data. Structured `match_reasons` field on `company_story_scores` (or its successor table in Package 5). Surface in dashboard per-signal expansion. Email stays clean — footer link only.

**Package 3 — Transparency / coverage layer.** "What was checked today, what moved, what didn't." Dashboard section. Surfaces multi-language source diversity. Highlights early/obscure finds.

**Package 4 — Canonical topic / entity registry + alias system.** Build `canonical_topics`, `canonical_topic_aliases`, `company_canonical_mappings`. Migrate raw string arrays from company_profiles into canonical references. "North Korea" / "DPRK" / "Pyongyang" / "Kim Jong Un" behave as one canonical cluster.

**Package 5 — Company scan pipeline separation.** Independent scan engine and typed tables for companies. Zero cross-reads with public pool. Signals as the data unit. New tables: `retrieval_clusters`, `scan_targets`, `company_scan_runs`, `signals`, `company_signal_matches`.

**Package 6 — Union watch graph + retrieval expansion.** Aggregate company demand generates the daily retrieval target bundle. Company scan reads this bundle. No per-company brute-force scans; shared clusters drive the actual retrieval.

**Package 7 — Entitlement activation + end-to-end launch test.** Stripe wiring completion. Auto-trial assignment (7 days) on onboarding. Preview-on-signup briefing. Retire `TEST_COMPANY_OWNER_ID` bypass. Fresh signup → onboarding → first briefing → email delivery tested end-to-end.

**Package 8 — Briefing content design + tone + template.** Last. Retire templated briefing helpers. Build OpenAI-based generation prompt. Iterate on tone and density using real signals from live scans. Ship the final briefing format.

---

## Current state of the codebase (as of Package 1 start)

- Phases 1–6 of `MEMBERSHIP-BUILD-SPEC.md` are partially built.
- 3 company profiles onboarded (Evidence & Echoes Genealogy, Lindell Media, Test Company).
- 8 users total in profiles table. All `subscription_status = null` (entitlement not yet activated — handled in Package 7).
- 5 company briefings generated, 3 delivered via Resend email.
- 104 `company_story_scores` rows exist.
- Pipeline runs 10 times recorded, all stuck at `status='running'` (Package 1 fixes this).
- `stripe-migration.sql` and `supabase-setup.sql` live at repo root, NOT in `supabase/migrations/` (Package 1 moves them).
- Existing company briefing pipeline reads from the PUBLIC scan pool (`scans`, `scan_items`, `pgi_story_scores`, `gai_story_scores`). Package 5 ends this cross-read.
- `TEST_COMPANY_OWNER_ID` hardcoded bypass in `tier-enforcement.ts`. Retired in Package 7.
- Briefing content is template-generated via `buildBriefingContent` helpers. `/api/company-briefings/submit` endpoint exists for external LLM-generated payloads but isn't the primary path. Package 8 switches to LLM-only.
- Match reasons are reconstructed at render time in 3 different places. Package 2 persists them as first-class data.
- No canonical entity registry exists. Matching is substring overlap on raw strings. Package 4 fixes this.

---

## Workflow rules

- **Branch:** `company-build`. All work commits to this branch. Package 1 creates it. Never commit to `main` until the final merge at end of Package 7 (or end of Package 8 — decide at time).
- **One work package per Claude Code session.** Each session starts with "read `docs/company-build-brief.md` first." Then executes its package. Then commits and pushes. Then stops.
- **Commit messages follow this pattern:** `pkg N: <short description>`. Examples: `pkg 1: fix pipeline_runs tracking + move migrations`, `pkg 2: why-matched first-class storage`.
- **No tests run against live Supabase schema unless explicitly requested.** Schema changes to production are manual and intentional. Claude Code never runs migrations against the live DB as a side-effect.
- **Discovery before building.** Any new Claude Code session must confirm it's on `company-build` branch before writing code.
- **Report at end of each package:** what changed (files), what was verified (tests/runs), what the user needs to do on the old laptop (if anything — usually nothing until Package 7).

---

## What Claude Code should NOT do

- Don't build a parallel product stack. Extend the existing system.
- Don't create separate deployments, separate databases, or separate repos.
- Don't invent files that don't exist. If a file isn't where expected, say so.
- Don't re-run migrations against live Supabase without explicit instruction.
- Don't skip the `docs/company-build-brief.md` read at the start of each session.
- Don't merge to `main` without explicit instruction.
- Don't implement work outside the current package's scope. If you see something that should be fixed in a later package, note it in the report. Don't fix it now.
- Don't over-engineer. V1 over elegance.

---

## Business context (for reference, not implementation)

- Pricing tiers: Pro $39/mo, Team $79/mo, Company Intelligence $159/mo, Enterprise custom.
- Per-company monthly cost estimated $5–15 at v1, dropping to $3–8 as clustering kicks in.
- Margin is healthy at all paid tiers.
- First paying customer unknown — build for generic onboarding. Don't optimise for any specific industry.
- Target launch readiness: ~2 week window, quality-first, no rush.
- Multi-language scanning is a real product moat vs Bloomberg/Reuters/generic newsletters.
- Public site is free (drives subscribers). Company product is paid.

---

## Open questions to revisit later

- Per-company cost at scale — re-audit after Package 6 when retrieval clustering is live.
- Whether to add a 4th daily scan to tighten briefing freshness for overseas customers (revisit post-launch).
- Weekly summary briefing (Phase 7 of original spec, may fold into Package 8 or stay post-launch).
- Audio briefings, Slack/Teams delivery, scenario mode — all future phases, not in this build.

---

## End of brief

If reading this doc in a Claude Code session: the next step is to confirm you've internalized it, then ask for the current work package prompt. Do not start writing code until the current package instructions are provided.

---

## Appendix: Questions Claude Code raised during initial audit (resolved)

During the context-loading audit before Package 1 started, Claude Code raised 5 questions about the plan. All have been answered. Recorded here so future sessions don't re-ask.

### Q1 — Package 1 scope
**Question:** Does Package 1 (a) fix tracking in the existing public pipeline, or (b) add new company-pipeline-specific tracking that gets wired up in Package 5?

**Answer:** (a). Fix the existing `pipeline_runs` table so historical runs reflect reality. Company-pipeline-specific tracking is added later in Package 5 when the separate company scan pipeline is built.

### Q2 — Package 4 vs Package 5 sequencing
**Question:** Should canonical registry (Package 4) land before pipeline separation (Package 5)?

**Answer:** Yes. Order stays 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Canonical registry lands first so Package 5's scoring uses the registry from day one.

### Q3 — Public vs company separation depth
**Question:** For Package 5, do we build parallel tables or a typed schema?

**Answer:** Typed schema. Package 5 implements: canonical_topics, retrieval_clusters, scan_targets, company_scan_runs, signals, company_signal_matches. Data unit is "signals" (discrete atomic business-relevant changes), not "stories."

### Q4 — Briefing generation path
**Question:** Keep the templated briefing helpers or switch to LLM?

**Answer:** LLM-only in Package 8. Retire buildBriefingContent / buildWhyItMatters / buildWhatToWatch. Switch to OpenAI-based generation. The /api/company-briefings/submit endpoint stays available but is not the primary path.

### Q5 — TEST_COMPANY_OWNER_ID
**Question:** Retire the hardcoded bypass early or wait for Package 7?

**Answer:** Wait for Package 7. Don't touch tier-enforcement.ts in Packages 1-6 unless strictly necessary.

---

## Appendix: Surprises found during initial audit (for reference)

- Shared-pool assumption everywhere. loadScanItems, loadVerifiedScanItems, requireStoryScores, scan-loader, scan-parser, and all company-briefing API routes read from public tables directly. No table parameterisation. Package 5 will need to introduce a pool/tenant argument or fork dedicated loadCompanyScanItems paths.

- pipeline_runs tracking is completely broken. All rows in production have status='running' and zero counts. Package 1 fixes this.

- scan-parser.ts has a hardcoded non-portable filesystem path. Guarded by fs.existsSync so it falls through to Supabase in prod, but worth knowing.

- Two divergent briefing content paths exist: the pipeline script templates locally, and /api/company-briefings/submit expects external LLM output. Package 8 consolidates on LLM-only.

- Why-matched is not persisted. Human-readable match tags are reconstructed at render time in 3 different places. Package 2 establishes a single source of truth.

- Watchlist matching is substring overlap on tags + headline. No canonical entity registry yet. Package 4 fixes this.

- company_story_scores unique key couples company scoring to a public scan_date. Revisit in Package 5 when company scans run on their own cadence.

- No is_test_account column on profiles. TEST_COMPANY_OWNER_ID in tier-enforcement.ts is the current workaround. Package 7 adds the column.

- scans_v2 table exists (migration 00002) but is unused. Ignore unless a cleanup package specifically targets it.

- **Canonical self-organisation (post Package 8).** Today the registry auto-creates new canonicals from user input but doesn't link related ones. A future package should add co-occurrence learning (companies tracking X also track Y → propose alias) or LLM clustering, with confidence thresholds and optional human review before auto-merge. Real product moat. Best done once there's enough usage data — probably after 20–50 active companies. Architecture supports this today; just needs the learning layer.

- **Canonical ambiguity tiebreaker (~20 profiles).** When a raw value matches multiple canonicals, fall back to type-priority instead of skipping. Watchlist_entities → prefer entity over route over region. Supply_chain_exposure → prefer commodity over theme. Cheap, deterministic, fixes ~80% of skipped values without LLM cost. ~30 min Claude Code work.
- **Multi-language alias auto-extraction.** When the resolver creates a new canonical, optionally call OpenAI to suggest translations and common abbreviations to seed the alias table. Costs ~$0.001 per new canonical. Massively boosts multi-language coverage without manual seeding. Best wired in alongside Package 8's LLM work.

## Pre-merge integration check (deferred)

Before merging `company-build` → `main` (end of Package 7 or 8), and before openclaw `git pull`s the merged main:

1. Send a discovery prompt to Claude Code on the merged branch covering: shared files (`relevance-engine.ts`, `scan-parser.ts`, `pipeline-db.ts`, email templates), schema changes that landed on main during the company build, any cron entries on openclaw pointing at deprecated scripts.
2. Get a full integration report. Resolve conflicts before going live.
3. Only then `git pull` on openclaw.

The public article rebuild is happening on a separate branch during the company build. Both rejoin main at the end. Coordinated check at that point.
