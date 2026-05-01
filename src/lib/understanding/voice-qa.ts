// ---------------------------------------------------------------------------
// Human Voice QA for Albis Understanding Layer.
//
// The test is intentionally simple and hard:
// Would Light Tree say this to Ignatius in a real conversation to help him
// understand quickly?
// ---------------------------------------------------------------------------

export interface HumanVoiceIssue {
  code: string;
  severity: "blocking" | "warning";
  text: string;
  message: string;
}

const BLOCKING_PATTERNS: Array<{
  pattern: RegExp;
  code: string;
  message: string;
}> = [
  {
    pattern: /\bevolving landscape\b/i,
    code: "VOICE_EVOLVING_LANDSCAPE",
    message: "Corporate filler instead of meaning.",
  },
  {
    pattern: /\bstakeholders should\b/i,
    code: "VOICE_STAKEHOLDERS_SHOULD",
    message: "Generic stakeholder instruction.",
  },
  {
    pattern: /\bmaterial implications\b/i,
    code: "VOICE_MATERIAL_IMPLICATIONS",
    message: "Consultant filler.",
  },
  {
    pattern: /\bsource-backed frames\b/i,
    code: "VOICE_INTERNAL_PGI",
    message: "Internal PGI method leaked into customer copy.",
  },
  {
    pattern: /\bemail threshold\b/i,
    code: "VOICE_INTERNAL_THRESHOLD",
    message: "Internal delivery threshold leaked into customer copy.",
  },
  {
    pattern: /\bPGI pressure\b/i,
    code: "VOICE_INTERNAL_PRESSURE",
    message: "Internal PGI label leaked into customer copy.",
  },
  {
    pattern: /\bscan universe\b/i,
    code: "VOICE_SCAN_UNIVERSE",
    message: "Methodology voice, not human explanation.",
  },
  {
    pattern: /\bnarrative\s+(?:distance|pressure|weather)\b/i,
    code: "VOICE_NARRATIVE_JARGON",
    message: "PGI jargon where plain English should be used.",
  },
  {
    pattern: /\bwatch\s+next\b/i,
    code: "VOICE_WATCH_NEXT",
    message: "Generic Watch Next rail should not appear by default.",
  },
];

const WARNING_PATTERNS: Array<{
  pattern: RegExp;
  code: string;
  message: string;
}> = [
  {
    pattern: /\bbroader trend\b/i,
    code: "VOICE_BROADER_TREND",
    message: "Often a filler phrase unless made specific.",
  },
  {
    pattern: /\bworth monitoring\b/i,
    code: "VOICE_WORTH_MONITORING",
    message: "Usually too vague; say what would change the read.",
  },
  {
    pattern: /\bhighlights? the importance\b/i,
    code: "VOICE_HIGHLIGHTS_IMPORTANCE",
    message: "Generic importance language.",
  },
  {
    pattern: /\bunderscores?\b/i,
    code: "VOICE_UNDERSCORES",
    message: "Often formal filler.",
  },
];

export function runHumanVoiceQa(
  texts: Array<string | null | undefined>,
): HumanVoiceIssue[] {
  const issues: HumanVoiceIssue[] = [];
  for (const raw of texts) {
    const text = String(raw || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    for (const rule of BLOCKING_PATTERNS) {
      if (rule.pattern.test(text)) {
        issues.push({
          code: rule.code,
          severity: "blocking",
          text,
          message: rule.message,
        });
      }
    }
    for (const rule of WARNING_PATTERNS) {
      if (rule.pattern.test(text)) {
        issues.push({
          code: rule.code,
          severity: "warning",
          text,
          message: rule.message,
        });
      }
    }
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > 70) {
      issues.push({
        code: "VOICE_SENTENCE_TOO_DENSE",
        severity: "warning",
        text,
        message: "This may be too dense for a briefing read.",
      });
    }
  }
  return issues;
}
