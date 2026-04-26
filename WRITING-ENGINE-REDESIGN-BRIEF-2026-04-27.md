# Writing Engine Redesign Brief + Focused Research

_Date: 2026-04-27_

## 1) Purpose

Prepare a clean replacement for the current public-article writer in `albis-app/scripts/run-post-scan-pipeline.ts`.

The goal is **not** to tune sentence templates. The goal is to replace the current **structured-metadata renderer** with a **real writing process** that:

- uses the existing selector and signal pipeline as inputs,
- chooses an article form intentionally,
- generates a strong opening and early movement,
- explains the mechanism and stakes cleanly,
- produces more natural paragraph progression,
- keeps hard quality gates,
- and stays grounded in the verified scan item rather than drifting into generic “analysis voice.”

---

## 2) Current System: What Exists Now

### Current architecture

The public article path is currently:

1. **Scan ingestion / DB truth**
2. **Ranking + selection** via `src/lib/public-story-selection.ts`
3. **Form assignment** (`turning-point`, `framing-map`, `system-shift`, `human-ground`, `numbers-watch`, `offbeat-signal`)
4. **Signal extraction** into `articleSignals`:
   - `coreFact`
   - `keyNumber`
   - `mainActors`
   - `primaryLocation`
   - `humanStake`
   - `mechanism`
   - `novelty`
   - `framingTension`
   - `articleFormHint`
   - `pairWith`
   - `sourceTexture`
5. **Deterministic writer** in `run-post-scan-pipeline.ts`
   - builds a `StoryPacket`
   - selects one of several hard-coded lede/body builders
   - assembles paragraphs from paragraph functions like:
     - `buildWhatChangedParagraph`
     - `buildMechanismParagraph`
     - `buildRegionalDetailParagraph`
     - `buildWhyItMattersParagraph`
     - `buildWhatToWatchParagraph`
     - `buildClosingParagraph`
6. **Quality gate** checks:
   - minimum word count
   - paragraph count range by form
   - concrete opening
   - low headline overlap
   - mechanism presence
   - concrete anchors
   - readable paragraph sizing
7. **Ingest + verify**

### What the current system gets right

- Strong upstream selection discipline.
- Useful form taxonomy already exists.
- Signals are better than a blank-prompt approach.
- Quality gate is serious and should be preserved in spirit.
- The writer is tightly connected to verified scan truth.

### What the current system is actually doing

It is not really “writing” in an editorial sense.

It is **rendering pre-labeled metadata into paragraph slots**.

That means the article often feels like:

- a sequence of obligatory functions,
- an explanation scaffold filled by slot text,
- a voice that knows the categories before it knows the story,
- and a paragraph chain that moves by checklist rather than by narrative or analytic momentum.

---

## 3) Core Problems With the Current Writer

### A. It writes from schema before it writes from story

The draft is organized around fields such as `mechanism`, `humanStake`, `framingTension`, `pairWith`, not around the strongest editorial route through the material.

Result:
- paragraphs can feel pre-decided,
- the article sounds classified before it sounds observed,
- the movement is “now render the mechanism paragraph” rather than “what must the reader understand next?”

### B. Form exists, but movement inside the form is still too fixed

There are different form ledes and paragraph orderings, but they still reduce to a limited set of reusable paragraph generators.

Result:
- different stories can share nearly the same internal rhythm,
- the form label changes faster than the writing behavior,
- the writer is better at variation on paper than on the page.

### C. The opening is engineered for passing checks, not necessarily for earning attention

The current opening logic heavily optimizes for:
- concrete nouns,
- actor/action details,
- anti-headline-overlap,
- quality gate scoring.

That helps prevent bad openings, but it does not guarantee a compelling one.

Result:
- openings are often serviceable but not sharp,
- they can feel “correct” rather than inevitable,
- they sometimes state details without establishing the story’s real tension.

### D. Explanation is often explicit but not elegantly staged

The system knows it must explain mechanism and stakes, but the explanation frequently arrives as a named paragraph function.

