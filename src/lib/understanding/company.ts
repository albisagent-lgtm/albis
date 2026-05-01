// ---------------------------------------------------------------------------
// Company Understanding Layer v1.
//
// Deterministic first pass: uses the evidence packet + intelligence-depth
// bundles already produced by Package 8/9. Later we can swap in LLM deep-read
// notes behind the same UnderstandingNote and CompanyPgiV2Report shape.
// ---------------------------------------------------------------------------

import type {
  CompanyBriefingEvidencePacket,
  EvidenceSupportRef,
} from "../company-scan/types";
import type {
  IntelligenceDepthBundle,
  SelectedSignalForDepth,
} from "../company-scan/intelligence-depth";
import type {
  CompanyPgiV2Report,
  UnderstandingCandidateCluster,
  UnderstandingNote,
  UnderstandingRoute,
} from "./types";
import { buildCompanyPgiStoryArcs } from "./company-pgi-story-arc";
import { runHumanVoiceQa } from "./voice-qa";

function clean(value: unknown): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\bThe relevance is\b/gi, "The practical point is")
    .replace(/\bThe useful distinction is\b/gi, "The practical difference is")
    .replace(/\bThis matters because\b/gi, "The practical point is")
    .replace(/\bThe datapoint was useful because\b/gi, "The useful point is")
    .replace(/\bdatapoint was useful\b/gi, "point matters")
    .replace(/\bshowed up in coverage\b/gi, "appeared in coverage")
    .replace(/\bpicked up\b/gi, "found")
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
  if (items.length <= 1) return items[0] || "the tracked topics";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function pgiLevel(score: number): string {
  if (score <= 4) return "mostly aligned";
  if (score <= 6) return "starting to split";
  if (score <= 8) return "clearly split";
  return "moving in separate worlds";
}

function scoreBundle(bundle: IntelligenceDepthBundle): number {
  const sourceCount = Math.min(5, Math.max(1, bundle.source_names.length));
  const regionCount = Math.min(
    4,
    Math.max(1, uniq(bundle.source_refs.map((ref) => ref.id)).length),
  );
  const frameBoost = bundle.source_frames.length ? 1.1 : 0;
  const confidenceBoost =
    bundle.confidence === "high"
      ? 0.7
      : bundle.confidence === "medium"
        ? 0.35
        : 0;
  const classBoost =
    bundle.evidence_class === "source_frame" ||
    bundle.evidence_class === "multi_source_pattern"
      ? 0.55
      : 0;
  return Number(
    Math.min(
      9.4,
      3.6 +
        sourceCount * 0.45 +
        regionCount * 0.25 +
        frameBoost +
        confidenceBoost +
        classBoost,
    ).toFixed(1),
  );
}

function routeForBundle(bundle: IntelligenceDepthBundle): UnderstandingRoute {
  if (bundle.confidence === "low" && bundle.source_names.length <= 1)
    return "dashboard_note";
  if (bundle.source_frames.length || bundle.source_names.length >= 2)
    return "deep_read";
  return "quick_hit";
}

function refsForBundle(bundle: IntelligenceDepthBundle): EvidenceSupportRef[] {
  return uniq([
    ...bundle.source_refs,
    ...bundle.claim_ids.map((id) => ({ type: "claim_id" as const, id })),
  ]).slice(0, 20);
}

function factsForBundle(bundle: IntelligenceDepthBundle): string[] {
  return uniq(
    [
      ...bundle.what_happened.map((fact) => fact.text),
      ...bundle.what_registered.map((fact) => fact.text),
      bundle.company_read?.text,
    ]
      .map(clean)
      .filter(Boolean),
  ).slice(0, 4);
}

