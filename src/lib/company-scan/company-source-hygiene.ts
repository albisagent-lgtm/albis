// ---------------------------------------------------------------------------
// Company Daily Scan source hygiene — V1.
//
// Purpose: protect customer-visible scan items from obvious sludge/spam/source
// embarrassments without turning the scanner into a heavy editorial regulator.
// This is deliberately small, manual-first, and email-visible only.
// ---------------------------------------------------------------------------

export type SourceHygieneDecision = {
  emailVisibleAllowed: boolean;
  reason?: string;
  matched?: string;
};

const BLOCKED_EMAIL_DOMAINS = [
  // Manually observed sludge/non-customer-safe item: Pepe Escobar / SEEK TRUTH
  // repost page surfaced in Evidence & Echoes golden test, 2026-04-30.
  "radiosinoland.com",
];

const BLOCKED_TITLE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bseek truth from\b/i, label: "seek_truth_slogan" },
  { pattern: /\bbig lie propaganda machine\b/i, label: "propaganda_slogan" },
  { pattern: /\blearn the real stories behind\b/i, label: "sludge_slogan" },
  { pattern: /\bdateline\s*\d{4,}\b/i, label: "scraped_dateline_title" },
];

function normalizeDomain(domainOrUrl: string | null | undefined): string {
  const raw = String(domainOrUrl || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
  }
}

export function evaluateSourceHygiene(input: {
  domain?: string | null;
  url?: string | null;
  title?: string | null;
  summary?: string | null;
}): SourceHygieneDecision {
  const domain = normalizeDomain(input.domain || input.url);
  if (
    domain &&
    BLOCKED_EMAIL_DOMAINS.some(
      (blocked) => domain === blocked || domain.endsWith(`.${blocked}`),
    )
  ) {
    return {
      emailVisibleAllowed: false,
      reason: "blocked_domain",
      matched: domain,
    };
  }

  const text = `${input.title || ""}\n${input.summary || ""}`;
  for (const { pattern, label } of BLOCKED_TITLE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        emailVisibleAllowed: false,
        reason: "blocked_title_pattern",
        matched: `${label}:${match[0]}`,
      };
    }
  }

  return { emailVisibleAllowed: true };
}

export function blockedEmailDomainsForDiagnostics(): string[] {
  return [...BLOCKED_EMAIL_DOMAINS];
}
