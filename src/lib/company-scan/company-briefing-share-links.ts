/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash, createHmac, randomBytes } from "crypto";

const SITE = "https://www.albis.news";
const SOURCE_TRAIL_PATH = "/source-trail/";
const PURPOSE = "source_trail";

type SupabaseLike = any;

type BriefingRow = {
  id: string;
  company_profile_id: string;
  briefing_date?: string;
  briefing_content?: unknown;
};

type LinkProbeResult = {
  id: string;
  revoked_at: string | null;
  expires_at: string | null;
};

export type CompanySourceTrailShareLinkResult = {
  url: string;
  token: string;
  tokenHash: string;
  content: Record<string, unknown>;
  created: boolean;
  reused: boolean;
};

function publicBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_URL ||
    SITE;
  const withProtocol = /^https?:\/\//i.test(fromEnv)
    ? fromEnv
    : `https://${fromEnv}`;
  return withProtocol.replace(/\/$/, "");
}

export function generateCompanyShareToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashCompanyShareToken(token: string): string {
  const secret = process.env.COMPANY_SHARE_LINK_TOKEN_SECRET;
  if (secret) {
    return createHmac("sha256", secret).update(token).digest("hex");
  }
  return createHash("sha256").update(token).digest("hex");
}

export function companySourceTrailUrl(token: string, baseUrl = publicBaseUrl()): string {
  return `${baseUrl}${SOURCE_TRAIL_PATH}${encodeURIComponent(token)}`;
}

export function extractCompanySourceTrailToken(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value, SITE);
    if (!parsed.pathname.startsWith(SOURCE_TRAIL_PATH)) return null;
    const token = decodeURIComponent(parsed.pathname.slice(SOURCE_TRAIL_PATH.length));
    return token && /^[A-Za-z0-9_-]{32,}$/.test(token) ? token : null;
  } catch {
    return null;
  }
}

function nestedRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function findEmbeddedSourceTrailToken(content: Record<string, unknown>): string | null {
  const sourceNotes = nestedRecord(content.source_notes);
  const scannerReport = nestedRecord(content.scanner_report);
  return (
    extractCompanySourceTrailToken(sourceNotes.source_trail_link) ||
    extractCompanySourceTrailToken(sourceNotes.dashboard_link) ||
    extractCompanySourceTrailToken(scannerReport.evidence_dashboard_link)
  );
}

function linkIsUsable(link: LinkProbeResult | null): boolean {
  if (!link || link.revoked_at) return false;
  if (!link.expires_at) return true;
  return new Date(link.expires_at).getTime() > Date.now();
}

async function probeUsableLink(
  supabase: SupabaseLike,
  tokenHash: string,
  briefingId: string,
): Promise<LinkProbeResult | null> {
  const { data, error } = await supabase
    .from("company_briefing_share_links")
    .select("id, revoked_at, expires_at")
    .eq("token_hash", tokenHash)
    .eq("briefing_id", briefingId)
    .eq("purpose", PURPOSE)
    .maybeSingle();

  if (error || !data) return null;
  return data as LinkProbeResult;
}

function withSourceTrailUrl(
  content: Record<string, unknown>,
  url: string,
): Record<string, unknown> {
  return {
    ...content,
    source_notes: {
      ...nestedRecord(content.source_notes),
      source_trail_link: url,
      dashboard_link: url,
    },
    scanner_report: content.scanner_report
      ? {
          ...nestedRecord(content.scanner_report),
          evidence_dashboard_link: url,
        }
      : content.scanner_report,
  };
}

export async function ensureCompanySourceTrailShareLink(
  supabase: SupabaseLike,
  briefing: BriefingRow,
): Promise<CompanySourceTrailShareLinkResult> {
  const content =
    briefing.briefing_content && typeof briefing.briefing_content === "object"
      ? ({ ...(briefing.briefing_content as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const existingToken = findEmbeddedSourceTrailToken(content);
  if (existingToken) {
    const tokenHash = hashCompanyShareToken(existingToken);
    const existingLink = await probeUsableLink(supabase, tokenHash, briefing.id);
    if (linkIsUsable(existingLink)) {
      const url = companySourceTrailUrl(existingToken);
      const linkedContent = withSourceTrailUrl(content, url);
      return {
        url,
        token: existingToken,
        tokenHash,
        content: linkedContent,
        created: false,
        reused: true,
      };
    }
  }

  const token = generateCompanyShareToken();
  const tokenHash = hashCompanyShareToken(token);
  const url = companySourceTrailUrl(token);

  const { error } = await supabase.from("company_briefing_share_links").insert({
    briefing_id: briefing.id,
    company_profile_id: briefing.company_profile_id,
    token_hash: tokenHash,
    purpose: PURPOSE,
  });

  if (error) throw new Error(`source_trail_share_link_create_failed:${error.message}`);

  const linkedContent = withSourceTrailUrl(content, url);
  const { error: updateError } = await supabase
    .from("company_briefings")
    .update({ briefing_content: linkedContent })
    .eq("id", briefing.id)
    .eq("company_profile_id", briefing.company_profile_id);

  if (updateError) {
    throw new Error(`source_trail_share_link_content_update_failed:${updateError.message}`);
  }

  return {
    url,
    token,
    tokenHash,
    content: linkedContent,
    created: true,
    reused: false,
  };
}

export async function recordCompanyShareLinkAccess(
  supabase: SupabaseLike,
  link: { id: string; access_count?: number | null },
): Promise<void> {
  if (supabase.rpc) {
    const { error } = await supabase.rpc("increment_company_briefing_share_link_access", {
      link_id: link.id,
    });
    if (!error) return;
  }

  await supabase
    .from("company_briefing_share_links")
    .update({
      access_count: Number(link.access_count || 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq("id", link.id);
}
