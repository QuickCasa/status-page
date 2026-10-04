import type { CheckResult } from '../shared/types.ts'

/**
 * Describes one check as a line for the workflow log.
 *
 * @param {string} label The target's label.
 * @param {CheckResult} result The check.
 * @returns {string} Such as "up    Website: HTTP 200 in 182 ms".
 */
function describeResult(label: string, result: CheckResult): string {
  const timing = `${String(result.latencyMilliseconds)} ms`

  if (!result.up) {
    return `DOWN  ${label}: ${result.error} after ${timing}`
  }

  const state = result.slow ? 'slow' : 'up'
  return `${state.padEnd(6)}${label}: HTTP ${String(result.statusCode)} in ${timing}`
}

export { describeResult }