Result:
- explanation can feel announced rather than discovered,
- paragraphs summarize what the writer intends instead of making the reader see it,
- transitions feel procedural.

### E. Editorial pacing is too even

Most bodies land in a similar 7–8 paragraph cadence, with similar sentence density and paragraph purpose.

Result:
- articles can feel rhythmically flat,
- there is little compression/expansion based on story energy,
- the writing lacks the sense of pressure release, turn, or escalation that strong articles use.

### F. Too much “article about article-ness” remains in the prose

A lot of lines are clean, but many still sound like editorial guidance translated into article copy:
- “The chain usually runs through...”
- “That is why...”
- “For the reader, the useful question is...”
- “The important phase is...”

Result:
- voice leans synthetic,
- the prose often explains its own intentions,
- it can read like a high-quality generated explainer rather than a published article.

### G. The writer overuses reusable abstractions

The same machinery tries to produce turning-point, human, numbers, system, framing, and offbeat articles from a shared paragraph bank.

Result:
- local appropriateness is lost,
- paragraphs become cross-form general-purpose modules,
- the system behaves like a renderer with surface variation, not a form-aware writer.

---

## 4) What Must Be Replaced

Replace:

1. **The paragraph-function renderer model**
   - stop composing articles from a fixed set of reusable paragraph blocks.

2. **The current “body by slot order” strategy**
   - form should shape movement, but not via rigid function chains.

3. **The current opening-generation strategy as the primary writing brain**
   - opening logic should become a stage in a writing process, not the whole core.

4. **The implicit assumption that all forms can be served by the same paragraph primitives**
   - keep shared constraints; stop forcing shared prose modules.

5. **Overtly synthetic meta-explanatory phrasing**
   - remove prose that sounds like the machine narrating how to read the story.

Keep / reuse:

- selector output
- article-form assignment
- article signals as planning inputs
- concrete specificity checks
- anti-headline-overlap discipline
- quality gating concept
- verified-scan grounding

---

## 5) What Article Forms Need Focused Study

These are already in the system and should remain the basis for redesign.

### 1. Turning-point
A concrete state change that alters the operating picture.

Need to study:
- strongest direct-news / analytical-feature openings
- how to move from event to consequence quickly without sounding like wire copy
- how to stage “what changed / why now / what next” cleanly

### 2. Framing-map
A story where the reporting divide is part of the article’s point.

Need to study:
- how to open on the event without turning instantly abstract
- how to compare frames without sounding academic
- how to show divergence in emphasis, not just declare it

### 3. System-shift
A bottleneck, reroute, infrastructure, trade, energy, logistics, or policy-pressure piece.

Need to study:
- mechanism-first explanation without dead prose
- how operational stories gain momentum
- how to map a consequence chain with clean reader movement

### 4. Human-ground
A story where lived consequences are the strongest way in.

Need to study:
- scene/detail versus summary openings
- how to stay concrete without fabricating scene material
- how to connect local consequence to wider system stakes

### 5. Numbers-watch
A story where a number is meaningful because it changes the baseline.

Need to study:
- when to open with the number vs when to delay it
- how to interpret a number instead of merely citing it
- how to keep numerical articles from sounding report-like or sterile

### 6. Offbeat-signal
A surprising or edge-case item that reveals a wider pattern.

Need to study:
- curiosity openings that still stay serious
- how to bridge from oddity to structural meaning
- how much novelty to foreground before paying off the real point

---

## 6) Research Questions the Redesign Must Answer

### Openings
- What kinds of openings best fit each form?
- When should the opening be direct vs curious vs contrastive?
- How early must the article reveal its thesis / payoff?
- What makes an opening feel earned rather than mechanically “concrete”?

### Movement
- What should paragraph 2 do in each form?
- When should the “nut graf” appear explicitly, and when can it be distributed?
- How should pieces move: event → meaning, scene → thesis, number → interpretation, contrast → mechanism, etc.?
- What are the natural pivots for each form?

### Explanatory style
- How do strong explainers make mechanism legible without lecture voice?
- How do they alternate fact, implication, and example?
- How much explicit signposting is healthy before it becomes synthetic?

