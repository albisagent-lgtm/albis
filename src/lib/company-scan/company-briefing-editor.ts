// ---------------------------------------------------------------------------
// Package 9.3B — Premium English editor pass.
//
// This is intentionally conservative. It edits customer-facing prose for
// clarity, rhythm, and human readability, but it does not alter support refs,
// selected items, claim maps, sources, or evidence. QA runs after this pass.
// ---------------------------------------------------------------------------

import type {
  CompanyBriefingEditorFieldAudit,
  CompanyBriefingEditorMode,
  CompanyBriefingEditorPass,
  CompanyBriefingEvidencePacket,
  CompanyBriefingGenerationOutput,
  GeneratedText,
} from "./types";

export type CompanyBriefingEditorResult = {
  output: CompanyBriefingGenerationOutput;
  edited: boolean;
  edit_report: CompanyBriefingEditorPass;
};

type EditableField = {
  path: string;
  value: GeneratedText;
};

const COMMON_SENTENCE_WORDS = new Set([
  "A",
  "An",
  "And",
  "As",
  "Built",
  "But",
  "If",
  "It",
  "Key",
  "One",
  "Open",
  "Sources",
  "That",
  "The",
  "These",
  "This",
  "Today",
  "When",
]);

function cloneOutput(output: CompanyBriefingGenerationOutput): CompanyBriefingGenerationOutput {
  return JSON.parse(JSON.stringify(output)) as CompanyBriefingGenerationOutput;
}

function normalizeParagraphSpacing(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/[ \t]+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim())
    .filter(Boolean)
    .join("\n\n");
}

