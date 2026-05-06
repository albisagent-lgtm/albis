// ---------------------------------------------------------------------------
// Researched Understanding Layer — local-first research dossiers.
//
// Implements the architecture in:
//   memory/researched-understanding-layer-build-plan.md
//
// V1 is intentionally side-effect free. It does not fetch, write DB rows, or
// send email. It turns the existing company scan/evidence packet into durable
// research clusters, source trails, research notes, and Albis findings so the
// writers are no longer asked to invent meaning from headlines.
// ---------------------------------------------------------------------------

import type {
  AlbisFinding,
  CompanyBriefingEvidencePacket,
  CompanyResearchedUnderstandingLayer,
  EvidenceArticleSupport,
  EvidenceEmailItem,
  ResearchCluster,
  ResearchConfidence,
  ResearchImportance,
  ResearchNote,
  ResearchSource,
  ResearchSourceObservation,
  SourceType,
  Signal,
} from "./types";
import { articleTextMaxFetches, fetchArticleText } from "./article-text-cache";
import type { IntelligenceDepthBundle, SelectedSignalForDepth } from "./intelligence-depth";

interface ResearchProfileContext {
  id: string;
  company_name: string;
}

interface BuildResearchedUnderstandingOptions {
  packet: CompanyBriefingEvidencePacket;
  profile: ResearchProfileContext;
  scanDate: string;
  selected: SelectedSignalForDepth[];
  signals: Signal[];
  bundles?: IntelligenceDepthBundle[];
  generatedAt?: string;
  maxClusters?: number;
}

function slugify(value: string): string {
  return (
    String(value || "item")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "item"
  );
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}

function cleanText(value: string | null | undefined): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ",")
    .replace(/\s+,/g, ",")
    .trim();
}

