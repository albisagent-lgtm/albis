import type { BriefingContent } from "./email-templates/company-briefing";
import type { CompanyBriefingGenerationOutput } from "./company-scan/types";

export type CompanyBriefingContentVersion = "company_briefing_v2" | "legacy_what_changed" | "unknown";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isCompanyBriefingV2Content(
  content: unknown
): content is CompanyBriefingGenerationOutput {
  if (!isRecord(content)) return false;
  return (
    content.output_version === "company_briefing_generation_v1" &&
    isRecord(content.today_brief) &&
    isRecord(content.main_briefing) &&
    isRecord(content.perception_gap) &&
    isRecord(content.useful_observations) &&
    isRecord(content.source_notes)
  );
}

export function isLegacyCompanyBriefingContent(
  content: unknown
): content is BriefingContent {
  if (!isRecord(content)) return false;
  return (
    isRecord(content.header) &&
    Array.isArray(content.what_changed) &&
    typeof content.why_it_matters === "string" &&
    Array.isArray(content.what_to_watch)
  );
}

export function getCompanyBriefingContentVersion(
  content: unknown
): CompanyBriefingContentVersion {
  if (isCompanyBriefingV2Content(content)) return "company_briefing_v2";
  if (isLegacyCompanyBriefingContent(content)) return "legacy_what_changed";
  return "unknown";
}

export function allowLegacyCompanyPipeline(): boolean {
  return process.env.ALLOW_LEGACY_COMPANY_PIPELINE === "1";
}
