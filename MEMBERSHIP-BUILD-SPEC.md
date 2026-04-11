# MEMBERSHIP-BUILD-SPEC.md — Albis Personalised Intelligence Layer

---

## ⚠️ CRITICAL INSTRUCTION FOR CLAUDE CODE — READ FIRST

**Build this as an extension of the existing Albis/OpenClaw system. Do not create a disconnected parallel product.**

This membership layer must be built directly into the current project structure. Specifically:

- **Reuse the existing scan pipeline.** The global daily scan already runs. Company briefings are generated FROM its output. Do not build a separate scanning system.
- **Reuse the existing cron architecture.** New cron jobs (story tagging, briefing generation, email delivery) must follow the same patterns, scheduling approach, and infrastructure as the current daily scan crons. Do not introduce a separate job runner unless the current one cannot support it.
- **Reuse the current Supabase/database structure.** New tables (company_profiles, company_briefings, subscriptions, etc.) are added to the existing database. Do not create a separate database or Supabase project.
- **Reuse the current deployment flow.** The membership features deploy through the same pipeline as the rest of albis.news. No separate deployments.
- **Reuse the current project/repo structure.** New code lives alongside existing code in the same repository. Follow existing file organisation, naming conventions, and patterns.
- **Connect to existing data models.** The scan_stories / article data from the daily scan is the input layer for the company relevance engine. Reference existing tables and models — do not duplicate story/article storage.

**Before building anything in each phase, first inspect the existing codebase to understand:**
1. How the current scan pipeline works (what it produces, where it stores data, what format)
2. How current cron jobs are structured and scheduled
3. What database tables and models already exist
4. What the current auth situation is (if any)
5. What the current project structure and conventions are

**If something already exists that can be extended, extend it. Do not rebuild it.**

---

## Purpose
This document is the complete build specification for adding a membership and personalised daily briefing system to albis.news. It is designed to be fed into Claude Code phase-by-phase so each piece can be built cleanly without confusion.

## Architecture principle
The membership layer sits **on top of** the existing Albis global scanning engine. It does not replace anything. The public site continues to work exactly as it does today. The membership layer adds:
- authentication (sign up, log in, manage account)
- company profiles (sector, geography, watchlist, risk themes)
- personalised daily briefings generated from the same global scan
- email delivery of personalised briefings
- a logged-in dashboard for viewing briefings and managing preferences
- subscription/billing for paid tiers
- cron jobs to automate the daily personalised briefing pipeline

## Cost principle
The system must be cost-efficient. There is no excess budget. Key constraints:
- One global scan runs daily (already exists). Company briefings are generated **from** that scan — not as separate scans.
- Briefings are generated once per company per day via cron, not on-demand.
- LLM usage is the main variable cost. Briefings must stay concise (2-minute read) to control token cost.
- No on-demand scanning in MVP. Companies receive their daily briefing — that is the product.

## Product model
- The **daily personalised briefing** is the core paid product.
- Companies set up a profile defining what matters to them.
- Every day, the system scores the global scan output against each company profile and generates a tailored briefing.
- The briefing is delivered by email and viewable on the dashboard.
- Companies do **not** run their own scans. They receive a briefing built from the shared global scan.

---

# PHASE 1 — Authentication & User Accounts

## Goal
Add authentication to albis.news so users can sign up, log in, and manage their account. This is the foundation everything else builds on.

## What to build

### 1.1 Auth system
- Email + password authentication
- Sign up flow
- Log in flow
- Password reset flow
- Session management (JWT or session cookies)
- "Log in" / "Sign up" buttons in the site navigation (visible on all pages)
- Logged-in state: show user menu with account link and log out
- Logged-out state: show "Log in" / "Sign up" buttons

### 1.2 User model
```
users
├── id (uuid)
├── email (unique)
├── password_hash
├── name
├── created_at
├── updated_at
├── email_verified (boolean)
├── role (enum: 'free', 'pro', 'team_member', 'team_admin', 'enterprise')
├── subscription_status (enum: 'none', 'trial', 'active', 'cancelled', 'expired')
├── subscription_tier (enum: null, 'pro', 'team', 'company_intelligence', 'enterprise')
└── last_login_at
```

