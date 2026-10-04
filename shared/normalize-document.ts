import { asObject, readNumber, readString } from './read-json.ts'
import type {
  DayBucket,
  Incident,
  JsonObject,
  JsonValue,
  StatusDocument,
  TargetRecord,
  TargetStatus,
} from './types.ts'

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/u

/**
 * Reads a target's status. Anything unrecognised counts as operational,
 * because the page shouldn't invent an outage from a typo.
 *
 * @param {JsonObject} source The saved target.
 * @returns {TargetStatus} The status.
 */
function readStatus(source: JsonObject): TargetStatus {
  const value = readString(source, 'status')
  return value === 'degraded' || value === 'down' ? value : 'operational'
}

/**
 * Reads a target's daily buckets, keeping only days with a valid key.
 *
 * @param {JsonValue | undefined} value The saved days.
 * @returns {Record<string, DayBucket>} The buckets, by day.
 */
function readDays(value: JsonValue | undefined): Record<string, DayBucket> {
  const days: Record<string, DayBucket> = {}

  const saved = Object.entries(asObject(value) ?? {})

  for (const [key, entry] of saved) {
    const bucket = asObject(entry)

    if (!bucket || !DAY_KEY.test(key)) {
      continue
    }

    days[key] = {
      checks: readNumber(bucket, 'checks'),
      failures: readNumber(bucket, 'failures'),
      latencyTotalMilliseconds: readNumber(bucket, 'latencyTotalMilliseconds'),
      latencyMaxMilliseconds: readNumber(bucket, 'latencyMaxMilliseconds'),
    }
  }

  return days
}

/**
 * Reads one target.
 *
 * @param {string} key The target's key in the document.
 * @param {JsonObject} source The saved target.
 * @returns {TargetRecord} The target.
 */
function readTarget(key: string, source: JsonObject): TargetRecord {
  return {
    id: readString(source, 'id') || key,
    label: readString(source, 'label') || key,
    group: readString(source, 'group'),
    status: readStatus(source),
    lastCheckedAt: readNumber(source, 'lastCheckedAt'),
    lastLatencyMilliseconds: readNumber(source, 'lastLatencyMilliseconds'),
    lastStatusCode: readNumber(source, 'lastStatusCode'),
    lastError: readString(source, 'lastError'),
    consecutiveFailures: readNumber(source, 'consecutiveFailures'),
    days: readDays(source.days),
  }
}

/**
 * Reads one incident.
 *
 * @param {JsonObject} source The saved incident.
 * @returns {Incident} The incident.
 */
function readIncident(source: JsonObject): Incident {
  return {
    id: readString(source, 'id'),
    targetId: readString(source, 'targetId'),
    targetLabel: readString(source, 'targetLabel'),
    startedAt: readNumber(source, 'startedAt'),
    endedAt: readNumber(source, 'endedAt'),
    statusCode: readNumber(source, 'statusCode'),
    error: readString(source, 'error'),
  }
}

/**
 * Reads a status document, filling anything missing or mistyped with an
 * empty value instead of failing. The page would rather show a target with no
 * history than nothing at all because one field drifted. Extra fields, such
 * as those a different monitor writes, are ignored.
 *
 * @param {JsonValue | undefined} value The parsed document.
 * @returns {StatusDocument | undefined} The document, or undefined when it has no targets map at all.
 */
function normalizeDocument(
  value: JsonValue | undefined,
): StatusDocument | undefined {
  const source = asObject(value)
  const targets = asObject(source?.targets)

  if (!source || !targets) {
    return undefined
  }

  const records: Record<string, TargetRecord> = {}

  for (const [key, saved] of Object.entries(targets)) {
    const target = asObject(saved)

    if (target) {
      records[key] = readTarget(key, target)
    }
  }

  const incidents = Array.isArray(source.incidents)
    ? source.incidents
        .map(saved => asObject(saved))
        .filter(saved => saved !== undefined)
        .map(saved => readIncident(saved))
    : []

  return {
    updatedAt: readNumber(source, 'updatedAt'),
    intervalMinutes: readNumber(source, 'intervalMinutes'),
    checkedFrom: readString(source, 'checkedFrom'),
    targets: records,
    incidents,
  }
}

export { normalizeDocument }
