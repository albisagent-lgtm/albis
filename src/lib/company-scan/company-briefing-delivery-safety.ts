// ---------------------------------------------------------------------------
// Minimal Company Daily Scan delivery safety.
//
// This is intentionally small. It is not a quality gate and should not stop
// quiet/light scans. It only blocks obviously unsafe or broken customer email
// output. Everything else is a warning so the daily scan keeps operating.
// ---------------------------------------------------------------------------

import type { CompanyBriefingGenerationOutput } from "./types";
import { evaluateSourceHygiene } from "./company-source-hygiene";

export interface DeliverySafetyResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const INTERNAL_LANGUAGE = [
  /\bthe scan picked up\b/i,
  /\bpicked up\b/i,
  /\bit belongs here\b/i,
  /\brelevant because\b/i,
  /\bselected because\b/i,
  /\bmatched scan area\b/i,
  /\bthis item was selected\b/i,
  /\bevidence threshold\b/i,
  /\bweak signal\b/i,
  /\boperational exposure\b/i,
  /\bmaterial implications\b/i,
  /\bthis matters because\b/i,
];

const PAYWALLED_DOMAINS = [
  /(^|\.)bloomberg\.com$/i,
  /(^|\.)ft\.com$/i,
  /(^|\.)financialtimes\.com$/i,
  /(^|\.)wsj\.com$/i,
  /(^|\.)nytimes\.com$/i,
  /(^|\.)economist\.com$/i,
  /(^|\.)heavyliftpfi\.com$/i,
  /(^|\.)lloydslist\.com$/i,
  /(^|\.)tradewindsnews\.com$/i,
  /(^|\.)theinformation\.com$/i,
];

function visibleItems(content: CompanyBriefingGenerationOutput) {
  return (content.main_briefing?.sections || []).flatMap((section) =>
    (section.items || []).map((item) => ({ section: section.heading, item })),
  );
}

function isPaywalledVisibleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "");
    return PAYWALLED_DOMAINS.some((pattern) => pattern.test(host));
  } catch {
    return false;
  }
}

function isUnsafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
      return true;
    if (
      /\/dashboard\/company\/[^/]+\/briefings\/[^/]+\/evidence/.test(
        parsed.pathname,
      )
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function validateCompanyBriefingForDelivery(
  content: CompanyBriefingGenerationOutput,
): DeliverySafetyResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items = visibleItems(content);

  if (!content.today_brief?.top_line?.text?.trim()) {
    errors.push("missing_top_line");
  }

  if (content.scanner_report?.layout_version === "company_daily_scan_v1") {
    const writer = (content.understanding as any)?.gold_standard_editorial_writer_v1;
    if (!writer?.enabled) {
      errors.push("missing_gold_standard_editorial_writer");
    }

    const qaReport = (content as any).qa_report;
    const blockers = qaReport?.blocking_failures || [];
    if (Array.isArray(blockers) && blockers.length > 0) {
      errors.push(`qa_blocking_failures:${blockers.slice(0, 3).map((b: any) => b.code || "blocked").join("|")}`);
    }
  }

  if (items.length === 0) {
    warnings.push("no_visible_findings_quiet_scan");
  }

  for (const { section, item } of items) {
    const title = item.title?.text || "";
    const body = item.body?.text || "";
    const text = `${title}\n${body}`;
    const label = `${section || "section"}: ${title.slice(0, 80) || item.generated_item_id || "item"}`;

    if (INTERNAL_LANGUAGE.some((pattern) => pattern.test(text))) {
      errors.push(`internal_language:${label}`);
    }

    if (!item.source_url) {
      warnings.push(`missing_source_url:${label}`);
      continue;
    }

    const hygiene = evaluateSourceHygiene({
      url: item.source_url,
      title,
      summary: body,
    });

    if (isUnsafeUrl(item.source_url)) {
      errors.push(`unsafe_source_url:${label}`);
    } else if (!hygiene.emailVisibleAllowed) {
      errors.push(
        `source_hygiene_blocked:${hygiene.reason || "blocked"}:${label}`,
      );
    } else if (isPaywalledVisibleUrl(item.source_url)) {
      errors.push(`paywalled_visible_source:${label}`);
    }
  }

  if (!content.perception_gap?.notes?.length) {
    warnings.push("no_perception_gap_today");
  }

  return { ok: errors.length === 0, errors, warnings };
}