### 1.3 Email verification
- Send verification email on sign up
- Verify email before allowing full access
- Resend verification option

### 1.4 Pages to create
- `/login` — log in page
- `/signup` — sign up page
- `/reset-password` — password reset request
- `/reset-password/[token]` — password reset form
- `/account` — account settings (name, email, password change)

### 1.5 Navigation changes
- Add auth buttons to existing nav bar
- When logged in, show user dropdown with: Dashboard, Account, Log out
- Keep all existing public navigation intact

## Technical notes
- Use whatever auth approach fits the existing stack (e.g. NextAuth, Supabase Auth, custom JWT)
- Passwords must be hashed (bcrypt or argon2)
- All auth routes must be HTTPS
- Sessions should expire after reasonable period (e.g. 30 days)

## What NOT to build in this phase
- No company profiles yet
- No dashboard yet (just the account page)
- No billing/payments
- No personalised briefings

## Done when
- A user can sign up, verify email, log in, log out, reset password
- Auth state persists across page loads
- Navigation reflects logged-in/logged-out state
- Account page allows basic profile editing

---

# PHASE 2 — Company Profile & Onboarding

## Goal
Allow logged-in users to create and manage a company profile that defines what matters to their business. This profile becomes the input for personalised briefing generation.

## What to build

### 2.1 Company profile model
```
company_profiles
├── id (uuid)
├── owner_id (references users.id)
├── company_name
├── created_at
├── updated_at
├── onboarding_completed (boolean)
│
├── sector (enum or string — see sector list below)
├── sub_sector (optional, free text)
│
├── countries (array of country codes — operating regions)
├── regions (array — e.g. 'Middle East', 'Southeast Asia', 'Europe')
│
├── supply_chain_exposure (array of strings — e.g. 'shipping routes', 'fertiliser', 'semiconductors')
│
├── tracked_themes (array of strings — e.g. 'sanctions', 'trade policy', 'energy prices')
│   └── max 15 for MVP
│
├── watchlist_entities (array of strings — competitors, organisations, people)
│   └── max 15 for MVP
│
├── risk_priorities (array of enums — see risk list below)
│
├── preferred_briefing_depth (enum: 'executive_summary', 'standard', 'detailed')
├── preferred_delivery_time (time — e.g. '07:00')
├── timezone (string — e.g. 'Pacific/Auckland')
│
└── delivery_preferences
    ├── email_enabled (boolean, default true)
    ├── email_recipients (array of emails — max 3 for pro, max 10 for team)
    └── dashboard_enabled (boolean, default true)
```

### 2.2 Sector options (predefined list)
- Logistics / Shipping / Freight
- Food / Agriculture / FMCG
- Manufacturing / Industrial
- Energy / Utilities
- Mining / Resources
- Investment / Finance / Macro
- Technology / Software
- Pharmaceuticals / Healthcare
- Construction / Infrastructure
- Retail / Consumer
- Media / Communications / PR
- Government / Public Sector
- Consulting / Advisory
- Legal / Compliance
- Education / Research
- Other (free text)

### 2.3 Risk priority options (select up to 5)
- Supply chain disruption
- Commodity price volatility
- Geopolitical / conflict risk
- Regulatory / policy change
- Trade / tariff / sanctions risk
- Currency / financial market risk
- Climate / weather / environmental risk
- Cyber / technology risk
- Reputation / narrative risk
- Energy price / availability risk
- Food / water security risk
- Labour / workforce risk

### 2.4 Onboarding flow
When a user first creates a company profile, walk them through a step-by-step onboarding:

**Step 1 — Company basics**
- Company name
- Sector (select from list)
- Sub-sector (optional free text)

**Step 2 — Geography**
- Countries of operation (multi-select from country list)
- Regions of interest (multi-select)

**Step 3 — What to track**
- Tracked themes (multi-select or tag input, max 15)
- Watchlist entities (tag input — competitors, organisations, max 15)
- Supply chain exposure (tag input)

**Step 4 — Risk priorities**
- Select up to 5 risk priorities from the list

**Step 5 — Delivery preferences**
- Briefing depth preference
- Preferred delivery time
- Timezone
- Email recipients

**Step 6 — Confirmation**
- Summary of profile
- "Your first briefing will arrive tomorrow at [time]"
- Option to edit any section

