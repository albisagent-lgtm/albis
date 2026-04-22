#!/usr/bin/env tsx
// @ts-nocheck
import {
  loadBothTrackers,
  getEligiblePendingForBucket,
  BUCKETS,
  Bucket,
  getDateArg,
  readFlag,
  hasFlag,
  sendEmails,
  appendLogEntry,
  buildSendLogEntry,
  buildBatchLabel,
  saveJsonReport,
  planDailySend,
  DAILY_FLOOR,
  DAILY_CEILING,
  DEFAULT_BUCKET_TARGET,
  classifySendFailure,
  writeTracker,
} from './outreach-lib';

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function main() {
  const date = getDateArg();
  const bucketFlag = (readFlag('--bucket') || '').trim() as Bucket;
  const dryRun = hasFlag('--dry-run');
  const noLog = hasFlag('--no-log');

  const { current, archive } = loadBothTrackers();

  if (bucketFlag) {
    if (!(bucketFlag in BUCKETS)) fail('Missing or invalid --bucket (uk-eu | us-east | us-west-global)');
    const quota = Number(readFlag('--quota') || BUCKETS[bucketFlag].quota);
    const eligible = getEligiblePendingForBucket(current, archive, bucketFlag);
    const selected = eligible.slice(0, quota);
    const sendResults = await sendEmails(selected, dryRun);
    const resultByEmail = new Map(sendResults.map((row) => [row.email.toLowerCase(), row]));
    const sentContacts = [] as typeof selected;

    for (const contact of current.contacts) {
      if (contact.group !== 'pending') continue;
      const result = resultByEmail.get(contact.email.toLowerCase());
      if (!result) continue;

      contact.attempts = Number(contact.attempts || 0) + 1;
      contact.lastAttemptAt = new Date().toISOString();

      if (result.ok) {
        contact.group = 'sent';
        contact.status = 'sent';
        contact.dateSent = date;
        contact.response = contact.response && contact.response !== 'Pending' ? contact.response : 'Pending';
        contact.batchLabel = buildBatchLabel(bucketFlag, date);
        contact.lastError = '';
        contact.failureReason = '';
        sentContacts.push({ ...contact });
      } else {
        contact.lastError = result.error || '';
        const failure = classifySendFailure(result.error || '');
        contact.failureReason = failure.reason;
        if (failure.hard) {
          contact.group = 'do-not-contact';
          contact.status = 'blocked';
          contact.response = 'Hard bounce';
        } else if (contact.attempts >= 3) {
          contact.group = 'do-not-contact';
          contact.status = 'blocked';
          contact.response = 'Max attempts exceeded';
          contact.failureReason = 'max_attempts_exceeded';
        }
      }
    }

    if (!dryRun) {
      writeTracker(current, archive);
    }

    const report = {
      date,
      mode: 'bucket',
      bucket: bucketFlag,
      quota,
      dryRun,
      attempted: selected.map((row) => ({ email: row.email, name: row.name, segment: row.segment, region: row.region })),
      results: sendResults,
      sentCount: sentContacts.length,
      failureCount: sendResults.filter((row) => !row.ok).length,
      shortage: Math.max(0, quota - selected.length),
    };
    const reportFile = saveJsonReport(`outreach-send-${bucketFlag}`, date, report);
    console.log(JSON.stringify({ ok: true, reportFile, ...report }, null, 2));
    return;
  }

  const floor = Number(readFlag('--floor') || DAILY_FLOOR);
  const ceiling = Number(readFlag('--ceiling') || DAILY_CEILING);
  const perBucketTarget = Number(readFlag('--target-per-bucket') || DEFAULT_BUCKET_TARGET);
  const dailyPlan = planDailySend(current, archive, date, { floor, ceiling, perBucketTarget });
  const sendResults = await sendEmails(dailyPlan.selected, dryRun);
  const resultByEmail = new Map(sendResults.map((row) => [row.email.toLowerCase(), row]));
  const sentContacts = [] as typeof dailyPlan.selected;

  for (const contact of current.contacts) {
    if (contact.group !== 'pending') continue;
    const result = resultByEmail.get(contact.email.toLowerCase());
    if (!result) continue;

    contact.attempts = Number(contact.attempts || 0) + 1;
    contact.lastAttemptAt = new Date().toISOString();

    if (result.ok) {
      contact.group = 'sent';
      contact.status = 'sent';
      contact.dateSent = date;
      contact.response = contact.response && contact.response !== 'Pending' ? contact.response : 'Pending';
      contact.batchLabel = `Outreach Auto Daily — ${date}`;
      contact.lastError = '';
      contact.failureReason = '';
      sentContacts.push({ ...contact });
      continue;
    }

    contact.lastError = result.error || '';
    const failure = classifySendFailure(result.error || '');
    contact.failureReason = failure.reason;
    if (failure.hard) {
      contact.group = 'do-not-contact';
      contact.status = 'blocked';
      contact.response = 'Hard bounce';
    } else if (contact.attempts >= 3) {
      contact.group = 'do-not-contact';
      contact.status = 'blocked';
      contact.response = 'Max attempts exceeded';
      contact.failureReason = 'max_attempts_exceeded';
    }
  }

  if (!dryRun) {
    writeTracker(current, archive);
  }

  const report = {
    date,
    mode: 'daily-auto',
    dryRun,
    plan: dailyPlan,
    results: sendResults,
    sentCount: sentContacts.length,
    failureCount: sendResults.filter((row) => !row.ok).length,
    failureStates: current.contacts
      .filter((c) => c.group !== 'sent' && Number(c.attempts || 0) >= 1)
      .map((c) => ({
        email: c.email,
        attempts: c.attempts,
        lastAttemptAt: c.lastAttemptAt,
        lastError: c.lastError,
        failureReason: c.failureReason,
        group: c.group,
        response: c.response,
      })),
    validationRejected: dailyPlan.rejected.map(({ contact, validation, bucket }) => ({
      email: contact.email,
      name: contact.name,
      bucket,
      reasonCodes: validation.reasonCodes,
      reasons: validation.reasons,
      warnings: validation.warnings,
    })),
  };
  const reportFile = saveJsonReport('outreach-send', date, report);

  if (!noLog) {
    appendLogEntry(buildSendLogEntry(date, dailyPlan, sentContacts, sendResults));
  }

  console.log(JSON.stringify({ ok: true, reportFile, ...report }, null, 2));
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
