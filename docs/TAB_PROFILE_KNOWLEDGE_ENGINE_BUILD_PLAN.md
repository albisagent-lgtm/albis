# Tab — Profile Knowledge Engine Build Plan

Date: 2026-06-11  
Status: Local-first build plan; do not deploy yet  
Owner: Albis / Ignatius + Light Tree

## 1. Product thesis

Albis profiles should not only show what someone posted recently. They should show what a person has contributed over time.

**Posts are the live feed. Tab is the accumulated meaning.**

Tab is a profile-level knowledge layer that turns a user's public contributions into a living, source-backed knowledge profile. It is not marketed as an "LLM wiki". The public product name is simply:

**Tab**

Suggested subtitle:

> Where your ideas add up.

Or:

> Your public contributions, organised into a living knowledge profile.

## 2. Core rule

Every sentence in Tab should be traceable back to one or more posts, sources, uploads, comments, articles, or profile contributions.

This protects trust, prevents invented identity claims, and makes Tab feel like a useful organiser rather than an AI judging who someone is.

## 3. Profile information architecture

The public user profile should use this tab structure:

```text
Posts | Tab | About | Sources
```

### Posts
Live/recent activity:
- updates
- cards
- posts
- discussions
- article links

### Tab
The living knowledge profile:
- summary snapshot
- topic map
- strongest contributions
- timeline of thinking
- source-backed wiki sections
- later: Q&A/search over the profile's public knowledge

### About
Human-owned profile identity:
- bio
- location/region if chosen
- role/interests
- links
- avatar/name/handle

The AI should not replace this section. This is the user's direct self-description.

### Sources
Evidence and reference layer:
- links shared by the profile
- original sources attached to posts
- uploaded/reference documents later
- source counts and most-used domains
- sources grouped by topic later

## 4. UX goal

Tab should feel calm, beautiful, and useful — more like a living portfolio of contribution than a noisy social-media profile.

First impression should answer:

1. What does this person contribute?
2. What topics do they consistently explore?
3. What evidence/sources support that?
4. What are their strongest public contributions?
5. How has their thinking evolved over time?

## 5. MVP scope

Build locally only. Do not deploy.

### MVP must include

1. Public profile navigation: `Posts | Tab | About | Sources`.
2. Tab view inside `/u/[handle]`.
3. About view inside `/u/[handle]`.
4. Sources view inside `/u/[handle]`.
5. Source-backed UI language that explains Tab clearly.
6. Generated/derived Tab sections from existing public profile cards/signals. No external API call required for V1.
7. Empty states for profiles without enough public contributions.
8. Mobile-friendly presentation.
9. Keep current profile functionality: follow button, edit profile button, stats, time card, existing posts list.

### MVP should avoid

- No production deployment.
- No database migration unless absolutely needed.
- No LLM API integration in the first UI pass.
- No public ranking/leaderboard of people.
- No claims like "expert" unless explicitly user-provided or source-backed.
- No irreversible changes to auth/account flows.

## 6. V1 data model approach

For the local V1, use existing `Signal`/profile data as the raw contribution layer.

Raw contribution fields available in profile cards likely include:
- title
- summary
- category
- tags
- published_at
- article_url/source
- metadata
- comment_count
- slug

Derived Tab data can be computed in pure TypeScript from `cards`:

### `buildProfileTabData(handle, profile, cards, stats)`

Return:

```ts
type ProfileTabData = {
  enoughData: boolean;
  snapshot: {
    headline: string;
    description: string;
    evidenceCount: number;
    lastUpdatedLabel: string;
  };
  topics: Array<{
    name: string;
    count: number;
    evidence: Array<{ title: string; href: string; date: string }>;
  }>;
  contributions: Array<{
    title: string;
    summary: string | null;
    href: string;
    date: string;
    reason: string;
  }>;
  timeline: Array<{
    label: string;
    title: string;
    href: string;
    date: string;
  }>;
  sources: Array<{
    domain: string;
    count: number;
    examples: Array<{ title: string; href: string }>;
  }>;
};
```

### Source traceability in UI

Each generated/derived section should show evidence links:
- "Based on 12 public updates"
- "Evidence: [post title], [post title]"
- "Sources used: example.com, reuters.com"

For MVP, the wording can be deterministic, not LLM-generated. This is safer and easier to ship locally.

## 7. Suggested page structure

Current route: `/u/[handle]`

Recommended implementation without adding new routes:

- Use query parameter: `/u/[handle]?tab=tab`
- Valid views: `posts`, `tab`, `about`, `sources`
- Default view: `posts`

Benefits:
- minimal routing changes
- one profile shell
- easy to link directly to Tab

