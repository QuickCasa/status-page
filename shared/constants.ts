/**
 * How many days of history the document keeps and the page draws.
 */
const HISTORY_DAYS = 90

/**
 * How many days of incidents the page lists.
 */
const INCIDENT_WINDOW_DAYS = 30

/**
 * The most incidents a document keeps, so a target that flaps for months
 * can't grow the file without limit.
 */
const MAX_INCIDENTS = 500

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * The file the monitor writes and the page reads, next to the page.
 */
const DOCUMENT_FILE = 'status.json'

/**
 * Defaults for each target in status.config.json.
 */
const TARGET_DEFAULTS = {
  timeoutMilliseconds: 10_000,
  slowAfterMilliseconds: 3000,
} as const

/**
 * How often the monitor runs. It has to match the schedule in
 * .github/workflows/status.yml, and GitHub can't run one more often.
 */
const DEFAULT_INTERVAL_MINUTES = 5

export {
  DEFAULT_INTERVAL_MINUTES,
  DOCUMENT_FILE,
  HISTORY_DAYS,
  INCIDENT_WINDOW_DAYS,
  MAX_INCIDENTS,
  MILLISECONDS_PER_DAY,
  TARGET_DEFAULTS,
}