function frameLines(bundle: IntelligenceDepthBundle): string[] {
  const direct = bundle.source_frames
    .map((frame) => clean(frame.text))
    .filter(Boolean);
  if (direct.length) return direct.slice(0, 3);
  return uniq(
    bundle.source_names.map(
      (source) =>
        `${sourceName(source)} is treating this as part of ${clean(bundle.section_label).toLowerCase()}.`,
    ),
  ).slice(0, 2);
}

export function buildCompanyUnderstandingClusters(input: {
  packet: CompanyBriefingEvidencePacket;
  bundles: IntelligenceDepthBundle[];
  date: string;
}): UnderstandingCandidateCluster[] {
  const { packet, bundles, date } = input;
  return bundles.map((bundle) => ({
    cluster_id: bundle.anchor_cluster_id,
    date,
    scope: "company" as const,
    company_profile_id: packet.company.company_id,
    title_guess: bundle.heading,
    items: [
      {
        item_id: bundle.anchor_item_id,
        title: bundle.heading,
        summary: bundle.body_text,
        source_domain: bundle.source_names[0],
        regions: [],
        support_refs: refsForBundle(bundle),
      },
    ],
    source_domains: uniq(bundle.source_names.map(sourceName)),
    regions: [],
    languages: [],
    categories: [bundle.section_label],
    company_scan_areas: [bundle.section_label],
    possible_event_type: bundle.signal_kind,
  }));
}

export function buildCompanyUnderstandingNotes(input: {
  packet: CompanyBriefingEvidencePacket;
  bundles: IntelligenceDepthBundle[];
  date: string;
}): UnderstandingNote[] {
  const { packet, bundles, date } = input;
  const now = new Date().toISOString();
  return bundles.map((bundle, index) => {
    const sources = uniq(bundle.source_names.map(sourceName));
    const facts = factsForBundle(bundle);
    const frames = frameLines(bundle);
    const missing =
      bundle.evidence_class === "single_source_signal"
        ? ["More independent coverage would make this read stronger."]
        : [
            "The public coverage still leaves the practical next step less clear than the event itself.",
          ];
    const route = routeForBundle(bundle);
    const whoSees =
      sources.length >= 2
        ? sources.slice(0, 4)
        : [sources[0] || "the source closest to this event"];
    const company = packet.company.display_name;
    const section = clean(bundle.section_label || bundle.heading);
    const thesis = clean(
      `${section} is not just another item in the feed; it changes what ${company} should treat as visible, disputed, or still missing today.`,
    );
    const textsForQa = [
      thesis,
      bundle.company_read?.text,
      bundle.analyst_observation?.body,
      ...frames,
    ];
    const voiceIssues = runHumanVoiceQa(textsForQa);
    return {
      note_id: `company_understanding_${date}_${packet.company.company_id}_${index + 1}`,
      created_at: now,
      scope: "company",
      date,
      company_profile_id: packet.company.company_id,
      cluster_id: bundle.anchor_cluster_id,
      route,
      confidence: bundle.confidence,
      what_changed: facts[0] || clean(bundle.body_text || bundle.heading),
      why_it_matters: clean(
        bundle.company_read?.text ||
          `${section} may affect how ${company} reads risk, trust, timing, or public attention.`,
      ),
      what_reader_might_miss: clean(
        bundle.analyst_observation?.body ||
          "The useful part is not only what happened, but which part of the story different sources made central.",
      ),
      who_sees_it_differently: whoSees,
      what_is_missing_or_undercovered: missing,
      human_consequence: clean(
        frames[0] ||
          "People may receive a different sense of urgency depending on which source they see first.",
      ),
      systems_consequence: clean(
        bundle.what_is_changing[0]?.text ||
          "The issue may travel through institutions, platforms, markets, or public trust before it becomes obvious.",
      ),
      company_relevance: clean(
        bundle.company_read?.text ||
          `${company} tracks this because it touches ${section}.`,
      ),
      cui_bono:
        "The useful question is who benefits when this is seen mainly as a risk story, a responsibility story, a market story, or a normal background update.",
      one_clean_thesis: thesis,
      supporting_facts: facts,
      uncertainty:
        bundle.confidence === "low"
          ? "This is an early read and needs more independent confirmation."
          : "The event is visible enough to read, but the meaning can still change as coverage develops.",
      output_recommendation:
        route === "deep_read"
          ? "Use in company PGI and dashboard evidence."
          : route === "quick_hit"
            ? "Use as a short briefing item."
            : "Keep mostly to dashboard unless it develops.",
      support_refs: refsForBundle(bundle),
      diagnostics: {
        route,
        source_count: sources.length,
        region_count: 0,
        language_count: 0,
        has_frame_evidence: bundle.source_frames.length > 0,
        has_company_relevance: Boolean(bundle.company_read?.text),
        missing_evidence: missing,
        voice_warnings: voiceIssues.map((issue) => issue.code),
      },
    };
  });
}

