# Albis Feed + Cards Rebuild Plan

**Date:** 2026-06-01  
**Purpose:** Rebuild Albis around a simple, calm, easy-to-use feed where Albis and people can post useful information as cards, discuss them, and expand understanding together.

---

## 1. Core product idea

Albis should become a simple information platform built around one main action:

> **See useful cards. Open what matters. Discuss or share your own.**

This is not generic social media. It is not just a news site. It is a calm AI + human information platform.

Albis should help people:

- quickly understand what is happening;
- read useful writing;
- share articles, links, events, updates, or thoughts;
- discuss information with others;
- follow people or topics they care about;
- avoid the emotional noise of traditional feeds.

The scanner remains a core strength. Albis still scans, finds stories, creates articles, creates weather/event cards, and highlights useful information. But people can also contribute cards, articles, local context, independent journalism, and discussion.

---

## 2. Absolute design rule

**Keep it simple. Reduce noise. Make the site obvious.**

If a new feature makes the site harder to understand, do not add it yet.

The user should understand the product within seconds:

- Feed = cards
- Read = articles/writing
- Create = post something
- Profile = your posts and discussions

No cluttered dashboards.  
No heavy terminology.  
No unnecessary categories.  
No complex reporting language.  
No explaining the whole machine upfront.

The experience should feel closer to Medium-level simplicity than a newsroom dashboard.

---

## 3. Main surface

The main product surface should be:

1. **Feed** — see cards
2. **Read** — read articles and longer writing
3. **Create** — post a card or article
4. **Profile** — your posts, articles, comments, saved/followed items

Weather should **not** be a main nav item. Weather belongs inside the Feed as the first test category/filter.

Avoid top-level nav sprawl. Do not create endless sections like Weather, Sport, Politics, Tech, Climate, Markets, etc. Those can be filters/tags inside the Feed later.

---

## 4. Core object: the Card

A **Card** is the universal unit of Albis.

A card can be:

- an Albis scan result;
- a weather update;
- a news event;
- a link someone wants to discuss;
- an independent journalist article;
- a local update;
- a question;
- a short post;
- a longer article preview;
- an evolving event thread.

The word “card” is flexible and simple. Avoid over-specific terms like “signal” on the public surface unless needed internally.

### Card basics

Each card should show:

- title;
- short summary;
- author/source;
- type/tag if useful;
- comment count;
- open/read action;
- simple timestamp;
- optional source link.

### Card actions

V1 actions should be minimal:

- Open
- Comment
- Share/copy link
- Save/follow later, if easy

Do not overload cards with too many buttons.

---

## 5. Feed design

The Feed is the main home experience.

It should be one clean stream of cards.

### Feed filters

Start with only a few filters:

- **All**
- **Albis**
- **People**
- **Following**
- **Weather**

Weather is the first live test category, not a permanent separate section.

### Feed principles

- One column first.
- Minimal sidebars.
- No dense clusters.
- No competing modules.
- Cards should be easy to scan.
- Opening/commenting should feel natural.
- The user should always know what to do next.

The feed should answer instantly:

1. What is this?
2. Who posted it?
3. Why might I care?
4. Can I open/comment/share?

---

## 6. Read area

**Read** is for longer writing.

This includes:

- Albis articles;
- Albis briefings;
- independent journalist posts;
- user-published articles;
- essays or explainers;
- expanded versions of cards.

This gives independent journalists and thoughtful people a place to publish and be discussed without needing to fight social-media algorithms.

Read should feel simple like Medium:

- clean article list;
- clear author;
- title and short preview;
- open article;
- comments/discussion attached.

---

## 7. Create flow

The Create flow must be extremely simple.

Main button:

> **Create**

Initial options:

1. **Post a card**
2. **Write an article**

### Post a card

User can:

- paste a link;
- write a short post;
- describe an event/update;
- share a weather/local report;
- ask a question.

AI can help generate a clean card from a link or text, but the user should be able to edit before posting.

### Write an article

User can write/publish a longer piece on Albis.

This supports:

- independent journalism;
- personal research;
- opinion/analysis, if clearly labelled;
- learning and discussion;
- deeper community contribution.

### V1 simplicity

Do not build a complicated editor first. Start with:

- title;
- body;
- optional link/source;
- publish.

AI assistance can be V1.1/V2 if it slows the build.

---

## 8. Profiles

Profiles are important because people need a home for their contributions.

A profile should show:

- name;
- username;
- photo/avatar;
- optional bio;
- cards posted;
- articles written;
- comments/discussions;
- saved/followed items later.

Profiles should be simple at first. No complicated reputation system, leaderboards, or public ranking.

Important rule:

> Do not turn Albis into an influencer-ranking platform.

The goal is contribution, context, and discussion — not clout.

---

## 9. Albis as a posting account

Albis should post official cards as an account.

Start simple:

