import { formatDayKey, formatUptime } from '../format.ts'
import type { DaySummary, TargetSummary } from '../types.ts'
import { createElement } from './create-element.ts'

/**
 * The shortest a day with checks is drawn, as a share of the bar's height,
 * so a fast day still reads as a day and not a gap.
 */
const MINIMUM_HEIGHT = 0.28

/**
 * Which colour a day gets: green with no failures, amber when it was up at
 * least 99% of the time, red below that, and grey with no checks.
 *
 * @param {DaySummary} day The day.
 * @returns {string} The tone's class name.
 */
function toneOf(day: DaySummary): string {
  if (day.checks === 0) {
    return 'empty'
  }

  if (day.failures === 0) {
    return 'ok'
  }

  return day.uptimePercent >= 99 ? 'blip' : 'bad'
}

/**
 * Describes a day for its tooltip.
 *
 * @param {DaySummary} day The day.
 * @returns {string} Such as "Oct 4, 2026: 100% uptime. 288 checks, 0 failed. Average response 182 ms, slowest 950 ms."
 */
function describeDay(day: DaySummary): string {
  const date = formatDayKey(day.key)

  if (day.checks === 0) {
    return `${date}: no checks`
  }

  return `${date}: ${formatUptime(day.uptimePercent)} uptime. ${String(day.checks)} checks, ${String(day.failures)} failed. Average response ${String(day.latencyAverageMilliseconds)} ms, slowest ${String(day.latencyMaxMilliseconds)} ms.`
}

/**
 * Draws a target's 90 day bar. Each tick is a day: its colour is that day's
 * uptime, and its height is that day's average response time against the
 * slowest day on the bar, so a spike is a slow day even when nothing failed.
 *
 * @param {TargetSummary} summary The target's days and totals.
 * @returns {HTMLElement} The bar.
 */
function renderDayBar(summary: TargetSummary): HTMLElement {
  const bar = createElement('div', 'bar')
  const ceiling = Math.max(1, summary.latencyCeilingMilliseconds)

  bar.setAttribute('role', 'img')
  bar.setAttribute(
    'aria-label',
    `${formatUptime(summary.uptimePercent)} uptime over the last 90 days`,
  )

  for (const [index, day] of summary.days.entries()) {
    const tick = createElement('i', `tick tick--${toneOf(day)}`)
    const share =
      day.checks === 0
        ? 0
        : MINIMUM_HEIGHT +
          (1 - MINIMUM_HEIGHT) * (day.latencyAverageMilliseconds / ceiling)

    tick.dataset.tip = describeDay(day)
    tick.style.setProperty('--index', String(index))
    tick.style.setProperty(
      '--height',
      `${String(Math.round(share * 1000) / 10)}%`,
    )
    bar.append(tick)
  }

  return bar
}

export { renderDayBar }
