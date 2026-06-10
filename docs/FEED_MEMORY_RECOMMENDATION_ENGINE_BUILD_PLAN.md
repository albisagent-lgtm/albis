# Feed Memory — Recommendation Engine Build Plan

Date: 2026-06-11  
Status: Local-first build plan; do not deploy yet  
Depends on: Tab/Profile Knowledge Engine local MVP

## 1. Product thesis

Medium recommends similar writing. Albis should recommend the next useful piece of context.

**Feed Memory** is the reader-side companion to **Tab**:

- **Tab** = what each person has contributed over time.
- **Feed Memory** = what each reader is trying to understand over time.
- **For You** = recommendations that connect those two layers.

The goal is not addictive scrolling. The goal is compounding understanding.

Public product language:

> Feed Memory remembers the topics, sources, people, and contexts you keep returning to — then explains why something is being shown.

Short line:

> A feed that remembers what you’re trying to understand.

## 2. Principles

1. **Transparent, not black-box** — every recommendation should have a visible “Because…” explanation.
2. **Understanding over engagement** — optimise for continuity, evidence, source diversity, and useful context, not raw clicks.
3. **User-controlled** — users should be able to follow, save, hide, and later tune/remove interests.
4. **Local-first MVP** — use browser localStorage + existing feed cards/events first; no deployment, no migrations, no external LLM/API calls.
5. **Tab-connected** — use author/profile links to suggest relevant Tabs and explain people-based recommendations.

## 3. MVP scope

Build locally in the existing Tab worktree. Do not deploy.

### MVP must include

1. Add **For You** as a home feed tab.
2. Rename/shape home feed tabs toward:
   - For You
   - Following
   - Global
   - Undercovered
   - Latest
3. Build deterministic local Feed Memory scoring from existing feed cards and local signals.
4. Use available localStorage following data and feed event/browser actions.
5. Add “Because…” explanation badges/cards for recommended items.
6. Add lightweight Feed Memory summary panel.
7. Add “More like this” / “Less like this” / “Hide” tuning actions locally.
8. Feed Memory should interlink with Tab by recommending/opening author profiles when `authorHref` exists.
9. Preserve existing feed functionality and existing event tracking.
10. Run lint/build checks.

### MVP should avoid

- No production deployment.
- No database migration.
- No external recommendation service.
- No AI/LLM calls.
- No private inference, sensitive category inference, or personality claims.
- No irreversible data deletion.

## 4. Existing foundation

Current app already has:

- `/` home feed with `Top`, `Latest`, `Following`, `Discussed` filters.
- `feed_scores` for global popularity/quality scoring.
- `feed_events` tracking open/save/share/comment/follow/hide/report.
- client-side following map via `albis.following.v1`.
- `FollowingFeed` that filters cards by followed people/topics/sources.
- `LiveEventFeed` that tracks open/save/share/comment.
- Tab MVP in `/u/[handle]?tab=tab`.

MVP can use this without schema changes.

## 5. Local Feed Memory data model

Create a client-side helper file, suggested:

`src/app/components/feed-memory.ts`

or:

`src/lib/feed-memory.ts`

Types:

```ts
type FeedMemorySignalType =
  | "open"
  | "save"
  | "unsave"
  | "share"
  | "comment"
  | "follow"
  | "unfollow"
  | "hide"
  | "more_like_this"
  | "less_like_this";

type FeedMemoryProfile = {
  topics: Record<string, number>;
  people: Record<string, number>;
  sources: Record<string, number>;
  hiddenCardSlugs: Record<string, number>;
  updatedAt: string;
};

type RecommendationReason = {
  label: string;
  detail: string;
  strength: number;
};
```

Storage key:

`albis.feedMemory.v1`

Use card fields:

- `label`
- `tags`
- `author`
- `authorHref`
- `source`
- `sourceHref`
- `cardSlug`
- `summary/title`
- `bucket`
- `publishedAt`

## 6. Signal weighting

Suggested weights:

- open: +1 topic/source/person
- save: +4
- share: +3
- comment: +5
- follow: +6
- more_like_this: +5
- unsave: -3
- less_like_this: -4
- hide: -8 and hide card
- already seen/opened: small penalty when ranking

Following remains explicit and should strongly affect For You.

## 7. Recommendation scoring

For each card:

```text
score =
  base_weight
  + topic_match
  + source_match
  + person_match
  + followed_match
  + saved/similar-interest match
  + undercovered/context bonus
  + freshness bonus
  + Tab/author profile bonus
  - hidden penalty
  - repetition penalty
```

