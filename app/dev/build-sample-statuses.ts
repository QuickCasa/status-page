import { HISTORY_DAYS, MILLISECONDS_PER_DAY } from '../../shared/constants.ts'
import { toDayKey } from '../../shared/to-day-key.ts'
import type {
  DayBucket,
  SourceConfig,
  StatusDocument,
  TargetRecord,
} from '../../shared/types.ts'
import type { SourceStatus } from '../types.ts'

/**
 * Made-up targets for looking at the layout on the dev server. This file is
 * only loaded with ?sample in development, and never reaches the built page.
 */
const SAMPLE_TARGETS = [
  { id: 'website', label: 'Website', group: 'Public', latency: 180 },
  { id: 'api', label: 'API', group: 'Public', latency: 95 },
  { id: 'dashboard', label: 'Dashboard', group: 'Customers', latency: 420 },
  { id: 'webhooks', label: 'Webhooks', group: 'Customers', latency: 60 },
] as const

/**
 * A repeatable pseudo-random number generator, so the sample looks the same
 * on every reload.
 *
 * @param {number} seed The starting value.
 * @returns {() => number} A function returning numbers from 0 to 1.
 */
function createRandom(seed: number): () => number {
  let state = seed

  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648
    return state / 2_147_483_648
  }
}

/**
 * Builds 90 days of made-up history for one target, with the odd bad day.
 *
 * @param {(typeof SAMPLE_TARGETS)[number]} target The sample target.
 * @param {() => number} random The random number generator.
 * @param {number} now The current time.
 * @returns {Record<string, DayBucket>} The days.
 */
function buildDays(
  target: (typeof SAMPLE_TARGETS)[number],
  random: () => number,
  now: number,
): Record<string, DayBucket> {
  const days: Record<string, DayBucket> = {}

  for (let offset = 0; offset < HISTORY_DAYS; offset += 1) {
    const checks = 288
    const roll = random()
    let failures = 0

    if (roll > 0.97) {
      failures = 1 + Math.floor(random() * 30)
    } else if (roll > 0.9) {
      failures = 1
    }

    const average = Math.round(target.latency * (0.7 + random() * 0.8))

    days[toDayKey(now - offset * MILLISECONDS_PER_DAY)] = {
      checks,
      failures,
      latencyTotalMilliseconds: average * checks,
      latencyMaxMilliseconds: average * 4,
    }
  }

  return days
}

/**
 * Builds a sample status for each source, for the dev server's ?sample view.
 *
 * @param {readonly SourceConfig[]} sources The page's sources.
 * @param {number} now The current time.
 * @returns {SourceStatus[]} The sample statuses.
 */
function buildSampleStatuses(
  sources: readonly SourceConfig[],
  now: number,
): SourceStatus[] {
  return sources.map((source, index) => {
    const random = createRandom(index + 7)
    const targets: Record<string, TargetRecord> = {}

    for (const target of SAMPLE_TARGETS) {
      const down = index === 0 && target.id === 'webhooks'

      targets[target.id] = {
        id: target.id,
        label: target.label,
        group: target.group,
        status: down ? 'down' : 'operational',
        lastCheckedAt: now - 60_000,
        lastLatencyMilliseconds: target.latency,
        lastStatusCode: down ? 503 : 200,
        lastError: down ? 'HTTP 503' : '',
        consecutiveFailures: down ? 3 : 0,
        days: buildDays(target, random, now),
      }
    }

    const statusDocument: StatusDocument = {
      updatedAt: now - 60_000,
      intervalMinutes: 5,
      checkedFrom: 'GitHub Actions',
      targets,
      incidents: [
        {
          id: 'webhooks-sample',
          targetId: 'webhooks',
          targetLabel: 'Webhooks',
          startedAt: now - 14 * 60_000,
          endedAt: index === 0 ? 0 : now - 4 * 60_000,
          statusCode: 503,
          error: 'HTTP 503',
        },
        {
          id: 'api-sample',
          targetId: 'api',
          targetLabel: 'API',
          startedAt: now - 3 * MILLISECONDS_PER_DAY,
          endedAt: now - 3 * MILLISECONDS_PER_DAY + 25 * 60_000,
          statusCode: 0,
          error: 'No response within 10 seconds',
        },
      ],
    }

    return { source, state: 'loaded', document: statusDocument }
  })
}

export { buildSampleStatuses }
