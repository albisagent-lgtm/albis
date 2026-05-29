# Albis Live Signals MVP Build Spec

Date: 2026-05-30  
Status: Build-ready MVP spec  
Owner: Albis / Light Tree  
Product principle: **Albis scans globally. Humans verify locally. Albis connects the two.**

---

## 1. What We Are Building

Albis is becoming an interactive news intelligence platform.

The primary public product should not be only long articles. It should be a live, mobile-friendly feed of compact verified story reports — **Signals** — each connected to:

1. A short verified report card.
2. A full Albis article/report for depth.
3. A simple human context layer where readers can share what they are seeing from where they are.

This creates a loop:

> Albis scans globally → publishes a verified Signal → publishes/links the full report → people add local context → Albis can update the living story.

The social layer should not feel like noisy comments or punditry. It should feel like cooperative reporting: people sharing local observations, sources, corrections, and context so the story becomes clearer.

---

## 2. Product Philosophy

### Core idea

**Albis reports what is known. People share what they are seeing. Together, the story becomes clearer.**

### What this is

- A trustworthy, compact, interactive news feed.
- A bridge between AI-assisted global scanning and human local context.
- A calm reporting surface for truth, clarity, light, and respect.
- A place where readers can contribute without needing to write essays.

### What this is not

- Not Twitter/X.
- Not a generic comment section.
- Not a debate forum.
- Not a clout/ranking/upvote system.
- Not a replacement for verified reporting.

### Tone

Use plain, respectful language.

Avoid over-branding the feature. Externally, this is simply **Albis**. Internally we can call the compact report object a `Signal`.

Preferred public language:

- “Today on Albis”
- “Live on Albis”
- “What people are seeing”
- “What are you seeing from where you are?”
- “Read the full report”

Avoid heavy/gimmicky language unless tested:

- “Field Notes”
- “Citizen journalism”
- “Social network”
- “The Signal” as a standalone product brand

---

## 3. User Experience

### 3.1 Main `/signals` page

A mobile-first feed/grid of Signal cards.

Desktop:

- 3 cards across where space allows.
- Responsive grid: 1 column mobile, 2 tablet, 3 desktop.
- Category filters across top.

Mobile web:

- Vertical scroll feed.
- Each card reads quickly.
- Tap opens the signal detail page.

Page title options:

- “Today on Albis”
- “Live on Albis”
- “Signals” internally, but visible copy should make clear this is the main Albis feed.

Each card includes:

- Category pill.
- Region/location line.
- Headline.
- 3–5 bullet summary preview.
- “Still unclear” preview if present.
- Updated timestamp.
- Context/comment count.
- Link/button: “Open signal”.
- Secondary link: “Read full report” if full article exists.

### 3.2 Signal detail page `/signals/[slug]`

Structure:

1. **Quick Signal**
   - Headline.
   - Category/region.
   - Last updated.
   - Verified bullets, usually 4–6.
   - “Still unclear” line.
   - Source note / linked report note if useful.

2. **Full report link**
   - Button: “Read the full report”.
   - Link to existing article canonical route, e.g. `/life-systems/turins-blackouts...`.

3. **What people are seeing**
   - Reuse Article Conversations V1 comment system.
   - Prompt should be simple:
     > What are you seeing from where you are?
   - Helper line:
     > Share a local update, source, correction, or context.

4. **Context feed**
   - Existing comments rendered underneath.
   - Later we can label contributions by type, but not required for MVP.

### 3.3 Article pages

Article pages should also expose the Signal near the top or between article header and content:

- Compact “Quick Signal” box.
- “Join the conversation” / “What are you seeing?” link to associated signal page.

For MVP, this can be a simple link or embedded box.

### 3.4 Homepage module

Add a homepage section:

- Heading: “Live on Albis” or “Today on Albis”.
- Shows latest 3–6 Signals.
- Link to `/signals`.

This makes the interactive feed visible immediately.

---

## 4. Content Model

Every published article should automatically produce a Signal.

### Signal fields

