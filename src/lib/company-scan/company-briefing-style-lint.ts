// ---------------------------------------------------------------------------
// Package 8E — Company Briefing Style Lint.
//
// Anti-AI-slop style checks for company briefing generation output.
// Enforces calm, plain, specific writing. Detects and flags:
//   - Banned AI-generated phrases ("underscores", "evolving landscape", etc.)
//   - Overly long sentences
//   - Generic observations with no specific content
//   - Banned section headings ("What Changed", "What to Watch Next")
//   - Raw prompt/source instruction leakage
//   - Excessive source-name clutter
//
// Returns a StyleLintResult with pass/warn/block severity and detail.
// ---------------------------------------------------------------------------

import type { CompanyBriefingGenerationOutput } from "./types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface StyleLintIssue {
  code: string;
  severity: "blocking" | "warning";
  location: string; // e.g. "today_brief.top_line", "sections[0].items[0].body"
  text: string; // the offending text snippet
  message: string;
  suggested_fix?: string;
}

export interface StyleLintResult {
  calm_tone: boolean;
  no_hype: boolean;
  concise: boolean;
  prohibited_language_found: string[];
  reading_load_ok: boolean;
  repeated_phrasing: boolean;
  result: "pass" | "warn" | "block";
  issues: StyleLintIssue[];
}

// ---------------------------------------------------------------------------
// Banned phrases — blocking severity
//
// These phrases are strong signals of AI-generated slop. If present in
// customer-facing text, the briefing should not send without revision.
// ---------------------------------------------------------------------------

