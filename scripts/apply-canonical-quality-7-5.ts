#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Package 7.5 — Canonical Quality apply/audit tool.
//
// Default mode is --dry-run. Use --apply for DB writes.
// Safe/idempotent operations:
//   - upsert curated canonicals + aliases
//   - fold orphan canonicals into parent canonicals, moving mappings first
//   - deactivate folded orphan topics
//   - dedupe selected profile arrays
//   - emit a canonical health report for before/after QA
// ---------------------------------------------------------------------------
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../src/lib/supabase/admin";
import {
  PACKAGE_7_5_CANONICAL_FOLDS,
  PACKAGE_7_5_CANONICAL_UPSERTS,
  PACKAGE_7_5_PROFILE_DEDUPES,
  type CanonicalAliasSpec,
  type CanonicalUpsertSpec,
} from "../src/lib/company-scan/canonical-quality-package-7-5";
import type { CanonicalTopicType } from "../src/lib/canonical-resolver";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

type Db = SupabaseClient;

type TopicRow = {
  id: string;
  canonical_label: string;
  topic_type: CanonicalTopicType;
  is_active: boolean;
  active_company_count: number | null;
};

type AliasRow = {
  canonical_topic_id: string;
  alias: string;
  alias_language: string | null;
};

type ProfileRow = {
  id: string;
  company_name: string;
  tracked_themes: string[] | null;
  watchlist_entities: string[] | null;
  regions: string[] | null;
  risk_priorities: string[] | null;
  supply_chain_exposure: string[] | null;
  sector: string | null;
  sub_sector: string | null;
};

const dryRun = !process.argv.includes("--apply");
const jsonOnly = process.argv.includes("--json");

function log(message: string) {
  if (!jsonOnly) console.log(message);
}

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function norm(value: string) {
  return value.trim().toLowerCase();
}

function dedupeArray(values: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of Array.isArray(values) ? values : []) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

async function findCanonical(
  supabase: Db,
  label: string,
  topicType?: CanonicalTopicType,
  activeOnly = false
): Promise<TopicRow | null> {
  let query = supabase
    .from("canonical_topics")
    .select("id, canonical_label, topic_type, is_active, active_company_count")
    .ilike("canonical_label", label);
  if (topicType) query = query.eq("topic_type", topicType);
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query.limit(5);
  if (error) throw new Error(error.message);
  const rows = (data || []) as TopicRow[];
  return rows[0] || null;
}

async function findOrCreateCanonical(
  supabase: Db,
  spec: CanonicalUpsertSpec
): Promise<{ topic: TopicRow | null; created: boolean; wouldCreate: boolean }> {
  const existing = await findCanonical(supabase, spec.canonical_label, spec.topic_type);
  const parent = spec.parent_label && spec.parent_type
    ? await findCanonical(supabase, spec.parent_label, spec.parent_type, true)
    : null;

  if (existing) {
    if (!dryRun && (!existing.is_active || spec.short_description || parent?.id)) {
      const patch: Record<string, unknown> = { is_active: true };
      if (spec.short_description) patch.short_description = spec.short_description;
      if (parent?.id) patch.parent_id = parent.id;
      const { error } = await supabase.from("canonical_topics").update(patch).eq("id", existing.id);
      if (error) throw new Error(error.message);
    }
    return { topic: { ...existing, is_active: true }, created: false, wouldCreate: false };
  }

  if (dryRun) return { topic: null, created: false, wouldCreate: true };

  const { data, error } = await supabase
    .from("canonical_topics")
    .insert({
      canonical_label: spec.canonical_label,
      topic_type: spec.topic_type,
      short_description: spec.short_description ?? null,
      parent_id: parent?.id ?? null,
      is_active: true,
    })
    .select("id, canonical_label, topic_type, is_active, active_company_count")
    .single();
  if (error || !data) throw new Error(error?.message || `failed to create ${spec.canonical_label}`);
  return { topic: data as TopicRow, created: true, wouldCreate: false };
}

