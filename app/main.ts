import './styles.css'
import { DOCUMENT_FILE } from '../shared/constants.ts'
import type { SourceConfig } from '../shared/types.ts'
import { REFRESH_MILLISECONDS, SOURCE_STORAGE_KEY } from './constants.ts'
import { loadSource } from './load-source.ts'
import { renderPage } from './render/render-page.ts'
import { setUpTooltip } from './tooltip.ts'
import type { SourceStatus } from './types.ts'

const config = __PAGE_CONFIG__
const sources: SourceConfig[] =
  config.sources.length > 0
    ? config.sources
    : [{ label: config.title, url: DOCUMENT_FILE, format: 'json' }]
const root = document.querySelector<HTMLElement>('#status')
const tooltip = document.querySelector<HTMLElement>('#tooltip')

let statuses: SourceStatus[] = []
let renders = 0

/**
 * The source tab shown first, remembered in this browser. The page works the
 * same when storage is blocked.
 *
 * @returns {number} The source's position.
 */
function readSelected(): number {
  try {
    const saved = Number(localStorage.getItem(SOURCE_STORAGE_KEY))
    return Number.isSafeInteger(saved) && saved >= 0 && saved < sources.length
      ? saved
      : 0
  } catch {
    return 0
  }
}

let selected = readSelected()

/**
 * Draws the page. The days only animate in on the first draw, not on every
 * refresh.
 */
function render(): void {
  if (!root) {
    return
  }

  root.replaceChildren(
    ...renderPage(statuses, selected, config.groups, Date.now()),
  )
  renders += 1
  root.classList.toggle('page--refreshed', renders > 1)
}

/**
 * Loads every source again and redraws. On the dev server, ?sample shows
 * made-up data instead, to look at the layout before anything is published.
 *
 * @returns {Promise<void>} Resolves once the page is redrawn.
 */
async function refresh(): Promise<void> {
  if (import.meta.env.DEV && location.search.includes('sample')) {
    const { buildSampleStatuses } =
      await import('./dev/build-sample-statuses.ts')
    statuses = buildSampleStatuses(sources, Date.now())
  } else {
    statuses = await Promise.all(
      sources.map(source => loadSource(source, document.baseURI)),
    )
  }

  render()
}

if (root && tooltip) {
  setUpTooltip(root, tooltip)

  root.addEventListener('click', clickEvent => {
    const button =
      clickEvent.target instanceof Element
        ? clickEvent.target.closest<HTMLElement>('[data-source-index]')
        : null

    if (!button) {
      return
    }

    selected = Number(button.dataset.sourceIndex)

    try {
      localStorage.setItem(SOURCE_STORAGE_KEY, String(selected))
    } catch {
      // Remembering the tab is only a convenience.
    }

    render()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void refresh()
    }
  })

  setInterval(() => {
    void refresh()
  }, REFRESH_MILLISECONDS)

  void refresh()
}
