# Phase 6 — Public Editorial Doctrine + Content Lanes

This phase codifies the public newsroom contract in code instead of leaving it implicit inside selectors and writer heuristics.

## Contract

Version: `phase6-public-doctrine-v1`

Public output should:
- lead with developments that materially change the operating picture,
- keep a mixed public edition across systems, people, framing gaps, measurable shifts, and surprising edge signals,
- give each public story a clear walkaway,
- stay separate from the operational owner briefing path.

## Public content lanes

The public path now uses six doctrine lanes:
- `turning-point` — state change that resets the baseline
- `system-ripple` — bottlenecks, reroutes, rules, infrastructure, price chains
- `human-fallout` — lived consequences in homes, clinics, schools, work, access
- `framing-battle` — the coverage split is part of the story
- `numbers-reset` — a number that changes the reader's baseline
- `offbeat-window` — surprising detail that reveals a larger pattern

## Where it is wired

- `src/lib/public-editorial-doctrine.ts`
  - source of truth for the contract, lane specs, and lane-mix helpers
- `src/lib/public-story-selection.ts`
  - each ranked story now gets a `doctrineLane`
  - selection now caps repeated doctrine lanes, so the public set is less likely to collapse into one editorial mode
- `src/lib/public-story-planner.ts`
  - story planning now derives its story kind from the same doctrine helper used by selection
- `src/lib/public-daily-briefing.ts`
  - briefing items now carry lane metadata
  - package now records doctrine version + lane mix summary
  - markdown now includes a `Public doctrine` section for downstream consumers
- `scripts/run-daily-briefing-pipeline.ts`
  - briefing emails now surface lane labels and lane-mix summary
- `scripts/run-post-scan-pipeline.ts`
  - published article frontmatter now records doctrine version, doctrine lane, label, and article behavior
- `src/app/page.tsx`
  - homepage briefing preview now shows lane labels when present

## Why this is Phase 6-sized

It makes the public product's editorial behaviour explicit and shared across selection, briefing, and article packaging, without disturbing the separate owner/company briefing path.