### Editorial pacing
- What creates forward pull in 500–800 word analysis pieces?
- How should paragraph length vary by pressure / complexity?
- Where should compression happen? Where should expansion happen?
- What kind of ending is strongest for Albis: kicker, forward edge, operative question, concrete watchpoint?

### Architecture
- Which current signals should remain planning inputs?
- Which signals should become optional helpers rather than mandatory paragraph destinations?
- What should the writer produce internally before prose generation: angle, route, opening mode, nut, body beats, ending mode?

---

## 7) Writing Behaviors We Want in the New Engine

### The writer should:
- start from **the strongest editorial angle**, not from field coverage obligations
- decide **how to enter** the story before drafting full paragraphs
- reveal the story’s point early without flattening the reading experience
- make each paragraph answer: **what does the reader need next?**
- explain mechanism with clarity but without “explainer template” voice
- vary pacing by form and by story energy
- sound like a clean published article, not like high-end system output
- stay specific, grounded, and operational
- keep paragraphs purposeful and distinct
- end with a real forward edge, not a generic conclusion

### The writer should avoid:
- checklist prose
- repeated rhetorical patterns
- “for the reader...” / “the useful question is...” style scaffolding
- over-reuse of abstract transition formulas
- encyclopedic over-coverage
- repeating metadata in sentence form

---

## 8) What to Explicitly Remove

Remove these tendencies from the new design:

- **Paragraph-function assembly** as the main drafting method
- **Mandatory appearance of every signal in article prose**
- **One-size-fits-all explanatory cadence**
- **Overt meta guidance phrasing**
- **Template conclusions** that merely restate stakes
- **Quality-gate-driven prose decisions** as the dominant creative logic
- **Surface form switching with deep structural sameness**

Signals should inform the writing plan. They should not all demand literal realization.

---

## 9) How This Fits the Existing Selector / Signal / Pipeline Architecture

### Keep the upstream architecture

The selector and ranking system in `src/lib/public-story-selection.ts` is still valuable.

It already provides:
- candidate ranking,
- diversity control,
- form hinting,
- writeability scoring,
- useful article signals.

That means the redesign should **not** replace the selector first.

### New role of signals

Current signals should become **planning inputs** rather than paragraph prompts.

Suggested remap:

- `coreFact` → factual anchor / nut material
- `keyNumber` → optional opening or interpretation anchor
- `mainActors` → lede specificity / subject control
- `primaryLocation` → grounding / localisation
- `humanStake` → one possible stakes route
- `mechanism` → likely explanatory hinge
- `novelty` → opening tension / edge
- `framingTension` → contrast hinge for framing-map pieces
- `pairWith` → optional follow-on idea, usually not prose-critical
- `sourceTexture` → confidence / texture cue, usually planning-only

### Proposed new writer stage

Replace:
- `buildXParagraph()` assembly

With:

1. **Story plan stage**
   - choose angle
   - choose opening mode
   - define nut / core claim
   - define 4–6 body beats
   - define ending mode

2. **Draft stage**
   - generate prose from the plan as an article, not paragraph slots

3. **Revision stage**
   - tighten opening
   - reduce abstraction
   - remove repeated patterns
   - ensure paragraph distinctness
   - ensure mechanism/stakes are actually legible

4. **Quality gate stage**
   - retain concrete specificity and structure checks
   - add new style / repetition / abstraction checks

---

## 10) Focused Research Findings

## A. The nut graf is still the key missing design concept

Across journalism teaching material and newsroom craft notes, the nut graf repeatedly appears as the structural hinge between hook/opening and the rest of the story.

Consistent findings:
- It tells the reader what the story is really about.
- It explains why the story matters now.
- It links the opening to the rest of the piece.
- It often answers “why am I being told this?”

Relevant sources found:
- Poynter: nut graf tells readers what the writer is up to; justifies care, provides transition, explains timeliness.
- CCNY / journalism teaching material: nut graf = point + why should I care + transition.
- Nieman Storyboard: practical formula of **transition + summary lede** and “Why I invited you to this party.”

