/**
 * How often the page reloads the status while it's open.
 */
const REFRESH_MILLISECONDS = 60_000

/**
 * A source counts as stale once this many check intervals pass with no new
 * check. Scheduled GitHub workflows often start late, so the margin is wide.
 */
const STALE_AFTER_INTERVALS = 6

/**
 * Never call a source stale sooner than this, whatever its interval.
 */
const MINIMUM_STALE_MILLISECONDS = 30 * 60 * 1000

/**
 * Remembers the source tab someone picked, in their browser only.
 */
const SOURCE_STORAGE_KEY = 'status-page-source'

export {
  MINIMUM_STALE_MILLISECONDS,
  REFRESH_MILLISECONDS,
  SOURCE_STORAGE_KEY,
  STALE_AFTER_INTERVALS,
}