async function aliasExists(supabase: Db, canonicalId: string, alias: string, language?: string | null) {
  const { data, error } = await supabase
    .from("canonical_topic_aliases")
    .select("id, alias_language")
    .eq("canonical_topic_id", canonicalId)
    .ilike("alias", alias);
  if (error) throw new Error(error.message);
  return (data || []).some(
    (r: { alias_language: string | null }) => (r.alias_language || null) === (language || null)
  );
}

async function insertAlias(
  supabase: Db,
  canonicalId: string,
  alias: CanonicalAliasSpec
): Promise<"inserted" | "exists" | "would_insert"> {
  const language = alias.language ?? null;
  if (await aliasExists(supabase, canonicalId, alias.alias, language)) return "exists";
  if (dryRun) return "would_insert";
  const { error } = await supabase.from("canonical_topic_aliases").insert({
    canonical_topic_id: canonicalId,
    alias: alias.alias.trim(),
    alias_language: language,
    alias_type: alias.type ?? "synonym",
    confidence: alias.confidence ?? 1,
  });
  if (!error) return "inserted";
  if (error.code === "23505" || /duplicate key/i.test(error.message)) return "exists";
  throw new Error(error.message);
}

async function upsertCanonicalPack(supabase: Db) {
  const summary = {
    canonicals_created: 0,
    canonicals_existing: 0,
    canonicals_would_create: 0,
    aliases_inserted: 0,
    aliases_existing: 0,
    aliases_would_insert: 0,
    missing_for_dry_run: [] as string[],
  };

  for (const spec of PACKAGE_7_5_CANONICAL_UPSERTS) {
    const result = await findOrCreateCanonical(supabase, spec);
    if (result.created) summary.canonicals_created += 1;
    else if (result.wouldCreate) summary.canonicals_would_create += 1;
    else summary.canonicals_existing += 1;

    if (!result.topic) {
      summary.missing_for_dry_run.push(`${spec.canonical_label} (${spec.topic_type})`);
      continue;
    }

    for (const alias of spec.aliases) {
      const status = await insertAlias(supabase, result.topic.id, alias);
      if (status === "inserted") summary.aliases_inserted += 1;
      else if (status === "would_insert") summary.aliases_would_insert += 1;
      else summary.aliases_existing += 1;
    }
  }
  return summary;
}

async function moveMappings(supabase: Db, fromId: string, toId: string) {
  const { data: mappings, error } = await supabase
    .from("company_canonical_mappings")
    .select("company_profile_id, source_field, source_value")
    .eq("canonical_topic_id", fromId);
  if (error) throw new Error(error.message);
  const rows = (mappings || []) as Array<{ company_profile_id: string; source_field: string; source_value: string }>;
  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    if (!dryRun) {
      const { error: insertErr } = await supabase.from("company_canonical_mappings").insert({
        company_profile_id: row.company_profile_id,
        canonical_topic_id: toId,
        source_field: row.source_field,
        source_value: row.source_value,
      });
      if (!insertErr) inserted += 1;
      else if (insertErr.code === "23505" || /duplicate key/i.test(insertErr.message)) skipped += 1;
      else throw new Error(insertErr.message);
    } else {
      inserted += 1;
    }
  }
  if (!dryRun && rows.length > 0) {
    const { error: deleteErr } = await supabase
      .from("company_canonical_mappings")
      .delete()
      .eq("canonical_topic_id", fromId);
    if (deleteErr) throw new Error(deleteErr.message);
  }
  return { found: rows.length, inserted, skipped };
}

