# Albis Feed Rebuild Spec — 2026-06-04

## Purpose

The homepage/feed is now the core Albis product. It should become a friendly, visual, fast, story-first public feed where everyday people can understand what is happening, add useful context, and keep moving through events without feeling trapped in a technical dashboard.

This rebuild should move Albis away from:

- visible hashtags
- noisy action rows
- right-rail clutter
- analytic/system jargon
- follower-count / ranking culture
- full-page redirects for every card open
- text-only cards
- generic AI-generated bullet sludge

And toward:

- time, attention, and sustained engagement
- calm interaction
- stories people understand
- visual cards
- contextual discussion
- direct media/source contribution
- fast, fluid browsing

---

## Product Philosophy

### 1. Time, not clout

Albis should not copy the social-media ranking model where the biggest account, loudest post, or most hashtagged content wins.

The feed should evolve through **time and attention**:

- what people spend time with
- what people return to
- where conversation slowly gathers
- which cards keep drawing context across hours/days
- which topics become important during different “epochs” of public attention

Avoid visible numeric competition where possible.

### 2. Engagement without gamification

We can measure opens, saves, comments, shares, dwell time, and return visits internally. But the public UI should not over-emphasise numbers.

Prefer language like:

- “Discussion”
- “New context”
- “Active now”
- “Recently opened”
- “Still drawing attention”
- “Quietly rising”

Avoid defaulting to:

- “1.2K views”
- “43 comments”
- “Top ranked”
- “Trending because…”

Numbers can exist internally for signal quality, not as the main social incentive.

### 3. Stories over systems language

Bad current example:

> Space-weather bursts remain a quiet but real infrastructure risk for power and communications systems. Capacity and infrastructure bottleneck is now remapping behaviour underneath the headline.

This is unacceptable for public cards. It reads like generic systems analysis, not a useful story.

Every card should answer:

1. What happened?
2. Why should a normal person care?
3. Who or what could be affected?
4. What is still uncertain?
5. What should we watch next?

Tone: clear, tangible, grounded, human. No vague “systems” filler unless the story truly needs it.

---

## Immediate UI Changes

### A. Remove the right rail from the homepage

Remove the current sticky sidebar containing:

- Mission
- Read/latest articles list
- Daily briefing card

Replace with a small top strip above or near the feed:

> DAILY BRIEFING  
> Keep the feed clean; get the summary by email.  
> [Get the free briefing]  
> Free · Daily · Unsubscribe anytime

This should be compact and not dominate the feed.

### B. Simplify homepage tabs

Primary tabs only:

- Top
- Latest
- Following
- Discussed

Move specialist filters like Weather / Human / AI-reviewed / Saved out of the main top row for now, or hide behind a simple filter affordance later.

### C. Remove visible hashtags from cards

Do not render `#weather`, `#community-watch`, etc. on cards.

Keep tags internally for:

- search
- topic routing
- following
- related-card logic
- internal classification

Visible card labels should be clean pills, max 1–2:

- Event
- People
- Source
- Local update
- Weather
- Science
- Trade
- AI reviewed (subtle, optional)

### D. Clean card actions

Current row is too busy:

- Comment
- Open
- Share
- Save

Target row:

- Primary: Open / Read
- Secondary icon/text: Discussion
- Save icon/button
- Share either icon-only or tucked into card menu

Do not foreground comment counts by default. If comments exist, use subtle non-numeric language:

- “Discussion”
- “New context”
- “Active discussion”

### E. Card open should not redirect by default

Clicking/opening a card should open:

- desktop: right-side drawer / modal panel
- mobile: full-screen overlay

User should be able to:

- read full card/article/source summary
- comment/add context
- see source/media
- close and return to same feed position

Keep direct URLs available for share/open-in-new-tab, but the default feed interaction should preserve place.

### F. Infinite feed / load more

Homepage should not feel like it “ends” after a short batch.

Use a pragmatic hybrid:

- initial batch loads fast
- auto-load more near bottom
- fallback “Load more” button
- preserve performance and avoid giant server renders

---

## Media / Visual Cards

### Current state

Comments support media URLs:

- image URL
- video URL
- YouTube link
- source link

But there is no real upload UI and media does not surface in collapsed feed cards.

### Required changes

1. Add direct upload UI for comments/card context where possible.
   - Users should be able to choose a photo/video from phone/computer.
   - If direct upload is too large for first pass, keep media URL but design the UI so upload can slot in.

2. Feed cards should support `mediaPreview`:
   - article hero image
   - signal/card image
   - YouTube thumbnail/embed marker
   - first attached image/video from context comments
   - source image fallback when available

