import { deriveOverallStatus } from '../derive-overall-status.ts'
import type { SourceStatus } from '../types.ts'
import { renderBanner } from './render-banner.ts'
import { renderBoard } from './render-board.ts'
import { renderIncidents } from './render-incidents.ts'
import { renderSourceSwitch } from './render-source-switch.ts'

/**
 * Draws the page for the selected source: the headline, the source switch
 * when there's more than one source, every target and the recent incidents.
 *
 * @param {readonly SourceStatus[]} statuses Every source, in order.
 * @param {number} selected The position of the source to show.
 * @param {readonly string[]} groupOrder The config's group order.
 * @param {number} now The current time.
 * @returns {HTMLElement[]} The page's sections, in order.
 */
function renderPage(
  statuses: readonly SourceStatus[],
  selected: number,
  groupOrder: readonly string[],
  now: number,
): HTMLElement[] {
  const status = statuses[selected] ?? statuses[0]

  if (!status) {
    return []
  }

  const sections = [renderBanner(status, deriveOverallStatus(status, now), now)]

  if (statuses.length > 1) {
    sections.push(renderSourceSwitch(statuses, statuses.indexOf(status), now))
  }

  if (status.document) {
    sections.push(
      renderBoard(status.document, groupOrder, now),
      renderIncidents(status.document.incidents, now),
    )
  }

  return sections
}

export { renderPage }
