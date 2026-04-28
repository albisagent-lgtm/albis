-- 2026-04-25 — Persist structured match reasons on company_story_scores.
--
-- Replaces three render-time reconstructions of human-readable match tags
-- (in run-company-briefing-pipeline.ts, /api/company-briefings/score,
-- /api/company-briefings/score-all) with a single source of truth written
-- at scoring time and read by all downstream consumers (briefing payload,
-- dashboard "Why this matched" expander).
--
-- Shape (TypeScript):
--   type MatchReason = {
--     type: 'geography' | 'sector' | 'tracked_theme' | 'watchlist_entity'
--         | 'supply_chain' | 'risk_priority' | 'urgency' | 'significance';
--     matched: string[];          -- the company-side terms that overlapped
--     score: number;              -- the dimension sub-score (0..1)
--     explanation: string;        -- short human-readable why-string
--   };
--   match_reasons: MatchReason[];
--
-- Idempotent — safe to re-run.

ALTER TABLE public.company_story_scores
  ADD COLUMN IF NOT EXISTS match_reasons jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_company_story_scores_match_reasons
  ON public.company_story_scores USING gin (match_reasons);