- **Albis** = official scan/weather/news/article account.

Do not split into too many official accounts at V1.

Later, if the product needs it, add official vertical accounts:

- Albis Weather
- Albis World
- Albis Markets
- Albis Local

But for now, one official Albis account keeps the product easier to understand.

---

## 10. Weather as the V1 test case

Weather is the first live product test.

Weather is useful because it is:

- daily;
- always updating;
- practical;
- local;
- easy to understand;
- less politically explosive;
- ideal for testing cards, comments, profiles, and user reports.

### Weather V1 flow

1. Albis posts daily weather cards.
2. Weather cards appear in the main Feed.
3. Users can filter Feed by Weather.
4. Users can open a weather card.
5. Users can comment with local context.
6. Users can create their own weather/local card.
7. Profiles show those posts/comments.

If this works for weather, the same system can expand to:

- news events;
- local reports;
- independent articles;
- research topics;
- community discussions.

---

## 11. AI role

AI should help quietly underneath.

AI can:

- generate card summaries;
- extract key points from links;
- suggest titles;
- summarise discussion threads;
- group related cards;
- detect updates;
- help Albis generate official scan cards;
- eventually help expand a card with verified context.

But AI should not make the site feel complicated.

The public experience should stay simple:

> Post or read a card. Open it. Discuss it.

AI expansion can be V2 after proving people understand and use the basic loop.

---

## 12. What to remove or reduce from current site

Reduce:

- duplicate Live/Events concepts;
- heavy “signals” language on the public surface;
- too many homepage clusters;
- explanatory blocks;
- dashboard-style modules;
- report taxonomy;
- repeated verification copy;
- anything that makes first glance overwhelming.

Keep:

- Albis scanner value;
- articles and deeper writing;
- PGI/GAI/indexes as deeper layers;
- weather automation;
- comments/community layer;
- simple cards.

Indexes and Companies can remain, but should not dominate the main user surface.

---

## 13. Proposed V1 navigation

Primary nav:

- **Feed**
- **Read**
- **Create**
- **Profile**

Secondary/footer:

- Indexes
- Companies
- About
- Daily briefing

This keeps the main product clear.

---

## 14. Build phases

### Phase 1 — Simplify surface

Goal: make the public product obvious.

Tasks:

- Rename/merge Live and Events into Feed.
- Make homepage the Feed.
- Remove unnecessary clusters/modules.
- Use one clean card stream.
- Add simple filters: All, Albis, People, Following, Weather.
- Keep Weather as a filter inside Feed.

### Phase 2 — Card system

Goal: make Card the universal object.

Tasks:

- Define card data model.
- Support Albis-generated cards.
- Support user-created cards.
- Cards can link to articles/sources.
- Cards can have comments.
- Cards can be filtered by type/source.

### Phase 3 — Profiles

Goal: give people identity and ownership.

Tasks:

- Create user profile page.
- Show user cards.
- Show user articles.
- Show user comments/discussions.
- Add basic profile editing.

### Phase 4 — Create flow

Goal: let people post simply.

Tasks:

- Add Create button.
- Add post-card form.
- Add write-article form.
- Allow optional source/link.
- Add simple AI card suggestion later if needed.

### Phase 5 — Weather test loop

Goal: prove the product with a daily real use case.

Tasks:

- Publish daily Albis weather cards into Feed.
- Allow users to comment on weather cards.
- Allow users to create local weather cards.
- Show Weather filter in Feed.
- Monitor whether the card/comment/profile loop feels natural.

### Phase 6 — Expand carefully

Only after Weather V1 works:

- user article discovery;
- independent journalist publishing;
- followed topics;
- AI discussion summaries;
- related-card grouping;
- better moderation;
- more card categories.

---

## 15. V1 success test

The first version succeeds if a new user can answer:

1. What is Albis?
2. What is this feed?
3. What is a card?
4. How do I open/comment?
5. How do I post something?
6. Where is my profile?

Without needing explanation.

If they cannot understand it quickly, the build is too complicated.

---

## 16. One-line product direction

Working line:

> **Albis is a calm feed for useful information — posted by AI and people, discussed in cards, and expanded with context.**

Shorter public possibility:

> **See what matters. Share what you know.**

Do not lock copy yet. Use this as direction, not final brand language.

---

## 17. Immediate next build recommendation

Start with the smallest working product:

1. Homepage becomes **Feed**.
2. Feed shows one clean stream of cards.
3. Weather cards appear in Feed.
4. Filter chips: All, Albis, People, Weather.
5. Each card opens to a simple discussion page.
6. Basic profile pages exist.
7. Basic Create card flow exists.

Do not overbuild AI yet.  
Do not overbuild categories yet.  
Do not overbuild moderation yet.  
Do not overbuild dashboards yet.

Build the simple loop first:

> Feed → Card → Discussion → Profile → Create → Feed

That is the product foundation.
