// ---------------------------------------------------------------------------
// Company PGI Story Arc builder.
//
// Contract: memory/company-pgi-story-arc-build-doc.md
// Spine: Finding → Perception → Learning.
// ---------------------------------------------------------------------------

import type {
  CompanyBriefingEvidencePacket,
  EvidenceSupportRef,
} from "../company-scan/types";
import type {
  IntelligenceDepthBundle,
  SelectedSignalForDepth,
} from "../company-scan/intelligence-depth";
import type { CompanyPgiCustomerRead, UnderstandingConfidence } from "./types";

export type CompanyPgiArcType =
  | "main_arc"
  | "supporting_stream"
  | "dashboard_only"
  | "continuation_note";

export type CompanyPgiContinuityStatus =
  | "new_story"
  | "meaningful_development"
  | "same_story_no_material_change"
  | "recurring_pattern";

export interface CompanyPgiStoryExample {
  title: string;
  source_domain?: string;
  scan_area: string;
  why_included: string;
  is_repeat?: boolean;
  repeat_status?:
    | "new_angle"
    | "new_source"
    | "new_frame"
    | "no_material_change";
}

export interface CompanyPgiFrameLane {
  label: string;
  description: string;
  examples: string[];
  who_benefits_or_is_protected?: string;
}

export interface CompanyPgiStoryArc {
  arc_id: string;
  company_profile_id: string;
  scan_date: string;
  title: string;
  arc_type: CompanyPgiArcType;
  source_scan_areas: string[];
  finding_summary: string;
  story_examples: CompanyPgiStoryExample[];
  perception_split: {
    plain_summary: string;
    frame_lanes: CompanyPgiFrameLane[];
    strongest_gap: string;
    missing_connection: string;
  };
  learning: {
    company_read: string;
    broader_pattern: string;
    what_to_carry_forward: string;
    what_would_change_the_read: string;
  };
  continuity: {
    status: CompanyPgiContinuityStatus;
    previous_arc_ids: string[];
    changed_because: string[];
  };
  evidence_refs: EvidenceSupportRef[];
  source_domains: string[];
  regions: string[];
  confidence: UnderstandingConfidence;
  score?: number;
}

export interface CompanyPgiStoryArcResult {
  arcs: CompanyPgiStoryArc[];
  main_arc?: CompanyPgiStoryArc;
  supporting_streams: CompanyPgiStoryArc[];
  suppressed_repeats: CompanyPgiStoryExample[];
  email_read?: string;
  customer_read?: CompanyPgiCustomerRead;
  observations: Array<{ text: string; supported_by: EvidenceSupportRef[] }>;
}

function clean(value: unknown): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\bThe relevance is\b/gi, "The practical point is")
    .replace(/\bThe useful distinction is\b/gi, "The practical difference is")
    .replace(/\bThis matters because\b/gi, "The practical point is")
    .replace(/\bThe datapoint was useful because\b/gi, "The useful point is")
    .replace(/\bdatapoint was useful\b/gi, "point matters")
    .replace(/\bnarrative pressure\b/gi, "information pressure")
    .trim();
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}

function sourceName(value: string | null | undefined): string {
  return String(value || "selected source").replace(/^www\./, "");
}