3. Card visual layout:
   - lead card: larger image/visual
   - normal card: optional thumbnail or top image strip
   - media badge: Photo / Video / Source

Goal: the feed should stop being a sea of words.

---

## Ranking / “Top” Philosophy

Avoid calling this pure ranking. Internally call it something like:

- attention score
- time signal
- sustained attention
- field energy

Public label can remain “Top” for simplicity, but the underlying logic should not become popularity theatre.

### Internal score should eventually use

- freshness / publication time
- unique opens
- dwell time on card/detail panel
- return visits
- saves
- shares
- comments/context added
- source/media attachments
- author/account trust over time
- reports/hides penalty
- decay over time, with resurfacing if attention returns

### Public UI should show qualitative state, not numbers

Examples:

- “New context added”
- “Still drawing attention”
- “Recently discussed”
- “Rising today”
- “Quiet signal”

Do not build public follower-count or view-count culture yet.

---

## Search

Add search as a clear homepage feature.

Users should be able to search:

- topics
- places
- people/accounts
- sources
- story terms
- categories

Start simple:

- top search input above feed
- filters cards client-side or via `/api/feed/cards`
- use tags/categories internally but do not show messy hashtags

---

## Notifications

Raadio PRT posted a people/article card. Ignatius commented asking if they are based in Tallinn.

We need a simple notification system so accounts can see:

- someone replied to your comment
- someone commented on your card
- someone mentioned you
- your card received Albis AI review

### First version

- notification bell in nav/account area
- notifications page or dropdown
- unread dot
- rows with simple copy:
  - “@zinfinite replied to your card”
  - “New context was added to your card”
- clicking opens the relevant card drawer/comment thread

Email notifications can wait.

---

## Writing / Card Quality

This is a pipeline problem, not just UI.

Cards should not be generic AI bullet summaries. They need story logic.

### Feed card format

Collapsed card:

- clean label
- title
- one clear story paragraph, 1–2 sentences max
- optional visual
- one subtle state badge: New context / Source attached / AI reviewed

Opened card:

- what happened
- why it matters
- what we know
- what is unclear
- source/context
- comments/context

### Ban phrases / patterns

Avoid:

- “capacity and infrastructure bottleneck”
- “is remapping behaviour underneath the headline”
- “quiet but real infrastructure risk” unless explained concretely
- repeated bullets
- abstract systems filler
- vague “watch X” without explaining what could happen

### Example rewrite style

Bad:

> A strong X-class solar flare erupts from sunspot region AR4455. Space-weather bursts remain a quiet but real infrastructure risk.

Better:

> A powerful solar flare erupted from sunspot AR4455. Most flares pass without major disruption, but strong bursts can disturb radio signals, satellites, GPS, and power-grid systems — which is why space-weather agencies watch them closely.

---

## Build Order

### Sprint 1 — Local homepage/feed UX cleanup

1. Remove homepage right rail.
2. Add compact daily briefing strip near top.
3. Simplify tabs to Top / Latest / Following / Discussed.
4. Remove visible hashtags from cards.
5. Clean card action row.
6. Add card media preview type support.
7. Add card drawer/overlay for default open behaviour.
8. Add load-more/infinite scrolling scaffold.
9. Add simple search bar.

### Sprint 2 — Interaction depth

1. Add direct media upload or upload-ready UI.
2. Persist saves to account/backend, not just local state.
3. Build in-app notification table/API/UI.
4. Make replies/comments notify card owners/comment authors.
5. Add profile surface for cards/context without public clout counts.

### Sprint 3 — Writing quality pipeline

1. Audit card generation prompts/code.
2. Replace generic systems-language bullets with story-first card generation.
3. Require source-grounded, tangible summaries.
4. Add validation/lint against repeated bullets and banned vague phrases.
5. Improve article/card research depth.

---

## Guardrails

- Do not deploy until reviewed locally.
- Keep changes compatible with current Supabase tables where possible.
- Avoid destructive schema changes without migration review.
- If adding DB tables, create SQL migration file but do not run against production automatically.
- Preserve shareable direct URLs even if drawer becomes default.
- Keep mobile first.
- Performance matters: homepage must feel instant.

---

## Success Criteria

The homepage should feel:

- fast
- calm
- visual
- human
- simple
- alive
- easy to keep browsing

A normal person should understand cards without needing Albis theory.

A contributor should know exactly how to add context, media, or a question.

The feed should guide attention through time, not turn public understanding into a popularity contest.
