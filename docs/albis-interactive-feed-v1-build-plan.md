# Albis Interactive Feed V1 Build Plan

Last updated: 2026-06-02

## 0. Product rule

Albis should provide clear, simple cards. Users decide what to read, comment on, save privately, share, follow, or add.

The interface should do the work. Avoid long explanations, instructional copy, or telling people what to do. Public language should feel like a calm service: here is the event, here is the report, here is the context we have, here is the conversation.

## 1. V1 goal

Turn the Albis homepage from a news-site landing page into the core product: a living feed of clear cards covering Albis reports, articles, weather signals, events, public posts, and independent sourced writing.

The user should instantly understand:

1. What is happening.
2. Why this card is here.
3. What they can do next.

Primary actions:

- Open
- Comment
- Share
- Save privately / bookmark
- Follow
- Create

Non-goal: no public likes, upvotes, reaction buttons, emoji reaction scores, or clout mechanics. Albis measures attention and depth, not reactive approval.

V1 is not a social network clone. It is a calm interactive media layer for understanding the world.

## 2. Experience principles

1. **One card, one clear idea** — no overloaded summaries.
2. **Less copy, more interaction** — buttons and layout explain the product.
3. **Cards are the product** — not just teasers for articles.
4. **Rank content, not people** — avoid public influencer leaderboards.
5. **Attention and depth matter, not reactions** — impressions, opens, dwell/read time, comments, shares, private saves, and follows are useful signals; likes/upvotes/reactions are not part of Albis.
6. **Source/context stays visible** — Albis should not hide provenance.
7. **Weather and local events become repeatable wedges** — practical, verifiable, useful.
8. **Independent journalists get identity and distribution** — profiles, posts, comments, follows.
9. **Comments are community context** — not noisy argument bait.
10. **Simple first, intelligent underneath** — keep the public interface clean even if the backend grows sophisticated.

## 3. Homepage structure

### 3.1 Top-level tabs

V1 homepage tabs:

- **Top** — ranked cards using score + freshness.
- **Latest** — reverse chronological.
- **Discussed** — cards with active comments/replies.
- **Weather** — city/weather/event cards.
- **Following** — followed people, topics, sources, regions.
- **Saved** — cards saved by the signed-in user.

Implementation note: if user accounts/saves/follows are not fully active yet, Following/Saved can show a clean empty state and auth CTA, but the tabs should not over-explain.

### 3.2 Main layout

Desktop:

- Main feed column.
- Light right rail for latest articles/briefing/account CTA.

Mobile:

- Feed first.
- Sticky bottom nav already exists; keep it simple.

### 3.3 Top composer

A compact create entry near the feed:

- Placeholder: `Post an update, link, or note`
- Button: `Create`

Click opens `/create`.

Do not use long copy explaining community media.

## 4. Card model

### 4.1 Card types

V1 card types:

1. **Albis article**
   - Published article/depth piece.
2. **Albis signal/event**
   - Compact report generated from scans or events.
3. **Weather city/event card**
   - Official weather + media signal + local context thread.
4. **User post**
   - Short update/note/link.
5. **Independent article/post**
   - Longer writing from a creator/journalist.
6. **Research/source card**
   - Study, report, dataset, official source.

### 4.2 Required card fields

Every card should have:

- stable `card_id`
- `type`
- title
- short summary/context
- source/person/author
- category/topic
- optional location/region
- published/updated timestamp or report date
- canonical URL
- comment thread id
- engagement counts
- ranking score
- moderation status

### 4.3 Card visual pattern

Each card shows:

- small label/category
- title
- concise context
- source/person line
- date/report date
- interaction row

Interaction row V1:

- Open
- Comment
- Share
- Save / bookmark privately
- Follow/source/topic later

Do not add Like, Upvote, emoji reaction, applause, or public popularity buttons.

Avoid too many visible actions. Use overflow later if needed.

## 5. Engagement and ranking

### 5.1 Events to track

Track public product events in a dedicated table/API:

- impression
- open/click
- full read / dwell threshold
- comment
- private save/bookmark
- unsave
- share
- follow
- unfollow
- hide
- report

Do not track likes/upvotes/reactions because those would push Albis toward reactive social mechanics.

Minimum V1 events:

- impression
- open
- dwell/read time later
- comment
- private save/bookmark
- share
- follow
- hide/report later

### 5.2 Why not pure clicks

Clicks show curiosity, but pure click ranking creates clickbait. V1 should use clicks as one attention signal, with depth signals weighted more heavily.

Signal meaning:

- Impression = reach/visibility
- Open = interest
- Dwell/read time = depth
- Comment = engagement/context
- Private save/bookmark = personal value
- Share = relevance
- Follow = long-term trust
- Hide/report = negative signal

No signal should behave like a public reaction score.

### 5.3 Simple V1 score

Initial formula:

```txt
engagement =
  1.0 * log(1 + unique_opens)
+ 2.0 * log(1 + comments)
+ 1.0 * log(1 + impressions) capped
+ 1.5 * normalized_dwell_time
+ 2.5 * log(1 + private_saves)
+ 3.0 * log(1 + shares)
+ 2.0 * log(1 + follows_from_card)
- 4.0 * log(1 + hides)
- 6.0 * log(1 + reports)

freshness = 1 / ((age_hours + 2) ^ 1.15)

final_score = freshness * (engagement + editorial_boost + source_quality_boost)
```

V1 defaults:

- `editorial_boost`: 0 unless manually set.
- `source_quality_boost`: 0 initially; add later for trusted sources/verified creators.
- Cap any single signal so one viral action cannot dominate the whole feed.

### 5.4 Feed tab logic

- **Top:** final_score desc.
- **Latest:** published_at desc.
- **Discussed:** comments/replies + recent activity.
- **Weather:** weather/event cards, ranked by recency + status.
- **Following:** followed people/topics/sources once auth is active.
- **Saved:** private bookmarked cards for signed-in user.

## 6. Comments/community layer

### 6.1 V1 behavior

Every card should have a comment thread.

Comment field should be simple:

- placeholder: `Add a comment…`
- optional source URL field later.

Avoid instructive labels like “What to check locally.”

### 6.2 Comment types later

Useful internal categories:

- comment
- local update
- source
- correction
- question

These can stay mostly internal at first. Public UI should remain natural.

### 6.3 Moderation basics

V1 needs:

- rate limiting
- pending/visible/hidden status
- report path later
- service-role writes only through API

Existing `article_comments` table can be reused short-term for card comments if `article_slug` becomes a generic `thread_slug` concept. Longer term rename/migrate to `card_comments` or add a dedicated `card_comments` table.

## 7. Create/post flow

### 7.1 V1 create types

`/create` should support:

- Update / note
- Link
- Article
- Weather/local context
- Research/source

### 7.2 Simple fields

Minimum fields:

- title
- text/context
- optional link/source URL
- category/type
- optional location
- optional image later

### 7.3 Publish states

V1 states:

- draft
- pending_review
- published
- hidden

Early public posts should default to `pending_review` unless user is trusted/admin.

### 7.4 Independent journalist path

Creators/journalists should be able to:

- create a profile
- post sourced cards/articles
- receive comments
- be followed
- build a portfolio of posts

Verification/badges can come later.

## 8. Profiles/account identity

### 8.1 Profile fields

V1 profile fields:

- user id
- display name
- username/handle
- avatar URL
- bio
- optional location
- links/socials
- topics/beats
- created_at
- updated_at

### 8.2 Profile page sections

- Posts
- Comments
- Saved
- Following
- About/bio

### 8.3 Creator/journalist fields later

- beat/topics
- publication/organisation
- verification status
- credentials/context note
- recent work
- follower count

Do not make follower count the main public status signal early.

## 9. Database/backend plan

### 9.1 Tables

Recommended V1 tables/migrations:

#### `public.feed_cards`

Canonical store for cards that are not just static blog files.

Fields:

- id uuid pk
- slug text unique
- type text
- title text
- summary text
- body text
- source_url text
- canonical_url text
- author_id uuid nullable
- author_name text nullable
- category text
- region text
- location jsonb
- tags text[]
- status text
- moderation_status text
- published_at timestamptz
- updated_at timestamptz
- metadata jsonb

#### `public.feed_events`

Interaction tracking.

Fields:

- id uuid pk
- card_slug text
- event_type text
- user_id uuid nullable
- anon_id text nullable
- ip_hash text nullable
- user_agent_hash text nullable
- metadata jsonb
- created_at timestamptz

Indexes:

- card_slug + created_at
- event_type + created_at
- anon_id + created_at

#### `public.feed_scores`

Cached ranking scores.

Fields:

- card_slug text primary key
- unique_opens int
- comments_count int
- saves_count int
- shares_count int
- follows_count int
- hides_count int
- reports_count int
- score numeric
- last_activity_at timestamptz
- updated_at timestamptz

#### `public.user_profiles`

Public profile data.

Fields:

- user_id uuid pk references auth.users
- username text unique
- display_name text
- avatar_url text
- bio text
- location text
- links jsonb
- topics text[]
- role text
- created_at timestamptz
- updated_at timestamptz

#### `public.user_saves`

- user_id uuid
- card_slug text
- created_at timestamptz
- unique(user_id, card_slug)

#### `public.user_follows`

- user_id uuid
- target_type text (`topic`, `source`, `creator`, `region`, `card`)
- target_id text
- created_at timestamptz
- unique(user_id, target_type, target_id)

### 9.2 API routes

Recommended routes:

- `GET /api/feed?tab=top|latest|discussed|weather|following|saved`
- `POST /api/feed/events`
- `POST /api/feed/cards`
- `POST /api/feed/save`
- `POST /api/feed/follow`
- `GET /api/profile/[username]`
- `PATCH /api/profile`

Existing `/api/comments` can stay, but should be refactored to a card-thread mental model.