### 2.5 Profile management page
- `/dashboard/profile` — view and edit all company profile settings
- Each section from onboarding should be editable independently
- Changes take effect from the next day's briefing

### 2.6 Pages to create
- `/onboarding` — multi-step onboarding flow (redirects here after first login if no profile)
- `/dashboard/profile` — profile management

## Technical notes
- Company profile is linked to a user via owner_id
- For MVP, one user = one company profile
- Team features (multiple users per company) come in a later phase
- Store arrays as JSON or use a relational approach depending on database choice
- Pre-populate country/region lists — use ISO country codes
- Tracked themes and watchlist entities should support free-text tag input with optional suggestions

## What NOT to build in this phase
- No briefing generation yet
- No relevance scoring engine
- No email delivery pipeline
- No billing
- No team/multi-user features

## Done when
- A logged-in user can complete onboarding and create a company profile
- Profile is stored in the database
- User can view and edit their profile from the dashboard
- Profile has all fields needed for briefing personalisation

---

# PHASE 3 — Relevance Scoring & Briefing Generation

## Goal
Build the engine that takes the daily global scan output and generates a personalised briefing for each company profile. This is the core intelligence layer.

## What to build

### 3.1 Story metadata model
Each story from the daily global scan needs structured metadata for matching. If this metadata doesn't already exist on scan output, it needs to be added.

```
scan_stories (daily)
├── id (uuid)
├── scan_date (date)
├── title
├── summary
├── full_text / content
├── source_url
├── source_region
├── source_language
│
├── countries_mentioned (array of country codes)
├── regions_relevant (array)
├── sectors_affected (array — from the same sector list as company profiles)
├── themes (array — e.g. 'sanctions', 'shipping disruption', 'energy prices')
├── entities_mentioned (array — organisations, people, companies)
├── commodities (array — e.g. 'oil', 'wheat', 'fertiliser', 'naphtha')
├── risk_types (array — from the same risk list as company profiles)
│
├── urgency_score (float 0-1)
├── significance_score (float 0-1)
│
└── pgi_score (float — Perception Gap Index, if available)
```

### 3.2 Story tagging pipeline
If the existing scan output does not have this structured metadata, build a tagging step:
- Run after the daily global scan completes
- For each story, extract/classify: countries, regions, sectors, themes, entities, commodities, risk types
- This can be rule-based, LLM-based, or hybrid
- LLM-based tagging should use a concise prompt to minimise cost
- Store tagged metadata alongside each story

### 3.3 Relevance scoring engine
For each company profile, score every story from today's scan:

```
relevance_score = weighted sum of:
├── geography_match (0-1) — story countries/regions overlap with company countries/regions
├── sector_match (0-1) — story sectors overlap with company sector
├── theme_match (0-1) — story themes overlap with company tracked themes
├── entity_match (0-1) — story entities overlap with company watchlist
├── supply_chain_match (0-1) — story commodities/themes overlap with company supply chain exposure
├── risk_match (0-1) — story risk types overlap with company risk priorities
├── urgency_boost (0-1) — story urgency score
└── significance_boost (0-1) — story significance score
```

Weighting suggestion for MVP:
- geography_match: 0.20
- sector_match: 0.20
- theme_match: 0.15
- entity_match: 0.15
- supply_chain_match: 0.10
- risk_match: 0.10
- urgency_boost: 0.05
- significance_boost: 0.05

The top 5–8 stories by relevance score are selected for the company's daily briefing.

### 3.4 Company briefing model
```
company_briefings
├── id (uuid)
├── company_profile_id (references company_profiles.id)
├── briefing_date (date)
├── generated_at (timestamp)
├── status (enum: 'pending', 'generating', 'generated', 'delivered', 'failed')
│
├── briefing_content (JSON or structured text)
│   ├── header
│   │   ├── company_name
│   │   ├── date
│   │   ├── scan_focus (top theme label)
│   │   └── signal_level (enum: 'low', 'moderate', 'elevated', 'high')
│   │
│   ├── what_changed (array of 3-5 items)
│   │   ├── headline
│   │   ├── summary (2-3 sentences)
│   │   ├── source_story_id (reference)
│   │   └── relevance_tags (why this was selected)
│   │
│   ├── why_it_matters (text — 2-4 sentences connecting developments to this company)
│   │
│   ├── what_to_watch (array of 2-4 items)
│   │   ├── monitor_point
│   │   └── timeframe (e.g. 'this week', 'next 30 days')
│   │
│   └── regional_framing (optional)
│       └── text (1-2 sentences on how different regions are framing the top story)
│
├── stories_considered (integer — how many stories were scored)
├── stories_selected (integer — how many made the briefing)
└── delivery_status (enum: 'pending', 'sent', 'failed')
```