const BANNED_PHRASES_BLOCKING: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bevolving\s+landscape\b/i, label: "evolving landscape" },
  { pattern: /\bcomplex\s+interplay\b/i, label: "complex interplay" },
  {
    pattern:
      /\bstakeholders\s+should\s+(monitor|watch|observe|keep\s+an\s+eye)\b/i,
    label: "stakeholders should monitor",
  },
  { pattern: /\bdelve\b/i, label: "delve" },
  { pattern: /\btapestry\b/i, label: "tapestry" },
  { pattern: /\bgame[- ]changing\b/i, label: "game-changing" },
  { pattern: /\bseamless(ly)?\b/i, label: "seamless" },
  { pattern: /\brobust\b/i, label: "robust" },
  { pattern: /\bleverage\b/i, label: "leverage" },
  {
    pattern:
      /\bin\s+today'?s\s+(rapidly\s+)?(evolving|changing|fast[- ]paced)\b/i,
    label: "in today's rapidly evolving",
  },
  {
    pattern: /\bit\s+is\s+important\s+to\s+note\b/i,
    label: "it is important to note",
  },
  {
    pattern: /\bmarks?\s+a\s+pivotal\s+(moment|shift|turning\s+point)\b/i,
    label: "marks a pivotal moment",
  },
  { pattern: /\bmust\s+act\s+now\b/i, label: "must act now" },
  {
    pattern: /\burgent\s+action\s+required\b/i,
    label: "urgent action required",
  },
  {
    pattern: /\bcan'?t\s+afford\s+to\s+ignore\b/i,
    label: "can't afford to ignore",
  },
  { pattern: /\bproves?\s+that\b/i, label: "proves that" },
  { pattern: /\bguarantees?\b/i, label: "guarantees" },
  { pattern: /\bwill\s+definitely\b/i, label: "will definitely" },
  {
    pattern: /\bignored\s+by\s+(the\s+)?(western\s+)?media\b/i,
    label: "ignored by the media",
  },
  {
    pattern: /\bmainstream\s+media\s+won'?t\s+tell\b/i,
    label: "mainstream media won't tell",
  },
  {
    pattern: /\bregistered\s+against\s+the\s+watchlist\b/i,
    label: "internal watchlist rail",
  },
  { pattern: /\bweak\s+signal\b/i, label: "internal weak-signal label" },
  { pattern: /\bindirect\s+or\s+weak\b/i, label: "internal weak-signal label" },
  {
    pattern: /\bpassed\s+(the\s+)?threshold\b/i,
    label: "internal threshold label",
  },
  {
    pattern: /\bdid\s+not\s+meet\s+(the\s+)?email\s+threshold\b/i,
    label: "internal threshold label",
  },
  {
    pattern: /\bno\s+material\s+finding\b/i,
    label: "internal no-material-finding label",
  },
  {
    pattern: /\bmatched\s+(the\s+)?selected\s+watch\s+areas?\b/i,
    label: "internal selected-watch-area rail",
  },
  {
    pattern: /\bled\s+this\s+company[- ]specific\s+scan\b/i,
    label: "internal scan rail",
  },
  { pattern: /\bthe\s+clearest\s+signal\b/i, label: "analyst signal phrasing" },
  { pattern: /\b(strong|operating|market)\s+signal\b/i, label: "analyst signal phrasing" },
  { pattern: /\bthis\s+is\s+the\s+signal\b/i, label: "analyst signal phrasing" },
  { pattern: /\bAlbis\s+reading\b/i, label: "Albis reading label" },
  { pattern: /\bthe\s+useful\s+point\b/i, label: "generic analyst phrasing" },
  { pattern: /\bintelligence\s+read\b/i, label: "generic analyst phrasing" },
  {
    pattern: /\bselected\s+company\s+watch\s+areas?\b/i,
    label: "internal company watch-area rail",
  },
  {
    pattern: /\bwatchlist\s+entities\b/i,
    label: "internal watchlist section label",
  },
  {
    pattern: /\bdatapoint\s+was\s+useful\b/i,
    label: "internal datapoint rail",
  },
  {
    pattern: /\broute\s+access\s+and\s+route\s+confidence\b/i,
    label: "internal route-confidence rail",
  },
  {
    pattern: /\bthe\s+comparison\s+is\s+whether\b/i,
    label: "internal comparison rail",
  },
  { pattern: /\bthe\s+relevance\s+is\b/i, label: "internal relevance rail" },
  {
    pattern: /\bthe\s+useful\s+distinction\s+is\b/i,
    label: "internal distinction rail",
  },
  { pattern: /\bsignal\s+showed\s+up\b/i, label: "internal signal rail" },
  { pattern: /\bcompany[- ]specific\s+scan\b/i, label: "internal scan rail" },
  {
    pattern: /\bthe\s+scan\s+picked\s+up\b/i,
    label: "internal scan reasoning",
  },
  { pattern: /\bpicked\s+up\b/i, label: "internal scan reasoning" },
  { pattern: /\bit\s+belongs\s+here\b/i, label: "internal scan reasoning" },
  {
    pattern: /\bbelongs\s+here\s+because\b/i,
    label: "internal scan reasoning",
  },
  { pattern: /\brelevant\s+because\b/i, label: "internal relevance reasoning" },
  { pattern: /\bselected\s+because\b/i, label: "internal selection reasoning" },
  {
    pattern: /\bmatched\s+scan\s+area\b/i,
    label: "internal matching reasoning",
  },
  {
    pattern: /\bthis\s+item\s+was\s+selected\b/i,
    label: "internal selection reasoning",
  },
  { pattern: /\boperational\s+exposure\b/i, label: "consultant filler" },
  { pattern: /\bmaterial\s+implications\b/i, label: "consultant filler" },
  {
    pattern: /\bthis\s+matters\s+because\b/i,
    label: "generated analysis rail",
  },
  { pattern: /\bshocking\b/i, label: "shocking" },
  { pattern: /\bexplosive\b/i, label: "explosive" },
  { pattern: /\bbombshell\b/i, label: "bombshell" },
  { pattern: /\bpanic\b/i, label: "panic" },
  { pattern: /\bchaos\b/i, label: "chaos" },
];

// ---------------------------------------------------------------------------
// Restricted phrases — warning severity
//
// These are often AI-generated but occasionally legitimate. Flag as warning.
// ---------------------------------------------------------------------------

