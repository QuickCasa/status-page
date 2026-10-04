const DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

const TIME_FORMAT = new Intl.DateTimeFormat('en-CA', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
})

/**
 * Formats an uptime percentage without ever rounding a real failure away:
 * 99.999 stays 99.99, because a page that says 100% beside an incident is a
 * page nobody trusts.
 *
 * @param {number} percent The uptime percentage.
 * @returns {string} Such as "100%" or "99.97%".
 */
function formatUptime(percent: number): string {
  if (percent >= 100) {
    return '100%'
  }

  return `${(Math.floor(percent * 100) / 100).toFixed(2)}%`
}

/**
 * Describes how long ago something happened, in the plainest words that fit.
 *
 * @param {number} timestamp The moment.
 * @param {number} now The current time.
 * @returns {string} Such as "just now", "4 minutes ago" or "2 hours ago".
 */
function formatRelativeTime(timestamp: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000))

  if (seconds < 45) {
    return 'just now'
  }

  const minutes = Math.round(seconds / 60)

  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${String(minutes)} minutes ago`
  }

  const hours = Math.round(minutes / 60)

  if (hours < 48) {
    return hours === 1 ? '1 hour ago' : `${String(hours)} hours ago`
  }

  return `${String(Math.round(hours / 24))} days ago`
}

/**
 * Formats the date of a moment, in UTC like the daily bars, so a day on a bar
 * and a date in the incident list never disagree.
 *
 * @param {number} timestamp The moment.
 * @returns {string} Such as "Oct 4, 2026".
 */
function formatDay(timestamp: number): string {
  return DATE_FORMAT.format(timestamp)
}

/**
 * Formats the time of a moment, in UTC.
 *
 * @param {number} timestamp The moment.
 * @returns {string} Such as "14:05".
 */
function formatTime(timestamp: number): string {
  return TIME_FORMAT.format(timestamp)
}

/**
 * Formats a day key from a bar.
 *
 * @param {string} key The day, as YYYY-MM-DD.
 * @returns {string} Such as "Oct 4, 2026".
 */
function formatDayKey(key: string): string {
  return formatDay(Date.parse(`${key}T00:00:00Z`))
}

/**
 * Describes a length of time in minutes and hours.
 *
 * @param {number} milliseconds The length.
 * @returns {string} Such as "15 min" or "2 h 10 min".
 */
function formatDuration(milliseconds: number): string {
  const minutes = Math.max(1, Math.round(milliseconds / 60_000))

  if (minutes < 60) {
    return `${String(minutes)} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60

  return remainder === 0
    ? `${String(hours)} h`
    : `${String(hours)} h ${String(remainder)} min`
}

export {
  formatDay,
  formatDayKey,
  formatDuration,
  formatRelativeTime,
  formatTime,
  formatUptime,
}
