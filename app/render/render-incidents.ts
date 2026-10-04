import {
  INCIDENT_WINDOW_DAYS,
  MILLISECONDS_PER_DAY,
} from '../../shared/constants.ts'
import type { Incident } from '../../shared/types.ts'
import { formatDay, formatDuration, formatTime } from '../format.ts'
import { createElement } from './create-element.ts'

/**
 * Describes when an incident happened and how long it lasted.
 *
 * @param {Incident} incident The incident.
 * @param {number} now The current time.
 * @returns {string} Such as "14:05 to 14:35 UTC (30 min)".
 */
function describeWindow(incident: Incident, now: number): string {
  const open = incident.endedAt === 0
  const duration = formatDuration(
    (open ? now : incident.endedAt) - incident.startedAt,
  )

  return open
    ? `Since ${formatTime(incident.startedAt)} UTC, ongoing (${duration})`
    : `${formatTime(incident.startedAt)} to ${formatTime(incident.endedAt)} UTC (${duration})`
}

/**
 * Draws one incident.
 *
 * @param {Incident} incident The incident.
 * @param {number} now The current time.
 * @returns {HTMLElement} The list item.
 */
function renderIncident(incident: Incident, now: number): HTMLElement {
  const open = incident.endedAt === 0
  const item = createElement(
    'li',
    open ? 'incident incident--open' : 'incident',
  )

  item.append(
    createElement('span', 'incident__date', formatDay(incident.startedAt)),
    createElement('span', 'incident__target', incident.targetLabel),
    createElement('span', 'incident__window', describeWindow(incident, now)),
  )

  if (incident.error !== '') {
    item.append(createElement('span', 'incident__cause', incident.error))
  }

  return item
}

/**
 * Draws the incidents from the last 30 days, and any still going on, newest
 * first.
 *
 * @param {readonly Incident[]} incidents The document's incidents.
 * @param {number} now The current time.
 * @returns {HTMLElement} The section.
 */
function renderIncidents(
  incidents: readonly Incident[],
  now: number,
): HTMLElement {
  const section = createElement('section', 'incidents')
  const cutoff = now - INCIDENT_WINDOW_DAYS * MILLISECONDS_PER_DAY
  const recent = incidents
    .filter(incident => incident.endedAt === 0 || incident.startedAt >= cutoff)
    .toSorted((first, second) => second.startedAt - first.startedAt)
  const days = String(INCIDENT_WINDOW_DAYS)

  section.append(
    createElement('h2', 'group__title', `Incidents in the last ${days} days`),
  )

  if (recent.length === 0) {
    section.append(
      createElement(
        'p',
        'incidents__empty',
        `No incidents in the last ${days} days.`,
      ),
    )
    return section
  }

  const list = createElement('ul', 'incidents__list')
  list.append(...recent.map(incident => renderIncident(incident, now)))
  section.append(list)

  return section
}

export { renderIncidents }
