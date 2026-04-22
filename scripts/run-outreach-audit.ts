#!/usr/bin/env tsx
// @ts-nocheck
import {
  loadBothTrackers,
  appendLogEntry,
  buildAuditLogEntry,
  getDateArg,
  hasFlag,
  saveJsonReport,
  planDailySend,
} from './outreach-lib';

function main() {
  const date = getDateArg();
  const { current, archive } = loadBothTrackers();
  const dailyPlan = planDailySend(current, archive, date);

  const duplicatesInPending = new Map<string, number>();
  for (const contact of current.contacts) {
    if (contact.group !== 'pending') continue;
    const email = contact.email.toLowerCase();
    duplicatesInPending.set(email, (duplicatesInPending.get(email) || 0) + 1);
  }

  const duplicatePendingEmails = [...duplicatesInPending.entries()].filter(([, count]) => count > 1).map(([email, count]) => ({ email, count }));
  const attemptedRows = current.contacts.filter((c) => Number(c.attempts || 0) >= 1);
  const quarantinedMaxAttempts = current.contacts.filter((c) => c.failureReason === 'max_attempts_exceeded');
  const hardBounces = current.contacts.filter((c) => c.failureReason === 'hard_bounce');
  const last10FailureReasons = current.contacts
    .filter((c) => c.lastError || c.failureReason)
    .sort((a, b) => String(b.lastAttemptAt || '').localeCompare(String(a.lastAttemptAt || '')))
    .slice(0, 10)
    .map((c) => ({
      email: c.email,
      attempts: c.attempts,
      lastAttemptAt: c.lastAttemptAt,
      failureReason: c.failureReason,
      lastError: c.lastError,
    }));

  const payload = {
    date,
    pending: {
      raw: dailyPlan.rawPendingByBucket,
      qualityEligible: dailyPlan.eligibleByBucket,
    },
    bucketShortagesToTarget: dailyPlan.bucketShortagesToTarget,
    overflowUsedToReachPlan: dailyPlan.overflowUsedByBucket,
    dailyPlan,
    currentRows: current.contacts.length,
    archiveRows: archive.contacts.length,
    attemptedRowsCount: attemptedRows.length,
    quarantinedMaxAttemptsCount: quarantinedMaxAttempts.length,
    hardBouncesCount: hardBounces.length,
    last10FailureReasons,
    duplicatePendingEmails,
    validationRejected: dailyPlan.rejected.map(({ contact, validation, bucket }) => ({
      email: contact.email,
      name: contact.name,
      bucket,
      reasonCodes: validation.reasonCodes,
      reasons: validation.reasons,
      warnings: validation.warnings,
    })),
    note: 'Audit is deterministic and file-based. It reports capacity, quality gating, obvious tracker hygiene issues, and failure-state counts.',
  };

  const reportFile = saveJsonReport('outreach-audit', date, payload);
  if (!hasFlag('--no-log')) {
    appendLogEntry(buildAuditLogEntry(date, payload));
  }

  console.log(JSON.stringify({ ok: true, reportFile, ...payload }, null, 2));
}

main();