Recommended Supabase table: `public.signals`.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `slug text unique not null`
- `article_slug text`
- `article_url text`
- `title text not null`
- `summary text`
- `bullets text[] not null default '{}'`
- `still_unclear text`
- `category text`
- `region text`
- `tags text[] not null default '{}'`
- `source_note text`
- `status text not null default 'published' check in ('draft','published','archived')`
- `priority integer default 0`
- `comment_count integer default 0`
- `last_activity_at timestamptz`
- `published_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `metadata jsonb not null default '{}'::jsonb`

Indexes:

- `signals(status, published_at desc)`
- `signals(category, published_at desc)`
- `signals(article_slug)`
- `signals(last_activity_at desc)`

RLS:

- Public can read `status = 'published'`.
- Writes handled by service role / internal API / cron pipeline only.

### Why Supabase table, not just article frontmatter?

Frontmatter is simpler, but Signals are the future product surface:

- They need live feed queries.
- They need comment/context counts.
- They may update independently from articles.
- They may eventually support user reports, moderation, and event updates.
- They should be accessible to homepage and feed without parsing every article file.

So MVP should use Supabase `signals` table.

---

## 5. Signal Generation Rules

The Signal should be automatically generated from the article packet/research layer inside `scripts/run-post-scan-pipeline.ts`.

For every successfully published article:

1. Build the full article as normal.
2. Generate Signal fields from the article packet, article signals, research, and editorial result.
3. Upsert into `public.signals`.
4. Store `signal` metadata in article frontmatter/Supabase article row if useful.

### Signal copy requirements

A Signal must be:

- Short.
- Verified.
- Concrete.
- Not essay-like.
- Not “why it matters” language.
- No dramatic framing.
- No unsupported claims.

### Signal bullet format

4–6 bullets, usually one sentence each.

Example:

- Turin saw repeated power outages during Italy’s first heatwave of the year.
- Traffic lights failed in some districts.
- Iren says heat put cables under thermal stress.
- The city says its older grid needs more maintenance.
- Iren has a €515m upgrade plan running through 2030.
- Open question: whether other older European city grids face similar early-summer stress.

### Prompt/output rule

If using an editorial model for Signals, request strict JSON:

```json
{
  "title": "A 32°C heatwave exposed Turin’s old power grid",
  "summary": "Repeated outages hit Turin during Italy’s first heatwave of the year, showing how older local grids can struggle when heat and cooling demand arrive early.",
  "bullets": [
    "Turin saw repeated power outages during Italy’s first heatwave of the year.",
    "Traffic lights failed in some districts.",
    "Iren says heat put cables under thermal stress.",
    "The city says its older grid needs more maintenance.",
    "Iren has a €515m upgrade plan running through 2030."
  ],
  "still_unclear": "Whether other older European city grids face similar early-summer stress."
}
```

Validation:

- Title max: 120 chars.
- Summary max: 260 chars.
- Bullets: 3–6.
- Bullet max: 180 chars.
- Still unclear max: 220 chars.
- Must not contain banned scaffolding:
  - “why it matters”
  - “that is why”
  - “the deeper signal”
  - “this is more than”
  - “the headline is about”
  - “for Albis”

Fallback:

- If model fails, build deterministic bullets from `articleSignals.coreFact`, `keyNumber`, `mainActors`, `primaryLocation`, `mechanism`, and `connection`.
- If fallback cannot make at least 3 concrete bullets, skip Signal creation and log warning. Do not block article publication initially unless we decide Signals are mandatory.

MVP recommendation: Signals should be generated for all articles, but failure should warn rather than block for the first launch week.

---

## 6. Cron / Automation Integration

This must be automatic from the existing scan/article crons.

Existing flow:

> Global scan cron → article writer cron → article saved/published

New flow:

> Global scan cron → article writer cron → article saved/published → Signal generated/upserted → `/signals` feed updates automatically

### Files likely involved

- `scripts/run-post-scan-pipeline.ts`
- `src/lib/public-article-editorial-writer.ts`
- new `src/lib/public-signal-generator.ts`
- new `src/lib/signals.ts`
- new migration `supabase/migrations/YYYYMMDD_create_signals.sql`

### Cron requirements

No new cron required for initial MVP if signal generation is integrated into `run-post-scan-pipeline.ts`.

Existing article cycles already run after scan cycles. Signal creation should happen during each article cycle.

Later optional cron:

- `refresh-signal-activity` every 10–30 minutes:
  - update `comment_count` from `article_comments`
  - update `last_activity_at`
  - surface active stories

For MVP, we can compute comment counts at query time or maintain counts lazily.

### Logging

Article pipeline should log:

- signal created/upserted
- signal skipped + reason
- signal validation warning
- signal slug/article slug

Example log:

```txt
✅ Signal upserted: turins-blackouts-show-what-heat-does-to-an-old-city-grid-2026
⚠️ Signal skipped: only 2 concrete bullets generated
```

---

## 7. Routes and Components

### New routes

- `src/app/signals/page.tsx`
- `src/app/signals/[slug]/page.tsx`

### New components

- `src/app/components/signal-card.tsx`
- `src/app/components/signal-feed.tsx`
- `src/app/components/quick-signal.tsx`
- Optional: `src/app/components/home-live-signals.tsx`

### Data helpers

- `src/lib/signals.ts`

Functions:

- `getSignals({ limit, category })`
- `getSignalBySlug(slug)`
- `getLatestSignals(limit)`
- `upsertSignalFromArticle(...)` or server-side equivalent used by pipeline

### API routes

MVP can avoid public mutation APIs for Signals.

Possible read API later:

- `GET /api/signals`
- `GET /api/signals/[slug]`

For initial Next app routes, server components can query Supabase directly.

---

## 8. Comments / Human Context Layer

Article Conversations V1 already exists:

- `article_comments` table
- `/api/comments`
- `ArticleComments` component
- anonymous/guest comments allowed
- optional logged-in identity
- usernames added via Supabase Auth metadata
- rate limiting by IP hash
- basic spam heuristics
- one-level replies
- status: visible/pending/hidden

### MVP reuse

For signal detail pages, reuse the comments system by passing the associated article slug or signal slug.

Recommendation:

- For now, use `article_slug` as the thread id, so article and Signal share one conversation.
- This keeps the discussion unified.

Later, if needed, extend `article_comments` to support `thread_type` and `thread_slug`.

### UI wording changes

For signal pages, do not call it “comments.”

Use:

- Section title: “What people are seeing”
- Prompt: “What are you seeing from where you are?”
- Helper: “Share a local update, source, correction, or context.”

Need to make `ArticleComments` accept optional copy props:

```ts
<ArticleComments
  articleSlug={signal.article_slug}
  title="What people are seeing"
  prompt="What are you seeing from where you are?"
  helper="Share a local update, source, correction, or context."