const RESTRICTED_PHRASES_WARNING: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern:
      /\bunderscores?\s+(the\s+)?(importance|need|urgency|significance)\b/i,
    label: "underscores the importance",
  },
  {
    pattern: /\bhighlights?\s+(the\s+)?(importance|need|urgency|growing)\b/i,
    label: "highlights the importance",
  },
  { pattern: /\bshowcases?\b/i, label: "showcases" },
  {
    pattern: /\bsignals?\s+(a\s+)?(broader|wider|growing|important)\b/i,
    label: "signals a broader",
  },
  {
    pattern: /\bamid\s+(growing|increasing|rising|heightened|ongoing)\b/i,
    label: "amid growing",
  },
  { pattern: /\bcrisis\b/i, label: "crisis" },
  { pattern: /\blandscape\b/i, label: "landscape" },
  { pattern: /\bnavigate\s+(the|this|these|a)\b/i, label: "navigate the" },
  { pattern: /\bunprecedented\b/i, label: "unprecedented" },
  { pattern: /\bparadigm\s+shift\b/i, label: "paradigm shift" },
  { pattern: /\bdouble[- ]edged\s+sword\b/i, label: "double-edged sword" },
  { pattern: /\btip\s+of\s+the\s+iceberg\b/i, label: "tip of the iceberg" },
  { pattern: /\bremains?\s+to\s+be\s+seen\b/i, label: "remains to be seen" },
  { pattern: /\bonly\s+time\s+will\s+tell\b/i, label: "only time will tell" },
];

// ---------------------------------------------------------------------------
// Banned section headings
// ---------------------------------------------------------------------------

const BANNED_HEADINGS: string[] = [
  "what changed",
  "what to watch next",
  "what to watch",
  "key takeaways",
  "key developments",
  "executive summary",
];

// ---------------------------------------------------------------------------
// Prompt/instruction leakage patterns — blocking
// ---------------------------------------------------------------------------

const PROMPT_LEAKAGE_PATTERNS: RegExp[] = [
  /\b(ignore|disregard)\s+(previous|all|above|prior)\s+(instructions?|prompts?|context)\b/i,
  /\b(system|user)\s*:\s*/i,
  /\b(you\s+are\s+a|act\s+as\s+a|pretend\s+to\s+be)\s+(helpful|AI|assistant|analyst)\b/i,
  /\bdo\s+not\s+(mention|reveal|disclose)\s+(that|this|your)\b/i,
  /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/i,
  /\bprompt\s*injection\b/i,
];

// ---------------------------------------------------------------------------
// Sentence length thresholds
// ---------------------------------------------------------------------------

const SENTENCE_LENGTH_WARN = 28;
const SENTENCE_LENGTH_PREMIUM_WARN = 32;
const SENTENCE_LENGTH_BLOCK = 45;
const AVERAGE_SENTENCE_LENGTH_WARN = 22;
const PARAGRAPH_WORD_WARN = 95;

// ---------------------------------------------------------------------------
// Generic observation patterns — warning
// ---------------------------------------------------------------------------

const GENERIC_OBSERVATION_PATTERNS: RegExp[] = [
  /\bcompanies\s+should\s+(continue\s+to\s+)?(monitor|watch|track|observe)\s+(these\s+)?developments?\s+closely\b/i,
  /\bthis\s+(development|situation|trend)\s+(could|may|might)\s+have\s+(significant|important|far[- ]reaching)\s+(implications?|consequences?|impact)\b/i,
  /\b(going\s+forward|moving\s+forward|looking\s+ahead),?\s+(it\s+will\s+be\s+)?(important|crucial|critical|essential)\s+to\b/i,
  /\bthe\s+situation\s+(continues\s+to\s+)?evolve\b/i,
  /\btime\s+will\s+tell\b/i,
];

const ADVICE_BOUNDARY_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern:
      /\b(companies|businesses|operators|executives|stakeholders|leaders)\s+(should|must|need\s+to|have\s+to|are\s+required\s+to)\b/i,
    label: "advice to reader group",
  },
  {
    pattern: /\b(the\s+)?recommended\s+action\s+is\b/i,
    label: "recommended action",
  },
  {
    pattern: /\bthis\s+means\s+you\s+should\b/i,
    label: "this means you should",
  },
  {
    pattern: /\bthe\s+next\s+thing\s+to\s+watch\b/i,
    label: "next thing to watch",
  },
];