## 10. Implementation phases

### Phase 1 — Visible interaction cleanup

Goal: make existing homepage feel like a product.

Tasks:

- Replace tab names with Top/Latest/Discussed/Weather/Following/Saved.
- Use one card action row everywhere.
- Ensure comments work on weather/native cards.
- Add Share action.
- Add Save/Follow buttons as disabled or local placeholders only if backend not ready.
- Remove instructional/internal copy across homepage/weather/create/profile.

Definition of done:

- Homepage reads as a card feed.
- User can open, comment, share.
- Weather cards fit naturally in the feed.
- Build passes.

### Phase 2 — Event tracking + basic ranking

Goal: track interactions and rank Top/Discussed.

Tasks:

- Add migration for `feed_events` and `feed_scores`.
- Add `/api/feed/events`.
- Track open/share/comment events.
- Calculate simple ranking server-side or in a scheduled script.
- Show Top/Latest/Discussed accurately.

Definition of done:

- Opening/commenting/sharing updates event records.
- Top and Discussed tabs differ for a real reason.
- Ranking formula is documented and debug-friendly.

### Phase 3 — Save/follow

Goal: make the product feel personal.

Tasks:

- Add `user_saves` and `user_follows` if not already present.
- Add Save and Follow actions.
- Show Saved tab.
- Show Following tab.
- If anonymous, prompt sign-in without blocking browsing.

Definition of done:

- Signed-in user can save/unsave cards.
- Signed-in user can follow topics/sources/creators.
- Saved/Following pages are meaningful.

### Phase 4 — Create/post V1

Goal: let people add cards safely.

Tasks:

- Implement create form submission.
- Add validation and rate limits.
- Store created cards as pending/published depending on trust.
- Show pending confirmation.
- Add admin/manual review path or simple moderation view.

Definition of done:

- User can submit a card.
- Card is stored.
- Safe status model prevents unreviewed spam from flooding public feed.

### Phase 5 — Profiles

Goal: give users and independent writers identity.

Tasks:

- Implement public profile fields.
- Profile edit page.
- Avatar upload or avatar URL.
- Profile page lists posts/comments/saved/following.
- Link creators from cards.

Definition of done:

- A creator/journalist can have a simple public home.
- Their posts and comments are visible.
- Users can follow them later.

### Phase 6 — 100-city news/event integration

Goal: connect weather city monitoring with traditional news/event cards.

Tasks:

- Extend city monitoring to traditional news signals.
- Detect weather + media intersections.
- Create separate event cards for floods, outages, heat disruption, transport issues, emergencies, school closures, infrastructure events.
- Link event cards to weather city cards where relevant.

Definition of done:

- Weather is not isolated; city-level events become useful Albis cards.
- Major city disruptions can appear in Top/Weather/Latest naturally.

## 11. Risks and guardrails

### Risk: reactive social mechanics

Guardrail: no likes, upvotes, emoji reactions, applause, or public approval scores. Use impressions, opens, dwell time, comments, shares, private saves/bookmarks, follows, hides, and reports.

### Risk: clickbait ranking

Guardrail: clicks are low-weight; dwell/read time, comments, private saves, shares, and follows matter more.

### Risk: noisy comments

Guardrail: rate limits, status moderation, reports/hides, quality ranking later.

### Risk: over-instruction

Guardrail: public copy should be service-oriented and minimal.

### Risk: too many actions

Guardrail: visible row should stay small: Open, Comment, Share, Save. Follow can be contextual.

### Risk: private/internal intelligence leaking

Guardrail: public cards only show reviewed data. Private wiki/raw scans stay local/private.

### Risk: public repo exposing private content

Guardrail: do not commit private raw intelligence folders or generated local reports.

## 12. Build order recommendation

Immediate next order:

1. Finish Phase 1 visible interaction polish.
2. Add Phase 2 event tracking/ranking.
3. Add Save/Follow.
4. Make Create submit real cards with moderation.
5. Build profile identity.
6. Add 100-city traditional-news event integration.

## 13. Acceptance criteria for V1

V1 is done when Ignatius can:

1. Open the homepage and instantly understand the card feed.
2. Switch between Top, Latest, Discussed, Weather, Following, Saved.
3. Open a card.
4. Comment on any card type.
5. Share a card.
6. Save a card while signed in.
7. Follow a topic/source/person while signed in.
8. Create a card/link/update that enters a safe review/publish flow.
9. View a profile with avatar/bio/posts/comments/saved/following.
10. See weather/city cards inside the broader Albis feed, not as a separate experiment.

## 14. What not to build yet

Do not build in V1:

- public leaderboards of users
- influencer-style rankings
- likes, upvotes, emoji reactions, applause, or public reaction counts
- complex gamification
- aggressive AI personalization
- endless notification systems
- too many comment categories in the UI
- raw internal intelligence/wiki browsing
- automatic publication of unreviewed community posts

Keep it calm, clear, useful, and trustworthy.