async function foldOrphans(supabase: Db) {
  const summary = {
    folds_configured: PACKAGE_7_5_CANONICAL_FOLDS.length,
    source_found: 0,
    source_missing: 0,
    source_would_deactivate: 0,
    source_deactivated: 0,
    mappings_found: 0,
    mappings_moved_or_would_move: 0,
    aliases_inserted: 0,
    aliases_existing: 0,
    aliases_would_insert: 0,
    details: [] as Array<Record<string, unknown>>,
  };

  for (const fold of PACKAGE_7_5_CANONICAL_FOLDS) {
    const target = await findCanonical(supabase, fold.to_label, fold.to_type, true);
    if (!target) {
      summary.details.push({ fold: fold.from_label, status: "target_missing", target: fold.to_label });
      continue;
    }

    const aliasStatus = await insertAlias(supabase, target.id, {
      alias: fold.from_label,
      language: fold.alias_language ?? "en",
      type: fold.alias_type ?? "synonym",
      confidence: fold.confidence ?? 0.8,
    });
    if (aliasStatus === "inserted") summary.aliases_inserted += 1;
    else if (aliasStatus === "would_insert") summary.aliases_would_insert += 1;
    else summary.aliases_existing += 1;

    const source = await findCanonical(supabase, fold.from_label, fold.from_type);
    if (!source) {
      summary.source_missing += 1;
      summary.details.push({ fold: fold.from_label, target: fold.to_label, status: "source_missing_alias_added", reason: fold.reason });
      continue;
    }

    summary.source_found += 1;
    const moved = await moveMappings(supabase, source.id, target.id);
    summary.mappings_found += moved.found;
    summary.mappings_moved_or_would_move += moved.inserted;

    if (source.is_active) {
      if (dryRun) {
        summary.source_would_deactivate += 1;
      } else {
        const { error } = await supabase
          .from("canonical_topics")
          .update({ is_active: false, parent_id: target.id })
          .eq("id", source.id);
        if (error) throw new Error(error.message);
        summary.source_deactivated += 1;
      }
    }
    summary.details.push({
      fold: fold.from_label,
      target: fold.to_label,
      status: dryRun ? "would_fold" : "folded",
      mappings: moved,
      reason: fold.reason,
    });
  }

  return summary;
}

async function dedupeProfiles(supabase: Db) {
  const summary = {
    profiles_checked: 0,
    profiles_changed_or_would_change: 0,
    changes: [] as Array<Record<string, unknown>>,
  };

  for (const spec of PACKAGE_7_5_PROFILE_DEDUPES) {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("id, company_name, tracked_themes, watchlist_entities, regions, risk_priorities, supply_chain_exposure, sector, sub_sector")
      .ilike("company_name", spec.company_name)
      .limit(5);
    if (error) throw new Error(error.message);
    for (const profile of (data || []) as ProfileRow[]) {
      summary.profiles_checked += 1;
      const patch: Record<string, string[]> = {};
      const beforeAfter: Record<string, { before: string[]; after: string[] }> = {};
      for (const field of spec.array_fields) {
        const before = Array.isArray(profile[field]) ? profile[field] as string[] : [];
        const after = dedupeArray(before);
        if (before.length !== after.length || before.join("\u0000") !== after.join("\u0000")) {
          patch[field] = after;
          beforeAfter[field] = { before, after };
        }
      }
      if (Object.keys(patch).length === 0) continue;
      summary.profiles_changed_or_would_change += 1;
      summary.changes.push({ company_name: profile.company_name, id: profile.id, fields: beforeAfter, reason: spec.reason });
      if (!dryRun) {
        const { error: updateErr } = await supabase.from("company_profiles").update(patch).eq("id", profile.id);
        if (updateErr) throw new Error(updateErr.message);
      }
    }
  }

  return summary;
}