function polishText(raw: string): string {
  let text = normalizeParagraphSpacing(raw);

  const replacements: Array<[RegExp, string]> = [
    [/\bThe main read was\b/g, "The useful read is"],
    [/\bThe main issue is\b/g, "The central issue is"],
    [/\bThe useful pattern is\b/g, "The pattern is"],
    [/\bThe useful change is\b/g, "The shift is"],
    [/\bnot just another\b/g, "not simply another"],
    [/\bThat number separates\b/g, "That number helps separate"],
    [/\bThe key point is simple:\s*open water\b/g, "Open water"],
    [/\bThese are early signals, not proof of\b/g, "These are early signals rather than proof of"],
    [/\bSuez-linked coverage showed delay evidence entering\b/g, "Suez-linked coverage brought delay evidence into"],
    [/\bIt cited an Agriculture Transport Coalition estimate for one week of\b/g, "It cited an Agriculture Transport Coalition estimate for a single week of"],
    [/\bThis is outside the Gulf, but it gives\b/g, "This example sits outside the Gulf, but it gives"],
    [/\bThe evidence points to\b/g, "The evidence shows"],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  return normalizeParagraphSpacing(text);
}

function listEditableFields(output: CompanyBriefingGenerationOutput): EditableField[] {
  return [
    { path: "today_brief.top_line", value: output.today_brief.top_line },
    ...output.today_brief.bullets.map((value, i) => ({ path: `today_brief.bullets[${i}]`, value })),
    ...output.main_briefing.sections.flatMap((section, sectionIndex) =>
      section.items.flatMap((item, itemIndex) => [
        { path: `main_briefing.sections[${sectionIndex}].items[${itemIndex}].title`, value: item.title },
        { path: `main_briefing.sections[${sectionIndex}].items[${itemIndex}].body`, value: item.body },
      ]),
    ),
    ...(output.scanner_report?.deeper_reads || []).flatMap((item, itemIndex) => [
      { path: `scanner_report.deeper_reads[${itemIndex}].title`, value: item.title },
      { path: `scanner_report.deeper_reads[${itemIndex}].body`, value: item.body },
    ]),
    ...(output.scanner_report?.also_seen || []).map((value, i) => ({ path: `scanner_report.also_seen[${i}]`, value })),
    ...output.perception_gap.notes.map((note, i) => ({ path: `perception_gap.notes[${i}].note`, value: note.note })),
    ...output.useful_observations.observations.map((value, i) => ({ path: `useful_observations.observations[${i}]`, value })),
    { path: "source_notes.text", value: output.source_notes.text },
  ];
}

function extractNumbers(text: string): string[] {
  const matches = text.match(/\$?\b\d+(?:\.\d+)?\s?(?:%|million|billion|days?|weeks?|months?|years?)?\b|\bpre-war\b/gi) || [];
  return [...new Set(matches.map((match) => match.toLowerCase().replace(/\s+/g, " ").trim()))];
}

function extractEntities(text: string): string[] {
  const matches = text.match(/\b[A-Z][a-z]+(?:[- ][A-Z][a-z]+|[- ][A-Z]{2,})*\b/g) || [];
  return [...new Set(matches.filter((match) => !COMMON_SENTENCE_WORDS.has(match)))];
}

function addedValues(after: string[], before: string[]): string[] {
  const beforeSet = new Set(before.map((value) => value.toLowerCase()));
  return after.filter((value) => !beforeSet.has(value.toLowerCase()));
}

function supportRefsEqual(a: GeneratedText, b: GeneratedText): boolean {
  return JSON.stringify(a.supported_by || []) === JSON.stringify(b.supported_by || []);
}

function packetEvidenceText(packet: CompanyBriefingEvidencePacket): string {
  return packet.email_items
    .flatMap((item) => [
      item.canonical_event_name,
      item.event_tuple?.actor,
      item.event_tuple?.action,
      item.event_tuple?.object,
      item.event_tuple?.place,
      item.why_it_matters?.text,
      ...(item.facts || []).map((fact) => fact.text),
    ])
    .filter(Boolean)
    .join("\n");
}

function filterEntitiesSupportedByPacket(entities: string[], packet: CompanyBriefingEvidencePacket): string[] {
  const evidence = packetEvidenceText(packet).toLowerCase();
  return entities.filter((entity) => !evidence.includes(entity.toLowerCase()));
}

export async function editCompanyBriefingForReadability(input: {
  packet: CompanyBriefingEvidencePacket;
  output: CompanyBriefingGenerationOutput;
  mode?: CompanyBriefingEditorMode;
}): Promise<CompanyBriefingEditorResult> {
  const mode = input.mode || "premium_readability";
  const output = cloneOutput(input.output);
  const draftFields = listEditableFields(input.output);
  const editedFields = listEditableFields(output);
  const changedPaths: string[] = [];
  const warnings: string[] = [];
  const fieldAudits: CompanyBriefingEditorFieldAudit[] = [];

  for (let i = 0; i < editedFields.length; i++) {
    const draft = draftFields[i];
    const edited = editedFields[i];
    const beforeText = draft.value.text;
    const afterText = polishText(beforeText);

    edited.value.text = afterText;

    const addedNumbers = addedValues(extractNumbers(afterText), extractNumbers(beforeText));
    const addedEntities = filterEntitiesSupportedByPacket(
      addedValues(extractEntities(afterText), extractEntities(beforeText)),
      input.packet,
    );
    const supportRefsUnchanged = supportRefsEqual(draft.value, edited.value);

    if (afterText !== beforeText) changedPaths.push(edited.path);
    if (addedNumbers.length) warnings.push(`${edited.path}: editor introduced number(s): ${addedNumbers.join(", ")}`);
    if (addedEntities.length) warnings.push(`${edited.path}: editor introduced possible entity/entities: ${addedEntities.join(", ")}`);
    if (!supportRefsUnchanged) warnings.push(`${edited.path}: support refs changed during editor pass`);
    if (!afterText.trim()) warnings.push(`${edited.path}: editor produced empty text`);

    fieldAudits.push({
      path: edited.path,
      before_text: beforeText,
      after_text: afterText,
      support_refs_unchanged: supportRefsUnchanged,
      added_numbers: addedNumbers,
      added_entities: addedEntities,
    });
  }

  const blocked = fieldAudits.some((audit) =>
    !audit.support_refs_unchanged || !audit.after_text.trim() || audit.added_numbers.length > 0,
  );

  const editReport: CompanyBriefingEditorPass = {
    enabled: true,
    mode,
    deterministic: true,
    changed_paths: changedPaths,
    warnings,
    blocked,
    blocked_reason: blocked ? "Editor safety audit found changed support refs, empty text, or added numbers." : undefined,
    field_audits: fieldAudits,
  };

  return {
    output,
    edited: changedPaths.length > 0,
    edit_report: editReport,
  };
}