### Design implication

The new engine should have an explicit **nut / thesis stage**.

Right now the system has stakes/mechanism/context paragraphs, but no strong internal concept of:

> what exactly is the one-paragraph promise of this piece?

That should become mandatory in planning, even if not always rendered as a visibly separate paragraph.

---

## B. Good story structure starts with inventory and prioritization, not prose modules

The American Journalism Handbook material emphasizes:
- take stock of the pieces,
- categorize facts and themes,
- match quotes/evidence to major facts,
- prioritize what matters most,
- write a one-sentence encapsulation before drafting.

### Design implication

Before drafting, the writer should produce something like:
- story angle sentence,
- strongest hook,
- operative consequence,
- best evidence cluster,
- best route through the material.

This supports a **planning-first writer**, not a sentence-bank renderer.

---

## C. Different structures fit different stories; inverted-pyramid logic is only one option

The journalism sources distinguish between:
- inverted pyramid,
- martini glass / hourglass,
- feature / anecdotal with nut graf,
- analytical feature structures.

This matters because Albis currently has six forms, but they still converge too heavily on one explanatory paragraph rhythm.

### Design implication

The new engine should use **movement patterns**, not only form labels.

Suggested movement patterns:
- **Direct-turn**: event first, then thesis, then consequences
- **Curious-turn**: odd detail first, then reveal, then larger meaning
- **Contrast-turn**: same event, competing readings, then mechanism
- **Human-turn**: local consequence first, then system explanation
- **Number-turn**: operative metric first, then interpretation and spread

These patterns can sit beneath the existing article forms.

---

## D. Strong openings answer a big-picture question, not just a detail requirement

Nieman’s teaching note is especially useful here:
- summary ledes answer one big-picture question,
- feature ledes help the reader picture or understand a big-picture question,
- the nut then clarifies the deeper point.

### Design implication

The opening should be chosen by **opening mode**, not merely generated from actor/action parts.

Suggested opening modes:
- **Direct factual lede** — when the event itself is the hook
- **Contrast lede** — when mismatch between surface story and real story is the point
- **Pressure-point lede** — when the first visible strain tells the story best
- **Number lede** — when a metric clearly resets the baseline
- **Odd-detail lede** — when an edge case exposes a broader shift
- **Human proximity lede** — when lived consequence is the cleanest entry

This is a more editorially real decision than the current single-engine lede builder.

---

## E. Explanation should feel like unfolding logic, not named explanation

The best research signal here is indirect but strong: nut graf and feature structures emphasize transition, revelation, and significance rather than isolated “mechanism paragraphs.”

### Design implication

The engine should stop thinking:
- “now write the mechanism paragraph”

and start thinking:
- “where does the article naturally turn from event to operating logic?”

Mechanism is still critical. But it should often be embedded in movement such as:
- event → immediate operational effect,
- operational effect → broader consequence,
- broader consequence → why this is bigger than it looks.

---

## F. Editorial pacing depends on expansion and compression

The research sources do not give a rigid formula for paragraph length, but they consistently imply:
- early clarity matters,
- the middle needs support and development,
- transitions matter,
- structure should fit the material.

### Design implication

The new engine should pace deliberately:

- **P1–P2:** strongest hook + immediate orientation
- **P2–P4:** reveal the point, mechanism, or contrast quickly
- **Middle:** one or two expansions where complexity actually earns room
- **Late:** compress toward operative consequence / watchpoint
- **Ending:** leave the reader with a changed frame, not a summary echo

This suggests paragraph counts can stay bounded, but paragraph function and density should vary more than they do now.

---

## G. The one-sentence “walkaway” is a useful planning primitive

CCNY’s formulation is especially practical:
- write the one-sentence walkaway,
- answer “what’s your point?” and “why should I care?”

### Design implication

The new engine should require a hidden planning artifact such as:

- `walkaway`
- `why_now`
- `entry_reason`

If the engine cannot state those crisply before drafting, it is not ready to write.

---

## 11) Proposed New Writing-Engine Design