async function healthReport(supabase: Db) {
  const [{ data: topics, error: topicsErr }, { data: aliases, error: aliasesErr }, { data: profiles, error: profilesErr }] = await Promise.all([
    supabase
      .from("canonical_topics")
      .select("id, canonical_label, topic_type, is_active, active_company_count")
      .order("active_company_count", { ascending: false }),
    supabase.from("canonical_topic_aliases").select("canonical_topic_id, alias, alias_language"),
    supabase
      .from("company_profiles")
      .select("id, company_name, tracked_themes, watchlist_entities, regions, risk_priorities, supply_chain_exposure, sector, sub_sector")
      .eq("onboarding_completed", true),
  ]);
  if (topicsErr) throw new Error(topicsErr.message);
  if (aliasesErr) throw new Error(aliasesErr.message);
  if (profilesErr) throw new Error(profilesErr.message);

  const topicRows = (topics || []) as TopicRow[];
  const aliasRows = (aliases || []) as AliasRow[];
  const aliasesById = new Map<string, AliasRow[]>();
  for (const alias of aliasRows) {
    const list = aliasesById.get(alias.canonical_topic_id) || [];
    list.push(alias);
    aliasesById.set(alias.canonical_topic_id, list);
  }

  const activeTopics = topicRows.filter((t) => t.is_active);
  const activeWithAliases = activeTopics.filter((t) => (aliasesById.get(t.id) || []).length > 0);
  const activeThin = activeTopics
    .map((t) => ({
      canonical_label: t.canonical_label,
      topic_type: t.topic_type,
      active_company_count: t.active_company_count || 0,
      alias_count: (aliasesById.get(t.id) || []).length,
      languages: [...new Set((aliasesById.get(t.id) || []).map((a) => a.alias_language).filter(Boolean))],
    }))
    .filter((t) => t.alias_count <= 1 || (t.active_company_count > 0 && t.alias_count < 3))
    .sort((a, b) => (b.active_company_count - a.active_company_count) || (a.alias_count - b.alias_count));

  const languageCoverageTargets = [
    "India",
    "Saudi Arabia",
    "Strait of Hormuz",
    "Suez Canal",
    "Red Sea",
    "Shipping disruption",
    "Press freedom",
    "Media regulation",
    "North Korea",
    "China",
  ];
  const targetCoverage = languageCoverageTargets.map((label) => {
    const topic = activeTopics.find((t) => norm(t.canonical_label) === norm(label));
    const list = topic ? aliasesById.get(topic.id) || [] : [];
    return {
      canonical_label: label,
      exists: Boolean(topic),
      alias_count: list.length,
      languages: [...new Set(list.map((a) => a.alias_language).filter(Boolean))].sort(),
    };
  });

  return {
    canonical_topics_total: topicRows.length,
    canonical_topics_active: activeTopics.length,
    aliases_total: aliasRows.length,
    active_topics_with_aliases: activeWithAliases.length,
    active_alias_coverage_pct: activeTopics.length ? Math.round((activeWithAliases.length / activeTopics.length) * 1000) / 10 : 0,
    thin_active_topics_top_30: activeThin.slice(0, 30),
    target_coverage: targetCoverage,
    onboarding_profiles_checked: ((profiles || []) as ProfileRow[]).map((p) => ({
      company_name: p.company_name,
      tracked_themes: p.tracked_themes?.length || 0,
      watchlist_entities: p.watchlist_entities?.length || 0,
      supply_chain_exposure: p.supply_chain_exposure?.length || 0,
      sector: p.sector,
    })),
  };
}

async function main() {
  const supabase = createAdminClient();
  log(`🚀 Package 7.5 canonical quality ${dryRun ? "dry-run" : "APPLY"}`);

  const before = await healthReport(supabase);
  if (!dryRun) {
    const backupDir = path.resolve(process.cwd(), "reports/canonical-quality");
    fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(
      backupDir,
      `package-7-5-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    );
    fs.writeFileSync(
      backupPath,
      JSON.stringify(
        {
          created_at: new Date().toISOString(),
          purpose: "Pre-apply backup for Package 7.5 canonical quality migration",
          folds: PACKAGE_7_5_CANONICAL_FOLDS,
          profile_dedupes: PACKAGE_7_5_PROFILE_DEDUPES,
          health_before: before,
        },
        null,
        2
      )
    );
    log(`🧾 Wrote pre-apply backup: ${backupPath}`);
  }

  const upserts = await upsertCanonicalPack(supabase);
  const folds = await foldOrphans(supabase);
  const profileDedupe = await dedupeProfiles(supabase);
  const after = await healthReport(supabase);

  const result = {
    mode: dryRun ? "dry-run" : "apply",
    upserts,
    folds,
    profileDedupe,
    before,
    after,
  };

  console.log(JSON.stringify(result, null, 2));
  if (dryRun) {
    log("\nDry-run only. Re-run with --apply to write canonical/profile changes.");
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