const FILLER_OPENING_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^\s*amid\b/i, label: "Amid" },
  { pattern: /^\s*against\s+the\s+backdrop\b/i, label: "Against the backdrop" },
  { pattern: /^\s*in\s+the\s+context\s+of\b/i, label: "In the context of" },
  { pattern: /^\s*as\s+the\s+world\b/i, label: "As the world" },
];

const AMBIGUOUS_SIGNAL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bstrongest\s+signal\b/i, label: "strongest signal" },
  { pattern: /\bnotable\s+signal\b/i, label: "notable signal" },
  { pattern: /\bimportant\s+development\b/i, label: "important development" },
  {
    pattern: /\binteresting\s+development\b/i,
    label: "interesting development",
  },
];

const VAGUE_INTELLIGENCE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern: /\bcould\s+have\s+implications\b/i,
    label: "could have implications",
  },
  { pattern: /\bmaterial\s+implications\b/i, label: "material implications" },
  { pattern: /\bstrategic\s+implications\b/i, label: "strategic implications" },
  { pattern: /\bbroader\s+implications\b/i, label: "broader implications" },
  { pattern: /\bit\s+matters\s+because\b/i, label: "it matters because" },
  { pattern: /\bthat\s+figure\s+matters\b/i, label: "that figure matters" },
];

const UNSUPPORTED_TREND_WORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bincreasingly\b/i, label: "increasingly" },
  { pattern: /\bwidening\b/i, label: "widening" },
  { pattern: /\bescalating\b/i, label: "escalating" },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run style lint checks on a company briefing generation output.
 *
 * Returns a StyleLintResult with all issues found, aggregated severity,
 * and boolean flags for each check category.
 */
