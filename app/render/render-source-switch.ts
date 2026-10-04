import { deriveOverallStatus } from '../derive-overall-status.ts'
import type { OverallStatus, SourceStatus } from '../types.ts'
import { createElement } from './create-element.ts'

const STATE_WORDS: Readonly<Record<OverallStatus, string>> = {
  operational: 'operational',
  degraded: 'slow',
  down: 'down',
  stale: 'delayed',
  unknown: 'no status yet',
}

/**
 * Draws a switch between sources, such as regions. Each button carries its
 * own source's state, so a problem elsewhere is visible without switching.
 *
 * @param {readonly SourceStatus[]} statuses Every source, in order.
 * @param {number} selected The position of the source on screen.
 * @param {number} now The current time.
 * @returns {HTMLElement} The switch.
 */
function renderSourceSwitch(
  statuses: readonly SourceStatus[],
  selected: number,
  now: number,
): HTMLElement {
  const group = createElement('div', 'sources')

  group.setAttribute('role', 'group')
  group.setAttribute('aria-label', 'Show the status for')

  for (const [index, status] of statuses.entries()) {
    const overall = deriveOverallStatus(status, now)
    const button = createElement('button', 'sources__option')
    const dot = createElement('span', `status-dot status-dot--${overall}`)

    button.type = 'button'
    button.dataset.sourceIndex = String(index)
    button.setAttribute('aria-pressed', String(index === selected))
    dot.setAttribute('aria-hidden', 'true')
    button.append(
      dot,
      createElement('span', '', status.source.label),
      createElement('span', 'visually-hidden', `, ${STATE_WORDS[overall]}`),
    )
    group.append(button)
  }

  return group
}

export { renderSourceSwitch }
