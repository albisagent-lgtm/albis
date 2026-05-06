# Launch readiness walkthrough — Albis for Companies

Manual checklist to run before flipping Stripe to live mode. Built at the end
of Package 7. Everything here exercises real code paths in **TEST mode** —
no live charges, no irreversible state changes. The final pre-launch decisions
section flags what flips when you go live.

Pair with `docs/company-build-brief.md` for context, and
`docs/company-scan-cron-setup.md` for cron-specific details.

> Time estimate: ~45 min for a clean run, longer if any issue surfaces.

---

## 1. Pre-flight checks

Confirm the environment is ready before touching anything user-facing.

### 1.1 Stripe TEST keys

`.env.local` (or hosting env) contains:

- [ ] `STRIPE_SECRET_KEY` starting with `sk_test_…`
- [ ] `STRIPE_WEBHOOK_SECRET` starting with `whsec_…` (paired to the **test**
      webhook endpoint, see §3.3)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starting with `pk_test_…`

`PRICE_TO_TIER` in `src/lib/stripe.ts` lists the test-mode price IDs you've
created in the Stripe Dashboard. Confirm each has a live counterpart that you
will swap in at launch (don't swap yet — see §6.1).

### 1.2 Migrations applied

Run against the live Supabase project (or whichever DB you're testing
against). All migrations in `supabase/migrations/` should be present. The
critical Pkg 7 migration:

- [ ] `20260426_add_test_account_and_trial.sql` applied — adds
      `profiles.is_test_account` and `profiles.trial_end_at`.

Quick verification (Supabase SQL editor):

```sql
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in ('is_test_account', 'trial_end_at');
-- expect 2 rows
```

If 0 rows: copy the migration body from
`supabase/migrations/20260426_add_test_account_and_trial.sql` and run it
manually. Idempotent.

### 1.3 Trial backfill

Existing onboarded users (pre-Pkg-7) have `subscription_status=null`. Run
the backfill so they enter the 3-day trial state cleanly:

```bash
npx tsx scripts/backfill-trial-state.ts            # dry-run, prints plan
npx tsx scripts/backfill-trial-state.ts --apply    # writes
```

- [ ] Dry-run output shows the expected eligible owners.
- [ ] `--apply` reports `✓ assigned` for each.
- [ ] `select id, email, subscription_status, trial_end_at from profiles
      where subscription_status = 'trialing'` returns the expected rows.

The backfill is idempotent — re-running is a no-op. The `is_test_account`
flag is respected (test accounts are skipped).

### 1.4 Company scan pipeline cron chosen

Canonical path: use the OpenClaw-side pipeline job documented in
`docs/company-scan-cron-setup.md`. Heavy Company Daily Scan generation must run
in the pipeline/job layer, write completed/QA'd rows to Supabase, and let the
Cloudflare app display/deliver those rows.

- [ ] Confirm the retired Phase 4 company cron jobs are not enabled in OpenClaw/Gateway.
- [ ] Create/enable only Package 8/v2 company scan-cycle jobs when approved.
- [ ] `scripts/run-company-scan-cycle.sh` is `chmod +x` on the openclaw box.
- [ ] Confirm pipeline env includes the editorial provider credentials, e.g.
      `ALBIS_EDITORIAL_MODEL_PROVIDER=cloudflare-workers-ai` plus
      `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, or an approved alternate provider.
- [ ] Test invocation: trigger one job manually, watch
      `logs/company-scan-cycle/<date>.log` for a clean run.

Do not activate Cloudflare scheduled triggers for heavy company scan generation
unless Ignatius explicitly approves a future architecture change.

### 1.5 Resend working

Resend domain `albis.news` is verified, API key present:

- [ ] `RESEND_API_KEY` in env.
- [ ] DNS for `briefing@albis.news` (or whatever `FROM_ADDRESS` is set to in
      `src/app/api/company-briefings/deliver/route.ts`) verified in Resend
      dashboard.
- [ ] Send a test email from the Resend dashboard to confirm the domain isn't
      paused or rate-limited.

### 1.6 End-to-end smoke test

Run the automated test once. Cleans up after itself.

```bash
npx tsx scripts/test-end-to-end-signup.ts
```

- [ ] Output ends with `✅ end-to-end test passed.`
- [ ] Cleanup section shows the test user / company / briefings deleted.

If the preflight aborts saying "Pkg 7 migration not applied," re-do §1.2.

---

## 2. Fresh signup walkthrough

Real browser, real Supabase auth, real Resend confirmation email — TEST
Stripe.

### 2.1 Sign up

1. Open `https://www.albis.news/signup` (or local dev origin).
2. Sign up with a real email you can check (use `+test` aliasing —
   `you+albis-launch@gmail.com`).
3. Confirm the verification email arrives within ~30s.
4. Click the magic link. You land on the post-auth callback.

- [ ] `select * from profiles where email = '<your email>'` returns one row,
      `subscription_status` is null at this stage.

### 2.2 Onboarding

1. You're redirected to `/onboarding/company`.
2. Fill out the wizard end-to-end with realistic data (a sector you'd
   actually track, 2-3 themes, a region, 2-3 watchlist entities, one
   risk priority, your real timezone).
3. Submit.

After the final step the client posts to `/api/onboarding/complete`. The
server runs:
- `assignFreeTrial(admin, userId)` → `profiles.subscription_status =
  'trialing'`, `trial_end_at = now() + 3 days`
- `generatePreviewBriefing(admin, companyProfileId)` → if any signals exist
  in the last 24h, a `company_briefings` row lands with status='generated'.

### 2.3 Preview briefing

- [ ] `select * from company_profiles where owner_id = '<your user id>'`
      shows the profile with `onboarding_completed = true`.
- [ ] `select * from profiles where id = '<your user id>'` shows
      `subscription_status='trialing'`, `subscription_tier='pro'`,
      `trial_end_at` ~3 days out.
- [ ] If signals exist: `select id, status, briefing_date from
      company_briefings where company_profile_id = '<id>'` shows a row.
- [ ] If no signals: status returned as `skipped_no_signals`. Acceptable —
      preview catches up the next time the cron runs.

### 2.4 Dashboard

1. Navigate to `/dashboard`.
2. Confirm you can see the briefing (if generated), the trial banner with
   days remaining, and the company profile editor.

- [ ] Trial countdown reads ~3 days.
- [ ] Briefings tab shows the preview if it generated, or "no briefings yet"
      otherwise.
- [ ] Coverage tab loads without errors.

---

## 3. Stripe checkout walkthrough

### 3.1 Test card

Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC, any
postal code. (Full list:
https://stripe.com/docs/testing#cards.)

### 3.2 Walk the flow

1. From `/account` (or `/pricing`), click **Subscribe** for Company
   Intelligence.
2. The browser POSTs to `/api/stripe/checkout` with the price ID.
3. `/api/stripe/checkout` reads `auth.getUser()` (never trusts a body-supplied
   userId), reuses any existing `stripe_customer_id`, and adds
   `subscription_data[trial_period_days]=3` for trialing/null users.
4. You land on Stripe Checkout. Pay with `4242 4242 4242 4242`.
5. Stripe redirects you to `/account?session_id=…`.

### 3.3 Webhook fires

The Stripe-hosted endpoint must be registered in the Stripe Dashboard:

```
URL:     https://www.albis.news/api/stripe/webhook
Events:  checkout.session.completed
         customer.subscription.created
         customer.subscription.updated
         customer.subscription.deleted
         invoice.payment_succeeded
         invoice.payment_failed
Mode:    Test
```

After paying, Stripe Dashboard → Developers → Events should show
`checkout.session.completed` then `customer.subscription.created` with HTTP
200 responses from your endpoint.

- [ ] `select subscription_status, subscription_tier, subscription_period_end,
      stripe_customer_id from profiles where id = '<your user id>'` now
      reads `subscription_status='trialing'` (or `'active'` if you skipped
      the trial), `stripe_customer_id` set, `subscription_period_end`
      populated.

### 3.4 Webhook idempotency

Stripe retries on 5xx responses. Re-deliver one of the events from the
Dashboard ("Resend" button) — the second delivery should be a no-op:

- [ ] Profile state unchanged after re-delivery.
- [ ] No duplicate row anywhere (the webhook upserts on `id` for the
      checkout-completed path, and updates by `stripe_customer_id` for the
      subscription events).

---

## 4. Customer portal walkthrough

### 4.1 Open the portal

1. From `/dashboard/subscription`, click **Manage subscription**.
2. Browser POSTs to `/api/stripe/portal`. The route reads the session,
   looks up `stripe_customer_id`, and creates a Billing Portal session.
3. You land on Stripe's hosted portal.

### 4.2 Cancel

1. Click **Cancel subscription** → "Cancel immediately" or
   "Cancel at period end" (try both in separate runs if you have time).
2. Return to the app.

For "Cancel at period end":
- [ ] Stripe sends `customer.subscription.updated` with
      `cancel_at_period_end=true`. Webhook applies the update — status stays
      `active` but the dashboard surfaces the pending cancellation. (If
      you're surfacing it — Pkg 7 doesn't add new UI for this.)

For "Cancel immediately":
- [ ] Stripe sends `customer.subscription.deleted`. Webhook flips
      `subscription_status='canceled'`, clears `subscription_tier`, sets
      `subscription_period_end` to the cancellation timestamp,
      `trial_end_at=null`.
- [ ] `select subscription_status from profiles where id = '<your user id>'`
      returns `'canceled'`.

### 4.3 Re-subscribe

1. Click **Subscribe** again (back at `/pricing`).
2. Pay with `4242 4242 4242 4242`.
3. Webhook fires `checkout.session.completed`.

- [ ] Profile flips back to `subscription_status='active'` (or `'trialing'`
      if eligible — note: a previously-canceled customer is **not** eligible
      for another trial because `eligibleForTrial` checks current status).

---

## 5. Edge cases

Run these after the happy path in §2-4 passes.

### 5.1 Interrupted onboarding

1. Sign up but close the tab on the second wizard step (no
   `onboarding_completed=true` write).
2. Sign back in later.

- [ ] You land back at `/onboarding/company` (the dashboard guards on
      `onboarding_completed`).
- [ ] No trial assigned yet (`subscription_status=null` because
      `assignFreeTrial` only fires from `/api/onboarding/complete`).
- [ ] Finishing the wizard later assigns the trial cleanly.

### 5.2 Expired trial

Forge an expired trial without waiting 3 days:

```sql
update profiles
   set trial_end_at = now() - interval '1 day'
 where id = '<test user id>';
```

- [ ] `shouldGenerateBriefing(profile)` returns true while
      `subscription_status='trialing'` regardless of `trial_end_at` —
      the trial ends when Stripe (or a future cron) flips status, not when
      `trial_end_at` passes. **Note this behavior.** If you want
      auto-expiry, wire a cron in Pkg 8 or post-launch that flips status to
      `'past_due'` when `trial_end_at < now()` for non-Stripe trials.
- [ ] Internal trials assigned by `/api/onboarding/complete` never get to
      Stripe and so never auto-expire today. Acceptable for v1 if you're
      pushing all trial users into a Stripe subscription via checkout
      reasonably quickly.
- [ ] Stripe-driven trials auto-flip via
      `customer.subscription.updated` from `trialing` → `active` (or
      `past_due`) — confirmed by the Stripe webhook handler.

### 5.3 Failed payment

Test card for failed payment: `4000 0000 0000 0341` (auth required, then
declines on capture). Or use Stripe Dashboard → Subscriptions → Actions →
"Mark invoice as failed" on the test subscription.

- [ ] Stripe sends `invoice.payment_failed`. Webhook flips
      `subscription_status='past_due'`.
- [ ] `isInGracePeriod(profile)` returns true (30-day window from
      `subscription_period_end`). User retains profile + archive access
      but `shouldGenerateBriefing` returns false → no new briefings, no
      new emails (CP5 gate on the deliver path catches this).
- [ ] After 30 days from `subscription_period_end`, `getEffectiveTier`
      returns the free tier.

### 5.4 is_test_account user

The hardcoded `TEST_COMPANY_OWNER_ID` bypass is gone (Pkg 7 CP1). Test
accounts now use a per-profile flag.

```sql
update profiles set is_test_account = true where id = '<your test user id>';
```

- [ ] `shouldGenerateBriefing(profile)` returns true regardless of
      `subscription_status` (verifiable in
      `src/lib/tier-enforcement.ts:isSubscriptionActive`).
- [ ] Briefings score, generate, and deliver for this user even with no
      Stripe state.
- [ ] The backfill script (§1.3) skips `is_test_account=true` profiles —
      verifiable in the dry-run output.

Reset the flag once done:

```sql
update profiles set is_test_account = false where id = '<your test user id>';
```

---

## 6. Pre-launch decisions

This section is what flips when you go live. **Do not run any of these
before §1-5 are all green.**

### 6.1 Live keys swap

In hosting environment (production env, not `.env.local`):

- [ ] `STRIPE_SECRET_KEY` → `sk_live_…`
- [ ] `STRIPE_WEBHOOK_SECRET` → live mode webhook secret (different from
      the test one)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_…`

In Stripe Dashboard:

- [ ] Live-mode Products + Prices created (different IDs from test mode).
- [ ] `PRICE_TO_TIER` in `src/lib/stripe.ts` updated to live price IDs (or
      sourced from env if you prefer).
- [ ] Live-mode webhook endpoint registered:
      `https://www.albis.news/api/stripe/webhook` with the same six events
      from §3.3, **Mode: Live**.

Deploy. Verify the deploy with one live transaction (start a real
subscription on a card you control, immediately cancel and refund), then
walk §3 again with the live card.

### 6.2 Cron activation

Choose one path from §1.4 and enable it. The first run window after
activation should:

- [ ] Trigger `buildUnionWatchGraph` → `runCompanyScan` →
      `runCompanySignalPipeline`.
- [ ] Land signals in `signals` and `company_signal_matches`.
- [ ] Generate briefings in `company_briefings` for all entitled customers.
- [ ] The hourly delivery cron picks up at the customer's
      `preferred_delivery_time` and emails via Resend.

Watch logs for the first full cycle. Failures during the first 24h are
common — most are Brave API rate limits or Resend domain issues.

### 6.3 Production smoke test

Use `scripts/test-end-to-end-signup.ts` against the live DB **carefully**:
the script creates a real auth user (with no email confirmation needed
because `email_confirm: true`), inserts a real company_profile, runs a
real preview generation, and cleans up. It does NOT call Stripe or send
email. Cost is bounded to the preview generation (template-only at v1, ~$0
until Pkg 8 swaps in OpenAI).

- [ ] Run once against live env. `✅ end-to-end test passed.` expected.
- [ ] `select count(*) from auth.users where email like 'e2e-test-%'`
      should be 0 (cleanup ran).

If anything fails: cleanup may have left orphan rows. Inspect, manually
remove, and fix in scope.

---

## Appendix — what's NOT covered here

These are flagged for post-launch / Pkg 8 / future work, not blockers:

- **Trial auto-expiry for internal-bootstrap trials.** §5.2 — a non-Stripe
  trial that hits `trial_end_at` doesn't auto-flip. Acceptable for v1
  because the conversion path is short, but worth a cron sweep eventually.
- **LLM-generated briefings.** Pkg 8. Today the briefing content is
  templated via `buildBriefingContent`. Cost-per-signup figure of ~$0.03
  in the brief assumes Pkg 8 has landed.
- **Cancellation retention UX.** Customer portal handles cancellation but
  there's no in-app "are you sure?" interception or retention offer.
  Post-launch.
- **Past-due email nudge.** No email is sent today when a payment fails;
  user discovers it on their dashboard. Post-launch.
- **Multi-seat / team billing.** Out of scope for V1. One profile per
  owner, one subscription per profile.