### 3.5 Briefing generation step
- Takes the top-scored stories for a company profile
- Generates the briefing content using an LLM
- Prompt should include: company profile summary, selected stories with summaries, and instructions to produce the briefing in the structure defined above
- Output must be concise — target 300-500 words total (the "2-minute briefing")
- Store the generated briefing in the database

### 3.6 Briefing generation prompt (template)
```
You are generating a personalised daily intelligence briefing for a company.

Company profile:
- Name: {company_name}
- Sector: {sector}
- Operating regions: {countries}
- Tracked themes: {tracked_themes}
- Risk priorities: {risk_priorities}
- Watchlist entities: {watchlist_entities}
- Supply chain exposure: {supply_chain_exposure}

Today's most relevant developments for this company:
{top_stories_with_summaries}

Generate a briefing with these sections:
1. WHAT CHANGED — the 3-5 most relevant developments, each with a headline and 2-sentence summary
2. WHY IT MATTERS TO YOU — 2-4 sentences connecting these developments to this specific company's sector, geography, and risk exposure
3. WHAT TO WATCH NEXT — 2-4 near-term monitor points

Keep the total output under 500 words. Write in direct, clear business language. No filler. No preamble.
```

### 3.7 Data flow
```
Daily global scan (existing)
    ↓
Story tagging pipeline (new — Phase 3.2)
    ↓
Tagged stories stored in database
    ↓
For each active company profile:
    ↓
    Relevance scoring (Phase 3.3)
    ↓
    Select top 5-8 stories
    ↓
    Generate briefing via LLM (Phase 3.5)
    ↓
    Store briefing in database (Phase 3.4)
    ↓
    Ready for delivery (Phase 4)
```

## Technical notes
- The relevance scoring engine should be deterministic and fast — no LLM calls in the scoring step
- LLM is only used for: (a) story tagging if needed, and (b) briefing text generation
- If there are 10 paying companies, this means ~10 LLM calls per day for briefing generation — very manageable cost
- Story tagging could use a cheaper/faster model (e.g. Haiku) while briefing generation uses a stronger model (e.g. Sonnet)
- All scoring weights should be configurable so they can be tuned over time based on feedback

