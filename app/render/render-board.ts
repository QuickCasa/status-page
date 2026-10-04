import type { StatusDocument, TargetStatus } from '../../shared/types.ts'
import { formatUptime } from '../format.ts'
import { orderGroups } from '../order-groups.ts'
import { summariseTarget } from '../summarise-target.ts'
import type { TargetSummary } from '../types.ts'
import { createElement } from './create-element.ts'
import { renderDayBar } from './render-day-bar.ts'

const STATUS_WORDS: Readonly<Record<TargetStatus, string>> = {
  operational: 'Operational',
  degraded: 'Slow',
  down: 'Down',
}

/**
 * Draws one target's row: its name and state, its 90 day bar and its uptime.
 *
 * @param {TargetSummary} summary The target's days and totals.
 * @returns {HTMLElement} The row.
 */
function renderRow(summary: TargetSummary): HTMLElement {
  const { record } = summary
  const row = createElement('li', `row row--${record.status}`)
  const head = createElement('div', 'row__head')
  const state = createElement('span', 'row__state')
  const dot = createElement('span', `status-dot status-dot--${record.status}`)

  dot.setAttribute('aria-hidden', 'true')
  state.append(dot, STATUS_WORDS[record.status])

  if (record.status === 'down' && record.lastError !== '') {
    state.append(createElement('span', 'row__error', record.lastError))
  }

  head.append(createElement('span', 'row__label', record.label), state)
  row.append(
    head,
    renderDayBar(summary),
    createElement('span', 'row__uptime', formatUptime(summary.uptimePercent)),
  )

  return row
}

/**
 * Draws every target, in groups, in the config's group order.
 *
 * @param {StatusDocument} statusDocument The status document.
 * @param {readonly string[]} groupOrder The config's group order.
 * @param {number} now The current time.
 * @returns {HTMLElement} The board.
 */
function renderBoard(
  statusDocument: StatusDocument,
  groupOrder: readonly string[],
  now: number,
): HTMLElement {
  const board = createElement('div', 'board')
  const legend = createElement('div', 'board__legend')
  const range = createElement('span', 'board__range')
  const summaries = Object.values(statusDocument.targets).map(record =>
    summariseTarget(record, now),
  )
  const groups = orderGroups(
    summaries.map(summary => summary.record.group || 'Services'),
    groupOrder,
  )

  legend.setAttribute('aria-hidden', 'true')
  range.append(
    createElement('span', '', '90 days ago'),
    createElement('span', '', 'Today'),
  )
  legend.append(createElement('span'), range, createElement('span'))
  board.append(legend)

  for (const group of groups) {
    const section = createElement('section', 'group')
    const rows = createElement('ul', 'group__rows')

    rows.append(
      ...summaries
        .filter(summary => (summary.record.group || 'Services') === group)
        .map(summary => renderRow(summary)),
    )
    section.append(createElement('h2', 'group__title', group), rows)
    board.append(section)
  }

  return board
}

export { renderBoard }