export function buildCompanyPgiV2Report(input: {
  packet: CompanyBriefingEvidencePacket;
  bundles: IntelligenceDepthBundle[];
  date: string;
  selected?: SelectedSignalForDepth[];
}): CompanyPgiV2Report | null {
  const { packet, bundles, date, selected = [] } = input;
  if (!bundles.length) return null;
  const notes = buildCompanyUnderstandingNotes(input);
  const usableNotes = notes.filter(
    (note) => note.route !== "discard" && note.route !== "hold",
  );
  if (!usableNotes.length) return null;
  const scored = bundles
    .map((bundle, index) => ({
      bundle,
      note: notes[index],
      score: scoreBundle(bundle),
    }))
    .sort((a, b) => b.score - a.score);
  const top = scored[0];
  if (!top?.note) return null;
  const company = packet.company.display_name;
  const score = Number(
    (
      scored.reduce((sum, entry) => sum + entry.score, 0) / scored.length
    ).toFixed(1),
  );
  const level = pgiLevel(score);
  const sections = uniq(
    scored.map((entry) => clean(entry.bundle.section_label)).filter(Boolean),
  ).slice(0, 4);
  const missing = uniq(
    usableNotes.flatMap((note) => note.what_is_missing_or_undercovered),
  ).slice(0, 4);
  const storyArcResult = buildCompanyPgiStoryArcs({
    packet,
    bundles,
    selected,
    scanDate: date,
  });
  const mainSplit = clean(
    storyArcResult.main_arc?.perception_split.plain_summary ||
      `${humanList(sections, 3)} is ${level}; the same day of coverage can make the issue look like a risk story, a responsibility story, or background noise.`,
  );
  const emailRead = clean(
    storyArcResult.email_read ||
      `What appeared: ${humanList(sections, 3)} surfaced in today's scan. How it is being seen: ${mainSplit} What we learned: ${top.note.company_relevance}`,
  );
  return {
    version: "company_pgi_v2",
    generated_at: new Date().toISOString(),
    company_profile_id: packet.company.company_id,
    company_name: company,
    date,
    email_read: emailRead,
    customer_read: storyArcResult.customer_read,
    dashboard_read: {
      headline: `${company}: where today's coverage splits`,
      score,
      level,
      main_split: mainSplit,
      missing_or_undercovered: missing,
      cui_bono: top.note.cui_bono,
      company_relevance: top.note.company_relevance || top.note.why_it_matters,
      evidence: scored.slice(0, 6).map((entry) => ({
        label: clean(entry.bundle.section_label || entry.bundle.heading),
        source_domains: uniq(entry.bundle.source_names.map(sourceName)).slice(
          0,
          5,
        ),
        regions: [],
      })),
      notes_used: usableNotes.map((note) => note.note_id),
      story_arcs: storyArcResult.arcs,
      suppressed_repeats: storyArcResult.suppressed_repeats,
    },
    story_arcs: storyArcResult.arcs,
    pgi_observations: storyArcResult.observations,
    understanding_notes: usableNotes,
  };
}