function trimWords(value: string, maxWords: number): string {
  const words = cleanText(value).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function sentence(value: string): string {
  const text = cleanText(value);
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function sourceDomain(value: string | null | undefined): string {
  return String(value || "unknown source").replace(/^www\./, "");
}

function sourceTypeFromDomain(domain: string | null | undefined): SourceType {
  const d = sourceDomain(domain).toLowerCase();
  if (/(reuters|apnews|associatedpress|bbc|bloomberg|afp|efe)/.test(d)) return "wire";
  if (/(maritime|freight|shipping|lloydslist|tradewinds|port|journal|trade)/.test(d)) return "trade";
  if (/(gov|parliament|senate|congress|europa|un\.org|unesco|who|imf|worldbank|oecd)/.test(d)) return "official";
  if (/(rsf|amnesty|hrw|cpj|freedomhouse|transparency)/.test(d)) return "ngo";
  if (/(company|corp|plc|inc|ltd|pressroom|newsroom)/.test(d)) return "company";
  if (/(substack|blog|medium)/.test(d)) return "blog";
  return "major_outlet";
}

function packetItemById(packet: CompanyBriefingEvidencePacket): Map<string, EvidenceEmailItem> {
  return new Map(packet.email_items.map((item) => [item.item_id, item]));
}

function supportFromItem(item: EvidenceEmailItem): EvidenceArticleSupport[] {
  const supports: EvidenceArticleSupport[] = [];
  supports.push(item.source_summary.anchor);
  supports.push(...item.source_summary.supporting);
  for (const fact of item.facts) supports.push(...fact.supported_by);
  const seen = new Set<string>();
  return supports.filter((support) => {
    const key = `${support.source_id}:${support.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function supportToSource(
  support: EvidenceArticleSupport,
  clusterId: string,
  role: ResearchSource["trail_role"],
  relevanceScore: number,
): ResearchSource {
  return {
    id: `${clusterId}_${support.source_id}`,
    cluster_id: clusterId,
    url: support.url,
    source_domain: sourceDomain(support.source_display_name),
    title: support.source_display_name,
    published_at: support.published_at || null,
    source_type: support.source_type || sourceTypeFromDomain(support.source_display_name),
    region: undefined,
    language: undefined,
    read_status: "snippet_only",
    trail_role: role,
    relevance_score: relevanceScore,
    reliability_note:
      support.role === "anchor"
        ? "Anchor source for the existing evidence packet. Full-text extraction is a later build step."
        : "Supporting source from the existing evidence packet. Full-text extraction is a later build step.",
  };
}

function selectedForBundle(
  bundle: IntelligenceDepthBundle | undefined,
  selected: SelectedSignalForDepth[],
): SelectedSignalForDepth[] {
  if (!bundle) return [];
  const signalIds = new Set(bundle.signal_ids);
  const sameSection = selected.filter((item) => item.section_ids.includes(bundle.section_id));
  const direct = selected.filter((item) => signalIds.has(item.signal.id));
  return uniq([...direct, ...sameSection]).slice(0, 20);
}

function importanceFor(index: number, relatedCount: number): ResearchImportance {
  if (index === 0 || relatedCount >= 6) return "critical";
  if (index <= 3 || relatedCount >= 3) return "high";
  return "medium";
}

function confidenceFor(sourceCount: number, snippetOnly: boolean): ResearchConfidence {
  if (sourceCount >= 3 && !snippetOnly) return "high";
  if (sourceCount >= 3) return "medium";
  return "low";
}

function extractNumbers(text: string): string[] {
  return uniq((text.match(/\b\d+(?:\.\d+)?%?|\$\d+(?:\.\d+)?\s?(?:bn|billion|m|million)?|\b\d{4}\b/gi) || [])).slice(0, 6);
}

function extractPlaces(signals: Signal[]): string[] {
  return uniq(signals.flatMap((signal) => signal.regions || [])).slice(0, 8);
}

function extractActors(signals: Signal[]): string[] {
  return uniq(signals.flatMap((signal) => signal.entities || [])).slice(0, 10);
}

function observationFromSource(source: ResearchSource): ResearchSourceObservation | null {
  if (!source.extracted_excerpt) return null;
  return {
    source_id: source.id,
    what_it_reports: trimWords(source.extracted_excerpt, 40),
    what_it_emphasises: source.source_type || source.region || "reported development",
    useful_detail: trimWords(source.extracted_title || source.title, 24),
  };
}

function observationForSignal(
  clusterId: string,
  signal: Signal,
  index: number,
): ResearchSourceObservation {
  const sourceId = `${clusterId}_src_${slugify(signal.source_domain || signal.id)}_${index + 1}`;
  const themes = (signal.themes || []).slice(0, 3).join(", ");
  const regions = (signal.regions || []).slice(0, 3).join(", ");
  return {
    source_id: sourceId,
    what_it_reports: trimWords(signal.summary || signal.headline, 34),
    what_it_emphasises: themes || regions || signal.signal_type || "reported development",
    useful_detail: trimWords(signal.headline, 24),
  };
}

function reportingDifferences(clusterId: string, relatedSignals: Signal[]) {
  const byRegion = new Map<string, Signal[]>();
  for (const signal of relatedSignals) {
    const region = signal.source_region || signal.regions?.[0] || "unspecified";
    const list = byRegion.get(region) || [];
    list.push(signal);
    byRegion.set(region, list);
  }
  if (byRegion.size < 2) return [];
  return [...byRegion.entries()].slice(0, 3).map(([region, signals]) => ({
    label: `${region} reporting`,
    description: `${region} sources in this cluster mainly surfaced ${signals
      .slice(0, 2)
      .map((signal) => trimWords(signal.headline, 12))
      .join("; ")}.`,
    source_ids: signals
      .slice(0, 4)
      .map((signal, index) => `${clusterId}_src_${slugify(signal.source_domain || signal.id)}_${index + 1}`),
  }));
}

function removeLeadSourceTitle(value: string | undefined | null): string {
  return cleanText(value)
    .replace(/^.{20,240}\|\s[^.!?]{2,140}[.!?]\s+/i, "")
    .replace(/^[^.!?]{20,240}[.!?]\s+(?=(The practical point|The risk|The key point|These are early|One vessel|The useful change|The agency|Reported)\b)/i, "")
    .replace(/^([^.!?]{8,180})\.\s+\1\.\s+/i, "$1. ")
    .replace(/^([^.!?]{8,180})\.\s+\1/i, "$1")
    .trim();
}

function distinctSentences(values: Array<string | undefined | null>, max = 3): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const cleaned = removeLeadSourceTitle(value);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, " ").slice(0, 90);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sentence(cleaned));
    if (out.length >= max) break;
  }
  return out;
}

function buildFindingBody(note: ResearchNote, sources: ResearchSource[]): string {
  const lead = distinctSentences(
    [note.what_happened, note.what_changed_today, ...note.key_facts],
    4,
  );
  const context = distinctSentences(
    [
      note.company_relevance,
      ...note.consequences,
      ...note.source_observations.map((observation) => observation.what_it_reports),
    ],
    4,
  );
  const sourceContrast = note.differences_in_reporting
    .map((difference) => sentence(difference.description))
    .slice(0, 3);
  const paragraphs = [
    lead.join(" "),
    context.join(" "),
    sourceContrast.length
      ? `The source contrast matters. ${sourceContrast.join(" ")}`
      : sources.length >= 2
        ? `${sources.slice(0, 3).map((source) => source.source_domain).join(", ")} add different layers to this tracked topic.`
        : "",
  ].filter(Boolean);
  if (paragraphs.length) return paragraphs.join("\n\n");
  if (sources.length) return "Albis found a relevant development, but the customer-facing read still needs editorial tightening before delivery.";
  return "The research trail is not strong enough yet for a customer-facing finding.";
}

function polishV1Title(value: string): string {
  return cleanText(value)
    .replace(/\bsignals need careful reading\b/gi, "coverage needs careful reading")
    .replace(/\bpress freedom signals\b/gi, "press freedom coverage")
    .replace(/\bsignals?\b/gi, "coverage")
    .replace(/\s+-\s+[^-]{2,50}$/g, "")
    .replace(/\s+\|\s+[^|]{2,50}$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function makeResearchSourceFromSignal(
  clusterId: string,
  signal: Signal,
  index: number,
  role: ResearchSource["trail_role"],
  relevanceScore: number,
): ResearchSource {
  return {
    id: `${clusterId}_src_${slugify(signal.source_domain || signal.id)}_${index + 1}`,
    cluster_id: clusterId,
    url: signal.source_url || "",
    source_domain: sourceDomain(signal.source_domain),
    title: signal.headline,
    published_at: signal.signal_date || null,
    source_type: sourceTypeFromDomain(signal.source_domain),
    region: signal.source_region || signal.regions?.[0] || null,
    language: signal.source_language || null,
    read_status: "snippet_only",
    trail_role: role,
    relevance_score: relevanceScore,
    reliability_note: "Existing scan signal. Build 3 will upgrade this from snippet/source metadata to fetched article text where available.",
  };
}

async function enrichSourcesWithArticleText(
  sources: ResearchSource[],
  fetchBudget: { remaining: number },
): Promise<void> {
  const seenUrls = new Set<string>();
  for (const source of sources) {
    if (!source.url || seenUrls.has(source.url)) continue;
    seenUrls.add(source.url);
    if (fetchBudget.remaining <= 0) {
      source.text_cache_status = "skipped_budget_exhausted";
      continue;
    }
    fetchBudget.remaining -= 1;
    const result = await fetchArticleText(source.url);
    source.text_cache_status = result.status;
    source.text_cache_path = result.cache_path;
    if ((result.status === "read" || result.status === "cache_hit") && result.text) {
      source.read_status = "read";
      source.extracted_title = result.title;
      source.extracted_excerpt = result.excerpt || result.text.slice(0, 700);
      source.extracted_word_count = result.word_count;
      source.reliability_note = `Article text ${result.status === "cache_hit" ? "loaded from cache" : "fetched and cached"}; extracted ${result.word_count || 0} words for the research dossier.`;
    } else if (result.status === "failed") {
      source.reliability_note = `Article text fetch failed: ${result.error || "unknown error"}. Falling back to scan evidence.`;
    } else if (result.status === "cache_miss" || result.status === "disabled") {
      source.reliability_note = "Article text was not fetched in this mode. Falling back to scan evidence.";
    }
  }
}

export async function buildResearchedUnderstandingLayer({
  packet,
  profile,
  scanDate,
  selected,
  signals,
  bundles = [],
  generatedAt = new Date().toISOString(),
  maxClusters = 8,
}: BuildResearchedUnderstandingOptions): Promise<CompanyResearchedUnderstandingLayer> {
  const itemMap = packetItemById(packet);
  const totalSignalsAvailable = signals.length;
  const chosenBundles = bundles.slice(0, maxClusters);
  const defaultSectionId = packet.company.selected_scan_areas[0]?.area_id || "general";
  const fallbackSelected = selected.slice(0, Math.max(5, maxClusters));
  const selectedSignalIds = new Set(selected.map((item) => item.signal.id));
  const rawSignalSupplemental: SelectedSignalForDepth[] = signals
    .filter((signal) => !selectedSignalIds.has(signal.id))
    .slice(0, Math.max(0, maxClusters - fallbackSelected.length))
    .map((signal, index) => ({
      signal,
      item_id: `supplemental_${signal.id}`,
      cluster_id: `supplemental_${signal.id}`,
      section_ids: [defaultSectionId],
      selection_score: Math.max(1, Number(signal.significance || 0) + Number(signal.urgency || 0) - index),
      keyword_match_score: 0,
      selected_because: "supplemental research-depth cluster added so the dossier reaches the 5-8 researched-cluster target",
    }));
  const expandedFallbackSelected = [...fallbackSelected, ...rawSignalSupplemental];

  const bundledInputs = chosenBundles.map((bundle) => ({
    bundle,
    selected: selectedForBundle(bundle, selected),
  }));
  const usedAnchorItemIds = new Set(
    bundledInputs
      .map((input) => input.selected[0]?.item_id)
      .filter((itemId): itemId is string => Boolean(itemId)),
  );
  const supplementalInputs = expandedFallbackSelected
    .filter((item) => !usedAnchorItemIds.has(item.item_id))
    .map((item) => ({ bundle: undefined, selected: [item] }));
  const clusterInputs = [...bundledInputs, ...supplementalInputs];

  const clusters: ResearchCluster[] = [];
  const sources: ResearchSource[] = [];
  const notes: ResearchNote[] = [];
  const findings: AlbisFinding[] = [];
  const sourceDedupe = new Set<string>();
  const fetchBudget = { remaining: articleTextMaxFetches() };

  for (const [index, input] of clusterInputs.slice(0, maxClusters).entries()) {
    const anchorSelected = input.selected[0] || expandedFallbackSelected[index];
    if (!anchorSelected) continue;
    const anchorSignal = anchorSelected.signal;
    const packetItem = itemMap.get(anchorSelected.item_id);
    const clusterId = `research_${scanDate}_${profile.id}_${slugify(input.bundle?.heading || anchorSignal.headline)}`;
    const relatedSignals = input.selected.map((item) => item.signal).filter(Boolean);
    const clusterSources: ResearchSource[] = [];

    const packetSupports = packetItem ? supportFromItem(packetItem) : [];
    packetSupports.slice(0, 6).forEach((support, supportIndex) => {
      const role: ResearchSource["trail_role"] = supportIndex === 0 ? "email" : "evidence";
      const source = supportToSource(support, clusterId, role, 100 - supportIndex);
      const key = `${source.cluster_id}:${source.url || source.source_domain}:${source.id}`;
      if (sourceDedupe.has(key)) return;
      sourceDedupe.add(key);
      sources.push(source);
      clusterSources.push(source);
    });

    relatedSignals.slice(0, 20).forEach((signal, signalIndex) => {
      const role: ResearchSource["trail_role"] = signalIndex < 5 ? "evidence" : "research";
      const source = makeResearchSourceFromSignal(
        clusterId,
        signal,
        signalIndex,
        role,
        Math.max(0, 90 - signalIndex),
      );
      const key = `${source.cluster_id}:${source.url || source.source_domain}:${source.title}`;
      if (sourceDedupe.has(key)) return;
      sourceDedupe.add(key);
      sources.push(source);
      clusterSources.push(source);
    });

    await enrichSourcesWithArticleText(clusterSources, fetchBudget);

    const evidenceSources = clusterSources.filter((source) =>
      ["email", "evidence", "research"].includes(source.trail_role),
    );
    if (evidenceSources.length === 0) continue;

    const fullTextEvidence = clusterSources
      .map((source) => source.extracted_excerpt || "")
      .filter(Boolean)
      .join(" ");
    const allText = [
      relatedSignals.map((signal) => `${signal.headline}. ${signal.summary}`).join(" "),
      fullTextEvidence,
    ].join(" ");
    const keyFacts = uniq([
      ...(packetItem?.facts || []).map((fact) => fact.text),
      ...clusterSources
        .map((source) => source.extracted_excerpt)
        .filter(Boolean)
        .map((excerpt) => trimWords(excerpt || "", 32)),
      ...relatedSignals.map((signal) => trimWords(signal.summary || signal.headline, 28)),
    ])
      .filter(Boolean)
      .slice(0, 6);
    const cluster: ResearchCluster = {
      id: clusterId,
      date: scanDate,
      scope: "company",
      company_profile_id: profile.id,
      scan_area_ids: uniq([input.bundle?.section_id || "", ...(anchorSelected.section_ids || [])]),
      title: input.bundle?.heading || anchorSignal.headline,
      status: evidenceSources.length >= 2 ? "ready" : "weak",
      importance: importanceFor(index, relatedSignals.length),
      confidence: confidenceFor(
        evidenceSources.length,
        evidenceSources.every((source) => source.read_status === "snippet_only"),
      ),
      created_at: generatedAt,
      updated_at: generatedAt,
    };

    const sourceObservations = clusterSources
      .map((source) => observationFromSource(source))
      .filter((observation): observation is ResearchSourceObservation => Boolean(observation));
    const observations = [
      ...sourceObservations,
      ...relatedSignals
        .slice(0, 8)
        .map((signal, observationIndex) => observationForSignal(clusterId, signal, observationIndex)),
    ].slice(0, 12);
    const differences = reportingDifferences(clusterId, relatedSignals);
    const possibleGap = differences.length >= 2
      ? {
          strength: differences.length >= 3 ? "medium" as const : "weak" as const,
          gap: `${differences
            .slice(0, 3)
            .map((difference) => `${difference.label} emphasised ${trimWords(difference.description, 24)}`)
            .join("; ")}.`,
          why_it_matters: `For ${profile.company_name}, the split matters because the same development can look like a rights, safety, platform, diplomacy, or operating-access story depending on which source frame leads. A single-source read would miss that difference.`,
          evidence_source_ids: differences.flatMap((difference) => difference.source_ids).slice(0, 6),
        }
      : {
          strength: "none" as const,
          gap: "No concrete perception gap has been proven from the current source trail.",
          why_it_matters: "The finding can still be useful as news/context without pretending there is a gap.",
          evidence_source_ids: [],
        };

    const note: ResearchNote = {
      id: `${clusterId}_note`,
      cluster_id: clusterId,
      summary: trimWords(input.bundle?.body_text || anchorSignal.summary || anchorSignal.headline, 80),
      what_happened: trimWords(keyFacts[0] || anchorSignal.summary || anchorSignal.headline, 42),
      what_changed_today: trimWords(input.bundle?.what_is_changing?.[0]?.text || keyFacts[1] || anchorSignal.headline, 36),
      key_actors: extractActors(relatedSignals),
      key_facts: keyFacts,
      key_numbers: extractNumbers(allText),
      named_places: extractPlaces(relatedSignals),
      causes_or_drivers: uniq(relatedSignals.flatMap((signal) => signal.themes || [])).slice(0, 6),
      consequences: [
        trimWords(input.bundle?.company_read?.text || packetItem?.why_it_matters?.text || `This matters for ${profile.company_name} because it falls under the company's monitored topics and needs a researched read before customer delivery.`, 42),
      ],
      source_observations: observations,
      differences_in_reporting: differences,
      what_is_unclear: [
        evidenceSources.some((source) => source.read_status === "read")
          ? "Some sources were read/extracted, but further source expansion may still be needed before treating this as a complete 10-20 source dossier."
          : "The research trail is preserved, but article-text reading/extraction did not complete for this cluster; treat as lower confidence.",
      ],
      possible_perception_gap: possibleGap,
      company_relevance: trimWords(input.bundle?.company_read?.text || packetItem?.why_it_matters?.text || "Relevant to the company’s monitored topics because it appeared in the retained company evidence.", 48),
      albis_learning: "This cluster is stored as researched understanding first, so Daily Findings, PGI, dashboard, and article writers can draw from the same evidence trail instead of writing from headlines alone.",
    };

    const finding: AlbisFinding = {
      id: `${clusterId}_finding`,
      cluster_id: clusterId,
      date: scanDate,
      scope: "company",
      company_profile_id: profile.id,
      title: polishV1Title(cluster.title),
      body: buildFindingBody(note, evidenceSources),
      why_it_matters: note.consequences[0],
      uncertainty: note.what_is_unclear[0],
      confidence: cluster.confidence,
      email_source_ids: evidenceSources.filter((source) => source.trail_role === "email").map((source) => source.id).slice(0, 5),
      evidence_source_ids: evidenceSources.map((source) => source.id).slice(0, 10),
      dashboard_source_ids: clusterSources.map((source) => source.id).slice(0, 20),
      placement: index < 7 ? "email_main" : index < 12 ? "email_secondary" : "dashboard",
    };

    clusters.push(cluster);
    notes.push(note);
    findings.push(finding);
  }

  const blockers: string[] = [];
  const warnings: string[] = [];
  if (clusters.length < 5) warnings.push("fewer_than_five_researched_clusters");
  if (totalSignalsAvailable > 0 && clusters.length < Math.min(5, totalSignalsAvailable)) {
    warnings.push("selected_clusters_below_available_signal_depth");
  }
  if (findings.some((finding) => finding.evidence_source_ids.length === 0)) blockers.push("finding_without_evidence_trail");
  if (sources.every((source) => source.read_status === "snippet_only")) {
    warnings.push("snippet_only_research_v1_full_text_extraction_pending");
  }

  return {
    layer_version: "researched_understanding_v1",
    generated_at: generatedAt,
    build_doc: "memory/researched-understanding-layer-build-plan.md",
    company_profile_id: profile.id,
    company_name: profile.company_name,
    scan_date: scanDate,
    target_cluster_count: { min: 5, max: 8 },
    research_standard: {
      principle: "external_articles_are_evidence_albis_findings_are_the_product",
      no_shallow_reporting_dressed_as_insight: true,
      source_trail_integrity: true,
    },
    clusters,
    sources,
    notes,
    findings,
    source_trail_summary: {
      research_sources: sources.filter((source) => source.trail_role === "research").length,
      evidence_sources: sources.filter((source) => source.trail_role === "evidence").length,
      email_sources: sources.filter((source) => source.trail_role === "email").length,
      snippet_only_sources: sources.filter((source) => source.read_status === "snippet_only").length,
      full_text_sources: sources.filter((source) => source.read_status === "read").length,
    },
    qa: {
      ready_for_customer_review: blockers.length === 0,
      blockers,
      warnings,
    },
  };
}
