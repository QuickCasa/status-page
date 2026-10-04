import { HISTORY_DAYS, MILLISECONDS_PER_DAY } from '../shared/constants.ts'
import { toDayKey } from '../shared/to-day-key.ts'
import type { TargetRecord } from '../shared/types.ts'
import type { DaySummary, TargetSummary } from './types.ts'

/**
 * Turns a target's daily buckets into the 90 day bar the page draws, oldest
 * day first and today last, plus the uptime over the whole bar. Days with no
 * checks stay on the bar as gaps, so every bar is the same width and a gap
 * reads as a gap.
 *
 * @param {TargetRecord} record The target.
 * @param {number} now The current time.
 * @returns {TargetSummary} The bar and totals.
 */
function summariseTarget(record: TargetRecord, now: number): TargetSummary {
  const days: DaySummary[] = []
  let totalChecks = 0
  let totalFailures = 0
  let latencyCeilingMilliseconds = 0

  for (let offset = HISTORY_DAYS - 1; offset >= 0; offset -= 1) {
    const key = toDayKey(now - offset * MILLISECONDS_PER_DAY)
    const bucket = record.days[key]

    if (!bucket || bucket.checks === 0) {
      days.push({
        key,
        checks: 0,
        failures: 0,
        uptimePercent: 0,
        latencyAverageMilliseconds: 0,
        latencyMaxMilliseconds: 0,
      })
      continue
    }

    const failures = Math.min(bucket.failures, bucket.checks)
    const latencyAverageMilliseconds = Math.round(
      bucket.latencyTotalMilliseconds / bucket.checks,
    )

    totalChecks += bucket.checks
    totalFailures += failures
    latencyCeilingMilliseconds = Math.max(
      latencyCeilingMilliseconds,
      latencyAverageMilliseconds,
    )
    days.push({
      key,
      checks: bucket.checks,
      failures,
      uptimePercent: ((bucket.checks - failures) / bucket.checks) * 100,
      latencyAverageMilliseconds,
      latencyMaxMilliseconds: bucket.latencyMaxMilliseconds,
    })
  }

  return {
    record,
    uptimePercent:
      totalChecks === 0
        ? 100
        : ((totalChecks - totalFailures) / totalChecks) * 100,
    days,
    latencyCeilingMilliseconds,
  }
}

export { summariseTarget }
