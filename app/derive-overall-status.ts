import {
  MINIMUM_STALE_MILLISECONDS,
  STALE_AFTER_INTERVALS,
} from './constants.ts'
import type { OverallStatus, SourceStatus } from './types.ts'

/**
 * How long a source can go without a check before it counts as stale.
 *
 * @param {number} intervalMinutes How often its checks run, or 0 when it doesn't say.
 * @returns {number} The limit, in milliseconds.
 */
function staleAfter(intervalMinutes: number): number {
  return Math.max(
    MINIMUM_STALE_MILLISECONDS,
    intervalMinutes * 60_000 * STALE_AFTER_INTERVALS,
  )
}

/**
 * Folds a source down to one headline. A source whose last check is too old
 * counts as stale rather than operational, because a monitor that stopped
 * reporting can't vouch for anything.
 *
 * @param {SourceStatus} status The loaded source.
 * @param {number} now The current time.
 * @returns {OverallStatus} The headline state.
 */
function deriveOverallStatus(status: SourceStatus, now: number): OverallStatus {
  const targets = Object.values(status.document?.targets ?? {})

  if (!status.document || targets.length === 0) {
    return 'unknown'
  }

  if (
    now - status.document.updatedAt >
    staleAfter(status.document.intervalMinutes)
  ) {
    return 'stale'
  }

  if (targets.some(target => target.status === 'down')) {
    return 'down'
  }

  if (targets.some(target => target.status === 'degraded')) {
    return 'degraded'
  }

  return 'operational'
}

export { deriveOverallStatus }
