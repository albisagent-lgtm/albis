-- 2026-04-08 — Enable RLS on ALL public tables for Albis
-- Fixes Supabase security alert: rls_disabled_in_public
-- Confirmed via API testing: all 17 tables currently have RLS DISABLED.
-- Anyone with the project URL + anon key can read, insert, update, delete.
--
-- Access model:
--   service_role  → full access on every table (crons, API routes, admin)
--   anon/authed   → SELECT only on public content tables
--   anon/authed   → NO access to subscribers, profiles, framing_lab_submissions
--   authenticated → own-row SELECT/UPDATE/INSERT on profiles
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

begin;

-- ============================================================
-- 1) ENABLE RLS on every public table
-- ============================================================
alter table public.scans enable row level security;
alter table public.scan_items enable row level security;
alter table public.scan_pulse enable row level security;
alter table public.subscribers enable row level security;
alter table public.profiles enable row level security;
alter table public.quiz_results enable row level security;
alter table public.pgi_daily enable row level security;
alter table public.pgi_weekly enable row level security;
alter table public.pgi_story_scores enable row level security;
alter table public.pgi_region_pairs enable row level security;
alter table public.pgi_signature_pieces enable row level security;
alter table public.gai_daily enable row level security;
alter table public.gai_weekly enable row level security;
alter table public.gai_story_scores enable row level security;
alter table public.briefings enable row level security;
alter table public.framing_lab_submissions enable row level security;
alter table public.breaking_news enable row level security;

-- ============================================================
-- 2) DROP any existing policies (idempotent — safe to rerun)
-- ============================================================
-- Public read policies
drop policy if exists "anon read scans" on public.scans;
drop policy if exists "anon read scan_items" on public.scan_items;
drop policy if exists "anon read scan_pulse" on public.scan_pulse;
drop policy if exists "anon read pgi_daily" on public.pgi_daily;
drop policy if exists "anon read pgi_weekly" on public.pgi_weekly;
drop policy if exists "anon read pgi_story_scores" on public.pgi_story_scores;
drop policy if exists "anon read pgi_region_pairs" on public.pgi_region_pairs;
drop policy if exists "anon read pgi_signature_pieces" on public.pgi_signature_pieces;
drop policy if exists "anon read gai_daily" on public.gai_daily;
drop policy if exists "anon read gai_weekly" on public.gai_weekly;
drop policy if exists "anon read gai_story_scores" on public.gai_story_scores;
drop policy if exists "anon read briefings" on public.briefings;
drop policy if exists "anon read breaking_news" on public.breaking_news;
drop policy if exists "anon read quiz_results" on public.quiz_results;
-- Profile policies
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "users insert own profile" on public.profiles;
-- Service role policies
drop policy if exists "service_role all scans" on public.scans;
drop policy if exists "service_role all scan_items" on public.scan_items;
drop policy if exists "service_role all scan_pulse" on public.scan_pulse;
drop policy if exists "service_role all subscribers" on public.subscribers;
drop policy if exists "service_role all profiles" on public.profiles;
drop policy if exists "service_role all quiz_results" on public.quiz_results;
drop policy if exists "service_role all pgi_daily" on public.pgi_daily;
drop policy if exists "service_role all pgi_weekly" on public.pgi_weekly;
drop policy if exists "service_role all pgi_story_scores" on public.pgi_story_scores;
drop policy if exists "service_role all pgi_region_pairs" on public.pgi_region_pairs;
drop policy if exists "service_role all pgi_signature_pieces" on public.pgi_signature_pieces;
drop policy if exists "service_role all gai_daily" on public.gai_daily;
drop policy if exists "service_role all gai_weekly" on public.gai_weekly;
drop policy if exists "service_role all gai_story_scores" on public.gai_story_scores;
drop policy if exists "service_role all briefings" on public.briefings;
drop policy if exists "service_role all framing_lab_submissions" on public.framing_lab_submissions;
drop policy if exists "service_role all breaking_news" on public.breaking_news;
-- Legacy policy names from previous SQL attempts
drop policy if exists "public read scans" on public.scans;
drop policy if exists "public read scan_items" on public.scan_items;
drop policy if exists "public read scan_pulse" on public.scan_pulse;
drop policy if exists "public read pgi_story_scores" on public.pgi_story_scores;
drop policy if exists "public read pgi_region_pairs" on public.pgi_region_pairs;
drop policy if exists "public read pgi_daily" on public.pgi_daily;
drop policy if exists "public read pgi_signature_pieces" on public.pgi_signature_pieces;
drop policy if exists "public read briefings" on public.briefings;
drop policy if exists "public read gai_daily" on public.gai_daily;
drop policy if exists "public read gai_story_scores" on public.gai_story_scores;
drop policy if exists "public read breaking_news" on public.breaking_news;
drop policy if exists "public insert subscribers" on public.subscribers;
drop policy if exists "public insert quiz_results" on public.quiz_results;
drop policy if exists "public insert framing_lab_submissions" on public.framing_lab_submissions;
drop policy if exists "users view own profile" on public.profiles;
drop policy if exists "service role full access scans" on public.scans;
drop policy if exists "service role full access scan_items" on public.scan_items;
drop policy if exists "service role full access scan_pulse" on public.scan_pulse;
drop policy if exists "service role full access subscribers" on public.subscribers;
drop policy if exists "service role full access profiles" on public.profiles;
drop policy if exists "service role full access quiz_results" on public.quiz_results;
drop policy if exists "service role full access pgi_story_scores" on public.pgi_story_scores;
drop policy if exists "service role full access pgi_region_pairs" on public.pgi_region_pairs;
drop policy if exists "service role full access pgi_daily" on public.pgi_daily;
drop policy if exists "service role full access pgi_signature_pieces" on public.pgi_signature_pieces;
drop policy if exists "service role full access briefings" on public.briefings;
drop policy if exists "service role full access framing_lab_submissions" on public.framing_lab_submissions;
drop policy if exists "service role full access gai_daily" on public.gai_daily;
drop policy if exists "service role full access gai_story_scores" on public.gai_story_scores;
drop policy if exists "service role full access breaking_news" on public.breaking_news;