export function lintBriefingStyle(
  output: CompanyBriefingGenerationOutput,
): StyleLintResult {
  const issues: StyleLintIssue[] = [];

  // Collect all text segments with their paths for checking
  const segments = extractTextSegments(output);

  // --- Check banned phrases (blocking) ---
  for (const seg of segments) {
    for (const { pattern, label } of BANNED_PHRASES_BLOCKING) {
      if (pattern.test(seg.text)) {
        const match = seg.text.match(pattern);
        issues.push({
          code: "BANNED_PHRASE",
          severity: "blocking",
          location: seg.path,
          text: match?.[0] ?? label,
          message: `Banned AI-slop phrase detected: "${label}"`,
          suggested_fix: `Remove or rephrase "${label}" with plain, specific language.`,
        });
      }
    }
  }

  // --- Check restricted phrases (warning) ---
  for (const seg of segments) {
    for (const { pattern, label } of RESTRICTED_PHRASES_WARNING) {
      if (pattern.test(seg.text)) {
        const match = seg.text.match(pattern);
        issues.push({
          code: "RESTRICTED_PHRASE",
          severity: "warning",
          location: seg.path,
          text: match?.[0] ?? label,
          message: `Restricted phrase detected: "${label}". Consider rephrasing.`,
        });
      }
    }
  }

  // --- Check banned headings ---
  for (let si = 0; si < output.main_briefing.sections.length; si++) {
    const section = output.main_briefing.sections[si];
    const headingLower = section.heading.toLowerCase().trim();
    for (const banned of BANNED_HEADINGS) {
      if (headingLower === banned || headingLower.includes(banned)) {
        issues.push({
          code: "BANNED_HEADING",
          severity: "blocking",
          location: `main_briefing.sections[${si}].heading`,
          text: section.heading,
          message: `Banned heading: "${section.heading}". Use "Main Briefing" section headings based on scan area labels.`,
          suggested_fix: `Replace with scan area label.`,
        });
      }
    }
  }

  // --- Check sentence length ---
  const allSentenceWordCounts: number[] = [];
  for (const seg of segments) {
    const sentences = splitSentences(seg.text);
    for (const sentence of sentences) {
      const wordCount = countWords(sentence);
      allSentenceWordCounts.push(wordCount);
      if (wordCount >= SENTENCE_LENGTH_BLOCK) {
        issues.push({
          code: "SENTENCE_TOO_LONG",
          severity: "blocking",
          location: seg.path,
          text: sentence.slice(0, 120) + (sentence.length > 120 ? "..." : ""),
          message: `Sentence has ${wordCount} words (max ${SENTENCE_LENGTH_BLOCK}). Split into shorter sentences.`,
        });
      } else if (wordCount > SENTENCE_LENGTH_PREMIUM_WARN) {
        issues.push({
          code: "SENTENCE_PREMIUM_LONG",
          severity: "warning",
          location: seg.path,
          text: sentence.slice(0, 120) + (sentence.length > 120 ? "..." : ""),
          message: `Sentence has ${wordCount} words. Package 9.3A target is ${SENTENCE_LENGTH_PREMIUM_WARN} or fewer unless the sentence clearly needs the length.`,
        });
      } else if (wordCount > SENTENCE_LENGTH_WARN) {
        issues.push({
          code: "SENTENCE_LONG",
          severity: "warning",
          location: seg.path,
          text: sentence.slice(0, 120) + (sentence.length > 120 ? "..." : ""),
          message: `Sentence has ${wordCount} words (target: ${SENTENCE_LENGTH_WARN} or fewer).`,
        });
      }
    }

    for (const paragraph of seg.text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)) {
      const paragraphWords = countWords(paragraph);
      if (paragraphWords > PARAGRAPH_WORD_WARN) {
        issues.push({
          code: "PARAGRAPH_TOO_DENSE",
          severity: "warning",
          location: seg.path,
          text: paragraph.slice(0, 120) + (paragraph.length > 120 ? "..." : ""),
          message: `Paragraph has ${paragraphWords} words. Package 9.3A target is ${PARAGRAPH_WORD_WARN} or fewer.`,
        });
      }
    }
  }

  if (allSentenceWordCounts.length > 0) {
    const averageSentenceLength =
      allSentenceWordCounts.reduce((sum, count) => sum + count, 0) /
      allSentenceWordCounts.length;
    if (averageSentenceLength > AVERAGE_SENTENCE_LENGTH_WARN) {
      issues.push({
        code: "AVERAGE_SENTENCE_LENGTH_HIGH",
        severity: "warning",
        location: "briefing.customer_facing_text",
        text: averageSentenceLength.toFixed(1),
        message: `Average sentence length is ${averageSentenceLength.toFixed(1)} words. Package 9.3A target is ${AVERAGE_SENTENCE_LENGTH_WARN} or fewer.`,
      });
    }
  }

  // --- Check generic observations ---
  for (const seg of segments) {
    for (const pattern of GENERIC_OBSERVATION_PATTERNS) {
      if (pattern.test(seg.text)) {
        const match = seg.text.match(pattern);
        issues.push({
          code: "GENERIC_OBSERVATION",
          severity: "warning",
          location: seg.path,
          text: match?.[0] ?? seg.text.slice(0, 80),
          message:
            "Generic observation detected. Replace with specific, evidence-supported insight.",
        });
      }
    }
  }

  // --- Package 9.3A: advice boundary, vague intelligence language, and filler openings ---
  for (const seg of segments) {
    for (const { pattern, label } of ADVICE_BOUNDARY_PATTERNS) {
      if (pattern.test(seg.text)) {
        const match = seg.text.match(pattern);
        issues.push({
          code: "ADVICE_BOUNDARY",
          severity: "blocking",
          location: seg.path,
          text: match?.[0] ?? label,
          message: `Advice-like wording detected: "${label}". Albis should clarify evidence, not tell companies what to do.`,
          suggested_fix:
            "Use decision-usefulness language such as 'The evidence supports...' or 'The useful distinction is...'.",
        });
      }
    }

    for (const { pattern, label } of FILLER_OPENING_PATTERNS) {
      if (pattern.test(seg.text)) {
        const match = seg.text.match(pattern);
        issues.push({
          code: "FILLER_OPENING",
          severity: "warning",
          location: seg.path,
          text: match?.[0] ?? label,
          message: `Filler opening detected: "${label}". Start with concrete evidence or the point.`,
        });
      }
    }

    for (const { pattern, label } of AMBIGUOUS_SIGNAL_PATTERNS) {
      if (pattern.test(seg.text)) {
        const match = seg.text.match(pattern);
        issues.push({
          code: "AMBIGUOUS_SIGNAL_LANGUAGE",
          severity: label === "strongest signal" ? "blocking" : "warning",
          location: seg.path,
          text: match?.[0] ?? label,
          message: `Ambiguous signal language detected: "${label}". Say what registered and why it belongs here.`,
        });
      }
    }

    for (const { pattern, label } of VAGUE_INTELLIGENCE_PATTERNS) {
      if (pattern.test(seg.text)) {
        const match = seg.text.match(pattern);
        issues.push({
          code: "VAGUE_INTELLIGENCE_LANGUAGE",
          severity: "warning",
          location: seg.path,
          text: match?.[0] ?? label,
          message: `Vague intelligence phrase detected: "${label}". Replace with the specific mechanism or distinction.`,
        });
      }
    }

    for (const { pattern, label } of UNSUPPORTED_TREND_WORDS) {
      if (
        pattern.test(seg.text) &&
        !/(again|repeated|more than one|later scans|trend|pattern|source spread|across)/i.test(
          seg.text,
        )
      ) {
        const match = seg.text.match(pattern);
        issues.push({
          code: "UNSUPPORTED_TREND_LANGUAGE",
          severity: "warning",
          location: seg.path,
          text: match?.[0] ?? label,
          message: `Trend word "${label}" needs visible evidence or a softer phrasing.`,
        });
      }
    }
  }

  // --- Check prompt/instruction leakage (blocking) ---
  for (const seg of segments) {
    for (const pattern of PROMPT_LEAKAGE_PATTERNS) {
      if (pattern.test(seg.text)) {
        const match = seg.text.match(pattern);
        issues.push({
          code: "PROMPT_LEAKAGE",
          severity: "blocking",
          location: seg.path,
          text: match?.[0] ?? seg.text.slice(0, 80),
          message:
            "Raw prompt or source instruction detected in output. Must be removed before send.",
        });
      }
    }
  }

  // --- Check repeated phrasing ---
  const repeatedPhrasing = detectRepeatedPhrasing(segments);
  for (const rp of repeatedPhrasing) {
    issues.push({
      code: "REPEATED_PHRASING",
      severity: "warning",
      location: rp.locations.join(", "),
      text: rp.phrase,
      message: `Phrase "${rp.phrase}" appears ${rp.count} times across the briefing. Vary the language.`,
    });
  }

  // --- Package 10E: finding bodies must not simply repeat the title/headline ---
  for (let si = 0; si < output.main_briefing.sections.length; si++) {
    const section = output.main_briefing.sections[si];
    for (let ii = 0; ii < section.items.length; ii++) {
      const item = section.items[ii];
      if (
        item.title?.text &&
        item.body?.text &&
        textLooksRepeated(item.title.text, item.body.text)
      ) {
        const bodyWordCount = countWords(item.body.text);
        const hasConcreteDetail =
          /\b(Hormuz|Suez|Red Sea|Bab el-Mandeb|traffic|freight|rates?|vessel|ports?|corridors?|routes?|LNG|disruption|insurance|sanction|tariff|policy|regulator|state media|foreign minister|Putin|Iran|Russia|North Korea|Kim|deepfake|arrested|charged|law|Monday|Tuesday|Wednesday|Thursday|Friday|\d+\s?%|\$\d+|million|weeks?|months?|pre-war)\b/i.test(
            item.body.text,
          );
        const dailyScan =
          output.scanner_report?.layout_version === "company_daily_scan_v1";
        const genuinelyRepeatedOnly = bodyWordCount < 22 || !hasConcreteDetail;
        issues.push({
          code: "SCANNER_REPEATED_TITLE_BODY",
          severity:
            output.scanner_report?.enabled &&
            genuinelyRepeatedOnly &&
            !dailyScan
              ? "blocking"
              : "warning",
          location: `sections[${si}].items[${ii}].body`,
          text: item.body.text.slice(0, 140),
          message:
            "Scanner finding body repeats the title/headline instead of adding the useful fact and scan-area reason.",
          suggested_fix:
            "Present the source-grounded finding directly. Do not add internal scan reasoning.",
        });
      }
    }
  }

  // --- Check source-name clutter ---
  const sourceClutterPattern =
    /\b(Reuters|WSJ|Bloomberg|Financial Times|BBC|AP|CNN|CNBC|FT)\s*:\s/g;
  for (const seg of segments) {
    const matches = seg.text.match(sourceClutterPattern);
    if (matches && matches.length > 0) {
      issues.push({
        code: "SOURCE_CLUTTER",
        severity: "warning",
        location: seg.path,
        text: matches.join(", "),
        message:
          "Source-name clutter in body text. Prefer clean prose; attribute in source notes.",
      });
    }
  }

  // --- Aggregate results ---
  const blockingIssues = issues.filter((i) => i.severity === "blocking");
  const warningIssues = issues.filter((i) => i.severity === "warning");
  const prohibitedFound = [
    ...new Set(
      issues
        .filter(
          (i) => i.code === "BANNED_PHRASE" || i.code === "RESTRICTED_PHRASE",
        )
        .map((i) => i.text),
    ),
  ];

  // Reading load: check total word count
  const totalWords = segments.reduce(
    (sum, seg) => sum + countWords(seg.text),
    0,
  );
  const readingLoadOk =
    totalWords <= (output.scanner_report?.enabled ? 3500 : 1500); // scanner reports are intentionally fuller

  return {
    calm_tone:
      blockingIssues.filter((i) => i.code === "BANNED_PHRASE").length === 0,
    no_hype:
      issues.filter(
        (i) =>
          ["BANNED_PHRASE", "RESTRICTED_PHRASE"].includes(i.code) &&
          [
            "shocking",
            "explosive",
            "bombshell",
            "panic",
            "chaos",
            "game-changing",
            "crisis",
          ].some((w) => i.text.toLowerCase().includes(w)),
      ).length === 0,
    concise: issues.filter((i) => i.code === "SENTENCE_TOO_LONG").length === 0,
    prohibited_language_found: prohibitedFound,
    reading_load_ok: readingLoadOk,
    repeated_phrasing: repeatedPhrasing.length > 0,
    result:
      blockingIssues.length > 0
        ? "block"
        : warningIssues.length > 0
          ? "warn"
          : "pass",
    issues,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface TextSegment {
  path: string;
  text: string;
}

function extractTextSegments(
  output: CompanyBriefingGenerationOutput,
): TextSegment[] {
  const segments: TextSegment[] = [];

  // Today's Brief
  if (output.today_brief.top_line.text) {
    segments.push({
      path: "today_brief.top_line",
      text: output.today_brief.top_line.text,
    });
  }
  for (let i = 0; i < output.today_brief.bullets.length; i++) {
    segments.push({
      path: `today_brief.bullets[${i}]`,
      text: output.today_brief.bullets[i].text,
    });
  }

  if (output.scanner_report?.enabled) {
    segments.push({
      path: "scanner_report.overview",
      text: output.scanner_report.overview.text,
    });
    for (let i = 0; i < output.scanner_report.deeper_reads.length; i++) {
      const item = output.scanner_report.deeper_reads[i];
      segments.push({
        path: `scanner_report.deeper_reads[${i}].title`,
        text: item.title.text,
      });
      segments.push({
        path: `scanner_report.deeper_reads[${i}].body`,
        text: item.body.text,
      });
    }
  }

  // Main Briefing
  for (let si = 0; si < output.main_briefing.sections.length; si++) {
    const section = output.main_briefing.sections[si];
    if (section.no_material_signal_line?.text) {
      segments.push({
        path: `main_briefing.sections[${si}].no_material_signal_line`,
        text: section.no_material_signal_line.text,
      });
    }
    for (let ii = 0; ii < section.items.length; ii++) {
      const item = section.items[ii];
      segments.push({
        path: `sections[${si}].items[${ii}].title`,
        text: item.title.text,
      });
      segments.push({
        path: `sections[${si}].items[${ii}].body`,
        text: item.body.text,
      });
      if (item.why_it_matters?.text) {
        segments.push({
          path: `sections[${si}].items[${ii}].why_it_matters`,
          text: item.why_it_matters.text,
        });
      }
      if (item.uncertainty_line?.text) {
        segments.push({
          path: `sections[${si}].items[${ii}].uncertainty_line`,
          text: item.uncertainty_line.text,
        });
      }
      if (item.perception_gap_note?.text) {
        segments.push({
          path: `sections[${si}].items[${ii}].perception_gap_note`,
          text: item.perception_gap_note.text,
        });
      }
      if (item.source_attribution?.text) {
        segments.push({
          path: `sections[${si}].items[${ii}].source_attribution`,
          text: item.source_attribution.text,
        });
      }
    }
  }

  // Perception Gap
  for (let i = 0; i < output.perception_gap.notes.length; i++) {
    segments.push({
      path: `perception_gap.notes[${i}]`,
      text: output.perception_gap.notes[i].note.text,
    });
  }

  // Useful Observations
  for (let i = 0; i < output.useful_observations.observations.length; i++) {
    segments.push({
      path: `useful_observations[${i}]`,
      text: output.useful_observations.observations[i].text,
    });
  }

  // Source Notes
  if (output.source_notes.text.text) {
    segments.push({
      path: "source_notes",
      text: output.source_notes.text.text,
    });
  }

  return segments;
}

function splitSentences(text: string): string[] {
  // Simple sentence splitter: split on period/exclamation/question followed by space or end
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

interface RepeatedPhrase {
  phrase: string;
  count: number;
  locations: string[];
}

function detectRepeatedPhrasing(segments: TextSegment[]): RepeatedPhrase[] {
  // Extract 3-word and 4-word phrases, find those appearing 3+ times
  const phraseCounts = new Map<
    string,
    { count: number; locations: string[] }
  >();

  for (const seg of segments) {
    const words = seg.text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    for (let n = 3; n <= 4; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const phrase = words.slice(i, i + n).join(" ");
        // Skip very common phrases
        if (isCommonPhrase(phrase)) continue;
        const entry = phraseCounts.get(phrase) ?? { count: 0, locations: [] };
        entry.count++;
        if (!entry.locations.includes(seg.path)) {
          entry.locations.push(seg.path);
        }
        phraseCounts.set(phrase, entry);
      }
    }
  }

  const results: RepeatedPhrase[] = [];
  for (const [phrase, data] of phraseCounts) {
    if (data.count >= 3 && data.locations.length >= 2) {
      results.push({ phrase, count: data.count, locations: data.locations });
    }
  }

  return results.sort((a, b) => b.count - a.count).slice(0, 5);
}

function textLooksRepeated(title: string, body: string): boolean {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const titleNorm = normalize(title);
  const firstSentence = normalize(splitSentences(body)[0] || body);
  if (!titleNorm || !firstSentence) return false;
  if (firstSentence.includes(titleNorm) || titleNorm.includes(firstSentence))
    return true;
  const titleWords = new Set(
    titleNorm.split(/\s+/).filter((word) => word.length > 3),
  );
  const bodyWords = firstSentence
    .split(/\s+/)
    .filter((word) => word.length > 3);
  if (titleWords.size < 4 || bodyWords.length < 4) return false;
  const overlap = bodyWords.filter((word) => titleWords.has(word)).length;
  return (
    overlap / Math.max(Math.min(titleWords.size, bodyWords.length), 1) >= 0.75
  );
}

function isCommonPhrase(phrase: string): boolean {
  const common = new Set([
    "in the",
    "of the",
    "to the",
    "for the",
    "on the",
    "at the",
    "is a",
    "is the",
    "it is",
    "it was",
    "has been",
    "have been",
    "this is",
    "that is",
    "which is",
    "there is",
    "there are",
    "will be",
    "would be",
    "could be",
    "may be",
    "might be",
    "as a",
    "as the",
    "by the",
    "with the",
    "from the",
    "and the",
    "but the",
    "or the",
    "not the",
    "in a",
    "of a",
    "to a",
    "for a",
  ]);
  return common.has(phrase);
}