function humanList(values: string[], max = 3): string {
  const items = uniq(values.map(clean).filter(Boolean)).slice(0, max);
  if (items.length <= 1) return items[0] || "the scan";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function sentence(value: string): string {
  const cleaned = clean(value);
  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function shorten(value: string, maxWords = 24): string {
  const cleaned = clean(value);
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return sentence(cleaned);
  return sentence(`${words.slice(0, maxWords).join(" ")}…`);
}

function slugify(value: string): string {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "says",
  "report",
  "reports",
  "shows",
  "amid",
  "global",
  "news",
  "media",
  "press",
  "freedom",
]);

function titleTokens(value: string): string[] {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

export function storyIdentityKey(title: string): string {
  const lower = clean(title).toLowerCase();
  if (
    /rsf|reporters without borders|press freedom index|press freedom.*(?:low|lowest|historic|record)|freedom at (?:its )?(?:lowest|historic|record)/i.test(
      lower,
    )
  ) {
    return "press-freedom-index-rsf";
  }
  if (/foreign disinformation|misinformation|disinformation/i.test(lower)) {
    return "disinformation-channel-pressure";
  }
  if (/deepfake|synthetic|voice|likeness|ai video|image/i.test(lower)) {
    return "synthetic-identity-trust";
  }
  if (
    /hormuz|strait|shipping|sea route|trade route|freight|suez|red sea|maritime/i.test(
      lower,
    )
  ) {
    return "shipping-route-confidence";
  }
  const tokens = titleTokens(title).slice(0, 7);
  return tokens.length ? tokens.join("-") : slugify(title || "story");
}

function refsForBundle(bundle: IntelligenceDepthBundle): EvidenceSupportRef[] {
  return uniq([
    ...bundle.source_refs,
    ...bundle.claim_ids.map((id) => ({ type: "claim_id" as const, id })),
  ]).slice(0, 20);
}

function refsForSelected(item: SelectedSignalForDepth): EvidenceSupportRef[] {
  return [
    { type: "claim_id", id: `claim_art_${item.signal.id}_headline` },
    { type: "claim_id", id: `claim_art_${item.signal.id}_summary` },
    {
      type: "source_id",
      id: `domain:${sourceName(item.signal.source_domain)}`,
    },
  ];
}

function selectedAreaLabel(
  packet: CompanyBriefingEvidencePacket,
  selected: SelectedSignalForDepth,
): string {
  const id = selected.section_ids[0];
  const match = packet.company.selected_scan_areas.find(
    (area) => area.area_id === id,
  );
  return clean(match?.label || id || "Tracked area").replace(
    /Named Entities/i,
    "Tracked Entities",
  );
}

function scoreBundle(bundle: IntelligenceDepthBundle): number {
  const sourceCount = Math.min(5, Math.max(1, bundle.source_names.length));
  const frameBoost = bundle.source_frames.length ? 1.2 : 0;
  const confidenceBoost =
    bundle.confidence === "high"
      ? 0.8
      : bundle.confidence === "medium"
        ? 0.4
        : 0;
  const classBoost =
    bundle.evidence_class === "multi_source_pattern" ||
    bundle.evidence_class === "source_frame"
      ? 0.7
      : 0;
  return Number(
    Math.min(
      9.5,
      3.4 + sourceCount * 0.55 + frameBoost + confidenceBoost + classBoost,
    ).toFixed(1),
  );
}

function scoreSelected(item: SelectedSignalForDepth): number {
  const title = clean(item.signal.headline);
  const summary = clean(item.signal.summary);
  let score = item.selection_score + item.keyword_match_score * 2;
  if (
    /press freedom|disinformation|deepfake|hormuz|shipping|sanction|cyber/i.test(
      `${title} ${summary}`,
    )
  )
    score += 25;
  if (
    /lowest|historic|record|index|report|warn|falls|drops|surge|restriction/i.test(
      `${title} ${summary}`,
    )
  )
    score += 12;
  if (item.signal.source_domain) score += 4;
  return score;
}

function bundleExamples(
  packet: CompanyBriefingEvidencePacket,
  bundle: IntelligenceDepthBundle,
  selected: SelectedSignalForDepth[],
): {
  examples: CompanyPgiStoryExample[];
  suppressed: CompanyPgiStoryExample[];
  refs: EvidenceSupportRef[];
} {
  const section = clean(bundle.section_label || bundle.heading);
  const related = selected
    .filter(
      (item) =>
        item.cluster_id === bundle.anchor_cluster_id ||
        item.item_id === bundle.anchor_item_id ||
        item.section_ids.some((id) =>
          section
            .toLowerCase()
            .includes(
              clean(
                packet.company.selected_scan_areas.find(
                  (area) => area.area_id === id,
                )?.label || id,
              ).toLowerCase(),
            ),
        ),
    )
    .sort((a, b) => scoreSelected(b) - scoreSelected(a));
  const seen = new Set<string>();
  const examples: CompanyPgiStoryExample[] = [];
  const suppressed: CompanyPgiStoryExample[] = [];
  const refs: EvidenceSupportRef[] = [];
  for (const item of related) {
    const title = clean(item.signal.headline);
    if (!title) continue;
    const key = storyIdentityKey(title);
    const example: CompanyPgiStoryExample = {
      title,
      source_domain: sourceName(item.signal.source_domain),
      scan_area: selectedAreaLabel(packet, item),
      why_included: seen.has(key)
        ? "Same story circulation; useful as supporting evidence, not a separate email item."
        : "This is one of the scanned stories behind the perception read.",
      is_repeat: seen.has(key),
      repeat_status: seen.has(key) ? "no_material_change" : undefined,
    };
    if (seen.has(key)) suppressed.push(example);
    else {
      seen.add(key);
      examples.push(example);
      refs.push(...refsForSelected(item));
    }
    if (examples.length >= 5 && suppressed.length >= 8) break;
  }
  if (!examples.length) {
    const title = clean(
      bundle.heading || bundle.what_happened[0]?.text || section,
    );
    examples.push({
      title,
      source_domain: bundle.source_names[0],
      scan_area: section,
      why_included:
        "This was the strongest bundled finding behind the perception read.",
    });
  }
  return {
    examples: examples.slice(0, 5),
    suppressed: suppressed.slice(0, 12),
    refs: uniq([...refs, ...refsForBundle(bundle)]).slice(0, 30),
  };
}

function trimTitle(value: string, maxWords = 10): string {
  const cleaned = clean(value)
    .replace(
      /\s*[|–-]\s*(?:Al Jazeera|Firstpost|CBS News|Raw Story|Moneycontrol\.com|News Today|AajTak).*$/i,
      "",
    )
    .replace(/[^\x00-\x7F]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const fallback = clean(value)
    .replace(/[^\x00-\x7F]+/g, "")
    .trim();
  const safe = cleaned || fallback || "one selected story";
  const words = safe.split(/\s+/).filter(Boolean);
  return words.length > maxWords
    ? `${words.slice(0, maxWords).join(" ")}…`
    : safe;
}

function frameLanesForArc(
  bundle: IntelligenceDepthBundle,
  examples: CompanyPgiStoryExample[],
): CompanyPgiFrameLane[] {
  const text = clean(
    `${bundle.heading} ${bundle.body_text} ${examples.map((e) => e.title).join(" ")}`,
  ).toLowerCase();
  const lanes: CompanyPgiFrameLane[] = [];
  if (
    /press freedom|journalist|censorship|media freedom|rsf|reporters without borders/.test(
      text,
    )
  ) {
    lanes.push({
      label: "civic freedom",
      description:
        "Some coverage treats this as a measure of whether journalists and institutions can work freely.",
      examples: examples.slice(0, 3).map((e) => e.title),
      who_benefits_or_is_protected:
        "Audiences and journalists benefit when access, safety, and independence stay visible.",
    });
    lanes.push({
      label: "state control and security",
      description:
        "Other coverage makes the issue about law, order, security, or state pressure rather than media freedom alone.",
      examples: examples
        .filter((e) =>
          /pakistan|hong kong|trump|state|legal|security|law/i.test(e.title),
        )
        .slice(0, 3)
        .map((e) => e.title),
      who_benefits_or_is_protected:
        "Institutions benefit when the story is read mainly as control, compliance, or security.",
    });
    lanes.push({
      label: "public trust",
      description:
        "A third lane is about whether audiences can trust what reaches them and who gets believed.",
      examples: examples
        .filter((e) =>
          /trust|disinformation|misinformation|ranking|index|lowest/i.test(
            e.title,
          ),
        )
        .slice(0, 3)
        .map((e) => e.title),
    });
    return lanes;
  }
  if (/hormuz|shipping|freight|suez|route|port|red sea|maritime/.test(text)) {
    return [
      {
        label: "formal route access",
        description:
          "One view treats a route as less constrained once visible movement resumes.",
        examples: examples.slice(0, 3).map((e) => e.title),
      },
      {
        label: "market confidence",
        description:
          "The other asks whether insurers, carriers, prices, and traffic behave as if risk has really cleared.",
        examples: examples.slice(0, 3).map((e) => e.title),
      },
    ];
  }
  if (/deepfake|synthetic|ai|cyber|identity|video|voice/.test(text)) {
    return [
      {
        label: "identity as content",
        description:
          "Some coverage treats synthetic media as content moderation, likeness, or platform policy.",
        examples: examples.slice(0, 3).map((e) => e.title),
      },
      {
        label: "identity as evidence",
        description:
          "The deeper issue is whether voice, image, and records can still be trusted as proof.",
        examples: examples.slice(0, 3).map((e) => e.title),
      },
    ];
  }
  return [
    {
      label: "event view",
      description: "One lane treats the finding as a standalone development.",
      examples: examples.slice(0, 3).map((e) => e.title),
    },
    {
      label: "operating-climate view",
      description:
        "The other lane asks what the finding changes about trust, access, risk, or timing around the company’s world.",
      examples: examples.slice(0, 3).map((e) => e.title),
    },
  ];
}

function titleForArc(
  section: string,
  examples: CompanyPgiStoryExample[],
): string {
  const text =
    `${section} ${examples.map((e) => e.title).join(" ")}`.toLowerCase();
  if (/press freedom|rsf|journalist|censorship/.test(text))
    return "Press freedom is becoming an operating-climate story";
  if (/hormuz|shipping|route|freight/.test(text))
    return "Route access and market confidence are separating";
  if (/deepfake|synthetic|identity|ai/.test(text))
    return "Synthetic media is turning identity into an evidence problem";
  if (/disinformation|misinformation/.test(text))
    return "Disinformation is moving from claim problem to channel problem";
  return `${section} is changing how the company should read the day`;
}

function findingSummary(
  section: string,
  examples: CompanyPgiStoryExample[],
): string {
  const names = examples.slice(0, 3).map((e) => trimTitle(e.title));
  if (/press freedom|rsf/i.test(`${section} ${names.join(" ")}`)) {
    return `Today’s scan repeatedly surfaced press-freedom coverage, including ${humanList(names, 2)}.`;
  }
  return `Today’s scan surfaced ${humanList(names, 2)} around ${section}.`;
}

function missingConnection(
  section: string,
  examples: CompanyPgiStoryExample[],
): string {
  const text =
    `${section} ${examples.map((e) => e.title).join(" ")}`.toLowerCase();
  if (/press freedom|rsf|journalist/.test(text)) {
    return "The missing connection is that rankings, legal pressure, censorship, disinformation, and audience trust are often covered separately even though they shape the same media environment.";
  }
  if (/hormuz|shipping|route|freight/.test(text)) {
    return "The missing connection is that formal route access and market confidence can move at different speeds.";
  }
  if (/deepfake|synthetic|identity|ai/.test(text)) {
    return "The missing connection is that synthetic media is not only a content problem; it can change whether identity and records are trusted as evidence.";
  }
  return "The missing connection is how separate articles may be pointing to the same operating condition.";
}

function companyRead(
  packet: CompanyBriefingEvidencePacket,
  section: string,
  examples: CompanyPgiStoryExample[],
): string {
  const company = packet.company.display_name;
  const text =
    `${section} ${examples.map((e) => e.title).join(" ")}`.toLowerCase();
  if (/press freedom|rsf|journalist/.test(text)) {
    return `For ${company}, the useful thing to notice is that press freedom is not only a rights story. It affects access, credibility, censorship risk, audience confidence, and who gets believed.`;
  }
  if (/hormuz|shipping|route|freight/.test(text)) {
    return `For ${company}, the useful thing to notice is whether the market behaves as if risk has cleared, not only whether a route is formally open.`;
  }
  if (/deepfake|synthetic|identity|ai/.test(text)) {
    return `For ${company}, the useful thing to notice is the shift from identity as content to identity as evidence: voice, image, likeness, and records can all become contested.`;
  }
  return `For ${company}, the useful thing to notice is how this changes the operating climate around ${section.toLowerCase()}.`;
}

function confidenceForBundle(
  bundle: IntelligenceDepthBundle,
  examples: CompanyPgiStoryExample[],
): UnderstandingConfidence {
  if (bundle.confidence === "high" || examples.length >= 4) return "high";
  if (bundle.confidence === "medium" || examples.length >= 2) return "medium";
  return "low";
}

function arcFromBundle(input: {
  packet: CompanyBriefingEvidencePacket;
  bundle: IntelligenceDepthBundle;
  selected: SelectedSignalForDepth[];
  scanDate: string;
  arcType: CompanyPgiArcType;
  index: number;
}): { arc: CompanyPgiStoryArc; suppressed: CompanyPgiStoryExample[] } {
  const { packet, bundle, selected, scanDate, arcType, index } = input;
  const section = clean(
    bundle.section_label || bundle.heading || "Tracked topic",
  );
  const { examples, suppressed, refs } = bundleExamples(
    packet,
    bundle,
    selected,
  );
  const lanes = frameLanesForArc(bundle, examples);
  const title = titleForArc(section, examples);
  const missing = missingConnection(section, examples);
  const read = companyRead(packet, section, examples);
  const score = scoreBundle(bundle);
  const sourceDomains = uniq([
    ...bundle.source_names.map(sourceName),
    ...examples.map((example) => sourceName(example.source_domain)),
  ]).slice(0, 12);
  const regions = uniq(
    selected.flatMap((item) => item.signal.regions || []),
  ).slice(0, 8);
  const frameLabels = lanes.map((lane) => lane.label);
  const arc: CompanyPgiStoryArc = {
    arc_id: `company_pgi_arc_${scanDate}_${packet.company.company_id}_${index + 1}`,
    company_profile_id: packet.company.company_id,
    scan_date: scanDate,
    title,
    arc_type: arcType,
    source_scan_areas: uniq([
      section,
      ...examples.map((example) => example.scan_area),
    ]).slice(0, 6),
    finding_summary: findingSummary(section, examples),
    story_examples: examples,
    perception_split: {
      plain_summary: `The same findings can be read through ${humanList(frameLabels, 3)}.`,
      frame_lanes: lanes,
      strongest_gap:
        lanes.length >= 2
          ? `${lanes[0].label} vs ${lanes[1].label}`
          : "single visible frame with missing context",
      missing_connection: missing,
    },
    learning: {
      company_read: read,
      broader_pattern: missing,
      what_to_carry_forward: `Carry forward the connection between ${humanList(frameLabels, 3)} rather than treating each article as a separate item.`,
      what_would_change_the_read:
        "The read would change if tomorrow brings enforcement, a new actor, a new geography, a different source region, or a clearer consequence.",
    },
    continuity: {
      status: suppressed.length >= 3 ? "recurring_pattern" : "new_story",
      previous_arc_ids: [],
      changed_because:
        suppressed.length >= 3
          ? [
              "Several articles repeated the same core story; the value is in the pattern, not each circulation.",
            ]
          : ["New scan findings appeared in this window."],
    },
    evidence_refs: refs,
    source_domains: sourceDomains,
    regions,
    confidence: confidenceForBundle(bundle, examples),
    score,
  };
  return { arc, suppressed };
}

function arcSortScore(bundle: IntelligenceDepthBundle): number {
  return (
    scoreBundle(bundle) * 10 +
    bundle.source_names.length * 3 +
    bundle.source_frames.length * 8
  );
}

export function buildCompanyPgiStoryArcs(input: {
  packet: CompanyBriefingEvidencePacket;
  bundles: IntelligenceDepthBundle[];
  selected: SelectedSignalForDepth[];
  scanDate: string;
}): CompanyPgiStoryArcResult {
  const { packet, bundles, selected, scanDate } = input;
  if (!bundles.length)
    return {
      arcs: [],
      supporting_streams: [],
      suppressed_repeats: [],
      observations: [],
    };
  const ranked = [...bundles]
    .sort((a, b) => arcSortScore(b) - arcSortScore(a))
    .slice(0, 3);
  const suppressed: CompanyPgiStoryExample[] = [];
  const arcs = ranked.map((bundle, index) => {
    const built = arcFromBundle({
      packet,
      bundle,
      selected,
      scanDate,
      arcType: index === 0 ? "main_arc" : "supporting_stream",
      index,
    });
    suppressed.push(...built.suppressed);
    return built.arc;
  });
  const mainArc = arcs[0];
  const supporting = arcs.slice(1, 3);
  const observations = mainArc
    ? buildObservationsFromArc(mainArc, supporting)
    : [];
  return {
    arcs,
    main_arc: mainArc,
    supporting_streams: supporting,
    suppressed_repeats: suppressed,
    email_read: mainArc
      ? summariseStoryArcForEmail(packet, mainArc, supporting)
      : undefined,
    customer_read: mainArc
      ? buildCustomerPgiRead(packet, mainArc, supporting)
      : undefined,
    observations,
  };
}

export function buildCustomerPgiRead(
  packet: CompanyBriefingEvidencePacket,
  mainArc: CompanyPgiStoryArc,
  supporting: CompanyPgiStoryArc[] = [],
): CompanyPgiCustomerRead {
  const company = packet.company.display_name;
  const lanes = mainArc.perception_split.frame_lanes.filter(
    (lane) =>
      lane.label &&
      lane.description &&
      !/^(event view|operating-climate view)$/i.test(lane.label),
  );
  const useTwoFrames = lanes.length === 2;
  const exampleLine = (arc: CompanyPgiStoryArc): string => {
    const area = humanList(arc.source_scan_areas, 2).toLowerCase();
    const title = trimTitle(arc.story_examples[0]?.title || arc.title, 9);
    return `The scan found coverage around ${area}, including ${title}.`;
  };
  const whatAppeared = [exampleLine(mainArc), supporting[0] && exampleLine(supporting[0])]
    .filter(Boolean)
    .map((text) => shorten(text, 24))
    .slice(0, 2);

  const titleText = `${mainArc.title} ${mainArc.source_scan_areas.join(" ")}`.toLowerCase();
  const read = useTwoFrames
    ? /route|shipping|freight|hormuz|suez|blockage/.test(titleText)
      ? `The gap is between visible route access and whether the wider market behaves as if risk has cleared.`
      : /synthetic|identity|deepfake|ai/.test(titleText)
        ? `The gap is between treating synthetic media as content and treating it as evidence.`
        : `The gap is between ${lanes[0].label} and ${lanes[1].label}.`
    : /press freedom|journalist|censorship|media freedom|reputation/.test(
          titleText,
        )
      ? `The useful gap is that press freedom is not only a rights story; for media companies, it also shapes operating conditions.`
      : mainArc.learning.company_read;

  return {
    headline: mainArc.title,
    read: shorten(read, 28),
    what_appeared: whatAppeared.length
      ? whatAppeared
      : [shorten(mainArc.finding_summary, 26)],
    comparison_mode: useTwoFrames ? "two_frames" : "single_gap",
    frames: useTwoFrames
      ? lanes.slice(0, 2).map((lane) => ({
          label: clean(lane.label),
          text: shorten(lane.description, 22),
        }))
      : undefined,
    gap_summary: useTwoFrames
      ? undefined
      : shorten(mainArc.perception_split.missing_connection, 28),
    what_this_helps_us_notice: shorten(mainArc.learning.broader_pattern, 30),
    why_it_matters: shorten(
      mainArc.learning.company_read.replace(/^For [^,]+,\s*/i, `For ${company}, `),
      30,
    ),
    evidence_note: mainArc.source_domains.length
      ? `Based on ${mainArc.source_domains.slice(0, 3).join(", ")}${
          mainArc.source_domains.length > 3 ? " and other scanned sources" : ""
        }.`
      : undefined,
  };
}

export function summariseStoryArcForEmail(
  packet: CompanyBriefingEvidencePacket,
  mainArc: CompanyPgiStoryArc,
  supporting: CompanyPgiStoryArc[] = [],
): string {
  const structured = buildCustomerPgiRead(packet, mainArc, supporting);
  const supportingLine = supporting.length
    ? ` Related streams also appeared around ${humanList(
        supporting.map((arc) => arc.source_scan_areas[0] || arc.title),
        2,
      )}.`
    : "";
  return clean(
    `View: ${structured.read} What appeared: ${structured.what_appeared.join(" ")} The gap: ${structured.gap_summary || structured.frames?.map((frame) => `${frame.label}: ${frame.text}`).join(" ") || "The scan shows two different reads of the same story."} What this helps us notice: ${structured.what_this_helps_us_notice} Why it matters: ${structured.why_it_matters}${supportingLine}`,
  );
}

export function buildObservationsFromArc(
  mainArc: CompanyPgiStoryArc,
  supporting: CompanyPgiStoryArc[] = [],
): Array<{ text: string; supported_by: EvidenceSupportRef[] }> {
  const refs = mainArc.evidence_refs.slice(0, 16);
  const observations = [
    {
      text: clean(`Learning: ${mainArc.learning.broader_pattern}`),
      supported_by: refs,
    },
    {
      text: clean(`Carry forward: ${mainArc.learning.what_to_carry_forward}`),
      supported_by: refs,
    },
  ];
  if (supporting[0]) {
    observations.push({
      text: clean(
        `Related stream: ${supporting[0].finding_summary} It matters because it supports the same wider read rather than standing alone.`,
      ),
      supported_by: supporting[0].evidence_refs.slice(0, 12),
    });
  } else {
    observations.push({
      text: clean(mainArc.learning.what_would_change_the_read),
      supported_by: refs,
    });
  }
  return observations.slice(0, 3);
}