### Undercovered MVP heuristic

Use deterministic proxies:

- weather/community-watch cards
- low comment count but high base Albis weight
- tags/categories like `life-systems`, `weather`, `climate`, `food`, `water`, `energy`, `governance`, `health`
- items with source links but low score/comment count

Do not claim a true undercoverage calculation unless backed by PGI/GAI later. Use wording:

> “Adds undercovered context”

not:

> “This is objectively undercovered.”

## 8. Explanation generation

Every For You item should show 1–3 reasons, such as:

- “Because you follow Life Systems.”
- “Because you saved posts about climate.”
- “Because you often read sources from Albis Weather.”
- “Because this adds undercovered context.”
- “Because this author has a public Tab you can explore.”

Expose reasons via an optional field on feed events:

```ts
recommendationReasons?: Array<{ label: string; detail: string }>;
```

Then update `LiveEventFeed`/`FeedRow` to render a small “Because…” strip if present.

## 9. UI plan

### Home tabs

Recommended order:

```text
For You | Following | Global | Undercovered | Latest
```

Mapping:

- `for-you`: local Feed Memory recommendations.
- `following`: existing FollowingFeed.
- `global`: previous Top/main pulse.
- `undercovered`: deterministic undercovered/context sort/filter.
- `latest`: chronological.

### For You intro card

Show above the feed:

Title:

`For You, with Feed Memory`

Copy:

`Recommendations based on what you open, save, follow, and tune on this device. Every item should explain why it appears.`

If no memory yet:

`Start by opening, saving, or following a few topics. Albis will begin shaping this feed around what you’re trying to understand.`

### Feed Memory summary panel

Show locally derived interests:

- top topics
- top people
- top sources
- followed items

CTA links:

- follow topics/persons
- open a suggested author Tab if available

### Card tuning controls

Inside each recommended card or a small row beneath reason badges:

- `More like this`
- `Less like this`
- `Hide`

These should update local Feed Memory and call existing `trackFeedEvent` with metadata, if possible.

## 10. Tab interlinking

When a recommended card has `authorHref`:

- show a reason if author/person score is positive:
  > “Because this author overlaps with your Feed Memory.”

- add a small link:
  > “Open their Tab” → `${authorHref}?tab=tab`

Later, once server-side Tab topic summaries exist, use Tab topic overlap directly.

MVP can infer overlap from:

- author match
- author’s post tags appearing in reader Feed Memory
- card tags matching reader topics

## 11. Files likely to change

- `src/app/page.tsx`
  - add new filters and derive `forYouCards`, `undercoveredCards`
  - pass top/global card set into a new client component if needed

- `src/app/components/live-event-feed.tsx`
  - add optional recommendation reasons and tuning callbacks/UI

- new `src/app/components/feed-memory.ts` or `src/lib/feed-memory.ts`
  - localStorage profile builder/scorer

- new `src/app/components/feed-memory-feed.tsx`
  - client component wrapping For You recommendations, local memory state, tuning actions

- optionally `src/app/components/following-feed.tsx`
  - align copy with Feed Memory language

## 12. Acceptance criteria

- `/` defaults to **For You** or has **For You** available as a tab. Recommendation: default to For You if useful, otherwise Global if no memory.
- `/?filter=for-you` shows a personalized/reasoned feed.
- `/?filter=following` still works.
- `/?filter=global` shows the previous main weighted feed.
- `/?filter=undercovered` shows context/undercovered-oriented items.
- `/?filter=latest` shows chronological feed.
- Recommended cards display visible “Because…” reasons.
- Tuning actions update local Feed Memory and change recommendations without reload if practical.
- Author cards with `authorHref` link to the author’s Tab.
- No deploy, no migrations, no API/LLM calls.
- `npm run lint` and `npm run build` pass, or blockers are documented.

## 13. Future server-side architecture

Later, add durable tables:

- `user_feed_events`
- `user_feed_memory`
- `user_topic_affinities`
- `user_source_affinities`
- `user_people_affinities`
- `recommendation_explanations`

Then run a background recommender that combines:

- Feed Memory
- Tab topic maps
- PGI/GAI/undercoverage signals
- source diversity
- editorial quality
- freshness
- user controls

## 14. One-line product framing

**Feed Memory turns the feed from what is newest into what helps you continue understanding.**
