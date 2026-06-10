# Feed Memory Suggestion Layer Build Plan

Date: 2026-06-11  
Status: Local-first; do not deploy  
Builds on: Tab MVP + Feed Memory MVP

## 1. Product idea

Feed Memory should not only recommend what to read. It should help users continue the thread they are already building — by reading, following, opening relevant Tabs, saving useful posts, or contributing something of their own.

Do not call this “suggestive context” publicly. Use natural language:

- Continue this thread
- Explore this person’s Tab
- Add a source
- Post a note
- Share what you know
- Build your Tab
- Strengthen your Feed Memory

## 2. Product loop

Reader path:

1. User reads/saves/follows topics.
2. Feed Memory learns their interests.
3. For You recommends useful next posts.
4. Suggestion layer offers natural next actions.

Creator/profile path:

1. User contributes posts/sources/comments.
2. Their Tab grows.
3. Time/token mechanics later credit useful attention.
4. Feed Memory can suggest where their contributions are strongest and what to add next.

Core line:

**Feed Memory recommends the next useful step, not just the next post.**

## 3. MVP scope

Build locally in `/Users/treelight/.openclaw/workspace/albis-tab-build`. Do not deploy.

### MVP should add

1. A small “Continue this thread” module in `For You`.
2. Suggested actions based on local Feed Memory and recommended cards.
3. Author Tab suggestions when recommended posts have `authorHref`.
4. Contribution prompts:
   - add a source
   - post a note
   - ask a question
   - write/update a post
5. Clear, calm UI language.
6. No new DB tables, no API calls, no LLM calls.
7. Keep existing Feed Memory tuning and recommendation behavior.

## 4. Suggested action types

Use deterministic suggestions:

```ts
type FeedMemorySuggestion = {
  id: string;
  kind: "read" | "tab" | "contribute" | "follow" | "source";
  title: string;
  body: string;
  href: string;
  cta: string;
  reason?: string;
};
```

Examples:

### Read
Title: `Continue with climate resilience`  
Body: `You’ve been spending time around climate and infrastructure. This post adds a useful next layer.`  
CTA: `Open post`

### Tab
Title: `Explore this contributor’s Tab`  
Body: `This author appears in your Feed Memory. Their Tab collects posts, topics, and sources in one place.`  
CTA: `Open Tab`

### Contribute
Title: `Add what you know`  
Body: `If you have a source, question, or note on this thread, add it to the feed and strengthen your Tab.`  
CTA: `Create post`

### Source
Title: `Add a source to this thread`  
Body: `Source-backed posts help Feed Memory and Tab stay traceable.`  
CTA: `Add source`

## 5. Where it appears

In `FeedMemoryFeed`, under the Feed Memory summary panel and above the feed list:

- A compact 2–3 card grid called **Continue this thread**.
- Show only if there are suggestions.
- If no memory yet, show onboarding actions:
  - Follow a topic
  - Save a useful post
  - Create a post

## 6. Implementation files

Likely changes:

- `src/app/components/feed-memory.ts`
  - add `buildFeedMemorySuggestions(cards, memory, follows)`
- `src/app/components/feed-memory-feed.tsx`
  - render suggestion cards
- maybe `src/app/components/live-event-feed.tsx`
  - no change unless needed

## 7. Interlinking with Tab

If recommended card has `authorHref`, suggestion should link to:

`${authorHref}?tab=tab`

Copy should be natural:

> Explore this contributor’s Tab

not:

> View AI wiki

## 8. Acceptance criteria

- `/?filter=for-you` shows a “Continue this thread” module.
- Suggestions are deterministic and local.
- At least one suggestion links to `/create` when appropriate.
- Author suggestions link to `/u/[handle]?tab=tab` when possible.
- Existing Feed Memory recommendations still work.
- `npx eslint` on changed files passes.
- `npm run build` passes if feasible.
- No deploy, no migrations, no external API/LLM calls.
