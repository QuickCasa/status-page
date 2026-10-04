import {
  HISTORY_DAYS,
  MAX_INCIDENTS,
  MILLISECONDS_PER_DAY,
} from '../shared/constants.ts'
import { toDayKey } from '../shared/to-day-key.ts'
import type {
  CheckResult,
  Incident,
  StatusConfig,
  StatusDocument,
  TargetConfig,
  TargetRecord,
} from '../shared/types.ts'

/**
 * Makes a record for a target that has never been checked.
 *
 * @param {TargetConfig} target The target.
 * @returns {TargetRecord} The empty record.
 */
function createRecord(target: TargetConfig): TargetRecord {
  return {
    id: target.id,
    label: target.label,
    group: target.group,
    status: 'operational',
    lastCheckedAt: 0,
    lastLatencyMilliseconds: 0,
    lastStatusCode: 0,
    lastError: '',
    consecutiveFailures: 0,
    days: {},
  }
}

/**
 * Adds one check to a target's record: its latest state, today's bucket, and
 * only the days still inside the history window.
 *
 * @param {TargetRecord} previous The record so far.
 * @param {TargetConfig} target The target, for its current label and group.
 * @param {CheckResult} result The check.
 * @param {number} now When the check ran.
 * @returns {TargetRecord} The updated record.
 */
function recordCheck(
  previous: TargetRecord,
  target: TargetConfig,
  result: CheckResult,
  now: number,
): TargetRecord {
  const today = toDayKey(now)
  const oldestKept = toDayKey(now - (HISTORY_DAYS - 1) * MILLISECONDS_PER_DAY)
  const bucket = previous.days[today] ?? {
    checks: 0,
    failures: 0,
    latencyTotalMilliseconds: 0,
    latencyMaxMilliseconds: 0,
  }
  const days = Object.fromEntries(
    Object.entries(previous.days).filter(([key]) => key >= oldestKept),
  )

  days[today] = {
    checks: bucket.checks + 1,
    failures: bucket.failures + (result.up ? 0 : 1),
    latencyTotalMilliseconds:
      bucket.latencyTotalMilliseconds + result.latencyMilliseconds,
    latencyMaxMilliseconds: Math.max(
      bucket.latencyMaxMilliseconds,
      result.latencyMilliseconds,
    ),
  }

  let status: TargetRecord['status'] = 'operational'

  if (!result.up) {
    status = 'down'
  } else if (result.slow) {
    status = 'degraded'
  }

  return {
    id: target.id,
    label: target.label,
    group: target.group,
    status,
    lastCheckedAt: now,
    lastLatencyMilliseconds: result.latencyMilliseconds,
    lastStatusCode: result.statusCode,
    lastError: result.error,
    consecutiveFailures: result.up ? 0 : previous.consecutiveFailures + 1,
    days,
  }
}

/**
 * Opens an incident when a target goes down, closes it when the target comes
 * back, and closes the incidents of targets that were removed from the
 * config. Old closed incidents are dropped.
 *
 * @param {readonly Incident[]} previous The incidents so far.
 * @param {readonly TargetConfig[]} targets The configured targets.
 * @param {readonly CheckResult[]} results This run's checks.
 * @param {number} now When the checks ran.
 * @returns {Incident[]} The updated incidents, newest first.
 */
function updateIncidents(
  previous: readonly Incident[],
  targets: readonly TargetConfig[],
  results: readonly CheckResult[],
  now: number,
): Incident[] {
  const configured = new Set(targets.map(target => target.id))
  const oldestKept = now - HISTORY_DAYS * MILLISECONDS_PER_DAY
  const incidents = previous.map(incident => {
    const open = incident.endedAt === 0
    const result = results.find(entry => entry.targetId === incident.targetId)
    const recovered = result?.up === true
    const removed = !configured.has(incident.targetId)

    return open && (recovered || removed)
      ? { ...incident, endedAt: now }
      : incident
  })

  for (const result of results) {
    const target = targets.find(entry => entry.id === result.targetId)
    const alreadyOpen = incidents.some(
      incident =>
        incident.targetId === result.targetId && incident.endedAt === 0,
    )

    if (result.up || !target || alreadyOpen) {
      continue
    }

    incidents.push({
      id: `${target.id}-${String(now)}`,
      targetId: target.id,
      targetLabel: target.label,
      startedAt: now,
      endedAt: 0,
      statusCode: result.statusCode,
      error: result.error,
    })
  }

  return incidents
    .filter(
      incident => incident.endedAt === 0 || incident.endedAt >= oldestKept,
    )
    .toSorted((first, second) => second.startedAt - first.startedAt)
    .slice(0, MAX_INCIDENTS)
}

/**
 * Folds one run of checks into the status document. Targets removed from the
 * config drop off the page, and new ones start with an empty history. The
 * document never holds a target's URL.
 *
 * @param {StatusDocument | undefined} previous The published document, or undefined on the first run.
 * @param {StatusConfig} config The config.
 * @param {readonly CheckResult[]} results This run's checks.
 * @param {number} now When the checks ran.
 * @param {string} checkedFrom Where the checks ran from, such as "GitHub Actions".
 * @returns {StatusDocument} The new document.
 */
function applyResults(
  previous: StatusDocument | undefined,
  config: StatusConfig,
  results: readonly CheckResult[],
  now: number,
  checkedFrom: string,
): StatusDocument {
  const targets: Record<string, TargetRecord> = {}

  for (const target of config.targets) {
    const record = previous?.targets[target.id] ?? createRecord(target)
    const result = results.find(entry => entry.targetId === target.id)

    targets[target.id] = result
      ? recordCheck(record, target, result, now)
      : { ...record, label: target.label, group: target.group }
  }

  return {
    updatedAt: now,
    intervalMinutes: config.intervalMinutes,
    checkedFrom,
    targets,
    incidents: updateIncidents(
      previous?.incidents ?? [],
      config.targets,
      results,
      now,
    ),
  }
}

export { applyResults }