-- ============================================================
-- 3) PUBLIC READ policies — content the website displays
--    SELECT only. No insert/update/delete for anon.
-- ============================================================

-- Scan data (homepage, scan viewer, scan-parser.ts uses anon key)
create policy "anon read scans"       on public.scans           for select to anon, authenticated using (true);
create policy "anon read scan_items"  on public.scan_items      for select to anon, authenticated using (true);
create policy "anon read scan_pulse"  on public.scan_pulse      for select to anon, authenticated using (true);

-- PGI tables (indexes page, PGI charts, public dataset API)
create policy "anon read pgi_daily"             on public.pgi_daily             for select to anon, authenticated using (true);
create policy "anon read pgi_weekly"            on public.pgi_weekly            for select to anon, authenticated using (true);
create policy "anon read pgi_story_scores"      on public.pgi_story_scores      for select to anon, authenticated using (true);
create policy "anon read pgi_region_pairs"      on public.pgi_region_pairs      for select to anon, authenticated using (true);
create policy "anon read pgi_signature_pieces"  on public.pgi_signature_pieces  for select to anon, authenticated using (true);

-- GAI tables (indexes page, GAI charts)
create policy "anon read gai_daily"        on public.gai_daily        for select to anon, authenticated using (true);
create policy "anon read gai_weekly"       on public.gai_weekly       for select to anon, authenticated using (true);
create policy "anon read gai_story_scores" on public.gai_story_scores for select to anon, authenticated using (true);

-- Briefings (homepage, archive page)
create policy "anon read briefings" on public.briefings for select to anon, authenticated using (true);

-- Breaking news banner
create policy "anon read breaking_news" on public.breaking_news for select to anon, authenticated using (true);

-- Quiz results (public stats)
create policy "anon read quiz_results" on public.quiz_results for select to anon, authenticated using (true);

-- ============================================================
-- 4) PRIVATE tables — NO anon access at all
--    subscribers: email addresses — sensitive PII
--    profiles: user account data — auth-gated
--    framing_lab_submissions: user-submitted content
-- ============================================================

-- Profiles: authenticated users can only see/edit their own row
create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- subscribers & framing_lab_submissions: no anon/authed policies at all
-- All access goes through API routes that use the service_role key

-- ============================================================
-- 5) SERVICE ROLE — full access on every table
--    This is the admin key used by cron jobs, API routes,
--    and the OpenClaw gateway. Bypasses RLS by default in
--    Supabase, but explicit policies ensure it works even
--    if "Respect RLS for service role" is ever toggled on.
-- ============================================================
create policy "service_role all scans"                on public.scans                for all to service_role using (true) with check (true);
create policy "service_role all scan_items"            on public.scan_items            for all to service_role using (true) with check (true);
create policy "service_role all scan_pulse"            on public.scan_pulse            for all to service_role using (true) with check (true);
create policy "service_role all subscribers"           on public.subscribers           for all to service_role using (true) with check (true);
create policy "service_role all profiles"              on public.profiles              for all to service_role using (true) with check (true);
create policy "service_role all quiz_results"          on public.quiz_results          for all to service_role using (true) with check (true);
create policy "service_role all pgi_daily"             on public.pgi_daily             for all to service_role using (true) with check (true);
create policy "service_role all pgi_weekly"            on public.pgi_weekly            for all to service_role using (true) with check (true);
create policy "service_role all pgi_story_scores"      on public.pgi_story_scores      for all to service_role using (true) with check (true);
create policy "service_role all pgi_region_pairs"      on public.pgi_region_pairs      for all to service_role using (true) with check (true);
create policy "service_role all pgi_signature_pieces"  on public.pgi_signature_pieces  for all to service_role using (true) with check (true);
create policy "service_role all gai_daily"             on public.gai_daily             for all to service_role using (true) with check (true);
create policy "service_role all gai_weekly"            on public.gai_weekly            for all to service_role using (true) with check (true);
create policy "service_role all gai_story_scores"      on public.gai_story_scores      for all to service_role using (true) with check (true);
create policy "service_role all briefings"             on public.briefings             for all to service_role using (true) with check (true);
create policy "service_role all framing_lab_submissions" on public.framing_lab_submissions for all to service_role using (true) with check (true);
create policy "service_role all breaking_news"         on public.breaking_news         for all to service_role using (true) with check (true);

commit;