Alternative later:
- `/u/[handle]/tab`
- `/u/[handle]/sources`

But query-param is enough for V1.

## 8. UI components to create

Suggested component file:

`src/app/u/[handle]/profile-sections.tsx`

Components:

- `ProfileNavTabs`
- `ProfilePostsSection`
- `ProfileTabSection`
- `ProfileAboutSection`
- `ProfileSourcesSection`
- `EvidenceLinkList`
- `TopicMap`
- `ContributionCard`
- `ProfileTimeline`

If the page file becomes too large, move derived-data helpers to:

`src/lib/profile-tab.ts`

## 9. Tab visual design

### Tab opening card

Title:

`{DisplayName}'s Tab`

Subtitle:

`A living map of this profile's public contributions, topics, sources, and evolving work.`

Trust note:

`Every section is built from public posts and sources. The person owns their About section; Tab organises what they have contributed.`

### Sections

#### Snapshot
A high-level card:
- contribution count
- main topic count
- source count
- latest contribution date
- simple description

Example copy:

> This Tab is built from 24 public updates and 13 linked sources. It highlights the topics, sources, and contributions that appear most often in this profile's public activity.

#### Topic map
Clickable pills/cards with counts. Each topic includes a few evidence posts.

#### Strongest contributions
For MVP, use deterministic heuristics:
- posts with summaries
- posts with source links
- posts with comment_count > 0
- newest high-context posts

Label them as "Notable contributions" rather than "best" to avoid overclaiming.

#### Timeline
Chronological evolution of public contributions.

For MVP:
- group by month if enough posts
- otherwise list recent dated contributions

#### Evidence promise
Small persistent note:

> Tab is generated from public contributions only. It should not be treated as a full biography or endorsement.

## 10. About view

About should preserve human ownership.

Suggested layout:
- Profile bio card
- Handle/name
- Account type/public profile status
- Contribution stats
- If own profile: edit profile CTA

Copy:

> About is written or controlled by the person. Tab is the organised map of what they have publicly contributed.

## 11. Sources view

Sources should show:
- source count
- list of source domains from `article_url`
- linked examples
- empty state if no source links

Copy:

> Sources are the references attached to this profile's public updates. They help make Tab traceable.

## 12. Later architecture

Once UI is proven, add real compiled wiki infrastructure.

### Future tables

- `profile_contributions`
- `profile_sources`
- `profile_wiki_pages`
- `profile_wiki_blocks`
- `profile_wiki_block_sources`
- `profile_wiki_runs`
- `profile_topics`
- `profile_claims`

### Future compiler

A background job compiles each profile's raw contributions into wiki pages:

1. Ingest new public contribution.
2. Extract source references and topics.
3. Update profile topic index.
4. Draft/refresh wiki blocks.
5. Attach citations to every block.
6. Mark changed sections for user review if needed.

### Future Q&A

Add "Ask this Tab" once enough data exists.

Rules:
- answers only from that profile's public contributions/sources
- cite posts/sources in answer
- state when not enough evidence exists

## 13. Safety and trust principles

1. The human owns identity. AI organises contribution.
2. Never infer private traits.
3. Never present speculation as fact.
4. Avoid expertise labels unless user-selected or strongly evidence-backed.
5. Make sources visible.
6. Allow hiding/regeneration/editing later.
7. Keep profile ranking out of V1.

## 14. Build sequence

### Phase A — Local UI proof

- Refactor `/u/[handle]/page.tsx` to support tab query param.
- Add profile nav tabs.
- Move existing cards list into Posts section.
- Add Tab, About, and Sources sections.
- Add deterministic Tab data builder from existing cards.
- Run lint/build checks.

### Phase B — Polish pass

- Tighten visual hierarchy.
- Ensure empty states are warm and clear.
- Ensure mobile layout works.
- Ensure copy uses "Tab" consistently.
- Check dark mode.

### Phase C — Real data/compiler later

- Decide schema.
- Add background compiler.
- Add user controls.
- Add Q&A/search.

## 15. Acceptance criteria for this local build

- `/u/albis` still works.
- `/u/albis?tab=posts` shows posts.
- `/u/albis?tab=tab` shows Tab summary/topic/timeline/contribution UI.
- `/u/albis?tab=about` shows human-owned About page.
- `/u/albis?tab=sources` shows source evidence list.
- Empty/no-data profiles do not break.
- Existing follow/edit profile behaviour remains.
- `npm run lint` and/or `npm run build` is run if feasible.
- No deploy is triggered.

## 16. One-line product framing

**Tab turns a profile from a feed into a living, source-backed map of contribution.**