## Design principle

**Selector gives the candidate. Signals give the ingredients. The writer must create a route.**

Not:
- metadata → paragraph renderer

But:
- selected story → plan → draft → revise → gate

### A. Proposed internal stages

#### Stage 1: Story diagnosis
Input: selected item + article form + article signals

Produce:
- `angle`: what this article is really about
- `why_now`: why this matters now
- `best_hook`: strongest entry point
- `entry_mode`: direct / contrast / human / number / oddity / pressure-point
- `core_move`: event→stakes, number→meaning, frame→mechanism, etc.
- `ending_mode`: watchpoint / implication / threshold / unresolved test

#### Stage 2: Story plan
Produce a short plan, e.g.:
- opening
- nut / thesis
- beat 1
- beat 2
- beat 3
- beat 4
- ending

Each beat should answer what the paragraph must accomplish, not which metadata field it covers.

#### Stage 3: Draft
Generate the full article from the plan.

Rules:
- no explicit meta scaffolding language
- no obligation to mention every signal
- stay inside verified facts and provided consequence logic
- preserve form-specific movement

#### Stage 4: Revision
Run a rewrite pass that specifically checks:
- opening sharpness
- headline overlap
- repeated syntax / repeated paragraph openers
- abstract filler
- whether mechanism is actually legible
- whether the nut arrives early enough
- whether paragraph order feels necessary

#### Stage 5: Quality gate
Keep most existing structural gates, but add:
- repeated phrase detector
- abstraction detector
- paragraph-purpose similarity detector
- explicit nut/thesis presence check
- late-ending weakness check

---

## 12) Form-Specific Movement Recommendations

### Turning-point
Best route:
1. factual change
2. why this is a turn, not noise
3. immediate consequence chain
4. wider operating implications
5. what to watch next

### Framing-map
Best route:
1. anchor event
2. show divergence in emphasis
3. explain what produces the divergence
4. show why the divergence matters materially
5. leave reader with a changed reading of the story

### System-shift
Best route:
1. concrete operational pressure point
2. nut: what system is shifting
3. mechanism chain
4. who must now adjust
5. where downstream effects appear next

### Human-ground
Best route:
1. lived consequence / local pressure point
2. nut: what larger shift is arriving through this point
3. mechanism upward into system
4. return to people-level stakes
5. forward edge

### Numbers-watch
Best route:
1. operative number or changed baseline
2. nut: what the number means
3. where it bites first
4. why it is moving now
5. what confirms or disproves the trend next

### Offbeat-signal
Best route:
1. unusual detail
2. reveal why it is not trivial
3. connect to wider mechanism
4. show broader implication
5. end on the expanded meaning

---

## 13) Recommended Build Direction

### Short version

Do **not** iterate the existing paragraph bank.

Build a new writer beside it that:
- consumes the same selection output,
- emits an internal story plan first,
- writes from movement rather than slot rendering,
- then runs stricter revision/gating.

### Concrete implementation shape

Suggested refactor:

- `src/lib/public-story-selection.ts` stays mostly intact
- extract new module such as:
  - `src/lib/writing-engine/plan-story.ts`
  - `src/lib/writing-engine/write-draft.ts`
  - `src/lib/writing-engine/revise-draft.ts`
  - `src/lib/writing-engine/quality-gate.ts`

### Keep old writer only as fallback during migration

Run A/B internally:
- old renderer output
- new plan-based writer output

Compare on:
- opening distinctness
- paragraph redundancy
- abstraction rate
- form fidelity
- quality pass rate
- editorial preference in blind reads

---

## 14) Bottom Line

The current system has a good **selector brain** and a decent **quality discipline**, but the writer itself is still fundamentally a **structured metadata renderer**.

The redesign should preserve the upstream intelligence and replace the drafting core with a **story-planning writing engine** that knows:
- how to enter,
- what point it is making,
- how the article should move,
- when to explain,
- and how to end without sounding templated.

The crucial shift is:

> from “render all the useful fields cleanly”
> to
> “choose the best route through the story and write it like an article.”
