#!/usr/bin/env tsx
// @ts-nocheck
import {
  loadBothTrackers,
  buildResearchLogEntry,
  appendLogEntry,
  getDateArg,
  hasFlag,
  saveJsonReport,
  planDailySend,
} from './outreach-lib';

function main() {
  const date = getDateArg();
  const { current, archive } = loadBothTrackers();
  const dailyPlan = planDailySend(current, archive, date);

  const payload = {
    date,
    mode: 'structured-intake-capacity-audit',
    rawPending: dailyPlan.rawPendingByBucket,
    qualityEligible: dailyPlan.eligibleByBucket,
    bucketShortagesToTarget: dailyPlan.bucketShortagesToTarget,
    overflowAvailableBeyondTarget: {
      'uk-eu': Math.max(0, dailyPlan.eligibleByBucket['uk-eu'] - dailyPlan.targetPerBucket),
      'us-east': Math.max(0, dailyPlan.eligibleByBucket['us-east'] - dailyPlan.targetPerBucket),
      'us-west-global': Math.max(0, dailyPlan.eligibleByBucket['us-west-global'] - dailyPlan.targetPerBucket),
    },
    selectedAtCurrentPolicy: {
      total: dailyPlan.totals.selected,
      byBucket: {
        'uk-eu': dailyPlan.selectedByBucket['uk-eu'].length,
        'us-east': dailyPlan.selectedByBucket['us-east'].length,
        'us-west-global': dailyPlan.selectedByBucket['us-west-global'].length,
      },
    },
    floor: dailyPlan.targetFloor,
    ceiling: dailyPlan.targetCeiling,
    floorMet: dailyPlan.totals.metFloor,
    ceilingHit: dailyPlan.totals.hitCeiling,
    shortageToFloor: dailyPlan.totals.shortageToFloor,
    headroomToCeiling: dailyPlan.totals.headroomToCeiling,
    validationRejected: dailyPlan.rejected.map(({ contact, validation, bucket }) => ({
      email: contact.email,
      name: contact.name,
      bucket,
      reasonCodes: validation.reasonCodes,
      reasons: validation.reasons,
      warnings: validation.warnings,
    })),
    note: 'Automation only measures real tracker capacity and quality-qualified contacts. It does not fabricate research or lower standards to hit volume.',
  };

  const reportFile = saveJsonReport('outreach-research', date, payload);
  if (!hasFlag('--no-log')) {
    appendLogEntry(buildResearchLogEntry(date, dailyPlan));
  }

  console.log(JSON.stringify({ ok: true, reportFile, ...payload }, null, 2));
}

main();