/>
```

---

## 9. User Accounts / Identity

Already active:

- `/register`
- `/login`
- `/account`
- free/basic account status
- article comments can use signed-in identity
- usernames added to auth metadata

MVP requirements:

- Users can comment as guests.
- Users can create a free account.
- Users can choose/edit a username.
- Signed-in comments prefer `@username` as display identity.

Do not require account creation to contribute at launch. Guest contribution keeps friction low.

---

## 10. Moderation, Human Trust, and Verification

Reader context is valuable only if the page makes clear what is verified, what is reader-reported, and what has been corroborated.

The trust system should not become clout-chasing. Avoid likes/upvotes as the primary mechanic. Use verification language instead.

### MVP moderation

- Existing spam heuristics.
- URL-heavy comments go pending.
- Spam terms go pending.
- Rate limit by IP hash.
- One-level replies only.

### Human trust layer — required product direction

For comments/reports from people, the UI should eventually show a calm status:

- **Reader report** — default; visible but not verified by Albis.
- **Supported by source** — user included a useful link/source.
- **Locally corroborated** — multiple readers independently report similar details.
- **Verified by Albis** — reviewed by Albis/editorial process.
- **Correction / disputed** — flagged or corrected.

The purpose is not to rank people. The purpose is to help readers understand confidence.

Preferred public language:

- “Reader report”
- “Supported by source”
- “Corroborated”
- “Verified by Albis”
- “Needs checking”

Avoid:

- likes
- popularity scores
- viral ranking
- aggressive “fake news” wording
- turning verification into a game

### MVP implementation recommendation

For the first MVP, do not build the whole trust system unless it is quick. But design the data model so it can be added cleanly.

If modifying `article_comments` is in scope, add nullable fields:

- `context_type text` — optional later values: `local_update`, `source`, `correction`, `question`, `context`.
- `trust_status text default 'reader_report'` — values: `reader_report`, `supported_by_source`, `corroborated`, `verified_by_albis`, `needs_checking`, `disputed`.
- `source_url text` — optional source link if user provides one later.
- `verified_at timestamptz`.
- `verified_by uuid references auth.users(id)` nullable.

If migration scope is too much for MVP, at least keep the UI/components structured so comment cards can later display a trust badge.

### Reader confirmation feature

A later lightweight interaction can let readers say:

- “I saw this too”
- “This matches local reporting”
- “This seems incorrect”

This should not display as a popularity count at first. It can feed moderation/trust calculations behind the scenes.

Possible future table:

`public.comment_confirmations`

- `id uuid primary key`
- `comment_id uuid references article_comments(id) on delete cascade`
- `user_id uuid references auth.users(id) on delete cascade`
- `confirmation_type text check in ('saw_this_too','source_matches','seems_incorrect')`
- `created_at timestamptz default now()`
- unique `(comment_id, user_id, confirmation_type)`

Use this later to surface “corroborated” without creating a noisy like/upvote culture.

### Still needed soon

- Admin moderation view for pending/hidden comments.
- Report comment button.
- Ability to feature useful context.
- Basic trust badge display on comments.

### Labels later

Do not complicate the first input form. Later we can classify or let users choose:

- Local update
- Source
- Correction
- Question
- Context

For MVP, avoid extra required fields.

---

## 11. UX Copy

### `/signals` page intro

Option A:

> Albis scans the world and turns important stories into short verified reports. Read the signal, open the full report, and share what you’re seeing from where you are.

Option B:

> A live feed of verified story reports from Albis. Each one links to the full report and invites local context from readers.

Preferred shorter copy:

> Short verified reports from Albis, with space for people to share what they’re seeing from where they are.

### Detail page prompt

> What are you seeing from where you are?

Helper:

> Share a local update, source, correction, or context.

### Empty state

> No one has added context yet. If you’re close to this story, you can help clarify it.

### Homepage module

Heading:

> Live on Albis

Subheading:

> Short verified reports, linked to full articles and reader context.

Button:

> View all

---

## 12. Implementation Steps

### Step 1 — Database migration

Create `public.signals` table.

Migration file:

- `supabase/migrations/YYYYMMDD_create_signals.sql`

Include RLS public read policy.

### Step 2 — Data helper

Create `src/lib/signals.ts`:

- Supabase query helpers.
- Slug lookup.
- Article URL/category route helper.
- Optional comment count join or separate count query.

### Step 3 — Signal generation library

Create `src/lib/public-signal-generator.ts`:

- Builds signal JSON from article packet/research/body.
- Has validation and banned phrase checks.
- Has deterministic fallback.

### Step 4 — Pipeline integration

Modify `scripts/run-post-scan-pipeline.ts`:

- After article upsert succeeds, call signal generator/upsert.
- Store Signal metadata into article frontmatter or `frontmatter.signal` if practical.
- Log success/failure.

### Step 5 — UI components

Create:

- `SignalCard`
- `QuickSignal`
- `SignalFeed`

### Step 6 — Routes

Create:

- `/signals`
- `/signals/[slug]`

### Step 7 — Homepage module

Add latest Signals to homepage.

Need inspect homepage structure before implementation. Likely `src/app/page.tsx`.

### Step 8 — Comments copy props

Update `ArticleComments` to accept copy props:

- eyebrow/title
- prompt
- helper
- empty state

Use signal copy on `/signals/[slug]`.

### Step 9 — Test seed/backfill

Need existing articles to have Signals immediately.

Build a backfill script:

- `scripts/backfill-signals-from-articles.ts`

For last 20–50 articles:

- Read Supabase `articles` rows.
- Generate Signals from `title`, `description`, `content`, `frontmatter.researched_article_layer`, `category`, `tags`.
- Upsert into `signals`.

MVP can start with latest 10 if token/model cost is concern.

### Step 10 — Verification

Run:

- `npx tsc --noEmit`
- `npm run build`
- optional local page check if dev server practical
- API/Supabase table check
- live deploy via GitHub Actions
- fetch `/signals`
- fetch one `/signals/[slug]`
- fetch comments API for associated article slug

---

## 13. Launch Scope

### Must have for MVP launch

- Signals table.
- Automatic Signal creation during article pipeline.
- `/signals` feed page.
- `/signals/[slug]` detail page.
- Link to full report.
- Reused comments/context box.
- Homepage latest Signals module.
- Backfill latest 10–20 Signals.
- Build passes.
- Deploy succeeds.

### Nice to have, not required for MVP

- Moderation dashboard.
- Comment report button.
- Featured reader context.
- Signal update history.
- User contribution profiles.
- Location field.
- Type labels.
- Native mobile app.

---

## 14. Risks and Guardrails

### Risk: low-quality comments

Guardrail:

- Keep input calm and purposeful.
- No likes/upvotes.
- Rate limit.
- Spam pending.
- Add report/moderation soon.

### Risk: Signals become shallow headlines

Guardrail:

- Signals must be verified bullets from article/research data.
- No unsupported speculation.
- No “why it matters” essay language.
- Full article remains linked.

### Risk: automatic generation publishes bad summaries

Guardrail:

- Validation checks.
- Banned phrase checks.
- Log skipped Signals.
- Initially warn rather than block, then tighten after review.

### Risk: too many article cards clutter feed

Guardrail:

- Filter by `status='published'` and `priority`.
- Show latest/important first.
- Category filters.
- Later: editorial ranking.

### Risk: user reports treated as verified

Guardrail:

- Keep user context visually separate from verified Signal.
- Use language: “What people are seeing,” not “confirmed updates.”
- Later add featured/verified context labels.

---

## 15. Example: Turin Signal Page

### Signal Card

**A 32°C heatwave exposed Turin’s old power grid**  
Life Systems · Italy

- Turin saw repeated power outages during Italy’s first heatwave of the year.
- Traffic lights failed in some districts.
- Iren says heat put cables under thermal stress.
- The city says its older grid needs more maintenance.
- Iren has a €515m upgrade plan running through 2030.

Still unclear: whether other older European city grids face similar early-summer stress.

Buttons:

- Open signal
- Read full report

### Detail Page

Top:

- Same Signal.
- Link to full report.

Context prompt:

> What are you seeing from where you are?

Helper:

> Share a local update, source, correction, or context.

---

## 16. Recommended Build Strategy

This is a medium-sized feature touching database, pipeline, and UI.

Recommended approach:

1. Main assistant writes this spec.
2. Spawn a coding sub-agent with this spec and explicit scope.
3. Main assistant reviews diff, runs tests/build, commits, deploys.

Reason:

- Sub-agent can implement the mechanical files.
- Main assistant preserves product judgment and checks against the mission/style.

### Sub-agent task summary

> Build Albis Live Signals MVP per `docs/albis-live-signals-mvp-build.md`. Use Supabase `signals` table, automatic generation from `run-post-scan-pipeline.ts`, `/signals` feed, `/signals/[slug]` detail page, homepage module, ArticleComments copy props, and backfill latest articles. Keep scope MVP, no likes/upvotes/followers. Run `npx tsc --noEmit` and `npm run build`; report blockers without committing unless asked.

---

## 17. Definition of Done

MVP is done when:

- `/signals` exists and shows real Signal cards from Supabase.
- `/signals/[slug]` shows a Quick Signal, full report link, and context box.
- New articles automatically create/update Signals from cron pipeline.
- Latest Signals appear on homepage.
- Existing article comments system works underneath Signal pages.
- Users can read quickly and respond without reading full article first.
- Build/typecheck pass.
- Deploy succeeds.
- At least 10 existing Signals are backfilled live.

---

## 18. Product North Star

Albis should feel like a living, trustworthy picture of the world:

> Short verified reports.  
> Full context when needed.  
> Human observations from the ground.  
> Calm updates as the picture becomes clearer.

This is how Albis becomes more than a news site.

It becomes a cooperative intelligence layer for truth, light, love, and clarity.
