-- 2026-05-19 — Secure public source-trail share links for company briefings
--
-- Stores only a token hash. The bearer token itself is generated server-side and
-- sent only in the email/share URL, so database reads cannot reveal live links.

begin;

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_briefings_id_company_profile
  ON public.company_briefings(id, company_profile_id);

CREATE TABLE IF NOT EXISTS public.company_briefing_share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  briefing_id UUID NOT NULL REFERENCES public.company_briefings(id) ON DELETE CASCADE,
  company_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'source_trail' CHECK (purpose IN ('source_trail')),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0 CHECK (access_count >= 0),
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT company_briefing_share_links_token_hash_unique UNIQUE (token_hash),
  CONSTRAINT company_briefing_share_links_company_matches_briefing
    FOREIGN KEY (briefing_id, company_profile_id)
    REFERENCES public.company_briefings(id, company_profile_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cbsl_briefing_purpose
  ON public.company_briefing_share_links(briefing_id, purpose);
CREATE INDEX IF NOT EXISTS idx_cbsl_company_created
  ON public.company_briefing_share_links(company_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cbsl_active_source_trail
  ON public.company_briefing_share_links(token_hash)
  WHERE purpose = 'source_trail' AND revoked_at IS NULL;

ALTER TABLE public.company_briefing_share_links ENABLE ROW LEVEL SECURITY;

-- No authenticated end-user policy: public access is validated only by the
-- server route using the bearer token hash and service-role client.
CREATE POLICY "Service role can manage company briefing share links"
  ON public.company_briefing_share_links FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP TRIGGER IF EXISTS company_briefing_share_links_updated_at ON public.company_briefing_share_links;
CREATE TRIGGER company_briefing_share_links_updated_at
  BEFORE UPDATE ON public.company_briefing_share_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.increment_company_briefing_share_link_access(link_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.company_briefing_share_links
  SET access_count = access_count + 1,
      last_accessed_at = now(),
      updated_at = now()
  WHERE id = link_id;
$$;

REVOKE ALL ON FUNCTION public.increment_company_briefing_share_link_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_company_briefing_share_link_access(UUID) TO service_role;

commit;
