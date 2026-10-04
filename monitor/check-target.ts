import type { CheckResult, TargetConfig } from '../shared/types.ts'
import { describeFetchError } from './describe-fetch-error.ts'

const RETRY_DELAY_MILLISECONDS = 2000
const USER_AGENT =
  'status-page monitor (+https://github.com/QuickCasa/status-page)'

/**
 * Checks a target once: requests it, times the answer, and compares the
 * status code and, when asked, the body text with what the config expects.
 *
 * @param {TargetConfig} target The target.
 * @param {typeof fetch} fetchFunction The fetch to use, replaceable in tests.
 * @returns {Promise<CheckResult>} The outcome.
 */
async function checkOnce(
  target: TargetConfig,
  fetchFunction: typeof fetch,
): Promise<CheckResult> {
  const started = performance.now()
  const result: CheckResult = {
    targetId: target.id,
    up: false,
    slow: false,
    latencyMilliseconds: 0,
    statusCode: 0,
    error: '',
  }

  try {
    const response = await fetchFunction(target.url, {
      method: target.method,
      redirect: 'follow',
      headers: { 'user-agent': USER_AGENT, 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(target.timeoutMilliseconds),
    })
    const expected =
      target.expectedStatus.length === 0
        ? response.status >= 200 && response.status < 400
        : target.expectedStatus.includes(response.status)

    result.statusCode = response.status

    if (!expected) {
      result.error = `HTTP ${String(response.status)}`
      await response.body?.cancel()
    } else if (target.contains === '') {
      await response.body?.cancel()
    } else {
      const body = await response.text()

      if (!body.includes(target.contains)) {
        result.error = 'The expected text was missing from the response'
      }
    }

    result.up = result.error === ''
  } catch (error) {
    result.error = describeFetchError(
      error instanceof Error ? error : undefined,
      target.timeoutMilliseconds,
    )
  }

  result.latencyMilliseconds = Math.round(performance.now() - started)
  result.slow =
    result.up && result.latencyMilliseconds > target.slowAfterMilliseconds

  return result
}

/**
 * Checks a target, and checks it once more after a short pause if the first
 * try fails, so one dropped connection on the runner's network doesn't count
 * as an outage.
 *
 * @param {TargetConfig} target The target.
 * @param {typeof fetch} fetchFunction The fetch to use, replaceable in tests.
 * @param {number} retryDelay How long to wait before the second try.
 * @returns {Promise<CheckResult>} The outcome.
 */
async function checkTarget(
  target: TargetConfig,
  fetchFunction: typeof fetch = fetch,
  retryDelay = RETRY_DELAY_MILLISECONDS,
): Promise<CheckResult> {
  const first = await checkOnce(target, fetchFunction)

  if (first.up) {
    return first
  }

  await new Promise(resolve => {
    setTimeout(resolve, retryDelay)
  })

  return checkOnce(target, fetchFunction)
}

export { checkTarget }