## What NOT to build in this phase
- No email delivery yet (that's Phase 4)
- No dashboard view of briefings yet (that's Phase 5)
- No billing (that's Phase 6)

## Done when
- Stories from the daily scan have structured metadata (tagged)
- Each company profile gets a relevance-scored story list
- A briefing is generated and stored for each active company profile
- Briefing content follows the defined structure
- The pipeline can be triggered manually for testing

---

# PHASE 4 — Cron Jobs & Email Delivery

## Goal
Automate the daily briefing pipeline and deliver personalised briefings to companies by email every morning.

## What to build

### 4.1 Cron job: Story tagging
- **Trigger:** Runs after the daily global scan completes
- **Action:** Tags all new stories with structured metadata (countries, sectors, themes, entities, risk types, etc.)
- **Dependency:** Global scan must have completed for today
- **Error handling:** Log failures, retry once, alert admin if tagging fails
- **Estimated timing:** Should complete within 15-30 minutes of scan completion

### 4.2 Cron job: Briefing generation
- **Trigger:** Runs after story tagging is complete
- **Action:** For each active company profile:
  1. Score today's tagged stories against the company profile
  2. Select top stories
  3. Generate briefing via LLM
  4. Store briefing in database with status 'generated'
- **Dependency:** Story tagging must have completed for today
- **Error handling:** If generation fails for one company, log error and continue to next company. Do not block the entire pipeline.
- **Estimated timing:** ~30 seconds per company (LLM generation). At 10 companies = ~5 minutes. At 100 companies = ~50 minutes. Plan for parallel processing if needed at scale.

### 4.3 Cron job: Email delivery
- **Trigger:** Runs after briefing generation is complete, timed to each company's preferred delivery time
- **Action:** For each company with a 'generated' briefing:
  1. Format briefing into email HTML template
  2. Send to all email recipients in company delivery preferences
  3. Update briefing delivery_status to 'sent'
- **Scheduling approach for MVP:** Run delivery cron every hour. Check each company's preferred_delivery_time and timezone. If current hour matches their preferred hour and today's briefing hasn't been sent yet, send it.
- **Error handling:** Log delivery failures, retry once, mark as 'failed' if retry fails

### 4.4 Daily pipeline sequence
```
[Existing daily global scan]
    ↓ (completes)
[Cron 1: Story tagging] — tags all stories with metadata
    ↓ (completes)
[Cron 2: Briefing generation] — generates briefings for all active company profiles
    ↓ (completes)
[Cron 3: Email delivery] — sends briefings at each company's preferred time
```

### 4.5 Email template
Design a clean, branded email template for the daily briefing:

**Email subject line:** `Albis Daily Briefing — {company_name} — {date}`

**Email structure:**
```
[Albis logo]

DAILY BRIEFING
{company_name} · {date}
Signal level: {signal_level}

━━━━━━━━━━━━━━━━━━━━━━

WHAT CHANGED

1. {headline}
   {2-sentence summary}

2. {headline}
   {2-sentence summary}

3. {headline}
   {2-sentence summary}

━━━━━━━━━━━━━━━━━━━━━━

WHY IT MATTERS TO YOU

{2-4 sentences}

━━━━━━━━━━━━━━━━━━━━━━

WHAT TO WATCH NEXT

• {monitor point}
• {monitor point}
• {monitor point}

━━━━━━━━━━━━━━━━━━━━━━

[View on dashboard →]
[Manage preferences →]
[Unsubscribe]
```

**Email design notes:**
- Clean, minimal design consistent with Albis brand
- Dark text on white/light background
- No heavy graphics or images
- Mobile-responsive
- Should feel like a professional intelligence brief, not a marketing email

### 4.6 Email service
- Use a transactional email service (e.g. Resend, Postmark, SendGrid, AWS SES)
- Choose based on cost, deliverability, and ease of integration
- For MVP, Resend or Postmark are recommended for simplicity and good deliverability
- Send from a branded address: `briefing@albis.news` or `scan@albis.news`

### 4.7 Pipeline monitoring
- Log each step of the pipeline with timestamps
- Track: scan completion time, tagging completion time, briefing generation time per company, delivery time per company
- Create a simple admin view or log output showing pipeline health
- Alert mechanism (email to admin) if any step fails

### 4.8 Pipeline status model
```
pipeline_runs
├── id (uuid)
├── run_date (date)
├── scan_completed_at (timestamp)
├── tagging_started_at (timestamp)
├── tagging_completed_at (timestamp)
├── tagging_stories_count (integer)
├── generation_started_at (timestamp)
├── generation_completed_at (timestamp)
├── generation_companies_count (integer)
├── generation_failures (integer)
├── delivery_started_at (timestamp)
├── delivery_completed_at (timestamp)
├── delivery_sent_count (integer)
├── delivery_failures (integer)
└── status (enum: 'running', 'completed', 'partial_failure', 'failed')
```

## Technical notes
- Cron jobs should be idempotent — if re-run for the same date, they should not duplicate briefings
- Each briefing is keyed by (company_profile_id, briefing_date) — unique constraint
- If the global scan is delayed, the downstream pipeline should wait, not run on stale data
- Consider using a job queue (e.g. BullMQ, or simple database-backed queue) if the system needs to scale beyond ~50 companies

## What NOT to build in this phase
- No dashboard view yet (Phase 5)
- No billing (Phase 6)
- No weekly summary briefings
- No Slack/Teams delivery

## Done when
- The full pipeline runs automatically every day: scan → tag → generate → deliver
- Each company with an active profile receives a personalised briefing email at their preferred time
- Pipeline status is logged and failures are tracked
- Email template is clean, branded, and mobile-responsive
- Briefings are stored in the database for later dashboard access

---

# PHASE 5 — Dashboard & Briefing Archive

## Goal
Build the logged-in dashboard experience where companies can view their daily briefings, browse their archive, and manage their profile.

## What to build

### 5.1 Dashboard home — `/dashboard`
The main view after login. Shows:
- Today's briefing (or "Your briefing is being prepared" if not yet generated)
- Quick stats: days since signup, briefings received, top themes this week
- Link to profile settings
- Link to briefing archive

### 5.2 Today's briefing view — `/dashboard/briefing/today`
Renders today's briefing in a clean, readable format:
- Header: company name, date, scan focus, signal level
- What Changed section
- Why It Matters section
- What to Watch section
- Regional Framing section (if available)
- Each story headline should link to the source article on albis.news if applicable

### 5.3 Briefing archive — `/dashboard/briefings`
- List of all past briefings, newest first
- Each entry shows: date, top theme, signal level
- Click to view any past briefing in full
- Simple pagination or infinite scroll

### 5.4 Individual briefing view — `/dashboard/briefing/[date]`
- Same layout as today's briefing view
- Shows the briefing for a specific date

### 5.5 Profile management — `/dashboard/profile`
- View and edit all company profile settings
- Organised by section (basics, geography, themes, risk, delivery)
- Changes save immediately and take effect from the next day's briefing
- Show confirmation: "Changes saved. Your next briefing will reflect these updates."

### 5.6 Dashboard navigation
- Sidebar or top nav within the dashboard area:
  - Today's Briefing
  - Briefing Archive
  - Company Profile
  - Account Settings
  - (Later: Subscription/Billing)

### 5.7 Design principles for the dashboard
- Clean, minimal, fast-loading
- Consistent with the Albis brand: calm, intelligent, no clutter
- The briefing should be the hero — not charts, widgets, or feature sprawl
- Mobile-responsive — many users will check their briefing on their phone
- The dashboard should feel like opening a personalised intelligence document, not a SaaS platform

## What NOT to build in this phase
- No analytics or trend tracking
- No team features or multi-user views
- No billing management (Phase 6)
- No export features

## Done when
- Logged-in users see their dashboard with today's briefing
- Users can browse their full briefing archive
- Users can edit their company profile
- The experience is clean, fast, and mobile-responsive
- Navigation between dashboard sections is intuitive

---

# PHASE 6 — Subscription & Billing

## Goal
Add paid subscription tiers and billing so companies pay for the personalised briefing service.

## What to build

### 6.1 Subscription tiers (MVP)

**Free tier (optional — for lead generation)**
- Access to public albis.news content
- Free daily global newsletter (the existing one)
- No personalised briefing
- No company profile

**Pro — for solo founders, analysts, consultants**
- 1 company profile
- Daily personalised briefing
- Email delivery (1 recipient)
- Dashboard + archive access
- Up to 10 tracked themes
- Up to 10 watchlist entities

**Team — for small teams**
- 1 company profile
- Daily personalised briefing
- Email delivery (up to 5 recipients)
- Dashboard + archive access
- Up to 15 tracked themes
- Up to 15 watchlist entities
- Weekly summary briefing

**Company Intelligence — for serious usage**
- 1 company profile (expanded)
- Daily personalised briefing
- Email delivery (up to 10 recipients)
- Dashboard + archive access
- Up to 25 tracked themes
- Up to 25 watchlist entities
- Weekly summary briefing
- Priority support

**Enterprise — custom (not self-serve)**
- Multiple briefing streams / profiles
- Unlimited recipients
- Custom integrations
- Onboarding support
- Contact sales

### 6.2 Billing integration
- Use Stripe for payment processing
- Support monthly and annual billing (annual = discount)
- Implement Stripe Checkout for signup
- Implement Stripe Customer Portal for managing subscription (upgrade, downgrade, cancel, update payment method)
- Webhook handlers for: subscription created, updated, cancelled, payment failed

### 6.3 Subscription model
```
subscriptions
├── id (uuid)
├── user_id (references users.id)
├── stripe_customer_id
├── stripe_subscription_id
├── tier (enum: 'pro', 'team', 'company_intelligence')
├── status (enum: 'trialing', 'active', 'past_due', 'cancelled', 'expired')
├── current_period_start (timestamp)
├── current_period_end (timestamp)
├── cancel_at_period_end (boolean)
├── created_at
└── updated_at
```

### 6.4 Tier enforcement
- Check subscription tier when user tries to:
  - Add more tracked themes than their tier allows
  - Add more watchlist entities than their tier allows
  - Add more email recipients than their tier allows
- Show upgrade prompts when limits are hit
- If subscription expires or is cancelled, stop generating briefings but keep the profile and archive accessible for 30 days

### 6.5 Trial period
- Offer a 7-day or 14-day free trial (test which converts better)
- Trial includes full Pro-tier features
- No credit card required to start trial (lower friction)
- Email reminders: day 1 welcome, mid-trial check-in, 2 days before trial ends, trial ended

### 6.6 Pages to create
- `/pricing` — public pricing page showing tiers and features
- `/dashboard/subscription` — manage subscription, view current plan, upgrade/downgrade
- `/checkout/[tier]` — redirect to Stripe Checkout

### 6.7 Pricing page design
- Clean comparison of tiers
- Clear CTAs: "Start free trial" for Pro/Team, "Contact us" for Enterprise
- Emphasise the value: "decision intelligence in 2 minutes" not "monitoring subscription"
- Show example briefing preview or screenshot

## Technical notes
- Stripe is the recommended payment provider for simplicity, reliability, and global support
- Use Stripe Checkout (hosted) for MVP — avoids building custom payment forms
- Use Stripe Customer Portal for subscription management — avoids building custom billing UI
- Webhook endpoint must handle all subscription lifecycle events
- Store Stripe customer ID and subscription ID in your database
- Always verify subscription status on the server side, never trust client-side tier claims

## What NOT to build in this phase
- No enterprise self-serve (enterprise is manual/sales-led)
- No invoicing
- No team management (adding/removing team members)
- No usage-based billing

## Done when
- Pricing page is live on albis.news
- Users can sign up for a free trial
- Users can subscribe to Pro or Team tier via Stripe Checkout
- Subscription status is enforced (tier limits, active/expired)
- Users can manage their subscription (upgrade, cancel) via Stripe Customer Portal
- Trial emails are sent at the right times
- Webhook handlers process all subscription events correctly

---

# PHASE 7 — Refinement, Feedback & Growth Layer

## Goal
Improve briefing quality, collect user feedback, and add features that increase retention and value.

## What to build

### 7.1 Briefing feedback mechanism
- After each briefing (email and dashboard), include a simple feedback option:
  - "Was this briefing useful?" — Yes / Somewhat / No
  - Optional: "Any stories we missed?" (free text)
- Store feedback linked to the briefing

### 7.2 Feedback model
```
briefing_feedback
├── id (uuid)
├── briefing_id (references company_briefings.id)
├── company_profile_id
├── rating (enum: 'useful', 'somewhat', 'not_useful')
├── comment (text, optional)
├── created_at
```

### 7.3 Relevance tuning
- Use feedback data to adjust relevance scoring weights over time
- If a company consistently rates briefings as "not useful," flag for manual review
- Track which themes and entities generate the most engagement

### 7.4 Weekly summary briefing
- For Team and Company Intelligence tiers
- Generated every Monday morning
- Summarises the week's key developments for the company
- Highlights emerging trends or escalating risks
- Delivered by email and viewable on dashboard

### 7.5 Weekly summary cron job
- **Trigger:** Every Monday at a configured time
- **Action:** For each eligible company profile:
  1. Retrieve the past 7 days of briefings
  2. Generate a weekly summary via LLM
  3. Store and deliver

### 7.6 Briefing explainability
- On the dashboard, each story in the briefing should show a small "Why this was included" tooltip or expandable section
- Example: "Matched: shipping sector + Hormuz geography + supply chain disruption theme"
- This builds trust and helps companies refine their profile

### 7.7 Onboarding improvements
- Sector-specific templates: when a company selects "Logistics / Shipping," pre-populate suggested themes (e.g. 'shipping routes', 'freight rates', 'port disruption', 'sanctions') and risk priorities
- This reduces onboarding friction and improves first-briefing quality

### 7.8 Admin dashboard (internal)
- View all active company profiles
- View pipeline status and history
- View briefing generation stats (cost, timing, failures)
- View feedback summary
- Manage users and subscriptions manually if needed

## What NOT to build in this phase
- No Slack/Teams delivery (future phase)
- No API access (future phase)
- No multi-profile / multi-stream features (future phase)
- No audio briefings (future phase)

## Done when
- Users can give feedback on each briefing
- Weekly summaries are generated and delivered for eligible tiers
- Briefings show "why this was included" explainability
- Onboarding offers sector-specific templates
- Admin can monitor system health and feedback

---

# FUTURE PHASES (Not for MVP — document for planning only)

## Phase 8 — Team features
- Multiple users per company profile
- Role-based access (admin, member, viewer)
- Invite flow for team members
- Shared dashboard

## Phase 9 — Additional delivery channels
- Slack integration
- Microsoft Teams integration
- Webhook / API delivery
- PDF export of briefings

## Phase 10 — Advanced intelligence features
- Trend tracking over time (how themes/risks are evolving week over week)
- Competitor tracking with dedicated section in briefing
- Entity relationship mapping
- Scenario / risk mode (what-if analysis)
- Supply chain stress map visualisation

## Phase 11 — Scale & optimisation
- Parallel briefing generation
- Caching layer for story tagging
- Briefing quality scoring (automated)
- A/B testing briefing formats
- Cost optimisation for LLM usage

## Phase 12 — Premium features
- Audio briefing (text-to-speech version)
- Board / executive mode (condensed single-paragraph briefing)
- Investor mode (market-signal focused)
- Comms / reputation mode (narrative-risk focused)
- On-demand scanning (premium tier only)

---

# APPENDIX A — Database Schema Summary

```
users
company_profiles (belongs to user)
scan_stories (daily, from global scan)
company_story_matches (join: company_profile + scan_story + relevance_score)
company_briefings (belongs to company_profile, one per day)
briefing_feedback (belongs to company_briefing)
subscriptions (belongs to user)
delivery_log (tracks email sends per briefing)
pipeline_runs (tracks daily pipeline health)
```

# APPENDIX B — Cron Job Summary

| Job | Trigger | Depends on | Frequency |
|-----|---------|------------|-----------|
| Global scan | Scheduled (existing) | — | Daily (or 3x daily) |
| Story tagging | After scan completes | Global scan | Daily |
| Briefing generation | After tagging completes | Story tagging | Daily |
| Email delivery | Hourly check against preferred times | Briefing generation | Hourly |
| Weekly summary | Monday morning | Past 7 days of briefings | Weekly |
| Trial reminder emails | Daily check | User signup date | Daily |
| Pipeline health check | After all jobs | All pipeline jobs | Daily |

# APPENDIX C — Key Technical Decisions to Make Before Building

1. **Database:** PostgreSQL recommended. Supports JSON fields for arrays, good ecosystem, scales well.
2. **Auth:** Supabase Auth, NextAuth, or custom JWT — depends on existing stack.
3. **Email service:** Resend or Postmark recommended for MVP. Low cost, good deliverability, simple API.
4. **LLM for tagging:** Claude Haiku (fast, cheap) for story metadata tagging.
5. **LLM for briefing generation:** Claude Sonnet for briefing text generation (better quality).
6. **Cron/job scheduling:** Node-cron, system crontab, or a managed service depending on hosting.
7. **Payments:** Stripe (Checkout + Customer Portal for MVP).
8. **Hosting:** Depends on existing setup — Vercel, Railway, Fly.io, or self-hosted.

# APPENDIX D — Cost Estimation Per Company Per Day

Assuming Claude API pricing:
- Story tagging: ~1 Haiku call per story × ~50 stories/day = ~50 Haiku calls = ~$0.01-0.02/day (shared across all companies)
- Briefing generation: ~1 Sonnet call per company per day = ~$0.01-0.03 per company/day
- Email delivery: ~$0.001-0.005 per email (transactional email service)
- **Total variable cost per company per day: ~$0.02-0.05**
- **Total variable cost per company per month: ~$0.60-1.50**

This means even modest subscription pricing (e.g. $49-99/month for Pro) has strong margins once the fixed costs (hosting, development) are covered.
